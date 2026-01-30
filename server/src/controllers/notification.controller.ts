import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export class NotificationController {
    // GET /api/notifications?userId=...
    static async list(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            // Mock generator for "fake" alerts if none exist, just to show UI
            // In real app, these come from background jobs.
            const count = await req.db.prisma.notification.count({ where: { user_id: userId } });
            if (count === 0) {
                await req.db.prisma.notification.createMany({
                    data: [
                        {
                            user_id: userId,
                            type: 'BENEFIT_EXPIRY',
                            priority: 'HIGH',
                            title: 'Uber Cash Expiring',
                            message: 'You have $15 Uber Cash on Amex Gold expiring in 3 days.',
                            action_url: '/benefits'
                        },
                        {
                            user_id: userId,
                            type: 'SYSTEM',
                            priority: 'info',
                            title: 'Accounts Synced',
                            message: 'Your transactions are up to date.',
                            created_at: new Date(Date.now() - 86400000)
                        }
                    ]
                });
            }

            const notifications = await req.db.prisma.notification.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' }
            });

            res.json(notifications);
        } catch (error) {
            console.error('List Notifications Error:', error);
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    }

    // POST /api/notifications/:id/read
    static async markRead(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await req.db.prisma.notification.update({
                where: { id },
                data: { is_read: true }
            });
            res.json({ success: true });
        } catch (error) {
            console.error('Mark Read Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
}
