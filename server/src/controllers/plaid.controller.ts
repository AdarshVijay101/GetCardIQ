import { Request, Response } from 'express';
import { PlaidService } from '../services/plaid.service';
import { logger } from '../utils/logger';

export class PlaidController {

    static async createLinkToken(req: Request, res: Response) {
        try {
            // @ts-ignore - User attached by auth middleware
            const userId = req.user.userId;
            const token = await PlaidService.createLinkToken(userId);
            res.json(token);
        } catch (error: any) {
            logger.error('Controller createLinkToken error', error);
            res.status(500).json({ error: 'Failed to create link token' });
        }
    }

    static async exchangePublicToken(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.userId;
            const { public_token } = req.body;

            if (!public_token) {
                return res.status(400).json({ error: 'public_token is required' });
            }

            const result = await PlaidService.exchangePublicToken(userId, public_token);
            res.json({ status: 'success', connectionId: result.id });
        } catch (error: any) {
            logger.error('Controller exchangePublicToken error', error);
            res.status(500).json({ error: 'Failed to exchange token' });
        }
    }
}
