from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user
from app.db.dynamo import create_user, get_user_by_email

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(body: UserCreate):
    if body.role not in ("student", "instructor", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    existing = get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = create_user(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    return {
        "id": user["userId"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "course_id": user.get("course_id"),
    }


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    user = get_user_by_email(body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user["userId"]), "role": user["role"]})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["userId"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "course_id": current_user.get("course_id"),
    }
