from typing import List, Optional
from pydantic import BaseModel


class TrackPlayRequest(BaseModel):
    event_type: str = "play"
    category_slug: Optional[str] = None
    category_name: Optional[str] = None
    song_id: Optional[str] = None
    song_title: Optional[str] = None
    song_artist: Optional[str] = None
    duration_listened: Optional[float] = 0.0


class EnvironmentPlayStats(BaseModel):
    slug: str
    name: str
    play_count: int
    percentage: float


class SongPlayStats(BaseModel):
    id: Optional[str] = None
    title: str
    artist: str
    play_count: int
    total_duration_listened: float


class DailyListeningTrend(BaseModel):
    date: str
    plays: int
    hours: float


class HourlyListeningTrend(BaseModel):
    hour: int
    label: str
    plays: int


class AnalyticsOverviewResponse(BaseModel):
    total_plays: int
    total_listening_hours: float
    top_environments: List[EnvironmentPlayStats]
    top_songs: List[SongPlayStats]
    daily_trends: List[DailyListeningTrend]
    hourly_trends: List[HourlyListeningTrend]
