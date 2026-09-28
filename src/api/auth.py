import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pwdlib import PasswordHash

from .db import create_user, get_user_by_email, get_user_by_id
from .schemas import LoginRequest, RegisterRequest, TokenResponse

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

password_hasher = PasswordHash.recommended()
security = HTTPBearer()

auth_router = APIRouter(prefix="/api")


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


@auth_router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest):
    if get_user_by_email(body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = password_hasher.hash(body.password)
    user = create_user(body.email, hashed, body.name)
    return TokenResponse(
        access_token=create_access_token(user["id"]), user=user
    )


@auth_router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = get_user_by_email(body.email)
    if not user or not password_hasher.verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(
        access_token=create_access_token(user["id"]),
        user={"id": user["id"], "email": user["email"], "name": user["name"]},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Dependency: put this in any endpoint to require a logged-in user."""
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user