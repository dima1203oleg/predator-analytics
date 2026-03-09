import React from 'react';

export function SearchConsolePage() {
    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 text-white">
            <h1 className="text-3xl font-black tracking-tighter mb-4 text-purple-400">ПОШУКОВИЙ ЦЕНТР</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex-1 flex flex-col items-center justify-start pt-20">
                <h2 className="text-2xl font-bold mb-4">ГЛОБАЛЬНИЙ ПОШУК</h2>
                <div className="w-full max-w-3xl relative">
                    <input
                        type="text"
                        placeholder="ІПН, ЄДРПОУ, ПІБ, Телефон, Домен..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <div className="absolute right-4 top-4 text-slate-500">⌘K</div>
                </div>
            </div>
        </div>
    );
}

export default SearchConsolePage;
