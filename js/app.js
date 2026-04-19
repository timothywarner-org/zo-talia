(function () {
  'use strict';

  // --- DOM elements ---
  var startScreen = document.getElementById('start-screen');
  var mainScreen = document.getElementById('main-screen');
  var startBtn = document.getElementById('start-btn');
  var characterVideo = document.getElementById('character-video');
  var expressionLabel = document.getElementById('expression-label');
  var triggers = document.querySelectorAll('[data-action]');

  // --- Action table: action name -> clip, sound, label ---
  // MP4 instead of GIF because iOS Safari silently freezes animated GIFs
  // above an undocumented decoder budget (disposal method / memory quirks).
  // H.264 MP4 has none of those limits.
  var actions = {
    'click-left':   { clip: 'assets/clips/clickleft.mp4',   sound: 'angry',       label: 'Hey!' },
    'click-middle': { clip: 'assets/clips/clickmiddle.mp4', sound: 'embarrassed', label: 'W-was?!' },
    'click-right':  { clip: 'assets/clips/clickright.mp4',  sound: 'proud',       label: 'Awesome!' },
    'drink-beer':   { clip: 'assets/clips/drinkbeer.mp4',   sound: 'laughing',    label: 'Prost!' },
    'write-diary':  { clip: 'assets/clips/writediary.mp4',  sound: 'scheming',    label: 'Dear diary…' }
  };

  var DEFAULT_CLIP = 'assets/clips/clickmiddle.mp4';
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
  function swapClip(src) {
    // Set src + force reload + start playback from frame 0. On iOS,
    // .load() then .play() is the only reliable way to restart a <video>.
    characterVideo.src = src;
    characterVideo.load();
    var playResult = characterVideo.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(function () {});
    }
  }

  function setAction(actionName) {
    var action = actions[actionName];
    if (!action) return;

    swapClip(action.clip);

    expressionLabel.textContent = action.label;
    expressionLabel.classList.add('visible');

    playSound(action.sound);

    clearTimeout(revertTimeout);
    revertTimeout = setTimeout(resetAction, REVERT_MS);
  }

  function resetAction() {
    swapClip(DEFAULT_CLIP);
    expressionLabel.classList.remove('visible');
  }

  // Fallback if a clip is missing
  characterVideo.addEventListener('error', function () {
    if (characterVideo.src.indexOf(DEFAULT_CLIP) === -1) {
      swapClip(DEFAULT_CLIP);
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
