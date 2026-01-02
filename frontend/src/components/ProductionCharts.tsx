/**
 * Production Charts Component
 * Displays timeline and comparison charts using Recharts
 */
import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TimelineDataPoint } from '../types';

interface ProductionChartsProps {
  timelineData: TimelineDataPoint[];
  stageStats: any[];
  isLoading?: boolean;
}

const ProductionCharts: React.FC<ProductionChartsProps> = ({
  timelineData,
  stageStats,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((idx) => (
          <div key={idx} className="panel panel-tonal p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Aggregate timeline data by date for line chart
  const aggregateByDate = (data: TimelineDataPoint[]) => {
    const grouped = data.reduce((acc: any, item) => {
      if (!acc[item.date]) {
        acc[item.date] = { date: item.date };
      }
      acc[item.date][item.stage] = item.output_qty;
      return acc;
    }, {});

    return Object.values(grouped);
  };

  const lineChartData = aggregateByDate(timelineData);
  const stageData = stageStats || [];

  // Stage colors
  const stageColors: { [key: string]: string } = {
    RBD: '#3b82f6',
    Inter: '#8b5cf6',
    Oven: '#f59e0b',
    DPC: '#10b981',
    Rewind: '#ef4444',
  };

  const topStage = stageData.length
    ? stageData.reduce((acc: any, curr: any) => (curr.total_output > acc.total_output ? curr : acc))
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="panel panel-tonal p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-eyebrow">Stage spread</p>
            <h3 className="text-2xl font-black text-slate-900">Stage-wise Output</h3>
          </div>
          {topStage && (
            <span className="chip">
              Top: {topStage.stage}
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={stageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="stage" tickLine={false} />
            <YAxis label={{ value: 'kg', angle: -90, position: 'insideLeft' }} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
            <Legend />
            <Bar dataKey="total_output" fill="#3b82f6" name="Output (kg)" radius={[12, 12, 12, 12]} />
            <Bar dataKey="total_scrap" fill="#ef4444" name="Scrap (kg)" radius={[12, 12, 12, 12]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel panel-tonal p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-eyebrow">Timeline</p>
            <h3 className="text-2xl font-black text-slate-900">Daily Production Trend</h3>
          </div>
          <div className="flex gap-2 text-xs text-slate-500">
            {Object.entries(stageColors).map(([stage, color]) => (
              <span key={stage} className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                {stage}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tickLine={false} />
            <YAxis label={{ value: 'kg', angle: -90, position: 'insideLeft' }} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 16 }} />
            <Legend />
            {Object.keys(stageColors).map((stage) => (
              <Line
                key={stage}
                type="monotone"
                dataKey={stage}
                stroke={stageColors[stage]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductionCharts;
