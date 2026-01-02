/**
 * Production Table Component
 * Displays detailed production records in tabular format
 */
import React from 'react';
import type { ProductionRecord } from '../types';

interface ProductionTableProps {
  records: ProductionRecord[];
  isLoading?: boolean;
}

const ProductionTable: React.FC<ProductionTableProps> = ({
  records,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="panel panel-tonal p-6">
        <h3 className="text-2xl font-bold mb-4 text-slate-900">
          Recent Production Records
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const getEfficiencyColor = (efficiency?: number) => {
    if (!efficiency) return 'text-gray-600';
    if (efficiency >= 90) return 'text-green-600 font-semibold';
    if (efficiency >= 80) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  return (
    <div className="panel panel-tonal p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="uppercase text-xs tracking-wider text-slate-400">Traceability</p>
          <h3 className="text-2xl font-bold text-slate-900">
            Recent Production Records
          </h3>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{records.length} rows synced</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80 backdrop-blur">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Shift
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Input (kg)
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Output (kg)
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Scrap (kg)
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Efficiency
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Loss %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No production records found
                </td>
              </tr>
            ) : (
              records.slice(0, 20).map((record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    <div className="font-semibold">{record.date}</div>
                    <div className="text-xs text-slate-400">{record.created_at ? new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                    <span className="chip chip-muted">{record.shift}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900">
                    <span className="chip">{record.stage}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-700">
                    {record.input_qty.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900 font-semibold">
                    {record.output_qty.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-700">
                    {record.scrap_qty.toFixed(1)}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm text-right ${getEfficiencyColor(
                      record.efficiency
                    )}`}
                  >
                    {record.efficiency?.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                    {record.loss_percentage?.toFixed(1)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {records.length > 20 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing 20 of {records.length} records
        </div>
      )}
    </div>
  );
};

export default ProductionTable;
