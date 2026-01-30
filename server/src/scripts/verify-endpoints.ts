
import fetch from 'node-fetch'; // Standard fetch or use global if available. Node 18+ has global fetch.

const BASE_URL = 'http://localhost:4000/api';
const HEADERS = { 'X-DEMO-MODE': 'true' };

async function check(name: string, path: string) {
    console.log(`\n🔎 Checking [${name}] => ${path}`);
    try {
        const res = await fetch(`${BASE_URL}${path}`, { headers: HEADERS });
        if (res.status !== 200) {
            console.error(`❌ STATUS ${res.status}`);
            const txt = await res.text();
            console.error(txt.substring(0, 200));
            return;
        }
        const json = await res.json();

        // Basic Checks
        if (Array.isArray(json)) {
            console.log(`✅ OK. Items: ${json.length}`);
            if (json.length > 0) console.log(`   Sample: ${JSON.stringify(json[0]).substring(0, 100)}...`);
        } else {
            console.log(`✅ OK. keys: ${Object.keys(json).join(', ')}`);
            // Check for specific fields
            if (json.monthlyAverage) console.log(`   Monthly Avg: ${json.monthlyAverage}`);
            if (json.totalPotentialValue) console.log(`   Money Left Behind: ${json.totalPotentialValue}`);
        }
    } catch (e: any) {
        console.error(`❌ FAILED: ${e.message}`);
    }
}

async function main() {
    // 1. Spending
    await check('Spending', '/insights/spending?window=90d');

    // 2. Ledger
    await check('Ledger', '/insights/ledger?page=1&limit=5');

    // 3. Recurring
    await check('Recurring', '/insights/recurring');

    // 4. Money Left Behind (Actual Route: /api/benefits/missed)
    await check('Money Left Behind', '/benefits/missed?window=30d');
}

main();
