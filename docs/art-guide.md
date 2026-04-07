# Art Guide for Zoey

How to create real Prussia art for the game!

## What You Need to Make

You need **10 expression images** — one for each button reaction plus the hover reaction. Each one is a picture of Prussia's face/bust showing a different emotion.

| Filename | Emotion | When It Shows |
|----------|---------|---------------|
| `default.png` | Happy/neutral | Default idle state |
| `laughing.png` | Laughing hard | 😆 button (Kesesese!) |
| `proud.png` | Smug/confident | 😏 button (I am awesome!) |
| `angry.png` | Mad/furious | 😤 button (Dummkopf!) |
| `singing.png` | Singing/musical | 🎵 button (Mein Gott!) |
| `scheming.png` | Evil grin | 😈 button (Kesesese~) |
| `sleeping.png` | Asleep/peaceful | 😴 button (Zzz...) |
| `crying.png` | Sad/crying | 😢 button (Nein!) |
| `embarrassed.png` | Flustered/blushing | 😳 button (W-was?!) |
| `shocked.png` | Surprised/freaked out | When you hover over Prussia |

## Stills vs Animations — Which Should You Use?

### Go with STILLS (recommended to start)

The app already handles the animation part with CSS effects (bounce, shake, sway, etc). So you just need to draw the face for each emotion as a single image. The code does the moving.

**Why stills are easier:**
- You only draw 10 images total
- Any drawing app works (Procreate, Clip Studio, even MS Paint)
- Save as PNG and you're done
- The CSS animations (bounce for laughing, shake for angry, etc) make the still image feel alive

### Upgrade to ANIMATED later (if you want)

If you want Prussia's face to actually animate frame-by-frame (like mouth moving while laughing, tears streaming while crying), you have two options:

**Option A: Animated GIF**
- Draw 3-6 frames per emotion
- Export as `.gif` from Procreate or Clip Studio
- Just rename to `.gif` and the app will loop it automatically
- **Easiest animation option**
- Downside: no transparency (white background shows), limited colors

**Option B: APNG (Animated PNG)**
- Same as GIF but supports transparency
- Procreate can't export this directly — you'd need a converter
- Better quality than GIF
- **Best option if you want animation + transparent background**

**Option C: Sprite sheet (advanced)**
- One big image with all frames side by side
- Requires code changes to animate (CSS `steps()` animation)
- More work but most control over timing
- Only do this if you're feeling ambitious

## Image Specs

| Setting | Value |
|---------|-------|
| **Size** | 300x400 pixels (or any size, just keep them all the same) |
| **Format** | PNG (stills) or GIF/APNG (animated) |
| **Background** | Transparent if possible (the game has a dark background) |
| **Orientation** | Face/bust centered, looking at the viewer |
| **Include Gilbird?** | Your choice! He's already a separate element in the game, but if you draw him in, we can hide the separate one |

## Drawing Tips

- **Keep all images the same size** — if one is 300x400, they all should be 300x400. Otherwise the character will jump around when expressions change.
- **Keep the head/body in the same position** — the eyes and mouth should change, but the outline of the head/hair should stay roughly the same between expressions. This makes the transitions look smooth.
- **Exaggerate the expressions** — the images are displayed pretty small on screen, so big eyes, big mouth, visible tears/sparkles/etc will read better.
- **Transparent background** — if your drawing app supports it, export with no background. The game's dark blue background will show through.

## How to Draw on iPad (Procreate)

1. Create a new canvas: 300x400 pixels (or 600x800 if you want higher res)
2. Draw the default happy Prussia face first
3. Duplicate the canvas for each expression
4. On each copy, erase/redraw just the parts that change (eyes, mouth, effects)
5. Export each as PNG (Share → PNG)
6. Name them exactly as listed in the table above

## How to Put Them in the Game

1. Copy your PNG files to `assets/expressions/`
2. They must have the exact filenames from the table (lowercase!)
3. Open `js/app.js` and find this line near the top:
   ```
   var src = 'assets/expressions/' + name + '.svg';
   ```
   Change `.svg` to `.png`:
   ```
   var src = 'assets/expressions/' + name + '.png';
   ```
4. Also in `app.js`, find every other line that says `.svg` and change to `.png` (there are 3 total — use Ctrl+H to find and replace)
5. Open `index.html` and change the default image src:
   ```
   src="assets/expressions/default.svg"
   ```
   to:
   ```
   src="assets/expressions/default.png"
   ```
6. Refresh the browser!

## If You Use GIF Animations

Same steps as above, but change `.svg` to `.gif` instead of `.png`. Animated GIFs will loop automatically — no code changes needed beyond the file extension.

## Gilbird

Gilbird is currently a separate SVG element that bobs up and down on its own. You have three choices:

1. **Keep the separate Gilbird** — just draw Prussia without Gilbird, and the game adds him automatically
2. **Draw Gilbird into each expression** — include him in your art, then hide the separate one by adding `class="hidden"` to the Gilbird `<img>` tag in `index.html`
3. **Draw a new Gilbird** — replace `assets/gilbird.svg` with your own `gilbird.png` and update the src in `index.html`

## Quick Start: Minimum Viable Art

If you want to get something in the game fast, just draw these 3 and we can add the rest later:

1. `default.png` — happy Prussia (shows most of the time)
2. `laughing.png` — cracking up
3. `shocked.png` — surprised face (hover reaction)

The other buttons will fall back to the default face if their image is missing.
