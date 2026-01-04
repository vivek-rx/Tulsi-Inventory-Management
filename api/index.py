"""
Minimal Vercel Test - Step 1: Basic FastAPI
"""
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Vercel is working!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "vercel": True}
