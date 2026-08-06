/* ============================================================
   Hero message-bubble physics — desktop only.

   Loads Matter.js from CDN on demand, drops a pile of chat-style
   bubbles into the hero section, and lets visitors drag them
   around like real objects (real collisions, momentum on release).

   Disabled entirely below the mobile breakpoint and when the
   visitor has "reduce motion" turned on — nothing is downloaded
   or rendered in either case.
   ============================================================ */
(function () {
  'use strict';

  var BREAKPOINT = 640; // matches the site's existing mobile breakpoint
  var MATTER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js';

  // Edit these to change what the bubbles say.
  // type: 'blue' = a customer question · 'green' = a Webature reply
  var BUBBLES = [
    { text: 'hello', type: 'blue' },
    { text: 'Are you open to projects?', type: 'blue' },
    { text: 'Do you build online shops?', type: 'blue' },
    { text: 'Yes, we do e-commerce', type: 'green' },
    { text: 'Can you fix my Google ranking?', type: 'blue' },
    { text: 'Yes, we do SEO', type: 'green' },
    { text: 'Do you design logos?', type: 'blue' },
    { text: 'Can you make it load faster?', type: 'blue' },
    { text: 'Do you offer ongoing support?', type: 'blue' },
    { text: 'Can you redesign my old site?', type: 'blue' },
    { text: 'How fast can you launch?', type: 'blue' },
    { text: '3–6 weeks, typically', type: 'green' },
    { text: 'Do you do keyword research?', type: 'blue' },
    { text: 'Is my site mobile friendly?', type: 'blue' },
    { text: 'Yes, always open', type: 'green' },
    { text: 'We build that too', type: 'green' }
  ];

  var state = { active: false };

  function isDesktop() {
    return window.innerWidth > BREAKPOINT;
  }

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function whenFontsReady(cb) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(cb, cb);
    } else {
      cb();
    }
  }

  function loadMatter(cb) {
    if (window.Matter) { cb(); return; }
    var existing = document.querySelector('script[data-matter-loader]');
    if (existing) { existing.addEventListener('load', cb); return; }
    var s = document.createElement('script');
    s.src = MATTER_SRC;
    s.async = true;
    s.setAttribute('data-matter-loader', '1');
    s.onload = cb;
    document.head.appendChild(s);
  }

  function build() {
    if (state.active || !isDesktop()) return;
    var hero = document.querySelector('.hero');
    var stage = document.getElementById('heroBubbles');
    if (!hero || !stage || typeof Matter === 'undefined') return;

    var Engine = Matter.Engine, Composite = Matter.Composite, Bodies = Matter.Bodies,
        Body = Matter.Body, Mouse = Matter.Mouse, MouseConstraint = Matter.MouseConstraint,
        Runner = Matter.Runner, Events = Matter.Events;

    var width = hero.clientWidth;
    var height = hero.clientHeight;

    var engine = Engine.create();
    engine.gravity.y = 1;

    // Create the DOM bubbles first so we can measure their real
    // rendered size (actual text + font) before making matching
    // physics bodies — this keeps the invisible collision boxes
    // pixel-accurate to what's on screen.
    var items = BUBBLES.map(function (cfg, i) {
      var el = document.createElement('div');
      el.className = 'bubble bubble-' + cfg.type;
      el.textContent = cfg.text;
      stage.appendChild(el);
      return { el: el, index: i };
    });

    var bodies = items.map(function (item) {
      var w = item.el.offsetWidth;
      var h = item.el.offsetHeight;
      var x = w / 2 + 10 + Math.random() * Math.max(1, width - w - 20);
      var y = -60 - Math.random() * height * 0.6 - item.index * 46;
      var body = Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: Math.min(16, h / 2) },
        restitution: 0.45,
        friction: 0.4,
        frictionAir: 0.02,
        angle: (Math.random() - 0.5) * 0.5
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);

      item.body = body;
      item.w = w;
      item.h = h;
      item.el.style.width = w + 'px';
      item.el.style.height = h + 'px';
      // Position immediately so the very first paint already has
      // the bubble off-screen (above the hero) instead of flashing
      // at its default top-left spot for a frame.
      item.el.style.transform = 'translate3d(' + (x - w / 2) + 'px,' + (y - h / 2) + 'px,0) rotate(' + body.angle + 'rad)';
      item.el.style.opacity = '1';
      return body;
    });

    // Invisible floor + walls. The floor sits a little below the
    // visible edge so the resting pile overflows the fold slightly
    // (cropped by .hero's overflow:hidden), same as a real pile of
    // objects continuing out of frame.
    var wallOpts = { isStatic: true, friction: 0.6, restitution: 0.3 };
    var floor = Bodies.rectangle(width / 2, height + 40, width * 2, 50, wallOpts);
    var leftWall = Bodies.rectangle(-20, height / 2, 40, height * 4, wallOpts);
    var rightWall = Bodies.rectangle(width + 20, height / 2, 40, height * 4, wallOpts);

    Composite.add(engine.world, bodies.concat([floor, leftWall, rightWall]));

    // NOTE: do not set mouse.pixelRatio here — that property exists for
    // canvas-backed setups only. Since we're syncing to real DOM elements
    // (all in CSS pixels already), leaving it at its default of 1 keeps
    // the mouse's coordinates lined up with the bubbles.
    var mouse = Mouse.create(stage);
    var mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.18, damping: 0.12, render: { visible: false } }
    });
    Composite.add(engine.world, mouseConstraint);

    // Matter's Mouse module blocks page-scroll by default — it adds a
    // non-passive 'wheel' listener over the whole stage and calls
    // preventDefault() on every scroll/trackpad event that lands on it.
    // Remove that specific listener so the page scrolls normally
    // everywhere, bubbles included.
    mouse.element.removeEventListener('wheel', mouse.mousewheel);

    // Match the site's custom cursor hover state on bubble hover.
    var cur = document.getElementById('cur');
    if (cur) {
      items.forEach(function (item) {
        item.el.addEventListener('mouseenter', function () { cur.classList.add('big'); });
        item.el.addEventListener('mouseleave', function () { cur.classList.remove('big'); });
      });
    }

    function syncDom() {
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var b = item.body;
        item.el.style.transform =
          'translate3d(' + (b.position.x - item.w / 2) + 'px,' + (b.position.y - item.h / 2) + 'px,0) rotate(' + b.angle + 'rad)';
      }
    }
    Events.on(engine, 'afterUpdate', syncDom);

    var runner = Runner.create();
    Runner.run(runner, engine);

    state = {
      active: true, engine: engine, runner: runner, items: items, hero: hero,
      mouse: mouse, floor: floor, leftWall: leftWall, rightWall: rightWall, Body: Body
    };

    // Pause the simulation while the hero is scrolled out of view.
    if ('IntersectionObserver' in window) {
      state.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { runner.enabled = entry.isIntersecting; });
      }, { threshold: 0 });
      state.io.observe(hero);
    }
  }

  function destroy() {
    if (!state.active) return;
    if (state.io) state.io.disconnect();
    if (state.runner) Matter.Runner.stop(state.runner);
    if (state.mouse) {
      state.mouse.element.removeEventListener('mousemove', state.mouse.mousemove);
      state.mouse.element.removeEventListener('mousedown', state.mouse.mousedown);
      state.mouse.element.removeEventListener('mouseup', state.mouse.mouseup);
    }
    if (state.items) state.items.forEach(function (item) { item.el.remove(); });
    state = { active: false };
  }

  function resize() {
    if (!isDesktop() || reduceMotion()) { destroy(); return; }
    if (!state.active) { start(); return; }
    var width = state.hero.clientWidth;
    var height = state.hero.clientHeight;
    var Body = state.Body;
    Body.setPosition(state.floor, { x: width / 2, y: height + 40 });
    Body.setPosition(state.leftWall, { x: -20, y: height / 2 });
    Body.setPosition(state.rightWall, { x: width + 20, y: height / 2 });
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  function start() {
    if (!isDesktop() || reduceMotion()) return;
    loadMatter(function () { whenFontsReady(build); });
  }

  function init() {
    start();
    window.addEventListener('resize', debounce(resize, 200));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
