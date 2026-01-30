
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const initDB = async () => {
    try {
        console.log('[DB Init] Checking Raw Tables...');

        // 1. Scrape Jobs Table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS scrape_jobs (
                id UUID PRIMARY KEY,
                kind TEXT NOT NULL,
                status TEXT NOT NULL,
                progress INT NOT NULL DEFAULT 0,
                last_error TEXT,
                started_at TIMESTAMPTZ,
                finished_at TIMESTAMPTZ
            );
        `);
        console.log('[DB Init] scrape_jobs table ready.');

    } catch (error) {
        console.error('[DB Init] Failed:', error);
    }
};
