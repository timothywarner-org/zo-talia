# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Zo-Talia** is an interactive Hetalia fan app designed by Zoey (Tim's daughter, credited as Catsalot). The user taps click zones overlaying the character or named action buttons (Drink Beer, Write Diary). Each action crossfades a short H.264 clip and fires a predecoded sound, then auto-reverts after 3 seconds.

## Two subsystems

The codebase is split into a **build-time asset pipeline** and a **browser runtime engine**. They communicate via `assets/manifest.json` — the pipeline writes it, the runtime reads it.

### Build-time pipeline (`scripts/build-assets.mjs`)

Node script, one-shot (no watcher). Walks `assets-inbox/<action>/{video.*, sound.*, still.*}` and emits `assets/<action>/{clip.mp4, sound.m4a, still.png}` + `assets/manifest.json`.

Encode contract (enforced by ffprobe validation — pipeline fails hard on deviation):
- **clip.mp4** — H.264 Constrained Baseline, 400×400 `yuv420p`, 24 fps, CRF 30, keyframe every 12 frames, `+faststart`, no audio track. Must be ≤ 3 s and ≤ 500 KB.
- **sound.m4a** — AAC 64 kbps mono 44.1 kHz, run through `silenceremove` (-50 dB threshold) then `loudnorm` (EBU R128: I=-16, TP=-1.5, LRA=11).
- **still.png** — Sharp `contain` fit to 400×400 with transparent padding. If no `still.*` is supplied, first frame is extracted from the encoded clip via ffmpeg.

Actions + labels are hardcoded in `scripts/build-assets.mjs` (`ACTIONS` array). To add a new action: add an entry there, drop a matching folder into `assets-inbox/`, and re-run `npm run build:assets`.

### Runtime engine (`js/app.js`)

Stacked-video + predecoded-audio-buffer architecture. The file header lists seven hard invariants — **do not violate them**:

1. Every `<video>` is created once at boot from `manifest.json` and lives in the DOM forever. Never reassign `video.src`.
2. Never create/destroy `<video>` elements at runtime.
3. Switching clips is a visibility change only — `.is-active` toggles opacity.
4. Audio is Web Audio only. No `<audio>`, no `new Audio()`, no `audio.src`.
5. Every sound is fetched + decoded into an `AudioBuffer` at boot. Playback = fresh `BufferSource` from the cached buffer.
6. `video.load()` is called explicitly and `loadedmetadata` is awaited for every clip. A muted play→pause warm-up pass runs on every clip, gated behind the START gesture so Safari autoplay policy is satisfied.
7. Single `state` object (`current`, `ready`, `locked`). Input handlers early-return until `ready`; `locked` is a ~120 ms gate to prevent mid-crossfade stacking.

Why it's shaped this way: iOS Safari will silently freeze animated GIFs above an undocumented decoder budget, won't unlock audio without a real user gesture, and introduces 100–200 ms first-play decode lag on cold clips. The stacked-opacity + predecoded-buffer + explicit-warmup model eliminates all three.

## Common commands

```bash
npm install                 # installs sharp (the only runtime dep)
npm run build:assets        # runs the pipeline; writes to assets/<action>/ + manifest.json
npm run serve               # serves repo root at http://localhost:5173
```

`file://` does **not** work for local dev — `fetch('assets/manifest.json')` is blocked by the browser. Always serve.

ffmpeg + ffprobe must be on PATH for the pipeline. The script fails fast with an install hint if they're missing.

## Deployment

Azure Static Web Apps, free tier. Workflow: `.github/workflows/deploy.yml`. `skip_app_build: true` — the repo root is uploaded as-is, so `assets/<action>/` and `assets/manifest.json` must be committed. CI does **not** run the pipeline.

`staticwebapp.config.json` sets a strict CSP (`default-src 'none'; script-src 'self'; media-src 'self'; connect-src 'self'; ...`). Anything added to the runtime must stay same-origin.

**TODO (pre-release):** `staticwebapp.config.json` currently has `Cache-Control: no-cache, must-revalidate` + `Pragma: no-cache` as globalHeaders — that was set to make iOS debugging cycles faster. Before public release, re-enable long-lived caching on immutable assets (`assets/**/clip.mp4`, `sound.m4a`, `still.png`, `manifest.json` can be versioned by path/hash) and let the Azure CDN actually cache. Hash-fingerprint the manifest-referenced URLs first so users always get a consistent set.

## Git / layout notes

- `assets-inbox/` and `node_modules/` are gitignored. `assets/<action>/` + `assets/manifest.json` are **committed** (deploy reads them directly).
- Node is pinned to 20 LTS via `.nvmrc`; `package.json` declares `engines.node >= 18`. The pipeline uses only stable Node APIs (`fs/promises`, `child_process`, ESM).
