import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const ShiftProgress: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const [shiftName, setShiftName] = useState('');
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateShiftStatus = () => {
            // Get current time in IST (UTC+5:30)
            const now = new Date();
            const utcOffset = now.getTimezoneOffset(); // minutes from UTC
            const istOffset = 330; // IST is UTC+5:30 (330 minutes)
            const istTime = new Date(now.getTime() + (istOffset + utcOffset) * 60000);

            const hours = istTime.getHours();
            const minutes = istTime.getMinutes();
            const totalMinutes = hours * 60 + minutes;

            let currentShift = '';
            let startMinutes = 0;
            let endMinutes = 0;

            // Shift Definitions (IST)
            // Morning:   08:00 - 16:00 (480 - 960 mins)
            // Afternoon: 16:00 - 00:00 (960 - 1440 mins)
            // Night:     00:00 - 08:00 (0 - 480 mins)

            if (totalMinutes >= 480 && totalMinutes < 960) {
                currentShift = 'Morning Shift';
                startMinutes = 480;
                endMinutes = 960;
            } else if (totalMinutes >= 960) {
                currentShift = 'Afternoon Shift';
                startMinutes = 960;
                endMinutes = 1440;
            } else {
                currentShift = 'Night Shift';
                startMinutes = 0;
                endMinutes = 480;
            }

            const duration = endMinutes - startMinutes;
            const elapsed = totalMinutes - startMinutes;
            const percent = Math.min(100, Math.max(0, (elapsed / duration) * 100));

            const remaining = duration - elapsed;
            const remHours = Math.floor(remaining / 60);
            const remMins = remaining % 60;

            setShiftName(currentShift);
            setProgress(percent);
            setTimeLeft(`${remHours}h ${remMins}m`);
        };

        // Update immediately
        updateShiftStatus();

        // Update every 30 seconds for more accurate tracking
        const interval = setInterval(updateShiftStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    // Determine color based on shift
    const getShiftColor = () => {
        if (shiftName.includes('Morning')) return 'text-orange-600 bg-orange-50';
        if (shiftName.includes('Afternoon')) return 'text-blue-600 bg-blue-50';
        return 'text-indigo-600 bg-indigo-50';
    };

    const getProgressColor = () => {
        if (shiftName.includes('Morning')) return 'bg-orange-500';
        if (shiftName.includes('Afternoon')) return 'bg-blue-500';
        return 'bg-indigo-500';
    };

    return (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getShiftColor()}`}>
                    <Clock size={18} />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-900">{shiftName || 'Loading...'}</p>
                    <p className="text-xs text-slate-500">Ends in {timeLeft || '--'}</p>
                </div>
            </div>
            <div className="flex-1 max-w-xs mx-4">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ${getProgressColor()}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            <span className="text-sm font-bold text-slate-700">{Math.round(progress)}%</span>
        </div>
    );
};

export default ShiftProgress;
