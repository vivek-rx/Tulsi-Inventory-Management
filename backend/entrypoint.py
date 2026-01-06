import sys
import os
import uvicorn

# Add the parent directory to sys.path so 'backend' module calls work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    # Get port from environment variable, default to 8000
    port = int(os.environ.get("PORT", 8000))
    
    # Run uvicorn programmatically
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
