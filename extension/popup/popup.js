document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");

  browser.runtime.sendMessage({ type: "GET_STATUS" }).then((response) => {
    if (response && response.status === "ok") {
      statusEl.textContent = "Extension is running.";
    }
  }).catch(() => {
    statusEl.textContent = "Could not reach background script.";
  });
});
