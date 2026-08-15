import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, func, UUID, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BlockedIP(Base):
    __tablename__ = "blocked_ips"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    ip_address: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255), default="Suspicious activity / Admin block")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    blocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<BlockedIP ip={self.ip_address} is_active={self.is_active}>"
