"use client";

import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/layout/TopNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ArrowUpRight, ArrowDownRight, CreditCard, DollarSign, Wallet } from 'lucide-react';

export default function AccountsPage() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch new summary data (includes net worth, etc)
        fetch('/api/dashboard/summary')
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black">
                <TopNav />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-800 w-1/4 mb-6 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    const netWorth = summary?.kpi?.net_worth || 0;
    const totalDebt = summary?.kpi?.utilization ? "Dynamic" : 0; // We need actual debt value, utilizing utilization for now
    const utilization = summary?.kpi?.utilization || 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <TopNav />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        Accounts Overview
                    </h1>
                    <p className="text-gray-500 mt-2">Your financial snapshot</p>
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Net Worth */}
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Net Worth</CardTitle>
                            <DollarSign className="w-4 h-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                ${netWorth.toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Assets - Liabilities</p>
                        </CardContent>
                    </Card>

                    {/* Credit Card Balance */}
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Credit Card Debt</CardTitle>
                            <CreditCard className="w-4 h-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                ${(Math.abs(netWorth)).toLocaleString()}
                            </div>
                            <p className="text-xs text-red-500 mt-1 flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                {utilization}% Utilization
                            </p>
                        </CardContent>
                    </Card>


                    {/* Cash / Savings */}
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Cash & Savings</CardTitle>
                            <Wallet className="w-4 h-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                $0.00
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Connect savings account</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sub-Pages / Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Credit Cards Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Credit Cards</h2>
                            <button className="text-sm text-blue-600 hover:underline">Manage</button>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium">Your Cards</h3>
                                <p className="text-sm text-gray-500">View detailed breakdown of your credit cards</p>
                            </div>
                            <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium">
                                View Details
                            </button>
                        </div>
                    </div>

                    {/* Savings Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Savings & Investments</h2>
                            <button className="text-sm text-blue-600 hover:underline">Add Account</button>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium">Cash Accounts</h3>
                                <p className="text-sm text-gray-500">Connect your bank to track savings</p>
                            </div>
                            <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                                Connect Bank
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
