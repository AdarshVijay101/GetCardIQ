
"use client";

import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/layout/TopNav';
import { ExternalLink, Star, RefreshCw, AlertCircle, DollarSign, Percent, Gift } from 'lucide-react';

export default function TopCardsPage() {
    const [cards, setCards] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCards = async () => {
        try {
            const res = await fetch('/api/cards/top');
            const data = await res.json();
            setCards(data.cards || []);
            setLastUpdated(data.last_updated_at);
            setSyncStatus(data.scrape_status);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch top cards", e);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
        const interval = setInterval(() => {
            if (syncStatus?.status === 'running' || syncStatus?.status === 'queued') {
                fetchCards();
            }
        }, 1000); // Faster polling for smoother UI
        return () => clearInterval(interval);
    }, [syncStatus?.status]);

    const handleResync = async () => {
        setRefreshing(true);
        try {
            await fetch('/api/cards/top/resync', { method: 'POST' });
            fetchCards();
        } catch (e) {
            console.error("Resync failed", e);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 sticky top-0 z-10 bg-gray-50 dark:bg-black py-4 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center">
                            Top Credit Cards
                            <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                                {cards.length} Cards
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-2">Curated list with live details (Fees, APR, Bonuses).</p>

                        {lastUpdated && (
                            <p className="text-xs text-gray-400 mt-1">
                                Last Updated: {new Date(lastUpdated).toLocaleString()}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col items-end w-full md:w-auto">
                        {syncStatus?.status === 'running' && (
                            <div className="mb-2 w-full md:w-64">
                                <div className="flex justify-between text-xs text-blue-600 font-bold mb-1">
                                    <span>Syncing Live Data...</span>
                                    <span>{syncStatus.progress}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                        style={{ width: `${syncStatus.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleResync}
                            disabled={refreshing || syncStatus?.status === 'running'}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing || syncStatus?.status === 'running' ? 'animate-spin' : ''}`} />
                            {syncStatus?.status === 'running' ? 'Syncing...' : 'Resync Database'}
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="text-center py-32 text-gray-500">Loading marketplace...</div>
                ) : cards.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium">No cards found</h3>
                        <p className="text-gray-500">Run a resync to populate the database.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {cards.map((card) => (
                            <div key={card.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col md:flex-row hover:shadow-xl transition-shadow group relative overflow-hidden">
                                {/* Left: Image */}
                                <div className="md:w-56 flex-shrink-0 flex flex-col items-center justify-start md:mr-8 mb-6 md:mb-0">
                                    <div className="w-full aspect-[1.586] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative shadow-md">
                                        {card.imageUrl ? (
                                            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain p-2" onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x200?text=No+Image')} />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-xs text-gray-400">No Image</div>
                                        )}
                                    </div>
                                    <a
                                        href={card.applyUrl || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`mt-4 w-full py-2.5 rounded-lg font-bold text-center text-sm flex items-center justify-center transition-colors ${card.applyUrl
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        onClick={(e) => !card.applyUrl && e.preventDefault()}
                                    >
                                        {card.applyUrl ? 'Apply Now' : 'Unavailable'}
                                        <ExternalLink className="w-3 h-3 ml-2" />
                                    </a>
                                </div>

                                {/* Right: Details */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{card.issuer}</p>
                                            <h3 className="font-bold text-2xl group-hover:text-blue-600 transition-colors">{card.name}</h3>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                            <div className="text-xs text-gray-500 flex items-center mb-1"><DollarSign className="w-3 h-3 mr-1" /> Annual Fee</div>
                                            <div className="font-bold">{card.annualFee || 'N/A'}</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                            <div className="text-xs text-gray-500 flex items-center mb-1"><Percent className="w-3 h-3 mr-1" /> APR</div>
                                            <div className="font-bold text-sm leading-tight">{card.apr || 'N/A'}</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg col-span-2">
                                            <div className="text-xs text-gray-500 flex items-center mb-1"><Gift className="w-3 h-3 mr-1" /> Welcome Bonus</div>
                                            <div className="font-bold text-sm text-green-700 dark:text-green-400">
                                                {card.welcomeBonus || 'None'}
                                                {card.minSpend && <span className="block text-xs font-normal text-gray-500">Spend {card.minSpend}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rewards Features */}
                                    <div>
                                        <h4 className="text-sm font-bold mb-2">Rewards Structure</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {card.rewards?.features && card.rewards.features.map((feature: string, i: number) => (
                                                <span key={i} className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-900">
                                                    {feature}
                                                </span>
                                            ))}
                                            {!card.rewards?.features && <span className="text-gray-400 text-sm">See details on site</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
