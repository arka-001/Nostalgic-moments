import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from app.api.deps import get_current_admin
from app.models.admin import AdminUser
from app.schemas.upload import FileUploadResponse
from app.services.storage import (
    storage_service,
    BUCKET_MUSIC,
    BUCKET_COVERS,
    BUCKET_BACKGROUNDS,
    BUCKET_THUMBNAILS,
)

router = APIRouter()

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".aac", ".m4a", ".flac"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".mp4", ".webm"}

MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post(
    "/uploads/audio",
    response_model=FileUploadResponse,
    summary="Upload MP3 / Audio File to Supabase Storage",
)
async def upload_audio(
    file: UploadFile = File(...),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Validate MP3/audio file and upload to Supabase Storage ('music' bucket)."""
    filename = file.filename or "audio.mp3"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio extension '{ext}'. Allowed extensions: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}",
        )

    content = await file.read()
    file_size = len(content)

    if file_size > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Audio file size exceeds maximum limit of {MAX_AUDIO_SIZE // (1024 * 1024)}MB",
        )

    content_type = file.content_type or "audio/mpeg"

    # Upload to Supabase Storage bucket 'music'
    public_url, stored_filename = await storage_service.upload_file(
        bucket=BUCKET_MUSIC,
        file_bytes=content,
        original_filename=filename,
        content_type=content_type,
    )

    return FileUploadResponse(
        url=public_url,
        filename=stored_filename,
        content_type=content_type,
        size=file_size,
    )


@router.post(
    "/uploads/image",
    response_model=FileUploadResponse,
    summary="Upload Cover or Background Image/Video to Supabase Storage",
)
async def upload_image(
    file: UploadFile = File(...),
    bucket: str = Query("covers", enum=["covers", "backgrounds", "thumbnails"]),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Validate artwork/background file and upload to Supabase Storage ('covers', 'backgrounds', 'thumbnails')."""
    filename = file.filename or "image.jpg"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image/video extension '{ext}'. Allowed extensions: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}",
        )

    content = await file.read()
    file_size = len(content)

    if file_size > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Media file size exceeds maximum limit of {MAX_IMAGE_SIZE // (1024 * 1024)}MB",
        )

    content_type = file.content_type or "image/jpeg"

    # Upload to specified Supabase Storage bucket
    public_url, stored_filename = await storage_service.upload_file(
        bucket=bucket,
        file_bytes=content,
        original_filename=filename,
        content_type=content_type,
    )

    return FileUploadResponse(
        url=public_url,
        filename=stored_filename,
        content_type=content_type,
        size=file_size,
    )
