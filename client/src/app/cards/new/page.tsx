import React from 'react';
import { AddCardWizard } from '@/components/cards/AddCardWizard';

export default function NewCardPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Expand Your Wallet</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Add a card to start optimizing your rewards.</p>
            </div>
            <AddCardWizard />
        </div>
    );
}
