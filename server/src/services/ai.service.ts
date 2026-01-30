import axios from 'axios';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected
const PYTHON_SERVICE_URL = 'http://127.0.0.1:8000/ai/categorize';

// Simple in-memory cache for status (backed by DB for persistence)
let lastStatus = {
    reachable: false,
    mode: 'unknown', // gemini | fallback | failsafe
    lastSuccess: null as Date | null,
    lastFailure: null as Date | null,
    lastError: null as string | null
};

export const AIService = {
    /**
     * Categorize a batch of transactions using the Python AI Service
     */
    categorizeBatch: async (prisma: PrismaClient, transactions: any[]) => {
        if (transactions.length === 0) return 0;

        const payload = {
            transactions: transactions.map(t => ({
                id: t.id,
                merchant_name: t.merchant_name,
                amount: Number(t.amount),
                date: t.date.toISOString(),
                description: t.description || undefined
            }))
        };

        try {
            const response = await axios.post(PYTHON_SERVICE_URL, payload, { timeout: 15000 }); // 15s timeout

            const { ok, mode, categories, error } = response.data;

            if (!ok) throw new Error(error?.message || 'Unknown AI Error');

            // Update Status
            lastStatus = {
                reachable: true,
                mode: mode,
                lastSuccess: new Date(),
                lastFailure: lastStatus.lastFailure,
                lastError: error ? error.message : null
            };

            // Persist Status (Fire & Forget)
            AIService.persistStatus(prisma, lastStatus);

            // Persist Categories
            let updatedCount = 0;
            for (const item of categories) {
                await prisma.transaction.update({
                    where: { id: item.id },
                    data: {
                        category: item.category,
                        ai_confidence: item.confidence,
                        ai_source: item.source,
                        ai_error: item.reason || null
                    }
                });
                updatedCount++;
            }
            return updatedCount;

        } catch (err: any) {
            console.error('AI Service Failed:', err.message);

            // Update Status to Red/Failsafe
            lastStatus = {
                reachable: false,
                mode: 'failsafe',
                lastSuccess: lastStatus.lastSuccess,
                lastFailure: new Date(),
                lastError: err.message
            };
            AIService.persistStatus(prisma, lastStatus);

            // FAILSAFE LOGIC
            let fallbackCount = 0;
            for (const t of transactions) {
                // Simple Node Fallback
                const cat = AIService.localFallback(t.merchant_name);
                await prisma.transaction.update({
                    where: { id: t.id },
                    data: {
                        category: cat,
                        ai_confidence: 0.1,
                        ai_source: 'failsafe',
                        ai_error: `Python Unreachable: ${err.message}`
                    }
                });
                fallbackCount++;
            }
            return fallbackCount;
        }
    },

    localFallback: (merchant: string): string => {
        const m = merchant.toLowerCase();
        if (m.includes('uber') || m.includes('lyft')) return 'Travel';
        if (m.includes('food') || m.includes('burger')) return 'Dining';
        if (m.includes('kroger') || m.includes('walmart')) return 'Groceries';
        return 'Other';
    },

    persistStatus: async (prisma: PrismaClient, status: typeof lastStatus) => {
        try {
            await prisma.aIStatus.create({
                data: {
                    mode: status.mode,
                    is_reachable: status.reachable,
                    last_success_at: status.lastSuccess,
                    last_failure_at: status.lastFailure,
                    last_error: status.lastError
                }
            });
        } catch (e) {
            console.error("Failed to persist AI Status:", e);
        }
    },

    getStatus: async (prisma: PrismaClient) => {
        // Fetch latest from DB to be sure (in case of restart)
        const latest = await prisma.aIStatus.findFirst({ orderBy: { last_check: 'desc' } });
        if (latest) {
            return {
                ai_service_reachable: latest.is_reachable,
                mode: latest.mode,
                last_success_at: latest.last_success_at,
                last_failure_at: latest.last_failure_at,
                last_error: latest.last_error
            };
        }
        return { ...lastStatus, ai_service_reachable: false };
    }
};
