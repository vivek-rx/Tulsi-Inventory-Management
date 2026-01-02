/**
 * API client for production monitoring backend
 * Handles all HTTP requests to FastAPI backend
 */
import axios from 'axios';
import type {
  DashboardSummary,
  ProcessFlowNode,
  AlertsResponse,
  ProductionRecord,
  StageEnum,
  ShiftEnum,
  TimelineDataPoint,
  WIPAnalysis,
  StageConfig,
  BatchSummary,
  BatchDetail
} from './types';

// Base API URL - uses Vite proxy in development
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface QueryParams {
  start_date?: string;
  end_date?: string;
  stage?: StageEnum;
  shift?: ShiftEnum;
  skip?: number;
  limit?: number;
}

/**
 * Get dashboard summary with key metrics
 */
export const getDashboardSummary = async (params?: QueryParams): Promise<DashboardSummary> => {
  const response = await api.get('/summary', { params });
  return response.data;
};

/**
 * Get production process flow (all stages)
 */
export const getProcessFlow = async (params?: QueryParams): Promise<ProcessFlowNode[]> => {
  const response = await api.get('/process-flow', { params });
  return response.data;
};

/**
 * Get alerts for production issues
 */
export const getAlerts = async (params?: QueryParams & { severity?: string }): Promise<AlertsResponse> => {
  const response = await api.get('/alerts', { params });
  return response.data;
};

/**
 * Get production records with filters
 */
export const getProductionRecords = async (params?: QueryParams): Promise<ProductionRecord[]> => {
  const response = await api.get('/records', { params });
  return response.data;
};

/**
 * Get timeline data for charts
 */
export const getTimeline = async (params?: QueryParams): Promise<{
  timeline: TimelineDataPoint[];
  date_range: { start: string; end: string };
}> => {
  const response = await api.get('/timeline', { params });
  return response.data;
};

/**
 * Get detailed information for a specific stage
 */
export const getStageDetails = async (
  stage: StageEnum,
  params?: QueryParams
): Promise<{
  stage: StageEnum;
  stats: any;
  recent_records: ProductionRecord[];
  daily_trend: any[];
}> => {
  const response = await api.get(`/stage/${stage}`, { params });
  return response.data;
};

/**
 * Get WIP (Work-in-Progress) analysis
 */
export const getWIPAnalysis = async (targetDate?: string): Promise<{
  date: string;
  wip_analysis: WIPAnalysis[];
}> => {
  const response = await api.get('/wip', {
    params: { target_date: targetDate }
  });
  return response.data;
};

/**
 * Get stage configurations
 */
export const getStageConfigurations = async (): Promise<StageConfig[]> => {
  const response = await api.get('/stages/config');
  return response.data;
};

/**
 * Get statistics summary for all stages
 */
export const getStatisticsSummary = async (params?: QueryParams): Promise<{
  date_range: { start: string; end: string };
  stages: any[];
}> => {
  const response = await api.get('/stats/summary', { params });
  return response.data;
};

export interface OrderCreatePayload {
  order_number: string;
  customer_name: string;
  product_specification?: string;
  ordered_quantity: number;
  target_wire_size_mm?: number;
  expected_delivery_date?: string;
  priority: number;
  notes?: string;
}

/**
 * Create a new production record
 */
export const createProductionRecord = async (record: Partial<ProductionRecord>): Promise<ProductionRecord> => {
  const response = await api.post('/records', record);
  return response.data;
};

/**
 * Create a new production order
 */
export const createOrder = async (payload: OrderCreatePayload): Promise<{ success: boolean; message: string; order: any }> => {
  const response = await api.post('/orders', payload);
  return response.data;
};

// ==================== INVENTORY API FUNCTIONS ====================

export interface StageInventory {
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

export interface InventorySummary {
  total_stock: number;
  stages: Array<{
    stage: string;
    stock: number;
    status: string;
    utilization_percentage: number;
  }>;
  low_stock_count: number;
  high_stock_count: number;
  last_updated: string | null;
}

export interface InventoryAlert {
  stage: string;
  alert_type: string;
  current_stock: number;
  threshold: number;
  message: string;
}

export interface InventoryTransaction {
  id: number;
  stage: string;
  transaction_type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  notes: string | null;
  timestamp: string;
}

export interface MaterialMovement {
  id: number;
  from_stage: string | null;
  to_stage: string | null;
  quantity: number;
  wire_size_mm: number | null;
  wire_size_swg: string | null;
  movement_date: string;
  notes: string | null;
}

/**
 * Get inventory summary with overall stats
 */
export const getInventorySummary = async (): Promise<InventorySummary> => {
  const response = await api.get('/inventory/summary');
  return response.data;
};

/**
 * Get all inventory levels for all stages
 */
export const getAllInventory = async (): Promise<StageInventory[]> => {
  const response = await api.get('/inventory/all');
  return response.data;
};

/**
 * Get inventory for a specific stage
 */
export const getStageInventory = async (stage: StageEnum): Promise<StageInventory> => {
  const response = await api.get(`/inventory/stage/${stage}`);
  return response.data;
};

/**
 * Update inventory manually (add or remove stock)
 */
export const updateInventory = async (
  stage: StageEnum,
  quantity: number,
  transactionType: 'IN' | 'OUT',
  notes?: string
): Promise<{
  success: boolean;
  stage: string;
  new_stock_level: number;
  transaction_type: string;
  quantity: number;
  message: string;
}> => {
  const response = await api.post('/inventory/update', null, {
    params: {
      stage,
      quantity,
      transaction_type: transactionType,
      notes
    }
  });
  return response.data;
};

/**
 * Record material movement between stages
 */
export const recordMaterialMovement = async (
  fromStage: StageEnum,
  toStage: StageEnum,
  quantity: number,
  wireSizeMm?: number,
  wireSizeSwg?: string,
  notes?: string
): Promise<{
  success: boolean;
  movement_id: number;
  from_stage: string;
  to_stage: string;
  quantity: number;
  movement_date: string;
  message: string;
}> => {
  const response = await api.post('/inventory/movement', null, {
    params: {
      from_stage: fromStage,
      to_stage: toStage,
      quantity,
      wire_size_mm: wireSizeMm,
      wire_size_swg: wireSizeSwg,
      notes
    }
  });
  return response.data;
};

/**
 * Get inventory alerts (low/high stock warnings)
 */
export const getInventoryAlerts = async (): Promise<{
  alert_count: number;
  alerts: InventoryAlert[];
}> => {
  const response = await api.get('/inventory/alerts');
  return response.data;
};

/**
 * Get inventory transaction history
 */
export const getInventoryTransactions = async (
  stage?: StageEnum,
  limit: number = 50
): Promise<InventoryTransaction[]> => {
  const response = await api.get('/inventory/transactions', {
    params: { stage, limit }
  });
  return response.data;
};

/**
 * Get material movement history
 */
export const getMaterialMovements = async (
  fromStage?: StageEnum,
  toStage?: StageEnum,
  limit: number = 50
): Promise<MaterialMovement[]> => {
  const response = await api.get('/inventory/movements', {
    params: {
      from_stage: fromStage,
      to_stage: toStage,
      limit
    }
  });
  return response.data;
};

/**
 * Sync inventory from production records
 */
export const syncInventory = async (startDate?: string): Promise<{
  success: boolean;
  message: string;
  start_date: string;
  total_stock: number;
  stages_synced: number;
}> => {
  const response = await api.post('/inventory/sync', null, {
    params: { start_date: startDate }
  });
  return response.data;
};

// ==================== BATCH / COIL API FUNCTIONS ====================

export interface BatchCreatePayload {
  batch_number: string;
  quantity: number;
  lot_number?: string;
  material_type?: string;
  initial_stage?: StageEnum;
  supplier_name?: string;
  received_date?: string;
  order_id?: number;
  notes?: string;
}

export interface BatchMovePayload {
  to_stage: StageEnum;
  quantity: number;
  scrap_quantity?: number;
  operator?: string;
  notes?: string;
}

export interface BatchHoldPayload {
  hold: boolean;
  reason?: string;
}

export const getBatchSummaries = async (startDate?: string, endDate?: string): Promise<BatchSummary[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await api.get(`/batches/summary?${params.toString()}`);
  return response.data;
};

// ==================== ANALYTICS API FUNCTIONS ====================

export const getEfficiencyStats = async (startDate?: string, endDate?: string): Promise<Array<{ date: string; efficiency: number; output: number }>> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await api.get(`/analytics/efficiency?${params.toString()}`);
  return response.data;
};

export const getScrapAnalysis = async (startDate?: string, endDate?: string): Promise<Array<{ stage: string; value: number }>> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await api.get(`/analytics/scrap?${params.toString()}`);
  return response.data;
};

export const getBatchDetail = async (batchId: number): Promise<BatchDetail> => {
  const response = await api.get(`/batches/${batchId}`);
  return response.data;
};

export const createBatch = async (payload: BatchCreatePayload): Promise<{ success: boolean; batch: BatchSummary }> => {
  const response = await api.post('/batches', payload);
  return response.data;
};

export const moveBatchToStage = async (
  batchId: number,
  payload: BatchMovePayload
): Promise<{ success: boolean; message: string; batch: BatchSummary }> => {
  const response = await api.post(`/batches/${batchId}/move`, payload);
  return response.data;
};

export const toggleBatchHold = async (
  batchId: number,
  payload: BatchHoldPayload
): Promise<{ success: boolean; batch_id: number; batch_number: string; status: string; message: string }> => {
  const response = await api.post(`/batches/${batchId}/hold`, payload);
  return response.data;
};

export default api;
