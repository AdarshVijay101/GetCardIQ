
import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';

export const AIController = {
    getStatus: async (req: Request, res: Response) => {
        try {
            const status = await AIService.getStatus(req.db.prisma);
            res.json(status);
        } catch (error: any) {
            console.error('AI Status Error:', error);
            res.status(500).json({ error: 'Failed to fetch AI status' });
        }
    }
};
