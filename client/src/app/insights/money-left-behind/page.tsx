
"use client";

import React, { useEffect, useState } from 'react';
import { DollarSign, ArrowRight, CreditCard } from 'lucide-react';

export default function MoneyLeftBehindPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/benefits/missed')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading insights...</div>;

    const totalMissed = data?.total_missed_usd || 0;
    const items = data?.items || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 mb-2">
                Money Left Behind
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Rewards you missed by using a sub-optimal card.
            </p>

            {/* KPI Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-red-100 dark:border-red-900/30 p-8 mb-8 flex items-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 mr-6">
                    <DollarSign className="w-10 h-10" />
                </div>
                <div>
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Missed Value</h2>
                    <p className="text-5xl font-bold text-gray-900 dark:text-white mt-1">
                        ${totalMissed.toFixed(2)}
                    </p>
                    <p className="text-sm text-red-500 mt-2">
                        Potential savings across {items.length} transactions
                    </p>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Missed Opportunities</h3>
                </div>

                {items.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p>Great job! You haven't missed any major rewards recently.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map((item: any) => (
                            <div key={item.transaction_id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{item.merchant}</h4>
                                    <p className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                                </div>

                                <div className="flex items-center space-x-4 flex-1">
                                    <div className="text-right flex-1">
                                        <div className="text-xs text-gray-400">Used</div>
                                        <div className="font-medium text-gray-600 line-through decoration-red-400 decoration-2">
                                            {item.actual_card}
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300" />
                                    <div className="text-left flex-1">
                                        <div className="text-xs text-green-500 font-bold">Should Have Used</div>
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {item.optimal_card}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right min-w-[100px]">
                                    <div className="text-xs text-gray-400">Missed</div>
                                    <div className="text-xl font-bold text-red-500">
                                        -${item.missed_value_usd.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-red-400">
                                        {item.missed_points} pts
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
