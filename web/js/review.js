// Game Review screen: board + arrows, move animation, eval bar, eval graph,
// move list, coach placeholder.
// Reads GAME from data.js. Backend note: fetch the same structure from your API instead.

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// order here = order of rows in the Game summary table
const CAT_LABEL = {
  Best: "Best move",
  Excellent: "Excellent",
  Good: "Good move",
  Book: "Book move",
  Forced: "Forced",
  Inaccuracy: "Inaccuracy",
  Mistake: "Mistake",
  Miss: "Miss",
  Blunder: "Blunder",
};

// thumbs-up icon for Excellent (inline SVG so it inherits the badge colour)
const THUMB_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.72v-2z"/></svg>`;

const CAT_SYM = {
  Best: "★", Excellent: THUMB_SVG, Good: "✓", Book: "≡", Forced: "□",
  Inaccuracy: "?!", Mistake: "?", Miss: "✕", Blunder: "??",
};

const CAT_COLOR = {
  Best: "var(--cat-best)",
  Excellent: "var(--cat-excellent)",
  Good: "var(--cat-good)",
  Book: "var(--cat-book)",
  Forced: "var(--cat-forced)",
  Inaccuracy: "var(--cat-inaccuracy)",
  Mistake: "var(--cat-mistake)",
  Miss: "var(--cat-miss)",
  Blunder: "var(--cat-blunder)",
};

const PIECE_GLYPH = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };

// winrate model — same formula the analysis backend uses
function winrate(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

function formatEval(cp, mateIn) {
  if (mateIn !== null && mateIn !== undefined) {
    if (mateIn === 0) return cp > 0 ? "1-0" : "0-1";
    return (cp > 0 ? "M" : "-M") + mateIn;
  }
  const p = cp / 100;
  return (p > 0 ? "+" : "") + p.toFixed(1);
}

// ---------------------------------------------------------------------------
// state

let ply = -1;              // -1 = starting position, 0..N-1 = after that move
let flipped = false;
const N = GAME.moves.length;

// ---------------------------------------------------------------------------
// board

function parseFen(fen) {
  const rows = fen.split(" ")[0].split("/");
  const grid = []; // grid[rank 0=8th][file 0=a]
  for (const row of rows) {
    const r = [];
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) r.push(null);
      else r.push(ch);
    }
    grid.push(r);
  }
  return grid;
}

function squareToRC(sq) {
  // "e4" -> {r: rank index from top (8th=0), c: file index (a=0)}
  return { r: 8 - +sq[1], c: sq.charCodeAt(0) - 97 };
}

function visualRC(sq) {
  const { r, c } = squareToRC(sq);
  return { r: flipped ? 7 - r : r, c: flipped ? 7 - c : c };
}

function renderBoard(fromPly) {
  const boardEl = document.getElementById("board");
  const fen = ply < 0 ? START_FEN : GAME.moves[ply].fen;
  const grid = parseFen(fen);

  const lastMove = ply >= 0 ? GAME.moves[ply].move : null;
  const lastSquares = lastMove ? [lastMove.slice(0, 2), lastMove.slice(2, 4)] : [];
  const toSq = lastMove ? lastMove.slice(2, 4) : null;
  const category = ply >= 0 ? GAME.moves[ply].category : null;

  let html = "";
  for (let vr = 0; vr < 8; vr++) {
    for (let vc = 0; vc < 8; vc++) {
      const r = flipped ? 7 - vr : vr;
      const c = flipped ? 7 - vc : vc;
      const piece = grid[r][c];
      const file = String.fromCharCode(97 + c);
      const rank = 8 - r;
      const sqName = file + rank;
      const light = (r + c) % 2 === 0;

      let cls = "sq " + (light ? "light" : "dark");
      if (lastSquares.includes(sqName)) cls += " last-move";

      let inner = "";
      if (vc === 0) inner += `<span class="coord rank">${rank}</span>`;
      if (vr === 7) inner += `<span class="coord file">${file}</span>`;
      if (piece) {
        const isWhite = piece === piece.toUpperCase();
        inner += `<span class="piece ${isWhite ? "pw" : "pb"}">${PIECE_GLYPH[piece.toLowerCase()]}</span>`;
      }
      // category badge, pinned top-right over the piece that just moved
      if (sqName === toSq && category) {
        inner += `<span class="move-badge cat-ico ${category}">${CAT_SYM[category]}</span>`;
      }
      html += `<div class="${cls}" data-sq="${sqName}">${inner}</div>`;
    }
  }
  boardEl.innerHTML = html;
  // tint the from/to squares with the played move's category colour
  boardEl.style.setProperty("--move-tint", category ? CAT_COLOR[category] : "transparent");
  animateMove(fromPly);
  renderArrows();
}

// slide the moved piece from its previous square when stepping one ply
function animateMove(fromPly) {
  if (fromPly === undefined || fromPly === null) return;
  const diff = ply - fromPly;
  if (Math.abs(diff) !== 1) return;

  const m = GAME.moves[diff === 1 ? ply : fromPly];
  if (!m) return;
  // forward: the piece just arrived on the to-square; backward: it went home
  const startSq = diff === 1 ? m.move.slice(0, 2) : m.move.slice(2, 4);
  const endSq = diff === 1 ? m.move.slice(2, 4) : m.move.slice(0, 2);

  const boardEl = document.getElementById("board");
  const endCell = boardEl.querySelector(`[data-sq="${endSq}"]`);
  const piece = endCell && endCell.querySelector(".piece");
  if (!piece) return;

  const cell = boardEl.clientWidth / 8;
  const a = visualRC(startSq);
  const b = visualRC(endSq);
  const dx = (a.c - b.c) * cell;
  const dy = (a.r - b.r) * cell;

  piece.style.transition = "none";
  piece.style.transform = `translate(${dx}px, ${dy - 1}px)`;
  piece.style.zIndex = "6";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      piece.style.transition = "transform 0.16s ease-out";
      piece.style.transform = "translate(0, -1px)";
    });
  });
}

// arrows: played move (category colour) + engine best move (emerald, translucent)
function renderArrows() {
  const layer = document.getElementById("arrow-layer");
  if (ply < 0) { layer.innerHTML = ""; return; }

  const m = GAME.moves[ply];
  let svg = "";

  const playedColor = CAT_COLOR[m.category];
  if (m.best && m.best !== m.move) {
    svg += arrowPath(m.best, "var(--cat-best)", 0.5);
  }
  svg += arrowPath(m.move, playedColor, 0.85);
  layer.innerHTML = svg;
}

function arrowPath(uci, color, opacity) {
  const from = squareToRC(uci.slice(0, 2));
  const to = squareToRC(uci.slice(2, 4));
  const cx = (p) => ((flipped ? 7 - p.c : p.c) + 0.5) * 100;
  const cy = (p) => ((flipped ? 7 - p.r : p.r) + 0.5) * 100;

  const x1 = cx(from), y1 = cy(from), x2 = cx(to), y2 = cy(to);
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;

  const headLen = 32, headW = 34, shaft = 13;
  const bx = x2 - ux * headLen, by = y2 - uy * headLen; // head base
  const sx = x1 + ux * 22, sy = y1 + uy * 22;           // start offset from centre
  const px = -uy, py = ux;                              // perpendicular

  return `<g fill="${color}" opacity="${opacity}">
    <polygon points="
      ${sx + px * shaft / 2},${sy + py * shaft / 2}
      ${bx + px * shaft / 2},${by + py * shaft / 2}
      ${bx + px * headW / 2},${by + py * headW / 2}
      ${x2},${y2}
      ${bx - px * headW / 2},${by - py * headW / 2}
      ${bx - px * shaft / 2},${by - py * shaft / 2}
      ${sx - px * shaft / 2},${sy - py * shaft / 2}"/>
  </g>`;
}

// ---------------------------------------------------------------------------
// eval bar

// one board square = 12.5% of the bar; keep ~4/10 of a square for the losing side
const EVAL_CAP = 12.5 * 0.4; // = 5

function renderEvalBar() {
  const cp = ply < 0 ? GAME.start_eval : GAME.moves[ply].evaluation;
  const mateIn = ply < 0 ? null : GAME.moves[ply].mate_in;

  let pct;
  if (mateIn !== null && mateIn !== undefined) {
    pct = cp > 0 ? 100 : 0; // a mate on the board fills the bar completely
  } else {
    pct = Math.max(EVAL_CAP, Math.min(100 - EVAL_CAP, winrate(cp)));
  }

  // CSS reads --fill as height (desktop, vertical) or width (mobile, horizontal)
  document.getElementById("evalbar-white").style.setProperty("--fill", pct + "%");
  const label = document.getElementById("evalbar-label");
  label.textContent = formatEval(cp, mateIn);
  label.className = "eval-label " + (pct >= 50 ? "on-white" : "on-black");
}

// ---------------------------------------------------------------------------
// eval graph

const G = { W: 1000, H: 240, padTop: 10, padBottom: 10 };

function graphXY() {
  // point 0 = starting position, then one point per ply
  const evals = [GAME.start_eval, ...GAME.eval_history];
  const usable = G.H - G.padTop - G.padBottom;
  return evals.map((cp, i) => ({
    x: (i / (evals.length - 1)) * G.W,
    y: G.padTop + (1 - winrate(cp) / 100) * usable,
  }));
}

function renderGraph() {
  const pts = graphXY();
  const midY = G.padTop + (G.H - G.padTop - G.padBottom) / 2;

  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${G.W},${G.H} L0,${G.H} Z`;

  // mate zones: contiguous ply ranges where mate_in != null
  let zones = "";
  let zoneStart = null;
  for (let i = 0; i <= N; i++) {
    const inMate = i < N && GAME.moves[i].mate_in !== null;
    if (inMate && zoneStart === null) zoneStart = i;
    if (!inMate && zoneStart !== null) {
      zones += mateZoneRect(zoneStart, i - 1, pts);
      zoneStart = null;
    }
  }

  // dots on notable moves
  let dots = "";
  GAME.moves.forEach((m, i) => {
    if (["Inaccuracy", "Mistake", "Miss", "Blunder"].includes(m.category)) {
      const p = pts[i + 1];
      dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6"
        fill="${CAT_COLOR[m.category]}" stroke="#0f1218" stroke-width="2"/>`;
    }
  });

  // current position marker
  const cur = pts[ply + 1];
  const marker = `
    <line x1="${cur.x.toFixed(1)}" y1="0" x2="${cur.x.toFixed(1)}" y2="${G.H}"
      stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3"/>
    <circle cx="${cur.x.toFixed(1)}" cy="${cur.y.toFixed(1)}" r="5.5"
      fill="var(--accent)" stroke="#0f1218" stroke-width="2"/>`;

  document.getElementById("eval-graph").innerHTML = `
    <defs>
      <pattern id="mate-stripes" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="transparent"/>
        <rect width="3" height="8" fill="currentColor"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="${G.W}" height="${G.H}" fill="#0a0c10" rx="8"/>
    <path d="${area}" fill="#dfe4ec" fill-opacity="0.92"/>
    <line x1="0" y1="${midY}" x2="${G.W}" y2="${midY}" stroke="#59637a" stroke-width="1" stroke-dasharray="4 4"/>
    ${zones}
    <path d="${line}" fill="none" stroke="#8b93a3" stroke-width="1.4"/>
    ${dots}
    ${marker}`;
}

function mateZoneRect(fromPly, toPly, pts) {
  const x1 = pts[fromPly + 1].x - (pts[1].x - pts[0].x) / 2;
  const x2 = pts[toPly + 1].x;
  const width = x2 - x1;
  const whiteMates = GAME.moves[fromPly].evaluation > 0;
  const color = whiteMates ? "var(--cat-best)" : "var(--cat-blunder)";
  const n = GAME.moves[fromPly].mate_in;
  const labelY = whiteMates ? 24 : G.H - 12;

  // label and border only for zones wide enough to read, otherwise just stripes
  const wide = width > 60;
  const border = wide
    ? `<rect x="${x1.toFixed(1)}" y="0" width="2" height="${G.H}" fill="${color}" opacity="0.7"/>`
    : "";
  const label = wide
    ? `<text x="${(x1 + 10).toFixed(1)}" y="${labelY}" fill="${color}" font-size="16"
        font-weight="800" style="font-family: var(--mono)">${n === 0 ? "Mate" : "Mate in " + n}</text>`
    : "";

  return `
    <g style="color:${color}">
      <rect x="${x1.toFixed(1)}" y="0" width="${width.toFixed(1)}" height="${G.H}"
        fill="url(#mate-stripes)" opacity="0.28"/>
      ${border}${label}
    </g>`;
}

// graph interaction: hover tooltip + click to jump
function bindGraph() {
  const svg = document.getElementById("eval-graph");
  const tip = document.getElementById("graph-tooltip");

  const plyFromEvent = (e) => {
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * G.W;
    return Math.max(-1, Math.min(N - 1, Math.round((x / G.W) * N) - 1));
  };

  svg.addEventListener("mousemove", (e) => {
    const p = plyFromEvent(e);
    if (p < 0) { tip.style.display = "none"; return; }
    const m = GAME.moves[p];
    const moveNo = m.move_number + (m.mover === "white" ? "." : "…");
    tip.innerHTML = `${moveNo} ${m.san} · ${formatEval(m.evaluation, m.mate_in)}
      <span class="tt-cat" style="color:${CAT_COLOR[m.category]}"> ${CAT_LABEL[m.category]}</span>`;
    const rect = svg.getBoundingClientRect();
    const pts = graphXY();
    tip.style.left = (pts[p + 1].x / G.W) * rect.width + "px";
    tip.style.top = (pts[p + 1].y / G.H) * rect.height + "px";
    tip.style.display = "block";
  });
  svg.addEventListener("mouseleave", () => { tip.style.display = "none"; });
  svg.addEventListener("click", (e) => goTo(plyFromEvent(e)));
}

// ---------------------------------------------------------------------------
// move list

function renderMoveList() {
  const listEl = document.getElementById("move-list");
  let html = "";
  for (let i = 0; i < N; i += 2) {
    const w = GAME.moves[i];
    const b = GAME.moves[i + 1];
    html += `<div class="move-pair">
      <span class="no">${w.move_number}.</span>
      ${moveCell(w, i)}
      ${b ? moveCell(b, i + 1) : "<span></span>"}
    </div>`;
  }
  listEl.innerHTML = html;
  listEl.querySelectorAll(".move-cell").forEach((el) =>
    el.addEventListener("click", () => goTo(+el.dataset.ply)));
}

function moveCell(m, i) {
  return `<button class="move-cell" data-ply="${i}" title="${CAT_LABEL[m.category]}">
    <span class="cat-ico ${m.category}">${CAT_SYM[m.category]}</span>${m.san}
  </button>`;
}

function highlightMoveList() {
  let activeEl = null;
  document.querySelectorAll(".move-cell").forEach((el) => {
    const active = +el.dataset.ply === ply;
    el.classList.toggle("active", active);
    if (active) activeEl = el;
  });
  if (activeEl) scrollWithinContainer(activeEl);
}

// scroll only the nearest scrollable ancestor (right panel on desktop,
// move-list on mobile) — never the page, which was jumpy on mobile.
function scrollWithinContainer(el) {
  let sc = el.parentElement;
  while (sc && sc !== document.body) {
    const oy = getComputedStyle(sc).overflowY;
    if ((oy === "auto" || oy === "scroll") && sc.scrollHeight > sc.clientHeight) break;
    sc = sc.parentElement;
  }
  if (!sc || sc === document.body) return;

  // if a sticky header is pinned at the top of the scroll area (the "Moves"
  // heading on desktop), keep the active row clear of it
  let topInset = 0;
  const head = sc.querySelector(".moves-card h3");
  if (head && getComputedStyle(head).position === "sticky") {
    topInset = head.getBoundingClientRect().height;
  }

  const scRect = sc.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const top = elRect.top - scRect.top + sc.scrollTop;
  const pad = 10;
  if (top < sc.scrollTop + topInset) {
    sc.scrollTop = top - topInset - pad;
  } else if (top + elRect.height > sc.scrollTop + sc.clientHeight) {
    sc.scrollTop = top + elRect.height - sc.clientHeight + pad;
  }
}

// ---------------------------------------------------------------------------
// coach comment placeholder (LLM text will be plugged in here later)

function renderCoach() {
  const ref = document.getElementById("coach-move-ref");
  if (ply < 0) {
    ref.innerHTML = "Starting position";
    return;
  }
  const m = GAME.moves[ply];
  const moveNo = m.move_number + (m.mover === "white" ? "." : "…");
  ref.innerHTML = `${moveNo} ${m.san}
    <span class="cat-ico ${m.category}">${CAT_SYM[m.category]}</span>
    <span style="color:${CAT_COLOR[m.category]}; font-family:var(--font); font-size:12.5px">
      ${CAT_LABEL[m.category]}</span>`;
}

// ---------------------------------------------------------------------------
// summary

function renderSummary() {
  document.getElementById("acc-white").textContent = GAME.accuracy.white.toFixed(1);
  document.getElementById("acc-black").textContent = GAME.accuracy.black.toFixed(1);
  document.getElementById("acc-white-name").textContent = GAME.white.name;
  document.getElementById("acc-black-name").textContent = GAME.black.name;

  const rows = Object.keys(CAT_LABEL).map((cat) => `
    <tr>
      <td class="num">${GAME.counts.white[cat]}</td>
      <td class="cat-name"><span class="cat-ico ${cat}">${CAT_SYM[cat]}</span>${CAT_LABEL[cat]}</td>
      <td class="num">${GAME.counts.black[cat]}</td>
    </tr>`).join("");
  document.getElementById("cat-table-body").innerHTML = rows;
}

// ---------------------------------------------------------------------------
// navigation

function goTo(p) {
  const fromPly = ply;
  ply = Math.max(-1, Math.min(N - 1, p));
  renderBoard(fromPly);
  renderEvalBar();
  renderGraph();
  renderCoach();
  highlightMoveList();

  const pos = document.getElementById("move-position");
  if (ply < 0) pos.textContent = "Starting position";
  else {
    const m = GAME.moves[ply];
    pos.textContent = `Move ${m.move_number} of ${GAME.moves[N - 1].move_number} · ${m.san}`;
  }

  document.getElementById("btn-first").disabled = ply < 0;
  document.getElementById("btn-prev").disabled = ply < 0;
  document.getElementById("btn-next").disabled = ply >= N - 1;
  document.getElementById("btn-last").disabled = ply >= N - 1;
}

function nextMistake() {
  for (let i = ply + 1; i < N; i++) {
    if (["Inaccuracy", "Mistake", "Miss", "Blunder"].includes(GAME.moves[i].category)) {
      goTo(i);
      return;
    }
  }
  goTo(N - 1);
}

// ---------------------------------------------------------------------------
// init

document.addEventListener("DOMContentLoaded", () => {
  // game header
  document.getElementById("players-line").innerHTML = `
    ${GAME.white.name} <span class="elo">(${GAME.white.elo})</span>
    <span class="vs">vs</span>
    ${GAME.black.name} <span class="elo">(${GAME.black.elo})</span>
    · ${GAME.result}`;

  const [base, inc] = GAME.time_control.split("+").map(Number);
  const tc = `${Math.round(base / 60)}+${inc || 0}`;
  // time class by estimated game length (base + 40·inc), Chess.com-style
  const estimate = base + 40 * (inc || 0);
  const timeClass = estimate < 180 ? "Bullet"
    : estimate < 600 ? "Blitz"
    : estimate < 1500 ? "Rapid" : "Classical";
  const date = new Date(GAME.date).toLocaleDateString("en-US",
    { month: "short", day: "numeric", year: "numeric" });
  document.getElementById("game-meta").textContent =
    `${GAME.opening} · ${GAME.eco} · ${timeClass} ${tc} · ${date}`;

  renderSummary();
  renderMoveList();
  bindGraph();

  document.getElementById("btn-first").addEventListener("click", () => goTo(-1));
  document.getElementById("btn-prev").addEventListener("click", () => goTo(ply - 1));
  document.getElementById("btn-next").addEventListener("click", () => goTo(ply + 1));
  document.getElementById("btn-last").addEventListener("click", () => goTo(N - 1));
  document.getElementById("btn-flip").addEventListener("click", () => {
    flipped = !flipped;
    renderBoard();
  });
  document.getElementById("btn-mistake").addEventListener("click", nextMistake);

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(ply - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(ply + 1); }
    if (e.key === "Home") { e.preventDefault(); goTo(-1); }
    if (e.key === "End") { e.preventDefault(); goTo(N - 1); }
    if (e.key === "f") document.getElementById("btn-flip").click();
  });

  goTo(-1);
});
