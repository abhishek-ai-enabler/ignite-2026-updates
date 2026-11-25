(function () {
  'use strict';

  var THEMES = [
    { id: 'galaxy', label: 'Galaxy', hint: 'Deep space, stars and glow', colors: ['#070618', '#5cd6ff'] },
    { id: 'editorial', label: 'Editorial', hint: 'Sidebar, serif headings, red accent', colors: ['#f5f6f7', '#d32f2f'] },
    { id: 'auto', label: 'Auto', hint: 'Follows your system', colors: ['#f6f7fb', '#0d1117'] },
    { id: 'light', label: 'Daylight', hint: 'Clean and bright', colors: ['#ffffff', '#0b5cad'] },
    { id: 'midnight', label: 'Midnight', hint: 'Dark and focused', colors: ['#0d1117', '#6cb2ff'] },
    { id: 'aurora', label: 'Aurora', hint: 'Dark with vivid color', colors: ['#120a2b', '#b69cff'] },
    { id: 'executive', label: 'Executive', hint: 'Navy, gold and serif headings', colors: ['#faf8f3', '#14325c'] },
    { id: 'contrast', label: 'High contrast', hint: 'Maximum legibility', colors: ['#000000', '#ffe14d'] }
  ];
  var VIEWS = ['leadership', 'detail'];

  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }
  function isTheme(id) { return THEMES.some(function (t) { return t.id === id; }); }

  var params = new URLSearchParams(window.location.search);
  var theme = [params.get('theme'), read('ignite-theme'), 'galaxy'].filter(isTheme)[0];
  var view = [params.get('view'), read('ignite-view'), 'detail'].filter(function (v) { return VIEWS.indexOf(v) !== -1; })[0];

  function resolve(id) {
    if (id !== 'auto') return id;
    return mq && mq.matches ? 'midnight' : 'light';
  }

  function apply() {
    root.setAttribute('data-theme', resolve(theme));
    root.setAttribute('data-view', view);
  }

  apply();
  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function () { if (theme === 'auto') apply(); });
  }

  function setTheme(id) {
    theme = id;
    write('ignite-theme', id);
    apply();
    syncMenu();
  }

  function setView(id) {
    view = id;
    write('ignite-view', id);
    apply();
    syncView();
    document.dispatchEvent(new CustomEvent('viewchange', { detail: { view: id } }));
  }

  var menu, options = [];

  function syncMenu() {
    options.forEach(function (btn) {
      btn.setAttribute('aria-checked', btn.getAttribute('data-theme-id') === theme ? 'true' : 'false');
    });
    var current = THEMES.filter(function (t) { return t.id === theme; })[0];
    var label = document.getElementById('theme-current');
    if (label) label.textContent = current.label;
    var swatch = document.getElementById('theme-swatch');
    if (swatch) swatch.style.background = 'linear-gradient(135deg,' + current.colors[0] + ' 50%,' + current.colors[1] + ' 50%)';
  }

  function syncView() {
    document.querySelectorAll('[data-view-btn]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-view-btn') === view ? 'true' : 'false');
    });
  }

  function buildMenu() {
    menu = document.getElementById('theme-menu');
    var list = document.getElementById('theme-options');
    if (!menu || !list) return;
    THEMES.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('data-theme-id', t.id);
      btn.className = 'theme-option';

      var sw = document.createElement('span');
      sw.className = 'swatch';
      sw.setAttribute('aria-hidden', 'true');
      sw.style.background = 'linear-gradient(135deg,' + t.colors[0] + ' 50%,' + t.colors[1] + ' 50%)';

      var text = document.createElement('span');
      text.className = 'theme-text';
      var name = document.createElement('strong');
      name.textContent = t.label;
      var hint = document.createElement('small');
      hint.textContent = t.hint;
      text.appendChild(name);
      text.appendChild(hint);

      btn.appendChild(sw);
      btn.appendChild(text);
      btn.addEventListener('click', function () {
        setTheme(t.id);
        menu.removeAttribute('open');
        menu.querySelector('summary').focus();
      });
      list.appendChild(btn);
      options.push(btn);
    });
    syncMenu();

    document.addEventListener('click', function (e) {
      if (menu.hasAttribute('open') && !menu.contains(e.target)) menu.removeAttribute('open');
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.hasAttribute('open')) {
        menu.removeAttribute('open');
        menu.querySelector('summary').focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildMenu();
    syncView();
    document.querySelectorAll('[data-view-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () { setView(btn.getAttribute('data-view-btn')); });
    });
  });
})();
