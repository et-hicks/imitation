// Sidebar script for the Imitation browser extension.
// Provides both "Add Card" and "Study Now" functionality.

const SUPABASE_URL = "https://dbmxbfeuxflznukpuvnf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MFTgfJ7nuchS4tQmegpmRA_TRslOmk8";
const API_URL = "https://imitation-broken-dawn-9001.fly.dev/api";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// DOM elements
const loginView = document.getElementById("login-view");
const mainContent = document.getElementById("main-content");
const loadingEl = document.getElementById("sb-loading");

function showSection(section) {
  loginView.classList.add("hidden");
  mainContent.classList.add("hidden");
  loadingEl.classList.add("hidden");
  section.classList.remove("hidden");
}

// ── Auth ──

async function getStoredAuth() {
  const result = await browser.storage.local.get(["access_token", "refresh_token", "expires_at"]);
  if (!result.access_token) return null;

  if (result.expires_at && Date.now() > result.expires_at) {
    const refreshed = await refreshSession(result.refresh_token);
    if (refreshed) return refreshed;
    await browser.storage.local.remove(["access_token", "refresh_token", "expires_at"]);
    return null;
  }

  try {
    const payload = JSON.parse(atob(result.access_token.split(".")[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      const refreshed = await refreshSession(result.refresh_token);
      if (refreshed) return refreshed;
      await browser.storage.local.remove(["access_token", "refresh_token", "expires_at"]);
      return null;
    }
  } catch { /* use token as-is */ }

  return result.access_token;
}

async function refreshSession(refreshToken) {
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await browser.storage.local.set({
      access_token: data.access_token, refresh_token: data.refresh_token,
      expires_at: Date.now() + SESSION_DURATION_MS,
    });
    return data.access_token;
  } catch { return null; }
}

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.msg || "Login failed");
  }
  const data = await res.json();
  await browser.storage.local.set({
    access_token: data.access_token, refresh_token: data.refresh_token,
    expires_at: Date.now() + SESSION_DURATION_MS,
  });
  return data.access_token;
}

// ── Login UI ──

document.getElementById("sb-login-btn").addEventListener("click", async () => {
  const email = document.getElementById("sb-email").value.trim();
  const password = document.getElementById("sb-password").value;
  const errEl = document.getElementById("sb-login-error");
  const btn = document.getElementById("sb-login-btn");

  if (!email || !password) { errEl.textContent = "Enter email and password"; errEl.classList.remove("hidden"); return; }
  btn.disabled = true; btn.textContent = "Signing in..."; errEl.classList.add("hidden");

  try {
    const token = await login(email, password);
    await initMain(token);
  } catch (err) {
    errEl.textContent = err.message; errEl.classList.remove("hidden");
  } finally { btn.disabled = false; btn.textContent = "Sign In"; }
});

document.getElementById("sb-password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("sb-login-btn").click();
});

document.getElementById("sb-logout-btn").addEventListener("click", async () => {
  await browser.storage.local.remove(["access_token", "refresh_token", "expires_at"]);
  showSection(loginView);
});

// ── Tabs ──

const tabBtns = document.querySelectorAll(".tab-btn");
const tabAdd = document.getElementById("tab-add");
const tabStudy = document.getElementById("tab-study");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (btn.dataset.tab === "add") {
      tabAdd.classList.remove("hidden");
      tabStudy.classList.add("hidden");
    } else {
      tabAdd.classList.add("hidden");
      tabStudy.classList.remove("hidden");
      loadStudyDecks();
    }
  });
});

// ── Add Card Tab ──

let currentToken = null;

async function loadDecks(token) {
  const sel = document.getElementById("sb-deck-select");
  try {
    const res = await fetch(`${API_URL}/decks`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error();
    const decks = await res.json();
    sel.innerHTML = "";
    if (decks.length === 0) {
      sel.innerHTML = '<option value="">No decks — create one in the app</option>';
      return decks;
    }
    for (const d of decks) {
      const opt = document.createElement("option");
      opt.value = d.id; opt.textContent = `${d.name} (${d.card_count})`;
      sel.appendChild(opt);
    }
    const stored = await browser.storage.local.get("selected_deck_id");
    if (stored.selected_deck_id) {
      const exists = decks.some((d) => String(d.id) === String(stored.selected_deck_id));
      if (exists) sel.value = stored.selected_deck_id;
    }
    return decks;
  } catch {
    sel.innerHTML = '<option value="">Failed to load decks</option>';
    return [];
  }
}

document.getElementById("sb-deck-select").addEventListener("change", (e) => {
  browser.storage.local.set({ selected_deck_id: e.target.value });
});

document.getElementById("sb-add-btn").addEventListener("click", async () => {
  const deckId = document.getElementById("sb-deck-select").value;
  const front = document.getElementById("sb-front").value.trim();
  const back = document.getElementById("sb-back").value.trim();
  const btn = document.getElementById("sb-add-btn");
  const errEl = document.getElementById("sb-add-error");
  const successEl = document.getElementById("sb-add-success");

  if (!deckId) { errEl.textContent = "Select a deck"; errEl.classList.remove("hidden"); return; }
  if (!front || !back) { errEl.textContent = "Fill in both fields"; errEl.classList.remove("hidden"); return; }

  btn.disabled = true; btn.textContent = "Adding...";
  errEl.classList.add("hidden"); successEl.classList.add("hidden");

  try {
    const token = await getStoredAuth();
    if (!token) { showSection(loginView); return; }
    const res = await fetch(`${API_URL}/decks/${deckId}/cards`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ front, back }),
    });
    if (!res.ok) throw new Error("Failed to add card");
    document.getElementById("sb-front").value = "";
    document.getElementById("sb-back").value = "";
    successEl.textContent = "Card added!";
    successEl.classList.remove("hidden");
    setTimeout(() => successEl.classList.add("hidden"), 2000);
  } catch (err) {
    errEl.textContent = err.message; errEl.classList.remove("hidden");
  } finally { btn.disabled = false; btn.textContent = "Add Card"; }
});

// ── Study Tab ──

let studyCards = [];
let studyIndex = 0;
let allDecks = [];

async function loadStudyDecks() {
  const token = await getStoredAuth();
  if (!token) { showSection(loginView); return; }

  const listEl = document.getElementById("study-decks");
  listEl.innerHTML = '<li style="color:rgba(255,255,255,0.4); font-size:13px; padding:20px 0; text-align:center;">Loading decks...</li>';

  try {
    const res = await fetch(`${API_URL}/decks`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error();
    allDecks = await res.json();

    listEl.innerHTML = "";
    if (allDecks.length === 0) {
      listEl.innerHTML = '<li style="color:rgba(255,255,255,0.4); font-size:13px; padding:20px 0; text-align:center;">No decks yet</li>';
      return;
    }

    for (const deck of allDecks) {
      const li = document.createElement("li");
      li.className = "deck-item";
      const count = deck.card_count || 0;
      li.innerHTML = `
        <div>
          <div class="deck-name">${escapeHtml(deck.name)}</div>
          <div class="deck-stats">${count} card${count === 1 ? "" : "s"}</div>
        </div>
        <span class="deck-badge ${count === 0 ? "empty" : ""}">${count > 0 ? "Study" : "Empty"}</span>
      `;
      if (count > 0) {
        li.addEventListener("click", () => startStudySession(deck, token));
      }
      listEl.appendChild(li);
    }
  } catch {
    listEl.innerHTML = '<li style="color:#f87171; font-size:13px; padding:20px 0; text-align:center;">Failed to load decks</li>';
  }
}

async function startStudySession(deck, token) {
  document.getElementById("study-deck-list").classList.add("hidden");
  document.getElementById("study-session").classList.remove("hidden");
  document.getElementById("study-deck-name").textContent = deck.name;
  document.getElementById("study-complete").classList.add("hidden");

  try {
    const res = await fetch(`${API_URL}/decks/${deck.id}/study`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    studyCards = Array.isArray(data) ? data : (data.cards || []);
    studyIndex = 0;
    showStudyCard();
  } catch {
    document.getElementById("study-card-front").textContent = "Failed to load cards";
  }
}

function showStudyCard() {
  const card = document.getElementById("study-card");
  const front = document.getElementById("study-card-front");
  const back = document.getElementById("study-card-back");
  const actions = document.getElementById("study-actions");
  const progress = document.getElementById("study-progress");
  const complete = document.getElementById("study-complete");

  if (studyIndex >= studyCards.length) {
    card.parentElement.classList.add("hidden");
    actions.classList.add("hidden");
    progress.textContent = "";
    complete.classList.remove("hidden");
    return;
  }

  complete.classList.add("hidden");
  card.parentElement.classList.remove("hidden");
  card.classList.remove("flipped");
  actions.classList.add("hidden");

  const c = studyCards[studyIndex];
  front.textContent = c.front;
  back.textContent = c.back;
  progress.textContent = `Card ${studyIndex + 1} of ${studyCards.length}`;
}

document.getElementById("study-card").addEventListener("click", () => {
  const card = document.getElementById("study-card");
  if (!card.classList.contains("flipped")) {
    card.classList.add("flipped");
    document.getElementById("study-actions").classList.remove("hidden");
  }
});

document.getElementById("study-actions").addEventListener("click", async (e) => {
  const quality = e.target.dataset.quality;
  if (!quality) return;

  const token = await getStoredAuth();
  if (!token) return;

  const c = studyCards[studyIndex];
  // Submit review (fire and forget)
  fetch(`${API_URL}/cards/${c.id}/review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ quality: parseInt(quality, 10) }),
  }).catch(() => {});

  studyIndex++;
  showStudyCard();
});

document.getElementById("study-back-btn").addEventListener("click", () => {
  document.getElementById("study-session").classList.add("hidden");
  document.getElementById("study-deck-list").classList.remove("hidden");
  loadStudyDecks();
});

// ── Utilities ──

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Init ──

async function initMain(token) {
  currentToken = token;
  showSection(mainContent);
  await loadDecks(token);
}

(async () => {
  const token = await getStoredAuth();
  if (token) {
    await initMain(token);
  } else {
    showSection(loginView);
  }
})();
