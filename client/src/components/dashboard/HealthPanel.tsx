"use client";
import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Activity, CreditCard, ShieldCheck } from 'lucide-react';

export const HealthPanel = () => {
    const [utilization, setUtilization] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/dashboard/summary`)
            .then(r => r.json())
            .then(d => {
                setUtilization(Number(d.kpi?.utilization || 0));
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, []);

    const getColor = (u: number) => {
        if (u < 10) return 'bg-blue-500';
        if (u < 30) return 'bg-green-500';
        if (u < 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getStatus = (u: number) => {
        if (u < 10) return { text: "Excellent", color: "text-blue-600" };
        if (u < 30) return { text: "Good", color: "text-green-600" };
        if (u < 50) return { text: "Fair", color: "text-yellow-600" };
        return { text: "High Usage", color: "text-red-600" };
    };

    const status = getStatus(utilization);

    return (
        <Card className="p-6 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900 dark:text-white">Credit Health</h3>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Utilization */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Utilization</span>
                            <span className="font-bold">{utilization.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                            <div className={`${getColor(utilization)} h-2 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(utilization, 100)}%` }}></div>
                        </div>
                        <p className={`text-xs font-medium mt-1 ${status.color}`}>{status.text} (Target: &lt; 30%)</p>
                    </div>



                    {/* Total Limit Mock - could extract from kpi if added */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Total Cards</span>
                        </div>
                        <span className="font-bold">4</span>
                    </div>
                </div>
            )}
        </Card>
    );
};
