# Ze Awesome Prussia Interactive Game

A fun, clickable fan game starring **Prussia (Gilbert Beilschmidt)** from *Hetalia: Axis Powers* -- complete with expression changes, sound effects, and Gilbird bobbing on his shoulder!

This is a father-daughter project by **Catsalot** (Zoey, designer) and **BDD** (Tim Warner, developer).

---

## How to Play

1. Hit **START** on the title screen.
2. Click any of the five buttons around Prussia to trigger a reaction:
   - **Kesesese!** -- Prussia's signature laugh
   - **Angry** -- Don't make him mad...
   - **Embarrassed** -- Even the awesome Prussia blushes sometimes
   - **Singing** -- Mein Gott, he's singing again
   - **Awesome** -- Because he IS awesome (and he'll remind you)
3. **Hover your mouse** (or **long-press** on a touchscreen) over the character for a shocked reaction!
4. Watch Gilbird bounce along for the ride.

Each button triggers a character expression swap with a CSS animation and a placeholder sound effect (oscillator tones via the Web Audio API).

---

## Run It Locally

No build step. No framework. No npm install. Just:

1. Clone or download this repo.
2. Open **`index.html`** in your browser.
3. That's it. You're done. Prussia would be proud.

---

## Add Your Own Art

The expressions are placeholder SVGs ready to be swapped with real character art.

Drop your images into `assets/expressions/` using these filenames:

| File | Expression |
|------|------------|
| `default.svg` | Neutral / idle pose |
| `laughing.svg` | Kesesese! |
| `angry.svg` | Angry face |
| `embarrassed.svg` | Blushing |
| `singing.svg` | Singing pose |
| `shocked.svg` | Surprised (hover/touch reaction) |

Gilbird lives at `assets/gilbird.svg`.

PNG or SVG both work -- just update the file extension in `index.html` if you switch formats.

---

## Project Structure

```
zo-talia/
  index.html                  -- both screens (start + game)
  css/style.css               -- layout, animations, responsive design
  js/app.js                   -- interactivity, sound, state management
  assets/
    gilbird.svg               -- Gilbird the bird
    expressions/              -- character expression images
  PRD/                        -- original wireframes and design notes
  staticwebapp.config.json    -- Azure Static Web Apps deployment config
```

---

## Deployment

The app is deployed to **Azure Static Web Apps**. The `staticwebapp.config.json` handles routing configuration. Push to the connected branch and Azure takes care of the rest.

---

## Credits

- **Catsalot (Zoey)** -- Designer, creative director, Hetalia expert
- **BDD (Tim Warner)** -- Developer, button wrangler, dad

*Hetalia: Axis Powers* is created by Hidekaz Himaruya. This is a fan project made with love (and kesesesese).

---

## License

MIT
