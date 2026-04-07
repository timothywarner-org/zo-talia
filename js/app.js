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
  var reactionTimeout = null;
  var soundTimeouts = [];

  // --- Audio (deferred until first user gesture) ---
  var audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function unlockAudio() {
    var ctx = getAudioContext();
    var buffer = ctx.createBuffer(1, 1, 22050);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  }

  function playTone(frequency, duration, type) {
    var ctx = getAudioContext();
    var oscillator = ctx.createOscillator();
    var gain = ctx.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  // Schedule a delayed tone and track the timeout for cancellation
  function scheduleTone(frequency, duration, type, delay) {
    soundTimeouts.push(setTimeout(function () {
      playTone(frequency, duration, type);
    }, delay));
  }

  function cancelPendingSounds() {
    soundTimeouts.forEach(clearTimeout);
    soundTimeouts = [];
  }

  // Sound effects mapped to expressions
  var expressionSounds = {
    laughing: function () {
      playTone(600, 0.1, 'square');
      scheduleTone(800, 0.1, 'square', 100);
      scheduleTone(600, 0.1, 'square', 200);
      scheduleTone(800, 0.15, 'square', 300);
    },
    angry: function () {
      playTone(200, 0.3, 'sawtooth');
      scheduleTone(150, 0.4, 'sawtooth', 150);
    },
    embarrassed: function () {
      playTone(500, 0.15, 'sine');
      scheduleTone(400, 0.2, 'sine', 120);
    },
    singing: function () {
      var notes = [523, 587, 659, 698, 784];
      notes.forEach(function (note, i) {
        scheduleTone(note, 0.2, 'sine', i * 150);
      });
    },
    shocked: function () {
      playTone(900, 0.05, 'square');
      scheduleTone(1200, 0.15, 'square', 50);
    }
  };

  // --- Expression management ---
  function setExpression(name, label) {
    var src = 'assets/expressions/' + name + '.svg';
    characterImg.src = src;
    currentExpression = name;

    // Clear conflicting CSS states and restart pop animation
    characterContainer.classList.remove('reacting', 'shocked');
    void characterContainer.offsetWidth;
    characterContainer.classList.add('reacting');

    // Show label
    if (label) {
      expressionLabel.textContent = label;
      expressionLabel.classList.add('visible');
    }

    // Cancel any in-flight sounds, then play new ones
    cancelPendingSounds();
    if (expressionSounds[name]) {
      expressionSounds[name]();
    }
  }

  function resetExpression() {
    characterImg.src = 'assets/expressions/' + DEFAULT_EXPRESSION + '.svg';
    currentExpression = DEFAULT_EXPRESSION;
    characterContainer.classList.remove('reacting', 'shocked');
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

      clearTimeout(reactionTimeout);
      setExpression(expression, label);

      // Return to default after 2 seconds
      reactionTimeout = setTimeout(resetExpression, 2000);
    });
  });

  // --- Hover / touch on character (shocked reaction) ---
  function showShocked() {
    characterContainer.classList.add('shocked');
    characterImg.src = 'assets/expressions/shocked.svg';
    currentExpression = 'shocked';
    expressionLabel.textContent = '?!';
    expressionLabel.classList.add('visible');
    if (expressionSounds.shocked) {
      expressionSounds.shocked();
    }
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
      characterContainer.classList.remove('shocked');
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
