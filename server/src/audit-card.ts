
import { PrismaClient } from '@prisma/client';
import { CardController } from './controllers/card.controller';

const prisma = new PrismaClient();

const mockRes = (label: string) => ({
    json: (data: any) => console.log(`[${label}] Success`),
    status: (code: number) => ({ json: (data: any) => console.log(`[${label}] Status ${code}`) })
} as any);

const mockReq = (userId: string) => ({ user: { userId } } as any);

async function run() {
    console.log("Starting Card Audit...");
    const user = await prisma.user.findFirst();
    if (user) {
        await CardController.getTopCards(mockReq(user.id), mockRes('TopCards'));
    }
    console.log("Done.");
}

run().catch(console.error);
