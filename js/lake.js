/* Verified RCM - lake home page: mobile drawer (accessible), nothing else.
   Search, reviews slider, counters and the cookie banner still come from js/main.js. */
(function () {
  'use strict';
  var burger = document.getElementById('drawerOpen');
  var drawer = document.getElementById('drawer');
  var panel = drawer && drawer.querySelector('.drawer-panel');
  var closeBtn = document.getElementById('drawerClose');
  var main = document.getElementById('main');
  if (!burger || !drawer || !panel) return;

  var lastFocus = null;
  function setInert(on) {
    ['main', 'site-footer', 'topbar'].forEach(function (id) {
      var el = id === 'main' ? main : document.querySelector('.' + id);
      if (!el) return;
      if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  function open() {
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setInert(true);
    // The panel is not focusable in the same tick it becomes visible.
    requestAnimationFrame(function () { requestAnimationFrame(function () { closeBtn && closeBtn.focus(); }); });
  }
  function close() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setInert(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  burger.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  drawer.addEventListener('click', function (e) { if (e.target === drawer) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    if (e.key === 'Tab' && drawer.classList.contains('is-open')) {
      var f = panel.querySelectorAll('a[href], button, summary, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  panel.querySelectorAll('a[href]').forEach(function (a) { a.addEventListener('click', close); });
})();

/* ---------- Interactivity added 2026-09-15 ---------- */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Outcome bars fill when the panel scrolls into view */
  var outcome = document.querySelector('.outcome');
  if (outcome) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { outcome.classList.add('in'); io.disconnect(); } });
      }, { threshold: 0.35 });
      io.observe(outcome);
    } else { outcome.classList.add('in'); }
  }

  /* Live-looking claim feed in the hero (illustrative, no real data) */
  var feed = document.querySelector('.float-claims');
  if (feed && !reduce) {
    var POOL = [
      ['CLM-4475', 'Family medicine, AWV', 'accepted'],
      ['CLM-4476', 'Orthopedics, fracture care', 'review'],
      ['CLM-4477', 'Mental health, 90837', 'paid'],
      ['CLM-4478', 'Dermatology, lesion excision', 'accepted'],
      ['CLM-4479', 'Nephrology, dialysis MCP', 'paid'],
      ['CLM-4480', 'Urgent care, E/M level 4', 'accepted'],
      ['CLM-4481', 'OB/GYN, global maternity', 'review'],
      ['CLM-4482', 'Physical therapy, 97110', 'paid']
    ];
    var LABEL = { paid: 'Paid', accepted: 'Accepted', review: 'In review' };
    var i = 0;
    function tick() {
      var rows = feed.querySelectorAll('.fc-row');
      if (!rows.length) return;
      // promote any "in review" row to accepted, any accepted to paid
      rows.forEach(function (r) {
        var s = r.querySelector('.status');
        if (!s) return;
        if (s.classList.contains('review')) { s.className = 'status accepted'; s.textContent = 'Accepted'; }
        else if (s.classList.contains('accepted') && Math.random() < 0.5) { s.className = 'status paid'; s.textContent = 'Paid'; }
      });
      var c = POOL[i++ % POOL.length];
      var row = document.createElement('div');
      row.className = 'fc-row is-new';
      row.innerHTML = '<b></b><span></span><span class="status ' + c[2] + '"></span>';
      row.children[0].textContent = c[0];
      row.children[1].textContent = c[1];
      row.children[2].textContent = LABEL[c[2]];
      rows[0].parentNode.insertBefore(row, rows[0]);
      rows[rows.length - 1].remove();
      setTimeout(function () { row.classList.remove('is-new'); }, 600);
    }
    var timer = null;
    function start() { if (!timer) timer = setInterval(tick, 2800); }
    function stop() { clearInterval(timer); timer = null; }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    start();
  }

  /* Denial cost calculator */
  var claims = document.getElementById('calcClaims');
  if (claims) {
    var rate = document.getElementById('calcRate'), value = document.getElementById('calcValue');
    var REWORK = 57.23, NEVER = 0.35, VRCM_RATE = 1 - 0.9735;
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    var fmtN = function (n) { return Math.round(n).toLocaleString('en-US'); };
    function calc() {
      var c = +claims.value, r = +rate.value / 100, v = +value.value;
      document.getElementById('calcClaimsOut').textContent = fmtN(c);
      document.getElementById('calcRateOut').textContent = (+rate.value) + '%';
      document.getElementById('calcValueOut').textContent = fmt(v);
      var denied = c * r, vr = c * VRCM_RATE;
      var rework = denied * REWORK, lost = denied * NEVER * v;
      var reworkV = vr * REWORK, lostV = vr * NEVER * v;
      var saved = Math.max(0, (rework + lost) - (reworkV + lostV)) * 12;
      document.getElementById('outDenied').textContent = fmtN(denied);
      document.getElementById('outRework').textContent = fmt(rework);
      document.getElementById('outLost').textContent = fmt(lost);
      document.getElementById('outVrcm').textContent = fmtN(vr);
      document.getElementById('outSaved').textContent = fmt(saved);
    }
    [claims, rate, value].forEach(function (el) { el.addEventListener('input', calc); });
    calc();
  }

  /* Specialty finder */
  var find = document.getElementById('specFind');
  if (find) {
    var groups = [].slice.call(document.querySelectorAll('#specGroups .spec-group'));
    var empty = document.getElementById('specEmpty');
    find.addEventListener('input', function () {
      var q = find.value.trim().toLowerCase();
      var any = false;
      groups.forEach(function (g) {
        var shown = 0;
        g.querySelectorAll('.spec-row').forEach(function (row) {
          var hit = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
          row.classList.toggle('is-hidden', !hit);
          if (hit) shown++;
        });
        g.classList.toggle('is-hidden', shown === 0);
        if (shown) any = true;
      });
      if (empty) empty.classList.toggle('is-shown', !any);
    });
  }

  /* Pointer tilt on the big cards */
  if (!reduce && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 4) + 'deg) rotateY(' + (x * 5) + 'deg) translateY(-3px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }
})();

/* Safety net for the scroll reveal in js/main.js: anything that has scrolled
   past the viewport bottom is shown, even if IntersectionObserver missed it
   during a fast scroll or an anchor jump. */
(function () {
  var pending = false;
  function sweep() {
    pending = false;
    var vh = window.innerHeight;
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
      if (el.getBoundingClientRect().top < vh + 40) el.classList.add('in');
    });
  }
  function onScroll() { if (!pending) { pending = true; requestAnimationFrame(sweep); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', function () { setTimeout(sweep, 50); });
})();
