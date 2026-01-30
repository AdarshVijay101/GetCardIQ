"use client";
import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { ShoppingCart, Utensils, Plane, Fuel, Smartphone, CreditCard } from 'lucide-react';

const CATEGORIES = [
    { id: 'dining', label: 'Dining', icon: <Utensils className="w-4 h-4" /> },
    { id: 'grocery', label: 'Grocery', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'travel', label: 'Travel', icon: <Plane className="w-4 h-4" /> },
    { id: 'gas', label: 'Gas', icon: <Fuel className="w-4 h-4" /> },
    { id: 'online', label: 'Online', icon: <Smartphone className="w-4 h-4" /> },
];

export const BestCardHero = () => {
    const [selectedCat, setSelectedCat] = useState('dining');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s Timeout (Backup)

        fetch(`http://localhost:4000/api/recommendations/best-card?category=${selectedCat}`, { signal: controller.signal })
            .then(async r => {
                if (!r.ok) {
                    throw new Error(`Status ${r.status}`);
                }
                return r.json();
            })
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(e => {
                if (e.name !== 'AbortError') {
                    console.error("Rec Error", e);
                    setError("Unavailable");
                }
                setLoading(false);
            })
            .finally(() => clearTimeout(timeoutId));

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [selectedCat]);

    const renderCard = (title: string, info: any) => (
        <div className="flex-1 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 min-w-[200px]">
            <h4 className="text-white/60 text-xs font-bold uppercase mb-2">{title}</h4>
            <div className={`p-4 rounded-lg bg-gradient-to-br ${info?.img?.replace('bg-', 'from-') || 'from-gray-600'} to-gray-900 shadow-lg mb-3`}>
                <div className="text-white text-lg font-bold truncate">{info?.card || '...'}</div>
                <div className="text-white/80 text-xs">{info?.multiplier || ''}</div>
            </div>
            <p className="text-white/70 text-xs leading-snug">{info?.why}</p>
        </div>
    );

    return (
        <Card className="p-0 border-none shadow-xl overflow-hidden relative min-h-[350px] flex flex-col bg-gray-900">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-90" />

            <div className="relative z-10 p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-white/80 uppercase tracking-widest text-xs font-bold mb-1">Recommendation Engine</h3>
                        <h2 className="text-2xl font-bold text-white">Best Card for {CATEGORIES.find(c => c.id === selectedCat)?.label}</h2>
                    </div>
                </div>

                {/* Dual Cards */}
                <div className="flex gap-4 mb-6 overflow-x-auto">
                    {loading ? (
                        <>
                            <div className="flex-1 h-40 bg-white/5 animate-pulse rounded-xl" />
                            <div className="flex-1 h-40 bg-white/5 animate-pulse rounded-xl" />
                        </>
                    ) : error ? (
                        <div className="w-full text-center text-red-400 py-8 border border-red-900 bg-red-900/20 rounded-xl">
                            Unable to load recommendations. <button onClick={() => setSelectedCat(c => c)} className="underline">Retry</button>
                        </div>
                    ) : (
                        <>
                            {renderCard("In Your Wallet", data?.owned)}
                            {renderCard("Recommended Upgrade", data?.suggested)}
                        </>
                    )}
                </div>

                {/* Categories */}
                <div className="mt-auto">
                    <p className="text-white/40 text-xs font-bold uppercase mb-3">Checking Category:</p>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCat(cat.id)}
                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCat === cat.id
                                    ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-white/20'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {cat.icon}
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>


        </Card>
    );
};
