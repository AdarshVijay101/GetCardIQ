import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding default dev user...");

    const userId = "default-user-id";

    // Upsert User
    const user = await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            email: "dev@getcardiq.com",
            passwordHash: "mock-hash", // Not used in dev bypass
        }
    });

    console.log(`User created: ${user.id}`);

    // Create a demo card so Dashboard isn't empty
    const demoCard = await prisma.card.upsert({
        where: { id: "demo-amex-gold" }, // UUIDs usually, but string id allowed in schema? schema said String @id @default(uuid())
        // If schema expects valid UUID, using "demo-amex-gold" might fail if strict, but SQLite is loose.
        // Let's use a real UUID to be safe or rely on create defaults.
        update: {},
        create: {
            user_id: userId,
            name: "Gold Card",
            issuer: "American Express",
            current_balance: 1540.50,
            credit_limit: 25000,
            rewards: {
                create: [
                    { categoryName: "Dining", multiplier: 4.0, categoryId: "dining", pointType: "MR" },
                    { categoryName: "Groceries", multiplier: 4.0, categoryId: "grocery", pointType: "MR" }
                ]
            }
        }
    });

    console.log("Demo card created.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
