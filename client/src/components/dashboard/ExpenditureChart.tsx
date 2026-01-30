"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { Settings } from 'lucide-react';

const dataMonthly = [
    { name: '01', value: 48000 },
    { name: '05', value: 43000 },
    { name: '09', value: 47000 },
    { name: '13', value: 43000 },
    { name: '17', value: 60000 },
    { name: '21', value: 45000 },
    { name: '26', value: 46000 },
    { name: '31', value: 49000 },
];

const dataYearly = [
    { name: 'Jan', value: 450000 },
    { name: 'Feb', value: 520000 },
    { name: 'Mar', value: 480000 },
    { name: 'Apr', value: 610000 },
    { name: 'May', value: 550000 },
    { name: 'Jun', value: 670000 },
    { name: 'Jul', value: 600000 },
    { name: 'Aug', value: 720000 },
    { name: 'Sep', value: 650000 },
    { name: 'Oct', value: 700000 },
    { name: 'Nov', value: 815390 },
    { name: 'Dec', value: 780000 },
];

export const ExpenditureChart = () => {
    const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
    const data = view === 'monthly' ? dataMonthly : dataYearly;

    return (
        <Card className="p-6 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Revenue</h3>
                    <div className="flex items-baseline space-x-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">This {view === 'monthly' ? 'month' : 'year'}</p>
                            <h4 className="text-2xl font-bold text-red-500">$ {view === 'monthly' ? '815,390' : '9,240,000'}</h4>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Last {view === 'monthly' ? 'month' : 'year'}</p>
                            <h4 className="text-lg font-medium text-gray-400">$ {view === 'monthly' ? '743,950' : '8,100,000'}</h4>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setView('monthly')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'monthly' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setView('yearly')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'yearly' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                        >
                            Yearly
                        </button>
                    </div>
                    <Settings className="w-5 h-5 text-gray-300 hover:text-gray-500 cursor-pointer" />
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
