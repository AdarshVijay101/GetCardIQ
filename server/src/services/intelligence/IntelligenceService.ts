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
                user_id: userId,
                date: { gte: startDate },
                potential_extra_value: null
            }
            // include: { account: true } // Removed as Transaction doesn't have account relation
        });

        if (transactions.length === 0) return { analyzed: 0 };

        // 2. Fetch User's Cards with Rewards
        const userCards = await prisma.card.findMany({
            where: { user_id: userId },
            include: { rules: true }
        });

        if (userCards.length === 0) {
            logger.info(`User ${userId} has no cards configured. Skipping.`);
            return { analyzed: 0, reason: "No Cards" };
        }

        let analyzedCount = 0;

        for (const tx of transactions) {
            // Simple Category Logic (Use tx.category)
            const category = tx.category;

            // Calculate Max Possible Value among user's cards
            let bestCard: any = null;
            let maxMultiplier = new Decimal(0);

            for (const card of userCards) {
                // Find specific rule or base rule (category matches)
                const rule = card.rules.find(r => r.category === category)
                    || card.rules.find(r => r.category === 'Everything' || r.category === 'Base'); // Catch-all

                const multiplier = rule ? rule.multiplier : new Decimal(1.0); // Default 1x if no rule found

                if (multiplier.gt(maxMultiplier)) {
                    maxMultiplier = multiplier;
                    bestCard = card;
                }
            }

            // Identify "Actual" Card used
            let actualMultiplier = new Decimal(1.0);

            if (bestCard && maxMultiplier.gt(actualMultiplier)) {
                const diff = maxMultiplier.sub(actualMultiplier);
                const extraValue = diff.mul(tx.amount);

                // Update Transaction
                await prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        recommended_card_id: bestCard.id,
                        potential_extra_value: extraValue,
                        ai_confidence: new Decimal(0.9)
                    }
                });
            } else {
                // Mark analyzed even if no extra value
                await prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        potential_extra_value: 0,
                        ai_confidence: new Decimal(1.0)
                    }
                });
            }
            analyzedCount++;
        }

        return { analyzed: analyzedCount };
    }
}
