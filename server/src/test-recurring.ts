
import { InsightsController } from './controllers/insights.controller';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock Req/Res
const req: any = {
    user: { userId: 'default-user-id' } // Use the ID known to have transactions
};
const res: any = {
    json: (data: any) => console.log(JSON.stringify(data, null, 2)),
    status: (code: number) => ({ json: (data: any) => console.error(JSON.stringify(data)) })
};

async function run() {
    // Ensure we have a user
    const user = await prisma.user.findFirst();
    if (user) {
        req.user.userId = user.id;
        console.log("Testing with User:", user.email);

        // Debug: Check summary
        const txns = await prisma.transaction.findMany({ where: { user_id: user.id } });
        const counts: any = {};
        txns.forEach((t: any) => {
            const key = t.merchant_name.toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
        });
        console.log("Merchant Counts:", counts);

        await InsightsController.getRecurring(req, res);
    } else {
        console.error("No users found in DB.");
    }
}

run().catch(console.error);
