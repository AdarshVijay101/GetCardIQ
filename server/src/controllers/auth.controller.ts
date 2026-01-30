import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password required' });
            }

            const user = await authService.register(req.db.prisma, email, password);
            // Don't return hash
            res.status(201).json({ id: user.id, email: user.email });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(req.db.prisma, email, password, req.ip, req.headers['user-agent']);
            res.json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const { sessionId } = (req as any).user || {}; // Populated by middleware
            if (sessionId) {
                await authService.logout(req.db.prisma, sessionId);
            }
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
