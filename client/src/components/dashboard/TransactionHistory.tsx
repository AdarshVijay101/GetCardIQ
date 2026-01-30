import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';

interface Transaction {
    id: number;
    merchant_name: string;
    amount: number;
    date: string;
    category?: string;
    recommended_card?: { nickname: string } | null;
    potential_extra_value?: number;
    estimated_points_earned?: number;
}

export const TransactionHistory = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch last 20 transactions
        // We'll add this endpoint to DashboardController for ease, 
        // OR reuse the exact same query logic locally. 
        // Actually, let's just fetch from the insights endpoint if it had raw data, 
        // OR create a dedicated route. 
        // For now, let's assume we create /api/dashboard/transactions
        fetch('http://localhost:4000/api/dashboard/transactions?limit=20')
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-4 text-center text-gray-400">Loading transactions...</div>;

    return (
        <Card className="col-span-1 lg:col-span-12 p-6 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Merchant</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Points Earned</th>
                            <th className="px-6 py-3 text-right">Missed Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium">{tx.merchant_name}</td>
                                <td className="px-6 py-4">{tx.category || 'Uncategorized'}</td>
                                <td className="px-6 py-4">${Number(tx.amount).toFixed(2)}</td>
                                <td className="px-6 py-4 text-green-600 font-medium">
                                    {tx.estimated_points_earned ? `${tx.estimated_points_earned} pts` : '-'}
                                </td>
                                <td className={`px-6 py-4 text-right font-bold ${tx.potential_extra_value && tx.potential_extra_value > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {tx.potential_extra_value && tx.potential_extra_value > 0 ? `+${tx.potential_extra_value}` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {transactions.length === 0 && <p className="text-center text-gray-500 py-8">No transactions found.</p>}
            </div>
        </Card>
    );
};
