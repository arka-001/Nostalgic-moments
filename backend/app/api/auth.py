from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db_session, get_current_admin
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.admin import AdminUser
from app.schemas.auth import Token, AdminUserResponse, LoginRequest, ChangePasswordRequest

router = APIRouter()


@router.post("/login", response_model=Token, summary="Admin Login")
async def login(
    response: Response,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """Authenticate admin user and issue JWT bearer token + HTTP-only cookie."""
    result = await db.execute(
        select(AdminUser).where(AdminUser.email == login_data.email)
    )
    user = result.scalars().first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive admin account"
        )

    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )

    # Set HTTP-Only Cookie for convenience
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", summary="Admin Logout")
async def logout(response: Response):
    """Clear access token cookie."""
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=AdminUserResponse, summary="Get Current Admin Profile")
async def get_me(current_admin: AdminUser = Depends(get_current_admin)):
    """Return currently authenticated admin user info."""
    return current_admin


@router.post("/change-password", summary="Change Admin Password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Securely update the authenticated admin password."""
    if not verify_password(password_data.current_password, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed",
        )

    current_admin.password_hash = get_password_hash(password_data.new_password)
    db.add(current_admin)
    await db.commit()

    return {"message": "Password updated successfully"}

