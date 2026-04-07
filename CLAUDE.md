# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Zo-Talia** is an interactive Hetalia fan app designed by Zoey (Tim's daughter). Users interact with Prussia/Gilbert by clicking buttons that trigger expression changes and sounds. The app has a start screen, then a main view with the character bust, Gilbird (pet bird), and surrounding interaction buttons.

## PRD and Wireframes

All requirements live in `PRD/`:
- `PRD.md` — project description and notes
- `wireframe1.png`, `wireframe2.png` — UI mockups (start screen, button click states, hover states)
- `conversation.png` — original design conversation with Zoey

## Tech Stack

Vanilla HTML/CSS/JS — no framework, no bundler, no npm. Three code files total:
- `index.html` — both screens (start + main), semantic structure
- `css/style.css` — layout, animations, responsive sizing
- `js/app.js` — interactivity, expression swapping, sound generation

No build step. Open `index.html` in a browser to run.

## Architecture

**Expression system**: Character expressions are individual SVG files in `assets/expressions/`. Button clicks swap the `<img>` src and add CSS classes for transition animations. Expressions auto-revert to default after 2 seconds.

**Sound system**: Uses Web Audio API oscillator tones as placeholders (no mp3 files needed yet). Each expression has a mapped sound function in `expressionSounds`. When real `.mp3` files are added to `assets/sounds/`, switch from oscillator tones to `new Audio()` playback.

**Hover/touch**: Desktop mouse hover on the character triggers the shocked expression via `pointerenter`/`pointerleave`. iPad uses a 300ms long-press (`touchstart` with timeout) since there's no true hover.

**Audio unlock**: iOS Safari requires a user gesture before audio plays. The START button click calls `unlockAudio()` which resumes the AudioContext.

## Asset Replacement

Current SVG placeholders can be replaced with real art. Drop new files into `assets/expressions/` with these exact filenames:
- `default.svg` (or `.png`) — happy/neutral
- `laughing.svg` — Kesesese!
- `angry.svg` — Dummkopf!
- `embarrassed.svg` — flustered
- `singing.svg` — musical
- `shocked.svg` — hover/surprise reaction
- `../gilbird.svg` — the bird companion

If switching to PNG, update the file extension in `js/app.js` (`setExpression` function) and `index.html` (default src attributes).

## Deployment

Azure Static Web Apps (free tier). Config in `staticwebapp.config.json`. No build step — deploy the repo root directly. Set `skip_app_build: true` in the GitHub Actions workflow.
