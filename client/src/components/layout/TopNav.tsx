"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import { DemoModeToggle } from './DemoModeToggle';
import { AIHealthIndicator } from '../dashboard/AIHealthIndicator';

export function TopNav() {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any>(null);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (q.length > 2) {
            const res = await fetch(`http://localhost:4000/api/search?q=${q}`);
            const data = await res.json();
            setSearchResults(data);
        } else {
            setSearchResults(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* Left: Brand & Mega Menu */}
                <div className="flex items-center space-x-6">
                    <Link href="/">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 cursor-pointer">
                            GetCardIQ
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-6">
                        <MegaMenu />
                        <Link href="/market" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors">
                            Top Cards
                        </Link>
                    </div>
                </div>

                {/* Center: Search */}
                <div className="hidden lg:flex flex-1 max-w-lg mx-8 relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search merchants, transactions, or benefits..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />

                    {/* Search Dropdown Results */}
                    {searchResults && (
                        <div className="absolute top-12 left-0 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                            {/* Transactions */}
                            {searchResults.transactions?.length > 0 && (
                                <div className="p-2">
                                    <div className="text-xs font-bold text-gray-500 mb-1 px-2">TRANSACTIONS</div>
                                    {searchResults.transactions.map((t: any) => (
                                        <div key={t.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded flex justify-between cursor-pointer">
                                            <span className="text-sm font-medium">{t.title}</span>
                                            <span className="text-xs text-gray-500">{t.subtitle}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Benefits */}
                            {searchResults.benefits?.length > 0 && (
                                <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="text-xs font-bold text-gray-500 mb-1 px-2">BENEFITS</div>
                                    {searchResults.benefits.map((b: any) => (
                                        <div key={b.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                                            <div className="text-sm font-medium">{b.title}</div>
                                            <div className="text-xs text-gray-500">{b.subtitle}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Actions & User */}
                <div className="flex items-center space-x-4">
                    <DemoModeToggle />
                    <AIHealthIndicator />

                    <Link href="/notifications">
                        <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative mt-1">
                            <Bell className="w-5 h-5" />
                            {/* In real app, check 'unreadCount' prop */}
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                        </button>
                    </Link>

                    <Link href="/cards/new">
                        <div className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-sm">
                            <Plus className="w-5 h-5" />
                        </div>
                    </Link>

                    {/* Personal Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 ring-1 ring-black ring-opacity-5 z-50">
                                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center">
                                    <User className="w-4 h-4 mr-2" /> Profile
                                </Link>
                                <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center">
                                    <Settings className="w-4 h-4 mr-2" /> Settings
                                </Link>
                                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                                <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center">
                                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Overlay to close dropdown */}
            {isProfileOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
            )}
        </div>
    );
}
