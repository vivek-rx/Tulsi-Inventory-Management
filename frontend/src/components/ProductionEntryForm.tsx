import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { NumericFormat } from 'react-number-format';
import { Listbox, Transition } from '@headlessui/react';
import { ArrowRight, Package2, Gauge, Check, AlertCircle, Maximize2 } from 'lucide-react';

import { moveBatchToStage, type BatchMovePayload } from '../api';
import type { BatchSummary, StageEnum } from '../types';

interface OrderOption {
  id: number;
  order_number: string;
  customer_name: string;
  status: string;
  ordered_quantity: number;
  completed_quantity: number;
}

interface ProductionEntryFormProps {
  onSuccess?: () => void;
  onRefresh?: () => void;
  orders?: OrderOption[];
  batches?: BatchSummary[];
}

const ProductionEntryForm: React.FC<ProductionEntryFormProps> = ({ onSuccess, onRefresh, orders = [], batches = [] }) => {
  const [formData, setFormData] = useState({
    stage: 'RBD',
    quantity: '',
    unit: 'kg',
    scrap: '0',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderOption | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchSummary | null>(null);

  const availableOrders = useMemo(
    () => orders.filter(order => order.status !== 'COMPLETED'),
    [orders]
  );

  const availableBatches = useMemo(
    () => batches.filter(batch => batch.current_status === 'ACTIVE'),
    [batches]
  );

  // Smart Stage Selection
  useEffect(() => {
    if (selectedBatch && selectedBatch.stage_sequence) {
      const currentStage = selectedBatch.current_stage || '';
      const currentIndex = selectedBatch.stage_sequence.indexOf(currentStage);

      if (currentIndex !== -1 && currentIndex < selectedBatch.stage_sequence.length - 1) {
        // Auto-select the next stage in the sequence
        setFormData(prev => ({ ...prev, stage: selectedBatch.stage_sequence[currentIndex + 1] }));
      } else if (selectedBatch.stage_sequence.length > 0) {
        // Default to first stage if current is unknown or last
        setFormData(prev => ({ ...prev, stage: selectedBatch.stage_sequence[0] }));
      }
    }
  }, [selectedBatch]);

  // Auto-link Order
  useEffect(() => {
    if (selectedBatch?.order_id) {
      const linkedOrder = orders.find(o => o.id === selectedBatch.order_id);
      if (linkedOrder) {
        setSelectedOrder(linkedOrder);
      }
    }
  }, [selectedBatch, orders]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaxQuantity = () => {
    if (selectedBatch?.remaining_quantity) {
      setFormData(prev => ({ ...prev, quantity: String(selectedBatch.remaining_quantity) }));
    }
  };

  const resolveStageEnum = (value: string): StageEnum => {
    return value as StageEnum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (selectedBatch && selectedBatch.remaining_quantity !== undefined && selectedBatch.remaining_quantity !== null) {
      if (Number(formData.quantity) > selectedBatch.remaining_quantity) {
        toast.error(`Quantity exceeds remaining batch amount (${selectedBatch.remaining_quantity} kg)`, {
          icon: '⚠️',
          style: { background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0' }
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (selectedBatch) {
        const payload: BatchMovePayload = {
          to_stage: resolveStageEnum(formData.stage),
          quantity: Number(formData.quantity),
          scrap_quantity: Number(formData.scrap || '0'),
          notes: formData.notes || undefined
        };

        await moveBatchToStage(selectedBatch.id, payload);

        toast.success(
          `✓ Processed ${formData.quantity} kg from ${selectedBatch.batch_number}`,
          { duration: 4000, style: { background: '#10b981', color: '#fff' } }
        );
      } else {
        const params = new URLSearchParams({
          stage: formData.stage,
          quantity: formData.quantity,
          transaction_type: 'IN'
        });

        if (selectedOrder) {
          params.append('order_id', String(selectedOrder.id));
        }

        const response = await fetch(`/api/inventory/update?${params}`, {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to update inventory');
        }

        toast.success(
          `✓ ${formData.quantity} ${formData.unit} logged successfully`,
          { duration: 4000, style: { background: '#10b981', color: '#fff' } }
        );
      }

      setFormData({
        stage: formData.stage, // Keep last stage for rapid entry
        quantity: '',
        unit: formData.unit,
        scrap: '0',
        notes: ''
      });
      setSelectedBatch(null);
      setSelectedOrder(null);

      if (onSuccess) onSuccess();
      if (onRefresh) onRefresh();

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || (error as Error).message || 'Network error';
      toast.error(errorMessage, {
        style: { background: '#ef4444', color: '#fff' },
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="panel panel-tonal p-8 max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-lg text-white">
            <Package2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Log Production</h2>
            <p className="text-sm text-slate-500">Record material movement or output</p>
          </div>
        </div>

        <div className="divider mb-8" />

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Coil Selection - First for better flow */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Select Coil (Optional)</label>
            <Listbox value={selectedBatch} onChange={(batch) => { setSelectedBatch(batch); }}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-left bg-white text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 text-base transition-all shadow-sm hover:border-slate-300">
                  {selectedBatch ? (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{selectedBatch.batch_number}</span>
                        <span className="text-xs text-slate-500">{selectedBatch.material_type} · {selectedBatch.current_stage || 'Stock'}</span>
                      </div>
                      <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                  ) : (
                    <span className="text-slate-400">Select a coil to process...</span>
                  )}
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white py-2 shadow-xl ring-1 ring-slate-200 focus:outline-none text-sm">
                    {availableBatches.length === 0 ? (
                      <div className="px-4 py-3 text-slate-400 italic">No active coils found</div>
                    ) : (
                      availableBatches.map(batch => (
                        <Listbox.Option
                          key={batch.id}
                          value={batch}
                          className={({ active }) => `cursor-pointer select-none px-4 py-3 flex items-center justify-between ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}
                        >
                          {({ selected }) => (
                            <>
                              <div>
                                <p className={`font-semibold ${selected ? 'text-indigo-900' : 'text-slate-900'}`}>{batch.batch_number}</p>
                                <p className="text-xs text-slate-500">{batch.material_type} · {batch.current_stage || 'Stock'}</p>
                              </div>
                              <div className="text-right text-xs text-slate-500">
                                Rem: {batch.remaining_quantity?.toFixed(1)} kg
                              </div>
                            </>
                          )}
                        </Listbox.Option>
                      ))
                    )}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
            {selectedBatch && (
              <div className="flex items-start gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Moving <strong>{selectedBatch.batch_number}</strong> from <strong>{selectedBatch.current_stage || 'Stock'}</strong> to <strong>{formData.stage}</strong>.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-500" />
                Target Stage
              </label>
              <div className="relative">
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-white hover:border-slate-300 appearance-none cursor-pointer shadow-sm"
                >
                  <option value="RBD">RBD</option>
                  <option value="Inter">Inter</option>
                  <option value="Oven">Oven</option>
                  <option value="DPC">DPC</option>
                  <option value="Rewind">Rewind</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                <Package2 className="w-4 h-4 text-indigo-500" />
                Output Quantity
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <NumericFormat
                    value={formData.quantity}
                    onValueChange={(values) => {
                      setFormData(prev => ({ ...prev, quantity: values.value }));
                    }}
                    thousandSeparator=","
                    decimalScale={2}
                    fixedDecimalScale={false}
                    allowNegative={false}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-white shadow-sm placeholder:text-slate-300"
                  />
                  {selectedBatch && (
                    <button
                      type="button"
                      onClick={handleMaxQuantity}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                      title="Set to remaining quantity"
                    >
                      <Maximize2 className="w-3 h-3" />
                      MAX
                    </button>
                  )}
                </div>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-28 px-3 py-4 border border-slate-200 rounded-2xl text-base font-bold text-slate-700 bg-slate-50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer hover:border-slate-300"
                >
                  <option value="kg">kg</option>
                  <option value="bobbins">bobbins</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Assign to Order (Optional)</label>
            {!selectedBatch && (
              availableOrders.length > 0 ? (
                <Listbox value={selectedOrder} onChange={setSelectedOrder}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-left bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 text-base transition-all shadow-sm hover:border-slate-300">
                      {selectedOrder ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{selectedOrder.order_number}</span>
                          <span className="text-xs text-slate-500">{selectedOrder.customer_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Select an open order...</span>
                      )}
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white py-2 shadow-xl ring-1 ring-slate-200 focus:outline-none text-sm">
                        {availableOrders.map(order => (
                          <Listbox.Option
                            key={order.id}
                            value={order}
                            className={({ active }) => `cursor-pointer select-none px-4 py-3 flex items-center justify-between ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}
                          >
                            {({ selected }) => (
                              <>
                                <div>
                                  <p className={`font-semibold ${selected ? 'text-indigo-900' : 'text-slate-900'}`}>{order.order_number}</p>
                                  <p className="text-xs text-slate-500">{order.customer_name}</p>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                  {order.completed_quantity.toFixed(1)} / {order.ordered_quantity.toFixed(1)} kg
                                </div>
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              ) : (
                <div className="text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3 italic">
                  No open orders available.
                </div>
              ))}

            {selectedOrder && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mt-2 text-sm">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Customer</p>
                  <p className="font-bold text-slate-800">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Progress</p>
                  <p className="font-bold text-indigo-600">
                    {selectedOrder.completed_quantity.toFixed(1)} / {selectedOrder.ordered_quantity.toFixed(1)} kg
                  </p>
                </div>
                <div className="flex md:justify-end items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-3 py-2 text-xs font-bold text-indigo-600 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
            className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 disabled:bg-slate-400 text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all duration-200 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Saving...
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  Confirm Entry
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </form>
      </motion.div>
    </>
  );
};

export default ProductionEntryForm;
