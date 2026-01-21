from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models, auth_utils

router = APIRouter(prefix="/categories", tags=["categories"])

class CategoryCreate(BaseModel):
    name: str

@router.get("/")
def list_categories(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth_utils.get_current_user)
):
    cats = db.query(models.Category).all()
    return cats

@router.post("/")
def create_category(
    cat: CategoryCreate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth_utils.require_role(['admin', 'manager', 'supervisor', 'superuser']))
):
    existing = db.query(models.Category).filter(models.Category.name == cat.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category exists")
    
    new_cat = models.Category(name=cat.name, created_by=user.id)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat
