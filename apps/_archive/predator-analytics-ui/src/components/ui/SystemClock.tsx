import React, { useState, useEffect } from 'react';

export const SystemClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-end leading-none font-mono">
           <div className="text-white font-bold text-sm tracking-widest">
                {time.toLocaleTimeString('uk-UA', { hour12: false })}
           </div>
           <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">
                {time.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })}
           </div>
        </div>
    );
};
