import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Float, DateTime, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    artist: Mapped[str] = mapped_column(String(255), nullable=False)
    album: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    duration: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    audio_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    category_songs: Mapped[List["CategorySong"]] = relationship(
        "CategorySong",
        back_populates="song",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Song title={self.title} artist={self.artist}>"
