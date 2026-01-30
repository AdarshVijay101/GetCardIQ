"use client";

import React from 'react';
import Link from 'next/link';
import { Plus, Search, Bell, Settings } from 'lucide-react';
import { TopNav } from '@/components/layout/TopNav';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { BestCardHero } from '@/components/dashboard/BestCardHero';
import { MoneyLeftBehind } from '@/components/dashboard/MoneyLeftBehind';
import { AlertsFeed } from '@/components/dashboard/AlertsFeed';
import { NextBestActions } from '@/components/dashboard/NextBestActions';
import { SpendChart } from '@/components/dashboard/SpendChart';
import { WalletGrid } from '@/components/dashboard/WalletGrid';
import { TransactionHistory } from '@/components/dashboard/TransactionHistory';
import { PotentialSavingsTile } from '@/components/dashboard/PotentialSavingsTile';


export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
      {/* Top Navigation Bar */}
      <TopNav />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Section A: KPI Strip */}
        <KpiStrip />

        {/* Section B & C & D: Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Center Main Column (Hero + Money Left Behind) */}
          <div className="lg:col-span-8 space-y-6">
            <BestCardHero />

            {/* New Spending Analytics Chart */}
            <SpendChart />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MoneyLeftBehind />
              <PotentialSavingsTile />
            </div>

            {/* Wallet Grid */}
            <WalletGrid />

            {/* Transaction History */}
            <TransactionHistory />
          </div>

          {/* Right Rail (Alerts + Actions) */}
          <div className="lg:col-span-4 space-y-6">
            <AlertsFeed />
            <NextBestActions />
          </div>
        </div>

      </div>

      <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-800 mt-12">
        <p className="text-gray-400 text-sm">GetCardIQ Demo Dashboard &copy; 2024</p>
      </div>

    </main >
  );
}
