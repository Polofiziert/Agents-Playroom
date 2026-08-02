/* Atrium — Cursor-like explorer + LaTeX artifacts */

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

/** Explorer folders — like a project tree, not parallel to subjects */
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
let activity = "explorer";
let step = 0;
let screen = "home";
let tree = { v: 5, l: null, r: null };
let timerId = null;
let timerLeft = 300;
let note = `BST: links < Knoten < rechts
Heute: Insert üben`;

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

/* ——— LaTeX as artifact source of truth ——— */

function tikzNode(node) {
  let s = `node {${node.v}}`;
  if (node.l) s += ` child { ${tikzNode(node.l)} }`;
  if (node.r) s += ` child { ${tikzNode(node.r)} }`;
  return s;
}

/** Canonical agent-readable representation */
function treeToLatex(root = tree) {
  return [
    "\\begin{tikzpicture}[",
    "  every node/.style={circle, draw=teal!60!black, fill=teal!8,",
    "    minimum size=7mm, inner sep=1pt, font=\\sffamily\\bfseries\\small},",
    "  edge from parent/.style={draw=black!40, thick},",
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

/** Fast preview SVG — visual only; agent reads LaTeX */
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
  return `<svg class="tree-canvas" viewBox="0 0 320 170" role="img" aria-label="BST-Vorschau">${lines}${nodes}</svg>`;
}

function renderTikzHosts() {
  const latex = treeToLatex();
  $$(".latex-src").forEach((el) => {
    el.textContent = latex;
  });
  $$(".tikz-host").forEach((host) => {
    // Live preview (snappy). TikZJax can replace when available.
    host.innerHTML = previewSvg();
    const script = document.createElement("script");
    script.type = "text/tikz";
    script.textContent = latex;
    // Keep preview; TikZJax replaces script tags — append after preview for engines that swap script→svg
    // If TikZJax runs, it may leave preview; we prefer preview for interaction speed.
    host.dataset.latex = latex;
  });
}

function artifactHtml(withActions = true) {
  return `<div class="artifact-simple">
    <h2>BST · einfügen</h2>
    <div class="tikz-host" aria-label="Grafik aus LaTeX"></div>
    ${
      withActions
        ? `<div class="actions">
      <button class="btn btn-mono" type="button" data-insert="7">insert(7)</button>
      <button class="btn btn-mono" type="button" data-insert="3">insert(3)</button>
      <button class="btn btn-mono" type="button" data-insert="9">insert(9)</button>
    </div>`
        : ""
    }
    <div class="src-label">LaTeX · Agent-State</div>
    <pre class="latex-src"></pre>
  </div>`;
}

function idleRail() {
  return `<div class="rail-idle">
    <p class="desk-label">Workspace</p>
    <p class="rail-idle-text">Artefakte als LaTeX/TikZ erscheinen hier, wenn die Session sie braucht.</p>
  </div>`;
}

function updateLayoutAttr() {
  const app = $("#app");
  if (!isDesktop()) {
    app.removeAttribute("data-layout");
    return;
  }
  if (screen === "focus") {
    app.dataset.layout = step === 1 || step === 2 ? "focus" : "focus-idle";
  } else {
    app.dataset.layout = "browse";
  }
}

function showScreen(name) {
  screen = name;
  $$(".screen").forEach((el) => el.classList.toggle("is-active", el.dataset.screen === name));
  closeMenu();
  closeSheet();
  updateLayoutAttr();
  if (name !== "focus") {
    $("#desk-rail").innerHTML = idleRail();
    $("#desk-rail").dataset.state = "idle";
  }
}

function updateHome() {
  const s = subject();
  $("#home-place").textContent = places[place].label;
  $("#next-title").textContent = `${s.name} · ${s.next}`;
  $("#next-meta").textContent = whyText[s.id] || "Aus deinem aktuellen Lernstand abgeleitet.";
  $("#focus-title").textContent = s.name;
  const label = `${places[place].label} / ${s.name}`;
  const chip = $("#workspace-label");
  if (chip) chip.textContent = label;
}

function renderSubjects() {
  const html = places[place].subjects
    .map(
      (s) => `<li><button type="button" data-pick-subject="${s.id}" ${
        s.id === subjectId ? 'aria-current="true"' : ""
      }><strong>${s.name}</strong><span>${s.blurb}</span></button></li>`
    )
    .join("");
  const mobile = $("#subject-picks");
  const desk = $("#desk-subjects");
  if (mobile) mobile.innerHTML = html;
  if (desk) desk.innerHTML = html;
  $$("[data-place]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.place === place ? "true" : "false"));
  $$("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === agentMode ? "true" : "false"));
  updateHome();
  renderFileTree();
}

function renderFileTree() {
  const html = treeFolders
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
  const desk = $("#file-tree");
  const mobile = $("#file-tree-mobile");
  if (desk) desk.innerHTML = html;
  if (mobile) mobile.innerHTML = html;
}

function renderSkills() {
  const stats = `
    <div><small>Heute</small><strong>42 min</strong></div>
    <div><small>Readiness</small><strong>68%</strong></div>`;
  const skills = [
    ["Binäre Suchbäume", "72%"],
    ["Inorder / Preorder", "54%"],
    ["O-Notation", "81%"],
  ]
    .map(
      ([n, w]) =>
        `<div class="skill"><div style="display:flex;justify-content:space-between"><span>${n}</span><span style="color:var(--muted)">${w}</span></div><div class="bar"><i style="--w:${w}"></i></div></div>`
    )
    .join("");
  const a = $("#stats-mini");
  const b = $("#skill-list");
  const c = $("#desk-stats");
  const d = $("#desk-skills");
  if (a) a.innerHTML = stats;
  if (b) b.innerHTML = skills;
  if (c) c.innerHTML = stats;
  if (d) d.innerHTML = skills;
}

function setActivity(name) {
  activity = name;
  $$(".act-btn[data-activity]").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.activity === name ? "true" : "false")
  );
  $$(".side-view").forEach((v) => {
    const on = v.dataset.sideView === name;
    v.classList.toggle("is-active", on);
    v.hidden = !on;
  });
}

function setDots(n) {
  $("#focus-dots").innerHTML = [0, 1, 2, 3].map((i) => `<i class="${i < n ? "on" : ""}"></i>`).join("");
}

function renderKatex(root = document) {
  if (!window.katex) return;
  root.querySelectorAll(".tex").forEach((el) => {
    if (el.dataset.done) return;
    try {
      katex.render(el.dataset.tex, el, { displayMode: el.classList.contains("block"), throwOnError: false });
      el.dataset.done = "1";
    } catch {
      /* ignore */
    }
  });
}

function present({ dots, agent, footer, artifact = null }) {
  setDots(dots);
  const desk = isDesktop();
  if (desk && artifact) {
    $("#focus-stage").innerHTML = agent;
    $("#desk-rail").innerHTML = artifact;
    $("#desk-rail").dataset.state = "active";
  } else if (desk) {
    $("#focus-stage").innerHTML = agent;
    $("#desk-rail").innerHTML = idleRail();
    $("#desk-rail").dataset.state = "idle";
  } else {
    $("#focus-stage").innerHTML = agent + (artifact || "");
  }
  $("#focus-footer").innerHTML = footer;
  if (artifact) renderTikzHosts();
  renderKatex($("#focus-stage"));
  updateLayoutAttr();
}

const steps = [
  {
    render() {
      const agent =
        agentMode === "examiner"
          ? `<div class="step-agent"><p>Examiner-Modus. Keine Tipps.</p><p>Aufgabe: Füge <strong>7</strong> und <strong>3</strong> in den Baum ein.</p></div>`
          : `<div class="step-agent">
              <p>Kurz und klar: Wir üben <strong>BST-Insert</strong>.</p>
              <p>Ziel: <strong>7</strong> und <strong>3</strong> korrekt einfügen. Darstellung &amp; Agent-State: <strong>LaTeX/TikZ</strong>.</p>
            </div>`;
      present({
        dots: 1,
        agent,
        footer: `<button class="btn btn-primary" type="button" data-next>Weiter zur Aufgabe</button>
          ${agentMode === "tutor" ? `<button class="hint-link" type="button" data-show-formula>Formel (LaTeX)</button>` : ""}`,
      });
    },
  },
  {
    render() {
      present({
        dots: 2,
        agent: `<div class="step-agent"><p>${
          isDesktop()
            ? "Rechts: TikZ-Vorschau + LaTeX-Quelle. Der Agent liest den LaTeX-Quelltext — kein Custom-JSON."
            : "Unten: Grafik + LaTeX-Quelle. Der Agent liest LaTeX, nicht ein Eigenformat."
        }</p></div>`,
        footer: `<button class="btn btn-primary" type="button" data-check>Prüfen</button>
          <button class="btn btn-ghost" type="button" data-ask>Frage stellen…</button>`,
        artifact: artifactHtml(true),
      });
    },
  },
  {
    render() {
      const ok = contains(tree, 7) && contains(tree, 3);
      present({
        dots: 3,
        agent: `<div class="feedback ${ok ? "" : "bad"}">${
          ok
            ? "Passt. Die LaTeX-Quelle enthält 7 und 3 korrekt. Weiter: Retrieval ohne Baum."
            : "Noch unvollständig — fehlende Werte in der LaTeX-Quelle."
        }</div>`,
        footer: ok
          ? `<button class="btn btn-primary" type="button" data-next>Weiter · Retrieval</button>`
          : `<button class="btn btn-primary" type="button" data-back>Zurück zur Aufgabe</button>`,
        artifact: artifactHtml(false),
      });
    },
  },
  {
    render() {
      present({
        dots: 4,
        agent: `<div class="step-agent"><p>Ohne Notizen: Welche Traversierung liefert die <strong>sortierte</strong> Folge eines BST?</p></div>
          <div class="go-choices">
            <button class="btn" type="button" data-quiz="pre">Preorder</button>
            <button class="btn" type="button" data-quiz="in">Inorder</button>
            <button class="btn" type="button" data-quiz="post">Postorder</button>
          </div>`,
        footer: "",
      });
    },
  },
  {
    render() {
      present({
        dots: 4,
        agent: `<div class="step-agent">
            <p>Session zu Ende. Gut gemacht.</p>
            <p>Learner-model wird ergänzt. Explorer bleibt für Dateien — nicht für parallele Fächer-Listen.</p>
          </div>
          <div class="event">Reflexion gespeichert (Demo)</div>`,
        footer: `<button class="btn btn-primary" type="button" data-go-home>Zurück zu Heute</button>`,
      });
    },
  },
];

function goStep(i) {
  step = Math.max(0, Math.min(steps.length - 1, i));
  steps[step].render();
}

function startSession() {
  tree = { v: 5, l: null, r: null };
  clearInterval(timerId);
  timerId = null;
  timerLeft = 300;
  showScreen("focus");
  goStep(0);
}

function openMenu() {
  $("#menu-sheet").hidden = false;
  $("#menu-backdrop").hidden = false;
  $("#focus-menu-btn").setAttribute("aria-expanded", "true");
}

function closeMenu() {
  $("#menu-sheet").hidden = true;
  $("#menu-backdrop").hidden = true;
  $("#focus-menu-btn")?.setAttribute("aria-expanded", "false");
}

function openSheet(title, html) {
  $("#sheet-title").textContent = title;
  $("#sheet-body").innerHTML = html;
  $("#sheet").hidden = false;
  $("#sheet-backdrop").hidden = false;
  renderKatex($("#sheet-body"));
}

function closeSheet() {
  $("#sheet").hidden = true;
  $("#sheet-backdrop").hidden = true;
}

function startGo() {
  showScreen("go");
  $("#go-body").innerHTML = `
    <p class="eyebrow">Informatik</p>
    <h2 class="go-q">Welche Traversierung sortiert einen BST?</h2>
    <div class="go-choices">
      <button class="btn" type="button" data-go-quiz="pre">Preorder</button>
      <button class="btn" type="button" data-go-quiz="in">Inorder</button>
      <button class="btn" type="button" data-go-quiz="post">Postorder</button>
    </div>`;
}

function setWorkspaceMenu(open) {
  const menu = $("#workspace-menu");
  const chip = $("#workspace-chip");
  if (!menu || !chip) return;
  menu.hidden = !open;
  chip.setAttribute("aria-expanded", open ? "true" : "false");
}

function wire() {
  $("#start-session").addEventListener("click", startSession);
  $("#start-go").addEventListener("click", startGo);
  $("#exit-focus").addEventListener("click", () => showScreen("home"));
  $("#focus-menu-btn").addEventListener("click", openMenu);
  $("#menu-backdrop").addEventListener("click", closeMenu);
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#sheet-backdrop").addEventListener("click", closeSheet);

  $("#workspace-chip")?.addEventListener("click", () => {
    const open = $("#workspace-menu").hidden;
    setWorkspaceMenu(open);
  });

  window.addEventListener("resize", () => {
    updateLayoutAttr();
    if (screen === "focus") steps[step].render();
  });

  document.addEventListener("click", (e) => {
    const act = e.target.closest(".act-btn[data-activity]");
    if (act) {
      setActivity(act.dataset.activity);
      return;
    }

    if (e.target.closest("[data-go-home]")) {
      showScreen("home");
      return;
    }
    if (e.target.closest('[data-open="more"]')) {
      showScreen("more");
      return;
    }

    const folderBtn = e.target.closest("[data-toggle-folder]");
    if (folderBtn) {
      const id = folderBtn.dataset.toggleFolder;
      const folder = treeFolders.find((f) => f.id === id);
      if (folder) {
        folder.open = !folder.open;
        renderFileTree();
      }
      return;
    }

    if (e.target.closest("[data-file]")) {
      toast(`Öffnen (Demo): ${e.target.closest("[data-file]").dataset.file}`);
      return;
    }

    const placeBtn = e.target.closest("[data-place]");
    if (placeBtn) {
      place = placeBtn.dataset.place;
      subjectId = places[place].subjects[0].id;
      renderSubjects();
      toast(places[place].label);
      return;
    }

    const modeBtn = e.target.closest("[data-mode]");
    if (modeBtn) {
      agentMode = modeBtn.dataset.mode;
      renderSubjects();
      toast(agentMode === "tutor" ? "Tutor" : "Examiner");
      return;
    }

    const pick = e.target.closest("[data-pick-subject]");
    if (pick) {
      subjectId = pick.dataset.pickSubject;
      renderSubjects();
      setWorkspaceMenu(false);
      toast(subject().name);
      if (screen === "focus") goStep(step);
      return;
    }

    if (e.target.closest("[data-next]")) {
      goStep(step + 1);
      return;
    }
    if (e.target.closest("[data-back]")) {
      goStep(1);
      return;
    }

    if (e.target.closest("[data-show-formula]")) {
      openSheet(
        "Formel · LaTeX",
        `<p>Quelle (KaTeX):</p>
         <pre class="latex-src">${BST_INVARIANT}</pre>
         <p style="margin:.75rem 0 .35rem">Gerendert:</p>
         <div class="tex block" data-tex="${BST_INVARIANT}"></div>`
      );
      return;
    }

    const ins = e.target.closest("[data-insert]");
    if (ins) {
      tree = insertBST(tree, Number(ins.dataset.insert));
      renderTikzHosts();
      toast(`LaTeX aktualisiert · insert(${ins.dataset.insert})`);
      return;
    }

    if (e.target.closest("[data-check]")) {
      goStep(2);
      return;
    }

    if (e.target.closest("[data-ask]")) {
      openSheet(
        "Kurz fragen",
        `<div class="composer" style="margin-top:.25rem">
          <textarea id="ask-input" rows="2" placeholder="Eine Frage…"></textarea>
          <button class="send" type="button" id="ask-send" aria-label="Senden">→</button>
        </div>`
      );
      return;
    }

    if (e.target.closest("#ask-send")) {
      const text = ($("#ask-input")?.value || "").trim();
      if (!text) return;
      closeSheet();
      $("#focus-stage").insertAdjacentHTML(
        "beforeend",
        `<div class="chat-mini"><div class="bubble-you">${text.replace(/</g, "&lt;")}</div>
        <div class="step-agent"><p>${
          agentMode === "examiner" ? "Keine Erklärung im Examiner-Modus." : "Kurz: links kleiner, rechts größer."
        }</p></div></div>`
      );
      return;
    }

    const quiz = e.target.closest("[data-quiz]");
    if (quiz) {
      const ok = quiz.dataset.quiz === "in";
      present({
        dots: 4,
        agent: `<div class="feedback ${ok ? "" : "bad"}">${ok ? "Genau — Inorder." : "Nicht ganz. Richtig wäre Inorder."}</div>`,
        footer: `<button class="btn btn-primary" type="button" data-next>Abschluss</button>`,
      });
      return;
    }

    const gq = e.target.closest("[data-go-quiz]");
    if (gq) {
      const ok = gq.dataset.goQuiz === "in";
      $("#go-body").innerHTML = `
        <div class="feedback ${ok ? "" : "bad"}">${ok ? "Richtig. Kurz und gut." : "Fast — Inorder sortiert."}</div>
        <button class="btn btn-primary" type="button" data-go-home>Fertig</button>`;
      return;
    }

    const menu = e.target.closest("#menu-sheet [data-menu]");
    if (menu) {
      const actName = menu.dataset.menu;
      closeMenu();
      if (actName === "exit") showScreen("home");
      if (actName === "why")
        openSheet("Warum diese Aufgabe?", `<p>${whyText[subject().id] || "Aus deinem learner-model."}</p>`);
      if (actName === "notes")
        openSheet(
          "Notiz",
          `<textarea class="note-area" id="note-area">${note.replace(/</g, "&lt;")}</textarea>
           <button class="btn btn-secondary" type="button" id="save-note" style="margin-top:.65rem;width:100%">Übernehmen</button>`
        );
      if (actName === "photo")
        openSheet(
          "Foto-Korrektur",
          `<div class="photo-mock"><p>Foto laden (Demo)</p>
           <button class="btn btn-secondary" type="button" id="sim-photo" style="margin-top:.5rem">Beispiel zeigen</button>
           <div id="photo-out"></div></div>`
        );
      if (actName === "timer") {
        openSheet(
          "Timer",
          `<div class="timer-big"><strong id="timer-display">05:00</strong><span>Bei Ablauf: LaTeX-State auswerten</span></div>
           <button class="btn btn-primary" type="button" id="timer-start">Start</button>`
        );
      }
      if (actName === "latex") openSheet("LaTeX · Agent-State", `<pre class="latex-src">${treeToLatex()}</pre>`);
      return;
    }

    if (e.target.closest("#save-note")) {
      note = $("#note-area")?.value || note;
      closeSheet();
      toast("Notiz gespeichert");
      return;
    }

    if (e.target.closest("#sim-photo")) {
      $("#photo-out").innerHTML = `<div class="paper-sheet">f(x)=x²+2x+1<br/>=(x+1)(x−1)?<span class="mark"></span></div>
        <p style="margin:.65rem 0 0;font-size:.88rem">Korrektur (LaTeX): <span class="tex" data-tex="x^2+2x+1=(x+1)^2"></span></p>`;
      renderKatex($("#photo-out"));
      return;
    }

    if (e.target.closest("#timer-start")) {
      clearInterval(timerId);
      timerLeft = 300;
      const tick = () => {
        const m = String(Math.floor(timerLeft / 60)).padStart(2, "0");
        const s = String(timerLeft % 60).padStart(2, "0");
        const el = $("#timer-display");
        if (el) el.textContent = `${m}:${s}`;
      };
      tick();
      timerId = setInterval(() => {
        timerLeft -= 1;
        tick();
        if (timerLeft <= 0) {
          clearInterval(timerId);
          toast("Zeit ist um");
          closeSheet();
          goStep(contains(tree, 7) && contains(tree, 3) ? 2 : 1);
        }
      }, 1000);
    }
  });
}

function boot() {
  renderSubjects();
  renderSkills();
  updateHome();
  setActivity("explorer");
  setWorkspaceMenu(false);
  showScreen("home");
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
