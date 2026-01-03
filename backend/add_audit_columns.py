import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
if not SUPABASE_DB_URL:
    print("❌ No DB URL found")
    exit(1)

# Fix for SQLAlchemy >= 1.4 which deprecated postgres://
if SUPABASE_DB_URL.startswith("postgres://"):
    SUPABASE_DB_URL = SUPABASE_DB_URL.replace("postgres://", "postgresql://", 1)

def add_column(conn, table, column, type_def):
    try:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}"))
        print(f"   ✅ Added {column} to {table}")
    except Exception as e:
        if "already exists" in str(e):
             print(f"   ℹ️  Column {column} already exists in {table}")
        else:
             print(f"   ❌ Failed to add {column} to {table}: {e}")

try:
    engine = create_engine(SUPABASE_DB_URL)
    with engine.connect() as conn:
        print("🚀 Adding audit columns...")
        
        # Production Records
        add_column(conn, "production_records", "created_by_id", "INTEGER REFERENCES users(id)")
        
        # Production Orders
        add_column(conn, "production_orders", "created_by_id", "INTEGER REFERENCES users(id)")
        
        # Batch Tracking
        add_column(conn, "batch_tracking", "created_by_id", "INTEGER REFERENCES users(id)")
        
        # Inventory Transactions
        add_column(conn, "inventory_transactions", "created_by_id", "INTEGER REFERENCES users(id)")
        
        conn.commit()
        print("✨ Schema update complete!")

except Exception as e:
    print(f"❌ Error: {e}")
