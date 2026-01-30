
import { Request, Response } from 'express';
import { prismaDemo } from '../db/prisma'; // HARDCODED: Never use dynamic client here.

export class AdminController {
    static async wipeDemo(req: Request, res: Response): Promise<void> {
        try {
            // 1. Hardcoded Client Check
            // We imported `prismaDemo` directly. It is impossible to touch `prismaReal` through this variable.

            if (!prismaDemo) {
                res.status(503).json({ error: 'Demo Database is not configured.' });
                return;
            }

            // 2. Database Name Assertion (Crucial Safety Check)
            const dbNameResult: any[] = await prismaDemo.$queryRawUnsafe('SELECT current_database();');
            const currentDb = dbNameResult[0]?.current_database;

            console.log(`[ADMIN] Wipe requested. Current DB: ${currentDb}`);

            if (!currentDb || !currentDb.includes('_demo') || currentDb === 'getcardsiq') {
                console.error(`[CRITICAL SECURITY] Attempted to wipe non-demo database: ${currentDb}`);
                res.status(403).json({
                    error: 'CRITICAL: Safety Assert Failed. Database name does not match demo pattern.',
                    database: currentDb
                });
                return;
            }

            // 3. Execute Clean Wipe (Raw SQL Truncate)
            // User requested explicit truncation of all app tables.
            // We exclude 'RefCard' (Reference Data) and 'MerchantCategory' (Global Intelligence).

            const tables = [
                '"User"', '"Session"', '"PlaidConnection"',
                '"Card"', '"CardReward"', '"CardRewardRule"', '"CardBenefit"', '"RewardLedger"',
                '"Transaction"', '"Notification"', '"AuditLog"', '"JobRun"',
                '"UserProfile"', '"CreditScoreProfile"', '"Budget"', '"Goal"', '"GoalMilestone"'
            ];

            const truncateQuery = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`;

            await prismaDemo.$executeRawUnsafe(truncateQuery);

            console.log(`[ADMIN] Demo Database (${currentDb}) wiped successfully.`);

            res.json({
                ok: true,
                message: 'Demo Database has been nuked.',
                db: currentDb,
                truncated_tables: tables.map(t => t.replace(/"/g, ''))
            });

        } catch (error) {
            console.error('[ADMIN] Wipe Failed:', error);
            res.status(500).json({ error: 'Wipe failed due to server error.' });
        }
    }
}
