// Seite „Geräte“: Ventile und Sensoren anlegen, ändern, löschen, testen.
//
// Gerät wählen → der Bewässerungsplaner schlägt Treiber, Profil und die
// Entitäten je Rolle vor (`devices/suggest`, gleiche Erkennung wie der
// Assistent in den Einstellungen). Speichern prüft das ganze Modell und lädt
// den Bewässerungsplaner neu. Der Testlauf (10–60 s) öffnet das Ventil
// wirklich; nur auf ausdrücklichen Knopfdruck.

import { LitElement, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styles } from "./styles";
import type { Hass } from "./types";

const DOMAIN = "irrigation_planner";
const NEW = "__new__";

export const ROLES = ["valve", "flow", "volume", "status", "battery"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, { name: string; hint: string }> = {
  valve: { name: "Schalten", hint: "Schalter oder Ventil, das geöffnet wird (Pflicht)" },
  flow: { name: "Durchfluss", hint: "L/min, für die Überwachung (Leck, kein Wasser)" },
  volume: { name: "Menge", hint: "Liter je Lauf, z. B. „Bewässerungsmenge“" },
  status: { name: "Gerätestatus", hint: "Meldet z. B. Wassermangel oder Leck" },
  battery: { name: "Batterie", hint: "Ladestand in %" },
};

export const DRIVER_LABELS: Record<string, string> = {
  zigbee2mqtt: "Zigbee2MQTT (Dauer ans Gerät)",
  service_call: "Dienstaufruf (Dauer ans Gerät)",
  ha_switch: "Schalter (nur Home Assistant überwacht)",
  ha_valve: "Ventil-Entität (nur Home Assistant überwacht)",
};

const KIND_LABELS: Record<string, string> = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge (mm)",
};

export interface DeviceEntity {
  entity_id: string;
  name: string;
  domain: string;
  device_class: string | null;
  unit: string | null;
  state: string | null;
}

export interface ValveInfo {
  id: string;
  name: string;
  device_id: string;
  device_name: string | null;
  manufacturer: string | null;
  model: string | null;
  driver: string;
  profile: string | null;
  driver_options: Record<string, unknown>;
  entities: Partial<Record<Role, string | null>>;
  state: string | null;
  flow_now: string | null;
  battery: string | null;
  safety_level: string;
  device_timer: boolean;
  zone_ids: string[];
  water_supply_id: string | null;
  learned_flow_l_min: number | null;
}

interface SensorInfo {
  id: string;
  name: string;
  kind: string;
  entity_id: string | null;
  state: string | null;
  zone_ids: string[];
  field_capacity_pct: number;
  wilting_point_pct: number;
}

interface Candidate {
  device_id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  area: string | null;
  profile: string | null;
  used_by: string | null;
}

interface DevicesData {
  valves: ValveInfo[];
  sensors: SensorInfo[];
  supplies: { id: string; name: string; valve_ids: string[]; max_open_valves: number }[];
  zones: { id: string; name: string; valve_id: string | null }[];
  drivers: string[];
  profiles: { id: string; name: string; driver: string }[];
  candidates: Candidate[];
  busy: boolean;
  test_min_s: number;
  test_max_s: number;
}

export interface Suggestion {
  name: string;
  driver: string;
  profile: string | null;
  profile_name: string | null;
  entities: Partial<Record<Role, string>>;
  driver_options: Record<string, unknown>;
  device_entities: DeviceEntity[];
}

export interface ValveDraft {
  valve_id: string | null;
  name: string;
  device_id: string;
  driver: string;
  profile: string | null;
  entities: Partial<Record<Role, string | null>>;
  driver_options: Record<string, unknown>;
  water_supply_id: string;
  new_supply_name: string;
  zone_ids: string[];
  new_zone_name: string;
  new_zone_minutes: number;
  detected: string | null; // erkanntes Profil (nur Anzeige)
}

interface SensorDraft {
  sensor_id: string | null;
  name: string;
  kind: string;
  entity_id: string;
  zone_ids: string[];
  field_capacity_pct: number;
  wilting_point_pct: number;
}

interface TestResult {
  level: "ok" | "warn" | "error";
  text: string;
  flow_l_min: number | null;
  closed_ok: boolean;
  seconds: number;
}

/** Passende Entitäten des Geräts für eine Rolle. */
export function roleCandidates(entities: DeviceEntity[], role: Role): DeviceEntity[] {
  if (role === "valve") return entities.filter((e) => e.domain === "switch" || e.domain === "valve");
  if (role === "status") return entities.filter((e) => e.domain === "sensor" || e.domain === "binary_sensor");
  if (role === "battery") return entities.filter((e) => e.domain === "sensor" && e.device_class === "battery");
  return entities.filter((e) => e.domain === "sensor");
}

/** Entwurf aus dem Vorschlag für ein neues Ventil. */
export function draftFromSuggestion(
  deviceId: string,
  s: Suggestion,
  supplies: { id: string }[],
  usedNames: string[],
): ValveDraft {
  let name = s.name;
  for (let n = 2; usedNames.includes(name); n++) name = `${s.name} ${n}`;
  return {
    valve_id: null,
    name,
    device_id: deviceId,
    driver: s.driver,
    profile: s.profile,
    entities: { ...s.entities },
    driver_options: { ...s.driver_options },
    water_supply_id: supplies[0]?.id ?? NEW,
    new_supply_name: "Hauswasser",
    zone_ids: [],
    new_zone_name: name,
    new_zone_minutes: 10,
    detected: s.profile_name,
  };
}

/** Sicherheitsstufe in Worten. */
export function safetyText(v: Pick<ValveInfo, "driver" | "safety_level" | "device_timer">): {
  level: "ok" | "warn";
  text: string;
} {
  if (v.safety_level === "device" || v.device_timer)
    return { level: "ok", text: "Gerät schließt selbst" };
  if (v.driver === "zigbee2mqtt" || v.driver === "service_call")
    return { level: "warn", text: "Dauer geht ans Gerät; Testlauf zeigt, ob es selbst schließt" };
  return { level: "warn", text: "Nur Home Assistant überwacht die Zeit" };
}

function shortState(state: string | null | undefined, unit = ""): string {
  if (state == null || state === "unknown") return "–";
  if (state === "unavailable") return "nicht erreichbar";
  if (state === "on" || state === "open") return "offen";
  if (state === "off" || state === "closed") return "zu";
  return unit ? `${state} ${unit}` : state;
}

@customElement("ip-devices")
export class DevicesView extends LitElement {
  static styles = styles;

  @property({ attribute: false }) hass?: Hass;

  @state() private data?: DevicesData;
  @state() private error = "";
  @state() private draft: ValveDraft | null = null;
  @state() private deviceEntities: DeviceEntity[] = [];
  @state() private filter = "";
  @state() private sensorDraft: SensorDraft | null = null;
  @state() private saving = false;
  @state() private testFor: string | null = null;
  @state() private testSeconds = 10;
  @state() private testing = false;
  @state() private testResult: (TestResult & { valve: string }) | null = null;

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
      this.data = await this.hass!.callWS<DevicesData>({ type: `${DOMAIN}/devices/get` });
      this.testSeconds = Math.max(this.testSeconds, this.data.test_min_s);
      this.error = "";
    } catch (err) {
      this.error = this.message(err);
    }
  }

  /** Nach Speichern/Löschen: Bewässerungsplaner lädt neu, danach frisch holen. */
  private reloaded(text: string): void {
    this.toast(`${text}, wird neu geladen …`);
    this.dispatchEvent(new CustomEvent("ip-reloaded", { bubbles: true, composed: true }));
    setTimeout(() => void this.load(), 4000);
  }

  // Ventile ----------------------------------------------------------------------

  private async pickDevice(deviceId: string): Promise<void> {
    if (!deviceId) return;
    try {
      const s = await this.hass!.callWS<Suggestion>({ type: `${DOMAIN}/devices/suggest`, device_id: deviceId });
      this.deviceEntities = s.device_entities;
      const used = this.data!.valves.map((v) => v.name);
      this.draft = draftFromSuggestion(deviceId, s, this.data!.supplies, used);
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  private async edit(v: ValveInfo): Promise<void> {
    this.sensorDraft = null;
    this.testFor = null;
    try {
      const s = await this.hass!.callWS<Suggestion>({ type: `${DOMAIN}/devices/suggest`, device_id: v.device_id });
      this.deviceEntities = s.device_entities;
    } catch {
      this.deviceEntities = []; // Gerät gibt es nicht mehr: Entitäten bleiben, wie sie sind
    }
    this.draft = {
      valve_id: v.id,
      name: v.name,
      device_id: v.device_id,
      driver: v.driver,
      profile: v.profile,
      entities: { ...v.entities },
      driver_options: { ...v.driver_options },
      water_supply_id: v.water_supply_id ?? this.data!.supplies[0]?.id ?? NEW,
      new_supply_name: "Hauswasser",
      zone_ids: [...v.zone_ids],
      new_zone_name: "",
      new_zone_minutes: 10,
      detected: null,
    };
  }

  private startNew(): void {
    this.sensorDraft = null;
    this.testFor = null;
    this.filter = "";
    this.deviceEntities = [];
    this.draft = {
      valve_id: null,
      name: "",
      device_id: "",
      driver: "",
      profile: null,
      entities: {},
      driver_options: {},
      water_supply_id: this.data!.supplies[0]?.id ?? NEW,
      new_supply_name: "Hauswasser",
      zone_ids: [],
      new_zone_name: "",
      new_zone_minutes: 10,
      detected: null,
    };
  }

  private async saveValve(): Promise<void> {
    const d = this.draft!;
    this.saving = true;
    try {
      const options = { ...d.driver_options };
      const result = await this.hass!.callWS<{ id: string }>({
        type: `${DOMAIN}/devices/save_valve`,
        valve_id: d.valve_id,
        name: d.name.trim(),
        device_id: d.device_id,
        driver: d.driver,
        profile: d.profile,
        entities: Object.fromEntries(ROLES.map((r) => [r, d.entities[r] || null])),
        driver_options: options,
        water_supply_id: d.water_supply_id,
        new_supply_name: d.new_supply_name,
        zone_ids: d.zone_ids,
        new_zone_name: d.new_zone_name.trim() || null,
        new_zone_minutes: d.new_zone_minutes,
      });
      const isNew = !d.valve_id;
      this.draft = null;
      this.reloaded(`„${d.name}“ gespeichert`);
      if (isNew) {
        // Gleich den Testlauf anbieten (startet erst auf Knopfdruck).
        this.testFor = result.id;
        this.testResult = null;
      }
    } catch (err) {
      this.toast(`Nicht gespeichert: ${this.message(err)}`, true);
    } finally {
      this.saving = false;
    }
  }

  private async deleteValve(v: { valve_id: string | null; name: string }): Promise<void> {
    if (!v.valve_id) return;
    if (!confirm(`Ventil „${v.name}“ löschen? Die Zonen bleiben (ohne Ventil).`)) return;
    try {
      await this.hass!.callWS({ type: `${DOMAIN}/devices/delete_valve`, valve_id: v.valve_id });
      this.draft = null;
      this.reloaded(`„${v.name}“ gelöscht`);
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  private async runTest(v: ValveInfo): Promise<void> {
    this.testing = true;
    this.testResult = null;
    try {
      const r = await this.hass!.callWS<TestResult>({
        type: `${DOMAIN}/devices/test_valve`,
        valve_id: v.id,
        seconds: this.testSeconds,
      });
      this.testResult = { ...r, valve: v.id };
      setTimeout(() => void this.load(), 4000);
    } catch (err) {
      this.testResult = { level: "error", text: this.message(err), flow_l_min: null, closed_ok: true, seconds: 0, valve: v.id };
    } finally {
      this.testing = false;
    }
  }

  // Sensoren ---------------------------------------------------------------------

  private sensorEntities(): { entity_id: string; name: string; unit: string }[] {
    const states = this.hass?.states ?? {};
    return Object.entries(states)
      .filter(([id]) => id.startsWith("sensor.") && !id.startsWith(`sensor.${DOMAIN}`))
      .map(([id, s]) => ({
        entity_id: id,
        name: String(s.attributes.friendly_name ?? id),
        unit: String(s.attributes.unit_of_measurement ?? ""),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  private async saveSensor(): Promise<void> {
    const d = this.sensorDraft!;
    this.saving = true;
    try {
      await this.hass!.callWS({ type: `${DOMAIN}/devices/save_sensor`, ...d, name: d.name.trim() });
      this.sensorDraft = null;
      this.reloaded(`„${d.name}“ gespeichert`);
    } catch (err) {
      this.toast(`Nicht gespeichert: ${this.message(err)}`, true);
    } finally {
      this.saving = false;
    }
  }

  private async deleteSensor(d: SensorDraft): Promise<void> {
    if (!d.sensor_id || !confirm(`Sensor „${d.name}“ entfernen?`)) return;
    try {
      await this.hass!.callWS({ type: `${DOMAIN}/devices/delete_sensor`, sensor_id: d.sensor_id });
      this.sensorDraft = null;
      this.reloaded(`„${d.name}“ entfernt`);
    } catch (err) {
      this.toast(this.message(err), true);
    }
  }

  // Darstellung ------------------------------------------------------------------

  protected render(): TemplateResult {
    if (this.error) return html`<div class="overview"><p class="note warn">${this.error}</p></div>`;
    if (!this.data) return html`<div class="empty"><div class="spinner"></div></div>`;
    const d = this.data;
    return html`
      <div class="overview devices">
        ${d.busy ? html`<p class="note warn">Gerade wird gegossen. Ändern geht erst, wenn alles fertig ist.</p>` : nothing}
        <section class="card">
          <div class="section-head">
            <h2>Ventile</h2>
            <span class="spacer"></span>
            <button class="primary" ?disabled=${d.busy || (this.draft !== null && !this.draft.valve_id)} @click=${this.startNew}>
              <ha-icon icon="mdi:plus"></ha-icon>Ventil hinzufügen
            </button>
          </div>
          ${this.draft && !this.draft.valve_id ? this.renderValveEditor(this.draft) : nothing}
          ${d.valves.length
            ? html`<div class="table-wrap">
                <table class="devices-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Gerät</th><th>Treiber</th><th>Sicherheit</th><th>Zonen</th>
                      <th>Versorgung</th><th class="n">Durchfluss</th><th>Zustand</th><th></th>
                    </tr>
                  </thead>
                  <tbody>${d.valves.map((v) => this.renderValveRow(v))}</tbody>
                </table>
              </div>`
            : html`<p class="hint">Noch kein Ventil. „Ventil hinzufügen“ und das Gerät wählen, den Rest schlägt der Bewässerungsplaner vor.</p>`}
        </section>
        ${this.renderSensors()}
        <p class="hint small">
          Neue Ventile, Zonen und Sensoren brauchen ein Neuladen des Bewässerungsplaners; das passiert beim Speichern
          von selbst (nur wenn gerade nicht gegossen wird). Die Lage auf dem Plan und die Leitung zeichnest du auf der Seite „Plan“.
        </p>
      </div>
    `;
  }

  private renderValveRow(v: ValveInfo): TemplateResult {
    const d = this.data!;
    const safety = safetyText(v);
    const zones = d.zones.filter((z) => v.zone_ids.includes(z.id)).map((z) => z.name);
    const supply = d.supplies.find((s) => s.id === v.water_supply_id)?.name ?? "–";
    const editing = this.draft?.valve_id === v.id;
    const testing = this.testFor === v.id;
    const flow = v.learned_flow_l_min != null ? `${v.learned_flow_l_min.toFixed(1)} L/min` : "–";
    return html`
      <tr class=${editing ? "selected" : ""}>
        <td><strong>${v.name}</strong></td>
        <td class="device-cell">
          ${v.device_name ?? html`<span class="bad-text">Gerät fehlt</span>`}
          ${v.manufacturer || v.model ? html`<br /><small class="hint">${[v.manufacturer, v.model].filter(Boolean).join(" ")}</small>` : nothing}
        </td>
        <td>${DRIVER_LABELS[v.driver]?.split(" (")[0] ?? v.driver}${v.profile ? html`<br /><small class="hint">Profil ${d.profiles.find((p) => p.id === v.profile)?.name ?? v.profile}</small>` : nothing}</td>
        <td><span class="pill ${safety.level}">${safety.level === "ok" ? "🟢" : "🟡"} ${safety.text}</span></td>
        <td>${zones.length ? zones.join(", ") : html`<span class="hint">keine</span>`}</td>
        <td>${supply}</td>
        <td class="n" title="Gelernter Durchfluss">${flow}</td>
        <td>
          ${shortState(v.state)}
          ${v.battery != null && v.battery !== "unknown" ? html`<br /><small class="hint">Batterie ${shortState(v.battery, "%")}</small>` : nothing}
        </td>
        <td class="row-actions">
          <button class="text small" ?disabled=${d.busy} @click=${() => (editing ? (this.draft = null) : void this.edit(v))}>
            ${editing ? "Schließen" : "Ändern"}
          </button>
          <button class="text small" ?disabled=${d.busy || this.testing}
            @click=${() => ((this.testFor = testing ? null : v.id), (this.testResult = null), (this.draft = null))}>Testlauf</button>
        </td>
      </tr>
      ${editing ? html`<tr class="editor-row"><td colspan="9">${this.renderValveEditor(this.draft!)}</td></tr>` : nothing}
      ${testing ? html`<tr class="editor-row"><td colspan="9">${this.renderTest(v)}</td></tr>` : nothing}
    `;
  }

  private renderTest(v: ValveInfo): TemplateResult {
    const d = this.data!;
    const r = this.testResult?.valve === v.id ? this.testResult : null;
    return html`
      <div class="editor test-box">
        <h3>Testlauf „${v.name}“</h3>
        <p class="note warn">
          Das Ventil wird wirklich geöffnet und Wasser läuft. Danach wird geprüft, ob das Gerät von selbst schließt;
          zur Sicherheit schließt Home Assistant auf jeden Fall. Erlaubt sind ${d.test_min_s} bis ${d.test_max_s} Sekunden.
        </p>
        <div class="fields">
          <label class="field"><span>Dauer</span>
            <input type="number" min=${d.test_min_s} max=${d.test_max_s} step="1" .value=${String(this.testSeconds)}
              @change=${(e: Event) => {
                const n = Math.round(Number((e.target as HTMLInputElement).value) || d.test_min_s);
                this.testSeconds = Math.min(d.test_max_s, Math.max(d.test_min_s, n));
              }} />
            <span class="unit">s</span></label>
          <span class="field"></span>
        </div>
        ${this.testing
          ? html`<p class="note"><span class="spinner inline"></span> Testlauf läuft … Das dauert etwa ${this.testSeconds + 15} s.</p>`
          : nothing}
        ${r
          ? html`<p class="note ${r.level === "ok" ? "" : "warn"}">
              ${r.level === "ok" ? "🟢" : r.level === "warn" ? "🟡" : "🔴"} ${r.text}
              ${r.seconds ? html`<br />Durchfluss: ${r.flow_l_min != null ? `${r.flow_l_min.toFixed(1)} L/min` : "kein Messwert"}.
                Ventil wieder zu: ${r.closed_ok ? "ja" : html`<strong>NEIN, bitte sofort von Hand prüfen!</strong>`}` : nothing}
            </p>`
          : nothing}
        <div class="actions">
          <span class="spacer"></span>
          <button class="text" ?disabled=${this.testing} @click=${() => ((this.testFor = null), (this.testResult = null))}>Schließen</button>
          <button class="primary" ?disabled=${this.testing || d.busy} @click=${() => this.runTest(v)}>
            <ha-icon icon="mdi:water"></ha-icon>${r ? "Noch einmal testen" : `Jetzt ${this.testSeconds} s testen`}
          </button>
        </div>
      </div>
    `;
  }

  private renderDevicePicker(): TemplateResult {
    const q = this.filter.trim().toLowerCase();
    const list = this.data!.candidates.filter(
      (c) => !q || `${c.name} ${c.manufacturer ?? ""} ${c.model ?? ""} ${c.area ?? ""}`.toLowerCase().includes(q),
    );
    const valveName = (id: string) => this.data!.valves.find((v) => v.id === id)?.name ?? id;
    return html`
      <label class="field wide"><span>1. Gerät wählen</span>
        <input type="search" placeholder="Suchen: Name, Hersteller, Raum …" .value=${this.filter}
          @input=${(e: Event) => (this.filter = (e.target as HTMLInputElement).value)} /></label>
      ${list.length
        ? html`<div class="device-list">
            ${list.map(
              (c) => html`<button class="device-pick ${c.used_by ? "used" : ""}" @click=${() => this.pickDevice(c.device_id)}>
                <ha-icon icon=${c.profile ? "mdi:water-check" : "mdi:valve"}></ha-icon>
                <span class="grow"><strong>${c.name}</strong>
                  <small>${[c.manufacturer, c.model, c.area].filter(Boolean).join(" · ") || "unbekanntes Gerät"}</small></span>
                ${c.profile ? html`<span class="pill ok">Profil ${c.profile}</span>` : nothing}
                ${c.used_by ? html`<span class="pill">schon Ventil „${valveName(c.used_by)}“</span>` : nothing}
              </button>`,
            )}
          </div>`
        : html`<p class="hint">Kein passendes Gerät. Ventile brauchen eine Schalter- oder Ventil-Entität in Home Assistant
            (z. B. über Zigbee2MQTT oder ZHA eingebunden).</p>`}
    `;
  }

  private renderValveEditor(d: ValveDraft): TemplateResult {
    const data = this.data!;
    const update = () => (this.draft = { ...d });
    if (!d.device_id) {
      return html`<div class="editor">
        ${this.renderDevicePicker()}
        <div class="actions"><span class="spacer"></span>
          <button class="text" @click=${() => (this.draft = null)}>Abbrechen</button></div>
      </div>`;
    }
    const profiles = data.profiles.filter((p) => p.driver === d.driver);
    const known = new Set(this.deviceEntities.map((e) => e.entity_id));
    const opts = d.driver_options;
    const setOpt = (key: string, value: unknown) => ((d.driver_options = { ...opts, [key]: value }), update());
    const canSave = !!d.name.trim() && !!d.entities.valve && !!d.driver && !this.saving && !data.busy;
    const deviceName = data.candidates.find((c) => c.device_id === d.device_id)?.name
      ?? data.valves.find((v) => v.device_id === d.device_id)?.device_name ?? "Gerät";
    return html`
      <div class="editor">
        <div class="device-head">
          <ha-icon icon="mdi:valve"></ha-icon>
          <strong>${deviceName}</strong>
          ${d.detected ? html`<span class="pill ok">Erkannt: ${d.detected}</span>` : nothing}
          <span class="spacer"></span>
          ${!d.valve_id ? html`<button class="text small" @click=${() => ((d.device_id = ""), update())}>anderes Gerät</button>` : nothing}
        </div>
        ${d.detected
          ? html`<p class="hint small">Alles unten ist schon vorausgefüllt. Meist reicht es, Zone und Wasserversorgung zu prüfen und zu speichern.</p>`
          : nothing}

        <div class="fields">
          <label class="field"><span>Name</span>
            <input .value=${d.name} maxlength="60" @input=${(e: Event) => ((d.name = (e.target as HTMLInputElement).value), update())} /></label>
          <label class="field"><span>Treiber</span>
            <select @change=${(e: Event) => {
              d.driver = (e.target as HTMLSelectElement).value;
              if (d.profile && !data.profiles.some((p) => p.id === d.profile && p.driver === d.driver)) d.profile = null;
              update();
            }}>
              ${data.drivers.map((x) => html`<option value=${x} ?selected=${x === d.driver}>${DRIVER_LABELS[x] ?? x}</option>`)}
            </select></label>
          <label class="field"><span>Geräteprofil</span>
            <select @change=${(e: Event) => ((d.profile = (e.target as HTMLSelectElement).value || null), update())}>
              <option value="" ?selected=${!d.profile}>(keins)</option>
              ${profiles.map((p) => html`<option value=${p.id} ?selected=${p.id === d.profile}>${p.name}</option>`)}
            </select></label>
        </div>

        <div class="table-wrap">
          <table class="roles">
            <thead><tr><th>Aufgabe</th><th>Entität</th><th class="n">Wert jetzt</th></tr></thead>
            <tbody>
              ${ROLES.map((role) => {
                const choices = roleCandidates(this.deviceEntities, role);
                const current = d.entities[role] ?? "";
                const info = this.deviceEntities.find((e) => e.entity_id === current);
                const live = current ? this.hass?.states?.[current] : undefined;
                return html`<tr>
                  <td><strong>${ROLE_LABELS[role].name}</strong><br /><small class="hint">${ROLE_LABELS[role].hint}</small></td>
                  <td>
                    <select @change=${(e: Event) => ((d.entities = { ...d.entities, [role]: (e.target as HTMLSelectElement).value || null }), update())}>
                      <option value="" ?selected=${!current}>${role === "valve" ? "(bitte wählen)" : "(keine)"}</option>
                      ${current && !known.has(current) ? html`<option value=${current} selected>${current}</option>` : nothing}
                      ${choices.map((c) => html`<option value=${c.entity_id} ?selected=${c.entity_id === current}>${c.name} (${c.entity_id})</option>`)}
                    </select>
                  </td>
                  <td class="n">${shortState(live?.state ?? info?.state, String(live?.attributes.unit_of_measurement ?? info?.unit ?? ""))}</td>
                </tr>`;
              })}
            </tbody>
          </table>
        </div>

        ${d.driver === "zigbee2mqtt"
          ? html`<div class="fields">
              <label class="field"><span>Name in Zigbee2MQTT</span>
                <input .value=${String(opts.friendly_name ?? "")} @input=${(e: Event) => setOpt("friendly_name", (e.target as HTMLInputElement).value)} /></label>
              <label class="field"><span>MQTT-Basisthema</span>
                <input .value=${String(opts.base_topic ?? "zigbee2mqtt")} @input=${(e: Event) => setOpt("base_topic", (e.target as HTMLInputElement).value)} /></label>
            </div>
            <p class="hint small">Beim Öffnen geht die Dauer mit ans Gerät (<code>{"state":"ON","on_time":…}</code>), damit es auch ohne Home Assistant schließt.</p>`
          : nothing}
        ${d.driver === "service_call" ? this.renderServiceOptions(d, setOpt) : nothing}

        <h3>2. Zuordnen</h3>
        <div class="fields">
          <label class="field"><span>Wasserversorgung</span>
            <select @change=${(e: Event) => ((d.water_supply_id = (e.target as HTMLSelectElement).value), update())}>
              ${data.supplies.map((s) => html`<option value=${s.id} ?selected=${s.id === d.water_supply_id}>${s.name}</option>`)}
              <option value=${NEW} ?selected=${d.water_supply_id === NEW}>Neue Wasserversorgung …</option>
            </select></label>
          ${d.water_supply_id === NEW
            ? html`<label class="field"><span>Name der neuen Versorgung</span>
                <input .value=${d.new_supply_name} @input=${(e: Event) => ((d.new_supply_name = (e.target as HTMLInputElement).value), update())} /></label>`
            : html`<span class="field"></span>`}
        </div>
        <p class="hint small">Je Wasserversorgung ist immer nur ein Ventil gleichzeitig offen.</p>
        ${data.zones.length
          ? html`<div class="field wide"><span>Zonen an diesem Ventil</span>
              <div class="zone-pick">
                ${data.zones.map((z) => {
                  const on = d.zone_ids.includes(z.id);
                  const other = !on && z.valve_id && z.valve_id !== d.valve_id
                    ? data.valves.find((v) => v.id === z.valve_id)?.name
                    : null;
                  return html`<button class=${on ? "active" : ""} title=${other ? `hängt jetzt an „${other}“` : ""}
                    @click=${() => ((d.zone_ids = on ? d.zone_ids.filter((x) => x !== z.id) : [...d.zone_ids, z.id]), update())}>
                    ${z.name}${other ? html` <small>(${other})</small>` : nothing}</button>`;
                })}
              </div></div>`
          : nothing}
        <div class="fields">
          <label class="field"><span>Neue Zone anlegen (leer = keine)</span>
            <input .value=${d.new_zone_name} placeholder="z. B. Hochbeet" maxlength="60"
              @input=${(e: Event) => ((d.new_zone_name = (e.target as HTMLInputElement).value), update())} /></label>
          <label class="field"><span>Gießdauer der neuen Zone</span>
            <input type="number" min="0" max="120" step="1" .value=${String(d.new_zone_minutes)} ?disabled=${!d.new_zone_name.trim()}
              @change=${(e: Event) => ((d.new_zone_minutes = Math.max(0, Number((e.target as HTMLInputElement).value) || 0)), update())} />
            <span class="unit">min</span></label>
        </div>

        <div class="actions">
          ${d.valve_id ? html`<button class="text danger" ?disabled=${data.busy} @click=${() => this.deleteValve(d)}><ha-icon icon="mdi:delete-outline"></ha-icon>Löschen</button>` : nothing}
          <span class="spacer"></span>
          <button class="text" @click=${() => (this.draft = null)}>Abbrechen</button>
          <button class="primary" ?disabled=${!canSave} @click=${this.saveValve}>${d.valve_id ? "Speichern" : "Ventil anlegen"}</button>
        </div>
        ${!d.entities.valve ? html`<p class="hint small">Zum Speichern fehlt die Entität zum Schalten.</p>` : nothing}
      </div>
    `;
  }

  private renderServiceOptions(d: ValveDraft, setOpt: (key: string, value: unknown) => void): TemplateResult {
    const opts = d.driver_options;
    const json = (key: string, fallback: unknown) => JSON.stringify(opts[key] ?? fallback);
    const setJson = (key: string) => (e: Event) => {
      const input = e.target as HTMLInputElement;
      try {
        setOpt(key, JSON.parse(input.value || "{}"));
        input.setCustomValidity("");
      } catch {
        input.setCustomValidity("Kein gültiges JSON");
        input.reportValidity();
      }
    };
    return html`
      <div class="fields">
        <label class="field"><span>Dienst zum Öffnen (domain.dienst)</span>
          <input .value=${String(opts.open_service ?? "")} @input=${(e: Event) => setOpt("open_service", (e.target as HTMLInputElement).value)} /></label>
        <label class="field"><span>Daten zum Öffnen (JSON, mit {duration})</span>
          <input .value=${json("open_data", { duration: "{duration}" })} @change=${setJson("open_data")} /></label>
      </div>
      <div class="fields">
        <label class="field"><span>Dienst zum Schließen</span>
          <input .value=${String(opts.close_service ?? "")} @input=${(e: Event) => setOpt("close_service", (e.target as HTMLInputElement).value)} /></label>
        <label class="field"><span>Daten zum Schließen (JSON)</span>
          <input .value=${json("close_data", {})} @change=${setJson("close_data")} /></label>
      </div>
      <div class="fields">
        <label class="field"><span>Einheit der Dauer</span>
          <select @change=${(e: Event) => setOpt("duration_unit", (e.target as HTMLSelectElement).value)}>
            <option value="s" ?selected=${opts.duration_unit !== "min"}>Sekunden</option>
            <option value="min" ?selected=${opts.duration_unit === "min"}>Minuten</option>
          </select></label>
        <label class="check field"><input type="checkbox" .checked=${!!opts.device_timer}
          @change=${(e: Event) => setOpt("device_timer", (e.target as HTMLInputElement).checked)} />
          Gerät schließt nach der Dauer selbst</label>
      </div>
    `;
  }

  private renderSensors(): TemplateResult {
    const d = this.data!;
    const zoneNames = (ids: string[]) => d.zones.filter((z) => ids.includes(z.id)).map((z) => z.name).join(", ");
    const s = this.sensorDraft;
    return html`
      <section class="card">
        <div class="section-head">
          <h2>Sensoren</h2>
          <span class="spacer"></span>
          <button class="text" ?disabled=${d.busy || (s !== null && !s.sensor_id)}
            @click=${() => ((this.draft = null), (this.sensorDraft = { sensor_id: null, name: "", kind: "soil_moisture", entity_id: "", zone_ids: [], field_capacity_pct: 35, wilting_point_pct: 12 }))}>
            <ha-icon icon="mdi:plus"></ha-icon>Sensor hinzufügen
          </button>
        </div>
        <p class="hint small">Bodenfeuchte ersetzt für ihre Zonen die Schätzung. Ein Regensensor (mm) ohne Zonen gilt für den ganzen Garten.</p>
        ${s && !s.sensor_id ? this.renderSensorEditor(s) : nothing}
        ${d.sensors.length
          ? html`<div class="table-wrap"><table>
              <thead><tr><th>Name</th><th>Art</th><th>Entität</th><th class="n">Wert</th><th>Zonen</th><th class="n">Voll / leer</th><th></th></tr></thead>
              <tbody>
                ${d.sensors.map((x) => {
                  const editing = s?.sensor_id === x.id;
                  return html`<tr class=${editing ? "selected" : ""}>
                      <td><strong>${x.name}</strong></td>
                      <td>${KIND_LABELS[x.kind] ?? x.kind}</td>
                      <td><small>${x.entity_id ?? html`<span class="bad-text">fehlt</span>`}</small></td>
                      <td class="n">${shortState(x.state, x.kind === "rain_mm" ? "mm" : "%")}</td>
                      <td>${zoneNames(x.zone_ids) || (x.kind === "rain_mm" ? "ganzer Garten" : html`<span class="hint">keine</span>`)}</td>
                      <td class="n">${x.kind === "soil_moisture" ? `${x.field_capacity_pct} / ${x.wilting_point_pct} %` : "–"}</td>
                      <td class="row-actions"><button class="text small" ?disabled=${d.busy}
                        @click=${() => (this.sensorDraft = editing ? null : { sensor_id: x.id, name: x.name, kind: x.kind, entity_id: x.entity_id ?? "", zone_ids: [...x.zone_ids], field_capacity_pct: x.field_capacity_pct, wilting_point_pct: x.wilting_point_pct })}>
                        ${editing ? "Schließen" : "Ändern"}</button></td>
                    </tr>
                    ${editing ? html`<tr class="editor-row"><td colspan="7">${this.renderSensorEditor(s!)}</td></tr>` : nothing}`;
                })}
              </tbody></table></div>`
          : html`<p class="hint">Keine Sensoren. Ohne Sensoren schätzt der Bewässerungsplaner aus dem Wetter.</p>`}
      </section>
    `;
  }

  private renderSensorEditor(s: SensorDraft): TemplateResult {
    const d = this.data!;
    const update = () => (this.sensorDraft = { ...s });
    const entities = this.sensorEntities();
    const canSave = !!s.name.trim() && !!s.entity_id && !this.saving && !d.busy;
    return html`
      <div class="editor">
        <div class="fields">
          <label class="field"><span>Name</span>
            <input .value=${s.name} maxlength="60" @input=${(e: Event) => ((s.name = (e.target as HTMLInputElement).value), update())} /></label>
          <label class="field"><span>Art</span>
            <select @change=${(e: Event) => ((s.kind = (e.target as HTMLSelectElement).value), update())}>
              ${Object.entries(KIND_LABELS).map(([k, label]) => html`<option value=${k} ?selected=${k === s.kind}>${label}</option>`)}
            </select></label>
        </div>
        <label class="field wide"><span>Entität</span>
          <select @change=${(e: Event) => {
            s.entity_id = (e.target as HTMLSelectElement).value;
            if (!s.name.trim()) s.name = entities.find((x) => x.entity_id === s.entity_id)?.name ?? "";
            update();
          }}>
            <option value="" ?selected=${!s.entity_id}>(bitte wählen)</option>
            ${entities.map((x) => html`<option value=${x.entity_id} ?selected=${x.entity_id === s.entity_id}>${x.name}${x.unit ? ` (${x.unit})` : ""} – ${x.entity_id}</option>`)}
          </select></label>
        ${d.zones.length
          ? html`<div class="field wide"><span>Zonen</span><div class="zone-pick">
              ${d.zones.map((z) => {
                const on = s.zone_ids.includes(z.id);
                return html`<button class=${on ? "active" : ""} @click=${() => ((s.zone_ids = on ? s.zone_ids.filter((x) => x !== z.id) : [...s.zone_ids, z.id]), update())}>${z.name}</button>`;
              })}
            </div></div>`
          : nothing}
        ${s.kind === "soil_moisture"
          ? html`<div class="fields">
              <label class="field"><span>Messwert bei „voll“ (Feldkapazität)</span>
                <input type="number" min="1" max="100" .value=${String(s.field_capacity_pct)}
                  @change=${(e: Event) => ((s.field_capacity_pct = Number((e.target as HTMLInputElement).value) || 35), update())} />
                <span class="unit">%</span></label>
              <label class="field"><span>Messwert bei „leer“ (Welkepunkt)</span>
                <input type="number" min="0" max="99" .value=${String(s.wilting_point_pct)}
                  @change=${(e: Event) => ((s.wilting_point_pct = Number((e.target as HTMLInputElement).value) || 0), update())} />
                <span class="unit">%</span></label>
            </div>`
          : nothing}
        <div class="actions">
          ${s.sensor_id ? html`<button class="text danger" ?disabled=${d.busy} @click=${() => this.deleteSensor(s)}><ha-icon icon="mdi:delete-outline"></ha-icon>Entfernen</button>` : nothing}
          <span class="spacer"></span>
          <button class="text" @click=${() => (this.sensorDraft = null)}>Abbrechen</button>
          <button class="primary" ?disabled=${!canSave} @click=${this.saveSensor}>Speichern</button>
        </div>
      </div>
    `;
  }
}
