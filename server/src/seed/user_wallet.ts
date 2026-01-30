import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const userId = 'default-user-id';

    // 1. Create User
    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            email: 'demo@getcardiq.com',
            password_hash: passwordHash
        }
    });

    console.log(`User ${userId} ensured.`);

    // 2. Add Cards to Wallet
    const cards = [
        {
            nickname: 'Gold Card',
            card_type: 'Credit',
            issuer: 'Amex',
            rewards: {
                create: [
                    { category: 'Dining', reward_type: 'Multiplier', reward_value: 4.0 },
                    { category: 'Groceries', reward_type: 'Multiplier', reward_value: 4.0 },
                    { category: 'Travel', reward_type: 'Multiplier', reward_value: 3.0 }
                ]
            }
        },
        {
            nickname: 'Sapphire Preferred',
            card_type: 'Credit',
            issuer: 'Chase',
            rewards: {
                create: [
                    { category: 'Dining', reward_type: 'Multiplier', reward_value: 3.0 },
                    { category: 'Travel', reward_type: 'Multiplier', reward_value: 2.0 },
                    { category: 'Streaming', reward_type: 'Multiplier', reward_value: 3.0 }
                ]
            }
        }
    ];

    for (const c of cards) {
        await prisma.card.create({
            data: {
                user_id: userId,
                nickname: c.nickname,
                card_type: c.card_type,
                issuer: c.issuer,
                rewards: c.rewards
            }
        });
    }

    console.log('Cards added.');

    // 3. Add Dummy Transactions (for immediate Dashboard population)
    await prisma.transaction.create({
        data: {
            user_id: userId,
            merchant_name: 'Trader Joes',
            amount: 154.20,
            date: new Date(),
            potential_extra_value: 6.16,
            category: 'Groceries'
        }
    });

    console.log('Dummy transaction added.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
