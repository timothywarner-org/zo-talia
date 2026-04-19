(function () {
  'use strict';

  // --- DOM elements ---
  var startScreen = document.getElementById('start-screen');
  var mainScreen = document.getElementById('main-screen');
  var startBtn = document.getElementById('start-btn');
  var expressionLabel = document.getElementById('expression-label');
  var triggers = document.querySelectorAll('[data-action]');

  // Every <video class="character-clip"> keyed by its data-clip action name.
  // All 5 are preloaded and stacked on top of each other; we crossfade by
  // toggling .is-active so there's no network/decode flash on button press.
  var clips = {};
  document.querySelectorAll('.character-clip').forEach(function (el) {
    clips[el.getAttribute('data-clip')] = el;
  });

  // --- Action table: action name -> sound, label ---
  // MP4 instead of GIF because iOS Safari silently freezes animated GIFs
  // above an undocumented decoder budget. H.264 MP4 has none of those limits.
  var actions = {
    'click-left':   { sound: 'angry',       label: 'Hey!' },
    'click-middle': { sound: 'embarrassed', label: 'W-was?!' },
    'click-right':  { sound: 'proud',       label: 'Awesome!' },
    'drink-beer':   { sound: 'laughing',    label: 'Prost!' },
    'write-diary':  { sound: 'scheming',    label: 'Dear diary…' }
  };

  var DEFAULT_CLIP = 'click-middle';
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
  function showClip(clipName) {
    var next = clips[clipName];
    if (!next) return;

    // Rewind + play the clip we're about to show, so repeat taps restart it.
    try {
      next.currentTime = 0;
      var playResult = next.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(function () {});
      }
    } catch (e) {}

    // Crossfade: activate target, deactivate every other clip.
    Object.keys(clips).forEach(function (name) {
      clips[name].classList.toggle('is-active', name === clipName);
    });
  }

  function setAction(actionName) {
    var action = actions[actionName];
    if (!action) return;

    showClip(actionName);

    expressionLabel.textContent = action.label;
    expressionLabel.classList.add('visible');

    playSound(action.sound);

    clearTimeout(revertTimeout);
    revertTimeout = setTimeout(resetAction, REVERT_MS);
  }

  function resetAction() {
    showClip(DEFAULT_CLIP);
    expressionLabel.classList.remove('visible');
  }

  // Kick off preload on every clip so they're decoded before the first tap.
  Object.keys(clips).forEach(function (name) {
    var v = clips[name];
    // Playing + immediately pausing all non-active clips primes the decoder
    // without leaving them visibly playing behind the active one.
    if (name !== DEFAULT_CLIP) {
      try {
        v.muted = true;
        v.play().then(function () { v.pause(); v.currentTime = 0; }).catch(function () {});
      } catch (e) {}
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
