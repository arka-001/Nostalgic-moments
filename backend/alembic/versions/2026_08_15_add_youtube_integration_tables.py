"""Add youtube_playlists, system_settings, and song source columns

Revision ID: 4ea52861c890
Revises: 3de3945ed620
Create Date: 2026-08-15 00:23:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ea52861c890'
down_revision: Union[str, None] = '3de3945ed620'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. Create system_settings table if not exists
    if 'system_settings' not in existing_tables:
        op.create_table(
            'system_settings',
            sa.Column('key', sa.String(length=100), nullable=False),
            sa.Column('value_encrypted', sa.Text(), nullable=True),
            sa.Column('is_encrypted', sa.Boolean(), server_default=sa.text('1'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.PrimaryKeyConstraint('key')
        )

    # 2. Create youtube_playlists table if not exists
    if 'youtube_playlists' not in existing_tables:
        op.create_table(
            'youtube_playlists',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('playlist_id', sa.String(length=100), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('thumbnail_url', sa.Text(), nullable=True),
            sa.Column('category_id', sa.UUID(), nullable=False),
            sa.Column('is_active', sa.Boolean(), server_default=sa.text('1'), nullable=False),
            sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_youtube_playlists_playlist_id'), 'youtube_playlists', ['playlist_id'], unique=False)
        op.create_index(op.f('ix_youtube_playlists_category_id'), 'youtube_playlists', ['category_id'], unique=False)

    # 3. Add columns to songs table if not exists
    if 'songs' in existing_tables:
        song_cols = [c['name'] for c in inspector.get_columns('songs')]
        with op.batch_alter_table('songs', schema=None) as batch_op:
            if 'source_type' not in song_cols:
                batch_op.add_column(sa.Column('source_type', sa.String(length=50), server_default='uploaded', nullable=False))
            if 'youtube_video_id' not in song_cols:
                batch_op.add_column(sa.Column('youtube_video_id', sa.String(length=100), nullable=True))
                batch_op.create_index(batch_op.f('ix_songs_youtube_video_id'), ['youtube_video_id'], unique=False)
            if 'youtube_url' not in song_cols:
                batch_op.add_column(sa.Column('youtube_url', sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'songs' in existing_tables:
        song_cols = [c['name'] for c in inspector.get_columns('songs')]
        with op.batch_alter_table('songs', schema=None) as batch_op:
            if 'youtube_video_id' in song_cols:
                batch_op.drop_index(batch_op.f('ix_songs_youtube_video_id'))
                batch_op.drop_column('youtube_video_id')
            if 'youtube_url' in song_cols:
                batch_op.drop_column('youtube_url')
            if 'source_type' in song_cols:
                batch_op.drop_column('source_type')

    if 'youtube_playlists' in existing_tables:
        op.drop_index(op.f('ix_youtube_playlists_category_id'), table_name='youtube_playlists')
        op.drop_index(op.f('ix_youtube_playlists_playlist_id'), table_name='youtube_playlists')
        op.drop_table('youtube_playlists')

    if 'system_settings' in existing_tables:
        op.drop_table('system_settings')
