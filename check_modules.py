import sys


print(sys.executable)
try:
    import pandas
    print("pandas: OK")
except ImportError:
    print("pandas: MISSING")

try:
    import asyncpg
    print("asyncpg: OK")
except ImportError:
    print("asyncpg: MISSING")

try:
    import openpyxl
    print("openpyxl: OK")
except ImportError:
    print("openpyxl: MISSING")

try:
    import psycopg2
    print("psycopg2: OK")
except ImportError:
    print("psycopg2: MISSING")
