"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ChevronRight, ChevronLeft, CreditCard, Save, Search, Sparkles } from 'lucide-react';
import { searchCards, CardPreset } from '@/services/smartCardService';
import { PlaidLinkButton } from './PlaidLinkButton';

const ISSUERS = ['Chase', 'American Express', 'Capital One', 'Citi', 'Discover', 'Wells Fargo', 'Bank of America', 'Other'];
const CATEGORIES = ['Dining', 'Travel', 'Groceries', 'Gas', 'Online Shopping', 'Streaming', 'Other'];

export const AddCardWizard = () => {
    const router = useRouter();
    const [step, setStep] = useState(0); // 0 = Search, 1 = Issuer, etc.
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<CardPreset[]>([]);

    const [data, setData] = useState({
        issuer: '',
        cardName: '',
        rewards: CATEGORIES.map(c => ({ category: c, multiplier: 1.0 }))
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const updateReward = (cat: string, val: string) => {
        const num = parseFloat(val);
        setData(prev => ({
            ...prev,
            rewards: prev.rewards.map(r => r.category === cat ? { ...r, multiplier: isNaN(num) ? 0 : num } : r)
        }));
    };

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.trim().length > 0) {
            try {
                const results = await searchCards(q);
                setSearchResults(results);
            } catch (err) {
                console.error("Search failed", err);
            }
        } else {
            setSearchResults([]);
        }
    };

    const applyPreset = (preset: CardPreset) => {
        setData({
            issuer: preset.issuer,
            cardName: preset.name,
            rewards: CATEGORIES.map(cat => {
                const found = preset.rewards.find(r => r.category === cat);
                return { category: cat, multiplier: found ? found.multiplier : 1.0 };
            })
        });
        setStep(4); // Jump to Review
    };

    const submit = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Failed to save');

            alert("Card Saved Successfully!");
            router.push('/');
            // Force reload to show new card? Or rely on dashboard fetch
            window.location.href = '/';
        } catch (e) {
            console.error(e);
            alert("Error saving card.");
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2">
                                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold">Smart Lookup</h3>
                            <p className="text-gray-500">Search for your card to auto-fill rewards.</p>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Search 'Sapphire', 'Gold'..."
                                className="pl-10 py-6 text-lg"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="grid gap-3">
                                {searchResults.map(card => (
                                    <div
                                        key={card.id}
                                        onClick={() => applyPreset(card)}
                                        className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer flex justify-between items-center transition-all"
                                    >
                                        <div>
                                            <p className="font-bold">{card.issuer}</p>
                                            <p className="text-sm text-gray-500">{card.name}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="text-center pt-4 space-y-3">
                            {/* Plaid Link Option */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200 dark:border-gray-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-black px-2 text-gray-500">Or automate it</span>
                                </div>
                            </div>

                            <PlaidLinkButton onSuccess={() => router.push('/')} />

                            <p className="text-sm text-gray-500 mb-2 pt-4">Can't find your card?</p>
                            <Button variant="outline" onClick={handleNext} className="w-full">
                                Enter Details Manually
                            </Button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-medium">Select Issuer</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {ISSUERS.map(iss => (
                                <button
                                    key={iss}
                                    onClick={() => { setData({ ...data, issuer: iss }); handleNext(); }}
                                    className={`p-4 border rounded-xl text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${data.issuer === iss ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                                >
                                    <span className="font-medium">{iss}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                // ... (Same as before)
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-medium">Card Name</h3>
                        <Input
                            label="Card Name"
                            placeholder="e.g. Sapphire Preferred"
                            value={data.cardName}
                            onChange={(e) => setData({ ...data, cardName: e.target.value })}
                            autoFocus
                        />
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-medium">Reward Multipliers</h3>
                        <p className="text-sm text-gray-500">Enter points per $1 spent.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.rewards.map((r, i) => (
                                <div key={r.category} className="flex items-center space-x-2">
                                    <div className="flex-1 text-sm font-medium">{r.category}</div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={r.multiplier}
                                            onChange={(e) => updateReward(r.category, e.target.value)}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400">x</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-gray-400 text-sm">{data.issuer}</p>
                                    <h2 className="text-2xl font-bold mt-1">{data.cardName}</h2>
                                </div>
                                <CreditCard className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="mt-8 grid grid-cols-3 gap-4 relative z-10">
                                {data.rewards.filter(r => r.multiplier > 1).slice(0, 3).map(r => (
                                    <div key={r.category}>
                                        <p className="text-xs text-gray-400">{r.category}</p>
                                        <p className="text-xl font-bold text-blue-400">{r.multiplier}x</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-500">Full Rewards Profile</h4>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                {data.rewards.map(r => (
                                    <div key={r.category} className="flex justify-between border-b pb-1 border-gray-100 dark:border-gray-800">
                                        <span>{r.category}</span>
                                        <span className="font-medium">{r.multiplier}x</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <Button variant="ghost" onClick={() => router.push('/')} className="mb-4 pl-0 hover:bg-transparent hover:text-blue-500">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
                    <CardTitle>Add New Card</CardTitle>
                    {step > 0 && <span className="text-sm text-gray-500">Step {step} of 4</span>}
                </CardHeader>
                <CardContent className="py-6 min-h-[400px]">
                    {renderStep()}
                </CardContent>
                {step > 0 && (
                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between bg-gray-50/50 dark:bg-gray-900/50 rounded-b-xl">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </Button>

                        {step < 4 ? (
                            <Button onClick={handleNext} disabled={step === 1 && !data.issuer || step === 2 && !data.cardName}>
                                Next <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={submit} variant="primary">
                                <Save className="w-4 h-4 mr-2" /> Save Card
                            </Button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};
