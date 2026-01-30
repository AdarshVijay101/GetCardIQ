
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
// Using global fetch (Node 18+)

const prismaReal = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
// Handle missing demo URL gracefully for test script
const demoUrl = process.env.DATABASE_URL_DEMO || 'postgresql://user:pass@localhost:5432/db_demo';
const prismaDemo = new PrismaClient({ datasources: { db: { url: demoUrl } } });

const API_URL = 'http://localhost:4000/api';
const ADMIN_KEY = process.env.ADMIN_KEY;

async function runTest() {
    console.log('--- STARTING ADMIN WIPE TEST ---');
    console.log(`Target: ${API_URL}/admin/wipe-demo`);

    // 1. Connection Check
    try {
        await prismaDemo.$connect();
        console.log('✅ Connected to Demo DB');
    } catch (e) {
        console.error('❌ Could not connect to Demo DB. Usage might fail.', e);
        return; // Fail checking
    }

    // 2. Populate Dummy Data in Demo
    console.log('--- Seeding Dummy Data ---');
    try {
        // Need to create user directly or via some mechanism.
        // We'll use raw query to avoid schema mismatch issues if any
        // But prisma create is better.
        const user = await prismaDemo.user.create({
            data: {
                email: `wipe-test-${Date.now()}@example.com`,
                password_hash: 'hash',
                cards: {
                    create: {
                        nickname: 'Wipe Me Card',
                        card_type: 'CREDIT',
                        issuer: 'AMEX'
                    }
                }
            }
        });
        console.log(`✅ Seeded User ID: ${user.id} in Demo DB`);
    } catch (e) {
        console.warn('⚠️ Seeding failed (maybe DB dirty or schema mismatch), but continuing wipe test...', e);
    }

    // 3. Test: Unauthenticated (No Header)
    console.log('--- Test 1: Unauthenticated Request ---');
    const resNoAuth = await fetch(`${API_URL}/admin/wipe-demo`, { method: 'DELETE' });
    if (resNoAuth.status === 403) {
        console.log('✅ PASSED: Rejected 403 (No Key)');
    } else {
        console.error(`❌ FAILED: Status ${resNoAuth.status}`);
    }

    // 4. Test: Invalid Header
    console.log('--- Test 2: Invalid Key Request ---');
    const resBadAuth = await fetch(`${API_URL}/admin/wipe-demo`, {
        method: 'DELETE',
        headers: { 'X-ADMIN-KEY': 'wrong-key' }
    });
    if (resBadAuth.status === 403) {
        console.log('✅ PASSED: Rejected 403 (Invalid Key)');
    } else {
        console.error(`❌ FAILED: Status ${resBadAuth.status}`);
    }

    // 5. Test: Valid Request
    console.log('--- Test 3: Valid WIPE Request ---');
    const resWipe = await fetch(`${API_URL}/admin/wipe-demo`, {
        method: 'DELETE',
        headers: { 'X-ADMIN-KEY': ADMIN_KEY || '' }
    });

    if (resWipe.status === 200) {
        const json = await resWipe.json();
        console.log('✅ PASSED: Status 200', json);

        if (json.db !== 'getcardsiq_demo') {
            console.error('❌ CRITICAL: Returned DB name is NOT demo db!');
        }
    } else {
        const txt = await resWipe.text();
        console.error(`❌ FAILED: Status ${resWipe.status}`, txt);
    }

    // 6. Verify Empty
    console.log('--- Verification: DB Count ---');
    const count = await prismaDemo.user.count();
    if (count === 0) {
        console.log('✅ PASSED: User count is 0');
    } else {
        console.error(`❌ FAILED: User count is ${count}`);
    }

    // 7. Verify Real DB is untouched (Optional but good)
    console.log('--- Verification: Real DB Safety ---');
    // Just ensure we can connect and count.
    const realCount = await prismaReal.user.count();
    console.log(`ℹ️ Real DB User Count: ${realCount} (Should be > 0 if real data exists, or 0 if empty)`);
}

runTest()
    .catch(console.error)
    .finally(async () => {
        await prismaDemo.$disconnect();
        await prismaReal.$disconnect();
    });
