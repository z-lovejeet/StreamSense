"""StreamSense configuration — Pydantic Settings loading all environment variables.

Centralizes all config into a single validated Settings object.
Every backend module imports `settings` from here instead of reading os.environ directly.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from backend/.env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──
    database_url: str

    # ── Supabase ──
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = ""  # Supabase Dashboard → Settings → API → JWT Secret

    # ── AI: Gemini ──
    gemini_api_key: str
    gemini_model_chain_dev: str = (
        "gemini-3.5-flash-lite,gemini-3.5-flash,gemini-3.6-flash,"
        "gemini-3.7-flash,gemini-3.8-flash"
    )
    gemini_model_chain_prod: str = (
        "gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,"
        "gemini-3.5-flash,gemini-3.5-flash-lite"
    )
    gemini_rpd_lite: int = 500
    gemini_rpd_non_lite: int = 16

    # ── AI: Groq ──
    groq_api_key: str
    groq_model_primary: str = "qwen/qwen3.8-27b"
    groq_model_fallback_1: str = "openai/gpt-oss-120b"
    groq_model_fallback_2: str = "openai/gpt-oss-20b"

    # ── External APIs ──
    openweathermap_api_key: str
    fhir_sandbox_url: str = "https://sandbox.hl7europe.eu/oneaquahealth/fhir"
    gbif_api_url: str = "https://api.gbif.org/v1"

    # ── Server ──
    app_env: str = "dev"
    frontend_url: str = "http://localhost:3000"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    @property
    def gemini_model_chain(self) -> list[str]:
        """Return the active Gemini model chain based on APP_ENV."""
        chain_str = (
            self.gemini_model_chain_prod
            if self.app_env == "prod"
            else self.gemini_model_chain_dev
        )
        return [m.strip() for m in chain_str.split(",")]


settings = Settings()
