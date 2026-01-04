#!/usr/bin/env python3
"""
Fix all relative imports in backend/ to use absolute imports with backend. prefix
This is required for Vercel serverless deployment
"""
import os
import re

# Files to fix and their import patterns
files_to_fix = {
    'user_models.py': [
        ('from database import', 'from backend.database import'),
    ],
    'inventory_models.py': [
        ('from database import', 'from backend.database import'),
        ('from models import', 'from backend.models import'),
    ],
    'final_stage_models.py': [
        ('from database import', 'from backend.database import'),
    ],
    'analytics.py': [
        ('from models import', 'from backend.models import'),
        ('from schemas import', 'from backend.schemas import'),
        ('from config import', 'from backend.config import'),
    ],
    'inventory_manager.py': [
        ('from models import', 'from backend.models import'),
    ],
    'user_routes.py': [
        ('from database import', 'from backend.database import'),
        ('from auth import', 'from backend.auth import'),
    ],
    'models.py': [
        ('from database import', 'from backend.database import'),
    ],
    'auth.py': [
        ('from database import', 'from backend.database import'),
    ],
    'final_stage_routes.py': [
        ('from database import', 'from backend.database import'),
        ('from models import', 'from backend.models import'),
    ],
    'order_models.py': [
        ('from database import', 'from backend.database import'),
        ('from models import', 'from backend.models import'),
    ],
}

backend_dir = '/Users/vivek/Desktop/Tulsi-Inventory-Mmt/backend'

for filename, replacements in files_to_fix.items():
    filepath = os.path.join(backend_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"⚠️  Skipping {filename} (not found)")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    for old_pattern, new_pattern in replacements:
        content = content.replace(old_pattern, new_pattern)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ Fixed {filename}")
    else:
        print(f"⏭️  No changes needed in {filename}")

print("\n🎉 All imports fixed!")
