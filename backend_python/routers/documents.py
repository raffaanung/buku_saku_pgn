from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
import shutil
import os
import database, models, auth_utils
from pydantic import BaseModel
# Import Drive Service
try:
    from services import drive_service
except ImportError:
    drive_service = None

router = APIRouter(prefix="/documents", tags=["documents"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Configuration
ENABLE_GDRIVE = os.getenv("ENABLE_GDRIVE", "False").lower() == "true"
GDRIVE_FOLDER_ID = os.getenv("GDRIVE_FOLDER_ID", None)

class StatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None

@router.post("/")
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    tags: str = Form(None), # comma separated
    category: str = Form(None), # comma separated
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth_utils.get_current_user)
):
    # Check permissions
    if user.role not in ['admin', 'manager', 'supervisor', 'superuser']:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki izin untuk mengunggah file.")

    file_path = ""
    
    if ENABLE_GDRIVE and drive_service:
        # Read file content
        content = await file.read()
        drive_file = drive_service.upload_file_to_drive(
            content, 
            file.filename, 
            file.content_type, 
            folder_id=GDRIVE_FOLDER_ID
        )
        
        if not drive_file:
            raise HTTPException(status_code=500, detail="Gagal mengupload ke Google Drive")
            
        # Use webViewLink as the path
        file_path = drive_file.get('webViewLink')
        
    else:
        # Local Save (Fallback)
        file_path = os.path.join(UPLOAD_DIR, f"{user.id}_{file.filename}")
        with open(file_path, "wb") as buffer:
            # If using async read above, we need to seek(0) or re-read? 
            # If ENABLE_GDRIVE is False, we haven't read yet.
            # But 'file' is UploadFile.
            shutil.copyfileobj(file.file, buffer)
    
    # Parse tags/cats
    tag_list = tags.split(',') if tags else []
    cat_list = category.split(',') if category else []

    new_doc = models.Document(
        title=title,
        file_path=file_path,
        file_type=file.content_type,
        file_size=0, # Should calculate
        uploaded_by=user.id,
        status='pending',
        tags=tag_list,
        category=cat_list
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Create history entry
    history = models.DocumentHistory(
        document_id=new_doc.id,
        changed_by=user.id,
        action="upload",
        notes="File diunggah oleh admin/staff"
    )
    db.add(history)
    db.commit()
    
    return {"message": "Upload berhasil", "document_id": new_doc.id}

@router.get("/")
def list_documents(
    q: Optional[str] = None,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth_utils.get_current_user)
):
    query = db.query(models.Document).filter(models.Document.deleted_at == None)
    
    # Search Filter
    if q:
        search = f"%{q}%"
        query = query.filter(models.Document.title.like(search))
    
    # Role Filter
    if user.role == 'user':
        # "Pengguna hanya dapat melihat file yang telah mereka unggah atau file yang sudah disetujui"
        # Since users can't upload, they see Approved files.
        # Maybe filter by Instansi? For now, all Approved files.
        query = query.filter(models.Document.status == 'approved')
    else:
        # Admin sees all (pending, approved, rejected)
        pass
        
    docs = query.all()
    
    # Enrich with uploader name
    results = []
    for d in docs:
        uploader_data = {
            "name": d.uploader.name if d.uploader else "Unknown",
            "instansi": d.uploader.instansi if d.uploader else "-",
            "email": d.uploader.email if d.uploader else "-"
        }
        
        # Determine file_url based on path type
        file_url = d.file_path
        if not file_url.startswith('http'):
             file_url = f"/uploads/{os.path.basename(d.file_path)}"
             
        results.append({
            "id": d.id,
            "title": d.title,
            "file_url": file_url,
            "status": d.status,
            "category": d.category,
            "tags": d.tags,
            "created_at": d.created_at,
            "uploader": uploader_data,
            "rejection_note": d.rejection_note
        })
        
    return {"results": results}

@router.put("/{doc_id}/status")
def update_status(
    doc_id: str,
    payload: StatusUpdate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth_utils.require_role(['admin', 'manager', 'superuser']))
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    old_status = doc.status
    doc.status = payload.status
    
    history_note = ""
    
    if payload.status == 'approved':
        doc.approved_by = user.id
        doc.rejected_by = None
        doc.rejection_note = None
        history_note = "Disetujui oleh admin"
    elif payload.status == 'rejected':
        doc.rejected_by = user.id
        doc.approved_by = None
        doc.rejection_note = payload.note
        history_note = f"Ditolak. Alasan: {payload.note}"
        
    # Create history entry
    history = models.DocumentHistory(
        document_id=doc.id,
        changed_by=user.id,
        action=f"status_change_{payload.status}",
        notes=history_note
    )
    db.add(history)
    
    db.commit()
    return {"message": f"Status dokumen diubah menjadi {payload.status}"}

@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth_utils.require_role(['admin', 'manager', 'superuser']))
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    doc.deleted_at = func.now()
    doc.deleted_by = user.id
    
    # Create history entry
    history = models.DocumentHistory(
        document_id=doc.id,
        changed_by=user.id,
        action="delete",
        notes="File dihapus oleh admin"
    )
    db.add(history)
    
    db.commit()
    return {"message": "Dokumen berhasil dihapus"}

@router.get("/search")
def search_documents(
    q: str,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth_utils.get_current_user)
):
    # Reuse list logic for now
    return list_documents(q=q, db=db, user=user)
