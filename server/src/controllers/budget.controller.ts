import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export const BudgetController = {
    // GET /api/budget
    getBudget: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            let budget = await req.db.prisma.budget.findUnique({
                where: { user_id: userId }
            });

            if (!budget) {
                // Return default/empty
                budget = { monthly_limit: 0, alert_threshold: 80, categories: null } as any;
            }

            res.json(budget);
        } catch (error) {
            console.error('Get Budget Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    },

    // PUT /api/budget
    updateBudget: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const { monthlyLimit, alertThreshold, categories } = req.body;

            const budget = await req.db.prisma.budget.upsert({
                where: { user_id: userId },
                update: {
                    monthly_limit: monthlyLimit,
                    alert_threshold: alertThreshold,
                    categories: JSON.stringify(categories)
                },
                create: {
                    user_id: userId,
                    monthly_limit: monthlyLimit,
                    alert_threshold: alertThreshold || 80,
                    categories: JSON.stringify(categories)
                }
            });

            res.json(budget);
        } catch (error) {
            console.error('Update Budget Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
};
