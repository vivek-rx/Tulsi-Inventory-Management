"""
Inventory management models and tracking
Tracks stock levels at each production stage
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models import StageEnum

class StageInventory(Base):
    """
    Current inventory/stock at each production stage
    Shows how much wire is currently in each stage
    """
    __tablename__ = "stage_inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    stage = Column(String, nullable=False, unique=True, index=True)
    
    # Current stock levels (in kg)
    current_stock = Column(Float, nullable=False, default=0.0)
    
    # Wire specifications for current stock
    wire_size_mm = Column(Float, nullable=True)
    wire_size_swg = Column(Integer, nullable=True)
    
    # Thresholds for alerts
    min_stock_level = Column(Float, default=500.0)  # Minimum stock before alert
    max_stock_level = Column(Float, default=5000.0)  # Maximum stock capacity
    stock_status = Column(String, nullable=True)  # LOW, NORMAL, HIGH
    
    # Timestamps
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<StageInventory(stage={self.stage}, stock={self.current_stock})>"

class InventoryTransaction(Base):
    """
    Tracks all inventory movements
    Records when material enters or leaves a stage
    """
    __tablename__ = "inventory_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    stage = Column(String, nullable=False, index=True)
    
    # Transaction type
    transaction_type = Column(String, nullable=False)  # 'IN' or 'OUT'
    
    # Quantity moved (in kg)
    quantity = Column(Float, nullable=False)
    
    # Stock levels after transaction
    stock_before = Column(Float, nullable=False)
    stock_after = Column(Float, nullable=False)
    
    # Reference to production record if applicable
    production_record_id = Column(Integer, ForeignKey('production_records.id'), nullable=True)
    
    # Transaction details
    notes = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<InventoryTransaction(stage={self.stage}, type={self.transaction_type}, qty={self.quantity})>"

class MaterialMovement(Base):
    """
    Tracks material movement between stages
    Shows the flow of wire through the production process
    """
    __tablename__ = "material_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Source and destination stages
    from_stage = Column(String, nullable=False, index=True)
    to_stage = Column(String, nullable=False, index=True)
    
    # Quantity moved
    quantity = Column(Float, nullable=False)
    
    # Wire specifications
    wire_size_mm = Column(Float, nullable=True)
    wire_size_swg = Column(Integer, nullable=True)
    
    # Movement details
    movement_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String, nullable=True)
    
    # Batch traceability
    batch_id = Column(Integer, ForeignKey('batch_tracking.id'), nullable=True, index=True)
    batch_number = Column(String, nullable=True)

    def __repr__(self):
        batch_info = f", batch={self.batch_number}" if self.batch_number else ""
        return f"<MaterialMovement(from={self.from_stage}, to={self.to_stage}, qty={self.quantity}{batch_info})>"
