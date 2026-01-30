import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED

export const RecurringService = {
    detectSubscriptions: async (prisma: PrismaClient, userId: string) => {
        // Simple logic: Find merchants with > 1 transaction in last 60 days with similar amounts
        const transactions = await prisma.transaction.findMany({
            where: { user_id: userId },
            orderBy: { date: 'desc' }
        });

        const groups: Record<string, number[]> = {};

        // Group by Merchant
        for (const tx of transactions) {
            if (!groups[tx.merchant_name]) groups[tx.merchant_name] = [];
            groups[tx.merchant_name].push(Number(tx.amount));
        }

        const subscriptions = [];

        for (const [merchant, amounts] of Object.entries(groups)) {
            if (amounts.length >= 2) {
                // Check if variance is low (subscriptions usually same amount)
                const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
                const variance = amounts.every(a => Math.abs(a - avg) < 1.0); // within $1

                if (variance) {
                    subscriptions.push({
                        merchant,
                        amount: avg,
                        frequency: 'MONTHLY' // Assumption
                    });
                }
            }
        }

        return subscriptions;
    }
};
