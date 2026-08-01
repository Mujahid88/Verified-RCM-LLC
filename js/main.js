/* Verified RCM - site behaviour: theme, mobile nav, filters, counters, reveal, form validation */
(function () {
  'use strict';

  /* ---------- theme (persisted) ---------- */
  var root = document.documentElement;
  var STORAGE_KEY = 'vrcm-theme';
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === 'dark') root.setAttribute('data-theme', 'dark');
  var toggle = document.getElementById('themeToggle');
  function paintToggle() {
    if (!toggle) return;
    toggle.innerHTML = root.getAttribute('data-theme') === 'dark' ? '\u263C' : '\u263E';
  }
  paintToggle();
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (next === 'dark') root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      paintToggle();
    });
  }

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burgerBtn');
  var menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.innerHTML = open ? '\u2715' : '\u2630';
    });
  }

  /* ---------- category filters (specialties + blog) ---------- */
  document.querySelectorAll('.filter-row').forEach(function (row) {
    var grid = row.parentElement.querySelector('[id$="Grid"]');
    if (!grid) return;
    row.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      row.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
      btn.classList.add('active');
      var want = btn.getAttribute('data-filter');
      grid.querySelectorAll('[data-cat]').forEach(function (card) {
        card.style.display = (want === 'All' || card.getAttribute('data-cat') === want) ? '' : 'none';
      });
    });
  });

  /* ---------- services tab switch ---------- */
  var svcTabs = document.getElementById('svcTabs');
  if (svcTabs) {
    var svcPanels = document.querySelectorAll('[data-panel]');
    svcTabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.svc-tab');
      if (!btn) return;
      svcTabs.querySelectorAll('.svc-tab').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      var want = btn.getAttribute('data-tab');
      svcPanels.forEach(function (p) {
        p.hidden = p.getAttribute('data-panel') !== want;
      });
    });
  }

  /* ---------- homepage hero A/B toggle ---------- */
  var heroToggle = document.getElementById('heroToggle');
  if (heroToggle) {
    var heroPanels = document.querySelectorAll('[data-hero-panel]');
    heroToggle.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-hero-choice]');
      if (!btn) return;
      heroToggle.querySelectorAll('[data-hero-choice]').forEach(function (c) { c.classList.remove('active'); });
      btn.classList.add('active');
      var want = btn.getAttribute('data-hero-choice');
      heroPanels.forEach(function (p) {
        p.hidden = p.getAttribute('data-hero-panel') !== want;
      });
    });
  }

  /* ---------- nav shrink on scroll ---------- */
  var navBar = document.getElementById('navBar');
  if (navBar) {
    var navScrolled = false;
    var onNavScroll = function () {
      var scrolled = window.scrollY > 24;
      if (scrolled !== navScrolled) {
        navBar.classList.toggle('scrolled', scrolled);
        navScrolled = scrolled;
      }
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();
  }

  /* ---------- scroll reveal (staggered within grids/stacks) ----------
     Stagger follows the Stagger List preset: ~60ms per sibling, capped so
     long grids never feel sluggish (the preset warns against >8 staggered
     children / >0.1s per item). */
  var targets = document.querySelectorAll('.card, .photo, h1, h2, .lede, .trust-bar');
  var siblingIndex = new Map();
  targets.forEach(function (t) {
    t.classList.add('reveal');
    if (t.matches('.card, .photo')) {
      var parent = t.parentElement;
      var idx = siblingIndex.get(parent) || 0;
      t.style.transitionDelay = Math.min(idx * 60, 360) + 'ms';
      siblingIndex.set(parent, idx + 1);
    }
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- animated number counters ---------- */
  var counters = document.querySelectorAll('.stat-big, .svc-stat-value, .trust-val');
  function animateCounter(el) {
    var raw = el.textContent.trim();
    var m = raw.match(/^(\+)?(\d[\d,]*(?:\.\d+)?)(.*)$/);
    if (!m) return;
    var prefix = m[1] || '';
    var numStr = m[2].replace(/,/g, '');
    var suffix = m[3];
    var end = parseFloat(numStr);
    if (isNaN(end)) return;
    var decimals = (numStr.split('.')[1] || '').length;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = raw;
      return;
    }
    var duration = 1100;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (end * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- sliders (scroll-snap carousels) ----------
     The viewport scrolls natively, so the slider is fully usable with no JS,
     via touch, trackpad, or keyboard. This only wires up the optional
     prev/next buttons and keeps the dots in sync with scroll position. */
  document.querySelectorAll('.slider').forEach(function (slider) {
    var vp = slider.querySelector('.slider-viewport');
    if (!vp) return;
    var prev = slider.querySelector('[data-slider-prev]');
    var next = slider.querySelector('[data-slider-next]');
    var dots = Array.prototype.slice.call(slider.querySelectorAll('.slider-dot'));
    var slides = Array.prototype.slice.call(vp.children);

    function step() {
      // Advance by one slide width (incl. gap) rather than a magic number.
      if (slides.length < 2) return vp.clientWidth;
      return Math.round(slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left) || vp.clientWidth;
    }
    function sync() {
      var s = step();
      // scrollWidth-clientWidth can be off by a sub-pixel; allow 2px slack.
      var maxScroll = vp.scrollWidth - vp.clientWidth;
      var atStart = vp.scrollLeft <= 2;
      var atEnd = vp.scrollLeft >= maxScroll - 2;
      // When several slides are visible at once the scroller runs out of room
      // before the final slide reaches the left edge, so the last dot would
      // never light up. Pin it to the last dot once we're scrolled to the end.
      var i = atEnd ? dots.length - 1 : (s ? Math.round(vp.scrollLeft / s) : 0);
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
      dots.forEach(function (d, di) { d.setAttribute('aria-selected', di === i ? 'true' : 'false'); });
    }
    if (prev) prev.addEventListener('click', function () { vp.scrollLeft -= step(); });
    if (next) next.addEventListener('click', function () { vp.scrollLeft += step(); });
    dots.forEach(function (d, di) {
      d.addEventListener('click', function () { vp.scrollLeft = di * step(); });
    });
    // Keyboard support on the scroller itself (it is focusable via tabindex).
    vp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); vp.scrollLeft += step(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); vp.scrollLeft -= step(); }
    });
    var raf = null;
    vp.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; sync(); });
    }, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    sync();
  });

  /* ---------- contact form validation + Formspree submit ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');

    function showError(field, msg) {
      field.classList.add('invalid');
      field.setAttribute('aria-invalid', 'true');
      var next = field.nextElementSibling;
      if (!next || !next.classList.contains('field-error')) {
        var p = document.createElement('p');
        p.className = 'field-error';
        field.insertAdjacentElement('afterend', p);
        next = p;
      }
      next.textContent = msg;
    }
    function clearError(field) {
      field.classList.remove('invalid');
      field.removeAttribute('aria-invalid');
      var next = field.nextElementSibling;
      if (next && next.classList.contains('field-error')) next.remove();
    }
    function validate() {
      var ok = true;
      form.querySelectorAll('input, textarea').forEach(function (field) {
        clearError(field);
        var val = field.value.trim();
        if (field.required && !val) { showError(field, 'This field is required.'); ok = false; return; }
        if (!val) return;
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
          showError(field, 'Enter a valid email address.'); ok = false; return;
        }
        if (field.minLength > 0 && val.length < field.minLength) {
          showError(field, 'Please enter at least ' + field.minLength + ' characters.'); ok = false; return;
        }
        if (field.pattern && !new RegExp('^(?:' + field.pattern + ')$').test(val)) {
          showError(field, 'Please check this value.'); ok = false;
        }
      });
      return ok;
    }

    form.addEventListener('input', function (e) {
      if (e.target.matches('input, textarea')) clearError(e.target);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (status) { status.className = 'form-status'; status.textContent = ''; }
      if (!validate()) {
        if (status) { status.className = 'form-status err'; status.textContent = 'Please fix the highlighted fields.'; }
        var bad = form.querySelector('.invalid');
        if (bad) bad.focus();
        return;
      }
      if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
        if (status) { status.className = 'form-status err'; status.textContent = 'Form not configured yet: add your Formspree endpoint ID (see README).'; }
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('bad response');
        form.reset();
        if (status) { status.className = 'form-status ok'; status.textContent = 'Thank you. We will reply within one business day.'; }
      }).catch(function () {
        if (status) { status.className = 'form-status err'; status.textContent = 'Something went wrong. Please email hello@verifiedrcm.com instead.'; }
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Request my consultation'; }
      });
    });
  }
})();
