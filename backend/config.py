"""
Application configuration
"""
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    app_name: str = "Tulsi Power Industries - Production Monitor"
    app_version: str = "1.0.0"
    
    # Database
    database_url: str = "sqlite:///./production_monitoring.db"
    
    # CORS - adjust for production
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    # Performance thresholds
    efficiency_warning_threshold: float = 90.0  # Yellow warning below this
    efficiency_critical_threshold: float = 80.0  # Red alert below this
    loss_warning_threshold: float = 3.0  # Warning above this
    loss_critical_threshold: float = 5.0  # Critical above this
    
    # Sequential stage order (must match factory process)
    stage_sequence: dict = {
        "RBD": {"order": 1, "output_size_mm": 3.0},
        "Inter": {"order": 2, "input_size_mm": 3.0, "output_size_mm": 1.0},
        "Oven": {"order": 3, "has_annealing": True},
        "DPC": {"order": 4},
        "Rewind": {"order": 5}
    }
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra fields in .env (like Supabase vars)

settings = Settings()
