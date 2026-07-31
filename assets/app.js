/* Atrium — calm, staged learning prototype
   One screen · one job · details on request */

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

const filesByLens = {
  heute: [
    { name: "Übung 04 · Bäume", meta: "Fach" },
    { name: "learner-model.md", meta: "Gedächtnis" },
  ],
  stoff: [
    { name: "Skript Kap. 3", meta: "Fachmaterial" },
    { name: "Folien VL07", meta: "Lernort" },
  ],
  arbeit: [
    { name: "Mitschrift 28.07.", meta: "Notiz" },
    { name: "foto-uebung.jpg", meta: "Papier" },
  ],
  gedachtnis: [
    { name: "learner-model.md", meta: "Stand" },
    { name: "skill-graph.json", meta: "Skills" },
  ],
};

const whyText = {
  informatik: "Insert in BSTs ist laut learner-model noch unsicher — deshalb genau diese Aufgabe.",
  philosophie: "Begriffsdifferenzierung war zuletzt wackelig.",
  analysis: "Beweisstruktur braucht Wiederholung.",
  mathe: "Brüche erzeugen noch Flüchtigkeitsfehler.",
  deutsch: "Argumentationsaufbau steht als Lücke.",
  fachtheorie: "Prüfungsziel rückt näher.",
  praxis: "Betriebliche Checkliste ist offen.",
};

let place = "studium";
let subjectId = "informatik";
let agentMode = "tutor";
let lens = "heute";
let step = 0; // session step index
let tree = { v: 5, l: null, r: null };
let actions = [];
let timerId = null;
let timerLeft = 300;
let note = `BST: links < Knoten < rechts
Heute: Insert üben`;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

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

function showScreen(name) {
  $$(".screen").forEach((el) => el.classList.toggle("is-active", el.dataset.screen === name));
  closeMenu();
  closeSheet();
}

function updateHome() {
  const s = subject();
  $("#home-place").textContent = places[place].label;
  $("#next-title").textContent = `${s.name} · ${s.next}`;
  $("#next-meta").textContent = whyText[s.id] || "Aus deinem aktuellen Lernstand abgeleitet.";
  $("#focus-title").textContent = s.name;
}

function renderSubjects() {
  $("#subject-picks").innerHTML = places[place].subjects
    .map(
      (s) => `<li><button type="button" data-pick-subject="${s.id}" ${
        s.id === subjectId ? 'aria-current="true"' : ""
      }><strong>${s.name}</strong><span>${s.blurb}</span></button></li>`
    )
    .join("");
  $$("[data-place]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.place === place ? "true" : "false"));
  $$("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === agentMode ? "true" : "false"));
  updateHome();
}

function renderFiles() {
  $("#file-list").innerHTML = (filesByLens[lens] || [])
    .map((f) => `<li>${f.name}<small>${f.meta}</small></li>`)
    .join("");
  $$("#lens-row button").forEach((b) => b.setAttribute("aria-selected", b.dataset.lens === lens ? "true" : "false"));
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
      ([n, w]) => `<div class="skill"><div style="display:flex;justify-content:space-between"><span>${n}</span><span style="color:var(--muted)">${w}</span></div><div class="bar"><i style="--w:${w}"></i></div></div>`
    )
    .join("");
}

function setDots(activeCount) {
  $("#focus-dots").innerHTML = [0, 1, 2, 3].map((i) => `<i class="${i < activeCount ? "on" : ""}"></i>`).join("");
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

function treeSvg() {
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
      (p) => `<g><circle cx="${p.x}" cy="${p.y}" r="15" fill="#0f6b6b"/><text x="${p.x}" y="${p.y + 1}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="12" font-family="Sora,sans-serif" font-weight="600">${p.v}</text></g>`
    )
    .join("");
  return lines + nodes;
}

function paintTrees() {
  $$(".tree-canvas").forEach((el) => {
    el.innerHTML = treeSvg();
  });
}

function stateJson() {
  return JSON.stringify(
    {
      type: "binary_tree",
      goal: "insert 7 and 3",
      tree,
      learner_actions: actions,
    },
    null,
    2
  );
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

/** Staged session: only current step visible */
const steps = [
  {
    // 0 brief
    dots: 1,
    render() {
      const hint =
        agentMode === "examiner"
          ? `<div class="step-agent"><p>Examiner-Modus. Keine Tipps.</p><p>Aufgabe: Füge <strong>7</strong> und <strong>3</strong> in den Baum ein.</p></div>`
          : `<div class="step-agent">
              <p>Kurz und klar: Wir üben <strong>BST-Insert</strong>.</p>
              <p>Ziel: <strong>7</strong> und <strong>3</strong> korrekt einfügen. Alles andere später.</p>
            </div>`;
      $("#focus-stage").innerHTML = hint;
      $("#focus-footer").innerHTML = `<button class="btn btn-primary" type="button" data-next>Weiter zur Aufgabe</button>
        ${agentMode === "tutor" ? `<button class="hint-link" type="button" data-show-formula>Formel kurz zeigen</button>` : ""}`;
    },
  },
  {
    // 1 work on artifact
    dots: 2,
    render() {
      $("#focus-stage").innerHTML = `
        <div class="step-agent"><p>Arbeit am Artefakt. Der Agent liest denselben State — du musst ihn nicht sehen.</p></div>
        <div class="artifact-simple">
          <h2>BST · einfügen</h2>
          <svg class="tree-canvas" viewBox="0 0 320 170" role="img" aria-label="Binärbaum"></svg>
          <div class="actions">
            <button class="btn btn-mono" type="button" data-insert="7">insert(7)</button>
            <button class="btn btn-mono" type="button" data-insert="3">insert(3)</button>
            <button class="btn btn-mono" type="button" data-insert="9">insert(9)</button>
          </div>
        </div>`;
      paintTrees();
      $("#focus-footer").innerHTML = `
        <button class="btn btn-primary" type="button" data-check>Prüfen</button>
        <button class="btn btn-ghost" type="button" data-ask>Frage stellen…</button>`;
    },
  },
  {
    // 2 feedback / optional timer
    dots: 3,
    render() {
      const ok = contains(tree, 7) && contains(tree, 3);
      $("#focus-stage").innerHTML = `
        <div class="feedback ${ok ? "" : "bad"}">
          ${
            ok
              ? "Passt. 7 und 3 sitzen richtig. Als Nächstes eine kurze Retrieval-Frage — ohne Baum."
              : "Noch nicht vollständig. Geh einen Schritt zurück und füge die fehlenden Werte ein."
          }
        </div>
        <div class="artifact-simple">
          <svg class="tree-canvas" viewBox="0 0 320 170"></svg>
        </div>`;
      paintTrees();
      $("#focus-footer").innerHTML = ok
        ? `<button class="btn btn-primary" type="button" data-next>Weiter · Retrieval</button>`
        : `<button class="btn btn-primary" type="button" data-back>Zurück zur Aufgabe</button>`;
    },
  },
  {
    // 3 retrieval
    dots: 4,
    render() {
      $("#focus-stage").innerHTML = `
        <div class="step-agent"><p>Ohne Notizen: Welche Traversierung liefert die <strong>sortierte</strong> Folge eines BST?</p></div>
        <div class="go-choices">
          <button class="btn" type="button" data-quiz="pre">Preorder</button>
          <button class="btn" type="button" data-quiz="in">Inorder</button>
          <button class="btn" type="button" data-quiz="post">Postorder</button>
        </div>`;
      $("#focus-footer").innerHTML = "";
    },
  },
  {
    // 4 reflect / done
    dots: 4,
    render() {
      $("#focus-stage").innerHTML = `
        <div class="step-agent">
          <p>Session zu Ende. Gut gemacht.</p>
          <p>Dein learner-model wird um diese Übung ergänzt. Details und Dateien findest du unter <strong>Mehr</strong> — nicht hier.</p>
        </div>
        <div class="event">Reflexion gespeichert (Demo)</div>`;
      $("#focus-footer").innerHTML = `<button class="btn btn-primary" type="button" data-go-home>Zurück zu Heute</button>`;
    },
  },
];

function goStep(i) {
  step = Math.max(0, Math.min(steps.length - 1, i));
  setDots(steps[step].dots);
  steps[step].render();
  renderKatex($("#focus-stage"));
}

function startSession() {
  tree = { v: 5, l: null, r: null };
  actions = [];
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

function wire() {
  $("#start-session").addEventListener("click", startSession);
  $("#start-go").addEventListener("click", startGo);
  $("#exit-focus").addEventListener("click", () => showScreen("home"));
  $("#focus-menu-btn").addEventListener("click", openMenu);
  $("#menu-backdrop").addEventListener("click", closeMenu);
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#sheet-backdrop").addEventListener("click", closeSheet);

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-go-home]") || e.target.closest('[data-open="home"]')) {
      showScreen("home");
      return;
    }
    if (e.target.closest('[data-open="more"]')) {
      showScreen("more");
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
      toast(subject().name);
      return;
    }

    const lensBtn = e.target.closest("[data-lens]");
    if (lensBtn) {
      lens = lensBtn.dataset.lens;
      renderFiles();
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
        "Formel",
        `<p>BST-Invariante:</p><div class="tex block" data-tex="\\forall y\\in\\mathrm{left}(x):\\,y<x\\quad\\wedge\\quad\\forall y\\in\\mathrm{right}(x):\\,y>x"></div><p style="color:var(--muted);font-size:.88rem">Danach wieder zu — Fokus auf die Aufgabe.</p>`
      );
      return;
    }

    const ins = e.target.closest("[data-insert]");
    if (ins) {
      const v = Number(ins.dataset.insert);
      tree = insertBST(tree, v);
      actions.push(`insert:${v}`);
      paintTrees();
      toast(`insert(${v})`);
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
        </div>
        <p style="color:var(--muted);font-size:.82rem;margin:.75rem 0 0">Im Fokus bleibt die Aufgabe. Der Chat ist Absicht zweitrangig.</p>`
      );
      return;
    }

    if (e.target.closest("#ask-send")) {
      const text = ($("#ask-input")?.value || "").trim();
      if (!text) return;
      closeSheet();
      const stage = $("#focus-stage");
      stage.insertAdjacentHTML(
        "beforeend",
        `<div class="chat-mini"><div class="bubble-you">${text.replace(/</g, "&lt;")}</div>
        <div class="step-agent"><p>${
          agentMode === "examiner"
            ? "Im Examiner-Modus keine Erklärung — weiter am Artefakt."
            : "Kurz: links kleiner, rechts größer. Probier insert nochmal."
        }</p></div></div>`
      );
      stage.scrollTop = stage.scrollHeight;
      return;
    }

    const quiz = e.target.closest("[data-quiz]");
    if (quiz) {
      const ok = quiz.dataset.quiz === "in";
      $("#focus-stage").innerHTML = `<div class="feedback ${ok ? "" : "bad"}">${
        ok ? "Genau — Inorder." : "Nicht ganz. Richtig wäre Inorder."
      }</div>`;
      $("#focus-footer").innerHTML = `<button class="btn btn-primary" type="button" data-next>Abschluss</button>`;
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
      const act = menu.dataset.menu;
      closeMenu();
      if (act === "exit") showScreen("home");
      if (act === "why")
        openSheet("Warum diese Aufgabe?", `<p>${whyText[subject().id] || "Aus deinem learner-model."}</p>`);
      if (act === "notes")
        openSheet(
          "Notiz",
          `<textarea class="note-area" id="note-area">${note.replace(/</g, "&lt;")}</textarea>
           <button class="btn btn-secondary" type="button" id="save-note" style="margin-top:.65rem;width:100%">Übernehmen</button>`
        );
      if (act === "photo")
        openSheet(
          "Foto-Korrektur",
          `<div class="photo-mock"><p>Foto laden (Demo)</p>
           <button class="btn btn-secondary" type="button" id="sim-photo" style="margin-top:.5rem">Beispiel zeigen</button>
           <div id="photo-out"></div></div>`
        );
      if (act === "timer") {
        openSheet(
          "Timer",
          `<div class="timer-big"><strong id="timer-display">05:00</strong><span>Agent wertet bei Ablauf den Artefakt-State aus</span></div>
           <button class="btn btn-primary" type="button" id="timer-start">Start</button>`
        );
      }
      if (act === "state") openSheet("Agent-State", `<pre>${stateJson()}</pre>`);
      if (act === "files") {
        showScreen("more");
        const d = $$(".more-details")[0];
        if (d) d.open = true;
      }
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
        <p style="margin:.65rem 0 0;font-size:.88rem">Korrektur: <span class="tex" data-tex="x^2+2x+1=(x+1)^2"></span></p>`;
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
          const ok = contains(tree, 7) && contains(tree, 3);
          goStep(ok ? 2 : 1);
        }
      }, 1000);
      return;
    }
  });
}

function boot() {
  renderSubjects();
  renderFiles();
  renderSkills();
  updateHome();
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
