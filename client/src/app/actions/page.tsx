"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TopNav } from '@/components/layout/TopNav';

type Action = {
    id: string;
    title: string;
    subtitle: string;
    status: 'OPEN' | 'DONE';
    link: string;
};

export default function ActionsPage() {
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch full list
        fetch('http://localhost:4000/api/dashboard/actions')
            .then(r => r.json())
            .then(d => {
                setActions(d);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const completeAction = (id: string) => {
        // Optimistic update
        setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'DONE' } : a));
        // Todo: Call backend to mark as done
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
            <TopNav />

            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Next Best Actions</h1>
                </div>

                {loading ? (
                    <div>Loading actions...</div>
                ) : (
                    <div className="space-y-4">
                        {actions.map(action => (
                            <Card key={action.id} className={`p-6 transition-all ${action.status === 'DONE' ? 'opacity-50' : 'border-l-4 border-l-indigo-500'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <button onClick={() => completeAction(action.id)}>
                                            {action.status === 'DONE' ? (
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            ) : (
                                                <Circle className="w-6 h-6 text-gray-300 hover:text-indigo-500" />
                                            )}
                                        </button>
                                        <div>
                                            <h3 className={`text-lg font-bold ${action.status === 'DONE' ? 'line-through text-gray-500' : ''}`}>{action.title}</h3>
                                            <p className="text-gray-500">{action.subtitle}</p>
                                        </div>
                                    </div>
                                    {action.status !== 'DONE' && (
                                        <Link href={action.link}>
                                            <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium text-sm flex items-center">
                                                Start
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </Card>
                        ))}

                        {actions.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-20" />
                                <p>You're all caught up! No actions pending.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
