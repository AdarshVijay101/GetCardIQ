
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function backfill() {
    console.log("Backfilling transaction rewards...");
    const txns = await prisma.transaction.findMany();

    for (const t of txns) {
        // Simple deterministic logic based on category
        let points = 1;
        let val = 1;

        if (t.category?.toLowerCase().includes('dining')) {
            points = 3;
            val = 3;
        } else if (t.category?.toLowerCase().includes('travel')) {
            points = 2;
            val = 2;
        }

        const earned = Math.floor(Number(t.amount) * points);
        const valCents = Math.floor(Number(t.amount) * val);

        await prisma.transaction.update({
            where: { id: t.id },
            data: {
                estimated_points_earned: earned,
                estimated_value_cents: valCents,
                category_resolved: t.category || 'General'
            }
        });
    }
    console.log(`Updated ${txns.length} transactions.`);
}

backfill();
