
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// --- UTILS ---
const ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT, 'server');
const CLIENT_DIR = path.join(ROOT, 'client');

function print(msg, color = '36') { console.log(`\x1b[${color}m${msg}\x1b[0m`); }
function run(cmd, cwd = ROOT) {
    try {
        print(`> ${cmd}`, '90');
        execSync(cmd, { stdio: 'inherit', cwd });
    } catch (e) {
        print(`❌ Command failed: ${cmd}`, '31');
        process.exit(1);
    }
}
function fileExists(p) { return fs.existsSync(p); }

function parseEnvFile(envPath) {
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const out = {};
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        let val = line.slice(eq + 1).trim();

        // strip wrapping quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        out[key] = val;
    }
    return out;
}

// --- MAIN ---
async function main() {
    print("🚀 Starting GetCardIQ Setup (Node.js)...", '32');

    // 1. CHECKS
    try { execSync('node -v', { stdio: 'ignore' }); } catch { console.error('Node not found'); process.exit(1); }

    // 2. ENV FILES
    print("\n📝 Checking Environment Files...");
    let envCreated = false;

    // Server
    const serverEnvPath = path.join(SERVER_DIR, '.env');
    if (!fileExists(serverEnvPath)) {
        fs.copyFileSync(path.join(SERVER_DIR, '.env.example'), serverEnvPath);
        print("✅ Created server/.env");
        envCreated = true;
    }

    // Client
    const clientEnvPath = path.join(CLIENT_DIR, '.env.local');
    const clientEnvExamplePath = path.join(CLIENT_DIR, '.env.example');

    if (!fileExists(clientEnvPath)) {
        if (fileExists(clientEnvExamplePath)) {
            fs.copyFileSync(clientEnvExamplePath, clientEnvPath);
            print("✅ Created client/.env.local");
        } else {
            // Fallback: create a minimal working env.local
            fs.writeFileSync(
                clientEnvPath,
                "NEXT_PUBLIC_API_URL=http://localhost:4000\nNEXT_PUBLIC_PY_API_URL=http://127.0.0.1:8000\n"
            );
            print("✅ Created client/.env.local (fallback defaults)");
        }
    }

    // 3. MANUAL CONFIG PROMPT
    if (envCreated) {
        print("\n⚠️  IMPORTANT: New .env files created.", '33');
        print("Please edit 'server/.env' to set your DATABASE_URL (Postgres credentials).", '33');
        print("Required: A Postgres user with permission to create tables.", '33');

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        await new Promise(resolve => {
            rl.question('\nInclude your password in DATABASE_URL, then press ENTER to continue...', () => {
                rl.close();
                resolve();
            });
        });
    }

    // 4. INSTALL DEPENDENCIES
    print("\n📥 Installing Server Dependencies...");
    run('npm install', SERVER_DIR);

    print("\n📥 Installing Client Dependencies...");
    run('npm install', CLIENT_DIR);

    // 5. PARSE ENV (To get DB URLs) - no external deps
    const envMap = parseEnvFile(serverEnvPath);
    const dbUrl = envMap.DATABASE_URL || process.env.DATABASE_URL;
    const dbUrlDemo = envMap.DATABASE_URL_DEMO || process.env.DATABASE_URL_DEMO;

    if (!dbUrl || dbUrl.includes('postgres:password')) {
        print("\n⚠️  WARNING: DATABASE_URL seems to be default. DB connection might fail.", '33');
    }

    // 6. DB SETUP
    print("\n🗄️  Setting up Databases...");

    // Generate Client
    run('npx prisma generate', SERVER_DIR);

    // Push Real
    print("Pushing to Real DB...");
    try {
        // Safe push for Real DB (No accept-data-loss by default)
        execSync(`npx prisma db push`, {
            stdio: 'inherit',
            cwd: SERVER_DIR,
            env: { ...process.env, DATABASE_URL: dbUrl }
        });
    } catch (e) {
        print("\n❌ Failed to push to Real DB.", '31');
        print("Possible fixes:", '33');
        print("1. Ensure database exists: CREATE DATABASE getcardsiq;", '33');
        print("2. Check credentials in server/.env", '33');
        process.exit(1);
    }

    // Push Demo
    print("Pushing to Demo DB...");
    if (dbUrlDemo) {
        try {
            // Demo DB can accept data loss (it's wiped anyway)
            execSync(`npx prisma db push --accept-data-loss`, {
                stdio: 'inherit',
                cwd: SERVER_DIR,
                env: { ...process.env, DATABASE_URL: dbUrlDemo }
            });
        } catch (e) {
            print("❌ Failed to push to Demo DB.", '31');
            print("Ensure database exists: CREATE DATABASE getcardsiq_demo;", '33');
        }
    } else {
        print("⚠️  Skipping Demo DB (DATABASE_URL_DEMO not set)", '33');
    }

    // 7. SEED
    print("\n🌱 Seeding Demo Data...");
    run('npm run seed:demo -- --wipe', SERVER_DIR);

    // 8. PYTHON SETUP REMINDER
    print("\n🐍 Python / FastAPI Setup", '36');
    print("1. cd app");
    print("2. python -m venv .venv");
    print("3. .venv\\Scripts\\activate");
    print("4. pip install -r requirements.txt");

    print("\n✅ SETUP COMPLETE!", '32');
    print("---------------------------------------");
    print("To Start:");
    print("1. npm run dev (in root) - requires package.json script");
    print("   OR: cd server && npm run dev | cd client && npm run dev");
    print("---------------------------------------");
}

main();
