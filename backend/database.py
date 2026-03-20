from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# Use PostgreSQL if DATABASE_URL is provided (e.g. on Vercel), else fallback to SQLite
# Also check if we are on Vercel so we can use /tmp because default directory is read-only
is_vercel = os.environ.get("VERCEL") == "1"
fallback_db = "/tmp/sqlite.db" if is_vercel else "./sqlite.db"

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{fallback_db}")

# Fix for some SQLAlchemy versions with Vercel Postgres wrapper
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# connect_args={"check_same_thread": False} is needed only for SQLite.
connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
