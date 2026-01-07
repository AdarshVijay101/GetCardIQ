import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;

        // Check if sessions is valid in DB (Server-side revocation support)
        const session = await prisma.session.findUnique({
            where: { id: payload.sessionId }
        });

        if (!session || !session.isActive) {
            return res.status(401).json({ error: 'Unauthorized: Session invalid or expired' });
        }

        // Attach user context to request
        (req as any).user = {
            userId: payload.userId,
            sessionId: payload.sessionId
        }; // Extend Request type properly in real project

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
