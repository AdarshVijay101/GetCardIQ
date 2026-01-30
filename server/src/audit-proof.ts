
import { PrismaClient } from '@prisma/client';
import { CardController } from './controllers/card.controller';
import { RewardsController } from './controllers/rewards.controller';
import { BenefitsController } from './controllers/benefits.controller';
import { InsightsController } from './controllers/insights.controller';
import { DashboardController } from './controllers/dashboard.controller'; // Note: Check export type
import { ProfileController } from './controllers/profile.controller';

const prisma = new PrismaClient();

// Mocks
const mockRes = (label: string) => ({
    json: (data: any) => console.log(`[${label}] JSON:`, JSON.stringify(data, null, 2).slice(0, 1000)), // Limit output
    status: (code: number) => ({
        json: (data: any) => console.log(`[${label}] Status ${code}:`, JSON.stringify(data).slice(0, 500))
    })
} as any);

const mockReq = (userId: string, body = {}, query = {}) => ({
    user: { userId },
    body,
    query,
    headers: {},
    ip: '127.0.0.1'
} as any);

async function generateProof() {
    console.log("=== GENERATING AUDIT PROOF ===");

    const user = await prisma.user.findFirst();
    if (!user) { console.error("FATAL: No user found"); return; }
    console.log(`Target User: ${user.id} (${user.email})`);

    // 1. TOP CARDS
    console.log("\n--- 1. TOP CARDS ---");
    // DB Counts
    const jobCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM scrape_jobs`;
    console.log("DB: scrape_jobs count:", jobCount);
    const refCardCount = await prisma.refCard.count();
    console.log("DB: RefCard count:", refCardCount);
    // API Call
    await CardController.getTopCards(mockReq(user.id), mockRes('TopCards'));
    // Check Apply URLs & Images
    const sampleCards = await prisma.refCard.findMany({ take: 3, select: { name: true, apply_url: true, image_url: true } });
    console.log("Sample Cards Data:", sampleCards);

    // 2. ANALYTICS (Spending)
    console.log("\n--- 2. ANALYTICS ---");
    await DashboardController.getSpendAnalytics(mockReq(user.id, {}, { mode: 'monthly' }), mockRes('SpendAnalytics'));

    // 3. RECURRING
    console.log("\n--- 3. RECURRING ---");
    await InsightsController.getRecurring(mockReq(user.id), mockRes('Recurring'));

    // 4. REWARDS HUB
    console.log("\n--- 4. REWARDS HUB ---");
    await RewardsController.getSummary(mockReq(user.id), mockRes('RewardsSummary'));

    // 5. MONEY LEFT BEHIND
    console.log("\n--- 5. MONEY LEFT BEHIND ---");
    await BenefitsController.getMissedRewards(mockReq(user.id), mockRes('MissedRewards'));

    // 6. CREDITS & ALERTS
    console.log("\n--- 6. CREDITS ---");
    await BenefitsController.getBenefitStatus(mockReq(user.id), mockRes('BenefitStatus'));
    const alerts = await prisma.notification.findMany({ where: { user_id: user.id }, take: 3 });
    console.log("DB: Alerts:", alerts);

    // 7. DASHBOARD (No Credit Score check)
    console.log("\n--- 7. DASHBOARD ---");
    await DashboardController.getSummary(mockReq(user.id), mockRes('DashboardSummary'));

    // 8. PROFILE
    console.log("\n--- 8. PROFILE ---");
    await ProfileController.getProfile(mockReq(user.id), mockRes('ProfileGet'));

    console.log("\n=== PROOF COMPLETE ===");
}

generateProof().catch(console.error);
