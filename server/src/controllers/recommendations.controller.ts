
import { Request, Response } from 'express';
// import { prisma } from '../utils/prisma'; // REMOVED

export const RecommendationsController = {
    getBestCard: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const { category } = req.query;

            // Simple logic: Find card with highest multiplier for category
            // 1. Get User Cards
            const userCards = await req.db.prisma.card.findMany({
                where: { user_id: userId }, // schema D uses user_id
                include: { rewards: true }
            });

            // 2. Find best "In Wallet"
            let bestOwned = null;
            let maxOwnedMult = 0;

            for (const card of userCards) {
                const reward = card.rewards.find(r => r.category.toLowerCase() === (category as string)?.toLowerCase());
                // Default to base 1x if not found? Or ignore.
                // For demo, if reward found:
                if (reward) {
                    const val = Number(reward.reward_value);
                    if (val > maxOwnedMult) {
                        maxOwnedMult = val;
                        bestOwned = {
                            card: card.nickname, // D schema uses nickname, not name
                            multiplier: `${val}x Points`,
                            why: `Earns ${val}x on ${category}`,
                            img: 'bg-yellow-500' // mock color
                        };
                    }
                }
            }

            // Fallback if no specific rule
            if (!bestOwned && userCards.length > 0) {
                bestOwned = {
                    card: userCards[0].nickname,
                    multiplier: '1x Points',
                    why: 'Base earn rate',
                    img: 'bg-gray-500'
                };
            }

            // 3. Mock "Suggested" (Upgrade)
            // In real app, query a "RefCard" database. For now, hardcode comparison.
            // 3. Mock "Suggested" (Upgrade) based on category
            let suggested;
            switch ((category as string)?.toLowerCase()) {
                case 'grocery':
                    suggested = { card: 'Amex Gold', multiplier: '4x Points', why: '4x on Supermarkets up to $25k/yr', img: 'bg-yellow-500' };
                    break;
                case 'travel':
                    suggested = { card: 'Amex Platinum', multiplier: '5x Points', why: '5x on Flights booked directly', img: 'bg-gray-400' };
                    break;
                case 'gas':
                    suggested = { card: 'Citi Custom Cash', multiplier: '5x Points', why: '5x on top category (Gas)', img: 'bg-green-600' };
                    break;
                case 'online':
                    suggested = { card: 'Amazon Prime', multiplier: '5% Back', why: '5% at Amazon.com', img: 'bg-blue-800' };
                    break;
                case 'dining':
                default:
                    suggested = { card: 'Chase Freedom Flex', multiplier: '3x Points', why: '3x on Dining & Drugstores', img: 'bg-blue-500' };
                    break;
            }

            res.json({
                owned: bestOwned,
                suggested: suggested
            });

        } catch (error) {
            console.error('[Recommendations] Error:', error);
            res.status(500).json({ error: 'Failed to get recommendations' });
        }
    }
};
