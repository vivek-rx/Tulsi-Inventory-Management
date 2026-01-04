#!/usr/bin/env python3
"""
Fix remaining relative imports in backend/ files
"""
import os

files_to_fix = {
    'user_routes.py': [
        ('from user_models import', 'from backend.user_models import'),
    ],
    'auth.py': [
        ('from user_models import', 'from backend.user_models import'),
    ],
    'final_stage_routes.py': [
        ('from final_stage_models import', 'from backend.final_stage_models import'),
        ('from order_models import', 'from backend.order_models import'),
    ],
    'main.py': [
        ('from final_stage_routes import', 'from backend.final_stage_routes import'),
    ],
    'data_loader.py': [
        ('from models import', 'from backend.models import'),
        ('from inventory_manager import', 'from backend.inventory_manager import'),
        ('from database import', 'from backend.database import'),
    ]
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
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ Fixed {filename}")
    else:
        print(f"⏭️  No changes needed in {filename}")

print("\n🎉 Remaining imports fixed!")
