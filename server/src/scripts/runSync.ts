import { JobRunner } from '../jobs/JobRunner';
import { logger } from '../utils/logger';

async function main() {
    logger.info('Running Manual Sync Job...');
    try {
        const stats = await JobRunner.runSyncJob();
        logger.info('Sync Job Finished', stats);
        process.exit(0);
    } catch (error) {
        logger.error('Sync Job Failed', error);
        process.exit(1);
    }
}

main();
