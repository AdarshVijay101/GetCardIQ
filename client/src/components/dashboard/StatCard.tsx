import React from 'react';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { Card } from '../ui/Card';

interface StatCardProps {
    title: string;
    value: string;
    trend: number; // percentage
    trendLabel?: string;
    status?: 'normal' | 'attention' | 'good';
    icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendLabel = "more than last month", status = 'normal', icon }) => {
    const isPositive = trend >= 0;
    const trendColor = status === 'attention' ? 'text-red-500' : isPositive ? 'text-green-500' : 'text-red-500';
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
        <Card className="p-6 flex flex-col justify-between hover:shadow-lg transition-shadow border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex justify-between items-start">
                <span className="text-gray-500 font-medium text-sm">{title}</span>
                {icon ? (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-500">
                        {icon}
                    </div>
                ) : (
                    <div className={`w-2 h-2 rounded-full ${status === 'attention' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                )}
            </div>

            <div className="mt-4">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
                {status === 'attention' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase tracking-wide">
                        Needs Attention
                    </span>
                )}
            </div>

            <div className="mt-4 flex items-center text-sm">
                <span className={`flex items-center font-bold ${trendColor}`}>
                    <TrendIcon className="w-4 h-4 mr-1" />
                    {Math.abs(trend)}%
                </span>
                <span className="text-gray-400 ml-2 text-xs">{trendLabel}</span>
            </div>
        </Card>
    );
};
