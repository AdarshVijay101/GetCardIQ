
import { BenefitsController } from './controllers/benefits.controller';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock Req/Res
const req: any = {
    user: { userId: 'default-user-id' }
};
const res: any = {
    json: (data: any) => console.log(JSON.stringify(data, null, 2)),
    status: (code: number) => ({ json: (data: any) => console.error(JSON.stringify(data)) })
};

async function run() {
    const user = await prisma.user.findFirst();
    if (user) {
        req.user.userId = user.id;
        console.log("Testing Benefits for:", user.email);

        console.log("--- STATUS ---");
        await BenefitsController.getBenefitStatus(req, res);

        console.log("--- MISSED REWARDS ---");
        await BenefitsController.getMissedRewards(req, res);
    } else {
        console.error("No user found");
    }
}

run().catch(console.error);
