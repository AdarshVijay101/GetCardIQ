
import { Request, Response, NextFunction } from 'express';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // 1. Environment Guard (Dev/Staging Only)
    // The user strongly recommended strict check: NODE_ENV !== 'production'
    if (process.env.NODE_ENV === 'production') {
        console.warn(`[SECURITY] Admin Action blocked in PRODUCTION from ${req.ip}`);
        return res.status(403).json({ error: 'Admin actions are disabled in production.' });
    }

    // 2. Configuration Guard
    if (process.env.ENABLE_DANGEROUS_ADMIN_ACTIONS !== 'true') {
        console.warn(`[SECURITY] Admin Action blocked (Disabled by Config) from ${req.ip}`);
        return res.status(403).json({ error: 'Admin actions are disabled by configuration.' });
    }

    // 3. Secret Key Guard
    const clientKey = req.headers['x-admin-key'];
    const serverKey = process.env.ADMIN_KEY;

    if (!serverKey || clientKey !== serverKey) {
        console.warn(`[SECURITY] Admin Action blocked (Invalid Key) from ${req.ip}`);
        return res.status(403).json({ error: 'Unauthorized: Invalid Admin Key' });
    }

    next();
};
