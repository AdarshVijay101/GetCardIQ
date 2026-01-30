
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export class SettingsController {

    // GET /api/settings/connections
    static async getConnections(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            const connections = await req.db.prisma.plaidConnection.findMany({
                where: { user_id: userId },
                select: {
                    id: true,
                    institution_name: true,
                    institution_id: true,
                    last_sync: true,
                    created_at: true
                }
            });

            // Also fetch cards count per connection for UI nicety
            const enriched = await Promise.all(connections.map(async (conn) => {
                const cardCount = await req.db.prisma.card.count({
                    where: { user_id: userId, issuer: conn.institution_name || undefined } // Rough match
                });
                return { ...conn, cardCount };
            }));

            res.json(enriched);
        } catch (error) {
            console.error('Get Connections Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }

    // DELETE /api/settings/connections/:id
    static async deleteConnection(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = (req as any).user.userId;

            // Verify ownership
            const conn = await req.db.prisma.plaidConnection.findFirst({
                where: { id, user_id: userId }
            });

            if (!conn) {
                res.status(404).json({ error: 'Connection not found' });
                return;
            }

            // Delete
            await req.db.prisma.plaidConnection.delete({ where: { id } });

            // Optional: Remove associated cards or keep them?
            // For safety, let's keep cards but maybe mark pliad_account_id null?
            // Or just leave them as "Manual" cards.

            res.json({ success: true });
        } catch (error) {
            console.error('Delete Connection Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }

    // GET /api/settings/profile
    static async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            const user = await req.db.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                    credit_score: true
                }
            });

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({
                email: user.email,
                created_at: user.created_at,
                profile: user.profile || {},
                credit_score: user.credit_score || { score: 0, source: 'MANUAL', history: [] }
            });
        } catch (error) {
            console.error('Get Profile Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }

    // PUT /api/settings/profile
    static async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { email, profile, creditScore } = req.body;

            // Update Auth User (Email)
            if (email) {
                await req.db.prisma.user.update({
                    where: { id: userId },
                    data: { email }
                });
            }

            // Update Extended Profile
            if (profile) {
                await req.db.prisma.userProfile.upsert({
                    where: { user_id: userId },
                    create: {
                        user_id: userId,
                        ...profile
                    },
                    update: {
                        ...profile
                    }
                });
            }

            // Update Credit Score
            if (creditScore) {
                // If manual update, push to history (simplified)
                const current = await req.db.prisma.creditScoreProfile.findUnique({ where: { user_id: userId } });
                let history = current?.history ? JSON.parse(current.history) : [];
                history.push({ date: new Date(), score: creditScore.score });

                await req.db.prisma.creditScoreProfile.upsert({
                    where: { user_id: userId },
                    create: {
                        user_id: userId,
                        score: Number(creditScore.score),
                        source: creditScore.source || 'MANUAL',
                        last_updated: new Date(),
                        history: JSON.stringify(history)
                    },
                    update: {
                        score: Number(creditScore.score),
                        source: creditScore.source || 'MANUAL',
                        last_updated: new Date(),
                        history: JSON.stringify(history)
                    }
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Update Profile Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
}
