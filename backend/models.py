from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

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
