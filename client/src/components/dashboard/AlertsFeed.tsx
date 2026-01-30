import React from 'react';
import { Card } from '../ui/Card';
import { Bell, Clock, RefreshCcw, ShieldAlert } from 'lucide-react';

export const AlertsFeed = () => {
    return (
        <Card className="border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-gray-500" />
                    Alerts
                </h3>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">3 New</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                    <div className="flex items-start">
                        <div className="mt-1">
                            <Clock className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-1">Amex Airline Credit Expiring</p>
                            <p className="text-xs text-gray-500">$200 incidental credit expires in 4 days.</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                    <div className="flex items-start">
                        <div className="mt-1">
                            <ShieldAlert className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-1">New Offer Found</p>
                            <p className="text-xs text-gray-500">Spend $50 at Lululemon, get $10 back (Amex).</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                    <div className="flex items-start">
                        <div className="mt-1">
                            <RefreshCcw className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-1">Sync Job Success</p>
                            <p className="text-xs text-gray-500">Updated 2 mins ago.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
