
import { PrismaClient } from '@prisma/client';
import { BenefitsController } from './controllers/benefits.controller';
import { RewardsController } from './controllers/rewards.controller';
import { CardController } from './controllers/card.controller';
import { InsightsController } from './controllers/insights.controller';
import { ProfileController } from './controllers/profile.controller';

const prisma = new PrismaClient();

// MOCK Express Objects
const makeReq = (userId: string, body = {}) => ({
    user: { userId },
    body,
    query: {}
} as any);

const makeRes = (label: string) => ({
    json: (data: any) => console.log(`[${label}] Success:`, Array.isArray(data) ? `Array(${data.length})` : 'Object'),
    status: (code: number) => ({
        json: (data: any) => console.log(`[${label}] Status ${code}:`, JSON.stringify(data).slice(0, 100))
    })
} as any);

async function run() {
    console.log("=== FINAL SYSTEM VERIFICATION ===");

    // 1. Get User
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("FATAL: No user found.");
        return;
    }
    console.log(`User: ${user.email} (${user.id})`);

    try {
        // --- PART B: Top Cards ---
        console.log("\n--- B) Top Cards ---");
        await CardController.getTopCards(makeReq(user.id), makeRes('TopCards'));

        // --- PART C: Recurring ---
        console.log("\n--- C) Recurring ---");
        await InsightsController.getRecurring(makeReq(user.id), makeRes('Recurring'));

        // --- PART D: Rewards ---
        console.log("\n--- D) Rewards ---");
        await RewardsController.getSummary(makeReq(user.id), makeRes('RewardsSummary'));
        await RewardsController.getBreakdown(makeReq(user.id), makeRes('RewardsBreakdown'));

        // --- PART E: Benefits ---
        console.log("\n--- E) Benefits ---");
        await BenefitsController.getBenefitStatus(makeReq(user.id), makeRes('BenefitsStatus'));
        await BenefitsController.getMissedRewards(makeReq(user.id), makeRes('MissedRewards'));

        // --- PART G: Dashboard ---
        console.log("\n--- G) Dashboard ---");
        // We didn't export DashboardController methods as static in step 1797?
        // Let's check imports. Wait, Step 1797 showed `export const DashboardController = { ... }`.
        // So I need to import it properly.
        const { DashboardController } = await import('./controllers/dashboard.controller');
        await DashboardController.getSummary(makeReq(user.id), makeRes('Dashboard'));

        // --- PART H: Profile ---
        console.log("\n--- H) Profile ---");
        await ProfileController.getProfile(makeReq(user.id), makeRes('ProfileGet'));
        // Test Update
        await ProfileController.updateProfile(
            makeReq(user.id, { full_name: "Verification User", income_range: "150k+" }),
            makeRes('ProfileUpdate')
        );

    } catch (e) {
        console.error("Verification Failed:", e);
    }

    console.log("\n=== VERIFICATION COMPLETE ===");
}

run().catch(console.error);
