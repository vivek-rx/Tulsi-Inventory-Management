"""
Database configuration and session management
Supports both SQLite (local) and PostgreSQL (Supabase)
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# PRODUCTION: Always use Supabase/PostgreSQL
USE_SUPABASE = True  # Enforce True
DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Error out if no DB URL found (don't fallback to broken sqlite)
    print("❌ CRITICAL: DATABASE_URL is missing! Application cannot start.")
    
    # DEBUG: Print what we HAVE so user can see
    print("--- DEBUG: AVAILABLE ENVIRONMENT VARIABLES ---")
    keys = [k for k in os.environ.keys()]
    print(f"Total Keys: {len(keys)}")
    print(f"Keys: {', '.join(keys)}")
    print("---------------------------------------------")
    
    print("Please set USE_SUPABASE=true and DATABASE_URL in environment variables.")
    raise Exception("DATABASE_URL environment variable is required.")

# Fix for SQLAlchemy >= 1.4 which deprecated postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,
    max_overflow=10,
    pool_recycle=300  # Recycle connections every 5 minutes
)
print("✅ Connected to Supabase PostgreSQL")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency function to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    try:
        # Import all models to ensure they're registered with SQLAlchemy
        from backend.models import ProductionRecord, StageConfiguration
        from backend.inventory_models import StageInventory, InventoryTransaction, MaterialMovement
        from backend.order_models import ProductionOrder, OrderStageProgress, BatchTracking, BatchJourneyEvent
        from backend.user_models import User
        from backend.final_stage_models import QualityCheck, PackagingRecord, DispatchRecord
        
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables initialized")
    except Exception as e:
        print(f"⚠️ Database initialization error (may already exist): {e}")
        # Don't crash if tables already exist
