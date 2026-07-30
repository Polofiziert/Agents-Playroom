# Agents-Playroom

Sandbox zum Testen von Cursor Agents.

## Atrium — GUI-Entwurf

Responsiver Prototyp einer agentischen Lernplattform.

### Design-Idee

| Breakpoint | Layout |
|------------|--------|
| **Handy** | Chat vollflächig · Workspace als Bottom-Sheet · FAB · 5-Tab-Navigation |
| **Tablet ≥900px** | Chat + Workspace-Spalte · Phasenleiste |
| **Desktop ≥1100px** | Dateien/Fächer · Chat · Workspace (Cursor-ähnlich) |

**Deine Konzepte drin:** Lernorte → Fach-Agenten, Shared-State-Artefakte, LaTeX, Agent-Timer, Foto-Korrektur, Dateilinsen, konservative Übersicht, Unterwegs-Challenges.

**Erweitert um:** Session-Phasen, Tutor/Examiner, „Warum diese Aufgabe?“, Teach-back, Session-Export-Hook, Vergleichsansicht-Platzhalter.

### Ansehen

```bash
python3 -m http.server 8080
```

Oder **GitHub Pages:** Settings → Pages → Branch (z. B. `main` oder dieser Feature-Branch), Ordner `/ (root)`  
→ `https://polofiziert.github.io/Agents-Playroom/`

### Am Handy kurz testen

1. Session öffnen → FAB **Workspace** → BST `insert(7)` / `insert(3)`
2. Tool-Chips: Timer, LaTeX, Foto, Teach-back
3. Tabs: Fächer (Lernort), Unterwegs, Dateien, Übersicht
