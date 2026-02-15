// Background script for the Imitation browser extension.
// Runs as a persistent background page in Firefox.

browser.runtime.onInstalled.addListener(() => {
  console.log("Imitation extension installed");
});

// Listen for messages from the popup or content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_STATUS") {
    sendResponse({ status: "ok" });
  }
});
