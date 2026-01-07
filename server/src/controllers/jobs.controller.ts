import { Request, Response } from 'express';
import { JobRunner } from '../jobs/JobRunner';

export class JobsController {
    static async triggerSync(req: Request, res: Response) {
        try {
            const result = await JobRunner.runSyncJob();
            res.json({ message: 'Sync Job Completed', stats: result });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async triggerWeeklySummary(req: Request, res: Response) {
        try {
            const result = await JobRunner.runWeeklySummaryJob();
            res.json({ message: 'Weekly Summary Job Completed', stats: result });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
