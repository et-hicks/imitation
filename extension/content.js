// Content script for the Imitation browser extension.
// Injected into web pages based on the matches in manifest.json.

(() => {
  const API_URL = "https://imitation-broken-dawn-9001.fly.dev/api";
  let floatingUI = null;
  let currentSelection = "";
  let highlightEnabled = true;

  // Load setting once and keep it in sync
  browser.storage.local.get("highlight_enabled").then((stored) => {
    if (stored.highlight_enabled === false) highlightEnabled = false;
  });
  browser.storage.onChanged.addListener((changes) => {
    if (changes.highlight_enabled) {
      highlightEnabled = changes.highlight_enabled.newValue !== false;
    }
  });

  // ── Highlight-to-card: inject floating UI on text selection ──

  function createFloatingUI() {
    if (floatingUI) return floatingUI;

    const container = document.createElement("div");
    container.id = "imitation-highlight-ui";
    container.innerHTML = `
      <div id="imitation-overlay" style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4); z-index: 2147483645;
        display: none;
      "></div>
      <div id="imitation-panel" style="
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 380px; max-height: 80vh; overflow-y: auto;
        background: #1a1a2e; color: #fff; border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 2147483646;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px; display: none;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:16px; font-weight:600;">Add Flashcard</span>
          <button id="imitation-close" style="
            background:none; border:none; color:rgba(255,255,255,0.5);
            font-size:20px; cursor:pointer; padding:0 4px;
          ">&times;</button>
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block; font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Deck</label>
          <select id="imitation-deck" style="
            width:100%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);
            border-radius:8px; padding:8px 12px; color:#fff; font-size:13px; outline:none;
          "><option value="">Loading decks...</option></select>
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block; font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Front (Question)</label>
          <textarea id="imitation-front" rows="3" style="
            width:100%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);
            border-radius:8px; padding:8px 12px; color:#fff; font-size:13px; outline:none;
            font-family:inherit; resize:vertical; box-sizing:border-box;
          "></textarea>
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block; font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Back (Answer)</label>
          <textarea id="imitation-back" rows="3" style="
            width:100%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);
            border-radius:8px; padding:8px 12px; color:#fff; font-size:13px; outline:none;
            font-family:inherit; resize:vertical; box-sizing:border-box;
          "></textarea>
        </div>
        <div id="imitation-msg" style="font-size:12px; margin-bottom:8px; display:none;"></div>
        <button id="imitation-add" style="
          width:100%; padding:10px; background:#0284c7; color:#fff; border:none;
          border-radius:8px; font-size:14px; font-weight:500; cursor:pointer;
        ">Add Card</button>
      </div>
    `;
    document.documentElement.appendChild(container);
    floatingUI = container;

    // Close handlers
    container.querySelector("#imitation-close").addEventListener("click", hidePanel);
    container.querySelector("#imitation-overlay").addEventListener("click", hidePanel);

    // Add card handler
    container.querySelector("#imitation-add").addEventListener("click", handleAddCard);

    return container;
  }

  function showPanel(selectedText) {
    const ui = createFloatingUI();
    const overlay = ui.querySelector("#imitation-overlay");
    const panel = ui.querySelector("#imitation-panel");
    const front = ui.querySelector("#imitation-front");
    const msg = ui.querySelector("#imitation-msg");

    overlay.style.display = "block";
    panel.style.display = "block";
    front.value = selectedText;
    msg.style.display = "none";

    loadDecksIntoPanel();
  }

  function hidePanel() {
    if (!floatingUI) return;
    floatingUI.querySelector("#imitation-overlay").style.display = "none";
    floatingUI.querySelector("#imitation-panel").style.display = "none";
  }

  function showMessage(text, isError) {
    const msg = floatingUI.querySelector("#imitation-msg");
    msg.textContent = text;
    msg.style.color = isError ? "#f87171" : "#4ade80";
    msg.style.display = "block";
    if (!isError) {
      setTimeout(() => { msg.style.display = "none"; }, 2000);
    }
  }

  async function loadDecksIntoPanel() {
    const deckSelect = floatingUI.querySelector("#imitation-deck");
    try {
      const result = await browser.storage.local.get(["access_token"]);
      if (!result.access_token) {
        deckSelect.innerHTML = '<option value="">Please log in via extension popup</option>';
        return;
      }

      const res = await fetch(`${API_URL}/decks`, {
        headers: { Authorization: `Bearer ${result.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const decks = await res.json();

      deckSelect.innerHTML = "";
      if (decks.length === 0) {
        deckSelect.innerHTML = '<option value="">No decks — create one in the app</option>';
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
        const exists = decks.some(d => String(d.id) === String(stored.selected_deck_id));
        if (exists) deckSelect.value = stored.selected_deck_id;
      }
    } catch {
      deckSelect.innerHTML = '<option value="">Failed to load decks</option>';
    }
  }

  async function handleAddCard() {
    const deckId = floatingUI.querySelector("#imitation-deck").value;
    const front = floatingUI.querySelector("#imitation-front").value.trim();
    const back = floatingUI.querySelector("#imitation-back").value.trim();
    const addBtn = floatingUI.querySelector("#imitation-add");

    if (!deckId) { showMessage("Please select a deck", true); return; }
    if (!front || !back) { showMessage("Please fill in both fields", true); return; }

    addBtn.disabled = true;
    addBtn.textContent = "Adding...";

    try {
      const result = await browser.storage.local.get(["access_token"]);
      if (!result.access_token) { showMessage("Please log in first", true); return; }

      // Save selected deck for future use
      await browser.storage.local.set({ selected_deck_id: deckId });

      const res = await fetch(`${API_URL}/decks/${deckId}/cards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${result.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ front, back }),
      });

      if (!res.ok) throw new Error("Failed to add card");

      showMessage("Card added!", false);
      floatingUI.querySelector("#imitation-front").value = "";
      floatingUI.querySelector("#imitation-back").value = "";
    } catch (err) {
      showMessage(err.message, true);
    } finally {
      addBtn.disabled = false;
      addBtn.textContent = "Add Card";
    }
  }

  // ── Context menu / selection handling ──

  // Show a small "Add to Imitation" button near selected text
  let selectionBtn = null;

  function createSelectionButton() {
    if (selectionBtn) return selectionBtn;
    const btn = document.createElement("button");
    btn.id = "imitation-sel-btn";
    btn.textContent = "+ Flashcard";
    btn.style.cssText = `
      position: absolute; z-index: 2147483644;
      background: #0284c7; color: #fff; border: none; border-radius: 6px;
      padding: 4px 10px; font-size: 12px; font-weight: 500; cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.style.display = "none";
      showPanel(currentSelection);
    });
    document.documentElement.appendChild(btn);
    selectionBtn = btn;
    return btn;
  }

  document.addEventListener("mouseup", (e) => {
    // Ignore clicks inside our own UI
    if (floatingUI && floatingUI.contains(e.target)) return;
    if (selectionBtn && selectionBtn.contains(e.target)) return;
    if (!highlightEnabled) return;

    // Small delay lets the browser finalize the selection after mouseup
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";

      if (text.length > 2) {
        currentSelection = text;
        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const btn = createSelectionButton();
          btn.style.top = `${window.scrollY + rect.bottom + 6}px`;
          btn.style.left = `${window.scrollX + rect.left}px`;
          btn.style.display = "block";
        } catch {
          // Selection was cleared before we could read the range
        }
      } else if (selectionBtn) {
        selectionBtn.style.display = "none";
      }
    }, 10);
  });

  // Hide selection button when clicking elsewhere
  document.addEventListener("mousedown", (e) => {
    if (selectionBtn && !selectionBtn.contains(e.target)) {
      selectionBtn.style.display = "none";
    }
  });

  // ── Listen for messages from background script ──

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CREATE_CARD_FROM_SELECTION") {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";
      if (text) {
        showPanel(text);
      } else {
        showPanel("");
      }
      sendResponse({ ok: true });
    }

    if (message.type === "OPEN_QUICK_ADD") {
      showPanel("");
      sendResponse({ ok: true });
    }
  });
})();
