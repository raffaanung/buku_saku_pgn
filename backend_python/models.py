from sqlalchemy import Column, String, Boolean, Text, TIMESTAMP, ForeignKey, JSON, Integer, BigInteger, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(Text, nullable=False)
    role = Column(Enum('admin', 'manager', 'supervisor', 'user', 'superuser'), default='user', nullable=False)
    position = Column(String(255)) # Jabatan
    instansi = Column(String(255)) # Nama Instansi
    address = Column(Text) # Alamat (New)
    is_active = Column(Boolean, default=True) # Changed default to True for easier testing/flow, or logic handles it
    created_at = Column(TIMESTAMP, server_default=func.now())

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(Enum('pending', 'approved', 'rejected'), default='pending', nullable=False)
    approved_by = Column(String(36), ForeignKey("users.id"))
    rejected_by = Column(String(36), ForeignKey("users.id"))
    rejection_note = Column(Text)
    deleted_by = Column(String(36), ForeignKey("users.id"))
    category = Column(JSON)
    tags = Column(JSON)
    content = Column(Text) # LONGTEXT in MySQL
    embedding = Column(JSON)
    deleted_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    uploader = relationship("User", foreign_keys=[uploaded_by])

class DocumentHistory(Base):
    __tablename__ = "document_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"))
    changed_by = Column(String(36), ForeignKey("users.id"))
    action = Column(String(50), nullable=False)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    type = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.now())

class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(String(36), ForeignKey("users.id"), primary_key=True)
    document_id = Column(String(36), ForeignKey("documents.id"), primary_key=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
