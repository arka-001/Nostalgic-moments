import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class SongBase(BaseModel):
    title: str = Field(..., max_length=255, example="Pal Pal Dil Ke Paas")
    artist: str = Field(..., max_length=255, example="Kishore Kumar")
    album: Optional[str] = Field(None, max_length=255)
    duration: Optional[float] = None
    audio_url: Optional[str] = None
    cover_url: Optional[str] = None
    is_active: bool = True


class SongCreate(SongBase):
    category_ids: Optional[List[uuid.UUID]] = []


class SongUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    duration: Optional[float] = None
    audio_url: Optional[str] = None
    cover_url: Optional[str] = None
    is_active: Optional[bool] = None
    category_ids: Optional[List[uuid.UUID]] = None


class SongResponse(SongBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlaylistSongResponse(SongResponse):
    sort_order: int = 0


class CategoryDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    tagline: Optional[str] = None
    thumbnail_url: Optional[str] = None
    background_url: Optional[str] = None
    background_type: str
    theme_config: Optional[dict] = None
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
    songs: List[PlaylistSongResponse] = []

    class Config:
        from_attributes = True
