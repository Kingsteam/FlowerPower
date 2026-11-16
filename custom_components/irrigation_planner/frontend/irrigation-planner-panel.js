/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const F = globalThis, Q = F.ShadowRoot && (F.ShadyCSS === void 0 || F.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, tt = Symbol(), ct = /* @__PURE__ */ new WeakMap();
let Mt = class {
  constructor(t, s, i) {
    if (this._$cssResult$ = !0, i !== tt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = s;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (Q && t === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (t = ct.get(s)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && ct.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const It = (e) => new Mt(typeof e == "string" ? e : e + "", void 0, tt), Ut = (e, ...t) => {
  const s = e.length === 1 ? e[0] : t.reduce((i, n, r) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + e[r + 1], e[0]);
  return new Mt(s, e, tt);
}, Dt = (e, t) => {
  if (Q) e.adoptedStyleSheets = t.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of t) {
    const i = document.createElement("style"), n = F.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = s.cssText, e.appendChild(i);
  }
}, ht = Q ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let s = "";
  for (const i of t.cssRules) s += i.cssText;
  return It(s);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Ht, defineProperty: Lt, getOwnPropertyDescriptor: jt, getOwnPropertyNames: Zt, getOwnPropertySymbols: Vt, getPrototypeOf: Ft } = Object, K = globalThis, dt = K.trustedTypes, Gt = dt ? dt.emptyScript : "", Wt = K.reactiveElementPolyfillSupport, I = (e, t) => e, G = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Gt : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let s = e;
  switch (t) {
    case Boolean:
      s = e !== null;
      break;
    case Number:
      s = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(e);
      } catch {
        s = null;
      }
  }
  return s;
} }, et = (e, t) => !Ht(e, t), pt = { attribute: !0, type: String, converter: G, reflect: !1, useDefault: !1, hasChanged: et };
Symbol.metadata ??= Symbol("metadata"), K.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let P = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, s = pt) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(t, i, s);
      n !== void 0 && Lt(this.prototype, t, n);
    }
  }
  static getPropertyDescriptor(t, s, i) {
    const { get: n, set: r } = jt(this.prototype, t) ?? { get() {
      return this[s];
    }, set(o) {
      this[s] = o;
    } };
    return { get: n, set(o) {
      const a = n?.call(this);
      r?.call(this, o), this.requestUpdate(t, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? pt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(I("elementProperties"))) return;
    const t = Ft(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(I("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(I("properties"))) {
      const s = this.properties, i = [...Zt(s), ...Vt(s)];
      for (const n of i) this.createProperty(n, s[n]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const s = litPropertyMetadata.get(t);
      if (s !== void 0) for (const [i, n] of s) this.elementProperties.set(i, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, i] of this.elementProperties) {
      const n = this._$Eu(s, i);
      n !== void 0 && this._$Eh.set(n, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const s = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const n of i) s.unshift(ht(n));
    } else t !== void 0 && s.push(ht(t));
    return s;
  }
  static _$Eu(t, s) {
    const i = s.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Dt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, s, i) {
    this._$AK(t, i);
  }
  _$ET(t, s) {
    const i = this.constructor.elementProperties.get(t), n = this.constructor._$Eu(t, i);
    if (n !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : G).toAttribute(s, i.type);
      this._$Em = t, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
    }
  }
  _$AK(t, s) {
    const i = this.constructor, n = i._$Eh.get(t);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : G;
      this._$Em = n;
      const a = o.fromAttribute(s, r.type);
      this[n] = a ?? this._$Ej?.get(n) ?? a, this._$Em = null;
    }
  }
  requestUpdate(t, s, i, n = !1, r) {
    if (t !== void 0) {
      const o = this.constructor;
      if (n === !1 && (r = this[t]), i ??= o.getPropertyOptions(t), !((i.hasChanged ?? et)(r, s) || i.useDefault && i.reflect && r === this._$Ej?.get(t) && !this.hasAttribute(o._$Eu(t, i)))) return;
      this.C(t, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, s, { useDefault: i, reflect: n, wrapped: r }, o) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, o ?? s ?? this[t]), r !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), n === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [n, r] of this._$Ep) this[n] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [n, r] of i) {
        const { wrapped: o } = r, a = this[n];
        o !== !0 || this._$AL.has(n) || a === void 0 || this.C(n, void 0, r, a);
      }
    }
    let t = !1;
    const s = this._$AL;
    try {
      t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(s);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((s) => s.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((s) => this._$ET(s, this[s])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
P.elementStyles = [], P.shadowRootOptions = { mode: "open" }, P[I("elementProperties")] = /* @__PURE__ */ new Map(), P[I("finalized")] = /* @__PURE__ */ new Map(), Wt?.({ ReactiveElement: P }), (K.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const st = globalThis, ut = (e) => e, W = st.trustedTypes, gt = W ? W.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, zt = "$lit$", w = `lit$${Math.random().toFixed(9).slice(2)}$`, St = "?" + w, Kt = `<${St}>`, z = document, D = () => z.createComment(""), H = (e) => e === null || typeof e != "object" && typeof e != "function", it = Array.isArray, qt = (e) => it(e) || typeof e?.[Symbol.iterator] == "function", X = `[ 	
\f\r]`, B = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, mt = /-->/g, ft = />/g, A = RegExp(`>|${X}(?:([^\\s"'>=/]+)(${X}*=${X}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), $t = /'/g, bt = /"/g, Et = /^(?:script|style|textarea|title)$/i, Pt = (e) => (t, ...s) => ({ _$litType$: e, strings: t, values: s }), h = Pt(1), g = Pt(2), T = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), vt = /* @__PURE__ */ new WeakMap(), M = z.createTreeWalker(z, 129);
function Tt(e, t) {
  if (!it(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return gt !== void 0 ? gt.createHTML(t) : t;
}
const Jt = (e, t) => {
  const s = e.length - 1, i = [];
  let n, r = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = B;
  for (let a = 0; a < s; a++) {
    const l = e[a];
    let d, p, u = -1, v = 0;
    for (; v < l.length && (o.lastIndex = v, p = o.exec(l), p !== null); ) v = o.lastIndex, o === B ? p[1] === "!--" ? o = mt : p[1] !== void 0 ? o = ft : p[2] !== void 0 ? (Et.test(p[2]) && (n = RegExp("</" + p[2], "g")), o = A) : p[3] !== void 0 && (o = A) : o === A ? p[0] === ">" ? (o = n ?? B, u = -1) : p[1] === void 0 ? u = -2 : (u = o.lastIndex - p[2].length, d = p[1], o = p[3] === void 0 ? A : p[3] === '"' ? bt : $t) : o === bt || o === $t ? o = A : o === mt || o === ft ? o = B : (o = A, n = void 0);
    const y = o === A && e[a + 1].startsWith("/>") ? " " : "";
    r += o === B ? l + Kt : u >= 0 ? (i.push(d), l.slice(0, u) + zt + l.slice(u) + w + y) : l + w + (u === -2 ? a : y);
  }
  return [Tt(e, r + (e[s] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class L {
  constructor({ strings: t, _$litType$: s }, i) {
    let n;
    this.parts = [];
    let r = 0, o = 0;
    const a = t.length - 1, l = this.parts, [d, p] = Jt(t, s);
    if (this.el = L.createElement(d, i), M.currentNode = this.el.content, s === 2 || s === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (n = M.nextNode()) !== null && l.length < a; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const u of n.getAttributeNames()) if (u.endsWith(zt)) {
          const v = p[o++], y = n.getAttribute(u).split(w), k = /([.?@])?(.*)/.exec(v);
          l.push({ type: 1, index: r, name: k[2], strings: y, ctor: k[1] === "." ? Yt : k[1] === "?" ? Qt : k[1] === "@" ? te : q }), n.removeAttribute(u);
        } else u.startsWith(w) && (l.push({ type: 6, index: r }), n.removeAttribute(u));
        if (Et.test(n.tagName)) {
          const u = n.textContent.split(w), v = u.length - 1;
          if (v > 0) {
            n.textContent = W ? W.emptyScript : "";
            for (let y = 0; y < v; y++) n.append(u[y], D()), M.nextNode(), l.push({ type: 2, index: ++r });
            n.append(u[v], D());
          }
        }
      } else if (n.nodeType === 8) if (n.data === St) l.push({ type: 2, index: r });
      else {
        let u = -1;
        for (; (u = n.data.indexOf(w, u + 1)) !== -1; ) l.push({ type: 7, index: r }), u += w.length - 1;
      }
      r++;
    }
  }
  static createElement(t, s) {
    const i = z.createElement("template");
    return i.innerHTML = t, i;
  }
}
function C(e, t, s = e, i) {
  if (t === T) return t;
  let n = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const r = H(t) ? void 0 : t._$litDirective$;
  return n?.constructor !== r && (n?._$AO?.(!1), r === void 0 ? n = void 0 : (n = new r(e), n._$AT(e, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = n : s._$Cl = n), n !== void 0 && (t = C(e, n._$AS(e, t.values), n, i)), t;
}
class Xt {
  constructor(t, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: s }, parts: i } = this._$AD, n = (t?.creationScope ?? z).importNode(s, !0);
    M.currentNode = n;
    let r = M.nextNode(), o = 0, a = 0, l = i[0];
    for (; l !== void 0; ) {
      if (o === l.index) {
        let d;
        l.type === 2 ? d = new j(r, r.nextSibling, this, t) : l.type === 1 ? d = new l.ctor(r, l.name, l.strings, this, t) : l.type === 6 && (d = new ee(r, this, t)), this._$AV.push(d), l = i[++a];
      }
      o !== l?.index && (r = M.nextNode(), o++);
    }
    return M.currentNode = z, n;
  }
  p(t) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, s), s += i.strings.length - 2) : i._$AI(t[s])), s++;
  }
}
class j {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, s, i, n) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = t, this._$AB = s, this._$AM = i, this.options = n, this._$Cv = n?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && t?.nodeType === 11 && (t = s.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, s = this) {
    t = C(this, t, s), H(t) ? t === c || t == null || t === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : t !== this._$AH && t !== T && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : qt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== c && H(this._$AH) ? this._$AA.nextSibling.data = t : this.T(z.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: s, _$litType$: i } = t, n = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = L.createElement(Tt(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(s);
    else {
      const r = new Xt(n, this), o = r.u(this.options);
      r.p(s), this.T(o), this._$AH = r;
    }
  }
  _$AC(t) {
    let s = vt.get(t.strings);
    return s === void 0 && vt.set(t.strings, s = new L(t)), s;
  }
  k(t) {
    it(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, n = 0;
    for (const r of t) n === s.length ? s.push(i = new j(this.O(D()), this.O(D()), this, this.options)) : i = s[n], i._$AI(r), n++;
    n < s.length && (this._$AR(i && i._$AB.nextSibling, n), s.length = n);
  }
  _$AR(t = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); t !== this._$AB; ) {
      const i = ut(t).nextSibling;
      ut(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class q {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, s, i, n, r) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = t, this.name = s, this._$AM = n, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = c;
  }
  _$AI(t, s = this, i, n) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) t = C(this, t, s, 0), o = !H(t) || t !== this._$AH && t !== T, o && (this._$AH = t);
    else {
      const a = t;
      let l, d;
      for (t = r[0], l = 0; l < r.length - 1; l++) d = C(this, a[i + l], s, l), d === T && (d = this._$AH[l]), o ||= !H(d) || d !== this._$AH[l], d === c ? t = c : t !== c && (t += (d ?? "") + r[l + 1]), this._$AH[l] = d;
    }
    o && !n && this.j(t);
  }
  j(t) {
    t === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Yt extends q {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === c ? void 0 : t;
  }
}
class Qt extends q {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== c);
  }
}
class te extends q {
  constructor(t, s, i, n, r) {
    super(t, s, i, n, r), this.type = 5;
  }
  _$AI(t, s = this) {
    if ((t = C(this, t, s, 0) ?? c) === T) return;
    const i = this._$AH, n = t === c && i !== c || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, r = t !== c && (i === c || n);
    n && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class ee {
  constructor(t, s, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    C(this, t);
  }
}
const se = st.litHtmlPolyfillSupport;
se?.(L, j), (st.litHtmlVersions ??= []).push("3.3.3");
const ie = (e, t, s) => {
  const i = s?.renderBefore ?? t;
  let n = i._$litPart$;
  if (n === void 0) {
    const r = s?.renderBefore ?? null;
    i._$litPart$ = n = new j(t.insertBefore(D(), r), r, void 0, s ?? {});
  }
  return n._$AI(e), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const nt = globalThis;
class U extends P {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = ie(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return T;
  }
}
U._$litElement$ = !0, U.finalized = !0, nt.litElementHydrateSupport?.({ LitElement: U });
const ne = nt.litElementPolyfillSupport;
ne?.({ LitElement: U });
(nt.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const re = (e) => (t, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const oe = { attribute: !0, type: String, converter: G, reflect: !1, hasChanged: et }, ae = (e = oe, t, s) => {
  const { kind: i, metadata: n } = s;
  let r = globalThis.litPropertyMetadata.get(n);
  if (r === void 0 && globalThis.litPropertyMetadata.set(n, r = /* @__PURE__ */ new Map()), i === "setter" && ((e = Object.create(e)).wrapped = !0), r.set(s.name, e), i === "accessor") {
    const { name: o } = s;
    return { set(a) {
      const l = t.get.call(this);
      t.set.call(this, a), this.requestUpdate(o, l, e, !0, a);
    }, init(a) {
      return a !== void 0 && this.C(o, void 0, e, a), a;
    } };
  }
  if (i === "setter") {
    const { name: o } = s;
    return function(a) {
      const l = this[o];
      t.call(this, a), this.requestUpdate(o, l, e, !0, a);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function Ct(e) {
  return (t, s) => typeof s == "object" ? ae(e, t, s) : ((i, n, r) => {
    const o = n.hasOwnProperty(r);
    return n.constructor.createProperty(r, i), o ? Object.getOwnPropertyDescriptor(n, r) : void 0;
  })(e, t, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function b(e) {
  return Ct({ ...e, state: !0, attribute: !1 });
}
const S = 6378137, Ot = 256, R = Math.PI * S;
function le(e, t) {
  const s = Math.max(0, Math.min(360, t));
  return Math.PI * e * e * s / 360;
}
function ce(e) {
  if (e.length < 3) return 0;
  let t = 0;
  for (let s = 0; s < e.length; s++) {
    const [i, n] = e[s], [r, o] = e[(s + 1) % e.length];
    t += i * o - r * n;
  }
  return Math.abs(t) / 2;
}
function _(e, t, s) {
  const i = s * Math.PI / 180;
  return [e[0] + Math.sin(i) * t, e[1] - Math.cos(i) * t];
}
function yt(e, t) {
  return (Math.atan2(t[0] - e[0], -(t[1] - e[1])) * 180 / Math.PI + 360) % 360;
}
function Z(e, t) {
  return Math.hypot(e[0] - t[0], e[1] - t[1]);
}
function he(e, t, s, i) {
  const [n, r] = e;
  if (i >= 360)
    return `M ${n - t} ${r} a ${t} ${t} 0 1 0 ${2 * t} 0 a ${t} ${t} 0 1 0 ${-2 * t} 0 Z`;
  const [o, a] = _(e, t, s), [l, d] = _(e, t, s + i), p = i > 180 ? 1 : 0;
  return `M ${n} ${r} L ${o} ${a} A ${t} ${t} 0 ${p} 1 ${l} ${d} Z`;
}
function de(e) {
  const t = e.length || 1;
  return [e.reduce((s, i) => s + i[0], 0) / t, e.reduce((s, i) => s + i[1], 0) / t];
}
function pe(e, t) {
  return 2 * Math.PI * S * Math.cos(e * Math.PI / 180) / (Ot * 2 ** t);
}
function xt(e, t) {
  return Math.log2(
    2 * Math.PI * S * Math.cos(e * Math.PI / 180) * t / Ot
  );
}
function ue(e, t) {
  const [s, i] = t, n = 180 / Math.PI;
  return [
    s - e[1] / S * n,
    i + e[0] / (S * Math.cos(s / n)) * n
  ];
}
function ge(e, t, s, i, n = 200) {
  const [r, o] = t, a = Math.PI / 180, l = 1 / Math.cos(r * a), d = S * o * a, p = S * Math.log(Math.tan(Math.PI / 4 + r * a / 2)), u = 2 ** i, v = 2 * R / u, y = (x) => (d + x * l + R) / v, k = (x) => (R - (p - x * l)) / v, rt = Math.max(0, Math.floor(y(s.x0))), ot = Math.min(u - 1, Math.floor(y(s.x1))), at = Math.max(0, Math.floor(k(s.y0))), lt = Math.min(u - 1, Math.floor(k(s.y1))), J = [];
  if ((ot - rt + 1) * (lt - at + 1) > n) return J;
  for (let x = at; x <= lt; x++)
    for (let O = rt; O <= ot; O++) {
      const Rt = O * v - R, Nt = R - x * v;
      J.push({
        url: e.replace("{z}", String(i)).replace("{x}", String(O)).replace("{y}", String(x)),
        key: `${i}/${O}/${x}`,
        x: (Rt - d) / l,
        y: (p - Nt) / l,
        size: v / l
      });
    }
  return J;
}
const me = Ut`
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
var fe = Object.defineProperty, $e = Object.getOwnPropertyDescriptor, $ = (e, t, s, i) => {
  for (var n = i > 1 ? void 0 : i ? $e(t, s) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (n = (i ? o(t, s, n) : o(n)) || n);
  return i && n && fe(t, s, n), n;
};
const E = "irrigation_planner", _t = [
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
], wt = {
  soil_moisture: "B",
  rain_mm: "R",
  rain_binary: "R",
  water_meter: "W"
}, be = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge",
  rain_binary: "Regensensor",
  water_meter: "Wasserzähler"
}, Y = {
  idle: "",
  running: "läuft",
  queued: "wartet",
  locked: "gesperrt"
}, ve = 0.05;
let m = class extends U {
  constructor() {
    super(...arguments), this.narrow = !1, this.error = "", this.toast = "", this.tab = "zones", this.tool = "select", this.toolTarget = "", this.selected = null, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.view = { cx: 0, cy: 0, scale: 25 }, this.size = { w: 800, h: 600 }, this.imageUrl = "", this.imageSize = null, this.saving = !1, this.dirty = !1, this.savedJson = "", this.history = [], this.drag = null, this.autoFit = !0, this.loadedImage = "", this.onWheel = (e) => {
      e.preventDefault();
      const s = e.currentTarget.getBoundingClientRect(), i = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 15e-4));
      this.zoomBy(i, this.toPlan(e), [e.clientX - s.left, e.clientY - s.top]);
    }, this.onKey = (e) => {
      const t = e.composedPath()[0];
      t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName) || (e.key === "Escape" && this.cancelTool(), e.key === "Enter" && this.tool === "bed" && this.finishBed(), (e.ctrlKey || e.metaKey) && e.key === "z" && (e.preventDefault(), this.undo()), e.key === "Delete" && this.selected?.kind === "zone" && this.clearGeometry(this.selected.id));
    }, this.onPointerDown = (e) => {
      if (e.button !== 0) return;
      const t = e.currentTarget, s = this.toPlan(e);
      if (this.tool === "sprinkler") {
        this.remember();
        const i = this.zone(this.toolTarget);
        i.center = [f(s[0]), f(s[1])], i.radius_m = 0, this.drag = { type: "new-sprinkler", id: i.id }, t.setPointerCapture(e.pointerId), this.changed();
        return;
      }
      if (this.tool === "bed") {
        this.draft.length >= 3 && Z(s, this.draft[0]) * this.view.scale < 12 ? this.finishBed() : this.draft = [...this.draft, s];
        return;
      }
      if (this.tool === "place") {
        const [i, n] = this.toolTarget.split(":");
        this.remember();
        const r = this.marker(i, n);
        r.position = [f(s[0]), f(s[1])], this.selected = { kind: i, id: n }, this.changed(), this.cancelTool();
        return;
      }
      if (this.tool === "scale") {
        const i = this.imageMpp(), n = [...this.scaleDraft, [s[0] / i, s[1] / i]];
        this.scaleDraft = n.slice(-2);
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
        this.tool === "bed" && this.draft.length && (this.hover = this.toPlan(e));
        return;
      }
      const s = this.toPlan(e);
      if (t.type === "pan") {
        const n = e.clientX - t.sx, r = e.clientY - t.sy;
        Math.abs(n) + Math.abs(r) > 3 && (t.moved = !0, this.autoFit = !1), this.view = {
          ...this.view,
          cx: t.cx - n / this.view.scale,
          cy: t.cy - r / this.view.scale
        };
        return;
      }
      if (t.type === "marker") {
        this.marker(t.kind, t.id).position = [f(s[0]), f(s[1])], this.changed();
        return;
      }
      const i = this.zone(t.id);
      switch (t.type) {
        case "new-sprinkler":
        case "radius":
          i.radius_m = f(Math.max(0.1, Z(i.center, s)));
          break;
        case "center":
          i.center = [f(s[0]), f(s[1])];
          break;
        case "start": {
          const n = i.start_angle_deg + i.arc_deg, r = kt(yt(i.center, s));
          let o = ((n - r) % 360 + 360) % 360;
          o < 5 && (o = 360), i.start_angle_deg = r, i.arc_deg = o;
          break;
        }
        case "end": {
          let r = ((kt(yt(i.center, s)) - i.start_angle_deg) % 360 + 360) % 360;
          r < 5 && (r = 360), i.arc_deg = r;
          break;
        }
        case "vertex":
          i.polygon[t.index] = [f(s[0]), f(s[1])];
          break;
        case "move-zone": {
          const n = s[0] - t.start[0], r = s[1] - t.start[1];
          i.type === "sprinkler" && t.orig.center ? i.center = [f(t.orig.center[0] + n), f(t.orig.center[1] + r)] : i.polygon = t.orig.polygon.map((o) => [f(o[0] + n), f(o[1] + r)]);
          break;
        }
      }
      this.changed();
    }, this.hover = null, this.onPointerUp = () => {
      const e = this.drag;
      if (this.drag = null, !!e) {
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
    t && s && (t !== this.size.w || s !== this.size.h) && (this.size = { w: t, h: s }, this.autoFit && this.plan && this.fitView());
  }
  // Daten ----------------------------------------------------------------------
  async load() {
    try {
      const e = await this._hass.callWS({ type: `${E}/plan/get` });
      this.setPlan(e, !0), await this.subscribe();
    } catch (e) {
      this.error = this.message(e);
    }
  }
  async subscribe() {
    this.unsub || !this._hass || (this.unsub = await this._hass.connection.subscribeMessage(
      (e) => this.status = e,
      { type: `${E}/plan/subscribe` }
    ));
  }
  setPlan(e, t) {
    this.plan = e, this.savedJson = JSON.stringify(this.editable()), this.dirty = !1, this.history = [], this.loadImage(), t && this.fitView();
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
    this.dirty && (this.plan = { ...this.plan, ...JSON.parse(this.savedJson) }, this.history = [], this.dirty = !1, this.cancelTool(), this.loadImage());
  }
  async save() {
    const e = this.plan, t = { ...e.garden };
    t.background === "map" && t.latitude != null && (t.map_zoom = Math.round(xt(t.latitude, this.view.scale) * 100) / 100), this.saving = !0;
    try {
      const s = await this._hass.callWS({
        type: `${E}/plan/save`,
        garden: t,
        zones: e.zones.map((i) => ({
          id: i.id,
          center: i.center,
          radius_m: i.radius_m,
          start_angle_deg: i.start_angle_deg,
          arc_deg: i.arc_deg,
          polygon: i.polygon
        })),
        valves: e.valves.map((i) => ({ id: i.id, position: i.position })),
        sensors: e.sensors.map((i) => ({ id: i.id, position: i.position }))
      });
      this.setPlan(s, !1), this.showToast("Plan gespeichert");
    } catch (s) {
      this.showToast(`Nicht gespeichert: ${this.message(s)}`, !0);
    } finally {
      this.saving = !1;
    }
  }
  message(e) {
    return e && typeof e == "object" && "message" in e ? String(e.message) : String(e);
  }
  showToast(e, t = !1) {
    this.toast = (t ? "⚠ " : "") + e, window.clearTimeout(this.toastTimer), this.toastTimer = window.setTimeout(() => this.toast = "", t ? 8e3 : 3e3);
  }
  async loadImage() {
    const e = this.plan?.garden.background_image;
    if (!(!e || e === this.loadedImage))
      try {
        const t = await this._hass.fetchWithAuth(`/api/${E}/image/${e}`);
        if (!t.ok) throw new Error(`Bild nicht gefunden (${t.status})`);
        const s = URL.createObjectURL(await t.blob()), i = new Image();
        i.src = s, await i.decode(), this.imageUrl && URL.revokeObjectURL(this.imageUrl), this.imageUrl = s, this.imageSize = [i.naturalWidth, i.naturalHeight], this.loadedImage = e;
      } catch (t) {
        this.showToast(this.message(t), !0);
      }
  }
  async upload(e) {
    const t = e.target, s = t.files?.[0];
    if (t.value = "", !s) return;
    const i = new FormData();
    i.append("file", s);
    try {
      const n = await this._hass.fetchWithAuth(`/api/${E}/image`, {
        method: "POST",
        body: i
      }), r = await n.json();
      if (!n.ok) throw new Error(r.message ?? n.statusText);
      this.remember(), Object.assign(this.plan.garden, {
        background: "image",
        background_image: r.name,
        scale_points: null,
        scale_distance_m: null
      }), this.changed(), await this.loadImage(), this.fitView(), this.startTool("scale"), this.showToast("Bild geladen. Jetzt den Maßstab setzen.");
    } catch (n) {
      this.showToast(`Hochladen fehlgeschlagen: ${this.message(n)}`, !0);
    }
  }
  /** Meter je Bildpunkt des hochgeladenen Bilds. */
  imageMpp() {
    const e = this.plan.garden;
    if (e.scale_points && e.scale_distance_m) {
      const t = Z(e.scale_points[0], e.scale_points[1]);
      if (t > 0) return e.scale_distance_m / t;
    }
    return ve;
  }
  // Ansicht --------------------------------------------------------------------
  toScreen(e) {
    const { cx: t, cy: s, scale: i } = this.view;
    return [(e[0] - t) * i + this.size.w / 2, (e[1] - s) * i + this.size.h / 2];
  }
  toPlan(e) {
    const s = this.renderRoot.querySelector("svg.plan").getBoundingClientRect(), { cx: i, cy: n, scale: r } = this.view;
    return [
      (e.clientX - s.left - this.size.w / 2) / r + i,
      (e.clientY - s.top - this.size.h / 2) / r + n
    ];
  }
  bounds() {
    const e = [];
    for (const n of this.plan?.zones ?? [])
      n.type === "sprinkler" && n.center && n.radius_m && (e.push([n.center[0] - n.radius_m, n.center[1] - n.radius_m]), e.push([n.center[0] + n.radius_m, n.center[1] + n.radius_m])), n.type !== "sprinkler" && e.push(...n.polygon);
    for (const n of [...this.plan?.valves ?? [], ...this.plan?.sensors ?? []])
      n.position && e.push(n.position);
    if (this.plan?.garden?.background === "image" && this.imageSize) {
      const n = this.imageMpp();
      e.push([0, 0], [this.imageSize[0] * n, this.imageSize[1] * n]);
    }
    if (!e.length) return null;
    const s = e.map((n) => n[0]), i = e.map((n) => n[1]);
    return [Math.min(...s), Math.min(...i), Math.max(...s), Math.max(...i)];
  }
  fitView() {
    const e = this.plan?.garden, t = this.bounds();
    if (e?.background === "map" && e.latitude != null && !t) {
      const d = e.map_zoom ?? 19;
      this.view = { cx: 0, cy: 0, scale: 1 / pe(e.latitude, d) };
      return;
    }
    if (!t) {
      this.view = { cx: 0, cy: 0, scale: 25 };
      return;
    }
    const [s, i, n, r] = t, o = Math.max(n - s, 4), a = Math.max(r - i, 4), l = Math.min(this.size.w / (o * 1.15), this.size.h / (a * 1.15), 200);
    this.view = { cx: (s + n) / 2, cy: (i + r) / 2, scale: Math.max(l, 0.5) };
  }
  zoomBy(e, t, s) {
    this.autoFit = !1;
    const { cx: i, cy: n, scale: r } = this.view, o = Math.min(Math.max(r * e, 0.5), 400);
    if (!t || !s) {
      this.view = { cx: i, cy: n, scale: o };
      return;
    }
    this.view = {
      cx: t[0] - (s[0] - this.size.w / 2) / o,
      cy: t[1] - (s[1] - this.size.h / 2) / o,
      scale: o
    };
  }
  // Werkzeuge ------------------------------------------------------------------
  startTool(e, t = "") {
    this.tool = e, this.toolTarget = t, this.draft = [], this.scaleDraft = [], this.scaleInput = "", t && e !== "place" && (this.selected = { kind: "zone", id: t });
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
    this.remember(), this.zone(this.toolTarget).polygon = this.draft.map((e) => [f(e[0]), f(e[1])]), this.selected = { kind: "zone", id: this.toolTarget }, this.changed(), this.cancelTool();
  }
  clearGeometry(e) {
    const t = this.zone(e);
    this.remember(), t.center = null, t.radius_m = null, t.polygon = [], this.changed();
  }
  startDrag(e, t) {
    if (this.tool !== "select" || e.button !== 0) return;
    e.stopPropagation(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.remember(), this.drag = t;
  }
  insertVertex(e, t, s) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const i = t.polygon[s], n = t.polygon[(s + 1) % t.polygon.length];
    t.polygon.splice(s + 1, 0, [f((i[0] + n[0]) / 2), f((i[1] + n[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "vertex", id: t.id, index: s + 1 };
  }
  removeVertex(e, t, s) {
    if (e.preventDefault(), e.stopPropagation(), t.polygon.length <= 3) {
      this.showToast("Ein Beet braucht mindestens 3 Punkte", !0);
      return;
    }
    this.remember(), t.polygon.splice(s, 1), this.changed();
  }
  marker(e, t) {
    return (e === "valve" ? this.plan.valves : this.plan.sensors).find((i) => i.id === t);
  }
  // Hintergrund ----------------------------------------------------------------
  setBackground(e) {
    const t = this.plan.garden;
    t.background !== e && (this.remember(), t.background = e, e === "map" && ((t.latitude == null || t.longitude == null) && (t.latitude = this.plan.home.latitude, t.longitude = this.plan.home.longitude), t.map_provider ??= "basemap_at", t.map_zoom ??= 19, this.bounds() || this.fitView()), this.changed());
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
    this.remember(), [e.latitude, e.longitude] = ue([t, s], [e.latitude, e.longitude]).map(
      (n) => Math.round(n * 1e7) / 1e7
    );
    const i = (n) => [f(n[0] - t), f(n[1] - s)];
    for (const n of this.plan.zones)
      n.center && (n.center = i(n.center)), n.polygon = n.polygon.map(i);
    for (const n of [...this.plan.valves, ...this.plan.sensors])
      n.position && (n.position = i(n.position));
    this.view = { ...this.view, cx: 0, cy: 0 }, this.changed(), this.showToast("Kartenmitte gesetzt");
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
    if (Z(this.scaleDraft[0], this.scaleDraft[1]) < 2) {
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
      await this._hass.callService(E, "run_zone", { zone_id: e.id, duration: t }), this.showToast(`${e.name}: ${At(t)} eingereiht`);
    } catch (s) {
      this.showToast(this.message(s), !0);
    }
  }
  // Darstellung ----------------------------------------------------------------
  render() {
    return this.error ? h`${this.renderHeader()}
        <div class="empty">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <p>${this.error}</p>
          <p class="hint">Ist der Bewässerungsplaner eingerichtet?</p>
        </div>` : this.plan ? h`
      ${this.renderHeader()}
      <div class="layout">
        <div class="stage">
          ${this.renderPlan()} ${this.renderOverlay()}
        </div>
        <aside class="side">
          <div class="tabs">
            <button class=${this.tab === "zones" ? "active" : ""} @click=${() => this.tab = "zones"}>
              <ha-icon icon="mdi:sprinkler-variant"></ha-icon>Zonen
            </button>
            <button
              class=${this.tab === "background" ? "active" : ""}
              @click=${() => this.tab = "background"}
            >
              <ha-icon icon="mdi:image-area"></ha-icon>Hintergrund
            </button>
          </div>
          <div class="side-body">
            ${this.tab === "zones" ? this.renderZonesTab() : this.renderBackgroundTab()}
          </div>
        </aside>
      </div>
      ${this.toast ? h`<div class="toast">${this.toast}</div>` : c}
    ` : h`${this.renderHeader()}<div class="empty"><div class="spinner"></div></div>`;
  }
  renderHeader() {
    const e = this.status;
    return h`
      <header>
        <button
          class="icon menu"
          title="Menü"
          @click=${() => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: !0, composed: !0 }))}
        >
          <ha-icon icon="mdi:menu"></ha-icon>
        </button>
        <div class="title">Bewässerung</div>
        ${e ? h`<div class="chips">
              ${e.winter_mode ? h`<span class="chip winter"><ha-icon icon="mdi:snowflake"></ha-icon>Winterpause</span>` : h`<span class="chip ${e.automatic ? "on" : ""}"
                    ><ha-icon icon=${e.automatic ? "mdi:calendar-check" : "mdi:calendar-remove"}></ha-icon
                    >${e.automatic ? "Automatik an" : "Automatik aus"}</span
                  >`}
              ${e.problems.length ? h`<span class="chip alarm" title=${e.problems.join(`
`)}
                    ><ha-icon icon="mdi:alert"></ha-icon>${e.problems.length} Problem${e.problems.length > 1 ? "e" : ""}</span
                  >` : c}
            </div>` : c}
        <div class="spacer"></div>
        ${this.plan ? h`
              <button class="icon" title="Rückgängig (Strg+Z)" ?disabled=${!this.history.length} @click=${this.undo}>
                <ha-icon icon="mdi:undo"></ha-icon>
              </button>
              <button class="text" ?disabled=${!this.dirty || this.saving} @click=${this.discard}>Verwerfen</button>
              <button class="primary" ?disabled=${!this.dirty || this.saving} @click=${this.save}>
                <ha-icon icon="mdi:content-save"></ha-icon>${this.saving ? "Speichert …" : "Speichern"}
              </button>
            ` : c}
      </header>
    `;
  }
  renderPlan() {
    const { w: e, h: t } = this.size, { cx: s, cy: i, scale: n } = this.view, r = `translate(${e / 2} ${t / 2}) scale(${n}) translate(${-s} ${-i})`, o = 1 / n, a = this.tool === "select" ? this.drag?.type === "pan" ? "grabbing" : "grab" : "crosshair";
    return h`
      <svg
        class="plan"
        width=${e}
        height=${t}
        style="cursor:${a}"
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @wheel=${this.onWheel}
        @dblclick=${(l) => {
      this.tool === "bed" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishBed());
    }}
      >
        <g transform=${r}>
          ${this.renderBackground(o)}
          ${this.plan.zones.map((l, d) => this.renderZone(l, d, o))}
          ${this.renderSelectedHandles(o)} ${this.renderDraft(o)} ${this.renderScaleDraft(o)}
          ${this.plan.valves.map((l) => this.renderMarker("valve", l, o))}
          ${this.plan.sensors.map((l) => this.renderMarker("sensor", l, o))}
        </g>
      </svg>
    `;
  }
  visibleBox() {
    const { cx: e, cy: t, scale: s } = this.view, i = this.size.w / 2 / s, n = this.size.h / 2 / s;
    return { x0: e - i, y0: t - n, x1: e + i, y1: t + n };
  }
  renderBackground(e) {
    const t = this.plan.garden, s = this.visibleBox(), i = [];
    if (t.background === "map" && t.latitude != null && t.longitude != null) {
      const n = this.tileTemplate();
      if (n) {
        const o = this.plan.providers[t.map_provider ?? ""]?.max_zoom ?? 20, a = Math.max(
          1,
          Math.min(o, Math.round(xt(t.latitude, this.view.scale * (window.devicePixelRatio > 1 ? 1.4 : 1))))
        ), l = ge(n, [t.latitude, t.longitude], s, a);
        i.push(g`<rect x=${s.x0} y=${s.y0} width=${s.x1 - s.x0} height=${s.y1 - s.y0} class="map-fill"></rect>`);
        const d = e * 0.5;
        for (const p of l)
          i.push(
            g`<image href=${p.url} x=${p.x - d} y=${p.y - d} width=${p.size + 2 * d} height=${p.size + 2 * d} preserveAspectRatio="none" crossorigin="anonymous"></image>`
          );
      }
    } else if (t.background === "image" && this.imageUrl && this.imageSize) {
      const n = this.imageMpp();
      i.push(
        g`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * n} height=${this.imageSize[1] * n} preserveAspectRatio="none"></image>`
      );
    }
    return t.background !== "map" && i.push(this.renderGrid(s, e, t.background === "image")), i;
  }
  renderGrid(e, t, s) {
    const i = Bt(40 * t), n = [], r = i * 5;
    for (let o = Math.floor(e.x0 / i) * i; o <= e.x1; o += i) {
      const a = Math.abs(o / r - Math.round(o / r)) < 1e-6;
      n.push(g`<line x1=${o} y1=${e.y0} x2=${o} y2=${e.y1} class=${a ? "grid major" : "grid"}></line>`);
    }
    for (let o = Math.floor(e.y0 / i) * i; o <= e.y1; o += i) {
      const a = Math.abs(o / r - Math.round(o / r)) < 1e-6;
      n.push(g`<line x1=${e.x0} y1=${o} x2=${e.x1} y2=${o} class=${a ? "grid major" : "grid"}></line>`);
    }
    return g`<g class=${s ? "grid-layer faint" : "grid-layer"}>${n}</g>`;
  }
  tileTemplate() {
    const e = this.plan.garden;
    return e.map_provider === "custom" ? e.map_url ?? "" : this.plan.providers[e.map_provider ?? ""]?.url ?? "";
  }
  zoneColor(e) {
    return _t[e % _t.length];
  }
  renderZone(e, t, s) {
    const i = this.zoneColor(t), n = this.status?.zones[e.id]?.state ?? "idle", r = this.selected?.kind === "zone" && this.selected.id === e.id, o = `zone ${n} ${r ? "selected" : ""} ${e.enabled ? "" : "disabled"}`;
    let a, l = null;
    if (e.type === "sprinkler" && e.center && e.radius_m ? (a = g`<path d=${he(e.center, e.radius_m, e.start_angle_deg, e.arc_deg)}></path>`, l = e.arc_deg >= 360 ? e.center : _(e.center, e.radius_m * 0.55, e.start_angle_deg + e.arc_deg / 2)) : e.type !== "sprinkler" && e.polygon.length >= 3 && (a = g`<polygon points=${e.polygon.map((p) => p.join(",")).join(" ")}></polygon>`, l = de(e.polygon)), !a) return c;
    const d = V(e);
    return g`
      <g class=${o} style="--zone:${i}"
        @pointerdown=${(p) => {
      this.tool === "select" && (this.selected = { kind: "zone", id: e.id }, this.tab = "zones", this.startDrag(p, { type: "move-zone", id: e.id, start: this.toPlan(p), orig: structuredClone(e) }));
    }}>
        ${a}
        ${l ? g`<text x=${l[0]} y=${l[1]} font-size=${13 * s} stroke-width=${3 * s} class="label">
              <tspan x=${l[0]} dy="0">${e.name}</tspan>
              <tspan x=${l[0]} dy=${15 * s} class="sub">${N(d)}${Y[n] ? ` · ${Y[n]}` : ""}</tspan>
            </text>` : c}
      </g>`;
  }
  renderSelectedHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "zone") return c;
    const t = this.zone(this.selected.id), s = 7 * e, i = (n, r, o = "", a = "") => g`<circle class="handle ${o}" cx=${n[0]} cy=${n[1]} r=${s}
        @pointerdown=${(l) => this.startDrag(l, r)}><title>${a}</title></circle>`;
    if (t.type === "sprinkler" && t.center && t.radius_m) {
      const n = t.center, r = t.arc_deg >= 360, o = r ? t.start_angle_deg + 135 : t.start_angle_deg + t.arc_deg / 2, a = [
        g`<line class="guide" x1=${n[0]} y1=${n[1]} x2=${_(n, t.radius_m, t.start_angle_deg)[0]} y2=${_(n, t.radius_m, t.start_angle_deg)[1]}></line>`,
        i(n, { type: "center", id: t.id }, "center", "Mittelpunkt verschieben"),
        i(_(n, t.radius_m, o), { type: "radius", id: t.id }, "radius", "Reichweite ändern"),
        i(_(n, t.radius_m, t.start_angle_deg), { type: "start", id: t.id }, "angle", "Anfang des Bogens")
      ];
      return r ? a.push(
        i(_(n, t.radius_m * 0.8, t.start_angle_deg + 20), { type: "end", id: t.id }, "angle small", "Bogen öffnen")
      ) : a.push(
        i(_(n, t.radius_m, t.start_angle_deg + t.arc_deg), { type: "end", id: t.id }, "angle", "Ende des Bogens")
      ), a;
    }
    if (t.type !== "sprinkler" && t.polygon.length >= 3) {
      const n = t.polygon;
      return [
        ...n.map((r, o) => {
          const a = n[(o + 1) % n.length], l = [(r[0] + a[0]) / 2, (r[1] + a[1]) / 2];
          return g`<circle class="handle mid" cx=${l[0]} cy=${l[1]} r=${s * 0.7}
            @pointerdown=${(d) => this.insertVertex(d, t, o)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
        }),
        ...n.map(
          (r, o) => g`<circle class="handle" cx=${r[0]} cy=${r[1]} r=${s}
            @pointerdown=${(a) => this.startDrag(a, { type: "vertex", id: t.id, index: o })}
            @contextmenu=${(a) => this.removeVertex(a, t, o)}
            @dblclick=${(a) => this.removeVertex(a, t, o)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
        )
      ];
    }
    return c;
  }
  renderDraft(e) {
    if (this.tool !== "bed" || !this.draft.length) return c;
    const t = this.hover ? [...this.draft, this.hover] : this.draft, s = this.plan.zones.findIndex((i) => i.id === this.toolTarget);
    return g`
      <g class="draft" style="--zone:${this.zoneColor(s)}">
        <polyline points=${t.map((i) => i.join(",")).join(" ")}></polyline>
        ${this.draft.map(
      (i, n) => g`<circle cx=${i[0]} cy=${i[1]} r=${(n === 0 ? 8 : 5) * e} class=${n === 0 ? "first" : ""}></circle>`
    )}
      </g>`;
  }
  renderScaleDraft(e) {
    if (this.tool !== "scale") return c;
    const t = this.imageMpp(), s = this.scaleDraft.map((i) => [i[0] * t, i[1] * t]);
    return g`<g class="scale-draft">
      ${s.length === 2 ? g`<line x1=${s[0][0]} y1=${s[0][1]} x2=${s[1][0]} y2=${s[1][1]}></line>` : c}
      ${s.map((i) => g`<circle cx=${i[0]} cy=${i[1]} r=${6 * e}></circle>`)}
    </g>`;
  }
  renderMarker(e, t, s) {
    if (!t.position) return c;
    const [i, n] = t.position, r = this.selected?.kind === e && this.selected.id === t.id, o = e === "valve" ? "V" : wt[t.kind] ?? "S", a = 11 * s;
    return g`
      <g class="marker ${e} ${r ? "selected" : ""}"
        @pointerdown=${(l) => {
      this.tool === "select" && (this.selected = { kind: e, id: t.id }, this.tab = "zones", this.startDrag(l, { type: "marker", kind: e, id: t.id }));
    }}>
        ${e === "valve" ? g`<rect x=${i - a} y=${n - a} width=${2 * a} height=${2 * a} rx=${4 * s}></rect>` : g`<circle cx=${i} cy=${n} r=${a}></circle>`}
        <text x=${i} y=${n} font-size=${12 * s} dy=${4.2 * s}>${o}</text>
        <title>${t.name}</title>
      </g>`;
  }
  renderOverlay() {
    const e = this.plan.garden, t = this.toolBanner(), s = ye(this.view.scale), i = e.background === "map" ? this.plan.providers[e.map_provider ?? ""] : void 0;
    return h`
      <div class="tools">
        <button class="icon" title="Vergrößern" @click=${() => this.zoomBy(1.4)}><ha-icon icon="mdi:plus"></ha-icon></button>
        <button class="icon" title="Verkleinern" @click=${() => this.zoomBy(1 / 1.4)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="icon" title="Alles zeigen" @click=${this.fitView}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
      </div>
      ${t}
      <div class="compass" style="transform: rotate(${e.background === "image" ? -e.north_deg : 0}deg)" title="Norden">
        <svg viewBox="-12 -12 24 24"><path d="M0 -10 L4 2 L0 0 L-4 2 Z" class="n"></path><path d="M0 10 L4 2 L0 0 L-4 2 Z" class="s"></path></svg>
        <span>N</span>
      </div>
      <div class="scalebar"><div style="width:${s.px}px"></div><span>${s.label}</span></div>
      ${e.background === "map" ? h`<div class="attribution">${i?.attribution ?? "Eigener Kartendienst"}</div>` : c}
      ${!this.hasAnyDrawing() && this.tool === "select" ? h`<div class="welcome">
            <ha-icon icon="mdi:draw"></ha-icon>
            <div>
              <strong>Noch nichts gezeichnet.</strong><br />
              Wähle rechts einen Hintergrund und dann bei einer Zone „Zeichnen“.
            </div>
          </div>` : c}
    `;
  }
  hasAnyDrawing() {
    return this.plan.zones.some((e) => V(e) !== null);
  }
  toolBanner() {
    if (this.tool === "select") return c;
    let e = "", t = c;
    const s = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    return this.tool === "sprinkler" && (e = `${s}: Am Sprinkler drücken und bis zum Rand ziehen.`), this.tool === "bed" && (e = `${s}: Ecken anklicken, zum Schließen den ersten Punkt.`, t = h`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`), this.tool === "place" && (e = `${s}: Auf die Stelle im Plan klicken.`), this.tool === "scale" && (e = this.scaleDraft.length < 2 ? "Maßstab: Zwei Punkte im Bild anklicken, deren Abstand du kennst (z. B. die Ecken der Terrasse)." : "Abstand eingeben:", this.scaleDraft.length === 2 && (t = h`<input
            class="small"
            type="text"
            inputmode="decimal"
            placeholder="Meter"
            .value=${this.scaleInput}
            @input=${(i) => this.scaleInput = i.target.value}
            @keydown=${(i) => i.key === "Enter" && this.applyScale()}
          /><span>m</span>
          <button class="text" @click=${this.applyScale}>Übernehmen</button>`)), h`<div class="banner">
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
      return h`<p class="hint">
        Noch keine Zonen. Zonen und Ventile legst du unter Einstellungen → Geräte & Dienste →
        Bewässerungsplaner → Konfigurieren an.
      </p>`;
    const t = this.selected;
    return h`
      <ul class="list">
        ${e.zones.map((s, i) => this.renderZoneItem(s, i, t?.kind === "zone" && t.id === s.id))}
      </ul>
      ${e.valves.length || e.sensors.length ? h`<h3>Ventile und Sensoren</h3>
            <ul class="list compact">
              ${e.valves.map((s) => this.renderMarkerItem("valve", s))}
              ${e.sensors.map((s) => this.renderMarkerItem("sensor", s))}
            </ul>` : c}
      <p class="hint small">
        Ziehen verschiebt die Ansicht, das Mausrad zoomt. Gezeichnete Flächen ersetzen die Fläche
        von Hand bei der Berechnung. Namen, Pflanzen und Ventile änderst du in den Einstellungen der
        Integration.
      </p>
    `;
  }
  renderZoneItem(e, t, s) {
    const i = this.status?.zones[e.id], n = V(e), r = n !== null, o = e.type === "sprinkler";
    return h`
      <li class="item ${s ? "open" : ""}" style="--zone:${this.zoneColor(t)}">
        <div class="row" @click=${() => {
      this.selected = s ? null : { kind: "zone", id: e.id };
    }}>
          <span class="dot"></span>
          <ha-icon icon=${o ? "mdi:sprinkler-variant" : "mdi:water-outline"}></ha-icon>
          <span class="name">${e.name}</span>
          ${i && i.state !== "idle" ? h`<span class="badge ${i.state}">${Y[i.state]}</span>` : c}
          <span class="meta">${r ? N(n) : h`<em>nicht gezeichnet</em>`}</span>
        </div>
        ${s ? this.renderInspector(e, i) : c}
      </li>
    `;
  }
  renderInspector(e, t) {
    const s = e.type === "sprinkler", i = V(e), n = i !== null, r = s ? "sprinkler" : "bed", o = (a, l, d, p, u = 0.1) => h`<label class="field">
        <span>${a}</span>
        <input type="number" step=${u} .value=${l == null ? "" : String(l)}
          @change=${(v) => {
      const y = parseFloat(v.target.value);
      Number.isFinite(y) && (this.remember(), p(y), this.changed());
    }} />
        <span class="unit">${d}</span>
      </label>`;
    return h`
      <div class="inspector">
        <dl>
          <dt>Fläche gezeichnet</dt>
          <dd>${n ? N(i) : "–"}</dd>
          <dt>Fläche von Hand</dt>
          <dd>${e.area_m2 ? N(e.area_m2) : "–"}</dd>
          ${e.overlap_m2 > 0.05 ? h`<dt>Überschneidung</dt><dd class="warn">${N(e.overlap_m2)} mit anderen Zonen</dd>` : c}
          ${t ? h`<dt>Bedarf</dt><dd>${t.need_mm.toFixed(1)} mm</dd>
                <dt>Geplant</dt><dd>${t.planned_s ? At(t.planned_s) : "nicht gießen"}
                  <span class="reason">(${t.reason})</span></dd>` : c}
          ${t?.locked_reason ? h`<dt>Gesperrt</dt><dd class="warn">${t.locked_reason}</dd>` : c}
        </dl>
        ${s && n ? h`<div class="fields">
              ${o("Reichweite", e.radius_m, "m", (a) => e.radius_m = Math.max(0.1, a))}
              ${o("Richtung", e.start_angle_deg, "°", (a) => e.start_angle_deg = (a % 360 + 360) % 360, 5)}
              ${o("Bogen", e.arc_deg, "°", (a) => e.arc_deg = Math.min(360, Math.max(1, a)), 5)}
            </div>
            <p class="hint small">Richtung: Anfang des Bogens, 0° = Norden (oben), 90° = Osten.</p>` : c}
        <div class="actions">
          <button class="text" @click=${() => this.startTool(r, e.id)}>
            <ha-icon icon=${n ? "mdi:pencil" : "mdi:draw"}></ha-icon>${n ? "Neu zeichnen" : "Zeichnen"}
          </button>
          ${n ? h`<button class="text danger" @click=${() => this.clearGeometry(e.id)}>
                <ha-icon icon="mdi:eraser"></ha-icon>Entfernen
              </button>` : c}
          <span class="spacer"></span>
          <button class="text" title="In die Warteschlange einreihen" ?disabled=${this.status?.winter_mode}
            @click=${() => this.waterNow(e)}>
            <ha-icon icon="mdi:watering-can"></ha-icon>Jetzt gießen
          </button>
        </div>
      </div>
    `;
  }
  renderMarkerItem(e, t) {
    const s = this.selected?.kind === e && this.selected.id === t.id, i = e === "valve" ? t.safety_level === "device" ? "schließt selbst" : "nur Home Assistant" : be[t.kind] ?? "";
    return h`
      <li class="item ${s ? "open" : ""}">
        <div class="row" @click=${() => this.selected = { kind: e, id: t.id }}>
          <span class="marker-icon ${e}">${e === "valve" ? "V" : wt[t.kind] ?? "S"}</span>
          <span class="name">${t.name}<small>${i}</small></span>
          <button class="text small" @click=${(n) => {
      n.stopPropagation(), this.startTool("place", `${e}:${t.id}`);
    }}>${t.position ? "Versetzen" : "Platzieren"}</button>
          ${t.position ? h`<button class="icon small" title="Vom Plan nehmen" @click=${(n) => {
      n.stopPropagation(), this.remember(), t.position = null, this.changed();
    }}><ha-icon icon="mdi:close"></ha-icon></button>` : c}
        </div>
      </li>
    `;
  }
  renderBackgroundTab() {
    const e = this.plan.garden, t = this.plan.providers, s = (i, n, r, o) => h`
      <button class="choice ${e.background === i ? "active" : ""}" @click=${() => this.setBackground(i)}>
        <ha-icon icon=${n}></ha-icon>
        <span><strong>${r}</strong><small>${o}</small></span>
      </button>`;
    return h`
      <div class="choices">
        ${s("map", "mdi:satellite-variant", "Luftbild", "Kartendienst, live im Browser geladen")}
        ${s("image", "mdi:image-outline", "Eigenes Bild", "Foto, Skizze oder Screenshot")}
        ${s("none", "mdi:grid", "Raster", "Leeres Raster in Metern")}
      </div>
      ${e.background === "map" ? this.renderMapSettings(e, t) : c}
      ${e.background === "image" ? this.renderImageSettings(e) : c}
    `;
  }
  renderMapSettings(e, t) {
    return h`
      <h3>Kartendienst</h3>
      <select
        .value=${e.map_provider ?? "basemap_at"}
        @change=${(s) => this.updateGarden({ map_provider: s.target.value })}
      >
        ${Object.entries(t).map(
      ([s, i]) => h`<option value=${s} ?selected=${e.map_provider === s}>${i.name}</option>`
    )}
        <option value="custom" ?selected=${e.map_provider === "custom"}>Eigene Adresse …</option>
      </select>
      ${e.map_provider === "esri" ? h`<p class="note warn">
            Esri erlaubt die Nutzung nur nach seinen Nutzungsbedingungen. Für den privaten Garten ist das
            meist in Ordnung; prüfe es bitte selbst.
          </p>` : c}
      ${e.map_provider === "basemap_at" ? h`<p class="note">Orthofoto von basemap.at, nur in Österreich. Lizenz CC BY 4.0.</p>` : c}
      ${e.map_provider === "custom" ? h`<label class="field wide">
              <span>Adresse mit {z}, {x}, {y}</span>
              <input type="url" placeholder="https://…/{z}/{x}/{y}.jpg" .value=${e.map_url ?? ""}
                @change=${(s) => this.updateGarden({ map_url: s.target.value.trim() })} />
            </label>` : c}
      <h3>Ausschnitt</h3>
      <p class="hint small">
        Verschiebe die Karte, bis dein Garten in der Mitte liegt, und lege dort die Kartenmitte fest.
        Deine Zeichnung wandert mit. Gespeichert werden nur Mitte und Zoom, keine Bilder.
      </p>
      <div class="actions">
        <button class="text" @click=${this.recenterMap}><ha-icon icon="mdi:crosshairs-gps"></ha-icon>Mitte hier festlegen</button>
        <button class="text" @click=${this.moveToHome}><ha-icon icon="mdi:home-map-marker"></ha-icon>Zum Zuhause</button>
      </div>
      <p class="hint small">„Zum Zuhause“ nimmt den Standort aus den Einstellungen von Home Assistant.</p>
    `;
  }
  renderImageSettings(e) {
    const t = !!(e.scale_points && e.scale_distance_m);
    return h`
      <h3>Bild</h3>
      <label class="upload">
        <input type="file" accept="image/png,image/jpeg,image/webp" @change=${this.upload} />
        <ha-icon icon="mdi:upload"></ha-icon>${e.background_image ? "Anderes Bild hochladen" : "Bild hochladen"}
      </label>
      <p class="hint small">PNG, JPEG oder WebP, höchstens 15 MB.</p>
      ${e.background_image ? h`
            <h3>Maßstab</h3>
            <p class=${t ? "note" : "note warn"}>
              ${t ? h`Gesetzt: ${e.scale_distance_m} m zwischen zwei Punkten (${(this.imageMpp() * 100).toFixed(1)} cm je Bildpunkt).` : "Noch kein Maßstab. Ohne ihn stimmen die Flächen nicht, und der Plan lässt sich nicht speichern."}
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
          ` : c}
    `;
  }
};
m.styles = me;
$([
  Ct({ type: Boolean, reflect: !0 })
], m.prototype, "narrow", 2);
$([
  b()
], m.prototype, "plan", 2);
$([
  b()
], m.prototype, "status", 2);
$([
  b()
], m.prototype, "error", 2);
$([
  b()
], m.prototype, "toast", 2);
$([
  b()
], m.prototype, "tab", 2);
$([
  b()
], m.prototype, "tool", 2);
$([
  b()
], m.prototype, "toolTarget", 2);
$([
  b()
], m.prototype, "selected", 2);
$([
  b()
], m.prototype, "draft", 2);
$([
  b()
], m.prototype, "scaleDraft", 2);
$([
  b()
], m.prototype, "scaleInput", 2);
$([
  b()
], m.prototype, "view", 2);
$([
  b()
], m.prototype, "size", 2);
$([
  b()
], m.prototype, "imageUrl", 2);
$([
  b()
], m.prototype, "imageSize", 2);
$([
  b()
], m.prototype, "saving", 2);
$([
  b()
], m.prototype, "dirty", 2);
$([
  b()
], m.prototype, "hover", 2);
m = $([
  re("irrigation-planner-panel")
], m);
function f(e) {
  return Math.round(e * 100) / 100;
}
function kt(e) {
  return Math.round(e / 5) * 5 % 360;
}
function V(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? le(e.radius_m, e.arc_deg) : null : e.polygon.length >= 3 ? ce(e.polygon) : null;
}
function N(e) {
  return e == null ? "–" : `${e.toLocaleString("de-DE", { maximumFractionDigits: e < 10 ? 1 : 0 })} m²`;
}
function At(e) {
  if (e < 60) return `${e} s`;
  const t = Math.round(e / 60);
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
function Bt(e) {
  const t = 10 ** Math.floor(Math.log10(e));
  for (const s of [1, 2, 5, 10]) if (s * t >= e) return s * t;
  return 10 * t;
}
function ye(e) {
  const t = Bt(110 / e), s = t >= 1e3 ? `${t / 1e3} km` : t >= 1 ? `${t} m` : `${t * 100} cm`;
  return { px: t * e, label: s };
}
export {
  m as IrrigationPlannerPanel
};
