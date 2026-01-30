// This service now fetches from the Backend API (which is synced via background jobs)
export interface CardPreset {
    id: string;
    issuer: string;
    name: string;
    rewards: { category: string; multiplier: number }[];
}

export const searchCards = async (query: string): Promise<CardPreset[]> => {
    if (!query) return [];
    try {
        const res = await fetch(`http://localhost:4000/api/cards/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        return await res.json();
    } catch (e) {
        console.error("Card Search Error:", e);
        return [];
    }
};
