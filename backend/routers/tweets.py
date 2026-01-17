from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Tweet, User
from schemas import TweetCreate, TweetResponse, TweetListResponse, CommentResponse
from auth import require_auth, get_current_user, AuthUser

router = APIRouter(tags=["tweets"])


@router.get("/home", response_model=List[TweetListResponse])
def get_home_feed(
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """
    Get home feed with all tweets (non-comments).
    Returns tweets in reverse chronological order.
    """
    tweets = (
        db.query(Tweet)
        .filter(Tweet.is_comment == False)
        .order_by(Tweet.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    result = []
    for tweet in tweets:
        author = db.query(User).filter(User.id == tweet.user_id).first()
        result.append(TweetListResponse(
            body=tweet.body,
            likes=tweet.likes,
            replies=tweet.replies,
            restacks=tweet.restacks,
            saves=tweet.saves,
            userId=author.username if author else "unknown",
            profileName=author.username if author else "Unknown User",
            profileUrl=author.profile_url if author else None
        ))
    
    return result


@router.get("/tweet/{tweet_id}", response_model=TweetResponse)
def get_tweet(tweet_id: int, db: Session = Depends(get_db)):
    """Get a single tweet by ID."""
    tweet = db.query(Tweet).filter(Tweet.id == tweet_id).first()
    
    if not tweet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tweet not found"
        )
    
    author = db.query(User).filter(User.id == tweet.user_id).first()
    
    return TweetResponse(
        id=tweet.id,
        body=tweet.body,
        likes=tweet.likes,
        replies=tweet.replies,
        restacks=tweet.restacks,
        saves=tweet.saves,
        userId=author.username if author else "unknown",
        profileName=author.username if author else "Unknown User",
        profileUrl=author.profile_url if author else None,
        is_comment=tweet.is_comment,
        parent_tweet_id=tweet.parent_tweet_id
    )


@router.get("/tweet/{tweet_id}/comments", response_model=List[CommentResponse])
def get_tweet_comments(tweet_id: int, db: Session = Depends(get_db)):
    """Get all comments for a tweet."""
    # Verify parent tweet exists
    parent = db.query(Tweet).filter(Tweet.id == tweet_id).first()
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tweet not found"
        )
    
    comments = (
        db.query(Tweet)
        .filter(Tweet.parent_tweet_id == tweet_id, Tweet.is_comment == True)
        .order_by(Tweet.created_at.asc())
        .all()
    )
    
    result = []
    for comment in comments:
        author = db.query(User).filter(User.id == comment.user_id).first()
        result.append(CommentResponse(
            userId=author.username if author else None,
            profileName=author.username if author else None,
            body=comment.body,
            likes=comment.likes,
            replies=comment.replies,
            profileUrl=author.profile_url if author else None
        ))
    
    return result


@router.post("/create-tweet/user/{user_id}", response_model=TweetResponse, status_code=status.HTTP_201_CREATED)
def create_tweet(
    user_id: str,
    tweet_data: TweetCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """
    Create a new tweet or comment.
    Requires authentication via Bearer token.
    """
    # Find or create user based on supabase uid
    user = db.query(User).filter(User.supabase_uid == current_user.uid).first()
    
    if not user:
        # Auto-create user for new Supabase users
        user = User(
            username=current_user.email.split("@")[0] if current_user.email else f"user_{current_user.uid[:8]}",
            supabase_uid=current_user.uid
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # If this is a comment, verify parent exists and increment reply count
    if tweet_data.is_comment and tweet_data.parent_tweet_id:
        parent = db.query(Tweet).filter(Tweet.id == tweet_data.parent_tweet_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent tweet not found"
            )
        parent.replies += 1
    
    # Create the tweet
    new_tweet = Tweet(
        body=tweet_data.body,
        is_comment=tweet_data.is_comment,
        parent_tweet_id=tweet_data.parent_tweet_id,
        user_id=user.id
    )
    
    db.add(new_tweet)
    db.commit()
    db.refresh(new_tweet)
    
    return TweetResponse(
        id=new_tweet.id,
        body=new_tweet.body,
        likes=new_tweet.likes,
        replies=new_tweet.replies,
        restacks=new_tweet.restacks,
        saves=new_tweet.saves,
        userId=user.username,
        profileName=user.username,
        profileUrl=user.profile_url,
        is_comment=new_tweet.is_comment,
        parent_tweet_id=new_tweet.parent_tweet_id
    )
