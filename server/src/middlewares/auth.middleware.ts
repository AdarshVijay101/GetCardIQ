import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { prismaReal as prisma } from "../db/prisma";

export const authenticate: RequestHandler = async (req, res, next) => {
    // DEV bypass ONLY for Plaid routes (so frontend can test without login)
    const isDev = process.env.NODE_ENV !== "production";
    // DEV Mode: Default to 'default-user-id' (Real) or 'demo-user-year-1' (Demo) if no token
    if (isDev && !req.headers.authorization) {
        // Detect Demo Mode from context (attached by demoMiddleware)
        const isDemo = (req as any).db?.mode === 'demo';

        (req as any).user = {
            userId: isDemo ? "demo-user-year-1" : "default-user-id",
            sessionId: "dev-session",
        };
        // console.log(`[AuthMiddleware] DEV Bypass (${isDemo ? 'DEMO' : 'REAL'}): ${req.method} ${req.originalUrl}`);
        return next();
    }

    // Normal JWT auth for everything else
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as any;

        const session = await prisma.session.findUnique({
            where: { id: payload.sessionId },
        });

        if (!session || session.expires_at < new Date()) {
            return res.status(401).json({ error: "Unauthorized: Session invalid or expired" });
        }

        (req as any).user = {
            userId: payload.userId,
            sessionId: payload.sessionId,
        };

        return next();
    } catch {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};
