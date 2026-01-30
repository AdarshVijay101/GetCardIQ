
import React, { useEffect, useState } from 'react';

// Types
interface AIStatus {
    ai_service_reachable: boolean;
    mode: 'gemini' | 'fallback' | 'failsafe' | 'unknown';
    last_success_at: string | null;
    last_error: string | null;
}

export const AIHealthIndicator = () => {
    const [status, setStatus] = useState<AIStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token && token !== 'null') {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('http://localhost:4000/api/ai/status', {
                headers
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            } else {
                // If API fails, assume unreachable
                setStatus(prev => prev ? { ...prev, ai_service_reachable: false } : null);
            }
        } catch (e) {
            console.error("Failed to poll AI status", e);
            setStatus(prev => prev ? { ...prev, ai_service_reachable: false } : null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    if (loading && !status) return <div className="text-xs text-gray-400">Loading AI...</div>;
    if (!status) return null;

    // Determine Color
    // Green: Reachable + Gemini
    // Yellow: Reachable + Fallback
    // Red: Unreachable OR Failsafe
    let color = 'bg-red-500';
    let title = 'AI Service Unreachable';
    let pulse = false;

    if (status.ai_service_reachable) {
        if (status.mode === 'gemini') {
            color = 'bg-green-500';
            title = 'AI Active (Gemini)';
            pulse = true;
        } else if (status.mode === 'fallback') {
            color = 'bg-yellow-500';
            title = 'AI Degraded (Fallback Rules)';
        } else {
            color = 'bg-red-500';
            title = 'AI Failed - Using Local Failsafe';
        }
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700 shadow-md">
            <div className="relative flex h-3 w-3">
                {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
            </div>
            <span className="text-xs font-medium text-gray-300">
                {title}
            </span>
            {status.last_error && (
                <div className="group relative ml-2">
                    <span className="cursor-help text-xs text-red-400 border border-red-900 rounded px-1">?</span>
                    <div className="absolute hidden group-hover:block bottom-full mb-2 right-0 w-64 p-2 bg-black border border-gray-600 rounded text-xs text-white z-50">
                        Error: {status.last_error}
                        <br />
                        <span className="text-gray-500">Last Success: {status.last_success_at ? new Date(status.last_success_at).toLocaleTimeString() : 'Never'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
