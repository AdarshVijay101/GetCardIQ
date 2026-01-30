
import { PrismaClient } from '@prisma/client';
import { BenefitsController } from '../controllers/benefits.controller';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const MonthlyAuditJob = {
    run: async () => {
        console.log('[Job] Starting Monthly Audit...');

        try {
            const users = await prisma.user.findMany();

            for (const user of users) {
                // Mock Request/Response for logic reuse
                const req: any = { user: { userId: user.id } };
                const res: any = {
                    json: (data: any) => checkBenefits(user.id, data)
                };

                // Reuse Controller Logic
                await BenefitsController.getBenefitStatus(req, res);
            }
        } catch (error) {
            console.error('[Job] Audit Failed:', error);
        }
    }
};

async function checkBenefits(userId: string, data: any) {
    if (Array.isArray(data)) {
        for (const ben of data) {
            if (ben.expiring_soon && ben.status !== 'fully_used') {
                const message = `Your ${ben.benefit_name} ($${ben.remaining_amount} remaining) expires soon!`;

                // 1. Create In-App Notification
                await prisma.notification.create({
                    data: {
                        user_id: userId,
                        type: 'EXPIRING_CREDIT',
                        priority: 'HIGH',
                        title: 'Benefit Expiring',
                        message: message,
                        is_read: false
                    }
                });

                // 2. Email Trigger Stub
                console.log(`[EMAIL STUB] To: User(${userId}) Subject: Use your ${ben.benefit_name} Body: ${message}`);
            }
        }
    }
}
