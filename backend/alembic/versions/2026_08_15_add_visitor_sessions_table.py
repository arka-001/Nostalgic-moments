"""Add visitor_sessions table and IP/Geo columns to analytics_events

Revision ID: 8d92ef1b301c
Revises: 4ea52861c890
Create Date: 2026-08-15 01:17:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d92ef1b301c'
down_revision: Union[str, None] = '4ea52861c890'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. Create visitor_sessions table if not exists
    if "visitor_sessions" not in existing_tables:
        op.create_table(
            "visitor_sessions",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
            sa.Column("session_id", sa.String(100), nullable=False),
            sa.Column("ip_address", sa.String(64), nullable=False),
            sa.Column("country", sa.String(100), nullable=True),
            sa.Column("country_code", sa.String(10), nullable=True),
            sa.Column("city", sa.String(100), nullable=True),
            sa.Column("region", sa.String(100), nullable=True),
            sa.Column("latitude", sa.Float(), nullable=True),
            sa.Column("longitude", sa.Float(), nullable=True),
            sa.Column("isp", sa.String(255), nullable=True),
            sa.Column("user_agent", sa.Text(), nullable=True),
            sa.Column("device", sa.String(50), nullable=True),
            sa.Column("browser", sa.String(50), nullable=True),
            sa.Column("os", sa.String(50), nullable=True),
            sa.Column("current_path", sa.String(255), nullable=True),
            sa.Column("current_environment", sa.String(100), nullable=True),
            sa.Column("current_song_title", sa.String(255), nullable=True),
            sa.Column("current_song_artist", sa.String(255), nullable=True),
            sa.Column("is_playing", sa.Boolean(), server_default=sa.text("false"), nullable=False),
            sa.Column("total_duration_listened", sa.Float(), server_default="0.0", nullable=False),
            sa.Column("total_visits", sa.Integer(), server_default="1", nullable=False),
            sa.Column("first_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index(op.f("ix_visitor_sessions_session_id"), "visitor_sessions", ["session_id"], unique=False)
        op.create_index(op.f("ix_visitor_sessions_ip_address"), "visitor_sessions", ["ip_address"], unique=False)
        op.create_index(op.f("ix_visitor_sessions_last_seen_at"), "visitor_sessions", ["last_seen_at"], unique=False)

    # 2. Add columns to analytics_events if missing
    if "analytics_events" in existing_tables:
        event_columns = [col["name"] for col in inspector.get_columns("analytics_events")]
        if "session_id" not in event_columns:
            op.add_column("analytics_events", sa.Column("session_id", sa.String(100), nullable=True))
            op.create_index(op.f("ix_analytics_events_session_id"), "analytics_events", ["session_id"], unique=False)
        if "ip_address" not in event_columns:
            op.add_column("analytics_events", sa.Column("ip_address", sa.String(64), nullable=True))
            op.create_index(op.f("ix_analytics_events_ip_address"), "analytics_events", ["ip_address"], unique=False)
        if "country" not in event_columns:
            op.add_column("analytics_events", sa.Column("country", sa.String(100), nullable=True))
        if "city" not in event_columns:
            op.add_column("analytics_events", sa.Column("city", sa.String(100), nullable=True))
        if "device" not in event_columns:
            op.add_column("analytics_events", sa.Column("device", sa.String(50), nullable=True))
        if "browser" not in event_columns:
            op.add_column("analytics_events", sa.Column("browser", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_table("visitor_sessions")
    op.drop_column("analytics_events", "browser")
    op.drop_column("analytics_events", "device")
    op.drop_column("analytics_events", "city")
    op.drop_column("analytics_events", "country")
    op.drop_column("analytics_events", "ip_address")
    op.drop_column("analytics_events", "session_id")
