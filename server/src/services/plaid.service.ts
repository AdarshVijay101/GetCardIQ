import { plaidClient } from '../config/plaid';
import { prisma } from '../utils/prisma';
import { EncryptionService } from '../security/encryption/EncryptionService';
import { CountryCode, Products, LinkTokenCreateRequest, TransactionsSyncRequest } from 'plaid';
import { logger } from '../utils/logger';

const encryptionService = new EncryptionService();

export class PlaidService {

    // 1. Create Link Token (for Frontend)
    static async createLinkToken(userId: string) {
        const request: LinkTokenCreateRequest = {
            user: { client_user_id: userId },
            client_name: 'GetCardIQ',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us],
            language: 'en',
        };

        try {
            const response = await plaidClient.linkTokenCreate(request);
            return response.data;
        } catch (error) {
            logger.error('Error creating link token', error);
            throw error;
        }
    }

    // 2. Exchange Public Token (Save Access Token Securely)
    static async exchangePublicToken(userId: string, publicToken: string) {
        try {
            const response = await plaidClient.itemPublicTokenExchange({
                public_token: publicToken,
            });

            const accessToken = response.data.access_token;
            const itemId = response.data.item_id;

            // Encrypt Access Token (Upgrade A)
            const encrypted = await encryptionService.encrypt(accessToken);

            // Save to DB
            const connection = await prisma.plaidConnection.create({
                data: {
                    userId,
                    itemId,
                    accessTokenCiphertext: encrypted.ciphertext,
                    accessTokenIv: encrypted.iv,
                    accessTokenTag: encrypted.tag,
                    keyVersion: encrypted.version,
                    status: 'ACTIVE'
                }
            });

            return connection;
        } catch (error) {
            logger.error('Error exchanging public token', error);
            throw error;
        }
    }

    // 3. Sync Transactions (Called by Job or Webhook)
    static async syncTransactions(connectionId: string) {
        const connection = await prisma.plaidConnection.findUnique({
            where: { id: connectionId }
        });

        if (!connection) throw new Error('Connection not found');

        // Decrypt Access Token
        const accessToken = await encryptionService.decrypt({
            ciphertext: connection.accessTokenCiphertext,
            iv: connection.accessTokenIv,
            tag: connection.accessTokenTag,
            version: connection.keyVersion
        });

        // TODO: Handle cursor for incremental sync. For MVP, simple get recent.
        // Ideally we store `nextCursor` in DB. schema.prisma doesn't have it yet.
        // We'll just fetch latest 30 days for this "Plaid Sync" logic in MVP Upgrade.

        // Using transactionsGet for simplicity if sync is complex to state manage without cursor column
        // But Sync is recommended. Let's try Sync with null cursor.
        try {
            let cursor = undefined; // We need to store this in DB to be real.
            // Quick fix: Add 'cursor' field to PlaidConnection later.

            // For now, let's use `transactionsGet` to be stateless and safe for MVP.
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const endDate = new Date();

            const response = await plaidClient.transactionsGet({
                access_token: accessToken,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
            });

            const accounts = response.data.accounts;
            const transactions = response.data.transactions;

            // Upsert Accounts
            for (const acc of accounts) {
                await prisma.account.upsert({
                    where: { plaidAccountId: acc.account_id },
                    update: {
                        balance: acc.balances.current || 0,
                        name: acc.name,
                        mask: acc.mask,
                        subtype: acc.subtype?.toString()
                    },
                    create: {
                        connectionId: connection.id,
                        plaidAccountId: acc.account_id,
                        name: acc.name,
                        mask: acc.mask,
                        type: acc.type,
                        subtype: acc.subtype?.toString(),
                        balance: acc.balances.current || 0,
                        isoCurrencyCode: acc.balances.iso_currency_code
                    }
                });
            }

            // Upsert Transactions
            for (const tx of transactions) {
                // Find our account ID based on plaid account id
                const dbAccount = await prisma.account.findUnique({
                    where: { plaidAccountId: tx.account_id }
                });

                if (!dbAccount) continue;

                await prisma.transaction.upsert({
                    where: { plaidTransactionId: tx.transaction_id },
                    update: {
                        amount: tx.amount, // Note: Plaid positive = expense
                        // Logic to update category if changed?
                    },
                    create: {
                        accountId: dbAccount.id,
                        plaidTransactionId: tx.transaction_id,
                        amount: tx.amount,
                        date: new Date(tx.date),
                        merchantName: tx.merchant_name || tx.name,
                        categoryId: tx.category ? tx.category[0] : null, // Primitive mapping
                        // Other fields default
                    }
                });
            }

            logger.info(`Synced ${transactions.length} transactions for connection ${connection.id}`);
            return { added: transactions.length };

        } catch (error) {
            logger.error(`Plaid Sync Error for ${connection.id}`, error);
            throw error;
        }
    }
}
