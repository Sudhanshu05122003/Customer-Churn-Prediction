import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    conn = psycopg2.connect(
        dbname='postgres', 
        user='postgres', 
        password='Sudhanshu_2026', 
        host='localhost'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM pg_database WHERE datname='churnsense'")
    exists = cur.fetchone()
    
    if not exists:
        cur.execute('CREATE DATABASE churnsense')
        print('Database churnsense created')
    else:
        print('Database churnsense already exists')
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
