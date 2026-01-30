from fastapi import APIRouter

from app.api.v1_routes import auth_v1, comments_v1, livestreams_v1, subscriptions_v1, users_v1, videos_v1

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_v1.router, prefix="/auth", tags=["v1-auth"])
v1_router.include_router(
    videos_v1.router, prefix="/videos", tags=["v1-videos"])
v1_router.include_router(
    comments_v1.router, prefix="/comments", tags=["v1-comments"])
v1_router.include_router(users_v1.router, prefix="/users", tags=["v1-users"])
v1_router.include_router(subscriptions_v1.router,
                         prefix="/subscriptions", tags=["v1-subscriptions"])
v1_router.include_router(livestreams_v1.router,
                         prefix="/livestreams", tags=["v1-livestreams"])
