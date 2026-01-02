"""
Models for final stages: Quality Check, Packaging, and Dispatch
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base

class QualityInspection(Base):
    """Quality inspection records for finished products"""
    __tablename__ = "quality_inspections"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batch_tracking.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=True)
    
    # Inspection details
    inspector_name = Column(String(100), nullable=False)
    inspection_date = Column(Date, nullable=False)
    quality_status = Column(String(20), nullable=False)  # PASSED, FAILED, PENDING
    
    # Quality metrics
    defect_type = Column(String(100), nullable=True)
    defect_count = Column(Integer, default=0)
    sample_size = Column(Float, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<QualityInspection(batch_id={self.batch_id}, status={self.quality_status})>"


class PackagingRecord(Base):
    """Packaging records for finished goods"""
    __tablename__ = "packaging_records"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batch_tracking.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=True)
    
    # Packaging details
    package_type = Column(String(50), nullable=False)  # Crate, Pallet, Box, etc.
    coil_count = Column(Integer, nullable=False)
    package_weight = Column(Float, nullable=False)
    
    # Operator and date
    operator_name = Column(String(100), nullable=False)
    packing_date = Column(Date, nullable=False)
    
    # Additional info
    package_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<PackagingRecord(batch_id={self.batch_id}, type={self.package_type})>"


class DispatchRecord(Base):
    """Dispatch and delivery tracking"""
    __tablename__ = "dispatch_records"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    
    # Dispatch details
    dispatch_date = Column(Date, nullable=False)
    transport_mode = Column(String(50), nullable=False)  # Truck, Rail, Air, etc.
    vehicle_number = Column(String(50), nullable=True)
    tracking_number = Column(String(100), nullable=True)
    
    # Destination
    destination = Column(Text, nullable=False)
    customer_contact = Column(String(100), nullable=True)
    
    # Delivery status
    delivery_status = Column(String(20), nullable=False, default="PENDING")  # PENDING, IN_TRANSIT, DELIVERED
    delivered_date = Column(Date, nullable=True)
    
    # Additional info
    driver_name = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<DispatchRecord(order_id={self.order_id}, status={self.delivery_status})>"
