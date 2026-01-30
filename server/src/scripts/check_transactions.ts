
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.transaction.count();
    console.log(`Total Transactions in DB: ${count}`);

    const txs = await prisma.transaction.findMany({ take: 5 });
    console.log("Sample Transactions:", txs);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
