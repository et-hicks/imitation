from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
from config import get_settings

# HTTP Bearer token extraction
security = HTTPBearer(auto_error=False)


class AuthUser:
    """Represents an authenticated user from Supabase JWT."""
    def __init__(self, uid: str, email: Optional[str] = None):
        self.uid = uid
        self.email = email


def verify_token(token: str) -> Optional[AuthUser]:
    """
    Verify a Supabase JWT token.
    
    NOTE: This is a skeleton. In production, you need to:
    1. Set SUPABASE_JWT_SECRET in environment
    2. Verify the token signature
    3. Check token expiration
    """
    settings = get_settings()
    
    if not settings.supabase_jwt_secret:
        # For development without Supabase, accept any token
        # and extract user info from the payload without verification
        try:
            # Decode without verification for development
            payload = jwt.get_unverified_claims(token)
            return AuthUser(
                uid=payload.get("sub", "dev-user"),
                email=payload.get("email")
            )
        except JWTError:
            return None
    
    try:
        # Production: Verify with Supabase JWT secret
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return AuthUser(
            uid=payload.get("sub"),
            email=payload.get("email")
        )
    except JWTError:
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthUser]:
    """
    Dependency to get the current authenticated user.
    Returns None if no valid token is provided.
    """
    if credentials is None:
        return None
    
    user = verify_token(credentials.credentials)
    return user


async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthUser:
    """
    Dependency that requires authentication.
    Raises 401 if no valid token is provided.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = verify_token(credentials.credentials)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user
