"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ChevronRight, ChevronLeft, CreditCard, Save } from 'lucide-react';

const ISSUERS = ['Chase', 'American Express', 'Capital One', 'Citi', 'Discover', 'Wells Fargo', 'Bank of America', 'Other'];
const CATEGORIES = ['Dining', 'Travel', 'Groceries', 'Gas', 'Online Shopping', 'Other'];

export const AddCardWizard = () => {
    const [step, setStep] = useState(1);
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

    const submit = async () => {
        // TODO: Call API
        console.log("Submitting", data);
        alert("Card Saved (Mock)!");
    };

    const renderStep = () => {
        switch (step) {
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
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl text-white shadow-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-400 text-sm">{data.issuer}</p>
                                    <h2 className="text-2xl font-bold mt-1">{data.cardName}</h2>
                                </div>
                                <CreditCard className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="mt-8 grid grid-cols-3 gap-4">
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
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
                <CardTitle>Add New Card</CardTitle>
                <span className="text-sm text-gray-500">Step {step} of 4</span>
            </CardHeader>
            <CardContent className="py-6 min-h-[400px]">
                {renderStep()}
            </CardContent>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between bg-gray-50/50 dark:bg-gray-900/50 rounded-b-xl">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={step === 1}
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
        </Card>
    );
};
