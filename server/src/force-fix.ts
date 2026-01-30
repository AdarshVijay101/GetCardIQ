
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    console.log("--- FIXING DATA ---");

    // 1. Clear Notifications
    const { count } = await prisma.notification.deleteMany({});
    console.log(`Deleted ${count} notifications.`);

    // 2. Fix Top Cards
    const cards = await prisma.refCard.findMany();
    for (const card of cards) {
        await prisma.refCard.update({
            where: { id: card.id },
            data: {
                // Ensure valid URLs
                imageUrl: card.imageUrl || 'https://placehold.co/300x200/png',
                applyUrl: card.applyUrl || 'https://google.com'
            }
        });
    }
    console.log(`Updated ${cards.length} cards with fallback URLs.`);

    console.log("--- DONE ---");
}

fix();
