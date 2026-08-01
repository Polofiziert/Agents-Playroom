# Agents-Playroom

Sandbox zum Testen von Cursor Agents.

## Atrium — ruhiger GUI-Entwurf

Lern-UI nach **Progressive Disclosure** (NN/g): nur zeigen, was jetzt dran ist. Der Rest ist erreichbar, aber nicht im Weg.

### UX-Prinzipien (Recherche → Umsetzung)

| Pattern | Quelle / Idee | Bei Atrium |
|--------|----------------|------------|
| Progressive Disclosure | Nielsen Norman Group | Session = ein Schritt; Dateien/Stats unter **Mehr** |
| Focus Mode | LearnDash, ADHD-UX | Keine Sidebars während des Lernens |
| One next action | Brilliant-ähnlich | Home zeigt nur „Als Nächstes“ |
| Details on demand | Accordion / Sheet / ⋯-Menü | Formel, State, Foto, Timer hinter Abruf |
| Micro-learning | Duolingo-light | „Nur 3 Minuten?“ getrennt von Tiefensession |

### Drei Ebenen

1. **Heute** — eine Karte, ein Start  
2. **Session** — gestufte Schritte (Briefing → Artefakt → Feedback → Retrieval → Ende)  
3. **Mehr** — Lernort, Fach, Dateien, Übersicht (bewusst außerhalb vom Fokus)

### Adaptiv: Mobil ≠ Desktop (gleiche App)

| | Mobil (&lt;1100px) | Desktop (≥1100px) |
|--|------------------|-------------------|
| Layout | Ein Spalten-Flow | Cursor-Shell: Nav · Session · Workspace |
| Artefakt | Im Schritt gestapelt | Rechte Spalte, nur wenn nötig |
| Dateien | Unter „Mehr“ | Linke Leiste, standardmäßig verborgen |
| Prinzip | Sequentiell (Zeit) | Parallel (Raum), trotzdem ruhig |

### Ansehen

```bash
python3 -m http.server 8080
```

GitHub Pages: `https://polofiziert.github.io/Agents-Playroom/`  
(Branch in Settings → Pages prüfen)
