/* Atrium — responsive learning workspace prototype */

const places = {
  schule: {
    label: "Schule",
    subjects: [
      { id: "mathe", name: "Mathe", blurb: "Analysis · Geometrie", short: "Ma" },
      { id: "deutsch", name: "Deutsch", blurb: "Text · Argumentation", short: "De" },
      { id: "englisch", name: "Englisch", blurb: "Vocab · Writing", short: "En" },
    ],
  },
  ausbildung: {
    label: "Ausbildung",
    subjects: [
      { id: "fachtheorie", name: "Fachtheorie", blurb: "Prüfungsstoff", short: "FT" },
      { id: "praxis", name: "Praxis", blurb: "Betrieb · Checklisten", short: "Pr" },
      { id: "wiso", name: "WiSo", blurb: "Wirtschaft & Soziales", short: "Wi" },
    ],
  },
  studium: {
    label: "Studium",
    subjects: [
      { id: "informatik", name: "Informatik", blurb: "Algorithmen · Systeme", short: "In" },
      { id: "philosophie", name: "Philosophie", blurb: "Logik · Ethik", short: "Ph" },
      { id: "analysis", name: "Analysis", blurb: "Beweise · LaTeX", short: "An" },
    ],
  },
};

const filesByLens = {
  heute: [
    { name: "Warm-up · BST Retrieval", meta: "Challenge · 3 Min", layer: "learner" },
    { name: "Übung 04 · Bäume", meta: "Fach · Informatik", layer: "fach" },
    { name: "learner-model.md", meta: "Gedächtnis · heute", layer: "learner" },
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

const whyBySubject = {
  mathe: "Warum das? Bruchrechnung laut learner-model noch wackelig.",
  deutsch: "Warum das? Argumentationsstruktur in Klausuren unsicher.",
  englisch: "Warum das? Spaced Review: unregelmäßige Verben.",
  fachtheorie: "Warum das? Prüfungsziel nächtster Monat — Lücken schließen.",
  praxis: "Warum das? Checkliste aus dem Betrieb noch offen.",
  wiso: "Warum das? Retrieval zu Arbeitsrecht fällig.",
  informatik: "Warum das? BST-Insert laut learner-model noch unsicher.",
  philosophie: "Warum das? Begriffsdifferenzierung Utilitarismus/Deontologie.",
  analysis: "Warum das? Beweisstruktur ε-δ noch fragil.",
};

let tree = { v: 5, l: null, r: null };
let actions = [];
let place = "studium";
let subjectId = "informatik";
let lens = "heute";
let agentMode = "tutor";
let view = "session";
let timerId = null;
let timerLeft = 300;
let timerTotal = 300;
let phase = "focus";

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

function isDesktop() {
  return window.matchMedia("(min-width: 1100px)").matches;
}

function isRailInline() {
  return window.matchMedia("(min-width: 900px)").matches;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function updateChrome() {
  const sub = currentSubject();
  $("#context-crumb").textContent = `${places[place].label} · ${sub.name}`;
  $("#subjects-title").textContent = `Fächer · ${places[place].label}`;
  $("#agent-label").textContent = sub.name;
  $("#agent-avatar").textContent = sub.short;
  $("#agent-mode-label").textContent =
    agentMode === "tutor" ? "Tutor · erklärt & führt" : "Examiner · keine Hints";
  $("#why-chip").textContent = whyBySubject[sub.id] || "Warum das? Aus deinem learner-model.";
  $$(".mode-btn").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === agentMode ? "true" : "false"));
  updateFab();
}

function renderSubjects() {
  const html = places[place].subjects
    .map(
      (s) => `<li>
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
  updateChrome();
}

function renderFiles() {
  const html = (filesByLens[lens] || [])
    .map(
      (f) => `<li class="file-item">
      <span class="file-dot ${f.layer}"></span>
      <div class="file-meta"><strong>${f.name}</strong><small>${f.meta}</small></div>
    </li>`
    )
    .join("");
  $("#file-list").innerHTML = html;
  $("#file-list-mobile").innerHTML = html;
}

function renderSkills() {
  $("#skill-list").innerHTML = skills
    .map(
      (s) => `<div class="skill">
      <div class="skill-top"><strong>${s.name}</strong><span>${s.w}</span></div>
      <div class="bar"><i style="--w:${s.w}"></i></div>
    </div>`
    )
    .join("");
}

function setPhase(name) {
  phase = name;
  $$(".phase").forEach((el) => el.setAttribute("aria-current", el.dataset.phase === name ? "true" : "false"));
  const labels = { warmup: "Warm-up", focus: "Fokus", retrieval: "Retrieval", reflect: "Reflexion" };
  $("#session-status").textContent = labels[name] || "Session";
}

function setView(next) {
  view = next;
  $$(".shell, .view").forEach((el) => el.classList.remove("is-active"));
  const session = $("#view-session");
  const panel = $(`[data-view="${next}"]`);
  if (next === "session") {
    session.classList.add("is-active");
    $("#phase-bar").hidden = false;
  } else {
    session.classList.remove("is-active");
    $("#phase-bar").hidden = true;
    panel?.classList.add("is-active");
  }
  $$(".bottom-nav .nav-item").forEach((btn) => {
    btn.setAttribute("aria-current", btn.dataset.view === next ? "true" : "false");
  });
  closeSheet();
  updateFab();
}

function updateFab() {
  const fab = $("#fab-workspace");
  const show = view === "session" && !isRailInline();
  fab.hidden = !show;
}

function setRail(name, syncSheet = true) {
  $$(".rail-tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.rail === name ? "true" : "false"));
  $$("[data-rail-panel]").forEach((p) => p.classList.toggle("active", p.dataset.railPanel === name));
  if (syncSheet) syncSheetContent();
}

function syncSheetContent() {
  const sheetBody = $("#sheet-body");
  const railScroll = $("#rail-scroll");
  if (!sheetBody || !railScroll) return;
  // Clone active panel markup into sheet when opening; keep live nodes in rail for desktop
  // For prototype: move isn't needed if sheet mirrors via clone on open
}

function openSheet(rail = "artifact") {
  if (isRailInline()) {
    setRail(rail);
    return;
  }
  setRail(rail, false);
  const sheet = $("#workspace-sheet");
  const backdrop = $("#sheet-backdrop");
  const sheetBody = $("#sheet-body");
  // Mirror rail bodies into sheet
  sheetBody.innerHTML = "";
  $$("#rail-scroll [data-rail-panel]").forEach((panel) => {
    const clone = panel.cloneNode(true);
    // Re-bind isn't automatic for clone — use event delegation on sheet instead
    sheetBody.appendChild(clone);
  });
  sheet.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => {
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
  });
}

function closeSheet() {
  const sheet = $("#workspace-sheet");
  const backdrop = $("#sheet-backdrop");
  sheet.classList.remove("is-open");
  sheet.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
  setTimeout(() => {
    if (!sheet.classList.contains("is-open")) sheet.hidden = true;
  }, 320);
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

function treeContains(node, v) {
  if (!node) return false;
  if (node.v === v) return true;
  return v < node.v ? treeContains(node.l, v) : treeContains(node.r, v);
}

function updateTreeState() {
  const state = {
    type: "binary_tree",
    goal: "insert 7 and 3 (BST)",
    tree,
    learner_actions: actions,
    checks: ["bst_invariant", "contains:7", "contains:3"],
  };
  const text = JSON.stringify(state, null, 2);
  $$("[data-tree-state]").forEach((el) => {
    el.textContent = text;
  });
  const ok = treeContains(tree, 7) && treeContains(tree, 3);
  $$("[data-artifact-badge]").forEach((el) => {
    el.textContent = ok ? "Bereit" : "Offen";
    el.className = `badge ${ok ? "ok" : "open"}`;
  });
}

function drawTree() {
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
      (p) => `<g>
      <circle cx="${p.x}" cy="${p.y}" r="16" fill="#0f6b6b" />
      <text x="${p.x}" y="${p.y + 1}" text-anchor="middle" dominant-baseline="middle" fill="#f7fffe" font-size="12" font-family="Sora,sans-serif" font-weight="600">${p.v}</text>
    </g>`
    )
    .join("");
  const html = lines.join("") + nodes;
  $$(".tree-canvas").forEach((svg) => {
    svg.innerHTML = html;
  });
  updateTreeState();
}

function resetTree() {
  tree = { v: 5, l: null, r: null };
  actions = [];
  drawTree();
}

function appendChat(html) {
  const stream = $("#chat-stream");
  stream.insertAdjacentHTML("beforeend", html);
  stream.scrollTop = stream.scrollHeight;
}

function agentBubble(inner) {
  const name = currentSubject().name;
  return `<article class="msg msg-agent"><div class="msg-label">${name}-Agent · ${
    agentMode === "tutor" ? "Tutor" : "Examiner"
  }</div><div class="bubble">${inner}</div></article>`;
}

function learnerBubble(text) {
  return `<article class="msg msg-learner"><div class="msg-label">Du</div><div class="bubble">${escapeHtml(
    text
  )}</div></article>`;
}

function eventChip(text) {
  return `<div class="event-chip">${escapeHtml(text)}</div>`;
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

function seedChat() {
  $("#chat-stream").innerHTML = "";
  if (agentMode === "examiner") {
    appendChat(
      agentBubble(
        `Examiner-Modus. Keine Tipps. Aufgabe: füge <strong>7</strong> und <strong>3</strong> in den BST ein. Timer läuft mit.
        <div class="artifact-card">
          <div class="artifact-card-top"><strong>Artefakt · BST</strong><span class="badge open">Bewertet</span></div>
          <div class="btn-row">
            <button class="btn btn-primary" type="button" data-open-workspace>Workspace</button>
            <button class="btn btn-ghost" type="button" data-tool="timer">Timer starten</button>
          </div>
        </div>`
      )
    );
  } else {
    appendChat(
      agentBubble(
        `Willkommen zurück. Laut <em>learner-model</em> hakt es bei <strong>BST-Insert</strong>.
        <div class="artifact-card">
          <div class="artifact-card-top"><strong>Artefakt · Binärbaum</strong><span class="badge open">Offen</span></div>
          <p>Du arbeitest im Workspace — ich lese denselben State.</p>
          <div class="btn-row">
            <button class="btn btn-primary" type="button" data-open-workspace>Workspace öffnen</button>
            <button class="btn btn-ghost" type="button" data-tool="latex">Formel-Hilfe</button>
          </div>
        </div>`
      )
    );
    appendChat(learnerBubble("Zeig kurz die Invariante, dann starten wir."));
    appendChat(
      agentBubble(
        `BST-Invariante für jeden Knoten:
        <div class="katex-slot" data-tex="\\forall y \\in \\mathrm{left}(x):\\, y < x \\quad\\wedge\\quad \\forall y \\in \\mathrm{right}(x):\\, y > x"></div>`
      )
    );
  }
  appendChat(eventChip("System · Session-Phase: Fokus"));
  renderKatex();
}

function formatTime(sec) {
  const m = String(Math.floor(Math.max(0, sec) / 60)).padStart(2, "0");
  const s = String(Math.max(0, sec) % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerUI() {
  const t = formatTime(timerLeft);
  $$("#timer-display, #sheet-body #timer-display").forEach((el) => {
    if (el) el.textContent = t;
  });
  const pct = timerTotal ? (timerLeft / timerTotal) * 100 : 0;
  $$("#timer-ring, #sheet-body #timer-ring").forEach((el) => {
    if (el) el.style.setProperty("--progress", `${pct}%`);
  });
  $("#session-clock").textContent = timerId ? t : "—";
}

function startTimer(seconds = 300) {
  clearInterval(timerId);
  timerTotal = seconds;
  timerLeft = seconds;
  updateTimerUI();
  setPhase("retrieval");
  if (!isRailInline()) openSheet("timer");
  else setRail("timer");
  appendChat(eventChip(`System · Timer ${formatTime(seconds)} gestartet`));
  timerId = setInterval(() => {
    timerLeft -= 1;
    updateTimerUI();
    if (timerLeft <= 0) {
      clearInterval(timerId);
      timerId = null;
      appendChat(eventChip("System · Zeit ist um"));
      const ok = treeContains(tree, 7) && treeContains(tree, 3);
      appendChat(
        agentBubble(
          `Zeit abgelaufen — Artefakt-State ausgewertet.
          <div class="artifact-card">
            <div class="artifact-card-top"><strong>Auswertung</strong><span class="badge ${ok ? "ok" : "open"}">${
              ok ? "Bestanden" : "Unvollständig"
            }</span></div>
            <p>Actions: ${actions.length ? actions.join(", ") : "keine"}.</p>
          </div>`
        )
      );
      setPhase("reflect");
      toast("Timer vorbei — Auswertung");
    }
  }, 1000);
}

function sendMessage() {
  const input = $("#composer-input");
  const text = input.value.trim();
  if (!text) return;
  appendChat(learnerBubble(text));
  input.value = "";
  if (agentMode === "examiner") {
    appendChat(agentBubble("Notiert. Weiter am Artefakt — ohne Hinweise."));
  } else {
    appendChat(
      agentBubble(
        `Verstanden (${places[place].label} · ${currentSubject().name}). Workspace, Timer oder Foto — ich lese den State mit.`
      )
    );
  }
}

function doInsert(v) {
  tree = insertBST(tree, v);
  actions.push(`insert:${v}`);
  drawTree();
  appendChat(eventChip(`Learner · insert(${v}) am Artefakt`));
}

function wire() {
  $$(".place-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      place = btn.dataset.place;
      $$(".place-btn").forEach((b) =>
        b.setAttribute("aria-pressed", b.dataset.place === place ? "true" : "false")
      );
      subjectId = places[place].subjects[0].id;
      renderSubjects();
      seedChat();
      resetTree();
      toast(`Lernort: ${places[place].label}`);
    });
  });

  $$(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      agentMode = btn.dataset.mode;
      updateChrome();
      seedChat();
      toast(agentMode === "tutor" ? "Tutor-Modus" : "Examiner-Modus");
    });
  });

  $("#btn-nav-toggle")?.addEventListener("click", () => {
    document.getElementById("app").classList.toggle("nav-collapsed");
    const pressed = !document.getElementById("app").classList.contains("nav-collapsed");
    $("#btn-nav-toggle").setAttribute("aria-pressed", pressed ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    const sub = e.target.closest("[data-subject]");
    if (sub) {
      subjectId = sub.dataset.subject;
      renderSubjects();
      seedChat();
      resetTree();
      setView("session");
      toast(`Agent: ${currentSubject().name}`);
      return;
    }

    const lensBtn = e.target.closest(".lens-tab");
    if (lensBtn?.dataset.lens) {
      lens = lensBtn.dataset.lens;
      $$(".lens-tab").forEach((t) => {
        if (t.dataset.lens) t.setAttribute("aria-selected", t.dataset.lens === lens ? "true" : "false");
      });
      renderFiles();
      return;
    }

    const railTab = e.target.closest(".rail-tab");
    if (railTab?.dataset.rail) {
      const name = railTab.dataset.rail;
      if (railTab.closest("#workspace-sheet")) {
        $$("#workspace-sheet .rail-tab").forEach((t) =>
          t.setAttribute("aria-selected", t.dataset.rail === name ? "true" : "false")
        );
        $$("#sheet-body [data-rail-panel]").forEach((p) =>
          p.classList.toggle("active", p.dataset.railPanel === name)
        );
        $$("#rail-panel .rail-tab").forEach((t) =>
          t.setAttribute("aria-selected", t.dataset.rail === name ? "true" : "false")
        );
        $$("#rail-scroll [data-rail-panel]").forEach((p) =>
          p.classList.toggle("active", p.dataset.railPanel === name)
        );
      } else {
        setRail(name);
      }
      return;
    }

    if (e.target.closest("[data-open-workspace]") || e.target.closest('[data-tool="workspace"]')) {
      openSheet("artifact");
      return;
    }

    const tool = e.target.closest("[data-tool]");
    if (tool) {
      const t = tool.dataset.tool;
      if (t === "photo") openSheet("photo");
      if (t === "timer") startTimer(300);
      if (t === "latex") {
        appendChat(
          agentBubble(
            agentMode === "examiner"
              ? "Im Examiner-Modus gibt es keine Formel-Hilfe."
              : `Balance-Faktor:
              <div class="katex-slot" data-tex="\\mathrm{bf}(x)=h(\\mathrm{right}(x))-h(\\mathrm{left}(x))\\in\\{-1,0,1\\}"></div>`
          )
        );
        renderKatex();
      }
      if (t === "teachback") {
        setPhase("reflect");
        appendChat(
          agentBubble(
            `Teach-back: Erklär mir BST-Insert, als wäre ich Anfänger. Ich hakte nach — ohne dir die Antwort vorwegzunehmen.`
          )
        );
      }
      return;
    }

    const insert = e.target.closest("[data-insert]");
    if (insert) {
      doInsert(Number(insert.dataset.insert));
      return;
    }

    if (e.target.closest("#check-tree") || e.target.closest("#sheet-body #check-tree")) {
      const ok = treeContains(tree, 7) && treeContains(tree, 3);
      appendChat(
        agentBubble(
          ok
            ? "Passt. State enthält 7 und 3. Als Nächstes: Inorder in die Notiz schreiben."
            : "Noch nicht vollständig. Nutze insert — jede Action landet im State."
        )
      );
      toast(ok ? "Artefakt bestanden" : "Noch unvollständig");
      return;
    }

    const quiz = e.target.closest("[data-quiz]");
    if (quiz) {
      const ok = quiz.dataset.quiz === "in";
      if (view === "go") {
        $("#go-deck").insertAdjacentHTML(
          "beforeend",
          `<article class="go-card"><small>Feedback</small><h2>${
            ok ? "Richtig — Inorder." : "Nicht ganz — Inorder hält die Sortierung."
          }</h2></article>`
        );
      } else {
        appendChat(learnerBubble(quiz.textContent.trim()));
        appendChat(agentBubble(ok ? "Genau — Inorder." : "Nicht ganz — Inorder."));
      }
      toast(ok ? "+1 Retrieval" : "Nochmal merken");
    }
  });

  $$(".bottom-nav .nav-item").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  $("#fab-workspace").addEventListener("click", () => openSheet("artifact"));
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#sheet-backdrop").addEventListener("click", closeSheet);

  $("#send-btn").addEventListener("click", sendMessage);
  $("#composer-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Timer / note / photo — delegation covers sheet clones; also bind originals
  document.addEventListener("click", (e) => {
    if (e.target.closest("#timer-start") || e.target.closest("#sheet-body #timer-start")) {
      startTimer(timerLeft > 0 && timerLeft < timerTotal ? timerLeft : 300);
    }
    if (e.target.closest("#timer-reset") || e.target.closest("#sheet-body #timer-reset")) {
      clearInterval(timerId);
      timerId = null;
      timerLeft = 300;
      timerTotal = 300;
      updateTimerUI();
      toast("Timer zurückgesetzt");
    }
    if (e.target.closest("#simulate-photo") || e.target.closest("#sheet-body #simulate-photo")) {
      $$("#correction-preview, #sheet-body #correction-preview").forEach((el) => el?.classList.add("show"));
      appendChat(
        agentBubble(
          `Foto ausgewertet.
          <div class="artifact-card">
            <div class="artifact-card-top"><strong>Korrektur · Papier</strong><span class="badge open">2 Markierungen</span></div>
            <p>Faktorisierung: <span class="katex-inline" data-tex="x^2+2x+1=(x+1)^2"></span></p>
          </div>`
        )
      );
      renderKatex();
      toast("Foto-Korrektur");
    }
    if (e.target.closest("#share-note") || e.target.closest("#sheet-body #share-note")) {
      const note = (
        $("#sheet-body #note-area:not([hidden])") ||
        $("#sheet-body .note-area") ||
        $("#rail-scroll .note-area") ||
        $("#note-area")
      )?.value || "";
      const clipped = note.trim().slice(0, 160);
      appendChat(learnerBubble(`Notiz:\n${clipped}`));
      appendChat(agentBubble("Notiz übernommen — offene Frage wandert in die nächste Session."));
    }
    if (e.target.closest("#export-note") || e.target.closest("#sheet-body #export-note")) {
      toast("Demo: Session → Markdown-Export");
      appendChat(eventChip("System · Export vorbereitet (Prototyp)"));
    }
  });

  $("#start-challenge")?.addEventListener("click", () => {
    setView("session");
    setPhase("warmup");
    appendChat(eventChip("System · Micro-Challenge"));
    appendChat(
      agentBubble(
        `Schnell: Welche Traversierung sortiert einen BST?
        <div class="btn-row" style="margin-top:.55rem;font-family:var(--font-ui)">
          <button class="btn btn-ghost" type="button" data-quiz="pre">Preorder</button>
          <button class="btn btn-ghost" type="button" data-quiz="in">Inorder</button>
          <button class="btn btn-ghost" type="button" data-quiz="post">Postorder</button>
        </div>`
      )
    );
    toast("Challenge im Chat");
  });

  window.addEventListener("resize", () => {
    updateFab();
    if (isRailInline()) closeSheet();
  });
}

function boot() {
  renderSubjects();
  renderFiles();
  renderSkills();
  drawTree();
  updateTimerUI();
  setPhase("focus");
  setView("session");
  seedChat();
  wire();
  const wait = setInterval(() => {
    if (window.katex) {
      clearInterval(wait);
      renderKatex();
    }
  }, 40);
  setTimeout(() => clearInterval(wait), 3000);
}

document.addEventListener("DOMContentLoaded", boot);
