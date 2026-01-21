from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

# Format: mysql+pymysql://user:password@host/db_name
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/buku_saku")

connect_args = {}

# Konfigurasi SSL untuk Aiven/Production
if "aivencloud.com" in SQLALCHEMY_DATABASE_URL or os.getenv("VERCEL"):
    try:
        # Create a flexible SSL context that doesn't verify strict hostname/certs
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        connect_args = {
            "ssl": ssl_context
        }
    except Exception as e:
        print(f"Warning: Failed to create SSL context: {e}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    pool_pre_ping=True, # Auto-reconnect
    pool_recycle=300    # Recycle connections every 5 minutes
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
