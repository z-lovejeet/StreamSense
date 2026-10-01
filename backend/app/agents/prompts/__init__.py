"""StreamSense AI agent system prompts — exact copies from DOC-05 and DOC-08."""

from app.agents.prompts.vision_config import (
    TARGET_TAXA,
    TAXA_COMMON_NAMES,
    BMWP_SCORES,
    DISEASE_VECTOR_TAXA,
    get_quality_indication,
)
from app.agents.prompts.description_prompt import DESCRIPTION_SYSTEM_PROMPT
from app.agents.prompts.metadata_prompt import METADATA_SYSTEM_PROMPT
from app.agents.prompts.quality_prompt import QUALITY_SYSTEM_PROMPT
from app.agents.prompts.fhir_prompt import FHIR_TRANSLATOR_SYSTEM_PROMPT
from app.agents.prompts.impact_prompt import IMPACT_SYSTEM_PROMPT
from app.agents.prompts.expert_brief_prompt import EXPERT_BRIEF_SYSTEM_PROMPT

__all__ = [
    "TARGET_TAXA",
    "TAXA_COMMON_NAMES",
    "BMWP_SCORES",
    "DISEASE_VECTOR_TAXA",
    "get_quality_indication",
    "DESCRIPTION_SYSTEM_PROMPT",
    "METADATA_SYSTEM_PROMPT",
    "QUALITY_SYSTEM_PROMPT",
    "FHIR_TRANSLATOR_SYSTEM_PROMPT",
    "IMPACT_SYSTEM_PROMPT",
    "EXPERT_BRIEF_SYSTEM_PROMPT",
]
