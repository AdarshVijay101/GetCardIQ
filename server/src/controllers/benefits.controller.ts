
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

// Hardcoded definitions for "Smart" recognition of credits until schema migration is fixed
// In production, these would be in `CardBenefit` table.
const KNOWN_BENEFITS: any = {
    'Amex Gold': [
        { name: 'Dining Credit', amount: 10, frequency: 'monthly', pattern: 'grubhub|seamless|cheesecake|shake shack' },
        { name: 'Uber Cash', amount: 10, frequency: 'monthly', pattern: 'uber|ubereats' }
    ],
    'Platinum': [
        { name: 'Digital Ent. Credit', amount: 20, frequency: 'monthly', pattern: 'disney|hulu|espn|peacock|nytimes' },
        { name: 'Uber Cash', amount: 15, frequency: 'monthly', pattern: 'uber|ubereats' }
    ],
    'Sapphire Reserve': [
        { name: 'Travel Credit', amount: 300, frequency: 'annual', pattern: 'airline|hotel|orbitz|expedia|airbnb' }
    ]
};

export class BenefitsController {

    // GET /api/benefits/status
    static async getBenefitStatus(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            // 1. Fetch User Cards
            const cards = await req.db.prisma.card.findMany({
                where: { user_id: userId }
            });

            const results = [];

            // 2. Iterate Cards and check known benefits
            for (const card of cards) {
                // Fuzzy match card name to known benefits
                const benefitKey = Object.keys(KNOWN_BENEFITS).find(k => card.nickname.includes(k) || card.issuer.includes(k));
                if (!benefitKey) continue;

                const benefits = KNOWN_BENEFITS[benefitKey];

                for (const ben of benefits) {
                    // 3. Query Transactions for Usage
                    const now = new Date();
                    let startDate = new Date();
                    if (ben.frequency === 'monthly') {
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of month
                    } else {
                        startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st
                    }

                    const txns = await req.db.prisma.transaction.findMany({
                        where: {
                            user_id: userId,
                            card_used_id: card.id,
                            date: { gte: startDate }
                        }
                    });

                    // filter by pattern
                    const matches = txns.filter((t: any) => {
                        const mName = t.merchant_name.toLowerCase();
                        return ben.pattern.split('|').some((p: string) => mName.includes(p));
                    });

                    const used = matches.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
                    const remaining = Math.max(0, ben.amount - used);

                    results.push({
                        card_id: card.id,
                        card_name: card.nickname,
                        benefit_name: ben.name,
                        total_limit: ben.amount,
                        used_amount: used,
                        remaining_amount: remaining,
                        frequency: ben.frequency,
                        status: remaining === 0 ? 'fully_used' : 'available',
                        expiring_soon: ben.frequency === 'monthly' && now.getDate() > 20 // Warning if > 20th of month
                    });
                }
            }

            res.json(results);
        } catch (error) {
            console.error('Benefits Status Error:', error);
            res.status(500).json({ error: 'Failed to fetch benefits' });
        }
    }

    // GET /api/benefits/missed
    // "Money Left Behind"
    static async getMissedRewards(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            // Fetch txns
            const txns = await req.db.prisma.transaction.findMany({
                where: { user_id: userId, amount: { gt: 0 } },
                orderBy: { date: 'desc' },
                take: 50
            });

            const missed: any[] = [];
            let totalMissedValue = 0;

            // Simple Logic: 
            // If we have recommended_card_id AND it differs from card_used_id
            // Calculate delta.
            // Note: We need the rates. For Audit MVP, we'll assume "Optimized" means 5% vs Actual 1%.

            // Fetch all cards to get rates
            const cards = await req.db.prisma.card.findMany({ where: { user_id: userId }, include: { rules: true } });

            for (const tx of txns) {
                if (!tx.card_used_id || !tx.recommended_card_id) continue;
                if (tx.card_used_id === tx.recommended_card_id) continue;

                const usedCard = cards.find(c => c.id === tx.card_used_id);
                const bestCard = cards.find(c => c.id === tx.recommended_card_id);

                if (!usedCard || !bestCard) continue;

                // Calc Used Value
                let usedRate = Number(usedCard.base_multiplier);
                // (Omitted rule check for speed, assume base for missed calc or implement if needed)

                // Calc Best Value (Assume best card likely had a category match)
                let bestRate = Number(bestCard.base_multiplier);
                if (tx.category && bestCard.rules) {
                    const rule = bestCard.rules.find(r => tx.category!.toLowerCase().includes(r.category.toLowerCase()));
                    if (rule) bestRate = Number(rule.multiplier);
                }

                if (bestRate > usedRate) {
                    const diffPoints = Math.floor(Number(tx.amount) * (bestRate - usedRate));
                    const diffValue = (diffPoints * Number(bestCard.point_value_cents)) / 100;

                    if (diffValue > 0.05) { // Ignore tiny diffs
                        missed.push({
                            transaction_id: tx.id,
                            merchant: tx.merchant_name,
                            date: tx.date,
                            actual_card: usedCard.nickname,
                            optimal_card: bestCard.nickname,
                            missed_value_usd: diffValue,
                            missed_points: diffPoints
                        });
                        totalMissedValue += diffValue;
                    }
                }
            }

            res.json({
                total_missed_usd: totalMissedValue,
                items: missed
            });

        } catch (error) {
            console.error('Missed Rewards Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
}
