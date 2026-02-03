from __future__ import annotations

import os
import uuid

from app.models.user import User


def _media_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media"))


def _find_user_media(user_id: uuid.UUID, folder: str) -> str:
    root = _media_root()
    candidates = [".png", ".jpg", ".jpeg", ".webp"]
    for ext in candidates:
        filename = f"{user_id}{ext}"
        path = os.path.join(root, folder, filename)
        if os.path.exists(path):
            return f"/media/{folder}/{filename}"
    return ""


def resolve_user_avatar(user: User) -> str:
    if user.avatar_url:
        return user.avatar_url
    return _find_user_media(user.id, "avatars")


def resolve_user_banner(user: User) -> str:
    if user.banner_url:
        return user.banner_url
    return _find_user_media(user.id, "banners")
