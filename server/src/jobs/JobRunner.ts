import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { IntelligenceService } from '../services/intelligence/IntelligenceService';

// Mock Plaid Sync Service (will implement real logic in Phase 5)
const mockSyncPlaidData = async (connectionId: string) => {
    logger.info(`[MOCK] Syncing Plaid data for connection ${connectionId}`);
    return Promise.resolve();
};

export class JobRunner {
    // Sync Job: Iterates all connections and syncs if needed
    static async runSyncJob() {
        logger.info('Starting Sync Job...');

        // Find connections not synced in last 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const connections = await prisma.plaidConnection.findMany({
            where: {
                OR: [
                    { lastSyncedAt: { lt: oneHourAgo } },
                    { lastSyncedAt: null }
                ],
                status: 'ACTIVE'
            }
        });

        logger.info(`Found ${connections.length} connections to sync.`);

        let successCount = 0;
        let failCount = 0;

        for (const conn of connections) {
            try {
                await mockSyncPlaidData(conn.id);

                await prisma.plaidConnection.update({
                    where: { id: conn.id },
                    data: { lastSyncedAt: new Date() }
                });

                // Audit Log
                await prisma.auditLog.create({
                    data: {
                        userId: conn.userId,
                        action: 'SYNC',
                        resource: `plaid_connection:${conn.id}`,
                        details: { status: 'success' }
                    }
                });
                successCount++;

            } catch (error: any) {
                failCount++;
                logger.error(`Failed to sync connection ${conn.id}: ${error.message}`);

                await prisma.auditLog.create({
                    data: {
                        userId: conn.userId,
                        action: 'SYNC',
                        resource: `plaid_connection:${conn.id}`,
                        details: { status: 'failed', error: error.message }
                    }
                });
            }
        }

        return { total: connections.length, success: successCount, failed: failCount };
    }

    // Weekly Summary Job
    static async runWeeklySummaryJob() {
        logger.info('Starting Weekly Summary Job...');

        const users = await prisma.user.findMany(); // MVP: All users
        let count = 0;

        for (const user of users) {
            try {
                const result = await IntelligenceService.analyzeTransactions(user.id);
                logger.info(`Analyzed transactions for user ${user.id}`, result);

                // Audit
                await prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'AI',
                        resource: 'weekly_summary',
                        details: { status: 'success', analyzed: result.analyzed }
                    }
                });
                count++;
            } catch (e: any) {
                logger.error(`Failed summary for user ${user.id}: ${e.message}`);
            }
        }
        return { processed: count };
    }
}
