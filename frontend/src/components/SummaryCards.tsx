/**
 * Summary Cards Component
 * Displays key production metrics at a glance
 */
import React from 'react';
import { TrendingUp, AlertTriangle, Package, Zap } from 'lucide-react';
import type { DashboardSummary } from '../types';

interface SummaryCardsProps {
  summary: DashboardSummary | undefined;
  isLoading?: boolean;
}

type CardConfig = {
  title: string;
  value: string;
  icon: typeof Package;
  helper: string;
  description: string;
  iconBg: string;
  tag: string;
  badgeTone?: string;
  progress?: number;
  progressColor?: string;
  progressLabel?: string;
};

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="panel panel-tonal p-6 h-48 animate-pulse"
          >
            <div className="h-4 w-20 bg-slate-200 rounded-full mb-6"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-full mb-4"></div>
            <div className="h-4 w-40 bg-slate-200 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const numberFormatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  });

  const scrapRatio = summary.total_production + summary.total_scrap > 0
    ? Math.min(100, Math.round((summary.total_scrap / (summary.total_production + summary.total_scrap)) * 100))
    : 0;

  const cards: CardConfig[] = [
    {
      title: 'Rewind Output',
      value: `${numberFormatter.format(summary.total_production)} kg`,
      icon: Package,
      helper: summary.date_range,
      description: 'Tracked from final stage',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      tag: 'Production',
    },
    {
      title: 'Overall Efficiency',
      value: `${summary.overall_efficiency.toFixed(1)}%`,
      icon: TrendingUp,
      helper: 'RBD → Rewind',
      description: 'Line-wide conversion',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      tag: 'Throughput',
      progress: Math.min(100, Math.max(0, Number(summary.overall_efficiency.toFixed(1)))),
      progressColor: 'from-emerald-500 to-emerald-400',
      progressLabel: 'Target 95%'
    },
    {
      title: 'Total Scrap',
      value: `${numberFormatter.format(summary.total_scrap)} kg`,
      icon: AlertTriangle,
      helper: 'All stages',
      description: 'Material loss captured',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      tag: 'Waste',
      progress: scrapRatio,
      progressColor: 'from-amber-500 to-rose-500',
      progressLabel: 'Scrap ratio'
    },
    {
      title: 'Live Alerts',
      value: summary.active_alerts.toString(),
      icon: Zap,
      helper: summary.active_alerts > 0 ? 'Action required' : 'Stable',
      description: summary.bottleneck_stage
        ? `Bottleneck: ${summary.bottleneck_stage}`
        : 'No bottlenecks',
      iconBg: summary.active_alerts > 0
        ? 'bg-rose-50 text-rose-600 border-rose-100'
        : 'bg-slate-50 text-slate-600 border-slate-100',
      tag: 'System',
      badgeTone: summary.active_alerts > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="panel panel-tonal p-6 flex flex-col justify-between h-full min-h-[200px] relative overflow-hidden group"
          >
            {/* Header: Tag and Icon */}
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{card.tag}</span>
              <div className={`p-2.5 rounded-xl border ${card.iconBg} transition-transform group-hover:scale-110`}>
                <Icon size={20} strokeWidth={2} />
              </div>
            </div>

            {/* Body: Value and Title */}
            <div className="mb-6">
              <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{card.value}</div>
              <div className="text-sm font-medium text-slate-500">{card.title}</div>
            </div>

            {/* Footer: Progress or Helper Text */}
            <div className="mt-auto">
              {card.progress !== undefined ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>{card.progressLabel}</span>
                    <span>{card.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${card.progressColor}`}
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`font-medium ${card.badgeTone || 'text-slate-400'}`}>
                    {card.helper}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="truncate max-w-[120px]">{card.description}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
