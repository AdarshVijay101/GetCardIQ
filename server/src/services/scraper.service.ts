import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { REAL_CARDS } from '../data/real_cards_data';

// const prisma = new PrismaClient(); // REMOVED: Injected

export const ScraperService = {
    // 1. Start Job
    startJob: async (prisma: PrismaClient): Promise<string> => {
        const jobId = uuidv4();
        await prisma.$executeRawUnsafe(`
            INSERT INTO scrape_jobs (id, kind, status, progress, started_at)
            VALUES ('${jobId}', 'top_cards', 'queued', 0, NOW())
        `);
        // Fire and forget
        ScraperService.run(prisma, jobId).catch(err => console.error("Job failed detached:", err));
        return jobId;
    },

    // 2. Get Status
    getStatus: async (prisma: PrismaClient, jobId: string) => {
        const rows: any[] = await prisma.$queryRawUnsafe(`
            SELECT * FROM scrape_jobs WHERE id = '${jobId}'
        `);
        return rows[0] || null;
    },

    // 3. Execution Engine
    run: async (prisma: PrismaClient, jobId: string) => {
        try {
            console.log(`[Scraper] Job ${jobId} started.`);
            await ScraperService.updateProgress(prisma, jobId, 'running', 0);

            const total = REAL_CARDS.length;

            for (let i = 0; i < total; i++) {
                const card = REAL_CARDS[i];

                // --- Upsert Logic ---
                await prisma.refCard.upsert({
                    where: { issuer_name: { issuer: card.issuer, name: card.name } },
                    update: {
                        imageUrl: card.imageUrl,
                        applyUrl: card.applyUrl,
                        annualFee: card.annualFee,
                        apr: card.apr,
                        welcomeBonus: card.welcomeBonus,
                        minSpend: card.minSpend,
                        rewards: JSON.stringify(card.rewards),
                        updatedAt: new Date()
                    },
                    create: {
                        issuer: card.issuer,
                        name: card.name,
                        imageUrl: card.imageUrl,
                        applyUrl: card.applyUrl,
                        annualFee: card.annualFee,
                        apr: card.apr,
                        welcomeBonus: card.welcomeBonus,
                        minSpend: card.minSpend,
                        rewards: JSON.stringify(card.rewards),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });

                // --- Progress Update ---
                const progress = Math.round(((i + 1) / total) * 100);
                await ScraperService.updateProgress(prisma, jobId, 'running', progress);

                // Simulate "work" so the UI progress bar is visible to the user
                if (i % 5 === 0) await new Promise(r => setTimeout(r, 100));
            }

            console.log(`[Scraper] Job ${jobId} completed. Processed ${total} cards.`);
            await ScraperService.updateProgress(prisma, jobId, 'completed', 100);

        } catch (error: any) {
            console.error(`[Scraper] Job ${jobId} crashed:`, error);
            await prisma.$executeRawUnsafe(`
                UPDATE scrape_jobs 
                SET status = 'failed', 
                last_error = '${error.message.replace(/'/g, "''")}',
                finished_at = NOW()
            `);
        }
    },

    updateProgress: async (prisma: PrismaClient, jobId: string, status: string, progress: number) => {
        const finishedSql = (status === 'completed' || status === 'failed') ? ", finished_at = NOW()" : "";
        await prisma.$executeRawUnsafe(`
            UPDATE scrape_jobs 
            SET status = '${status}', progress = ${progress} ${finishedSql}
            WHERE id = '${jobId}'
        `);
    }
};
