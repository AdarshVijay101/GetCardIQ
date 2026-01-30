
import { PrismaClient } from '@prisma/client';
import { DashboardController } from './controllers/dashboard.controller';

const prisma = new PrismaClient();

const mockRes = (label: string) => ({
    json: (data: any) => console.log(`[${label}] Success`),
    status: (code: number) => ({ json: (data: any) => console.log(`[${label}] Status ${code}`) })
} as any);

const mockReq = (userId: string) => ({ user: { userId }, query: {} } as any);

async function run() {
    console.log("Starting Dashboard Audit...");
    const user = await prisma.user.findFirst();
    if (user) {
        await DashboardController.getSpendAnalytics(mockReq(user.id), mockRes('SpendAnalytics'));
    }
    console.log("Done.");
}

run().catch(console.error);
