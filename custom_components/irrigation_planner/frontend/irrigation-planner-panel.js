import { i as Ue, n as H, r as f, a as he, D as ne, f as V, b as o, c as D, A as p, p as ot, w as b, t as pe, E as De } from "./operation-data-BCE0dVwo.js";
const C = 6378137, qe = 256, le = Math.PI * C;
function Je(e, t) {
  const s = Math.max(0, Math.min(360, t));
  return Math.PI * e * e * s / 360;
}
function ee(e) {
  if (e.length < 3) return 0;
  let t = 0;
  for (let s = 0; s < e.length; s++) {
    const [n, i] = e[s], [a, r] = e[(s + 1) % e.length];
    t += n * r - a * i;
  }
  return Math.abs(t) / 2;
}
function I(e, t, s) {
  const n = s * Math.PI / 180;
  return [e[0] + Math.sin(n) * t, e[1] - Math.cos(n) * t];
}
function ce(e, t) {
  return (Math.atan2(t[0] - e[0], -(t[1] - e[1])) * 180 / Math.PI + 360) % 360;
}
function M(e, t) {
  return Math.hypot(e[0] - t[0], e[1] - t[1]);
}
function Te(e, t, s, n) {
  const [i, a] = e;
  if (n >= 360)
    return `M ${i - t} ${a} a ${t} ${t} 0 1 0 ${2 * t} 0 a ${t} ${t} 0 1 0 ${-2 * t} 0 Z`;
  const [r, l] = I(e, t, s), [c, d] = I(e, t, s + n), m = n > 180 ? 1 : 0;
  return `M ${i} ${a} L ${r} ${l} A ${t} ${t} 0 ${m} 1 ${c} ${d} Z`;
}
function me(e) {
  const t = e.length || 1;
  return [e.reduce((s, n) => s + n[0], 0) / t, e.reduce((s, n) => s + n[1], 0) / t];
}
function ve(e, t) {
  return 2 * Math.PI * C * Math.cos(e * Math.PI / 180) / (qe * 2 ** t);
}
function Ee(e, t) {
  return Math.log2(
    2 * Math.PI * C * Math.cos(e * Math.PI / 180) * t / qe
  );
}
function Ae(e, t, s) {
  const [n, i] = s, a = Math.PI / 180;
  return [
    (t - i) * a * C * Math.cos(n * a),
    -(e - n) * a * C
  ];
}
function lt(e, t) {
  const [s, n] = t, i = 180 / Math.PI;
  return [
    s - e[1] / C * i,
    n + e[0] / (C * Math.cos(s / i)) * i
  ];
}
function Oe(e, t, s, n, i = 200) {
  const [a, r] = t, l = Math.PI / 180, c = 1 / Math.cos(a * l), d = C * r * l, m = C * Math.log(Math.tan(Math.PI / 4 + a * l / 2)), u = 2 ** n, v = 2 * le / u, S = (P) => (d + P * c + le) / v, h = (P) => (le - (m - P * c)) / v, g = Math.max(0, Math.floor(S(s.x0))), $ = Math.min(u - 1, Math.floor(S(s.x1))), _ = Math.max(0, Math.floor(h(s.y0))), z = Math.min(u - 1, Math.floor(h(s.y1))), x = [];
  if (($ - g + 1) * (z - _ + 1) > i) return x;
  for (let P = _; P <= z; P++)
    for (let T = g; T <= $; T++) {
      const L = T * v - le, J = le - P * v;
      x.push({
        url: e.replace("{z}", String(n)).replace("{x}", String(T)).replace("{y}", String(P)),
        key: `${n}/${T}/${P}`,
        x: (L - d) / c,
        y: (m - J) / c,
        size: v / c
      });
    }
  return x;
}
function ct(e, t, s) {
  let n = null, i = s;
  for (const a of t) {
    const r = M(e, a);
    r <= i && (n = a, i = r);
  }
  return n;
}
function re(e, t = !1) {
  let s = 0;
  for (let n = 1; n < e.length; n++) s += M(e[n - 1], e[n]);
  return t && e.length > 2 && (s += M(e[e.length - 1], e[0])), s;
}
function dt(e, t) {
  const s = t ? e.length : e.length - 1, n = [];
  for (let i = 0; i < s; i++) n.push(M(e[i], e[(i + 1) % e.length]));
  return n;
}
function ht(e, t, s) {
  const n = (t + 1) % e.length, i = e[t], a = e[n], r = M(i, a);
  if (!(s > 0) || r === 0) return e;
  const l = s / r, c = [i[0] + (a[0] - i[0]) * l, i[1] + (a[1] - i[1]) * l];
  return e.map((d, m) => m === n ? c : d);
}
function Ye(e, t) {
  return e.length < 2 || t <= 0 ? 0 : re(e) * 2 * t + Math.PI * t * t;
}
function pt(e, t) {
  let s = re(e) * Math.max(0, Math.min(1, t));
  for (let n = 1; n < e.length; n++) {
    const i = M(e[n - 1], e[n]);
    if (s <= i && i > 0) {
      const a = s / i;
      return [
        e[n - 1][0] + (e[n][0] - e[n - 1][0]) * a,
        e[n - 1][1] + (e[n][1] - e[n - 1][1]) * a
      ];
    }
    s -= i;
  }
  return e[e.length - 1];
}
function ut(e, t) {
  let s = Number.POSITIVE_INFINITY;
  for (let n = 1; n < t.length; n++) {
    const [i, a] = [t[n - 1], t[n]], r = a[0] - i[0], l = a[1] - i[1], c = r * r + l * l, d = c === 0 ? 0 : Math.max(0, Math.min(1, ((e[0] - i[0]) * r + (e[1] - i[1]) * l) / c));
    s = Math.min(s, Math.hypot(e[0] - (i[0] + d * r), e[1] - (i[1] + d * l)));
  }
  return s;
}
function We(e, t) {
  let s = 1;
  for (let r = 2; r < e.length; r++)
    M(e[r - 1], e[r]) > M(e[s - 1], e[s]) && (s = r);
  const [n, i] = [e[s - 1], e[s]], a = M(n, i) || 1;
  return [(n[0] + i[0]) / 2 + (i[1] - n[1]) / a * t, (n[1] + i[1]) / 2 - (i[0] - n[0]) / a * t];
}
function Le(e, t) {
  if (e.length < 2) return "";
  const s = (a) => Math.round(a * 1e3) / 1e3;
  let n = `M${s(e[0][0])} ${s(e[0][1])}`;
  for (let a = 1; a < e.length - 1; a++) {
    const [r, l, c] = [e[a - 1], e[a], e[a + 1]], d = M(r, l), m = M(l, c), u = Math.min(t, d / 2, m / 2);
    if (u <= 0) {
      n += ` L${s(l[0])} ${s(l[1])}`;
      continue;
    }
    const v = [l[0] + (r[0] - l[0]) / d * u, l[1] + (r[1] - l[1]) / d * u], S = [l[0] + (c[0] - l[0]) / m * u, l[1] + (c[1] - l[1]) / m * u];
    n += ` L${s(v[0])} ${s(v[1])} Q${s(l[0])} ${s(l[1])} ${s(S[0])} ${s(S[1])}`;
  }
  const i = e[e.length - 1];
  return `${n} L${s(i[0])} ${s(i[1])}`;
}
function Xe(e, t, s) {
  const n = s[0] - t[0], i = s[1] - t[1], a = n * n + i * i, r = a === 0 ? 0 : Math.max(0, Math.min(1, ((e[0] - t[0]) * n + (e[1] - t[1]) * i) / a));
  return [t[0] + r * n, t[1] + r * i];
}
function Qe(e, t, s) {
  let n = null, i = s;
  for (const a of t)
    for (let r = 1; r < a.length; r++) {
      const l = Xe(e, a[r - 1], a[r]), c = M(e, l);
      c <= i && (i = c, n = l);
    }
  return n;
}
function mt(e, t = 0.05) {
  const s = [];
  return e.forEach((n, i) => {
    for (const a of [n[0], n[n.length - 1]]) {
      if (!a) continue;
      const r = e.filter((c, d) => d !== i);
      Qe(a, r, t) && !s.some((c) => M(c, a) < t) && s.push(a);
    }
  }), s;
}
function gt(e, t, s, n = 0.3) {
  const i = (g) => `${g[0].toFixed(2)},${g[1].toFixed(2)}`, a = e.flatMap((g) => [g[0], g[g.length - 1]]), r = e.map((g) => {
    const $ = [g[0]];
    for (let _ = 1; _ < g.length; _++) {
      const [z, x] = [g[_ - 1], g[_]], P = a.filter((T) => M(Xe(T, z, x), T) < 0.05 && M(T, z) > 0.05 && M(T, x) > 0.05).sort((T, L) => M(z, T) - M(z, L));
      $.push(...P, x);
    }
    return $;
  }), l = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), d = (g, $) => {
    const [_, z] = [i(g), i($)];
    l.set(_, g), l.set(z, $), c.has(_) || c.set(_, /* @__PURE__ */ new Set()), c.has(z) || c.set(z, /* @__PURE__ */ new Set()), c.get(_).add(z), c.get(z).add(_);
  };
  for (const g of r) for (let $ = 1; $ < g.length; $++) d(g[$ - 1], g[$]);
  const m = (g) => [...l.entries()].filter(([, $]) => M($, g) <= n).map(([$]) => $), u = new Set(m(s));
  if (!u.size) return [];
  const v = t.flatMap(m), S = /* @__PURE__ */ new Map(), h = [];
  for (const g of v)
    S.has(g) || (S.set(g, null), h.push(g));
  for (; h.length; ) {
    const g = h.shift();
    if (u.has(g)) {
      const $ = [];
      let _ = g;
      for (; _ && S.get(_); ) {
        const z = S.get(_);
        $.unshift([l.get(z), l.get(_)]), _ = z;
      }
      return $;
    }
    for (const $ of c.get(g) ?? [])
      S.has($) || (S.set($, g), h.push($));
  }
  return [];
}
const X = {
  building: { label: "Gebäude", icon: "mdi:home-outline", family: "area" },
  paving: { label: "Terrasse / Weg", icon: "mdi:texture-box", family: "area" },
  water: { label: "Teich / Pool", icon: "mdi:waves", family: "area" },
  area: { label: "Sonstige Fläche", icon: "mdi:vector-square", family: "area" },
  soil: { label: "Bodenfläche", icon: "mdi:layers-triple-outline", family: "area" },
  fence: { label: "Zaun", icon: "mdi:fence", family: "line" },
  hedge: { label: "Hecke", icon: "mdi:leaf", family: "line" },
  boundary: { label: "Grundstücksgrenze", icon: "mdi:vector-polyline", family: "line" },
  pipe: { label: "Zuleitung", icon: "mdi:pipe", family: "line" },
  tree: { label: "Baum / Strauch", icon: "mdi:tree-outline", family: "point" },
  label: { label: "Beschriftung", icon: "mdi:format-text", family: "point" },
  tap: { label: "Wasserhahn", icon: "mdi:water-pump", family: "point" }
}, ft = 60;
function G(e) {
  return X[e]?.family ?? "area";
}
function Y(e) {
  return e.kind === "label" && e.label ? e.label : e.label || X[e.kind]?.label || e.kind;
}
function bt(e) {
  const t = new Set(e.map((n) => n.id));
  let s = e.length + 1;
  for (; t.has(`f${s}`); ) s++;
  return `f${s}`;
}
const $e = {
  sand: "#e9d8a6",
  loamy_sand: "#dcc28c",
  sandy_loam: "#c9a46c",
  loam: "#a9825a",
  silt_loam: "#c4a27a",
  clay_loam: "#8e6a4f",
  clay: "#6f5443"
};
function vt(e) {
  const t = e.filter((s) => s.kind === "boundary" && s.points.length >= 3);
  return t.length ? t.reduce((s, n) => s + ee(n.points), 0) : null;
}
const $t = "Suche: © OpenStreetMap-Mitwirkende";
async function yt(e, t, s = "de") {
  if (t.trim().length < 3) throw new Error("Bitte mindestens 3 Zeichen eingeben");
  return (await e({
    type: "irrigation_planner/geocode",
    query: t.trim(),
    language: s
  })).places ?? [];
}
const be = Ue`
  :host {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: var(--primary-background-color, #fafafa);
    color: var(--primary-text-color, #212121);
    font-family: var(--paper-font-body1_-_font-family, Roboto, "Noto Sans", sans-serif);
    --accent: var(--primary-color, #03a9f4);
    --card: var(--card-background-color, #fff);
    --line: var(--divider-color, rgba(0, 0, 0, 0.12));
    --muted: var(--secondary-text-color, #727272);
    --warn: var(--warning-color, #ffa600);
    --bad: var(--error-color, #db4437);
    --ok: var(--success-color, #43a047);
    --radius: var(--ha-card-border-radius, 12px);
  }
  ha-icon {
    --mdc-icon-size: 20px;
  }

  /* Kopfzeile */
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--header-height, 56px);
    padding: 0 12px;
    background: var(--app-header-background-color, var(--primary-color));
    color: var(--app-header-text-color, #fff);
    border-bottom: var(--app-header-border-bottom, none);
    flex-shrink: 0;
    box-sizing: border-box;
  }
  header .logo {
    width: 32px;
    height: 32px;
    margin-right: 8px;
    flex: none;
  }
  :host([narrow]) header .logo {
    display: none;
  }
  header .title {
    font-size: 20px;
    font-weight: 400;
    margin-left: 4px;
    white-space: nowrap;
  }
  header .menu {
    display: none;
  }
  :host([narrow]) header .menu {
    display: inline-flex;
  }
  header .spacer {
    flex: 1;
  }
  header button.icon,
  header button.text {
    color: inherit;
  }
  header button:disabled {
    opacity: 0.45;
  }
  header button.primary {
    background: rgba(255, 255, 255, 0.18);
    color: inherit;
  }
  header button.primary:not(:disabled) {
    background: var(--card);
    color: var(--accent);
  }
  .menu-wrap {
    position: relative;
  }
  .popup-menu {
    position: absolute;
    right: 0;
    top: 44px;
    z-index: 20;
    min-width: 250px;
    padding: 6px;
    background: var(--card);
    color: var(--primary-text-color);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
  }
  .popup-menu button,
  .popup-menu .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    color: var(--primary-text-color);
    font-size: 14px;
    cursor: pointer;
    text-align: left;
  }
  .popup-menu button:hover,
  .popup-menu .menu-item:hover {
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
  .menu-item input {
    display: none;
  }
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    background: rgba(0, 0, 0, 0.4);
    display: grid;
    place-items: center;
    padding: 16px;
  }
  .dialog {
    width: min(480px, 100%);
    background: var(--card);
    color: var(--primary-text-color);
    border-radius: 16px;
    padding: 20px 20px 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dialog h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
  }
  .dialog p {
    margin: 0;
    line-height: 1.4;
  }
  .dialog small {
    color: var(--muted);
  }
  .chips {
    display: flex;
    gap: 6px;
    margin-left: 12px;
    overflow: hidden;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px 3px 6px;
    border-radius: 999px;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.16);
    white-space: nowrap;
  }
  .chip ha-icon {
    --mdc-icon-size: 16px;
  }
  button.chip.toggle {
    color: inherit;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid transparent;
  }
  button.chip.toggle:hover {
    border-color: currentColor;
  }
  .chip.alarm {
    background: var(--bad);
    color: #fff;
  }
  .chip.winter {
    background: #90caf9;
    color: #0d47a1;
  }
  :host([narrow]) .chips {
    display: none;
  }

  /* Knöpfe */
  button {
    font: inherit;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    background: none;
    color: var(--accent);
    transition: background 0.15s;
  }
  button:disabled {
    cursor: default;
    opacity: 0.5;
  }
  button.icon {
    width: 40px;
    height: 40px;
    justify-content: center;
    color: var(--primary-text-color);
  }
  button.icon.small {
    width: 30px;
    height: 30px;
  }
  button.icon.lock {
    color: var(--muted);
    opacity: 0.6;
  }
  button.icon.lock.on {
    color: var(--accent);
    opacity: 1;
  }
  .list-head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .list-head .spacer {
    flex: 1;
  }
  button.icon:hover:not(:disabled),
  button.text:hover:not(:disabled) {
    background: color-mix(in srgb, currentColor 10%, transparent);
  }
  button.text {
    padding: 7px 12px;
    font-weight: 500;
    font-size: 14px;
  }
  button.text.small {
    padding: 4px 10px;
    font-size: 13px;
  }
  button.text.danger {
    color: var(--bad);
  }
  button.primary {
    padding: 8px 16px;
    font-weight: 500;
    background: var(--accent);
    color: var(--text-primary-color, #fff);
  }

  /* Aufteilung */
  .layout {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }
  .stage {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    background: var(--secondary-background-color, #e5e5e5);
    touch-action: none;
  }
  .side {
    width: 360px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--card);
    border-left: 1px solid var(--line);
    min-height: 0;
  }
  :host([narrow]) .layout {
    flex-direction: column;
  }
  :host([narrow]) .stage {
    flex: none;
    height: 58vh;
  }
  :host([narrow]) .side {
    width: auto;
    flex: 1;
    border-left: none;
    border-top: 1px solid var(--line);
  }
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--line);
  }
  .tabs button {
    flex: 1;
    justify-content: center;
    border-radius: 0;
    padding: 14px 8px 12px;
    color: var(--muted);
    border-bottom: 2px solid transparent;
    font-weight: 500;
  }
  .tabs button.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .side-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px 24px;
  }
  h3 {
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin: 20px 4px 8px;
  }
  .hint {
    color: var(--muted);
    line-height: 1.45;
    margin: 12px 4px;
  }
  .hint.small {
    font-size: 12.5px;
  }
  .note {
    font-size: 13px;
    line-height: 1.45;
    padding: 8px 12px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    margin: 8px 0;
  }
  .note.warn {
    background: color-mix(in srgb, var(--warn) 18%, transparent);
  }

  /* Liste der Zonen */
  .list {
    list-style: none;
    padding: 0;
    margin: 4px 0;
  }
  .item {
    border-radius: 10px;
    margin: 2px 0;
    transition: background 0.15s;
  }
  .item.open {
    background: color-mix(in srgb, var(--zone, var(--accent)) 9%, transparent);
    box-shadow: inset 3px 0 0 var(--zone, var(--accent));
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 8px;
    cursor: pointer;
    border-radius: 10px;
  }
  .row:hover {
    background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--zone);
    flex-shrink: 0;
  }
  .row ha-icon {
    color: var(--muted);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
  .name small {
    display: block;
    color: var(--muted);
    font-weight: 400;
    font-size: 12px;
  }
  .meta {
    color: var(--muted);
    font-size: 13px;
    white-space: nowrap;
  }
  .meta em {
    font-style: normal;
    opacity: 0.8;
  }
  .badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .badge.running {
    background: var(--accent);
    color: #fff;
  }
  .badge.queued {
    background: color-mix(in srgb, var(--accent) 20%, transparent);
    color: var(--accent);
  }
  .badge.locked {
    background: var(--bad);
    color: #fff;
  }
  .marker-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    background: #455a64;
    border-radius: 6px;
  }
  .marker-icon.sensor {
    border-radius: 50%;
    background: #8d6e63;
  }
  .inspector {
    padding: 0 12px 12px 30px;
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    margin: 0 0 8px;
    font-size: 13.5px;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
  }
  dd.warn {
    color: var(--bad);
  }
  .reason {
    color: var(--muted);
    font-size: 12px;
  }
  .fields {
    display: flex;
    gap: 8px;
    margin: 8px 0 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: var(--muted);
    gap: 3px;
    position: relative;
    flex: 1;
    min-width: 0;
  }
  .field.wide {
    margin: 8px 0;
  }
  .field .unit {
    position: absolute;
    right: 10px;
    bottom: 9px;
    font-size: 13px;
  }
  input,
  select {
    font: inherit;
    font-size: 14px;
    color: var(--primary-text-color);
    background: var(--input-fill-color, color-mix(in srgb, var(--primary-text-color) 5%, transparent));
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 8px 10px;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
  }
  input:focus,
  select:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
  .field input {
    padding-right: 26px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
  }
  .actions .spacer {
    flex: 1;
  }

  /* Hintergrund */
  .choices {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }
  .choice {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 12px 14px;
    gap: 14px;
    color: var(--primary-text-color);
    text-align: left;
  }
  .choice ha-icon {
    --mdc-icon-size: 26px;
    color: var(--muted);
  }
  .choice span {
    display: flex;
    flex-direction: column;
  }
  .choice small {
    color: var(--muted);
    font-size: 12.5px;
    margin-top: 2px;
  }
  .choice.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
  .choice.active ha-icon {
    color: var(--accent);
  }
  .upload {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--text-primary-color, #fff);
    font-weight: 500;
    cursor: pointer;
  }
  .upload input {
    display: none;
  }

  /* Plan */
  svg.plan {
    display: block;
    user-select: none;
    -webkit-user-select: none;
  }
  .map-fill {
    fill: #dfe3d9;
  }
  .grid-layer .grid {
    stroke: color-mix(in srgb, var(--primary-text-color) 7%, transparent);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .grid-layer .grid.major {
    stroke: color-mix(in srgb, var(--primary-text-color) 15%, transparent);
  }
  .grid-layer.faint {
    opacity: 0.5;
  }
  /* Grundriss: ruhige Farben, damit die Zonen im Vordergrund bleiben */
  .feature {
    vector-effect: non-scaling-stroke;
    cursor: pointer;
  }
  polygon.feature {
    stroke-width: 1.5;
    stroke-linejoin: round;
  }
  /* Nur leicht eingefärbt: Das Luftbild darunter bleibt sichtbar. */
  polygon.feature.building {
    fill: rgba(109, 101, 93, 0.22);
    stroke: #5d554d;
  }
  polygon.feature.paving {
    fill: rgba(196, 170, 140, 0.22);
    stroke: #8d7b68;
  }
  polygon.feature.water {
    fill: rgba(63, 143, 196, 0.25);
    stroke: #3f8fc4;
  }
  polygon.feature.area {
    fill: rgba(120, 120, 120, 0.12);
    stroke: #8a8a8a;
    stroke-dasharray: 6 4;
  }
  g.feature polyline {
    fill: none;
    vector-effect: non-scaling-stroke;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  g.feature polyline.hit {
    stroke: transparent;
    vector-effect: none;
  }
  g.feature.fence polyline:not(.hit) {
    stroke: #6d4c41;
    stroke-width: 2;
    stroke-dasharray: 7 3;
  }
  g.feature.hedge polyline:not(.hit) {
    stroke: #4f7f2a;
    stroke-width: 7;
    stroke-opacity: 0.8;
  }
  g.feature.boundary polyline:not(.hit) {
    stroke: #c0392b;
    stroke-width: 2;
    stroke-dasharray: 12 4 3 4;
  }
  g.feature.pipe polyline:not(.hit) {
    stroke: #1e88e5;
    stroke-width: 3.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  g.feature.tree circle {
    fill: rgba(67, 160, 71, 0.2);
    stroke: #2e7d32;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
  g.feature.tree circle.trunk {
    fill: #5d4037;
    stroke: none;
  }
  g.feature.tap circle {
    fill: #1e88e5;
    stroke: #fff;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
  g.feature.tap text {
    fill: #fff;
    font-weight: 700;
    text-anchor: middle;
    pointer-events: none;
  }
  text.feature-name {
    fill: #4e4740;
    stroke: rgba(255, 255, 255, 0.7);
    paint-order: stroke;
    stroke-linejoin: round;
    text-anchor: middle;
    pointer-events: none;
  }
  text.feature.label {
    fill: var(--primary-text-color);
    stroke: var(--card);
    paint-order: stroke;
    stroke-linejoin: round;
    text-anchor: middle;
    font-style: italic;
  }
  polygon.feature.selected,
  g.feature.selected polyline:not(.hit),
  g.feature.selected circle:not(.trunk) {
    stroke: var(--accent);
    stroke-width: 3;
  }
  text.feature.selected {
    fill: var(--accent);
  }
  .zone polyline.hose-band {
    fill: none;
    stroke: color-mix(in srgb, var(--zone) 14%, transparent);
    stroke-linecap: round;
    stroke-linejoin: round;
    cursor: pointer;
  }
  .zone:hover polyline.hose-band,
  .zone.selected polyline.hose-band {
    stroke: color-mix(in srgb, var(--zone) 24%, transparent);
  }
  .zone polyline.hose-reach {
    fill: none;
    stroke: var(--zone);
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.9;
    pointer-events: none;
  }
  .zone .hose-end {
    fill: var(--zone);
    stroke: #fff;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .banner label.inline {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
  }
  .banner label.inline input {
    width: 64px;
    padding: 2px 4px;
  }
  .zone polyline.hose-line {
    fill: none;
    stroke: var(--zone);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .zone.running polyline.hose-line {
    stroke-dasharray: 10 6;
    animation: flow 0.9s linear infinite;
  }
  /* Seiten Plan / Übersicht in der Kopfzeile */
  .pages {
    display: flex;
    gap: 2px;
    margin-left: 16px;
    background: color-mix(in srgb, currentColor 8%, transparent);
    border-radius: 999px;
    padding: 3px;
  }
  .pages button {
    color: inherit;
    padding: 5px 14px;
    font-size: 14px;
    gap: 6px;
  }
  .pages button.active {
    background: var(--card);
    color: var(--accent);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }
  :host([narrow]) .pages button {
    padding: 5px 10px;
  }
  :host([narrow]) .pages .label {
    display: none;
  }
  :host([narrow]) .pages {
    margin-left: 8px;
  }

  /* Nässekarte */
  svg.plan.wet .zone path,
  svg.plan.wet .zone polygon,
  svg.plan.wet .zone polyline.hose-band {
    fill: none;
    stroke-width: 1.5;
  }
  svg.plan.wet .zone polyline.hose-band {
    stroke: none;
  }
  svg.plan.wet .zone.nowet path,
  svg.plan.wet .zone.nowet polygon {
    fill: url(#wet-hatch);
  }
  svg.plan.wet .zone.nowet polyline.hose-band {
    stroke: url(#wet-hatch);
    stroke-width: calc(var(--band) * 1px);
  }
  svg.plan.wet .zone.nowet .label .sub {
    fill: var(--bad);
  }
  .wet-legend .keys {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .wet-legend .swatch.none {
    display: inline-block;
    width: 12px;
    height: 10px;
    background: rgba(150, 150, 150, 0.35);
    border: 1px solid var(--muted);
  }
  .wet-legend .howto summary {
    cursor: pointer;
    font-size: 12.5px;
    color: var(--accent);
  }
  .wet-legend .ticks span:last-of-type {
    text-align: right;
  }
  .raster {
    pointer-events: none;
  }
  .wet-missing {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .wet-legend .hatch {
    display: inline-block;
    width: 12px;
    height: 10px;
    margin-right: 6px;
    vertical-align: -1px;
    border: 1px solid var(--muted);
    background: repeating-linear-gradient(45deg, rgba(90, 90, 90, 0.55) 0 2px, transparent 2px 6px);
  }
  svg.plan.wet .zone polyline.hose-reach {
    opacity: 0.5;
  }
  .wet-layer {
    pointer-events: none;
  }
  .sensor-value {
    text-anchor: middle;
    font-weight: 700;
    fill: #455a64;
    stroke: #fff;
    paint-order: stroke;
    stroke-linejoin: round;
    pointer-events: none;
  }
  .sensor-value.dry {
    fill: #c0392b;
  }
  .sensor-value.ok {
    fill: #2e7d32;
  }
  .sensor-value.wet {
    fill: #1565c0;
  }
  .wet-legend {
    position: absolute;
    right: 12px;
    bottom: 30px;
    width: 250px;
    background: var(--card);
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    padding: 10px 12px;
    font-size: 12.5px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .wet-legend .bar {
    height: 10px;
    border-radius: 5px;
  }
  .wet-legend .ticks {
    display: flex;
    justify-content: space-between;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .wet-legend small {
    color: var(--muted);
    line-height: 1.35;
  }

  /* Übersicht */
  .overview {
    flex: 1;
    overflow-y: auto;
    padding: 20px max(16px, 3vw) 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
  }
  .tile {
    background: var(--card);
    border-radius: var(--radius);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.08));
  }
  .tile span {
    color: var(--muted);
    font-size: 13px;
  }
  .tile strong {
    font-size: 28px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .tile small {
    color: var(--muted);
  }
  .tile.warn strong {
    color: var(--bad);
  }
  .types {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
  }
  .type {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 2px 10px;
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .type ha-icon {
    grid-row: span 2;
    color: var(--accent);
  }
  .type strong {
    font-variant-numeric: tabular-nums;
  }
  .type small {
    grid-column: 2 / 4;
    color: var(--muted);
  }
  .card {
    background: var(--card);
    border-radius: var(--radius);
    padding: 4px 16px 12px;
    box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.08));
  }
  .hints {
    margin: 0;
    padding-left: 20px;
    line-height: 1.6;
  }
  .table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  th {
    text-align: left;
    color: var(--muted);
    font-weight: 500;
    font-size: 12.5px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--line);
  }
  td .dot {
    display: inline-block;
    margin-right: 8px;
    vertical-align: middle;
  }
  th.n,
  td.n {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  tr.off td {
    color: var(--muted);
  }
  details.plant {
    margin: 8px 0;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  details.plant summary {
    cursor: pointer;
    font-weight: 500;
    color: var(--accent);
  }
  .levels {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .levels button {
    padding: 5px 10px;
    font-size: 12.5px;
    border: 1px solid var(--line);
    color: var(--primary-text-color);
  }
  .levels button ha-icon {
    --mdc-icon-size: 16px;
    margin-right: 4px;
    vertical-align: -3px;
  }
  .levels button.active {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--text-primary-color, #fff);
  }
  .soil-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .soil-row small {
    margin-left: auto;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }
  /* Zeitplan */
  ip-schedule {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .week-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 6px;
  }
  .week-grid .hours {
    position: relative;
    height: 16px;
    margin-left: 70px;
    color: var(--muted);
    font-size: 11px;
  }
  .week-grid .hours span {
    position: absolute;
    transform: translateX(-50%);
  }
  .day {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .day-label {
    width: 62px;
    flex-shrink: 0;
    font-size: 13px;
    color: var(--muted);
  }
  .track {
    position: relative;
    flex: 1;
    height: 26px;
    border-radius: 6px;
    background: repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--primary-text-color) 5%, transparent) 0 calc(12.5% - 1px),
      color-mix(in srgb, var(--primary-text-color) 12%, transparent) calc(12.5% - 1px) 12.5%
    );
  }
  .track .block {
    position: absolute;
    top: 3px;
    bottom: 3px;
    min-width: 6px;
    border-radius: 4px;
    background: var(--c);
  }
  .track .block.off {
    opacity: 0.35;
  }
  /* Späte Starts: Beschriftung links neben dem Balken, sonst ragt sie hinaus */
  .track .block.late span {
    left: auto;
    right: 100%;
    margin-left: 0;
    margin-right: 6px;
  }
  .track .block span {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 6px;
    white-space: nowrap;
    font-size: 11.5px;
    color: var(--primary-text-color);
  }
  .track .now {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    background: var(--bad);
  }
  .programs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
    align-items: start;
  }
  .program {
    border-top: 4px solid var(--c);
  }
  .program-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .program-head h3 {
    text-transform: none;
    letter-spacing: 0;
    font-size: 17px;
    color: var(--primary-text-color);
    margin: 14px 0 6px;
  }
  .program-head .check {
    margin: 0;
  }
  .program .when {
    margin: 0 0 10px;
    font-weight: 500;
  }
  .steps {
    margin: 0;
    padding-left: 18px;
  }
  .steps small {
    color: var(--muted);
  }
  .editor {
    border-top: 1px solid var(--line);
    margin-top: 10px;
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .zone-pick {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .zone-pick button {
    padding: 5px 10px;
    font-size: 12.5px;
    border: 1px solid var(--line);
    color: var(--primary-text-color);
  }
  .zone-pick button.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .zone-pick b {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
  }
  .checks {
    display: flex;
    flex-direction: column;
  }
  .checks .check {
    margin: 4px 0;
  }
  .new-program input {
    flex: 1;
  }
  .events {
    margin: 0;
    padding-left: 18px;
    line-height: 1.7;
    font-size: 13.5px;
  }
  code {
    font-family: var(--code-font-family, ui-monospace, monospace);
    font-size: 12.5px;
    background: color-mix(in srgb, var(--primary-text-color) 7%, transparent);
    padding: 1px 5px;
    border-radius: 4px;
  }
  pre {
    font-family: var(--code-font-family, ui-monospace, monospace);
    font-size: 12.5px;
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    padding: 10px 12px;
    border-radius: 8px;
    overflow-x: auto;
  }
  .valve-link {
    fill: none;
    stroke: var(--zone);
    stroke-width: 1.5;
    opacity: 0.55;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .link-hit {
    fill: none;
    stroke: transparent;
    cursor: copy;
    pointer-events: stroke;
  }
  .valve-link.selected {
    stroke-width: 3;
    opacity: 1;
  }
  .draft.feature-draft polyline {
    fill: rgba(120, 120, 120, 0.06);
    stroke: var(--accent);
    stroke-width: 2;
    stroke-dasharray: 6 4;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  /* Linien (Zaun, Hecke, Grenze, Leitung) beim Zeichnen nie füllen */
  .draft.feature-draft.fence polyline,
  .draft.feature-draft.hedge polyline,
  .draft.feature-draft.boundary polyline,
  .junctions circle {
    fill: #1565c0;
    stroke: #fff;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .draft.feature-draft.pipe polyline {
    fill: none;
  }
  /* Gesperrte Grundriss-Formen: Klicks gehen durch (zum Plan darunter) */
  .feature.locked,
  .feature.locked * {
    pointer-events: none !important;
  }
  .draft.feature-draft circle {
    fill: #fff;
    stroke: var(--accent);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .measure polyline {
    fill: none;
    stroke: #ff6f00;
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .measure circle {
    fill: #ff6f00;
    pointer-events: none;
  }
  .measure-label {
    fill: #ff6f00;
    stroke: #fff;
    paint-order: stroke;
    stroke-linejoin: round;
    text-anchor: middle;
    font-weight: 700;
    pointer-events: none;
  }
  .snap-hint {
    fill: none;
    stroke: #ff6f00;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }

  /* Seitenleiste Grundriss */
  .palette {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
  .palette .tool {
    justify-content: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--primary-text-color);
    font-size: 13px;
    text-align: left;
    min-width: 0;
  }
  .palette .tool span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .palette .tool ha-icon {
    color: var(--muted);
    flex-shrink: 0;
  }
  .palette .tool:hover {
    background: color-mix(in srgb, var(--accent) 6%, transparent);
  }
  .palette .tool.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--accent);
  }
  .palette .tool.active ha-icon {
    color: var(--accent);
  }
  .slider {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    margin: 12px 4px;
    font-size: 13px;
  }
  .slider input {
    padding: 0;
    border: none;
    background: none;
    accent-color: var(--accent);
  }
  .slider output {
    min-width: 3.2em;
    text-align: right;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 16px 4px 4px;
    font-size: 13.5px;
  }
  .check input {
    width: auto;
    accent-color: var(--accent);
  }
  .check small {
    color: var(--muted);
  }
  .field.wide {
    margin: 6px 0;
  }
  .edges {
    margin: 8px 0;
    font-size: 13px;
  }
  .edges summary {
    cursor: pointer;
    color: var(--accent);
    font-weight: 500;
    padding: 4px 0;
  }
  .edge-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    margin-top: 6px;
  }
  .zone path,
  .zone polygon {
    fill: color-mix(in srgb, var(--zone) 30%, transparent);
    stroke: var(--zone);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
    cursor: pointer;
    transition: fill 0.15s;
  }
  .zone:hover path,
  .zone:hover polygon {
    fill: color-mix(in srgb, var(--zone) 42%, transparent);
  }
  .zone.selected path,
  .zone.selected polygon {
    stroke-width: 3;
    fill: color-mix(in srgb, var(--zone) 40%, transparent);
  }
  .zone.disabled path,
  .zone.disabled polygon {
    stroke-dasharray: 2 4;
    fill: color-mix(in srgb, var(--zone) 12%, transparent);
  }
  .zone.queued path,
  .zone.queued polygon {
    stroke-dasharray: 8 5;
  }
  .zone.running path,
  .zone.running polygon {
    stroke-width: 3;
    stroke-dasharray: 10 6;
    animation: flow 0.9s linear infinite, pulse 2s ease-in-out infinite;
  }
  .zone.locked path,
  .zone.locked polygon {
    stroke: var(--bad);
    stroke-width: 3;
  }
  /* Gießen: Wasser fließt (Zuleitung, Leitung zur Zone), Ventil pulsiert, Sprinkler sprüht */
  .flow {
    pointer-events: none;
  }
  .marker.valve .bowtie {
    fill: #fff;
  }
  .marker.valve .handle-bar {
    stroke: #fff;
    stroke-width: 2;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .marker.valve.open rect {
    fill: #0288d1;
  }
  .feature.tap.open circle {
    fill: #0288d1;
  }
  .feature.tap .drip {
    fill: #29b6f6;
    animation: drip 1s ease-in infinite;
    transform-box: fill-box;
  }
  @keyframes drip {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(80%);
      opacity: 0;
    }
  }
  .flow .pipe-active {
    stroke: #0288d1;
    stroke-width: 6;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .flow .water {
    stroke: #fff;
    stroke-width: 2.5;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
    animation: water 0.6s linear infinite;
  }
  .valve-link.flowing {
    opacity: 1;
    stroke-width: 3;
    animation: water 0.6s linear infinite;
  }
  .flow .valve-open {
    fill: none;
    stroke: #29b6f6;
    stroke-width: 3;
    vector-effect: non-scaling-stroke;
    animation: ring 1.2s ease-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  .flow .spray {
    fill: color-mix(in srgb, #29b6f6 35%, transparent);
    stroke: #29b6f6;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    animation: spray 1.6s ease-out infinite;
  }
  @keyframes water {
    to {
      stroke-dashoffset: calc(var(--period, 10px) * -1);
    }
  }
  @keyframes ring {
    from {
      transform: scale(0.8);
      opacity: 1;
    }
    to {
      transform: scale(1.8);
      opacity: 0;
    }
  }
  @keyframes spray {
    from {
      transform: scale(0.15);
      opacity: 0.9;
    }
    to {
      transform: scale(1);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .flow .water,
    .flow .valve-open,
    .flow .spray,
    .valve-link.flowing,
    .zone.running path,
    .zone.running polygon {
      animation: none;
    }
  }
  @keyframes flow {
    to {
      stroke-dashoffset: -16;
    }
  }
  @keyframes pulse {
    50% {
      fill: color-mix(in srgb, var(--zone) 55%, transparent);
    }
  }
  .label {
    text-anchor: middle;
    fill: #fff;
    stroke: rgba(0, 0, 0, 0.65);
    paint-order: stroke;
    stroke-linejoin: round;
    font-weight: 600;
    pointer-events: none;
  }
  .label .sub {
    font-weight: 400;
  }
  .handle {
    fill: #fff;
    stroke: var(--accent);
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
    cursor: move;
  }
  .handle.center {
    fill: var(--accent);
    stroke: #fff;
  }
  .handle.angle {
    fill: #ffd54f;
    stroke: #6d4c00;
    cursor: grab;
  }
  .handle.angle.small {
    opacity: 0.8;
  }
  .handle.mid {
    fill: var(--accent);
    stroke: #fff;
    opacity: 0.7;
    cursor: copy;
  }
  .guide {
    stroke: #fff;
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .draft polyline {
    fill: color-mix(in srgb, var(--zone) 20%, transparent);
    stroke: var(--zone);
    stroke-width: 2;
    stroke-dasharray: 6 4;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .draft circle {
    fill: #fff;
    stroke: var(--zone);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .draft circle.first {
    fill: var(--zone);
  }
  .scale-draft line {
    stroke: #ffd54f;
    stroke-width: 3;
    vector-effect: non-scaling-stroke;
  }
  .scale-draft circle {
    fill: #ffd54f;
    stroke: #000;
    vector-effect: non-scaling-stroke;
  }
  .marker rect,
  .marker circle {
    fill: #455a64;
    stroke: #fff;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    cursor: move;
  }
  .marker.sensor circle {
    fill: #8d6e63;
  }
  .marker.selected rect,
  .marker.selected circle {
    stroke: var(--accent);
    stroke-width: 3;
  }
  .marker text {
    fill: #fff;
    font-weight: 700;
    text-anchor: middle;
    pointer-events: none;
  }

  /* Überlagerungen auf dem Plan */
  .tools {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    flex-direction: column;
    background: var(--card);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }
  .tools button.icon {
    border-radius: 0;
  }
  .tools button.on {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .layers {
    position: absolute;
    top: 152px;
    left: 68px;
    display: flex;
    flex-direction: column;
    min-width: 220px;
    padding: 6px;
    background: var(--card);
    border-radius: 12px;
    box-shadow: 0 3px 14px rgba(0, 0, 0, 0.28);
    z-index: 3;
  }
  .layers button {
    justify-content: flex-start;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    color: var(--primary-text-color);
    font-size: 14px;
  }
  .layers button ha-icon {
    color: var(--muted);
  }
  .layers button:hover {
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
  .layers button.active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    font-weight: 500;
  }
  .layers button.active ha-icon {
    color: var(--accent);
  }
  .search {
    position: absolute;
    top: 12px;
    left: 68px;
    width: min(420px, calc(100% - 140px));
    background: var(--card);
    border-radius: 14px;
    box-shadow: 0 3px 14px rgba(0, 0, 0, 0.28);
    padding: 6px;
    z-index: 2;
  }
  .search form {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .search form > ha-icon {
    color: var(--muted);
    margin-left: 6px;
  }
  .search input {
    flex: 1;
    border: none;
    background: none;
    padding: 8px 6px;
    font-size: 15px;
  }
  .search input:focus {
    outline: none;
  }
  .search-error {
    margin: 6px 10px;
    font-size: 13px;
    color: var(--bad);
  }
  .search-note {
    margin: 6px 10px 4px;
    font-size: 11px;
    color: var(--muted);
  }
  .results {
    list-style: none;
    margin: 4px 0 0;
    padding: 4px 0 0;
    border-top: 1px solid var(--line);
  }
  .results button {
    width: 100%;
    border-radius: 8px;
    padding: 8px 10px;
    gap: 10px;
    text-align: left;
    color: var(--primary-text-color);
  }
  .results button:hover,
  .results button:focus-visible {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .results ha-icon {
    color: var(--bad);
    flex-shrink: 0;
  }
  .results span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .results small {
    color: var(--muted);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :host([narrow]) .search {
    left: 60px;
    width: calc(100% - 72px);
  }
  .pin path {
    fill: var(--bad);
    stroke: #fff;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .pin circle {
    fill: #fff;
  }
  .pin {
    pointer-events: none;
  }
  .banner {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100% - 100px);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 6px 6px 16px;
    background: var(--card);
    border-radius: 999px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
    font-size: 14px;
  }
  .banner input.small {
    width: 80px;
    padding: 5px 8px;
  }
  .compass {
    position: absolute;
    right: 14px;
    top: 14px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--card);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    display: grid;
    place-items: center;
  }
  .compass svg {
    width: 28px;
    height: 28px;
  }
  .compass .n {
    fill: var(--bad);
  }
  .compass .s {
    fill: var(--muted);
  }
  .compass span {
    position: absolute;
    top: -2px;
    font-size: 9px;
    font-weight: 700;
    color: var(--bad);
  }
  .scalebar {
    position: absolute;
    left: 12px;
    bottom: 12px;
    font-size: 12px;
    background: color-mix(in srgb, var(--card) 85%, transparent);
    padding: 4px 8px;
    border-radius: 6px;
  }
  .scalebar div {
    height: 6px;
    border: 2px solid var(--primary-text-color);
    border-top: none;
    margin-bottom: 2px;
  }
  .attribution {
    position: absolute;
    right: 0;
    bottom: 0;
    font-size: 11px;
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.75);
    color: #333;
    border-top-left-radius: 6px;
  }
  .welcome {
    position: absolute;
    left: 50%;
    bottom: 48px;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 18px;
    background: var(--card);
    border-radius: var(--radius);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    font-size: 14px;
    line-height: 1.4;
    max-width: 80%;
  }
  .welcome ha-icon {
    --mdc-icon-size: 32px;
    color: var(--accent);
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    background: #323232;
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
    font-size: 14px;
    z-index: 10;
    max-width: 90vw;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .toast button.text {
    color: #90caf9;
    padding: 4px 8px;
    margin: -4px -8px -4px 0;
  }
  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--muted);
  }
  .empty ha-icon {
    --mdc-icon-size: 48px;
  }
  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--line);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Betrieb */
  .saving {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }
  .saving input {
    width: 110px;
  }
  .saving strong {
    min-width: 44px;
    font-variant-numeric: tabular-nums;
  }
  td.actions-cell {
    white-space: nowrap;
  }
  .operation .card h2 {
    font-size: 16px;
    font-weight: 500;
    margin: 12px 0 8px;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .card-head .spacer {
    flex: 1;
  }
  .card-head select {
    width: auto;
    max-width: 50%;
    font: inherit;
    padding: 4px 6px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--card);
    color: inherit;
  }
  .queue,
  .history {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .queue li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 4px 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .queue li:first-child {
    border-top: none;
  }
  .queue li.running ha-icon {
    color: var(--accent);
  }
  .queue li.waiting {
    color: var(--muted);
  }
  .queue .what {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .queue .what strong {
    color: var(--primary-text-color, #212121);
  }
  .queue .what small,
  .queue .left {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .operation .bar {
    height: 6px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    overflow: hidden;
    margin-top: 4px;
  }
  .operation .bar > div {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
    transition: width 0.9s linear;
  }
  .operation .bar.small {
    width: 120px;
    max-width: 100%;
    background: color-mix(in srgb, var(--warn) 18%, transparent);
  }
  .operation .bar.small > div {
    background: var(--warn);
  }
  .operation td small,
  .operation p.small {
    color: var(--muted);
  }
  .operation small.bad {
    color: var(--bad);
  }
  .legend {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: var(--muted);
  }
  .legend i {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-right: 6px;
    vertical-align: -1px;
  }
  svg.chart {
    width: 100%;
    height: auto;
    max-height: 260px;
    margin-top: 8px;
    font-size: 13px;
  }
  svg.chart .grid {
    stroke: var(--line);
    stroke-width: 1;
  }
  svg.chart .axis {
    stroke: var(--muted);
    stroke-width: 1;
  }
  svg.chart text {
    fill: var(--muted);
  }
  svg.chart .day,
  svg.chart .liters {
    text-anchor: middle;
  }
  svg.chart .liters {
    fill: var(--accent);
  }
  svg.chart .hit {
    fill: transparent;
  }
  svg.chart g:hover .hit {
    fill: color-mix(in srgb, currentColor 6%, transparent);
  }
  .history li {
    display: grid;
    grid-template-columns: auto 110px 1fr;
    gap: 2px 10px;
    align-items: start;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .history li:first-child {
    border-top: none;
  }
  .history .time {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .history li div {
    display: flex;
    flex-direction: column;
  }
  .history li small {
    color: var(--muted);
  }
  .history li.ok ha-icon {
    color: var(--ok);
  }
  .history li.warn ha-icon {
    color: var(--warn);
  }
  .history li.bad ha-icon {
    color: var(--bad);
  }
  .history li.muted ha-icon {
    color: var(--muted);
  }
  :host([narrow]) .history li {
    grid-template-columns: auto 1fr;
  }
  :host([narrow]) .history li > div {
    grid-column: 2;
  }
  :host([narrow]) .queue li {
    grid-template-columns: auto 1fr auto;
  }
  :host([narrow]) .queue .left {
    grid-column: 2;
  }
  /* Seite „Geräte“ */
  .devices .section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0 8px;
  }
  .devices .section-head h2 {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
  }
  .devices .section-head .spacer,
  .device-head .spacer {
    flex: 1;
  }
  .devices h3 {
    margin: 8px 0 0;
  }
  .devices td {
    vertical-align: top;
  }
  .devices tr.selected td {
    background: color-mix(in srgb, var(--accent) 7%, transparent);
  }
  .devices tr.editor-row > td {
    background: color-mix(in srgb, var(--accent) 4%, transparent);
    padding-top: 0;
  }
  .devices .device-cell {
    min-width: 180px;
  }
  .devices .row-actions {
    white-space: nowrap;
    text-align: right;
    width: 1%;
  }
  .devices .row-actions button {
    display: block;
    margin: 0 0 2px auto;
  }
  .devices table.roles select {
    min-width: 220px;
  }
  .pill {
    display: inline-block;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    white-space: nowrap;
  }
  .pill.ok {
    background: color-mix(in srgb, var(--success-color, #43a047) 16%, transparent);
  }
  .pill.warn {
    background: color-mix(in srgb, var(--warn) 18%, transparent);
  }
  .bad-text {
    color: var(--bad);
  }
  .device-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 360px;
    overflow-y: auto;
  }
  .device-pick {
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--primary-text-color);
    flex-wrap: wrap;
  }
  .device-pick:hover {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
  .device-pick.used {
    opacity: 0.65;
  }
  .device-pick .grow {
    flex: 1;
    min-width: 160px;
    display: flex;
    flex-direction: column;
  }
  .device-pick small {
    color: var(--muted);
  }
  .device-head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .spinner.inline {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-width: 2px;
    vertical-align: -2px;
    margin-right: 6px;
  }
  .season-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin: 4px 0 8px;
  }
  .test-box .fields {
    max-width: 420px;
  }
  :host([narrow]) .devices .fields {
    flex-direction: column;
  }
`;
var wt = Object.defineProperty, xt = Object.getOwnPropertyDescriptor, K = (e, t, s, n) => {
  for (var i = n > 1 ? void 0 : n ? xt(t, s) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (n ? r(t, s, i) : r(i)) || i);
  return n && i && wt(t, s, i), i;
};
const Be = "#eb6834", Ze = "#2a78d6", ze = {
  queued: "wartet",
  opening: "öffnet",
  running: "gießt",
  closing: "schließt",
  pause: "Pause",
  done: "fertig",
  skipped: "abgebrochen",
  failed: "Fehler",
  cancelled: "nicht gestartet"
};
function kt(e) {
  if (e.kind === "run") {
    const t = [`${V(e.seconds ?? 0)} von ${V(e.planned_s ?? 0)}`];
    e.liters != null && t.push(`${D(e.liters)} L${e.measured ? " (gemessen)" : " (geschätzt)"}`), e.mm != null && t.push(`${D(e.mm)} mm`), e.source_text && t.push(e.source_text);
    const s = e.state === "done" ? "ok" : e.state === "failed" ? "bad" : "warn";
    return { title: `${e.zone_name}: ${ze[e.state ?? ""] ?? e.state}${e.error ? ` (${e.error})` : ""}`, detail: t.join(" · "), tone: s, icon: "mdi:water" };
  }
  if (e.kind === "cancelled")
    return {
      title: `${e.zone_name}: aus der Warteschlange genommen`,
      detail: [e.source_text, `${V(e.planned_s ?? 0)} geplant`].filter(Boolean).join(" · "),
      tone: "muted",
      icon: "mdi:playlist-remove"
    };
  if (e.kind === "program_started") {
    const t = e.source === "schedule" ? "nach Zeitplan" : "von Hand";
    return {
      title: `Programm ${e.program_name} gestartet`,
      detail: [t, e.planned_s ? `${V(e.planned_s)} gesamt` : ""].filter(Boolean).join(" · "),
      tone: "ok",
      icon: "mdi:play-circle-outline"
    };
  }
  return e.kind === "program_skipped" ? { title: `Programm ${e.program_name} übersprungen`, detail: e.reason ?? "", tone: "warn", icon: "mdi:skip-next-circle-outline" } : {
    title: e.severity === "alarm" ? "Alarm" : "Warnung",
    detail: e.message ?? "",
    tone: "bad",
    icon: "mdi:alert-outline"
  };
}
let N = class extends he {
  constructor() {
    super(...arguments), this.history = [], this.historyZone = "", this.error = "", this.now = Date.now(), this.busy = "", this.showTable = !1, this.historyKey = "";
  }
  get tz() {
    return this.hass?.config?.time_zone;
  }
  connectedCallback() {
    super.connectedCallback(), this.subscribe(), this.timer = window.setInterval(() => {
      this.data?.queue.some((e) => e.ends_at) && (this.now = Date.now());
    }, 1e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.unsub?.(), this.unsub = void 0, window.clearInterval(this.timer);
  }
  async subscribe() {
    if (!(!this.hass || this.unsub))
      try {
        this.unsub = await this.hass.connection.subscribeMessage(
          (e) => {
            this.data = e, this.now = Date.now();
            const t = `${e.history_count}|${e.history_last}`;
            t !== this.historyKey && (this.historyKey = t, this.loadHistory());
          },
          { type: `${ne}/operation/subscribe` }
        );
      } catch (e) {
        this.error = this.message(e);
      }
  }
  async loadHistory() {
    try {
      const e = await this.hass.callWS({
        type: `${ne}/history/get`,
        limit: 150,
        ...this.historyZone ? { zone_id: this.historyZone } : {}
      });
      this.history = e.entries;
    } catch (e) {
      this.toast(this.message(e), !0);
    }
  }
  toast(e, t = !1) {
    this.dispatchEvent(new CustomEvent("ip-toast", { detail: { text: e, isError: t }, bubbles: !0, composed: !0 }));
  }
  message(e) {
    return e && typeof e == "object" && "message" in e ? String(e.message) : String(e);
  }
  async cancel(e, t) {
    this.busy = JSON.stringify(e);
    try {
      await this.hass.callWS({ type: `${ne}/queue/cancel`, ...e }), this.toast(t);
    } catch (s) {
      this.toast(this.message(s), !0);
    } finally {
      this.busy = "";
    }
  }
  async waterNow(e) {
    if (!e.planned_s) {
      this.toast(`${e.name}: keine Gießdauer (kein Bedarf und keine Dauer von Hand)`, !0);
      return;
    }
    try {
      await this.hass.callService(ne, "run_zone", { zone_id: e.id, duration: e.planned_s }), this.toast(`${e.name}: ${V(e.planned_s)} eingereiht`);
    } catch (t) {
      this.toast(this.message(t), !0);
    }
  }
  /** „Jetzt gießen“ oder, wenn die Zone gießt bzw. wartet, „Abbrechen“. */
  renderWaterButton(e, t) {
    const s = t.queue.find((n) => n.zone_id === e.id);
    return s ? o`<button class="text danger" ?disabled=${!!this.busy}
        title=${s.active ? "Gießen abbrechen, das Ventil schließt" : "Aus der Warteschlange nehmen"}
        @click=${() => this.cancel({ zone_id: e.id }, s.active ? `${e.name}: abgebrochen` : `${e.name}: herausgenommen`)}>
        <ha-icon icon="mdi:stop"></ha-icon>${s.active ? "Abbrechen" : "Herausnehmen"}
      </button>` : o`<button class="text" ?disabled=${!e.enabled || t.winter_mode || !!e.locked} title="In die Warteschlange einreihen"
      @click=${() => this.waterNow(e)}>
      <ha-icon icon="mdi:watering-can"></ha-icon>Jetzt gießen
    </button>`;
  }
  async resetBalance(e) {
    const t = e ? `das Wasserkonto von „${e.name}“` : "die Wasserkonten aller Zonen";
    if (confirm(`${t[0].toUpperCase()}${t.slice(1)} auf „voll“ setzen? Der berechnete Bedarf ist danach 0.`))
      try {
        await this.hass.callWS({ type: `${ne}/balance/reset`, ...e ? { zone_id: e.id } : {} }), this.toast(e ? `${e.name}: Wasserkonto voll` : "Alle Wasserkonten voll");
      } catch (s) {
        this.toast(this.message(s), !0);
      }
  }
  async setWaterSaving(e) {
    try {
      await this.hass.callWS({ type: `${ne}/settings/water_saving`, percent: e }), this.toast(e ? `Wassersparen: ${e} % weniger` : "Wassersparen aus");
    } catch (t) {
      this.toast(this.message(t), !0);
    }
  }
  when(e, t = !0) {
    const s = new Date(e), n = { timeZone: this.tz, hour: "2-digit", minute: "2-digit" };
    if (!t) return s.toLocaleTimeString("de-DE", n);
    const i = new Date(this.now).toLocaleDateString("de-DE", { timeZone: this.tz }), a = new Date(this.now + 864e5).toLocaleDateString("de-DE", { timeZone: this.tz }), r = new Date(this.now - 864e5).toLocaleDateString("de-DE", { timeZone: this.tz }), l = s.toLocaleDateString("de-DE", { timeZone: this.tz });
    return `${l === i ? "heute" : l === a ? "morgen" : l === r ? "gestern" : s.toLocaleDateString("de-DE", { timeZone: this.tz, weekday: "short", day: "numeric", month: "numeric" })} ${s.toLocaleTimeString("de-DE", n)}`;
  }
  render() {
    if (this.error)
      return o`<div class="overview"><div class="card"><p>${this.error}</p></div></div>`;
    const e = this.data;
    return e ? o`<div class="overview operation">
      ${this.renderTiles(e)} ${this.renderNow(e)} ${this.renderZones(e)} ${this.renderWeather(e)} ${this.renderHistory(e)}
    </div>` : o`<div class="empty"><div class="spinner"></div></div>`;
  }
  // Kacheln ------------------------------------------------------------------------
  renderTiles(e) {
    const t = e.days[e.days.length - 1], s = e.programs.filter((i) => i.next).sort((i, a) => i.next < a.next ? -1 : 1)[0], n = e.weather_today;
    return o`<div class="tiles">
      <div class="tile ${e.problems.length ? "warn" : ""}">
        <span>Zustand</span>
        <strong>${e.winter_mode ? "Winterpause" : e.problems.length ? `${e.problems.length} Problem${e.problems.length > 1 ? "e" : ""}` : e.automatic ? "Automatik an" : "Automatik aus"}</strong>
        <small>${e.problems[0] ?? (e.queue.length ? `${e.queue.length} Zone(n) aktiv oder wartend` : "Alles ruhig")}</small>
      </div>
      <div class="tile">
        <span>Heute gegossen</span>
        <strong>${D(t?.liters ?? 0, 0)} L</strong>
        <small>${Object.keys(t?.zones_mm ?? {}).length} Zone(n)</small>
      </div>
      <div class="tile">
        <span>Nächster Start</span>
        <strong>${s ? this.when(s.next) : "–"}</strong>
        <small>${s ? s.name : e.automatic ? "kein Programm geplant" : "Automatik ist aus"}</small>
      </div>
      <div class="tile">
        <span>Wetter heute</span>
        <strong>${n && n.t_max != null ? `${D(n.t_min, 0)}–${D(n.t_max, 0)} °C` : "–"}</strong>
        <small>${n ? [
      n.rain_mm != null ? `Regen ${D(n.rain_mm)} mm` : "",
      n.wind_ms != null ? `Wind ${D(n.wind_ms * 3.6, 0)} km/h` : "",
      n.rh_mean != null ? `Luftfeuchte ${D(n.rh_mean, 0)} %` : ""
    ].filter(Boolean).join(" · ") : e.weather_entity ? "noch keine Messwerte" : "keine Wetterquelle eingerichtet"}</small>
      </div>
    </div>`;
  }
  // Jetzt ----------------------------------------------------------------------------
  renderNow(e) {
    const t = [...new Set(e.queue.map((n) => n.program_id).filter((n) => !!n))], s = (n) => e.programs.find((i) => i.id === n)?.name ?? n;
    return o`<section class="card now">
      <div class="card-head">
        <h2>Jetzt</h2>
        <span class="spacer"></span>
        ${t.map(
      (n) => o`<button class="text" ?disabled=${!!this.busy}
            @click=${() => this.cancel({ program_id: n }, `Programm ${s(n)} abgebrochen`)}>
            <ha-icon icon="mdi:stop-circle-outline"></ha-icon>${s(n)} abbrechen
          </button>`
    )}
        ${e.queue.length ? o`<button class="text danger" ?disabled=${!!this.busy}
              @click=${() => this.cancel({ all: !0 }, "Alles gestoppt")}>
              <ha-icon icon="mdi:stop"></ha-icon>Alles stoppen
            </button>` : p}
      </div>
      ${e.queue.length ? o`<ul class="queue">${e.queue.map((n) => this.renderQueueItem(n))}</ul>` : o`<p class="hint">Gerade läuft nichts.</p>`}
    </section>`;
  }
  renderQueueItem(e) {
    const { left: t, done: s } = ot(e, this.now), n = e.active, i = n ? e.state === "running" ? `noch ${V(t)} von ${V(e.duration_s)}` : ze[e.state] ?? e.state : `wartet · ${V(e.duration_s)}`;
    return o`<li class="${n ? "running" : "waiting"}">
      <ha-icon icon=${n ? "mdi:water" : "mdi:timer-sand"}></ha-icon>
      <div class="what">
        <strong>${e.zone_name}</strong>
        <small>${e.source_text}${e.supply ? ` · ${e.supply}` : ""}</small>
        ${n && e.state === "running" ? o`<div class="bar" role="progressbar" aria-valuenow=${Math.round(s * 100)}><div style="width:${s * 100}%"></div></div>` : p}
      </div>
      <span class="left">${i}</span>
      <button class="text" ?disabled=${!!this.busy}
        title=${n ? "Diese Zone jetzt schließen, dann mit der nächsten weitermachen" : "Diese Zone nicht gießen"}
        @click=${() => this.cancel({ zone_id: e.zone_id }, n ? `${e.zone_name} übersprungen` : `${e.zone_name} herausgenommen`)}>
        <ha-icon icon=${n ? "mdi:skip-next" : "mdi:close"}></ha-icon>${n ? "Überspringen" : "Herausnehmen"}
      </button>
    </li>`;
  }
  // Zonen ----------------------------------------------------------------------------
  renderZones(e) {
    return o`<section class="card">
      <div class="card-head">
        <h2>Zonen</h2>
        <span class="spacer"></span>
        <label class="saving" title="Geplante Gießdauer aller Zonen kürzen, z. B. bei Hitze oder Wasserknappheit">
          <ha-icon icon="mdi:water-minus"></ha-icon>Wassersparen
          <input type="range" min="0" max="50" step="5" .value=${String(e.water_saving_pct)}
            @change=${(t) => this.setWaterSaving(Number(t.target.value))} />
          <strong>${e.water_saving_pct ? `−${e.water_saving_pct} %` : "aus"}</strong>
        </label>
        <button class="text small" title="Wasserkonten aller Zonen auf „voll“ setzen" @click=${() => this.resetBalance()}>
          <ha-icon icon="mdi:restore"></ha-icon>Alle Konten voll
        </button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Zuletzt gegossen</th>
              <th class="n">Menge</th>
              <th>Bedarf jetzt</th>
              <th>Nächstes Mal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${e.zones.map((t) => {
      const s = t.last, n = t.capacity_mm > 0 ? Math.min(1, t.need_mm / t.capacity_mm) : 0;
      return o`<tr class=${t.enabled ? "" : "off"}>
                <td>
                  <strong>${t.name}</strong>
                  ${t.locked ? o`<br /><small class="bad">gesperrt: ${t.locked}</small>` : p}
                </td>
                <td>
                  ${s ? o`${this.when(s.at)}<br /><small>${V(s.seconds ?? 0)}${s.state !== "done" ? ` · ${ze[s.state ?? ""] ?? s.state}` : ""}</small>` : o`<small>noch nie</small>`}
                </td>
                <td class="n">
                  ${s?.liters != null ? o`${D(s.liters)} L` : "–"}
                  ${s?.mm != null ? o`<br /><small>${D(s.mm)} mm</small>` : p}
                </td>
                <td>
                  ${t.duration_mode === "calculated" ? o`<div class="need" title=${`${D(t.need_mm)} von ${D(t.capacity_mm)} mm nutzbarem Wasser fehlen`}>
                        <div class="bar small"><div style="width:${n * 100}%"></div></div>
                        <small>${D(t.need_mm)} mm fehlen${t.measured ? " (Sensor)" : ""}</small>
                      </div>` : o`<small>${t.duration_mode === "entity" ? "aus Entität" : "Dauer von Hand"}</small>`}
                </td>
                <td>
                  ${t.next ? o`${this.when(t.next.at)}<br /><small>${t.next.program}</small>` : o`<small>nicht geplant</small>`}
                  <br /><small>${t.planned_s ? `${V(t.planned_s)}${t.planned_liters != null ? `, ca. ${D(t.planned_liters, 0)} L` : ""}` : t.reason}</small>
                </td>
                <td class="n actions-cell">
                  ${this.renderWaterButton(t, e)}
                  ${t.duration_mode === "calculated" && t.need_mm > 0 ? o`<button class="text small" title="Wasserkonto auf „voll“ setzen (z. B. nach Gießen von Hand)"
                        @click=${() => this.resetBalance(t)}><ha-icon icon="mdi:restore"></ha-icon>Konto voll</button>` : p}
                </td>
              </tr>`;
    })}
          </tbody>
        </table>
      </div>
    </section>`;
  }
  // Wetter -----------------------------------------------------------------------------
  renderWeather(e) {
    const s = this.getBoundingClientRect().width < 640 && !this.showTable ? e.days.slice(-7) : e.days, n = s.flatMap((h) => [h.et0_mm ?? 0, h.rain_mm ?? 0]), i = Math.max(4, ...n), a = 1e3, r = 190, l = 10, c = r - 24, d = a / s.length, m = Math.min(14, d / 3), u = (h) => c - h / i * (c - l), v = [0, i / 2, i].map((h) => Math.round(h * 10) / 10), S = s.some((h) => h.et0_mm != null);
    return o`<section class="card">
      <div class="card-head">
        <h2>Wetter und Wasserhaushalt (${s.length} Tage)</h2>
        <span class="spacer"></span>
        <button class="text" @click=${() => this.showTable = !this.showTable}>
          <ha-icon icon=${this.showTable ? "mdi:chart-bar" : "mdi:table"}></ha-icon>${this.showTable ? "Als Grafik" : "Als Tabelle"}
        </button>
      </div>
      <div class="legend">
        <span><i style="background:${Be}"></i>Verdunstung (mm)</span>
        <span><i style="background:${Ze}"></i>Regen (mm)</span>
      </div>
      ${this.showTable ? o`<div class="table-wrap"><table>
            <thead><tr><th>Tag</th><th class="n">Verdunstung</th><th class="n">Regen</th><th class="n">Gegossen</th></tr></thead>
            <tbody>${[...s].reverse().map(
      (h) => o`<tr><td>${this.dayLabel(h.day)}</td><td class="n">${D(h.et0_mm)} mm</td>
                <td class="n">${D(h.rain_mm)} mm</td><td class="n">${D(h.liters, 0)} L</td></tr>`
    )}</tbody>
          </table></div>` : o`<svg class="chart" viewBox="0 0 ${a} ${r + 18}" role="img" aria-label="Verdunstung und Regen je Tag">
            ${v.map(
      (h) => b`<line class="grid" x1="0" x2=${a} y1=${u(h)} y2=${u(h)}></line>
                <text class="tick" x="2" y=${u(h) - 3}>${D(h)} mm</text>`
    )}
            ${s.map((h, g) => {
      const $ = g * d + d / 2, _ = (z, x, P, T) => z == null ? p : b`<path d=${_t($ + x, u(z), m, c - u(z))} fill=${P}>
                      <title>${this.dayLabel(h.day)}: ${T} ${D(z)} mm</title></path>`;
      return b`<g>
                <rect class="hit" x=${g * d} y=${l} width=${d} height=${c - l}>
                  <title>${this.dayLabel(h.day)}: Verdunstung ${D(h.et0_mm)} mm, Regen ${D(h.rain_mm)} mm, gegossen ${D(h.liters, 0)} L</title>
                </rect>
                ${_(h.et0_mm, -m - 1, Be, "Verdunstung")} ${_(h.rain_mm, 1, Ze, "Regen")}
                <text class="day" x=${$} y=${c + 14}>${this.dayLabel(h.day, !0)}</text>
                ${h.liters ? b`<text class="liters" x=${$} y=${c + 28}>${D(h.liters, 0)} L</text>` : p}
              </g>`;
    })}
            <line class="axis" x1="0" x2=${a} y1=${c} y2=${c}></line>
          </svg>`}
      <p class="hint small">
        ${S ? p : o`<strong>Noch keine abgeschlossenen Wettertage. </strong>`}
        So rechnet die Planung (bei Zonen mit berechneter Dauer): Aus Temperatur, Luftfeuchte und Wind ergibt sich jeden
        Tag die Verdunstung. Mal Pflanzenfaktor ist das der Wasserverbrauch der Zone. Wirksamer Regen und gegossenes Wasser
        werden abgezogen. Was fehlt, ist der Bedarf („Bedarf jetzt“); daraus folgen Liter und Gießdauer.
        ${e.weather_entity ? p : o`<br /><strong>Es ist keine Wetterquelle eingerichtet</strong> (Einstellungen → Integration → Konfigurieren).`}
      </p>
    </section>`;
  }
  dayLabel(e, t = !1) {
    const s = /* @__PURE__ */ new Date(`${e}T12:00:00Z`);
    return t ? s.toLocaleDateString("de-DE", { timeZone: "UTC", day: "numeric", month: "numeric" }) : s.toLocaleDateString("de-DE", { timeZone: "UTC", weekday: "short", day: "numeric", month: "numeric" });
  }
  // Verlauf ----------------------------------------------------------------------------
  renderHistory(e) {
    return o`<section class="card">
      <div class="card-head">
        <h2>Verlauf</h2>
        <span class="spacer"></span>
        <select aria-label="Zone" .value=${this.historyZone}
          @change=${(t) => {
      this.historyZone = t.target.value, this.loadHistory();
    }}>
          <option value="">Alle Zonen</option>
          ${e.zones.map((t) => o`<option value=${t.id} ?selected=${t.id === this.historyZone}>${t.name}</option>`)}
        </select>
      </div>
      ${this.history.length ? o`<ul class="history">
            ${this.history.map((t) => {
      const s = kt(t);
      return o`<li class=${s.tone}>
                <ha-icon icon=${s.icon}></ha-icon>
                <span class="time">${this.when(t.at)}</span>
                <div><strong>${s.title}</strong>${s.detail ? o`<small>${s.detail}</small>` : p}</div>
              </li>`;
    })}
          </ul>` : o`<p class="hint">Noch nichts aufgezeichnet. Ab jetzt wird jeder Lauf mitgeschrieben.</p>`}
    </section>`;
  }
};
N.styles = be;
K([
  H({ attribute: !1 })
], N.prototype, "hass", 2);
K([
  f()
], N.prototype, "data", 2);
K([
  f()
], N.prototype, "history", 2);
K([
  f()
], N.prototype, "historyZone", 2);
K([
  f()
], N.prototype, "error", 2);
K([
  f()
], N.prototype, "now", 2);
K([
  f()
], N.prototype, "busy", 2);
K([
  f()
], N.prototype, "showTable", 2);
N = K([
  pe("ip-operation")
], N);
function _t(e, t, s, n) {
  if (n <= 0) return "";
  const i = Math.min(4, s / 2, n);
  return `M${e} ${t + n}V${t + i}Q${e} ${t} ${e + i} ${t}H${e + s - i}Q${e + s} ${t} ${e + s} ${t + i}V${t + n}Z`;
}
var St = Object.defineProperty, zt = Object.getOwnPropertyDescriptor, U = (e, t, s, n) => {
  for (var i = n > 1 ? void 0 : n ? zt(t, s) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (n ? r(t, s, i) : r(i)) || i);
  return n && i && St(t, s, i), i;
};
const se = "irrigation_planner", et = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], ge = ["#1565c0", "#2e7d32", "#ef6c00", "#6a1b9a", "#00838f", "#c62828"], Ne = {
  sequence: "Nacheinander",
  cycle_soak: "Abwechselnd (mit Einziehzeit)",
  priority: "Nach Bedarf (größter zuerst)"
};
function tt(e) {
  return e.start_time === "sunrise" || e.start_time === "sunset" ? "start_sun" : e.finish_by === "sunrise" || e.finish_by === "sunset" ? "finish_sun" : e.start_time ? "start_time" : e.finish_by ? "finish_by" : "window";
}
function Mt(e, t) {
  const s = (l) => l === "sunset" ? "Sonnenuntergang" : "Sonnenaufgang", n = (l) => l === 0 ? "" : `${Math.abs(l) >= 60 && Math.abs(l) % 60 === 0 ? `${Math.abs(l) / 60} h` : `${Math.abs(l)} min`} ${l < 0 ? "vor" : "nach"} `, i = (l) => (l ?? "").slice(0, 5);
  let a = "";
  switch (tt(e)) {
    case "start_sun":
      a = e.sun_offset_min ? `Start ${n(e.sun_offset_min)}${s(e.start_time)}` : `Start bei ${s(e.start_time)}`;
      break;
    case "finish_sun":
      a = e.sun_offset_min ? `fertig ${n(e.sun_offset_min)}${s(e.finish_by)}` : `fertig bei ${s(e.finish_by)}`;
      break;
    case "start_time":
      a = `Start ${i(e.start_time)} Uhr`;
      break;
    case "finish_by":
      a = `fertig bis ${i(e.finish_by)} Uhr`;
      break;
    default:
      a = t ? `fertig bis Ende des Zeitfensters (${i(t)} Uhr)` : "fertig bis Ende des Zeitfensters";
  }
  const r = e.interval_days ? `alle ${e.interval_days} Tage` : e.weekdays.length && e.weekdays.length < 7 ? e.weekdays.map((l) => et[l]).join(" ") : "täglich";
  return `${a}, ${r}`;
}
function ye(e) {
  if (e < 60) return `${e} s`;
  const t = Math.round(e / 60);
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
function Fe(e, t) {
  const s = typeof e == "string" ? new Date(e) : e, n = Object.fromEntries(
    new Intl.DateTimeFormat("de-DE", {
      timeZone: t,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(s).map((i) => [i.type, i.value])
  );
  return {
    day: `${n.year}-${n.month}-${n.day}`,
    minutes: Number(n.hour) * 60 + Number(n.minute),
    time: `${n.hour}:${n.minute}`
  };
}
let F = class extends he {
  constructor() {
    super(...arguments), this.zones = [], this.error = "", this.editing = null, this.draft = null, this.newName = "", this.busy = !1;
  }
  get tz() {
    return this.hass?.config?.time_zone;
  }
  fmtWhen(e) {
    return new Date(e).toLocaleString("de-DE", {
      timeZone: this.tz,
      weekday: "short",
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  connectedCallback() {
    super.connectedCallback(), this.load();
  }
  toast(e, t = !1) {
    this.dispatchEvent(new CustomEvent("ip-toast", { detail: { text: e, isError: t }, bubbles: !0, composed: !0 }));
  }
  message(e) {
    return e && typeof e == "object" && "message" in e ? String(e.message) : String(e);
  }
  async load() {
    try {
      this.data = await this.hass.callWS({ type: `${se}/programs/get` }), this.error = "";
    } catch (e) {
      this.error = this.message(e);
    }
  }
  edit(e) {
    this.editing = e.id, this.draft = structuredClone(e);
  }
  async saveDraft() {
    const e = this.draft;
    this.busy = !0;
    try {
      this.data = await this.hass.callWS({
        type: `${se}/programs/save`,
        program_id: e.id,
        name: e.name,
        zone_ids: e.zone_ids,
        mode: e.mode,
        pause_between_s: e.pause_between_s,
        cycle_s: e.mode === "cycle_soak" ? e.cycle_s ?? 300 : e.cycle_s,
        soak_s: e.soak_s,
        start_time: e.start_time,
        finish_by: e.finish_by,
        sun_offset_min: e.sun_offset_min,
        weekdays: e.weekdays,
        interval_days: e.interval_days,
        skip_on_rain: e.skip_on_rain,
        skip_on_frost: e.skip_on_frost,
        skip_on_wind: e.skip_on_wind,
        enabled: e.enabled
      }), this.editing = null, this.draft = null, this.toast(`${e.name}: gespeichert`);
    } catch (t) {
      this.toast(`Nicht gespeichert: ${this.message(t)}`, !0);
    } finally {
      this.busy = !1;
    }
  }
  async toggle(e) {
    try {
      this.data = await this.hass.callWS({
        type: `${se}/programs/save`,
        program_id: e.id,
        enabled: !e.enabled
      });
    } catch (t) {
      this.toast(this.message(t), !0);
    }
  }
  async service(e, t, s) {
    try {
      await this.hass.callService(se, e, { program_id: t.id }), this.toast(s), await this.load();
    } catch (n) {
      this.toast(this.message(n), !0);
    }
  }
  async create() {
    const e = this.newName.trim();
    if (e)
      try {
        await this.hass.callWS({ type: `${se}/programs/create`, name: e }), this.newName = "", this.toast(`„${e}“ angelegt, wird geladen …`), setTimeout(() => void this.load(), 4e3);
      } catch (t) {
        this.toast(this.message(t), !0);
      }
  }
  async deleteProgram(e) {
    try {
      await this.hass.callWS({ type: `${se}/programs/delete`, program_id: e.id }), this.editing = null, this.toast(`„${e.name}“ gelöscht, wird geladen …`), setTimeout(() => void this.load(), 4e3);
    } catch (t) {
      this.toast(this.message(t), !0);
    }
  }
  // Darstellung -----------------------------------------------------------------
  render() {
    if (this.error) return o`<div class="overview"><p class="note warn">${this.error}</p></div>`;
    if (!this.data) return o`<div class="empty"><div class="spinner"></div></div>`;
    const e = this.data;
    return o`
      <div class="overview">
        ${e.winter_mode ? o`<p class="note warn">Winterpause: Es startet kein Programm automatisch.</p>` : e.automatic ? p : o`<p class="note warn">Automatik ist aus: Programme starten nur von Hand oder per Automation.</p>`}
        ${this.renderWeek()}
        <section class="programs">
          ${e.programs.map((t, s) => this.renderProgram(t, s))}
          <div class="card new-program">
            <h3>Neues Programm</h3>
            <div class="actions">
              <input type="text" placeholder="Name, z. B. Rasen abends" .value=${this.newName}
                @input=${(t) => this.newName = t.target.value}
                @keydown=${(t) => t.key === "Enter" && this.create()} />
              <button class="primary" ?disabled=${!this.newName.trim()} @click=${this.create}>Anlegen</button>
            </div>
            <p class="hint small">Neue Programme sind zuerst aus. Danach Zonen und Zeitplan wählen.</p>
          </div>
        </section>
        ${this.renderAutomations()}
      </div>
    `;
  }
  /** Woche: je Tag eine Zeile, jeder Start als Balken in seiner Länge. */
  renderWeek() {
    const e = this.data, t = Fe(/* @__PURE__ */ new Date(), this.tz), s = Array.from({ length: 7 }, (i, a) => {
      const r = /* @__PURE__ */ new Date(`${t.day}T12:00:00Z`);
      return r.setUTCDate(r.getUTCDate() + a), r;
    }), n = t.minutes / 1440 * 100;
    return o`
      <section class="card week">
        <h3>Die nächsten 7 Tage</h3>
        <div class="week-grid">
          <div class="hours">${[0, 3, 6, 9, 12, 15, 18, 21].map((i) => o`<span style="left:${i / 24 * 100}%">${i}</span>`)}</div>
          ${s.map((i, a) => {
      const r = i.toISOString().slice(0, 10), l = a === 0 ? "Heute" : i.toLocaleDateString("de-DE", { timeZone: "UTC", weekday: "short", day: "numeric" }), c = e.programs.flatMap(
        (d, m) => d.upcoming.map((u) => Fe(u, this.tz)).filter((u) => u.day === r).map((u) => {
          const v = u.minutes / 1440 * 100, S = Math.max(0.6, d.total_s / 86400 * 100);
          return o`<div class="block ${d.enabled ? "" : "off"} ${v + S > 70 ? "late" : ""}" title=${`${d.name}: ${u.time} Uhr, ${ye(d.total_s)}`}
                    style="left:${v}%; width:${S}%; --c:${ge[m % ge.length]}">
                    <span>${u.time} ${d.name}</span>
                  </div>`;
        })
      );
      return o`<div class="day"><span class="day-label">${l}</span>
              <div class="track">${c}${a === 0 ? o`<div class="now" style="left:${n}%"></div>` : p}</div></div>`;
    })}
        </div>
        <p class="hint small">Nur Programme, die automatisch starten (aktiv, Automatik an, keine Winterpause). Wetter kann einen Start noch überspringen.</p>
      </section>
    `;
  }
  renderProgram(e, t) {
    const s = this.editing === e.id;
    return o`
      <div class="card program" style="--c:${ge[t % ge.length]}">
        <div class="program-head">
          <span class="swatch" style="background:var(--c)"></span>
          <h3>${e.name}</h3>
          <span class="spacer"></span>
          <label class="check" title="Programm startet automatisch">
            <input type="checkbox" .checked=${e.enabled} @change=${() => this.toggle(e)} /> aktiv
          </label>
        </div>
        <p class="when">${Mt(e, this.data.window_end)}</p>
        <dl>
          <dt>Nächster Start</dt>
          <dd>${e.next_start ? this.fmtWhen(e.next_start) : "–"}${e.skip_next ? o` <em>(wird übersprungen)</em>` : p}</dd>
          <dt>Ablauf</dt>
          <dd>${Ne[e.mode] ?? e.mode}, ${ye(e.total_s)} gesamt</dd>
          <dt>Zonen</dt>
          <dd>${e.steps.length ? o`<ol class="steps">${e.steps.map((n) => o`<li>${n.zone_name} <small>${ye(n.duration_s)}</small></li>`)}</ol>` : o`<em>keine Zone mit Bedarf oder Dauer</em>`}</dd>
          ${e.last_result ? o`<dt>Zuletzt</dt><dd>${this.fmtWhen(e.last_result.at)}: ${e.last_result.started ? "gestartet" : `übersprungen (${e.last_result.reason})`}</dd>` : p}
        </dl>
        <div class="actions">
          <button class="text" @click=${() => s ? this.editing = null : this.edit(e)}>
            <ha-icon icon="mdi:pencil"></ha-icon>${s ? "Schließen" : "Bearbeiten"}
          </button>
          <span class="spacer"></span>
          <button class="text" ?disabled=${!e.next_start || e.skip_next} @click=${() => this.service("skip_next", e, `${e.name}: nächster Start wird übersprungen`)}>
            <ha-icon icon="mdi:skip-next"></ha-icon>Nächsten überspringen
          </button>
          <button class="text" @click=${() => this.service("run_program", e, `${e.name}: eingereiht`)}>
            <ha-icon icon="mdi:play"></ha-icon>Jetzt starten
          </button>
        </div>
        ${s && this.draft ? this.renderEditor(this.draft) : p}
      </div>
    `;
  }
  renderEditor(e) {
    const t = tt(e), s = () => this.draft = { ...e }, n = (a) => {
      const r = e.start_time === "sunset" || e.finish_by === "sunset" ? "sunset" : "sunrise";
      e.start_time = a === "start_time" ? "06:00" : a === "start_sun" ? r : null, e.finish_by = a === "finish_by" ? "07:00" : a === "finish_sun" ? r : null, a !== "start_sun" && a !== "finish_sun" && (e.sun_offset_min = 0), s();
    }, i = e.start_time === "sunset" || e.finish_by === "sunset" ? "sunset" : "sunrise";
    return o`
      <div class="editor">
        <label class="field wide"><span>Name</span>
          <input type="text" .value=${e.name} @change=${(a) => (e.name = a.target.value, s())} />
        </label>
        <div class="field wide"><span>Zonen (Reihenfolge = Ablauf)</span>
          <div class="zone-pick">
            ${this.zones.map((a) => {
      const r = e.zone_ids.indexOf(a.id);
      return o`<button class=${r >= 0 ? "active" : ""} @click=${() => {
        e.zone_ids = r >= 0 ? e.zone_ids.filter((l) => l !== a.id) : [...e.zone_ids, a.id], s();
      }}>${r >= 0 ? o`<b>${r + 1}</b>` : p}${a.name}</button>`;
    })}
          </div>
        </div>
        <label class="field wide"><span>Ablauf</span>
          <select @change=${(a) => (e.mode = a.target.value, s())}>
            ${Object.entries(Ne).map(([a, r]) => o`<option value=${a} ?selected=${a === e.mode}>${r}</option>`)}
          </select>
        </label>
        <div class="fields">
          <label class="field"><span>Pause zwischen Zonen</span>
            <input type="number" min="0" .value=${String(e.pause_between_s)}
              @change=${(a) => (e.pause_between_s = Number(a.target.value) || 0, s())} />
            <span class="unit">s</span></label>
          ${e.mode === "cycle_soak" ? o`<label class="field"><span>Gießphase</span>
                <input type="number" min="1" .value=${String(Math.round((e.cycle_s ?? 300) / 60))}
                  @change=${(a) => (e.cycle_s = Math.max(1, Number(a.target.value)) * 60, s())} />
                <span class="unit">min</span></label>
              <label class="field"><span>Einziehzeit</span>
                <input type="number" min="0" .value=${String(Math.round((e.soak_s ?? 0) / 60))}
                  @change=${(a) => (e.soak_s = Number(a.target.value) * 60 || null, s())} />
                <span class="unit">min</span></label>` : p}
        </div>
        <label class="field wide"><span>Wann?</span>
          <select @change=${(a) => n(a.target.value)}>
            <option value="finish_sun" ?selected=${t === "finish_sun"}>Fertig bis Sonnenaufgang/-untergang</option>
            <option value="start_sun" ?selected=${t === "start_sun"}>Start bei Sonnenaufgang/-untergang</option>
            <option value="finish_by" ?selected=${t === "finish_by"}>Fertig bis Uhrzeit</option>
            <option value="start_time" ?selected=${t === "start_time"}>Start um Uhrzeit</option>
            <option value="window" ?selected=${t === "window"}>Fertig bis Ende des Zeitfensters</option>
          </select>
        </label>
        ${t === "start_time" || t === "finish_by" ? o`<label class="field wide"><span>Uhrzeit</span>
              <input type="time" .value=${((t === "start_time" ? e.start_time : e.finish_by) ?? "").slice(0, 5)}
                @change=${(a) => {
      const r = a.target.value;
      t === "start_time" ? e.start_time = r : e.finish_by = r, s();
    }} /></label>` : p}
        ${t === "start_sun" || t === "finish_sun" ? o`<div class="fields">
              <label class="field"><span>Sonne</span>
                <select @change=${(a) => {
      const r = a.target.value;
      t === "start_sun" ? e.start_time = r : e.finish_by = r, s();
    }}>
                  <option value="sunrise" ?selected=${i === "sunrise"}>Sonnenaufgang</option>
                  <option value="sunset" ?selected=${i === "sunset"}>Sonnenuntergang</option>
                </select></label>
              <label class="field"><span>Versatz (− = vorher)</span>
                <input type="number" step="5" min="-360" max="360" .value=${String(e.sun_offset_min)}
                  @change=${(a) => (e.sun_offset_min = Math.round(Number(a.target.value) || 0), s())} />
                <span class="unit">min</span></label>
            </div>` : p}
        <div class="field wide"><span>Tage</span>
          <div class="levels">
            ${et.map((a, r) => o`<button class=${e.weekdays.includes(r) ? "active" : ""} ?disabled=${!!e.interval_days}
              @click=${() => (e.weekdays = e.weekdays.includes(r) ? e.weekdays.filter((l) => l !== r) : [...e.weekdays, r].sort(), s())}>${a}</button>`)}
          </div>
          <small class="hint">Keiner gewählt = jeden Tag.</small>
        </div>
        <label class="field wide"><span>Oder alle N Tage (0 = aus)</span>
          <input type="number" min="0" max="60" .value=${String(e.interval_days ?? 0)}
            @change=${(a) => (e.interval_days = Number(a.target.value) || null, s())} /></label>
        <div class="checks">
          ${["skip_on_rain", "skip_on_frost", "skip_on_wind"].map(
      (a) => o`<label class="check"><input type="checkbox" .checked=${e[a]}
              @change=${(r) => (e[a] = r.target.checked, s())} />
              ${{ skip_on_rain: "Bei Regen überspringen", skip_on_frost: "Bei Frost überspringen", skip_on_wind: "Bei starkem Wind überspringen" }[a]}</label>`
    )}
        </div>
        <div class="actions">
          <button class="text danger" @click=${() => this.deleteProgram(e)}><ha-icon icon="mdi:delete-outline"></ha-icon>Löschen</button>
          <span class="spacer"></span>
          <button class="text" @click=${() => (this.editing = null, this.draft = null)}>Abbrechen</button>
          <button class="primary" ?disabled=${this.busy} @click=${this.saveDraft}>Speichern</button>
        </div>
      </div>
    `;
  }
  renderAutomations() {
    const e = this.data, t = `triggers:
  - trigger: event
    event_type: irrigation_planner_run_finished
actions:
  - action: notify.notify
    data:
      message: >-
        {{ trigger.event.data.zone_name }} fertig
        ({{ (trigger.event.data.seconds_open / 60) | round }} min)`, s = e.programs[0]?.id ?? "morgens";
    return o`
      <section class="card">
        <h3>Für eigene Automationen</h3>
        <p class="hint small">
          Du kannst Programme auch aus eigenen Home-Assistant-Automationen starten, z. B. wenn der
          Bodenfeuchtesensor zu trocken meldet. Setze das Programm hier auf „aus“, wenn nur die
          Automation es starten soll. Gießen läuft dabei immer über die Warteschlange: nie zwei
          Ventile gleichzeitig, nie ohne Dauer.
        </p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Programm</th><th>Starten (Dienst)</th><th>Entitäten</th></tr></thead>
            <tbody>
              ${e.programs.map(
      (n) => o`<tr>
                  <td>${n.name}</td>
                  <td><code>irrigation_planner.run_program</code><br /><small>program_id: <code>${n.id}</code></small></td>
                  <td>${Object.values(n.entities).map((i) => o`<code>${i}</code><br />`)}</td>
                </tr>`
    )}
            </tbody>
          </table>
        </div>
        <h3>Ereignisse</h3>
        <ul class="events">
          ${e.events.map((n) => o`<li><code>${n.type}</code> – ${n.description}</li>`)}
        </ul>
        <h3>Beispiele</h3>
        <p class="hint small">Benachrichtigung, wenn eine Zone fertig ist:</p>
        <pre>${t}</pre>
        <p class="hint small">Programm aus einer Automation starten:</p>
        <pre>actions:
  - action: irrigation_planner.run_program
    data:
      program_id: ${s}</pre>
        <p class="hint small">Weitere Dienste: <code>run_zone</code> (Zone mit Dauer einreihen), <code>stop_all</code>, <code>skip_next</code>, <code>release_zone</code>.</p>
      </section>
    `;
  }
};
F.styles = be;
U([
  H({ attribute: !1 })
], F.prototype, "hass", 2);
U([
  H({ attribute: !1 })
], F.prototype, "zones", 2);
U([
  f()
], F.prototype, "data", 2);
U([
  f()
], F.prototype, "error", 2);
U([
  f()
], F.prototype, "editing", 2);
U([
  f()
], F.prototype, "draft", 2);
U([
  f()
], F.prototype, "newName", 2);
U([
  f()
], F.prototype, "busy", 2);
F = U([
  pe("ip-schedule")
], F);
var Pt = Object.defineProperty, Dt = Object.getOwnPropertyDescriptor, q = (e, t, s, n) => {
  for (var i = n > 1 ? void 0 : n ? Dt(t, s) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (n ? r(t, s, i) : r(i)) || i);
  return n && i && Pt(t, s, i), i;
};
function Tt(e, t) {
  const s = [];
  for (const [n, i] of Object.entries(e ?? {})) {
    const a = n.split(".")[0];
    if (!t.domains.includes(a) || n.startsWith("sensor.irrigation_planner")) continue;
    const r = String(i.attributes.unit_of_measurement ?? ""), l = String(i.attributes.device_class ?? ""), d = !!!(t.deviceClasses?.length || t.units?.length) || !!t.deviceClasses?.includes(l) || !!(r && t.units?.includes(r));
    s.push({
      entity_id: n,
      name: String(i.attributes.friendly_name ?? n),
      state: i.state,
      unit: r,
      device_class: l,
      match: d
    });
  }
  return s.sort(
    (n, i) => Number(i.match) - Number(n.match) || n.name.localeCompare(i.name, "de")
  );
}
function Et(e, t) {
  const s = t.toLowerCase().split(/\s+/).filter(Boolean);
  return s.length ? e.filter((n) => {
    const i = `${n.name} ${n.entity_id}`.toLowerCase();
    return s.every((a) => i.includes(a));
  }) : e;
}
const we = 60;
let R = class extends he {
  constructor() {
    super(...arguments), this.value = "", this.filter = { domains: ["sensor"] }, this.placeholder = "Suchen: Name oder Entität …", this.open = !1, this.query = "", this.showAll = !1, this.active = 0;
  }
  visible() {
    const e = Et(Tt(this.hass?.states, this.filter), this.query);
    return this.showAll || this.query.trim() ? e : e.filter((t) => t.match);
  }
  choose(e) {
    this.value = e, this.open = !1, this.query = "", this.dispatchEvent(new CustomEvent("value-changed", { detail: { value: e }, bubbles: !0, composed: !0 }));
  }
  openList() {
    this.open = !0, this.active = 0, this.updateComplete.then(() => this.shadowRoot?.querySelector("input")?.focus());
  }
  onKey(e, t) {
    e.key === "ArrowDown" ? (this.active = Math.min(t.length - 1, this.active + 1), e.preventDefault()) : e.key === "ArrowUp" ? (this.active = Math.max(0, this.active - 1), e.preventDefault()) : e.key === "Enter" && t[this.active] ? (this.choose(t[this.active].entity_id), e.preventDefault()) : e.key === "Escape" && (this.open = !1);
  }
  fmt(e) {
    return e.state === "unavailable" ? "nicht erreichbar" : e.state === "unknown" ? "–" : e.unit ? `${e.state} ${e.unit}` : e.state;
  }
  render() {
    const e = this.value ? this.hass?.states?.[this.value] : void 0;
    if (!this.open)
      return o`<div class="box" @click=${this.openList}>
        ${this.value ? o`<span class="chosen"
                ><span>${String(e?.attributes.friendly_name ?? this.value)}</span><small>${this.value}</small></span
              >${e ? o`<span class="value"
                    >${this.fmt({ state: e.state, unit: String(e.attributes.unit_of_measurement ?? "") })}</span
                  >` : p}
              <button title="Andere wählen" @click=${(a) => (a.stopPropagation(), this.openList())}>ändern</button>` : o`<span class="chosen"><small>(bitte wählen)</small></span><button>wählen</button>`}
      </div>`;
    const t = this.visible(), s = t.slice(0, we), n = !this.showAll && !this.query.trim();
    let i = s.findIndex((a) => !a.match);
    return o`
      <div class="box open">
        <input
          .value=${this.query}
          placeholder=${this.placeholder}
          @input=${(a) => (this.query = a.target.value, this.active = 0)}
          @keydown=${(a) => this.onKey(a, s)}
          @blur=${() => setTimeout(() => this.open = !1, 200)}
        />
        <button @mousedown=${(a) => a.preventDefault()} @click=${() => this.open = !1}>schließen</button>
      </div>
      <div class="list" @mousedown=${(a) => a.preventDefault()}>
        ${s.length ? p : o`<div class="empty">Nichts gefunden.</div>`}
        ${s.map((a, r) => {
      const l = r === i && r > 0 ? o`<div class="sep">Weitere Entitäten</div>` : p;
      return r === i && (i = -1), o`${l}<button class="item ${r === this.active ? "active" : ""} ${a.match ? "" : "other"}"
              @click=${() => this.choose(a.entity_id)}>
              <span class="text"><span>${a.name}</span><small>${a.entity_id}</small></span>
              <span class="value">${this.fmt(a)}</span>
            </button>`;
    })}
        ${t.length > we ? o`<div class="empty">… ${t.length - we} weitere, bitte genauer suchen.</div>` : p}
        ${n ? o`<button class="more" @click=${() => this.showAll = !0}>Alle Entitäten anzeigen</button>` : p}
      </div>
    `;
  }
};
R.styles = Ue`
    :host {
      display: block;
      position: relative;
    }
    .box {
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--line, var(--divider-color, #ddd));
      border-radius: 8px;
      padding: 6px 10px;
      background: var(--input-fill-color, color-mix(in srgb, var(--primary-text-color) 5%, transparent));
      cursor: text;
    }
    .box.open {
      outline: 2px solid var(--accent, var(--primary-color));
      outline-offset: -1px;
    }
    input {
      flex: 1;
      min-width: 0;
      border: 0;
      background: none;
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color);
      outline: none;
      padding: 2px 0;
    }
    .chosen {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      font-size: 14px;
    }
    .chosen small,
    .item small {
      color: var(--secondary-text-color);
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .value {
      color: var(--secondary-text-color);
      font-size: 13px;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    button {
      font: inherit;
      border: 0;
      background: none;
      color: var(--accent, var(--primary-color));
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 6px;
    }
    .list {
      position: absolute;
      z-index: 20;
      left: 0;
      right: 0;
      top: calc(100% + 4px);
      max-height: 320px;
      overflow-y: auto;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--line, var(--divider-color, #ddd));
      border-radius: 10px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
      padding: 4px;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      text-align: left;
      color: var(--primary-text-color);
      padding: 7px 10px;
    }
    .item .text {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .item.active,
    .item:hover {
      background: color-mix(in srgb, var(--accent, var(--primary-color)) 12%, transparent);
    }
    .item.other .text > span {
      opacity: 0.75;
    }
    .sep,
    .empty {
      font-size: 12px;
      color: var(--secondary-text-color);
      padding: 6px 10px 2px;
    }
    .more {
      width: 100%;
      text-align: center;
      font-size: 13px;
    }
  `;
q([
  H({ attribute: !1 })
], R.prototype, "hass", 2);
q([
  H()
], R.prototype, "value", 2);
q([
  H({ attribute: !1 })
], R.prototype, "filter", 2);
q([
  H()
], R.prototype, "placeholder", 2);
q([
  f()
], R.prototype, "open", 2);
q([
  f()
], R.prototype, "query", 2);
q([
  f()
], R.prototype, "showAll", 2);
q([
  f()
], R.prototype, "active", 2);
R = q([
  pe("ip-entity-pick")
], R);
var At = Object.defineProperty, Ot = Object.getOwnPropertyDescriptor, W = (e, t, s, n) => {
  for (var i = n > 1 ? void 0 : n ? Ot(t, s) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (n ? r(t, s, i) : r(i)) || i);
  return n && i && At(t, s, i), i;
};
const j = "irrigation_planner", ae = "__new__", Re = ["valve", "flow", "volume", "status", "battery"], je = {
  valve: { name: "Schalten", hint: "Schalter oder Ventil, das geöffnet wird (Pflicht)" },
  flow: { name: "Durchfluss", hint: "L/min, für die Überwachung (Leck, kein Wasser)" },
  volume: { name: "Menge", hint: "Liter je Lauf, z. B. „Bewässerungsmenge“" },
  status: { name: "Gerätestatus", hint: "Meldet z. B. Wassermangel oder Leck" },
  battery: { name: "Batterie", hint: "Ladestand in %" }
}, Ie = {
  zigbee2mqtt: "Zigbee2MQTT (Dauer ans Gerät)",
  service_call: "Dienstaufruf (Dauer ans Gerät)",
  ha_switch: "Schalter (nur Home Assistant überwacht)",
  ha_valve: "Ventil-Entität (nur Home Assistant überwacht)"
}, Ve = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge (mm)",
  temperature: "Temperatur",
  humidity: "Luftfeuchte",
  wind_speed: "Wind"
}, xe = ["temperature", "humidity", "wind_speed"], Wt = {
  soil_moisture: { domains: ["sensor"], deviceClasses: ["moisture"], units: ["%"] },
  rain_mm: { domains: ["sensor"], deviceClasses: ["precipitation"], units: ["mm"] },
  temperature: { domains: ["sensor"], deviceClasses: ["temperature"], units: ["°C", "°F"] },
  humidity: { domains: ["sensor"], deviceClasses: ["humidity"], units: ["%"] },
  wind_speed: { domains: ["sensor"], deviceClasses: ["wind_speed"], units: ["km/h", "m/s", "mph", "kn"] }
}, Lt = {
  soil_moisture: "%",
  rain_mm: "mm",
  temperature: "°C",
  humidity: "%",
  wind_speed: ""
};
function Bt(e, t) {
  return t === "valve" ? e.filter((s) => s.domain === "switch" || s.domain === "valve") : t === "status" ? e.filter((s) => s.domain === "sensor" || s.domain === "binary_sensor") : t === "battery" ? e.filter((s) => s.domain === "sensor" && s.device_class === "battery") : e.filter((s) => s.domain === "sensor");
}
function Zt(e, t, s, n) {
  let i = t.name;
  for (let a = 2; n.includes(i); a++) i = `${t.name} ${a}`;
  return {
    valve_id: null,
    name: i,
    device_id: e,
    driver: t.driver,
    profile: t.profile,
    entities: { ...t.entities },
    driver_options: { ...t.driver_options },
    water_supply_id: s[0]?.id ?? ae,
    new_supply_name: "Hauswasser",
    zone_ids: [],
    new_zone_name: i,
    new_zone_minutes: 10,
    detected: t.profile_name
  };
}
function Nt(e) {
  return e.safety_level === "device" || e.device_timer ? { level: "ok", text: "Gerät schließt selbst" } : e.driver === "zigbee2mqtt" || e.driver === "service_call" ? { level: "warn", text: "Dauer geht ans Gerät; Testlauf zeigt, ob es selbst schließt" } : { level: "warn", text: "Nur Home Assistant überwacht die Zeit" };
}
function fe(e, t = "") {
  return e == null || e === "unknown" ? "–" : e === "unavailable" ? "nicht erreichbar" : e === "on" || e === "open" ? "offen" : e === "off" || e === "closed" ? "zu" : t ? `${e} ${t}` : e;
}
let A = class extends he {
  constructor() {
    super(...arguments), this.error = "", this.draft = null, this.deviceEntities = [], this.filter = "", this.sensorDraft = null, this.saving = !1, this.testFor = null, this.testSeconds = 10, this.testing = !1, this.testResult = null, this.settingsDraft = null;
  }
  connectedCallback() {
    super.connectedCallback(), this.load();
  }
  toast(e, t = !1) {
    this.dispatchEvent(new CustomEvent("ip-toast", { detail: { text: e, isError: t }, bubbles: !0, composed: !0 }));
  }
  message(e) {
    return e && typeof e == "object" && "message" in e ? String(e.message) : String(e);
  }
  async load() {
    try {
      this.data = await this.hass.callWS({ type: `${j}/devices/get` }), this.testSeconds = Math.max(this.testSeconds, this.data.test_min_s), this.error = "";
    } catch (e) {
      this.error = this.message(e);
    }
  }
  /** Nach Speichern/Löschen: Bewässerungsplaner lädt neu, danach frisch holen. */
  reloaded(e) {
    this.toast(`${e}, wird neu geladen …`), this.dispatchEvent(new CustomEvent("ip-reloaded", { bubbles: !0, composed: !0 })), setTimeout(() => void this.load(), 4e3);
  }
  // Ventile ----------------------------------------------------------------------
  async pickDevice(e) {
    if (e)
      try {
        const t = await this.hass.callWS({ type: `${j}/devices/suggest`, device_id: e });
        this.deviceEntities = t.device_entities;
        const s = this.data.valves.map((n) => n.name);
        this.draft = Zt(e, t, this.data.supplies, s);
      } catch (t) {
        this.toast(this.message(t), !0);
      }
  }
  async edit(e) {
    this.sensorDraft = null, this.testFor = null;
    try {
      const t = await this.hass.callWS({ type: `${j}/devices/suggest`, device_id: e.device_id });
      this.deviceEntities = t.device_entities;
    } catch {
      this.deviceEntities = [];
    }
    this.draft = {
      valve_id: e.id,
      name: e.name,
      device_id: e.device_id,
      driver: e.driver,
      profile: e.profile,
      entities: { ...e.entities },
      driver_options: { ...e.driver_options },
      water_supply_id: e.water_supply_id ?? this.data.supplies[0]?.id ?? ae,
      new_supply_name: "Hauswasser",
      zone_ids: [...e.zone_ids],
      new_zone_name: "",
      new_zone_minutes: 10,
      detected: null
    };
  }
  startNew() {
    this.sensorDraft = null, this.testFor = null, this.filter = "", this.deviceEntities = [], this.draft = {
      valve_id: null,
      name: "",
      device_id: "",
      driver: "",
      profile: null,
      entities: {},
      driver_options: {},
      water_supply_id: this.data.supplies[0]?.id ?? ae,
      new_supply_name: "Hauswasser",
      zone_ids: [],
      new_zone_name: "",
      new_zone_minutes: 10,
      detected: null
    };
  }
  async saveValve() {
    const e = this.draft;
    this.saving = !0;
    try {
      const t = { ...e.driver_options }, s = await this.hass.callWS({
        type: `${j}/devices/save_valve`,
        valve_id: e.valve_id,
        name: e.name.trim(),
        device_id: e.device_id,
        driver: e.driver,
        profile: e.profile,
        entities: Object.fromEntries(Re.map((i) => [i, e.entities[i] || null])),
        driver_options: t,
        water_supply_id: e.water_supply_id,
        new_supply_name: e.new_supply_name,
        zone_ids: e.zone_ids,
        new_zone_name: e.new_zone_name.trim() || null,
        new_zone_minutes: e.new_zone_minutes
      }), n = !e.valve_id;
      this.draft = null, this.reloaded(`„${e.name}“ gespeichert`), n && (this.testFor = s.id, this.testResult = null);
    } catch (t) {
      this.toast(`Nicht gespeichert: ${this.message(t)}`, !0);
    } finally {
      this.saving = !1;
    }
  }
  async deleteValve(e) {
    if (e.valve_id && confirm(`Ventil „${e.name}“ löschen? Die Zonen bleiben (ohne Ventil).`))
      try {
        await this.hass.callWS({ type: `${j}/devices/delete_valve`, valve_id: e.valve_id }), this.draft = null, this.reloaded(`„${e.name}“ gelöscht`);
      } catch (t) {
        this.toast(this.message(t), !0);
      }
  }
  async runTest(e) {
    this.testing = !0, this.testResult = null;
    try {
      const t = await this.hass.callWS({
        type: `${j}/devices/test_valve`,
        valve_id: e.id,
        seconds: this.testSeconds
      });
      this.testResult = { ...t, valve: e.id }, setTimeout(() => void this.load(), 4e3);
    } catch (t) {
      this.testResult = { level: "error", text: this.message(t), flow_l_min: null, closed_ok: !0, seconds: 0, valve: e.id };
    } finally {
      this.testing = !1;
    }
  }
  // Sensoren ---------------------------------------------------------------------
  async saveSensor() {
    const e = this.sensorDraft;
    this.saving = !0;
    try {
      await this.hass.callWS({
        type: `${j}/devices/save_sensor`,
        ...e,
        name: e.name.trim(),
        zone_ids: xe.includes(e.kind) ? [] : e.zone_ids
      }), this.sensorDraft = null, this.reloaded(`„${e.name}“ gespeichert`);
    } catch (t) {
      this.toast(`Nicht gespeichert: ${this.message(t)}`, !0);
    } finally {
      this.saving = !1;
    }
  }
  // Wetter, Zeitfenster, Winterpause -----------------------------------------------
  async saveSettings() {
    const e = this.settingsDraft;
    this.saving = !0;
    try {
      await this.hass.callWS({
        type: `${j}/devices/save_settings`,
        weather_entity: e.weather_entity || null,
        window_start: (e.window_start ?? "").slice(0, 5),
        window_end: (e.window_end ?? "").slice(0, 5),
        winter_start: e.winter_start || null,
        winter_end: e.winter_end || null
      }), this.settingsDraft = null, this.reloaded("Einstellungen gespeichert");
    } catch (t) {
      this.toast(`Nicht gespeichert: ${this.message(t)}`, !0);
    } finally {
      this.saving = !1;
    }
  }
  async setWinter(e) {
    if (confirm(e ? "Winterpause einschalten? Alle Ventile werden geschlossen, Zeitpläne ruhen, und die Ventil-Geräte werden deaktiviert." : "Winterpause beenden? Die Ventil-Geräte werden wieder aktiviert, Zeitpläne laufen wieder (wenn die Automatik an ist)."))
      try {
        await this.hass.callWS({ type: `${j}/settings/winter`, on: e }), this.toast(e ? "Winterpause ein" : "Winterpause aus: Saison läuft"), setTimeout(() => void this.load(), 1500);
      } catch (s) {
        this.toast(this.message(s), !0);
      }
  }
  renderSettings() {
    const e = this.data, t = e.settings, s = this.settingsDraft, n = t.weather_entity ? this.hass?.states?.[t.weather_entity] : void 0, i = (r) => (r ?? "").slice(0, 5) || "–", a = (r) => r ? `${r.slice(3, 5)}.${r.slice(0, 2)}.` : "–";
    return o`
      <section class="card">
        <div class="section-head">
          <h2>Wetter, Zeitfenster und Saison</h2>
          <span class="spacer"></span>
          ${s ? p : o`<button class="text" ?disabled=${e.busy} @click=${() => this.settingsDraft = { ...t }}>Ändern</button>`}
        </div>
        <div class="season-row">
          <span class="pill ${t.winter_mode ? "warn" : "ok"}">
            ${t.winter_mode ? "❄ Winterpause: nichts wird gegossen" : "☀ Saison: Bewässerung aktiv"}
          </span>
          <button class="primary" @click=${() => this.setWinter(!t.winter_mode)}>
            <ha-icon icon=${t.winter_mode ? "mdi:weather-sunny" : "mdi:snowflake"}></ha-icon>
            ${t.winter_mode ? "Winterpause beenden" : "Winterpause einschalten"}
          </button>
        </div>
        ${s ? this.renderSettingsEditor(s) : o`<div class="table-wrap"><table>
              <tbody>
                <tr><td>Wetter-Entität</td><td>${t.weather_entity ? o`${String(n?.attributes.friendly_name ?? t.weather_entity)} <small class="hint">${t.weather_entity}</small>` : o`<span class="hint">keine (dann nur eigene Fühler oder Dauer von Hand)</span>`}</td></tr>
                <tr><td>Zeitfenster</td><td>${i(t.window_start)} bis ${i(t.window_end)} Uhr</td></tr>
                <tr><td>Winterpause automatisch</td><td>${t.winter_start || t.winter_end ? `vom ${a(t.winter_start)} bis ${a(t.winter_end)}` : o`<span class="hint">aus (nur von Hand)</span>`}</td></tr>
              </tbody></table></div>`}
      </section>
    `;
  }
  renderSettingsEditor(e) {
    const t = this.data, s = () => this.settingsDraft = { ...e }, n = (r) => r ? `2000-${r}` : "", i = (r) => r ? r.slice(5) : null, a = !!e.window_start && !!e.window_end && !this.saving && !t.busy;
    return o`
      <div class="editor">
        <div class="field wide"><span>Wetter-Entität (Wetterdienst oder Wetterstation)</span>
          <ip-entity-pick
            .hass=${this.hass}
            .value=${e.weather_entity ?? ""}
            .filter=${{ domains: ["weather"] }}
            @value-changed=${(r) => (e.weather_entity = r.detail.value, s())}
          ></ip-entity-pick>
          ${e.weather_entity ? o`<button class="text small" @click=${() => (e.weather_entity = null, s())}>keine Wetter-Entität</button>` : p}
          <small class="hint">Liefert Temperatur, Luftfeuchte, Wind, Regen und die Vorhersage. Eigene Fühler (Sensoren oben) gehen vor.</small>
        </div>
        <div class="fields">
          <label class="field"><span>Gießen ab</span>
            <input type="time" .value=${(e.window_start ?? "").slice(0, 5)} @change=${(r) => (e.window_start = r.target.value, s())} /></label>
          <label class="field"><span>Fertig bis</span>
            <input type="time" .value=${(e.window_end ?? "").slice(0, 5)} @change=${(r) => (e.window_end = r.target.value, s())} /></label>
        </div>
        <div class="fields">
          <label class="field"><span>Winterpause automatisch ab</span>
            <input type="date" .value=${n(e.winter_start)} @change=${(r) => (e.winter_start = i(r.target.value), s())} /></label>
          <label class="field"><span>bis (danach Saison)</span>
            <input type="date" .value=${n(e.winter_end)} @change=${(r) => (e.winter_end = i(r.target.value), s())} /></label>
        </div>
        <small class="hint">Nur Tag und Monat zählen, das Jahr ist egal. Leer lassen = Winterpause nur von Hand.</small>
        <div class="actions">
          <span class="spacer"></span>
          <button class="text" @click=${() => this.settingsDraft = null}>Abbrechen</button>
          <button class="primary" ?disabled=${!a} @click=${this.saveSettings}>Speichern</button>
        </div>
      </div>
    `;
  }
  async deleteSensor(e) {
    if (!(!e.sensor_id || !confirm(`Sensor „${e.name}“ entfernen?`)))
      try {
        await this.hass.callWS({ type: `${j}/devices/delete_sensor`, sensor_id: e.sensor_id }), this.sensorDraft = null, this.reloaded(`„${e.name}“ entfernt`);
      } catch (t) {
        this.toast(this.message(t), !0);
      }
  }
  // Darstellung ------------------------------------------------------------------
  render() {
    if (this.error) return o`<div class="overview"><p class="note warn">${this.error}</p></div>`;
    if (!this.data) return o`<div class="empty"><div class="spinner"></div></div>`;
    const e = this.data;
    return o`
      <div class="overview devices">
        ${e.busy ? o`<p class="note warn">Gerade wird gegossen. Ändern geht erst, wenn alles fertig ist.</p>` : p}
        <section class="card">
          <div class="section-head">
            <h2>Ventile</h2>
            <span class="spacer"></span>
            <button class="primary" ?disabled=${e.busy || this.draft !== null && !this.draft.valve_id} @click=${this.startNew}>
              <ha-icon icon="mdi:plus"></ha-icon>Ventil hinzufügen
            </button>
          </div>
          ${this.draft && !this.draft.valve_id ? this.renderValveEditor(this.draft) : p}
          ${e.valves.length ? o`<div class="table-wrap">
                <table class="devices-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Gerät</th><th>Treiber</th><th>Sicherheit</th><th>Zonen</th>
                      <th>Versorgung</th><th class="n">Durchfluss</th><th>Zustand</th><th></th>
                    </tr>
                  </thead>
                  <tbody>${e.valves.map((t) => this.renderValveRow(t))}</tbody>
                </table>
              </div>` : o`<p class="hint">Noch kein Ventil. „Ventil hinzufügen“ und das Gerät wählen, den Rest schlägt der Bewässerungsplaner vor.</p>`}
        </section>
        ${this.renderSensors()}
        ${this.renderSettings()}
        <p class="hint small">
          Neue Ventile, Zonen und Sensoren brauchen ein Neuladen des Bewässerungsplaners; das passiert beim Speichern
          von selbst (nur wenn gerade nicht gegossen wird). Die Lage auf dem Plan und die Leitung zeichnest du auf der Seite „Plan“.
        </p>
      </div>
    `;
  }
  renderValveRow(e) {
    const t = this.data, s = Nt(e), n = t.zones.filter((c) => e.zone_ids.includes(c.id)).map((c) => c.name), i = t.supplies.find((c) => c.id === e.water_supply_id)?.name ?? "–", a = this.draft?.valve_id === e.id, r = this.testFor === e.id, l = e.learned_flow_l_min != null ? `${e.learned_flow_l_min.toFixed(1)} L/min` : "–";
    return o`
      <tr class=${a ? "selected" : ""}>
        <td><strong>${e.name}</strong></td>
        <td class="device-cell">
          ${e.device_name ?? o`<span class="bad-text">Gerät fehlt</span>`}
          ${e.manufacturer || e.model ? o`<br /><small class="hint">${[e.manufacturer, e.model].filter(Boolean).join(" ")}</small>` : p}
        </td>
        <td>${Ie[e.driver]?.split(" (")[0] ?? e.driver}${e.profile ? o`<br /><small class="hint">Profil ${t.profiles.find((c) => c.id === e.profile)?.name ?? e.profile}</small>` : p}</td>
        <td><span class="pill ${s.level}">${s.level === "ok" ? "🟢" : "🟡"} ${s.text}</span></td>
        <td>${n.length ? n.join(", ") : o`<span class="hint">keine</span>`}</td>
        <td>${i}</td>
        <td class="n" title="Gelernter Durchfluss">${l}</td>
        <td>
          ${fe(e.state)}
          ${e.battery != null && e.battery !== "unknown" ? o`<br /><small class="hint">Batterie ${fe(e.battery, "%")}</small>` : p}
        </td>
        <td class="row-actions">
          <button class="text small" ?disabled=${t.busy} @click=${() => a ? this.draft = null : void this.edit(e)}>
            ${a ? "Schließen" : "Ändern"}
          </button>
          <button class="text small" ?disabled=${t.busy || this.testing}
            @click=${() => (this.testFor = r ? null : e.id, this.testResult = null, this.draft = null)}>Testlauf</button>
        </td>
      </tr>
      ${a ? o`<tr class="editor-row"><td colspan="9">${this.renderValveEditor(this.draft)}</td></tr>` : p}
      ${r ? o`<tr class="editor-row"><td colspan="9">${this.renderTest(e)}</td></tr>` : p}
    `;
  }
  renderTest(e) {
    const t = this.data, s = this.testResult?.valve === e.id ? this.testResult : null;
    return o`
      <div class="editor test-box">
        <h3>Testlauf „${e.name}“</h3>
        <p class="note warn">
          Das Ventil wird wirklich geöffnet und Wasser läuft. Danach wird geprüft, ob das Gerät von selbst schließt;
          zur Sicherheit schließt Home Assistant auf jeden Fall. Erlaubt sind ${t.test_min_s} bis ${t.test_max_s} Sekunden.
        </p>
        <div class="fields">
          <label class="field"><span>Dauer</span>
            <input type="number" min=${t.test_min_s} max=${t.test_max_s} step="1" .value=${String(this.testSeconds)}
              @change=${(n) => {
      const i = Math.round(Number(n.target.value) || t.test_min_s);
      this.testSeconds = Math.min(t.test_max_s, Math.max(t.test_min_s, i));
    }} />
            <span class="unit">s</span></label>
          <span class="field"></span>
        </div>
        ${this.testing ? o`<p class="note"><span class="spinner inline"></span> Testlauf läuft … Das dauert etwa ${this.testSeconds + 15} s.</p>` : p}
        ${s ? o`<p class="note ${s.level === "ok" ? "" : "warn"}">
              ${s.level === "ok" ? "🟢" : s.level === "warn" ? "🟡" : "🔴"} ${s.text}
              ${s.seconds ? o`<br />Durchfluss: ${s.flow_l_min != null ? `${s.flow_l_min.toFixed(1)} L/min` : "kein Messwert"}.
                Ventil wieder zu: ${s.closed_ok ? "ja" : o`<strong>NEIN, bitte sofort von Hand prüfen!</strong>`}` : p}
            </p>` : p}
        <div class="actions">
          <span class="spacer"></span>
          <button class="text" ?disabled=${this.testing} @click=${() => (this.testFor = null, this.testResult = null)}>Schließen</button>
          <button class="primary" ?disabled=${this.testing || t.busy} @click=${() => this.runTest(e)}>
            <ha-icon icon="mdi:water"></ha-icon>${s ? "Noch einmal testen" : `Jetzt ${this.testSeconds} s testen`}
          </button>
        </div>
      </div>
    `;
  }
  renderDevicePicker() {
    const e = this.filter.trim().toLowerCase(), t = this.data.candidates.filter(
      (n) => !e || `${n.name} ${n.manufacturer ?? ""} ${n.model ?? ""} ${n.area ?? ""}`.toLowerCase().includes(e)
    ), s = (n) => this.data.valves.find((i) => i.id === n)?.name ?? n;
    return o`
      <label class="field wide"><span>1. Gerät wählen</span>
        <input type="search" placeholder="Suchen: Name, Hersteller, Raum …" .value=${this.filter}
          @input=${(n) => this.filter = n.target.value} /></label>
      ${t.length ? o`<div class="device-list">
            ${t.map(
      (n) => o`<button class="device-pick ${n.used_by ? "used" : ""}" @click=${() => this.pickDevice(n.device_id)}>
                <ha-icon icon=${n.profile ? "mdi:water-check" : "mdi:valve"}></ha-icon>
                <span class="grow"><strong>${n.name}</strong>
                  <small>${[n.manufacturer, n.model, n.area].filter(Boolean).join(" · ") || "unbekanntes Gerät"}</small></span>
                ${n.profile ? o`<span class="pill ok">Profil ${n.profile}</span>` : p}
                ${n.used_by ? o`<span class="pill">schon Ventil „${s(n.used_by)}“</span>` : p}
              </button>`
    )}
          </div>` : o`<p class="hint">Kein passendes Gerät. Ventile brauchen eine Schalter- oder Ventil-Entität in Home Assistant
            (z. B. über Zigbee2MQTT oder ZHA eingebunden).</p>`}
    `;
  }
  renderValveEditor(e) {
    const t = this.data, s = () => this.draft = { ...e };
    if (!e.device_id)
      return o`<div class="editor">
        ${this.renderDevicePicker()}
        <div class="actions"><span class="spacer"></span>
          <button class="text" @click=${() => this.draft = null}>Abbrechen</button></div>
      </div>`;
    const n = t.profiles.filter((d) => d.driver === e.driver), i = new Set(this.deviceEntities.map((d) => d.entity_id)), a = e.driver_options, r = (d, m) => (e.driver_options = { ...a, [d]: m }, s()), l = !!e.name.trim() && !!e.entities.valve && !!e.driver && !this.saving && !t.busy, c = t.candidates.find((d) => d.device_id === e.device_id)?.name ?? t.valves.find((d) => d.device_id === e.device_id)?.device_name ?? "Gerät";
    return o`
      <div class="editor">
        <div class="device-head">
          <ha-icon icon="mdi:valve"></ha-icon>
          <strong>${c}</strong>
          ${e.detected ? o`<span class="pill ok">Erkannt: ${e.detected}</span>` : p}
          <span class="spacer"></span>
          ${e.valve_id ? p : o`<button class="text small" @click=${() => (e.device_id = "", s())}>anderes Gerät</button>`}
        </div>
        ${e.detected ? o`<p class="hint small">Alles unten ist schon vorausgefüllt. Meist reicht es, Zone und Wasserversorgung zu prüfen und zu speichern.</p>` : p}

        <div class="fields">
          <label class="field"><span>Name</span>
            <input .value=${e.name} maxlength="60" @input=${(d) => (e.name = d.target.value, s())} /></label>
          <label class="field"><span>Treiber</span>
            <select @change=${(d) => {
      e.driver = d.target.value, e.profile && !t.profiles.some((m) => m.id === e.profile && m.driver === e.driver) && (e.profile = null), s();
    }}>
              ${t.drivers.map((d) => o`<option value=${d} ?selected=${d === e.driver}>${Ie[d] ?? d}</option>`)}
            </select></label>
          <label class="field"><span>Geräteprofil</span>
            <select @change=${(d) => (e.profile = d.target.value || null, s())}>
              <option value="" ?selected=${!e.profile}>(keins)</option>
              ${n.map((d) => o`<option value=${d.id} ?selected=${d.id === e.profile}>${d.name}</option>`)}
            </select></label>
        </div>

        <div class="table-wrap">
          <table class="roles">
            <thead><tr><th>Aufgabe</th><th>Entität</th><th class="n">Wert jetzt</th></tr></thead>
            <tbody>
              ${Re.map((d) => {
      const m = Bt(this.deviceEntities, d), u = e.entities[d] ?? "", v = this.deviceEntities.find((h) => h.entity_id === u), S = u ? this.hass?.states?.[u] : void 0;
      return o`<tr>
                  <td><strong>${je[d].name}</strong><br /><small class="hint">${je[d].hint}</small></td>
                  <td>
                    <select @change=${(h) => (e.entities = { ...e.entities, [d]: h.target.value || null }, s())}>
                      <option value="" ?selected=${!u}>${d === "valve" ? "(bitte wählen)" : "(keine)"}</option>
                      ${u && !i.has(u) ? o`<option value=${u} selected>${u}</option>` : p}
                      ${m.map((h) => o`<option value=${h.entity_id} ?selected=${h.entity_id === u}>${h.name} (${h.entity_id})</option>`)}
                    </select>
                  </td>
                  <td class="n">${fe(S?.state ?? v?.state, String(S?.attributes.unit_of_measurement ?? v?.unit ?? ""))}</td>
                </tr>`;
    })}
            </tbody>
          </table>
        </div>

        ${e.driver === "zigbee2mqtt" ? o`<div class="fields">
              <label class="field"><span>Name in Zigbee2MQTT</span>
                <input .value=${String(a.friendly_name ?? "")} @input=${(d) => r("friendly_name", d.target.value)} /></label>
              <label class="field"><span>MQTT-Basisthema</span>
                <input .value=${String(a.base_topic ?? "zigbee2mqtt")} @input=${(d) => r("base_topic", d.target.value)} /></label>
            </div>
            <p class="hint small">Beim Öffnen geht die Dauer mit ans Gerät (<code>{"state":"ON","on_time":…}</code>), damit es auch ohne Home Assistant schließt.</p>` : p}
        ${e.driver === "service_call" ? this.renderServiceOptions(e, r) : p}

        <h3>2. Zuordnen</h3>
        <div class="fields">
          <label class="field"><span>Wasserversorgung</span>
            <select @change=${(d) => (e.water_supply_id = d.target.value, s())}>
              ${t.supplies.map((d) => o`<option value=${d.id} ?selected=${d.id === e.water_supply_id}>${d.name}</option>`)}
              <option value=${ae} ?selected=${e.water_supply_id === ae}>Neue Wasserversorgung …</option>
            </select></label>
          ${e.water_supply_id === ae ? o`<label class="field"><span>Name der neuen Versorgung</span>
                <input .value=${e.new_supply_name} @input=${(d) => (e.new_supply_name = d.target.value, s())} /></label>` : o`<span class="field"></span>`}
        </div>
        <p class="hint small">Je Wasserversorgung ist immer nur ein Ventil gleichzeitig offen.</p>
        ${t.zones.length ? o`<div class="field wide"><span>Zonen an diesem Ventil</span>
              <div class="zone-pick">
                ${t.zones.map((d) => {
      const m = e.zone_ids.includes(d.id), u = !m && d.valve_id && d.valve_id !== e.valve_id ? t.valves.find((v) => v.id === d.valve_id)?.name : null;
      return o`<button class=${m ? "active" : ""} title=${u ? `hängt jetzt an „${u}“` : ""}
                    @click=${() => (e.zone_ids = m ? e.zone_ids.filter((v) => v !== d.id) : [...e.zone_ids, d.id], s())}>
                    ${d.name}${u ? o` <small>(${u})</small>` : p}</button>`;
    })}
              </div></div>` : p}
        <div class="fields">
          <label class="field"><span>Neue Zone anlegen (leer = keine)</span>
            <input .value=${e.new_zone_name} placeholder="z. B. Hochbeet" maxlength="60"
              @input=${(d) => (e.new_zone_name = d.target.value, s())} /></label>
          <label class="field"><span>Gießdauer der neuen Zone</span>
            <input type="number" min="0" max="120" step="1" .value=${String(e.new_zone_minutes)} ?disabled=${!e.new_zone_name.trim()}
              @change=${(d) => (e.new_zone_minutes = Math.max(0, Number(d.target.value) || 0), s())} />
            <span class="unit">min</span></label>
        </div>

        <div class="actions">
          ${e.valve_id ? o`<button class="text danger" ?disabled=${t.busy} @click=${() => this.deleteValve(e)}><ha-icon icon="mdi:delete-outline"></ha-icon>Löschen</button>` : p}
          <span class="spacer"></span>
          <button class="text" @click=${() => this.draft = null}>Abbrechen</button>
          <button class="primary" ?disabled=${!l} @click=${this.saveValve}>${e.valve_id ? "Speichern" : "Ventil anlegen"}</button>
        </div>
        ${e.entities.valve ? p : o`<p class="hint small">Zum Speichern fehlt die Entität zum Schalten.</p>`}
      </div>
    `;
  }
  renderServiceOptions(e, t) {
    const s = e.driver_options, n = (a, r) => JSON.stringify(s[a] ?? r), i = (a) => (r) => {
      const l = r.target;
      try {
        t(a, JSON.parse(l.value || "{}")), l.setCustomValidity("");
      } catch {
        l.setCustomValidity("Kein gültiges JSON"), l.reportValidity();
      }
    };
    return o`
      <div class="fields">
        <label class="field"><span>Dienst zum Öffnen (domain.dienst)</span>
          <input .value=${String(s.open_service ?? "")} @input=${(a) => t("open_service", a.target.value)} /></label>
        <label class="field"><span>Daten zum Öffnen (JSON, mit {duration})</span>
          <input .value=${n("open_data", { duration: "{duration}" })} @change=${i("open_data")} /></label>
      </div>
      <div class="fields">
        <label class="field"><span>Dienst zum Schließen</span>
          <input .value=${String(s.close_service ?? "")} @input=${(a) => t("close_service", a.target.value)} /></label>
        <label class="field"><span>Daten zum Schließen (JSON)</span>
          <input .value=${n("close_data", {})} @change=${i("close_data")} /></label>
      </div>
      <div class="fields">
        <label class="field"><span>Einheit der Dauer</span>
          <select @change=${(a) => t("duration_unit", a.target.value)}>
            <option value="s" ?selected=${s.duration_unit !== "min"}>Sekunden</option>
            <option value="min" ?selected=${s.duration_unit === "min"}>Minuten</option>
          </select></label>
        <label class="check field"><input type="checkbox" .checked=${!!s.device_timer}
          @change=${(a) => t("device_timer", a.target.checked)} />
          Gerät schließt nach der Dauer selbst</label>
      </div>
    `;
  }
  renderSensors() {
    const e = this.data, t = (n) => e.zones.filter((i) => n.includes(i.id)).map((i) => i.name).join(", "), s = this.sensorDraft;
    return o`
      <section class="card">
        <div class="section-head">
          <h2>Sensoren</h2>
          <span class="spacer"></span>
          <button class="text" ?disabled=${e.busy || s !== null && !s.sensor_id}
            @click=${() => (this.draft = null, this.sensorDraft = { sensor_id: null, name: "", kind: "soil_moisture", entity_id: "", zone_ids: [], field_capacity_pct: 35, wilting_point_pct: 12 })}>
            <ha-icon icon="mdi:plus"></ha-icon>Sensor hinzufügen
          </button>
        </div>
        <p class="hint small">Bodenfeuchte ersetzt für ihre Zonen die Schätzung. Ein Regensensor (mm) ohne Zonen gilt für den ganzen Garten.
          Eigene Fühler für Temperatur, Luftfeuchte und Wind ersetzen die Werte der Wetter-Entität.</p>
        ${s && !s.sensor_id ? this.renderSensorEditor(s) : p}
        ${e.sensors.length ? o`<div class="table-wrap"><table>
              <thead><tr><th>Name</th><th>Art</th><th>Entität</th><th class="n">Wert</th><th>Zonen</th><th class="n">Voll / leer</th><th></th></tr></thead>
              <tbody>
                ${e.sensors.map((n) => {
      const i = s?.sensor_id === n.id;
      return o`<tr class=${i ? "selected" : ""}>
                      <td><strong>${n.name}</strong></td>
                      <td>${Ve[n.kind] ?? n.kind}</td>
                      <td><small>${n.entity_id ?? o`<span class="bad-text">fehlt</span>`}</small></td>
                      <td class="n">${fe(n.state, Lt[n.kind] ?? "")}</td>
                      <td>${xe.includes(n.kind) ? "ganzer Garten (statt Wetterdienst)" : t(n.zone_ids) || (n.kind === "rain_mm" ? "ganzer Garten" : o`<span class="hint">keine</span>`)}</td>
                      <td class="n">${n.kind === "soil_moisture" ? `${n.field_capacity_pct} / ${n.wilting_point_pct} %` : "–"}</td>
                      <td class="row-actions"><button class="text small" ?disabled=${e.busy}
                        @click=${() => this.sensorDraft = i ? null : { sensor_id: n.id, name: n.name, kind: n.kind, entity_id: n.entity_id ?? "", zone_ids: [...n.zone_ids], field_capacity_pct: n.field_capacity_pct, wilting_point_pct: n.wilting_point_pct }}>
                        ${i ? "Schließen" : "Ändern"}</button></td>
                    </tr>
                    ${i ? o`<tr class="editor-row"><td colspan="7">${this.renderSensorEditor(s)}</td></tr>` : p}`;
    })}
              </tbody></table></div>` : o`<p class="hint">Keine Sensoren. Ohne Sensoren schätzt der Bewässerungsplaner aus dem Wetter.</p>`}
      </section>
    `;
  }
  renderSensorEditor(e) {
    const t = this.data, s = () => this.sensorDraft = { ...e }, n = xe.includes(e.kind), i = !!e.name.trim() && !!e.entity_id && !this.saving && !t.busy;
    return o`
      <div class="editor">
        <div class="fields">
          <label class="field"><span>Name</span>
            <input .value=${e.name} maxlength="60" @input=${(a) => (e.name = a.target.value, s())} /></label>
          <label class="field"><span>Art</span>
            <select @change=${(a) => (e.kind = a.target.value, s())}>
              ${Object.entries(Ve).map(([a, r]) => o`<option value=${a} ?selected=${a === e.kind}>${r}</option>`)}
            </select></label>
        </div>
        <div class="field wide"><span>Entität</span>
          <ip-entity-pick
            .hass=${this.hass}
            .value=${e.entity_id}
            .filter=${Wt[e.kind] ?? { domains: ["sensor"] }}
            @value-changed=${(a) => {
      e.entity_id = a.detail.value, e.name.trim() || (e.name = String(this.hass?.states?.[e.entity_id]?.attributes.friendly_name ?? "")), s();
    }}
          ></ip-entity-pick>
          <small class="hint">Oben stehen die Entitäten, die zur Art passen. Tippen sucht in Name und Entität.</small>
        </div>
        ${n ? o`<p class="hint small">Gilt für den ganzen Garten und ersetzt den Wert der Wetter-Entität (Verdunstung, Frost und Wind).
              Fällt der Fühler aus, gilt wieder die Wetter-Entität.</p>` : p}
        ${t.zones.length && !n ? o`<div class="field wide"><span>Zonen</span><div class="zone-pick">
              ${t.zones.map((a) => {
      const r = e.zone_ids.includes(a.id);
      return o`<button class=${r ? "active" : ""} @click=${() => (e.zone_ids = r ? e.zone_ids.filter((l) => l !== a.id) : [...e.zone_ids, a.id], s())}>${a.name}</button>`;
    })}
            </div></div>` : p}
        ${e.kind === "soil_moisture" ? o`<div class="fields">
              <label class="field"><span>Messwert bei „voll“ (Feldkapazität)</span>
                <input type="number" min="1" max="100" .value=${String(e.field_capacity_pct)}
                  @change=${(a) => (e.field_capacity_pct = Number(a.target.value) || 35, s())} />
                <span class="unit">%</span></label>
              <label class="field"><span>Messwert bei „leer“ (Welkepunkt)</span>
                <input type="number" min="0" max="99" .value=${String(e.wilting_point_pct)}
                  @change=${(a) => (e.wilting_point_pct = Number(a.target.value) || 0, s())} />
                <span class="unit">%</span></label>
            </div>` : p}
        <div class="actions">
          ${e.sensor_id ? o`<button class="text danger" ?disabled=${t.busy} @click=${() => this.deleteSensor(e)}><ha-icon icon="mdi:delete-outline"></ha-icon>Entfernen</button>` : p}
          <span class="spacer"></span>
          <button class="text" @click=${() => this.sensorDraft = null}>Abbrechen</button>
          <button class="primary" ?disabled=${!i} @click=${this.saveSensor}>Speichern</button>
        </div>
      </div>
    `;
  }
};
A.styles = be;
W([
  H({ attribute: !1 })
], A.prototype, "hass", 2);
W([
  f()
], A.prototype, "data", 2);
W([
  f()
], A.prototype, "error", 2);
W([
  f()
], A.prototype, "draft", 2);
W([
  f()
], A.prototype, "deviceEntities", 2);
W([
  f()
], A.prototype, "filter", 2);
W([
  f()
], A.prototype, "sensorDraft", 2);
W([
  f()
], A.prototype, "saving", 2);
W([
  f()
], A.prototype, "testFor", 2);
W([
  f()
], A.prototype, "testSeconds", 2);
W([
  f()
], A.prototype, "testing", 2);
W([
  f()
], A.prototype, "testResult", 2);
W([
  f()
], A.prototype, "settingsDraft", 2);
A = W([
  pe("ip-devices")
], A);
function Ft(e, t) {
  return t ? e ? null : "Orten geht nur, wenn Home Assistant über https geöffnet ist (z. B. in der App oder über Nabu Casa)." : "Dieser Browser kann nicht orten.";
}
function Rt(e) {
  return e === 1 ? "Orten nicht erlaubt. Bitte in den Browser-Einstellungen den Standort erlauben." : e === 3 ? "Kein Standort gefunden (Zeit abgelaufen). Am besten im Freien noch einmal versuchen." : "Standort nicht verfügbar.";
}
function ke(e) {
  return e >= 1e3 ? `± ${(e / 1e3).toFixed(1).replace(".", ",")} km` : `± ${Math.round(e)} m`;
}
function jt(e, t, s, n, i) {
  return M(e, t) > s ? !1 : i >= 360 ? !0 : ((ce(t, e) - n) % 360 + 360) % 360 <= i;
}
function Me(e, t) {
  let s = !1;
  for (let n = 0, i = t.length - 1; n < t.length; i = n++) {
    const [a, r] = t[n], [l, c] = t[i];
    r > e[1] != c > e[1] && e[0] < (l - a) * (e[1] - r) / (c - r) + a && (s = !s);
  }
  return s;
}
function nt(e, t, s) {
  const n = s[0] - t[0], i = s[1] - t[1], a = n * n + i * i, r = a === 0 ? 0 : Math.max(0, Math.min(1, ((e[0] - t[0]) * n + (e[1] - t[1]) * i) / a));
  return Math.hypot(e[0] - (t[0] + r * n), e[1] - (t[1] + r * i));
}
function It(e, t) {
  if (e.type === "sprinkler")
    return !!(e.center && e.radius_m) && jt(t, e.center, e.radius_m, e.start_angle_deg, e.arc_deg);
  if (e.type === "hose") {
    const s = e.radius_m ?? 0;
    for (let n = 1; n < e.polygon.length; n++)
      if (nt(t, e.polygon[n - 1], e.polygon[n]) <= s) return !0;
    return !1;
  }
  return e.polygon.length >= 3 && Me(t, e.polygon);
}
function de(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? Je(e.radius_m, e.arc_deg) : null : e.type === "hose" ? e.polygon.length >= 2 && e.radius_m ? Ye(e.polygon, e.radius_m) : null : e.polygon.length >= 3 ? ee(e.polygon) : null;
}
function Vt(e, t, s) {
  const n = M(t, e);
  for (const i of s) {
    const a = i.points[0], r = (i.trunk_m ?? 0) / 2, l = M(t, a);
    if (r <= 0 || l <= r || n <= l) continue;
    const c = Math.asin(Math.min(1, r / l)) * 180 / Math.PI;
    if (Math.abs((ce(t, e) - ce(t, a) + 540) % 360 - 180) <= c) return !0;
  }
  return !1;
}
function Pe(e, t) {
  return t?.zones[e.id]?.planned_s ?? e.duration_s ?? 0;
}
function st(e, t, s) {
  const n = t.find((r) => r.id === e.valve_id)?.learned_flow_l_min, i = de(e) ?? e.area_m2, a = Pe(e, s);
  return !n || !i ? null : a ? a / 60 * n / i : s?.zones[e.id]?.planned_s === 0 ? 0 : null;
}
function Ge(e, t, s) {
  return e.valve_id ? t.find((n) => n.id === e.valve_id)?.learned_flow_l_min ? de(e) ?? e.area_m2 ? !Pe(e, s) && s?.zones[e.id]?.planned_s === void 0 ? "keine Gießdauer" : null : "keine Fläche" : "Durchfluss unbekannt" : "kein Ventil";
}
const Z = [
  [0, [120, 200, 250]],
  [2, [50, 160, 240]],
  [5, [25, 105, 220]],
  [10, [35, 45, 170]],
  [20, [115, 25, 150]],
  [30, [175, 20, 105]]
];
function Gt(e) {
  if (e <= Z[0][0]) return Z[0][1];
  for (let t = 1; t < Z.length; t++) {
    const [s, n] = Z[t], [i, a] = Z[t - 1];
    if (e <= s) {
      const r = (e - i) / (s - i);
      return [0, 1, 2].map((l) => Math.round(a[l] + (n[l] - a[l]) * r));
    }
  }
  return Z[Z.length - 1][1];
}
function Ct(e, t, s) {
  for (const n of [0.25, 0.5, 1, 2, 5, 10, 20])
    if (Math.ceil(e / n) * Math.ceil(t / n) <= s) return n;
  return 50;
}
function Ht(e, t) {
  const s = t?.zones[e.id];
  return !s || !s.capacity_mm ? null : Math.max(0, 1 - s.need_mm / s.capacity_mm);
}
function Kt(e, t, s, n, i, a, r = 15e3) {
  const l = i.filter((x) => x.kind === "boundary" && x.points.length >= 3);
  let [c, d, m, u] = a;
  if (l.length) {
    const x = l.flatMap((P) => P.points);
    c = Math.min(...x.map((P) => P[0])), d = Math.min(...x.map((P) => P[1])), m = Math.max(...x.map((P) => P[0])), u = Math.max(...x.map((P) => P[1]));
  }
  const v = Ct(m - c, u - d, r), S = Math.floor(c / v) * v, h = Math.floor(d / v) * v, g = i.filter((x) => x.kind === "tree" && (x.trunk_m ?? 0) > 0), $ = t.filter((x) => x.enabled && de(x) !== null).map((x) => ({
    zone: x,
    mm: st(x, s, n),
    fill: Ht(x, n),
    cap: n?.zones[x.id]?.capacity_mm ?? null,
    // Anteil, der im Boden ankommt (Sprinkler verlieren mehr durch Verdunstung)
    eff: n?.zones[x.id]?.efficiency ?? (x.type === "sprinkler" ? 0.75 : 0.9)
  })), _ = [];
  let z = 0;
  for (let x = h; x < u; x += v)
    for (let P = S; P < m; P += v) {
      const T = [P + v / 2, x + v / 2];
      if (l.length && !l.some((O) => Me(T, O.points))) continue;
      const L = $.filter(
        ({ zone: O }) => It(O, T) && !(O.type === "sprinkler" && O.center && Vt(T, O.center, g))
      );
      if (!L.length) {
        l.length && _.push({ x: P, y: x, kind: "none", v: 0 });
        continue;
      }
      let J = null;
      if (e === "planned")
        J = L.some((O) => O.mm === null) ? null : L.reduce((O, ue) => O + (ue.mm ?? 0), 0);
      else if (L.some((O) => O.fill === null || e === "after" && O.mm === null))
        J = null;
      else {
        const O = L.reduce((oe, te) => oe + (te.fill ?? 0), 0) / L.length, ue = L.reduce((oe, te) => oe + (te.cap ?? 0), 0) / L.length, rt = e === "after" ? L.reduce((oe, te) => oe + (te.mm ?? 0) * te.eff, 0) : 0;
        J = O + (ue > 0 ? rt / ue : 0);
      }
      J === null ? _.push({ x: P, y: x, kind: "unknown", v: 0 }) : (_.push({ x: P, y: x, kind: "value", v: J }), z = Math.max(z, J));
    }
  return { step: v, cells: _, max: z };
}
const it = [
  [0, [166, 97, 26]],
  [0.5, [236, 226, 198]],
  [1, [42, 120, 214]],
  [1.25, [110, 40, 160]]
];
function Ut(e, t) {
  if (t <= e[0][0]) return e[0][1];
  for (let s = 1; s < e.length; s++) {
    const [n, i] = e[s], [a, r] = e[s - 1];
    if (t <= n) {
      const l = (t - a) / (n - a);
      return [0, 1, 2].map((c) => Math.round(r[c] + (i[c] - r[c]) * l));
    }
  }
  return e[e.length - 1][1];
}
function qt(e) {
  return Ut(it, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Jt = (e) => (...t) => ({ _$litDirective$: e, values: t });
let Yt = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, s, n) {
    this._$Ct = t, this._$AM = s, this._$Ci = n;
  }
  _$AS(t, s) {
    return this.update(t, s);
  }
  update(t, s) {
    return this.render(...s);
  }
};
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Xt = {}, Qt = Jt(class extends Yt {
  constructor() {
    super(...arguments), this.ot = Xt;
  }
  render(e, t) {
    return t();
  }
  update(e, [t, s]) {
    if (Array.isArray(t)) {
      if (Array.isArray(this.ot) && this.ot.length === t.length && t.every((n, i) => n === this.ot[i])) return De;
    } else if (this.ot === t) return De;
    return this.ot = Array.isArray(t) ? Array.from(t) : t, this.render(t, s);
  }
});
var en = Object.defineProperty, tn = Object.getOwnPropertyDescriptor, k = (e, t, s, n) => {
  for (var i = n > 1 ? void 0 : n ? tn(t, s) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (n ? r(t, s, i) : r(i)) || i);
  return n && i && en(t, s, i), i;
};
const B = "irrigation_planner", Ce = [
  "#2e7d32",
  "#1565c0",
  "#ef6c00",
  "#6a1b9a",
  "#00838f",
  "#c62828",
  "#827717",
  "#4527a0",
  "#ad1457",
  "#37474f"
], He = {
  soil_moisture: "B",
  rain_mm: "R",
  rain_binary: "R",
  water_meter: "W"
}, nn = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge",
  rain_binary: "Regensensor",
  water_meter: "Wasserzähler"
}, _e = {
  idle: "",
  running: "läuft",
  queued: "wartet",
  locked: "gesperrt"
}, sn = 0.05, an = 10;
let w = class extends he {
  constructor() {
    super(...arguments), this.narrow = !1, this.error = "", this.toast = "", this.tab = "zones", this.featureKind = "building", this.measurePts = [], this.snapOn = !0, this.snapHint = null, this.tool = "select", this.toolTarget = "", this.selected = null, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.view = { cx: 0, cy: 0, scale: 25 }, this.size = { w: 800, h: 600 }, this.imageUrl = "", this.imageSize = null, this.saving = !1, this.dirty = !1, this.searchOpen = !1, this.searchQuery = "", this.searchResults = null, this.searching = !1, this.searchError = "", this.searchPin = null, this.locating = !1, this.hoseRadius = 0.5, this.flowEdited = /* @__PURE__ */ new Set(), this.savedJson = "", this.history = [], this.drag = null, this.toastUndo = !1, this.layersOpen = !1, this.page = "plan", this.raster = "", this.rasterMenu = !1, this.soilOn = !1, this.rasterCache = null, this.menuOpen = !1, this.pendingImport = null, this.autoFit = !0, this.afterReload = () => {
      this.unsub?.(), this.unsub = void 0, setTimeout(() => void this.load(), 4e3);
    }, this.loadedImage = "", this.onWheel = (e) => {
      e.preventDefault();
      const s = e.currentTarget.getBoundingClientRect(), n = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 15e-4));
      this.zoomBy(n, this.toPlan(e), [e.clientX - s.left, e.clientY - s.top]);
    }, this.onKey = (e) => {
      const t = e.composedPath()[0];
      t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName) || (e.key === "Escape" && this.cancelTool(), e.key === "Enter" && this.tool === "bed" && this.finishBed(), e.key === "Enter" && this.tool === "feature" && this.finishFeature(), e.key === "Enter" && this.tool === "hose" && this.finishHose(), (e.ctrlKey || e.metaKey) && e.key === "z" && (e.preventDefault(), this.undo()), e.key === "Delete" && this.selected?.kind === "zone" && this.clearGeometry(this.selected.id), e.key === "Delete" && this.selected?.kind === "feature" && this.deleteFeature(this.selected.id));
    }, this.onPointerDown = (e) => {
      if (e.button !== 0) return;
      const t = e.currentTarget, s = this.toPlan(e);
      if (this.tool === "feature") {
        const n = this.featureKind, i = this.snap(s, e), a = G(n);
        if (a === "point") {
          const l = [y(i[0]), y(i[1])];
          if (n === "tree") {
            const c = this.addFeature({ kind: n, points: [l], radius_m: 0 });
            this.drag = { type: "new-tree", id: c.id }, t.setPointerCapture(e.pointerId);
          } else
            this.addFeature({ kind: n, points: [l], label: n === "label" ? "Beschriftung" : null }), this.cancelTool(), n === "label" && this.updateComplete.then(
              () => this.renderRoot.querySelector("#feature-label")?.select()
            );
          return;
        }
        const r = (l) => M(i, l) * this.view.scale < 12;
        a === "area" && this.draft.length >= 3 && r(this.draft[0]) ? this.finishFeature() : a === "line" && this.draft.length >= 2 && r(this.draft[this.draft.length - 1]) ? this.finishFeature() : this.draft = [...this.draft, i];
        return;
      }
      if (this.tool === "measure") {
        this.measurePts = [...this.measurePts, this.snap(s, e)];
        return;
      }
      if (this.tool === "hose") {
        const n = this.snap(s, e), i = this.draft[this.draft.length - 1];
        this.draft.length >= 2 && M(n, i) * this.view.scale < 12 ? this.finishHose() : this.draft = [...this.draft, n];
        return;
      }
      if (this.tool === "sprinkler") {
        this.remember();
        const n = this.zone(this.toolTarget), i = this.snap(s, e);
        s[0] = i[0], s[1] = i[1], n.center = [y(s[0]), y(s[1])], n.radius_m = 0, this.drag = { type: "new-sprinkler", id: n.id }, t.setPointerCapture(e.pointerId), this.changed();
        return;
      }
      if (this.tool === "bed") {
        const n = this.snap(s, e);
        this.draft.length >= 3 && M(n, this.draft[0]) * this.view.scale < 12 ? this.finishBed() : this.draft = [...this.draft, n];
        return;
      }
      if (this.tool === "place") {
        const [n, i] = this.toolTarget.split(":");
        this.remember();
        const a = this.marker(n, i);
        a.position = [y(s[0]), y(s[1])], this.selected = { kind: n, id: i }, this.changed(), this.cancelTool();
        return;
      }
      if (this.tool === "scale") {
        const n = this.imageMpp(), i = [...this.scaleDraft, [s[0] / n, s[1] / n]];
        this.scaleDraft = i.slice(-2);
        return;
      }
      this.drag = {
        type: "pan",
        sx: e.clientX,
        sy: e.clientY,
        cx: this.view.cx,
        cy: this.view.cy,
        moved: !1
      }, t.setPointerCapture(e.pointerId);
    }, this.onPointerMove = (e) => {
      const t = this.drag;
      if (!t) {
        ["bed", "hose", "feature", "measure", "sprinkler"].includes(this.tool) && (this.hover = this.snap(this.toPlan(e), e));
        return;
      }
      const s = this.toPlan(e);
      if (t.type.startsWith("f-") || t.type === "new-tree") {
        this.moveFeature(t, s, e);
        return;
      }
      if (t.type === "pan") {
        const i = e.clientX - t.sx, a = e.clientY - t.sy;
        Math.abs(i) + Math.abs(a) > 3 && (t.moved = !0, this.autoFit = !1), this.view = {
          ...this.view,
          cx: t.cx - i / this.view.scale,
          cy: t.cy - a / this.view.scale
        };
        return;
      }
      if (t.type === "marker") {
        const i = this.marker(t.kind, t.id), a = i.position;
        i.position = [y(s[0]), y(s[1])], a && t.kind === "valve" && this.movePipeEnds(a, i.position), this.changed();
        return;
      }
      const n = this.zone(t.id);
      switch (t.type) {
        case "new-sprinkler":
        case "radius":
          n.radius_m = y(Math.max(0.1, M(n.center, s)));
          break;
        case "hose-radius":
          n.radius_m = y(Math.min(20, Math.max(0.05, ut(s, n.polygon))));
          break;
        case "center":
          n.center = [y(s[0]), y(s[1])];
          break;
        case "start": {
          const i = n.start_angle_deg + n.arc_deg, a = Ke(ce(n.center, s));
          let r = ((i - a) % 360 + 360) % 360;
          r < 5 && (r = 360), n.start_angle_deg = a, n.arc_deg = r;
          break;
        }
        case "end": {
          let a = ((Ke(ce(n.center, s)) - n.start_angle_deg) % 360 + 360) % 360;
          a < 5 && (a = 360), n.arc_deg = a;
          break;
        }
        case "route": {
          const i = n.valve_route ?? [], a = this.snap(s, e, i[t.index]);
          i[t.index] = [y(a[0]), y(a[1])], n.valve_route = i;
          break;
        }
        case "vertex": {
          const i = this.snap(s, e, n.polygon[t.index]);
          n.polygon[t.index] = [y(i[0]), y(i[1])];
          break;
        }
        case "move-zone": {
          const i = s[0] - t.start[0], a = s[1] - t.start[1];
          n.type === "sprinkler" && t.orig.center ? n.center = [y(t.orig.center[0] + i), y(t.orig.center[1] + a)] : n.polygon = t.orig.polygon.map((r) => [y(r[0] + i), y(r[1] + a)]);
          break;
        }
      }
      this.changed();
    }, this.hover = null, this.onPointerUp = () => {
      const e = this.drag;
      if (this.drag = null, this.snapHint = null, !!e) {
        if (e.type === "new-tree") {
          const t = this.feature(e.id);
          (!t.radius_m || t.radius_m < 0.3) && (t.radius_m = 1.5), this.cancelTool(), this.changed();
        }
        if (e.type === "pan") {
          e.moved || (this.selected = null);
          return;
        }
        if (e.type === "new-sprinkler") {
          const t = this.zone(e.id);
          (!t.radius_m || t.radius_m < 0.3) && (t.radius_m = 3), t.arc_deg || (t.arc_deg = 360), this.selected = { kind: "zone", id: t.id }, this.cancelTool(), this.changed();
        }
        this.history[this.history.length - 1] === JSON.stringify(this.editable()) && this.history.pop();
      }
    };
  }
  get wetOn() {
    return this.raster !== "";
  }
  // `hass` ändert sich bei jedem Zustandswechsel im Haus; das Panel braucht
  // davon nur die Verbindung und löst darum kein neues Zeichnen aus.
  set hass(e) {
    const t = !this._hass;
    this._hass = e, t && this.load();
  }
  get hass() {
    return this._hass;
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("keydown", this.onKey), this._hass && this.plan && this.subscribe();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("keydown", this.onKey), this.unsub?.(), this.unsub = void 0, this.resizer?.disconnect();
  }
  firstUpdated(e) {
    this.resizer = new ResizeObserver(() => this.measure()), this.resizer.observe(this);
  }
  updated() {
    const e = this.renderRoot.querySelector(".stage");
    e && !e.dataset.observed && (e.dataset.observed = "1", this.resizer?.observe(e), this.measure());
  }
  measure() {
    const e = this.renderRoot.querySelector(".stage");
    if (!e) return;
    const { width: t, height: s } = e.getBoundingClientRect();
    t && s && (t !== this.size.w || s !== this.size.h) && (this.size = { w: t, h: s }, this.autoFit && this.plan && this.initialView());
  }
  /** Erste Ansicht: das Grundstück (oder alles) bildschirmfüllend mit etwas Rand. */
  initialView() {
    this.fitView();
  }
  async load() {
    try {
      const e = await this._hass.callWS({ type: `${B}/plan/get` });
      this.setPlan(e, !0), await this.subscribe();
    } catch (e) {
      this.error = this.message(e);
    }
  }
  async subscribe() {
    this.unsub || !this._hass || (this.unsub = await this._hass.connection.subscribeMessage(
      (e) => this.status = e,
      { type: `${B}/plan/subscribe` }
    ));
  }
  /** Neuer Stand vom Server. Nach dem Speichern bleibt „Rückgängig“ möglich. */
  setPlan(e, t, s = !1) {
    this.plan = e, this.flowEdited.clear(), this.savedJson = JSON.stringify(this.editable()), this.dirty = !1, s || (this.history = []), this.loadImage(), t && this.initialView();
  }
  editable() {
    const e = this.plan;
    return { garden: e.garden, zones: e.zones, valves: e.valves, sensors: e.sensors };
  }
  /** Vor jeder Änderung: Stand merken (für „Rückgängig“). */
  remember() {
    this.history.push(JSON.stringify(this.editable())), this.history.length > 100 && this.history.shift();
  }
  changed() {
    this.plan = { ...this.plan }, this.dirty = JSON.stringify(this.editable()) !== this.savedJson;
  }
  undo() {
    const e = this.history.pop();
    e && (this.plan = { ...this.plan, ...JSON.parse(e) }, this.dirty = JSON.stringify(this.editable()) !== this.savedJson, this.loadImage());
  }
  discard() {
    this.dirty && (this.remember(), this.plan = { ...this.plan, ...JSON.parse(this.savedJson) }, this.dirty = !1, this.cancelTool(), this.loadImage());
  }
  async save() {
    const e = this.plan, t = { ...e.garden };
    t.background === "map" && t.latitude != null && (t.map_zoom = Math.round(Ee(t.latitude, this.view.scale) * 100) / 100), this.saving = !0;
    try {
      const s = await this._hass.callWS({
        type: `${B}/plan/save`,
        garden: t,
        zones: e.zones.map((n) => ({
          id: n.id,
          type: n.type,
          center: n.center,
          radius_m: n.radius_m,
          start_angle_deg: n.start_angle_deg,
          arc_deg: n.arc_deg,
          polygon: n.polygon,
          valve_route: n.valve_route ?? [],
          valve_id: n.valve_id,
          plant_type: n.plant_type,
          kc: n.kc,
          soil_type: n.soil_type,
          root_depth_m: n.root_depth_m
        })),
        // Durchfluss nur mitschicken, wenn er hier geändert wurde (sonst
        // würde ein inzwischen neu gelernter Wert überschrieben).
        valves: e.valves.map(
          (n) => this.flowEdited.has(n.id) ? { id: n.id, position: n.position, learned_flow_l_min: n.learned_flow_l_min } : { id: n.id, position: n.position }
        ),
        sensors: e.sensors.map((n) => ({ id: n.id, position: n.position }))
      });
      this.setPlan(s, !1, !0), this.showToast("Plan gespeichert");
    } catch (s) {
      this.showToast(`Nicht gespeichert: ${this.message(s)}`, !0);
    } finally {
      this.saving = !1;
    }
  }
  message(e) {
    return e && typeof e == "object" && "message" in e ? String(e.message) : String(e);
  }
  showToast(e, t = !1, s = !1) {
    this.toast = (t ? "⚠ " : "") + e, this.toastUndo = s, window.clearTimeout(this.toastTimer), this.toastTimer = window.setTimeout(
      () => {
        this.toast = "", this.toastUndo = !1;
      },
      t || s ? 8e3 : 3e3
    );
  }
  /** Entfernen mit Hinweis und „Rückgängig“-Knopf. */
  removed(e) {
    this.showToast(e, !1, !0);
  }
  async loadImage() {
    const e = this.plan?.garden.background_image;
    if (!(!e || e === this.loadedImage))
      try {
        const t = await this._hass.fetchWithAuth(`/api/${B}/image/${e}`);
        if (!t.ok) throw new Error(`Bild nicht gefunden (${t.status})`);
        const s = URL.createObjectURL(await t.blob()), n = new Image();
        n.src = s, await n.decode(), this.imageUrl && URL.revokeObjectURL(this.imageUrl), this.imageUrl = s, this.imageSize = [n.naturalWidth, n.naturalHeight], this.loadedImage = e;
      } catch (t) {
        this.showToast(this.message(t), !0);
      }
  }
  async upload(e) {
    const t = e.target, s = t.files?.[0];
    if (t.value = "", !s) return;
    const n = new FormData();
    n.append("file", s);
    try {
      const i = await this._hass.fetchWithAuth(`/api/${B}/image`, {
        method: "POST",
        body: n
      }), a = await i.json();
      if (!i.ok) throw new Error(a.message ?? i.statusText);
      this.remember(), Object.assign(this.plan.garden, {
        background: "image",
        background_image: a.name,
        scale_points: null,
        scale_distance_m: null
      }), this.changed(), await this.loadImage(), this.fitView(), this.startTool("scale"), this.showToast("Bild geladen. Jetzt den Maßstab setzen.");
    } catch (i) {
      this.showToast(`Hochladen fehlgeschlagen: ${this.message(i)}`, !0);
    }
  }
  /** Meter je Bildpunkt des hochgeladenen Bilds. */
  imageMpp() {
    const e = this.plan.garden;
    if (e.scale_points && e.scale_distance_m) {
      const t = M(e.scale_points[0], e.scale_points[1]);
      if (t > 0) return e.scale_distance_m / t;
    }
    return sn;
  }
  // Ansicht --------------------------------------------------------------------
  toScreen(e) {
    const { cx: t, cy: s, scale: n } = this.view;
    return [(e[0] - t) * n + this.size.w / 2, (e[1] - s) * n + this.size.h / 2];
  }
  toPlan(e) {
    const s = this.renderRoot.querySelector("svg.plan").getBoundingClientRect(), { cx: n, cy: i, scale: a } = this.view;
    return [
      (e.clientX - s.left - this.size.w / 2) / a + n,
      (e.clientY - s.top - this.size.h / 2) / a + i
    ];
  }
  bounds() {
    const e = [];
    for (const i of this.plan?.zones ?? [])
      i.type === "sprinkler" && i.center && i.radius_m && (e.push([i.center[0] - i.radius_m, i.center[1] - i.radius_m]), e.push([i.center[0] + i.radius_m, i.center[1] + i.radius_m])), i.type !== "sprinkler" && e.push(...i.polygon);
    for (const i of [...this.plan?.valves ?? [], ...this.plan?.sensors ?? []])
      i.position && e.push(i.position);
    const t = this.plan?.garden;
    for (const i of t?.features ?? [])
      if (e.push(...i.points), i.kind === "tree" && i.radius_m) {
        const [a, r] = i.points[0];
        e.push([a - i.radius_m, r - i.radius_m], [a + i.radius_m, r + i.radius_m]);
      }
    if (t?.background === "image" && this.imageSize) {
      const i = this.imageMpp();
      e.push([0, 0], [this.imageSize[0] * i, this.imageSize[1] * i]);
    }
    if (!e.length) return null;
    const s = e.map((i) => i[0]), n = e.map((i) => i[1]);
    return [Math.min(...s), Math.min(...n), Math.max(...s), Math.max(...n)];
  }
  /** Umriss der Grundstücksgrenze(n), falls gezeichnet. */
  plotBounds() {
    if (!this.plan) return null;
    const e = this.features.filter((n) => n.kind === "boundary" && n.points.length >= 2).flatMap((n) => n.points);
    if (!e.length) return null;
    const t = e.map((n) => n[0]), s = e.map((n) => n[1]);
    return [Math.min(...t), Math.min(...s), Math.max(...t), Math.max(...s)];
  }
  /** Einpassen: das Grundstück, wenn es eine Grenze gibt, sonst alles Gezeichnete. */
  fitView() {
    const e = this.plan?.garden, t = this.plotBounds() ?? this.bounds();
    if (e?.background === "map" && e.latitude != null && !t) {
      const d = e.map_zoom ?? 19;
      this.view = { cx: 0, cy: 0, scale: 1 / ve(e.latitude, d) };
      return;
    }
    if (!t) {
      this.view = { cx: 0, cy: 0, scale: 25 };
      return;
    }
    const [s, n, i, a] = t, r = Math.max(i - s, 4), l = Math.max(a - n, 4), c = Math.min(this.size.w / (r * 1.1), this.size.h / (l * 1.1), 200);
    this.view = { cx: (s + i) / 2, cy: (n + a) / 2, scale: Math.max(c, 0.5) };
  }
  zoomBy(e, t, s) {
    this.autoFit = !1;
    const { cx: n, cy: i, scale: a } = this.view, r = Math.min(Math.max(a * e, 0.5), 400);
    if (!t || !s) {
      this.view = { cx: n, cy: i, scale: r };
      return;
    }
    this.view = {
      cx: t[0] - (s[0] - this.size.w / 2) / r,
      cy: t[1] - (s[1] - this.size.h / 2) / r,
      scale: r
    };
  }
  // Werkzeuge ------------------------------------------------------------------
  startTool(e, t = "") {
    this.tool = e, this.toolTarget = t, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.measurePts = [], this.hover = null, this.snapHint = null, e === "feature" && (this.featureKind = t), e === "hose" && t && (this.hoseRadius = this.zone(t).radius_m ?? 0.5), t && (e === "sprinkler" || e === "bed" || e === "hose") && (this.selected = { kind: "zone", id: t });
  }
  // Grundriss -------------------------------------------------------------------
  get features() {
    return this.plan.garden.features;
  }
  feature(e) {
    return this.features.find((t) => t.id === e);
  }
  /** Alle Ecken und Mittelpunkte, an denen neue Punkte einrasten. */
  snapCandidates(e) {
    const t = [];
    for (const s of this.features) t.push(...s.points);
    for (const s of this.plan.zones)
      t.push(...s.polygon), s.center && t.push(s.center);
    for (const s of [...this.plan.valves, ...this.plan.sensors]) s.position && t.push(s.position);
    return t.push(...this.draft, ...this.measurePts), e ? t.filter((s) => s !== e) : t;
  }
  /** Punkt fangen (Alt-Taste: frei). Merkt den Fangpunkt für die Anzeige. */
  snap(e, t, s) {
    if (!this.snapOn || t?.altKey)
      return this.snapHint = null, e;
    const n = an / this.view.scale;
    let i = ct(e, this.snapCandidates(s), n);
    return !i && this.tool === "feature" && this.featureKind === "pipe" && (i = Qe(e, this.pipeLines(), n)), this.snapHint = i, i ? [i[0], i[1]] : e;
  }
  /**
   * Zuleitungs-Punkte, die genau bei `old` liegen (am Hahn, am Ventil oder an
   * einem Abzweig), nach `now` mitnehmen. So bleiben Leitungen angehängt.
   */
  movePipeEnds(e, t, s) {
    if (!(e[0] === t[0] && e[1] === t[1]))
      for (const n of this.features)
        n.kind !== "pipe" || n.id === s || n.locked || (n.points = n.points.map((i) => M(i, e) < 0.06 ? [t[0], t[1]] : i));
  }
  pipeLines() {
    return this.features.filter((e) => e.kind === "pipe" && e.points.length >= 2).map((e) => e.points);
  }
  finishFeature() {
    const e = this.featureKind, t = G(e) === "area" ? 3 : 2;
    if (this.draft.length < t) {
      this.showToast(`${X[e].label}: mindestens ${t} Punkte`, !0);
      return;
    }
    this.addFeature({
      kind: e,
      points: this.draft.map((s) => [y(s[0]), y(s[1])]),
      soil_type: e === "soil" ? "loam" : null
    }), this.cancelTool();
  }
  addFeature(e) {
    this.remember();
    const t = {
      id: bt(this.features),
      radius_m: null,
      label: null,
      ...e
    };
    return this.features.push(t), this.selected = { kind: "feature", id: t.id }, this.tab = "plan", this.changed(), t;
  }
  deleteFeature(e) {
    const t = this.feature(e);
    this.remember(), this.plan.garden.features = this.features.filter((s) => s.id !== e), this.selected?.kind === "feature" && this.selected.id === e && (this.selected = null), this.changed(), this.removed(`${Y(t)} entfernt`);
  }
  cancelTool() {
    this.startTool("select");
  }
  zone(e) {
    return this.plan.zones.find((t) => t.id === e);
  }
  finishBed() {
    if (this.draft.length < 3) {
      this.showToast("Ein Beet braucht mindestens 3 Punkte", !0);
      return;
    }
    this.remember(), this.zone(this.toolTarget).polygon = this.draft.map((e) => [y(e[0]), y(e[1])]), this.selected = { kind: "zone", id: this.toolTarget }, this.changed(), this.cancelTool();
  }
  finishHose() {
    if (this.draft.length < 2) {
      this.showToast("Ein Schlauch braucht mindestens 2 Punkte", !0);
      return;
    }
    this.remember();
    const e = this.zone(this.toolTarget);
    e.polygon = this.draft.map((t) => [y(t[0]), y(t[1])]), e.center = null, e.radius_m = this.hoseRadius, this.selected = { kind: "zone", id: e.id }, this.changed(), this.cancelTool();
  }
  async toggleWinter(e) {
    if (confirm(e ? `Winterpause einschalten?

Alle Ventile werden geschlossen, Zeitpläne ruhen, und die Ventil-Geräte werden deaktiviert.` : `Winterpause beenden?

Die Ventil-Geräte werden wieder aktiviert, und die Zeitpläne laufen wieder (wenn die Automatik an ist).`))
      try {
        await this._hass.callWS({ type: `${B}/settings/winter`, on: e }), this.showToast(e ? "Winterpause ein: nichts wird gegossen" : "Winterpause aus: Saison läuft");
      } catch (s) {
        this.showToast(this.message(s), !0);
      }
  }
  async toggleAutomatic(e) {
    try {
      await this._hass.callWS({ type: `${B}/settings/automatic`, on: e }), this.showToast(e ? "Automatik an: Programme starten nach Zeitplan" : "Automatik aus: keine Starts nach Zeitplan");
    } catch (t) {
      this.showToast(this.message(t), !0);
    }
  }
  setLocked(e, t) {
    this.remember();
    for (const s of e) s.locked = t;
    this.changed(), this.showToast(
      e.length > 1 ? t ? "Alle Grundriss-Formen gesperrt" : "Alle Grundriss-Formen entsperrt" : t ? `${Y(e[0])} gesperrt` : `${Y(e[0])} entsperrt`
    );
  }
  /** Durchfluss des Ventils (gelernt oder von Hand), für Liter und Nässekarte. */
  renderValveFlow(e) {
    const t = this.plan.valves.find((s) => s.id === e.valve_id);
    return t ? o`<label class="field">
        <span>Durchfluss</span>
        <input type="number" min="0.1" max="500" step="0.1" placeholder="unbekannt"
          .value=${t.learned_flow_l_min == null ? "" : String(t.learned_flow_l_min)}
          @change=${(s) => {
      const n = s.target.value.trim(), i = n === "" ? null : parseFloat(n.replace(",", "."));
      i !== null && (!Number.isFinite(i) || i <= 0 || i > 500) || (this.remember(), t.learned_flow_l_min = i, this.flowEdited.add(t.id), this.changed());
    }} />
        <span class="unit">L/min</span>
      </label>
      <p class="hint small">${t.learned_flow_l_min ? `${t.name}. Mit Durchflusssensor wird der Wert bei jedem Lauf nachgeführt.` : `${t.name}: noch unbekannt. Ohne Sensor hier eintragen (z. B. Eimer auslitern), sonst fehlen Liter und Nässekarte.`}</p>` : p;
  }
  /**
   * Art der Zone ändern. Die Zeichnung passt meist nicht mehr: Beet und
   * Schlauch behalten ihre Punkte (wenn es genug sind), sonst wird neu gezeichnet.
   */
  setZoneType(e, t) {
    if (e.type === t) return;
    this.remember();
    const s = e.polygon;
    e.type = t, t === "sprinkler" ? (e.polygon = [], e.radius_m = null) : (e.center = null, t === "hose" ? e.radius_m = 0.5 : (e.radius_m = null, s.length < 3 && (e.polygon = []))), this.changed(), ie(e) === null ? (this.startTool(t === "sprinkler" ? "sprinkler" : t === "hose" ? "hose" : "bed", e.id), this.showToast(`${e.name}: jetzt im Plan zeichnen, dann „Speichern“`)) : this.showToast(`${e.name}: Art geändert. „Speichern“ nicht vergessen.`);
  }
  clearGeometry(e) {
    const t = this.zone(e);
    this.remember(), t.center = null, t.radius_m = null, t.polygon = [], this.changed(), this.removed(`${t.name}: Zeichnung entfernt`);
  }
  startDrag(e, t) {
    if (this.tool !== "select" || e.button !== 0) return;
    e.stopPropagation(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.remember(), this.drag = t;
  }
  moveFeature(e, t, s) {
    if (!("id" in e)) return;
    const n = this.feature(e.id);
    if (n) {
      switch (e.type) {
        case "new-tree":
        case "f-radius":
          n.radius_m = y(Math.max(0.1, M(n.points[0], t)));
          break;
        case "f-vertex": {
          const i = n.points[e.index], a = this.snap(t, s, i);
          n.points[e.index] = [y(a[0]), y(a[1])], n.kind === "pipe" && this.movePipeEnds(i, n.points[e.index], n.id);
          break;
        }
        case "f-move": {
          const i = t[0] - e.start[0], a = t[1] - e.start[1], r = n.points.map((l) => [l[0], l[1]]);
          if (n.points = e.orig.points.map((l) => [y(l[0] + i), y(l[1] + a)]), n.kind === "tap" && this.movePipeEnds(r[0], n.points[0], n.id), n.kind === "pipe")
            for (const [l, c] of r.entries()) this.movePipeEnds(c, n.points[l], n.id);
          break;
        }
      }
      this.changed();
    }
  }
  insertVertex(e, t, s) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const n = t.polygon[s], i = t.polygon[(s + 1) % t.polygon.length];
    t.polygon.splice(s + 1, 0, [y((n[0] + i[0]) / 2), y((n[1] + i[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "vertex", id: t.id, index: s + 1 };
  }
  removeVertex(e, t, s) {
    e.preventDefault(), e.stopPropagation();
    const n = t.type === "hose" ? 2 : 3;
    if (t.polygon.length <= n) {
      this.showToast(`Mindestens ${n} Punkte`, !0);
      return;
    }
    this.remember(), t.polygon.splice(s, 1), this.changed();
  }
  marker(e, t) {
    return (e === "valve" ? this.plan.valves : this.plan.sensors).find((n) => n.id === t);
  }
  // Hintergrund ----------------------------------------------------------------
  setBackground(e) {
    const t = this.plan.garden;
    t.background !== e && (this.remember(), t.background = e, e === "map" && ((t.latitude == null || t.longitude == null) && (t.latitude = this.plan.home.latitude, t.longitude = this.plan.home.longitude, this.openSearch()), t.map_provider ??= "basemap_at", t.map_zoom ??= 19, this.bounds() || this.fitView()), this.changed());
  }
  updateGarden(e) {
    this.remember(), Object.assign(this.plan.garden, e), this.changed();
  }
  /**
   * Kartenmitte auf die Mitte der Ansicht legen. Die Zeichnung wird
   * mitverschoben, damit sie auf dem Luftbild an derselben Stelle bleibt.
   */
  recenterMap() {
    const e = this.plan.garden;
    if (e.latitude == null || e.longitude == null) return;
    const { cx: t, cy: s } = this.view;
    this.remember(), [e.latitude, e.longitude] = lt([t, s], [e.latitude, e.longitude]).map(
      (i) => Math.round(i * 1e7) / 1e7
    );
    const n = (i) => [y(i[0] - t), y(i[1] - s)];
    for (const i of this.plan.zones)
      i.center && (i.center = n(i.center)), i.polygon = i.polygon.map(n), i.valve_route = (i.valve_route ?? []).map(n);
    for (const i of [...this.plan.valves, ...this.plan.sensors])
      i.position && (i.position = n(i.position));
    for (const i of this.features) i.points = i.points.map(n);
    this.view = { ...this.view, cx: 0, cy: 0 }, this.searchPin && (this.searchPin = { ...this.searchPin, point: n(this.searchPin.point) }), this.changed(), this.showToast("Kartenmitte gesetzt. Zum Behalten „Speichern“ drücken.");
  }
  // Orten ---------------------------------------------------------------------------
  /** Standort einmal aus dem Browser holen (kein Dauer-Orten, nichts gespeichert). */
  locateOnce() {
    const e = Ft(window.isSecureContext, "geolocation" in navigator);
    return e ? (this.showToast(e, !0), Promise.resolve(null)) : (this.locating = !0, new Promise((t) => {
      navigator.geolocation.getCurrentPosition(
        (s) => {
          this.locating = !1, t({ latitude: s.coords.latitude, longitude: s.coords.longitude, accuracy: s.coords.accuracy });
        },
        (s) => {
          this.locating = !1, this.showToast(Rt(s.code), !0), t(null);
        },
        { enableHighAccuracy: !0, maximumAge: 0, timeout: 3e4 }
      );
    }));
  }
  geoPoint(e) {
    const t = this.plan?.garden;
    return t?.background !== "map" || t.latitude == null || t.longitude == null ? null : Ae(e.latitude, e.longitude, [t.latitude, t.longitude]);
  }
  /** Orten-Knopf: Karte zum eigenen Standort (ist noch nichts gezeichnet: Kartenmitte). */
  async goToMe() {
    if (this.locating) return;
    const e = await this.locateOnce();
    if (!e || !this.plan) return;
    const t = this.plan.garden, s = Math.max(this.view.scale, 1 / ve(e.latitude, 20));
    this.autoFit = !1;
    const n = t.background === "none";
    if (n && (this.remember(), t.background = "map", t.map_provider ??= "basemap_at", t.map_zoom ??= 19), !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((r) => r.position) || t.latitude == null || t.longitude == null) {
      n || this.remember(), t.latitude = Math.round(e.latitude * 1e7) / 1e7, t.longitude = Math.round(e.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: s }, this.changed(), this.showToast(`Kartenmitte auf deinen Standort gesetzt (${ke(e.accuracy)}).`);
      return;
    }
    const a = this.geoPoint(e);
    this.view = { cx: a[0], cy: a[1], scale: s }, n && this.changed(), this.showToast(
      Math.hypot(a[0], a[1]) > 2e3 ? "Du bist weit weg vom Garten. Die Karte zeigt, wo du gerade bist." : `Karte auf deinen Standort gelegt (${ke(e.accuracy)}).`
    );
  }
  /** Ventil oder Sensor, der gerade platziert wird, an den eigenen Standort setzen. */
  async placeAtMe() {
    if (this.tool !== "place" || this.locating) return;
    const e = this.toolTarget, t = await this.locateOnce(), s = t && this.geoPoint(t);
    if (!s || this.tool !== "place" || this.toolTarget !== e) return;
    const [n, i] = e.split(":");
    this.remember(), this.marker(n, i).position = [y(s[0]), y(s[1])], this.selected = { kind: n, id: i }, this.changed(), this.cancelTool(), this.view = { ...this.view, cx: s[0], cy: s[1] }, this.showToast(`An deinen Standort gesetzt (${ke(t.accuracy)})`);
  }
  // Adresssuche ------------------------------------------------------------------
  openSearch() {
    this.searchOpen = !0, this.updateComplete.then(
      () => this.renderRoot.querySelector("#address")?.focus()
    );
  }
  closeSearch() {
    this.searchOpen = !1, this.searchResults = null, this.searchError = "", this.searchPin = null;
  }
  async runSearch() {
    if (!this.searching) {
      this.searching = !0, this.searchError = "";
      try {
        const e = this._hass?.language ?? "de";
        this.searchResults = await yt(
          (t) => this._hass.callWS(t),
          this.searchQuery,
          e
        ), this.searchResults.length || (this.searchError = "Nichts gefunden. Probiere Straße, Hausnummer und Ort.");
      } catch (e) {
        this.searchResults = null, this.searchError = this.message(e);
      } finally {
        this.searching = !1;
      }
    }
  }
  /**
   * Zum gefundenen Ort springen. Ist noch nichts gezeichnet, wird der Ort
   * gleich zur Kartenmitte. Sonst bleibt die Zeichnung, wo sie ist, und nur
   * die Ansicht springt.
   */
  goToPlace(e) {
    const t = this.plan.garden, s = 1 / ve(e.latitude, 20.5);
    if (this.autoFit = !1, !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((i) => i.position) || t.latitude == null || t.longitude == null)
      this.remember(), t.latitude = Math.round(e.latitude * 1e7) / 1e7, t.longitude = Math.round(e.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: s }, this.searchPin = { point: [0, 0], name: e.name }, this.changed(), this.showToast(`${e.name}: Kartenmitte gesetzt. Fein ausrichten mit „Mitte hier festlegen“.`);
    else {
      const i = Ae(e.latitude, e.longitude, [t.latitude, t.longitude]);
      this.view = { cx: i[0], cy: i[1], scale: s }, this.searchPin = { point: i, name: e.name }, this.showToast(`${e.name} angezeigt. „Mitte hier festlegen“ übernimmt die Stelle.`);
    }
    this.searchResults = null;
  }
  renderSearch() {
    return !this.searchOpen || this.tool !== "select" || this.plan.garden.background !== "map" ? p : o`
      <div class="search" @pointerdown=${(e) => e.stopPropagation()}>
        <form
          @submit=${(e) => {
      e.preventDefault(), this.runSearch();
    }}
        >
          <ha-icon icon="mdi:magnify"></ha-icon>
          <input
            id="address"
            type="search"
            placeholder="Adresse, z. B. Hauptstraße 5, Ort"
            autocomplete="street-address"
            .value=${this.searchQuery}
            @input=${(e) => this.searchQuery = e.target.value}
            @keydown=${(e) => e.key === "Escape" && this.closeSearch()}
          />
          <button class="text" type="submit" ?disabled=${this.searching}>
            ${this.searching ? "Sucht …" : "Suchen"}
          </button>
          <button class="icon small" type="button" title="Suche schließen" @click=${this.closeSearch}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </form>
        ${this.searchError ? o`<p class="search-error">${this.searchError}</p>` : p}
        ${this.searchResults?.length ? o`<ul class="results">
              ${this.searchResults.map(
      (e) => o`<li>
                  <button type="button" @click=${() => this.goToPlace(e)}>
                    <ha-icon icon="mdi:map-marker"></ha-icon>
                    <span><strong>${e.name}</strong><small>${e.detail}</small></span>
                  </button>
                </li>`
    )}
            </ul>` : p}
        <p class="search-note">${$t}. Die Adresse geht nur an die Suche und wird nicht gespeichert.</p>
      </div>
    `;
  }
  /** Umschalter für die Kartenansicht (Luftbild, Karte, …) direkt auf dem Plan. */
  renderRasterMenu() {
    return this.rasterMenu ? o`
      <div class="layers raster-menu" role="menu" @pointerdown=${(t) => t.stopPropagation()}>
        ${[
      ["", "Aus", "mdi:eye-off-outline"],
      ["planned", "Geplante Gießmenge", "mdi:water-outline"],
      ["moisture", "Bodenfeuchte jetzt", "mdi:water-percent"],
      ["after", "Bodenfeuchte nach dem Gießen", "mdi:water-check-outline"]
    ].map(
      ([t, s, n]) => o`<button role="menuitemradio" aria-checked=${this.raster === t ? "true" : "false"}
            class=${this.raster === t ? "active" : ""}
            @click=${() => {
        this.raster = t, this.rasterMenu = !1;
      }}><ha-icon icon=${n}></ha-icon>${s}</button>`
    )}
      </div>
    ` : p;
  }
  renderLayers() {
    const e = this.plan.garden;
    if (!this.layersOpen || e.background !== "map") return p;
    const t = Object.entries(this.plan.providers).map(
      ([s, n]) => [s, n.short ?? n.name, n.kind === "map" ? "mdi:map-outline" : "mdi:satellite-variant"]
    );
    return e.map_url && t.push(["custom", "Eigene Adresse", "mdi:web"]), o`
      <div class="layers" role="menu" @pointerdown=${(s) => s.stopPropagation()}>
        ${t.map(
      ([s, n, i]) => o`<button
            role="menuitemradio"
            aria-checked=${e.map_provider === s ? "true" : "false"}
            class=${e.map_provider === s ? "active" : ""}
            @click=${() => {
        e.map_provider !== s && this.updateGarden({ map_provider: s }), this.layersOpen = !1;
      }}
          >
            <ha-icon icon=${i}></ha-icon>${n}
          </button>`
    )}
      </div>
    `;
  }
  moveToHome() {
    const e = this.plan.garden, t = this.plan.home;
    this.remember(), e.latitude = t.latitude, e.longitude = t.longitude, this.view = { ...this.view, cx: 0, cy: 0 }, this.changed();
  }
  applyScale() {
    const e = parseFloat(this.scaleInput.replace(",", "."));
    if (this.scaleDraft.length < 2 || !(e > 0)) {
      this.showToast("Zwei Punkte wählen und den echten Abstand in Metern eingeben", !0);
      return;
    }
    if (M(this.scaleDraft[0], this.scaleDraft[1]) < 2) {
      this.showToast("Die beiden Punkte liegen zu nah beieinander", !0);
      return;
    }
    const t = (s) => [Math.round(s[0] * 10) / 10, Math.round(s[1] * 10) / 10];
    this.updateGarden({
      scale_points: [t(this.scaleDraft[0]), t(this.scaleDraft[1])],
      scale_distance_m: e
    }), this.cancelTool(), this.fitView(), this.showToast("Maßstab gesetzt");
  }
  // Gießen ---------------------------------------------------------------------
  async waterNow(e) {
    const t = this.status?.zones[e.id]?.planned_s || e.duration_s || 0;
    if (!t) {
      this.showToast("Keine Gießdauer: kein Bedarf und keine Dauer von Hand", !0);
      return;
    }
    try {
      await this._hass.callService(B, "run_zone", { zone_id: e.id, duration: t }), this.showToast(`${e.name}: ${Se(t)} eingereiht`);
    } catch (s) {
      this.showToast(this.message(s), !0);
    }
  }
  async cancelZone(e) {
    try {
      await this._hass.callWS({ type: `${B}/queue/cancel`, zone_id: e.id }), this.showToast(`${e.name}: abgebrochen`);
    } catch (t) {
      this.showToast(this.message(t), !0);
    }
  }
  // Darstellung ----------------------------------------------------------------
  render() {
    return this.error ? o`${this.renderHeader()}
        <div class="empty">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <p>${this.error}</p>
          <p class="hint">Ist der Bewässerungsplaner eingerichtet?</p>
        </div>` : this.plan ? o`
      ${this.renderHeader()}
      ${this.page === "operation" ? o`<ip-operation
            .hass=${this._hass}
            @ip-toast=${(e) => this.showToast(e.detail.text, e.detail.isError)}
          ></ip-operation>` : this.page === "overview" ? this.renderOverview() : this.page === "schedule" ? o`<ip-schedule
              .hass=${this._hass}
              .zones=${this.plan.zones}
              @ip-toast=${(e) => this.showToast(e.detail.text, e.detail.isError)}
            ></ip-schedule>` : this.page === "devices" ? o`<ip-devices
                .hass=${this._hass}
                @ip-toast=${(e) => this.showToast(e.detail.text, e.detail.isError)}
                @ip-reloaded=${this.afterReload}
              ></ip-devices>` : this.renderPlanPage()}
      ${this.renderToast()}
    ` : o`${this.renderHeader()}<div class="empty"><div class="spinner"></div></div>`;
  }
  renderPlanPage() {
    return o`
      <div class="layout">
        <div class="stage">
          ${this.renderPlan()} ${this.renderOverlay()}
        </div>
        <aside class="side">
          <div class="tabs">
            <button class=${this.tab === "zones" ? "active" : ""} @click=${() => this.tab = "zones"}>
              <ha-icon icon="mdi:sprinkler-variant"></ha-icon>Zonen
            </button>
            <button class=${this.tab === "plan" ? "active" : ""} @click=${() => this.tab = "plan"}>
              <ha-icon icon="mdi:floor-plan"></ha-icon>Grundriss
            </button>
            <button
              class=${this.tab === "background" ? "active" : ""}
              @click=${() => this.tab = "background"}
            >
              <ha-icon icon="mdi:image-area"></ha-icon>Hintergrund
            </button>
          </div>
          <div class="side-body">
            ${this.tab === "zones" ? this.renderZonesTab() : this.tab === "plan" ? this.renderPlanTab() : this.renderBackgroundTab()}
          </div>
        </aside>
      </div>
    `;
  }
  renderToast() {
    return o`
      ${this.toast ? o`<div class="toast" role="status">
            <span>${this.toast}</span>
            ${this.toastUndo ? o`<button
                  class="text"
                  @click=${() => {
      this.undo(), this.toast = "", this.toastUndo = !1;
    }}
                >
                  Rückgängig
                </button>` : p}
          </div>` : p}
    `;
  }
  // Nässekarte -----------------------------------------------------------------
  rasterData() {
    const e = this.plan, t = this.bounds();
    if (!t || !this.raster) return null;
    const s = JSON.stringify([
      this.raster,
      e.zones,
      e.valves.map((n) => [n.id, n.learned_flow_l_min]),
      e.garden.features.filter((n) => n.kind === "tree" || n.kind === "boundary"),
      Object.entries(this.status?.zones ?? {}).map(([n, i]) => [n, i.planned_s, i.need_mm, i.capacity_mm])
    ]);
    if (this.rasterCache?.key !== s) {
      const n = Kt(this.raster, e.zones, e.valves, this.status, e.garden.features, [
        t[0] - 1,
        t[1] - 1,
        t[2] + 1,
        t[3] + 1
      ]);
      this.rasterCache = { key: s, raster: n };
    }
    return this.rasterCache.raster;
  }
  /** Kachelraster (jede Kachel ein Rechteck mit kleiner Fuge, damit es wie Kacheln aussieht). */
  renderRaster() {
    const e = this.rasterData();
    if (!e) return p;
    const t = this.raster;
    return Qt([this.rasterCache?.key], () => {
      const s = e.step, n = s * 0.08;
      return b`<g class="raster">${e.cells.map((i) => {
        let a;
        if (i.kind === "none") a = "rgba(150,150,150,0.18)";
        else if (i.kind === "unknown") a = "url(#wet-hatch)";
        else {
          const [r, l, c] = t === "planned" ? Gt(i.v) : qt(i.v);
          a = `rgba(${r},${l},${c},0.78)`;
        }
        return b`<rect x=${i.x + n / 2} y=${i.y + n / 2} width=${s - n} height=${s - n} fill=${a}></rect>`;
      })}</g>`;
    });
  }
  /** Messwerte der Sensoren neben dem Symbol (Bodenfeuchte farbig). */
  renderSensorValues(e) {
    const t = this.status?.sensors ?? {};
    return this.plan.sensors.map((s) => {
      const n = t[s.id];
      if (!s.position || !n || typeof n.value != "number") return p;
      let i = "";
      if (s.kind === "soil_moisture") {
        const r = n.field_capacity_pct - n.wilting_point_pct, l = r > 0 ? (n.value - n.wilting_point_pct) / r : 0.5;
        i = l < 0.35 ? "dry" : l > 0.85 ? "wet" : "ok";
      }
      const a = `${Math.round(n.value * 10) / 10}${n.unit ? ` ${n.unit}` : ""}`;
      return b`<text class="sensor-value ${i}" x=${s.position[0]} y=${s.position[1]} dy=${24 * e}
        font-size=${12 * e} stroke-width=${3 * e}>${a}</text>`;
    });
  }
  soilName(e) {
    return e && this.plan.catalog.soils[e]?.name || "unbekannt";
  }
  /** Bodenart einer Fläche im Grundriss, in der die Zone liegt. */
  soilFromPlan(e) {
    const t = this.zoneAnchor(e);
    return t ? this.features.find((n) => n.kind === "soil" && n.points.length >= 3 && Me(t, n.points))?.soil_type ?? null : null;
  }
  renderSoilLegend() {
    const e = /* @__PURE__ */ new Set([
      ...this.plan.zones.map((t) => t.soil_type ?? "loam"),
      ...this.features.filter((t) => t.kind === "soil").map((t) => t.soil_type ?? "loam")
    ]);
    return o`<div class="wet-legend">
      <strong>Bodenart</strong>
      ${Object.entries(this.plan.catalog.soils).filter(([t]) => e.has(t)).map(
      ([t, s]) => o`<div class="soil-row"><span class="swatch" style="background:${$e[t]}"></span>${s.name}
            <small>${s.awc_mm_per_m} mm/m</small></div>`
    )}
      <small>Zahl: Wasser, das der Boden je Meter Tiefe speichern kann. Sandiger Boden braucht öfter, aber weniger Wasser.</small>
    </div>`;
  }
  /** Pflanzen, Wasserbedarf und Boden einer Zone. */
  renderPlantSoil(e) {
    const t = this.plan.catalog, s = e.plant_type ? t.plants[e.plant_type] : void 0, i = ((l) => t.needs.find((c) => l <= on(c.key)) ?? t.needs[t.needs.length - 1])(e.kc), a = this.soilFromPlan(e), r = (l) => {
      this.remember(), l(), this.changed();
    };
    return o`
      <details class="plant" open>
        <summary>Pflanzen und Boden</summary>
        <label class="field wide">
          <span>Was wächst hier?</span>
          <select @change=${(l) => {
      const c = l.target.value;
      r(() => {
        e.plant_type = c || null, c && (e.kc = t.plants[c].kc), e.root_depth_m = null;
      });
    }}>
            <option value="" ?selected=${!e.plant_type}>(keine Angabe)</option>
            ${Object.entries(t.plants).sort((l, c) => l[1].name.localeCompare(c[1].name, "de")).map(([l, c]) => o`<option value=${l} ?selected=${l === e.plant_type}>${c.name}</option>`)}
          </select>
        </label>
        <div class="field wide">
          <span>Wasserbedarf</span>
          <div class="levels" role="radiogroup">
            ${t.needs.map(
      (l) => o`<button role="radio" aria-checked=${l.key === i.key ? "true" : "false"}
                class=${l.key === i.key ? "active" : ""} title=${`Pflanzenfaktor ${l.kc}`}
                @click=${() => r(() => e.kc = l.kc)}>${l.name}</button>`
    )}
          </div>
          <small class="hint">
            Pflanzenfaktor ${e.kc.toLocaleString("de-DE")}${s && s.kc !== e.kc ? o` (für ${s.name} üblich: ${s.kc.toLocaleString("de-DE")})` : p}
          </small>
        </div>
        <label class="field wide">
          <span>Boden</span>
          <select @change=${(l) => {
      const c = l.target.value;
      r(() => e.soil_type = c || null);
    }}>
            <option value="" ?selected=${!e.soil_type}>unbekannt (gilt als Lehm)</option>
            ${Object.entries(t.soils).map(
      ([l, c]) => o`<option value=${l} ?selected=${l === e.soil_type}>${c.name}</option>`
    )}
          </select>
        </label>
        ${a && a !== e.soil_type ? o`<button class="text small" @click=${() => r(() => e.soil_type = a)}>
              <ha-icon icon="mdi:layers-triple-outline"></ha-icon>Boden aus dem Plan übernehmen: ${this.soilName(a)}
            </button>` : p}
        <p class="hint small">Gilt für die berechnete Gießdauer. Mehr Einstellungen (Wurzeltiefe, Effizienz) unter Einstellungen → Integration → Konfigurieren.</p>
      </details>
    `;
  }
  renderWetLegend() {
    const e = this.raster, t = this.plan.zones.filter((a) => a.enabled && de(a) !== null).map((a) => ({ z: a, why: Ge(a, this.plan.valves, this.status) })).filter((a) => a.why !== null), s = (a) => a.map(([, [r, l, c]], d) => `rgb(${r},${l},${c}) ${d / (a.length - 1) * 100}%`).join(", "), n = e === "planned", i = Z[Z.length - 1][0];
    return o`<div class="wet-legend">
      <strong>${n ? "Geplante Gießmenge (nächster Durchgang)" : e === "after" ? "Bodenfeuchte nach dem nächsten Gießen" : "Bodenfeuchte jetzt"}</strong>
      <div class="bar" style="background: linear-gradient(to right, ${s(n ? Z : it)})"></div>
      ${n ? o`<div class="ticks">${Z.map(([a]) => o`<span>${a}${a === i ? "+" : ""}</span>`)}<em>mm</em></div>` : o`<div class="ticks"><span>trocken</span><span>halb</span><span>voll</span><span>zu nass</span></div>`}
      <small class="keys"><span class="swatch none"></span>nicht bewässert <span class="hatch"></span>ohne Wert</small>
      ${t.length ? o`<div class="wet-missing">
            <small><strong>Ohne Wert:</strong> ${t.map((a) => `${a.z.name} (${a.why})`).join(", ")}</small>
            ${t.some((a) => a.why === "Durchfluss unbekannt") ? o`<small>Den Durchfluss lernt die Integration bei einem Lauf von mindestens 1 Minute mit Durchflusssensor.
                  Ohne Sensor: bei der Zone unter „Ventil“ den Durchfluss von Hand eintragen (z. B. Eimer auslitern).</small>` : p}
          </div>` : p}
      <details class="howto">
        <summary>Wie wird das berechnet?</summary>
        ${n ? o`<small>Liter = geplante Dauer × Durchfluss des Ventils, verteilt auf die Fläche der Zone (1 L auf 1 m² = 1 mm).
              Die geplante Dauer kommt aus der Zone: von Hand, aus einer Entität oder berechnet aus dem Bedarf (bei keinem Bedarf 0).
              Wo sich Zonen überschneiden, zählen beide; hinter dicken Baumstämmen bleibt es beim Sprinkler trocken.</small>` : o`<small>Wasserhaushalt nach FAO-56 („Wasserkonto“ je Zone): Jeden Tag wird aus Temperatur, Luftfeuchte und Wind die
              Verdunstung (ET0) berechnet, mal Pflanzenfaktor. Das zieht Wasser vom Konto ab; wirksamer Regen und Gießen füllen es auf.
              „Voll“ ist die nutzbare Feldkapazität im Wurzelraum (je nach Boden und Wurzeltiefe), „trocken“ heißt aufgebraucht.
              Ein Bodenfeuchtesensor ersetzt die Schätzung. Ohne Wetterquelle bleibt der Boden rechnerisch voll.
              ${e === "after" ? "„Nach dem Gießen“ rechnet die geplante Gießmenge dazu, davon kommt beim Sprinkler etwa 75 %, beim Tropfschlauch 90 % im Boden an." : ""}</small>`}
      </details>
    </div>`;
  }
  // Übersicht ------------------------------------------------------------------
  renderOverview() {
    const e = this.plan, t = e.zones, s = (h) => e.valves.find((g) => g.id === h.valve_id), n = t.map((h) => {
      const g = de(h), $ = g ?? h.area_m2, _ = s(h)?.learned_flow_l_min ?? null, z = Pe(h, this.status), x = _ && z ? z / 60 * _ : null;
      return { z: h, drawn: g, area: $, flow: _, seconds: z, liters: x, mm: st(h, e.valves, this.status) };
    }), i = n.filter((h) => h.z.enabled), a = i.reduce((h, g) => h + (g.area ?? 0), 0), r = i.reduce((h, g) => h + (g.liters ?? 0), 0), l = t.reduce((h, g) => h + g.overlap_m2, 0) / 2, c = vt(e.garden.features), d = ["sprinkler", "drip", "hose"].map((h) => {
      const g = i.filter(($) => $.z.type === h);
      return { type: h, count: g.length, area: g.reduce(($, _) => $ + (_.area ?? 0), 0) };
    }), m = {
      sprinkler: ["Sprinkler", "mdi:sprinkler-variant"],
      drip: ["Tropfschlauch", "mdi:water-outline"],
      hose: ["Gießschlauch", "mdi:pipe"]
    }, u = [];
    for (const h of n)
      h.z.enabled && (h.drawn === null && !h.z.area_m2 ? u.push(`${h.z.name}: weder gezeichnet noch Fläche von Hand`) : h.drawn === null && u.push(`${h.z.name}: noch nicht gezeichnet (Fläche von Hand)`), h.z.valve_id ? h.flow || u.push(`${h.z.name}: Durchfluss noch nicht gelernt (nach dem ersten Lauf)`) : u.push(`${h.z.name}: kein Ventil zugeordnet`));
    const v = e.valves.map((h) => {
      const g = i.filter((z) => z.z.valve_id === h.id), $ = g.reduce((z, x) => z + (x.area ?? 0), 0), _ = h.learned_flow_l_min && $ ? h.learned_flow_l_min * 60 / $ : null;
      return { v: h, mine: g, area: $, rate: _ };
    }).filter((h) => h.mine.length), S = (h, g = 0) => h == null ? "–" : h.toLocaleString("de-DE", { maximumFractionDigits: g });
    return o`
      <div class="overview">
        <section class="tiles">
          <div class="tile"><span>Bewässerte Fläche</span><strong>${E(a)}</strong>
            <small>${i.length} aktive Zonen</small></div>
          ${c ? o`<div class="tile"><span>Grundstück</span><strong>${E(c)}</strong>
                <small>davon ${Math.round(a / c * 100)} % bewässert</small></div>` : p}
          <div class="tile"><span>Gezeichnet</span><strong>${n.filter((h) => h.drawn !== null).length} von ${t.length}</strong>
            <small>Zonen im Plan</small></div>
          <div class="tile"><span>Wasser pro Durchgang</span><strong>${S(r)} L</strong>
            <small>alle aktiven Zonen einmal</small></div>
          <div class="tile ${l > 0.5 ? "warn" : ""}"><span>Überschneidungen</span><strong>${E(l)}</strong>
            <small>werden doppelt gegossen</small></div>
        </section>
        <section class="types">
          ${d.map(
      (h) => o`<div class="type">
              <ha-icon icon=${m[h.type][1]}></ha-icon>
              <span>${m[h.type][0]}</span>
              <strong>${E(h.area)}</strong>
              <small>${h.count} Zone${h.count === 1 ? "" : "n"}</small>
            </div>`
    )}
        </section>
        ${u.length ? o`<section class="card"><h3>Noch offen</h3><ul class="hints">${u.map((h) => o`<li>${h}</li>`)}</ul></section>` : p}
        <section class="card">
          <h3>Zonen</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Zone</th><th>Art</th><th>Ventil</th><th class="n">Fläche</th><th class="n">Dauer</th>
                <th class="n">Liter</th><th class="n">mm</th><th class="n">Bedarf</th></tr></thead>
              <tbody>
                ${n.map(
      (h, g) => o`<tr class=${h.z.enabled ? "" : "off"}>
                    <td><span class="dot" style="--zone:${this.zoneColor(g)}"></span>${h.z.name}</td>
                    <td>${m[h.z.type]?.[0] ?? h.z.type}</td>
                    <td>${s(h.z)?.name ?? "–"}</td>
                    <td class="n">${h.area ? E(h.area) : "–"}${h.drawn === null && h.area ? o`<sup title="von Hand">*</sup>` : p}</td>
                    <td class="n">${h.seconds ? Se(h.seconds) : "–"}</td>
                    <td class="n">${S(h.liters)}</td>
                    <td class="n">${S(h.mm, 1)}</td>
                    <td class="n">${this.status?.zones[h.z.id] ? `${S(this.status.zones[h.z.id].need_mm, 1)} mm` : "–"}</td>
                  </tr>`
    )}
              </tbody>
            </table>
          </div>
          <p class="hint small">Dauer: geplant, sonst von Hand. Liter und mm je Durchgang aus dem gelernten Durchfluss. * = Fläche von Hand.</p>
        </section>
        <section class="card">
          <h3>Ventile</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Ventil</th><th>Zonen</th><th class="n">Fläche</th><th class="n">Durchfluss</th><th class="n">Regenrate</th></tr></thead>
              <tbody>
                ${v.map(
      (h) => o`<tr>
                    <td>${h.v.name}</td>
                    <td>${h.mine.map((g) => g.z.name).join(", ")}</td>
                    <td class="n">${E(h.area)}</td>
                    <td class="n">${h.v.learned_flow_l_min ? `${S(h.v.learned_flow_l_min, 1)} L/min` : "–"}</td>
                    <td class="n">${h.rate ? `${S(h.rate, 1)} mm/h` : "–"}</td>
                  </tr>`
    )}
              </tbody>
            </table>
          </div>
          <p class="hint small">Regenrate: so viele Millimeter pro Stunde kommen auf der Fläche an. Über etwa 15 mm/h kann Wasser auf schwerem Boden ablaufen; dann hilft „Abwechselnd“ mit Einziehzeit.</p>
        </section>
      </div>
    `;
  }
  renderHeader() {
    const e = this.status;
    return o`
      <header>
        <button
          class="icon menu"
          title="Menü"
          @click=${() => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: !0, composed: !0 }))}
        >
          <ha-icon icon="mdi:menu"></ha-icon>
        </button>
        <img class="logo" src="/irrigation_planner_static/logo.png" alt="" width="32" height="32" />
        <div class="title">Bewässerung</div>
        ${this.plan ? o`<nav class="pages">
              <button class=${this.page === "plan" ? "active" : ""} title="Plan" @click=${() => this.page = "plan"}>
                <ha-icon icon="mdi:map-outline"></ha-icon><span class="label">Plan</span>
              </button>
              <button class=${this.page === "operation" ? "active" : ""} title="Betrieb" @click=${() => this.page = "operation"}>
                <ha-icon icon="mdi:play-circle-outline"></ha-icon><span class="label">Betrieb</span>
              </button>
              <button class=${this.page === "overview" ? "active" : ""} title="Flächen" @click=${() => this.page = "overview"}>
                <ha-icon icon="mdi:chart-box-outline"></ha-icon><span class="label">Flächen</span>
              </button>
              <button class=${this.page === "schedule" ? "active" : ""} title="Zeitplan" @click=${() => this.page = "schedule"}>
                <ha-icon icon="mdi:calendar-clock"></ha-icon><span class="label">Zeitplan</span>
              </button>
              <button class=${this.page === "devices" ? "active" : ""} title="Geräte" @click=${() => this.page = "devices"}>
                <ha-icon icon="mdi:valve"></ha-icon><span class="label">Geräte</span>
              </button>
            </nav>` : p}
        ${e ? o`<div class="chips">
              ${e.winter_mode ? o`<button class="chip toggle winter" role="switch" aria-checked="true"
                    title="Winterpause: nichts wird gegossen. Klicken: Winterpause beenden (Saison)"
                    @click=${() => this.toggleWinter(!1)}
                    ><ha-icon icon="mdi:snowflake"></ha-icon>Winterpause</button
                  >` : o`<button class="chip toggle season" role="switch" aria-checked="false"
                    title="Saison: Bewässerung aktiv. Klicken: Winterpause einschalten"
                    @click=${() => this.toggleWinter(!0)}
                    ><ha-icon icon="mdi:weather-sunny"></ha-icon>Saison</button
                  ><button class="chip toggle ${e.automatic ? "on" : ""}" role="switch"
                    aria-checked=${e.automatic ? "true" : "false"}
                    title=${e.automatic ? "Programme starten nach Zeitplan. Klicken: Automatik aus (was läuft, läuft zu Ende)" : "Programme starten nicht von selbst. Klicken: Automatik ein"}
                    @click=${() => this.toggleAutomatic(!e.automatic)}
                    ><ha-icon icon=${e.automatic ? "mdi:calendar-check" : "mdi:calendar-remove"}></ha-icon
                    >${e.automatic ? "Automatik an" : "Automatik aus"}</button
                  >`}
              ${e.problems.length ? o`<span class="chip alarm" title=${e.problems.join(`
`)}
                    ><ha-icon icon="mdi:alert"></ha-icon>${e.problems.length} Problem${e.problems.length > 1 ? "e" : ""}</span
                  >` : p}
            </div>` : p}
        <div class="spacer"></div>
        ${this.plan ? o`
              ${this.page === "plan" || this.page === "overview" || this.dirty ? o`<button class="icon" title="Rückgängig (Strg+Z)" ?disabled=${!this.history.length} @click=${this.undo}>
                      <ha-icon icon="mdi:undo"></ha-icon>
                    </button>
                    <button class="text" ?disabled=${!this.dirty || this.saving} @click=${this.discard}>Verwerfen</button>
                    <button class="primary" ?disabled=${!this.dirty || this.saving} @click=${this.save}>
                      <ha-icon icon="mdi:content-save"></ha-icon>${this.saving ? "Speichert …" : "Speichern"}
                    </button>` : p}
              <div class="menu-wrap">
                <button class="icon" title="Sichern und Wiederherstellen" @click=${() => this.menuOpen = !this.menuOpen}>
                  <ha-icon icon="mdi:dots-vertical"></ha-icon>
                </button>
                ${this.menuOpen ? o`<div class="popup-menu" role="menu">
                      <button role="menuitem" @click=${this.exportPlan}>
                        <ha-icon icon="mdi:download"></ha-icon>Sicherung herunterladen
                      </button>
                      <label class="menu-item" role="menuitem">
                        <ha-icon icon="mdi:upload"></ha-icon>Sicherung einspielen …
                        <input type="file" accept="application/json,.json" @change=${this.pickImport} />
                      </label>
                    </div>` : p}
              </div>
            ` : p}
      </header>
      ${this.renderImportDialog()}
    `;
  }
  // Sichern und Wiederherstellen -------------------------------------------------
  async exportPlan() {
    this.menuOpen = !1;
    try {
      const e = await this._hass.callWS({ type: `${B}/export` }), t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), s = URL.createObjectURL(t), n = document.createElement("a");
      n.href = s, n.download = `bewaesserung-sicherung-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, n.style.display = "none", document.body.appendChild(n), n.click(), n.remove(), setTimeout(() => URL.revokeObjectURL(s), 1e3), this.showToast(
        this.dirty ? "Sicherung heruntergeladen (ohne die noch nicht gespeicherten Änderungen)" : "Sicherung heruntergeladen"
      );
    } catch (e) {
      this.showToast(`Sicherung fehlgeschlagen: ${this.message(e)}`, !0);
    }
  }
  async pickImport(e) {
    const t = e.target, s = t.files?.[0];
    if (t.value = "", this.menuOpen = !1, !!s)
      try {
        const n = JSON.parse(await s.text());
        this.pendingImport = { name: s.name, data: n };
      } catch {
        this.showToast("Die Datei ist keine gültige Sicherung (kein JSON)", !0);
      }
  }
  async runImport(e) {
    const t = this.pendingImport;
    if (t) {
      this.pendingImport = null;
      try {
        const s = await this._hass.callWS({
          type: `${B}/import`,
          mode: e,
          data: t.data
        }), n = s.notes.length ? ` ${s.notes.join(" ")}` : "";
        s.reloaded ? (this.showToast(`Sicherung eingespielt, wird neu geladen …${n}`), this.unsub?.(), this.unsub = void 0, setTimeout(() => void this.load(), 4e3)) : (this.showToast(`Zeichnung übernommen.${n}`), await this.load());
      } catch (s) {
        this.showToast(`Nicht eingespielt: ${this.message(s)}`, !0);
      }
    }
  }
  renderImportDialog() {
    if (!this.pendingImport) return p;
    const e = this.pendingImport.data?.exported_at;
    return o`
      <div class="dialog-backdrop" @click=${() => this.pendingImport = null}>
        <div class="dialog" role="dialog" aria-modal="true" @click=${(t) => t.stopPropagation()}>
          <h2>Sicherung einspielen</h2>
          <p>
            <strong>${this.pendingImport.name}</strong>${e ? o`<br /><small>erstellt am ${new Date(e).toLocaleString("de-DE")}</small>` : p}
          </p>
          ${this.dirty ? o`<p class="note warn">Nicht gespeicherte Änderungen gehen dabei verloren.</p>` : p}
          <button class="choice" @click=${() => this.runImport("drawing")}>
            <ha-icon icon="mdi:draw"></ha-icon>
            <span
              ><strong>Nur die Zeichnung</strong
              ><small>Hintergrund, Grundriss, Formen der Zonen, Positionen von Ventilen und Sensoren.
                Ventile, Programme und Einstellungen bleiben, wie sie sind.</small></span
            >
          </button>
          <button class="choice" @click=${() => this.runImport("all")}>
            <ha-icon icon="mdi:backup-restore"></ha-icon>
            <span
              ><strong>Alles ersetzen</strong
              ><small>Auch Zonen, Ventile, Programme und Einstellungen. Die Integration wird dabei neu
                geladen; laufende Bewässerung wird beendet und alle Ventile werden geschlossen.</small></span
            >
          </button>
          <div class="actions">
            <span class="spacer"></span>
            <button class="text" @click=${() => this.pendingImport = null}>Abbrechen</button>
          </div>
        </div>
      </div>
    `;
  }
  renderPlan() {
    const { w: e, h: t } = this.size, { cx: s, cy: n, scale: i } = this.view, a = `translate(${e / 2} ${t / 2}) scale(${i}) translate(${-s} ${-n})`, r = 1 / i, l = this.tool === "select" ? this.drag?.type === "pan" ? "grabbing" : "grab" : "crosshair";
    return o`
      <svg
        class="plan ${this.wetOn ? "wet" : ""}"
        width=${e}
        height=${t}
        style="cursor:${l}"
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @wheel=${this.onWheel}
        @dblclick=${(c) => {
      this.tool === "bed" && (c.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishBed()), this.tool === "hose" && (c.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishHose()), this.tool === "feature" && G(this.featureKind) !== "point" && (c.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishFeature());
    }}
      >
        <defs>
          <pattern id="wet-hatch" patternUnits="userSpaceOnUse" width=${8 * r} height=${8 * r} patternTransform="rotate(45)">
            <rect width=${8 * r} height=${8 * r} fill="rgba(120,120,120,0.12)"></rect>
            <line x1="0" y1="0" x2="0" y2=${8 * r} stroke="rgba(90,90,90,0.55)" stroke-width=${2 * r}></line>
          </pattern>
        </defs>
        <g transform=${a}>
          ${this.renderBackground(r)}
          <g class="features">${this.renderFeatures(r)}</g>
          <g class="junctions">${mt(this.pipeLines()).map(
      (c) => b`<circle cx=${c[0]} cy=${c[1]} r=${4.5 * r}><title>Abzweig (T-Stück)</title></circle>`
    )}</g>
          ${this.wetOn ? this.renderRaster() : p}
          ${this.plan.zones.map((c, d) => this.renderZone(c, d, r))}
          ${this.renderSelectedHandles(r)} ${this.renderFeatureHandles(r)}
          ${this.renderDraft(r)} ${this.renderScaleDraft(r)} ${this.renderMeasure(r)}
          ${this.renderValveLinks(r)} ${this.renderFlow(r)}
          ${this.plan.valves.map((c) => this.renderMarker("valve", c, r))}
          ${this.plan.sensors.map((c) => this.renderMarker("sensor", c, r))}
          ${this.wetOn ? this.renderSensorValues(r) : p}
          ${this.renderSnapHint(r)}
          ${this.searchPin && this.plan.garden.background === "map" ? b`<g class="pin" transform="translate(${this.searchPin.point[0]} ${this.searchPin.point[1]}) scale(${r})">
                <path d="M0 0 C-3 -9 -11 -13 -11 -22 A11 11 0 1 1 11 -22 C11 -13 3 -9 0 0 Z"></path>
                <circle cx="0" cy="-22" r="4"></circle>
                <title>${this.searchPin.name}</title>
              </g>` : p}
        </g>
      </svg>
    `;
  }
  visibleBox() {
    const { cx: e, cy: t, scale: s } = this.view, n = this.size.w / 2 / s, i = this.size.h / 2 / s;
    return { x0: e - n, y0: t - i, x1: e + n, y1: t + i };
  }
  renderBackground(e) {
    const t = this.plan.garden, s = this.visibleBox(), n = [];
    if (t.background === "map" && t.latitude != null && t.longitude != null) {
      const r = this.tileTemplate();
      if (r) {
        const l = this.plan.providers[t.map_provider ?? ""], c = l?.max_zoom ?? 20, d = Math.max(
          1,
          Math.min(c, Math.round(Ee(t.latitude, this.view.scale * (window.devicePixelRatio > 1 ? 1.4 : 1))))
        ), m = Oe(r, [t.latitude, t.longitude], s, d);
        n.push(b`<rect x=${s.x0} y=${s.y0} width=${s.x1 - s.x0} height=${s.y1 - s.y0} class="map-fill"></rect>`);
        const u = e * 0.5, v = (S) => S.map(
          (h) => b`<image href=${h.url} x=${h.x - u} y=${h.y - u} width=${h.size + 2 * u} height=${h.size + 2 * u} preserveAspectRatio="none" crossorigin="anonymous"></image>`
        );
        n.push(...v(m)), l?.overlay && t.map_provider !== "custom" && n.push(...v(Oe(l.overlay, [t.latitude, t.longitude], s, d)));
      }
    } else if (t.background === "image" && this.imageUrl && this.imageSize) {
      const r = this.imageMpp();
      n.push(
        b`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * r} height=${this.imageSize[1] * r} preserveAspectRatio="none"></image>`
      );
    }
    const i = [b`<g class="bg" opacity=${t.background_opacity ?? 1}>${n}</g>`], a = (t.background_opacity ?? 1) < 0.35;
    return (t.background !== "map" || a) && i.push(this.renderGrid(s, e, t.background === "image" && !a)), i;
  }
  renderGrid(e, t, s) {
    const n = at(40 * t), i = [], a = n * 5;
    for (let r = Math.floor(e.x0 / n) * n; r <= e.x1; r += n) {
      const l = Math.abs(r / a - Math.round(r / a)) < 1e-6;
      i.push(b`<line x1=${r} y1=${e.y0} x2=${r} y2=${e.y1} class=${l ? "grid major" : "grid"}></line>`);
    }
    for (let r = Math.floor(e.y0 / n) * n; r <= e.y1; r += n) {
      const l = Math.abs(r / a - Math.round(r / a)) < 1e-6;
      i.push(b`<line x1=${e.x0} y1=${r} x2=${e.x1} y2=${r} class=${l ? "grid major" : "grid"}></line>`);
    }
    return b`<g class=${s ? "grid-layer faint" : "grid-layer"}>${i}</g>`;
  }
  tileTemplate() {
    const e = this.plan.garden;
    return e.map_provider === "custom" ? e.map_url ?? "" : this.plan.providers[e.map_provider ?? ""]?.url ?? "";
  }
  zoneColor(e) {
    return Ce[e % Ce.length];
  }
  renderZone(e, t, s) {
    const n = this.zoneColor(t), i = this.status?.zones[e.id]?.state ?? "idle", a = this.selected?.kind === "zone" && this.selected.id === e.id, r = this.wetOn && e.enabled ? Ge(e, this.plan.valves, this.status) : null, l = `zone ${i} ${a ? "selected" : ""} ${e.enabled ? "" : "disabled"} ${r ? "nowet" : ""}`;
    let c, d = null;
    if (e.type === "sprinkler" && e.center && e.radius_m ? (c = b`<path d=${Te(e.center, e.radius_m, e.start_angle_deg, e.arc_deg)}></path>`, d = e.arc_deg >= 360 ? e.center : I(e.center, e.radius_m * 0.55, e.start_angle_deg + e.arc_deg / 2)) : e.type === "hose" && e.polygon.length >= 2 && e.radius_m ? (c = this.hoseShape(e.id, e.polygon, e.radius_m, s), d = this.zoneAnchor(e)) : e.type === "drip" && e.polygon.length >= 3 && (c = b`<polygon points=${e.polygon.map((v) => v.join(",")).join(" ")}></polygon>`, d = me(e.polygon)), !c) return p;
    const m = ie(e), u = this.soilOn ? $e[e.soil_type ?? "loam"] : "";
    return b`
      <g class=${l} style="--zone:${u || n}"
        @pointerdown=${(v) => {
      this.tool === "select" && (this.selected = { kind: "zone", id: e.id }, this.tab = "zones", this.startDrag(v, { type: "move-zone", id: e.id, start: this.toPlan(v), orig: structuredClone(e) }));
    }}>
        ${c}
        ${d ? b`<text x=${d[0]} y=${d[1]} font-size=${13 * s} stroke-width=${3 * s} class="label">
              <tspan x=${d[0]} dy="0">${e.name}</tspan>
              <tspan x=${d[0]} dy=${15 * s} class="sub">${r ? `kein Wert: ${r}` : `${E(m)}${_e[i] ? ` · ${_e[i]}` : ""}`}</tspan>
            </text>` : p}
      </g>`;
  }
  /**
   * Schlauch: kräftige Linie, darum die Reichweite als Umriss (gleicher
   * Abstand zur Linie, runde Enden) mit leichter Füllung.
   */
  hoseShape(e, t, s, n, i = "") {
    const a = t.map((c) => c.join(",")).join(" "), r = 2 * n, l = `hose-mask-${e}`;
    return b`<g class="hose ${i}">
      <mask id=${l} maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000">
        <rect x="-100000" y="-100000" width="200000" height="200000" fill="white"></rect>
        <polyline points=${a} fill="none" stroke="black" stroke-width=${2 * s}
          stroke-linecap="round" stroke-linejoin="round"></polyline>
      </mask>
      <polyline class="hose-band" points=${a} stroke-width=${2 * s} style="--band:${2 * s}"></polyline>
      <polyline class="hose-reach" points=${a} stroke-width=${2 * s + 2 * r} mask="url(#${l})"></polyline>
      <polyline class="hose-line" points=${a}></polyline>
      ${t.map((c, d) => d === 0 || d === t.length - 1 ? b`<circle class="hose-end" cx=${c[0]} cy=${c[1]} r=${3.5 * n}></circle>` : p)}
    </g>`;
  }
  renderSelectedHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "zone") return p;
    const t = this.zone(this.selected.id), s = 7 * e, n = (a, r, l = "", c = "") => b`<circle class="handle ${l}" cx=${a[0]} cy=${a[1]} r=${s}
        @pointerdown=${(d) => this.startDrag(d, r)}><title>${c}</title></circle>`;
    if (t.type === "sprinkler" && t.center && t.radius_m) {
      const a = t.center, r = t.arc_deg >= 360, l = r ? t.start_angle_deg + 135 : t.start_angle_deg + t.arc_deg / 2, c = [
        b`<line class="guide" x1=${a[0]} y1=${a[1]} x2=${I(a, t.radius_m, t.start_angle_deg)[0]} y2=${I(a, t.radius_m, t.start_angle_deg)[1]}></line>`,
        n(a, { type: "center", id: t.id }, "center", "Mittelpunkt verschieben"),
        n(I(a, t.radius_m, l), { type: "radius", id: t.id }, "radius", "Reichweite ändern"),
        n(I(a, t.radius_m, t.start_angle_deg), { type: "start", id: t.id }, "angle", "Anfang des Bogens")
      ];
      return r ? c.push(
        n(I(a, t.radius_m * 0.8, t.start_angle_deg + 20), { type: "end", id: t.id }, "angle small", "Bogen öffnen")
      ) : c.push(
        n(I(a, t.radius_m, t.start_angle_deg + t.arc_deg), { type: "end", id: t.id }, "angle", "Ende des Bogens")
      ), c;
    }
    const i = t.type === "hose" ? 2 : 3;
    if (t.type !== "sprinkler" && t.polygon.length >= i) {
      const a = t.polygon, r = t.type === "hose" ? a.slice(0, -1) : a;
      return [
        ...t.type === "hose" && t.radius_m ? (() => {
          const c = We(a, t.radius_m), d = We(a, 0);
          return [
            b`<line class="guide" x1=${d[0]} y1=${d[1]} x2=${c[0]} y2=${c[1]}></line>`,
            n(c, { type: "hose-radius", id: t.id }, "radius", "Reichweite ändern")
          ];
        })() : [],
        ...r.map((c, d) => {
          const m = a[(d + 1) % a.length], u = [(c[0] + m[0]) / 2, (c[1] + m[1]) / 2];
          return b`<circle class="handle mid" cx=${u[0]} cy=${u[1]} r=${s * 0.7}
            @pointerdown=${(v) => this.insertVertex(v, t, d)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
        }),
        ...a.map(
          (c, d) => b`<circle class="handle" cx=${c[0]} cy=${c[1]} r=${s}
            @pointerdown=${(m) => this.startDrag(m, { type: "vertex", id: t.id, index: d })}
            @contextmenu=${(m) => this.removeVertex(m, t, d)}
            @dblclick=${(m) => this.removeVertex(m, t, d)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
        )
      ];
    }
    return p;
  }
  renderFeatures(e) {
    const t = { area: 0, line: 1, point: 2 };
    return [...this.features].sort((n, i) => t[G(n.kind)] - t[G(i.kind)]).map((n) => {
      const i = this.selected?.kind === "feature" && this.selected.id === n.id, a = G(n.kind), r = (u) => {
        this.tool === "select" && (this.selected = { kind: "feature", id: n.id }, this.tab = "plan", this.startDrag(u, { type: "f-move", id: n.id, start: this.toPlan(u), orig: structuredClone(n) }));
      }, l = `feature ${n.kind} ${i ? "selected" : ""} ${n.locked ? "locked" : ""}`;
      if (a === "area") {
        const u = me(n.points), v = n.kind === "soil" ? $e[n.soil_type ?? ""] ?? "#a9825a" : "";
        return b`<polygon class=${l} points=${n.points.map((S) => S.join(",")).join(" ")}
          style=${v ? `fill:${v}44;stroke:${v}` : ""}
          @pointerdown=${r}><title>${Y(n)}${n.kind === "soil" ? `: ${this.soilName(n.soil_type)}` : ""}</title></polygon>
          ${n.label ? b`<text class="feature-name" x=${u[0]} y=${u[1]} dy=${4 * e} font-size=${12 * e}
                stroke-width=${3 * e}>${n.label}</text>` : p}`;
      }
      if (a === "line") {
        const u = n.kind === "boundary" && n.points.length >= 3 ? me(n.points) : null;
        return b`<g class=${l} @pointerdown=${r}>
          <polyline class="hit" points=${n.points.map((v) => v.join(",")).join(" ")} stroke-width=${12 * e}></polyline>
          <polyline points=${n.points.map((v) => v.join(",")).join(" ")}></polyline>
          <title>${Y(n)}${u ? `: ${E(ee(n.points))}` : ""}</title></g>
          ${u && i ? b`<text class="feature-name plot" x=${u[0]} y=${u[1]} font-size=${13 * e} stroke-width=${3 * e}>
                Grundstück ${E(ee(n.points))}</text>` : p}`;
      }
      const [c, d] = n.points[0];
      if (n.kind === "tree")
        return b`<g class=${l} @pointerdown=${r}>
          <circle cx=${c} cy=${d} r=${n.radius_m ?? 1}></circle>
          <circle class="trunk" cx=${c} cy=${d} r=${Math.max(3 * e, (n.trunk_m ?? 0) / 2)}></circle>
          <title>${Y(n)}</title></g>`;
      if (n.kind === "label")
        return b`<text class=${l} x=${c} y=${d} font-size=${14 * e} stroke-width=${3 * e}
          @pointerdown=${r}>${n.label}</text>`;
      const m = this.waterFlowing();
      return b`<g class="${l} ${m ? "open" : ""}" @pointerdown=${r}>
        <circle cx=${c} cy=${d} r=${8 * e}></circle>
        <text x=${c} y=${d} dy=${4 * e} font-size=${11 * e}>H</text>
        ${m ? b`<path class="drip" d=${`M${c} ${d + 10 * e} q${-3 * e} ${4 * e} 0 ${6 * e} q${3 * e} ${-2 * e} 0 ${-6 * e} Z`}></path>` : p}
        <title>${Y(n)}: ${m ? "Wasser fließt" : "zu"}</title></g>`;
    });
  }
  renderFeatureHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "feature") return p;
    const t = this.feature(this.selected.id);
    if (!t || t.locked) return p;
    const s = 7 * e, n = G(t.kind);
    if (n === "point") {
      if (t.kind !== "tree") return p;
      const [l, c] = t.points[0], d = I(t.points[0], t.radius_m ?? 1, 135);
      return b`
        <circle class="handle center" cx=${l} cy=${c} r=${s}
          @pointerdown=${(m) => this.startDrag(m, { type: "f-move", id: t.id, start: this.toPlan(m), orig: structuredClone(t) })}></circle>
        <circle class="handle" cx=${d[0]} cy=${d[1]} r=${s}
          @pointerdown=${(m) => this.startDrag(m, { type: "f-radius", id: t.id })}><title>Kronengröße</title></circle>`;
    }
    const i = t.points;
    return [
      ...(n === "area" ? i : i.slice(0, -1)).map((l, c) => {
        const d = i[(c + 1) % i.length], m = [(l[0] + d[0]) / 2, (l[1] + d[1]) / 2];
        return b`<circle class="handle mid" cx=${m[0]} cy=${m[1]} r=${s * 0.7}
        @pointerdown=${(u) => this.insertFeatureVertex(u, t, c)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
      }),
      ...i.map(
        (l, c) => b`<circle class="handle" cx=${l[0]} cy=${l[1]} r=${s}
          @pointerdown=${(d) => this.startDrag(d, { type: "f-vertex", id: t.id, index: c })}
          @contextmenu=${(d) => this.removeFeatureVertex(d, t, c)}
          @dblclick=${(d) => this.removeFeatureVertex(d, t, c)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
      )
    ];
  }
  insertFeatureVertex(e, t, s) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const n = t.points[s], i = t.points[(s + 1) % t.points.length];
    t.points.splice(s + 1, 0, [y((n[0] + i[0]) / 2), y((n[1] + i[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "f-vertex", id: t.id, index: s + 1 };
  }
  removeFeatureVertex(e, t, s) {
    e.preventDefault(), e.stopPropagation();
    const n = G(t.kind) === "area" ? 3 : 2;
    if (t.points.length <= n) {
      this.showToast(`${X[t.kind].label}: mindestens ${n} Punkte`, !0);
      return;
    }
    this.remember(), t.points.splice(s, 1), this.changed();
  }
  /** Messwerkzeug: Strecken mit Längen und Summe. */
  renderMeasure(e) {
    if (this.tool !== "measure" || !this.measurePts.length) return p;
    const t = this.hover ? [...this.measurePts, this.hover] : this.measurePts, s = t.slice(1).map((n, i) => {
      const a = t[i];
      if (M(a, n) < 0.01) return p;
      const r = [(a[0] + n[0]) / 2, (a[1] + n[1]) / 2];
      return b`<text class="measure-label" x=${r[0]} y=${r[1]} dy=${-6 * e} font-size=${13 * e}
        stroke-width=${3 * e}>${Q(M(a, n))}</text>`;
    });
    return b`<g class="measure">
      <polyline points=${t.map((n) => n.join(",")).join(" ")}></polyline>
      ${this.measurePts.map((n) => b`<circle cx=${n[0]} cy=${n[1]} r=${4 * e}></circle>`)}
      ${s}
    </g>`;
  }
  /** Mittelpunkt einer gezeichneten Zone (für Beschriftung und Verbindungslinie). */
  zoneAnchor(e) {
    return e.type === "sprinkler" ? e.center && e.radius_m ? e.center : null : e.type === "hose" ? e.polygon.length >= 2 ? pt(e.polygon, 0.5) : null : e.polygon.length >= 3 ? me(e.polygon) : null;
  }
  /** Gestrichelte Linie von jeder Zone zu ihrem Ventil (wenn beide im Plan sind). */
  /**
   * Animation beim Gießen: Wasser fließt vom Hahn durch die Zuleitungen zum
   * offenen Ventil; Sprinkler zeigen Wellen. Nur Anzeige, aus dem Zustand.
   */
  renderFlow(e) {
    const t = this.plan.zones.filter((i) => this.status?.zones[i.id]?.state === "running");
    if (!t.length) return p;
    const s = this.features.filter((i) => i.kind === "tap").map((i) => i.points[0]), n = this.pipeLines();
    return b`<g class="flow">
      ${t.map((i) => {
      const a = this.plan.valves.find((c) => c.id === i.valve_id), r = a?.position && s.length ? gt(n, s, a.position) : [], l = i.type === "sprinkler" && i.center && i.radius_m ? [0, 1].map(
        (c) => b`<path class="spray" style=${`transform-origin:${i.center[0]}px ${i.center[1]}px;animation-delay:${c * 0.8}s`}
                  d=${Te(i.center, i.radius_m, i.start_angle_deg, i.arc_deg)}></path>`
      ) : p;
      return b`
          ${r.map(([c, d]) => b`<line class="pipe-active" x1=${c[0]} y1=${c[1]} x2=${d[0]} y2=${d[1]}></line>`)}
          ${r.map(([c, d]) => b`<line class="water" x1=${c[0]} y1=${c[1]} x2=${d[0]} y2=${d[1]}
            stroke-dasharray=${`${3 * e} ${7 * e}`} style=${`--period:${10 * e}px`}></line>`)}
          ${a?.position ? b`<circle class="valve-open" cx=${a.position[0]} cy=${a.position[1]} r=${11 * e}></circle>` : p}
          ${l}`;
    })}
    </g>`;
  }
  /**
   * Leitung vom Ventil zur Zone: durch die Zwischenpunkte, Ecken abgerundet.
   * Ist die Zone ausgewählt, lassen sich Punkte einfügen (Ziehen an der
   * Mitte eines Stücks), verschieben und löschen (Doppelklick).
   */
  renderValveLinks(e) {
    return this.plan.zones.map((t, s) => {
      const n = this.plan.valves.find((h) => h.id === t.valve_id), i = this.zoneAnchor(t);
      if (!n?.position || !i) return p;
      const r = this.selected?.kind === "zone" && this.selected.id === t.id || this.selected?.kind === "valve" && this.selected.id === n.id, l = r && this.tool === "select", c = t.valve_route ?? [], d = [n.position, ...c, i], m = this.status?.zones[t.id]?.state === "running", u = b`<path class="valve-link ${r ? "selected" : ""} ${m ? "flowing" : ""}" style="--zone:${this.zoneColor(s)};--period:${10 * e}px"
        d=${Le(d, Math.max(0.4, 16 * e))} stroke-dasharray=${`${6 * e} ${4 * e}`}></path>`;
      if (!l) return u;
      const v = 7 * e, S = Le(d, Math.max(0.4, 16 * e));
      return b`${u}
        <path class="link-hit" d=${S} stroke-width=${14 * e}
          @pointerdown=${(h) => this.grabLink(h, t, d)}>
          <title>Linie ziehen: Knick einfügen</title></path>
        ${d.slice(0, -1).map((h, g) => {
        const $ = d[g + 1], _ = [(h[0] + $[0]) / 2, (h[1] + $[1]) / 2];
        return b`<circle class="handle mid link" cx=${_[0]} cy=${_[1]} r=${v * 0.7}
            @pointerdown=${(z) => this.insertRoutePoint(z, t, g, _)}>
            <title>Ziehen: Knick in der Leitung einfügen</title></circle>`;
      })}
        ${c.map(
        (h, g) => b`<circle class="handle link" cx=${h[0]} cy=${h[1]} r=${v}
            @pointerdown=${($) => this.startDrag($, { type: "route", id: t.id, index: g })}
            @dblclick=${($) => this.removeRoutePoint($, t, g)}
            @contextmenu=${($) => this.removeRoutePoint($, t, g)}>
            <title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
      )}`;
    });
  }
  /** Leitung irgendwo anfassen: dort entsteht ein Knick, der gleich mitgezogen wird. */
  grabLink(e, t, s) {
    if (this.tool !== "select" || e.button !== 0) return;
    const n = this.toPlan(e);
    let i = 0, a = Number.POSITIVE_INFINITY;
    for (let r = 0; r < s.length - 1; r++) {
      const l = nt(n, s[r], s[r + 1]);
      l < a && (a = l, i = r);
    }
    this.selected = { kind: "zone", id: t.id }, this.insertRoutePoint(e, t, i, n);
  }
  insertRoutePoint(e, t, s, n) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const i = [...t.valve_route ?? []];
    i.splice(s, 0, [y(n[0]), y(n[1])]), t.valve_route = i, this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "route", id: t.id, index: s };
  }
  removeRoutePoint(e, t, s) {
    e.preventDefault(), e.stopPropagation(), this.remember(), t.valve_route = (t.valve_route ?? []).filter((n, i) => i !== s), this.changed();
  }
  renderSnapHint(e) {
    return this.snapHint ? b`<circle class="snap-hint" cx=${this.snapHint[0]} cy=${this.snapHint[1]} r=${9 * e}></circle>` : p;
  }
  renderDraft(e) {
    if (this.tool === "feature" && this.draft.length) {
      const n = this.hover ? [...this.draft, this.hover] : this.draft, i = G(this.featureKind) === "area";
      return b`
        <g class="draft feature-draft ${this.featureKind}">
          <polyline points=${[...n, ...i && n.length > 2 ? [n[0]] : []].map((a) => a.join(",")).join(" ")}></polyline>
          ${this.draft.map((a, r) => b`<circle cx=${a[0]} cy=${a[1]} r=${(r === 0 ? 7 : 5) * e}></circle>`)}
        </g>`;
    }
    if (this.tool === "hose" && this.draft.length) {
      const n = this.hover ? [...this.draft, this.hover] : this.draft;
      return b`<g class="draft">
        ${n.length >= 2 ? b`<g class="zone" style="--zone:#1e88e5">${this.hoseShape("draft", n, this.hoseRadius, e)}</g>` : p}
        <polyline points=${n.map((i) => i.join(",")).join(" ")} style="fill:none"></polyline>
        ${this.draft.map((i) => b`<circle cx=${i[0]} cy=${i[1]} r=${5 * e}></circle>`)}
      </g>`;
    }
    if (this.tool !== "bed" || !this.draft.length) return p;
    const t = this.hover ? [...this.draft, this.hover] : this.draft, s = this.plan.zones.findIndex((n) => n.id === this.toolTarget);
    return b`
      <g class="draft" style="--zone:${this.zoneColor(s)}">
        <polyline points=${t.map((n) => n.join(",")).join(" ")}></polyline>
        ${this.draft.map(
      (n, i) => b`<circle cx=${n[0]} cy=${n[1]} r=${(i === 0 ? 8 : 5) * e} class=${i === 0 ? "first" : ""}></circle>`
    )}
      </g>`;
  }
  renderScaleDraft(e) {
    if (this.tool !== "scale") return p;
    const t = this.imageMpp(), s = this.scaleDraft.map((n) => [n[0] * t, n[1] * t]);
    return b`<g class="scale-draft">
      ${s.length === 2 ? b`<line x1=${s[0][0]} y1=${s[0][1]} x2=${s[1][0]} y2=${s[1][1]}></line>` : p}
      ${s.map((n) => b`<circle cx=${n[0]} cy=${n[1]} r=${6 * e}></circle>`)}
    </g>`;
  }
  renderMarker(e, t, s) {
    if (!t.position) return p;
    const [n, i] = t.position, a = this.selected?.kind === e && this.selected.id === t.id, r = He[t.kind] ?? "S", l = 11 * s, c = e === "valve" && this.valveOpen(t.id);
    if (e === "valve") {
      const d = 6 * s;
      return b`
        <g class="marker valve ${a ? "selected" : ""} ${c ? "open" : ""}"
          @pointerdown=${(m) => {
        this.tool === "select" && (this.selected = { kind: e, id: t.id }, this.tab = "zones", this.startDrag(m, { type: "marker", kind: e, id: t.id }));
      }}>
          <rect x=${n - l} y=${i - l} width=${2 * l} height=${2 * l} rx=${4 * s}></rect>
          <path class="bowtie" d=${`M${n - d} ${i - d * 0.7} L${n + d} ${i + d * 0.7} L${n + d} ${i - d * 0.7} L${n - d} ${i + d * 0.7} Z`}></path>
          ${c ? b`<line class="handle-bar" x1=${n - d} y1=${i - d * 1.25} x2=${n + d} y2=${i - d * 1.25}></line>` : b`<line class="handle-bar" x1=${n} y1=${i} x2=${n} y2=${i - d * 1.45}></line>`}
          <title>${t.name}: ${c ? "offen" : "zu"}</title>
        </g>`;
    }
    return b`
      <g class="marker ${e} ${a ? "selected" : ""}"
        @pointerdown=${(d) => {
      this.tool === "select" && (this.selected = { kind: e, id: t.id }, this.tab = "zones", this.startDrag(d, { type: "marker", kind: e, id: t.id }));
    }}>
        <circle cx=${n} cy=${i} r=${l}></circle>
        <text x=${n} y=${i} font-size=${12 * s} dy=${4.2 * s}>${r}</text>
        <title>${t.name}</title>
      </g>`;
  }
  valveOpen(e) {
    return this.plan.zones.some((t) => t.valve_id === e && this.status?.zones[t.id]?.state === "running");
  }
  waterFlowing() {
    return Object.values(this.status?.zones ?? {}).some((e) => e.state === "running");
  }
  renderOverlay() {
    const e = this.plan.garden, t = this.toolBanner(), s = rn(this.view.scale), n = e.background === "map" ? this.plan.providers[e.map_provider ?? ""] : void 0;
    return o`
      <div class="tools">
        <button class="icon" title="Vergrößern" @click=${() => this.zoomBy(1.4)}><ha-icon icon="mdi:plus"></ha-icon></button>
        <button class="icon" title="Verkleinern" @click=${() => this.zoomBy(1 / 1.4)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="icon" title="Grundstück zeigen (ohne Grenze: alles)" @click=${this.fitView}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
        <button class="icon ${this.wetOn ? "on" : ""}" title="Wasser-Ansichten: Gießmenge und Bodenfeuchte als Raster"
          @click=${() => this.rasterMenu = !this.rasterMenu}>
          <ha-icon icon="mdi:water-percent"></ha-icon>
        </button>
        <button class="icon ${this.soilOn ? "on" : ""}" title="Bodenansicht: Zonen nach Bodenart"
          @click=${() => this.soilOn = !this.soilOn}>
          <ha-icon icon="mdi:layers-triple-outline"></ha-icon>
        </button>
        <button class="icon ${this.tool === "measure" ? "on" : ""}" title="Abstand messen"
          @click=${() => this.tool === "measure" ? this.cancelTool() : this.startTool("measure")}>
          <ha-icon icon="mdi:tape-measure"></ha-icon>
        </button>
        ${e.background === "map" ? o`<button class="icon ${this.layersOpen ? "on" : ""}" title="Kartenansicht wechseln"
              @click=${() => this.layersOpen = !this.layersOpen}>
              <ha-icon icon="mdi:layers-outline"></ha-icon>
            </button>` : p}
        ${e.background === "map" ? o`<button class="icon ${this.searchOpen ? "on" : ""}" title="Adresse suchen"
              @click=${() => this.searchOpen ? this.closeSearch() : this.openSearch()}>
              <ha-icon icon="mdi:magnify"></ha-icon>
            </button>` : p}
        ${e.background !== "image" ? o`<button class="icon ${this.locating ? "on" : ""}" title="Orten: Karte zu meinem Standort"
              ?disabled=${this.locating} @click=${this.goToMe}>
              <ha-icon icon=${this.locating ? "mdi:crosshairs-question" : "mdi:crosshairs-gps"}></ha-icon>
            </button>` : p}
      </div>
      ${t} ${this.renderSearch()} ${this.renderLayers()} ${this.renderRasterMenu()}
      <div class="compass" style="transform: rotate(${e.background === "image" ? -e.north_deg : 0}deg)" title="Norden">
        <svg viewBox="-12 -12 24 24"><path d="M0 -10 L4 2 L0 0 L-4 2 Z" class="n"></path><path d="M0 10 L4 2 L0 0 L-4 2 Z" class="s"></path></svg>
        <span>N</span>
      </div>
      <div class="scalebar"><div style="width:${s.px}px"></div><span>${s.label}</span></div>
      ${this.wetOn ? this.renderWetLegend() : p}
      ${this.soilOn && !this.wetOn ? this.renderSoilLegend() : p}
      ${e.background === "map" ? o`<div class="attribution">${n?.attribution ?? "Eigener Kartendienst"}</div>` : p}
      ${!this.hasAnyDrawing() && this.tool === "select" ? o`<div class="welcome">
            <ha-icon icon="mdi:draw"></ha-icon>
            <div>
              <strong>Noch nichts gezeichnet.</strong><br />
              Wähle rechts einen Hintergrund und dann bei einer Zone „Zeichnen“.
            </div>
          </div>` : p}
    `;
  }
  hasAnyDrawing() {
    return this.features.length > 0 || this.plan.zones.some((e) => ie(e) !== null);
  }
  toolBanner() {
    if (this.tool === "select") return p;
    let e = "", t = p;
    const s = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    if (this.tool === "sprinkler" && (e = `${s}: Am Sprinkler drücken und bis zum Rand ziehen.`), this.tool === "hose" && (e = `${s}: Den Verlauf des Schlauchs als Linie anklicken, Doppelklick beendet.`, t = o`<label class="inline">Reichweite
          <input type="number" min="0.05" max="20" step="0.05" .value=${String(this.hoseRadius)}
            @input=${(n) => {
      const i = Number(n.target.value);
      i > 0 && (this.hoseRadius = Math.min(20, i));
    }} /> m</label>
        <button class="text" ?disabled=${this.draft.length < 2} @click=${this.finishHose}>Fertig</button>`), this.tool === "bed" && (e = `${s}: Ecken anklicken, zum Schließen den ersten Punkt.`, t = o`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`), this.tool === "place") {
      const n = this.plan.garden.background === "map";
      e = `${s}: Auf die Stelle im Plan klicken${n ? " oder an deinen Standort setzen" : ""}.`, n && (t = o`<button class="text" ?disabled=${this.locating} @click=${this.placeAtMe}><ha-icon icon="mdi:crosshairs-gps"></ha-icon>Mein Standort</button>`);
    }
    if (this.tool === "feature") {
      const n = X[this.featureKind], i = n.family;
      e = i === "area" ? `${n.label}: Ecken anklicken, zum Schließen den ersten Punkt.` : i === "line" ? `${n.label}: Punkte anklicken, Doppelklick beendet.` : this.featureKind === "tree" ? `${n.label}: In die Mitte drücken und bis zum Kronenrand ziehen.` : `${n.label}: Auf die Stelle klicken.`, i !== "point" && (t = o`<button
          class="text"
          ?disabled=${this.draft.length < (i === "area" ? 3 : 2)}
          @click=${this.finishFeature}
        >
          Fertig
        </button>`);
    }
    if (this.tool === "measure") {
      const n = re(this.measurePts);
      e = this.measurePts.length < 2 ? "Messen: Punkte anklicken. Alt-Taste: ohne Einrasten." : `Gemessen: ${Q(n)}${this.measurePts.length > 2 ? " (Summe)" : ""}`, this.measurePts.length && (t = o`<button class="text" @click=${() => this.measurePts = []}>Neu</button>`);
    }
    return this.tool === "scale" && (e = this.scaleDraft.length < 2 ? "Maßstab: Zwei Punkte im Bild anklicken, deren Abstand du kennst (z. B. die Ecken der Terrasse)." : "Abstand eingeben:", this.scaleDraft.length === 2 && (t = o`<input
            class="small"
            type="text"
            inputmode="decimal"
            placeholder="Meter"
            .value=${this.scaleInput}
            @input=${(n) => this.scaleInput = n.target.value}
            @keydown=${(n) => n.key === "Enter" && this.applyScale()}
          /><span>m</span>
          <button class="text" @click=${this.applyScale}>Übernehmen</button>`)), o`<div class="banner">
      <span>${e}</span>${t}
      <button class="text" @click=${this.cancelTool}>Abbrechen</button>
    </div>`;
  }
  zoneOrMarkerName(e) {
    if (e.includes(":")) {
      const [t, s] = e.split(":");
      return this.marker(t, s)?.name ?? "";
    }
    return this.zone(e)?.name ?? "";
  }
  // Seitenleiste ---------------------------------------------------------------
  renderZonesTab() {
    const e = this.plan;
    if (!e.zones.length)
      return o`<p class="hint">
        Noch keine Zonen. Zonen und Ventile legst du unter Einstellungen → Geräte & Dienste →
        Bewässerungsplaner → Konfigurieren an.
      </p>`;
    const t = this.selected;
    return o`
      <ul class="list">
        ${e.zones.map((s, n) => this.renderZoneItem(s, n, t?.kind === "zone" && t.id === s.id))}
      </ul>
      ${e.valves.length || e.sensors.length ? o`<h3>Ventile und Sensoren</h3>
            <ul class="list compact">
              ${e.valves.map((s) => this.renderMarkerItem("valve", s))}
              ${e.sensors.map((s) => this.renderMarkerItem("sensor", s))}
            </ul>` : p}
      <p class="hint small">
        Ziehen verschiebt die Ansicht, das Mausrad zoomt. Gezeichnete Flächen ersetzen die Fläche
        von Hand bei der Berechnung. Namen, Pflanzen und Ventile änderst du in den Einstellungen der
        Integration.
      </p>
    `;
  }
  renderZoneItem(e, t, s) {
    const n = this.status?.zones[e.id], i = ie(e), a = i !== null, r = e.type === "sprinkler";
    return o`
      <li class="item ${s ? "open" : ""}" style="--zone:${this.zoneColor(t)}">
        <div class="row" @click=${() => {
      this.selected = s ? null : { kind: "zone", id: e.id };
    }}>
          <span class="dot"></span>
          <ha-icon icon=${r ? "mdi:sprinkler-variant" : e.type === "hose" ? "mdi:pipe" : "mdi:water-outline"}></ha-icon>
          <span class="name">${e.name}</span>
          ${n && n.state !== "idle" ? o`<span class="badge ${n.state}">${_e[n.state]}</span>` : p}
          <span class="meta">${a ? E(i) : o`<em>nicht gezeichnet</em>`}</span>
        </div>
        ${s ? this.renderInspector(e, n) : p}
      </li>
    `;
  }
  renderInspector(e, t) {
    const s = e.type === "sprinkler", n = ie(e), i = n !== null, a = s ? "sprinkler" : e.type === "hose" ? "hose" : "bed", r = (c, d, m, u, v = 0.1) => o`<label class="field">
        <span>${c}</span>
        <input type="number" step=${v} .value=${d == null ? "" : String(d)}
          @change=${(S) => {
      const h = parseFloat(S.target.value);
      Number.isFinite(h) && (this.remember(), u(h), this.changed());
    }} />
        <span class="unit">${m}</span>
      </label>`;
    return o`
      <div class="inspector">
        <div class="field wide">
          <span>Art</span>
          <div class="levels" role="radiogroup">
            ${[
      ["sprinkler", "Sprinkler", "mdi:sprinkler-variant"],
      ["drip", "Beet / Tropfschlauch", "mdi:water-outline"],
      ["hose", "Gießschlauch", "mdi:pipe"]
    ].map(
      ([c, d, m]) => o`<button role="radio" aria-checked=${e.type === c ? "true" : "false"}
                class=${e.type === c ? "active" : ""} @click=${() => this.setZoneType(e, c)}>
                <ha-icon icon=${m}></ha-icon>${d}</button>`
    )}
          </div>
          <small class="hint">${e.type === "hose" ? "Eine Linie, darum die Reichweite (Radius)." : e.type === "sprinkler" ? "Kreis oder Kreisausschnitt um den Sprinkler." : "Eine Fläche aus Ecken."}</small>
        </div>
        <label class="field wide">
          <span>Ventil</span>
          <select
            @change=${(c) => {
      const d = c.target.value;
      this.remember(), e.valve_id = d || null;
      for (const m of this.plan.valves)
        m.zone_ids = m.zone_ids.filter((u) => u !== e.id), m.id === e.valve_id && m.zone_ids.push(e.id);
      this.changed();
    }}
          >
            <option value="" ?selected=${!e.valve_id}>kein Ventil</option>
            ${this.plan.valves.map(
      (c) => o`<option value=${c.id} ?selected=${e.valve_id === c.id}>
                ${c.name}${c.zone_ids.some((d) => d !== e.id) ? " (auch andere Zonen)" : ""}
              </option>`
    )}
          </select>
        </label>
        ${this.renderValveFlow(e)}
        ${this.renderPlantSoil(e)}
        ${!this.plan.valves.find((c) => c.id === e.valve_id)?.position && e.valve_id ? o`<p class="hint small">Setze das Ventil im Plan (unten „Platzieren“), dann siehst du die Verbindung.</p>` : e.valve_id ? o`<p class="hint small">
                Leitung zum Ventil: die Linie im Plan anfassen und ziehen, dort entsteht ein Knick
                (Doppelklick auf einen Knick löscht ihn). Die Ecken werden rund.
                ${e.valve_route?.length ? o`<button class="text" @click=${() => {
      this.remember(), e.valve_route = [], this.changed();
    }}><ha-icon icon="mdi:vector-line"></ha-icon>Leitung wieder gerade</button>` : p}
              </p>` : p}
        <dl>
          <dt>Fläche gezeichnet</dt>
          <dd>${i ? E(n) : "–"}</dd>
          <dt>Fläche von Hand</dt>
          <dd>${e.area_m2 ? E(e.area_m2) : "–"}</dd>
          ${e.overlap_m2 > 0.05 ? o`<dt>Überschneidung</dt><dd class="warn">${E(e.overlap_m2)} mit anderen Zonen</dd>` : p}
          ${t ? o`<dt>Bedarf</dt><dd>${t.need_mm.toFixed(1)} mm</dd>
                <dt>Geplant</dt><dd>${t.planned_s ? Se(t.planned_s) : "nicht gießen"}
                  <span class="reason">(${t.reason})</span></dd>` : p}
          ${t?.locked_reason ? o`<dt>Gesperrt</dt><dd class="warn">${t.locked_reason}</dd>` : p}
        </dl>
        ${s && i ? o`<div class="fields">
              ${r("Reichweite", e.radius_m, "m", (c) => e.radius_m = Math.max(0.1, c))}
              ${r("Richtung", e.start_angle_deg, "°", (c) => e.start_angle_deg = (c % 360 + 360) % 360, 5)}
              ${r("Bogen", e.arc_deg, "°", (c) => e.arc_deg = Math.min(360, Math.max(1, c)), 5)}
            </div>
            <p class="hint small">Richtung: Anfang des Bogens, 0° = Norden (oben), 90° = Osten.</p>` : p}
        ${e.type === "hose" && i ? o`<div class="fields">
                ${r("Reichweite (Radius)", e.radius_m, "m", (c) => e.radius_m = Math.min(20, Math.max(0.05, c)), 0.05)}
              </div>
              <p class="hint small">Schlauch ${Q(re(e.polygon))} lang. Bewässert wird alles bis
                ${Q(e.radius_m ?? 0)} um die Linie: ${E(ie(e))}.
                Reichweite auch am runden Anfasser im Plan ziehen.</p>
              ${this.renderEdges(e.polygon, !1, (c) => e.polygon = c)}` : p}
        ${e.type === "drip" && i ? this.renderEdges(e.polygon, !0, (c) => e.polygon = c) : p}
        <div class="actions">
          <button class="text" @click=${() => this.startTool(a, e.id)}>
            <ha-icon icon=${i ? "mdi:pencil" : "mdi:draw"}></ha-icon>${i ? "Neu zeichnen" : "Zeichnen"}
          </button>
          ${i ? o`<button class="text danger" @click=${() => this.clearGeometry(e.id)}>
                <ha-icon icon="mdi:eraser"></ha-icon>Entfernen
              </button>` : p}
          <span class="spacer"></span>
          ${t && (t.state === "running" || t.state === "queued") ? o`<button class="text danger" title=${t.state === "running" ? "Gießen abbrechen, das Ventil schließt" : "Aus der Warteschlange nehmen"}
                @click=${() => this.cancelZone(e)}>
                <ha-icon icon="mdi:stop"></ha-icon>${t.state === "running" ? "Gießen abbrechen" : "Herausnehmen"}
              </button>` : o`<button class="text" title="In die Warteschlange einreihen" ?disabled=${this.status?.winter_mode}
                @click=${() => this.waterNow(e)}>
                <ha-icon icon="mdi:watering-can"></ha-icon>Jetzt gießen
              </button>`}
        </div>
      </div>
    `;
  }
  renderMarkerItem(e, t) {
    const s = this.selected?.kind === e && this.selected.id === t.id, n = e === "valve" ? t.safety_level === "device" ? "schließt selbst" : "nur Home Assistant" : nn[t.kind] ?? "";
    return o`
      <li class="item ${s ? "open" : ""}">
        <div class="row" @click=${() => this.selected = { kind: e, id: t.id }}>
          <span class="marker-icon ${e}">${e === "valve" ? "V" : He[t.kind] ?? "S"}</span>
          <span class="name">${t.name}<small>${n}</small></span>
          <button class="text small" @click=${(i) => {
      i.stopPropagation(), this.startTool("place", `${e}:${t.id}`);
    }}>${t.position ? "Versetzen" : "Platzieren"}</button>
          ${t.position ? o`<button class="icon small" title="Vom Plan nehmen" @click=${(i) => {
      i.stopPropagation(), this.remember(), t.position = null, this.changed(), this.removed(`${t.name}: vom Plan genommen`);
    }}><ha-icon icon="mdi:close"></ha-icon></button>` : p}
        </div>
      </li>
    `;
  }
  /** Regler für die Deckkraft des Luftbilds oder Bilds (zum Abpausen). */
  renderOpacity() {
    const e = this.plan.garden;
    if (e.background === "none") return p;
    const t = Math.round((e.background_opacity ?? 1) * 100);
    return o`
      <label class="slider">
        <span>${e.background === "map" ? "Luftbild" : "Bild"} sichtbar</span>
        <input
          id="opacity"
          type="range"
          min="0"
          max="100"
          step="5"
          .value=${String(t)}
          @pointerdown=${() => this.remember()}
          @keydown=${() => this.remember()}
          @input=${(s) => {
      this.plan.garden.background_opacity = Number(s.target.value) / 100, this.changed();
    }}
        />
        <output>${t} %</output>
      </label>
    `;
  }
  /** Kantenlängen ansehen und als Zahl eintippen (genauer als das Luftbild). */
  renderEdges(e, t, s) {
    const n = dt(e, t);
    return o`
      <details class="edges">
        <summary>Seitenlängen (${n.length})</summary>
        <div class="edge-list">
          ${n.map(
      (i, a) => o`<label class="field">
              <span>Seite ${a + 1}</span>
              <input
                type="number"
                step="0.05"
                min="0.05"
                .value=${i.toFixed(2)}
                @change=${(r) => {
        const l = parseFloat(r.target.value.replace(",", "."));
        l > 0 && (this.remember(), s(ht(e, a, l).map((c) => [y(c[0]), y(c[1])])), this.changed());
      }}
              />
              <span class="unit">m</span>
            </label>`
    )}
        </div>
        <p class="hint small">Eine Länge ändern verschiebt den Endpunkt dieser Seite.</p>
      </details>
    `;
  }
  renderPlanTab() {
    const e = this.selected?.kind === "feature" ? this.feature(this.selected.id) : null, t = (s) => {
      const n = X[s], i = this.tool === "feature" && this.featureKind === s;
      return o`<button
        class="tool ${i ? "active" : ""}"
        title=${n.label}
        @click=${() => i ? this.cancelTool() : this.startTool("feature", s)}
      >
        <ha-icon icon=${n.icon}></ha-icon><span>${n.label}</span>
      </button>`;
    };
    return o`
      <p class="hint small">
        Pause Haus, Wege, Zäune und Bäume vom Luftbild ab. Dann kannst du das Luftbild abblenden und
        bleibst in jeder Zoomstufe scharf. Der Grundriss dient nur zur Orientierung.
      </p>
      ${this.renderOpacity()}
      <h3>Flächen</h3>
      <div class="palette">${["building", "paving", "water", "area", "soil"].map(t)}</div>
      <h3>Linien</h3>
      <div class="palette">${["fence", "hedge", "boundary", "pipe"].map(t)}</div>
      <p class="hint small">Zuleitung vom Wasserhahn zu den Ventilen: am Hahn beginnen, Punkte setzen, am Ventil enden.
        Eine neue Zuleitung, die auf einer bestehenden beginnt, wird ein Abzweig (Punkt im Plan).</p>
      <h3>Punkte</h3>
      <div class="palette">${["tree", "tap", "label"].map(t)}</div>
      <label class="check">
        <input type="checkbox" .checked=${this.snapOn} @change=${(s) => this.snapOn = s.target.checked} />
        An Ecken einrasten <small>(Alt-Taste: kurz aus)</small>
      </label>
      ${this.features.length ? o`<div class="list-head">
              <h3>Im Plan (${this.features.length})</h3>
              <span class="spacer"></span>
              ${this.features.some((s) => !s.locked) ? o`<button class="text" @click=${() => this.setLocked(this.features, !0)}>
                    <ha-icon icon="mdi:lock"></ha-icon>Alle sperren</button>` : o`<button class="text" @click=${() => this.setLocked(this.features, !1)}>
                    <ha-icon icon="mdi:lock-open-variant-outline"></ha-icon>Alle entsperren</button>`}
            </div>
            <p class="hint small">Gesperrte Formen lassen sich im Plan nicht anfassen oder verschieben; Klicks gehen zum Plan darunter.
              Bearbeiten: hier in der Liste auswählen und entsperren.</p>
            <ul class="list compact">
              ${this.features.map((s) => this.renderFeatureItem(s, e?.id === s.id))}
            </ul>` : p}
    `;
  }
  renderFeatureItem(e, t) {
    const s = X[e.kind], n = s?.family ?? "area", i = n === "area" ? E(ee(e.points)) : n === "line" ? e.kind === "boundary" && e.points.length >= 3 ? `${E(ee(e.points))} · ${Q(re(e.points, !0))} Umfang` : Q(re(e.points)) : e.kind === "tree" ? `Ø ${Q(2 * (e.radius_m ?? 0))}` : "", a = Object.entries(X).filter(([, r]) => r.family === n);
    return o`
      <li class="item ${t ? "open" : ""}">
        <div class="row" @click=${() => this.selected = t ? null : { kind: "feature", id: e.id }}>
          <ha-icon icon=${s?.icon ?? "mdi:shape-outline"}></ha-icon>
          <span class="name">${Y(e)}</span>
          <span class="meta">${i}</span>
          <button class="icon small lock ${e.locked ? "on" : ""}"
            title=${e.locked ? "Gesperrt: im Plan nicht verschiebbar. Klicken zum Entsperren" : "Sperren: im Plan nicht mehr verschiebbar"}
            @click=${(r) => {
      r.stopPropagation(), this.setLocked([e], !e.locked);
    }}>
            <ha-icon icon=${e.locked ? "mdi:lock" : "mdi:lock-open-variant-outline"}></ha-icon>
          </button>
        </div>
        ${t ? o`<div class="inspector">
              ${e.kind !== "label" && a.length > 1 ? o`<label class="field wide">
                    <span>Art</span>
                    <select
                      .value=${e.kind}
                      @change=${(r) => {
      this.remember(), e.kind = r.target.value, e.kind === "soil" && !e.soil_type && (e.soil_type = "loam"), this.changed();
    }}
                    >
                      ${a.map(([r, l]) => o`<option value=${r} ?selected=${r === e.kind}>${l.label}</option>`)}
                    </select>
                  </label>` : p}
              <label class="field wide">
                <span>${e.kind === "label" ? "Text" : "Name (optional)"}</span>
                <input
                  id=${e.kind === "label" ? "feature-label" : "feature-name"}
                  type="text"
                  maxlength=${ft}
                  .value=${e.label ?? ""}
                  @change=${(r) => {
      const l = r.target.value.trim();
      e.kind === "label" && !l || (this.remember(), e.label = l || null, this.changed());
    }}
                />
              </label>
              ${e.kind === "soil" ? o`<label class="field wide">
                    <span>Bodenart</span>
                    <select
                      @change=${(r) => {
      this.remember(), e.soil_type = r.target.value, this.changed();
    }}
                    >
                      ${Object.entries(this.plan.catalog.soils).map(
      ([r, l]) => o`<option value=${r} ?selected=${r === e.soil_type}>${l.name}</option>`
    )}
                    </select>
                  </label>
                  <p class="hint small">Zonen in dieser Fläche können den Boden mit einem Klick übernehmen.</p>` : p}
              ${e.kind === "tree" ? o`<label class="field wide">
                    <span>Kronendurchmesser</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      .value=${(2 * (e.radius_m ?? 0)).toFixed(1)}
                      @change=${(r) => {
      const l = parseFloat(r.target.value);
      l > 0 && (this.remember(), e.radius_m = y(l / 2), this.changed());
    }}
                    />
                    <span class="unit">m</span>
                  </label>
                  <label class="field wide">
                    <span>Stammdurchmesser (0 = unbekannt)</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      .value=${(e.trunk_m ?? 0).toFixed(2)}
                      @change=${(r) => {
      const l = parseFloat(r.target.value);
      l >= 0 && (this.remember(), e.trunk_m = l > 0 ? Math.min(y(l), 2 * (e.radius_m ?? 0)) : null, this.changed());
    }}
                    />
                    <span class="unit">m</span>
                  </label>
                  <p class="hint small">Ein dicker Stamm hält den Strahl eines Sprinklers auf. Die Nässekarte zeigt dahinter einen Wasserschatten.</p>` : p}
              ${n !== "point" ? this.renderEdges(e.points, n === "area", (r) => e.points = r) : p}
              <div class="actions">
                <span class="spacer"></span>
                <button class="text danger" @click=${() => this.deleteFeature(e.id)}>
                  <ha-icon icon="mdi:delete-outline"></ha-icon>Entfernen
                </button>
              </div>
            </div>` : p}
      </li>
    `;
  }
  renderBackgroundTab() {
    const e = this.plan.garden, t = this.plan.providers, s = (n, i, a, r) => o`
      <button class="choice ${e.background === n ? "active" : ""}" @click=${() => this.setBackground(n)}>
        <ha-icon icon=${i}></ha-icon>
        <span><strong>${a}</strong><small>${r}</small></span>
      </button>`;
    return o`
      <div class="choices">
        ${s("map", "mdi:satellite-variant", "Luftbild", "Kartendienst, live im Browser geladen")}
        ${s("image", "mdi:image-outline", "Eigenes Bild", "Foto, Skizze oder Screenshot")}
        ${s("none", "mdi:grid", "Raster", "Leeres Raster in Metern")}
      </div>
      ${this.renderOpacity()}
      ${e.background === "map" ? this.renderMapSettings(e, t) : p}
      ${e.background === "image" ? this.renderImageSettings(e) : p}
    `;
  }
  renderMapSettings(e, t) {
    return o`
      <h3>Kartendienst</h3>
      <select
        .value=${e.map_provider ?? "basemap_at"}
        @change=${(s) => this.updateGarden({ map_provider: s.target.value })}
      >
        ${Object.entries(t).map(
      ([s, n]) => o`<option value=${s} ?selected=${e.map_provider === s}>${n.name}</option>`
    )}
        <option value="custom" ?selected=${e.map_provider === "custom"}>Eigene Adresse …</option>
      </select>
      ${e.map_provider === "esri" ? o`<p class="note warn">
            Esri erlaubt die Nutzung nur nach seinen Nutzungsbedingungen. Für den privaten Garten ist das
            meist in Ordnung; prüfe es bitte selbst.
          </p>` : p}
      ${e.map_provider?.startsWith("basemap_at") ? o`<p class="note">Von basemap.at, nur in Österreich. Lizenz CC BY 4.0.</p>` : p}
      ${e.map_provider === "osm" ? o`<p class="note">
            OpenStreetMap-Karte, weltweit. Bitte nur gelegentlich nutzen (Regeln der OpenStreetMap-Kacheln).
          </p>` : p}
      <p class="hint small">Schneller umschalten: Ebenen-Knopf links auf der Karte.</p>
      ${e.map_provider === "custom" ? o`<label class="field wide">
              <span>Adresse mit {z}, {x}, {y}</span>
              <input type="url" placeholder="https://…/{z}/{x}/{y}.jpg" .value=${e.map_url ?? ""}
                @change=${(s) => this.updateGarden({ map_url: s.target.value.trim() })} />
            </label>` : p}
      <h3>Ausschnitt</h3>
      <p class="hint small">
        Such deine Adresse oder verschiebe die Karte, bis dein Garten in der Mitte liegt, und lege dort
        die Kartenmitte fest. Deine Zeichnung wandert mit. Gespeichert werden nur Mitte und Zoom, keine
        Bilder.
      </p>
      <div class="actions">
        <button class="text" @click=${this.openSearch}><ha-icon icon="mdi:magnify"></ha-icon>Adresse suchen</button>
        <button class="text" @click=${this.recenterMap}><ha-icon icon="mdi:crosshairs-gps"></ha-icon>Mitte hier festlegen</button>
        <button class="text" @click=${this.moveToHome}><ha-icon icon="mdi:home-map-marker"></ha-icon>Zum Zuhause</button>
      </div>
      <p class="hint small">„Zum Zuhause“ nimmt den Standort aus den Einstellungen von Home Assistant.</p>
    `;
  }
  renderImageSettings(e) {
    const t = !!(e.scale_points && e.scale_distance_m);
    return o`
      <h3>Bild</h3>
      <label class="upload">
        <input type="file" accept="image/png,image/jpeg,image/webp" @change=${this.upload} />
        <ha-icon icon="mdi:upload"></ha-icon>${e.background_image ? "Anderes Bild hochladen" : "Bild hochladen"}
      </label>
      <p class="hint small">PNG, JPEG oder WebP, höchstens 15 MB.</p>
      ${e.background_image ? o`
            <h3>Maßstab</h3>
            <p class=${t ? "note" : "note warn"}>
              ${t ? o`Gesetzt: ${e.scale_distance_m} m zwischen zwei Punkten (${(this.imageMpp() * 100).toFixed(1)} cm je Bildpunkt).` : "Noch kein Maßstab. Ohne ihn stimmen die Flächen nicht, und der Plan lässt sich nicht speichern."}
            </p>
            <button class="text" @click=${() => this.startTool("scale")}>
              <ha-icon icon="mdi:ruler"></ha-icon>${t ? "Maßstab neu setzen" : "Maßstab setzen"}
            </button>
            <h3>Norden</h3>
            <label class="field">
              <span>Norden im Bild</span>
              <input type="number" step="5" .value=${String(e.north_deg)}
                @change=${(s) => this.updateGarden({ north_deg: parseFloat(s.target.value) || 0 })} />
              <span class="unit">°</span>
            </label>
            <p class="hint small">0° = Norden ist oben im Bild. Nur für die Kompassanzeige.</p>
          ` : p}
    `;
  }
};
w.styles = be;
k([
  H({ type: Boolean, reflect: !0 })
], w.prototype, "narrow", 2);
k([
  f()
], w.prototype, "plan", 2);
k([
  f()
], w.prototype, "status", 2);
k([
  f()
], w.prototype, "error", 2);
k([
  f()
], w.prototype, "toast", 2);
k([
  f()
], w.prototype, "tab", 2);
k([
  f()
], w.prototype, "featureKind", 2);
k([
  f()
], w.prototype, "measurePts", 2);
k([
  f()
], w.prototype, "snapOn", 2);
k([
  f()
], w.prototype, "snapHint", 2);
k([
  f()
], w.prototype, "tool", 2);
k([
  f()
], w.prototype, "toolTarget", 2);
k([
  f()
], w.prototype, "selected", 2);
k([
  f()
], w.prototype, "draft", 2);
k([
  f()
], w.prototype, "scaleDraft", 2);
k([
  f()
], w.prototype, "scaleInput", 2);
k([
  f()
], w.prototype, "view", 2);
k([
  f()
], w.prototype, "size", 2);
k([
  f()
], w.prototype, "imageUrl", 2);
k([
  f()
], w.prototype, "imageSize", 2);
k([
  f()
], w.prototype, "saving", 2);
k([
  f()
], w.prototype, "dirty", 2);
k([
  f()
], w.prototype, "searchOpen", 2);
k([
  f()
], w.prototype, "searchQuery", 2);
k([
  f()
], w.prototype, "searchResults", 2);
k([
  f()
], w.prototype, "searching", 2);
k([
  f()
], w.prototype, "searchError", 2);
k([
  f()
], w.prototype, "searchPin", 2);
k([
  f()
], w.prototype, "locating", 2);
k([
  f()
], w.prototype, "hoseRadius", 2);
k([
  f()
], w.prototype, "toastUndo", 2);
k([
  f()
], w.prototype, "layersOpen", 2);
k([
  f()
], w.prototype, "page", 2);
k([
  f()
], w.prototype, "raster", 2);
k([
  f()
], w.prototype, "rasterMenu", 2);
k([
  f()
], w.prototype, "soilOn", 2);
k([
  f()
], w.prototype, "menuOpen", 2);
k([
  f()
], w.prototype, "pendingImport", 2);
k([
  f()
], w.prototype, "hover", 2);
w = k([
  pe("irrigation-planner-panel")
], w);
function y(e) {
  return Math.round(e * 100) / 100;
}
function Ke(e) {
  return Math.round(e / 5) * 5 % 360;
}
function ie(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? Je(e.radius_m, e.arc_deg) : null : e.type === "hose" ? e.polygon.length >= 2 && e.radius_m ? Ye(e.polygon, e.radius_m) : null : e.polygon.length >= 3 ? ee(e.polygon) : null;
}
function Q(e) {
  return e < 1 ? `${Math.round(e * 100)} cm` : `${e.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m`;
}
function E(e) {
  return e == null ? "–" : `${e.toLocaleString("de-DE", { maximumFractionDigits: e < 10 ? 1 : 0 })} m²`;
}
function Se(e) {
  if (e < 60) return `${e} s`;
  const t = Math.round(e / 60);
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
function at(e) {
  const t = 10 ** Math.floor(Math.log10(e));
  for (const s of [1, 2, 5, 10]) if (s * t >= e) return s * t;
  return 10 * t;
}
function rn(e) {
  const t = at(110 / e), s = t >= 1e3 ? `${t / 1e3} km` : t >= 1 ? `${t} m` : `${t * 100} cm`;
  return { px: t * e, label: s };
}
function on(e) {
  return { very_low: 0.45, low: 0.7, medium: 0.95, high: 1.08 }[e] ?? 9;
}
export {
  w as IrrigationPlannerPanel
};
