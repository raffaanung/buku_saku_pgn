import pymysql
import os
import sys

# Default XAMPP/WAMP settings
DB_HOST = "localhost"
DB_USER = "root"
DB_PASS = "" 
DB_NAME = "buku_saku"

print(f"Connecting to MySQL at {DB_HOST} as {DB_USER}...")

try:
    conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS)
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    print(f"Database '{DB_NAME}' created or verified.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
