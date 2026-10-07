from database import Base, SessionLocal, engine
from models.listing import Listing

# Make sure tables exist
Base.metadata.create_all(bind=engine)

listings = [
    {
        "title": "Beachfront villa with ocean view",
        "description": "A beautiful beachfront villa with stunning ocean views and a peaceful atmosphere.",
        "location": "Goa, India",
        "price_per_night": 4500,
        "rating": 4.89,
        "image_url": "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80",
        "category": "Beach",
        "max_guests": 4,
    },
    {
        "title": "Cozy mountain cabin",
        "description": "A cozy wooden cabin surrounded by beautiful mountains and forests.",
        "location": "Manali, India",
        "price_per_night": 3200,
        "rating": 4.92,
        "image_url": "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=800&q=80",
        "category": "Mountains",
        "max_guests": 3,
    },
    {
        "title": "Modern villa surrounded by nature",
        "description": "A spacious modern villa with a private swimming pool and garden.",
        "location": "Lonavala, India",
        "price_per_night": 5200,
        "rating": 4.78,
        "image_url": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
        "category": "Homes",
        "max_guests": 6,
    },
    {
        "title": "Beautiful luxury house",
        "description": "A stylish luxury home perfect for a relaxing weekend getaway.",
        "location": "Alibaug, India",
        "price_per_night": 6800,
        "rating": 4.95,
        "image_url": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
        "category": "Homes",
        "max_guests": 6,
    },
    {
        "title": "Peaceful lakeside stay",
        "description": "Enjoy a peaceful stay with beautiful lake views and comfortable rooms.",
        "location": "Udaipur, India",
        "price_per_night": 3900,
        "rating": 4.86,
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        "category": "Homes",
        "max_guests": 4,
    },
    {
        "title": "Wooden cottage in the hills",
        "description": "A charming wooden cottage surrounded by greenery and hills.",
        "location": "Ooty, India",
        "price_per_night": 2800,
        "rating": 4.81,
        "image_url": "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80",
        "category": "Countryside",
        "max_guests": 3,
    },
    {
        "title": "Private cottage with garden",
        "description": "A peaceful private cottage with a beautiful garden and relaxing surroundings.",
        "location": "Coorg, India",
        "price_per_night": 3500,
        "rating": 4.90,
        "image_url": "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
        "category": "Countryside",
        "max_guests": 4,
    },
    {
        "title": "Traditional home in the city",
        "description": "Experience a traditional Indian home with modern comforts.",
        "location": "Jaipur, India",
        "price_per_night": 3000,
        "rating": 4.75,
        "image_url": "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80",
        "category": "Historical",
        "max_guests": 4,
    },
]


def seed_database():
    db = SessionLocal()

    try:
        existing_count = db.query(Listing).count()

        if existing_count > 0:
            print(f"Database already contains {existing_count} listings.")
            return

        for listing_data in listings:
            listing = Listing(**listing_data)
            db.add(listing)

        db.commit()

        print(f"Successfully added {len(listings)} listings to the database.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()