// Dashboard-Karte „Bewässerung“ (Phase 4), angelehnt an die Seite „Betrieb“.
//
// Zeigt den Zustand (Automatik, Wassersparen, Probleme), was gerade gießt
// oder wartet (mit Restzeit und „Abbrechen“) und je Zone den nächsten Start
// mit „Jetzt gießen“. Die Daten kommen live über
// `irrigation_planner/operation/subscribe`.
//
// Sicherheit: Die Karte öffnet nie selbst ein Ventil. „Jetzt gießen“ ruft den
// Dienst `run_zone` auf, der nur einreiht; „Abbrechen“ schließt nur.
//
// Einstellungen (YAML der Karte, alle optional):
//   type: custom:irrigation-planner-card
//   title: Bewässerung
//   zones: [zone_1, zone_2]   # nur diese Zonen (IDs oder Namen)
//   show_zones: true          # Zonenliste zeigen

import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { DOMAIN, type OperationData, type QueueItem, type ZoneOperation, fmtDuration, progress } from "./operation-data";
import type { Hass } from "./types";

export interface CardConfig {
  type: string;
  title?: string;
  zones?: string[];
  show_zones?: boolean;
}

/** Zonen für die Karte (gefiltert nach `zones`, wenn angegeben). */
export function cardZones(zones: ZoneOperation[], filter?: string[]): ZoneOperation[] {
  if (!filter?.length) return zones;
  const wanted = new Set(filter.map((f) => f.toLowerCase()));
  return zones.filter((z) => wanted.has(z.id.toLowerCase()) || wanted.has(z.name.toLowerCase()));
}

/** Kurzer Zustand einer Zone für die Zeile. */
export function zoneLine(z: ZoneOperation, item: QueueItem | undefined, now: number, when: (iso: string) => string): string {
  if (item?.state === "running") return `gießt, noch ${fmtDuration(progress(item, now).left)}`;
  if (item?.active) return item.state === "pause" ? "Pause" : "öffnet/schließt";
  if (item) return `wartet, ${fmtDuration(item.duration_s)}`;
  if (z.locked) return `gesperrt: ${z.locked}`;
  if (!z.enabled) return "aus";
  if (z.next) return `${when(z.next.at)}, ${z.planned_s ? fmtDuration(z.planned_s) : "kein Bedarf"}`;
  return z.planned_s ? `nicht geplant, ${fmtDuration(z.planned_s)}` : "nicht geplant";
}

@customElement("irrigation-planner-card")
export class IrrigationPlannerCard extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @state() private config: CardConfig = { type: "custom:irrigation-planner-card" };
  @state() private data?: OperationData;
  @state() private error = "";
  @state() private now = Date.now();
  @state() private busy = false;
  private unsub?: () => void;
  private timer?: number;

  static getStubConfig(): Partial<CardConfig> {
    return { title: "Bewässerung" };
  }

  setConfig(config: CardConfig): void {
    this.config = { show_zones: true, ...config };
  }

  getCardSize(): number {
    return 2 + (this.config.show_zones === false ? 0 : (this.data?.zones.length ?? 4));
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.timer = window.setInterval(() => {
      if (this.data?.queue.some((q) => q.ends_at)) this.now = Date.now();
    }, 1000);
    void this.subscribe();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    this.unsub?.();
    this.unsub = undefined;
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("hass") && !this.unsub) void this.subscribe();
  }

  private async subscribe(): Promise<void> {
    if (!this.hass || this.unsub || this.busy) return;
    this.busy = true;
    try {
      this.unsub = await this.hass.connection.subscribeMessage<OperationData>(
        (data) => {
          this.data = data;
          this.now = Date.now();
          this.error = "";
        },
        { type: `${DOMAIN}/operation/subscribe` },
      );
    } catch (err) {
      this.error = this.message(err);
    } finally {
      this.busy = false;
    }
  }

  private message(err: unknown): string {
    return err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
  }

  private notify(message: string): void {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
  }

  private async call(command: string, data: Record<string, unknown>, done: string): Promise<void> {
    try {
      await this.hass!.callWS({ ...data, type: `${DOMAIN}/${command}` });
      this.notify(done);
    } catch (err) {
      this.notify(this.message(err));
    }
  }

  private async waterNow(z: ZoneOperation): Promise<void> {
    if (!z.planned_s) {
      this.notify(`${z.name}: keine Gießdauer (kein Bedarf und keine Dauer von Hand)`);
      return;
    }
    try {
      await this.hass!.callService(DOMAIN, "run_zone", { zone_id: z.id, duration: z.planned_s });
      this.notify(`${z.name}: ${fmtDuration(z.planned_s)} eingereiht`);
    } catch (err) {
      this.notify(this.message(err));
    }
  }

  private when(iso: string): string {
    const tz = this.hass?.config?.time_zone;
    const d = new Date(iso);
    const day = (offset: number) =>
      new Date(this.now + offset * 86400000).toLocaleDateString("de-DE", { timeZone: tz });
    const date = d.toLocaleDateString("de-DE", { timeZone: tz });
    const time = d.toLocaleTimeString("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
    if (date === day(0)) return `heute ${time}`;
    if (date === day(1)) return `morgen ${time}`;
    return `${d.toLocaleDateString("de-DE", { timeZone: tz, weekday: "short" })} ${time}`;
  }

  private openPanel(): void {
    history.pushState(null, "", "/bewaesserung");
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  render(): TemplateResult {
    const title = this.config.title ?? "Bewässerung";
    if (this.error) {
      return html`<ha-card .header=${title}><div class="content warn">${this.error}</div></ha-card>`;
    }
    const d = this.data;
    if (!d) return html`<ha-card .header=${title}><div class="content muted">Lädt …</div></ha-card>`;
    const running = d.queue.filter((q) => q.active);
    const waiting = d.queue.filter((q) => !q.active);
    return html`<ha-card>
      <div class="head">
        <img src="/irrigation_planner_static/logo.png" alt="" width="28" height="28" />
        <span class="title">${title}</span>
        <span class="spacer"></span>
        ${d.winter_mode
          ? html`<span class="chip">❄ Winterpause</span>`
          : html`<button class="chip ${d.automatic ? "on" : ""}" title="Automatik umschalten (nur Admin)"
              @click=${() => this.call("settings/automatic", { on: !d.automatic }, d.automatic ? "Automatik aus" : "Automatik an")}>
              ${d.automatic ? "Automatik an" : "Automatik aus"}
            </button>`}
        ${d.water_saving_pct ? html`<span class="chip">Sparen −${d.water_saving_pct} %</span>` : nothing}
      </div>
      ${d.problems.length ? html`<div class="problems">⚠ ${d.problems.join(" · ")}</div>` : nothing}
      ${running.length
        ? html`<div class="now">
            ${running.map((q) => {
              const { left, done } = progress(q, this.now);
              return html`<div class="run">
                <div class="what">
                  <strong>${q.zone_name}</strong>
                  <small>${q.state === "running" ? `noch ${fmtDuration(left)} von ${fmtDuration(q.duration_s)}` : q.state}</small>
                  <div class="bar"><div style="width:${done * 100}%"></div></div>
                </div>
                <button class="text" @click=${() => this.call("queue/cancel", { zone_id: q.zone_id }, `${q.zone_name} übersprungen`)}>
                  Überspringen
                </button>
              </div>`;
            })}
            ${waiting.length ? html`<small class="muted">Danach: ${waiting.map((q) => q.zone_name).join(", ")}</small>` : nothing}
            <button class="text danger" @click=${() => this.call("queue/cancel", { all: true }, "Alles gestoppt")}>Alles stoppen</button>
          </div>`
        : html`<div class="idle muted">Gerade läuft nichts.</div>`}
      ${this.config.show_zones === false ? nothing : this.renderZones(d)}
      <div class="foot">
        <button class="text" @click=${this.openPanel}>Plan und Betrieb öffnen</button>
      </div>
    </ha-card>`;
  }

  private renderZones(d: OperationData): TemplateResult {
    const zones = cardZones(d.zones, this.config.zones);
    return html`<ul class="zones">
      ${zones.map((z) => {
        const item = d.queue.find((q) => q.zone_id === z.id);
        const fill = z.capacity_mm > 0 ? Math.max(0, 1 - z.need_mm / z.capacity_mm) : null;
        return html`<li class=${item?.state === "running" ? "running" : ""}>
          <span class="dot" title=${fill === null ? "" : `Wasserkonto ${Math.round(fill * 100)} % voll`}
            style=${fill === null ? "" : `--fill:${Math.round(fill * 100)}%`}></span>
          <div class="what">
            <span>${z.name}</span>
            <small>${zoneLine(z, item, this.now, (iso) => this.when(iso))}</small>
          </div>
          ${item
            ? html`<button class="text danger" @click=${() => this.call("queue/cancel", { zone_id: z.id }, `${z.name} abgebrochen`)}>
                ${item.active ? "Abbrechen" : "Herausnehmen"}
              </button>`
            : html`<button class="text" ?disabled=${!z.enabled || d.winter_mode || !!z.locked} @click=${() => this.waterNow(z)}>
                Gießen
              </button>`}
        </li>`;
      })}
    </ul>`;
  }

  static styles = css`
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
}

// In der Kartenauswahl des Dashboards anzeigen.
declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  }
}
if (typeof window !== "undefined") {
  window.customCards = window.customCards ?? [];
}
if (typeof window !== "undefined" && !window.customCards!.some((c) => c.type === "irrigation-planner-card")) {
  window.customCards!.push({
    type: "irrigation-planner-card",
    name: "Bewässerung",
    description: "Was gerade gießt, was als Nächstes kommt, Jetzt gießen und Abbrechen (FlowerPower).",
    preview: false,
  });
}
