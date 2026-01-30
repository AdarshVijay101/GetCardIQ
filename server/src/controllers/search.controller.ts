import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export const SearchController = {
    globalSearch: async (req: Request, res: Response): Promise<void> => {
        try {
            const query = req.query.q as string;
            const userId = (req as any).user.userId;

            if (!query || query.length < 2) {
                res.json({ cards: [], transactions: [], benefits: [] });
                return;
            }

            // Parallel queries
            const [cards, transactions, benefits] = await Promise.all([
                req.db.prisma.card.findMany({
                    where: {
                        user_id: userId,
                        OR: [
                            { nickname: { contains: query } }, // Case insensitive in Postgres usually requires mode: 'insensitive' but SQLite is mixed. 
                            { issuer: { contains: query } }
                        ]
                    },
                    take: 5
                }),
                req.db.prisma.transaction.findMany({
                    where: {
                        user_id: userId,
                        OR: [
                            { merchant_name: { contains: query } },
                            { category: { contains: query } }
                        ]
                    },
                    orderBy: { date: 'desc' },
                    take: 10
                }),
                req.db.prisma.cardBenefit.findMany({
                    where: {
                        card: { user_id: userId },
                        benefit_name: { contains: query }
                    },
                    include: { card: true },
                    take: 5
                })
            ]);

            // Format results
            res.json({
                transactions: transactions.map(t => ({ id: t.id, title: t.merchant_name, subtitle: `$${Number(t.amount).toFixed(2)} - ${new Date(t.date).toLocaleDateString()}`, type: 'transaction' })),
                benefits: benefits.map(b => ({ id: b.id, title: b.benefit_name, subtitle: b.card.nickname, type: 'benefit' }))
            });

        } catch (error) {
            console.error('Search Error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    }
};
