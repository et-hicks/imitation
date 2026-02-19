const SUPABASE_URL = "https://dbmxbfeuxflznukpuvnf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MFTgfJ7nuchS4tQmegpmRA_TRslOmk8";
const API_URL = "https://imitation-broken-dawn-9001.fly.dev/api";

// 30 days in milliseconds
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// DOM elements
const loginView = document.getElementById("login-view");
const mainView = document.getElementById("main-view");
const loadingView = document.getElementById("loading-view");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const deckSelect = document.getElementById("deck-select");
const cardFront = document.getElementById("card-front");
const cardBack = document.getElementById("card-back");
const addCardBtn = document.getElementById("add-card-btn");
const addError = document.getElementById("add-error");
const addSuccess = document.getElementById("add-success");

function showView(view) {
  loginView.classList.add("hidden");
  mainView.classList.add("hidden");
  loadingView.classList.add("hidden");
  view.classList.remove("hidden");
}

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

// Login handler
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
  ]);
  showView(loginView);
});

// Add card handler
addCardBtn.addEventListener("click", async () => {
  const deckId = deckSelect.value;
  const front = cardFront.value.trim();
  const back = cardBack.value.trim();

  if (!deckId) {
    addError.textContent = "Please select a deck";
    addError.classList.remove("hidden");
    addSuccess.classList.add("hidden");
    return;
  }
  if (!front || !back) {
    addError.textContent = "Please fill in both question and answer";
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
    await addCard(token, deckId, front, back);
    cardFront.value = "";
    cardBack.value = "";
    addSuccess.classList.remove("hidden");
    setTimeout(() => addSuccess.classList.add("hidden"), 2000);
  } catch (err) {
    addError.textContent = err.message;
    addError.classList.remove("hidden");
  } finally {
    addCardBtn.disabled = false;
    addCardBtn.textContent = "Add Card";
  }
});

async function showMainView(token) {
  showView(mainView);
  await loadDecks(token);
}

// Initialize
(async () => {
  const token = await getStoredAuth();
  if (token) {
    await showMainView(token);
  } else {
    showView(loginView);
  }
})();
