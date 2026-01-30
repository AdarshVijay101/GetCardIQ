import { Request, Response } from 'express';
// const prisma = new PrismaClient(); // REMOVED: Injected via middleware

export const DashboardController = {
    getSummary: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;

            // 1. KPI Strip Data
            const earnedAgg = await req.db.prisma.transaction.aggregate({
                where: { user_id: userId },
                _sum: {
                    amount: true,
                    estimated_points_earned: true
                }
            });

            const totalSpend = Number(earnedAgg._sum.amount) || 0;
            const rewardsEarned = Number(earnedAgg._sum.estimated_points_earned) || 0;

            const moneyLeftBehind = await req.db.prisma.transaction.aggregate({
                where: { user_id: userId },
                _sum: { potential_extra_value: true }
            });

            // 2. Money Left Behind Panel
            const missedOpportunities = await req.db.prisma.transaction.findMany({
                where: { user_id: userId, potential_extra_value: { gt: 0 } },
                orderBy: { date: 'desc' },
                take: 5,
                include: { recommended_card: true }
            });

            // 3. Alerts
            const alerts = await req.db.prisma.notification.findMany({
                where: { user_id: userId, is_read: false },
                orderBy: { created_at: 'desc' },
                take: 5
            });

            // 4. Best Card Hero 
            const topCategory = await req.db.prisma.transaction.groupBy({
                by: ['category'],
                where: { user_id: userId },
                _sum: { amount: true },
                orderBy: { _sum: { amount: 'desc' } },
                take: 1
            });

            // 5. Utilization & Net Worth
            // 5a. Fetch All Accounts (Assets & Liabilities)
            const allAccounts = await req.db.prisma.card.findMany({
                where: { user_id: userId }
            });

            // 5b. Calculate Totals
            const assets = allAccounts
                .filter(acc => acc.card_type === 'depository')
                .reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0);

            const liabilities = allAccounts
                .filter(acc => acc.card_type === 'credit')
                .reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0);

            const totalLimit = allAccounts
                .filter(acc => acc.card_type === 'credit')
                .reduce((sum, acc) => sum + Number(acc.credit_limit || 0), 0);

            const utilization = totalLimit > 0 ? (liabilities / totalLimit * 100) : 0;

            // Net Worth = Assets - Liabilities
            const netWorth = assets - liabilities;

            // 6. Expiring Credits
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const expiringBenefits = await req.db.prisma.cardBenefit.aggregate({
                where: { card: { user_id: userId }, expiration_date: { gte: new Date(), lte: thirtyDaysFromNow } },
                _sum: { benefit_value: true }
            });

            // 7. UX Overhaul Additions
            const goals = await req.db.prisma.goal.findMany({ where: { user_id: userId, status: 'ACTIVE' } });
            const budget = await req.db.prisma.budget.findUnique({ where: { user_id: userId } });
            const creditScore = await req.db.prisma.creditScoreProfile.findUnique({ where: { user_id: userId } });

            // Calc budget usage (month to date)
            const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
            const monthlySpendAgg = await req.db.prisma.transaction.aggregate({
                where: { user_id: userId, date: { gte: startOfMonth } },
                _sum: { amount: true }
            });
            const monthlySpend = Number(monthlySpendAgg._sum.amount || 0);

            res.json({
                kpi: {
                    rewards_earned: Math.floor(rewardsEarned),
                    rewards_rate: totalSpend > 0 ? (rewardsEarned / totalSpend * 100).toFixed(1) : 0,
                    money_left_behind: Number(moneyLeftBehind._sum.potential_extra_value || 0),
                    expiring_value: Number(expiringBenefits._sum.benefit_value || 0),
                    utilization: utilization.toFixed(1),
                    net_worth: netWorth,
                    credit_score: creditScore?.score || 0,
                    monthly_spend: monthlySpend,
                    budget_limit: Number(budget?.monthly_limit || 0),
                    active_goals: goals.length
                },
                missed_opportunities: missedOpportunities.map(tx => ({
                    merchant: tx.merchant_name,
                    amount: tx.amount,
                    lost_value: tx.potential_extra_value,
                    date: tx.date,
                    recommended_card: tx.recommended_card?.nickname || 'Better Card'
                })),
                alerts: alerts,
                top_spend_category: topCategory[0]?.category || 'Dining',
                goals_summary: goals.map(g => ({ name: g.name, current: g.current_amount, target: g.target_amount }))
            });

        } catch (error) {
            console.error('Dashboard Error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard data' });
        }
    },

    getRecentTransactions: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const limit = Number(req.query.limit) || 20;

            const txs = await req.db.prisma.transaction.findMany({
                where: { user_id: userId },
                orderBy: { date: 'desc' },
                take: limit,
                include: { recommended_card: true }
            });

            res.json(txs);
        } catch (error) {
            console.error('Transactions Error:', error);
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    },

    getSpendAnalytics: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const mode = req.query.mode as string || 'monthly';

            // STRICT REQUIREMENT: ALWAYS 30 BINS
            const BIN_COUNT = 30;

            // 1. Determine Date Range
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (mode === 'custom' && req.query.start && req.query.end) {
                startDate = new Date(req.query.start as string);
                endDate = new Date(req.query.end as string);
            } else if (mode === 'yearly') {
                startDate.setFullYear(now.getFullYear() - 1);
            } else if (mode === 'quarterly') {
                startDate.setDate(now.getDate() - 90);
            } else {
                // Default: Last 30 days
                startDate.setDate(now.getDate() - 30);
            }

            // Normalize Constraints
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            const totalDurationMs = endDate.getTime() - startDate.getTime();

            // 2. Fetch Transactions (DB)
            const transactions = await req.db.prisma.transaction.findMany({
                where: {
                    user_id: userId,
                    amount: { not: 0 },
                    date: { gte: startDate, lte: endDate }
                },
                select: { date: true, amount: true }
            });

            // 3. Binning Logic (Array of 30)
            const bins = new Array(BIN_COUNT).fill(0).map((_, i) => ({
                amount: 0,
                // Center of the bin for labeling, or start
                dateMs: startDate.getTime() + (totalDurationMs * (i / BIN_COUNT))
            }));

            // Distribute into bins
            transactions.forEach(tx => {
                const txTime = new Date(tx.date).getTime();
                const ratio = (txTime - startDate.getTime()) / totalDurationMs;
                let index = Math.floor(ratio * BIN_COUNT);

                // Clamp
                if (index < 0) index = 0;
                if (index >= BIN_COUNT) index = BIN_COUNT - 1;

                // Accumulate absolute spend
                bins[index].amount += Math.abs(Number(tx.amount));
            });

            // 4. Cumulative & Label
            let runningTotal = 0;
            const chartData = bins.map(bin => {
                runningTotal += bin.amount;
                const dateObj = new Date(bin.dateMs);

                // Smart Label
                let label = '';
                if (mode === 'yearly') {
                    label = dateObj.toLocaleDateString('en-US', { month: 'short' });
                } else if (mode === 'quarterly') {
                    label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else {
                    label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }

                return {
                    period: label,
                    amount: Number(runningTotal.toFixed(2)) // Clean float, Cumulative
                };
            });

            res.json(chartData);

        } catch (error) {
            console.error('Analytics Error:', error);
            // Fallback empty 30 points on error
            res.json(new Array(30).fill(0).map((_, i) => ({ period: `${i}`, amount: 0 })));
        }
    },

    getRecommendation: async (req: Request, res: Response) => {
        // PERFORMANCE: Must respond < 200ms
        const start = Date.now();
        try {
            const userId = (req as any).user.userId;
            const category = (req.query.category as string || 'dining').toLowerCase();

            // 1. OWNED CARD (Fast DB Query)
            const bestRule = await req.db.prisma.cardRewardRule.findFirst({
                where: {
                    card: { user_id: userId },
                    category: { contains: category }
                },
                orderBy: { multiplier: 'desc' },
                include: { card: true }
            });

            let ownedBest = {
                card: 'Your Debit Card',
                multiplier: '1x',
                why: 'No rewards card found',
                img: 'bg-gray-500'
            };

            if (bestRule) {
                ownedBest = {
                    card: bestRule.card.nickname,
                    multiplier: `${bestRule.multiplier}x`,
                    why: `Earns ${bestRule.multiplier}x on ${category}`,
                    img: 'bg-gradient-to-br from-indigo-500 to-purple-600'
                };
            } else {
                // Fallback to highest base
                const bestBase = await req.db.prisma.card.findFirst({
                    where: { user_id: userId },
                    orderBy: { base_multiplier: 'desc' }
                });
                if (bestBase) {
                    ownedBest = {
                        card: bestBase.nickname,
                        multiplier: `${bestBase.base_multiplier}x`,
                        why: 'Best base rate',
                        img: 'bg-gradient-to-br from-blue-600 to-blue-800'
                    };
                }
            }

            // 2. SUGGESTED CARD (Static Lookup - Instant)
            const SUGGESTIONS: Record<string, any> = {
                'dining': { card: 'Amex Gold', multiplier: '4x', why: 'Industry leading dining rewards', img: 'bg-yellow-500' },
                'grocery': { card: 'Amex Blue Cash Pref', multiplier: '6x', why: 'Unbeatable 6% on groceries', img: 'bg-blue-400' },
                'travel': { card: 'Chase Sapphire Reserve', multiplier: '3x', why: 'Premium travel protection', img: 'bg-blue-900' },
                'gas': { card: 'Citi Custom Cash', multiplier: '5x', why: 'Automatic 5% on top category', img: 'bg-green-600' },
                'online': { card: 'Amazon Prime Visa', multiplier: '5%', why: '5% back at Amazon', img: 'bg-gray-800' }
            };

            const suggestedBest = SUGGESTIONS[category] || {
                card: 'Citi Double Cash', multiplier: '2%', why: 'Flat 2% on everything', img: 'bg-green-400'
            };

            res.json({
                owned: ownedBest,
                suggested: suggestedBest,
                _latency: Date.now() - start
            });

        } catch (error) {
            console.error('Rec Error:', error);
            // Safe fallback Response
            res.json({
                owned: { card: 'Cash', multiplier: '1x', why: 'System error', img: 'bg-gray-400' },
                suggested: { card: 'Check Connection', multiplier: '?', why: 'Offline', img: 'bg-red-400' }
            });
        }
    },

    getActions: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;

            const actions = [];

            // 1. Uncategorized Transactions
            const uncategorizedCount = await req.db.prisma.transaction.count({
                where: { user_id: userId, category: 'Uncategorized' }
            });

            if (uncategorizedCount > 0) {
                actions.push({
                    id: 'uncategorized',
                    title: 'Categorize Transactions',
                    subtitle: `${uncategorizedCount} transactions need review`,
                    status: 'OPEN',
                    link: '/transactions?filter=uncategorized'
                });
            }

            // 2. Missing Profile Info (Income/Score)
            const profile = await req.db.prisma.userProfile.findUnique({ where: { user_id: userId } });
            if (!profile || !profile.income_range) {
                actions.push({
                    id: 'profile-setup',
                    title: 'Complete Financial Profile',
                    subtitle: 'Add income to get better insights',
                    status: 'OPEN',
                    link: '/profile'
                });
            }

            // 3. New Account: Set Goals
            const goalCount = await req.db.prisma.goal.count({ where: { user_id: userId } });
            if (goalCount === 0) {
                actions.push({
                    id: 'create-goal',
                    title: 'Set Your First Goal',
                    subtitle: 'Start saving for something big',
                    status: 'OPEN',
                    link: '/goals'
                });
            }

            // 4. Monthly Review
            const today = new Date();
            if (today.getDate() < 5) {
                actions.push({
                    id: 'monthly-review',
                    title: 'Review Last Month',
                    subtitle: 'Check your spending summary',
                    status: 'OPEN',
                    link: '/dashboard'
                });
            }

            // 5. Check rewards setup (Cards without rules)
            // Logic: Cards where we haven't defined point values or categories
            // Simplified: Just check if we created any custom rules? 
            // Better: Check if any card has 0 base multiplier or similar

            res.json(actions);

        } catch (error) {
            console.error('Actions Error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
};
