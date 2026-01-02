/**
 * Alerts Panel Component
 * Shows production alerts and warnings
 */
import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Alert } from '../types';

interface AlertsPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const severityTokens: Record<string, { border: string; badge: string; glow: string }> = {
    critical: {
      border: 'border-rose-200 bg-rose-50/80',
      badge: 'bg-rose-100 text-rose-700',
      glow: 'shadow-[0_10px_40px_-15px_rgba(244,63,94,0.6)]'
    },
    warning: {
      border: 'border-amber-200 bg-amber-50/80',
      badge: 'bg-amber-100 text-amber-700',
      glow: 'shadow-[0_10px_40px_-15px_rgba(245,158,11,0.6)]'
    },
    info: {
      border: 'border-blue-200 bg-blue-50/80',
      badge: 'bg-blue-100 text-blue-700',
      glow: 'shadow-[0_10px_40px_-15px_rgba(59,130,246,0.4)]'
    },
  };

  return (
    <div className="panel panel-tonal p-6 h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="section-eyebrow">Live Health</p>
          <h2 className="text-2xl font-bold text-slate-900">Alerts</h2>
        </div>
        <span className={`chip ${alerts.length ? '' : 'chip-muted'}`}>
          {alerts.length ? `${alerts.length} open` : 'Zero open'}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Info className="text-slate-400" size={28} />
          </div>
          <p className="font-semibold">All stages stable</p>
          <p className="text-sm">Operations are running within thresholds.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {alerts.map((alert, index) => {
            const token = severityTokens[alert.severity] || severityTokens.info;
            return (
              <div
                key={`${alert.stage}-${index}`}
                className={`p-4 rounded-2xl border ${token.border} ${token.glow}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`p-2 rounded-2xl ${token.badge}`}>{getAlertIcon(alert.severity)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{alert.stage}</p>
                      <span className="text-xs text-slate-400 text-right">
                        {alert.date} · {alert.shift}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                    <span className="text-xs font-semibold text-slate-500">Metric: {alert.metric_value.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
