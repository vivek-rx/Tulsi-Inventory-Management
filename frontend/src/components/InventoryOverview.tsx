import React from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingUp, TrendingDown, Activity, Box } from 'lucide-react';

interface StageInventory {
  id: number;
  stage: string;
  current_stock: number;
  wire_size_mm: number | null;
  wire_size_swg: string | null;
  min_stock_level: number;
  max_stock_level: number;
  stock_status: 'LOW' | 'NORMAL' | 'HIGH';
  last_updated: string | null;
}

interface InventoryOverviewProps {
  inventory: StageInventory[];
}

const InventoryOverview: React.FC<InventoryOverviewProps> = ({ inventory }) => {
  if (!inventory || inventory.length === 0) {
    return (
      <div className="glass-panel p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-3">
          <Package className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold mb-1 text-slate-900">Inventory Overview</h2>
        <p className="text-gray-500">No inventory data available yet.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LOW':
        return <TrendingDown className="w-4 h-4" />;
      case 'HIGH':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const totalStock = inventory.reduce((sum, item) => sum + item.current_stock, 0);
  const lowStockCount = inventory.filter(item => item.stock_status === 'LOW').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="panel panel-grid p-8"
    >
      <div className="flex flex-col gap-6 pb-6 border-b border-white/40 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="section-eyebrow">Live Levels</p>
          <div className="flex items-center gap-3">
            <motion.span
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 3 }}
            >
              <Package className="w-6 h-6" />
            </motion.span>
            <div>
              <h2 className="text-3xl font-black text-slate-900">Inventory Spine</h2>
              <p className="text-sm text-slate-500">Watch buffers at each stage in real time.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="control-pill is-active">
            <Activity className="w-4 h-4" />
            <span className="font-semibold">{totalStock.toFixed(1)} kg in circuit</span>
          </div>
          <div className="control-pill">
            <span>Low stock</span>
            <strong>{lowStockCount}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 pt-6">
        {inventory.map((item, index) => {
          const stockPercentage = ((item.current_stock - item.min_stock_level) /
            (item.max_stock_level - item.min_stock_level)) * 100;

          const stageColors = {
            'RBD': 'from-purple-500 to-purple-600',
            'Inter': 'from-blue-500 to-blue-600',
            'Oven': 'from-orange-500 to-orange-600',
            'DPC': 'from-teal-500 to-teal-600',
            'Rewind': 'from-green-500 to-green-600'
          };

          const bgColor = stageColors[item.stage as keyof typeof stageColors] || 'from-gray-500 to-gray-600';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Stage</p>
                  <h3 className="text-xl font-bold text-slate-900">{item.stage}</h3>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${bgColor} shadow-lg`}>
                  <Box className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Stock Amount */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-500 mb-1">Available Stock</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-slate-900">{item.current_stock.toFixed(1)}</p>
                  <p className="text-sm font-medium text-slate-400">kg</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Min {item.min_stock_level}</span>
                  <span>Max {item.max_stock_level}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.stock_status === 'LOW'
                      ? 'bg-gradient-to-r from-red-400 to-red-600'
                      : item.stock_status === 'HIGH'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                        : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      }`}
                    style={{ width: `${Math.max(0, Math.min(100, stockPercentage))}%` }}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${item.stock_status === 'LOW'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : item.stock_status === 'HIGH'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                  {getStatusIcon(item.stock_status)}
                  {item.stock_status.toLowerCase()}
                </span>
                {item.last_updated && (
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default InventoryOverview;
