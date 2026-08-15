import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, DateTime, func, UUID, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_type: Mapped[str] = mapped_column(String(50), default="play", index=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    category_slug: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    category_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    song_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    song_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    song_artist: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    duration_listened: Mapped[Optional[float]] = mapped_column(Float, default=0.0)

    # IP & Geolocation enrichment
    session_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    device: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    browser: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<AnalyticsEvent type={self.event_type} song={self.song_title} category={self.category_slug} ip={self.ip_address}>"
