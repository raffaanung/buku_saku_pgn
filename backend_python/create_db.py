import sqlalchemy
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to MySQL server (no specific DB)
SERVER_URL = "mysql+pymysql://root:@localhost"
DB_NAME = "buku_saku"

def create_database():
    engine = create_engine(SERVER_URL)
    with engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}"))
        print(f"Database '{DB_NAME}' created or already exists.")

if __name__ == "__main__":
    create_database()
