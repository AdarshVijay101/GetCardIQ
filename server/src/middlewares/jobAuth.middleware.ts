import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const verifyJobScheduler = (req: Request, res: Response, next: NextFunction) => {
    const schedulerKey = req.headers['x-scheduler-key'];
    const expectedKey = process.env.SCHEDULER_KEY;

    // In production, also can verify OIDC token if using Cloud Run IAM invocation
    // For MVP Upgrade B, Scheduler Key or IAM is required.
    // We'll support Scheduler Key first.

    if (!expectedKey) {
        logger.error('SCHEDULER_KEY not configured in environment');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    if (schedulerKey !== expectedKey) {
        logger.warn(`Unauthorized job attempt from ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid Scheduler Key' });
    }

    next();
};
