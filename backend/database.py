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

# Use Supabase PostgreSQL or fallback to SQLite
USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"

if USE_SUPABASE:
    DATABASE_URL = os.getenv("SUPABASE_DB_URL")
    if not DATABASE_URL:
        # Try finding DATABASE_URL if SUPABASE_DB_URL is missing
        DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        print("⚠️ Warning: USE_SUPABASE is true but no URL found. Falling back to SQLite.")
        USE_SUPABASE = False
        DATABASE_URL = "sqlite:///./production_monitoring.db"
    else:
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

if not USE_SUPABASE:
    DATABASE_URL = "sqlite:///./production_monitoring.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Needed for SQLite
        echo=False
    )
    print("✅ Using SQLite database")

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
        from models import ProductionRecord, StageConfiguration
        from inventory_models import StageInventory, InventoryTransaction, MaterialMovement
        from order_models import ProductionOrder, OrderStageProgress, BatchTracking, BatchJourneyEvent
        from user_models import User
        from final_stage_models import QualityCheck, PackagingRecord, DispatchRecord
        
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables initialized")
    except Exception as e:
        print(f"⚠️ Database initialization error (may already exist): {e}")
        # Don't crash if tables already exist
