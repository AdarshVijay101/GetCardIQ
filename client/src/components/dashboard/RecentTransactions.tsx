import React from 'react';
import { Card } from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, Coffee, ShoppingBag, Zap, Music } from 'lucide-react';

const TRANSACTIONS = [
    { id: 1, name: 'Dropbox', category: 'Subscription', amount: -99.00, icon: <Zap className="w-4 h-4" />, color: 'bg-blue-100 text-blue-600' },
    { id: 2, name: 'Johny Vino', category: 'Transfer', amount: 37200, icon: <ArrowDownRight className="w-4 h-4" />, color: 'bg-green-100 text-green-600', isIncome: true },
    { id: 3, name: 'Apple Store', category: 'Shopping', amount: -14.90, icon: <ShoppingBag className="w-4 h-4" />, color: 'bg-gray-100 text-gray-600' },
    { id: 4, name: 'Yoga Perdana', category: 'Invoice #8532', amount: 83500, icon: <ArrowDownRight className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-600', isIncome: true },
    { id: 5, name: 'Spotify', category: 'Music', amount: -15.00, icon: <Music className="w-4 h-4" />, color: 'bg-green-100 text-green-600' },
];

export const RecentTransactions = () => {
    return (
        <Card className="p-6 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent transactions</h3>
            <div className="space-y-4">
                {TRANSACTIONS.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded-lg transition-colors">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl ${tx.color} group-hover:scale-110 transition-transform`}>
                                {tx.icon}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white">{tx.name}</p>
                                <p className="text-xs text-gray-500">{tx.category}</p>
                            </div>
                        </div>
                        <span className={`font-bold text-sm ${tx.isIncome ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.isIncome ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
};
