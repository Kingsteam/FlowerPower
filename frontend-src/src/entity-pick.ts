// Auswahl einer Entität mit Suche: Eingabefeld, darunter eine Liste mit
// Name, entity_id und aktuellem Wert. Passende Entitäten (z. B. Temperatur
// bei einem Temperaturfühler) stehen oben, alle anderen lassen sich mit
// „Alle anzeigen“ dazunehmen.

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Hass } from "./types";

export interface EntityOption {
  entity_id: string;
  name: string;
  state: string;
  unit: string;
  device_class: string;
  match: boolean; // passt zur gesuchten Art
}

export interface EntityFilter {
  domains: string[];
  deviceClasses?: string[];
  units?: string[];
}

/** Alle Entitäten der Domains, passende zuerst, dann nach Name. */
export function entityOptions(states: Hass["states"], filter: EntityFilter): EntityOption[] {
  const options: EntityOption[] = [];
  for (const [id, s] of Object.entries(states ?? {})) {
    const domain = id.split(".")[0];
    if (!filter.domains.includes(domain) || id.startsWith("sensor.irrigation_planner")) continue;
    const unit = String(s.attributes.unit_of_measurement ?? "");
    const deviceClass = String(s.attributes.device_class ?? "");
    const hasFilter = !!(filter.deviceClasses?.length || filter.units?.length);
    const match =
      !hasFilter ||
      !!filter.deviceClasses?.includes(deviceClass) ||
      !!(unit && filter.units?.includes(unit));
    options.push({
      entity_id: id,
      name: String(s.attributes.friendly_name ?? id),
      state: s.state,
      unit,
      device_class: deviceClass,
      match,
    });
  }
  return options.sort(
    (a, b) => Number(b.match) - Number(a.match) || a.name.localeCompare(b.name, "de"),
  );
}

/** Suche in Name und entity_id; alle Wörter müssen vorkommen. */
export function searchOptions(options: EntityOption[], query: string): EntityOption[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return options;
  return options.filter((o) => {
    const text = `${o.name} ${o.entity_id}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

const MAX_SHOWN = 60;

@customElement("ip-entity-pick")
export class EntityPick extends LitElement {
  static styles = css`
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

  @property({ attribute: false }) hass?: Hass;
  @property() value = "";
  @property({ attribute: false }) filter: EntityFilter = { domains: ["sensor"] };
  @property() placeholder = "Suchen: Name oder Entität …";

  @state() private open = false;
  @state() private query = "";
  @state() private showAll = false;
  @state() private active = 0;

  private visible(): EntityOption[] {
    const all = searchOptions(entityOptions(this.hass?.states, this.filter), this.query);
    // Ohne Suche zuerst nur die passenden; mit Suchtext immer alle Treffer.
    return this.showAll || this.query.trim() ? all : all.filter((o) => o.match);
  }

  private choose(entityId: string): void {
    this.value = entityId;
    this.open = false;
    this.query = "";
    this.dispatchEvent(new CustomEvent("value-changed", { detail: { value: entityId }, bubbles: true, composed: true }));
  }

  private openList(): void {
    this.open = true;
    this.active = 0;
    void this.updateComplete.then(() => this.shadowRoot?.querySelector("input")?.focus());
  }

  private onKey(e: KeyboardEvent, list: EntityOption[]): void {
    if (e.key === "ArrowDown") {
      this.active = Math.min(list.length - 1, this.active + 1);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      this.active = Math.max(0, this.active - 1);
      e.preventDefault();
    } else if (e.key === "Enter" && list[this.active]) {
      this.choose(list[this.active].entity_id);
      e.preventDefault();
    } else if (e.key === "Escape") {
      this.open = false;
    }
  }

  private fmt(o: { state: string; unit: string }): string {
    if (o.state === "unavailable") return "nicht erreichbar";
    if (o.state === "unknown") return "–";
    return o.unit ? `${o.state} ${o.unit}` : o.state;
  }

  protected render(): TemplateResult {
    const current = this.value ? this.hass?.states?.[this.value] : undefined;
    if (!this.open) {
      return html`<div class="box" @click=${this.openList}>
        ${this.value
          ? html`<span class="chosen"
                ><span>${String(current?.attributes.friendly_name ?? this.value)}</span><small>${this.value}</small></span
              >${current
                ? html`<span class="value"
                    >${this.fmt({ state: current.state, unit: String(current.attributes.unit_of_measurement ?? "") })}</span
                  >`
                : nothing}
              <button title="Andere wählen" @click=${(e: Event) => (e.stopPropagation(), this.openList())}>ändern</button>`
          : html`<span class="chosen"><small>(bitte wählen)</small></span><button>wählen</button>`}
      </div>`;
    }
    const list = this.visible();
    const shown = list.slice(0, MAX_SHOWN);
    const hiddenOther = !this.showAll && !this.query.trim();
    let firstOther = shown.findIndex((o) => !o.match);
    return html`
      <div class="box open">
        <input
          .value=${this.query}
          placeholder=${this.placeholder}
          @input=${(e: Event) => ((this.query = (e.target as HTMLInputElement).value), (this.active = 0))}
          @keydown=${(e: KeyboardEvent) => this.onKey(e, shown)}
          @blur=${() => setTimeout(() => (this.open = false), 200)}
        />
        <button @mousedown=${(e: Event) => e.preventDefault()} @click=${() => (this.open = false)}>schließen</button>
      </div>
      <div class="list" @mousedown=${(e: Event) => e.preventDefault()}>
        ${shown.length ? nothing : html`<div class="empty">Nichts gefunden.</div>`}
        ${shown.map((o, i) => {
          const sep = i === firstOther && i > 0 ? html`<div class="sep">Weitere Entitäten</div>` : nothing;
          if (i === firstOther) firstOther = -1;
          return html`${sep}<button class="item ${i === this.active ? "active" : ""} ${o.match ? "" : "other"}"
              @click=${() => this.choose(o.entity_id)}>
              <span class="text"><span>${o.name}</span><small>${o.entity_id}</small></span>
              <span class="value">${this.fmt(o)}</span>
            </button>`;
        })}
        ${list.length > MAX_SHOWN ? html`<div class="empty">… ${list.length - MAX_SHOWN} weitere, bitte genauer suchen.</div>` : nothing}
        ${hiddenOther ? html`<button class="more" @click=${() => (this.showAll = true)}>Alle Entitäten anzeigen</button>` : nothing}
      </div>
    `;
  }
}
