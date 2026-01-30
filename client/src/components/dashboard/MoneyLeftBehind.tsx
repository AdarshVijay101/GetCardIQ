import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { getDashboardSummary, DashboardSummary } from '../../services/dashboardService';

export const MoneyLeftBehind = () => {
    const [data, setData] = useState<DashboardSummary | null>(null);

    useEffect(() => {
        getDashboardSummary().then(summary => setData(summary));
    }, []);

    const missed = data?.missed_opportunities || [];
    const totalLost = data?.kpi.money_left_behind || 0;

    return (
        <Card className="p-6 border-red-100 dark:border-red-900/20 bg-gradient-to-b from-red-50 to-white dark:from-red-900/10 dark:to-gray-900">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Money Left Behind</h3>
                    <p className="text-sm text-gray-500">You missed <span className="font-bold text-red-600">${Number(totalLost).toFixed(2)}</span> this month.</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                    <span className="text-xl">💸</span>
                </div>
            </div>

            <div className="space-y-4">
                {missed.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No missed opportunities! Great job!</p>
                ) : (
                    missed.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">
                                        {item.merchant.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{item.merchant}</p>
                                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="text-red-500 font-bold text-sm">-${Number(item.lost_value).toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded flex items-start">
                                <AlertCircle className="w-3 h-3 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                                Use <span className="font-bold mx-1 text-blue-500">{item.recommended_card}</span> next time.
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                Fix Future Leaks
                <ArrowRight className="w-4 h-4 ml-2" />
            </button>
        </Card>
    );
};
