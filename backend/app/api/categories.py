import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, update
from sqlalchemy.orm import selectinload

from app.api.deps import get_db_session, get_current_admin
from app.models.admin import AdminUser
from app.models.category import Category
from app.models.song import Song
from app.models.category_song import CategorySong
from app.schemas.category import (
    CategoryResponse,
    CategoryCreate,
    CategoryUpdate,
    CategorySongReorderRequest,
)
from app.schemas.song import CategoryDetailResponse, PlaylistSongResponse

router = APIRouter()


@router.get("/categories", response_model=List[CategoryResponse], summary="List Public Categories")
async def list_categories(
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieve all active nostalgic category environments."""
    query = select(Category)
    if not include_inactive:
        query = query.where(Category.is_active == True)
    query = query.order_by(Category.sort_order.asc(), Category.name.asc())

    result = await db.execute(query)
    categories = result.scalars().all()

    # Calculate song count per category
    res = []
    for cat in categories:
        count_res = await db.execute(
            select(func.count(CategorySong.id)).where(CategorySong.category_id == cat.id)
        )
        song_count = count_res.scalar() or 0
        cat_dict = CategoryResponse.model_validate(cat)
        cat_dict.song_count = song_count
        res.append(cat_dict)

    return res


@router.get(
    "/categories/{slug}",
    response_model=CategoryDetailResponse,
    summary="Get Category Detail by Slug with Playlist",
)
async def get_category_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieve dynamic category metadata and its ordered song playlist by environment slug."""
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.category_songs).selectinload(CategorySong.song))
        .where(Category.slug == slug)
    )
    category = result.scalars().first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category environment '{slug}' not found",
        )

    # Sort playlist songs by CategorySong.sort_order
    sorted_category_songs = sorted(category.category_songs, key=lambda cs: cs.sort_order)

    songs_list = []
    for cs in sorted_category_songs:
        if cs.song and cs.song.is_active:
            song_resp = PlaylistSongResponse.model_validate(cs.song)
            song_resp.sort_order = cs.sort_order
            songs_list.append(song_resp)

    return CategoryDetailResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        tagline=category.tagline,
        thumbnail_url=category.thumbnail_url,
        background_url=category.background_url,
        background_type=category.background_type,
        theme_config=category.theme_config,
        is_active=category.is_active,
        sort_order=category.sort_order,
        created_at=category.created_at,
        updated_at=category.updated_at,
        songs=songs_list,
    )


# --- Admin Category Management Routes ---

@router.post(
    "/admin/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Create Category Environment",
)
async def create_category(
    cat_in: CategoryCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Create a new nostalgic environment category."""
    # Check if slug exists
    existing = await db.execute(select(Category).where(Category.slug == cat_in.slug))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category slug '{cat_in.slug}' already exists",
        )

    category = Category(**cat_in.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.patch(
    "/admin/categories/{category_id}",
    response_model=CategoryResponse,
    summary="Admin: Update Category Environment",
)
async def update_category(
    category_id: uuid.UUID,
    cat_in: CategoryUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Update category environment properties, visuals, or ordering."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalars().first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )

    update_data = cat_in.model_dump(exclude_unset=True)

    if "slug" in update_data and update_data["slug"] != category.slug:
        existing = await db.execute(
            select(Category).where(Category.slug == update_data["slug"])
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slug '{update_data['slug']}' is already used",
            )

    for field, val in update_data.items():
        setattr(category, field, val)

    await db.commit()
    await db.refresh(category)
    return category


@router.delete(
    "/admin/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: Delete Category Environment",
)
async def delete_category(
    category_id: uuid.UUID,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Delete a category environment."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalars().first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )

    await db.delete(category)
    await db.commit()
    return None


@router.post(
    "/admin/categories/{category_id}/songs",
    summary="Admin: Add Song to Category Playlist",
)
async def attach_song_to_category(
    category_id: uuid.UUID,
    song_id: uuid.UUID,
    sort_order: int = 0,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Associate a song with a category environment playlist."""
    # Check category
    cat_res = await db.execute(select(Category).where(Category.id == category_id))
    if not cat_res.scalars().first():
        raise HTTPException(status_code=404, detail="Category not found")

    # Check song
    song_res = await db.execute(select(Song).where(Song.id == song_id))
    if not song_res.scalars().first():
        raise HTTPException(status_code=404, detail="Song not found")

    # Check existing attachment
    existing = await db.execute(
        select(CategorySong).where(
            CategorySong.category_id == category_id, CategorySong.song_id == song_id
        )
    )
    if existing.scalars().first():
        return {"message": "Song is already attached to category"}

    cat_song = CategorySong(
        category_id=category_id, song_id=song_id, sort_order=sort_order
    )
    db.add(cat_song)
    await db.commit()
    return {"message": "Song attached to category successfully"}


@router.put(
    "/admin/categories/{category_id}/songs/reorder",
    summary="Admin: Reorder Category Playlist",
)
async def reorder_category_songs(
    category_id: uuid.UUID,
    reorder_in: CategorySongReorderRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Batch update playlist sort orders for a category environment."""
    for item in reorder_in.items:
        await db.execute(
            update(CategorySong)
            .where(
                CategorySong.category_id == category_id,
                CategorySong.song_id == item.song_id,
            )
            .values(sort_order=item.sort_order)
        )

    await db.commit()
    return {"message": "Playlist reordered successfully"}


@router.delete(
    "/admin/categories/{category_id}/songs/{song_id}",
    summary="Admin: Remove Song from Category Playlist",
)
async def detach_song_from_category(
    category_id: uuid.UUID,
    song_id: uuid.UUID,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Remove a song association from a category environment playlist."""
    await db.execute(
        delete(CategorySong).where(
            CategorySong.category_id == category_id, CategorySong.song_id == song_id
        )
    )
    await db.commit()
    return {"message": "Song removed from category"}
