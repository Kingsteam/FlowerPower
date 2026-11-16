// Seite „Betrieb“: Was läuft gerade, was kommt als Nächstes, wie war es?
//
// - Jetzt: laufende und wartende Zonen mit Restzeit. „Überspringen“ schließt
//   die laufende Zone, danach geht es mit der nächsten weiter; „Herausnehmen“
//   nimmt eine wartende Zone aus der Schlange; „Programm abbrechen“ und
//   „Alles stoppen“. Abbrechen schließt nur, es öffnet nie ein Ventil.
// - Zonen: zuletzt gegossen (Dauer, Liter, mm), Bedarf jetzt, nächster Start.
// - Wetter und Wasserhaushalt der letzten 14 Tage (Verdunstung und Regen).
// - Verlauf: jeder Lauf, abgebrochene Läufe, Programme und Alarme.

import { LitElement, html, nothing, svg, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styles } from "./styles";
import type { Hass } from "./types";

const DOMAIN = "irrigation_planner";
// Farben der Wetter-Grafik (geprüft auf Farbfehlsichtigkeit)
export const ET0_COLOR = "#eb6834";
export const RAIN_COLOR = "#2a78d6";

export interface QueueItem {
  zone_id: string;
  zone_name: string;
  supply: string;
  state: string;
  active: boolean;
  position: number;
  source: string;
  source_text: string;
  program_id: string | null;
  duration_s: number;
  pause_after_s: number;
  started_at: string | null;
  ends_at: string | null;
}

export interface HistoryEntry {
  at: string;
  end?: string;
  kind: "run" | "cancelled" | "program_started" | "program_skipped" | "alarm";
  zone_id?: string;
  zone_name?: string;
  source?: string;
  source_text?: string;
  planned_s?: number;
  seconds?: number;
  state?: string;
  error?: string | null;
  liters?: number | null;
  measured?: boolean;
  mm?: number | null;
  program_name?: string;
  reason?: string | null;
  severity?: string;
  message?: string;
}

export interface ZoneOperation {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  duration_mode: string;
  area_m2: number | null;
  need_mm: number;
  capacity_mm: number;
  measured: boolean;
  planned_s: number;
  planned_liters: number | null;
  reason: string;
  locked: string | null;
  last: HistoryEntry | null;
  next: { at: string; program: string } | null;
}

export interface DayInfo {
  day: string;
  et0_mm: number | null;
  rain_mm: number | null;
  liters: number;
  zones_mm: Record<string, number>;
}

export interface OperationData {
  queue: QueueItem[];
  zones: ZoneOperation[];
  days: DayInfo[];
  weather_today: { t_min: number | null; t_max: number | null; rh_mean: number | null; wind_ms: number | null; rain_mm: number | null } | null;
  weather_entity: string | null;
  automatic: boolean;
  winter_mode: boolean;
  problems: string[];
  water_saving_pct: number;
  history_count: number;
  history_last: string | null;
  programs: { id: string; name: string; next: string | null }[];
}

export function fmtDuration(seconds: number): string {
  seconds = Math.max(0, Math.round(seconds));
  if (seconds < 60) return `${seconds} s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min >= 60) return `${Math.floor(min / 60)} h ${min % 60} min`;
  return sec && min < 10 ? `${min}:${String(sec).padStart(2, "0")} min` : `${Math.round(seconds / 60)} min`;
}

export function fmtNumber(value: number | null | undefined, digits = 1): string {
  if (value == null) return "–";
  return value.toLocaleString("de-DE", { maximumFractionDigits: digits });
}

/** Restzeit und Fortschritt (0–1) eines laufenden Eintrags. */
export function progress(item: QueueItem, now: number): { left: number; done: number } {
  if (!item.started_at || !item.ends_at) return { left: item.duration_s, done: 0 };
  const start = Date.parse(item.started_at);
  const end = Date.parse(item.ends_at);
  const left = Math.max(0, (end - now) / 1000);
  const done = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 0;
  return { left, done };
}

const STATE_TEXT: Record<string, string> = {
  queued: "wartet",
  opening: "öffnet",
  running: "gießt",
  closing: "schließt",
  pause: "Pause",
  done: "fertig",
  skipped: "abgebrochen",
  failed: "Fehler",
  cancelled: "nicht gestartet",
};

/** Ein Verlaufseintrag als Text (Titel, Zeile darunter, Art für die Farbe). */
export function describeEntry(e: HistoryEntry): { title: string; detail: string; tone: string; icon: string } {
  if (e.kind === "run") {
    const parts = [`${fmtDuration(e.seconds ?? 0)} von ${fmtDuration(e.planned_s ?? 0)}`];
    if (e.liters != null) parts.push(`${fmtNumber(e.liters)} L${e.measured ? " (gemessen)" : " (geschätzt)"}`);
    if (e.mm != null) parts.push(`${fmtNumber(e.mm)} mm`);
    if (e.source_text) parts.push(e.source_text);
    const tone = e.state === "done" ? "ok" : e.state === "failed" ? "bad" : "warn";
    const title = `${e.zone_name}: ${STATE_TEXT[e.state ?? ""] ?? e.state}${e.error ? ` (${e.error})` : ""}`;
    return { title, detail: parts.join(" · "), tone, icon: "mdi:water" };
  }
  if (e.kind === "cancelled") {
    return {
      title: `${e.zone_name}: aus der Warteschlange genommen`,
      detail: [e.source_text, `${fmtDuration(e.planned_s ?? 0)} geplant`].filter(Boolean).join(" · "),
      tone: "muted",
      icon: "mdi:playlist-remove",
    };
  }
  if (e.kind === "program_started") {
    const how = e.source === "schedule" ? "nach Zeitplan" : "von Hand";
    return {
      title: `Programm ${e.program_name} gestartet`,
      detail: [how, e.planned_s ? `${fmtDuration(e.planned_s)} gesamt` : ""].filter(Boolean).join(" · "),
      tone: "ok",
      icon: "mdi:play-circle-outline",
    };
  }
  if (e.kind === "program_skipped") {
    return { title: `Programm ${e.program_name} übersprungen`, detail: e.reason ?? "", tone: "warn", icon: "mdi:skip-next-circle-outline" };
  }
  return {
    title: e.severity === "alarm" ? "Alarm" : "Warnung",
    detail: e.message ?? "",
    tone: "bad",
    icon: "mdi:alert-outline",
  };
}

@customElement("ip-operation")
export class OperationView extends LitElement {
  static styles = styles;

  @property({ attribute: false }) hass?: Hass;

  @state() private data?: OperationData;
  @state() private history: HistoryEntry[] = [];
  @state() private historyZone = "";
  @state() private error = "";
  @state() private now = Date.now();
  @state() private busy = "";
  @state() private showTable = false;
  private unsub?: () => void;
  private timer?: number;
  private historyKey = "";

  private get tz(): string | undefined {
    return this.hass?.config?.time_zone;
  }

  connectedCallback(): void {
    super.connectedCallback();
    void this.subscribe();
    this.timer = window.setInterval(() => {
      if (this.data?.queue.some((q) => q.ends_at)) this.now = Date.now();
    }, 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsub?.();
    this.unsub = undefined;
    window.clearInterval(this.timer);
  }

  private async subscribe(): Promise<void> {
    if (!this.hass || this.unsub) return;
    try {
      this.unsub = await this.hass.connection.subscribeMessage<OperationData>(
        (data) => {
          this.data = data;
          this.now = Date.now();
          const key = `${data.history_count}|${data.history_last}`;
          if (key !== this.historyKey) {
            this.historyKey = key;
            void this.loadHistory();
          }
        },
        { type: `${DOMAIN}/operation/subscribe` },
      );
    } catch (err) {
      this.error = this.message(err);
    }
  }

  private async loadHistory(): Promise<void> {
    try {
      const res = await this.hass!.callWS<{ entries: HistoryEntry[] }>({
        type: `${DOMAIN}/history/get`,
        limit: 150,
        ...(this.historyZone ? { zone_id: this.historyZone } : {}),
      });
      this.history = res.entries;
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  private toast(text: string, isError = false): void {
    this.dispatchEvent(new CustomEvent("ip-toast", { detail: { text, isError }, bubbles: true, composed: true }));
  }

  private message(err: unknown): string {
    return err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
  }

  private async cancel(what: Record<string, unknown>, done: string): Promise<void> {
    this.busy = JSON.stringify(what);
    try {
      await this.hass!.callWS({ type: `${DOMAIN}/queue/cancel`, ...what });
      this.toast(done);
    } catch (err) {
      this.toast(this.message(err), true);
    } finally {
      this.busy = "";
    }
  }

  private async waterNow(zone: ZoneOperation): Promise<void> {
    if (!zone.planned_s) {
      this.toast(`${zone.name}: keine Gießdauer (kein Bedarf und keine Dauer von Hand)`, true);
      return;
    }
    try {
      await this.hass!.callService(DOMAIN, "run_zone", { zone_id: zone.id, duration: zone.planned_s });
      this.toast(`${zone.name}: ${fmtDuration(zone.planned_s)} eingereiht`);
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  /** „Jetzt gießen“ oder, wenn die Zone gießt bzw. wartet, „Abbrechen“. */
  private renderWaterButton(z: ZoneOperation, d: OperationData): TemplateResult {
    const item = d.queue.find((q) => q.zone_id === z.id);
    if (item) {
      return html`<button class="text danger" ?disabled=${!!this.busy}
        title=${item.active ? "Gießen abbrechen, das Ventil schließt" : "Aus der Warteschlange nehmen"}
        @click=${() => this.cancel({ zone_id: z.id }, item.active ? `${z.name}: abgebrochen` : `${z.name}: herausgenommen`)}>
        <ha-icon icon="mdi:stop"></ha-icon>${item.active ? "Abbrechen" : "Herausnehmen"}
      </button>`;
    }
    return html`<button class="text" ?disabled=${!z.enabled || d.winter_mode || !!z.locked} title="In die Warteschlange einreihen"
      @click=${() => this.waterNow(z)}>
      <ha-icon icon="mdi:watering-can"></ha-icon>Jetzt gießen
    </button>`;
  }

  private async resetBalance(z?: ZoneOperation): Promise<void> {
    const what = z ? `das Wasserkonto von „${z.name}“` : "die Wasserkonten aller Zonen";
    if (!confirm(`${what[0].toUpperCase()}${what.slice(1)} auf „voll“ setzen? Der berechnete Bedarf ist danach 0.`)) return;
    try {
      await this.hass!.callWS({ type: `${DOMAIN}/balance/reset`, ...(z ? { zone_id: z.id } : {}) });
      this.toast(z ? `${z.name}: Wasserkonto voll` : "Alle Wasserkonten voll");
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  private async setWaterSaving(percent: number): Promise<void> {
    try {
      await this.hass!.callWS({ type: `${DOMAIN}/settings/water_saving`, percent });
      this.toast(percent ? `Wassersparen: ${percent} % weniger` : "Wassersparen aus");
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  private when(iso: string, withDay = true): string {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = { timeZone: this.tz, hour: "2-digit", minute: "2-digit" };
    if (!withDay) return d.toLocaleTimeString("de-DE", opts);
    const today = new Date(this.now).toLocaleDateString("de-DE", { timeZone: this.tz });
    const tomorrow = new Date(this.now + 86400000).toLocaleDateString("de-DE", { timeZone: this.tz });
    const yesterday = new Date(this.now - 86400000).toLocaleDateString("de-DE", { timeZone: this.tz });
    const day = d.toLocaleDateString("de-DE", { timeZone: this.tz });
    const label =
      day === today
        ? "heute"
        : day === tomorrow
          ? "morgen"
          : day === yesterday
            ? "gestern"
            : d.toLocaleDateString("de-DE", { timeZone: this.tz, weekday: "short", day: "numeric", month: "numeric" });
    return `${label} ${d.toLocaleTimeString("de-DE", opts)}`;
  }

  render(): TemplateResult {
    if (this.error) {
      return html`<div class="overview"><div class="card"><p>${this.error}</p></div></div>`;
    }
    const d = this.data;
    if (!d) return html`<div class="empty"><div class="spinner"></div></div>`;
    return html`<div class="overview operation">
      ${this.renderTiles(d)} ${this.renderNow(d)} ${this.renderZones(d)} ${this.renderWeather(d)} ${this.renderHistory(d)}
    </div>`;
  }

  // Kacheln ------------------------------------------------------------------------

  private renderTiles(d: OperationData): TemplateResult {
    const today = d.days[d.days.length - 1];
    const next = d.programs
      .filter((p) => p.next)
      .sort((a, b) => (a.next! < b.next! ? -1 : 1))[0];
    const w = d.weather_today;
    return html`<div class="tiles">
      <div class="tile ${d.problems.length ? "warn" : ""}">
        <span>Zustand</span>
        <strong>${d.winter_mode ? "Winterpause" : d.problems.length ? `${d.problems.length} Problem${d.problems.length > 1 ? "e" : ""}` : d.automatic ? "Automatik an" : "Automatik aus"}</strong>
        <small>${d.problems[0] ?? (d.queue.length ? `${d.queue.length} Zone(n) aktiv oder wartend` : "Alles ruhig")}</small>
      </div>
      <div class="tile">
        <span>Heute gegossen</span>
        <strong>${fmtNumber(today?.liters ?? 0, 0)} L</strong>
        <small>${Object.keys(today?.zones_mm ?? {}).length} Zone(n)</small>
      </div>
      <div class="tile">
        <span>Nächster Start</span>
        <strong>${next ? this.when(next.next!) : "–"}</strong>
        <small>${next ? next.name : d.automatic ? "kein Programm geplant" : "Automatik ist aus"}</small>
      </div>
      <div class="tile">
        <span>Wetter heute</span>
        <strong>${w && w.t_max != null ? `${fmtNumber(w.t_min, 0)}–${fmtNumber(w.t_max, 0)} °C` : "–"}</strong>
        <small>${w
          ? [
              w.rain_mm != null ? `Regen ${fmtNumber(w.rain_mm)} mm` : "",
              w.wind_ms != null ? `Wind ${fmtNumber(w.wind_ms * 3.6, 0)} km/h` : "",
              w.rh_mean != null ? `Luftfeuchte ${fmtNumber(w.rh_mean, 0)} %` : "",
            ]
              .filter(Boolean)
              .join(" · ")
          : d.weather_entity
            ? "noch keine Messwerte"
            : "keine Wetterquelle eingerichtet"}</small>
      </div>
    </div>`;
  }

  // Jetzt ----------------------------------------------------------------------------

  private renderNow(d: OperationData): TemplateResult {
    const programIds = [...new Set(d.queue.map((q) => q.program_id).filter((p): p is string => !!p))];
    const programName = (id: string) => d.programs.find((p) => p.id === id)?.name ?? id;
    return html`<section class="card now">
      <div class="card-head">
        <h2>Jetzt</h2>
        <span class="spacer"></span>
        ${programIds.map(
          (id) => html`<button class="text" ?disabled=${!!this.busy}
            @click=${() => this.cancel({ program_id: id }, `Programm ${programName(id)} abgebrochen`)}>
            <ha-icon icon="mdi:stop-circle-outline"></ha-icon>${programName(id)} abbrechen
          </button>`,
        )}
        ${d.queue.length
          ? html`<button class="text danger" ?disabled=${!!this.busy}
              @click=${() => this.cancel({ all: true }, "Alles gestoppt")}>
              <ha-icon icon="mdi:stop"></ha-icon>Alles stoppen
            </button>`
          : nothing}
      </div>
      ${d.queue.length
        ? html`<ul class="queue">${d.queue.map((q) => this.renderQueueItem(q))}</ul>`
        : html`<p class="hint">Gerade läuft nichts.</p>`}
    </section>`;
  }

  private renderQueueItem(q: QueueItem): TemplateResult {
    const { left, done } = progress(q, this.now);
    const running = q.active;
    const label = running
      ? q.state === "running"
        ? `noch ${fmtDuration(left)} von ${fmtDuration(q.duration_s)}`
        : STATE_TEXT[q.state] ?? q.state
      : `wartet · ${fmtDuration(q.duration_s)}`;
    return html`<li class="${running ? "running" : "waiting"}">
      <ha-icon icon=${running ? "mdi:water" : "mdi:timer-sand"}></ha-icon>
      <div class="what">
        <strong>${q.zone_name}</strong>
        <small>${q.source_text}${q.supply ? ` · ${q.supply}` : ""}</small>
        ${running && q.state === "running"
          ? html`<div class="bar" role="progressbar" aria-valuenow=${Math.round(done * 100)}><div style="width:${done * 100}%"></div></div>`
          : nothing}
      </div>
      <span class="left">${label}</span>
      <button class="text" ?disabled=${!!this.busy}
        title=${running ? "Diese Zone jetzt schließen, dann mit der nächsten weitermachen" : "Diese Zone nicht gießen"}
        @click=${() =>
          this.cancel({ zone_id: q.zone_id }, running ? `${q.zone_name} übersprungen` : `${q.zone_name} herausgenommen`)}>
        <ha-icon icon=${running ? "mdi:skip-next" : "mdi:close"}></ha-icon>${running ? "Überspringen" : "Herausnehmen"}
      </button>
    </li>`;
  }

  // Zonen ----------------------------------------------------------------------------

  private renderZones(d: OperationData): TemplateResult {
    return html`<section class="card">
      <div class="card-head">
        <h2>Zonen</h2>
        <span class="spacer"></span>
        <label class="saving" title="Geplante Gießdauer aller Zonen kürzen, z. B. bei Hitze oder Wasserknappheit">
          <ha-icon icon="mdi:water-minus"></ha-icon>Wassersparen
          <input type="range" min="0" max="50" step="5" .value=${String(d.water_saving_pct)}
            @change=${(e: Event) => this.setWaterSaving(Number((e.target as HTMLInputElement).value))} />
          <strong>${d.water_saving_pct ? `−${d.water_saving_pct} %` : "aus"}</strong>
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
            ${d.zones.map((z) => {
              const last = z.last;
              const fill = z.capacity_mm > 0 ? Math.min(1, z.need_mm / z.capacity_mm) : 0;
              return html`<tr class=${z.enabled ? "" : "off"}>
                <td>
                  <strong>${z.name}</strong>
                  ${z.locked ? html`<br /><small class="bad">gesperrt: ${z.locked}</small>` : nothing}
                </td>
                <td>
                  ${last
                    ? html`${this.when(last.at)}<br /><small>${fmtDuration(last.seconds ?? 0)}${last.state !== "done" ? ` · ${STATE_TEXT[last.state ?? ""] ?? last.state}` : ""}</small>`
                    : html`<small>noch nie</small>`}
                </td>
                <td class="n">
                  ${last?.liters != null ? html`${fmtNumber(last.liters)} L` : "–"}
                  ${last?.mm != null ? html`<br /><small>${fmtNumber(last.mm)} mm</small>` : nothing}
                </td>
                <td>
                  ${z.duration_mode === "calculated"
                    ? html`<div class="need" title=${`${fmtNumber(z.need_mm)} von ${fmtNumber(z.capacity_mm)} mm nutzbarem Wasser fehlen`}>
                        <div class="bar small"><div style="width:${fill * 100}%"></div></div>
                        <small>${fmtNumber(z.need_mm)} mm fehlen${z.measured ? " (Sensor)" : ""}</small>
                      </div>`
                    : html`<small>${z.duration_mode === "entity" ? "aus Entität" : "Dauer von Hand"}</small>`}
                </td>
                <td>
                  ${z.next ? html`${this.when(z.next.at)}<br /><small>${z.next.program}</small>` : html`<small>nicht geplant</small>`}
                  <br /><small>${z.planned_s
                    ? `${fmtDuration(z.planned_s)}${z.planned_liters != null ? `, ca. ${fmtNumber(z.planned_liters, 0)} L` : ""}`
                    : z.reason}</small>
                </td>
                <td class="n actions-cell">
                  ${this.renderWaterButton(z, d)}
                  ${z.duration_mode === "calculated" && z.need_mm > 0
                    ? html`<button class="text small" title="Wasserkonto auf „voll“ setzen (z. B. nach Gießen von Hand)"
                        @click=${() => this.resetBalance(z)}><ha-icon icon="mdi:restore"></ha-icon>Konto voll</button>`
                    : nothing}
                </td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
    </section>`;
  }

  // Wetter -----------------------------------------------------------------------------

  private renderWeather(d: OperationData): TemplateResult {
    // Auf schmalen Bildschirmen (Handy) nur die letzten 7 Tage als Grafik.
    const narrow = this.getBoundingClientRect().width < 640;
    const days = narrow && !this.showTable ? d.days.slice(-7) : d.days;
    const values = days.flatMap((x) => [x.et0_mm ?? 0, x.rain_mm ?? 0]);
    const max = Math.max(4, ...values);
    const W = 1000;
    const H = 190;
    const top = 10;
    const base = H - 24;
    const slot = W / days.length;
    const bw = Math.min(14, slot / 3);
    const y = (v: number) => base - (v / max) * (base - top);
    const ticks = [0, max / 2, max].map((v) => Math.round(v * 10) / 10);
    const hasWeather = days.some((x) => x.et0_mm != null);
    return html`<section class="card">
      <div class="card-head">
        <h2>Wetter und Wasserhaushalt (${days.length} Tage)</h2>
        <span class="spacer"></span>
        <button class="text" @click=${() => (this.showTable = !this.showTable)}>
          <ha-icon icon=${this.showTable ? "mdi:chart-bar" : "mdi:table"}></ha-icon>${this.showTable ? "Als Grafik" : "Als Tabelle"}
        </button>
      </div>
      <div class="legend">
        <span><i style="background:${ET0_COLOR}"></i>Verdunstung (mm)</span>
        <span><i style="background:${RAIN_COLOR}"></i>Regen (mm)</span>
      </div>
      ${this.showTable
        ? html`<div class="table-wrap"><table>
            <thead><tr><th>Tag</th><th class="n">Verdunstung</th><th class="n">Regen</th><th class="n">Gegossen</th></tr></thead>
            <tbody>${[...days].reverse().map(
              (x) => html`<tr><td>${this.dayLabel(x.day)}</td><td class="n">${fmtNumber(x.et0_mm)} mm</td>
                <td class="n">${fmtNumber(x.rain_mm)} mm</td><td class="n">${fmtNumber(x.liters, 0)} L</td></tr>`,
            )}</tbody>
          </table></div>`
        : html`<svg class="chart" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="Verdunstung und Regen je Tag">
            ${ticks.map(
              (t) => svg`<line class="grid" x1="0" x2=${W} y1=${y(t)} y2=${y(t)}></line>
                <text class="tick" x="2" y=${y(t) - 3}>${fmtNumber(t)} mm</text>`,
            )}
            ${days.map((x, i) => {
              const cx = i * slot + slot / 2;
              const bar = (v: number | null, dx: number, color: string, name: string) =>
                v == null
                  ? nothing
                  : svg`<path d=${roundedBar(cx + dx, y(v), bw, base - y(v))} fill=${color}>
                      <title>${this.dayLabel(x.day)}: ${name} ${fmtNumber(v)} mm</title></path>`;
              return svg`<g>
                <rect class="hit" x=${i * slot} y=${top} width=${slot} height=${base - top}>
                  <title>${this.dayLabel(x.day)}: Verdunstung ${fmtNumber(x.et0_mm)} mm, Regen ${fmtNumber(x.rain_mm)} mm, gegossen ${fmtNumber(x.liters, 0)} L</title>
                </rect>
                ${bar(x.et0_mm, -bw - 1, ET0_COLOR, "Verdunstung")} ${bar(x.rain_mm, 1, RAIN_COLOR, "Regen")}
                <text class="day" x=${cx} y=${base + 14}>${this.dayLabel(x.day, true)}</text>
                ${x.liters ? svg`<text class="liters" x=${cx} y=${base + 28}>${fmtNumber(x.liters, 0)} L</text>` : nothing}
              </g>`;
            })}
            <line class="axis" x1="0" x2=${W} y1=${base} y2=${base}></line>
          </svg>`}
      <p class="hint small">
        ${hasWeather ? nothing : html`<strong>Noch keine abgeschlossenen Wettertage. </strong>`}
        So rechnet die Planung (bei Zonen mit berechneter Dauer): Aus Temperatur, Luftfeuchte und Wind ergibt sich jeden
        Tag die Verdunstung. Mal Pflanzenfaktor ist das der Wasserverbrauch der Zone. Wirksamer Regen und gegossenes Wasser
        werden abgezogen. Was fehlt, ist der Bedarf („Bedarf jetzt“); daraus folgen Liter und Gießdauer.
        ${d.weather_entity ? nothing : html`<br /><strong>Es ist keine Wetterquelle eingerichtet</strong> (Einstellungen → Integration → Konfigurieren).`}
      </p>
    </section>`;
  }

  private dayLabel(day: string, short = false): string {
    const d = new Date(`${day}T12:00:00Z`);
    return short
      ? d.toLocaleDateString("de-DE", { timeZone: "UTC", day: "numeric", month: "numeric" })
      : d.toLocaleDateString("de-DE", { timeZone: "UTC", weekday: "short", day: "numeric", month: "numeric" });
  }

  // Verlauf ----------------------------------------------------------------------------

  private renderHistory(d: OperationData): TemplateResult {
    return html`<section class="card">
      <div class="card-head">
        <h2>Verlauf</h2>
        <span class="spacer"></span>
        <select aria-label="Zone" .value=${this.historyZone}
          @change=${(e: Event) => {
            this.historyZone = (e.target as HTMLSelectElement).value;
            void this.loadHistory();
          }}>
          <option value="">Alle Zonen</option>
          ${d.zones.map((z) => html`<option value=${z.id} ?selected=${z.id === this.historyZone}>${z.name}</option>`)}
        </select>
      </div>
      ${this.history.length
        ? html`<ul class="history">
            ${this.history.map((e) => {
              const t = describeEntry(e);
              return html`<li class=${t.tone}>
                <ha-icon icon=${t.icon}></ha-icon>
                <span class="time">${this.when(e.at)}</span>
                <div><strong>${t.title}</strong>${t.detail ? html`<small>${t.detail}</small>` : nothing}</div>
              </li>`;
            })}
          </ul>`
        : html`<p class="hint">Noch nichts aufgezeichnet. Ab jetzt wird jeder Lauf mitgeschrieben.</p>`}
    </section>`;
  }
}

/** Balken mit 4 px runden oberen Ecken, unten gerade (an der Grundlinie). */
export function roundedBar(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}
