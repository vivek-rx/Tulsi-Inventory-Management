/**
 * Date Filter Component
 * Allows users to select date ranges for data filtering
 */
import React from 'react';
import { format, subDays } from 'date-fns';
import { Calendar } from 'lucide-react';

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const handlePresetClick = (days: number) => {
    const end = format(new Date(), 'yyyy-MM-dd');
    const start = format(subDays(new Date(), days), 'yyyy-MM-dd');
    onStartDateChange(start);
    onEndDateChange(end);
  };

  const presets = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
  ];

  const isPresetActive = (days: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const expectedStart = format(subDays(new Date(), days), 'yyyy-MM-dd');
    return startDate === expectedStart && endDate === today;
  };

  return (
    <section className="panel panel-tonal p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="space-y-2">
          <p className="section-eyebrow">Reporting Window</p>
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg">
              <Calendar size={18} />
            </span>
            Date Filters
          </h3>
          <p className="text-sm text-slate-500">Align every widget to the same historical slice.</p>
          <div className="chip chip-muted">
            Showing {startDate} → {endDate}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Until</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white/80 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-6">
        {presets.map((preset) => (
          <button
            key={preset.days}
            onClick={() => handlePresetClick(preset.days)}
            className={`control-pill ${isPresetActive(preset.days) ? 'is-active' : ''}`}
            type="button"
          >
            {preset.label}
          </button>
        ))}
        <span className="text-xs text-slate-500">Shortcuts</span>
      </div>
    </section>
  );
};

export default DateFilter;
