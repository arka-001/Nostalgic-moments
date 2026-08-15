import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, DateTime, Boolean, func, UUID, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VisitorSession(Base):
    __tablename__ = "visitor_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    ip_address: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    # GeoIP Location Details
    country: Mapped[Optional[str]] = mapped_column(String(100), default="Unknown")
    country_code: Mapped[Optional[str]] = mapped_column(String(10), default="UN")
    city: Mapped[Optional[str]] = mapped_column(String(100), default="Unknown")
    region: Mapped[Optional[str]] = mapped_column(String(100), default="Unknown")
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    isp: Mapped[Optional[str]] = mapped_column(String(255), default="Unknown ISP")

    # Device & Browser Telemetry
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    device: Mapped[Optional[str]] = mapped_column(String(50), default="Desktop")
    browser: Mapped[Optional[str]] = mapped_column(String(50), default="Chrome")
    os: Mapped[Optional[str]] = mapped_column(String(50), default="Windows")

    # Live Activity & Playback
    current_path: Mapped[Optional[str]] = mapped_column(String(255), default="/")
    current_environment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_song_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    current_song_artist: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_playing: Mapped[bool] = mapped_column(Boolean, default=False)

    # Metrics & Timestamps
    total_duration_listened: Mapped[float] = mapped_column(Float, default=0.0)
    total_visits: Mapped[int] = mapped_column(Integer, default=1)
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<VisitorSession ip={self.ip_address} city={self.city} country={self.country} env={self.current_environment}>"
