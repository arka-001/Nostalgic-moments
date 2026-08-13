import uuid
from datetime import datetime
from sqlalchemy import Integer, DateTime, func, UUID, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CategorySong(Base):
    __tablename__ = "category_songs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    song_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("songs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    category: Mapped["Category"] = relationship(
        "Category", back_populates="category_songs"
    )
    song: Mapped["Song"] = relationship(
        "Song", back_populates="category_songs"
    )

    __table_args__ = (
        UniqueConstraint("category_id", "song_id", name="uq_category_song"),
    )

    def __repr__(self) -> str:
        return f"<CategorySong category_id={self.category_id} song_id={self.song_id} sort_order={self.sort_order}>"
