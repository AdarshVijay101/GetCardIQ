import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, AlertTriangle, Clock, Award } from 'lucide-react';
import { getDashboardSummary, DashboardSummary } from '../../services/dashboardService';

export const KpiStrip = () => {
    const [data, setData] = useState<DashboardSummary['kpi'] | null>(null);

    useEffect(() => {
        getDashboardSummary().then(summary => {
            if (summary) setData(summary.kpi);
        });
    }, []);

    // loading state or default 0
    const kpi = data || { rewards_earned: 0, rewards_rate: 0, money_left_behind: 0, expiring_value: 0 };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-4 flex flex-col justify-between border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Rewards Earned</span>
                    <Award className="w-5 h-5 text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-1 rounded" />
                </div>
                <div className="mt-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.rewards_earned.toLocaleString()} pt</h3>
                    <p className="text-xs text-green-500 flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +${(kpi.rewards_earned / 100).toFixed(2)} Value
                    </p>
                </div>
            </Card>



            <Card className="p-4 flex flex-col justify-between border-red-50 dark:border-red-900/10 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute right-0 top-0 w-16 h-16 bg-red-500/5 rounded-bl-full -mr-4 -mt-4"></div>
                <div className="flex justify-between items-start relative z-10">
                    <span className="text-red-600 dark:text-red-400 text-xs font-medium uppercase tracking-wider">Money Left Behind</span>
                    <AlertTriangle className="w-5 h-5 text-red-500 bg-red-50 dark:bg-red-900/20 p-1 rounded" />
                </div>
                <div className="mt-2 relative z-10">
                    <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">${Number(kpi.money_left_behind).toFixed(2)}</h3>
                    <p className="text-xs text-red-500/80 mt-1">Missed opportunities</p>
                </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Expiring (30d)</span>
                    <Clock className="w-5 h-5 text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-1 rounded" />
                </div>
                <div className="mt-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${Number(kpi.expiring_value).toFixed(2)}</h3>
                    <p className="text-xs text-gray-400 mt-1">Details in Alerts</p>
                </div>
            </Card>
        </div>
    );
};
