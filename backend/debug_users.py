import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
if not SUPABASE_DB_URL:
    print("No DB URL found")
    exit(1)

# Fix for SQLAlchemy >= 1.4 which deprecated postgres://
if SUPABASE_DB_URL.startswith("postgres://"):
    SUPABASE_DB_URL = SUPABASE_DB_URL.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(SUPABASE_DB_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, username, full_name, role, is_active FROM users"))
        users = result.fetchall()
        
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"- ID: {user.id}, User: {user.username}, Role: {user.role}, Active: {user.is_active}")

except Exception as e:
    print(f"Error: {e}")
