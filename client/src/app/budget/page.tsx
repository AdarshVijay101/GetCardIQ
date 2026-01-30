"use client";

import React, { useState, useEffect } from 'react';
import { TopNav } from '../../components/layout/TopNav';
import { Card } from '@/components/ui/Card';
import { TrendingUp, Calendar } from 'lucide-react';

interface SpendPoint {
    period: string;
    amount: number;
}

export default function BudgetPage() {
    const [data, setData] = useState<SpendPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:4000/api/dashboard/insights/spend?mode=monthly')
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(e => setLoading(false));
    }, []);

    const maxAmount = Math.max(...data.map(d => d.amount), 1);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold">Spending Analytics</h1>
                        <p className="text-gray-500 mt-2">Track your 30-day spending trend</p>
                    </div>
                </header>

                <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                            Monthly Trend
                        </h2>
                        <div className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Last 30 Days
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
                    ) : (
                        <div className="h-64 flex items-end space-x-2 w-full overflow-x-auto pt-8">
                            {data.map((point, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center group min-w-[20px]">
                                    <div className="relative w-full flex justify-center">
                                        <div
                                            style={{ height: `${(point.amount / maxAmount) * 200}px` }}
                                            className="w-full mx-0.5 bg-blue-500/80 hover:bg-blue-600 rounded-t-sm transition-all relative group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        ></div>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                            ${point.amount.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-400 rotate-0 truncate w-full text-center">
                                        {i % 3 === 0 ? point.period : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
                        <h3 className="text-blue-900 dark:text-blue-100 font-bold mb-1">Total Spent</h3>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            ${data.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </Card>
                </div>
            </main>
        </div>
    );
}
