from sqlalchemy.orm import Session
from database import SessionLocal
import models

def list_users():
    db = SessionLocal()
    users = db.query(models.User).all()
    for u in users:
        print(f"User: {u.email}, Role: {u.role}, Pass: {u.password}")
    db.close()

if __name__ == "__main__":
    list_users()
