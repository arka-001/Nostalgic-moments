import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.api.deps import get_db_session, get_current_admin
from app.models.admin import AdminUser
from app.models.song import Song
from app.models.category_song import CategorySong
from app.schemas.song import SongResponse, SongCreate, SongUpdate

router = APIRouter()


@router.get("/songs", response_model=List[SongResponse], summary="List Public Songs")
async def list_songs(
    include_inactive: bool = False,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieve public songs with optional search filtering."""
    query = select(Song)
    if not include_inactive:
        query = query.where(Song.is_active == True)
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.where(
            (Song.title.ilike(pattern))
            | (Song.artist.ilike(pattern))
            | (Song.album.ilike(pattern))
        )
    query = query.order_by(Song.title.asc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/songs/search", response_model=List[SongResponse], summary="Search Songs")
async def search_songs(
    q: Optional[str] = None,
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db_session),
):
    """Search songs by title, artist, or album query parameter q."""
    return await list_songs(include_inactive=include_inactive, q=q, db=db)


@router.get("/songs/{song_id}", response_model=SongResponse, summary="Get Song Detail")
async def get_song(
    song_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieve details for a specific song."""
    result = await db.execute(select(Song).where(Song.id == song_id))
    song = result.scalars().first()

    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Song not found"
        )
    return song


# --- Admin Song Management Routes ---

@router.post(
    "/admin/songs",
    response_model=SongResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Create Song",
)
async def create_song(
    song_in: SongCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Create a new song record and optionally attach it to categories."""
    song_data = song_in.model_dump(exclude={"category_ids"})
    song = Song(**song_data)
    db.add(song)
    await db.flush()  # Generate song.id

    # Attach to categories if provided
    if song_in.category_ids:
        for idx, cat_id in enumerate(song_in.category_ids):
            cat_song = CategorySong(
                category_id=cat_id, song_id=song.id, sort_order=idx + 1
            )
            db.add(cat_song)

    await db.commit()
    await db.refresh(song)
    return song


@router.patch(
    "/admin/songs/{song_id}",
    response_model=SongResponse,
    summary="Admin: Update Song",
)
async def update_song(
    song_id: uuid.UUID,
    song_in: SongUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Update song metadata, audio URL, artwork, or category assignments."""
    result = await db.execute(select(Song).where(Song.id == song_id))
    song = result.scalars().first()

    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Song not found"
        )

    update_data = song_in.model_dump(exclude_unset=True)
    category_ids = update_data.pop("category_ids", None)

    for field, val in update_data.items():
        setattr(song, field, val)

    # Update category associations if category_ids passed
    if category_ids is not None:
        # Delete existing associations
        await db.execute(delete(CategorySong).where(CategorySong.song_id == song_id))
        # Add new associations
        for idx, cat_id in enumerate(category_ids):
            cat_song = CategorySong(
                category_id=cat_id, song_id=song_id, sort_order=idx + 1
            )
            db.add(cat_song)

    await db.commit()
    await db.refresh(song)
    return song


@router.delete(
    "/admin/songs/{song_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: Delete Song",
)
async def delete_song(
    song_id: uuid.UUID,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Delete a song record."""
    result = await db.execute(select(Song).where(Song.id == song_id))
    song = result.scalars().first()

    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Song not found"
        )

    await db.delete(song)
    await db.commit()
    return None
