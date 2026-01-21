from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, documents, users, categories
from database import engine, Base

# Create tables if not exist (for dev)
# Wrap in try-except to prevent crash on Vercel if DB is unreachable
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error creating tables: {e}")

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Buku Saku API (Python)")

# Ensure uploads directory exists (Handle Vercel Read-Only FS)
try:
    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except OSError:
    print("Could not create uploads directory (likely read-only filesystem). Skipping mount.")
    # On Vercel, we don't need local uploads if using Google Drive


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(categories.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Buku Saku API (Python Edition)"}
