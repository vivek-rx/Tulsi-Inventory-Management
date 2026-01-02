import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const RealTimeClock: React.FC = () => {
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        const updateTime = () => {
            // Get current time in IST (UTC+5:30)
            const now = new Date();
            const utcOffset = now.getTimezoneOffset(); // minutes from UTC
            const istOffset = 330; // IST is UTC+5:30 (330 minutes)
            const istTime = new Date(now.getTime() + (istOffset + utcOffset) * 60000);

            // Format time (HH:MM:SS)
            const hours = istTime.getHours().toString().padStart(2, '0');
            const minutes = istTime.getMinutes().toString().padStart(2, '0');
            const seconds = istTime.getSeconds().toString().padStart(2, '0');
            setTime(`${hours}:${minutes}:${seconds}`);

            // Format date (DD MMM YYYY)
            const options: Intl.DateTimeFormatOptions = {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            };
            setDate(istTime.toLocaleDateString('en-IN', options));
        };

        // Update immediately
        updateTime();

        // Update every second
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Clock size={18} />
            </div>
            <div>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{time || '--:--:--'}</p>
                <p className="text-xs text-slate-500 font-medium">{date || 'Loading...'} IST</p>
            </div>
        </div>
    );
};

export default RealTimeClock;
