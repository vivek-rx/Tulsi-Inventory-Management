/**
 * Process Flow Visualization Component
 * Shows sequential production stages: RBD → Inter → Oven → DPC → Rewind
 */
import React from 'react';
import type { ProcessFlowNode } from '../types';

interface ProcessFlowProps {
  nodes: ProcessFlowNode[];
  isLoading?: boolean;
}

const ProcessFlow: React.FC<ProcessFlowProps> = ({ nodes, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="panel panel-tonal p-6 h-48 animate-pulse">
            <div className="h-4 w-20 bg-slate-200 rounded-full mb-6"></div>
            <div className="h-8 w-32 bg-slate-200 rounded-full mb-4"></div>
            <div className="h-4 w-full bg-slate-200 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    good: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    critical: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const statusLabels: Record<string, string> = {
    good: 'Stable',
    warning: 'Warning',
    critical: 'Critical',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {nodes.map((node) => (
        <div
          key={node.stage}
          className="panel panel-tonal p-6 flex flex-col justify-between h-full min-h-[200px] relative overflow-hidden group"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Stage</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[node.status] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
              {statusLabels[node.status] || 'Unknown'}
            </span>
          </div>

          {/* Body */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{node.stage}</h3>
            <div className="text-sm font-medium text-slate-500">
              {node.expected_output_size_mm ? `${node.expected_output_size_mm} mm` : 'Processing'}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Efficiency</span>
                <span>{node.efficiency.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${node.status === 'critical' ? 'bg-rose-500' :
                      node.status === 'warning' ? 'bg-amber-500' :
                        'bg-emerald-500'
                    }`}
                  style={{ width: `${node.efficiency}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
              <span>In: {node.input_qty.toFixed(0)}</span>
              <span>Out: {node.output_qty.toFixed(0)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProcessFlow;
