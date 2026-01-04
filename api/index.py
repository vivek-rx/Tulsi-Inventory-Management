"""
Vercel Serverless Function Entry Point
This file imports the FastAPI app from backend/main.py and exposes it for Vercel
"""
import sys
from pathlib import Path

# Add the parent directory to the Python path so we can import from backend
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.main import app

# Vercel will use this 'app' variable as the ASGI application
# The app is already configured with all routes, middleware, and startup events in backend/main.py
