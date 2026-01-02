"""
Order and Batch tracking models
Track customer orders through production stages
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models import StageEnum
import enum

class OrderStatus(str, enum.Enum):
    """Order status enumeration"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"
    CANCELLED = "CANCELLED"

class ProductionOrder(Base):
    """
    Customer orders/batches to track through production
    """
    __tablename__ = "production_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Order identification
    order_number = Column(String, unique=True, nullable=False, index=True)
    customer_name = Column(String, nullable=False)
    
    # Order details
    product_specification = Column(String, nullable=True)  # e.g., "1.0mm wire, 18 SWG"
    target_wire_size_mm = Column(Float, nullable=True)
    ordered_quantity = Column(Float, nullable=False)  # in kg
    
    # Status tracking
    status = Column(String, nullable=False, default=OrderStatus.PENDING.value)
    current_stage = Column(String, nullable=True)  # Which stage it's currently at
    completed_quantity = Column(Float, default=0.0)  # How much has been completed
    
    # Dates
    order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date, nullable=True)
    actual_delivery_date = Column(Date, nullable=True)
    
    # Additional info
    priority = Column(Integer, default=1)  # 1=Normal, 2=High, 3=Urgent
    notes = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<ProductionOrder(order_number={self.order_number}, customer={self.customer_name}, status={self.status})>"

class OrderStageProgress(Base):
    """
    Track order progress through each production stage
    """
    __tablename__ = "order_stage_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('production_orders.id'), nullable=False, index=True)
    
    # Stage information
    stage = Column(String, nullable=False)
    
    # Quantities at this stage
    input_quantity = Column(Float, default=0.0)
    output_quantity = Column(Float, default=0.0)
    scrap_quantity = Column(Float, default=0.0)
    
    # Status
    stage_status = Column(String, default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED
    
    # Dates
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Reference to production records
    production_record_id = Column(Integer, ForeignKey('production_records.id'), nullable=True)
    
    def __repr__(self):
        return f"<OrderStageProgress(order_id={self.order_id}, stage={self.stage}, status={self.stage_status})>"

class BatchTracking(Base):
    """
    Track specific material batches/lots through production
    For quality traceability
    """
    __tablename__ = "batch_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Batch identification
    batch_number = Column(String, unique=True, nullable=False, index=True)
    lot_number = Column(String, nullable=True)  # Supplier lot number
    
    # Batch details
    material_type = Column(String, nullable=True)
    quantity = Column(Float, nullable=False)  # Initial quantity in kg
    remaining_quantity = Column(Float, nullable=False)  # Current quantity
    
    # Current location
    current_stage = Column(String, nullable=True)
    current_status = Column(String, default="ACTIVE")  # ACTIVE, CONSUMED, ON_HOLD, REJECTED
    
    # Supplier information
    supplier_name = Column(String, nullable=True)
    received_date = Column(Date, nullable=True)
    
    # Quality information
    quality_status = Column(String, default="APPROVED")  # APPROVED, REJECTED, ON_HOLD, PENDING
    quality_notes = Column(String, nullable=True)
    hold_history = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)  # General notes field
    
    # Link to orders (optional)
    order_id = Column(Integer, ForeignKey('production_orders.id'), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    order = relationship("ProductionOrder", backref="batches")
    journey_events = relationship(
        "BatchJourneyEvent",
        back_populates="batch",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<BatchTracking(batch_number={self.batch_number}, status={self.current_status})>"


class BatchJourneyEvent(Base):
    """Granular traceability records for each batch as it moves across stages"""

    __tablename__ = "batch_journey_events"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey('batch_tracking.id'), nullable=False, index=True)
    from_stage = Column(String, nullable=True)
    to_stage = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    scrap_quantity = Column(Float, default=0.0)
    operator = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    movement_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("BatchTracking", back_populates="journey_events")

    def __repr__(self):
        return f"<BatchJourneyEvent(batch_id={self.batch_id}, to={self.to_stage}, qty={self.quantity})>"
