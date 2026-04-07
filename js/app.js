(function () {
  'use strict';

  // --- DOM elements ---
  var startScreen = document.getElementById('start-screen');
  var mainScreen = document.getElementById('main-screen');
  var startBtn = document.getElementById('start-btn');
  var characterContainer = document.getElementById('character-container');
  var characterImg = document.getElementById('character-img');
  var expressionLabel = document.getElementById('expression-label');
  var actionButtons = document.querySelectorAll('.action-btn');

  // --- State ---
  var DEFAULT_EXPRESSION = 'default';
  var currentExpression = DEFAULT_EXPRESSION;
  var currentEffect = null;
  var reactionTimeout = null;

  // All possible effect classes
  var ALL_EFFECTS = [
    'fx-bounce', 'fx-shake', 'fx-sparkle', 'fx-sway',
    'fx-pulse', 'fx-float', 'fx-tremble', 'fx-shrink', 'fx-pop'
  ];

  // --- Audio ---
  // Preload all sound files
  var sounds = {};
  var soundNames = [
    'laughing', 'angry', 'embarrassed', 'singing', 'proud',
    'crying', 'sleeping', 'scheming', 'shocked', 'default'
  ];
  soundNames.forEach(function (name) {
    var audio = new Audio('assets/sounds/' + name + '.mp3');
    audio.preload = 'auto';
    sounds[name] = audio;
  });

  // Current playing sound (for stopping on new expression)
  var currentSound = null;

  function unlockAudio() {
    // Play and immediately pause each sound to unlock iOS audio
    soundNames.forEach(function (name) {
      sounds[name].play().then(function () {
        sounds[name].pause();
        sounds[name].currentTime = 0;
      }).catch(function () {});
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

  // --- Effect management ---
  function clearEffects() {
    ALL_EFFECTS.forEach(function (cls) {
      characterContainer.classList.remove(cls);
    });
    characterContainer.classList.remove('shocked');
    currentEffect = null;
  }

  // --- Expression management ---
  function setExpression(name, label, effect) {
    var src = 'assets/expressions/' + name + '.svg';
    characterImg.src = src;
    currentExpression = name;

    // Clear all effects and force reflow to restart animation
    clearEffects();
    void characterContainer.offsetWidth;

    // Apply the effect animation
    if (effect) {
      characterContainer.classList.add('fx-' + effect);
      currentEffect = effect;
    }

    // Show label
    if (label) {
      expressionLabel.textContent = label;
      expressionLabel.classList.add('visible');
    }

    // Play the sound for this expression
    playSound(name);
  }

  function resetExpression() {
    characterImg.src = 'assets/expressions/' + DEFAULT_EXPRESSION + '.svg';
    currentExpression = DEFAULT_EXPRESSION;
    clearEffects();
    expressionLabel.classList.remove('visible');
  }

  // Fallback if an expression image is missing
  characterImg.addEventListener('error', function () {
    characterImg.src = 'assets/expressions/' + DEFAULT_EXPRESSION + '.svg';
  });

  // --- Start screen ---
  startBtn.addEventListener('click', function () {
    unlockAudio();
    startScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
  });

  // --- Button clicks ---
  actionButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expression = btn.getAttribute('data-expression');
      var label = btn.getAttribute('data-label');
      var effect = btn.getAttribute('data-effect');

      clearTimeout(reactionTimeout);
      setExpression(expression, label, effect);

      // Sleeping and crying linger longer; others reset after 2.5s
      var duration = (expression === 'sleeping' || expression === 'crying') ? 4000 : 2500;
      reactionTimeout = setTimeout(resetExpression, duration);
    });
  });

  // --- Hover / touch on character (shocked reaction) ---
  function showShocked() {
    clearEffects();
    characterContainer.classList.add('shocked');
    characterImg.src = 'assets/expressions/shocked.svg';
    currentExpression = 'shocked';
    expressionLabel.textContent = '?!';
    expressionLabel.classList.add('visible');
    playSound('shocked');
  }

  // Desktop: pointerenter / pointerleave
  characterContainer.addEventListener('pointerenter', function (e) {
    if (e.pointerType === 'mouse' && currentExpression === DEFAULT_EXPRESSION) {
      clearTimeout(reactionTimeout);
      showShocked();
    }
  });

  characterContainer.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') {
      if (currentExpression === 'shocked' || currentExpression === DEFAULT_EXPRESSION) {
        resetExpression();
      }
    }
  });

  // iPad: long-press on character for shocked reaction
  var longPressTimer = null;

  characterContainer.addEventListener('touchstart', function () {
    if (currentExpression !== DEFAULT_EXPRESSION) return;
    longPressTimer = setTimeout(showShocked, 200);
  }, { passive: true });

  characterContainer.addEventListener('touchend', function () {
    clearTimeout(longPressTimer);
    if (currentExpression === 'shocked') {
      resetExpression();
    }
  }, { passive: true });

  characterContainer.addEventListener('touchcancel', function () {
    clearTimeout(longPressTimer);
    if (currentExpression === 'shocked') {
      resetExpression();
    }
  }, { passive: true });

})();
