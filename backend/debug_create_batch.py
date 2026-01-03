import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from order_models import BatchTracking
from user_models import User
from database import SessionLocal

load_dotenv()

# Setup
db = SessionLocal()

print("🚀 Attempting to create batch...")

try:
    # Use parameters from user request
    # 'batch_number': 'C-2026-001'
    # 'created_by_id': 1
    
    # Check if user exists
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        print("❌ User ID 1 not found!")
    else:
        print(f"✅ Found User ID 1: {user.username}")

    batch = BatchTracking(
        batch_number='C-2026-001',
        material_type='Aluminium',
        quantity=100.0,
        remaining_quantity=100.0,
        current_stage='RBD',
        current_status='ACTIVE',
        supplier_name='ABC',
        order_id=3, # User used 3
        created_by_id=1,
        notes='Debug test'
    )
    
    db.add(batch)
    db.commit()
    print("✅ Batch created successfully!")
    
except Exception as e:
    db.rollback()
    print("❌ Error creating batch:")
    print(e)

finally:
    db.close()
