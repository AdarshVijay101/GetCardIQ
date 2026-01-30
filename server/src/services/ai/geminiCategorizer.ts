import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // REMOVED
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSy...');

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// RocketMoney-style Categories
const VALID_CATEGORIES = [
    'Dining', 'Groceries', 'Travel', 'Gas', 'Online Shopping',
    'Entertainment', 'Utilities', 'Rent', 'Subscriptions', 'Healthcare', 'Shopping', 'Other'
];

export const GeminiCategorizer = {
    categorize: async (merchantName: string, amount: number) => {
        const prompt = `
      You are a transaction classifier.
      Merchant: "${merchantName}"
      Amount: $${amount}
      
      Classify into EXACTLY ONE of: ${VALID_CATEGORIES.join(', ')}.
      
      Return JSON: { "category": "Dining", "confidence": 0.95 }
    `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(text);
        } catch (error) {
            console.error("Gemini Categorization Failed:", error);
            return { category: 'Other', confidence: 0 };
        }
    },

    categorizeUncategorized: async (prisma: PrismaClient, userId: string) => {
        const txns = await prisma.transaction.findMany({
            where: { user_id: userId, category: null },
            take: 50
        });

        let count = 0;
        for (const t of txns) {
            const result = await GeminiCategorizer.categorize(t.merchant_name, Number(t.amount));

            await prisma.transaction.update({
                where: { id: t.id },
                data: {
                    category: result.category,
                    ai_confidence: result.confidence
                }
            });
            count++;
        }
        return count;
    }
};
