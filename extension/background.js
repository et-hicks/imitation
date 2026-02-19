// Background script for the Imitation browser extension.
// Runs as a persistent background page in Firefox.

browser.runtime.onInstalled.addListener(() => {
  console.log("Imitation extension installed");

  // Create context menu item for highlight-to-card
  browser.contextMenus.create({
    id: "imitation-add-card",
    title: "Add to Imitation Flashcards",
    contexts: ["selection"],
  });
});

// Context menu click handler
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "imitation-add-card" && tab.id) {
    browser.tabs.sendMessage(tab.id, {
      type: "CREATE_CARD_FROM_SELECTION",
      text: info.selectionText || "",
    });
  }
});

// Global keyboard shortcut handler (Alt+Shift+F)
browser.commands.onCommand.addListener((command) => {
  if (command === "quick-add") {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0] && tabs[0].id) {
        browser.tabs.sendMessage(tabs[0].id, { type: "OPEN_QUICK_ADD" });
      }
    });
  }
});

// Listen for messages from the popup or content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_STATUS") {
    sendResponse({ status: "ok" });
  }
});

// Notification reminders for due cards
const REMINDER_ALARM_NAME = "imitation-study-reminder";

async function setupReminders() {
  const stored = await browser.storage.local.get(["reminder_enabled", "reminder_interval_minutes"]);
  if (stored.reminder_enabled) {
    const interval = stored.reminder_interval_minutes || 120; // default 2 hours
    browser.alarms.create(REMINDER_ALARM_NAME, { periodInMinutes: interval });
  } else {
    browser.alarms.clear(REMINDER_ALARM_NAME);
  }
}

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== REMINDER_ALARM_NAME) return;

  try {
    const result = await browser.storage.local.get(["access_token"]);
    if (!result.access_token) return;

    const API_URL = "https://imitation-broken-dawn-9001.fly.dev/api";
    const res = await fetch(`${API_URL}/decks`, {
      headers: { Authorization: `Bearer ${result.access_token}` },
    });
    if (!res.ok) return;
    const decks = await res.json();

    let totalDue = 0;
    for (const deck of decks) {
      try {
        const studyRes = await fetch(`${API_URL}/decks/${deck.id}/study`, {
          headers: { Authorization: `Bearer ${result.access_token}` },
        });
        if (studyRes.ok) {
          const studyData = await studyRes.json();
          const dueCount = Array.isArray(studyData) ? studyData.length : (studyData.due_count || 0);
          totalDue += dueCount;
        }
      } catch {
        // skip this deck
      }
    }

    if (totalDue > 0) {
      browser.notifications.create("imitation-due-reminder", {
        type: "basic",
        iconUrl: "icons/icon-96.png",
        title: "Imitation — Time to Study!",
        message: `You have ${totalDue} card${totalDue === 1 ? "" : "s"} due for review.`,
      });
    }
  } catch {
    // silently fail
  }
});

// Initialize reminders on startup
setupReminders();

// Re-setup when settings change
browser.storage.onChanged.addListener((changes) => {
  if (changes.reminder_enabled || changes.reminder_interval_minutes) {
    setupReminders();
  }
});
