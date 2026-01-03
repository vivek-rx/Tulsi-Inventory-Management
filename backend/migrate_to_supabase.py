import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv

# Load Supabase URL
load_dotenv()
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
SQLITE_DB_PATH = "production_monitoring.db"

if not SUPABASE_DB_URL:
    print("❌ SUPABASE_DB_URL not found in .env")
    exit(1)

print(f"🚀 Starting migration from {SQLITE_DB_PATH} to Supabase...")

# Connect to SQLite
try:
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    print("✅ Connected to SQLite")
except Exception as e:
    print(f"❌ Failed to connect to SQLite: {e}")
    exit(1)

# Connect to Postgres
try:
    pg_conn = psycopg2.connect(SUPABASE_DB_URL)
    pg_cursor = pg_conn.cursor()
    print("✅ Connected to Postgres (Supabase)")
except Exception as e:
    print(f"❌ Failed to connect to Postgres: {e}")
    exit(1)

def reset_database():
    print("⚠️  Resetting Supabase Database (Dropping all tables)...")
    try:
        # Drop all tables in public schema
        pg_cursor.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;")
        pg_conn.commit()
        print("   ✅ Dropped all tables")
        
        # Re-initialize tables using SQLAlchemy
        print("   🔄 Re-creating tables from models...")
        # Need to allow importing from current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        if current_dir not in os.sys.path:
            os.sys.path.append(current_dir)
            
        from database import init_db, engine
        # Verify engine connects to Supabase
        if "sqlite" in str(engine.url):
             print("   ❌ Error: Engine is using SQLite. Check USE_SUPABASE env var.")
             exit(1)
             
        init_db()
        print("   ✅ Tables created successfully")
        
    except Exception as e:
        pg_conn.rollback()
        print(f"   ❌ Failed to reset database: {e}")
        exit(1)

# Reset DB to ensure fresh schema
reset_database()

def migrate_table(table_name, sqlite_table_name=None, columns_map=None):
    if sqlite_table_name is None:
        sqlite_table_name = table_name
    
    print(f"   Migrating {table_name}...")
    
    # Get data from SQLite
    try:
        sqlite_cursor.execute(f"SELECT * FROM {sqlite_table_name}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"   ℹ️  No data in {table_name}, skipping.")
            return

        # Get column names from the first row keys
        columns = rows[0].keys()
        
        # Prepare INSERT statement
        cols_str = ', '.join(columns)
        vals_str = ', '.join(['%s'] * len(columns))
        
        # Convert rows to tuple of values
        # Handle boolean conversion if necessary (SQLite stores bool as 0/1)
        data = []
        for row in rows:
            data.append(tuple(row))

        query = f"INSERT INTO {table_name} ({cols_str}) VALUES ({vals_str}) ON CONFLICT DO NOTHING"
        
        # Execute batch insert using executemany (standard API, simpler)
        try:
            pg_cursor.executemany(query, data)
            pg_conn.commit()
            print(f"   ✅ Migrated {len(data)} rows to {table_name}")
        except Exception as e:
            pg_conn.rollback()
            print(f"   ❌ Failed to insert into {table_name}: {e}")
            if "duplicate key value" in str(e):
                print("      (Duplicate key, ignoring)")

    except Exception as e:
        print(f"   ❌ Error reading/migrating {table_name}: {e}")

# MIGRATION ORDER (Dependencies first)

# 1. Users
migrate_table("users")

# 2. Stage Configurations (Independent)
migrate_table("stage_configurations")

# 3. Production Orders
migrate_table("production_orders")

# 4. Batch Tracking (Depends on Orders)
migrate_table("batch_tracking")

# 5. Production Records (Independent generally, but linked via OrderStageProgress)
migrate_table("production_records")

# 6. Order Stage Progress (Depends on Orders and Records)
migrate_table("order_stage_progress")

# 7. Batch Journey Events (Depends on Batches)
migrate_table("batch_journey_events")

# 8. Stage Inventory
migrate_table("stage_inventory")

# 9. Inventory Transactions (Depends on Records usually?)
migrate_table("inventory_transactions") # Check dependencies. FK to production_records? yes.

# 10. Material Movements (Depends on Batsches)
migrate_table("material_movements")


# Close connections
sqlite_conn.close()
pg_conn.close()
print("\n✨ Migration Complete!")
