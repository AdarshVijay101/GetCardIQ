import { Request, Response } from 'express';
import { JobRunner } from '../jobs/JobRunner';
import { PlaidService } from '../services/plaid.service';
import { GeminiService } from '../services/gemini.service';

export class JobsController {
    static async triggerSync(req: Request, res: Response) {
        try {
            const userId = req.body.userId || 'default-user-id'; // In a real app, this iterates all users
            await PlaidService.syncTransactions(req.db.prisma, userId);
            res.json({ message: 'Sync Job Completed', userId });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    static async triggerWeeklySummary(req: Request, res: Response) {
        try {
            // Weekly summary now triggers Gemini Analysis for all pending transactions
            const userId = req.body.userId || 'default-user-id';
            await GeminiService.runBatchAnalysis(req.db.prisma, userId);
            res.json({ message: 'Gemini Analysis Job Completed', userId });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    static async triggerCardUpdate(req: Request, res: Response) {
        try {
            const { updateCardDatabaseJob } = await import('../jobs/cardUpdate.job');
            const result = await updateCardDatabaseJob();
            res.json({ success: true, result });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Card update job failed' });
        }
    }
}
