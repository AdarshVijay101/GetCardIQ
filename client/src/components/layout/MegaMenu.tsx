"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    CreditCard,
    PiggyBank,
    LineChart,
    Calendar,
    DollarSign,
    Gift,
    History,
    Clock,
    Target,
    ChevronDown
} from 'lucide-react';

export function MegaMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const closeMenu = () => setIsOpen(false);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors 
                    ${isOpen ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 p-6 grid grid-cols-2 gap-8">

                    {/* Column 1 */}
                    <div className="space-y-6">
                        {/* ACCOUNTS */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Accounts</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/accounts" onClick={closeMenu} className="group flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                                            <LayoutDashboard className="w-5 h-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Overview</p>
                                            <p className="text-xs text-gray-500">Net worth & balances</p>
                                        </div>
                                    </Link>
                                </li>

                                <li>
                                    <Link href="/accounts/savings" onClick={closeMenu} className="group flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="p-2 bg-green-100 dark:bg-green-900 text-green-600 rounded-lg group-hover:bg-green-200 transition-colors">
                                            <PiggyBank className="w-5 h-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Savings & Cash</p>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* GOALS */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Goals</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/goals" onClick={closeMenu} className="group flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="p-2 bg-pink-100 dark:bg-pink-900 text-pink-600 rounded-lg group-hover:bg-pink-200 transition-colors">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Financial Goals</p>
                                            <p className="text-xs text-gray-500">Track progress & milestones</p>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-6">
                        {/* INSIGHTS */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Insights</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/insights/spending" onClick={closeMenu} className="group flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900 text-purple-600 rounded-lg group-hover:bg-purple-200 transition-colors">
                                            <LineChart className="w-5 h-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Spending Analytics</p>
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/insights/recurring" onClick={closeMenu} className="group flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900 text-orange-600 rounded-lg group-hover:bg-orange-200 transition-colors">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Recurring & Subscriptions</p>
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/insights/money-left-behind" onClick={closeMenu} className="group flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="p-2 bg-red-100 dark:bg-red-900 text-red-600 rounded-lg group-hover:bg-red-200 transition-colors">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Money Left Behind</p>
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/market" onClick={closeMenu} className="group flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="p-2 bg-pink-100 dark:bg-pink-900 text-pink-600 rounded-lg group-hover:bg-pink-200 transition-colors">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Marketplace</p>
                                            <p className="text-xs text-gray-500">Top Cards (Live)</p>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* REWARDS */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Rewards</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/rewards/earned" onClick={closeMenu} className="group flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 rounded-lg group-hover:bg-yellow-200 transition-colors">
                                            <Gift className="w-5 h-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Rewards Hub</p>
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/rewards/ledger" onClick={closeMenu} className="group flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="p-2 bg-teal-100 dark:bg-teal-900 text-teal-600 rounded-lg group-hover:bg-teal-200 transition-colors">
                                            <History className="w-5 h-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">History & Ledger</p>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer/Summary (Optional) */}
                    <div className="col-span-2 border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-between">
                        <Link href="/settings" onClick={closeMenu} className="text-sm text-gray-500 hover:text-blue-600 flex items-center">
                            Manage Settings
                        </Link>

                    </div>
                </div>
            )}
        </div>
    );
}
