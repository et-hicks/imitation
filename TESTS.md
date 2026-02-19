# Flashcards Application - Testing Strategy

## Current State

The project currently has:
- **Unit/integration tests** via Vitest in `src/__tests__/api/flashcards.test.ts` covering API routes
- **E2E test scaffolding** via Playwright in `e2e/`
- **Test modes**: mock, local DB, remote DB, and E2E

The suggestions below are organized by testing layer and priority.

---

## 1. Unit Tests

### API Route Tests (expand existing coverage)
- **Input validation edge cases**
  - Empty strings, whitespace-only strings for deck name, card front/back
  - Strings at exact max length (200 chars for name, 5000 for card content)
  - Strings exceeding max length by 1 character
  - Special characters, Unicode, emoji, HTML/script injection attempts in card content
  - SQL injection strings in all text inputs
  - Invalid JSON bodies, missing required fields, extra unexpected fields
- **Spaced repetition logic**
  - Verify `review_count` increments correctly on each review
  - Verify status transitions: `new` → `learning` (after first review) → `reviewed` (after 3+ reviews)
  - Verify `next_review_at` calculation for each time unit (min, hr, day)
  - Edge case: reviewing a card exactly at its `next_review_at` timestamp
  - Edge case: reviewing a card before it's due
  - Boundary values for `remind_value` (1 and 365)
  - Invalid `remind_unit` values
- **Authorization**
  - Accessing another user's deck returns 404 (not 403, to avoid leaking existence)
  - Accessing another user's cards returns appropriate error
  - Reviewing a card that belongs to another user's deck
  - Expired JWT tokens
  - Malformed JWT tokens (bad signature, missing claims, wrong algorithm)
  - Missing Authorization header entirely
- **Deck operations**
  - Creating a deck with duplicate name (same user)
  - Deleting a deck cascades to cards and study_queue entries
  - Deck counts (new_count, learning_count, reviewed_count) are accurate after various operations
- **Study endpoint**
  - Returns only due cards (next_review_at <= NOW)
  - Returns new cards (no study_queue entry)
  - Respects the limit parameter
  - Limit boundary: 0, negative, exceeding max (100)
  - study-all returns cards ordered by least recently studied
  - Empty deck returns empty array (not error)

### Library/Utility Tests
- **`auth.ts`** — JWT verification with valid tokens, expired tokens, tampered payloads, wrong secret
- **`api-helpers.ts`** — `getOrCreateUser()` creates user on first call, returns existing on second call
- **`db.ts`** — Connection pool behavior, error handling on connection failure

---

## 2. Integration Tests

### Database Integration
- **Migration verification** — Run migrations on a fresh database and verify all tables, indexes, and constraints exist
- **Referential integrity** — Verify foreign key constraints (e.g., deleting a deck cascades to cards)
- **Concurrent access** — Two users creating decks simultaneously, reviewing the same card type scenarios
- **Data consistency** — After a series of create/review/delete operations, verify counts match actual data

### API Flow Tests
- **Full study lifecycle**
  1. Create a deck
  2. Add 5 cards
  3. Fetch study queue (should return all 5 as new)
  4. Review each card with different intervals
  5. Verify cards are no longer in study queue (until due)
  6. Advance time, verify cards reappear when due
  7. Review cards enough times to reach "reviewed" status
  8. Verify deck counts at each step
- **Deck CRUD lifecycle** — Create → Read → Update name/description → Delete, verifying state at each step
- **Card CRUD lifecycle** — Create → Read → Update front/back → Review → Delete
- **Multi-deck isolation** — Cards in deck A don't appear in deck B's study queue

---

## 3. End-to-End Tests (Playwright)

### Authentication Flows
- **Login** — Enter credentials, verify redirect to app, verify auth state persists
- **Logout** — Verify session is cleared, redirected to login
- **Session expiry** — Verify behavior when token expires mid-session
- **Protected routes** — Unauthenticated user accessing /flashcards is redirected

### Flashcard User Journeys
- **New user onboarding**
  1. Log in for the first time
  2. See empty state
  3. Create first deck
  4. Add first card
  5. Start studying
- **Daily study session**
  1. Log in
  2. See deck with due cards count
  3. Click "Study Now"
  4. Flip through cards, rate each one
  5. Complete session, see summary
  6. Return to deck home, verify counts updated
- **Deck management**
  1. Create multiple decks
  2. Switch between decks
  3. Delete a deck, confirm it's gone
  4. Verify cards from deleted deck are gone
- **Card management**
  1. Add cards with varying content lengths
  2. View card list
  3. Delete a card
  4. Verify card count updates

### UI Interaction Tests
- **Flashcard flip animation** — Click card, verify flip happens, verify back content is visible
- **Sidebar navigation** — Click different decks, verify content area updates
- **Form validation** — Submit empty forms, verify error messages appear
- **Responsive layout** — Test at mobile, tablet, and desktop viewport widths
- **Keyboard navigation** — Tab through interactive elements, verify focus order

---

## 4. Browser Extension Tests

### Unit Tests (extension popup logic)
- **Login flow** — Mock Supabase auth, verify token storage
- **Session management** — Token refresh, expiry detection, auto-logout
- **Card creation** — Form validation, API call with correct payload, success/error states
- **Deck loading** — Fetch and render deck list, handle empty state, handle API errors

### Integration Tests
- **Extension ↔ API** — Create a card via extension, verify it appears in the web app
- **CORS validation** — Verify extension origin is accepted by middleware
- **Auth token flow** — Login in extension, verify API calls include correct Bearer token

### Manual Test Checklist (pre-release)
- [ ] Install extension in Firefox, verify popup opens
- [ ] Log in with valid credentials
- [ ] Log in with invalid credentials, verify error message
- [ ] Select a deck from dropdown
- [ ] Add a card with front and back content
- [ ] Add a card with empty fields, verify validation
- [ ] Verify success notification appears and auto-dismisses
- [ ] Close and reopen popup, verify session persists
- [ ] Verify selected deck persists across popup opens
- [ ] Test with no internet connection, verify graceful error handling

---

## 5. Performance & Load Tests

- **Study endpoint under load** — Simulate 50+ concurrent users fetching study queues
- **Deck with many cards** — Test with 1000+ cards in a single deck, verify pagination/performance
- **Many decks per user** — Test with 100+ decks, verify sidebar and API performance
- **Database query performance** — Monitor query execution times for the count subqueries in deck listing (these involve multiple subselects and could slow down with scale)
- **Connection pool exhaustion** — Verify behavior when all DB connections are in use

---

## 6. Security Tests

- **SQL injection** — Test all text inputs with SQL injection payloads
- **XSS prevention** — Store `<script>alert('xss')</script>` as card content, verify it renders safely
- **CORS enforcement** — Verify requests from non-allowlisted origins are rejected
- **JWT manipulation** — Tamper with JWT payload (change user ID), verify rejection
- **Rate limiting** — Verify there is rate limiting on auth and card creation endpoints (currently missing — should be added)
- **Authorization bypass** — Attempt to access/modify resources via direct card ID without owning the parent deck
- **Enumeration prevention** — Verify sequential ID access doesn't leak other users' data

---

## 7. Pre-Deployment Checklist

### Automated (should run in CI)
- [ ] All unit tests pass (`npm test`)
- [ ] All integration tests pass against a test database (`npm run test:local`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] TypeScript compiles with no errors (`npx tsc --noEmit`)
- [ ] ESLint passes with no errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Docker image builds successfully

### Manual (pre-production release)
- [ ] Test full study flow on production data (staging environment)
- [ ] Verify CORS headers are correct for production domain
- [ ] Verify environment variables are set on Fly.io
- [ ] Test extension against production API endpoint
- [ ] Check database migrations are up to date
- [ ] Verify Supabase JWT secret matches between app and Supabase project
- [ ] Smoke test: create deck → add card → study → review cycle

---

## 8. Test Infrastructure Improvements

- **CI test pipeline** — Add a GitHub Actions workflow that runs unit + integration tests on every PR (not just deploy on push to main)
- **Test database** — Use a dedicated test database (or Supabase branch) that gets reset between test runs
- **Code coverage** — Add Vitest coverage reporting with a minimum threshold (aim for 80%+ on API routes)
- **Snapshot tests** — Add React component snapshot tests for the flashcard components to catch unintended UI changes
- **Contract tests** — Validate API response shapes against TypeScript types to catch drift between frontend expectations and backend responses
- **Flaky test detection** — Run tests multiple times in CI to identify and quarantine flaky tests
- **Test data factories** — Create factory functions for generating test decks, cards, and users instead of static fixtures
- **Mock server for extension** — Use MSW (Mock Service Worker) to test extension API calls without hitting real endpoints
