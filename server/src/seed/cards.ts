import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SMART_CARDS = [
    // --- CHASE ---
    {
        issuer: 'Chase',
        name: 'Sapphire Reserve',
        rewards: [
            { category: 'Dining', multiplier: 3.0 },
            { category: 'Travel', multiplier: 3.0 },
            { category: 'Groceries', multiplier: 1.0 },
            { category: 'Gas', multiplier: 1.0 },
            { category: 'Streaming', multiplier: 1.0 },
            { category: 'Online Shopping', multiplier: 1.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    },
    {
        issuer: 'Chase',
        name: 'Sapphire Preferred',
        rewards: [
            { category: 'Dining', multiplier: 3.0 },
            { category: 'Travel', multiplier: 2.0 },
            { category: 'Groceries', multiplier: 3.0 }, // Online only
            { category: 'Streaming', multiplier: 3.0 },
            { category: 'Gas', multiplier: 1.0 },
            { category: 'Online Shopping', multiplier: 1.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    },
    {
        issuer: 'Chase',
        name: 'Freedom Unlimited',
        rewards: [
            { category: 'Dining', multiplier: 3.0 },
            { category: 'Travel', multiplier: 5.0 }, // Portal
            { category: 'Groceries', multiplier: 1.5 },
            { category: 'Gas', multiplier: 1.5 },
            { category: 'Streaming', multiplier: 1.5 },
            { category: 'Online Shopping', multiplier: 1.5 },
            { category: 'Other', multiplier: 1.5 },
        ]
    },
    // --- AMEX ---
    {
        issuer: 'American Express',
        name: 'Platinum Card',
        rewards: [
            { category: 'Travel', multiplier: 5.0 },
            { category: 'Dining', multiplier: 1.0 },
            { category: 'Groceries', multiplier: 1.0 },
            { category: 'Gas', multiplier: 1.0 },
            { category: 'Streaming', multiplier: 1.0 },
            { category: 'Online Shopping', multiplier: 1.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    },
    {
        issuer: 'American Express',
        name: 'Gold Card',
        rewards: [
            { category: 'Dining', multiplier: 4.0 },
            { category: 'Groceries', multiplier: 4.0 },
            { category: 'Travel', multiplier: 3.0 },
            { category: 'Gas', multiplier: 1.0 },
            { category: 'Streaming', multiplier: 1.0 },
            { category: 'Online Shopping', multiplier: 1.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    },
    {
        issuer: 'American Express',
        name: 'Blue Cash Preferred',
        rewards: [
            { category: 'Groceries', multiplier: 6.0 },
            { category: 'Streaming', multiplier: 6.0 },
            { category: 'Gas', multiplier: 3.0 },
            { category: 'Travel', multiplier: 3.0 },
            { category: 'Dining', multiplier: 1.0 },
            { category: 'Online Shopping', multiplier: 1.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    },
    // --- CAPITAL ONE ---
    {
        issuer: 'Capital One',
        name: 'Venture X',
        rewards: [
            { category: 'Travel', multiplier: 2.0 },
            { category: 'Dining', multiplier: 2.0 },
            { category: 'Groceries', multiplier: 2.0 },
            { category: 'Gas', multiplier: 2.0 },
            { category: 'Streaming', multiplier: 2.0 },
            { category: 'Online Shopping', multiplier: 2.0 },
            { category: 'Other', multiplier: 2.0 },
        ]
    },
    {
        issuer: 'Capital One',
        name: 'Savor',
        rewards: [
            { category: 'Dining', multiplier: 4.0 },
            { category: 'Streaming', multiplier: 4.0 },
            { category: 'Groceries', multiplier: 3.0 },
            { category: 'Travel', multiplier: 1.0 },
            { category: 'Gas', multiplier: 1.0 },
            { category: 'Online Shopping', multiplier: 1.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    },
    // --- CITI ---
    {
        issuer: 'Citi',
        name: 'Double Cash',
        rewards: [
            { category: 'Dining', multiplier: 2.0 },
            { category: 'Travel', multiplier: 2.0 },
            { category: 'Groceries', multiplier: 2.0 },
            { category: 'Gas', multiplier: 2.0 },
            { category: 'Streaming', multiplier: 2.0 },
            { category: 'Online Shopping', multiplier: 2.0 },
            { category: 'Other', multiplier: 2.0 },
        ]
    },
    {
        issuer: 'Citi',
        name: 'Custom Cash',
        rewards: [
            { category: 'Dining', multiplier: 5.0 }, // Simulating top category
            { category: 'Travel', multiplier: 1.0 },
            { category: 'Groceries', multiplier: 1.0 },
            { category: 'Gas', multiplier: 1.0 },
            { category: 'Streaming', multiplier: 1.0 },
            { category: 'Online Shopping', multiplier: 1.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    },
    // --- DISCOVER ---
    {
        issuer: 'Discover',
        name: 'It Cash Back',
        rewards: [
            { category: 'Dining', multiplier: 1.0 }, // 5% rotating
            { category: 'Travel', multiplier: 1.0 },
            { category: 'Groceries', multiplier: 1.0 },
            { category: 'Gas', multiplier: 1.0 },
            { category: 'Streaming', multiplier: 1.0 },
            { category: 'Online Shopping', multiplier: 1.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    },
    // --- OTHERS ---
    {
        issuer: 'Wells Fargo',
        name: 'Bilt Mastercard',
        rewards: [
            { category: 'Dining', multiplier: 3.0 },
            { category: 'Travel', multiplier: 2.0 },
            { category: 'Groceries', multiplier: 1.0 },
            { category: 'Gas', multiplier: 1.0 },
            { category: 'Streaming', multiplier: 1.0 },
            { category: 'Online Shopping', multiplier: 1.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    },
    {
        issuer: 'Apple',
        name: 'Apple Card',
        rewards: [
            { category: 'Dining', multiplier: 2.0 },
            { category: 'Travel', multiplier: 2.0 },
            { category: 'Groceries', multiplier: 2.0 },
            { category: 'Gas', multiplier: 2.0 },
            { category: 'Streaming', multiplier: 2.0 },
            { category: 'Online Shopping', multiplier: 2.0 },
            { category: 'Other', multiplier: 1.0 },
        ]
    }
];

async function main() {
    console.log('Start seeding RefCards...');

    for (const card of SMART_CARDS) {
        await prisma.refCard.upsert({
            where: {
                issuer_name: {
                    issuer: card.issuer,
                    name: card.name
                }
            },
            update: {
                rewards: JSON.stringify(card.rewards)
            },
            create: {
                issuer: card.issuer,
                name: card.name,
                rewards: JSON.stringify(card.rewards)
            }
        });
    }

    console.log(`Seeding finished. Seeded ${SMART_CARDS.length} cards.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
