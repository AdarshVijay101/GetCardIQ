
"use client";

import React, { useEffect, useState } from 'react';
import { ToggleLeft, ToggleRight, ShieldCheck, ShieldAlert } from 'lucide-react';

export function DemoModeToggle() {
    const [isDemo, setIsDemo] = useState(false);

    // Initialize state from Storage & Setup Interceptor
    useEffect(() => {
        // 1. Load State
        const stored = localStorage.getItem('demo_mode') === 'true';
        setIsDemo(stored);

        // 2. Monkey Patch Fetch for Global Interception
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            const [resource, config] = args;
            const useDemo = localStorage.getItem('demo_mode') === 'true';

            // Allow override via explicit config if needed, otherwise inject
            const newConfig = { ...(config || {}) };
            newConfig.headers = new Headers(newConfig.headers || {});

            if (useDemo) {
                newConfig.headers.append('X-DEMO-MODE', 'true');
                // Optional: Inject Secret if we were storing it, but for now NODE_ENV != prod is enough.
            }

            return originalFetch(resource, newConfig);
        };

        return () => {
            // Restore (Optional, but good practice if component unmounts - though this is in TopNav)
            window.fetch = originalFetch;
        };
    }, []);

    const toggle = () => {
        const newState = !isDemo;
        setIsDemo(newState);
        localStorage.setItem('demo_mode', String(newState));
        // Force reload to ensure all data fetches refresh with new mode
        window.location.reload();
    };

    return (
        <div
            onClick={toggle}
            className={`
                flex items-center space-x-2 px-3 py-1.5 rounded-full cursor-pointer transition-all border
                ${isDemo
                    ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200'
                    : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
                }
            `}
        >
            {isDemo ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-wider">
                {isDemo ? 'Safe Demo' : 'Real Data'}
            </span>
            {isDemo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        </div>
    );
}
