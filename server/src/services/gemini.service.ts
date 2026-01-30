import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED: Injected
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSy...'); // User provided key needed

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const GeminiService = {
    analyzeTransaction: async (tx: any, userCards: any[]) => {
        // Construct the prompt with context
        const prompt = `
      You are a credit card rewards expert.
      
      Transaction:
      - Merchant: ${tx.merchant_name}
      - Amount: $${tx.amount}
      - Date: ${tx.date}
      
      User's Wallet:
      ${userCards.map(c => `- ${c.nickname} (${c.issuer}): ${JSON.stringify(c.rewards)}`).join('\n')}
      
      Task:
      1. Categorize this transaction (Dining, Travel, Grocery, Gas, Online, Other).
      2. Identify the OPTIMAL card from the wallet to maximize points.
      3. Calculate "Potential Extra Value" (Money Left Behind) if they used a default 1% card vs the optimal card.
      
      Output JSON only:
      {
        "category": "Dining",
        "best_card_id": "uuid",
        "potential_extra_value": 0.45,
        "reason": "Amex Gold earns 4x on Dining"
      }
    `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Gemini Analysis Failed:", error);
            return null;
        }
    },

    runBatchAnalysis: async (prisma: PrismaClient, userId: string) => {
        const userCards = await prisma.card.findMany({
            where: { user_id: userId },
            include: { rewards: true }
        });

        const unanalyzedTxs = await prisma.transaction.findMany({
            where: { user_id: userId, ai_confidence: null },
            take: 10
        });

        for (const tx of unanalyzedTxs) {
            const insight = await GeminiService.analyzeTransaction(tx, userCards);

            if (insight) {
                await prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        category: insight.category,
                        recommended_card_id: insight.best_card_id,
                        potential_extra_value: insight.potential_extra_value,
                        ai_confidence: 0.95
                    }
                });
            }
        }
    }
};
