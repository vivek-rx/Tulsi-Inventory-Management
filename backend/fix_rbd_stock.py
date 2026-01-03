import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from inventory_models import StageInventory
from order_models import BatchTracking
from database import SessionLocal

load_dotenv()
db = SessionLocal()

batch_number = "C-2026-001"
print(f"🔧 Repairing inventory for batch {batch_number}...")

try:
    # 1. Find the batch
    batch = db.query(BatchTracking).filter(BatchTracking.batch_number == batch_number).first()
    if not batch:
        print(f"❌ Batch {batch_number} not found. Nothing to fix.")
    else:
        print(f"✅ Found batch {batch.batch_number} (ID: {batch.id}). Quantity: {batch.quantity}")
        
        # 2. Check RBD inventory
        rbd_inventory = db.query(StageInventory).filter(StageInventory.stage == "RBD").first()
        if not rbd_inventory:
             print("❌ RBD Inventory record not found!")
        else:
             print(f"ℹ️  Current RBD Stock: {rbd_inventory.current_stock}")
             
             # If stock is unreasonably low relative to this batch (assuming this was the only recent add)
             # Or simpler: just add the missing 100 if it looks like 0 and user just complained about 0.
             # Safe approach: If stock is 0 but we have an ACTIVE batch of 100, let's fix it.
             
             if rbd_inventory.current_stock < batch.quantity:
                 print(f"⚠️  Stock mismatch! Batch has {batch.quantity} but stock is only {rbd_inventory.current_stock}.")
                 print(f"🛠  Adding {batch.quantity} to RBD stock...")
                 
                 rbd_inventory.current_stock += batch.quantity
                 db.commit()
                 print(f"✅ Fixed! New RBD Stock: {rbd_inventory.current_stock}")
             else:
                 print("✅ Stock looks sufficient. No auto-repair needed.")

except Exception as e:
    db.rollback()
    print(f"❌ Error during repair: {e}")
finally:
    db.close()
