# Agents-Playroom

Sandbox zum Testen von Cursor Agents.

## Atrium — GUI-Entwurf

### Desktop-Layout (wie Cursor)

```
Activity Bar │  KI-Chat (klassisch)  │  Tabs: Artefakt | Dateien
```

- **Chat:** durchgehender Verlauf, LaTeX (KaTeX), Nachfragen mit Antwort-Chips
- **Rechts:** Tabs oben — Artefakt (LaTeX/TikZ) oder Dateibaum
- **Activity Bar:** Heute · Chat · Übersicht · Mehr

### Mobil

Chat vollflächig; Artefakt/Dateien über Panel-Button (Tabs).

### Artefakte

Agent-State = **LaTeX/TikZ**, Formeln im Chat gerendert — kein Custom-JSON.

### Ansehen

```bash
python3 -m http.server 8080
```

GitHub Pages: `https://polofiziert.github.io/Agents-Playroom/`
