"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '../ui/Button';
import { Landmark } from 'lucide-react';

interface PlaidLinkButtonProps {
    onSuccess?: () => void;
}

export const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({ onSuccess }) => {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 1. Fetch Link Token from Backend
    useEffect(() => {
        if (!isMounted) return;

        const createToken = async () => {
            try {
                // Fetch from backend
                // Fetch from backend (Relative path uses Next.js Proxy)
                const res = await fetch('http://localhost:4000/api/plaid/link-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Server Error (${res.status}): ${errorText}`);
                }

                const data = await res.json();
                console.log("Token received:", data);

                if (!data.link_token) {
                    throw new Error("Invalid response: No link_token");
                }

                setToken(data.link_token);
            } catch (e: any) {
                console.error("Failed to create link token", e);
                setError(e.message || "Connection Failed");
            }
        };
        createToken();
    }, [isMounted]);

    const onSuccessCallback = useCallback(async (public_token: string, metadata: any) => {
        console.log("[Plaid] onSuccess", { public_token, metadata });

        setLoading(true);
        try {
            // 1. Exchange
            console.log("[Plaid] Calling Exchange...");
            const exchangeRes = await fetch('http://localhost:4000/api/plaid/exchange_public_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_token, metadata }),
            });

            console.log("[Plaid] exchange status", exchangeRes.status);
            const exchangeJson = await exchangeRes.json().catch(() => ({}));
            console.log("[Plaid] exchange response", exchangeJson);

            if (!exchangeRes.ok) throw new Error("Exchange failed: " + JSON.stringify(exchangeJson));

            // 2. Sync
            console.log("[Plaid] Calling Sync...");
            const syncRes = await fetch('http://localhost:4000/api/plaid/transactions/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionId: null }),
            });

            console.log("[Plaid] sync status", syncRes.status);
            const syncJson = await syncRes.json().catch(() => ({}));
            console.log("[Plaid] sync response", syncJson);

            if (!syncRes.ok) throw new Error("Sync failed: " + JSON.stringify(syncJson));

            if (!syncRes.ok) throw new Error("Sync failed: " + JSON.stringify(syncJson));

            console.log("Transactions Fetched:", syncJson.data?.transactions);

            // USER FEEDBACK: Visible success message
            alert("Bank Connected & Synced Successfully! Dashboard updating...");

            if (onSuccess) onSuccess();

            // 3. Reload
            window.location.reload();

        } catch (e: any) {
            console.error("[Plaid] Flow failed", e);
            setError("Failed to sync data: " + e.message);
        } finally {
            setLoading(false);
        }
    }, [onSuccess]);

    // OAuth: Handle redirect URI
    const receivedRedirectUri = typeof window !== "undefined" && window.location.href.includes("oauth_state_id")
        ? window.location.href
        : undefined;

    const config = {
        token,
        onSuccess: onSuccessCallback,
        receivedRedirectUri
    };

    const { open, ready } = usePlaidLink(config);

    if (!isMounted) return null;

    if (error) {
        return (
            <div className="text-center w-full">
                <Button disabled className="bg-red-50 text-red-500 w-full mb-1 border border-red-100 dark:bg-red-900/10 dark:text-red-400">
                    {error}
                </Button>
                <button onClick={() => window.location.reload()} className="text-xs underline text-gray-500 hover:text-gray-900 dark:text-gray-400">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <Button
            onClick={() => {
                if (ready) open();
            }}
            disabled={!ready || loading || !token}
            isLoading={loading || (!token && !error)}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 w-full transition-all"
        >
            <Landmark className="w-4 h-4 mr-2" />
            {token ? "Connect Bank" : "Connecting..."}
        </Button>
    );
};
