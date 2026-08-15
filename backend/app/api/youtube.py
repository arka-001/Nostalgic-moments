import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from app.api.deps import get_db_session, get_current_admin
from app.models.admin import AdminUser
from app.models.category import Category
from app.models.youtube_playlist import YouTubePlaylist
from app.models.category_song import CategorySong
from app.models.song import Song
from app.models.system_setting import SystemSetting
from app.core.encryption import mask_api_key
from app.services.youtube import (
    extract_playlist_id,
    get_active_youtube_config,
    save_youtube_config,
    test_youtube_api_connection,
    import_or_sync_youtube_playlist,
)
from app.schemas.youtube import (
    YouTubeSettingsResponse,
    YouTubeSettingsUpdate,
    YouTubeConnectionTestResponse,
    YouTubePlaylistCreate,
    YouTubePlaylistUpdate,
    YouTubePlaylistResponse,
    YouTubeImportResult,
)

router = APIRouter()


# --- YouTube Settings Endpoints ---

@router.get(
    "/admin/youtube/settings",
    response_model=YouTubeSettingsResponse,
    summary="Admin: Get YouTube Integration Settings",
)
async def get_youtube_settings(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieve YouTube integration status and masked API key (never returns raw secret)."""
    is_enabled, active_key = await get_active_youtube_config(db)
    
    # Get last updated timestamp
    key_res = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "youtube_api_key")
    )
    key_row = key_res.scalars().first()

    return YouTubeSettingsResponse(
        is_enabled=is_enabled,
        is_configured=bool(active_key),
        masked_key=mask_api_key(active_key) if active_key else "Not Configured",
        updated_at=key_row.updated_at if key_row else None,
    )


@router.patch(
    "/admin/youtube/settings",
    response_model=YouTubeSettingsResponse,
    summary="Admin: Update YouTube Integration Settings",
)
async def update_youtube_settings(
    settings_in: YouTubeSettingsUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Update YouTube integration toggle and/or securely store encrypted API key."""
    await save_youtube_config(
        db, is_enabled=settings_in.is_enabled, api_key=settings_in.api_key
    )
    return await get_youtube_settings(current_admin=current_admin, db=db)


@router.post(
    "/admin/youtube/test",
    response_model=YouTubeConnectionTestResponse,
    summary="Admin: Test YouTube API Connection",
)
async def test_youtube_connection(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Validate server-side YouTube API key with minimal test call."""
    _, active_key = await get_active_youtube_config(db)
    if not active_key:
        return YouTubeConnectionTestResponse(
            success=False,
            message="No YouTube API key configured. Please configure an API key first.",
        )

    success, message = await test_youtube_api_connection(active_key)
    return YouTubeConnectionTestResponse(success=success, message=message)


# --- YouTube Playlists Management ---

@router.get(
    "/admin/youtube/playlists",
    response_model=List[YouTubePlaylistResponse],
    summary="Admin: List YouTube Playlists",
)
async def list_youtube_playlists(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """List all configured YouTube playlists with category names and song counts."""
    query = (
        select(YouTubePlaylist)
        .options(selectinload(YouTubePlaylist.category))
        .order_by(YouTubePlaylist.created_at.desc())
    )
    result = await db.execute(query)
    playlists = result.scalars().all()

    resp: List[YouTubePlaylistResponse] = []
    for pl in playlists:
        # Calculate active song count for this category from YouTube
        count_res = await db.execute(
            select(func.count(CategorySong.id))
            .join(Song, CategorySong.song_id == Song.id)
            .where(
                CategorySong.category_id == pl.category_id,
                Song.source_type == "youtube",
            )
        )
        song_count = count_res.scalar() or 0

        resp.append(
            YouTubePlaylistResponse(
                id=pl.id,
                playlist_id=pl.playlist_id,
                title=pl.title,
                description=pl.description,
                thumbnail_url=pl.thumbnail_url,
                category_id=pl.category_id,
                category_name=pl.category.name if pl.category else None,
                category_slug=pl.category.slug if pl.category else None,
                song_count=song_count,
                is_active=pl.is_active,
                last_synced_at=pl.last_synced_at,
                created_at=pl.created_at,
                updated_at=pl.updated_at,
            )
        )

    return resp


@router.post(
    "/admin/youtube/playlists",
    response_model=YouTubeImportResult,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Add & Import YouTube Playlist",
)
async def add_and_import_youtube_playlist(
    playlist_in: YouTubePlaylistCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Add a new YouTube playlist to an environment and trigger initial import."""
    # 1. Validate YouTube integration config
    is_enabled, active_key = await get_active_youtube_config(db)
    if not is_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="YouTube integration is currently disabled in settings.",
        )
    if not active_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="YouTube API key is not configured. Please configure it in YouTube Settings.",
        )

    # 2. Extract and validate Playlist ID
    playlist_id = extract_playlist_id(playlist_in.url_or_id)
    if not playlist_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid YouTube Playlist URL or ID provided.",
        )

    # 3. Verify category exists
    cat_res = await db.execute(
        select(Category).where(Category.id == playlist_in.category_id)
    )
    category = cat_res.scalars().first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target category environment not found.",
        )

    # 4. Check if playlist already exists for this category
    existing_pl_res = await db.execute(
        select(YouTubePlaylist).where(
            YouTubePlaylist.playlist_id == playlist_id,
            YouTubePlaylist.category_id == playlist_in.category_id,
        )
    )
    existing_pl = existing_pl_res.scalars().first()

    if existing_pl:
        playlist_obj = existing_pl
    else:
        playlist_obj = YouTubePlaylist(
            playlist_id=playlist_id,
            title="Importing YouTube Playlist...",
            category_id=playlist_in.category_id,
            is_active=playlist_in.is_active,
        )
        db.add(playlist_obj)
        await db.flush()

    # 5. Execute import & sync
    try:
        result = await import_or_sync_youtube_playlist(
            db, playlist_obj, active_key
        )
        return result
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"YouTube import failed: {str(e)}",
        )


@router.get(
    "/admin/youtube/playlists/{playlist_id}",
    response_model=YouTubePlaylistResponse,
    summary="Admin: Get YouTube Playlist Details",
)
async def get_youtube_playlist_detail(
    playlist_id: uuid.UUID,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieve details of a configured YouTube playlist."""
    result = await db.execute(
        select(YouTubePlaylist)
        .options(selectinload(YouTubePlaylist.category))
        .where(YouTubePlaylist.id == playlist_id)
    )
    pl = result.scalars().first()
    if not pl:
        raise HTTPException(status_code=404, detail="YouTube playlist not found")

    count_res = await db.execute(
        select(func.count(CategorySong.id))
        .join(Song, CategorySong.song_id == Song.id)
        .where(
            CategorySong.category_id == pl.category_id,
            Song.source_type == "youtube",
        )
    )
    song_count = count_res.scalar() or 0

    return YouTubePlaylistResponse(
        id=pl.id,
        playlist_id=pl.playlist_id,
        title=pl.title,
        description=pl.description,
        thumbnail_url=pl.thumbnail_url,
        category_id=pl.category_id,
        category_name=pl.category.name if pl.category else None,
        category_slug=pl.category.slug if pl.category else None,
        song_count=song_count,
        is_active=pl.is_active,
        last_synced_at=pl.last_synced_at,
        created_at=pl.created_at,
        updated_at=pl.updated_at,
    )


@router.post(
    "/admin/youtube/playlists/{playlist_id}/sync",
    response_model=YouTubeImportResult,
    summary="Admin: Sync YouTube Playlist",
)
async def sync_youtube_playlist(
    playlist_id: uuid.UUID,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Synchronize an existing YouTube playlist with YouTube Data API."""
    # Validate YouTube integration config
    is_enabled, active_key = await get_active_youtube_config(db)
    if not is_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="YouTube integration is currently disabled in settings.",
        )
    if not active_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="YouTube API key is not configured.",
        )

    result = await db.execute(
        select(YouTubePlaylist).where(YouTubePlaylist.id == playlist_id)
    )
    pl = result.scalars().first()
    if not pl:
        raise HTTPException(status_code=404, detail="YouTube playlist not found")

    try:
        sync_result = await import_or_sync_youtube_playlist(db, pl, active_key)
        return sync_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sync failed: {str(e)}",
        )


@router.patch(
    "/admin/youtube/playlists/{playlist_id}",
    response_model=YouTubePlaylistResponse,
    summary="Admin: Update YouTube Playlist Metadata/Status",
)
async def update_youtube_playlist(
    playlist_id: uuid.UUID,
    playlist_in: YouTubePlaylistUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Update title, active status, or target category of a YouTube playlist."""
    result = await db.execute(
        select(YouTubePlaylist).where(YouTubePlaylist.id == playlist_id)
    )
    pl = result.scalars().first()
    if not pl:
        raise HTTPException(status_code=404, detail="YouTube playlist not found")

    update_data = playlist_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(pl, field, val)

    await db.commit()
    await db.refresh(pl)
    return await get_youtube_playlist_detail(playlist_id=playlist_id, current_admin=current_admin, db=db)


@router.delete(
    "/admin/youtube/playlists/{playlist_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: Delete YouTube Playlist",
)
async def delete_youtube_playlist(
    playlist_id: uuid.UUID,
    detach_songs: bool = True,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Delete a YouTube playlist record and detach its songs from the environment.
    Global Song records are preserved if referenced in other environments.
    """
    result = await db.execute(
        select(YouTubePlaylist).where(YouTubePlaylist.id == playlist_id)
    )
    pl = result.scalars().first()
    if not pl:
        raise HTTPException(status_code=404, detail="YouTube playlist not found")

    if detach_songs:
        # Detach CategorySong entries for YouTube songs in this category
        cat_songs = await db.execute(
            select(CategorySong)
            .join(Song, CategorySong.song_id == Song.id)
            .where(
                CategorySong.category_id == pl.category_id,
                Song.source_type == "youtube",
            )
        )
        for cs in cat_songs.scalars().all():
            await db.delete(cs)

    await db.delete(pl)
    await db.commit()
    return None
