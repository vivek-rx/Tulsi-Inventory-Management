import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Search,
  Plus,
  Loader2,
  X,
  Calendar,
  FileText
} from 'lucide-react';
import { createOrder, type OrderCreatePayload } from '../api';
import type { BatchSummary, Order } from '../types';



interface OrderTrackingProps {
  orders: Order[];
  isLoading?: boolean;
  batches: BatchSummary[];
  batchesLoading?: boolean;
  onRefreshBatches?: () => void;
  externalSearchTerm?: string;
}

const statusChips = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'COMPLETED', label: 'Completed' },
];

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

const OrderTracking: React.FC<OrderTrackingProps> = ({ orders, isLoading, externalSearchTerm }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Sync with global search
  React.useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (statusFilter !== 'ALL') {
      result = result.filter(order => order.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(order =>
        order.order_number.toLowerCase().includes(term) ||
        order.customer_name.toLowerCase().includes(term)
      );
    }

    return result;
  }, [orders, statusFilter, searchTerm]);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 3) return <span className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded">URGENT</span>;
    if (priority === 2) return <span className="px-2 py-1 text-xs font-semibold bg-orange-500 text-white rounded">HIGH</span>;
    return <span className="px-2 py-1 text-xs font-semibold bg-slate-500 text-white rounded">NORMAL</span>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <TrendingUp className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="panel panel-tonal p-6">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
          <div>
            <p className="section-eyebrow">Customer orders</p>
            <h3 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
              <Package className="w-6 h-6 text-indigo-600" />
              Order Management
            </h3>
            <p className="text-slate-500 mt-1">Track production progress against customer requirements.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs h-fit">
            <span className="chip chip-muted">Total {stats.total}</span>
            <span className="chip">Pending {stats.pending}</span>
            <span className="chip">In Progress {stats.inProgress}</span>
            <span className="chip chip-muted">Completed {stats.completed}</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search order number or customer..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id)}
                className={`control-pill ${statusFilter === chip.id ? 'is-active' : ''}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg hover:bg-slate-800 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Order
          </button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-24 bg-slate-100 rounded-2xl" />
            <div className="h-24 bg-slate-100 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-semibold">No orders found</p>
                <p className="text-sm opacity-70">Try adjusting your search or create a new order.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-900">{order.order_number}</h4>
                      {getPriorityBadge(order.priority)}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${getStatusStyles(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                      <p className="font-bold text-slate-800">{order.customer_name}</p>
                      {order.product_specification && <p className="text-xs mt-1">{order.product_specification}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Dates</p>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-xs text-slate-400">Ordered:</span>
                          <p className="font-medium">{formatDate(order.order_date)}</p>
                        </div>
                        {order.expected_delivery_date && (
                          <div>
                            <span className="text-xs text-slate-400">Due:</span>
                            <p className="font-bold text-blue-600">{formatDate(order.expected_delivery_date)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Progress</p>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>
                          {order.completed_quantity.toFixed(1)} / {order.ordered_quantity.toFixed(1)} kg
                        </span>
                        <span className="font-bold text-blue-600">{order.completion_percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${order.completion_percentage}%` }}
                        />
                      </div>
                      {order.current_stage && (
                        <p className="text-xs mt-2 text-slate-500">
                          <span className="font-semibold">Current Stage:</span> {order.current_stage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(['orders']);
          queryClient.invalidateQueries(['summary']);
        }}
      />
    </div>
  );
};

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<OrderCreatePayload>({
    order_number: '',
    customer_name: '',
    product_specification: '',
    ordered_quantity: 0,
    priority: 1,
    notes: '',
    expected_delivery_date: ''
  });

  const createMutation = useMutation(createOrder, {
    onSuccess: (data) => {
      toast.success(`Order ${data.order.order_number} created!`, {
        style: { background: '#10b981', color: '#fff' }
      });
      onSuccess();
      onClose();
      setFormData({
        order_number: '',
        customer_name: '',
        product_specification: '',
        ordered_quantity: 0,
        priority: 1,
        notes: '',
        expected_delivery_date: ''
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ordered_quantity || formData.ordered_quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    // Sanitize payload: remove empty strings for optional fields
    const payload = {
      ...formData,
      expected_delivery_date: formData.expected_delivery_date || undefined,
      product_specification: formData.product_specification || undefined,
      notes: formData.notes || undefined
    };

    createMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <p className="section-eyebrow">New Requirement</p>
          <h3 className="text-3xl font-bold text-slate-900">Create Production Order</h3>
          <p className="text-slate-500 mt-2">Enter the details for the new customer order.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Order Number</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-11 font-semibold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  placeholder="e.g. PO-2024-001"
                  value={formData.order_number}
                  onChange={e => setFormData({ ...formData, order_number: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Customer Name</label>
              <input
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="Client Name"
                value={formData.customer_name}
                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Ordered Quantity (kg)</label>
              <input
                type="number"
                required
                min="1"
                step="0.1"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                value={formData.ordered_quantity || ''}
                onChange={e => setFormData({ ...formData, ordered_quantity: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Due Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-11 font-semibold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  value={formData.expected_delivery_date || ''}
                  onChange={e => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Priority</label>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-white"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              >
                <option value={1}>Normal</option>
                <option value={2}>High</option>
                <option value={3}>Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Product Spec</label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="e.g. 2.5mm Copper Wire"
                value={formData.product_specification || ''}
                onChange={e => setFormData({ ...formData, product_specification: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Notes</label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all min-h-[100px]"
              placeholder="Any special instructions..."
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-4 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              disabled={createMutation.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {createMutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderTracking;
