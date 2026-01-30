
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export const SavingsController = {
    getPotentialSavings: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const window = req.query.window as string || '30d';

            // 1. Date Range
            const startDate = new Date();
            if (window === '30d') startDate.setDate(startDate.getDate() - 30);
            else if (window === '90d') startDate.setDate(startDate.getDate() - 90);
            else startDate.setDate(startDate.getDate() - 365); // Default 1y

            // 2. Fetch Data
            const [txns, rules, allCards] = await req.db.prisma.$transaction([
                req.db.prisma.transaction.findMany({
                    where: { user_id: userId, date: { gte: startDate }, amount: { gt: 0 } },
                    include: { card_used: true }
                }),
                req.db.prisma.cardRewardRule.findMany({
                    where: { card: { user_id: userId } },
                    include: { card: true }
                }),
                req.db.prisma.card.findMany({ where: { user_id: userId } })
            ]);

            // 3. Pre-process Rules (Best card per category)
            // Map: "dining" -> { card: Card, multiplier: 3 }
            const bestCardMap = new Map<string, { card: any, multiplier: number }>();

            // A. Base Rates
            const defaultBest = allCards.sort((a, b) => Number(b.base_multiplier) - Number(a.base_multiplier))[0];
            const defaultRate = defaultBest ? Number(defaultBest.base_multiplier) : 1;

            // B. Category Rules
            rules.forEach(r => {
                const catKey = r.category.toLowerCase().trim();
                const mult = Number(r.multiplier);
                const currentBest = bestCardMap.get(catKey)?.multiplier || 0;

                if (mult > currentBest) {
                    bestCardMap.set(catKey, { card: r.card, multiplier: mult });
                }
            });

            // 4. Calculate Delta
            let totalPotential = 0;
            const opportunities = new Map<string, { extra: number, recommended: any, sample: string[] }>();

            txns.forEach(t => {
                const cat = (t.category || 'Uncategorized').toLowerCase();
                const amount = Number(t.amount);

                // Actual Earned
                // If estimated_points_earned is set, use it. Else roughly 1x.
                const actualPoints = t.estimated_points_earned || amount;

                // Best Possible
                let bestRate = defaultRate;
                let bestCard = defaultBest;

                // Check specific category rule
                // We do a loose includes check for robustness e.g. "dining" matches "food & dining"
                let matched = false;
                for (const [key, val] of bestCardMap.entries()) {
                    if (cat.includes(key)) {
                        bestRate = val.multiplier;
                        bestCard = val.card;
                        matched = true;
                        break;
                    }
                }

                // Calc potential
                const potentialPoints = amount * bestRate;
                const delta = Math.max(0, potentialPoints - actualPoints);
                const deltaDollars = (delta / 100); // Assuming 1cpp for generic value

                if (delta > 0 && bestCard?.id !== t.card_used_id) {
                    totalPotential += deltaDollars;

                    const oppKey = cat; // Group by category
                    const existing = opportunities.get(oppKey) || { extra: 0, recommended: bestCard, sample: [] };

                    existing.extra += deltaDollars;
                    if (existing.sample.length < 2 && !existing.sample.includes(t.merchant_name)) {
                        existing.sample.push(t.merchant_name);
                    }
                    opportunities.set(oppKey, existing);
                }
            });

            // 5. Format Output
            const top_opportunities = Array.from(opportunities.entries())
                .map(([cat, data]) => ({
                    category: cat.charAt(0).toUpperCase() + cat.slice(1),
                    recommended_card: {
                        id: data.recommended.id,
                        name: data.recommended.nickname || data.recommended.issuer,
                        issuer: data.recommended.issuer
                    },
                    extra_value: Number(data.extra.toFixed(2)),
                    explanation: `Use ${data.recommended.nickname} for ${data.sample.join(', ')}`,
                    sample_merchants: data.sample
                }))
                .sort((a, b) => b.extra_value - a.extra_value)
                .slice(0, 3); // Top 3

            res.json({
                window,
                total_potential_savings: Number(totalPotential.toFixed(2)),
                top_opportunities
            });

        } catch (error) {
            console.error("Savings Error:", error);
            res.status(500).json({ error: 'Failed to calc savings' });
        }
    }
};
