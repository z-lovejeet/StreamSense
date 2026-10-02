"""
StreamSense Demo Data Seeder — Real Stream & Lake Images

Inserts realistic, verified observations across the 5 OneAquaHealth pilot cities
(Coimbra, Toulouse, Benevento, Ghent, Oslo) with real freshwater stream and lake imagery.

Usage:
    cd backend
    .venv/bin/python -m scripts.seed_demo
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete
from app.database import async_session
from app.models.observation import Observation
from app.models.enums import ObservationStatus
from app.models.user import User


# ── Demo Observations with REAL Freshwater Stream & Lake Imagery ──────
DEMO_DATA = [
    {
        # Crystal clear rushing stream flowing over mossy riverbed rocks
        "image_url": "/images/observations/coimbra_stream.jpg",
        "description": "Crystal clear water with many mayfly nymphs clinging to rocks. Fast-flowing section near the bridge. Water is cold and transparent, no algae visible.",
        "latitude": 40.2033,
        "longitude": -8.4103,
        "location_name": "Rio Mondego, Coimbra",
        "pilot_city": "Coimbra",
        "days_ago": 1,
        "status": ObservationStatus.AUTO_VALIDATED,
        "confidence_score": 92,
        "routing": "auto_validate",
        "top_species": "Ephemeroptera",
        "top_confidence": 0.92,
        "impact_text": "Great catch! You found mayfly nymphs — these sensitive creatures only thrive in clean, healthy water. Your observation confirms that this stretch of the Mondego river maintains excellent ecological quality.",
        "impact_headline": "Clean Water Confirmed",
        "pipeline_time_seconds": 3.8,
    },
    {
        # Calm river canal waterway reflecting trees
        "image_url": "/images/observations/toulouse_stream.jpg",
        "description": "Slow-moving murky water with small red midge larvae in the sediment. Moderate algae growth along the stone bank.",
        "latitude": 43.6047,
        "longitude": 1.4442,
        "location_name": "Canal du Midi, Toulouse",
        "pilot_city": "Toulouse",
        "days_ago": 2,
        "status": ObservationStatus.AUTO_VALIDATED,
        "confidence_score": 78,
        "routing": "auto_validate",
        "top_species": "Chironomidae",
        "top_confidence": 0.78,
        "impact_text": "Thank you for your observation! The midge larvae and murky conditions you reported suggest moderate nutrient enrichment. Continued monitoring helps track water quality trends in Toulouse.",
        "impact_headline": "Nutrient Enrichment Flagged",
        "pipeline_time_seconds": 4.2,
    },
    {
        # Freshwater river stream with pebble gravel bed and clean sunlit water
        "image_url": "/images/observations/benevento_calore_stream.jpg",
        "description": "Shallow gravel stream riffle near the riverbank. Found small mayfly nymphs swimming among smooth river pebbles. Cool, well-oxygenated water.",
        "latitude": 41.1306,
        "longitude": 14.7681,
        "location_name": "Fiume Calore, Benevento",
        "pilot_city": "Benevento",
        "days_ago": 3,
        "status": ObservationStatus.PENDING_REVIEW,
        "confidence_score": 62,
        "routing": "expert_review",
        "top_species": "Baetidae",
        "top_confidence": 0.62,
        "impact_text": "Observation staged for demonstration. Baetidae nymphs require expert verification of gill structure and stream riffle habitat before publication to the European validated registry.",
        "impact_headline": "Pending Expert Review",
        "pipeline_time_seconds": 4.6,
    },
    {
        # Lush river stream flowing through green natural banks
        "image_url": "/images/observations/ghent_stream.jpg",
        "description": "Fast-flowing stream under the old bridge. Found several caddisfly cases attached to submerged rocks. Water is clear and cool.",
        "latitude": 51.0543,
        "longitude": 3.7174,
        "location_name": "Coupure Canal, Ghent",
        "pilot_city": "Ghent",
        "days_ago": 4,
        "status": ObservationStatus.EXPERT_VALIDATED,
        "confidence_score": 88,
        "routing": "auto_validate",
        "top_species": "Trichoptera",
        "top_confidence": 0.88,
        "impact_text": "Wonderful observation! Caddisfly larvae are sensitive bioindicators of good ecological quality. Your data confirms a healthy freshwater section in Ghent.",
        "impact_headline": "Healthy Ecosystem Verified",
        "pipeline_time_seconds": 3.5,
    },
    {
        # Shaded forest stream flowing over rocky rapids
        "image_url": "/images/observations/oslo_stream.jpg",
        "description": "Cool, shaded stream section near the urban forest. Found freshwater shrimp under fallen leaves and mossy rocks. Clean, transparent water.",
        "latitude": 59.9139,
        "longitude": 10.7522,
        "location_name": "Akerselva River, Oslo",
        "pilot_city": "Oslo",
        "days_ago": 5,
        "status": ObservationStatus.AUTO_VALIDATED,
        "confidence_score": 85,
        "routing": "auto_validate",
        "top_species": "Gammaridae",
        "top_confidence": 0.85,
        "impact_text": "Great observation! Freshwater shrimp (Gammaridae) are moderate-to-good water quality indicators. This confirms healthy dissolved oxygen levels along the Akerselva in Oslo.",
        "impact_headline": "Good Oxygenation Confirmed",
        "pipeline_time_seconds": 4.1,
    },
]


async def seed_demo():
    """Seed or update demo observations with real stream imagery."""
    async with async_session() as session:
        # Get active user
        user_result = await session.execute(
            select(User).order_by(User.created_at.desc())
        )
        user = user_result.scalars().first()
        if not user:
            print("  ❌ No users found in database.")
            return

        print(f"  👤 Seeding stream observations for: {user.full_name} ({user.email})")

        now = datetime.now(timezone.utc)

        # Upsert or replace pilot city demo observations
        for data in DEMO_DATA:
            existing_result = await session.execute(
                select(Observation).where(
                    Observation.pilot_city == data["pilot_city"],
                    Observation.location_name == data["location_name"],
                )
            )
            obs = existing_result.scalars().first()

            if obs:
                # Update existing record with real stream photo and validated status
                obs.image_url = data["image_url"]
                obs.image_thumbnail_url = data["image_url"]
                obs.description = data["description"]
                obs.status = data["status"]
                obs.confidence_score = data["confidence_score"]
                obs.routing = data["routing"]
                obs.top_species = data["top_species"]
                obs.top_confidence = data["top_confidence"]
                obs.impact_text = data["impact_text"]
                obs.impact_headline = data["impact_headline"]
                print(f"  🔄 Updated with real stream image: {data['pilot_city']} ({data['top_species']})")
            else:
                obs = Observation(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    image_url=data["image_url"],
                    image_thumbnail_url=data["image_url"],
                    description=data["description"],
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    location_name=data["location_name"],
                    pilot_city=data["pilot_city"],
                    observed_at=now - timedelta(days=data["days_ago"]),
                    status=data["status"],
                    confidence_score=data["confidence_score"],
                    routing=data["routing"],
                    top_species=data["top_species"],
                    top_confidence=data["top_confidence"],
                    impact_text=data["impact_text"],
                    impact_headline=data["impact_headline"],
                    pipeline_time_seconds=data["pipeline_time_seconds"],
                    created_at=now - timedelta(days=data["days_ago"]),
                    updated_at=now - timedelta(days=data["days_ago"]),
                )
                session.add(obs)
                print(f"  ✅ Added real stream observation: {data['pilot_city']} ({data['top_species']})")

        await session.commit()
        print("\n🌊 Successfully refreshed all 5 demo observations with genuine stream and river photos.")


if __name__ == "__main__":
    print("🌊 StreamSense Real Stream Data Seeder")
    print("=" * 45)
    asyncio.run(seed_demo())
