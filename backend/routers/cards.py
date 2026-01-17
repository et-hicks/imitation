from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from models import Card, StudyQueue, CardStatus, User
from schemas import CardUpdate, CardResponse, ReviewRequest, ReviewResponse
from auth import require_auth, AuthUser

router = APIRouter(prefix="/cards", tags=["flashcards"])


def get_or_create_user(db: Session, auth_user: AuthUser) -> User:
    """Get existing user or create new one from Supabase auth."""
    user = db.query(User).filter(User.supabase_uid == auth_user.uid).first()
    if not user:
        user = User(
            username=auth_user.email.split("@")[0] if auth_user.email else f"user_{auth_user.uid[:8]}",
            supabase_uid=auth_user.uid
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.put("/{card_id}", response_model=CardResponse)
def update_card(
    card_id: int,
    card_data: CardUpdate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """Update a card's front or back text."""
    user = get_or_create_user(db, current_user)
    
    # Get card and verify user owns the deck
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.deck.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if card_data.front is not None:
        card.front = card_data.front
    if card_data.back is not None:
        card.back = card_data.back
    
    db.commit()
    db.refresh(card)
    
    # Get study status
    study = db.query(StudyQueue).filter(
        StudyQueue.card_id == card.id,
        StudyQueue.user_id == user.id
    ).first()
    
    return CardResponse(
        id=card.id,
        deck_id=card.deck_id,
        front=card.front,
        back=card.back,
        created_at=card.created_at,
        updated_at=card.updated_at,
        status=study.status.value if study else "new",
        next_review_at=study.next_review_at if study else None
    )


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """Delete a card."""
    user = get_or_create_user(db, current_user)
    
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.deck.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(card)
    db.commit()


@router.post("/{card_id}/review", response_model=ReviewResponse)
def review_card(
    card_id: int,
    review_data: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """Mark a card as reviewed and schedule next review."""
    user = get_or_create_user(db, current_user)
    
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.deck.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate next review time
    unit_multipliers = {
        "min": timedelta(minutes=1),
        "hr": timedelta(hours=1),
        "day": timedelta(days=1)
    }
    delta = unit_multipliers[review_data.remind_unit] * review_data.remind_value
    next_review = datetime.utcnow() + delta
    
    # Get or create study queue entry
    study = db.query(StudyQueue).filter(
        StudyQueue.card_id == card_id,
        StudyQueue.user_id == user.id
    ).first()
    
    now = datetime.utcnow()
    
    if study:
        study.status = CardStatus.LEARNING if study.review_count < 3 else CardStatus.REVIEWED
        study.next_review_at = next_review
        study.last_reviewed_at = now
        study.review_count += 1
    else:
        study = StudyQueue(
            card_id=card_id,
            user_id=user.id,
            status=CardStatus.LEARNING,
            next_review_at=next_review,
            last_reviewed_at=now,
            review_count=1
        )
        db.add(study)
    
    db.commit()
    db.refresh(study)
    
    return ReviewResponse(
        card_id=card_id,
        status=study.status.value,
        next_review_at=study.next_review_at,
        review_count=study.review_count
    )
