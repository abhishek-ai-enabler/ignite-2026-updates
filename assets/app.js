(function () {
  'use strict';

  var STATUSES = ['GA', 'Preview', 'Coming soon', 'Announced'];
  var state = { q: '', products: new Set(), statuses: new Set() };
  var data;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === false || value == null) return;
      if (key === 'text') node.textContent = value;
      else if (key === 'href') node.setAttribute('href', safeUrl(value));
      else node.setAttribute(key, value === true ? '' : value);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function safeUrl(url) {
    return /^(https:\/\/|#[\w-]*$)/i.test(url) ? url : '#';
  }

  function externalLink(label, url) {
    return el('a', { href: url, text: label, rel: 'noopener noreferrer', target: '_blank' });
  }

  function sourceById(id) {
    return data.sources.find(function (s) { return s.id === id; });
  }

  function productById(id) {
    return data.products.find(function (p) { return p.id === id; });
  }

  function formatDate(iso) {
    var parts = iso.split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
  }

  function renderHeader() {
    document.getElementById('event-dates').textContent = data.meta.dates;
    document.getElementById('event-location').textContent = data.meta.location;
    var time = document.getElementById('last-updated');
    time.setAttribute('datetime', data.meta.lastUpdated);
    time.textContent = formatDate(data.meta.lastUpdated);
  }

  function statusSummary(updates) {
    return STATUSES.map(function (s) {
      var n = updates.filter(function (u) { return u.status === s; }).length;
      return n ? n + ' ' + s : null;
    }).filter(Boolean).join(' · ');
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    'copilot-studio': [['path', { d: 'M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z' }]],
    'iq': [['circle', { cx: 12, cy: 12, r: 9 }], ['circle', { cx: 12, cy: 12, r: 5 }], ['circle', { cx: 12, cy: 12, r: 1.5 }]],
    'agent-365': [['path', { d: 'M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z' }], ['path', { d: 'M8.5 12l2.5 2.5 4.5-5' }]]
  };

  function logoImg(key) {
    var l = data.logos && data.logos[key];
    if (!l || !/^[a-z0-9-]+\.svg$/.test(l.file)) return null;
    return el('img', { src: 'assets/icons/' + l.file, alt: '', width: 48, height: 48, loading: 'lazy', decoding: 'async' });
  }

  function icon(productId) {
    var official = logoImg((productById(productId) || {}).logo);
    if (official) return el('span', { class: 'icon official' }, [official]);
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    (ICONS[productId] || []).forEach(function (shape) {
      var node = document.createElementNS(SVG_NS, shape[0]);
      Object.keys(shape[1]).forEach(function (k) { node.setAttribute(k, shape[1][k]); });
      svg.appendChild(node);
    });
    return el('span', { class: 'icon' }, [svg]);
  }

  function statusCounts(updates) {
    return STATUSES.map(function (s) {
      return { status: s, n: updates.filter(function (u) { return u.status === s; }).length };
    }).filter(function (c) { return c.n; });
  }

  function statusBar(updates) {
    var counts = statusCounts(updates);
    var bar = el('div', { class: 'bar', role: 'img', 'aria-label': statusSummary(updates) }, counts.map(function (c) {
      var seg = el('span', { 'data-status': c.status });
      seg.style.flexGrow = c.n;
      return seg;
    }));
    var legend = el('ul', { class: 'bar-legend', 'aria-hidden': 'true' }, counts.map(function (c) {
      return el('li', {}, [el('span', { class: 'dot', 'data-status': c.status }), c.n + ' ' + c.status]);
    }));
    return [bar, legend];
  }

  function renderKpis() {
    var host = document.getElementById('kpis');
    (data.meta.keyNumbers || []).forEach(function (k) {
      var s = sourceById(k.source);
      host.appendChild(el('li', { class: 'kpi', 'data-product': k.product }, [
        el('strong', { text: k.value }),
        el('span', { text: k.label }),
        s ? externalLink('Source', s.url) : null
      ]));
    });
  }

  function renderProductCards() {
    var list = document.getElementById('product-cards');
    data.products.forEach(function (p) {
      var updates = data.updates.filter(function (u) { return u.product === p.id; });
      list.appendChild(el('li', { class: 'product-card', 'data-product': p.id }, [
        el('div', { class: 'pc-top' }, [el('span', { class: 'role', text: p.role }), icon(p.id)]),
        el('h3', {}, [el('a', { href: '#' + p.id, text: p.name })]),
        el('p', { text: p.tagline }),
        el('p', { class: 'pc-count' }, [el('strong', { text: String(updates.length) }), 'updates'])
      ].concat(statusBar(updates))));
    });
  }

  function statusBadge(status) {
    return el('span', { class: 'badge', 'data-status': status, text: status });
  }

  function updateCard(u, isTop) {
    var ids = [u.source].concat(u.also || []);
    var sources = ids.map(sourceById).filter(Boolean);
    var meta = [
      el('span', { text: 'For: ' + u.audience.map(function (a) { return data.audiences[a] || a; }).join(', ') })
    ];
    sources.forEach(function (s, i) {
      meta.push(el('span', {}, [externalLink(i === 0 ? 'Source: ' + shortSourceLabel(s) : 'Also: ' + shortSourceLabel(s), s.url)]));
    });

    var card = el('li', {
      class: 'update' + (isTop ? ' top' : ''),
      'data-status': u.status,
      'data-product': u.product,
      'data-id': u.id,
      'data-search': [u.name, u.summary, u.area, u.note || '', u.status].join(' ').toLowerCase()
    }, [
      el('div', { class: 'update-head' }, [
        el('h4', { text: u.name }),
        statusBadge(u.status)
      ]),
      areaLabel(u),
      el('p', { text: u.summary }),
      u.note ? el('p', { class: 'note', text: u.note }) : null,
      el('div', { class: 'meta' }, meta)
    ]);
    return card;
  }

  function areaLabel(u) {
    var match = (data.areaLogos || []).find(function (a) { return a.product === u.product && a.area === u.area; });
    var img = match && logoImg(match.logo);
    if (img) img.setAttribute('class', 'area-logo');
    return el('p', { class: 'area' }, [img, u.area]);
  }

  function renderPlatforms() {
    var host = document.getElementById('platforms');
    if (!host) return;
    (data.platforms || []).forEach(function (p) {
      var l = data.logos[p.logo];
      var img = logoImg(p.logo);
      if (!l || !img) return;
      var body = [img, el('span', { class: 'pf-text' }, [el('strong', { text: l.name }), el('span', { text: p.label })])];
      host.appendChild(el('li', { class: 'platform' }, [p.href ? el('a', { href: p.href }, body) : el('span', { class: 'pf-static' }, body)]));
    });
  }

  function shortSourceLabel(s) {
    return s.label.replace(/\s*\(.*\)\s*$/, '');
  }

  function renderProductSections() {
    var host = document.getElementById('product-sections');
    data.products.forEach(function (p) {
      var updates = data.updates.filter(function (u) { return u.product === p.id; });
      var top = updates.filter(function (u) { return u.top; });

      var section = el('section', { class: 'product-section', id: p.id, 'data-product': p.id, 'aria-labelledby': p.id + '-title' }, [el('div', { class: 'wrap' }, [
        el('div', { class: 'ps-head' }, [
          icon(p.id),
          el('div', {}, [
            el('p', { class: 'role', text: p.role }),
            el('h2', { id: p.id + '-title', text: p.name }),
            el('p', { class: 'ps-tag', text: p.tagline })
          ]),
          el('div', { class: 'ps-pills', 'aria-label': 'Status counts' }, statusCounts(updates).map(function (c) {
            return el('span', { class: 'badge', 'data-status': c.status, text: c.n + ' ' + c.status });
          }))
        ]),
        el('p', { class: 'ps-summary', text: p.summary }),
        el('div', { class: 'context-grid' }, [
          el('div', { class: 'panel feature' }, [
            el('h3', { text: 'Why it matters' }),
            el('p', { text: p.why })
          ]),
          el('div', { class: 'panel' }, [
            el('h3', { text: 'Who should care' }),
            el('ul', { class: 'audience-list' }, p.audience.map(function (a) {
              return el('li', { text: data.audiences[a] || a });
            }))
          ]),
          el('div', { class: 'panel' }, [
            el('h3', { text: 'Docs and announcements' }),
            el('ul', { class: 'doc-list' }, p.docs.map(function (d) {
              return el('li', {}, [externalLink(d.label, d.url)]);
            }))
          ])
        ]),
        el('h3', { class: 'subheading', id: p.id + '-top', text: 'Top announcements' }),
        el('ul', { class: 'card-grid top-grid', 'aria-labelledby': p.id + '-top' }, top.map(function (u) { return updateCard(u, true); })),
        el('h3', { class: 'subheading', id: p.id + '-all', text: 'All updates' }),
        el('p', { class: 'empty is-hidden', 'data-empty-for': p.id, text: 'No updates match the current filters.' }),
        el('ul', { class: 'card-grid', 'data-list-for': p.id, 'aria-labelledby': p.id + '-all' }, updates.map(function (u) { return updateCard(u, false); }))
      ])]);
      host.appendChild(section);
    });
  }

  function renderCompare() {
    var table = document.getElementById('compare-table');
    var cols = data.compare.columns.map(productById);
    table.appendChild(el('thead', {}, [
      el('tr', {}, [el('th', { scope: 'col', text: 'Aspect' })].concat(cols.map(function (c) {
        return el('th', { scope: 'col', text: c.name, 'data-product': c.id });
      })))
    ]));
    table.appendChild(el('tbody', {}, data.compare.rows.map(function (row) {
      return el('tr', {}, [el('th', { scope: 'row', text: row.label })].concat(row.values.map(function (v) {
        return el('td', { text: v });
      })));
    })));
  }

  function renderGlance() {
    var host = document.getElementById('glance-grid');
    if (!host) return;
    data.products.forEach(function (p) {
      var updates = data.updates.filter(function (u) { return u.product === p.id; });
      var top = updates.filter(function (u) { return u.top; });
      host.appendChild(el('li', { class: 'glance-card', 'data-product': p.id }, [
        el('div', { class: 'gl-head' }, [
          icon(p.id),
          el('div', {}, [
            el('p', { class: 'role', text: p.role }),
            el('h3', {}, [el('a', { href: '#' + p.id, text: p.name })])
          ])
        ]),
        el('p', { class: 'gl-line', text: p.glance || p.tagline }),
        el('div', { class: 'gl-counts', 'aria-label': 'Status counts' }, statusCounts(updates).map(function (c) {
          return el('span', { class: 'badge', 'data-status': c.status, text: c.n + ' ' + c.status });
        })),
        el('h4', { text: 'Top announcements' }),
        el('ul', { class: 'gl-list' }, top.map(function (u) {
          return el('li', {}, [el('span', { text: u.name }), statusBadge(u.status)]);
        })),
        el('h4', { text: 'Who should care' }),
        el('p', { class: 'gl-who', text: p.audience.map(function (a) { return data.audiences[a] || a; }).join(', ') }),
        el('a', { class: 'gl-more', href: '#' + p.id, text: 'Full details for ' + p.name })
      ]));
    });
  }

  function renderGetStarted() {
    var host = document.getElementById('start-grid');
    data.getStarted.forEach(function (group) {
      host.appendChild(el('div', { class: 'panel' }, [
        el('h3', { text: group.title }),
        el('ul', { class: 'doc-list' }, group.links.map(function (l) {
          return el('li', {}, [externalLink(l.label, l.url)]);
        }))
      ]));
    });
  }

  function renderSources() {
    var host = document.getElementById('source-list');
    data.sources.forEach(function (s) {
      host.appendChild(el('li', {}, [externalLink(s.label, s.url)]));
    });
  }

  function renderLegend() {
    var host = document.getElementById('status-legend');
    STATUSES.forEach(function (s) {
      host.appendChild(el('div', {}, [
        el('dt', {}, [statusBadge(s)]),
        el('dd', { text: data.meta.statusLegend[s] })
      ]));
    });
  }

  function chip(name, value, label, onChange) {
    var input = el('input', { type: 'checkbox', name: name, value: value });
    input.addEventListener('change', function () { onChange(value, input.checked); });
    return el('label', { class: 'chip' }, [input, el('span', { text: label })]);
  }

  function renderFilters() {
    var productHost = document.getElementById('product-filter');
    data.products.forEach(function (p) {
      productHost.appendChild(chip('product', p.id, p.name.replace('Microsoft ', ''), function (v, on) {
        on ? state.products.add(v) : state.products.delete(v);
        applyFilters();
      }));
    });
    var statusHost = document.getElementById('status-filter');
    STATUSES.forEach(function (s) {
      statusHost.appendChild(chip('status', s, s, function (v, on) {
        on ? state.statuses.add(v) : state.statuses.delete(v);
        applyFilters();
      }));
    });
    document.getElementById('q').addEventListener('input', function (e) {
      state.q = e.target.value.trim().toLowerCase();
      applyFilters();
    });
    document.getElementById('filters').addEventListener('reset', function () {
      state = { q: '', products: new Set(), statuses: new Set() };
      setTimeout(applyFilters, 0);
    });
  }

  function matches(card) {
    var product = card.getAttribute('data-product');
    var status = card.getAttribute('data-status');
    if (state.products.size && !state.products.has(product)) return false;
    if (state.statuses.size && !state.statuses.has(status)) return false;
    if (state.q) {
      var haystack = card.getAttribute('data-search');
      return state.q.split(/\s+/).every(function (term) { return haystack.indexOf(term) !== -1; });
    }
    return true;
  }

  function applyFilters() {
    var total = 0;
    data.products.forEach(function (p) {
      var list = document.querySelector('[data-list-for="' + p.id + '"]');
      var section = document.getElementById(p.id);
      var visible = 0;
      list.querySelectorAll('.update').forEach(function (card) {
        var show = matches(card);
        card.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });
      document.querySelector('[data-empty-for="' + p.id + '"]').classList.toggle('is-hidden', visible !== 0);
      section.classList.toggle('is-hidden', state.products.size > 0 && !state.products.has(p.id));
      total += state.products.size === 0 || state.products.has(p.id) ? visible : 0;
    });
    var filtering = state.q || state.products.size || state.statuses.size;
    var firstShown = data.products.filter(function (p) {
      return document.querySelector('[data-list-for="' + p.id + '"] .update:not(.is-hidden)') &&
        (!state.products.size || state.products.has(p.id));
    })[0];
    var jump = document.getElementById('jump-results');
    jump.classList.toggle('is-hidden', !(filtering && firstShown));
    if (firstShown) jump.setAttribute('href', '#' + firstShown.id);
    document.getElementById('result-count').textContent = filtering
      ? total + ' of ' + data.updates.length + ' updates match your filters.'
      : data.updates.length + ' updates across ' + data.products.length + ' products.';
  }

  function renderNavSpy() {
    if (!('IntersectionObserver' in window)) return;
    var links = {};
    document.querySelectorAll('#nav-list a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].removeAttribute('aria-current'); });
        var link = links[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(links).forEach(function (id) {
      var target = document.getElementById(id);
      if (target) observer.observe(target);
    });
  }

  function showError(message) {
    var main = document.getElementById('main');
    main.insertBefore(el('div', { class: 'wrap section' }, [el('p', { class: 'notice', role: 'alert', text: message })]), main.firstChild);
  }

  fetch('data/updates.json?v=20261126b', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (json) {
      data = json;
      renderHeader();
      renderKpis();
      renderProductCards();
      renderPlatforms();
      renderProductSections();
      renderCompare();
      renderGetStarted();
      renderGlance();
      renderSources();
      renderLegend();
      renderFilters();
      applyFilters();
      renderNavSpy();
    })
    .catch(function (err) {
      showError('Could not load data/updates.json (' + err.message + '). If you opened index.html directly from disk, serve the folder with a local web server instead.');
    });
})();
