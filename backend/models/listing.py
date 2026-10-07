from sqlalchemy import Column, Integer, String, Float, Text

from database import Base


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(200), nullable=False)
    price_per_night = Column(Float, nullable=False)
    rating = Column(Float, default=0.0)
    image_url = Column(String(500), nullable=False)
    category = Column(String(100), default="Homes")
    max_guests = Column(Integer, default=2)