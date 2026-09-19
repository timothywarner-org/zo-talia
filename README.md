# Ze Awesome Prussia Interactive Game

A fun, clickable fan game starring **Prussia (Gilbert Beilschmidt)** from *Hetalia: Axis Powers* — tap the character or hit the action buttons to get a reaction.

Father-daughter project by **Catsalot** (Zoey, designer) and **BDD** (Tim Warner, developer).

---

## How to Play

1. Hit **START** on the title screen.
2. Tap either side or the middle of Prussia's portrait for a quick reaction.
3. Or hit one of the named action buttons:
   - 🍺 **Drink Beer** — "Prost!"
   - 📖 **Write Diary** — "Dear diary…"

Every tap crossfades a short clip and fires a sound effect. The character auto-returns to the idle pose after a few seconds.

---

## Run It Locally

This repo has both a runtime (HTML/CSS/JS, served as-is) and a small Node-based asset pipeline. You only need the pipeline if you're adding or re-encoding media.

### Just run the game

Serve the repo root — `file://` does not work (the runtime fetches `assets/manifest.json`):

```bash
npm run serve        # http://localhost:5173
# or any static server you like
npx serve .
```

### Build assets

Requires **ffmpeg** and **ffprobe** on your PATH.

```bash
npm install          # installs sharp
npm run build:assets # reads assets-inbox/, writes assets/<action>/ + manifest.json
```

---

## Add a New Action

1. Drop raw files into `assets-inbox/<action-name>/`:
   - `video.mp4` (or `.mov`, `.gif`, …)
   - `sound.mp3` (or `.wav`, `.m4a`, …)
   - `still.png` is optional — the pipeline extracts a first frame if it's missing.
2. Add an entry to the `ACTIONS` array in `scripts/build-assets.mjs` with the action name and the speech-bubble label.
3. Add a matching `<button data-action="<action-name>">` or click-zone to `index.html`.
4. Run `npm run build:assets`. The pipeline normalizes the media to:
   - H.264 baseline MP4, 400×400, 24 fps, no audio
   - AAC 64 kbps mono m4a with leading silence trimmed and loudness normalized
   - 400×400 PNG with transparent padding
5. Commit the contents of `assets/<action-name>/` and the updated `assets/manifest.json`.

---

## Project Structure

```
zo-talia/
  index.html                  — both screens (start + game)
  css/style.css               — layout, crossfade, responsive sizing
  js/app.js                   — runtime engine (Web Audio + stacked video)
  scripts/build-assets.mjs    — one-shot ffmpeg + sharp pipeline
  package.json                — scripts + dev deps (sharp)
  assets-inbox/               — [gitignored] drop raw files here per action
  assets/
    <action-name>/            — pipeline output (clip.mp4, sound.m4a, still.png)
    manifest.json             — generated; consumed by the runtime at boot
  staticwebapp.config.json    — Azure Static Web Apps routing + CSP + headers
  .github/workflows/deploy.yml— Azure Static Web Apps deploy (no CI build)
  .editorconfig / .nvmrc      — whitespace + Node version pin
```

---

## Architecture (short version)

The runtime follows a stacked-video + predecoded-audio-buffer model — all clips are in the DOM at boot, switching is a CSS opacity toggle, and every sound is decoded into an `AudioBuffer` before the first tap. See `CLAUDE.md` for the full invariants list and the rationale (it's mostly iOS Safari workarounds).

---

## Deployment

Deploys to **Azure Static Web Apps** on push to `main` via `.github/workflows/deploy.yml`. No build runs in CI (`skip_app_build: true`) — the repo root is uploaded as-is, so the `assets/<action>/` folders and `assets/manifest.json` must be committed.

**Pre-release TODO:** re-enable CDN caching. `staticwebapp.config.json` currently sets `Cache-Control: no-cache` globally to speed up iOS debugging; that needs to flip back to long-lived immutable caching (with hashed asset URLs) before public launch.

---

## Credits

- **Catsalot (Zoey)** — Designer, creative director, Hetalia expert
- **BDD (Tim Warner)** — Developer, button wrangler, dad

*Hetalia: Axis Powers* is created by Hidekaz Himaruya. This is a fan project made with love (and kesesesese).

---

## License

MIT
