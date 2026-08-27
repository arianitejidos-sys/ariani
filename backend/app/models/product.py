import uuid
from sqlalchemy import Column, String, Numeric, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    category = Column(String, index=True, nullable=True) # e.g. "clothing", "pet_catalog"
    image_url = Column(String, nullable=True)
