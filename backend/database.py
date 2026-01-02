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
        raise ValueError("SUPABASE_DB_URL not found in environment variables")
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=5,
        max_overflow=10
    )
    print("✅ Connected to Supabase PostgreSQL")
else:
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
    """
    Initialize database - create all tables
    """
    # Import all models to ensure they're registered
    import models
    import inventory_models
    import order_models
    import final_stage_models
    import user_models
    
    Base.metadata.create_all(bind=engine)
