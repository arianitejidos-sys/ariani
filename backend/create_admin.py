"""
Script to create the admin user (Ana) in the database.
Run once: python create_admin.py
"""
from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "ana").first()
        if existing:
            print("Admin user 'ana' already exists.")
            return
        
        user = User(
            username="ana",
            hashed_password=get_password_hash("ariani2026")
        )
        db.add(user)
        db.commit()
        print("Admin user 'ana' created successfully.")
        print("Username: ana")
        print("Password: ariani2026")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
