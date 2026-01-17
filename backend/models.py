from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """User model for Twitter-like profiles."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    bio = Column(Text, nullable=True)
    profile_url = Column(String(500), nullable=True)
    supabase_uid = Column(String(100), unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    tweets = relationship("Tweet", back_populates="author")


class Tweet(Base):
    """Tweet model for posts and comments."""
    __tablename__ = "tweets"
    
    id = Column(Integer, primary_key=True, index=True)
    body = Column(Text, nullable=False)
    likes = Column(Integer, default=0)
    replies = Column(Integer, default=0)
    restacks = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    is_comment = Column(Boolean, default=False)
    parent_tweet_id = Column(Integer, ForeignKey("tweets.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    author = relationship("User", back_populates="tweets")
    parent = relationship("Tweet", remote_side=[id], backref="comments")
