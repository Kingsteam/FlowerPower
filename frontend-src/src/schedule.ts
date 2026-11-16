// Seite „Zeitplan“: Programme in der Wochenübersicht ansehen und einstellen,
// dazu die Bausteine für eigene Home-Assistant-Automationen.
//
// Ändern geht über `irrigation_planner/programs/save` (wirkt sofort). „Jetzt
// starten“ ruft den Dienst `run_program` auf, der nur in die Warteschlange
// einreiht; die Regel „ein Ventil gleichzeitig“ gilt weiter.

import { LitElement, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styles } from "./styles";
import type { Hass, PlanZone } from "./types";

const DOMAIN = "irrigation_planner";
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const COLORS = ["#1565c0", "#2e7d32", "#ef6c00", "#6a1b9a", "#00838f", "#c62828"];
const MODES: Record<string, string> = {
  sequence: "Nacheinander",
  cycle_soak: "Abwechselnd (mit Einziehzeit)",
  priority: "Nach Bedarf (größter zuerst)",
};

export interface ProgramInfo {
  id: string;
  name: string;
  zone_ids: string[];
  mode: string;
  pause_between_s: number;
  cycle_s: number | null;
  soak_s: number | null;
  start_time: string | null;
  finish_by: string | null;
  sun_offset_min: number;
  weekdays: number[];
  interval_days: number | null;
  skip_on_rain: boolean;
  skip_on_frost: boolean;
  skip_on_wind: boolean;
  enabled: boolean;
  last_run: string | null;
  steps: { zone_id: string; zone_name: string; duration_s: number; pause_after_s: number }[];
  total_s: number;
  next_start: string | null;
  upcoming: string[];
  skip_next: boolean;
  last_result: { at: string; started: boolean; reason: string } | null;
  entities: Record<string, string>;
}

interface ProgramsData {
  automatic: boolean;
  winter_mode: boolean;
  window_end: string | null;
  programs: ProgramInfo[];
  events: { type: string; description: string }[];
}

type Kind = "window" | "start_time" | "finish_by" | "start_sun" | "finish_sun";

/** Art des Zeitplans aus den gespeicherten Feldern. */
export function scheduleKind(p: Pick<ProgramInfo, "start_time" | "finish_by">): Kind {
  if (p.start_time === "sunrise" || p.start_time === "sunset") return "start_sun";
  if (p.finish_by === "sunrise" || p.finish_by === "sunset") return "finish_sun";
  if (p.start_time) return "start_time";
  if (p.finish_by) return "finish_by";
  return "window";
}

/** Zeitplan in Worten, z. B. „fertig 60 min vor Sonnenaufgang, Mo Mi Fr“. */
export function describeSchedule(p: ProgramInfo, windowEnd: string | null): string {
  const sun = (v: string | null) => (v === "sunset" ? "Sonnenuntergang" : "Sonnenaufgang");
  const offset = (m: number) =>
    m === 0 ? "" : `${Math.abs(m) >= 60 && Math.abs(m) % 60 === 0 ? `${Math.abs(m) / 60} h` : `${Math.abs(m)} min`} ${m < 0 ? "vor" : "nach"} `;
  const hm = (t: string | null) => (t ?? "").slice(0, 5);
  let when = "";
  switch (scheduleKind(p)) {
    case "start_sun":
      when = p.sun_offset_min ? `Start ${offset(p.sun_offset_min)}${sun(p.start_time)}` : `Start bei ${sun(p.start_time)}`;
      break;
    case "finish_sun":
      when = p.sun_offset_min ? `fertig ${offset(p.sun_offset_min)}${sun(p.finish_by)}` : `fertig bei ${sun(p.finish_by)}`;
      break;
    case "start_time":
      when = `Start ${hm(p.start_time)} Uhr`;
      break;
    case "finish_by":
      when = `fertig bis ${hm(p.finish_by)} Uhr`;
      break;
    default:
      when = windowEnd ? `fertig bis Ende des Zeitfensters (${hm(windowEnd)} Uhr)` : "fertig bis Ende des Zeitfensters";
  }
  const days = p.interval_days
    ? `alle ${p.interval_days} Tage`
    : p.weekdays.length && p.weekdays.length < 7
      ? p.weekdays.map((d) => DAYS[d]).join(" ")
      : "täglich";
  return `${when}, ${days}`;
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const min = Math.round(seconds / 60);
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

/** Teile eines Zeitpunkts in der Zeitzone von Home Assistant. */
export function zoned(iso: string | Date, timeZone?: string) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("de-DE", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    time: `${parts.hour}:${parts.minute}`,
  };
}

@customElement("ip-schedule")
export class ScheduleView extends LitElement {
  static styles = styles;

  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) zones: PlanZone[] = [];

  @state() private data?: ProgramsData;
  @state() private error = "";
  @state() private editing: string | null = null;
  @state() private draft: ProgramInfo | null = null;
  @state() private newName = "";
  @state() private busy = false;

  private get tz(): string | undefined {
    return this.hass?.config?.time_zone;
  }

  private fmtWhen(iso: string): string {
    return new Date(iso).toLocaleString("de-DE", {
      timeZone: this.tz,
      weekday: "short",
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    void this.load();
  }

  private toast(text: string, isError = false): void {
    this.dispatchEvent(new CustomEvent("ip-toast", { detail: { text, isError }, bubbles: true, composed: true }));
  }

  private message(err: unknown): string {
    return err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
  }

  async load(): Promise<void> {
    try {
      this.data = await this.hass!.callWS<ProgramsData>({ type: `${DOMAIN}/programs/get` });
      this.error = "";
    } catch (err) {
      this.error = this.message(err);
    }
  }

  private edit(p: ProgramInfo): void {
    this.editing = p.id;
    this.draft = structuredClone(p);
  }

  private async saveDraft(): Promise<void> {
    const d = this.draft!;
    this.busy = true;
    try {
      this.data = await this.hass!.callWS<ProgramsData>({
        type: `${DOMAIN}/programs/save`,
        program_id: d.id,
        name: d.name,
        zone_ids: d.zone_ids,
        mode: d.mode,
        pause_between_s: d.pause_between_s,
        cycle_s: d.mode === "cycle_soak" ? d.cycle_s ?? 300 : d.cycle_s,
        soak_s: d.soak_s,
        start_time: d.start_time,
        finish_by: d.finish_by,
        sun_offset_min: d.sun_offset_min,
        weekdays: d.weekdays,
        interval_days: d.interval_days,
        skip_on_rain: d.skip_on_rain,
        skip_on_frost: d.skip_on_frost,
        skip_on_wind: d.skip_on_wind,
        enabled: d.enabled,
      });
      this.editing = null;
      this.draft = null;
      this.toast(`${d.name}: gespeichert`);
    } catch (err) {
      this.toast(`Nicht gespeichert: ${this.message(err)}`, true);
    } finally {
      this.busy = false;
    }
  }

  private async toggle(p: ProgramInfo): Promise<void> {
    try {
      this.data = await this.hass!.callWS<ProgramsData>({
        type: `${DOMAIN}/programs/save`,
        program_id: p.id,
        enabled: !p.enabled,
      });
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  private async service(service: string, p: ProgramInfo, done: string): Promise<void> {
    try {
      await this.hass!.callService(DOMAIN, service, { program_id: p.id });
      this.toast(done);
      await this.load();
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  private async create(): Promise<void> {
    const name = this.newName.trim();
    if (!name) return;
    try {
      await this.hass!.callWS({ type: `${DOMAIN}/programs/create`, name });
      this.newName = "";
      this.toast(`„${name}“ angelegt, wird geladen …`);
      setTimeout(() => void this.load(), 4000);
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  private async deleteProgram(p: ProgramInfo): Promise<void> {
    try {
      await this.hass!.callWS({ type: `${DOMAIN}/programs/delete`, program_id: p.id });
      this.editing = null;
      this.toast(`„${p.name}“ gelöscht, wird geladen …`);
      setTimeout(() => void this.load(), 4000);
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  // Darstellung -----------------------------------------------------------------

  protected render(): TemplateResult {
    if (this.error) return html`<div class="overview"><p class="note warn">${this.error}</p></div>`;
    if (!this.data) return html`<div class="empty"><div class="spinner"></div></div>`;
    const d = this.data;
    return html`
      <div class="overview">
        ${d.winter_mode
          ? html`<p class="note warn">Winterpause: Es startet kein Programm automatisch.</p>`
          : !d.automatic
            ? html`<p class="note warn">Automatik ist aus: Programme starten nur von Hand oder per Automation.</p>`
            : nothing}
        ${this.renderWeek()}
        <section class="programs">
          ${d.programs.map((p, i) => this.renderProgram(p, i))}
          <div class="card new-program">
            <h3>Neues Programm</h3>
            <div class="actions">
              <input type="text" placeholder="Name, z. B. Rasen abends" .value=${this.newName}
                @input=${(e: Event) => (this.newName = (e.target as HTMLInputElement).value)}
                @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this.create()} />
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
  private renderWeek(): TemplateResult {
    const d = this.data!;
    // Tage und Uhrzeiten in der Zeitzone von Home Assistant (nicht des Browsers).
    const now = zoned(new Date(), this.tz);
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(`${now.day}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() + i);
      return date;
    });
    const nowPct = (now.minutes / 1440) * 100;
    return html`
      <section class="card week">
        <h3>Die nächsten 7 Tage</h3>
        <div class="week-grid">
          <div class="hours">${[0, 3, 6, 9, 12, 15, 18, 21].map((h) => html`<span style="left:${(h / 24) * 100}%">${h}</span>`)}</div>
          ${days.map((day, di) => {
            const key = day.toISOString().slice(0, 10);
            const label = di === 0 ? "Heute" : day.toLocaleDateString("de-DE", { timeZone: "UTC", weekday: "short", day: "numeric" });
            const blocks = d.programs.flatMap((p, pi) =>
              p.upcoming
                .map((iso) => zoned(iso, this.tz))
                .filter((t) => t.day === key)
                .map((t) => {
                  const left = (t.minutes / 1440) * 100;
                  const width = Math.max(0.6, (p.total_s / 86400) * 100);
                  return html`<div class="block ${p.enabled ? "" : "off"} ${left + width > 70 ? "late" : ""}" title=${`${p.name}: ${t.time} Uhr, ${fmtDuration(p.total_s)}`}
                    style="left:${left}%; width:${width}%; --c:${COLORS[pi % COLORS.length]}">
                    <span>${t.time} ${p.name}</span>
                  </div>`;
                }),
            );
            return html`<div class="day"><span class="day-label">${label}</span>
              <div class="track">${blocks}${di === 0 ? html`<div class="now" style="left:${nowPct}%"></div>` : nothing}</div></div>`;
          })}
        </div>
        <p class="hint small">Nur Programme, die automatisch starten (aktiv, Automatik an, keine Winterpause). Wetter kann einen Start noch überspringen.</p>
      </section>
    `;
  }

  private renderProgram(p: ProgramInfo, index: number): TemplateResult {
    const open = this.editing === p.id;
    return html`
      <div class="card program" style="--c:${COLORS[index % COLORS.length]}">
        <div class="program-head">
          <span class="swatch" style="background:var(--c)"></span>
          <h3>${p.name}</h3>
          <span class="spacer"></span>
          <label class="check" title="Programm startet automatisch">
            <input type="checkbox" .checked=${p.enabled} @change=${() => this.toggle(p)} /> aktiv
          </label>
        </div>
        <p class="when">${describeSchedule(p, this.data!.window_end)}</p>
        <dl>
          <dt>Nächster Start</dt>
          <dd>${p.next_start ? this.fmtWhen(p.next_start) : "–"}${p.skip_next ? html` <em>(wird übersprungen)</em>` : nothing}</dd>
          <dt>Ablauf</dt>
          <dd>${MODES[p.mode] ?? p.mode}, ${fmtDuration(p.total_s)} gesamt</dd>
          <dt>Zonen</dt>
          <dd>${p.steps.length
            ? html`<ol class="steps">${p.steps.map((s) => html`<li>${s.zone_name} <small>${fmtDuration(s.duration_s)}</small></li>`)}</ol>`
            : html`<em>keine Zone mit Bedarf oder Dauer</em>`}</dd>
          ${p.last_result
            ? html`<dt>Zuletzt</dt><dd>${this.fmtWhen(p.last_result.at)}: ${p.last_result.started ? "gestartet" : `übersprungen (${p.last_result.reason})`}</dd>`
            : nothing}
        </dl>
        <div class="actions">
          <button class="text" @click=${() => (open ? (this.editing = null) : this.edit(p))}>
            <ha-icon icon="mdi:pencil"></ha-icon>${open ? "Schließen" : "Bearbeiten"}
          </button>
          <span class="spacer"></span>
          <button class="text" ?disabled=${!p.next_start || p.skip_next} @click=${() => this.service("skip_next", p, `${p.name}: nächster Start wird übersprungen`)}>
            <ha-icon icon="mdi:skip-next"></ha-icon>Nächsten überspringen
          </button>
          <button class="text" @click=${() => this.service("run_program", p, `${p.name}: eingereiht`)}>
            <ha-icon icon="mdi:play"></ha-icon>Jetzt starten
          </button>
        </div>
        ${open && this.draft ? this.renderEditor(this.draft) : nothing}
      </div>
    `;
  }

  private renderEditor(d: ProgramInfo): TemplateResult {
    const kind = scheduleKind(d);
    const update = () => (this.draft = { ...d });
    const setKind = (k: Kind) => {
      const sunEvent = d.start_time === "sunset" || d.finish_by === "sunset" ? "sunset" : "sunrise";
      d.start_time = k === "start_time" ? "06:00" : k === "start_sun" ? sunEvent : null;
      d.finish_by = k === "finish_by" ? "07:00" : k === "finish_sun" ? sunEvent : null;
      if (k !== "start_sun" && k !== "finish_sun") d.sun_offset_min = 0;
      update();
    };
    const sunEvent = d.start_time === "sunset" || d.finish_by === "sunset" ? "sunset" : "sunrise";
    return html`
      <div class="editor">
        <label class="field wide"><span>Name</span>
          <input type="text" .value=${d.name} @change=${(e: Event) => ((d.name = (e.target as HTMLInputElement).value), update())} />
        </label>
        <div class="field wide"><span>Zonen (Reihenfolge = Ablauf)</span>
          <div class="zone-pick">
            ${this.zones.map((z) => {
              const pos = d.zone_ids.indexOf(z.id);
              return html`<button class=${pos >= 0 ? "active" : ""} @click=${() => {
                d.zone_ids = pos >= 0 ? d.zone_ids.filter((id) => id !== z.id) : [...d.zone_ids, z.id];
                update();
              }}>${pos >= 0 ? html`<b>${pos + 1}</b>` : nothing}${z.name}</button>`;
            })}
          </div>
        </div>
        <label class="field wide"><span>Ablauf</span>
          <select @change=${(e: Event) => ((d.mode = (e.target as HTMLSelectElement).value), update())}>
            ${Object.entries(MODES).map(([k, v]) => html`<option value=${k} ?selected=${k === d.mode}>${v}</option>`)}
          </select>
        </label>
        <div class="fields">
          <label class="field"><span>Pause zwischen Zonen</span>
            <input type="number" min="0" .value=${String(d.pause_between_s)}
              @change=${(e: Event) => ((d.pause_between_s = Number((e.target as HTMLInputElement).value) || 0), update())} />
            <span class="unit">s</span></label>
          ${d.mode === "cycle_soak"
            ? html`<label class="field"><span>Gießphase</span>
                <input type="number" min="1" .value=${String(Math.round((d.cycle_s ?? 300) / 60))}
                  @change=${(e: Event) => ((d.cycle_s = Math.max(1, Number((e.target as HTMLInputElement).value)) * 60), update())} />
                <span class="unit">min</span></label>
              <label class="field"><span>Einziehzeit</span>
                <input type="number" min="0" .value=${String(Math.round((d.soak_s ?? 0) / 60))}
                  @change=${(e: Event) => ((d.soak_s = Number((e.target as HTMLInputElement).value) * 60 || null), update())} />
                <span class="unit">min</span></label>`
            : nothing}
        </div>
        <label class="field wide"><span>Wann?</span>
          <select @change=${(e: Event) => setKind((e.target as HTMLSelectElement).value as Kind)}>
            <option value="finish_sun" ?selected=${kind === "finish_sun"}>Fertig bis Sonnenaufgang/-untergang</option>
            <option value="start_sun" ?selected=${kind === "start_sun"}>Start bei Sonnenaufgang/-untergang</option>
            <option value="finish_by" ?selected=${kind === "finish_by"}>Fertig bis Uhrzeit</option>
            <option value="start_time" ?selected=${kind === "start_time"}>Start um Uhrzeit</option>
            <option value="window" ?selected=${kind === "window"}>Fertig bis Ende des Zeitfensters</option>
          </select>
        </label>
        ${kind === "start_time" || kind === "finish_by"
          ? html`<label class="field wide"><span>Uhrzeit</span>
              <input type="time" .value=${((kind === "start_time" ? d.start_time : d.finish_by) ?? "").slice(0, 5)}
                @change=${(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  if (kind === "start_time") d.start_time = v;
                  else d.finish_by = v;
                  update();
                }} /></label>`
          : nothing}
        ${kind === "start_sun" || kind === "finish_sun"
          ? html`<div class="fields">
              <label class="field"><span>Sonne</span>
                <select @change=${(e: Event) => {
                  const v = (e.target as HTMLSelectElement).value;
                  if (kind === "start_sun") d.start_time = v;
                  else d.finish_by = v;
                  update();
                }}>
                  <option value="sunrise" ?selected=${sunEvent === "sunrise"}>Sonnenaufgang</option>
                  <option value="sunset" ?selected=${sunEvent === "sunset"}>Sonnenuntergang</option>
                </select></label>
              <label class="field"><span>Versatz (− = vorher)</span>
                <input type="number" step="5" min="-360" max="360" .value=${String(d.sun_offset_min)}
                  @change=${(e: Event) => ((d.sun_offset_min = Math.round(Number((e.target as HTMLInputElement).value) || 0)), update())} />
                <span class="unit">min</span></label>
            </div>`
          : nothing}
        <div class="field wide"><span>Tage</span>
          <div class="levels">
            ${DAYS.map((name, i) => html`<button class=${d.weekdays.includes(i) ? "active" : ""} ?disabled=${!!d.interval_days}
              @click=${() => ((d.weekdays = d.weekdays.includes(i) ? d.weekdays.filter((x) => x !== i) : [...d.weekdays, i].sort()), update())}>${name}</button>`)}
          </div>
          <small class="hint">Keiner gewählt = jeden Tag.</small>
        </div>
        <label class="field wide"><span>Oder alle N Tage (0 = aus)</span>
          <input type="number" min="0" max="60" .value=${String(d.interval_days ?? 0)}
            @change=${(e: Event) => ((d.interval_days = Number((e.target as HTMLInputElement).value) || null), update())} /></label>
        <div class="checks">
          ${(["skip_on_rain", "skip_on_frost", "skip_on_wind"] as const).map(
            (key) => html`<label class="check"><input type="checkbox" .checked=${d[key]}
              @change=${(e: Event) => ((d[key] = (e.target as HTMLInputElement).checked), update())} />
              ${{ skip_on_rain: "Bei Regen überspringen", skip_on_frost: "Bei Frost überspringen", skip_on_wind: "Bei starkem Wind überspringen" }[key]}</label>`,
          )}
        </div>
        <div class="actions">
          <button class="text danger" @click=${() => this.deleteProgram(d)}><ha-icon icon="mdi:delete-outline"></ha-icon>Löschen</button>
          <span class="spacer"></span>
          <button class="text" @click=${() => ((this.editing = null), (this.draft = null))}>Abbrechen</button>
          <button class="primary" ?disabled=${this.busy} @click=${this.saveDraft}>Speichern</button>
        </div>
      </div>
    `;
  }

  private renderAutomations(): TemplateResult {
    const d = this.data!;
    const example = `triggers:
  - trigger: event
    event_type: irrigation_planner_run_finished
actions:
  - action: notify.notify
    data:
      message: >-
        {{ trigger.event.data.zone_name }} fertig
        ({{ (trigger.event.data.seconds_open / 60) | round }} min)`;
    const start = d.programs[0]?.id ?? "morgens";
    return html`
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
              ${d.programs.map(
                (p) => html`<tr>
                  <td>${p.name}</td>
                  <td><code>irrigation_planner.run_program</code><br /><small>program_id: <code>${p.id}</code></small></td>
                  <td>${Object.values(p.entities).map((e) => html`<code>${e}</code><br />`)}</td>
                </tr>`,
              )}
            </tbody>
          </table>
        </div>
        <h3>Ereignisse</h3>
        <ul class="events">
          ${d.events.map((e) => html`<li><code>${e.type}</code> – ${e.description}</li>`)}
        </ul>
        <h3>Beispiele</h3>
        <p class="hint small">Benachrichtigung, wenn eine Zone fertig ist:</p>
        <pre>${example}</pre>
        <p class="hint small">Programm aus einer Automation starten:</p>
        <pre>actions:
  - action: irrigation_planner.run_program
    data:
      program_id: ${start}</pre>
        <p class="hint small">Weitere Dienste: <code>run_zone</code> (Zone mit Dauer einreihen), <code>stop_all</code>, <code>skip_next</code>, <code>release_zone</code>.</p>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ip-schedule": ScheduleView;
  }
}
