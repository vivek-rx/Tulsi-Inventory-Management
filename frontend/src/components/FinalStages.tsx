/**
 * Final Stages Component
 * Forms for Quality Check, Packaging, and Dispatch
 */
import React, { useState } from 'react';
import { CheckCircle, Package, Truck, ClipboardCheck, Box, Send } from 'lucide-react';

// Reusable Input Component for consistency
const InputField = ({ label, ...props }: any) => (
    <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">{label}</label>
        <input
            {...props}
            className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-white hover:border-slate-300 shadow-sm placeholder:text-slate-300"
        />
    </div>
);

const SelectField = ({ label, children, ...props }: any) => (
    <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">{label}</label>
        <div className="relative">
            <select
                {...props}
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-white hover:border-slate-300 appearance-none cursor-pointer shadow-sm"
            >
                {children}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
    </div>
);

export const QualityCheckForm: React.FC<{ batchId: number; onSuccess?: () => void }> = ({ batchId, onSuccess }) => {
    const [formData, setFormData] = useState({
        inspector_name: '',
        quality_status: 'PENDING' as 'PASSED' | 'FAILED' | 'PENDING',
        defect_type: '',
        defect_count: 0,
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`http://localhost:8000/api/batches/${batchId}/quality-check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to record quality check');

            alert('Quality check recorded successfully!');
            onSuccess?.();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to record quality check');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8 relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100">
                    <ClipboardCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Quality Check</h3>
                    <p className="text-sm text-slate-500 font-medium">Final inspection of finished product</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <InputField
                    label="Inspector Name *"
                    required
                    value={formData.inspector_name}
                    onChange={(e: any) => setFormData({ ...formData, inspector_name: e.target.value })}
                    placeholder="Enter inspector name"
                />

                <SelectField
                    label="Quality Status *"
                    required
                    value={formData.quality_status}
                    onChange={(e: any) => setFormData({ ...formData, quality_status: e.target.value as any })}
                >
                    <option value="PENDING">Pending</option>
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
                </SelectField>

                <InputField
                    label="Defect Type"
                    value={formData.defect_type}
                    onChange={(e: any) => setFormData({ ...formData, defect_type: e.target.value })}
                    placeholder="e.g., Surface scratches"
                />

                <InputField
                    label="Defect Count"
                    type="number"
                    min="0"
                    value={formData.defect_count}
                    onChange={(e: any) => setFormData({ ...formData, defect_count: parseInt(e.target.value) || 0 })}
                />
            </div>

            <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all bg-white hover:border-slate-300 shadow-sm placeholder:text-slate-300"
                    placeholder="Additional inspection notes..."
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    'Recording...'
                ) : (
                    <>
                        <CheckCircle className="w-5 h-5" />
                        Record Quality Check
                    </>
                )}
            </button>
        </form>
    );
};

export const PackagingForm: React.FC<{ batchId: number; onSuccess?: () => void }> = ({ batchId, onSuccess }) => {
    const [formData, setFormData] = useState({
        package_type: 'Wooden Crate',
        coil_count: 1,
        package_weight: 0,
        operator_name: '',
        package_number: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`http://localhost:8000/api/batches/${batchId}/package`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to record packaging');

            alert('Packaging recorded successfully!');
            onSuccess?.();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to record packaging');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8 relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600" />

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 rounded-2xl shadow-sm border border-blue-100">
                    <Box className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Packaging</h3>
                    <p className="text-sm text-slate-500 font-medium">Package finished coils for shipment</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <SelectField
                    label="Package Type *"
                    required
                    value={formData.package_type}
                    onChange={(e: any) => setFormData({ ...formData, package_type: e.target.value })}
                >
                    <option value="Wooden Crate">Wooden Crate</option>
                    <option value="Pallet">Pallet</option>
                    <option value="Cardboard Box">Cardboard Box</option>
                    <option value="Steel Container">Steel Container</option>
                </SelectField>

                <InputField
                    label="Coil Count *"
                    type="number"
                    required
                    min="1"
                    value={formData.coil_count}
                    onChange={(e: any) => setFormData({ ...formData, coil_count: parseInt(e.target.value) || 1 })}
                />

                <InputField
                    label="Package Weight (kg) *"
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    value={formData.package_weight}
                    onChange={(e: any) => setFormData({ ...formData, package_weight: parseFloat(e.target.value) || 0 })}
                />

                <InputField
                    label="Operator Name *"
                    required
                    value={formData.operator_name}
                    onChange={(e: any) => setFormData({ ...formData, operator_name: e.target.value })}
                    placeholder="Enter operator name"
                />

                <div className="md:col-span-2">
                    <InputField
                        label="Package Number"
                        value={formData.package_number}
                        onChange={(e: any) => setFormData({ ...formData, package_number: e.target.value })}
                        placeholder="e.g., PKG-2026-001"
                    />
                </div>
            </div>

            <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all bg-white hover:border-slate-300 shadow-sm placeholder:text-slate-300"
                    placeholder="Additional packaging notes..."
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    'Recording...'
                ) : (
                    <>
                        <Package className="w-5 h-5" />
                        Record Packaging
                    </>
                )}
            </button>
        </form>
    );
};

export const DispatchForm: React.FC<{ orderId: number; onSuccess?: () => void }> = ({ orderId, onSuccess }) => {
    const [formData, setFormData] = useState({
        transport_mode: 'Truck',
        vehicle_number: '',
        tracking_number: '',
        destination: '',
        customer_contact: '',
        driver_name: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`http://localhost:8000/api/orders/${orderId}/dispatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to record dispatch');

            alert('Dispatch recorded successfully!');
            onSuccess?.();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to record dispatch');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8 relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600" />

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100">
                    <Truck className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Dispatch</h3>
                    <p className="text-sm text-slate-500 font-medium">Ship order to customer</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <SelectField
                    label="Transport Mode *"
                    required
                    value={formData.transport_mode}
                    onChange={(e: any) => setFormData({ ...formData, transport_mode: e.target.value })}
                >
                    <option value="Truck">Truck</option>
                    <option value="Rail">Rail</option>
                    <option value="Air">Air</option>
                    <option value="Sea">Sea</option>
                </SelectField>

                <InputField
                    label="Vehicle Number"
                    value={formData.vehicle_number}
                    onChange={(e: any) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    placeholder="e.g., MH-12-AB-1234"
                />

                <InputField
                    label="Tracking Number"
                    value={formData.tracking_number}
                    onChange={(e: any) => setFormData({ ...formData, tracking_number: e.target.value })}
                    placeholder="e.g., TRK123456"
                />

                <InputField
                    label="Driver Name"
                    value={formData.driver_name}
                    onChange={(e: any) => setFormData({ ...formData, driver_name: e.target.value })}
                    placeholder="Enter driver name"
                />

                <div className="md:col-span-2">
                    <InputField
                        label="Destination *"
                        required
                        value={formData.destination}
                        onChange={(e: any) => setFormData({ ...formData, destination: e.target.value })}
                        placeholder="Customer address..."
                    />
                </div>

                <div className="md:col-span-2">
                    <InputField
                        label="Customer Contact"
                        value={formData.customer_contact}
                        onChange={(e: any) => setFormData({ ...formData, customer_contact: e.target.value })}
                        placeholder="Phone or email"
                    />
                </div>
            </div>

            <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-4 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-white hover:border-slate-300 shadow-sm placeholder:text-slate-300"
                    placeholder="Dispatch notes..."
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    'Recording...'
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        Record Dispatch
                    </>
                )}
            </button>
        </form>
    );
};

export default { QualityCheckForm, PackagingForm, DispatchForm };
