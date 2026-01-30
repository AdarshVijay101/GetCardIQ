
import { PrismaClient } from '@prisma/client';
import { CardController } from './controllers/card.controller';
import { RewardsController } from './controllers/rewards.controller';
import { BenefitsController } from './controllers/benefits.controller';
import { InsightsController } from './controllers/insights.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { ProfileController } from './controllers/profile.controller';

const prisma = new PrismaClient();

const mockRes = (label: string) => ({
    json: (data: any) => console.log(`[${label}] Output:`, JSON.stringify(data).slice(0, 500)),
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

async function run() {
    console.log("=== FINAL AUDIT RUN ===");

    // 0. User Check
    const user = await prisma.user.findFirst();
    if (!user) { console.log("No User"); return; }
    console.log(`User: ${user.email}`);

    // 1. TOP CARDS
    console.log("\n--- 1. Top Cards ---");
    const jobs = await prisma.$queryRaw`SELECT count(*) as count FROM scrape_jobs`;
    console.log("Jobs Count:", jobs);
    await CardController.getTopCards(mockReq(user.id), mockRes('TopCards'));

    // 2. ANALYTICS
    console.log("\n--- 2. Analytics ---");
    await DashboardController.getSummary(mockReq(user.id), mockRes('DashSummary'));

    // 3. RECURRING
    console.log("\n--- 3. Recurring ---");
    await InsightsController.getRecurring(mockReq(user.id), mockRes('Recurring'));

    // 4. REWARDS
    console.log("\n--- 4. Rewards ---");
    await RewardsController.getSummary(mockReq(user.id), mockRes('RewardsSummary'));

    // 5. MONEY LEFT BEHIND
    console.log("\n--- 5. Money Left Behind ---");
    await BenefitsController.getMissedRewards(mockReq(user.id), mockRes('Missed'));

    // 6. CREDITS
    console.log("\n--- 6. Credits ---");
    await BenefitsController.getBenefitStatus(mockReq(user.id), mockRes('Credits'));

    // 7. PROFILE
    console.log("\n--- 7. Profile ---");
    await ProfileController.getProfile(mockReq(user.id), mockRes('Profile'));

    console.log("\n=== DONE ===");
}

run().catch(e => console.error("CRASH:", e));
