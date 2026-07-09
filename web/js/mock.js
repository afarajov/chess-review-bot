// Mock lists for the design prototype.
// Backend note: replace with real API calls — see web/README.md.

const MOCK_RECENT_GAMES = [
  { id: "abc123", source: "chess.com", white: "konteyni", black: "Snowstormme", result: "win",
    tc: "15+10 rapid", date: "Jun 19, 2026", moves: 57 },
  { id: "g2", source: "chess.com", white: "DarkHorse77", black: "konteyni", result: "loss",
    tc: "10 min rapid", date: "Jun 18, 2026", moves: 41 },
  { id: "g3", source: "lichess", white: "konteyni", black: "matefinder", result: "win",
    tc: "5+3 blitz", date: "Jun 17, 2026", moves: 34 },
  { id: "g4", source: "chess.com", white: "pawnstorm_x", black: "konteyni", result: "draw",
    tc: "15+10 rapid", date: "Jun 15, 2026", moves: 68 },
  { id: "g5", source: "lichess", white: "konteyni", black: "QueenSac2011", result: "loss",
    tc: "3+2 blitz", date: "Jun 14, 2026", moves: 29 },
  { id: "g6", source: "chess.com", white: "konteyni", black: "rook_and_roll", result: "win",
    tc: "10 min rapid", date: "Jun 12, 2026", moves: 45 },
];

// Games shown in the profile "My games" tab (same shape).
const MOCK_MY_GAMES = MOCK_RECENT_GAMES;

function renderGameRow(g) {
  const letter = { win: "W", loss: "L", draw: "D" }[g.result];
  const cls = { win: "win", loss: "loss", draw: "draw" }[g.result];
  const srcCls = g.source === "chess.com" ? "chesscom" : "lichess";
  return `
    <button class="game-row" onclick="location.href='review.html?game=${g.id}'">
      <span class="result-dot ${cls}">${letter}</span>
      <span class="game-info">
        <span class="players">${g.white} — ${g.black}</span>
        <span class="meta">${g.tc} · ${g.moves} moves · ${g.date}</span>
      </span>
      <span class="source-tag ${srcCls}">${g.source}</span>
      <span class="go">→</span>
    </button>`;
}
