
"use client";

import React, { useEffect, useState } from 'react';
import { BarChart, DollarSign, Calendar } from 'lucide-react';
import { getDashboardSummary } from '@/services/dashboardService';
import { PotentialSavingsTile } from '@/components/dashboard/PotentialSavingsTile';


export default function SpendingAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/insights/spending?window=6m')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(e => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-center">Loading analytics...</div>;

    const trends = stats?.monthly_trends || [];
    const categories = stats?.top_categories || [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Spending Analytics</h1>

            <div className="mb-8">
                <PotentialSavingsTile />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Monthly Trends */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h3 className="font-bold flex items-center mb-4">
                        <BarChart className="w-5 h-5 mr-2 text-blue-600" />
                        Monthly Trends (6 Mo)
                    </h3>
                    {trends.length > 0 ? (
                        <div className="h-48 flex items-end justify-between px-4 gap-2">
                            {trends.map((item: any, i: number) => (
                                <div key={i} className="flex flex-col items-center group w-full">
                                    <div className="relative w-full flex items-end justify-center h-full">
                                        <div
                                            className="w-4/5 bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-all opacity-80 group-hover:opacity-100"
                                            style={{ height: `${Math.min((item.spend / 5000) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-400 mt-2 truncate w-full text-center">{item.month}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-400">No trend data available</div>
                    )}
                </div>

                {/* Top Categories */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <h3 className="font-bold flex items-center mb-4">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Top Categories
                    </h3>
                    <div className="space-y-4">
                        {categories.length > 0 ? categories.map((item: any, i: number) => (
                            <div key={i}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium">{item.category}</span>
                                    <span className="font-bold">${item.spend.toLocaleString()}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full"
                                        style={{ width: `${Math.min((item.spend / (categories[0].spend || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-green-600 mt-0.5 text-right font-medium">
                                    +{Math.round(item.rewards * 100)} pts earned
                                </div>
                            </div>
                        )) : (
                            <div className="text-gray-400 text-center py-10">No category data available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

