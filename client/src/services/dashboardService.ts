export interface DashboardSummary {
    kpi: {
        rewards_earned: number;
        rewards_rate: number;
        money_left_behind: number;
        expiring_value: number;
    };
    missed_opportunities: {
        merchant: string;
        amount: number;
        lost_value: number;
        date: string;
        recommended_card: string;
    }[];
    alerts: any[];
    top_spend_category: string;
}

export const getDashboardSummary = async (): Promise<DashboardSummary | null> => {
    try {
        const res = await fetch('/api/dashboard/summary');
        if (!res.ok) throw new Error('Failed to fetch dashboard summary');
        return await res.json();
    } catch (error) {
        console.error('Dashboard fetch error:', error);
        return null; // Handle error gracefully in UI
    }
};
