import { i as f, n as m, r as p, a as b, D as h, f as d, b as i, A as u, p as g, t as w } from "./operation-data-BCE0dVwo.js";
var x = Object.defineProperty, v = Object.getOwnPropertyDescriptor, c = (e, t, n, r) => {
  for (var a = r > 1 ? void 0 : r ? v(t, n) : t, s = e.length - 1, l; s >= 0; s--)
    (l = e[s]) && (a = (r ? l(t, n, a) : l(a)) || a);
  return r && a && x(t, n, a), a;
};
function y(e, t) {
  if (!t?.length) return e;
  const n = new Set(t.map((r) => r.toLowerCase()));
  return e.filter((r) => n.has(r.id.toLowerCase()) || n.has(r.name.toLowerCase()));
}
function $(e, t, n, r) {
  return t?.state === "running" ? `gießt, noch ${d(g(t, n).left)}` : t?.active ? t.state === "pause" ? "Pause" : "öffnet/schließt" : t ? `wartet, ${d(t.duration_s)}` : e.locked ? `gesperrt: ${e.locked}` : e.enabled ? e.next ? `${r(e.next.at)}, ${e.planned_s ? d(e.planned_s) : "kein Bedarf"}` : e.planned_s ? `nicht geplant, ${d(e.planned_s)}` : "nicht geplant" : "aus";
}
let o = class extends b {
  constructor() {
    super(...arguments), this.config = { type: "custom:irrigation-planner-card" }, this.error = "", this.now = Date.now(), this.busy = !1;
  }
  static getStubConfig() {
    return { title: "Bewässerung" };
  }
  setConfig(e) {
    this.config = { show_zones: !0, ...e };
  }
  getCardSize() {
    return 2 + (this.config.show_zones === !1 ? 0 : this.data?.zones.length ?? 4);
  }
  connectedCallback() {
    super.connectedCallback(), this.timer = window.setInterval(() => {
      this.data?.queue.some((e) => e.ends_at) && (this.now = Date.now());
    }, 1e3), this.subscribe();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.clearInterval(this.timer), this.unsub?.(), this.unsub = void 0;
  }
  updated(e) {
    e.has("hass") && !this.unsub && this.subscribe();
  }
  async subscribe() {
    if (!(!this.hass || this.unsub || this.busy)) {
      this.busy = !0;
      try {
        this.unsub = await this.hass.connection.subscribeMessage(
          (e) => {
            this.data = e, this.now = Date.now(), this.error = "";
          },
          { type: `${h}/operation/subscribe` }
        );
      } catch (e) {
        this.error = this.message(e);
      } finally {
        this.busy = !1;
      }
    }
  }
  message(e) {
    return e && typeof e == "object" && "message" in e ? String(e.message) : String(e);
  }
  notify(e) {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message: e }, bubbles: !0, composed: !0 }));
  }
  async call(e, t, n) {
    try {
      await this.hass.callWS({ ...t, type: `${h}/${e}` }), this.notify(n);
    } catch (r) {
      this.notify(this.message(r));
    }
  }
  async waterNow(e) {
    if (!e.planned_s) {
      this.notify(`${e.name}: keine Gießdauer (kein Bedarf und keine Dauer von Hand)`);
      return;
    }
    try {
      await this.hass.callService(h, "run_zone", { zone_id: e.id, duration: e.planned_s }), this.notify(`${e.name}: ${d(e.planned_s)} eingereiht`);
    } catch (t) {
      this.notify(this.message(t));
    }
  }
  when(e) {
    const t = this.hass?.config?.time_zone, n = new Date(e), r = (l) => new Date(this.now + l * 864e5).toLocaleDateString("de-DE", { timeZone: t }), a = n.toLocaleDateString("de-DE", { timeZone: t }), s = n.toLocaleTimeString("de-DE", { timeZone: t, hour: "2-digit", minute: "2-digit" });
    return a === r(0) ? `heute ${s}` : a === r(1) ? `morgen ${s}` : `${n.toLocaleDateString("de-DE", { timeZone: t, weekday: "short" })} ${s}`;
  }
  openPanel() {
    history.pushState(null, "", "/bewaesserung"), window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: !1 } }));
  }
  render() {
    const e = this.config.title ?? "Bewässerung";
    if (this.error)
      return i`<ha-card .header=${e}><div class="content warn">${this.error}</div></ha-card>`;
    const t = this.data;
    if (!t) return i`<ha-card .header=${e}><div class="content muted">Lädt …</div></ha-card>`;
    const n = t.queue.filter((a) => a.active), r = t.queue.filter((a) => !a.active);
    return i`<ha-card>
      <div class="head">
        <img src="/irrigation_planner_static/logo.png" alt="" width="28" height="28" />
        <span class="title">${e}</span>
        <span class="spacer"></span>
        ${t.winter_mode ? i`<span class="chip">❄ Winterpause</span>` : i`<button class="chip ${t.automatic ? "on" : ""}" title="Automatik umschalten (nur Admin)"
              @click=${() => this.call("settings/automatic", { on: !t.automatic }, t.automatic ? "Automatik aus" : "Automatik an")}>
              ${t.automatic ? "Automatik an" : "Automatik aus"}
            </button>`}
        ${t.water_saving_pct ? i`<span class="chip">Sparen −${t.water_saving_pct} %</span>` : u}
      </div>
      ${t.problems.length ? i`<div class="problems">⚠ ${t.problems.join(" · ")}</div>` : u}
      ${n.length ? i`<div class="now">
            ${n.map((a) => {
      const { left: s, done: l } = g(a, this.now);
      return i`<div class="run">
                <div class="what">
                  <strong>${a.zone_name}</strong>
                  <small>${a.state === "running" ? `noch ${d(s)} von ${d(a.duration_s)}` : a.state}</small>
                  <div class="bar"><div style="width:${l * 100}%"></div></div>
                </div>
                <button class="text" @click=${() => this.call("queue/cancel", { zone_id: a.zone_id }, `${a.zone_name} übersprungen`)}>
                  Überspringen
                </button>
              </div>`;
    })}
            ${r.length ? i`<small class="muted">Danach: ${r.map((a) => a.zone_name).join(", ")}</small>` : u}
            <button class="text danger" @click=${() => this.call("queue/cancel", { all: !0 }, "Alles gestoppt")}>Alles stoppen</button>
          </div>` : i`<div class="idle muted">Gerade läuft nichts.</div>`}
      ${this.config.show_zones === !1 ? u : this.renderZones(t)}
      <div class="foot">
        <button class="text" @click=${this.openPanel}>Plan und Betrieb öffnen</button>
      </div>
    </ha-card>`;
  }
  renderZones(e) {
    const t = y(e.zones, this.config.zones);
    return i`<ul class="zones">
      ${t.map((n) => {
      const r = e.queue.find((s) => s.zone_id === n.id), a = n.capacity_mm > 0 ? Math.max(0, 1 - n.need_mm / n.capacity_mm) : null;
      return i`<li class=${r?.state === "running" ? "running" : ""}>
          <span class="dot" title=${a === null ? "" : `Wasserkonto ${Math.round(a * 100)} % voll`}
            style=${a === null ? "" : `--fill:${Math.round(a * 100)}%`}></span>
          <div class="what">
            <span>${n.name}</span>
            <small>${$(n, r, this.now, (s) => this.when(s))}</small>
          </div>
          ${r ? i`<button class="text danger" @click=${() => this.call("queue/cancel", { zone_id: n.id }, `${n.name} abgebrochen`)}>
                ${r.active ? "Abbrechen" : "Herausnehmen"}
              </button>` : i`<button class="text" ?disabled=${!n.enabled || e.winter_mode || !!n.locked} @click=${() => this.waterNow(n)}>
                Gießen
              </button>`}
        </li>`;
    })}
    </ul>`;
  }
};
o.styles = f`
    ha-card {
      overflow: hidden;
    }
    .content {
      padding: 16px;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 8px;
    }
    .head img {
      flex: none;
    }
    .title {
      font-size: 18px;
      font-weight: 500;
    }
    .spacer {
      flex: 1;
    }
    .chip {
      font: inherit;
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 999px;
      border: 1px solid var(--divider-color, #ddd);
      background: transparent;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    button.chip {
      cursor: pointer;
    }
    .chip.on {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    .problems {
      margin: 0 16px 8px;
      padding: 6px 10px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--error-color, #db4437) 12%, transparent);
      color: var(--error-color, #db4437);
      font-size: 13px;
    }
    .now {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 0 16px 8px;
      padding: 10px 12px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
    .run {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .what {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    small,
    .muted {
      color: var(--secondary-text-color);
      font-size: 12.5px;
    }
    .idle {
      padding: 0 16px 8px;
    }
    .bar {
      height: 5px;
      border-radius: 3px;
      margin-top: 4px;
      background: color-mix(in srgb, var(--primary-color) 18%, transparent);
      overflow: hidden;
    }
    .bar > div {
      height: 100%;
      background: var(--primary-color);
      transition: width 0.9s linear;
    }
    .zones {
      list-style: none;
      margin: 0;
      padding: 0 8px 0 16px;
    }
    .zones li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
      border-top: 1px solid var(--divider-color, #eee);
    }
    .zones li.running span {
      color: var(--primary-color);
      font-weight: 500;
    }
    .dot {
      flex: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1.5px solid var(--primary-color);
      background: linear-gradient(to top, var(--primary-color) var(--fill, 0%), transparent var(--fill, 0%));
    }
    button.text {
      font: inherit;
      font-size: 13.5px;
      font-weight: 500;
      color: var(--primary-color);
      background: none;
      border: none;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      white-space: nowrap;
    }
    button.text:hover:not(:disabled) {
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
    button.text:disabled {
      opacity: 0.4;
      cursor: default;
    }
    button.danger {
      color: var(--error-color, #db4437);
      align-self: flex-end;
    }
    .foot {
      display: flex;
      justify-content: flex-end;
      padding: 4px 8px 8px;
    }
  `;
c([
  m({ attribute: !1 })
], o.prototype, "hass", 2);
c([
  p()
], o.prototype, "config", 2);
c([
  p()
], o.prototype, "data", 2);
c([
  p()
], o.prototype, "error", 2);
c([
  p()
], o.prototype, "now", 2);
c([
  p()
], o.prototype, "busy", 2);
o = c([
  w("irrigation-planner-card")
], o);
typeof window < "u" && (window.customCards = window.customCards ?? []);
typeof window < "u" && !window.customCards.some((e) => e.type === "irrigation-planner-card") && window.customCards.push({
  type: "irrigation-planner-card",
  name: "Bewässerung",
  description: "Was gerade gießt, was als Nächstes kommt, Jetzt gießen und Abbrechen (FlowerPower).",
  preview: !1
});
export {
  o as IrrigationPlannerCard,
  y as cardZones,
  $ as zoneLine
};
