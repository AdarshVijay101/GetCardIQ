import React from 'react';
import { Wifi } from 'lucide-react';

export const CreditCardWidget = () => {
    return (
        <div className="relative h-56 w-full rounded-2xl p-6 text-white shadow-2xl overflow-hidden transition-transform hover:scale-105 duration-300">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-400 z-0" />

            {/* Decorative Circles */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white opacity-10 rounded-full blur-xl" />
            <div className="absolute bottom-8 right-20 w-24 h-24 bg-blue-300 opacity-20 rounded-full blur-lg" />

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                    <div>
                        <Wifi className="w-8 h-8 rotate-90 opacity-80" />
                    </div>
                    <span className="font-bold text-2xl italic tracking-wider">VISA</span>
                </div>

                <div className="mt-4">
                    <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md mb-4 shadow-sm opacity-90 relative overflow-hidden">
                        <div className="absolute inset-0 border border-yellow-500/30 rounded-md" />
                        <div className="absolute top-2 bottom-2 left-2 right-2 border border-yellow-600/20 rounded-sm" />
                    </div>

                    <div className="font-mono text-xl tracking-[0.2em] drop-shadow-md">
                        4271 8450 0027 4505
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] uppercase opacity-70 mb-0.5">Card Holder</p>
                        <p className="font-medium tracking-wide">JOSH DECKER</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase opacity-70 mb-0.5">Expires</p>
                        <p className="font-medium tracking-wide">05/22</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
