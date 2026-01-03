"""
Inventory management business logic
Handles stock tracking, inventory updates, and material flow
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, date
from typing import List, Dict, Optional
from inventory_models import StageInventory, InventoryTransaction, MaterialMovement
from models import ProductionRecord, StageEnum

class InventoryManager:
    """
    Manages inventory across all production stages
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def initialize_inventory(self):
        """
        Initialize inventory for all stages if not exists
        """
        stages = ["RBD", "Inter", "Oven", "DPC", "Rewind"]
        
        for stage in stages:
            existing = self.db.query(StageInventory).filter(
                StageInventory.stage == stage
            ).first()
            
            if not existing:
                inventory = StageInventory(
                    stage=stage,
                    current_stock=0.0,
                    min_stock_level=500.0,
                    max_stock_level=5000.0
                )
                self.db.add(inventory)
        
        self.db.commit()
    
    def get_all_inventory(self) -> List[StageInventory]:
        """
        Get current inventory levels for all stages
        """
        return self.db.query(StageInventory).all()
    
    def get_stage_inventory(self, stage: str) -> Optional[StageInventory]:
        """
        Get inventory for a specific stage
        """
        return self.db.query(StageInventory).filter(
            StageInventory.stage == stage
        ).first()
    
    def update_inventory(self, stage: str, quantity: float, transaction_type: str, notes: str = None) -> StageInventory:
        """
        Update inventory for a stage
        transaction_type: 'IN' (material enters) or 'OUT' (material leaves)
        """
        inventory = self.get_stage_inventory(stage)
        
        if not inventory:
            # Create if doesn't exist
            inventory = StageInventory(stage=stage, current_stock=0.0)
            self.db.add(inventory)
            self.db.flush()
        
        stock_before = inventory.current_stock
        
        if transaction_type == 'IN':
            inventory.current_stock += quantity
        elif transaction_type == 'OUT':
            if inventory.current_stock < quantity:
                raise ValueError(f"Insufficient stock in {stage}. Available: {inventory.current_stock} kg, Required: {quantity} kg")
            inventory.current_stock -= quantity
        
        stock_after = inventory.current_stock
        
        # Record transaction
        transaction = InventoryTransaction(
            stage=stage,
            transaction_type=transaction_type,
            quantity=quantity,
            stock_before=stock_before,
            stock_after=stock_after,
            notes=notes
        )
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(inventory)
        
        return inventory
    
    def record_material_movement(
        self,
        from_stage: Optional[str],
        to_stage: str,
        quantity: float,
        wire_size_mm: Optional[float] = None,
        wire_size_swg: Optional[int] = None,
        notes: Optional[str] = None,
        batch_id: Optional[int] = None,
        batch_number: Optional[str] = None
    ):
        """
        Record material moving from one stage to another
        Updates inventory for both stages
        """
        to_stage_name = to_stage.value if isinstance(to_stage, StageEnum) else to_stage
        from_stage_name = None
        if from_stage:
            from_stage_name = from_stage.value if isinstance(from_stage, StageEnum) else from_stage
            self.update_inventory(from_stage_name, quantity, 'OUT', f"Moved to {to_stage_name}")
        
        self.update_inventory(to_stage_name, quantity, 'IN', f"Received from {from_stage_name or 'Inbound'}")
        
        movement = MaterialMovement(
            from_stage=from_stage_name or "Inbound",
            to_stage=to_stage_name,
            quantity=quantity,
            wire_size_mm=wire_size_mm,
            wire_size_swg=wire_size_swg,
            notes=notes,
            batch_id=batch_id,
            batch_number=batch_number
        )
        self.db.add(movement)
        self.db.commit()
        self.db.refresh(movement)
        return movement
    
    def sync_inventory_from_production(self, start_date: Optional[date] = None):
        """
        Recalculate inventory based on production records
        Useful for initial setup or reconciliation
        """
        # Reset all inventory
        inventories = self.get_all_inventory()
        for inv in inventories:
            inv.current_stock = 0.0
        
        # Query all production records
        query = self.db.query(ProductionRecord)
        if start_date:
            query = query.filter(ProductionRecord.date >= start_date)
        
        records = query.order_by(ProductionRecord.date, ProductionRecord.id).all()
        
        stage_order = {
            "RBD": 1,
            "Inter": 2,
            "Oven": 3,
            "DPC": 4,
            "Rewind": 5
        }
        
        # Process each record
        for record in records:
            stage = record.stage.value
            
            # Material enters this stage (input)
            self.update_inventory(stage, record.input_qty, 'IN', f"Production on {record.date}")
            
            # Material leaves this stage (output)
            self.update_inventory(stage, record.output_qty, 'OUT', f"Production on {record.date}")
            
            # If not final stage, material moves to next stage
            if stage != "Rewind":
                next_stage_order = stage_order.get(stage, 0) + 1
                next_stage = [s for s, o in stage_order.items() if o == next_stage_order]
                
                if next_stage:
                    # Output of current stage becomes input of next stage
                    # (This will be recorded when next stage processes)
                    pass
        
        self.db.commit()
    
    def get_inventory_alerts(self) -> List[Dict]:
        """
        Get inventory alerts for low stock or overstocked stages
        """
        alerts = []
        inventories = self.get_all_inventory()
        
        for inv in inventories:
            if inv.current_stock < inv.min_stock_level:
                alerts.append({
                    "stage": inv.stage,
                    "type": "LOW_STOCK",
                    "severity": "warning",
                    "message": f"{inv.stage}: Low stock ({inv.current_stock:.1f} kg, min: {inv.min_stock_level:.1f} kg)",
                    "current_stock": inv.current_stock,
                    "threshold": inv.min_stock_level
                })
            
            if inv.current_stock > inv.max_stock_level:
                alerts.append({
                    "stage": inv.stage,
                    "type": "OVERSTOCK",
                    "severity": "warning",
                    "message": f"{inv.stage}: Overstocked ({inv.current_stock:.1f} kg, max: {inv.max_stock_level:.1f} kg)",
                    "current_stock": inv.current_stock,
                    "threshold": inv.max_stock_level
                })
        
        return alerts
    
    def get_inventory_summary(self) -> Dict:
        """
        Get overall inventory summary
        """
        inventories = self.get_all_inventory()
        
        total_stock = sum(inv.current_stock for inv in inventories)
        
        return {
            "total_stock_all_stages": round(total_stock, 2),
            "stages": [
                {
                    "stage": inv.stage,
                    "current_stock": round(inv.current_stock, 2),
                    "min_level": inv.min_stock_level,
                    "max_level": inv.max_stock_level,
                    "utilization": round((inv.current_stock / inv.max_stock_level * 100), 2) if inv.max_stock_level > 0 else 0,
                    "status": self._get_stock_status(inv)
                }
                for inv in inventories
            ],
            "alerts": self.get_inventory_alerts()
        }
    
    def _get_stock_status(self, inventory: StageInventory) -> str:
        """
        Determine stock status for a stage
        """
        if inventory.current_stock < inventory.min_stock_level:
            return "low"
        elif inventory.current_stock > inventory.max_stock_level:
            return "high"
        else:
            return "normal"
    
    def get_transaction_history(
        self,
        stage: Optional[str] = None,
        limit: int = 50
    ) -> List[InventoryTransaction]:
        """
        Get inventory transaction history
        """
        query = self.db.query(InventoryTransaction)
        
        if stage:
            query = query.filter(InventoryTransaction.stage == stage)
        
        return query.order_by(desc(InventoryTransaction.timestamp)).limit(limit).all()
    
    def get_material_movements(
        self,
        from_stage: Optional[str] = None,
        to_stage: Optional[str] = None,
        limit: int = 50
    ) -> List[MaterialMovement]:
        """
        Get material movement history
        """
        query = self.db.query(MaterialMovement)
        
        if from_stage:
            query = query.filter(MaterialMovement.from_stage == from_stage)
        if to_stage:
            query = query.filter(MaterialMovement.to_stage == to_stage)
        
        return query.order_by(desc(MaterialMovement.movement_date)).limit(limit).all()
