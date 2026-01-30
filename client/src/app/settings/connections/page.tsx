"use client";
import React, { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Card } from '@/components/ui/Card';
import { Trash2, Building, RefreshCw } from 'lucide-react';
import { PlaidLinkButton } from '@/components/cards/PlaidLinkButton';

interface Connection {
    id: string;
    institution_name: string;
    last_sync: string;
    cardCount: number;
}

export default function ConnectionsPage() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:4000/api/settings/connections')
            .then(res => res.json())
            .then(data => {
                setConnections(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    const handleUnlink = async (id: string) => {
        if (!confirm('Are you sure you want to unlink this bank?')) return;

        try {
            await fetch(`http://localhost:4000/api/settings/connections/${id}`, { method: 'DELETE' });
            setConnections(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            alert('Failed to unlink');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <TopNav />
            <div className="max-w-4xl mx-auto p-8 space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connected Accounts</h1>

                <Card className="p-6 bg-white dark:bg-gray-900">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">Active Connections</h2>
                        <div className="w-48">
                            <PlaidLinkButton onSuccess={() => window.location.reload()} />
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-gray-500">Loading connections...</p>
                    ) : connections.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <Building className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>No banks connected yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {connections.map(active => (
                                <div key={active.id} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-800">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                            <Building className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{active.institution_name}</p>
                                            <p className="text-sm text-gray-500">{active.cardCount} cards</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-400">Sync: {new Date(active.last_sync || Date.now()).toLocaleDateString()}</span>
                                        <button
                                            onClick={() => handleUnlink(active.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
