"use client";

import React, { useState, useEffect } from 'react';
import { TopNav } from '../../components/layout/TopNav';
import { Plus, Target, Calendar, DollarSign, ChevronRight, Check } from 'lucide-react';

export default function GoalsPage() {
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Wizard State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        reason: '',
        name: '',
        targetAmount: '',
        targetDate: '',
        monthlyContribution: ''
    });

    const refreshGoals = () => {
        fetch('http://localhost:4000/api/goals')
            .then(res => res.json())
            .then(data => {
                setGoals(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        refreshGoals();
    }, []);

    const handleCreateGoal = async () => {
        await fetch('http://localhost:4000/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'default-user-id',
                name: formData.name,
                reason: formData.reason,
                targetAmount: Number(formData.targetAmount),
                targetDate: formData.targetDate,
                monthlyContribution: Number(formData.monthlyContribution),
                fundingSourceId: null
            })
        });
        setIsWizardOpen(false);
        setStep(1);
        setFormData({ reason: '', name: '', targetAmount: '', targetDate: '', monthlyContribution: '' });
        refreshGoals();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Financial Goals</h1>
                        <p className="text-gray-500 mt-2">Track and achieve your dreams</p>
                    </div>
                    <button
                        onClick={() => setIsWizardOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Goal
                    </button>
                </header>

                {/* Goals Grid */}
                {loading ? (
                    <div className="text-center text-gray-500">Loading goals...</div>
                ) : goals.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No active goals</h3>
                        <p className="text-gray-500 mb-6">Start saving for a car, house, or vacation.</p>
                        <button
                            onClick={() => setIsWizardOpen(true)}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Create your first goal
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map(goal => (
                            <div key={goal.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${goal.reason === 'EMERGENCY' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
                                </div>
                                <h3 className="font-semibold text-lg mb-1">{goal.name}</h3>
                                <div className="flex justify-between text-sm text-gray-500 mb-4">
                                    <span>Target: ${Number(goal.target_amount).toLocaleString()}</span>
                                    <span>By {new Date(goal.target_date).getFullYear()}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (goal.current_amount / goal.target_amount) * 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>${goal.current_amount || 0} saved</span>
                                    <span>{(goal.current_amount / goal.target_amount * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* WIZARD MODAL */}
            {isWizardOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Create New Goal</h2>
                            <button onClick={() => setIsWizardOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <div className="p-6">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h3 className="text-center font-medium mb-4">What's this goal for?</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Emergency', 'Debt', 'House', 'Car', 'Vacation', 'Retirement'].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => { setFormData({ ...formData, reason: r.toUpperCase() }); setStep(2); }}
                                                className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-center transition-all"
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Goal Name</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            placeholder="e.g. Europe Trip"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Target Amount ($)</label>
                                            <input
                                                type="number"
                                                value={formData.targetAmount}
                                                onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                                                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                                placeholder="5000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Target Date</label>
                                            <input
                                                type="date"
                                                value={formData.targetDate}
                                                onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                                                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Auto calc contribution
                                            const months = (new Date(formData.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30);
                                            const contrib = Number(formData.targetAmount) / Math.max(1, months);
                                            setFormData({ ...formData, monthlyContribution: contrib.toFixed(0) });
                                            setStep(3);
                                        }}
                                        disabled={!formData.name || !formData.targetAmount || !formData.targetDate}
                                        className="w-full bg-blue-600 text-white rounded-lg py-2 mt-4 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4 text-center">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-xl">Almost There!</h3>
                                    <p className="text-gray-500">
                                        To reach <span className="font-bold text-gray-900 dark:text-white">${formData.targetAmount}</span> by {formData.targetDate},
                                        you should save:
                                    </p>
                                    <div className="text-3xl font-bold text-blue-600 py-4">
                                        ${formData.monthlyContribution}<span className="text-sm text-gray-400 font-normal">/mo</span>
                                    </div>
                                    <button
                                        onClick={handleCreateGoal}
                                        className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition"
                                    >
                                        Create Goal
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
