/* Atrium GUI prototype — interactive shell (no backend) */

const places = {
  schule: {
    label: "Schule",
    subjects: [
      { id: "mathe", name: "Mathe", blurb: "Analysis · Geometrie" },
      { id: "deutsch", name: "Deutsch", blurb: "Text · Argumentation" },
      { id: "englisch", name: "Englisch", blurb: "Vocab · Writing" },
    ],
  },
  ausbildung: {
    label: "Ausbildung",
    subjects: [
      { id: "fachtheorie", name: "Fachtheorie", blurb: "Prüfungsstoff" },
      { id: "praxis", name: "Praxis", blurb: "Betrieb · Checklisten" },
      { id: "wiso", name: "WiSo", blurb: "Wirtschaft & Soziales" },
    ],
  },
  studium: {
    label: "Studium",
    subjects: [
      { id: "informatik", name: "Informatik", blurb: "Algorithmen · Systeme" },
      { id: "philosophie", name: "Philosophie", blurb: "Logik · Ethik" },
      { id: "analysis", name: "Analysis", blurb: "Beweise · LaTeX" },
    ],
  },
};

const filesByLens = {
  heute: [
    { name: "Warm-up · BST Retrieval", meta: "Challenge · 3 Min", layer: "learner" },
    { name: "Übung 04 · Bäume", meta: "Fach · Informatik", layer: "fach" },
    { name: "learner-model.md", meta: "Gedächtnis · aktualisiert heute", layer: "learner" },
  ],
  stoff: [
    { name: "Skript · Kapitel 3 Bäume", meta: "Fachmaterial", layer: "fach" },
    { name: "Folien VL07", meta: "Lernort · Studium", layer: "place" },
    { name: "Altklausur 2024", meta: "Prüfung", layer: "place" },
  ],
  arbeit: [
    { name: "Mitschrift 2026-07-28.md", meta: "Deine Notizen", layer: "learner" },
    { name: "foto-uebung-03.jpg", meta: "Papier-Korrektur", layer: "learner" },
    { name: "lösung-bst.json", meta: "Artefakt-State", layer: "learner" },
  ],
  gedachtnis: [
    { name: "learner-model.md", meta: "Verhalten · Stand", layer: "learner" },
    { name: "skill-graph.json", meta: "Kompetenzen", layer: "learner" },
    { name: "rubrik-informatik.md", meta: "Bewertungsraster", layer: "fach" },
  ],
};

const skills = [
  { name: "Binäre Suchbäume", w: "72%" },
  { name: "Inorder / Preorder", w: "54%" },
  { name: "Komplexität O-Notation", w: "81%" },
  { name: "Beweisstruktur (Analysis)", w: "39%" },
];

/** @type {{ v: number, l: object|null, r: object|null }} */
let tree = { v: 5, l: null, r: null };
let actions = [];
let place = "studium";
let subjectId = "informatik";
let lens = "heute";
let timerId = null;
let timerLeft = 300;
let timerTotal = 300;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2400);
}

function currentSubject() {
  return places[place].subjects.find((s) => s.id === subjectId) || places[place].subjects[0];
}

function renderSubjects() {
  const html = places[place].subjects
    .map(
      (s) => `
    <li>
      <button class="subject-btn" type="button" data-subject="${s.id}" ${
        s.id === subjectId ? 'aria-current="true"' : ""
      }>
        <strong>${s.name}</strong>
        <span>${s.blurb}</span>
      </button>
    </li>`
    )
    .join("");
  $("#subject-list-desktop").innerHTML = html;
  $("#subject-list-mobile").innerHTML = html;
  $$(".panel-title").forEach((el) => {
    if (el.textContent.startsWith("Fächer")) el.textContent = `Fächer · ${places[place].label}`;
  });
  $("#agent-label").textContent = `Agent · ${currentSubject().name}`;
}

function renderFiles() {
  const items = filesByLens[lens] || [];
  const html = items
    .map(
      (f) => `
    <li class="file-item">
      <span class="file-dot ${f.layer}"></span>
      <div class="file-meta">
        <strong>${f.name}</strong>
        <small>${f.meta}</small>
      </div>
    </li>`
    )
    .join("");
  $("#file-list").innerHTML = html;
  $("#file-list-mobile").innerHTML = html;
}

function renderSkills() {
  $("#skill-list").innerHTML = skills
    .map(
      (s) => `
    <div class="skill">
      <div class="skill-top"><strong>${s.name}</strong><span>${s.w}</span></div>
      <div class="bar"><i style="--w:${s.w}"></i></div>
    </div>`
    )
    .join("");
}

function insertBST(node, value) {
  if (!node) return { v: value, l: null, r: null };
  if (value < node.v) node.l = insertBST(node.l, value);
  else if (value > node.v) node.r = insertBST(node.r, value);
  return node;
}

function layoutTree(node, x, y, gap) {
  if (!node) return [];
  const points = [{ v: node.v, x, y, node }];
  if (node.l) points.push(...layoutTree(node.l, x - gap, y + 55, gap * 0.55));
  if (node.r) points.push(...layoutTree(node.r, x + gap, y + 55, gap * 0.55));
  return points;
}

function drawTree() {
  const svg = $("#tree-svg");
  const pts = layoutTree(tree, 160, 36, 70);
  const byVal = Object.fromEntries(pts.map((p) => [p.v, p]));
  const lines = [];
  for (const p of pts) {
    if (p.node.l) {
      const c = byVal[p.node.l.v];
      lines.push(`<line x1="${p.x}" y1="${p.y}" x2="${c.x}" y2="${c.y}" stroke="#9aaca6" />`);
    }
    if (p.node.r) {
      const c = byVal[p.node.r.v];
      lines.push(`<line x1="${p.x}" y1="${p.y}" x2="${c.x}" y2="${c.y}" stroke="#9aaca6" />`);
    }
  }
  const nodes = pts
    .map(
      (p) => `
    <g>
      <circle cx="${p.x}" cy="${p.y}" r="16" fill="#0f6b6b" />
      <text x="${p.x}" y="${p.y + 1}" text-anchor="middle" dominant-baseline="middle" fill="#f7fffe" font-size="12" font-family="Sora,sans-serif" font-weight="600">${p.v}</text>
    </g>`
    )
    .join("");
  svg.innerHTML = lines.join("") + nodes;
  updateTreeState();
}

function updateTreeState() {
  const state = {
    type: "binary_tree",
    goal: "insert 7 and 3 (BST)",
    tree,
    learner_actions: actions,
    checks: ["bst_invariant", "contains:7", "contains:3"],
  };
  $("#tree-state").textContent = JSON.stringify(state, null, 2);
}

function treeContains(node, v) {
  if (!node) return false;
  if (node.v === v) return true;
  return v < node.v ? treeContains(node.l, v) : treeContains(node.r, v);
}

function appendChat(html) {
  const stream = $("#chat-stream");
  stream.insertAdjacentHTML("beforeend", html);
  stream.scrollTop = stream.scrollHeight;
}

function agentBubble(inner, withLabel = true) {
  return `<article class="msg msg-agent">${
    withLabel ? `<div class="msg-label">${currentSubject().name}-Agent</div>` : ""
  }<div class="bubble">${inner}</div></article>`;
}

function learnerBubble(text) {
  return `<article class="msg msg-learner"><div class="msg-label">Du</div><div class="bubble">${escapeHtml(
    text
  )}</div></article>`;
}

function eventChip(text) {
  return `<div class="event-chip">${escapeHtml(text)}</div>`;
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function seedChat() {
  const stream = $("#chat-stream");
  stream.innerHTML = "";
  appendChat(
    agentBubble(
      `Willkommen zurück. Laut <em>learner-model</em> hakt es noch bei <strong>BST-Insert</strong> und Inorder-Traversal.
      <div class="artifact-card">
        <div class="artifact-card-top">
          <strong>Artefakt · Binärbaum</strong>
          <span class="badge open">Offen</span>
        </div>
        <p>Shared State: du interagierst rechts, ich lese denselben JSON-State.</p>
        <div class="btn-row">
          <button class="btn btn-primary" type="button" data-open-artifact>Im Workspace öffnen</button>
          <button class="btn btn-ghost" type="button" data-show-latex>Formel-Hilfe</button>
        </div>
      </div>`
    )
  );
  appendChat(learnerBubble("Kannst du kurz die Invariante zeigen und dann den Timer für 5 Minuten starten?"));
  appendChat(
    agentBubble(
      `Die BST-Invariante für jeden Knoten <span class="katex-inline" data-tex="x"></span>:
      <div class="katex-slot" data-tex="\\forall y \\in \\mathrm{left}(x):\\, y < x \\quad\\wedge\\quad \\forall y \\in \\mathrm{right}(x):\\, y > x"></div>
      Wenn du bereit bist: Timer startet, danach werte ich dein Artefakt aus.`
    )
  );
  appendChat(eventChip("System · Artefakt „BST · Knoten einfügen“ aktiv"));
  renderKatex();
}

function renderKatex() {
  if (!window.katex) return;
  $$(".katex-slot").forEach((el) => {
    if (el.dataset.done) return;
    try {
      katex.render(el.dataset.tex, el, { displayMode: true, throwOnError: false });
      el.dataset.done = "1";
    } catch {
      /* ignore */
    }
  });
  $$(".katex-inline").forEach((el) => {
    if (el.dataset.done) return;
    try {
      katex.render(el.dataset.tex, el, { displayMode: false, throwOnError: false });
      el.dataset.done = "1";
    } catch {
      /* ignore */
    }
  });
}

function setView(view) {
  const session = $("#view-session");
  const panels = $$("[data-view-panel]");
  panels.forEach((p) => {
    if (p.id === "view-session") {
      p.style.display = view === "session" ? "" : "none";
      return;
    }
    p.classList.toggle("active", p.id === `view-${view}`);
  });
  if (view === "session") session.style.display = "";
  $$(".bottom-nav .nav-item").forEach((btn) => {
    btn.setAttribute("aria-current", btn.dataset.view === view ? "true" : "false");
  });
}

function setRail(name) {
  $$(".rail-tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.rail === name ? "true" : "false"));
  $$("[data-rail-panel]").forEach((p) => p.classList.toggle("active", p.dataset.railPanel === name));
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerUI() {
  $("#timer-display").textContent = formatTime(timerLeft);
  const pct = timerTotal ? (timerLeft / timerTotal) * 100 : 0;
  $("#timer-ring").style.setProperty("--progress", `${pct}%`);
  $("#session-clock").textContent = formatTime(timerLeft);
}

function startTimer(seconds = 300) {
  clearInterval(timerId);
  timerTotal = seconds;
  timerLeft = seconds;
  updateTimerUI();
  setRail("timer");
  appendChat(eventChip(`System · Timer ${formatTime(seconds)} gestartet`));
  timerId = setInterval(() => {
    timerLeft -= 1;
    updateTimerUI();
    if (timerLeft <= 0) {
      clearInterval(timerId);
      timerId = null;
      appendChat(eventChip("System · Zeit ist um"));
      appendChat(
        agentBubble(
          `Zeit abgelaufen. Ich lese jetzt den Artefakt-State…
          <div class="artifact-card">
            <div class="artifact-card-top"><strong>Auswertung</strong><span class="badge ${
              treeContains(tree, 7) && treeContains(tree, 3) ? "ok" : "open"
            }">${treeContains(tree, 7) && treeContains(tree, 3) ? "Bestanden" : "Unvollständig"}</span></div>
            <p>Actions: ${actions.length ? actions.join(", ") : "keine"}. Nächster Schritt: Inorder erklären (Teach-back).</p>
          </div>`
        )
      );
      toast("Timer vorbei — Agent wertet aus");
    }
  }, 1000);
}

function resetTree() {
  tree = { v: 5, l: null, r: null };
  actions = [];
  drawTree();
}

function wire() {
  $$(".place-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      place = btn.dataset.place;
      $$(".place-btn").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
      subjectId = places[place].subjects[0].id;
      renderSubjects();
      seedChat();
      resetTree();
      toast(`Lernort: ${places[place].label}`);
    });
  });

  document.addEventListener("click", (e) => {
    const sub = e.target.closest("[data-subject]");
    if (sub) {
      subjectId = sub.dataset.subject;
      renderSubjects();
      seedChat();
      setView("session");
      toast(`Agent: ${currentSubject().name}`);
    }

    const lensBtn = e.target.closest(".lens-tab");
    if (lensBtn) {
      lens = lensBtn.dataset.lens;
      $$(".lens-tab").forEach((t) => {
        if (t.dataset.lens) t.setAttribute("aria-selected", t.dataset.lens === lens ? "true" : "false");
      });
      renderFiles();
    }

    if (e.target.closest("[data-open-artifact]")) {
      setRail("artifact");
      setView("session");
      toast("Artefakt im Workspace");
    }

    if (e.target.closest("[data-show-latex]") || e.target.closest('[data-tool="latex"]')) {
      appendChat(
        agentBubble(
          `Balance-Faktor (AVL-Skizze):
          <div class="katex-slot" data-tex="\\mathrm{bf}(x)=h(\\mathrm{right}(x))-h(\\mathrm{left}(x))\\in\\{-1,0,1\\}"></div>`
        )
      );
      renderKatex();
    }

    if (e.target.closest('[data-tool="photo"]')) {
      setRail("photo");
      setView("session");
    }
    if (e.target.closest('[data-tool="artifact"]')) {
      setRail("artifact");
      setView("session");
    }
    if (e.target.closest('[data-tool="timer"]')) {
      startTimer(300);
      setView("session");
    }

    const insert = e.target.closest("[data-insert]");
    if (insert) {
      const v = Number(insert.dataset.insert);
      tree = insertBST(tree, v);
      actions.push(`insert:${v}`);
      drawTree();
      appendChat(eventChip(`Learner · insert(${v}) am Artefakt`));
    }

    if (e.target.closest("#check-tree")) {
      const ok = treeContains(tree, 7) && treeContains(tree, 3);
      appendChat(
        agentBubble(
          ok
            ? `Passt. State zeigt 7 und 3 korrekt. Als Nächstes: zeichne mental die Inorder-Folge und schreib sie in die Notiz.`
            : `Noch nicht. Mir fehlen Werte im State. Nutze die Buttons — ich sehe jede Action live.`
        )
      );
      toast(ok ? "Artefakt bestanden" : "Artefakt unvollständig");
    }
  });

  $$(".rail-tab").forEach((tab) => {
    tab.addEventListener("click", () => setRail(tab.dataset.rail));
  });

  $$(".bottom-nav .nav-item").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  $("#btn-overview-desktop")?.addEventListener("click", () => {
    const progress = $("#view-progress");
    const showing = progress.classList.contains("active");
    if (showing) {
      progress.classList.remove("active");
      $("#view-session").style.display = "";
      $("#btn-overview-desktop").setAttribute("aria-pressed", "false");
    } else {
      $("#view-session").style.display = "none";
      $$(".view").forEach((v) => v.classList.remove("active"));
      progress.classList.add("active");
      $("#btn-overview-desktop").setAttribute("aria-pressed", "true");
    }
  });

  $("#send-btn").addEventListener("click", sendMessage);
  $("#composer-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  $("#timer-start").addEventListener("click", () => startTimer(timerLeft > 0 && timerLeft < timerTotal ? timerLeft : 300));
  $("#timer-reset").addEventListener("click", () => {
    clearInterval(timerId);
    timerId = null;
    timerLeft = 300;
    timerTotal = 300;
    updateTimerUI();
    toast("Timer zurückgesetzt");
  });

  $("#simulate-photo").addEventListener("click", () => {
    $("#correction-preview").classList.add("show");
    appendChat(
      agentBubble(
        `Foto ausgewertet.
        <div class="artifact-card">
          <div class="artifact-card-top"><strong>Korrektur · Papier</strong><span class="badge open">2 Markierungen</span></div>
          <p>Zeile 2: Faktorisierung falsch — <span class="katex-inline" data-tex="x^2+2x+1=(x+1)^2"></span>, nicht Differenz.</p>
        </div>`
      )
    );
    renderKatex();
    toast("Foto-Korrektur simuliert");
  });

  $("#share-note").addEventListener("click", () => {
    const note = $("#note-area").value.trim().slice(0, 180);
    appendChat(learnerBubble(`Notiz teilen:\n${note}${note.length >= 180 ? "…" : ""}`));
    appendChat(agentBubble("Notiz übernommen. Ich hake die offene Frage zu Rotationen in der nächsten Session an."));
    toast("Notiz an Agent gesendet");
  });

  $("#start-challenge").addEventListener("click", () => {
    setView("session");
    $("#view-session").style.display = "";
    $("#view-progress").classList.remove("active");
    appendChat(eventChip("System · Micro-Challenge gestartet"));
    appendChat(
      agentBubble(
        `Schnell: Welche Traversierung liefert die sortierte Folge eines BST?
        <div class="btn-row" style="margin-top:.6rem;font-family:var(--font-ui)">
          <button class="btn btn-ghost" type="button" data-quiz="pre">Preorder</button>
          <button class="btn btn-ghost" type="button" data-quiz="in">Inorder</button>
          <button class="btn btn-ghost" type="button" data-quiz="post">Postorder</button>
        </div>`
      )
    );
    toast("Challenge läuft im Chat");
  });

  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-quiz]");
    if (!q) return;
    const ok = q.dataset.quiz === "in";
    appendChat(learnerBubble(q.textContent.trim()));
    appendChat(agentBubble(ok ? "Genau — Inorder. +1 Retrieval." : "Nicht ganz — Inorder hält die Sortierung."));
  });
}

function sendMessage() {
  const input = $("#composer-input");
  const text = input.value.trim();
  if (!text) return;
  appendChat(learnerBubble(text));
  input.value = "";
  appendChat(
    agentBubble(
      `Verstanden. Ich bleibe im Fach <strong>${currentSubject().name}</strong> (${places[place].label}).
      Nutze Artefakt, Timer oder Foto rechts — ich lese den State mit.`
    )
  );
}

function boot() {
  renderSubjects();
  renderFiles();
  renderSkills();
  drawTree();
  updateTimerUI();
  seedChat();
  wire();
  // Wait for KaTeX defer
  const wait = setInterval(() => {
    if (window.katex) {
      clearInterval(wait);
      renderKatex();
    }
  }, 50);
  setTimeout(() => clearInterval(wait), 3000);
}

document.addEventListener("DOMContentLoaded", boot);
