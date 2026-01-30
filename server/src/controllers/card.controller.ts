import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export class CardController {
    static async list(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const cards = await req.db.prisma.card.findMany({
                where: { user_id: userId },
                include: { rules: true }
            });
            res.json(cards);
        } catch (error) {
            console.error('List Cards Error:', error);
            res.status(500).json({ error: 'Failed to list cards' });
        }
    }

    static async search(req: Request, res: Response): Promise<void> {
        try {
            const query = req.query.q as string;
            if (!query) {
                res.json([]);
                return;
            }

            const cards = await req.db.prisma.refCard.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { issuer: { contains: query } }
                    ]
                },
                take: 10
            });

            const formatted = cards.map((c: any) => ({
                id: c.id,
                issuer: c.issuer,
                name: c.name,
                rewards: JSON.parse(c.rewards)
            }));

            res.json(formatted);
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Failed to search cards' });
        }
    }
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const { issuer, cardName, rewards } = req.body;
            const userId = (req as any).user.userId;

            // Basic validation
            if (!issuer || !cardName) {
                res.status(400).json({ error: 'Issuer and Card Name are required' });
                return;
            }

            const card = await req.db.prisma.card.create({
                data: {
                    user: { connect: { id: userId } },
                    issuer,
                    nickname: cardName,
                    card_type: 'credit',
                    rules: {
                        create: rewards.map((r: any) => ({
                            category: r.category,
                            multiplier: r.multiplier
                        }))
                    }
                }
            });

            res.json(card);
        } catch (error) {
            console.error('Create Card Error:', error);
            res.status(500).json({ error: 'Failed to create card' });
        }
    }

    static async delete(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = (req as any).user.userId;

            // Verify ownership
            const count = await req.db.prisma.card.count({
                where: { id, user_id: userId }
            });

            if (count === 0) {
                res.status(404).json({ error: 'Card not found or unauthorized' });
                return;
            }

            await req.db.prisma.card.delete({
                where: { id }
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Delete Card Error:', error);
            res.status(500).json({ error: 'Failed to delete card' });
        }
    }
    // --- TOP CARDS (SCRAPING) ---
    static async getTopCards(req: Request, res: Response): Promise<void> {
        try {
            // 1. Fetch Cards
            const cards = await req.db.prisma.refCard.findMany({
                orderBy: { name: 'asc' }
            });

            // 2. Fetch Metadata (Last Updated)
            // Use MAX(updatedAt) from RefCard as the "Last Updated" timestamp
            const aggregations = await req.db.prisma.refCard.aggregate({
                _max: { updatedAt: true }
            });

            // 3. Fetch Latest Job Status
            const [lastJob] = await req.db.prisma.$queryRawUnsafe<any[]>(`
                SELECT * FROM scrape_jobs 
                ORDER BY started_at DESC 
                LIMIT 1
            `);

            res.json({
                cards: cards.map((c: any) => ({
                    ...c,
                    // Parse rewards if it's stored as JSON string, but schema says String.
                    rewards: typeof c.rewards === 'string' ? JSON.parse(c.rewards) : c.rewards,
                    // Ensure camelCase (already mapped in Prisma)
                    imageUrl: c.imageUrl,
                    applyUrl: c.applyUrl,
                    annualFee: c.annualFee,
                    apr: c.apr,
                    welcomeBonus: c.welcomeBonus,
                    minSpend: c.minSpend
                })),
                last_updated_at: aggregations._max.updatedAt || new Date(0),
                scrape_status: lastJob || { status: 'idle', progress: 0, last_error: null }
            });
        } catch (error) {
            console.error('Get Top Cards Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }

    static async resyncTopCards(req: Request, res: Response): Promise<void> {
        try {
            const { ScraperService } = await import('../services/scraper.service');
            const jobId = await ScraperService.startJob(req.db.prisma);
            res.json({ job_id: jobId, status: 'queued' });
        } catch (error) {
            console.error('Resync Error:', error);
            res.status(500).json({ error: 'Failed to start resync' });
        }
    }

    static async getSyncStatus(req: Request, res: Response): Promise<void> {
        try {
            const jobId = req.query.job_id as string;
            if (!jobId) {
                res.status(400).json({ error: 'job_id required' });
                return;
            }

            const { ScraperService } = await import('../services/scraper.service');
            const job = await ScraperService.getStatus(req.db.prisma, jobId);

            if (!job) {
                res.status(404).json({ error: 'Job not found' });
                return;
            }

            res.json(job);
        } catch (error) {
            console.error('Sync Status Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
}
