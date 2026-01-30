import { prismaReal as prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { IntelligenceService } from '../services/intelligence/IntelligenceService';
import { PlaidService } from '../services/plaid.service';

export class JobRunner {
    // Sync Job: Iterates all connections and syncs if needed
    static async runSyncJob() {
        logger.info('Starting Sync Job...');

        // Find connections not synced in last 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const connections = await prisma.plaidConnection.findMany({
            where: {
                OR: [
                    { last_sync: { lt: oneHourAgo } },
                    { last_sync: null }
                ]
                // status: 'ACTIVE' // Removed as it doesn't exist in schema
            }
        });

        logger.info(`Found ${connections.length} connections to sync.`);

        let successCount = 0;
        let failCount = 0;

        for (const conn of connections) {
            try {
                // Assuming syncTransactions takes userId, based on Controller usage
                await PlaidService.syncTransactions(conn.user_id);

                await prisma.plaidConnection.update({
                    where: { id: conn.id },
                    data: { last_sync: new Date() }
                });

                // Audit Log
                await prisma.auditLog.create({
                    data: {
                        user_id: conn.user_id,
                        event_type: 'JOB_SYNC',
                        action: 'SYNC',
                        resource_type: 'plaid_connection',
                        resource_id: conn.id,
                        metadata: JSON.stringify({ status: 'success' })
                    }
                });
                successCount++;

            } catch (error: any) {
                failCount++;
                logger.error(`Failed to sync connection ${conn.id}: ${error.message}`);

                await prisma.auditLog.create({
                    data: {
                        user_id: conn.user_id,
                        event_type: 'JOB_SYNC',
                        action: 'SYNC',
                        resource_type: 'plaid_connection',
                        resource_id: conn.id,
                        metadata: JSON.stringify({ status: 'failed', error: error.message })
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
                        user_id: user.id,
                        event_type: 'JOB_AI',
                        action: 'AI',
                        resource_type: 'weekly_summary',
                        metadata: JSON.stringify({ status: 'success', analyzed: result.analyzed })
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
