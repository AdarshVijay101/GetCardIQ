import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export const ProfileController = {
    getProfile: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;

            // 1. User Details
            const user = await req.db.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, created_at: true }
            });

            if (!user) {
                // Return dummy for demo if user not found (since we use hardcoded ID)
                res.json({
                    user: { id: 'default-user-id', email: 'demo@getcardiq.com', name: 'Demo User' },
                    institutions: [],
                    accounts: []
                });
                return;
            }

            // 2. Connected Institutions (Plaid Items)
            const connections = await req.db.prisma.plaidConnection.findMany({
                where: { user_id: userId }
            });

            // 3. Connected Accounts (Cards/Depository)
            const accounts = await req.db.prisma.card.findMany({
                where: { user_id: userId },
                select: {
                    id: true,
                    nickname: true,
                    issuer: true,
                    mask: true,
                    current_balance: true,
                    credit_limit: true,
                    plaid_account_id: true
                }
            });

            res.json({
                user: { ...user, name: 'Adarsh Vijay' }, // Mock name for now
                institutions: connections.map(c => ({
                    id: c.id,
                    name: c.institution_name,
                    last_sync: c.last_sync
                })),
                accounts: accounts.map(a => ({
                    ...a,
                    current_balance: Number(a.current_balance),
                    credit_limit: Number(a.credit_limit)
                }))
            });

        } catch (error) {
            console.error('Profile Error:', error);
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    },

    updateProfile: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const { full_name, email, phone, zip, income_range, has_vehicle } = req.body;

            // 1. Update Core User (Email)
            if (email) {
                await req.db.prisma.user.update({
                    where: { id: userId },
                    data: { email }
                });
            }

            // 2. Update/Upsert User Profile
            const profile = await req.db.prisma.userProfile.upsert({
                where: { user_id: userId },
                update: {
                    full_name,
                    phone_number: phone,
                    zip_code: zip,
                    income_range,
                    has_vehicle: has_vehicle !== undefined ? has_vehicle : undefined
                },
                create: {
                    user_id: userId,
                    full_name,
                    phone_number: phone,
                    zip_code: zip,
                    income_range,
                    has_vehicle: has_vehicle || false
                }
            });

            res.json({ success: true, profile });
        } catch (error) {
            console.error('Update Profile Error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
};
