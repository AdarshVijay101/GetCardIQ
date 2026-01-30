"use client";

import React, { useState, useEffect } from 'react';
import { TopNav } from '../../../components/layout/TopNav';
import { Calendar, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function RecurringPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:4000/api/insights/recurring')
            .then(res => res.json())
            .then(data => {
                setSubscriptions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const totalMonthly = subscriptions.reduce((acc, sub) => acc + Number(sub.average_amount), 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold">Recurring & Subscriptions</h1>
                        <p className="text-gray-500 mt-2">Manage your regular payments</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Est. Monthly Cost</p>
                        <p className="text-3xl font-bold text-blue-600">${totalMonthly.toFixed(2)}</p>
                    </div>
                </header>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-800">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No subscriptions detected</h3>
                        <p className="text-gray-500">We search for regular patterns in your transaction history.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Merchant</th>
                                        <th className="px-6 py-4 font-medium">Amount (Avg)</th>
                                        <th className="px-6 py-4 font-medium">Frequency</th>
                                        <th className="px-6 py-4 font-medium">Last Paid</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {subscriptions.map(sub => (
                                        <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 flex items-center justify-center mr-3 font-bold text-xs">
                                                    {sub.merchant_name[0]}
                                                </div>
                                                {sub.merchant_name}
                                            </td>
                                            <td className="px-6 py-4 font-medium">${sub.average_amount}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    <RefreshCw className="w-3 h-3 mr-1" />
                                                    {sub.frequency}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(sub.last_paid).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button className="text-gray-400 hover:text-green-600 tooltip" title="Confirm">
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button className="text-gray-400 hover:text-red-600 tooltip" title="Not a sub">
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
