import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export class RewardsController {
    // GET /api/rewards/ledger?cardId=...
    static async getLedger(req: Request, res: Response): Promise<void> {
        try {
            const { cardId } = req.query;
            if (!cardId) {
                res.status(400).json({ error: 'Card ID required' });
                return;
            }

            const ledger = await req.db.prisma.rewardLedger.findMany({
                where: { card_id: cardId as string },
                orderBy: { created_at: 'desc' },
                take: 50
            });

            res.json(ledger);
        } catch (error) {
            console.error('Get Ledger Error:', error);
            res.status(500).json({ error: 'Failed to fetch ledger' });
        }
    }

    // POST /api/rewards/setup
    static async setupCard(req: Request, res: Response): Promise<void> {
        try {
            const { cardId, currentBalance, currency, valueCents, rules } = req.body;

            const card = await req.db.prisma.card.update({
                where: { id: cardId },
                data: {
                    current_points_balance: parseInt(currentBalance),
                    reward_currency: currency,
                    point_value_cents: valueCents,
                }
            });

            res.json({ success: true, card });
        } catch (error) {
            console.error('Setup Rewards Error:', error);
            res.status(500).json({ error: 'Failed to setup rewards' });
        }
    }

    // POST /api/rewards/all-balances
    static async getAllBalances(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            const cards = await req.db.prisma.card.findMany({
                where: { user_id: userId },
                select: {
                    id: true,
                    nickname: true,
                    issuer: true,
                    current_points_balance: true,
                    reward_currency: true,
                    point_value_cents: true
                }
            });

            res.json(cards);
        } catch (error) {
            console.error('Get All Balances Error:', error);
            res.status(500).json({ error: 'Failed to fetch balances' });
        }
    }

    // POST /api/rewards/redeem
    static async redeem(req: Request, res: Response): Promise<void> {
        try {
            const { cardId, pointsRedeemed, note } = req.body;
            const userId = (req as any).user.userId;

            const result = await req.db.prisma.$transaction(async (tx) => {
                const card = await tx.card.findUniqueOrThrow({ where: { id: cardId } });

                if (card.current_points_balance < pointsRedeemed) {
                    throw new Error("Insufficient points balance");
                }

                const updatedCard = await tx.card.update({
                    where: { id: cardId },
                    data: {
                        current_points_balance: { decrement: pointsRedeemed }
                    }
                });

                await tx.rewardLedger.create({
                    data: {
                        user_id: userId,
                        card_id: cardId,
                        event_type: 'REDEEMED',
                        points_change: -pointsRedeemed,
                        note: note || 'Manual Redemption'
                    }
                });

                return updatedCard;
            });

            res.json({ success: true, newBalance: result.current_points_balance });
        } catch (error: any) {
            console.error('Redeem Error:', error);
            res.status(400).json({ error: error.message || 'Redemption failed' });
        }
    }

    // POST /api/rewards/adjust
    static async adjust(req: Request, res: Response): Promise<void> {
        try {
            const { cardId, newBalance, note } = req.body;
            const userId = (req as any).user.userId;

            const card = await req.db.prisma.card.findUniqueOrThrow({ where: { id: cardId } });
            const delta = newBalance - card.current_points_balance;

            if (delta === 0) {
                res.json({ success: true, newBalance });
                return;
            }

            const result = await req.db.prisma.$transaction(async (tx) => {
                const updatedCard = await tx.card.update({
                    where: { id: cardId },
                    data: { current_points_balance: newBalance }
                });

                await tx.rewardLedger.create({
                    data: {
                        user_id: userId,
                        card_id: cardId,
                        event_type: 'ADJUSTED',
                        points_change: delta,
                        note: note || 'Manual Adjustment'
                    }
                });
                return updatedCard;
            });

            res.json({ success: true, newBalance: result.current_points_balance });
        } catch (error) {
            console.error('Adjust Error:', error);
            res.status(500).json({ error: 'Adjustment failed' });
        }
    }

    // GET /api/rewards/summary
    static async getSummary(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            // Fetch all cards with rules
            const cards = await req.db.prisma.card.findMany({
                where: { user_id: userId },
                include: { rules: true }
            });

            // Fetch recent transactions (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const txns = await req.db.prisma.transaction.findMany({
                where: {
                    user_id: userId,
                    date: { gte: thirtyDaysAgo },
                    amount: { gt: 0 }
                }
            });

            // Calculate
            let totalPoints = 0;
            let totalValueCents = 0;
            const byCard: any = {};

            txns.forEach((tx: any) => {
                if (!tx.card_used_id) return;
                const card = cards.find((c: any) => c.id === tx.card_used_id);
                if (!card) return;

                let multiplier = Number(card.base_multiplier);
                // Check specific rules
                if (tx.category && card.rules) {
                    const rule = card.rules.find((r: any) =>
                        r.category.toLowerCase() === tx.category!.toLowerCase() ||
                        tx.category!.toLowerCase().includes(r.category.toLowerCase())
                    );
                    if (rule) multiplier = Number(rule.multiplier);
                }

                const points = Math.floor(Number(tx.amount) * multiplier);
                const value = points * Number(card.point_value_cents);

                totalPoints += points;
                totalValueCents += value;

                if (!byCard[card.nickname]) {
                    byCard[card.nickname] = { points: 0, value: 0 };
                }
                byCard[card.nickname].points += points;
                byCard[card.nickname].value += value;
            });

            res.json({
                total_points: totalPoints,
                total_value_usd: totalValueCents / 100,
                by_card: byCard
            });
        } catch (error) {
            console.error('Rewards Summary Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }

    // GET /api/rewards/breakdown
    static async getBreakdown(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            const cards = await req.db.prisma.card.findMany({
                where: { user_id: userId },
                include: { rules: true }
            });

            const txns = await req.db.prisma.transaction.findMany({
                where: { user_id: userId, amount: { gt: 0 } },
                orderBy: { date: 'desc' },
                take: 50
            });

            const enriched = txns.map((tx: any) => {
                const card = cards.find((c: any) => c.id === tx.card_used_id);
                let points = 0;
                let rate = 1.0;

                if (card) {
                    rate = Number(card.base_multiplier);
                    if (tx.category && card.rules) {
                        const rule = card.rules.find((r: any) =>
                            r.category.toLowerCase() === tx.category!.toLowerCase() ||
                            tx.category!.toLowerCase().includes(r.category.toLowerCase())
                        );
                        if (rule) rate = Number(rule.multiplier);
                    }
                    points = Math.floor(Number(tx.amount) * rate);
                }

                return {
                    ...tx,
                    reward_calc: {
                        rate,
                        points,
                        value_usd: (points * (card ? Number(card.point_value_cents) : 1)) / 100
                    }
                };
            });

            res.json(enriched);
        } catch (error) {
            console.error('Rewards Breakdown Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
}
