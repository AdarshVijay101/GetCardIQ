"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Trash2, Calendar, DollarSign } from 'lucide-react';

interface Benefit {
    id: string;
    name: string;
    totalValue: number;
    usedValue: number;
    expiryDate: string;
}

export const BenefitsEditor = () => {
    const [benefits, setBenefits] = useState<Benefit[]>([
        { id: '1', name: 'Travel Credit', totalValue: 300, usedValue: 120, expiryDate: '2026-12-31' },
        { id: '2', name: 'Uber Cash', totalValue: 15, usedValue: 15, expiryDate: '2026-02-01' }
    ]);

    const addBenefit = () => {
        setBenefits([...benefits, { id: Date.now().toString(), name: '', totalValue: 0, usedValue: 0, expiryDate: '' }]);
    };

    const update = (id: string, field: keyof Benefit, value: any) => {
        setBenefits(benefits.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const remove = (id: string) => {
        setBenefits(benefits.filter(b => b.id !== id));
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Card Benefits & Credits</CardTitle>
                <Button size="sm" variant="outline" onClick={addBenefit}>
                    <Plus className="w-4 h-4 mr-2" /> Add Benefit
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {benefits.map((benefit) => {
                    const remaining = benefit.totalValue - benefit.usedValue;
                    const percent = Math.min(100, Math.max(0, (benefit.usedValue / benefit.totalValue) * 100)) || 0;

                    return (
                        <div key={benefit.id} className="p-4 border rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-4">
                                    <Input
                                        label="Benefit Name"
                                        value={benefit.name}
                                        onChange={(e) => update(benefit.id, 'name', e.target.value)}
                                        placeholder="e.g. Airline Fee Credit"
                                    />
                                </div>
                                <div className="md:col-span-2 relative">
                                    <Input
                                        label="Total Value"
                                        type="number"
                                        value={benefit.totalValue}
                                        onChange={(e) => update(benefit.id, 'totalValue', parseFloat(e.target.value))}
                                    />
                                    {/* Icon overlay could go here */}
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Used"
                                        type="number"
                                        value={benefit.usedValue}
                                        onChange={(e) => update(benefit.id, 'usedValue', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input
                                        label="Expires"
                                        type="date"
                                        value={benefit.expiryDate}
                                        onChange={(e) => update(benefit.id, 'expiryDate', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-end pb-2">
                                    <button onClick={() => remove(benefit.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-500">
                                        {remaining > 0 ? `$${remaining.toFixed(2)} Remaining` : 'Fully Used'}
                                    </span>
                                    <span className="text-gray-400">{percent.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${remaining <= 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
                {benefits.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No benefits tracked. Add one to insure you get your money's worth!
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
