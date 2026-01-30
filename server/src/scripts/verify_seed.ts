
import { PrismaClient } from '@prisma/client';
import { prismaDemo } from '../db/prisma';

async function verify() {
    console.log('🔍 Verifying Demo Seed...');
    if (!prismaDemo) {
        console.error('No Demo DB Configured');
        return;
    }

    await prismaDemo.$connect();

    const userCount = await prismaDemo.user.count();
    const cardCount = await prismaDemo.card.count();
    const txCount = await prismaDemo.transaction.count();
    const rewardLedgerCount = await prismaDemo.rewardLedger.count();

    console.log({
        userCount,
        cardCount,
        txCount,
        rewardLedgerCount,
        expectedUser: 'demo-user-year-1'
    });

    if (txCount > 500) {
        console.log('✅ Seed Validation Passed (Transactions > 500)');

        // Sample Data Check
        const samples = await prismaDemo.transaction.findMany({
            take: 3,
            select: { date: true, merchant_name: true, amount: true, category: true, estimated_points_earned: true }
        });
        console.log('📊 Sample Transactions:', samples);

        // Rewards Check
        const withRewards = await prismaDemo.transaction.count({
            where: { estimated_points_earned: { gt: 0 } }
        });
        console.log(`🏆 Transactions with Rewards: ${withRewards} / ${txCount}`);

    } else {
        console.error('❌ Seed Validation Failed (Too few transactions)');
    }

    await prismaDemo.$disconnect();
}

verify();
