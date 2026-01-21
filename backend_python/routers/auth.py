from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import database, models, auth_utils
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])

# --- Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    # Common
    username: Optional[str] = None # For Admin
    name: Optional[str] = None # For User (Nama Pengguna)
    email: EmailStr
    password: str
    role: str # 'admin' or 'user'
    
    # Admin Specific
    position: Optional[str] = None # Jabatan
    passkey: Optional[str] = None # Pass Key
    
    # User Specific
    instansi: Optional[str] = None # Nama Instansi
    address: Optional[str] = None # Alamat

# --- Constants ---
ADMIN_PASSKEY = "SECRET_PGN_ADMIN_2025" # In prod, use env var

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(database.get_db)):
    # Allow login by email or username (though we store mainly email)
    user = db.query(models.User).filter(models.User.email == req.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    if not auth_utils.verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun belum aktif")

    access_token = auth_utils.create_access_token(data={"sub": str(user.id), "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "position": user.position,
            "instansi": user.instansi
        }
    }

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(database.get_db)):
    # 1. Check existing email
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    # 2. Validation based on Role
    if req.role == 'admin':
        if not req.username:
             raise HTTPException(status_code=400, detail="Username wajib diisi untuk Admin")
        if not req.passkey or req.passkey != ADMIN_PASSKEY:
             raise HTTPException(status_code=400, detail="Pass Key tidak valid")
        
        final_name = req.username # Store username in 'name' column or separate? Model has 'name'. Let's use 'name' for both.
        
    elif req.role == 'user':
        if not req.name:
             raise HTTPException(status_code=400, detail="Nama Pengguna wajib diisi")
        if not req.instansi:
             raise HTTPException(status_code=400, detail="Nama Instansi wajib diisi")
        if not req.address:
             raise HTTPException(status_code=400, detail="Alamat wajib diisi")
        
        final_name = req.name
    else:
        raise HTTPException(status_code=400, detail="Role tidak valid")

    # 3. Create User
    hashed_pw = auth_utils.get_password_hash(req.password)
    
    new_user = models.User(
        name=final_name,
        email=req.email,
        password=hashed_pw,
        role=req.role,
        position=req.position if req.role == 'admin' else None,
        instansi=req.instansi if req.role == 'user' else None,
        address=req.address if req.role == 'user' else None,
        is_active=True # Auto-active for now based on prompt flow "lanjut ke halaman Utama login"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Registrasi berhasil. Silakan login.", "user_id": new_user.id}
