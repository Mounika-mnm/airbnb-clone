from datetime import date
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models.listing import Listing


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    guest_name = Column(String(120), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    guests = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(30), default="confirmed")


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Airbnb Clone API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ListingIn(BaseModel):
    title: str
    description: str
    location: str
    price_per_night: float = Field(gt=0)
    image_url: str
    category: str = "Homes"
    max_guests: int = Field(default=2, ge=1)


class BookingIn(BaseModel):
    listing_id: int
    guest_name: str = "Demo Guest"
    check_in: date
    check_out: date
    guests: int = Field(ge=1)


def listing_dict(x):
    return {
        "id": x.id,
        "title": x.title,
        "description": x.description,
        "location": x.location,
        "price_per_night": x.price_per_night,
        "rating": x.rating,
        "image_url": x.image_url,
        "category": x.category,
        "max_guests": x.max_guests,
    }


def booking_dict(x, db):
    listing = (
        db.query(Listing)
        .filter(Listing.id == x.listing_id)
        .first()
    )

    return {
        "id": x.id,
        "listing_id": x.listing_id,
        "listing_title": listing.title if listing else "Listing",
        "location": listing.location if listing else "",
        "image_url": listing.image_url if listing else "",
        "guest_name": x.guest_name,
        "check_in": x.check_in.isoformat(),
        "check_out": x.check_out.isoformat(),
        "guests": x.guests,
        "total_price": x.total_price,
        "status": x.status,
    }


@app.get("/")
def root():
    return {
        "message": "Airbnb Clone API is running"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/api/listings")
def get_listings(
    location: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Listing)

    if location:
        query = query.filter(
            Listing.location.ilike(f"%{location}%")
        )

    if category and category != "All":
        query = query.filter(
            Listing.category == category
        )

    listings = query.order_by(Listing.id.desc()).all()

    return [listing_dict(x) for x in listings]


@app.get("/api/listings/{listing_id}")
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(Listing)
        .filter(Listing.id == listing_id)
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    return listing_dict(listing)


@app.post("/api/listings")
def create_listing(
    data: ListingIn,
    db: Session = Depends(get_db),
):
    listing = Listing(
        **data.model_dump(),
        rating=5.0,
    )

    db.add(listing)
    db.commit()
    db.refresh(listing)

    return listing_dict(listing)


@app.put("/api/listings/{listing_id}")
def update_listing(
    listing_id: int,
    data: ListingIn,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(Listing)
        .filter(Listing.id == listing_id)
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    for key, value in data.model_dump().items():
        setattr(listing, key, value)

    db.commit()
    db.refresh(listing)

    return listing_dict(listing)


@app.delete("/api/listings/{listing_id}")
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(Listing)
        .filter(Listing.id == listing_id)
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    db.delete(listing)
    db.commit()

    return {
        "message": "Listing deleted"
    }


@app.get("/api/bookings")
def get_bookings(
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .order_by(Booking.id.desc())
        .all()
    )

    return [booking_dict(x, db) for x in bookings]


@app.post("/api/bookings")
def create_booking(
    data: BookingIn,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(Listing)
        .filter(Listing.id == data.listing_id)
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    if data.check_in >= data.check_out:
        raise HTTPException(
            status_code=400,
            detail="Check-out must be after check-in",
        )

    if data.check_in < date.today():
        raise HTTPException(
            status_code=400,
            detail="Check-in cannot be in the past",
        )

    if data.guests > listing.max_guests:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum guests: {listing.max_guests}",
        )

    overlap = (
        db.query(Booking)
        .filter(
            Booking.listing_id == data.listing_id,
            Booking.status == "confirmed",
            Booking.check_in < data.check_out,
            Booking.check_out > data.check_in,
        )
        .first()
    )

    if overlap:
        raise HTTPException(
            status_code=409,
            detail="Those dates are unavailable",
        )

    nights = (
        data.check_out - data.check_in
    ).days

    total = nights * listing.price_per_night

    booking = Booking(
        **data.model_dump(),
        total_price=total,
        status="confirmed",
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking_dict(booking, db)


@app.get("/api/bookings/{listing_id}/availability")
def availability(
    listing_id: int,
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .filter(
            Booking.listing_id == listing_id,
            Booking.status == "confirmed",
        )
        .all()
    )

    return [
        {
            "check_in": x.check_in.isoformat(),
            "check_out": x.check_out.isoformat(),
        }
        for x in bookings
    ]