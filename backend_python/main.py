from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables if not exist (for dev)
# Wrap in try-except to prevent crash on Vercel if DB is unreachable
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.error(f"Error creating tables: {e}")

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Buku Saku API (Python)")

# Ensure uploads directory exists (Handle Vercel Read-Only FS)
try:
    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except OSError:
    logger.warning("Could not create uploads directory (likely read-only filesystem). Skipping mount.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers with error handling for debugging
try:
    from routers import auth
    app.include_router(auth.router)
except Exception as e:
    logger.error(f"Failed to load auth router: {e}")

try:
    from routers import users
    app.include_router(users.router)
except Exception as e:
    logger.error(f"Failed to load users router: {e}")

try:
    from routers import documents
    app.include_router(documents.router)
except Exception as e:
    logger.error(f"Failed to load documents router: {e}")

try:
    from routers import categories
    app.include_router(categories.router)
except Exception as e:
    logger.error(f"Failed to load categories router: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to Buku Saku API (Python Edition)"}
