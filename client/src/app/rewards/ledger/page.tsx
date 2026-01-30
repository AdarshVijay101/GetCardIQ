
"use client";

import React, { useEffect, useState } from 'react';
import { History, ArrowRight } from 'lucide-react';
import { TopNav } from '@/components/layout/TopNav';

export default function LedgerPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/insights/ledger')
            .then(res => res.json())
            .then(data => {
                setTransactions(data.data || []);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold flex items-center">
                        <History className="w-8 h-8 mr-3 text-teal-600" />
                        Rewards Ledger
                    </h1>
                    <p className="text-gray-500 mt-2">History of points earned per transaction.</p>
                </header>

                {loading ? (
                    <div>Loading ledger...</div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rewards</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(tx.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tx.merchant}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                                            ${tx.amount?.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                                            +{Math.round(tx.reward_points)} pts
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
