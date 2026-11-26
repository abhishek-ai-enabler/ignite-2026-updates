(function () {
  'use strict';

  var W = 1280, H = 720;
  var STATUSES = ['GA', 'Preview', 'Coming soon', 'Announced'];
  var data, slides = [], current = 0;

  // The OP look is used on the OP GitHub Pages host; ?theme=op or ?theme=generic overrides it.
  var param = new URLSearchParams(location.search).get('theme');
  var theme = param === 'op' || param === 'generic' ? param : (/(^|\.)eficode\.com$/i.test(location.hostname) ? 'op' : 'generic');
  document.documentElement.setAttribute('data-deck-theme', theme);
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'assets/slides-' + theme + '.css?v=20261126k';
  document.head.appendChild(link);

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === false || value == null) return;
      if (key === 'text') node.textContent = value;
      else if (key === 'href') node.setAttribute('href', /^https:\/\//i.test(value) ? value : '#');
      else node.setAttribute(key, value);
    });
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function productById(id) { return data.products.find(function (p) { return p.id === id; }); }
  function shortName(p) { return p.id === 'iq' || p.id === 'foundry' ? p.name : p.name.replace('Microsoft ', ''); }
  function sourceById(id) { return data.sources.find(function (s) { return s.id === id; }); }

  function logo(key, size) {
    var l = data.logos && data.logos[key];
    if (!l || !/^[a-z0-9-]+\.svg$/.test(l.file)) return null;
    return el('img', { class: 'logo', src: 'assets/icons/' + l.file, alt: '', width: size, height: size });
  }

  function badge(status) { return el('span', { class: 'badge', 'data-status': status, text: status }); }

  function counts(productId) {
    var c = {};
    data.updates.forEach(function (u) { if (u.product === productId) c[u.status] = (c[u.status] || 0) + 1; });
    return c;
  }

  function slide(kind, productId, children) {
    var s = el('section', { class: 'slide slide-' + kind, 'data-product': productId || '', 'aria-roledescription': 'slide', hidden: 'hidden' }, children);
    slides.push(s);
    return s;
  }

  function head(kicker, title, productId) {
    var l = productId ? logo(productById(productId).logo, 56) : null;
    return el('header', { class: 'slide-head' }, [
      l,
      el('div', {}, [el('p', { class: 'kicker', text: kicker }), el('h2', { text: title })])
    ]);
  }

  function titleSlide() {
    var m = data.meta;
    slide('title', '', [
      el('p', { class: 'kicker', text: m.event }),
      el('h1', { text: 'What’s new in Copilot Studio, Microsoft IQ, Microsoft Foundry, Agent 365 and Power Platform' }),
      el('p', { class: 'sub', text: m.dates + ' · ' + m.location }),
      el('ul', { class: 'logo-row', 'aria-label': 'Products' }, data.products.map(function (p) {
        return el('li', {}, [logo(p.logo, 64), el('span', { text: shortName(p) })]);
      })),
      el('p', { class: 'sub author', text: (m.author.name + ', ' + m.author.role) }),
      el('p', { class: 'small', text: 'Unofficial summary of content provided by Microsoft at Ignite 2026. Last updated ' + m.lastUpdated + '.' })
    ]);
  }

  function fitSlide() {
    var roles = { 'copilot-studio': 'Build', 'iq': 'Ground', 'foundry': 'Run', 'power-platform': 'Connect', 'agent-365': 'Govern' };
    var order = ['copilot-studio', 'iq', 'foundry', 'power-platform', 'agent-365'];
    slide('fit', '', [
      head('The big picture', 'How they fit together'),
      el('ol', { class: 'fit-row' }, order.map(function (id, i) {
        var p = productById(id);
        return el('li', { 'data-product': id }, [
          el('span', { class: 'num', text: String(i + 1) }),
          logo(p.logo, 48),
          el('h3', { text: roles[id] + ' with ' + shortName(p) }),
          el('p', { text: p.glance })
        ]);
      }))
    ]);
  }

  function overviewSlide(p) {
    var c = counts(p.id);
    slide('overview', p.id, [
      head(p.role, p.name, p.id),
      el('p', { class: 'lede', text: p.tagline }),
      el('div', { class: 'cols' }, [
        el('div', { class: 'panel' }, [el('h3', { text: 'What was announced' }), el('p', { text: p.summary })]),
        el('div', { class: 'panel' }, [el('h3', { text: 'Why it matters' }), el('p', { text: p.why })])
      ]),
      el('div', { class: 'foot-row' }, [
        el('div', {}, [
          el('h3', { text: 'Who should care' }),
          el('ul', { class: 'pills' }, p.audience.map(function (a) { return el('li', { text: data.audiences[a] || a }); }))
        ]),
        el('div', {}, [
          el('h3', { text: data.updates.filter(function (u) { return u.product === p.id; }).length + ' updates' }),
          el('ul', { class: 'status-counts' }, STATUSES.filter(function (s) { return c[s]; }).map(function (s) {
            return el('li', {}, [badge(s), el('span', { text: String(c[s]) })]);
          }))
        ])
      ])
    ]);
  }

  function topHeight(u) {
    var lines = function (t, per) { return t ? Math.ceil(t.length / per) : 0; };
    var text = (lines(u.summary, 98) + lines(u.note, 108) + 1) * 19;
    var title = lines(u.name, 29) * 22 + 34;
    return Math.max(text, title) + 18;
  }

  function topSlides(p) {
    var top = data.updates.filter(function (u) { return u.product === p.id && u.top; });
    var pages = [[]], used = 0, budget = 480;
    top.forEach(function (u) {
      var h = topHeight(u) + 8;
      if (used + h > budget && pages[pages.length - 1].length) { pages.push([]); used = 0; }
      pages[pages.length - 1].push(u);
      used += h;
    });
    pages.forEach(function (part, i) {
      slide('top', p.id, [
        head('Top announcements' + (pages.length > 1 ? ' (' + (i + 1) + ' of ' + pages.length + ')' : ''), p.name, p.id),
        el('ul', { class: 'top-grid', 'data-count': String(part.length) }, part.map(function (u) {
          var s = sourceById(u.source);
          return el('li', {}, [
            el('div', { class: 'row' }, [el('h3', { text: u.name }), badge(u.status)]),
            el('p', { text: u.summary }),
            u.note ? el('p', { class: 'note', text: u.note }) : null,
            s ? el('p', { class: 'src' }, ['Source: ', el('a', { href: s.url, text: s.label, target: '_blank', rel: 'noopener noreferrer' })]) : null
          ]);
        }))
      ]);
    });
  }

  function listSlides(p) {
    var list = data.updates.filter(function (u) { return u.product === p.id; });
    var per = 14, pages = Math.ceil(list.length / per);
    for (var i = 0; i < pages; i++) {
      var part = list.slice(i * per, (i + 1) * per);
      slide('list', p.id, [
        head('All updates' + (pages > 1 ? ' (' + (i + 1) + ' of ' + pages + ')' : ''), p.name, p.id),
        el('ul', { class: 'update-list' }, part.map(function (u) {
          return el('li', {}, [badge(u.status), el('span', { class: 'n', text: u.name }), el('span', { class: 'a', text: u.area })]);
        }))
      ]);
    }
  }

  function compareSlide() {
    var cols = data.compare.columns;
    var table = el('table', {}, [
      el('thead', {}, [el('tr', {}, [el('th', { scope: 'col', text: '' })].concat(cols.map(function (id) {
        return el('th', { scope: 'col', 'data-product': id, text: shortName(productById(id)) });
      })))]),
      el('tbody', {}, data.compare.rows.map(function (r) {
        return el('tr', {}, [el('th', { scope: 'row', text: r.label })].concat(r.values.map(function (v) { return el('td', { text: v }); })));
      }))
    ]);
    slide('compare', '', [head('Side by side', 'Compare at a glance'), el('div', { class: 'table-wrap' }, [table])]);
  }

  function summarySlide() {
    slide('summary', '', [
      head('In a nutshell', 'Summary at a glance'),
      el('ul', { class: 'glance' }, data.products.map(function (p) {
        return el('li', { 'data-product': p.id }, [
          el('div', { class: 'row' }, [logo(p.logo, 40), el('h3', { text: shortName(p) })]),
          el('p', { text: p.glance })
        ]);
      }))
    ]);
  }

  function startSlide() {
    var groups = data.getStarted.filter(function (g) { return g.title !== 'Ignite 2026'; });
    slide('start', '', [
      head('Next steps', 'Get started'),
      el('div', { class: 'start-grid' }, groups.map(function (g) {
        return el('div', { class: 'panel' }, [
          el('h3', { text: g.title }),
          el('ul', {}, g.links.slice(0, 3).map(function (l) {
            return el('li', {}, [el('a', { href: l.url, text: l.label, target: '_blank', rel: 'noopener noreferrer' })]);
          }))
        ]);
      }))
    ]);
  }

  function closeSlide() {
    slide('close', '', [
      head('Sources', 'Where this comes from'),
      el('ul', { class: 'sources' }, data.sources.map(function (s) {
        return el('li', {}, [el('a', { href: s.url, text: s.label, target: '_blank', rel: 'noopener noreferrer' })]);
      })),
      el('p', { class: 'small', text: 'Compiled by ' + data.meta.author.name + ', ' + data.meta.author.role + '. Disclaimer: this deck is an unofficial summary referenced from documentation and content provided by Microsoft during Microsoft Ignite 2026. It is shared for general information only, may be incomplete or change, and the author accepts no responsibility or liability for decisions based on it. Verify against the official Microsoft sources. Microsoft and product names and icons are trademarks of the Microsoft group of companies.' })
    ]);
  }

  function build() {
    titleSlide();
    fitSlide();
    data.products.forEach(function (p) { overviewSlide(p); topSlides(p); listSlides(p); });
    compareSlide();
    summarySlide();
    startSlide();
    closeSlide();
    var stage = document.getElementById('stage');
    slides.forEach(function (s, i) {
      s.setAttribute('aria-label', (i + 1) + ' of ' + slides.length);
      s.appendChild(el('footer', { class: 'slide-foot' }, [
        el('span', { text: 'Microsoft Ignite 2026 updates' }),
        el('span', { text: (i + 1) + ' / ' + slides.length })
      ]));
      stage.appendChild(s);
    });
  }

  function show(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, idx) { s.hidden = idx !== current; });
    document.getElementById('counter').textContent = 'Slide ' + (current + 1) + ' of ' + slides.length;
    document.getElementById('prev').disabled = current === 0;
    document.getElementById('next').disabled = current === slides.length - 1;
    history.replaceState(null, '', '#' + (current + 1));
  }

  function fit() {
    var vp = document.getElementById('viewport');
    var scale = Math.min(vp.clientWidth / W, vp.clientHeight / H);
    var stage = document.getElementById('stage');
    stage.style.transform = 'scale(' + scale + ')';
    vp.style.setProperty('--scale', scale);
  }

  function bind() {
    document.getElementById('prev').addEventListener('click', function () { show(current - 1); });
    document.getElementById('next').addEventListener('click', function () { show(current + 1); });
    document.getElementById('fs').addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    });
    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target && e.target.tagName;
      if (t === 'A' && e.key === 'Enter') return;
      var map = { ArrowRight: 1, PageDown: 1, ' ': 1, ArrowLeft: -1, PageUp: -1 };
      if (map[e.key]) { e.preventDefault(); show(current + map[e.key]); }
      else if (e.key === 'Home') show(0);
      else if (e.key === 'End') show(slides.length - 1);
      else if (e.key === 'f' || e.key === 'F') document.getElementById('fs').click();
    });
    window.addEventListener('resize', fit);
    window.addEventListener('hashchange', function () {
      var n = parseInt(location.hash.slice(1), 10);
      if (n && n - 1 !== current) show(n - 1);
    });
  }

  fetch('data/updates.json?v=20261126k', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      data = d;
      build();
      bind();
      fit();
      var n = parseInt(location.hash.slice(1), 10);
      show(n ? n - 1 : 0);
      document.getElementById('stage').focus({ preventScroll: true });
    })
    .catch(function (err) {
      document.getElementById('stage').textContent = 'Could not load slide data (' + err.message + ').';
    });
})();
