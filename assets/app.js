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
    return /^https:\/\//i.test(url) ? url : '#';
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

  function renderProductCards() {
    var list = document.getElementById('product-cards');
    data.products.forEach(function (p) {
      var updates = data.updates.filter(function (u) { return u.product === p.id; });
      list.appendChild(el('li', { class: 'product-card', 'data-product': p.id }, [
        el('span', { class: 'role', text: p.role }),
        el('h3', {}, [el('a', { href: '#' + p.id, text: p.name })]),
        el('p', { text: p.tagline }),
        el('p', { class: 'count', text: updates.length + ' updates: ' + statusSummary(updates) })
      ]));
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
      el('p', { class: 'area', text: u.area }),
      el('p', { text: u.summary }),
      u.note ? el('p', { class: 'note', text: u.note }) : null,
      el('div', { class: 'meta' }, meta)
    ]);
    return card;
  }

  function shortSourceLabel(s) {
    return s.label.replace(/\s*\(.*\)\s*$/, '');
  }

  function renderProductSections() {
    var host = document.getElementById('product-sections');
    data.products.forEach(function (p) {
      var updates = data.updates.filter(function (u) { return u.product === p.id; });
      var top = updates.filter(function (u) { return u.top; });

      var section = el('section', { class: 'wrap product-section', id: p.id, 'data-product': p.id, 'aria-labelledby': p.id + '-title' }, [
        el('div', { class: 'product-header' }, [
          el('p', { class: 'role', text: p.role }),
          el('h2', { id: p.id + '-title', text: p.name }),
          el('p', { class: 'tagline', text: p.tagline })
        ]),
        el('p', { text: p.summary }),
        el('div', { class: 'context-grid' }, [
          el('div', { class: 'panel' }, [
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
        el('ul', { class: 'card-grid', 'aria-labelledby': p.id + '-top' }, top.map(function (u) { return updateCard(u, true); })),
        el('h3', { class: 'subheading', id: p.id + '-all', text: 'All updates' }),
        el('p', { class: 'empty is-hidden', 'data-empty-for': p.id, text: 'No updates match the current filters.' }),
        el('ul', { class: 'card-grid', 'data-list-for': p.id, 'aria-labelledby': p.id + '-all' }, updates.map(function (u) { return updateCard(u, false); }))
      ]);
      host.appendChild(section);
    });
  }

  function renderCompare() {
    var table = document.getElementById('compare-table');
    var cols = data.compare.columns.map(productById);
    table.appendChild(el('thead', {}, [
      el('tr', {}, [el('th', { scope: 'col', text: 'Aspect' })].concat(cols.map(function (c) {
        return el('th', { scope: 'col', text: c.name });
      })))
    ]));
    table.appendChild(el('tbody', {}, data.compare.rows.map(function (row) {
      return el('tr', {}, [el('th', { scope: 'row', text: row.label })].concat(row.values.map(function (v) {
        return el('td', { text: v });
      })));
    })));
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
    document.getElementById('result-count').textContent = filtering
      ? total + ' of ' + data.updates.length + ' updates match your filters.'
      : data.updates.length + ' updates across ' + data.products.length + ' products.';
  }

  function showError(message) {
    var main = document.getElementById('main');
    main.insertBefore(el('div', { class: 'wrap section' }, [el('p', { class: 'notice', role: 'alert', text: message })]), main.firstChild);
  }

  fetch('data/updates.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (json) {
      data = json;
      renderHeader();
      renderProductCards();
      renderProductSections();
      renderCompare();
      renderGetStarted();
      renderSources();
      renderLegend();
      renderFilters();
      applyFilters();
    })
    .catch(function (err) {
      showError('Could not load data/updates.json (' + err.message + '). If you opened index.html directly from disk, serve the folder with a local web server instead.');
    });
})();
