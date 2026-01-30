"use client";
import React, { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Card } from '@/components/ui/Card';

export default function ProfilePage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => {
                setEmail(data.email || '');
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'default-user-id', email })
            });

            if (res.ok) {
                alert("Profile saved successfully!");
            } else {
                alert("Failed to save.");
            }
        } catch {
            alert("Error saving profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <TopNav />
            <div className="max-w-xl mx-auto p-8 space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>

                <Card className="p-8 bg-white dark:bg-gray-900">
                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>

                            <div className="pt-4 border-t dark:border-gray-800">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`w-full py-2.5 rounded-lg text-white font-medium transition-all ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
