# Flashcards Application - Improvement Suggestions

## UI/UX Improvements

### Card Experience
- **Card editing inline** — Allow editing a card's front/back directly from the deck view instead of requiring deletion and recreation
- **Markdown support on cards** — Support bold, italic, code blocks, and lists on card fronts/backs for richer content (especially useful for technical flashcards)
- **Image support** — Allow embedding images on card fronts and backs (upload or paste URL)
- **Keyboard shortcuts in study mode** — Spacebar to flip, 1/2/3/4 for the spaced repetition intervals, arrow keys to navigate
- **Swipe gestures** — On mobile, swipe to flip cards and swipe left/right for difficulty rating

### Study Session
- **Progress persistence** — If a user closes the browser mid-study, resume where they left off
- **Undo last review** — Allow undoing the last spaced repetition rating in case of misclick
- **Session summary with stats** — After a study session, show cards reviewed, average difficulty chosen, time spent, and accuracy trends
- **Shuffle option** — Toggle to randomize card order within a study session
- **Timer per card** — Optional timer showing how long you've spent on each card
- **"I don't know" button** — Separate from the 1-minute option, explicitly mark a card as unknown and show the answer immediately

### Deck Management
- **Deck reordering** — Drag-and-drop to reorder decks in the sidebar
- **Deck folders/tags** — Group decks by subject or category
- **Deck search** — Filter decks by name when the user has many decks
- **Deck colors/icons** — Assign an optional color or emoji to each deck for quick visual identification
- **Deck import/export** — CSV or Anki-compatible import/export for migrating cards

### General UI
- **Loading skeletons** — Replace loading spinners with skeleton placeholders that match the layout
- **Toast notifications** — Use consistent toast notifications for all CRUD operations (create, delete, update feedback)
- **Mobile responsive layout** — The two-column layout (sidebar + content) should collapse to a single column on mobile with a hamburger menu
- **Light mode toggle** — Some users prefer studying with a light background, especially in bright environments
- **Accessibility audit** — Ensure proper ARIA labels, focus management, and screen reader support throughout

## Feature Additions

### Spaced Repetition
- **SM-2 algorithm** — Add an additional proper SM-2 (or FSRS) spaced repetition algorithm that adapts intervals based on performance history
- **Interval** — Add an additional button that allows for the user to set the time they want for the next card
- **Ease factor per card** — Track how easy/hard each card is and adjust future intervals automatically
- **Daily review limit** — Let users set a max number of new + review cards per day to prevent burnout
- **Review forecasting** — Show a calendar or graph of upcoming review load so users can plan study sessions
- **Streak tracking** — Track consecutive days studied and display a streak counter for motivation
- **Leitner box visualization** — Show which "box" each card is in visually

### Statistics & Analytics
- **Dashboard page** — Dedicated stats page showing study activity over time (heatmap, line charts)
- **Per-deck analytics** — Card maturity distribution, average review time, retention rate
- **Retention rate calculation** — Track correct vs incorrect answers to calculate actual retention
- **Study time tracking** — Log how long each study session takes

### Card Types
- **Cloze deletion cards** — Support fill-in-the-blank style cards (e.g., "The capital of France is {{Paris}}")
- **Multiple choice cards** — Generate wrong answers or let users define options
- **Reversible cards** — Option to study cards in both directions (front→back and back→front)
- **Card templates** — Reusable templates for specific card formats (vocabulary, Q&A, definition)

## Browser Extension Improvements

### Core Functionality
- **Highlight-to-card** — Select text on any webpage, right-click, and create a flashcard directly from the selection (front = selected text or auto-generated question, back = context or user input). To better improve this for the user, we should inject ui elements into the page if possible so the user can add what they want
- **Quick-add keyboard shortcut** — Global hotkey (e.g., Alt+Shift+F) to open the extension popup from any page
- **Batch card creation** — Add multiple cards at once without closing the popup between each
- **Remember after Autoclose** - if the user goes to highlight something, once the extension closes, remember the deck, and the previously inputted text so that copy/paste is easier on front/back
- **Firefox Sidebar** - create the ability to load the flashcard extension right there in a firefox sidebar. Have both a "add new card" and a "study now" feature in the extension


### Study in Extension
- **Mini study mode** — Study due cards directly in the extension popup without opening the full app. Each deck shows how many cards are set for review, how many are reviewed, and how many are weak.
- **Browser notification reminders** — "You have 15 cards due for review" notification at configurable intervals
- **New tab study page** — Option to replace new tab page with a flashcard review interface

### Extension Quality
- **Visual feedback improvements** — Better loading states, error messages, and success animations in the popup
- **Auto-login with browser session** — Detect if the user is logged into the web app and reuse that session instead of requiring separate login

### Integration
- **Right-click context menu** — "Add to flashcards" option in the browser context menu

##
                                                                           
 => => # ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy                           




