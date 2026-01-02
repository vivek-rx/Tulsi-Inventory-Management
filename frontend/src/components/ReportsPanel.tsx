import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Calendar, Download, Activity, PieChart, Layers, TrendingUp, AlertTriangle } from 'lucide-react';
import ProductionTable from './ProductionTable';
import EfficiencyChart from './EfficiencyChart';
import ScrapAnalysis from './ScrapAnalysis';
import { getEfficiencyStats, getScrapAnalysis } from '../api';
import type { ProductionRecord } from '../types';

interface StageBreakdownItem {
  stage: string;
  input: number;
  output: number;
  scrap: number;
  efficiency: number;
}

interface ProductionReportData {
  date_range: {
    start: string;
    end: string;
  };
  totals: {
    total_input: number;
    total_output: number;
    total_scrap: number;
    utilization: number;
  };
  stage_breakdown: StageBreakdownItem[];
  order_summary: {
    total_orders: number;
    pending: number;
    in_progress: number;
    completed: number;
    by_stage: Record<string, number>;
  };
  recent_records: ProductionRecord[];
}

const formatDate = (value: Date) => value.toISOString().split('T')[0];

const ReportsPanel: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const [startDate, setStartDate] = useState<string>(formatDate(defaultStart));
  const [endDate, setEndDate] = useState<string>(formatDate(today));

  // Fetch Main Report Data
  const { data, isLoading, refetch, isFetching } = useQuery<ProductionReportData>(
    ['production-report', startDate, endDate],
    async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const response = await fetch(`http://localhost:8000/api/reports/production-summary?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load report');
      }
      return response.json();
    },
    { keepPreviousData: true }
  );

  // Fetch Efficiency Stats
  const { data: efficiencyData, isLoading: efficiencyLoading } = useQuery(
    ['efficiency-stats', startDate, endDate],
    () => getEfficiencyStats(startDate, endDate),
    { keepPreviousData: true }
  );

  // Fetch Scrap Analysis
  const { data: scrapData, isLoading: scrapLoading } = useQuery(
    ['scrap-analysis', startDate, endDate],
    () => getScrapAnalysis(startDate, endDate),
    { keepPreviousData: true }
  );

  const handleDownload = async (type: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const endpoint = type === 'excel'
        ? `http://localhost:8000/api/reports/production/export?${params.toString()}`
        : `http://localhost:8000/api/reports/production/export/pdf?${params.toString()}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to export ${type.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `production-report-${startDate || 'all'}-to-${endDate || 'today'}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Unable to download ${type.toUpperCase()}. Please try again.`);
    }
  };

  const summaryCards = [
    {
      title: 'Total Input',
      value: data?.totals.total_input ?? 0,
      suffix: 'kg',
      color: 'from-blue-500 to-blue-600',
      icon: <Layers className="w-5 h-5 text-white" />
    },
    {
      title: 'Total Output',
      value: data?.totals.total_output ?? 0,
      suffix: 'kg',
      color: 'from-emerald-500 to-emerald-600',
      icon: <Activity className="w-5 h-5 text-white" />
    },
    {
      title: 'Total Scrap',
      value: data?.totals.total_scrap ?? 0,
      suffix: 'kg',
      color: 'from-rose-500 to-rose-600',
      icon: <AlertTriangle className="w-5 h-5 text-white" />
    },
    {
      title: 'Efficiency',
      value: data?.totals.utilization ?? 0,
      suffix: '%',
      color: 'from-violet-500 to-violet-600',
      icon: <TrendingUp className="w-5 h-5 text-white" />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Production Reports</h2>
          <p className="text-slate-500">Analyze performance, efficiency, and waste</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 pr-3 py-2 bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0"
              />
            </div>
            <span className="text-slate-400">-</span>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-3 pr-3 py-2 bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0"
              />
            </div>
          </div>

          <button
            onClick={() => handleDownload('excel')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>


        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg shadow-indigo-100`}>
                {card.icon}
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </h3>
                <span className="text-sm font-semibold text-slate-400">{card.suffix}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EfficiencyChart
          data={efficiencyData || []}
          isLoading={efficiencyLoading}
        />
        <ScrapAnalysis
          data={scrapData || []}
          isLoading={scrapLoading}
        />
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Detailed Production Records</h3>
            <p className="text-sm text-slate-500">Transaction history for selected period</p>
          </div>
        </div>
        <ProductionTable
          records={data?.recent_records || []}
          isLoading={isLoading || isFetching}
        />
      </div>
    </div>
  );
};

export default ReportsPanel;
