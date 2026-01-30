import React from 'react';
import { WalletGrid } from '@/components/dashboard/WalletGrid';
import { TopNav } from '@/components/layout/TopNav';

export default function SavingsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <TopNav />
            <div className="max-w-7xl mx-auto p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings & Checking</h1>
                </div>
                <WalletGrid filterType="depository" />
            </div>
        </div>
    );
}
