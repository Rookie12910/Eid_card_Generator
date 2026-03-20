import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List

# ─── Database Setup ───────────────────────────────────────────────
is_vercel = os.environ.get("VERCEL") == "1"
fallback_db = "/tmp/sqlite.db" if is_vercel else "./sqlite.db"

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{fallback_db}")

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─── Models ───────────────────────────────────────────────────────
class CardTemplate(Base):
    __tablename__ = "card_templates"
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String, index=True)

class GeneratedCard(Base):
    __tablename__ = "generated_cards"
    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, index=True)
    user_message = Column(Text)
    parent_template_id = Column(Integer, ForeignKey("card_templates.id"))
    generated_image_url = Column(String, index=True)
    template = relationship("CardTemplate")

# Create tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Skipping table creation: {e}")

# ─── Pydantic Schemas ─────────────────────────────────────────────
class TemplateResponse(BaseModel):
    id: int
    image_url: str
    class Config:
        from_attributes = True

class RecordGenerationRequest(BaseModel):
    template_id: int

# ─── FastAPI App ──────────────────────────────────────────────────
app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── API Endpoints ────────────────────────────────────────────────
@app.get("/api/hello")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/templates", response_model=List[TemplateResponse])
def get_templates(db: Session = Depends(get_db)):
    try:
        templates = db.query(CardTemplate).all()
    except Exception:
        templates = []

    if not templates:
        fallback = []
        for i in range(1, 7):
            url = f"/templates/template_{i}.png"
            fallback.append({"id": i, "image_url": url})
            try:
                db.add(CardTemplate(id=i, image_url=url))
            except Exception:
                pass
        try:
            db.commit()
            return db.query(CardTemplate).all()
        except Exception:
            db.rollback()
            return fallback

    return templates

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        count = db.query(GeneratedCard).count()
    except Exception:
        count = 0
    return {"total_generated": count}

@app.post("/api/record-generation")
def record_generation(request: RecordGenerationRequest, db: Session = Depends(get_db)):
    try:
        card = GeneratedCard(
            user_name="Hidden for Privacy",
            user_message="Hidden for Privacy",
            parent_template_id=request.template_id,
            generated_image_url="not_saved_on_server"
        )
        db.add(card)
        db.commit()
    except Exception:
        pass
    return {"status": "success"}
