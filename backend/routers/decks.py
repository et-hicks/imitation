from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models import Deck, Card, StudyQueue, CardStatus, User
from schemas import (
    DeckCreate, DeckUpdate, DeckResponse, DeckListResponse,
    CardCreate, CardUpdate, CardResponse, StudyCardResponse,
    ReviewRequest, ReviewResponse
)
from auth import require_auth, get_current_user, AuthUser

router = APIRouter(prefix="/decks", tags=["flashcards"])


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


def get_deck_counts(db: Session, deck_id: int, user_id: int):
    """Get card counts by status for a deck."""
    now = datetime.utcnow()
    
    # Count cards in deck
    card_count = db.query(Card).filter(Card.deck_id == deck_id).count()
    
    # Count by status from study queue
    status_counts = db.query(
        StudyQueue.status,
        func.count(StudyQueue.id)
    ).join(Card).filter(
        Card.deck_id == deck_id,
        StudyQueue.user_id == user_id
    ).group_by(StudyQueue.status).all()
    
    counts = {s.value: 0 for s in CardStatus}
    for status_enum, count in status_counts:
        counts[status_enum.value] = count
    
    # Cards not in study queue are "new"
    tracked_count = sum(counts.values())
    counts["new"] = card_count - tracked_count + counts.get("new", 0)
    
    return card_count, counts


@router.get("", response_model=List[DeckListResponse])
def list_decks(
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """List all decks for the authenticated user."""
    user = get_or_create_user(db, current_user)
    decks = db.query(Deck).filter(Deck.user_id == user.id).order_by(Deck.updated_at.desc()).all()
    
    result = []
    for deck in decks:
        card_count, status_counts = get_deck_counts(db, deck.id, user.id)
        result.append(DeckListResponse(
            id=deck.id,
            name=deck.name,
            description=deck.description,
            card_count=card_count,
            new_count=status_counts.get("new", 0),
            learning_count=status_counts.get("learning", 0),
            reviewed_count=status_counts.get("reviewed", 0)
        ))
    
    return result


@router.post("", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck(
    deck_data: DeckCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """Create a new deck."""
    user = get_or_create_user(db, current_user)
    
    new_deck = Deck(
        user_id=user.id,
        name=deck_data.name,
        description=deck_data.description
    )
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)
    
    return DeckResponse(
        id=new_deck.id,
        user_id=new_deck.user_id,
        name=new_deck.name,
        description=new_deck.description,
        created_at=new_deck.created_at,
        updated_at=new_deck.updated_at,
        card_count=0,
        new_count=0,
        learning_count=0,
        reviewed_count=0
    )


@router.get("/{deck_id}", response_model=DeckResponse)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """Get a specific deck."""
    user = get_or_create_user(db, current_user)
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == user.id).first()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    card_count, status_counts = get_deck_counts(db, deck.id, user.id)
    
    return DeckResponse(
        id=deck.id,
        user_id=deck.user_id,
        name=deck.name,
        description=deck.description,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
        card_count=card_count,
        new_count=status_counts.get("new", 0),
        learning_count=status_counts.get("learning", 0),
        reviewed_count=status_counts.get("reviewed", 0)
    )


@router.put("/{deck_id}", response_model=DeckResponse)
def update_deck(
    deck_id: int,
    deck_data: DeckUpdate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """Update a deck."""
    user = get_or_create_user(db, current_user)
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == user.id).first()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    if deck_data.name is not None:
        deck.name = deck_data.name
    if deck_data.description is not None:
        deck.description = deck_data.description
    
    db.commit()
    db.refresh(deck)
    
    card_count, status_counts = get_deck_counts(db, deck.id, user.id)
    
    return DeckResponse(
        id=deck.id,
        user_id=deck.user_id,
        name=deck.name,
        description=deck.description,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
        card_count=card_count,
        new_count=status_counts.get("new", 0),
        learning_count=status_counts.get("learning", 0),
        reviewed_count=status_counts.get("reviewed", 0)
    )


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """Delete a deck and all its cards."""
    user = get_or_create_user(db, current_user)
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == user.id).first()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    db.delete(deck)
    db.commit()


# ==================== CARDS ====================

@router.get("/{deck_id}/cards", response_model=List[CardResponse])
def list_cards(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """List all cards in a deck."""
    user = get_or_create_user(db, current_user)
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == user.id).first()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    cards = db.query(Card).filter(Card.deck_id == deck_id).order_by(Card.created_at).all()
    
    result = []
    for card in cards:
        # Get study status for this user
        study = db.query(StudyQueue).filter(
            StudyQueue.card_id == card.id,
            StudyQueue.user_id == user.id
        ).first()
        
        result.append(CardResponse(
            id=card.id,
            deck_id=card.deck_id,
            front=card.front,
            back=card.back,
            created_at=card.created_at,
            updated_at=card.updated_at,
            status=study.status.value if study else "new",
            next_review_at=study.next_review_at if study else None
        ))
    
    return result


@router.post("/{deck_id}/cards", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
    deck_id: int,
    card_data: CardCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """Create a new card in a deck."""
    user = get_or_create_user(db, current_user)
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == user.id).first()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    new_card = Card(
        deck_id=deck_id,
        front=card_data.front,
        back=card_data.back
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    
    return CardResponse(
        id=new_card.id,
        deck_id=new_card.deck_id,
        front=new_card.front,
        back=new_card.back,
        created_at=new_card.created_at,
        updated_at=new_card.updated_at,
        status="new",
        next_review_at=None
    )


# ==================== STUDY ====================

@router.get("/{deck_id}/study", response_model=List[StudyCardResponse])
def get_study_cards(
    deck_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_auth)
):
    """Get cards due for study in a deck."""
    user = get_or_create_user(db, current_user)
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == user.id).first()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    now = datetime.utcnow()
    
    # Get cards with due reviews
    due_cards = db.query(Card, StudyQueue).outerjoin(
        StudyQueue,
        (StudyQueue.card_id == Card.id) & (StudyQueue.user_id == user.id)
    ).filter(
        Card.deck_id == deck_id
    ).filter(
        (StudyQueue.id == None) |  # New cards
        (StudyQueue.next_review_at <= now)  # Due cards
    ).limit(limit).all()
    
    result = []
    for card, study in due_cards:
        result.append(StudyCardResponse(
            id=card.id,
            front=card.front,
            back=card.back,
            status=study.status.value if study else "new",
            review_count=study.review_count if study else 0
        ))
    
    return result
