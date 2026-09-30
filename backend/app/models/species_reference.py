"""SpeciesReference model — curated reference dataset of indicator taxa.

Static reference table seeded on deployment with 15 macroinvertebrate taxa.
Contains BMWP scores, water quality indications, ecological descriptions,
educational text for citizen UI, and One Health significance.
Not modified by the running application — only by seed scripts.
"""

import uuid

from sqlalchemy import Boolean, Column, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class SpeciesReference(Base):
    """Curated freshwater macroinvertebrate reference with BMWP scoring."""

    __tablename__ = "species_reference"
    __table_args__ = (
        Index("idx_species_taxon", "taxon_name"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    taxon_name = Column(String(255), unique=True, nullable=False)
    common_name = Column(String(255), nullable=False)
    order_name = Column(String(255), nullable=True)
    family_name = Column(String(255), nullable=True)
    bmwp_score = Column(Integer, nullable=False)
    water_quality_indication = Column(String(50), nullable=False)
    is_disease_vector = Column(Boolean, nullable=False, default=False)
    ecological_description = Column(Text, nullable=False)
    educational_text = Column(Text, nullable=False)
    one_health_significance = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    fun_fact = Column(String(500), nullable=True)
    habitat = Column(String(255), nullable=True)
