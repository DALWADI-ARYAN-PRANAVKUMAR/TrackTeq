import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

db_url = settings.DATABASE_URL
# Vercel's file system is read-only except for /tmp.
if os.environ.get("VERCEL") and db_url.startswith("sqlite"):
    db_url = "sqlite:////tmp/transitops.db"

# check_same_thread is only needed for SQLite
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
