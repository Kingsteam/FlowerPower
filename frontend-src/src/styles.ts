import { css } from "lit";

// Farben kommen aus dem Theme von Home Assistant (hell und dunkel).
export const styles = css`
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
    stroke-width: 2;
    stroke-dasharray: 2 4;
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
    stroke: color-mix(in srgb, var(--zone) 35%, transparent);
    stroke-linecap: round;
    stroke-linejoin: round;
    cursor: pointer;
  }
  .zone:hover polyline.hose-band,
  .zone.selected polyline.hose-band {
    stroke: color-mix(in srgb, var(--zone) 50%, transparent);
  }
  .zone polyline.hose-line {
    fill: none;
    stroke: var(--zone);
    stroke-width: 2.5;
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
  .valve-link {
    stroke: var(--zone);
    stroke-width: 1.5;
    opacity: 0.55;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .valve-link.selected {
    stroke-width: 3;
    opacity: 1;
  }
  .feature-draft polyline {
    fill: rgba(120, 120, 120, 0.06);
    stroke: var(--accent);
    stroke-width: 2;
    stroke-dasharray: 6 4;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .feature-draft circle {
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
`;
