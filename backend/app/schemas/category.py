import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100, example="Running Bus")
    slug: str = Field(..., max_length=100, example="running-bus")
    description: Optional[str] = None
    tagline: Optional[str] = None
    thumbnail_url: Optional[str] = None
    background_url: Optional[str] = None
    background_type: str = Field(default="image", example="image")  # image, video, animation
    theme_config: Optional[Dict[str, Any]] = None
    is_active: bool = True
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    tagline: Optional[str] = None
    thumbnail_url: Optional[str] = None
    background_url: Optional[str] = None
    background_type: Optional[str] = None
    theme_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    song_count: Optional[int] = 0

    class Config:
        from_attributes = True


class CategorySongOrderItem(BaseModel):
    song_id: uuid.UUID
    sort_order: int


class CategorySongReorderRequest(BaseModel):
    items: List[CategorySongOrderItem]
