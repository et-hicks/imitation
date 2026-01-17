from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# User schemas
class UserBase(BaseModel):
    username: str
    bio: Optional[str] = None


class UserCreate(UserBase):
    supabase_uid: Optional[str] = None


class UserResponse(UserBase):
    id: int
    profile_url: Optional[str] = None
    
    class Config:
        from_attributes = True


# Tweet schemas
class TweetBase(BaseModel):
    body: str = Field(..., min_length=1, max_length=500)


class TweetCreate(TweetBase):
    is_comment: bool = False
    parent_tweet_id: Optional[int] = None


class TweetResponse(TweetBase):
    id: int
    likes: int = 0
    replies: int = 0
    restacks: int = 0
    saves: int = 0
    userId: str  # Maps to user.username for frontend compatibility
    profileName: str  # Maps to user.username
    profileUrl: Optional[str] = None
    is_comment: bool = False
    parent_tweet_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class TweetListResponse(BaseModel):
    """Response shape for GET /home matching frontend expectations."""
    body: str
    likes: int
    replies: int
    restacks: int
    saves: int
    userId: str
    profileName: str
    profileUrl: Optional[str] = None


class CommentResponse(BaseModel):
    """Response shape for comments matching frontend expectations."""
    userId: Optional[str] = None
    profileName: Optional[str] = None
    body: Optional[str] = None
    likes: Optional[int] = None
    replies: Optional[int] = None
    profileUrl: Optional[str] = None
