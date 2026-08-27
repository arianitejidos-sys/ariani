import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

try:
    conn = psycopg2.connect(user='postgres', password='postgres', host='localhost', port='5432')
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE ariani_db;")
    cursor.close()
    conn.close()
    print("Database created successfully")
except Exception as e:
    print("Failed to connect or create DB. Error:")
    # print raw bytes representation to avoid utf-8 decode error
    print(repr(str(e).encode('utf-8', errors='backslashreplace')))
