"""
Vercel Serverless Function - Main API Handler
This creates a single endpoint that handles all /api requests
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.main import app

# Vercel will call this as a serverless function at /api/main
