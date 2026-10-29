-- Admin user creation script for SkillSwap Platform
-- This creates the admin account: admin@skillswap.com / admin123

USE skill_swap;

-- BCrypt hash of "admin123" with cost 10
-- Generated with: BCryptPasswordEncoder.encode("admin123")
-- Hash: $2a$10$9i4l2QFjDYbVj.F8I0RvSe2lZGTWO8Uw80ZVXCvyqDn5pKPDKd0Dm

INSERT INTO users (full_name, email, password_hash, role, rating_avg, total_reviews, created_at, updated_at)
VALUES (
    'Admin User',
    'admin@skillswap.com',
    '$2a$10$9i4l2QFjDYbVj.F8I0RvSe2lZGTWO8Uw80ZVXCvyqDn5pKPDKd0Dm',
    'ADMIN',
    0.0,
    0,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    role = 'ADMIN',
    password_hash = '$2a$10$9i4l2QFjDYbVj.F8I0RvSe2lZGTWO8Uw80ZVXCvyqDn5pKPDKd0Dm';

-- Verify admin was created
SELECT id, email, role, created_at FROM users WHERE email = 'admin@skillswap.com';
