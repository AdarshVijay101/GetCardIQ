
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clear() {
    console.log("Clearing notifications...");
    await prisma.notification.deleteMany({});
    console.log("Done.");
}

clear();
