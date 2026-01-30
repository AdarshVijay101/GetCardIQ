"use client";

import React, { useEffect, useState } from 'react';
import { getDashboardSummary } from '../../services/dashboardService';
import { Card } from '../ui/Card';

export const UtilizationWidget = () => {
    const [utilization, setUtilization] = useState<number | null>(null);

    useEffect(() => {
        getDashboardSummary().then(data => {
            if (data && data.kpi && data.kpi.utilization) {
                setUtilization(parseFloat(data.kpi.utilization));
            }
        });
    }, []);

    const value = utilization || 0;
    const status = value < 10 ? 'Excellent' : value < 30 ? 'Good' : value < 60 ? 'Fair' : 'High';
    const color = value < 30 ? 'bg-green-500' : value < 60 ? 'bg-yellow-500' : 'bg-red-500';
    const textColor = value < 30 ? 'text-green-600' : value < 60 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold mb-4">Utilization & Health</h3>
            <div className="space-y-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Credit Usage</span>
                    <span className="font-bold">{value}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(value, 100)}%` }}></div>
                </div>
                <p className={`text-xs font-medium ${textColor}`}>{status} (Below 30% is best)</p>
            </div>
        </div>
    );
};
