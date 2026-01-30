"use client";

import React, { useState, useEffect } from 'react';
import { TopNav } from '../../components/layout/TopNav';
import { Card } from '@/components/ui/Card';
import { Award, Gift, TrendingUp, DollarSign } from 'lucide-react';

interface RewardBalance {
    id: string;
    nickname: string;
    issuer: string;
    current_points_balance: number;
    value_cents: number;
    point_value_cents: number;
}

export default function RewardsPage() {
    const [balances, setBalances] = useState<RewardBalance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch from backend (assumed endpoint based on routes)
        fetch('http://localhost:4000/api/rewards/balances')
            .then(res => res.json())
            .then(data => {
                setBalances(data);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, []);

    const totalValue = balances.reduce((acc, curr) => acc + (curr.current_points_balance * (curr.point_value_cents || 1.0)), 0) / 100;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold">Rewards Hub</h1>
                        <p className="text-gray-500 mt-2">Manage your points and redemptions</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total Value</p>
                        <p className="text-3xl font-bold text-green-600">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Action Cards */}
                    <Card className="p-6 bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20 hover:shadow-md transition-shadow cursor-pointer">
                        <Gift className="w-8 h-8 text-purple-600 mb-4" />
                        <h3 className="font-bold text-lg mb-1 text-purple-900 dark:text-purple-100">Redeem Points</h3>
                        <p className="text-sm text-purple-700/80 dark:text-purple-300">Browse gift cards and travel implementation</p>
                    </Card>
                    <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 hover:shadow-md transition-shadow cursor-pointer">
                        <TrendingUp className="w-8 h-8 text-blue-600 mb-4" />
                        <h3 className="font-bold text-lg mb-1 text-blue-900 dark:text-blue-100">Optimize Transfer</h3>
                        <p className="text-sm text-blue-700/80 dark:text-blue-300">Find the best airline partner</p>
                    </Card>
                    <Card className="p-6 bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20 hover:shadow-md transition-shadow cursor-pointer">
                        <DollarSign className="w-8 h-8 text-green-600 mb-4" />
                        <h3 className="font-bold text-lg mb-1 text-green-900 dark:text-green-100">Cash Out</h3>
                        <p className="text-sm text-green-700/80 dark:text-green-300">Convert points to statement credit</p>
                    </Card>
                </div>

                <h2 className="text-xl font-bold mb-4">Point Balances</h2>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>)}
                    </div>
                ) : balances.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500">No point balances found. Link a card to see rewards.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {balances.map(prog => (
                            <Card key={prog.id} className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                        <Award className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
                                        ${((prog.current_points_balance * (prog.point_value_cents || 1.0)) / 100).toFixed(2)}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg">{prog.nickname}</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {prog.current_points_balance.toLocaleString()} <span className="text-sm font-normal text-gray-500">pts</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-4">{prog.issuer}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
