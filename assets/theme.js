(function () {
  'use strict';

  var THEMES = [
    { id: 'galaxy', label: 'Galaxy', hint: 'Warm sunset space with stars', colors: ['#1a0b1f', '#ff9a4d'] },
    { id: 'editorial', label: 'Editorial', hint: 'Sidebar, serif headings, red accent', colors: ['#f5f6f7', '#d32f2f'] }
  ];

  var root = document.documentElement;

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }
  function isTheme(id) { return THEMES.some(function (t) { return t.id === id; }); }

  var params = new URLSearchParams(window.location.search);
  var theme = [params.get('theme'), read('ignite-theme'), 'galaxy'].filter(isTheme)[0];

  function apply() {
    root.setAttribute('data-theme', theme);
  }

  apply();

  function setTheme(id) {
    theme = id;
    write('ignite-theme', id);
    apply();
    syncMenu();
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
  });
})();
