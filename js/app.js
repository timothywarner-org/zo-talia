(function () {
  'use strict';

  // --- DOM elements ---
  var startScreen = document.getElementById('start-screen');
  var mainScreen = document.getElementById('main-screen');
  var startBtn = document.getElementById('start-btn');
  var characterImg = document.getElementById('character-img');
  var expressionLabel = document.getElementById('expression-label');
  var triggers = document.querySelectorAll('[data-action]');

  // --- Action table: action name -> art, sound, label ---
  var actions = {
    'click-left':   { art: 'zoey-art/CLICKLEFT.GIF',   sound: 'angry',       label: 'Hey!' },
    'click-middle': { art: 'zoey-art/CLICKMIDDLE.GIF', sound: 'embarrassed', label: 'W-was?!' },
    'click-right':  { art: 'zoey-art/CLICKRIGHT.GIF',  sound: 'proud',       label: 'Awesome!' },
    'drink-beer':   { art: 'zoey-art/DRINKBEER.GIF',   sound: 'laughing',    label: 'Prost!' },
    'write-diary':  { art: 'zoey-art/WRITEDIARY.GIF',  sound: 'scheming',    label: 'Dear diary…' }
  };

  var DEFAULT_ART = 'zoey-art/CLICKMIDDLE.GIF';
  var REVERT_MS = 3000;
  var revertTimeout = null;

  // --- Audio ---
  var sounds = {};
  var soundNames = ['angry', 'embarrassed', 'proud', 'laughing', 'scheming'];
  soundNames.forEach(function (name) {
    var audio = new Audio('assets/sounds/' + name + '.mp3');
    audio.preload = 'auto';
    sounds[name] = audio;
  });

  var currentSound = null;

  // iOS requires a user gesture before audio can play. Prime each clip
  // synchronously inside the START gesture: muted play -> pause. Must stay
  // sync; async .then() pauses don't count as same-gesture on Safari.
  function unlockAudio() {
    soundNames.forEach(function (name) {
      var s = sounds[name];
      s.muted = true;
      try { s.play(); } catch (e) {}
      s.pause();
      s.currentTime = 0;
      s.muted = false;
    });
  }

  function playSound(name) {
    if (currentSound) {
      currentSound.pause();
      currentSound.currentTime = 0;
    }
    if (sounds[name]) {
      sounds[name].currentTime = 0;
      sounds[name].play().catch(function () {});
      currentSound = sounds[name];
    }
  }

  // --- Action trigger ---
  function setAction(actionName) {
    var action = actions[actionName];
    if (!action) return;

    // Cache-bust the GIF so it replays from frame 0 on repeat clicks.
    characterImg.src = action.art + '?t=' + Date.now();

    expressionLabel.textContent = action.label;
    expressionLabel.classList.add('visible');

    playSound(action.sound);

    clearTimeout(revertTimeout);
    revertTimeout = setTimeout(resetAction, REVERT_MS);
  }

  function resetAction() {
    characterImg.src = DEFAULT_ART;
    expressionLabel.classList.remove('visible');
  }

  // Fallback if an art file is missing
  characterImg.addEventListener('error', function () {
    if (characterImg.src.indexOf(DEFAULT_ART) === -1) {
      characterImg.src = DEFAULT_ART;
    }
  });

  // --- Start screen ---
  startBtn.addEventListener('click', function () {
    unlockAudio();
    startScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
  });

  // --- Wire up every [data-action] trigger (click zones + named buttons) ---
  // iOS counts audio as user-gesture-initiated only on synchronous handlers.
  // pointerdown fires earlier in the gesture chain than click and keeps the
  // audio unlock alive on Safari when the user taps a nested child (icon/text).
  triggers.forEach(function (el) {
    var fired = false;
    function trigger(e) {
      if (fired) return;
      fired = true;
      setTimeout(function () { fired = false; }, 250);
      setAction(el.getAttribute('data-action'));
      if (e && e.cancelable) e.preventDefault();
    }
    el.addEventListener('pointerdown', trigger);
    el.addEventListener('click', trigger);
  });

})();
