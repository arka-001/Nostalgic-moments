import re
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update

from app.core.config import settings
from app.core.encryption import encrypt_value, decrypt_value, mask_api_key
from app.models.system_setting import SystemSetting
from app.models.youtube_playlist import YouTubePlaylist
from app.models.song import Song
from app.models.category import Category
from app.models.category_song import CategorySong

logger = logging.getLogger(__name__)

YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3"


def extract_playlist_id(url_or_id: str) -> str:
    """Extract YouTube Playlist ID from a URL or raw ID string."""
    cleaned = url_or_id.strip()
    if not cleaned:
        return ""

    # Direct playlist ID (e.g. PLrEnWoR732-DNQnp1kHbiXf_d_rBfP1dZ or OLAK5uy_...)
    if re.match(r"^[A-Za-z0-9_-]{10,60}$", cleaned) and not cleaned.startswith("http"):
        return cleaned

    # Query param list=...
    match = re.search(r"[?&]list=([A-Za-z0-9_-]+)", cleaned)
    if match:
        return match.group(1)

    return cleaned


def parse_iso8601_duration(duration_str: Optional[str]) -> float:
    """Parse ISO 8601 duration string (e.g. PT3M45S, PT1H2M10S, PT52S) into seconds."""
    if not duration_str:
        return 0.0

    pattern = r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
    match = re.match(pattern, duration_str)
    if not match:
        return 0.0

    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    total_seconds = (hours * 3600) + (minutes * 60) + seconds
    return float(total_seconds)


async def get_active_youtube_config(db: AsyncSession) -> Tuple[bool, Optional[str]]:
    """Retrieve active YouTube integration status and decrypted API key."""
    # 1. Check database system_settings
    status_res = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "youtube_enabled")
    )
    status_row = status_res.scalars().first()
    is_enabled = True
    if status_row:
        is_enabled = status_row.value_encrypted == "true"

    key_res = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "youtube_api_key")
    )
    key_row = key_res.scalars().first()
    decrypted_key = None
    if key_row and key_row.value_encrypted:
        decrypted_key = decrypt_value(key_row.value_encrypted)

    # 2. Fallback to settings.YOUTUBE_API_KEY if not configured in DB
    if not decrypted_key and settings.YOUTUBE_API_KEY:
        decrypted_key = settings.YOUTUBE_API_KEY

    return is_enabled, decrypted_key


async def save_youtube_config(
    db: AsyncSession,
    is_enabled: Optional[bool] = None,
    api_key: Optional[str] = None,
) -> None:
    """Save or update YouTube integration settings in database."""
    if is_enabled is not None:
        status_res = await db.execute(
            select(SystemSetting).where(SystemSetting.key == "youtube_enabled")
        )
        status_row = status_res.scalars().first()
        val_str = "true" if is_enabled else "false"
        if status_row:
            status_row.value_encrypted = val_str
            status_row.is_encrypted = False
        else:
            db.add(
                SystemSetting(
                    key="youtube_enabled", value_encrypted=val_str, is_encrypted=False
                )
            )

    if api_key is not None:
        clean_key = api_key.strip()
        key_res = await db.execute(
            select(SystemSetting).where(SystemSetting.key == "youtube_api_key")
        )
        key_row = key_res.scalars().first()
        encrypted_val = encrypt_value(clean_key) if clean_key else None
        if key_row:
            key_row.value_encrypted = encrypted_val
            key_row.is_encrypted = True
        else:
            db.add(
                SystemSetting(
                    key="youtube_api_key",
                    value_encrypted=encrypted_val,
                    is_encrypted=True,
                )
            )

    await db.commit()


async def test_youtube_api_connection(api_key: str) -> Tuple[bool, str]:
    """Perform a minimal test call to YouTube Data API v3."""
    if not api_key:
        return False, "YouTube API key is not configured"

    test_video_id = "dQw4w9WgXcQ"
    url = f"{YOUTUBE_API_BASE_URL}/videos"
    params = {
        "part": "id",
        "id": test_video_id,
        "key": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)

        if response.status_code == 200:
            return True, "YouTube API connection successful"

        # Parse error safely
        error_json = response.json()
        error_msg = (
            error_json.get("error", {}).get("message")
            or f"HTTP status {response.status_code}"
        )
        # Redact raw API key from error message if reflected
        safe_msg = error_msg.replace(api_key, "[REDACTED_KEY]")
        return False, f"YouTube API test failed: {safe_msg}"
    except httpx.TimeoutException:
        return False, "YouTube API request timed out (10s limit)"
    except Exception as e:
        return False, f"Connection error: {str(e)}"


async def fetch_playlist_metadata(playlist_id: str, api_key: str) -> Dict[str, Any]:
    """Retrieve playlist snippet and details."""
    url = f"{YOUTUBE_API_BASE_URL}/playlists"
    params = {
        "part": "snippet,contentDetails",
        "id": playlist_id,
        "key": api_key,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, params=params)

    if response.status_code != 200:
        error_json = response.json()
        error_msg = (
            error_json.get("error", {}).get("message")
            or f"Failed to fetch playlist (Status {response.status_code})"
        )
        raise ValueError(error_msg.replace(api_key, "[REDACTED_KEY]"))

    data = response.json()
    items = data.get("items", [])
    if not items:
        raise ValueError(f"Playlist with ID '{playlist_id}' not found or is private.")

    playlist_item = items[0]
    snippet = playlist_item.get("snippet", {})
    content_details = playlist_item.get("contentDetails", {})
    thumbnails = snippet.get("thumbnails", {})
    thumb_url = (
        thumbnails.get("maxres", {}).get("url")
        or thumbnails.get("standard", {}).get("url")
        or thumbnails.get("high", {}).get("url")
        or thumbnails.get("medium", {}).get("url")
        or thumbnails.get("default", {}).get("url")
    )

    return {
        "playlist_id": playlist_id,
        "title": snippet.get("title", "Untitled Playlist"),
        "description": snippet.get("description", ""),
        "thumbnail_url": thumb_url,
        "item_count": content_details.get("itemCount", 0),
        "channel_title": snippet.get("channelTitle", ""),
    }


async def fetch_all_playlist_videos(
    playlist_id: str, api_key: str
) -> List[Dict[str, Any]]:
    """Retrieve all video items from a YouTube playlist with full pagination."""
    url = f"{YOUTUBE_API_BASE_URL}/playlistItems"
    next_page_token: Optional[str] = None
    all_items: List[Dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=20.0) as client:
        while True:
            params = {
                "part": "snippet,contentDetails",
                "playlistId": playlist_id,
                "maxResults": 50,
                "key": api_key,
            }
            if next_page_token:
                params["pageToken"] = next_page_token

            response = await client.get(url, params=params)
            if response.status_code != 200:
                error_json = response.json()
                error_msg = error_json.get("error", {}).get("message") or f"HTTP {response.status_code}"
                raise ValueError(f"Playlist items error: {error_msg.replace(api_key, '[REDACTED_KEY]')}")

            data = response.json()
            items = data.get("items", [])
            for item in items:
                snippet = item.get("snippet", {})
                resource_id = snippet.get("resourceId", {})
                video_id = resource_id.get("videoId") or item.get("contentDetails", {}).get("videoId")
                title = snippet.get("title", "")
                
                # Check for deleted/private items
                if not video_id or title in ["Private video", "Deleted video"]:
                    continue

                thumbnails = snippet.get("thumbnails", {})
                thumb_url = (
                    thumbnails.get("maxres", {}).get("url")
                    or thumbnails.get("standard", {}).get("url")
                    or thumbnails.get("high", {}).get("url")
                    or thumbnails.get("medium", {}).get("url")
                    or thumbnails.get("default", {}).get("url")
                )

                all_items.append({
                    "video_id": video_id,
                    "title": title,
                    "artist": snippet.get("videoOwnerChannelTitle") or snippet.get("channelTitle") or "YouTube Artist",
                    "thumbnail_url": thumb_url,
                    "position": snippet.get("position", len(all_items)),
                })

            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break

    # Batch fetch video durations and higher quality metadata in chunks of 50
    video_ids = [item["video_id"] for item in all_items]
    video_details_map = await fetch_video_details_batch(video_ids, api_key)

    enriched_items = []
    for item in all_items:
        vid = item["video_id"]
        details = video_details_map.get(vid, {})
        duration = details.get("duration", 0.0)
        
        # Override thumbnail if higher resolution found
        if details.get("thumbnail_url"):
            item["thumbnail_url"] = details["thumbnail_url"]

        item["duration"] = duration
        enriched_items.append(item)

    return enriched_items


async def fetch_video_details_batch(
    video_ids: List[str], api_key: str
) -> Dict[str, Dict[str, Any]]:
    """Batch fetch video details (durations and thumbnails) in chunks of 50."""
    result: Dict[str, Dict[str, Any]] = {}
    if not video_ids:
        return result

    chunk_size = 50
    url = f"{YOUTUBE_API_BASE_URL}/videos"

    async with httpx.AsyncClient(timeout=20.0) as client:
        for i in range(0, len(video_ids), chunk_size):
            chunk = video_ids[i : i + chunk_size]
            params = {
                "part": "contentDetails,snippet",
                "id": ",".join(chunk),
                "key": api_key,
            }
            try:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("items", []):
                        vid = item.get("id")
                        content_details = item.get("contentDetails", {})
                        snippet = item.get("snippet", {})
                        duration_str = content_details.get("duration")
                        duration_sec = parse_iso8601_duration(duration_str)

                        thumbnails = snippet.get("thumbnails", {})
                        best_thumb = (
                            thumbnails.get("maxres", {}).get("url")
                            or thumbnails.get("standard", {}).get("url")
                            or thumbnails.get("high", {}).get("url")
                            or thumbnails.get("medium", {}).get("url")
                            or thumbnails.get("default", {}).get("url")
                        )

                        result[vid] = {
                            "duration": duration_sec,
                            "thumbnail_url": best_thumb,
                        }
            except Exception as e:
                logger.warning(f"Failed to fetch video details chunk: {e}")

    return result


async def import_or_sync_youtube_playlist(
    db: AsyncSession,
    playlist: YouTubePlaylist,
    api_key: str,
) -> Dict[str, Any]:
    """
    Import or sync a YouTube playlist into the database:
    - Fetches current playlist metadata and all videos.
    - Updates YouTubePlaylist record metadata.
    - Reuses existing Song records by youtube_video_id to prevent duplicates.
    - Attaches songs to the chosen category with exact playlist order.
    - Detaches removed videos from CategorySong for this category.
    """
    # 1. Fetch metadata
    meta = await fetch_playlist_metadata(playlist.playlist_id, api_key)
    playlist.title = meta.get("title") or playlist.title
    playlist.description = meta.get("description") or playlist.description
    playlist.thumbnail_url = meta.get("thumbnail_url") or playlist.thumbnail_url

    # 2. Fetch all playlist video items
    videos = await fetch_all_playlist_videos(playlist.playlist_id, api_key)

    total_items = len(videos)
    imported_count = 0
    existing_count = 0
    skipped_count = 0
    skipped_reasons: List[str] = []

    # Get category
    cat_res = await db.execute(select(Category).where(Category.id == playlist.category_id))
    category = cat_res.scalars().first()
    category_name = category.name if category else "Environment"

    # Track processed song IDs for this sync
    synced_song_ids = []

    for idx, vid_info in enumerate(videos):
        video_id = vid_info["video_id"]
        title = vid_info["title"]
        artist = vid_info["artist"]
        duration = vid_info.get("duration", 0.0)
        thumbnail = vid_info.get("thumbnail_url")
        youtube_url = f"https://www.youtube.com/watch?v={video_id}"

        # Check duplicate song globally by youtube_video_id
        song_res = await db.execute(
            select(Song).where(Song.youtube_video_id == video_id)
        )
        existing_song = song_res.scalars().first()

        if existing_song:
            existing_count += 1
            song = existing_song
            # Update metadata if needed
            if title and song.title != title:
                song.title = title
            if artist and song.artist != artist:
                song.artist = artist
            if thumbnail and not song.cover_url:
                song.cover_url = thumbnail
            if duration and not song.duration:
                song.duration = duration
        else:
            imported_count += 1
            song = Song(
                title=title,
                artist=artist,
                duration=duration,
                cover_url=thumbnail,
                source_type="youtube",
                youtube_video_id=video_id,
                youtube_url=youtube_url,
                is_active=True,
            )
            db.add(song)
            await db.flush()  # Generate song.id

        synced_song_ids.append(song.id)

        # Upsert or update CategorySong association with sort_order
        cat_song_res = await db.execute(
            select(CategorySong).where(
                CategorySong.category_id == playlist.category_id,
                CategorySong.song_id == song.id,
            )
        )
        cat_song = cat_song_res.scalars().first()
        sort_order = idx + 1

        if cat_song:
            cat_song.sort_order = sort_order
        else:
            cat_song = CategorySong(
                category_id=playlist.category_id,
                song_id=song.id,
                sort_order=sort_order,
            )
            db.add(cat_song)

    # Clean up songs that were removed from the YouTube playlist
    # We only remove CategorySong relationship for this category if the song is a youtube song
    if synced_song_ids:
        # Find category_songs in this category that belong to YouTube songs not in synced_song_ids
        all_yt_cat_songs = await db.execute(
            select(CategorySong)
            .join(Song, CategorySong.song_id == Song.id)
            .where(
                CategorySong.category_id == playlist.category_id,
                Song.source_type == "youtube",
                CategorySong.song_id.not_in(synced_song_ids),
            )
        )
        for old_cs in all_yt_cat_songs.scalars().all():
            await db.delete(old_cs)

    playlist.last_synced_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(playlist)

    return {
        "playlist_title": playlist.title,
        "playlist_id": playlist.playlist_id,
        "category": category_name,
        "total_items": total_items,
        "imported": imported_count,
        "already_existing": existing_count,
        "skipped": skipped_count,
        "order_updated": True,
        "skipped_reasons": skipped_reasons,
    }
