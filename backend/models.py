"""
Database models for production monitoring system
Represents the sequential wire manufacturing process:
RBD → Inter → Oven → DPC → Rewind
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Enum, Text
from sqlalchemy.sql import func
from database import Base
import enum

class ShiftEnum(str, enum.Enum):
    """Production shifts"""
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    NIGHT = "Night"

class StageEnum(str, enum.Enum):
    """Sequential production stages"""
    RBD = "RBD"
    INTER = "Inter"
    OVEN = "Oven"
    DPC = "DPC"
    REWIND = "Rewind"
    QUALITY_CHECK = "Quality Check"
    PACKAGING = "Packaging"
    DISPATCH = "Dispatch"

class ProductionRecord(Base):
    """
    Main production record table
    Each record represents production data for a specific stage, shift, and date
    """
    __tablename__ = "production_records"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    shift = Column(Enum(ShiftEnum), nullable=False, index=True)
    stage = Column(Enum(StageEnum), nullable=False, index=True)
    
    # Production quantities (in kg or units)
    input_qty = Column(Float, nullable=False, default=0.0)
    output_qty = Column(Float, nullable=False, default=0.0)
    scrap_qty = Column(Float, nullable=False, default=0.0)
    
    # Wire specifications
    input_size_mm = Column(Float, nullable=True)  # Input wire diameter in mm
    output_size_mm = Column(Float, nullable=True)  # Output wire diameter in mm
    input_size_swg = Column(Integer, nullable=True)  # Input SWG gauge
    output_size_swg = Column(Integer, nullable=True)  # Output SWG gauge
    
    # Calculated fields
    efficiency = Column(Float, nullable=True)  # output_qty / input_qty * 100
    loss_percentage = Column(Float, nullable=True)  # scrap_qty / input_qty * 100
    
    # Metadata
    operator_name = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<ProductionRecord(date={self.date}, shift={self.shift}, stage={self.stage}, output={self.output_qty})>"

class StageConfiguration(Base):
    """
    Configuration for each production stage
    Defines expected parameters and thresholds
    """
    __tablename__ = "stage_configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    stage = Column(Enum(StageEnum), unique=True, nullable=False)
    
    # Expected input/output specifications
    expected_input_size_mm = Column(Float, nullable=True)
    expected_output_size_mm = Column(Float, nullable=True)
    
    # Performance thresholds
    min_efficiency = Column(Float, default=85.0)  # Minimum acceptable efficiency %
    max_loss_percentage = Column(Float, default=5.0)  # Maximum acceptable loss %
    
    # Process parameters
    has_annealing = Column(Integer, default=0)  # 1 for Oven stage (with annealing)
    sequence_order = Column(Integer, nullable=False)  # 1=RBD, 2=Inter, 3=Oven, 4=DPC, 5=Rewind
    
    def __repr__(self):
        return f"<StageConfiguration(stage={self.stage}, order={self.sequence_order})>"
