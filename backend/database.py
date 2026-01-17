"""
Database configuration and session management
Uses PostgreSQL (Supabase) for production
"""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from backend/.env (works from any directory)
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ CRITICAL: DATABASE_URL is missing! Application cannot start.")
    print("Please set DATABASE_URL in backend/.env file.")
    raise Exception("DATABASE_URL environment variable is required.")

# Fix for SQLAlchemy >= 1.4 which deprecated postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300
)
print("✅ Connected to Supabase PostgreSQL")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency function to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    try:
        from backend.models import ProductionRecord, StageConfiguration
        from backend.inventory_models import StageInventory, InventoryTransaction, MaterialMovement
        from backend.order_models import ProductionOrder, OrderStageProgress, BatchTracking, BatchJourneyEvent
        from backend.user_models import User
        from backend.final_stage_models import QualityInspection, PackagingRecord, DispatchRecord
        
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables initialized")
    except Exception as e:
        print(f"⚠️ Database initialization error (may already exist): {e}")
