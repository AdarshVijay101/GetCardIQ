import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Creating fresh test user...");
    await prisma.user.upsert({
        where: { id: 'fresh-test-user-id' },
        update: {}, // Do nothing if exists
        create: {
            id: 'fresh-test-user-id',
            email: 'fresh@test.com',
            password_hash: '$2a$10$EpI...' // dummy hash
        }
    });

    // Ensure clean slate (delete related data if exists from previous runs)
    await prisma.transaction.deleteMany({ where: { user_id: 'fresh-test-user-id' } });
    await prisma.plaidConnection.deleteMany({ where: { user_id: 'fresh-test-user-id' } });
    await prisma.card.deleteMany({ where: { user_id: 'fresh-test-user-id' } });
    await prisma.goal.deleteMany({ where: { user_id: 'fresh-test-user-id' } });

    console.log("Fresh user created/reset.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
