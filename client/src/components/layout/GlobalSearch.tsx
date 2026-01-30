"use client";

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Card } from '../ui/Card';
import Link from 'next/link';

export const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults(null);
            return;
        }

        const timer = setTimeout(() => {
            fetch(`http://localhost:4000/api/search?q=${query}`)
                .then(res => res.json())
                .then(data => setResults(data));
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="relative w-full max-w-lg mx-8 z-50">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search merchants, transactions, or benefits..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                />
            </div>

            {isOpen && results && (results.cards?.length > 0 || results.transactions?.length > 0) && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[400px] overflow-y-auto">
                        {results.cards.length > 0 && (
                            <div className="p-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase px-2 mb-1">Cards</h4>
                                {results.cards.map((c: any) => (
                                    <div key={c.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                                        <div className="font-medium text-sm">{c.title}</div>
                                        <div className="text-xs text-gray-500">{c.subtitle}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {results.transactions.length > 0 && (
                            <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                                <h4 className="text-xs font-bold text-gray-500 uppercase px-2 mb-1">Transactions</h4>
                                {results.transactions.map((t: any) => (
                                    <div key={t.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex justify-between">
                                        <div>
                                            <div className="font-medium text-sm">{t.title}</div>
                                            <div className="text-xs text-gray-500">{t.subtitle}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
