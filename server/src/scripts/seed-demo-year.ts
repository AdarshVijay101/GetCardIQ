
import { PrismaClient } from '@prisma/client';
import { prismaDemo } from '../db/prisma';
import { RewardsEstimationService } from '../services/rewards/estimation';
import { v4 as uuidv4 } from 'uuid';

// --- CONFIGURATION ---
const USER_ID = 'demo-user-year-1';
const START_DATE = new Date();
START_DATE.setFullYear(START_DATE.getFullYear() - 1); // 1 year ago

// --- DETERMINISTIC RANDOM (LCG) ---
let _seed = 12345;
const random = () => {
    _seed = (_seed * 9301 + 49297) % 233280;
    return _seed / 233280;
};
const randInt = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => random() * (max - min) + min;
const randItem = <T>(arr: T[]): T => arr[Math.floor(random() * arr.length)];
const randDate = (start: Date, end: Date) => new Date(start.getTime() + random() * (end.getTime() - start.getTime()));

// --- DATA DEFINITIONS ---

// Recurring Subscriptions
const SUBSCRIPTIONS = [
    { merchant: 'Netflix', amount: 15.49, category: 'Entertainment', day: 5 },
    { merchant: 'Spotify', amount: 11.99, category: 'Entertainment', day: 12 },
    { merchant: 'Gym', amount: 49.99, category: 'Health & Fitness', day: 1 },
    { merchant: 'AWS', amount: 35.50, category: 'Business Services', day: 28 },
    { merchant: 'ChatGPT Plus', amount: 20.00, category: 'Software', day: 15 }
];

// Recurring Bills
const BILLS = [
    { merchant: 'Comcast', amount: 85.00, category: 'Utilities', day: 20 },
    { merchant: 'Verizon', amount: 120.00, category: 'Utilities', day: 18 },
    { merchant: 'City Utilities', amount: 150.00, category: 'Utilities', day: 1 },
    { merchant: 'Apartment Rent', amount: 2400.00, category: 'Rent', day: 1 }
];

// Income
const PAYCHECKS = [
    { merchant: 'Employer Direct Dep', amount: -3500.00, category: 'Income', day: 15 },
    { merchant: 'Employer Direct Dep', amount: -3500.00, category: 'Income', day: 30 }
];

// Variable Spend Merchants
const MERCHANTS = {
    Dining: ['Uber Eats', 'DoorDash', 'Starbucks', 'Chipotle', 'Sweetgreen', 'Local Cafe', 'McDonalds'],
    Groceries: ['Whole Foods', 'Trader Joes', 'Safeway', 'Kroger', 'Target Groceries'],
    Travel: ['Delta Airlines', 'Uber', 'Lyft', 'Airbnb', 'Hilton', 'Amtrak'],
    Gas: ['Shell', 'Chevron', 'Exxon', 'Costco Gas'],
    Shopping: ['Amazon', 'Target', 'Walmart', 'Nike', 'Apple Store'],
    Entertainment: ['AMC Theaters', 'Steam', 'PlayStation'],
    Healthcare: ['CVS', 'Walgreens', 'Doctor Co-Pay']
};

// --- MAIN SCRIPT ---

async function main() {
    console.log('🌱 Starting Demo Data Seed (Yearly)...');

    const wipe = process.argv.includes('--wipe');

    if (!prismaDemo) {
        console.error('❌ DATABASE_URL_DEMO is not defined. Cannot seed.');
        process.exit(1);
    }

    try {
        await prismaDemo.$connect();

        if (wipe) {
            console.log('⚠️ Wiping Demo Database...');
            const tables = ['Transaction', 'Card', 'CardReward', 'CardRewardRule', 'User', 'PlaidConnection', 'Goal', 'Budget'];
            await prismaDemo.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);
            console.log('✅ Wiped.');
        }

        // 1. Create User
        console.log('👤 Creating Demo User...');
        // Upsert user
        const user = await prismaDemo.user.upsert({
            where: { email: 'demo@getcardiq.com' },
            update: {},
            create: {
                id: USER_ID,
                email: 'demo@getcardiq.com',
                password_hash: 'hashed_demo_secret',
                profile: {
                    create: {
                        full_name: 'Demo User',
                        updated_at: new Date()
                    }
                }
            }
        });

        // 2. Create Cards
        console.log('💳 Creating Cards...');
        const cardDefs = [
            {
                nickname: 'Amex Gold',
                issuer: 'AMEX',
                card_type: 'CREDIT',
                point_value_cents: 1.0,
                base_multiplier: 1.0,
                color: '#D4AF37',
                rules: [
                    { category: 'Dining', multiplier: 4.0 },
                    { category: 'Groceries', multiplier: 4.0 },
                    { category: 'Travel', multiplier: 3.0 }
                ]
            },
            {
                nickname: 'Chase Sapphire',
                issuer: 'CHASE',
                card_type: 'CREDIT',
                point_value_cents: 1.25,
                base_multiplier: 1.0,
                color: '#005AC2',
                rules: [
                    { category: 'Travel', multiplier: 2.0 },
                    { category: 'Dining', multiplier: 3.0 }
                ]
            },
            {
                nickname: 'Savor One',
                issuer: 'CAPITAL_ONE',
                card_type: 'CREDIT',
                point_value_cents: 1.0,
                base_multiplier: 1.0,
                color: '#FF4500',
                rules: [
                    { category: 'Dining', multiplier: 3.0 },
                    { category: 'Groceries', multiplier: 3.0 },
                    { category: 'Entertainment', multiplier: 3.0 }
                ]
            }
        ];

        const cards = [];
        for (const def of cardDefs) {
            // Check if exists
            const existing = await prismaDemo.card.findFirst({
                where: { user_id: user.id, nickname: def.nickname }
            });

            if (existing) {
                cards.push(existing);
            } else {
                const newCard = await prismaDemo.card.create({
                    data: {
                        user_id: user.id,
                        nickname: def.nickname,
                        issuer: def.issuer,
                        card_type: def.card_type,
                        point_value_cents: def.point_value_cents,
                        base_multiplier: def.base_multiplier,
                        color: def.color,
                        rules: {
                            create: def.rules
                        }
                    },
                    include: { rules: true }
                });
                cards.push(newCard);
            }
        }

        // 3. Generate Transactions
        console.log('📊 Generating Transactions (this may take a moment)...');
        const transactions = [];
        const today = new Date();
        const daysToGen = 365;

        for (let i = 0; i < daysToGen; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // A. Recurring Subscriptions
            for (const sub of SUBSCRIPTIONS) {
                if (date.getDate() === sub.day) {
                    transactions.push({
                        user_id: user.id,
                        date: date,
                        merchant_name: sub.merchant,
                        amount: sub.amount,
                        category: sub.category,
                        card_used_id: cards[1].id // Put all subs on Sapphire for example
                    });
                }
            }

            // B. Recurring Bills
            for (const bill of BILLS) {
                if (date.getDate() === bill.day) {
                    transactions.push({
                        user_id: user.id,
                        date: date,
                        merchant_name: bill.merchant,
                        amount: bill.amount,
                        category: bill.category,
                        card_used_id: cards[0].id // Amex
                    });
                }
            }

            // C. Variable Spend (Randomly 0-4 txns per day)
            const dailyCount = randInt(0, 4);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = date.getMonth() === 11; // Dec

            const adjustedCount = dailyCount + (isWeekend ? 1 : 0) + (isHoliday ? 1 : 0);

            for (let j = 0; j < adjustedCount; j++) {
                // Pick category
                const catKeys = Object.keys(MERCHANTS);
                const cat = randItem(catKeys);
                const merchant = randItem(MERCHANTS[cat as keyof typeof MERCHANTS]);

                // Random Amount logic
                let amount = randFloat(5, 50);
                if (cat === 'Groceries') amount = randFloat(40, 200);
                if (cat === 'Travel') amount = randFloat(20, 300);

                // Pick random card
                const card = randItem(cards);

                transactions.push({
                    user_id: user.id,
                    date: date,
                    merchant_name: merchant,
                    amount: Number(amount.toFixed(2)),
                    category: cat,
                    card_used_id: card.id,
                    ai_source: 'demo_seed'
                });
            }
        }

        console.log(`... Insert batch of ${transactions.length} transactions`);

        // Batch insert
        await prismaDemo.transaction.createMany({
            data: transactions
        });

        // 4. Compute Rewards
        console.log('🏆 Computing Rewards (Estimation Service)...');
        const count = await RewardsEstimationService.recomputeForUser(prismaDemo, user.id);
        console.log(`✅ Calculated rewards for ${count} transactions.`);

        // Final Summary
        console.log('--- SEED COMPLETE ---');
        console.log(`Users: 1`);
        console.log(`Cards: ${cards.length}`);
        console.log(`Transactions: ${transactions.length}`);

    } catch (error) {
        console.error('❌ Seed Failed:', error);
        process.exit(1);
    } finally {
        await prismaDemo.$disconnect();
    }
}

main();
