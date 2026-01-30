
"use client";

import React, { useEffect, useState } from 'react';
import { Gift, TrendingUp, Award, Layers } from 'lucide-react';

export default function RewardsEarnedPage() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/rewards/summary')
            .then(res => res.json())
            .then(data => {
                setSummary(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-center">Loading rewards...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-600 mb-2">
                Rewards Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Track your points, miles, and cashback across all cards.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <MetricTile
                    icon={<Gift className="w-6 h-6 text-yellow-600" />}
                    label="Total Points Earned"
                    value={summary?.total_points?.toLocaleString() || '0'}
                    subtext="Last 30 Days"
                    bgColor="bg-yellow-50 dark:bg-yellow-900/20"
                />
                <MetricTile
                    icon={<TrendingUp className="w-6 h-6 text-green-600" />}
                    label="Est. Value (USD)"
                    value={`$${summary?.total_value_usd?.toFixed(2) || '0.00'}`}
                    subtext="Based on TPG valuations"
                    bgColor="bg-green-50 dark:bg-green-900/20"
                />
            </div>

            {/* Breakdown by Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                    <Layers className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Breakdown by Card</h3>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(summary?.by_card || {}).map(([cardName, stats]: any) => (
                        <div key={cardName} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{cardName}</div>
                                    <div className="text-xs text-gray-500">{stats.points.toLocaleString()} pts</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                    ${(stats.value / 100).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-400">Value</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MetricTile({ icon, label, value, subtext, bgColor }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${bgColor}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
                <p className="text-xs text-gray-400 mt-1">{subtext}</p>
            </div>
        </div>
    );
}
