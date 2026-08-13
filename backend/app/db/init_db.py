import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.admin import AdminUser
from app.models.category import Category

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INITIAL_CATEGORIES = [
    {
        "name": "Running Bus",
        "slug": "running-bus",
        "tagline": "Songs for a journey through old memories",
        "description": "Experience nostalgic audio tracks while traveling through scenic old bus routes across vintage India.",
        "background_type": "image",
        "sort_order": 1,
        "theme_config": {
            "primary_color": "#d97706",
            "accent_color": "#b45309",
            "overlay_vignette": "dark",
            "player_skin": "retro_bus_radio"
        }
    },
    {
        "name": "Sathi Salon",
        "slug": "sathi-salon",
        "tagline": "Old songs, old chairs, old memories",
        "description": "Immerse yourself in timeless classic tunes inside a vintage Indian barber shop atmosphere.",
        "background_type": "image",
        "sort_order": 2,
        "theme_config": {
            "primary_color": "#059669",
            "accent_color": "#047857",
            "overlay_vignette": "warm",
            "player_skin": "retro_cassette_deck"
        }
    },
    {
        "name": "Tea Stall",
        "slug": "tea-stall",
        "tagline": "Music, tea and endless conversations",
        "description": "Relax at a vibrant roadside chai stall listening to nostalgic transistor radio melodies.",
        "background_type": "image",
        "sort_order": 3,
        "theme_config": {
            "primary_color": "#ea580c",
            "accent_color": "#c2410c",
            "overlay_vignette": "cozy",
            "player_skin": "transistor_radio"
        }
    },
    {
        "name": "Running Car",
        "slug": "running-car",
        "tagline": "Night drives and timeless melodies",
        "description": "Cruise through quiet midnight highway roads with soulful vintage tunes.",
        "background_type": "image",
        "sort_order": 4,
        "theme_config": {
            "primary_color": "#3b82f6",
            "accent_color": "#1d4ed8",
            "overlay_vignette": "night",
            "player_skin": "vintage_dashboard"
        }
    },
    {
        "name": "Railway Station",
        "slug": "railway-station",
        "tagline": "Echoes of trains and long-forgotten tunes",
        "description": "Atmospheric platform audio and golden age tracks reminiscent of Indian railway journeys.",
        "background_type": "image",
        "sort_order": 5,
        "theme_config": {
            "primary_color": "#8b5cf6",
            "accent_color": "#6d28d9",
            "overlay_vignette": "sepia",
            "player_skin": "railway_announcer"
        }
    },
]


async def init_db(db: AsyncSession) -> None:
    """Seed initial admin user and default nostalgic category environments."""
    logger.info("Initializing database seeds...")

    # 1. Seed Admin User
    admin_email = settings.INITIAL_ADMIN_EMAIL
    result = await db.execute(select(AdminUser).where(AdminUser.email == admin_email))
    existing_admin = result.scalars().first()

    if not existing_admin:
        logger.info(f"Creating initial admin user for email: {admin_email}")
        hashed_password = get_password_hash(settings.INITIAL_ADMIN_PASSWORD)
        admin_user = AdminUser(
            email=admin_email,
            password_hash=hashed_password,
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
    else:
        logger.info(f"Admin user ({admin_email}) already exists. Skipping creation.")

    # 2. Seed Initial Categories
    for cat_data in INITIAL_CATEGORIES:
        slug = cat_data["slug"]
        cat_result = await db.execute(select(Category).where(Category.slug == slug))
        existing_cat = cat_result.scalars().first()

        if not existing_cat:
            logger.info(f"Creating initial category: {cat_data['name']} ({slug})")
            category = Category(
                name=cat_data["name"],
                slug=cat_data["slug"],
                tagline=cat_data["tagline"],
                description=cat_data["description"],
                background_type=cat_data["background_type"],
                sort_order=cat_data["sort_order"],
                theme_config=cat_data["theme_config"],
                is_active=True,
            )
            db.add(category)
        else:
            logger.info(f"Category '{slug}' already exists. Skipping creation.")

    await db.commit()
    logger.info("Database seeding completed successfully.")
