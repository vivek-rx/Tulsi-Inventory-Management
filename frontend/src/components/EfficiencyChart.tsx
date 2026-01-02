import React from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface EfficiencyChartProps {
    data: Array<{
        date: string;
        efficiency: number;
        output: number;
    }>;
    isLoading?: boolean;
}

const EfficiencyChart: React.FC<EfficiencyChartProps> = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
                <div className="h-80 bg-slate-200 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="mb-6">
                <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-1">Performance Trend</p>
                <h3 className="text-2xl font-black text-slate-900">Efficiency & Output</h3>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            label={{ value: 'Output (kg)', angle: 90, position: 'insideRight', fill: '#64748b' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar
                            yAxisId="right"
                            dataKey="output"
                            name="Output (kg)"
                            fill="#e0e7ff"
                            radius={[8, 8, 8, 8]}
                            barSize={20}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="efficiency"
                            name="Efficiency (%)"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EfficiencyChart;
