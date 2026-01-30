import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { encrypt, decrypt } from '../utils/encryption';
import { PrismaClient } from '@prisma/client';
import { RewardsEstimationService } from './rewards/estimation';

// const prisma = new PrismaClient(); // REMOVED: Injected

const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;

if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    console.error("[Plaid] Missing PLAID_CLIENT_ID or PLAID_SECRET");
}

const configuration = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
            'PLAID-SECRET': PLAID_SECRET,
        },
    },
});

export const plaidClient = new PlaidApi(configuration);

export const PlaidService = {
    createLinkToken: async (userId: string) => {
        try {
            const response = await plaidClient.linkTokenCreate({
                user: { client_user_id: userId },
                client_name: 'GetCardIQ',
                products: [Products.Transactions],
                country_codes: [CountryCode.Us],
                language: 'en',
            });
            return response.data;
        } catch (error: any) {
            console.error("Plaid Link Token Failed. Details:", JSON.stringify(error.response?.data || error));
            throw error;
        }
    },

    exchangePublicToken: async (prisma: PrismaClient, userId: string, publicToken: string, metadata?: any) => {
        const response = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken,
        });

        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // SOC-2 Requirement: Encrypt Access Token at Rest
        const encryptedToken = encrypt(accessToken);

        // Ensure user exists (Lazy Create for Dev/Demo)
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            console.log(`[Plaid] Lazy-creating user ${userId}`);
            await prisma.user.create({
                data: {
                    id: userId,
                    email: `user_${userId}@getcardiq.com`,
                    password_hash: 'auto-generated'
                }
            });
        }

        // Use metadata if available for better names
        const institutionId = metadata?.institution?.institution_id || 'ins_unknown';
        const institutionName = metadata?.institution?.name || 'Unknown Bank';

        await prisma.plaidConnection.create({
            data: {
                user_id: userId,
                institution_id: institutionId,
                institution_name: institutionName,
                access_token_encrypted: encryptedToken,
            }
        });

        // Trigger initial sync immediately (Fire and forget or catch error so exchange doesn't fail)
        try {
            await PlaidService.syncTransactions(prisma, userId);
        } catch (syncErr) {
            console.error("Initial sync failed (non-fatal):", syncErr);
        }

        return { itemId };
    },

    syncTransactions: async (prisma: PrismaClient, userId: string) => {
        // 1. Fetch encrypted tokens
        const connections = await prisma.plaidConnection.findMany({ where: { user_id: userId } });

        for (const conn of connections) {
            // 2. Decrypt
            const accessToken = decrypt(conn.access_token_encrypted);

            // 3a. Fetch & Sync Accounts (Balances)
            try {
                const accountsRes = await plaidClient.accountsGet({ access_token: accessToken });
                const accounts = accountsRes.data.accounts;
                console.log(`[Plaid] Connection ${conn.id}: Found ${accounts.length} accounts.`);

                for (const acc of accounts) {
                    if (acc.type === 'credit' || acc.type === 'depository') {
                        // Upsert Card/Account
                        const existing = await prisma.card.findFirst({
                            where: { plaid_account_id: acc.account_id }
                        });

                        if (existing) {
                            await prisma.card.update({
                                where: { id: existing.id },
                                data: {
                                    current_balance: acc.balances.current,
                                    available_balance: acc.balances.available,
                                    credit_limit: acc.balances.limit,
                                    mask: acc.mask,
                                }
                            });
                        } else {
                            console.log(`[Plaid] Creating new card: ${acc.name} (${acc.mask})`);
                            await prisma.card.create({
                                data: {
                                    user_id: userId,
                                    plaid_account_id: acc.account_id,
                                    nickname: acc.name,
                                    issuer: conn.institution_name || 'Unknown Bank',
                                    card_type: acc.type,
                                    mask: acc.mask,
                                    current_balance: acc.balances.current,
                                    available_balance: acc.balances.available,
                                    credit_limit: acc.balances.limit,
                                    color: acc.type === 'credit' ? '#1E3A8A' : '#10B981',
                                }
                            });
                        }
                    } else {
                        console.log(`[Plaid] Skipping account type: ${acc.type}`);
                    }
                }
            } catch (err) {
                console.error(`[Plaid] Failed to sync accounts for conn ${conn.id}. Access Token: ${accessToken.substring(0, 10)}...`, err);
            }

            // 3b. Fetch from Plaid (Transactions)
            try {
                let plTransactions: any[] = [];
                try {
                    const response = await plaidClient.transactionsSync({
                        access_token: accessToken,
                    });
                    plTransactions = response.data.added;
                } catch (e) {
                    console.warn(`[Plaid] Sync cursor failed, trying legacy Get...`);
                }

                // FALLBACK: If Sync returns nothing (common in fresh Sandbox items), force a Get
                if (plTransactions.length === 0) {
                    console.log(`[Plaid] Sync returned 0. Attempting legacy transactionsGet...`);
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 90); // Fetch 90 days
                    const response = await plaidClient.transactionsGet({
                        access_token: accessToken,
                        start_date: startDate.toISOString().split('T')[0],
                        end_date: new Date().toISOString().split('T')[0]
                    });
                    plTransactions = response.data.transactions;
                }

                const newTxIds: string[] = [];

                // 4. Save to DB (Normalize)
                for (const tx of plTransactions) {
                    // Link to the Card we just upserted
                    const card = await prisma.card.findFirst({
                        where: { plaid_account_id: tx.account_id }
                    });

                    const created = await prisma.transaction.create({
                        data: {
                            user_id: userId,
                            merchant_name: tx.merchant_name || tx.name || 'Unknown',
                            amount: new Date(tx.date) > new Date() ? 0 : tx.amount,
                            date: new Date(tx.date),
                            plaid_transaction_id: tx.transaction_id,
                            card_used_id: card ? card.id : undefined,
                            category: tx.personal_finance_category?.primary || tx.category?.[0] || 'Uncategorized'
                        }
                    });
                    newTxIds.push(created.id);
                }
                console.log(`[Plaid] Synced ${plTransactions.length} transactions for item ${conn.id}`);

                // 5. Run Rewards Estimation Engine (OPTIMIZED)
                if (newTxIds.length > 0) {
                    try {
                        console.log(`[Rewards] Computing points for ${newTxIds.length} new transactions...`);
                        const computed = await RewardsEstimationService.computeForTransactions(prisma, newTxIds);
                        console.log(`[Rewards] Updated points for ${computed} transactions`);
                    } catch (err) {
                        console.error("[Rewards] Estimation failed", err);
                    }
                }

            } catch (txErr) {
                console.error("Failed to sync transactions for conn " + conn.id, txErr);
            }
        }
    }
};
