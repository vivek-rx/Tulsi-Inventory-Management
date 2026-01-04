"""
Vercel Serverless Function Entry Point
Gradually importing backend with error handling
"""
import sys
import os
from pathlib import Path

# Add the parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Test import step by step
try:
    print("Step 1: Importing FastAPI basics...")
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    
    print("Step 2: Attempting to import backend.main...")
    from backend.main import app
    
    print("✅ Successfully imported backend.main!")
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print(f"Python path: {sys.path}")
    print(f"Current dir: {os.getcwd()}")
    print(f"Files in parent: {os.listdir(Path(__file__).parent.parent)}")
    
    # Fallback: Create a minimal app
    app = FastAPI()
    
    @app.get("/")
    def root():
        return {
            "status": "error",
            "message": "Backend import failed",
            "error": str(e),
            "python_path": sys.path[:3],
            "cwd": os.getcwd()
        }
    
    @app.get("/api/health")
    def health():
        return {"status": "import_failed", "error": str(e)}

except Exception as e:
    print(f"❌ Unexpected Error: {e}")
    
    # Fallback app
    app = FastAPI()
    
    @app.get("/")
    def root():
        return {
            "status": "error",
            "message": "Unexpected error during import",
            "error": str(e)
        }

# Export the app for Vercel
