import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const createClient = (url?: string) => {
    if (!url) return null;
    return new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    });
};

export const prismaReal = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

// Only create demo client if URL is provided
export const prismaDemo = process.env.DATABASE_URL_DEMO ? new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_DEMO } },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
}) : null;


// Helper type for Request injection
export type DbContext = {
    prisma: PrismaClient;
    mode: 'real' | 'demo';
};
