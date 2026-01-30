"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "../ui/Card";

type Row = { period: string; amount: number };


export const SpendChart = ({ userId = 'default-user-id' }: { userId?: string }) => {
    const [mode, setMode] = useState<"monthly" | "quarterly" | "yearly" | "custom">("monthly");
    const [data, setData] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);

    const [customStart, setCustomStart] = useState(() => {
        const d = new Date(); d.setMonth(d.getMonth() - 2); return d.toISOString().split('T')[0];
    });
    const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        setLoading(true);
        let url = `http://localhost:4000/api/dashboard/insights/spend?mode=${mode}`;
        if (mode === 'custom') {
            url += `&start=${customStart}&end=${customEnd}`;
        }

        fetch(url)
            .then(r => r.json())
            .then(d => {
                const raw = Array.isArray(d) ? d : (d.monthly_trends || []);
                // Map API keys (month, spend) to Chart keys (period, amount)
                const chartData = raw.map((item: any) => ({
                    period: item.month || item.period,
                    amount: item.spend !== undefined ? item.spend : item.amount
                }));
                setData(chartData);
                setLoading(false);
            })
            .catch(e => {
                console.error("Failed to load spend data", e);
                setLoading(false);
            });
    }, [mode, userId, customStart, customEnd]);

    const title = useMemo(() => {
        if (mode === 'monthly') return 'Monthly';
        if (mode === 'quarterly') return 'Quarterly';
        return 'Yearly';
    }, [mode]);

    return (
        <Card className="p-6 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 col-span-1 lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Spending Analytics</h3>
                    <p className="text-sm text-gray-500">{title} Expenses Trend (Quick View)</p>
                </div>

                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {['monthly', 'quarterly', 'yearly'].map((m) => (
                        <button
                            key={m}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${mode === m ? "bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"}`}
                            onClick={() => setMode(m as any)}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-72 w-full">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">Loading data...</div>
                ) : data.length === 0 ? (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm italic">No spending data found.</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                            <XAxis
                                dataKey="period"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                cursor={{ stroke: '#6366F1', strokeWidth: 2 }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spend']}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#6366F1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}

