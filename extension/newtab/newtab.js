// New Tab study page for the Imitation browser extension.
// Replaces the new tab with a flashcard review interface.

const API_URL = "https://imitation-broken-dawn-9001.fly.dev/api";

const loginEl = document.getElementById("nt-login");
const decksEl = document.getElementById("nt-decks");
const studyEl = document.getElementById("nt-study");
const loadingEl = document.getElementById("nt-loading");

function showSection(section) {
  loginEl.classList.add("hidden");
  decksEl.classList.add("hidden");
  studyEl.classList.add("hidden");
  loadingEl.classList.add("hidden");
  section.classList.remove("hidden");
}

async function getStoredAuth() {
  const result = await browser.storage.local.get(["access_token"]);
  return result.access_token || null;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Deck listing ──

async function loadDecks() {
  const token = await getStoredAuth();
  if (!token) { showSection(loginEl); return; }

  const grid = document.getElementById("nt-deck-grid");
  grid.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/decks`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error();
    const decks = await res.json();

    if (decks.length === 0) {
      grid.innerHTML = '<p style="color:rgba(255,255,255,0.4); grid-column:1/-1; text-align:center; padding:40px;">No decks yet. Create one in the app!</p>';
      showSection(decksEl);
      return;
    }

    for (const deck of decks) {
      const card = document.createElement("div");
      card.className = "deck-card";
      const count = deck.card_count || 0;
      card.innerHTML = `
        <div class="deck-card-name">${escapeHtml(deck.name)}</div>
        <div class="deck-card-stats">
          <span class="stat"><span class="stat-dot stat-due"></span> ${count} card${count === 1 ? "" : "s"}</span>
        </div>
      `;
      if (count > 0) {
        card.addEventListener("click", () => startStudy(deck, token));
      } else {
        card.style.opacity = "0.5";
        card.style.cursor = "default";
      }
      grid.appendChild(card);
    }

    showSection(decksEl);
  } catch {
    grid.innerHTML = '<p style="color:#f87171; grid-column:1/-1; text-align:center; padding:40px;">Failed to load decks.</p>';
    showSection(decksEl);
  }
}

// ── Study session ──

let studyCards = [];
let studyIndex = 0;

async function startStudy(deck, token) {
  document.getElementById("nt-deck-name").textContent = deck.name;
  document.getElementById("nt-complete").classList.add("hidden");
  showSection(studyEl);

  try {
    const res = await fetch(`${API_URL}/decks/${deck.id}/study`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    studyCards = Array.isArray(data) ? data : (data.cards || []);
    studyIndex = 0;
    showCard();
  } catch {
    document.getElementById("nt-card-front").textContent = "Failed to load cards";
  }
}

function showCard() {
  const card = document.getElementById("nt-card");
  const front = document.getElementById("nt-card-front");
  const back = document.getElementById("nt-card-back");
  const actions = document.getElementById("nt-actions");
  const progress = document.getElementById("nt-progress");
  const complete = document.getElementById("nt-complete");

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

document.getElementById("nt-card").addEventListener("click", () => {
  const card = document.getElementById("nt-card");
  if (!card.classList.contains("flipped")) {
    card.classList.add("flipped");
    document.getElementById("nt-actions").classList.remove("hidden");
  }
});

document.getElementById("nt-actions").addEventListener("click", async (e) => {
  const quality = e.target.dataset.quality;
  if (!quality) return;

  const token = await getStoredAuth();
  if (!token) return;

  const c = studyCards[studyIndex];
  fetch(`${API_URL}/cards/${c.id}/review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ quality: parseInt(quality, 10) }),
  }).catch(() => {});

  studyIndex++;
  showCard();
});

document.getElementById("nt-back-btn").addEventListener("click", () => {
  loadDecks();
});

document.getElementById("nt-complete-back").addEventListener("click", () => {
  loadDecks();
});

// Keyboard shortcuts for study
document.addEventListener("keydown", (e) => {
  if (studyEl.classList.contains("hidden")) return;

  const card = document.getElementById("nt-card");
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    if (!card.classList.contains("flipped")) {
      card.click();
    }
  }
  if (card.classList.contains("flipped")) {
    if (e.key === "1") document.querySelector("#nt-actions .btn-again").click();
    if (e.key === "2") document.querySelector("#nt-actions .btn-hard").click();
    if (e.key === "3") document.querySelector("#nt-actions .btn-good").click();
    if (e.key === "4") document.querySelector("#nt-actions .btn-easy").click();
  }
});

// ── Init ──

loadDecks();
