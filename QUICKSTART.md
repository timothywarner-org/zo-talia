# Quickstart Guide for Zoey

Hey Zoey! This guide will teach you how the app works and how to change things yourself -- add new expressions, swap art, change sounds, and more.

No terminal or coding software needed. You just need a text editor (even Notepad works) and a web browser.

---

## 1. Running the App

There is nothing to install. Just find the file called **index.html** in the project folder and double-click it. It will open in your default browser.

Chrome, Edge, and Safari all work great. If the page looks weird, try making the window bigger or smaller -- it adapts to the screen size automatically.

Every time you change something in the code, save the file and refresh the browser page (Ctrl+R on Windows, Cmd+R on Mac) to see your changes.

---

## 2. How the Code Works

The entire app is just three files. Here is what each one does:

### index.html -- The Structure

This file has two screens stacked on top of each other:

- **Start Screen** (`<section id="start-screen">`) -- the title and the big START button. This is what you see first.
- **Main Screen** (`<section id="main-screen">`) -- the character, Gilbird, and all the interaction buttons. This is hidden until you press START.

When you press START, the code hides the start screen and shows the main screen. That is it!

Inside the main screen you will find:
- The **character image** (`<img id="character-img">`) -- this is the big picture of Prussia in the center.
- **Gilbird** (`<img id="gilbird">`) -- the little bird floating in the corner.
- **Action buttons** (`<button class="action-btn">`) -- the circle buttons around the character with emojis in them.

### css/style.css -- How Things Look

This file controls colors, sizes, positions, and animations. Some highlights:

- The dark blue gradient background
- The golden glow on the title and buttons
- The **expression-pop** animation (the character bounces when you click a button)
- The **shake** animation (the character shakes when you hover over it)
- The **gilbird-bob** animation (Gilbird gently floats up and down)
- Button hover effects (they grow bigger and glow)

### js/app.js -- What Happens When You Click

This file runs all the interactive stuff:

- **START button** -- hides the start screen, shows the main screen, and unlocks sound
- **Action buttons** -- when you click one, it swaps the character image to a different expression, shows a text label (like "Kesesese!"), and plays a sound
- **Hover on character** -- when you move your mouse over Prussia, he gets a shocked expression
- **Auto-reset** -- after 2 seconds, the expression goes back to the default happy face
- **Sound effects** -- each expression has its own little tune made from computer-generated tones

---

## 3. Adding a New Expression

Let's say you want to add a "sleeping" expression. Here is exactly what to do, step by step.

### Step A: Make the Art

Draw or find an image of the sleeping expression. Some tips:

- Make it roughly the same size as the other expression images
- Use a **transparent background** (no white box behind the character)
- Save it as a `.png` or `.svg` file
- Name it something simple with no spaces, like `sleeping.png`

### Step B: Save the Image

Put your new image file in the `assets/expressions/` folder so it sits next to the others:

```
assets/
  expressions/
    default.svg
    laughing.svg
    angry.svg
    embarrassed.svg
    singing.svg
    shocked.svg
    sleeping.png     <-- your new file goes here!
```

### Step C: Add a Button in index.html

Open `index.html` in a text editor. Find the section with all the action buttons (look for the lines that say `class="action-btn"`). Copy one of the existing buttons and paste it right below the last one. Then change three things:

1. `data-expression` -- the name of your image file (without the extension)
2. `data-label` -- the text that pops up under the character
3. The emoji inside `<span class="btn-icon">`

Here is an example. The original button you copied might look like this:

```html
<button class="action-btn" data-expression="default" data-label="Awesome!" aria-label="Prussia is awesome" style="--btn-top: 85%; --btn-left: 50%;">
  <span class="btn-icon">*</span>
</button>
```

Change it to:

```html
<button class="action-btn" data-expression="sleeping" data-label="Zzzzz..." aria-label="Prussia is sleeping" style="--btn-top: 85%; --btn-left: 25%;">
  <span class="btn-icon">😴</span>
</button>
```

The `--btn-top` and `--btn-left` numbers control where the button sits on the screen. They are percentages -- `50%` means the middle. Play with the numbers until the button is where you want it. Just make sure it does not overlap with other buttons or the character.

### Step D: Add a Sound in js/app.js

Open `js/app.js` in a text editor. Find the section that looks like this (around line 68):

```javascript
var expressionSounds = {
    laughing: function () {
      playTone(600, 0.1, 'square');
      scheduleTone(800, 0.1, 'square', 100);
      scheduleTone(600, 0.1, 'square', 200);
      scheduleTone(800, 0.15, 'square', 300);
    },
    angry: function () {
      ...
```

Add your new sound right before the closing `};` of the `expressionSounds` block. Put a comma after the previous entry and add yours:

```javascript
    shocked: function () {
      playTone(900, 0.05, 'square');
      scheduleTone(1200, 0.15, 'square', 50);
    },
    sleeping: function () {
      playTone(300, 0.3, 'sine');
      scheduleTone(250, 0.4, 'sine', 200);
      scheduleTone(200, 0.5, 'sine', 400);
    }
```

Here is what the numbers mean:
- **First number** (like `300`) -- the pitch. Higher numbers = higher sounds. Try values between 100 and 1000.
- **Second number** (like `0.3`) -- how long the note plays in seconds. `0.3` is about a third of a second.
- **Third value** (like `'sine'`) -- the sound type. Options are `'sine'` (smooth), `'square'` (buzzy), `'sawtooth'` (harsh), or `'triangle'` (mellow).
- For `scheduleTone`, the **last number** (like `200`) is the delay in milliseconds before that note starts. `200` means it waits 0.2 seconds.

Play around with the numbers until it sounds right! Save and refresh the browser to hear your changes.

### Step E: If You Used a PNG Instead of SVG

The app assumes `.svg` files by default. If your new image is a `.png`, you need to make one small change in `js/app.js`. Find this line inside the `setExpression` function (around line 97):

```javascript
var src = 'assets/expressions/' + name + '.svg';
```

You will need to update this so it can handle both `.svg` and `.png` files. The simplest approach for now: if ALL your new images are `.png`, just change `.svg` to `.png` in that line. If you have a mix, ask for help and we can set it up to check for both.

---

## 4. Changing Button Emojis

This is the easiest change you can make! Open `index.html` and find the button you want to change. Look for the part that says:

```html
<span class="btn-icon">😆</span>
```

Replace the emoji with any emoji you want. For example, change it to:

```html
<span class="btn-icon">🤣</span>
```

Save and refresh. Done!

---

## 5. Replacing Placeholder Art

Right now the character images are simple SVG placeholders. When you have real art ready, here is how to swap it in:

1. Name your files to match the existing filenames exactly:
   - `default.svg` (or `default.png`) -- the normal happy face
   - `laughing.svg` -- the Kesesese face
   - `angry.svg` -- the Dummkopf face
   - `embarrassed.svg` -- the flustered face
   - `singing.svg` -- the singing face
   - `shocked.svg` -- the surprised face
   - `gilbird.svg` -- this one lives in `assets/` (not in the expressions folder)

2. Drop them into the `assets/expressions/` folder (or `assets/` for Gilbird), replacing the old files.

3. Refresh the browser. Your new art should appear!

If you use `.png` files instead of `.svg`, you also need to update the file extensions in two places:
- In `index.html`, find `src="assets/expressions/default.svg"` and change `.svg` to `.png`
- In `js/app.js`, find the line `var src = 'assets/expressions/' + name + '.svg';` and change `.svg` to `.png`

---

## 6. Adding Real Sound Files

Right now the sounds are computer-generated beeps and boops (oscillator tones). When you have real sound files ready (like recorded voice clips or sound effects), here is how to use them instead.

### Step A: Save Your Sound Files

Create a folder called `sounds` inside `assets/`:

```
assets/
  expressions/
  sounds/
    laughing.mp3
    angry.mp3
    sleeping.mp3
```

Use `.mp3` files -- they work in every browser.

### Step B: Update the Sound Code

Open `js/app.js` and find the expression sound you want to replace. For example, the laughing sound currently looks like this:

```javascript
laughing: function () {
  playTone(600, 0.1, 'square');
  scheduleTone(800, 0.1, 'square', 100);
  scheduleTone(600, 0.1, 'square', 200);
  scheduleTone(800, 0.15, 'square', 300);
},
```

Replace it with:

```javascript
laughing: function () {
  new Audio('assets/sounds/laughing.mp3').play();
},
```

That is it! The `new Audio()` line loads and plays the sound file. Do the same for any other expression you want to give a real sound to.

You can keep some expressions using the old oscillator tones and switch others to real files -- they can be mixed.

---

## Quick Reference

| I want to...                        | File to edit     | What to look for                          |
|--------------------------------------|------------------|-------------------------------------------|
| Change a button emoji                | index.html       | `<span class="btn-icon">`                 |
| Add a new expression button          | index.html       | Copy an existing `<button class="action-btn">` |
| Add a sound for a new expression     | js/app.js        | The `expressionSounds` section             |
| Change colors or sizes               | css/style.css    | Color values like `#ffd600` or sizes       |
| Change how long an expression lasts  | js/app.js        | `setTimeout(resetExpression, 2000)` -- change `2000` (milliseconds) |
| Replace character art                | assets/expressions/ | Drop in new files with the same names   |
| Move a button to a different spot    | index.html       | `--btn-top` and `--btn-left` in the button's style |

---

## If Something Breaks

Do not worry, you cannot permanently break anything! Here is what to do:

- **The character disappeared** -- Check that the image filename matches exactly (including `.svg` vs `.png`). Capitalization matters!
- **A button does nothing** -- Make sure the `data-expression` value on the button matches the image filename (without the extension).
- **No sound plays** -- Make sure you clicked the START button first (this unlocks audio). Also check that your expression name in `expressionSounds` matches the `data-expression` on the button.
- **The page looks broken** -- Undo your last change, save, and refresh. If you are really stuck, you can always get the original files back from GitHub.

Have fun customizing!
