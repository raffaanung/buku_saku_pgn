from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import auth_utils

def seed_admin():
    db = SessionLocal()
    try:
        # Create tables if they don't exist (just in case)
        models.Base.metadata.create_all(bind=engine)

        email = "admin@pgn.co.id"
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        
        if existing_user:
            print(f"User {email} already exists.")
            # Optional: Update password if needed, but for now just skip
            return

        hashed_password = auth_utils.get_password_hash("password123")
        admin_user = models.User(
            name="Admin PGN",
            email=email,
            password=hashed_password,
            role="admin",
            position="Administrator",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print(f"Admin user created successfully!")
        print(f"Email: {email}")
        print(f"Password: password123")
        
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
