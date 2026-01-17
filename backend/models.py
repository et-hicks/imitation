from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


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
    decks = relationship("Deck", back_populates="owner")


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


# ==================== FLASHCARD MODELS ====================

class CardStatus(enum.Enum):
    """Card study status for spaced repetition."""
    NEW = "new"           # Red - to study
    LEARNING = "learning" # Yellow - to review
    REVIEWED = "reviewed" # Green - studied


class Deck(Base):
    """Flashcard deck containing multiple cards."""
    __tablename__ = "decks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="decks")
    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan")


class Card(Base):
    """Individual flashcard with front and back text."""
    __tablename__ = "cards"
    
    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    deck = relationship("Deck", back_populates="cards")
    study_records = relationship("StudyQueue", back_populates="card", cascade="all, delete-orphan")


class StudyQueue(Base):
    """Tracks study progress and schedules next review for each card per user."""
    __tablename__ = "study_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(CardStatus), default=CardStatus.NEW, nullable=False)
    next_review_at = Column(DateTime(timezone=True), nullable=True)
    last_reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    card = relationship("Card", back_populates="study_records")

