#!/usr/bin/env node
// Validates data/updates.json and (unless --offline) checks that every URL resolves.
// Usage: node scripts/check.mjs [--offline]
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const offline = process.argv.includes('--offline');
const STATUSES = ['GA', 'Preview', 'Coming soon', 'Announced'];
const errors = [];
const fail = (msg) => errors.push(msg);

const data = JSON.parse(await readFile(path.join(root, 'data/updates.json'), 'utf8'));
const productIds = new Set(data.products.map((p) => p.id));
const sourceIds = new Set(data.sources.map((s) => s.id));
const audienceIds = new Set(Object.keys(data.audiences));
const seen = new Set();

for (const u of data.updates) {
  const where = `update "${u.id}"`;
  if (seen.has(u.id)) fail(`${where}: duplicate id`);
  seen.add(u.id);
  for (const key of ['name', 'summary', 'area', 'product', 'status', 'source', 'audience']) {
    if (!u[key] || (Array.isArray(u[key]) && !u[key].length)) fail(`${where}: missing ${key}`);
  }
  if (!productIds.has(u.product)) fail(`${where}: unknown product ${u.product}`);
  if (!STATUSES.includes(u.status)) fail(`${where}: invalid status ${u.status}`);
  if (!sourceIds.has(u.source)) fail(`${where}: unknown source ${u.source}`);
  for (const a of u.also || []) if (!sourceIds.has(a)) fail(`${where}: unknown also-source ${a}`);
  for (const a of u.audience || []) if (!audienceIds.has(a)) fail(`${where}: unknown audience ${a}`);
}

for (const p of data.products) {
  const top = data.updates.filter((u) => u.product === p.id && u.top).length;
  if (top < 3 || top > 5) fail(`product ${p.id}: expected 3–5 top announcements, found ${top}`);
}
for (const k of data.meta.keyNumbers || []) {
  if (!sourceIds.has(k.source)) fail(`keyNumber "${k.value}": unknown source ${k.source}`);
  if (!productIds.has(k.product)) fail(`keyNumber "${k.value}": unknown product ${k.product}`);
}
for (const col of data.compare.columns) if (!productIds.has(col)) fail(`compare: unknown column ${col}`);
for (const row of data.compare.rows) {
  if (row.values.length !== data.compare.columns.length) fail(`compare row "${row.label}": wrong number of values`);
}

const urls = new Map();
const addUrl = (url, label) => {
  if (!/^https:\/\//.test(url)) fail(`${label}: URL must be https (${url})`);
  urls.set(url, label);
};
data.sources.forEach((s) => addUrl(s.url, `source ${s.id}`));
data.products.forEach((p) => p.docs.forEach((d) => addUrl(d.url, `${p.id} doc "${d.label}"`)));
data.getStarted.forEach((g) => g.links.forEach((l) => addUrl(l.url, `getStarted "${l.label}"`)));

if (!offline) {
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
  const warnings = [];
  const check = async ([url, label]) => {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      if (res.status === 404 || res.status === 410 || res.status >= 500) fail(`${label}: ${res.status} ${url}`);
      else if (res.status >= 400) warnings.push(`${label}: ${res.status} (not verifiable automatically) ${url}`);
    } catch (e) {
      fail(`${label}: ${e.message} ${url}`);
    }
  };
  const entries = [...urls.entries()];
  for (let i = 0; i < entries.length; i += 6) await Promise.all(entries.slice(i, i + 6).map(check));
  warnings.forEach((w) => console.warn('warn:', w));
}

if (errors.length) {
  errors.forEach((e) => console.error('error:', e));
  process.exit(1);
}
console.log(`OK: ${data.updates.length} updates, ${urls.size} unique URLs${offline ? ' (links not checked)' : ' checked'}.`);
