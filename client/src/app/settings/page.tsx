"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { User, CreditCard, Bell, Shield, Moon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

    useEffect(() => {
        // Apply theme effect
        const root = document.documentElement;
        const applyv = (t: 'light' | 'dark') => {
            if (t === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');
        };

        if (theme === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyv(systemDark ? 'dark' : 'light');
        } else {
            applyv(theme);
        }
    }, [theme]);

    const handleAction = async (action: string) => {
        setLoadingAction(action);

        try {
            if (action === "Log Out") {
                router.push("/auth/login");
            } else if (action === "Sync Now") {
                await fetch('http://localhost:4000/api/plaid/sync-all', { method: 'POST' });
                alert("Sync started.");
            } else if (action === "ToggleTheme") {
                setTheme(prev => {
                    if (prev === 'system') return 'light';
                    if (prev === 'light') return 'dark';
                    return 'system';
                });
            } else if (action === "Reset") {
                if (confirm("Reset manual adjustments?")) {
                    await fetch('http://localhost:4000/api/settings/reset', { method: 'POST' });
                }
            } else if (action === "Manage") {
                router.push("/settings/connections");
            } else if (action === "Edit") {
                router.push("/profile");
            } else {
                alert(`Action ${action} executed.`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAction(null);
        }
    };

    const sections = [
        {
            title: "Account",
            icon: <User className="w-5 h-5" />,
            items: [
                { label: "Profile Information", desc: "Start 2024 with updated details", action: "Edit" },
                { label: "Sign Out", desc: "Log out of all devices", action: "Log Out", danger: true }
            ]
        },
        {
            title: "Connected Accounts",
            icon: <CreditCard className="w-5 h-5" />,
            items: [
                { label: "Plaid Connections", desc: "Manage bank links", action: "Manage" },
                { label: "Resync All", desc: "Force refresh all accounts", action: "Sync Now" }
            ]
        },
        {
            title: "Rewards Configuration",
            icon: <Shield className="w-5 h-5" />,
            items: [
                { label: "Point Valuations", desc: "Edit default cent-per-point values", action: "Configure" },
                { label: "Reset Manual Adjustments", desc: "Clear all manual overrides", action: "Reset", danger: true }
            ]
        },
        {
            title: "App Preferences",
            icon: <Moon className="w-5 h-5" />,
            items: [
                { label: "Theme Mode", desc: `Current: ${theme.toUpperCase()}`, action: "ToggleTheme" },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black space-y-6 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center space-x-4 mb-8">
                    <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                </div>

                {sections.map((section, idx) => (
                    <Card key={idx} className="overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-100 dark:border-gray-800 flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-3">
                                {section.icon}
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{section.title}</h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {section.items.map((item, i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                        <div className="text-sm text-gray-500">{item.desc}</div>
                                    </div>
                                    <button
                                        onClick={() => handleAction(item.action)}
                                        disabled={loadingAction === item.action}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${item.danger
                                            ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40'
                                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                                            } ${loadingAction === item.action ? 'opacity-50 cursor-wait' : ''}`}>
                                        {loadingAction === item.action ? '...' : item.action}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
