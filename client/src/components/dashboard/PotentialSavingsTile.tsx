
"use client";

import React, { useEffect, useState } from 'react';
import { TrendingUp, ArrowRight, Wallet, Percent } from 'lucide-react';
import { Card } from '../ui/Card';
import Link from 'next/link';

export const PotentialSavingsTile = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/insights/savings?window=30d')
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(e => setLoading(false));
    }, []);

    if (loading) return <Card className="p-6 h-64 animate-pulse bg-gray-50 dark:bg-gray-900" />;

    const total = data?.total_potential_savings || 0;
    const topOpp = data?.top_opportunities?.[0];

    return (
        <Card className="p-6 relative overflow-hidden border-teal-100 dark:border-teal-900 bg-gradient-to-br from-white to-teal-50 dark:from-gray-900 dark:to-teal-950/30">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-teal-600" />
                        Potential Savings
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Last 30 Days</p>
                </div>
                <div className="bg-teal-100 dark:bg-teal-900/50 p-2 rounded-full">
                    <Percent className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                </div>
            </div>

            <div className="mb-6">
                <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    ${total.toFixed(2)}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Left on the table by using the wrong card.
                </p>
            </div>

            {topOpp ? (
                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-teal-100 dark:border-teal-900/50">
                    <p className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase mb-1">Top Opportunity</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{topOpp.category}</p>
                            <p className="text-xs text-gray-500">Use {topOpp.recommended_card?.name}</p>
                        </div>
                        <div className="text-teal-600 font-bold text-lg">
                            +${topOpp.extra_value.toFixed(2)}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-gray-400">Great job! You maximized your rewards.</div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800/50 flex justify-end">
                <Link href="/insights/spending" className="text-xs font-bold text-teal-600 flex items-center hover:underline">
                    See Full Breakdown <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
            </div>
        </Card>
    );
};
