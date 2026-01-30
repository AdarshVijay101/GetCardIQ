"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Bell, Check, Clock, Info, AlertTriangle } from 'lucide-react';

type Notification = {
    id: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/notifications')
            .then(res => res.json())
            .then(data => {
                setNotifications(data);
                setLoading(false);
            });
    }, []);

    const markRead = async (id: string) => {
        await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'BENEFIT_EXPIRY': return <Clock className="w-5 h-5 text-orange-500" />;
            case 'SYSTEM': return <Check className="w-5 h-5 text-green-500" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bell className="w-6 h-6 mr-3" />
                Notifications Center
            </h1>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading alerts...</div>
            ) : notifications.length === 0 ? (
                <Card className="p-12 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>You're all caught up! No new notifications.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {notifications.map(n => (
                        <Card key={n.id} className={`p-4 transition-all ${n.is_read ? 'opacity-60 bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800 border-l-4 border-l-blue-500 shadow-md'}`}>
                            <div className="flex start">
                                <div className="mt-1 mr-4">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold ${n.is_read ? 'text-gray-700 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{n.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{n.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString()}</p>
                                </div>
                                {!n.is_read && (
                                    <button
                                        onClick={() => markRead(n.id)}
                                        className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-full h-fit self-center"
                                    >
                                        Mark Read
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
