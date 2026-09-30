"""StreamSense seed script — populates species_reference and demo researcher.

Run: cd backend && uv run python seed/run_seed.py
Idempotent: uses INSERT ... ON CONFLICT DO NOTHING for species,
            and upserts the demo researcher by email.
"""

import asyncio
import json
import uuid
from pathlib import Path

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Bootstrap dotenv before importing app modules
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.models.species_reference import SpeciesReference
from app.models.user import User
from app.models.enums import UserRole

SEED_DIR = Path(__file__).resolve().parent


async def seed_species(session: AsyncSession) -> int:
    """Insert 15 species reference rows. Skip duplicates by taxon_name."""
    data = json.loads((SEED_DIR / "species_reference.json").read_text())
    inserted = 0
    for item in data:
        # Check if species already exists
        existing = await session.execute(
            select(SpeciesReference).where(
                SpeciesReference.taxon_name == item["taxon_name"]
            )
        )
        if existing.scalar_one_or_none() is None:
            species = SpeciesReference(id=uuid.uuid4(), **item)
            session.add(species)
            inserted += 1
    return inserted


async def seed_demo_researcher(session: AsyncSession) -> bool:
    """Upsert the demo researcher account."""
    data = json.loads((SEED_DIR / "demo_researcher.json").read_text())
    existing = await session.execute(
        select(User).where(User.email == data["email"])
    )
    if existing.scalar_one_or_none() is None:
        user = User(
            id=uuid.uuid4(),
            email=data["email"],
            full_name=data["full_name"],
            role=UserRole(data["role"]),
            city=data["city"],
        )
        session.add(user)
        return True
    return False


async def main() -> None:
    """Run all seed operations."""
    engine = create_async_engine(
        settings.database_url,
        connect_args={
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0,
        },
    )
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        async with session.begin():
            species_count = await seed_species(session)
            researcher_created = await seed_demo_researcher(session)

    await engine.dispose()

    print(f"✅ Seed complete:")
    print(f"   Species inserted: {species_count}/15")
    print(f"   Demo researcher: {'created' if researcher_created else 'already exists'}")


if __name__ == "__main__":
    asyncio.run(main())
