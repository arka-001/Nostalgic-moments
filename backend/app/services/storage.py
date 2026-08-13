import os
import uuid
import logging
from typing import Tuple, Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Default buckets for Nostalgic Music Platform
BUCKET_MUSIC = "music"
BUCKET_COVERS = "covers"
BUCKET_BACKGROUNDS = "backgrounds"
BUCKET_THUMBNAILS = "thumbnails"

ALL_BUCKETS = [BUCKET_MUSIC, BUCKET_COVERS, BUCKET_BACKGROUNDS, BUCKET_THUMBNAILS]


class StorageService:
    """Supabase Storage manager with automatic bucket initialization & local fallback."""

    def __init__(self):
        self.supabase: Optional[Client] = None
        self.use_supabase = False
        self._init_supabase()

    def _init_supabase(self):
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                self.supabase = create_client(
                    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
                )
                self.use_supabase = True
                logger.info(f"Supabase Storage client initialized for {settings.SUPABASE_URL}")
                self._ensure_buckets_exist()
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase Storage client: {e}. Falling back to local storage.")
                self.use_supabase = False
        else:
            logger.info("Supabase Storage credentials not configured. Operating in local storage fallback mode.")
            self.use_supabase = False

    def _ensure_buckets_exist(self):
        """Ensure all required buckets exist in Supabase Storage."""
        if not self.supabase or not self.use_supabase:
            return

        try:
            existing_buckets = self.supabase.storage.list_buckets()
            existing_names = {b.name for b in existing_buckets} if existing_buckets else set()

            for bucket_name in ALL_BUCKETS:
                if bucket_name not in existing_names:
                    try:
                        logger.info(f"Creating Supabase Storage bucket: '{bucket_name}'...")
                        self.supabase.storage.create_bucket(
                            bucket_name,
                            options={"public": True, "file_size_limit": 52428800}  # 50MB limit
                        )
                    except Exception as err:
                        logger.debug(f"Bucket '{bucket_name}' creation note: {err}")
        except Exception as e:
            logger.warning(f"Could not verify Supabase Storage buckets: {e}")

    async def upload_file(
        self, bucket: str, file_bytes: bytes, original_filename: str, content_type: str
    ) -> Tuple[str, str]:
        """
        Upload file to Supabase Storage bucket (or local storage fallback).
        Returns tuple of (public_url, safe_storage_filename).
        """
        # Generate safe unique filename
        ext = os.path.splitext(original_filename)[1].lower() or ""
        unique_name = f"{uuid.uuid4().hex}{ext}"

        if self.use_supabase and self.supabase:
            try:
                # Ensure bucket exists or created
                logger.info(f"Uploading file '{unique_name}' to Supabase Storage bucket '{bucket}'...")
                res = self.supabase.storage.from_(bucket).upload(
                    path=unique_name,
                    file=file_bytes,
                    file_options={"content-type": content_type, "upsert": "true"}
                )

                # Get public URL
                public_url = self.supabase.storage.from_(bucket).get_public_url(unique_name)
                logger.info(f"File uploaded successfully to Supabase Storage: {public_url}")
                return public_url, unique_name
            except Exception as e:
                logger.error(f"Supabase Storage upload error: {e}. Falling back to local storage.")

        # Local storage fallback handler
        upload_dir = os.path.join("uploads", bucket)
        os.makedirs(upload_dir, exist_ok=True)
        local_file_path = os.path.join(upload_dir, unique_name)

        with open(local_file_path, "wb") as f:
            f.write(file_bytes)

        # Local static media URL
        public_url = f"/uploads/{bucket}/{unique_name}"
        return public_url, unique_name


storage_service = StorageService()
