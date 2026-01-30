
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const AlertGenerator = {
    run: async () => {
        console.log("Running AlertGenerator job...");
        try {
            const users = await prisma.user.findMany();

            for (const user of users) {
                // 1. High Utilization Check (> 30%)
                const cards = await prisma.card.findMany({
                    where: { user_id: user.id, card_type: 'credit' }
                });

                let totalBalance = 0;
                let totalLimit = 0;

                for (const card of cards) {
                    totalBalance += Number(card.current_balance || 0);
                    totalLimit += Number(card.credit_limit || 0);
                }

                if (totalLimit > 0) {
                    const util = (totalBalance / totalLimit) * 100;
                    if (util > 30) {
                        await createNotificationIfNotExists(
                            user.id,
                            'utilization-alert',
                            'High Credit Utilization',
                            `Your overall utilization is ${util.toFixed(1)}%. Aim for < 30%.`,
                            'high'
                        );
                    }
                }

                // 2. Expiring Benefits Check (next 30 days)
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

                const expiringBenefits = await prisma.cardBenefit.findMany({
                    where: {
                        card: { user_id: user.id },
                        expiration_date: {
                            lte: thirtyDaysFromNow,
                            gte: new Date()
                        }
                    },
                    include: { card: true }
                });

                for (const benefit of expiringBenefits) {
                    await createNotificationIfNotExists(
                        user.id,
                        `expiry-${benefit.id}`,
                        'Benefit Expiring Soon',
                        `${benefit.benefit_name} on ${benefit.card.nickname} expires soon. Use it!`,
                        'medium'
                    );
                }
            }
            console.log("AlertGenerator job completed.");

        } catch (error) {
            console.error("AlertGenerator failed:", error);
        }
    }
};

async function createNotificationIfNotExists(userId: string, refId: string, title: string, message: string, priority: string) {
    // Basic deduplication logic based on time or unread status could go here
    // For now, fairly naive: just check if we have an UNREAD one with same title created recently?
    // Actually, for simplicity, let's just insert one if no unread alert exists with this title.

    const existing = await prisma.notification.findFirst({
        where: {
            user_id: userId,
            title: title,
            is_read: false
        }
    });

    if (!existing) {
        await prisma.notification.create({
            data: {
                user_id: userId,
                type: 'alert',
                title: title,
                message: message,
                priority: priority,
                is_read: false
            }
        });
        console.log(`Created alert for user ${userId}: ${title}`);
    }
}
