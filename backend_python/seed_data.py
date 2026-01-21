from sqlalchemy.orm import Session
import database, models, auth_utils

def seed_superuser():
    db = database.SessionLocal()
    try:
        email = "admin@pgn.co.id"
        existing = db.query(models.User).filter(models.User.email == email).first()
        if not existing:
            print(f"Creating superuser: {email}")
            hashed_pw = auth_utils.get_password_hash("password123")
            user = models.User(
                name="Super Admin",
                email=email,
                password=hashed_pw,
                role="superuser",
                is_active=True
            )
            db.add(user)
            db.commit()
            print("Superuser created successfully.")
        else:
            print("Superuser already exists.")
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_superuser()
