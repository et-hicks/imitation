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


# ==================== FLASHCARD SCHEMAS ====================

class DeckBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class DeckCreate(DeckBase):
    pass


class DeckUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None


class DeckResponse(DeckBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    card_count: int = 0
    new_count: int = 0       # Red - to study
    learning_count: int = 0  # Yellow - to review  
    reviewed_count: int = 0  # Green - studied
    
    class Config:
        from_attributes = True


class DeckListResponse(BaseModel):
    """Simplified deck for list view."""
    id: int
    name: str
    description: Optional[str] = None
    card_count: int = 0
    new_count: int = 0
    learning_count: int = 0
    reviewed_count: int = 0


class CardBase(BaseModel):
    front: str = Field(..., min_length=1)
    back: str = Field(..., min_length=1)


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    front: Optional[str] = Field(None, min_length=1)
    back: Optional[str] = Field(None, min_length=1)


class CardResponse(CardBase):
    id: int
    deck_id: int
    created_at: datetime
    updated_at: datetime
    status: str = "new"  # Current study status for user
    next_review_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class StudyCardResponse(BaseModel):
    """Card response for study mode."""
    id: int
    front: str
    back: str
    status: str
    review_count: int = 0


class ReviewRequest(BaseModel):
    """Request to schedule next review."""
    remind_value: int = Field(..., ge=1)  # Number
    remind_unit: str = Field(..., pattern="^(min|hr|day)$")  # Unit


class ReviewResponse(BaseModel):
    """Response after scheduling review."""
    card_id: int
    status: str
    next_review_at: datetime
    review_count: int

