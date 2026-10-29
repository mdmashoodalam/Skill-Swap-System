#!/usr/bin/env python3
import mysql.connector
from datetime import datetime

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="skill_swap"
)

cursor = conn.cursor()

# BCrypt hash of "admin123"
admin_hash = "$2a$10$9i4l2QFjDYbVj.F8I0RvSe2lZGTWO8Uw80ZVXCvyqDn5pKPDKd0Dm"

try:
    # Insert admin user
    sql = """
    INSERT INTO users (full_name, email, password_hash, role, rating_avg, total_reviews, created_at, updated_at)
    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
    """
    
    values = ("Admin User", "admin@skillswap.com", admin_hash, "ADMIN", 0.0, 0)
    cursor.execute(sql, values)
    conn.commit()
    
    print("✓ Admin user created successfully!")
    print(f"  Email: admin@skillswap.com")
    print(f"  Password: admin123")
    print(f"  Role: ADMIN")
    
    # Verify
    cursor.execute("SELECT id, email, role FROM users WHERE email = %s", ("admin@skillswap.com",))
    result = cursor.fetchone()
    if result:
        print(f"\n✓ Verified: User ID={result[0]}, Email={result[1]}, Role={result[2]}")
    
except mysql.connector.Error as err:
    if err.errno == 1062:  # Duplicate entry
        print("⚠ Admin user already exists!")
        cursor.execute("SELECT id, email, role FROM users WHERE email = %s", ("admin@skillswap.com",))
        result = cursor.fetchone()
        if result:
            print(f"  ID={result[0]}, Email={result[1]}, Role={result[2]}")
    else:
        print(f"✗ Error: {err}")

finally:
    cursor.close()
    conn.close()
