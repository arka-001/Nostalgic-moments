import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class YouTubeSettingsResponse(BaseModel):
    is_enabled: bool = True
    is_configured: bool = False
    masked_key: str = "Not Configured"
    updated_at: Optional[datetime] = None


class YouTubeSettingsUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    api_key: Optional[str] = Field(None, description="Raw YouTube API key string to be encrypted")


class YouTubeConnectionTestResponse(BaseModel):
    success: bool
    message: str


class YouTubePlaylistCreate(BaseModel):
    url_or_id: str = Field(..., description="YouTube playlist URL or raw playlist ID")
    category_id: uuid.UUID
    is_active: bool = True


class YouTubePlaylistUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class YouTubePlaylistResponse(BaseModel):
    id: uuid.UUID
    playlist_id: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category_id: uuid.UUID
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    song_count: int = 0
    is_active: bool = True
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class YouTubeImportResult(BaseModel):
    playlist_title: str
    playlist_id: str
    category: str
    total_items: int
    imported: int
    already_existing: int
    skipped: int
    order_updated: bool = True
    skipped_reasons: List[str] = []
