import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";

export const authenticate: RequestHandler = async (req, res, next) => {
  // DEV bypass for Plaid routes (remove/tighten for production)
  if (process.env.NODE_ENV !== "production" && req.originalUrl.startsWith("/api/plaid/")) {
    console.log("[AuthMiddleware] DEV bypass for Plaid:", req.method, req.originalUrl);
    return next();
  }

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

    if (!session || !session.isActive) {
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
