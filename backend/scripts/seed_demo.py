"""
StreamSense Demo Data Seeder — Phase 6 Task 6.9

Inserts 5 realistic observations across the 5 OneAquaHealth pilot cities
(Coimbra, Toulouse, Benevento, Ghent, Oslo) using the SQLAlchemy ORM.

Usage:
    cd backend
    .venv/bin/python -m scripts.seed_demo
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from app.database import async_session
from app.models.observation import Observation
from app.models.enums import ObservationStatus
from app.models.user import User


# ── Demo Observations across the 5 OneAquaHealth Pilot Cities ─────────
DEMO_DATA = [
    {
        "image_url": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop",
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
        "image_url": "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop",
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
        "image_url": "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800&auto=format&fit=crop",
        "description": "Standing water near the stormwater outlet. Detected mosquito larvae wriggling near the surface. Water is dark and stagnant with organic debris.",
        "latitude": 41.1306,
        "longitude": 14.7681,
        "location_name": "Fiume Calore, Benevento",
        "pilot_city": "Benevento",
        "days_ago": 3,
        "status": ObservationStatus.PENDING_REVIEW,
        "confidence_score": 48,
        "routing": "expert_review",
        "top_species": "Culicidae",
        "top_confidence": 0.48,
        "impact_text": "Important find! Mosquito larvae in stagnant water is an early warning indicator. We have flagged this for expert review to assess vector-borne disease risk in Benevento.",
        "impact_headline": "Disease Vector Alert",
        "pipeline_time_seconds": 5.1,
    },
    {
        "image_url": "https://images.unsplash.com/photo-1544979590-37e9b47eb705?w=800&auto=format&fit=crop",
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
        "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
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
    """Insert demo observations using SQLAlchemy ORM."""
    async with async_session() as session:
        # Find first available user (or Lovejeet's user)
        user_result = await session.execute(
            select(User).order_by(User.created_at.desc())
        )
        user = user_result.scalars().first()
        if not user:
            print("  ❌ No users found in database. Sign in first via Google/GitHub.")
            return

        print(f"  👤 Associating demo observations with user: {user.full_name} ({user.email})")

        seeded_count = 0
        now = datetime.now(timezone.utc)

        for data in DEMO_DATA:
            # Check if an observation at this location already exists
            existing = await session.execute(
                select(Observation).where(
                    Observation.pilot_city == data["pilot_city"],
                    Observation.location_name == data["location_name"],
                )
            )
            if existing.scalars().first():
                print(f"  ⏭ Skipping {data['pilot_city']} — already seeded")
                continue

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
            seeded_count += 1
            print(f"  ✅ Added: {data['top_species']} in {data['pilot_city']} ({data['status'].value})")

        await session.commit()
        print(f"\n🌱 Demo seeding complete: {seeded_count} new observations saved to database.")


if __name__ == "__main__":
    print("🌊 StreamSense Demo Data Seeder")
    print("=" * 45)
    asyncio.run(seed_demo())
