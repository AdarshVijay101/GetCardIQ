
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load env
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });
console.log(`Loaded env from: ${envPath}`);

const SCAN_DIR = path.join(__dirname, '..'); // server/src
const ALLOWED_FILES = ['prisma.ts', 'verify-safety.ts'];

async function main() {
    console.log("🔒 Starting Safety Verification...\n");
    let hasError = false;

    const report: any = {
        environment: {},
        codebase_scan: { forbidden_files: [] },
        connection_test: { real: false, demo: false, error: null },
        success: false
    };

    // 1. Environment Check
    console.log("1️⃣  Environment Configuration");
    report.environment.has_db_url = !!process.env.DATABASE_URL;
    report.environment.has_db_url_demo = !!process.env.DATABASE_URL_DEMO;

    if (process.env.DATABASE_URL && process.env.DATABASE_URL_DEMO && process.env.DATABASE_URL === process.env.DATABASE_URL_DEMO) {
        console.error("   ❌ DATABASE_URL and DATABASE_URL_DEMO are identical!");
        report.environment.distinct = false;
        hasError = true;
    } else {
        console.log("   ✅ Database URLs are distinct.");
        report.environment.distinct = true;
    }

    // 2. Codebase Scan for Forbidden Instantiation
    console.log("\n2️⃣  Codebase Scan");

    function scanDir(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n');
                for (const line of lines) {
                    if (line.includes('new PrismaClient()')) {
                        const trimmed = line.trim();
                        // Ignore comments
                        if (trimmed.startsWith('//')) continue;
                        if (trimmed.startsWith('*')) continue;
                        if (trimmed.startsWith('/*')) continue;

                        if (ALLOWED_FILES.some(allowed => file.endsWith(allowed))) {
                            // Allowed
                        } else {
                            const relPath = path.relative(SCAN_DIR, fullPath);
                            console.error(`   ❌ Forbidden instantiation in: ${relPath}`);
                            report.codebase_scan.forbidden_files.push(relPath);
                            hasError = true;
                            // Found one, skip rest of file to avoid spam
                            break;
                        }
                    }
                }
            }
        }
    }

    scanDir(SCAN_DIR);
    if (report.codebase_scan.forbidden_files.length === 0) console.log("   ✅ No forbidden usage found.");

    // 3. Connection Test
    console.log("\n3️⃣  Connection Test");
    try {
        console.log("Connecting to REAL DB...");
        const real = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
        await real.$connect();
        await real.$disconnect();
        report.connection_test.real = true;
        console.log("Real DB OK.");

        console.log("Connecting to DEMO DB...");
        const demo = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_DEMO } } });
        await demo.$connect();
        await demo.$disconnect();
        report.connection_test.demo = true;
        console.log("Demo DB OK.");

    } catch (error: any) {
        console.error("   ❌ Connection Failed:", error.message);
        report.connection_test.error = error.message;
        hasError = true;
    }

    report.success = !hasError;
    const reportPath = path.join(__dirname, 'security_audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport written to: ${reportPath}`);

    if (hasError) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

main();
