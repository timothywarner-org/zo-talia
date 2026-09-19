// ============================================================================
// Zo-Talia runtime — Stacked Video + Predecoded Audio Buffer architecture.
//
// HARD INVARIANTS (do not violate):
//   1. Every <video> is created once at boot from assets/manifest.json and
//      lives in the DOM forever. We NEVER change video.src after init.
//   2. We NEVER create/destroy <video> elements at runtime.
//   3. Switching clips is a visibility change only: .is-active toggles opacity.
//   4. Audio uses Web Audio exclusively. We NEVER use `new Audio()`, <audio>
//      tags, or assign audio.src at interaction time.
//   5. Every sound is fetched + decoded into an AudioBuffer before the user
//      can trigger it. Playback = new BufferSource from the cached buffer.
//   6. Video .load() is called explicitly and we wait for loadedmetadata on
//      every clip before enabling interaction. A muted play→pause warm-up
//      pass runs on every clip to prime the decoder (Safari first-play lag).
//   7. State is a single object. While `locked` is true, input is ignored.
// ============================================================================

(function () {
  'use strict';

  // --- DOM ---
  var startScreen = document.getElementById('start-screen');
  var mainScreen = document.getElementById('main-screen');
  var startBtn = document.getElementById('start-btn');
  var expressionLabel = document.getElementById('expression-label');
  var characterContainer = document.getElementById('character-container');

  // --- Tunables ---
  var REVERT_MS = 3000;
  var AUDIO_DELAY_MS = 30;   // wait out the frame flip before firing sound
  var INPUT_LOCK_MS = 120;   // swallow input during a crossfade to avoid stacking

  // --- Manifest-derived tables (frozen after boot) ---
  var actions = {};          // name -> { clip, sound, label, durationMs }
  var clips = {};            // name -> <video> element
  var soundBuffers = {};     // name -> AudioBuffer
  var defaultClip = null;

  // --- Single source of truth ---
  // `ready` flips to true only after every video is metadata-loaded, every
  // audio buffer is decoded, and the user has clicked START. Until then,
  // input handlers early-return. `locked` is a short per-action gate.
  var state = {
    current: null,
    ready: false,
    locked: false
  };

  // --- Web Audio ---
  // Instantiated on manifest load so decoding can start during the time the
  // user is still on the start screen. `resume()` must still be called from
  // a user gesture (iOS), but decodeAudioData does not require a running ctx.
  var ctx = null;
  var activeSource = null;
  var revertTimeout = null;

  function getCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  }

  // ----- Audio: decode + play (predecoded buffer model) -----

  function decodeBuffer(arrayBuffer) {
    // iOS Safari historically required the callback form of decodeAudioData;
    // wrap both styles so either backend returns a usable Promise.
    return new Promise(function (resolve, reject) {
      try {
        var p = ctx.decodeAudioData(arrayBuffer, resolve, reject);
        if (p && typeof p.then === 'function') p.then(resolve, reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  function loadSound(name, url) {
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error(url + ' ' + res.status);
        return res.arrayBuffer();
      })
      .then(decodeBuffer)
      .then(function (buffer) { soundBuffers[name] = buffer; });
  }

  function playSound(name) {
    var buffer = soundBuffers[name];
    if (!ctx || !buffer) return;
    if (activeSource) {
      try { activeSource.stop(0); } catch (e) {}
      activeSource = null;
    }
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    activeSource = src;
  }

  // ----- Video: build, preload, warm-up, switch -----

  function buildClipElement(action) {
    var v = document.createElement('video');
    v.className = 'character-clip';
    v.setAttribute('data-clip', action.name);
    v.setAttribute('playsinline', '');
    v.muted = true;
    v.loop = true;
    v.preload = 'auto';
    v.src = action.clip;
    if (action.name === defaultClip) {
      v.classList.add('is-active');
    } else {
      v.setAttribute('aria-hidden', 'true');
    }
    return v;
  }

  function waitForMetadata(v) {
    return new Promise(function (resolve) {
      if (v.readyState >= 1 /* HAVE_METADATA */) { resolve(); return; }
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        v.removeEventListener('loadedmetadata', finish);
        v.removeEventListener('error', finish);
        resolve();
      }
      v.addEventListener('loadedmetadata', finish);
      // If the metadata request fails, don't block boot forever — surface
      // the failure by resolving and letting the error show up when the user
      // taps (Safari sometimes reports errors late on low-bandwidth loads).
      v.addEventListener('error', finish);
      v.load();
    });
  }

  // Play + pause every clip once to force the decoder to produce a first
  // frame. Without this, Safari sometimes delays the first visible frame
  // on a cold clip by 100-200ms. Running on every clip (including default)
  // guarantees uniform behavior on the first user interaction.
  function warmUpClip(v) {
    return new Promise(function (resolve) {
      v.muted = true;
      var r;
      try { r = v.play(); } catch (e) { resolve(); return; }
      if (r && typeof r.then === 'function') {
        r.then(function () {
          try { v.pause(); v.currentTime = 0; } catch (e) {}
          resolve();
        }).catch(function () { resolve(); });
      } else {
        try { v.pause(); v.currentTime = 0; } catch (e) {}
        resolve();
      }
    });
  }

  function showClip(clipName) {
    var next = clips[clipName];
    if (!next || state.current === clipName) return;
    var prev = clips[state.current];

    try {
      next.currentTime = 0;
      var r = next.play();
      if (r && typeof r.catch === 'function') r.catch(function () {});
    } catch (e) {}

    if (prev) prev.classList.remove('is-active');
    next.classList.add('is-active');
    state.current = clipName;
  }

  // ----- Action dispatch -----

  function setAction(actionName) {
    if (!state.ready || state.locked) return;
    var action = actions[actionName];
    if (!action) return;

    state.locked = true;
    setTimeout(function () { state.locked = false; }, INPUT_LOCK_MS);

    showClip(actionName);

    expressionLabel.textContent = action.label;
    expressionLabel.classList.add('visible');

    // 30ms lets the frame flip commit before the sound fires so the two
    // perceptually arrive together instead of with audio slightly leading.
    setTimeout(function () { playSound(actionName); }, AUDIO_DELAY_MS);

    clearTimeout(revertTimeout);
    revertTimeout = setTimeout(resetAction, REVERT_MS);
  }

  function resetAction() {
    showClip(defaultClip);
    expressionLabel.classList.remove('visible');
  }

  // ----- Input wiring -----
  // pointerdown fires earlier in the gesture chain than click on iOS and
  // keeps audio on the user-gesture allowlist even when the target is a
  // nested span inside a button. We keep both listeners + per-trigger
  // debounce so a rapid double-fire doesn't double-invoke setAction.
  function wireTriggers() {
    var triggers = document.querySelectorAll('[data-action]');
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
  }

  // ----- Boot -----

  function boot(manifest) {
    defaultClip = manifest.defaultAction || (manifest.actions[0] && manifest.actions[0].name);
    state.current = defaultClip;

    // Instantiate the audio context early so decodes can start before the
    // user clicks START. The context is created suspended on Safari and
    // resume() fires inside the START gesture.
    getCtx();

    // Build all <video> elements up front — DOM set is frozen after this.
    manifest.actions.forEach(function (a) {
      actions[a.name] = a;
      var v = buildClipElement(a);
      characterContainer.appendChild(v);
      clips[a.name] = v;
    });

    // Parallel preload: force metadata load + decode audio for every action.
    // Once all of these settle, the runtime is data-ready (ready=true waits
    // on the START gesture so iOS doesn't reject audio unlock).
    var videoLoads = manifest.actions.map(function (a) {
      return waitForMetadata(clips[a.name]);
    });
    var audioLoads = manifest.actions.map(function (a) {
      return loadSound(a.name, a.sound).catch(function (e) {
        console.warn('sound decode failed for', a.name, e);
      });
    });

    var preloadDone = Promise.all(videoLoads.concat(audioLoads));

    wireTriggers();

    // START button: unlock audio and (once preload resolved) flip state.ready.
    startBtn.addEventListener('click', function () {
      var context = getCtx();
      var resumePromise = context && context.state !== 'running'
        ? context.resume()
        : Promise.resolve();

      // Warm-up pass. Only safe to call .play() on every clip after the
      // user gesture (Safari blocks muted autoplay in some contexts).
      var clipList = manifest.actions.map(function (a) { return clips[a.name]; });
      var warmups = clipList.map(warmUpClip);

      Promise.all([resumePromise].concat(warmups)).then(function () {
        return preloadDone;
      }).then(function () {
        state.ready = true;
      });

      startScreen.classList.add('hidden');
      mainScreen.classList.remove('hidden');
    });
  }

  function bootError(err) {
    console.error('Failed to load manifest:', err);
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = 'ASSETS MISSING';
    }
  }

  fetch('assets/manifest.json', { cache: 'no-cache' })
    .then(function (res) {
      if (!res.ok) throw new Error('manifest.json ' + res.status);
      return res.json();
    })
    .then(boot)
    .catch(bootError);

})();
