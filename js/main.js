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

  /* ---------- scroll reveal ---------- */
  var targets = document.querySelectorAll('.card, .photo, h1, h2, .lede, .trust-bar');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    targets.forEach(function (t) { t.classList.add('reveal'); io.observe(t); });
  }

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
