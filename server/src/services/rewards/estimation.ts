import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected

interface EstimateOpts {
    amountCents: number;
    category: string | null;
    baseMultiplier: number;
    rules: Array<{ category: string; multiplier: number }>;
}

export const RewardsEstimationService = {
    estimatePoints: (opts: EstimateOpts) => {
        const dollars = opts.amountCents / 100;
        const cat = (opts.category || 'other').toLowerCase();

        // 1. Find specific category rule
        // Basic match (exact) -> In real app, maybe use fuzzy match or sub-categories
        const rule = opts.rules.find(r => r.category.toLowerCase() === cat);

        const multiplier = rule ? rule.multiplier : opts.baseMultiplier;

        // 2. Calculate
        const points = Math.floor(dollars * multiplier);

        return { points, multiplierUsed: multiplier };
    },

    recomputeForUser: async (prisma: PrismaClient, userId: string) => {
        // Fetch ALL transactions for User (careful with scale, but fine for MVP)
        const txns = await prisma.transaction.findMany({
            where: { user_id: userId },
            select: { id: true }
        });
        const ids = txns.map(t => t.id);
        return await RewardsEstimationService.computeForTransactions(prisma, ids);
    },

    computeForTransactions: async (prisma: PrismaClient, txIds: string[]) => {
        if (txIds.length === 0) return 0;

        // 1. Fetch Transactions
        const txns = await prisma.transaction.findMany({
            where: { id: { in: txIds } },
            include: { card_used: { include: { rules: true } } }
        });

        let updatedCount = 0;

        for (const t of txns) {
            // Cannot estimate if we don't know which card was used
            if (!t.card_used_id || !t.card_used) continue;

            const cardUsed = t.card_used;
            // Fetch all user cards for comparison (Optimize: fetch once outside loop if all txns for same user)
            // But txns might be mixed users? Safe to fetch per user or group.
            // For now, let's just fetch all cards for this user.
            const allUserCards = await prisma.card.findMany({
                where: { user_id: t.user_id },
                include: { rules: true }
            });

            // 1. Calculate Actual
            const estActual = RewardsEstimationService.estimatePoints({
                amountCents: Math.round(Number(t.amount) * 100),
                category: t.category,
                baseMultiplier: Number(cardUsed.base_multiplier || 1.0),
                rules: cardUsed.rules.map(r => ({ category: r.category, multiplier: Number(r.multiplier) }))
            });
            const actualValueCents = Math.floor(estActual.points * Number(cardUsed.point_value_cents || 1.0));

            // 2. Calculate Best Possible
            let maxPoints = 0;
            let maxValueCents = 0;
            let bestCardId = null;

            for (const card of allUserCards) {
                const est = RewardsEstimationService.estimatePoints({
                    amountCents: Math.round(Number(t.amount) * 100),
                    category: t.category,
                    baseMultiplier: Number(card.base_multiplier || 1.0),
                    rules: card.rules.map(r => ({ category: r.category, multiplier: Number(r.multiplier) }))
                });
                const valCents = Math.floor(est.points * Number(card.point_value_cents || 1.0));

                if (valCents > maxValueCents) {
                    maxValueCents = valCents;
                    maxPoints = est.points;
                    bestCardId = card.id;
                }
            }

            // 3. Determine Missed Opportunity
            // Only flag if difference is significant (> 5 cents to avoid rounding noise)
            const diffCents = maxValueCents - actualValueCents;
            // SAFETY: Ensure non-negative
            const safeDiffCents = Math.max(0, diffCents);
            const potentialExtraValue = safeDiffCents > 5 ? (safeDiffCents / 100) : 0;
            const recommendedCardId = (safeDiffCents > 5 && bestCardId !== t.card_used_id) ? bestCardId : null;

            await prisma.transaction.update({
                where: { id: t.id },
                data: {
                    estimated_points_earned: estActual.points,
                    estimated_value_cents: actualValueCents,
                    potential_extra_value: potentialExtraValue,
                    recommended_card_id: recommendedCardId
                }
            });
            updatedCount++;
        }

        return updatedCount;
    }
};
