from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database, models, auth_utils

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def list_users(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth_utils.require_role(['admin', 'superuser']))
):
    users = db.query(models.User).all()
    return {"users": users}

@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth_utils.require_role(['admin', 'superuser']))
):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(target)
    db.commit()
    return {"message": "User deleted"}
