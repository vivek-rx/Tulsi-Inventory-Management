import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import bcrypt

load_dotenv()

SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
if not SUPABASE_DB_URL:
    print("No DB URL found")
    exit(1)

# Fix for SQLAlchemy >= 1.4 which deprecated postgres://
if SUPABASE_DB_URL.startswith("postgres://"):
    SUPABASE_DB_URL = SUPABASE_DB_URL.replace("postgres://", "postgresql://", 1)

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

try:
    engine = create_engine(SUPABASE_DB_URL)
    with engine.connect() as conn:
        # Reset Admin
        admin_hash = get_password_hash("admin123")
        conn.execute(
            text("UPDATE users SET hashed_password = :p WHERE username = 'admin'"),
            {"p": admin_hash}
        )
        print("✅ Reset 'admin' password to 'admin123'")
        
        # Reset Operator
        operator_hash = get_password_hash("operator123")
        conn.execute(
            text("UPDATE users SET hashed_password = :p WHERE username = 'operator'"),
            {"p": operator_hash}
        )
        print("✅ Reset 'operator' password to 'operator123'")
        
        conn.commit()

except Exception as e:
    print(f"Error: {e}")
