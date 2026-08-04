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

  /* ---------- site search ----------
     A real input box that lives in the nav (not an icon hiding a modal),
     with results dropping down beneath it. Loads search-index.json once
     (54 pages, ~11KB), matches on title + description, case-insensitive
     substring. No server to query on a static site, so this is the whole
     "backend". */
  var navSearch = document.getElementById('navSearch');
  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');
  if (navSearch && searchInput && searchResults) {
    var searchIndex = null;
    var searchIndexPromise = null;
    var activeIndex = -1;

    function loadIndex() {
      if (searchIndexPromise) return searchIndexPromise;
      searchIndexPromise = fetch('search-index.json')
        .then(function (r) { return r.json(); })
        .then(function (data) { searchIndex = data; return data; })
        .catch(function () { searchIndex = []; return []; });
      return searchIndexPromise;
    }

    function openResults() { searchResults.classList.add('open'); }
    function closeResults() { searchResults.classList.remove('open'); activeIndex = -1; }

    function renderResults(items, query) {
      activeIndex = -1;
      if (!query) {
        searchResults.innerHTML = '<p class="search-hint">Search specialties, services, credentialing guides and articles.</p>';
        return;
      }
      if (!items.length) {
        searchResults.innerHTML = '<p class="search-empty">No pages match &ldquo;' + query.replace(/</g, '&lt;') + '&rdquo;.</p>';
        return;
      }
      searchResults.innerHTML = items.slice(0, 8).map(function (item) {
        return '<a class="search-result" href="' + item.url + '">' +
          '<span class="search-result-cat">' + item.cat + '</span>' +
          '<span class="search-result-body"><span class="search-result-title">' + item.title + '</span>' +
          '<span class="search-result-desc">' + item.desc + '</span></span>' +
          '</a>';
      }).join('');
    }

    function runSearch(query) {
      loadIndex().then(function (data) {
        var q = query.trim().toLowerCase();
        if (!q) { renderResults([], ''); return; }
        var scored = data.map(function (item) {
          var title = item.title.toLowerCase();
          var desc = item.desc.toLowerCase();
          var score = 0;
          if (title.indexOf(q) === 0) score = 3;
          else if (title.indexOf(q) !== -1) score = 2;
          else if (desc.indexOf(q) !== -1) score = 1;
          return { item: item, score: score };
        }).filter(function (s) { return s.score > 0; })
          .sort(function (a, b) { return b.score - a.score; })
          .map(function (s) { return s.item; });
        renderResults(scored, query);
      });
    }

    searchInput.addEventListener('focus', function () {
      loadIndex();
      if (!searchResults.innerHTML) renderResults([], '');
      openResults();
    });
    searchInput.addEventListener('input', function () {
      runSearch(searchInput.value);
      openResults();
    });
    document.addEventListener('click', function (e) {
      if (!navSearch.contains(e.target)) closeResults();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== searchInput) {
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); searchInput.focus(); }
      }
      if (searchResults.classList.contains('open')) {
        if (e.key === 'Escape') { closeResults(); searchInput.blur(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          var results = searchResults.querySelectorAll('.search-result');
          if (!results.length) return;
          e.preventDefault();
          activeIndex += e.key === 'ArrowDown' ? 1 : -1;
          if (activeIndex < 0) activeIndex = results.length - 1;
          if (activeIndex >= results.length) activeIndex = 0;
          results.forEach(function (r, i) { r.classList.toggle('active', i === activeIndex); });
          results[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          var active = searchResults.querySelector('.search-result.active') || searchResults.querySelector('.search-result');
          if (active && document.activeElement === searchInput) { window.location.href = active.getAttribute('href'); }
        }
      }
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
  var targets = document.querySelectorAll('.card, .photo, h1, h2, .lede, .glass-card, .bar-chart');
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

  /* ---------- connected flow rail ----------
     Adds .in once the rail scrolls into view, which draws the progress fill
     and lights each day marker in sequence. Fires once, then stops observing. */
  var flows = document.querySelectorAll('.flow');
  if (flows.length && 'IntersectionObserver' in window) {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); fio.unobserve(en.target); }
      });
    }, { threshold: 0.25 });
    flows.forEach(function (f) { fio.observe(f); });
  } else {
    // No IntersectionObserver: show the completed state rather than a blank rail.
    flows.forEach(function (f) { f.classList.add('in'); });
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

    // Errors are appended inside the field's own wrapper so they sit under the
    // control (and its hint) instead of being injected mid-layout, and are tied
    // to the input with aria-describedby so screen readers announce them.
    function errorHost(field) {
      return field.closest('.field') || field.parentElement;
    }
    function showError(field, msg) {
      field.classList.add('invalid');
      field.setAttribute('aria-invalid', 'true');
      var host = errorHost(field);
      var el = host.querySelector('.field-error');
      if (!el) {
        el = document.createElement('p');
        el.className = 'field-error';
        el.id = (field.id || 'f' + Math.abs(field.name.length * 7)) + '-err';
        host.appendChild(el);
      }
      el.textContent = msg;
      field.setAttribute('aria-describedby', el.id);
    }
    function clearError(field) {
      field.classList.remove('invalid');
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
      var el = errorHost(field).querySelector('.field-error');
      if (el) el.remove();
    }
    // Builds the "required" message. Question-style labels ("What do you need
    // help with?") don't slot into "Please enter your ___", so a field can
    // supply its own phrasing via data-error-label.
    function requiredMsg(field) {
      var custom = field.getAttribute('data-error-label');
      if (custom) return 'Please ' + custom + '.';
      var label = (field.labels && field.labels[0])
        ? field.labels[0].textContent.replace(/required|optional/ig, '').trim().toLowerCase()
        : '';
      if (!label || /\?$/.test(label)) return 'This field is required.';
      return 'Please enter your ' + label + '.';
    }
    // Name the problem AND the recovery, rather than a generic "invalid".
    function validate() {
      var ok = true;
      var firstBad = null;
      form.querySelectorAll('input, textarea, select').forEach(function (field) {
        clearError(field);
        var val = (field.value || '').trim();
        function fail(msg) { showError(field, msg); ok = false; if (!firstBad) firstBad = field; }
        if (field.required && !val) { fail(requiredMsg(field)); return; }
        if (!val) return;
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
          fail('That email looks incomplete — check for a missing @ or domain.'); return;
        }
        if (field.minLength > 0 && val.length < field.minLength) {
          fail('Add a little more detail (at least ' + field.minLength + ' characters).'); return;
        }
        if (field.pattern && !new RegExp('^(?:' + field.pattern + ')$').test(val)) {
          fail('Use digits only, e.g. (623) 231-2306.');
        }
      });
      return ok;
    }

    form.addEventListener('input', function (e) {
      if (e.target.matches('input, textarea, select')) clearError(e.target);
    });
    // Validate a field once the user leaves it, so errors surface early
    // rather than all at once on submit.
    form.addEventListener('blur', function (e) {
      if (!e.target.matches('input, textarea, select')) return;
      var val = (e.target.value || '').trim();
      if (!val && !e.target.required) return;
      validateOne(e.target);
    }, true);
    function validateOne(field) {
      clearError(field);
      var val = (field.value || '').trim();
      if (field.required && !val) { showError(field, requiredMsg(field)); return; }
      if (!val) return;
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
        showError(field, 'That email looks incomplete — check for a missing @ or domain.'); return;
      }
      if (field.minLength > 0 && val.length < field.minLength) {
        showError(field, 'Add a little more detail (at least ' + field.minLength + ' characters).'); return;
      }
      if (field.pattern && !new RegExp('^(?:' + field.pattern + ')$').test(val)) {
        showError(field, 'Use digits only, e.g. (623) 231-2306.');
      }
    }

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
      // Capture the real label so it restores correctly whatever the copy says.
      var btnLabel = btn ? btn.textContent : '';
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
        if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
      });
    });
  }
})();
