"""storage_policies

Revision ID: b3f190c4412e
Revises: 190ba874409c
Create Date: 2026-10-03 21:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3f190c4412e'
down_revision: Union[str, Sequence[str], None] = '190ba874409c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add storage policies for observations bucket."""
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access'
            ) THEN
                CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'observations');
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow all uploads to observations'
            ) THEN
                CREATE POLICY "Allow all uploads to observations" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'observations');
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow update to observations'
            ) THEN
                CREATE POLICY "Allow update to observations" ON storage.objects FOR UPDATE USING (bucket_id = 'observations');
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow delete from observations'
            ) THEN
                CREATE POLICY "Allow delete from observations" ON storage.objects FOR DELETE USING (bucket_id = 'observations');
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    """Drop storage policies."""
    op.execute(
        """
        DROP POLICY IF EXISTS "Public Access" ON storage.objects;
        DROP POLICY IF EXISTS "Allow all uploads to observations" ON storage.objects;
        DROP POLICY IF EXISTS "Allow update to observations" ON storage.objects;
        DROP POLICY IF EXISTS "Allow delete from observations" ON storage.objects;
        """
    )
