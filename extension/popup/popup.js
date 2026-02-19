const SUPABASE_URL = "https://dbmxbfeuxflznukpuvnf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MFTgfJ7nuchS4tQmegpmRA_TRslOmk8";
const API_URL = "https://imitation-broken-dawn-9001.fly.dev/api";

// 30 days in milliseconds
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// DOM elements
const loginView = document.getElementById("login-view");
const mainView = document.getElementById("main-view");
const settingsView = document.getElementById("settings-view");
const loadingView = document.getElementById("loading-view");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const deckSelect = document.getElementById("deck-select");
const cardEntries = document.getElementById("card-entries");
const addAnotherBtn = document.getElementById("add-another-btn");
const addCardBtn = document.getElementById("add-card-btn");
const addError = document.getElementById("add-error");
const addSuccess = document.getElementById("add-success");
const settingsBtn = document.getElementById("settings-btn");
const settingsBackBtn = document.getElementById("settings-back-btn");
const reminderEnabled = document.getElementById("reminder-enabled");
const reminderInterval = document.getElementById("reminder-interval");

function showView(view) {
  loginView.classList.add("hidden");
  mainView.classList.add("hidden");
  settingsView.classList.add("hidden");
  loadingView.classList.add("hidden");
  view.classList.remove("hidden");
}

// ── Auth helpers ──

async function getStoredAuth() {
  const result = await browser.storage.local.get([
    "access_token",
    "refresh_token",
    "expires_at",
  ]);
  if (!result.access_token) return null;

  // Check if 30-day session has expired
  if (result.expires_at && Date.now() > result.expires_at) {
    const refreshed = await refreshSession(result.refresh_token);
    if (refreshed) return refreshed;
    await browser.storage.local.remove([
      "access_token",
      "refresh_token",
      "expires_at",
    ]);
    return null;
  }

  // Check if JWT itself is expired (typically 1 hour) and refresh
  try {
    const payload = JSON.parse(atob(result.access_token.split(".")[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      const refreshed = await refreshSession(result.refresh_token);
      if (refreshed) return refreshed;
      await browser.storage.local.remove([
        "access_token",
        "refresh_token",
        "expires_at",
      ]);
      return null;
    }
  } catch {
    // If we can't parse JWT, try using it anyway
  }

  return result.access_token;
}

async function refreshSession(refreshToken) {
  if (!refreshToken) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    await browser.storage.local.set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + SESSION_DURATION_MS,
    });
    return data.access_token;
  } catch {
    return null;
  }
}

async function login(email, password) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.msg || "Login failed");
  }

  const data = await res.json();
  await browser.storage.local.set({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + SESSION_DURATION_MS,
  });
  return data.access_token;
}

// ── API helpers ──

async function fetchDecks(token) {
  const res = await fetch(`${API_URL}/decks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch decks");
  return res.json();
}

async function addCard(token, deckId, front, back) {
  const res = await fetch(`${API_URL}/decks/${deckId}/cards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ front, back }),
  });
  if (!res.ok) throw new Error("Failed to add card");
  return res.json();
}

// ── Deck loading ──

async function loadDecks(token) {
  try {
    const decks = await fetchDecks(token);
    deckSelect.innerHTML = "";

    if (decks.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No decks — create one in the app";
      deckSelect.appendChild(opt);
      return;
    }

    for (const deck of decks) {
      const opt = document.createElement("option");
      opt.value = deck.id;
      opt.textContent = `${deck.name} (${deck.card_count})`;
      deckSelect.appendChild(opt);
    }

    // Restore last selected deck
    const stored = await browser.storage.local.get("selected_deck_id");
    if (stored.selected_deck_id) {
      const exists = decks.some(
        (d) => String(d.id) === String(stored.selected_deck_id)
      );
      if (exists) {
        deckSelect.value = stored.selected_deck_id;
      }
    }
  } catch (err) {
    deckSelect.innerHTML =
      '<option value="">Failed to load decks</option>';
  }
}

// Save selected deck when changed
deckSelect.addEventListener("change", () => {
  browser.storage.local.set({ selected_deck_id: deckSelect.value });
});

// ── Batch card management ──

let cardCount = 1;

function addCardEntry() {
  const index = cardCount++;
  const entry = document.createElement("div");
  entry.className = "card-entry";
  entry.dataset.index = index;
  entry.innerHTML = `
    <div class="card-entry-header">
      <span class="card-entry-label">Card ${index + 1}</span>
      <button class="btn-remove-card" title="Remove card">&times;</button>
    </div>
    <div class="form-group">
      <label>Question (Front)</label>
      <textarea class="card-front" placeholder="Enter question" rows="2"></textarea>
    </div>
    <div class="form-group">
      <label>Answer (Back)</label>
      <textarea class="card-back" placeholder="Enter answer" rows="2"></textarea>
    </div>
  `;
  cardEntries.appendChild(entry);

  entry.querySelector(".btn-remove-card").addEventListener("click", () => {
    entry.remove();
    renumberCards();
  });

  // Show remove buttons on all cards when there's more than one
  updateRemoveButtons();
  return entry;
}

function renumberCards() {
  const entries = cardEntries.querySelectorAll(".card-entry");
  entries.forEach((entry, i) => {
    entry.querySelector(".card-entry-label").textContent = `Card ${i + 1}`;
  });
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const entries = cardEntries.querySelectorAll(".card-entry");
  const removeBtns = cardEntries.querySelectorAll(".btn-remove-card");
  removeBtns.forEach((btn) => {
    if (entries.length > 1) {
      btn.classList.remove("hidden");
    } else {
      btn.classList.add("hidden");
    }
  });
}

addAnotherBtn.addEventListener("click", () => {
  addCardEntry();
});

// ── Remember after autoclose ──
// When popup opens, restore any previously entered text that wasn't submitted

async function restoreDraft() {
  const stored = await browser.storage.local.get(["draft_cards"]);
  if (stored.draft_cards && stored.draft_cards.length > 0) {
    const drafts = stored.draft_cards;
    // Fill first card
    const firstFront = cardEntries.querySelector(".card-front");
    const firstBack = cardEntries.querySelector(".card-back");
    if (drafts[0]) {
      firstFront.value = drafts[0].front || "";
      firstBack.value = drafts[0].back || "";
    }
    // Add additional card entries for remaining drafts
    for (let i = 1; i < drafts.length; i++) {
      const entry = addCardEntry();
      entry.querySelector(".card-front").value = drafts[i].front || "";
      entry.querySelector(".card-back").value = drafts[i].back || "";
    }
  }
}

function saveDraft() {
  const entries = cardEntries.querySelectorAll(".card-entry");
  const drafts = [];
  entries.forEach((entry) => {
    const front = entry.querySelector(".card-front").value;
    const back = entry.querySelector(".card-back").value;
    if (front || back) {
      drafts.push({ front, back });
    }
  });
  browser.storage.local.set({ draft_cards: drafts });
}

// Auto-save draft on any text input
cardEntries.addEventListener("input", () => {
  saveDraft();
});

// ── Login handler ──

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    loginError.textContent = "Please enter email and password";
    loginError.classList.remove("hidden");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";
  loginError.classList.add("hidden");

  try {
    const token = await login(email, password);
    await showMainView(token);
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove("hidden");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});

// Allow Enter key to submit login
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

// Logout handler
logoutBtn.addEventListener("click", async () => {
  await browser.storage.local.remove([
    "access_token",
    "refresh_token",
    "expires_at",
    "draft_cards",
  ]);
  showView(loginView);
});

// ── Add card(s) handler (batch) ──

addCardBtn.addEventListener("click", async () => {
  const deckId = deckSelect.value;

  if (!deckId) {
    addError.textContent = "Please select a deck";
    addError.classList.remove("hidden");
    addSuccess.classList.add("hidden");
    return;
  }

  // Collect all card entries
  const entries = cardEntries.querySelectorAll(".card-entry");
  const cards = [];
  for (const entry of entries) {
    const front = entry.querySelector(".card-front").value.trim();
    const back = entry.querySelector(".card-back").value.trim();
    if (front && back) {
      cards.push({ front, back });
    }
  }

  if (cards.length === 0) {
    addError.textContent = "Please fill in at least one card with both question and answer";
    addError.classList.remove("hidden");
    addSuccess.classList.add("hidden");
    return;
  }

  addCardBtn.disabled = true;
  addCardBtn.textContent = "Adding...";
  addError.classList.add("hidden");
  addSuccess.classList.add("hidden");

  try {
    const token = await getStoredAuth();
    if (!token) {
      showView(loginView);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const card of cards) {
      try {
        await addCard(token, deckId, card.front, card.back);
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount > 0) {
      addSuccess.textContent = `${successCount} card(s) added, ${failCount} failed`;
      addSuccess.classList.remove("hidden");
    } else {
      addSuccess.textContent = `${successCount} card${successCount === 1 ? "" : "s"} added!`;
      addSuccess.classList.remove("hidden");
    }

    // Clear all card entries back to one empty card
    cardEntries.innerHTML = "";
    cardCount = 0;
    addCardEntry();
    // Clear the first card's remove button
    updateRemoveButtons();

    // Clear draft since cards were submitted
    await browser.storage.local.remove(["draft_cards"]);

    setTimeout(() => addSuccess.classList.add("hidden"), 3000);
  } catch (err) {
    addError.textContent = err.message;
    addError.classList.remove("hidden");
  } finally {
    addCardBtn.disabled = false;
    addCardBtn.textContent = "Add Card(s)";
  }
});

// ── Settings ──

settingsBtn.addEventListener("click", async () => {
  showView(settingsView);
  // Load current settings
  const stored = await browser.storage.local.get(["reminder_enabled", "reminder_interval_minutes"]);
  reminderEnabled.checked = !!stored.reminder_enabled;
  if (stored.reminder_interval_minutes) {
    reminderInterval.value = String(stored.reminder_interval_minutes);
  }
});

settingsBackBtn.addEventListener("click", async () => {
  // Save settings
  await browser.storage.local.set({
    reminder_enabled: reminderEnabled.checked,
    reminder_interval_minutes: parseInt(reminderInterval.value, 10),
  });
  const savedMsg = document.getElementById("settings-saved");
  savedMsg.classList.remove("hidden");
  setTimeout(() => savedMsg.classList.add("hidden"), 1500);

  const token = await getStoredAuth();
  if (token) {
    showView(mainView);
  } else {
    showView(loginView);
  }
});

// ── Init ──

async function showMainView(token) {
  showView(mainView);
  await loadDecks(token);
  await restoreDraft();
}

(async () => {
  const token = await getStoredAuth();
  if (token) {
    await showMainView(token);
  } else {
    showView(loginView);
  }
})();
