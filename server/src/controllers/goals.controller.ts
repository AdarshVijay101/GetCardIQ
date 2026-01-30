import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export const GoalsController = {
    // GET /api/goals
    listGoals: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const goals = await req.db.prisma.goal.findMany({
                where: { user_id: userId },
                include: { milestones: true },
                orderBy: { created_at: 'desc' }
            });
            res.json(goals);
        } catch (error) {
            console.error('List Goals Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    },

    // POST /api/goals
    createGoal: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const { name, reason, targetAmount, targetDate, monthlyContribution, fundingSourceId } = req.body;

            const goal = await req.db.prisma.goal.create({
                data: {
                    user_id: userId,
                    name,
                    reason,
                    target_amount: targetAmount,
                    target_date: new Date(targetDate), // Ensure date format
                    monthly_contribution: monthlyContribution,
                    funding_source_id: fundingSourceId,
                    current_amount: 0,
                    status: 'ACTIVE'
                }
            });

            // Auto-create standard milestones?
            await req.db.prisma.goalMilestone.createMany({
                data: [25, 50, 75, 100].map(pct => ({
                    goal_id: goal.id,
                    percent: pct
                }))
            });

            res.json(goal);
        } catch (error) {
            console.error('Create Goal Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    },

    // PUT /api/goals/:id
    updateGoal: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { currentAmount, status } = req.body;

            const updateData: any = {};
            if (currentAmount !== undefined) updateData.current_amount = currentAmount;
            if (status !== undefined) updateData.status = status;

            const goal = await req.db.prisma.goal.update({
                where: { id },
                data: updateData
            });
            res.json(goal);
        } catch (error) {
            console.error('Update Goal Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    },

    // DELETE /api/goals/:id
    deleteGoal: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // Delete milestones first (cascade usually handles this but being safe)
            await req.db.prisma.goalMilestone.deleteMany({ where: { goal_id: id } });
            await req.db.prisma.goal.delete({ where: { id } });
            res.json({ success: true });
        } catch (error) {
            console.error('Delete Goal Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
};
