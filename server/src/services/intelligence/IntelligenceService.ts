import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

export class IntelligenceService {

    static async analyzeTransactions(userId: string) {
        logger.info(`Running Intelligence Analysis for user ${userId}`);

        // 1. Fetch un-analyzed transactions (last 30 days)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const transactions = await prisma.transaction.findMany({
            where: {
                account: { connection: { userId } },
                date: { gte: startDate },
                potentialExtraValue: null
            },
            include: {
                account: true,  // To know which account (=> implies checking which card if we link Account to Card? No, Account is from Plaid. We need to map Plaid Account -> Our Card)
            }
        });

        if (transactions.length === 0) return { analyzed: 0 };

        // 2. Fetch User's Cards with Rewards
        const userCards = await prisma.card.findMany({
            where: { userId },
            include: { rewards: true }
        });

        if (userCards.length === 0) {
            logger.info(`User ${userId} has no cards configured. Skipping.`);
            return { analyzed: 0, reason: "No Cards" };
        }

        let analyzedCount = 0;

        for (const tx of transactions) {
            // Simple Category Logic (Use tx.categoryId or merchantName map)
            // For MVP, if tx.categoryId is null, we stick to "Base" rewards.
            const categoryId = tx.categoryId;

            // Calculate Max Possible Value among user's cards
            let bestCard = null;
            let maxMultiplier = new Decimal(0);

            for (const card of userCards) {
                // Find specific rule or base rule (categoryId is null)
                const rule = card.rewards.find(r => r.categoryId === categoryId)
                    || card.rewards.find(r => r.categoryId === null); // Catch-all

                const multiplier = rule ? rule.multiplier : new Decimal(1.0); // Default 1x if no rule found

                if (multiplier.gt(maxMultiplier)) {
                    maxMultiplier = multiplier;
                    bestCard = card;
                }
            }

            // Identify "Actual" Card used
            // Need to map tx.account to a Card. 
            // For MVP, we likely don't know which "Card" entity corresponds to the Plaid Account unless user linked them.
            // If we can't link, we skip or assume "Actual" was 1.0x? 
            // Let's assume user manually maps Accounts <-> Cards later.
            // For now, if we can't map, we can't compute "Extra Value" accurately.
            // BUT logic: "Missed Opportunity" implies we know what they used.
            // Let's assume we store `recommendedCardId` and calc value based on (Max - 1.0) * Amount as a baseline if unknown?
            // Or better: Let's assume the used card earned 1x base points if unknown.

            let actualMultiplier = new Decimal(1.0);
            // TODO: Logic to match tx.account.mask/name to userCards.

            if (bestCard && maxMultiplier.gt(actualMultiplier)) {
                const diff = maxMultiplier.sub(actualMultiplier);
                const extraValue = diff.mul(tx.amount); // Points value. We can converting to $ later (e.g. 1pt = 1 cent)

                // Update Transaction
                await prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        recommendedCardId: bestCard.id,
                        potentialExtraValue: extraValue,
                        aiConfidence: 0.9
                    }
                });
            } else {
                // Mark analyzed even if no extra value
                await prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        potentialExtraValue: 0, // 0 means checked
                        aiConfidence: 1.0
                    }
                });
            }
            analyzedCount++;
        }

        return { analyzed: analyzedCount };
    }
}
