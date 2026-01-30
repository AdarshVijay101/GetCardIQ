"use client";

import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import Link from 'next/link';

type SavedCard = {
    id: string;
    nickname: string;
    issuer: string;
    card_type: string;
    color: string;
    current_points_balance: number;
};

export const WalletGrid = ({ filterType = 'all' }: { filterType?: 'all' | 'credit' | 'depository' }) => {
    const [cards, setCards] = useState<SavedCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:4000/api/cards')
            .then(res => res.json())
            .then(data => {
                // Filter client-side for now
                const filtered = filterType === 'all'
                    ? data
                    : data.filter((c: any) => c.card_type === filterType || (filterType === 'depository' && c.card_type === 'savings')); // specific mapping if needed

                setCards(filtered);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load cards", err);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent linking if inside a Link
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this card?")) return;

        try {
            const res = await fetch(`http://localhost:4000/api/cards/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // TODO: Real auth
            });

            if (res.ok) {
                setCards(prev => prev.filter(c => c.id !== id));
            } else {
                alert("Failed to delete card");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting card");
        }
    };

    const [editingCard, setEditingCard] = useState<SavedCard | null>(null);
    const [actionType, setActionType] = useState<'EDIT' | 'REDEEM' | 'HISTORY'>('EDIT');
    const [pointsInput, setPointsInput] = useState('');
    const [noteInput, setNoteInput] = useState('');

    const openEdit = (card: SavedCard) => {
        setEditingCard(card);
        setActionType('EDIT');
        setPointsInput(card.current_points_balance.toString());
        setNoteInput('Manual correction');
    };

    const openRedeem = (card: SavedCard) => {
        setEditingCard(card);
        setActionType('REDEEM');
        setPointsInput('');
        setNoteInput('Redemption');
    };

    const handleSave = async () => {
        if (!editingCard) return;

        const endpoint = actionType === 'EDIT' ? '/api/rewards/adjust' : '/api/rewards/redeem';
        const body = actionType === 'EDIT'
            ? { cardId: editingCard.id, newBalance: parseInt(pointsInput), note: noteInput }
            : { cardId: editingCard.id, pointsRedeemed: parseInt(pointsInput), note: noteInput };

        try {
            const res = await fetch(`http://localhost:4000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, current_points_balance: data.newBalance } : c));
                setEditingCard(null);
            } else {
                alert("Failed: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error saving");
        }
    };

    if (loading) return <div className="text-sm text-gray-500">Loading wallet...</div>;

    return (
        <Card className="p-6 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 lg:col-span-12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Wallet</h3>
                    <p className="text-sm text-gray-500">{cards.length} Cards Active</p>
                </div>
                <Link href="/cards/new">
                    <button className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>Add Card</span>
                    </button>
                </Link>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-400 mb-2">No cards found.</p>
                    <Link href="/cards/new" className="text-blue-600 font-medium hover:underline">Add your first card</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map(card => (
                        <div key={card.id} className="group relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.issuer}</p>
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100">{card.nickname}</h4>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center`} style={{ backgroundColor: card.color }}>
                                    <CreditCard className="w-4 h-4 text-white opacity-90" />
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-700 pt-3">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase flex items-center">
                                        Points Balance
                                        <button onClick={() => openEdit(card)} className="ml-2 text-blue-500 hover:underline text-[10px]">Edit</button>
                                        <button onClick={() => openRedeem(card)} className="ml-2 text-green-500 hover:underline text-[10px]">Redeem</button>
                                    </p>
                                    <p className="font-mono font-medium">{card.current_points_balance.toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(card.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal Overlay */}
            {editingCard && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <h3 className="text-lg font-bold mb-4">{actionType === 'EDIT' ? 'Update Balance' : 'Redeem Points'} - {editingCard.nickname}</h3>

                        <div className="flex space-x-4 mb-4 border-b dark:border-gray-700">
                            <button className={`pb-2 ${actionType !== 'HISTORY' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`} onClick={() => setActionType('EDIT')}>Adjust</button>
                            <button className={`pb-2 ${actionType === 'HISTORY' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`} onClick={() => setActionType('HISTORY')}>History</button>
                        </div>

                        {actionType !== 'HISTORY' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {actionType === 'EDIT' ? 'New Balance' : 'Points Redeemed'}
                                    </label>
                                    <input
                                        type="number"
                                        value={pointsInput}
                                        onChange={(e) => setPointsInput(e.target.value)}
                                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</label>
                                    <input
                                        type="text"
                                        value={noteInput}
                                        onChange={(e) => setNoteInput(e.target.value)}
                                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>
                                {actionType === 'REDEEM' && (
                                    <p className="text-sm text-yellow-600">Redeeming will deduct points from your balance.</p>
                                )}
                            </div>
                        ) : (
                            <LedgerHistory cardId={editingCard.id} />
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setEditingCard(null)}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded"
                            >
                                Close
                            </button>
                            {actionType !== 'HISTORY' && (
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

const LedgerHistory = ({ cardId }: { cardId: string }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:4000/api/rewards/ledger?cardId=${cardId}`)
            .then(res => res.json())
            .then(data => {
                setHistory(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [cardId]);

    if (loading) return <div className="text-gray-500 text-sm">Loading history...</div>;
    if (history.length === 0) return <div className="text-gray-400 text-sm">No history found.</div>;

    return (
        <div className="flex-1 overflow-y-auto space-y-2 max-h-60 pr-2">
            {history.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                        <p className="font-semibold">{item.event_type}</p>
                        <p className="text-gray-500 text-xs">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <p className={item.points_change >= 0 ? 'text-green-600' : 'text-red-500'}>
                            {item.points_change > 0 ? '+' : ''}{item.points_change} pts
                        </p>
                        <p className="text-xs text-gray-400">{item.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
