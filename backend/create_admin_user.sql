-- Create admin user for Vercel deployment
-- Password: admin123 (hashed with bcrypt)

INSERT INTO users (username, full_name, hashed_password, role, created_at)
VALUES (
    'admin',
    'System Administrator', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aqaaf6ioRqem',
    'ADMIN',
    NOW()
)
ON CONFLICT (username) DO UPDATE
SET hashed_password = EXCLUDED.hashed_password;

-- Create operator user (optional)
INSERT INTO users (username, full_name, hashed_password, role, created_at)
VALUES (
    'operator',
    'Machine Operator',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'OPERATOR',
    NOW()
)
ON CONFLICT (username) DO NOTHING;
