// Shared behaviour: landing input routing + player-games modal + simple tabs.

// --- landing: detect "game link" vs "nickname" -----------------------------

function handleAnalyzeSubmit() {
  const input = document.getElementById("analyze-input");
  const box = document.getElementById("analyze-box");
  const value = input.value.trim();

  if (!value) {
    box.classList.add("error");
    setTimeout(() => box.classList.remove("error"), 400);
    input.focus();
    return;
  }

  const looksLikeLink = /chess\.com|lichess\.org|https?:\/\//i.test(value);
  if (looksLikeLink) {
    // Backend note: POST the link to the analysis API, then redirect to the review.
    location.href = "review.html";
  } else {
    openPlayerModal(value);
  }
}

// --- player games modal -----------------------------------------------------

function openPlayerModal(nickname) {
  const overlay = document.getElementById("player-modal");
  document.getElementById("modal-player-name").textContent = nickname;
  document.getElementById("modal-player-avatar").textContent = nickname[0].toUpperCase();
  document.getElementById("modal-games").innerHTML =
    MOCK_RECENT_GAMES.map(renderGameRow).join("");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closePlayerModal() {
  document.getElementById("player-modal").classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const overlay = document.getElementById("player-modal");
    if (overlay && overlay.classList.contains("open")) closePlayerModal();
  }
});

// --- generic tabs (auth page, profile page) ---------------------------------

function switchTab(groupEl, paneName) {
  groupEl.querySelectorAll("button").forEach((b) =>
    b.classList.toggle("active", b.dataset.pane === paneName));
  document.querySelectorAll(`[data-pane-of="${groupEl.id}"]`).forEach((p) =>
    p.style.display = p.dataset.pane === paneName ? "" : "none");
}
