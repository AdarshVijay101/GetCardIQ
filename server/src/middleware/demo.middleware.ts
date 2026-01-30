import { Request, Response, NextFunction } from 'express';
import { prismaReal, prismaDemo, DbContext } from '../db/prisma';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            db: DbContext;
        }
    }
}

export const demoMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const isDemoRequest = req.headers['x-demo-mode'] === 'true';

    // Default to Real Mode
    let context: DbContext = {
        prisma: prismaReal,
        mode: 'real'
    };

    if (isDemoRequest) {
        // SAFETY GUARDRAILS
        const isNonProduction = process.env.NODE_ENV !== 'production';
        const hasSecret = req.headers['x-demo-secret'] && req.headers['x-demo-secret'] === process.env.DEMO_MODE_SECRET;

        // User Requirements: "Allow demo mode ONLY when NODE_ENV != 'production' OR require a DEMO_MODE_SECRET"
        const referencesSafe = isNonProduction || hasSecret;

        if (!referencesSafe) {
            console.warn(`[SECURITY] Blocked Demo Mode request from ${req.ip} - Missing safety checks.`);
            res.status(403).json({
                error: 'Demo Mode is not available in this environment without authorization.'
            });
            return;
        }

        if (!prismaDemo) {
            console.error(`[CONFIG] Demo Mode requested but DATABASE_URL_DEMO is not configured.`);
            res.status(503).json({
                error: 'Demo Mode is not currently available (DB not configured).'
            });
            return;
        }

        context = {
            prisma: prismaDemo,
            mode: 'demo'
        };
    }

    req.db = context;
    next();
};
