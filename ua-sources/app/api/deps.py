"""API Dependencies"""
from fastapi import Depends, HTTPException, status
from typing import Optional


async def get_current_user():
    """Get current authenticated user"""
    # Would implement JWT validation
    return {"id": "admin", "role": "admin"}


async def require_admin(user=Depends(get_current_user)):
    """Require admin role"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return user
