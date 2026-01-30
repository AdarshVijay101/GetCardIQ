import React from 'react';
import { WalletGrid } from '@/components/dashboard/WalletGrid';
import { TopNav } from '@/components/layout/TopNav';

export default function CreditCardsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <TopNav />
            <div className="max-w-7xl mx-auto p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Credit Cards</h1>
                </div>
                <WalletGrid filterType="credit" />
            </div>
        </div>
    );
}
