"""StreamSense Supabase Storage service — handles image uploads/downloads.

Wraps the Supabase Storage API for uploading observation images,
generating signed URLs, and managing thumbnails.
"""

import uuid
from datetime import timedelta

import httpx

from app.config import settings


class StorageService:
    """Thin wrapper around Supabase Storage REST API.

    Bucket: 'observations' (must be created manually in Supabase dashboard).
    File structure: {user_id}/{observation_id}/{filename}
    """

    BUCKET = "observations"
    BASE_URL = f"{settings.supabase_url}/storage/v1"

    def __init__(self) -> None:
        self._headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
        }

    async def upload_image(
        self,
        file_bytes: bytes,
        user_id: uuid.UUID,
        observation_id: uuid.UUID,
        filename: str,
        content_type: str = "image/jpeg",
    ) -> str:
        """Upload an image to Supabase Storage.

        Returns the storage path (not a full URL).
        """
        path = f"{user_id}/{observation_id}/{filename}"
        url = f"{self.BASE_URL}/object/{self.BUCKET}/{path}"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                content=file_bytes,
                headers={
                    **self._headers,
                    "Content-Type": content_type,
                    "x-upsert": "true",
                },
            )
            response.raise_for_status()

        return path

    def get_public_url(self, path: str) -> str:
        """Get the public URL for a stored file."""
        return f"{self.BASE_URL}/object/public/{self.BUCKET}/{path}"

    async def get_signed_url(
        self,
        path: str,
        expires_in: int = 3600,
    ) -> str:
        """Generate a signed URL for temporary access.

        Args:
            path: Storage path returned by upload_image.
            expires_in: Seconds until the URL expires (default: 1 hour).
        """
        url = f"{self.BASE_URL}/object/sign/{self.BUCKET}/{path}"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=self._headers,
                json={"expiresIn": expires_in},
            )
            response.raise_for_status()
            data = response.json()

        return f"{settings.supabase_url}/storage/v1{data['signedURL']}"

    async def delete_file(self, path: str) -> None:
        """Delete a file from storage."""
        url = f"{self.BASE_URL}/object/{self.BUCKET}"

        async with httpx.AsyncClient() as client:
            response = await client.delete(
                url,
                headers=self._headers,
                json={"prefixes": [path]},
            )
            response.raise_for_status()


# Singleton instance
storage_service = StorageService()
