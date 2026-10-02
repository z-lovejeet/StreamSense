"""
StreamSense Demo Data Seeder — Phase 6 Task 6.9

Inserts 5 realistic observations across the 5 pilot cities
with pre-populated AI results, review records, and FHIR resources
for validated entries. Designed for demo reliability.

Usage:
    cd backend
    python -m scripts.seed_demo
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from app.database import async_session_factory


# ── Demo Observations ──────────────────────────────────────────────
DEMO_DATA = [
    {
        "id": str(uuid.uuid4()),
        "image_url": "https://yownblqyhyntzpmumltt.supabase.co/storage/v1/object/public/observations/demo/mayfly_coimbra.jpg",
        "image_thumbnail_url": None,
        "description": "Crystal clear water with many mayfly nymphs clinging to rocks. Fast-flowing section near the bridge. Water is cold and transparent, no algae visible.",
        "latitude": 40.2033,
        "longitude": -8.4103,
        "location_name": "Rio Mondego, Coimbra",
        "pilot_city": "Coimbra",
        "observed_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        "status": "auto_validated",
        "confidence_score": 92,
        "routing": "auto_validate",
        "top_species": "Ephemeroptera",
        "top_confidence": 0.92,
        "impact_text": "Great catch! You found mayfly nymphs — these sensitive creatures only thrive in clean, healthy water. Your observation confirms that this stretch of the Mondego river maintains excellent ecological quality.",
        "impact_headline": "Clean Water Confirmed",
        "pipeline_time_seconds": 3.8,
    },
    {
        "id": str(uuid.uuid4()),
        "image_url": "https://yownblqyhyntzpmumltt.supabase.co/storage/v1/object/public/observations/demo/midge_toulouse.jpg",
        "image_thumbnail_url": None,
        "description": "Slow-moving murky water with lots of small red larvae in the sediment. Slight chemical odor near the bank. Moderate algae growth on rocks.",
        "latitude": 43.6047,
        "longitude": 1.4442,
        "location_name": "Canal du Midi, Toulouse",
        "pilot_city": "Toulouse",
        "observed_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
        "status": "auto_validated",
        "confidence_score": 78,
        "routing": "auto_validate",
        "top_species": "Chironomidae",
        "top_confidence": 0.78,
        "impact_text": "Thank you for your observation! The midge larvae and murky conditions you reported suggest moderate nutrient enrichment. Continued monitoring helps track water quality trends in Toulouse.",
        "impact_headline": "Nutrient Enrichment Flagged",
        "pipeline_time_seconds": 4.2,
    },
    {
        "id": str(uuid.uuid4()),
        "image_url": "https://yownblqyhyntzpmumltt.supabase.co/storage/v1/object/public/observations/demo/mosquito_benevento.jpg",
        "image_thumbnail_url": None,
        "description": "Standing water near a storm drain. Saw mosquito-like larvae wriggling near the surface. Water is dark and stagnant with debris.",
        "latitude": 41.1306,
        "longitude": 14.7681,
        "location_name": "Fiume Calore, Benevento",
        "pilot_city": "Benevento",
        "observed_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
        "status": "pending_review",
        "confidence_score": 45,
        "routing": "expert_review",
        "top_species": "Culicidae",
        "top_confidence": 0.45,
        "impact_text": "Important find! Mosquito larvae in stagnant water is a public health concern. We've flagged this for expert review to confirm the species and assess disease vector risk.",
        "impact_headline": "Disease Vector Alert",
        "pipeline_time_seconds": 5.1,
    },
    {
        "id": str(uuid.uuid4()),
        "image_url": "https://yownblqyhyntzpmumltt.supabase.co/storage/v1/object/public/observations/demo/caddisfly_ghent.jpg",
        "image_thumbnail_url": None,
        "description": "Fast-flowing stream under the old stone bridge. Found several caddisfly cases attached to rocks. Water is clear and cool with natural debris only.",
        "latitude": 51.0543,
        "longitude": 3.7174,
        "location_name": "Coupure Canal, Ghent",
        "pilot_city": "Ghent",
        "observed_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
        "status": "expert_validated",
        "confidence_score": 85,
        "routing": "auto_validate",
        "top_species": "Trichoptera",
        "top_confidence": 0.85,
        "impact_text": "Wonderful observation! Caddisfly larvae are excellent indicators of good water quality. Your data from the Coupure Canal confirms a healthy freshwater ecosystem in Ghent.",
        "impact_headline": "Healthy Ecosystem Verified",
        "pipeline_time_seconds": 3.5,
    },
    {
        "id": str(uuid.uuid4()),
        "image_url": "https://yownblqyhyntzpmumltt.supabase.co/storage/v1/object/public/observations/demo/worm_oslo.jpg",
        "image_thumbnail_url": None,
        "description": "Dark water with organic debris and fallen leaves. Found small worms in the muddy sediment near the bank. Slight earthy odor.",
        "latitude": 59.9139,
        "longitude": 10.7522,
        "location_name": "Akerselva River, Oslo",
        "pilot_city": "Oslo",
        "observed_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
        "status": "pending_review",
        "confidence_score": 62,
        "routing": "expert_review",
        "top_species": "Oligochaeta",
        "top_confidence": 0.62,
        "impact_text": "Thank you for this observation! Aquatic worms in organic sediment can indicate elevated nutrient levels. We've flagged this for expert review to assess the overall water quality.",
        "impact_headline": "Moderate Quality — Review Needed",
        "pipeline_time_seconds": 4.7,
    },
]


async def seed_demo():
    """Insert demo observations into the database."""
    async with async_session_factory() as session:
        for obs in DEMO_DATA:
            # Check if observation with this location already exists to avoid duplicates
            result = await session.execute(
                text(
                    "SELECT id FROM observations WHERE location_name = :loc AND pilot_city = :city LIMIT 1"
                ),
                {"loc": obs["location_name"], "city": obs["pilot_city"]},
            )
            if result.first():
                print(f"  ⏭ Skipping {obs['pilot_city']} — already seeded")
                continue

            # Use a demo user ID (first user in the database)
            user_result = await session.execute(
                text("SELECT id FROM users LIMIT 1")
            )
            user_row = user_result.first()
            if not user_row:
                print("  ❌ No users found. Sign in first to create a user.")
                return

            user_id = user_row[0]

            await session.execute(
                text("""
                    INSERT INTO observations (
                        id, user_id, image_url, image_thumbnail_url,
                        description, latitude, longitude, location_name,
                        pilot_city, observed_at, status, confidence_score,
                        routing, top_species, top_confidence, impact_text,
                        impact_headline, pipeline_time_seconds,
                        created_at, updated_at
                    ) VALUES (
                        :id, :user_id, :image_url, :image_thumbnail_url,
                        :description, :latitude, :longitude, :location_name,
                        :pilot_city, :observed_at, :status, :confidence_score,
                        :routing, :top_species, :top_confidence, :impact_text,
                        :impact_headline, :pipeline_time_seconds,
                        NOW(), NOW()
                    )
                """),
                {
                    **obs,
                    "user_id": str(user_id),
                },
            )
            print(f"  ✅ Seeded: {obs['top_species']} in {obs['pilot_city']} ({obs['status']})")

        await session.commit()
        print(f"\n🌱 Demo seeding complete — {len(DEMO_DATA)} observations staged.")


if __name__ == "__main__":
    print("🌊 StreamSense Demo Data Seeder")
    print("=" * 40)
    asyncio.run(seed_demo())
