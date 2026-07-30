# Agents-Playroom

Sandbox zum Testen von Cursor Agents.

## Atrium — GUI-Entwurf

Interaktiver Frontend-Prototyp einer agentischen Lernplattform (Chat · Artefakte · Timer · Foto-Korrektur · Lernübersicht).

### Lokal ansehen

Datei `index.html` im Browser öffnen oder:

```bash
python3 -m http.server 8080
```

Dann <http://localhost:8080> öffnen.

### Auf dem Handy / PC via GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. Branch: `main` (oder dieser PR-Branch), Ordner: `/ (root)`
4. Speichern — nach 1–2 Minuten:

`https://polofiziert.github.io/Agents-Playroom/`

Pages ist dafür der richtige Ort: rein statisches HTML/CSS/JS, kein Backend, mobil & desktop gleich erreichbar.

### Im Prototyp ausprobieren

- Lernort oben wechseln (Schule / Ausbildung / Studium)
- Fach-Agent wählen, Chat mit LaTeX (KaTeX)
- Artefakt: BST-Knoten einfügen — State ist JSON (agent-lesbar)
- Timer starten → System-Event „Zeit ist um“ + Auswertung
- Foto-Korrektur simulieren
- Mobile: untere Navigation (Fächer / Session / Dateien / Übersicht)
