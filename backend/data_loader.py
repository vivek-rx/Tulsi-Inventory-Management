"""
Data loader utility to import Excel data into database
Handles parsing of TULSI PI PRODUCTION REPORT.xlsx
"""
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from models import ProductionRecord, StageConfiguration, StageEnum, ShiftEnum
from inventory_manager import InventoryManager
from database import SessionLocal, init_db
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataLoader:
    """
    Loads production data from Excel file and stores in database
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def normalize_stage_name(self, stage: str) -> Optional[StageEnum]:
        """
        Normalize stage names from Excel to match our StageEnum
        """
        stage_mapping = {
            "rbd": StageEnum.RBD,
            "inter": StageEnum.INTER,
            "intermediate": StageEnum.INTER,
            "oven": StageEnum.OVEN,
            "annealing": StageEnum.OVEN,
            "dpc": StageEnum.DPC,
            "rewind": StageEnum.REWIND,
            "rewinding": StageEnum.REWIND
        }
        
        stage_lower = str(stage).lower().strip()
        return stage_mapping.get(stage_lower)
    
    def normalize_shift_name(self, shift: str) -> Optional[ShiftEnum]:
        """
        Normalize shift names from Excel
        """
        shift_mapping = {
            "morning": ShiftEnum.MORNING,
            "a": ShiftEnum.MORNING,
            "day": ShiftEnum.MORNING,
            "afternoon": ShiftEnum.AFTERNOON,
            "b": ShiftEnum.AFTERNOON,
            "evening": ShiftEnum.AFTERNOON,
            "night": ShiftEnum.NIGHT,
            "c": ShiftEnum.NIGHT
        }
        
        shift_lower = str(shift).lower().strip()
        return shift_mapping.get(shift_lower)
    
    def load_from_excel(self, file_path: str) -> int:
        """
        Load data from Excel file into database
        Returns: Number of records loaded
        """
        try:
            # Read Excel file
            df = pd.read_excel(file_path)
            logger.info(f"Loaded Excel file with {len(df)} rows and columns: {df.columns.tolist()}")
            
            # Normalize column names (remove spaces, lowercase)
            df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
            
            records_loaded = 0
            
            for idx, row in df.iterrows():
                try:
                    # Parse date
                    date_val = row.get('date')
                    if pd.isna(date_val):
                        continue
                    
                    if isinstance(date_val, str):
                        date_obj = pd.to_datetime(date_val).date()
                    else:
                        date_obj = date_val.date() if hasattr(date_val, 'date') else date_val
                    
                    # Parse shift
                    shift_val = self.normalize_shift_name(row.get('shift', 'morning'))
                    if not shift_val:
                        shift_val = ShiftEnum.MORNING
                    
                    # Parse stage
                    stage_val = self.normalize_stage_name(row.get('machine', row.get('stage', '')))
                    if not stage_val:
                        continue
                    
                    # Parse quantities
                    input_qty = float(row.get('input_qty', 0) or 0)
                    output_qty = float(row.get('output_qty', 0) or 0)
                    scrap_qty = float(row.get('scrap', row.get('loss', 0)) or 0)
                    
                    # Parse sizes
                    input_size_mm = row.get('input_size_(mm)', row.get('size_(mm)'))
                    output_size_mm = row.get('output_size_(mm)', row.get('size_(mm)'))
                    input_size_swg = row.get('input_size_(swg)', row.get('size_(swg)'))
                    output_size_swg = row.get('output_size_(swg)', row.get('size_(swg)'))
                    
                    # Calculate efficiency and loss
                    efficiency = (output_qty / input_qty * 100) if input_qty > 0 else 0
                    loss_percentage = (scrap_qty / input_qty * 100) if input_qty > 0 else 0
                    
                    # Create record
                    record = ProductionRecord(
                        date=date_obj,
                        shift=shift_val,
                        stage=stage_val,
                        input_qty=input_qty,
                        output_qty=output_qty,
                        scrap_qty=scrap_qty,
                        input_size_mm=float(input_size_mm) if pd.notna(input_size_mm) else None,
                        output_size_mm=float(output_size_mm) if pd.notna(output_size_mm) else None,
                        input_size_swg=int(input_size_swg) if pd.notna(input_size_swg) else None,
                        output_size_swg=int(output_size_swg) if pd.notna(output_size_swg) else None,
                        efficiency=efficiency,
                        loss_percentage=loss_percentage,
                        remarks=str(row.get('remarks', '')) if pd.notna(row.get('remarks')) else None
                    )
                    
                    self.db.add(record)
                    records_loaded += 1
                    
                except Exception as e:
                    logger.warning(f"Error processing row {idx}: {e}")
                    continue
            
            self.db.commit()
            logger.info(f"Successfully loaded {records_loaded} production records")
            return records_loaded
            
        except Exception as e:
            logger.error(f"Error loading Excel file: {e}")
            self.db.rollback()
            raise
    
    def initialize_stage_config(self):
        """
        Initialize stage configuration with default values
        """
        stages_config = [
            {
                "stage": StageEnum.RBD,
                "sequence_order": 1,
                "expected_output_size_mm": 3.0,
                "min_efficiency": 92.0,
                "max_loss_percentage": 3.0,
                "has_annealing": 0
            },
            {
                "stage": StageEnum.INTER,
                "sequence_order": 2,
                "expected_input_size_mm": 3.0,
                "expected_output_size_mm": 1.0,
                "min_efficiency": 88.0,
                "max_loss_percentage": 4.0,
                "has_annealing": 0
            },
            {
                "stage": StageEnum.OVEN,
                "sequence_order": 3,
                "expected_input_size_mm": 1.0,
                "min_efficiency": 95.0,
                "max_loss_percentage": 2.0,
                "has_annealing": 1
            },
            {
                "stage": StageEnum.DPC,
                "sequence_order": 4,
                "min_efficiency": 90.0,
                "max_loss_percentage": 3.5,
                "has_annealing": 0
            },
            {
                "stage": StageEnum.REWIND,
                "sequence_order": 5,
                "min_efficiency": 98.0,
                "max_loss_percentage": 1.0,
                "has_annealing": 0
            }
        ]
        
        for config in stages_config:
            existing = self.db.query(StageConfiguration).filter(
                StageConfiguration.stage == config["stage"]
            ).first()
            
            if not existing:
                stage_config = StageConfiguration(**config)
                self.db.add(stage_config)
        
        self.db.commit()
        logger.info("Stage configuration initialized")

def load_sample_data():
    """
    Generate sample production data for testing
    """
    db = SessionLocal()
    loader = DataLoader(db)
    
    # Initialize stage configuration
    loader.initialize_stage_config()
    
    # Create sample data
    from datetime import date, timedelta
    import random
    
    base_date = date.today() - timedelta(days=30)
    
    for day in range(30):
        current_date = base_date + timedelta(days=day)
        
        for shift in [ShiftEnum.MORNING, ShiftEnum.AFTERNOON, ShiftEnum.NIGHT]:
            # Sequential production through all stages
            # RBD produces raw material
            rbd_output = random.uniform(800, 1000)
            
            records = [
                # Stage 1: RBD
                ProductionRecord(
                    date=current_date,
                    shift=shift,
                    stage=StageEnum.RBD,
                    input_qty=random.uniform(1000, 1200),
                    output_qty=rbd_output,
                    scrap_qty=random.uniform(20, 50),
                    output_size_mm=3.0,
                    efficiency=random.uniform(88, 95),
                    loss_percentage=random.uniform(2, 4)
                ),
                # Stage 2: Inter (uses RBD output)
                ProductionRecord(
                    date=current_date,
                    shift=shift,
                    stage=StageEnum.INTER,
                    input_qty=rbd_output,
                    output_qty=rbd_output * random.uniform(0.85, 0.92),
                    scrap_qty=random.uniform(30, 60),
                    input_size_mm=3.0,
                    output_size_mm=1.0,
                    efficiency=random.uniform(85, 92),
                    loss_percentage=random.uniform(3, 5)
                ),
                # Stage 3: Oven
                ProductionRecord(
                    date=current_date,
                    shift=shift,
                    stage=StageEnum.OVEN,
                    input_qty=rbd_output * random.uniform(0.85, 0.92),
                    output_qty=rbd_output * random.uniform(0.82, 0.90),
                    scrap_qty=random.uniform(10, 25),
                    input_size_mm=1.0,
                    efficiency=random.uniform(92, 98),
                    loss_percentage=random.uniform(1, 3)
                ),
                # Stage 4: DPC
                ProductionRecord(
                    date=current_date,
                    shift=shift,
                    stage=StageEnum.DPC,
                    input_qty=rbd_output * random.uniform(0.82, 0.90),
                    output_qty=rbd_output * random.uniform(0.78, 0.87),
                    scrap_qty=random.uniform(15, 30),
                    efficiency=random.uniform(88, 94),
                    loss_percentage=random.uniform(2, 4)
                ),
                # Stage 5: Rewind (final)
                ProductionRecord(
                    date=current_date,
                    shift=shift,
                    stage=StageEnum.REWIND,
                    input_qty=rbd_output * random.uniform(0.78, 0.87),
                    output_qty=rbd_output * random.uniform(0.76, 0.85),
                    scrap_qty=random.uniform(5, 15),
                    efficiency=random.uniform(96, 99),
                    loss_percentage=random.uniform(0.5, 2)
                )
            ]
            
            for record in records:
                db.add(record)
    
    db.commit()
    
    # Initialize inventory after loading production data
    logger.info("Initializing inventory...")
    inventory_mgr = InventoryManager(db)
    inventory_mgr.initialize_inventory()
    
    # Sync inventory from production records
    logger.info("Syncing inventory from production records...")
    inventory_mgr.sync_inventory_from_production(start_date=base_date)
    
    db.close()
    logger.info("Sample data and inventory loaded successfully")

if __name__ == "__main__":
    # Initialize database
    init_db()
    
    # Load sample data
    load_sample_data()
    
    print("Database initialized with sample data!")
