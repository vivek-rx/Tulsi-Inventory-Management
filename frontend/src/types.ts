/**
 * TypeScript type definitions for production monitoring system
 * Matches backend Pydantic schemas
 */

export enum StageEnum {
  RBD = "RBD",
  INTER = "Inter",
  OVEN = "Oven",
  DPC = "DPC",
  REWIND = "Rewind",
  QUALITY_CHECK = "Quality Check",
  PACKAGING = "Packaging",
  DISPATCH = "Dispatch"
}

export enum ShiftEnum {
  MORNING = "Morning",
  AFTERNOON = "Afternoon",
  NIGHT = "Night"
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  product_specification: string | null;
  ordered_quantity: number;
  completed_quantity: number;
  status: string;
  current_stage: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  priority: number;
  completion_percentage: number;
}

export interface ProductionRecord {
  id: number;
  date: string;
  shift: ShiftEnum;
  stage: StageEnum;
  input_qty: number;
  output_qty: number;
  scrap_qty: number;
  input_size_mm?: number;
  output_size_mm?: number;
  input_size_swg?: number;
  output_size_swg?: number;
  efficiency?: number;
  loss_percentage?: number;
  created_at: string;
  remarks?: string;
}

export interface StageStats {
  stage: StageEnum;
  total_input: number;
  total_output: number;
  total_scrap: number;
  avg_efficiency: number;
  avg_loss_percentage: number;
  record_count: number;
}

export interface ProcessFlowNode {
  stage: StageEnum;
  sequence_order: number;
  input_qty: number;
  output_qty: number;
  efficiency: number;
  status: "good" | "warning" | "critical";
  expected_input_size_mm?: number;
  expected_output_size_mm?: number;
}

export interface DashboardSummary {
  total_production: number;
  total_scrap: number;
  overall_efficiency: number;
  bottleneck_stage?: StageEnum;
  active_alerts: number;
  date_range: string;
}

export interface Alert {
  severity: "info" | "warning" | "critical";
  stage: StageEnum;
  message: string;
  date: string;
  shift: ShiftEnum;
  metric_value: number;
}

export interface AlertsResponse {
  alerts: Alert[];
  total_count: number;
}

export interface TimelineDataPoint {
  date: string;
  stage: string;
  output_qty: number;
  efficiency: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface WIPAnalysis {
  from_stage: string;
  to_stage: string;
  label: string;
  wip_quantity: number;
}

export interface StageConfig {
  stage: string;
  sequence_order: number;
  expected_input_size_mm?: number;
  expected_output_size_mm?: number;
  min_efficiency: number;
  max_loss_percentage: number;
  has_annealing: boolean;
}

export interface HoldHistoryEntry {
  action: 'HOLD' | 'RESUME';
  reason?: string | null;
  timestamp: string;
}

export interface BatchJourneyEvent {
  id: number;
  from_stage: string | null;
  to_stage: string;
  quantity: number;
  scrap_quantity: number;
  operator?: string | null;
  notes?: string | null;
  movement_date?: string | null;
  created_at?: string | null;
}

export interface JourneyProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface BatchSummary {
  id: number;
  batch_number: string;
  lot_number?: string | null;
  material_type?: string | null;
  quantity: number;
  remaining_quantity?: number | null;
  current_stage?: string | null;
  current_status: string;
  supplier_name?: string | null;
  received_date?: string | null;
  quality_status?: string | null;
  order_id?: number | null;
  order_number?: string | null;
  customer_name?: string | null;
  journey_progress: JourneyProgress;
  last_movement?: BatchJourneyEvent | null;
  stage_sequence: string[];
  hold_history?: HoldHistoryEntry[];
  latest_hold?: HoldHistoryEntry | null;
}

export interface BatchDetail extends BatchSummary {
  journey_events: BatchJourneyEvent[];
  next_stage?: string | null;
  hold_history?: HoldHistoryEntry[];
  order?: {
    order_number: string;
    customer_name: string;
    status: string;
    ordered_quantity: number;
    completed_quantity: number;
  };
}

// ==================== FINAL STAGES TYPES ====================

export interface QualityInspection {
  id: number;
  batch_id: number;
  order_id: number | null;
  inspector_name: string;
  inspection_date: string;
  quality_status: 'PASSED' | 'FAILED' | 'PENDING';
  defect_type: string | null;
  defect_count: number;
  notes: string | null;
}

export interface PackagingRecord {
  id: number;
  batch_id: number;
  order_id: number | null;
  package_type: string;
  coil_count: number;
  package_weight: number;
  operator_name: string;
  packing_date: string;
  package_number: string | null;
  notes: string | null;
}

export interface DispatchRecord {
  id: number;
  order_id: number;
  dispatch_date: string;
  transport_mode: string;
  vehicle_number: string | null;
  tracking_number: string | null;
  destination: string;
  delivery_status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  delivered_date: string | null;
  driver_name: string | null;
  notes: string | null;
}
