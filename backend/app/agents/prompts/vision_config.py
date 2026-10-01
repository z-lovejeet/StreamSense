"""Vision Agent configuration — curated taxa list, BMWP scores, and reference data."""

TARGET_TAXA = [
    "Ephemeroptera",
    "Plecoptera",
    "Trichoptera",
    "Baetidae",
    "Hydropsychidae",
    "Heptageniidae",
    "Leuctridae",
    "Gammaridae",
    "Asellidae",
    "Chironomidae",
    "Oligochaeta",
    "Tubificidae",
    "Culicidae",
    "Simuliidae",
    "Gastropoda",
]

TAXA_COMMON_NAMES = {
    "Ephemeroptera": "Mayfly nymph",
    "Plecoptera": "Stonefly nymph",
    "Trichoptera": "Caddisfly larva",
    "Chironomidae": "Midge larva",
    "Culicidae": "Mosquito larva",
    "Simuliidae": "Blackfly larva",
    "Gammaridae": "Freshwater shrimp",
    "Asellidae": "Water louse",
    "Gastropoda": "Freshwater snail",
    "Oligochaeta": "Aquatic worm",
    "Baetidae": "Small mayfly nymph",
    "Hydropsychidae": "Net-spinning caddisfly",
    "Heptageniidae": "Flat-headed mayfly",
    "Leuctridae": "Rolled-wing stonefly",
    "Tubificidae": "Sludge worm",
}

BMWP_SCORES = {
    "Ephemeroptera": 10, "Plecoptera": 10, "Trichoptera": 8,
    "Heptageniidae": 10, "Leuctridae": 10, "Baetidae": 4,
    "Hydropsychidae": 5, "Gammaridae": 6, "Asellidae": 3,
    "Chironomidae": 2, "Oligochaeta": 1, "Tubificidae": 1,
    "Culicidae": 0, "Simuliidae": 5, "Gastropoda": 3,
}

DISEASE_VECTOR_TAXA = {"Culicidae", "Simuliidae"}


def get_quality_indication(taxon: str) -> str:
    """Map a taxon to a water quality indication based on BMWP score."""
    score = BMWP_SCORES.get(taxon, 0)
    if score >= 7:
        return "good"
    if score >= 4:
        return "moderate"
    if score >= 1:
        return "poor"
    return "disease_vector" if taxon in DISEASE_VECTOR_TAXA else "unknown"
