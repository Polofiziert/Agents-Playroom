/* Atrium — classic chat + Artefakt/Dateien tabs + LaTeX */

const places = {
  schule: {
    label: "Schule",
    subjects: [
      { id: "mathe", name: "Mathe", blurb: "Analysis · Geometrie", next: "Brüche vertiefen" },
      { id: "deutsch", name: "Deutsch", blurb: "Text · Argumentation", next: "Erörterung skizzieren" },
    ],
  },
  ausbildung: {
    label: "Ausbildung",
    subjects: [
      { id: "fachtheorie", name: "Fachtheorie", blurb: "Prüfungsstoff", next: "Prüfungsfrage üben" },
      { id: "praxis", name: "Praxis", blurb: "Betrieb", next: "Checkliste durchgehen" },
    ],
  },
  studium: {
    label: "Studium",
    subjects: [
      { id: "informatik", name: "Informatik", blurb: "Algorithmen", next: "BST einfügen" },
      { id: "philosophie", name: "Philosophie", blurb: "Logik · Ethik", next: "Begriffspaar klären" },
      { id: "analysis", name: "Analysis", blurb: "Beweise", next: "ε-δ skizzieren" },
    ],
  },
};

const treeFolders = [
  {
    id: "heute",
    name: "heute",
    open: true,
    files: [
      { name: "warm-up.md", meta: "Challenge" },
      { name: "uebung-04-baeume.md", meta: "Aufgabe" },
    ],
  },
  {
    id: "stoff",
    name: "stoff",
    open: true,
    files: [
      { name: "skript-kap-3.pdf", meta: "Material" },
      { name: "folien-vl07.pdf", meta: "Vorlesung" },
    ],
  },
  {
    id: "arbeit",
    name: "arbeit",
    open: false,
    files: [
      { name: "mitschrift-2026-07-28.md", meta: "Notiz" },
      { name: "foto-uebung-03.jpg", meta: "Papier" },
    ],
  },
  {
    id: "gedachtnis",
    name: "gedachtnis",
    open: false,
    files: [
      { name: "learner-model.md", meta: "Stand" },
      { name: "rubrik.md", meta: "Bewertung" },
    ],
  },
];

const whyText = {
  informatik: "Insert in BSTs ist laut learner-model noch unsicher — deshalb genau diese Aufgabe.",
  philosophie: "Begriffsdifferenzierung war zuletzt wackelig.",
  analysis: "Beweisstruktur braucht Wiederholung.",
  mathe: "Brüche erzeugen noch Flüchtigkeitsfehler.",
  deutsch: "Argumentationsaufbau steht als Lücke.",
  fachtheorie: "Prüfungsziel rückt näher.",
  praxis: "Betriebliche Checkliste ist offen.",
};

const BST_INVARIANT = "\\forall y\\in\\mathrm{left}(x):\\, y < x \\quad\\wedge\\quad \\forall y\\in\\mathrm{right}(x):\\, y > x";

let place = "studium";
let subjectId = "informatik";
let agentMode = "tutor";
let tree = { v: 5, l: null, r: null };
let artifactOpen = false;
let awaitingQuiz = null; // 'traversal' | null

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function isDesktop() {
  return window.matchMedia("(min-width: 1100px)").matches;
}

function subject() {
  return places[place].subjects.find((x) => x.id === subjectId) || places[place].subjects[0];
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* ——— LaTeX tree ——— */
function tikzNode(node) {
  let s = `node {${node.v}}`;
  if (node.l) s += ` child { ${tikzNode(node.l)} }`;
  if (node.r) s += ` child { ${tikzNode(node.r)} }`;
  return s;
}

function treeToLatex(root = tree) {
  return [
    "\\begin{tikzpicture}[",
    "  every node/.style={circle, draw=teal!60!black, fill=teal!8,",
    "    minimum size=7mm, font=\\sffamily\\bfseries\\small},",
    "  level distance=12mm, sibling distance=18mm",
    "]",
    `\\${tikzNode(root)};`,
    "\\end{tikzpicture}",
  ].join("\n");
}

function insertBST(node, value) {
  if (!node) return { v: value, l: null, r: null };
  if (value < node.v) node.l = insertBST(node.l, value);
  else if (value > node.v) node.r = insertBST(node.r, value);
  return node;
}

function contains(node, v) {
  if (!node) return false;
  if (node.v === v) return true;
  return v < node.v ? contains(node.l, v) : contains(node.r, v);
}

function layout(node, x, y, gap, out = []) {
  if (!node) return out;
  out.push({ v: node.v, x, y, node });
  if (node.l) layout(node.l, x - gap, y + 52, gap * 0.55, out);
  if (node.r) layout(node.r, x + gap, y + 52, gap * 0.55, out);
  return out;
}

function previewSvg() {
  const pts = layout(tree, 160, 32, 68);
  const map = Object.fromEntries(pts.map((p) => [p.v, p]));
  let lines = "";
  for (const p of pts) {
    if (p.node.l) {
      const c = map[p.node.l.v];
      lines += `<line x1="${p.x}" y1="${p.y}" x2="${c.x}" y2="${c.y}" stroke="#9aaca6"/>`;
    }
    if (p.node.r) {
      const c = map[p.node.r.v];
      lines += `<line x1="${p.x}" y1="${p.y}" x2="${c.x}" y2="${c.y}" stroke="#9aaca6"/>`;
    }
  }
  const nodes = pts
    .map(
      (p) =>
        `<g><circle cx="${p.x}" cy="${p.y}" r="15" fill="#0f6b6b"/><text x="${p.x}" y="${p.y + 1}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="12" font-family="Sora,sans-serif" font-weight="600">${p.v}</text></g>`
    )
    .join("");
  return `<svg class="tree-canvas" viewBox="0 0 320 170">${lines}${nodes}</svg>`;
}

function renderArtifactPane() {
  const pane = $("#artifact-pane");
  if (!artifactOpen) {
    pane.innerHTML = `<div class="rail-idle">
      <p class="desk-label">Kein Artefakt</p>
      <p class="rail-idle-text">Wenn der Agent eine Aufgabe öffnet, erscheint sie hier — als LaTeX/TikZ.</p>
    </div>`;
    return;
  }
  pane.innerHTML = `<div class="artifact-simple">
    <h2>BST · einfügen</h2>
    <div class="tikz-host">${previewSvg()}</div>
    <div class="actions">
      <button class="btn btn-mono" type="button" data-insert="7">insert(7)</button>
      <button class="btn btn-mono" type="button" data-insert="3">insert(3)</button>
      <button class="btn btn-mono" type="button" data-insert="9">insert(9)</button>
      <button class="btn btn-primary" type="button" data-check-artifact>Prüfen</button>
    </div>
    <div class="src-label">LaTeX · Agent-State</div>
    <pre class="latex-src">${escapeHtml(treeToLatex())}</pre>
  </div>`;
}

/* ——— Chat helpers ——— */

/** Render $...$ and $$...$$ in HTML text to KaTeX placeholders */
function formatAgentHtml(text) {
  // Already HTML fragments may include tags — only process plain segments carefully.
  // For our seeded messages we pass HTML with .tex nodes; for user-facing agent strings use this.
  let html = escapeHtml(text);
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => `<div class="tex block" data-tex="${escapeHtml(tex.trim())}"></div>`);
  html = html.replace(/\$([^$\n]+?)\$/g, (_, tex) => `<span class="tex" data-tex="${escapeHtml(tex.trim())}"></span>`);
  html = html.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
  return `<p>${html}</p>`;
}

function renderKatex(root = document) {
  if (!window.katex) return;
  root.querySelectorAll(".tex").forEach((el) => {
    if (el.dataset.done) return;
    try {
      katex.render(el.dataset.tex, el, {
        displayMode: el.classList.contains("block"),
        throwOnError: false,
      });
      el.dataset.done = "1";
    } catch {
      /* ignore */
    }
  });
}

function scrollChat() {
  const stream = $("#chat-stream");
  stream.scrollTop = stream.scrollHeight;
}

function appendEvent(text) {
  $("#chat-stream").insertAdjacentHTML("beforeend", `<div class="event-chip">${escapeHtml(text)}</div>`);
  scrollChat();
}

function appendUser(text) {
  $("#chat-stream").insertAdjacentHTML(
    "beforeend",
    `<article class="msg msg-user"><div class="msg-label">Du</div><div class="bubble">${escapeHtml(text)}</div></article>`
  );
  scrollChat();
}

function appendAgent(innerHtml) {
  const name = subject().name;
  const mode = agentMode === "tutor" ? "Tutor" : "Examiner";
  $("#chat-stream").insertAdjacentHTML(
    "beforeend",
    `<article class="msg msg-agent"><div class="msg-label">${name}-Agent · ${mode}</div><div class="bubble">${innerHtml}</div></article>`
  );
  renderKatex($("#chat-stream"));
  scrollChat();
}

function setSideTab(name) {
  $$(".side-tab[data-side-tab]").forEach((t) =>
    t.setAttribute("aria-selected", t.dataset.sideTab === name ? "true" : "false")
  );
  $$(".side-pane").forEach((p) => {
    const on = p.dataset.pane === name;
    p.classList.toggle("is-active", on);
    p.hidden = !on;
  });
}

function openSideMobile() {
  $("#side-column").classList.add("is-open-mobile");
}

function closeSideMobile() {
  $("#side-column").classList.remove("is-open-mobile");
}

function setAppMode(mode) {
  // mode: 'browse' | 'chat'
  $("#app").dataset.mode = mode;
  $$(".act-btn[data-screen-btn]").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.screenBtn === (mode === "chat" ? "chat" : mode) ? "true" : "false")
  );
  if (mode === "chat") {
    closeOverlay();
  }
}

function showOverlay(name) {
  setAppMode("browse");
  $$(".screen").forEach((el) => el.classList.toggle("is-active", el.dataset.screen === name));
  $$(".act-btn[data-screen-btn]").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.screenBtn === name || (name === "home" && b.dataset.screenBtn === "chat" && false) ? "true" : "false")
  );
  if (name === "progress") {
    $$('.act-btn[data-screen-btn="progress"]').forEach((b) => b.setAttribute("aria-pressed", "true"));
    $$('.act-btn[data-screen-btn="chat"]').forEach((b) => b.setAttribute("aria-pressed", "false"));
  }
}

function closeOverlay() {
  $$(".screen").forEach((el) => el.classList.remove("is-active"));
}

function updateChrome() {
  const s = subject();
  $("#workspace-label").textContent = `${places[place].label} / ${s.name}`;
  $("#home-place").textContent = places[place].label;
  $("#next-title").textContent = `${s.name} · ${s.next}`;
  $("#next-meta").textContent = whyText[s.id] || "Aus deinem Lernstand.";
}

function renderSubjects() {
  const html = places[place].subjects
    .map(
      (s) => `<li><button type="button" data-pick-subject="${s.id}" ${
        s.id === subjectId ? 'aria-current="true"' : ""
      }><strong>${s.name}</strong><span>${s.blurb}</span></button></li>`
    )
    .join("");
  const desk = $("#desk-subjects");
  const mobile = $("#subject-picks");
  if (desk) desk.innerHTML = html;
  if (mobile) mobile.innerHTML = html;
  $$("[data-place]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.place === place ? "true" : "false"));
  $$("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === agentMode ? "true" : "false"));
  updateChrome();
}

function renderFileTree() {
  $("#file-tree").innerHTML = treeFolders
    .map(
      (f) => `<li class="folder" data-folder="${f.id}" data-open="${f.open ? "true" : "false"}">
      <button type="button" class="folder-label" data-toggle-folder="${f.id}">
        <span class="chev">▾</span> ${f.name}
      </button>
      <ul>
        ${f.files
          .map(
            (file) =>
              `<li><button type="button" class="file-row" data-file="${file.name}"><span>${file.name}</span><small>${file.meta}</small></button></li>`
          )
          .join("")}
      </ul>
    </li>`
    )
    .join("");
}

function renderSkills() {
  $("#stats-mini").innerHTML = `
    <div><small>Heute</small><strong>42 min</strong></div>
    <div><small>Readiness</small><strong>68%</strong></div>`;
  $("#skill-list").innerHTML = [
    ["Binäre Suchbäume", "72%"],
    ["Inorder / Preorder", "54%"],
    ["O-Notation", "81%"],
  ]
    .map(
      ([n, w]) =>
        `<div class="skill"><div style="display:flex;justify-content:space-between"><span>${n}</span><span style="color:var(--muted)">${w}</span></div><div class="bar"><i style="--w:${w}"></i></div></div>`
    )
    .join("");
}

function setWorkspaceMenu(open) {
  $("#workspace-menu").hidden = !open;
  $("#workspace-chip").setAttribute("aria-expanded", open ? "true" : "false");
}

function seedChat() {
  $("#chat-stream").innerHTML = "";
  awaitingQuiz = null;
  tree = { v: 5, l: null, r: null };
  artifactOpen = false;
  renderArtifactPane();

  if (agentMode === "examiner") {
    appendAgent(`<p>Examiner-Modus — keine Tipps.</p>
      <p>Aufgabe: Füge <strong>7</strong> und <strong>3</strong> in den BST ein.</p>
      <div class="artifact-card">
        <strong>Artefakt · BST</strong>
        <p>LaTeX/TikZ im rechten Panel.</p>
        <button class="btn btn-primary" type="button" data-open-artifact>Artefakt öffnen</button>
      </div>`);
  } else {
    appendAgent(`<p>Willkommen zurück. Laut <em>learner-model</em> üben wir <strong>BST-Insert</strong>.</p>
      <p>Die Invariante:</p>
      <div class="tex block" data-tex="${BST_INVARIANT}"></div>
      <div class="artifact-card">
        <strong>Artefakt · Binärbaum</strong>
        <p>Shared State als LaTeX — rechts unter „Artefakt“.</p>
        <button class="btn btn-primary" type="button" data-open-artifact>Artefakt öffnen</button>
      </div>`);
    appendEvent("System · Artefakt bereit");
    appendAgent(`<p>Kurze Nachfrage, bevor wir starten:</p>
      <p>Welche Traversierung liefert die <strong>sortierte</strong> Folge?</p>
      <div class="chat-choices">
        <button type="button" class="chat-choice" data-choice="pre">Preorder</button>
        <button type="button" class="chat-choice" data-choice="in">Inorder</button>
        <button type="button" class="chat-choice" data-choice="post">Postorder</button>
      </div>`);
    awaitingQuiz = "traversal";
  }
  renderKatex($("#chat-stream"));
}

function openArtifact() {
  artifactOpen = true;
  renderArtifactPane();
  setSideTab("artifact");
  if (!isDesktop()) openSideMobile();
  appendEvent("Artefakt geöffnet · LaTeX-State aktiv");
}

function handleChoice(value, btn) {
  if (!awaitingQuiz) return;
  const label = { pre: "Preorder", in: "Inorder", post: "Postorder" }[value];
  appendUser(label);
  $$(".chat-choice").forEach((b) => {
    b.disabled = true;
  });
  if (awaitingQuiz === "traversal") {
    const ok = value === "in";
    appendAgent(
      ok
        ? `<p>Genau — <strong>Inorder</strong>. Dann legen wir mit dem Artefakt los.</p>
           <div class="chat-choices">
             <button type="button" class="chat-choice" data-open-artifact>Artefakt öffnen</button>
             <button type="button" class="chat-choice" data-ask-formula>Nochmal Formel</button>
           </div>`
        : `<p>Nicht ganz. Die sortierte Folge kommt von <strong>Inorder</strong>.</p>
           <div class="chat-choices">
             <button type="button" class="chat-choice" data-open-artifact>Trotzdem Artefakt öffnen</button>
           </div>`
    );
    awaitingQuiz = null;
  }
}

function agentReplyToUser(text) {
  const lower = text.toLowerCase();
  if (lower.includes("formel") || lower.includes("invariante") || lower.includes("latex")) {
    appendAgent(`<p>BST-Invariante (LaTeX):</p>
      <div class="tex block" data-tex="${BST_INVARIANT}"></div>
      <div class="chat-choices">
        <button type="button" class="chat-choice" data-open-artifact>Zum Artefakt</button>
      </div>`);
    return;
  }
  if (lower.includes("prüfung") || lower.includes("check") || lower.includes("fertig")) {
    const ok = contains(tree, 7) && contains(tree, 3);
    appendAgent(
      ok
        ? `<p>LaTeX-State sieht gut aus — 7 und 3 sind drin.</p>
           <div class="chat-choices">
             <button type="button" class="chat-choice" data-choice-next="retrieval">Retrieval-Frage</button>
           </div>`
        : `<p>Noch unvollständig. Nutze <code>insert(7)</code> und <code>insert(3)</code> im Artefakt-Tab.</p>
           <div class="chat-choices">
             <button type="button" class="chat-choice" data-open-artifact>Artefakt zeigen</button>
           </div>`
    );
    return;
  }
  if (agentMode === "examiner") {
    appendAgent(`<p>Notiert. Weiter am Artefakt — ohne Hinweise.</p>`);
    return;
  }
  appendAgent(`<p>Verstanden. Du kannst im Chat nachfragen oder rechts am Artefakt arbeiten.</p>
    <div class="chat-choices">
      <button type="button" class="chat-choice" data-open-artifact>Artefakt</button>
      <button type="button" class="chat-choice" data-ask-formula>Formel zeigen</button>
      <button type="button" class="chat-choice" data-side-files>Dateien</button>
    </div>`);
}

function sendMessage() {
  const input = $("#composer-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  appendUser(text);
  agentReplyToUser(text);
}

function startSession() {
  setAppMode("chat");
  setSideTab("artifact");
  closeSideMobile();
  seedChat();
  $$('.act-btn[data-screen-btn="chat"]').forEach((b) => b.setAttribute("aria-pressed", "true"));
  $$('.act-btn[data-screen-btn="progress"]').forEach((b) => b.setAttribute("aria-pressed", "false"));
}

function wire() {
  $("#start-session").addEventListener("click", startSession);
  $("#new-chat").addEventListener("click", () => {
    seedChat();
    toast("Neuer Chat");
  });
  $("#send-btn").addEventListener("click", sendMessage);
  $("#composer-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  $("#workspace-chip").addEventListener("click", (e) => {
    e.stopPropagation();
    setWorkspaceMenu($("#workspace-menu").hidden);
  });

  $("#open-side-mobile")?.addEventListener("click", openSideMobile);
  $("#close-side-mobile")?.addEventListener("click", closeSideMobile);

  $("#start-go").addEventListener("click", () => {
    showOverlay("go");
    $("#go-body").innerHTML = `
      <p class="eyebrow">Informatik</p>
      <h2 class="go-q">Welche Traversierung sortiert einen BST?</h2>
      <div class="go-choices">
        <button class="btn" type="button" data-go-quiz="pre">Preorder</button>
        <button class="btn" type="button" data-go-quiz="in">Inorder</button>
        <button class="btn" type="button" data-go-quiz="post">Postorder</button>
      </div>`;
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#workspace-chip") && !e.target.closest("#workspace-menu")) {
      setWorkspaceMenu(false);
    }

    if (e.target.closest("[data-go-home]")) {
      showOverlay("home");
      return;
    }
    if (e.target.closest('[data-open="more"]')) {
      showOverlay("more");
      return;
    }

    const screenBtn = e.target.closest("[data-screen-btn]");
    if (screenBtn) {
      const t = screenBtn.dataset.screenBtn;
      if (t === "chat") {
        if (!$("#chat-stream").children.length) startSession();
        else setAppMode("chat");
      } else if (t === "progress") showOverlay("progress");
      return;
    }

    const tab = e.target.closest(".side-tab[data-side-tab]");
    if (tab) {
      setSideTab(tab.dataset.sideTab);
      return;
    }

    if (e.target.closest("[data-open-artifact]")) {
      openArtifact();
      return;
    }

    if (e.target.closest("[data-ask-formula]")) {
      appendAgent(`<p>Hier nochmal als LaTeX:</p><div class="tex block" data-tex="${BST_INVARIANT}"></div>`);
      return;
    }

    if (e.target.closest("[data-side-files]")) {
      setSideTab("files");
      if (!isDesktop()) openSideMobile();
      return;
    }

    const choice = e.target.closest("[data-choice]");
    if (choice && !choice.disabled) {
      handleChoice(choice.dataset.choice, choice);
      return;
    }

    if (e.target.closest('[data-choice-next="retrieval"]')) {
      awaitingQuiz = "traversal";
      appendAgent(`<p>Retrieval: Welche Traversierung sortiert?</p>
        <div class="chat-choices">
          <button type="button" class="chat-choice" data-choice="pre">Preorder</button>
          <button type="button" class="chat-choice" data-choice="in">Inorder</button>
          <button type="button" class="chat-choice" data-choice="post">Postorder</button>
        </div>`);
      return;
    }

    const placeBtn = e.target.closest("[data-place]");
    if (placeBtn) {
      place = placeBtn.dataset.place;
      subjectId = places[place].subjects[0].id;
      renderSubjects();
      if ($("#app").dataset.mode === "chat") seedChat();
      toast(places[place].label);
      return;
    }

    const modeBtn = e.target.closest("[data-mode]");
    if (modeBtn) {
      agentMode = modeBtn.dataset.mode;
      renderSubjects();
      if ($("#app").dataset.mode === "chat") seedChat();
      toast(agentMode === "tutor" ? "Tutor" : "Examiner");
      return;
    }

    const pick = e.target.closest("[data-pick-subject]");
    if (pick) {
      subjectId = pick.dataset.pickSubject;
      renderSubjects();
      setWorkspaceMenu(false);
      if ($("#app").dataset.mode === "chat") seedChat();
      toast(subject().name);
      return;
    }

    const folderBtn = e.target.closest("[data-toggle-folder]");
    if (folderBtn) {
      const f = treeFolders.find((x) => x.id === folderBtn.dataset.toggleFolder);
      if (f) {
        f.open = !f.open;
        renderFileTree();
      }
      return;
    }

    if (e.target.closest("[data-file]")) {
      toast(`Öffnen (Demo): ${e.target.closest("[data-file]").dataset.file}`);
      return;
    }

    const ins = e.target.closest("[data-insert]");
    if (ins) {
      tree = insertBST(tree, Number(ins.dataset.insert));
      renderArtifactPane();
      appendEvent(`Learner · insert(${ins.dataset.insert}) — LaTeX aktualisiert`);
      return;
    }

    if (e.target.closest("[data-check-artifact]")) {
      const ok = contains(tree, 7) && contains(tree, 3);
      appendAgent(
        ok
          ? `<p>Passt. Die LaTeX-Quelle enthält 7 und 3.</p>
             <div class="chat-choices">
               <button type="button" class="chat-choice" data-choice-next="retrieval">Weiter mit Retrieval</button>
             </div>`
          : `<p>Noch nicht vollständig — schau in die LaTeX-Quelle rechts.</p>`
      );
      return;
    }

    const gq = e.target.closest("[data-go-quiz]");
    if (gq) {
      const ok = gq.dataset.goQuiz === "in";
      $("#go-body").innerHTML = `
        <div class="feedback ${ok ? "" : "bad"}">${ok ? "Richtig." : "Inorder wäre richtig."}</div>
        <button class="btn btn-primary" type="button" data-go-home>Fertig</button>`;
    }
  });
}

function boot() {
  renderSubjects();
  renderFileTree();
  renderSkills();
  updateChrome();
  renderArtifactPane();
  showOverlay("home");
  wire();
  const w = setInterval(() => {
    if (window.katex) {
      clearInterval(w);
      renderKatex();
    }
  }, 40);
  setTimeout(() => clearInterval(w), 2500);
}

document.addEventListener("DOMContentLoaded", boot);
