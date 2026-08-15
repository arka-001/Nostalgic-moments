"""Add blocked_ips table for IP protection

Revision ID: 9f1a2b3c4d5e
Revises: 8d92ef1b301c
Create Date: 2026-08-15 01:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f1a2b3c4d5e'
down_revision: Union[str, None] = '8d92ef1b301c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if "blocked_ips" not in existing_tables:
        op.create_table(
            "blocked_ips",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
            sa.Column("ip_address", sa.String(64), nullable=False),
            sa.Column("reason", sa.String(255), nullable=True),
            sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
            sa.Column("blocked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index(op.f("ix_blocked_ips_ip_address"), "blocked_ips", ["ip_address"], unique=True)
        op.create_index(op.f("ix_blocked_ips_is_active"), "blocked_ips", ["is_active"], unique=False)


def downgrade() -> None:
    op.drop_table("blocked_ips")
