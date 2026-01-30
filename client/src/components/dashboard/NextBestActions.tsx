"use client";
import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Action = {
    id: string;
    title: string;
    subtitle: string;
    status: 'OPEN' | 'DONE';
    link: string;
};

export const NextBestActions = () => {
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:4000/api/dashboard/actions')
            .then(r => r.json())
            .then(d => {
                setActions(d.slice(0, 3)); // Only show top 3
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, []);

    if (loading) return <Card className="p-6 h-64 flex items-center justify-center text-white/50">Loading...</Card>;

    return (
        <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-lg">
            <h3 className="font-bold text-lg mb-1">Next Best Actions</h3>
            <p className="text-indigo-200 text-xs mb-4">Complete these to earn ~$50 value.</p>

            <div className="space-y-3">
                {actions.map(action => (
                    <div key={action.id} className="flex items-start space-x-3 p-2 rounded hover:bg-white/10 cursor-pointer transition-colors">
                        {action.status === 'DONE' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                        ) : (
                            <Circle className="w-5 h-5 text-indigo-300 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <Link href={action.link}>
                                <p className={`text-sm font-medium ${action.status === 'DONE' ? 'line-through opacity-50' : ''}`}>{action.title}</p>
                            </Link>
                            <p className="text-xs text-indigo-200">{action.subtitle}</p>
                        </div>
                    </div>
                ))}

                {actions.length === 0 && (
                    <div className="text-center text-indigo-200 text-sm">No pending actions.</div>
                )}
            </div>

            <Link href="/actions">
                <button className="w-full mt-6 bg-white text-indigo-700 py-2 rounded font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center">
                    View All Steps
                    <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </Link>
        </Card>
    );
};
