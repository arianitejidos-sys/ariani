#!/usr/bin/env python
"""
Startup script for Railway:
  1. Runs alembic migrations (creates/updates all tables)
  2. Creates the admin user if it doesn't exist
  3. Starts the uvicorn server
"""
import os
import subprocess
import sys

# ── 1. Run Alembic migrations ────────────────────────────────────────────────
print(">>> Running database migrations...")
result = subprocess.run(
    ["alembic", "upgrade", "head"],
    capture_output=False,
)
if result.returncode != 0:
    print("ERROR: Migrations failed. Aborting startup.")
    sys.exit(1)
print(">>> Migrations complete.")

# ── 2. Create admin user ─────────────────────────────────────────────────────
print(">>> Creating admin user if not exists...")
from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "ana")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ariani2026")

db = SessionLocal()
try:
    existing = db.query(User).filter(User.username == ADMIN_USERNAME).first()
    if existing:
        print(f">>> Admin user '{ADMIN_USERNAME}' already exists.")
    else:
        user = User(
            username=ADMIN_USERNAME,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
        )
        db.add(user)
        db.commit()
        print(f">>> Admin user '{ADMIN_USERNAME}' created successfully.")
finally:
    db.close()

# ── 3. Start uvicorn ─────────────────────────────────────────────────────────
port = os.getenv("PORT", "8000")
print(f">>> Starting server on port {port}...")

# Use the uvicorn from the same venv as this Python to avoid PATH issues
uvicorn_bin = os.path.join(os.path.dirname(sys.executable), "uvicorn")
os.execv(uvicorn_bin, [uvicorn_bin, "app.main:app", "--host", "0.0.0.0", "--port", port])
