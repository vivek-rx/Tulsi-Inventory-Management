"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field, validator
from datetime import date, datetime
from typing import Optional, List
from enum import Enum

class ShiftEnum(str, Enum):
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    NIGHT = "Night"

class StageEnum(str, Enum):
    RBD = "RBD"
    INTER = "Inter"
    OVEN = "Oven"
    DPC = "DPC"
    REWIND = "Rewind"

class ProductionRecordBase(BaseModel):
    date: date
    shift: ShiftEnum
    stage: StageEnum
    input_qty: float = Field(ge=0, description="Input quantity in kg")
    output_qty: float = Field(ge=0, description="Output quantity in kg")
    scrap_qty: float = Field(ge=0, description="Scrap/loss quantity in kg")
    input_size_mm: Optional[float] = None
    output_size_mm: Optional[float] = None
    input_size_swg: Optional[int] = None
    output_size_swg: Optional[int] = None
    output_size_swg: Optional[int] = None
    output_size_swg: Optional[int] = None
    remarks: Optional[str] = None

class ProductionRecordCreate(ProductionRecordBase):
    pass

class ProductionRecordResponse(ProductionRecordBase):
    id: int
    efficiency: Optional[float]
    loss_percentage: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

class StageStats(BaseModel):
    """Statistics for a specific production stage"""
    stage: StageEnum
    total_input: float
    total_output: float
    total_scrap: float
    avg_efficiency: float
    avg_loss_percentage: float
    record_count: int

class ProcessFlowNode(BaseModel):
    """Node in the production process flow"""
    stage: StageEnum
    sequence_order: int
    input_qty: float
    output_qty: float
    efficiency: float
    status: str  # "good", "warning", "critical"
    expected_input_size_mm: Optional[float]
    expected_output_size_mm: Optional[float]

class DashboardSummary(BaseModel):
    """Overall dashboard summary"""
    total_production: float
    total_scrap: float
    overall_efficiency: float
    bottleneck_stage: Optional[StageEnum]
    active_alerts: int
    date_range: str

class StageDetailResponse(BaseModel):
    """Detailed information for a specific stage"""
    stage: StageEnum
    stats: StageStats
    recent_records: List[ProductionRecordResponse]
    daily_trend: List[dict]

class TimelineDataPoint(BaseModel):
    """Data point for timeline chart"""
    date: date
    stage: StageEnum
    output_qty: float
    efficiency: float

class Alert(BaseModel):
    """Production alert"""
    severity: str  # "info", "warning", "critical"
    stage: StageEnum
    message: str
    date: date
    shift: ShiftEnum
    metric_value: float

class AlertsResponse(BaseModel):
    """Collection of alerts"""
    alerts: List[Alert]
    alerts: List[Alert]
    total_count: int
