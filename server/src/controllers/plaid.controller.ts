import { Request, Response } from 'express';
import { PlaidService } from '../services/plaid.service';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export const PlaidController = {
    createLinkToken: async (req: Request, res: Response) => {
        try {
            // In a real app, get userId from Auth Middleware (req.user.id)
            // For MVP/Demo, we might need a hardcoded User ID or passed via headers
            const userId = (req as any).user?.userId || 'default-user-id';
            const tokenResponse = await PlaidService.createLinkToken(userId);
            res.json(tokenResponse);
        } catch (error) {
            console.error('Plaid Link Token Error:', error);
            res.status(500).json({ error: 'Failed to create link token' });
        }
    },

    exchangePublicToken: async (req: Request, res: Response) => {
        try {
            const { public_token, publicToken, metadata } = req.body;
            const userId = (req as any).user?.userId || 'default-user-id';
            // Frontend sends public_token, but let's support both
            const token = public_token || publicToken;

            if (!token) {
                res.status(400).json({ error: 'Missing public_token' });
                return;
            }

            const result = await PlaidService.exchangePublicToken(req.db.prisma, userId, token, metadata);
            res.json(result);
        } catch (error: any) {
            console.error('Plaid Exchange Error:', error.response?.data || error);
            res.status(500).json({
                error: 'Failed to exchange token',
                details: error.response?.data || error.message
            });
        }
    },

    syncTransactions: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.userId || 'default-user-id';
            console.log(`[PlaidController] Sync requested for User: ${userId}`);

            await PlaidService.syncTransactions(req.db.prisma, userId);
            res.json({ status: 'success', message: 'Transactions synced' });
        } catch (error) {
            console.error('Plaid Sync Error:', error);
            res.status(500).json({ error: 'Failed to sync transactions' });
        }
    },

    // GET /api/plaid/debug
    debugSync: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.userId || 'default-user-id';
            const connections = await req.db.prisma.plaidConnection.findMany({ where: { user_id: userId } });

            const cards = await req.db.prisma.card.findMany({ where: { user_id: userId } });
            const transactions = await req.db.prisma.transaction.findMany({ where: { user_id: userId }, take: 5, orderBy: { date: 'desc' } });
            const count = await req.db.prisma.transaction.count({ where: { user_id: userId } });

            res.json({
                user_id: userId,
                connections: connections.map(c => ({ id: c.id, ins: c.institution_name })),
                cards_count: cards.length,
                transactions_total: count,
                latest_transactions: transactions
            });
        } catch (error) {
            res.status(500).json({ error: 'Debug failed' });
        }
    }
};
