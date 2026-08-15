from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class HeartbeatRequest(BaseModel):
    session_id: str
    current_path: Optional[str] = "/"
    current_environment: Optional[str] = None
    current_song_title: Optional[str] = None
    current_song_artist: Optional[str] = None
    is_playing: bool = False
    duration_increment: Optional[float] = 0.0


class VisitorSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    ip_address: str
    country: Optional[str] = "Unknown"
    country_code: Optional[str] = "UN"
    city: Optional[str] = "Unknown"
    region: Optional[str] = "Unknown"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    isp: Optional[str] = "Unknown ISP"
    device: Optional[str] = "Desktop"
    browser: Optional[str] = "Chrome"
    os: Optional[str] = "Windows"
    current_path: Optional[str] = "/"
    current_environment: Optional[str] = None
    current_song_title: Optional[str] = None
    current_song_artist: Optional[str] = None
    is_playing: bool = False
    is_online: bool = False
    is_blocked: bool = False
    total_duration_listened: float = 0.0
    total_visits: int = 1
    first_seen_at: datetime
    last_seen_at: datetime


class GeoDistributionItem(BaseModel):
    name: str
    code: Optional[str] = None
    count: int
    percentage: float


class GeoMapPoint(BaseModel):
    city: str
    country: str
    country_code: str
    latitude: float
    longitude: float
    active_listeners: int
    total_sessions: int


class BlockedIPResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ip_address: str
    reason: Optional[str] = None
    is_active: bool = True
    blocked_at: datetime
    expires_at: Optional[datetime] = None


class BlockedIPCreate(BaseModel):
    ip_address: str
    reason: Optional[str] = "Suspicious traffic / Admin blocked"
    expires_at: Optional[datetime] = None


class VisitorTelemetrySummary(BaseModel):
    live_online_count: int
    total_unique_visitors: int
    total_countries_reached: int
    top_countries: List[GeoDistributionItem]
    top_cities: List[GeoDistributionItem]
    device_breakdown: List[GeoDistributionItem]
    browser_breakdown: List[GeoDistributionItem]
    geo_map_points: List[GeoMapPoint] = []
    visitors: List[VisitorSessionResponse]
    total_records: int
