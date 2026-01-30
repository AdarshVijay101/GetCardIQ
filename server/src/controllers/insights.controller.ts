
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GeminiCategorizer } from '../services/ai/geminiCategorizer';
import { RewardsEstimationService } from '../services/rewards/estimation';

// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export const InsightsController = {
    // --- 1. SPENDING ANALYTICS (Monthly Trends + Top Categories) ---
    getSpending: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const window = req.query.window as string || '6m'; // 6m, 1y

            let startDate = new Date();
            if (window === '1y') startDate.setFullYear(startDate.getFullYear() - 1);
            else startDate.setMonth(startDate.getMonth() - 6);

            // Fetch Transacitons
            const txns = await req.db.prisma.transaction.findMany({
                where: { user_id: userId, date: { gte: startDate }, amount: { not: 0 } },
                orderBy: { date: 'asc' }
            });

            // A. Monthly Trends
            const trendsMap = new Map<string, { spend: number, rewards: number }>();

            txns.forEach(t => {
                const key = t.date.toISOString().slice(0, 7); // YYYY-MM
                const curr = trendsMap.get(key) || { spend: 0, rewards: 0 };
                trendsMap.set(key, {
                    spend: curr.spend + Number(t.amount),
                    rewards: curr.rewards + (t.estimated_value_cents ? t.estimated_value_cents / 100 : 0)
                });
            });

            const monthly_trends = Array.from(trendsMap.entries()).map(([month, data]) => ({
                month,
                spend: Number(data.spend.toFixed(2)),
                rewards: Number(data.rewards.toFixed(2))
            })).sort((a, b) => a.month.localeCompare(b.month));

            // B. Top Categories
            const catMap = new Map<string, { spend: number, rewards: number }>();
            txns.forEach(t => {
                const cat = t.category || 'Uncategorized';
                const curr = catMap.get(cat) || { spend: 0, rewards: 0 };
                catMap.set(cat, {
                    spend: curr.spend + Number(t.amount),
                    rewards: curr.rewards + (t.estimated_value_cents ? t.estimated_value_cents / 100 : 0)
                });
            });

            const top_categories = Array.from(catMap.entries()).map(([category, data]) => ({
                category,
                spend: Number(data.spend.toFixed(2)),
                rewards: Number(data.rewards.toFixed(2))
            })).sort((a, b) => b.spend - a.spend).slice(0, 5);

            res.json({ monthly_trends, top_categories });
        } catch (error) {
            console.error("Spending Analytics Error:", error);
            res.status(500).json({ error: 'Failed' });
        }
    },

    // --- 2. LEDGER (Transactions + Rewards) ---
    getLedger: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const [total, txns] = await req.db.prisma.$transaction([
                req.db.prisma.transaction.count({ where: { user_id: userId } }),
                req.db.prisma.transaction.findMany({
                    where: { user_id: userId },
                    include: { card_used: true },
                    orderBy: { date: 'desc' },
                    skip,
                    take: limit
                })
            ]);

            const ledgerParams = txns.map(t => ({
                id: t.id,
                date: t.date,
                merchant: t.merchant_name,
                category: t.category,
                amount: Number(t.amount),
                card_name: t.card_used?.nickname || t.card_used?.issuer || 'Unknown',
                reward_points: t.estimated_points_earned || 0,
                reward_value: t.estimated_value_cents ? t.estimated_value_cents / 100 : 0,
                ai_confidence: t.ai_confidence
            }));

            res.json({ data: ledgerParams, total, page, totalPages: Math.ceil(total / limit) });
        } catch (error) {
            console.error("Ledger Error:", error);
            res.status(500).json({ error: 'Failed' });
        }
    },

    getSpendData: async (req: Request, res: Response) => {
        // Deprecated alias for legacy calls, mapped to getSpending if needed, 
        // but keeping simplistic version for HealthPanel compatibility if it uses it.
        // Actually, let's redirect to getSpending logic but return simpler array.
        return InsightsController.getSpending(req, res);
    },

    categorizeAndEstimate: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;

            // 1. Categorize new txns
            // Fetch uncategorized
            const uncategorized = await req.db.prisma.transaction.findMany({
                where: { user_id: userId, category: null },
                take: 50
            });

            const { AIService } = await import('../services/ai.service');
            const catCount = await AIService.categorizeBatch(req.db.prisma, uncategorized);

            // 2. Re-estimate rewards
            const estCount = await RewardsEstimationService.recomputeForUser(req.db.prisma, userId);

            res.json({ categorized: catCount, estimated: estCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to run insights job' });
        }
    },

    getRecurring: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;

            // 1. Fetch deep history (up to 12 months)
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const txns = await req.db.prisma.transaction.findMany({
                where: { user_id: userId, date: { gte: oneYearAgo }, amount: { gt: 0 } },
                orderBy: { date: 'asc' }
            });

            // 2. Group by merchant
            const merchantGroups: Record<string, any[]> = {};
            txns.forEach((t: any) => {
                const key = t.merchant_name.toLowerCase().trim();
                if (!merchantGroups[key]) merchantGroups[key] = [];
                merchantGroups[key].push(t);
            });

            // 3. Analyze Patterns
            const subscriptions: any[] = [];
            const KNOWN_SUBSCRIPTIONS = ['netflix', 'spotify', 'hulu', 'disney+', 'hbomax', 'apple', 'google storage', 'aws', 'adobe', 'gym', 'fitness', 'internet', 'comcast', 'verizon', 't-mobile', 'at&t'];

            for (const [key, group] of Object.entries(merchantGroups)) {
                // Heuristic: At least 3 transactions to establish a pattern
                if (group.length < 3) continue;

                const amounts = group.map((t: any) => Number(t.amount));
                const dates = group.map((t: any) => new Date(t.date));

                // A. Amount consistency
                // Allow small variance (e.g. $14.99 vs $15.00 or tax changes)
                const avgAmt = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
                const isStableAmount = amounts.every((a: number) => Math.abs(a - avgAmt) / avgAmt < 0.15); // 15% tolerance

                if (!isStableAmount && !KNOWN_SUBSCRIPTIONS.some(sub => key.includes(sub))) {
                    // If amount varies wildly and not a known sub, skip
                    continue;
                }

                // B. Interval consistency
                const intervals: number[] = [];
                for (let i = 1; i < dates.length; i++) {
                    const diffTime = Math.abs(dates[i].getTime() - dates[i - 1].getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    intervals.push(diffDays);
                }

                const avgInterval = intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length;

                // Check deviation
                const isRegular = intervals.every((d: number) => Math.abs(d - avgInterval) < 5); // +/- 5 days variance allowed

                if (!isRegular) continue;

                // Determine Frequency
                let frequency = 'Unknown';
                if (avgInterval >= 25 && avgInterval <= 35) frequency = 'Monthly';
                else if (avgInterval >= 6 && avgInterval <= 8) frequency = 'Weekly';
                else if (avgInterval >= 350 && avgInterval <= 380) frequency = 'Yearly';
                else if (avgInterval >= 13 && avgInterval <= 15) frequency = 'Bi-Weekly';
                else continue; // Irregular interval we don't track

                // Predict Next
                const lastDate = dates[dates.length - 1];
                const nextDate = new Date(lastDate);
                nextDate.setDate(lastDate.getDate() + Math.round(avgInterval));

                subscriptions.push({
                    id: group[0].merchant_name, // Use name as ID for UI
                    merchant_name: group[0].merchant_name,
                    amount: avgAmt.toFixed(2),
                    frequency,
                    last_paid: lastDate,
                    next_due: nextDate,
                    category: group[0].category || 'Subscription',
                    confidence: 0.9 // High confidence if we passed strict checks
                });
            }

            // Sort by next due date (soonest first)
            subscriptions.sort((a: any, b: any) => a.next_due.getTime() - b.next_due.getTime());

            res.json(subscriptions);
        } catch (error) {
            console.error('Recurring Error:', error);
            res.status(500).json({ error: 'Failed to fetch recurring' });
        }
    }
};

