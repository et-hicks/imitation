# Review Checklist — Browser Extension Improvements & Tech Debt

Use this checklist to verify each change in the UI/prod.

---

## Browser Extension — Core Functionality

### 1. Highlight-to-Card
**Files changed:** `extension/content.js`, `extension/manifest.json`, `extension/background.js`

- [ ] Navigate to any webpage with the extension installed
- [ ] Select/highlight text on the page (3+ characters)
- [ ] Verify a blue "+ Flashcard" button appears near the selection
- [ ] Click the button — a floating panel should appear with:
  - The selected text pre-filled in the "Front (Question)" field
  - A deck dropdown (loaded from your account)
  - A "Back (Answer)" text area
- [ ] Fill in the back, select a deck, and click "Add Card" — verify it saves
- [ ] Verify the success message appears and fields clear
- [ ] Right-click on selected text — verify "Add to Imitation Flashcards" context menu item appears
- [ ] Click the context menu item — verify the same floating panel opens with the selected text
- [ ] Click the X button or the overlay — verify the panel closes

### 2. Quick-Add Keyboard Shortcut
**Files changed:** `extension/manifest.json` (commands), `extension/background.js`, `extension/content.js`

- [ ] On any webpage, press **Alt+Shift+F**
- [ ] Verify the floating "Add Flashcard" panel opens (empty front field)
- [ ] Add a card using the panel — verify it saves
- [ ] Note: Firefox may require setting the shortcut in `about:addons` > Manage Extension Shortcuts

### 3. Batch Card Creation
**Files changed:** `extension/popup/popup.html`, `extension/popup/popup.js`, `extension/popup/popup.css`

- [ ] Open the extension popup
- [ ] Verify the first card entry shows "Card 1" with front/back fields
- [ ] Click "+ Add Another Card" — verify "Card 2" entry appears
- [ ] Add a third card — verify all three show with card numbers
- [ ] Click the X button on Card 2 — verify it's removed and cards renumber correctly
- [ ] Fill in multiple cards, select a deck, click "Add Card(s)"
- [ ] Verify success message shows count (e.g., "3 cards added!")
- [ ] Verify all card entries reset to a single empty card after submission

### 4. Remember After Autoclose
**Files changed:** `extension/popup/popup.js`

- [ ] Open the extension popup, type text in the front/back fields (don't submit)
- [ ] Close the popup (click away from it)
- [ ] Re-open the popup
- [ ] Verify the previously entered text is restored in the front/back fields
- [ ] Verify the selected deck is also remembered
- [ ] Submit the card — verify the draft is cleared
- [ ] Close and reopen — verify fields are now empty (draft was cleared on submit)

### 5. Firefox Sidebar
**Files changed:** `extension/manifest.json` (sidebar_action), new `extension/sidebar/sidebar.html`, new `extension/sidebar/sidebar.js`

- [ ] In Firefox, open the sidebar: View > Sidebar > Imitation (or use Ctrl+B and select Imitation)
- [ ] If not logged in, verify the login form appears in the sidebar
- [ ] Log in — verify the main view loads with "Add Card" and "Study Now" tabs
- **Add Card tab:**
  - [ ] Verify deck dropdown loads
  - [ ] Add a card — verify success message
- **Study Now tab:**
  - [ ] Click "Study Now" tab
  - [ ] Verify deck list loads with card counts
  - [ ] Click a deck — verify flashcard study session starts
  - [ ] Click the card to flip it — verify it shows the back
  - [ ] Click a rating button (Again/Hard/Good/Easy) — verify it advances to next card
  - [ ] Complete all cards — verify "All done!" message appears
  - [ ] Click back arrow — verify return to deck list

---

## Browser Extension — Study in Extension

### 6. Mini Study Mode (in popup via sidebar)
**Tested via:** Sidebar (section 5 above) — the sidebar is the primary mini-study interface

- [ ] Study mode is available in the sidebar's "Study Now" tab
- [ ] Each deck shows card count
- [ ] Cards flip with click, ratings submit reviews to the API

### 7. Browser Notification Reminders
**Files changed:** `extension/background.js`, `extension/popup/popup.html`, `extension/popup/popup.js`

- [ ] Open extension popup, click the gear icon (settings)
- [ ] Check "Enable study reminders"
- [ ] Select an interval (e.g., "Every 30 minutes" for testing)
- [ ] Click back — verify "Settings saved!" message appears
- [ ] Wait for the interval — verify a browser notification appears: "You have X cards due for review"
- [ ] Note: Notification only appears if you have due cards
- [ ] Disable reminders in settings — verify notifications stop

### 8. New Tab Study Page
**Files changed:** `extension/manifest.json`, new `extension/newtab/newtab.html`, new `extension/newtab/newtab.js`

> **Note:** The new tab override is NOT auto-enabled in the manifest to avoid disrupting the user's workflow. To test, you can manually add to manifest.json:
> ```json
> "chrome_url_overrides": { "newtab": "newtab/newtab.html" }
> ```
> Or for Firefox, load `newtab/newtab.html` directly in the browser.

- [ ] Open the new tab page
- [ ] If not logged in via extension, verify "Sign in via the extension popup" message
- [ ] If logged in, verify deck grid loads with deck names and card counts
- [ ] Click a deck — verify study session starts with full-width flashcard
- [ ] Click card to flip — verify answer is revealed
- [ ] Click a rating (or press 1/2/3/4 keyboard shortcuts) — verify it advances
- [ ] Press Space or Enter to flip the card (keyboard shortcut)
- [ ] Complete all cards — verify "All caught up!" message with "Back to Decks" button
- [ ] Click "Back to Decks" — verify return to deck grid

---

## Tech Debt Fixes

### 9. Middleware → Proxy Rename (Next.js 16 deprecation)
**Files changed:** `src/middleware.ts` → `src/proxy.ts`, exported function renamed `middleware` → `proxy`

- [ ] Verify `npm run build` succeeds without the middleware deprecation warning
- [ ] Verify build output shows `ƒ Proxy (Middleware)` instead of the deprecation warning
- [ ] Test CORS: make an API request from the extension — verify it still works
- [ ] Test CORS preflight: verify OPTIONS requests return proper CORS headers
- [ ] Verify extension-origin requests (`moz-extension://`, `chrome-extension://`) are still allowed

### 10. Remove Deprecated Supabase Packages
**Files changed:** `package.json`

- [ ] Verify `@supabase/auth-helpers-nextjs` is removed from `package.json`
- [ ] Verify `@supabase/auth-helpers-react` is removed from `package.json`
- [ ] Verify `@supabase/ssr` (v0.6.1+) and `@supabase/supabase-js` (v2.54.0+) remain
- [ ] Verify login/logout still works in the main app
- [ ] Verify auth state persists across page refreshes
- [ ] Verify `npm run build` succeeds

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `extension/manifest.json` | v0.3.0 — added contextMenus, notifications, alarms, sidebar_action, commands |
| `extension/content.js` | Full rewrite — highlight-to-card UI, selection button, message listeners |
| `extension/background.js` | Added context menu, keyboard shortcut handler, notification reminders with alarms |
| `extension/popup/popup.html` | Batch card entries, settings view, header actions |
| `extension/popup/popup.js` | Batch creation, remember-after-autoclose (draft save/restore), settings |
| `extension/popup/popup.css` | New styles for batch cards, settings, secondary buttons |
| `extension/sidebar/sidebar.html` | **New** — Firefox sidebar with Add Card + Study Now tabs |
| `extension/sidebar/sidebar.js` | **New** — Sidebar logic: auth, deck loading, card flip study mode |
| `extension/newtab/newtab.html` | **New** — New tab study page with deck grid and flashcard UI |
| `extension/newtab/newtab.js` | **New** — New tab logic: deck loading, study session, keyboard shortcuts |
| `src/middleware.ts` → `src/proxy.ts` | Renamed file, renamed exported function `middleware` → `proxy` |
| `package.json` | Removed `@supabase/auth-helpers-nextjs` and `@supabase/auth-helpers-react` |
