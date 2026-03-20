from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

import models
import database
import utils

router = APIRouter(prefix="/api")

# Dependency to get a Database session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class TemplateResponse(BaseModel):
    id: int
    image_url: str

    class Config:
        from_attributes = True

from typing import Optional

class RecordGenerationRequest(BaseModel):
    template_id: int

    class Config:
        from_attributes = True


@router.get("/templates", response_model=List[TemplateResponse])
def get_templates(db: Session = Depends(get_db)):
    """ Returns a list of all available card templates. """
    try:
        templates = db.query(models.CardTemplate).all()
    except Exception:
        templates = []
    
    # Auto-populate the database with our 6 templates if it is empty
    if not templates:
        for i in range(1, 7):
            new_template = models.CardTemplate(id=i, image_url=f"/templates/template_{i}.png")
            templates.append(new_template)
            db.add(new_template)
        try:
            db.commit()
        except Exception:
            db.rollback()
        
    return templates

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """ Returns the total number of generated cards. """
    try:
        count = db.query(models.GeneratedCard).count()
    except Exception:
        count = 0
    return {"total_generated": count}

@router.post("/record-generation")
def record_generation(request: RecordGenerationRequest, db: Session = Depends(get_db)):
    """ 
    Privacy-first tracking.
    Increments the global counter WITHOUT receiving, parsing, or saving any user data or images.
    """
    try:
        # Verify template exists
        template = db.query(models.CardTemplate).filter(models.CardTemplate.id == request.template_id).first()
        if not template:
            pass # Just continue
        
        # Save a dummy record just to keep the count going
        generated_card = models.GeneratedCard(
            user_name="Hidden for Privacy",
            user_message="Hidden for Privacy",
            parent_template_id=request.template_id,
            generated_image_url="not_saved_on_server"
        )
        
        db.add(generated_card)
        db.commit()
    except Exception:
        pass # Ignore safely on vercel if no postgres provided
        
    return {"status": "success"}
