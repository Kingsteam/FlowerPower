/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ie = globalThis, fe = ie.ShadowRoot && (ie.ShadyCSS === void 0 || ie.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, be = Symbol(), we = /* @__PURE__ */ new WeakMap();
let Be = class {
  constructor(t, n, s) {
    if (this._$cssResult$ = !0, s !== be) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = n;
  }
  get styleSheet() {
    let t = this.o;
    const n = this.t;
    if (fe && t === void 0) {
      const s = n !== void 0 && n.length === 1;
      s && (t = we.get(n)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && we.set(n, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Ye = (e) => new Be(typeof e == "string" ? e : e + "", void 0, be), Qe = (e, ...t) => {
  const n = e.length === 1 ? e[0] : t.reduce((s, i, r) => s + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + e[r + 1], e[0]);
  return new Be(n, e, be);
}, et = (e, t) => {
  if (fe) e.adoptedStyleSheets = t.map((n) => n instanceof CSSStyleSheet ? n : n.styleSheet);
  else for (const n of t) {
    const s = document.createElement("style"), i = ie.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = n.cssText, e.appendChild(s);
  }
}, _e = fe ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let n = "";
  for (const s of t.cssRules) n += s.cssText;
  return Ye(n);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: tt, defineProperty: st, getOwnPropertyDescriptor: nt, getOwnPropertyNames: it, getOwnPropertySymbols: rt, getPrototypeOf: at } = Object, le = globalThis, Se = le.trustedTypes, ot = Se ? Se.emptyScript : "", lt = le.reactiveElementPolyfillSupport, q = (e, t) => e, re = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? ot : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let n = e;
  switch (t) {
    case Boolean:
      n = e !== null;
      break;
    case Number:
      n = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        n = JSON.parse(e);
      } catch {
        n = null;
      }
  }
  return n;
} }, $e = (e, t) => !tt(e, t), Ae = { attribute: !0, type: String, converter: re, reflect: !1, useDefault: !1, hasChanged: $e };
Symbol.metadata ??= Symbol("metadata"), le.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let Z = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, n = Ae) {
    if (n.state && (n.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((n = Object.create(n)).wrapped = !0), this.elementProperties.set(t, n), !n.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(t, s, n);
      i !== void 0 && st(this.prototype, t, i);
    }
  }
  static getPropertyDescriptor(t, n, s) {
    const { get: i, set: r } = nt(this.prototype, t) ?? { get() {
      return this[n];
    }, set(a) {
      this[n] = a;
    } };
    return { get: i, set(a) {
      const o = i?.call(this);
      r?.call(this, a), this.requestUpdate(t, o, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Ae;
  }
  static _$Ei() {
    if (this.hasOwnProperty(q("elementProperties"))) return;
    const t = at(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(q("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(q("properties"))) {
      const n = this.properties, s = [...it(n), ...rt(n)];
      for (const i of s) this.createProperty(i, n[i]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const n = litPropertyMetadata.get(t);
      if (n !== void 0) for (const [s, i] of n) this.elementProperties.set(s, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [n, s] of this.elementProperties) {
      const i = this._$Eu(n, s);
      i !== void 0 && this._$Eh.set(i, n);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const n = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const i of s) n.unshift(_e(i));
    } else t !== void 0 && n.push(_e(t));
    return n;
  }
  static _$Eu(t, n) {
    const s = n.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
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
    const t = /* @__PURE__ */ new Map(), n = this.constructor.elementProperties;
    for (const s of n.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return et(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, n, s) {
    this._$AK(t, s);
  }
  _$ET(t, n) {
    const s = this.constructor.elementProperties.get(t), i = this.constructor._$Eu(t, s);
    if (i !== void 0 && s.reflect === !0) {
      const r = (s.converter?.toAttribute !== void 0 ? s.converter : re).toAttribute(n, s.type);
      this._$Em = t, r == null ? this.removeAttribute(i) : this.setAttribute(i, r), this._$Em = null;
    }
  }
  _$AK(t, n) {
    const s = this.constructor, i = s._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const r = s.getPropertyOptions(i), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : re;
      this._$Em = i;
      const o = a.fromAttribute(n, r.type);
      this[i] = o ?? this._$Ej?.get(i) ?? o, this._$Em = null;
    }
  }
  requestUpdate(t, n, s, i = !1, r) {
    if (t !== void 0) {
      const a = this.constructor;
      if (i === !1 && (r = this[t]), s ??= a.getPropertyOptions(t), !((s.hasChanged ?? $e)(r, n) || s.useDefault && s.reflect && r === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, s)))) return;
      this.C(t, n, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, n, { useDefault: s, reflect: i, wrapped: r }, a) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? n ?? this[t]), r !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (n = void 0), this._$AL.set(t, n)), i === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (n) {
      Promise.reject(n);
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
        for (const [i, r] of this._$Ep) this[i] = r;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, r] of s) {
        const { wrapped: a } = r, o = this[i];
        a !== !0 || this._$AL.has(i) || o === void 0 || this.C(i, void 0, r, o);
      }
    }
    let t = !1;
    const n = this._$AL;
    try {
      t = this.shouldUpdate(n), t ? (this.willUpdate(n), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(n)) : this._$EM();
    } catch (s) {
      throw t = !1, this._$EM(), s;
    }
    t && this._$AE(n);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((n) => n.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
    this._$Eq &&= this._$Eq.forEach((n) => this._$ET(n, this[n])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
Z.elementStyles = [], Z.shadowRootOptions = { mode: "open" }, Z[q("elementProperties")] = /* @__PURE__ */ new Map(), Z[q("finalized")] = /* @__PURE__ */ new Map(), lt?.({ ReactiveElement: Z }), (le.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ve = globalThis, Pe = (e) => e, ae = ve.trustedTypes, Me = ae ? ae.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Le = "$lit$", I = `lit$${Math.random().toFixed(9).slice(2)}$`, Fe = "?" + I, ct = `<${Fe}>`, H = document, Y = () => H.createComment(""), Q = (e) => e === null || typeof e != "object" && typeof e != "function", ye = Array.isArray, dt = (e) => ye(e) || typeof e?.[Symbol.iterator] == "function", he = `[ 	
\f\r]`, K = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ze = /-->/g, Ee = />/g, R = RegExp(`>|${he}(?:([^\\s"'>=/]+)(${he}*=${he}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Te = /'/g, Oe = /"/g, Ue = /^(?:script|style|textarea|title)$/i, Ze = (e) => (t, ...n) => ({ _$litType$: e, strings: t, values: n }), h = Ze(1), m = Ze(2), V = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), De = /* @__PURE__ */ new WeakMap(), j = H.createTreeWalker(H, 129);
function Ve(e, t) {
  if (!ye(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Me !== void 0 ? Me.createHTML(t) : t;
}
const ht = (e, t) => {
  const n = e.length - 1, s = [];
  let i, r = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = K;
  for (let o = 0; o < n; o++) {
    const l = e[o];
    let p, u, g = -1, x = 0;
    for (; x < l.length && (a.lastIndex = x, u = a.exec(l), u !== null); ) x = a.lastIndex, a === K ? u[1] === "!--" ? a = ze : u[1] !== void 0 ? a = Ee : u[2] !== void 0 ? (Ue.test(u[2]) && (i = RegExp("</" + u[2], "g")), a = R) : u[3] !== void 0 && (a = R) : a === R ? u[0] === ">" ? (a = i ?? K, g = -1) : u[1] === void 0 ? g = -2 : (g = a.lastIndex - u[2].length, p = u[1], a = u[3] === void 0 ? R : u[3] === '"' ? Oe : Te) : a === Oe || a === Te ? a = R : a === ze || a === Ee ? a = K : (a = R, i = void 0);
    const c = a === R && e[o + 1].startsWith("/>") ? " " : "";
    r += a === K ? l + ct : g >= 0 ? (s.push(p), l.slice(0, g) + Le + l.slice(g) + I + c) : l + I + (g === -2 ? o : c);
  }
  return [Ve(e, r + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class ee {
  constructor({ strings: t, _$litType$: n }, s) {
    let i;
    this.parts = [];
    let r = 0, a = 0;
    const o = t.length - 1, l = this.parts, [p, u] = ht(t, n);
    if (this.el = ee.createElement(p, s), j.currentNode = this.el.content, n === 2 || n === 3) {
      const g = this.el.content.firstChild;
      g.replaceWith(...g.childNodes);
    }
    for (; (i = j.nextNode()) !== null && l.length < o; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const g of i.getAttributeNames()) if (g.endsWith(Le)) {
          const x = u[a++], c = i.getAttribute(g).split(I), f = /([.?@])?(.*)/.exec(x);
          l.push({ type: 1, index: r, name: f[2], strings: c, ctor: f[1] === "." ? ut : f[1] === "?" ? gt : f[1] === "@" ? mt : ce }), i.removeAttribute(g);
        } else g.startsWith(I) && (l.push({ type: 6, index: r }), i.removeAttribute(g));
        if (Ue.test(i.tagName)) {
          const g = i.textContent.split(I), x = g.length - 1;
          if (x > 0) {
            i.textContent = ae ? ae.emptyScript : "";
            for (let c = 0; c < x; c++) i.append(g[c], Y()), j.nextNode(), l.push({ type: 2, index: ++r });
            i.append(g[x], Y());
          }
        }
      } else if (i.nodeType === 8) if (i.data === Fe) l.push({ type: 2, index: r });
      else {
        let g = -1;
        for (; (g = i.data.indexOf(I, g + 1)) !== -1; ) l.push({ type: 7, index: r }), g += I.length - 1;
      }
      r++;
    }
  }
  static createElement(t, n) {
    const s = H.createElement("template");
    return s.innerHTML = t, s;
  }
}
function W(e, t, n = e, s) {
  if (t === V) return t;
  let i = s !== void 0 ? n._$Co?.[s] : n._$Cl;
  const r = Q(t) ? void 0 : t._$litDirective$;
  return i?.constructor !== r && (i?._$AO?.(!1), r === void 0 ? i = void 0 : (i = new r(e), i._$AT(e, n, s)), s !== void 0 ? (n._$Co ??= [])[s] = i : n._$Cl = i), i !== void 0 && (t = W(e, i._$AS(e, t.values), i, s)), t;
}
class pt {
  constructor(t, n) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = n;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: n }, parts: s } = this._$AD, i = (t?.creationScope ?? H).importNode(n, !0);
    j.currentNode = i;
    let r = j.nextNode(), a = 0, o = 0, l = s[0];
    for (; l !== void 0; ) {
      if (a === l.index) {
        let p;
        l.type === 2 ? p = new se(r, r.nextSibling, this, t) : l.type === 1 ? p = new l.ctor(r, l.name, l.strings, this, t) : l.type === 6 && (p = new ft(r, this, t)), this._$AV.push(p), l = s[++o];
      }
      a !== l?.index && (r = j.nextNode(), a++);
    }
    return j.currentNode = H, i;
  }
  p(t) {
    let n = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, n), n += s.strings.length - 2) : s._$AI(t[n])), n++;
  }
}
class se {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, n, s, i) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = t, this._$AB = n, this._$AM = s, this.options = i, this._$Cv = i?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const n = this._$AM;
    return n !== void 0 && t?.nodeType === 11 && (t = n.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, n = this) {
    t = W(this, t, n), Q(t) ? t === d || t == null || t === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : t !== this._$AH && t !== V && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : dt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== d && Q(this._$AH) ? this._$AA.nextSibling.data = t : this.T(H.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: n, _$litType$: s } = t, i = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = ee.createElement(Ve(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(n);
    else {
      const r = new pt(i, this), a = r.u(this.options);
      r.p(n), this.T(a), this._$AH = r;
    }
  }
  _$AC(t) {
    let n = De.get(t.strings);
    return n === void 0 && De.set(t.strings, n = new ee(t)), n;
  }
  k(t) {
    ye(this._$AH) || (this._$AH = [], this._$AR());
    const n = this._$AH;
    let s, i = 0;
    for (const r of t) i === n.length ? n.push(s = new se(this.O(Y()), this.O(Y()), this, this.options)) : s = n[i], s._$AI(r), i++;
    i < n.length && (this._$AR(s && s._$AB.nextSibling, i), n.length = i);
  }
  _$AR(t = this._$AA.nextSibling, n) {
    for (this._$AP?.(!1, !0, n); t !== this._$AB; ) {
      const s = Pe(t).nextSibling;
      Pe(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class ce {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, n, s, i, r) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = t, this.name = n, this._$AM = i, this.options = r, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(t, n = this, s, i) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) t = W(this, t, n, 0), a = !Q(t) || t !== this._$AH && t !== V, a && (this._$AH = t);
    else {
      const o = t;
      let l, p;
      for (t = r[0], l = 0; l < r.length - 1; l++) p = W(this, o[s + l], n, l), p === V && (p = this._$AH[l]), a ||= !Q(p) || p !== this._$AH[l], p === d ? t = d : t !== d && (t += (p ?? "") + r[l + 1]), this._$AH[l] = p;
    }
    a && !i && this.j(t);
  }
  j(t) {
    t === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class ut extends ce {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === d ? void 0 : t;
  }
}
class gt extends ce {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== d);
  }
}
class mt extends ce {
  constructor(t, n, s, i, r) {
    super(t, n, s, i, r), this.type = 5;
  }
  _$AI(t, n = this) {
    if ((t = W(this, t, n, 0) ?? d) === V) return;
    const s = this._$AH, i = t === d && s !== d || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, r = t !== d && (s === d || i);
    i && this.element.removeEventListener(this.name, this, s), r && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class ft {
  constructor(t, n, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = n, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    W(this, t);
  }
}
const bt = ve.litHtmlPolyfillSupport;
bt?.(ee, se), (ve.litHtmlVersions ??= []).push("3.3.3");
const $t = (e, t, n) => {
  const s = n?.renderBefore ?? t;
  let i = s._$litPart$;
  if (i === void 0) {
    const r = n?.renderBefore ?? null;
    s._$litPart$ = i = new se(t.insertBefore(Y(), r), r, void 0, n ?? {});
  }
  return i._$AI(e), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xe = globalThis;
class J extends Z {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const n = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = $t(n, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return V;
  }
}
J._$litElement$ = !0, J.finalized = !0, xe.litElementHydrateSupport?.({ LitElement: J });
const vt = xe.litElementPolyfillSupport;
vt?.({ LitElement: J });
(xe.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const yt = (e) => (t, n) => {
  n !== void 0 ? n.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xt = { attribute: !0, type: String, converter: re, reflect: !1, hasChanged: $e }, kt = (e = xt, t, n) => {
  const { kind: s, metadata: i } = n;
  let r = globalThis.litPropertyMetadata.get(i);
  if (r === void 0 && globalThis.litPropertyMetadata.set(i, r = /* @__PURE__ */ new Map()), s === "setter" && ((e = Object.create(e)).wrapped = !0), r.set(n.name, e), s === "accessor") {
    const { name: a } = n;
    return { set(o) {
      const l = t.get.call(this);
      t.set.call(this, o), this.requestUpdate(a, l, e, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(a, void 0, e, o), o;
    } };
  }
  if (s === "setter") {
    const { name: a } = n;
    return function(o) {
      const l = this[a];
      t.call(this, o), this.requestUpdate(a, l, e, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function We(e) {
  return (t, n) => typeof n == "object" ? kt(e, t, n) : ((s, i, r) => {
    const a = i.hasOwnProperty(r);
    return i.constructor.createProperty(r, s), a ? Object.getOwnPropertyDescriptor(i, r) : void 0;
  })(e, t, n);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function y(e) {
  return We({ ...e, state: !0, attribute: !1 });
}
const T = 6378137, Ke = 256, G = Math.PI * T;
function Ge(e, t) {
  const n = Math.max(0, Math.min(360, t));
  return Math.PI * e * e * n / 360;
}
function ke(e) {
  if (e.length < 3) return 0;
  let t = 0;
  for (let n = 0; n < e.length; n++) {
    const [s, i] = e[n], [r, a] = e[(n + 1) % e.length];
    t += s * a - r * i;
  }
  return Math.abs(t) / 2;
}
function E(e, t, n) {
  const s = n * Math.PI / 180;
  return [e[0] + Math.sin(s) * t, e[1] - Math.cos(s) * t];
}
function te(e, t) {
  return (Math.atan2(t[0] - e[0], -(t[1] - e[1])) * 180 / Math.PI + 360) % 360;
}
function w(e, t) {
  return Math.hypot(e[0] - t[0], e[1] - t[1]);
}
function wt(e, t, n, s) {
  const [i, r] = e;
  if (s >= 360)
    return `M ${i - t} ${r} a ${t} ${t} 0 1 0 ${2 * t} 0 a ${t} ${t} 0 1 0 ${-2 * t} 0 Z`;
  const [a, o] = E(e, t, n), [l, p] = E(e, t, n + s), u = s > 180 ? 1 : 0;
  return `M ${i} ${r} L ${a} ${o} A ${t} ${t} 0 ${u} 1 ${l} ${p} Z`;
}
function pe(e) {
  const t = e.length || 1;
  return [e.reduce((n, s) => n + s[0], 0) / t, e.reduce((n, s) => n + s[1], 0) / t];
}
function Ce(e, t) {
  return 2 * Math.PI * T * Math.cos(e * Math.PI / 180) / (Ke * 2 ** t);
}
function Ie(e, t) {
  return Math.log2(
    2 * Math.PI * T * Math.cos(e * Math.PI / 180) * t / Ke
  );
}
function _t(e, t, n) {
  const [s, i] = n, r = Math.PI / 180;
  return [
    (t - i) * r * T * Math.cos(s * r),
    -(e - s) * r * T
  ];
}
function St(e, t) {
  const [n, s] = t, i = 180 / Math.PI;
  return [
    n - e[1] / T * i,
    s + e[0] / (T * Math.cos(n / i)) * i
  ];
}
function Re(e, t, n, s, i = 200) {
  const [r, a] = t, o = Math.PI / 180, l = 1 / Math.cos(r * o), p = T * a * o, u = T * Math.log(Math.tan(Math.PI / 4 + r * o / 2)), g = 2 ** s, x = 2 * G / g, c = (A) => (p + A * l + G) / x, f = (A) => (G - (u - A * l)) / x, _ = Math.max(0, Math.floor(c(n.x0))), S = Math.min(g - 1, Math.floor(c(n.x1))), k = Math.max(0, Math.floor(f(n.y0))), P = Math.min(g - 1, Math.floor(f(n.y1))), B = [];
  if ((S - _ + 1) * (P - k + 1) > i) return B;
  for (let A = k; A <= P; A++)
    for (let O = _; O <= S; O++) {
      const L = O * x - G, de = G - A * x;
      B.push({
        url: e.replace("{z}", String(s)).replace("{x}", String(O)).replace("{y}", String(A)),
        key: `${s}/${O}/${A}`,
        x: (L - p) / l,
        y: (u - de) / l,
        size: x / l
      });
    }
  return B;
}
function At(e, t, n) {
  let s = null, i = n;
  for (const r of t) {
    const a = w(e, r);
    a <= i && (s = r, i = a);
  }
  return s;
}
function X(e, t = !1) {
  let n = 0;
  for (let s = 1; s < e.length; s++) n += w(e[s - 1], e[s]);
  return t && e.length > 2 && (n += w(e[e.length - 1], e[0])), n;
}
function Pt(e, t) {
  const n = t ? e.length : e.length - 1, s = [];
  for (let i = 0; i < n; i++) s.push(w(e[i], e[(i + 1) % e.length]));
  return s;
}
function Mt(e, t, n) {
  const s = (t + 1) % e.length, i = e[t], r = e[s], a = w(i, r);
  if (!(n > 0) || a === 0) return e;
  const o = n / a, l = [i[0] + (r[0] - i[0]) * o, i[1] + (r[1] - i[1]) * o];
  return e.map((p, u) => u === s ? l : p);
}
function qe(e, t) {
  return e.length < 2 || t <= 0 ? 0 : X(e) * 2 * t + Math.PI * t * t;
}
function zt(e, t) {
  let n = X(e) * Math.max(0, Math.min(1, t));
  for (let s = 1; s < e.length; s++) {
    const i = w(e[s - 1], e[s]);
    if (n <= i && i > 0) {
      const r = n / i;
      return [
        e[s - 1][0] + (e[s][0] - e[s - 1][0]) * r,
        e[s - 1][1] + (e[s][1] - e[s - 1][1]) * r
      ];
    }
    n -= i;
  }
  return e[e.length - 1];
}
const C = {
  building: { label: "Gebäude", icon: "mdi:home-outline", family: "area" },
  paving: { label: "Terrasse / Weg", icon: "mdi:texture-box", family: "area" },
  water: { label: "Teich / Pool", icon: "mdi:waves", family: "area" },
  area: { label: "Sonstige Fläche", icon: "mdi:vector-square", family: "area" },
  fence: { label: "Zaun", icon: "mdi:fence", family: "line" },
  hedge: { label: "Hecke", icon: "mdi:leaf", family: "line" },
  boundary: { label: "Grundstücksgrenze", icon: "mdi:vector-polyline", family: "line" },
  pipe: { label: "Leitung", icon: "mdi:pipe", family: "line" },
  tree: { label: "Baum / Strauch", icon: "mdi:tree-outline", family: "point" },
  label: { label: "Beschriftung", icon: "mdi:format-text", family: "point" },
  tap: { label: "Wasserhahn", icon: "mdi:water-pump", family: "point" }
}, Et = 60;
function N(e) {
  return C[e]?.family ?? "area";
}
function F(e) {
  return e.kind === "label" && e.label ? e.label : e.label || C[e.kind]?.label || e.kind;
}
function Tt(e) {
  const t = new Set(e.map((s) => s.id));
  let n = e.length + 1;
  for (; t.has(`f${n}`); ) n++;
  return `f${n}`;
}
const Ot = "Suche: © OpenStreetMap-Mitwirkende";
async function Dt(e, t, n = "de") {
  if (t.trim().length < 3) throw new Error("Bitte mindestens 3 Zeichen eingeben");
  return (await e({
    type: "irrigation_planner/geocode",
    query: t.trim(),
    language: n
  })).places ?? [];
}
const Ct = Qe`
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
function It(e, t, n, s, i) {
  return w(e, t) > n ? !1 : i >= 360 ? !0 : ((te(t, e) - s) % 360 + 360) % 360 <= i;
}
function Rt(e, t) {
  let n = !1;
  for (let s = 0, i = t.length - 1; s < t.length; i = s++) {
    const [r, a] = t[s], [o, l] = t[i];
    a > e[1] != l > e[1] && e[0] < (o - r) * (e[1] - a) / (l - a) + r && (n = !n);
  }
  return n;
}
function Nt(e, t, n) {
  const s = n[0] - t[0], i = n[1] - t[1], r = s * s + i * i, a = r === 0 ? 0 : Math.max(0, Math.min(1, ((e[0] - t[0]) * s + (e[1] - t[1]) * i) / r));
  return Math.hypot(e[0] - (t[0] + a * s), e[1] - (t[1] + a * i));
}
function jt(e, t) {
  if (e.type === "sprinkler")
    return !!(e.center && e.radius_m) && It(t, e.center, e.radius_m, e.start_angle_deg, e.arc_deg);
  if (e.type === "hose") {
    const n = e.radius_m ?? 0;
    for (let s = 1; s < e.polygon.length; s++)
      if (Nt(t, e.polygon[s - 1], e.polygon[s]) <= n) return !0;
    return !1;
  }
  return e.polygon.length >= 3 && Rt(t, e.polygon);
}
function oe(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? Ge(e.radius_m, e.arc_deg) : null : e.type === "hose" ? e.polygon.length >= 2 && e.radius_m ? qe(e.polygon, e.radius_m) : null : e.polygon.length >= 3 ? ke(e.polygon) : null;
}
function Ht(e, t, n) {
  const s = w(t, e);
  for (const i of n) {
    const r = i.points[0], a = (i.trunk_m ?? 0) / 2, o = w(t, r);
    if (a <= 0 || o <= a || s <= o) continue;
    const l = Math.asin(Math.min(1, a / o)) * 180 / Math.PI;
    if (Math.abs((te(t, e) - te(t, r) + 540) % 360 - 180) <= l) return !0;
  }
  return !1;
}
function Je(e, t) {
  return t?.zones[e.id]?.planned_s || e.duration_s || 0;
}
function me(e, t, n) {
  const s = t.find((a) => a.id === e.valve_id)?.learned_flow_l_min, i = oe(e) ?? e.area_m2, r = Je(e, n);
  return !s || !i || !r ? null : r / 60 * s / i;
}
function Bt(e, t, n, s, i, r = 160) {
  const [a, o, l, p] = i, u = Math.max(0.05, Math.max(l - a, p - o) / r), g = Math.max(1, Math.ceil((l - a) / u)), x = Math.max(1, Math.ceil((p - o) / u)), c = new Float32Array(g * x).fill(Number.NaN), f = s.filter((k) => k.kind === "tree" && (k.trunk_m ?? 0) > 0), _ = e.filter((k) => k.enabled && oe(k) !== null).map((k) => ({ zone: k, mm: me(k, t, n) })).filter((k) => k.mm !== null);
  let S = 0;
  for (let k = 0; k < x; k++)
    for (let P = 0; P < g; P++) {
      const B = [a + (P + 0.5) * u, o + (k + 0.5) * u];
      let A = 0, O = !1;
      for (const { zone: L, mm: de } of _)
        jt(L, B) && (L.type === "sprinkler" && L.center && Ht(B, L.center, f) || (A += de, O = !0));
      O && (c[k * g + P] = A, S = Math.max(S, A));
    }
  return { x0: a, y0: o, step: u, cols: g, rows: x, values: c, max: S };
}
const z = [
  [0, [224, 242, 254]],
  [3, [125, 196, 240]],
  [8, [33, 120, 210]],
  [15, [40, 50, 160]],
  [25, [120, 30, 150]]
];
function Lt(e) {
  if (e <= z[0][0]) return z[0][1];
  for (let t = 1; t < z.length; t++) {
    const [n, s] = z[t], [i, r] = z[t - 1];
    if (e <= n) {
      const a = (e - i) / (n - i);
      return [0, 1, 2].map((o) => Math.round(r[o] + (s[o] - r[o]) * a));
    }
  }
  return z[z.length - 1][1];
}
function Ft(e) {
  const t = document.createElement("canvas");
  t.width = e.cols, t.height = e.rows;
  const n = t.getContext("2d");
  if (!n) return "";
  const s = n.createImageData(e.cols, e.rows);
  for (let i = 0; i < e.values.length; i++) {
    const r = e.values[i];
    if (Number.isNaN(r)) continue;
    const [a, o, l] = Lt(r);
    s.data.set([a, o, l, 200], i * 4);
  }
  return n.putImageData(s, 0, 0), t.toDataURL();
}
var Ut = Object.defineProperty, Zt = Object.getOwnPropertyDescriptor, v = (e, t, n, s) => {
  for (var i = s > 1 ? void 0 : s ? Zt(t, n) : t, r = e.length - 1, a; r >= 0; r--)
    (a = e[r]) && (i = (s ? a(t, n, i) : a(i)) || i);
  return s && i && Ut(t, n, i), i;
};
const D = "irrigation_planner", Ne = [
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
], je = {
  soil_moisture: "B",
  rain_mm: "R",
  rain_binary: "R",
  water_meter: "W"
}, Vt = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge",
  rain_binary: "Regensensor",
  water_meter: "Wasserzähler"
}, ue = {
  idle: "",
  running: "läuft",
  queued: "wartet",
  locked: "gesperrt"
}, Wt = 0.05, Kt = 10;
let $ = class extends J {
  constructor() {
    super(...arguments), this.narrow = !1, this.error = "", this.toast = "", this.tab = "zones", this.featureKind = "building", this.measurePts = [], this.snapOn = !0, this.snapHint = null, this.tool = "select", this.toolTarget = "", this.selected = null, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.view = { cx: 0, cy: 0, scale: 25 }, this.size = { w: 800, h: 600 }, this.imageUrl = "", this.imageSize = null, this.saving = !1, this.dirty = !1, this.searchOpen = !1, this.searchQuery = "", this.searchResults = null, this.searching = !1, this.searchError = "", this.searchPin = null, this.savedJson = "", this.history = [], this.drag = null, this.toastUndo = !1, this.layersOpen = !1, this.page = "plan", this.wetOn = !1, this.wetCache = null, this.menuOpen = !1, this.pendingImport = null, this.autoFit = !0, this.loadedImage = "", this.onWheel = (e) => {
      e.preventDefault();
      const n = e.currentTarget.getBoundingClientRect(), s = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 15e-4));
      this.zoomBy(s, this.toPlan(e), [e.clientX - n.left, e.clientY - n.top]);
    }, this.onKey = (e) => {
      const t = e.composedPath()[0];
      t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName) || (e.key === "Escape" && this.cancelTool(), e.key === "Enter" && this.tool === "bed" && this.finishBed(), e.key === "Enter" && this.tool === "feature" && this.finishFeature(), e.key === "Enter" && this.tool === "hose" && this.finishHose(), (e.ctrlKey || e.metaKey) && e.key === "z" && (e.preventDefault(), this.undo()), e.key === "Delete" && this.selected?.kind === "zone" && this.clearGeometry(this.selected.id), e.key === "Delete" && this.selected?.kind === "feature" && this.deleteFeature(this.selected.id));
    }, this.onPointerDown = (e) => {
      if (e.button !== 0) return;
      const t = e.currentTarget, n = this.toPlan(e);
      if (this.tool === "feature") {
        const s = this.featureKind, i = this.snap(n, e), r = N(s);
        if (r === "point") {
          const o = [b(i[0]), b(i[1])];
          if (s === "tree") {
            const l = this.addFeature({ kind: s, points: [o], radius_m: 0 });
            this.drag = { type: "new-tree", id: l.id }, t.setPointerCapture(e.pointerId);
          } else
            this.addFeature({ kind: s, points: [o], label: s === "label" ? "Beschriftung" : null }), this.cancelTool(), s === "label" && this.updateComplete.then(
              () => this.renderRoot.querySelector("#feature-label")?.select()
            );
          return;
        }
        const a = (o) => w(i, o) * this.view.scale < 12;
        r === "area" && this.draft.length >= 3 && a(this.draft[0]) ? this.finishFeature() : r === "line" && this.draft.length >= 2 && a(this.draft[this.draft.length - 1]) ? this.finishFeature() : this.draft = [...this.draft, i];
        return;
      }
      if (this.tool === "measure") {
        this.measurePts = [...this.measurePts, this.snap(n, e)];
        return;
      }
      if (this.tool === "hose") {
        const s = this.snap(n, e), i = this.draft[this.draft.length - 1];
        this.draft.length >= 2 && w(s, i) * this.view.scale < 12 ? this.finishHose() : this.draft = [...this.draft, s];
        return;
      }
      if (this.tool === "sprinkler") {
        this.remember();
        const s = this.zone(this.toolTarget), i = this.snap(n, e);
        n[0] = i[0], n[1] = i[1], s.center = [b(n[0]), b(n[1])], s.radius_m = 0, this.drag = { type: "new-sprinkler", id: s.id }, t.setPointerCapture(e.pointerId), this.changed();
        return;
      }
      if (this.tool === "bed") {
        const s = this.snap(n, e);
        this.draft.length >= 3 && w(s, this.draft[0]) * this.view.scale < 12 ? this.finishBed() : this.draft = [...this.draft, s];
        return;
      }
      if (this.tool === "place") {
        const [s, i] = this.toolTarget.split(":");
        this.remember();
        const r = this.marker(s, i);
        r.position = [b(n[0]), b(n[1])], this.selected = { kind: s, id: i }, this.changed(), this.cancelTool();
        return;
      }
      if (this.tool === "scale") {
        const s = this.imageMpp(), i = [...this.scaleDraft, [n[0] / s, n[1] / s]];
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
      const n = this.toPlan(e);
      if (t.type.startsWith("f-") || t.type === "new-tree") {
        this.moveFeature(t, n, e);
        return;
      }
      if (t.type === "pan") {
        const i = e.clientX - t.sx, r = e.clientY - t.sy;
        Math.abs(i) + Math.abs(r) > 3 && (t.moved = !0, this.autoFit = !1), this.view = {
          ...this.view,
          cx: t.cx - i / this.view.scale,
          cy: t.cy - r / this.view.scale
        };
        return;
      }
      if (t.type === "marker") {
        this.marker(t.kind, t.id).position = [b(n[0]), b(n[1])], this.changed();
        return;
      }
      const s = this.zone(t.id);
      switch (t.type) {
        case "new-sprinkler":
        case "radius":
          s.radius_m = b(Math.max(0.1, w(s.center, n)));
          break;
        case "center":
          s.center = [b(n[0]), b(n[1])];
          break;
        case "start": {
          const i = s.start_angle_deg + s.arc_deg, r = He(te(s.center, n));
          let a = ((i - r) % 360 + 360) % 360;
          a < 5 && (a = 360), s.start_angle_deg = r, s.arc_deg = a;
          break;
        }
        case "end": {
          let r = ((He(te(s.center, n)) - s.start_angle_deg) % 360 + 360) % 360;
          r < 5 && (r = 360), s.arc_deg = r;
          break;
        }
        case "vertex": {
          const i = this.snap(n, e, s.polygon[t.index]);
          s.polygon[t.index] = [b(i[0]), b(i[1])];
          break;
        }
        case "move-zone": {
          const i = n[0] - t.start[0], r = n[1] - t.start[1];
          s.type === "sprinkler" && t.orig.center ? s.center = [b(t.orig.center[0] + i), b(t.orig.center[1] + r)] : s.polygon = t.orig.polygon.map((a) => [b(a[0] + i), b(a[1] + r)]);
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
    const { width: t, height: n } = e.getBoundingClientRect();
    t && n && (t !== this.size.w || n !== this.size.h) && (this.size = { w: t, h: n }, this.autoFit && this.plan && this.fitView());
  }
  // Daten ----------------------------------------------------------------------
  async load() {
    try {
      const e = await this._hass.callWS({ type: `${D}/plan/get` });
      this.setPlan(e, !0), await this.subscribe();
    } catch (e) {
      this.error = this.message(e);
    }
  }
  async subscribe() {
    this.unsub || !this._hass || (this.unsub = await this._hass.connection.subscribeMessage(
      (e) => this.status = e,
      { type: `${D}/plan/subscribe` }
    ));
  }
  /** Neuer Stand vom Server. Nach dem Speichern bleibt „Rückgängig“ möglich. */
  setPlan(e, t, n = !1) {
    this.plan = e, this.savedJson = JSON.stringify(this.editable()), this.dirty = !1, n || (this.history = []), this.loadImage(), t && this.fitView();
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
    t.background === "map" && t.latitude != null && (t.map_zoom = Math.round(Ie(t.latitude, this.view.scale) * 100) / 100), this.saving = !0;
    try {
      const n = await this._hass.callWS({
        type: `${D}/plan/save`,
        garden: t,
        zones: e.zones.map((s) => ({
          id: s.id,
          center: s.center,
          radius_m: s.radius_m,
          start_angle_deg: s.start_angle_deg,
          arc_deg: s.arc_deg,
          polygon: s.polygon,
          valve_id: s.valve_id
        })),
        valves: e.valves.map((s) => ({ id: s.id, position: s.position })),
        sensors: e.sensors.map((s) => ({ id: s.id, position: s.position }))
      });
      this.setPlan(n, !1, !0), this.showToast("Plan gespeichert");
    } catch (n) {
      this.showToast(`Nicht gespeichert: ${this.message(n)}`, !0);
    } finally {
      this.saving = !1;
    }
  }
  message(e) {
    return e && typeof e == "object" && "message" in e ? String(e.message) : String(e);
  }
  showToast(e, t = !1, n = !1) {
    this.toast = (t ? "⚠ " : "") + e, this.toastUndo = n, window.clearTimeout(this.toastTimer), this.toastTimer = window.setTimeout(
      () => {
        this.toast = "", this.toastUndo = !1;
      },
      t || n ? 8e3 : 3e3
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
        const t = await this._hass.fetchWithAuth(`/api/${D}/image/${e}`);
        if (!t.ok) throw new Error(`Bild nicht gefunden (${t.status})`);
        const n = URL.createObjectURL(await t.blob()), s = new Image();
        s.src = n, await s.decode(), this.imageUrl && URL.revokeObjectURL(this.imageUrl), this.imageUrl = n, this.imageSize = [s.naturalWidth, s.naturalHeight], this.loadedImage = e;
      } catch (t) {
        this.showToast(this.message(t), !0);
      }
  }
  async upload(e) {
    const t = e.target, n = t.files?.[0];
    if (t.value = "", !n) return;
    const s = new FormData();
    s.append("file", n);
    try {
      const i = await this._hass.fetchWithAuth(`/api/${D}/image`, {
        method: "POST",
        body: s
      }), r = await i.json();
      if (!i.ok) throw new Error(r.message ?? i.statusText);
      this.remember(), Object.assign(this.plan.garden, {
        background: "image",
        background_image: r.name,
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
      const t = w(e.scale_points[0], e.scale_points[1]);
      if (t > 0) return e.scale_distance_m / t;
    }
    return Wt;
  }
  // Ansicht --------------------------------------------------------------------
  toScreen(e) {
    const { cx: t, cy: n, scale: s } = this.view;
    return [(e[0] - t) * s + this.size.w / 2, (e[1] - n) * s + this.size.h / 2];
  }
  toPlan(e) {
    const n = this.renderRoot.querySelector("svg.plan").getBoundingClientRect(), { cx: s, cy: i, scale: r } = this.view;
    return [
      (e.clientX - n.left - this.size.w / 2) / r + s,
      (e.clientY - n.top - this.size.h / 2) / r + i
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
        const [r, a] = i.points[0];
        e.push([r - i.radius_m, a - i.radius_m], [r + i.radius_m, a + i.radius_m]);
      }
    if (t?.background === "image" && this.imageSize) {
      const i = this.imageMpp();
      e.push([0, 0], [this.imageSize[0] * i, this.imageSize[1] * i]);
    }
    if (!e.length) return null;
    const n = e.map((i) => i[0]), s = e.map((i) => i[1]);
    return [Math.min(...n), Math.min(...s), Math.max(...n), Math.max(...s)];
  }
  fitView() {
    const e = this.plan?.garden, t = this.bounds();
    if (e?.background === "map" && e.latitude != null && !t) {
      const p = e.map_zoom ?? 19;
      this.view = { cx: 0, cy: 0, scale: 1 / Ce(e.latitude, p) };
      return;
    }
    if (!t) {
      this.view = { cx: 0, cy: 0, scale: 25 };
      return;
    }
    const [n, s, i, r] = t, a = Math.max(i - n, 4), o = Math.max(r - s, 4), l = Math.min(this.size.w / (a * 1.15), this.size.h / (o * 1.15), 200);
    this.view = { cx: (n + i) / 2, cy: (s + r) / 2, scale: Math.max(l, 0.5) };
  }
  zoomBy(e, t, n) {
    this.autoFit = !1;
    const { cx: s, cy: i, scale: r } = this.view, a = Math.min(Math.max(r * e, 0.5), 400);
    if (!t || !n) {
      this.view = { cx: s, cy: i, scale: a };
      return;
    }
    this.view = {
      cx: t[0] - (n[0] - this.size.w / 2) / a,
      cy: t[1] - (n[1] - this.size.h / 2) / a,
      scale: a
    };
  }
  // Werkzeuge ------------------------------------------------------------------
  startTool(e, t = "") {
    this.tool = e, this.toolTarget = t, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.measurePts = [], this.hover = null, this.snapHint = null, e === "feature" && (this.featureKind = t), t && (e === "sprinkler" || e === "bed" || e === "hose") && (this.selected = { kind: "zone", id: t });
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
    for (const n of this.features) t.push(...n.points);
    for (const n of this.plan.zones)
      t.push(...n.polygon), n.center && t.push(n.center);
    for (const n of [...this.plan.valves, ...this.plan.sensors]) n.position && t.push(n.position);
    return t.push(...this.draft, ...this.measurePts), e ? t.filter((n) => n !== e) : t;
  }
  /** Punkt fangen (Alt-Taste: frei). Merkt den Fangpunkt für die Anzeige. */
  snap(e, t, n) {
    if (!this.snapOn || t?.altKey)
      return this.snapHint = null, e;
    const s = At(e, this.snapCandidates(n), Kt / this.view.scale);
    return this.snapHint = s, s ? [s[0], s[1]] : e;
  }
  finishFeature() {
    const e = this.featureKind, t = N(e) === "area" ? 3 : 2;
    if (this.draft.length < t) {
      this.showToast(`${C[e].label}: mindestens ${t} Punkte`, !0);
      return;
    }
    this.addFeature({ kind: e, points: this.draft.map((n) => [b(n[0]), b(n[1])]) }), this.cancelTool();
  }
  addFeature(e) {
    this.remember();
    const t = {
      id: Tt(this.features),
      radius_m: null,
      label: null,
      ...e
    };
    return this.features.push(t), this.selected = { kind: "feature", id: t.id }, this.tab = "plan", this.changed(), t;
  }
  deleteFeature(e) {
    const t = this.feature(e);
    this.remember(), this.plan.garden.features = this.features.filter((n) => n.id !== e), this.selected?.kind === "feature" && this.selected.id === e && (this.selected = null), this.changed(), this.removed(`${F(t)} entfernt`);
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
    this.remember(), this.zone(this.toolTarget).polygon = this.draft.map((e) => [b(e[0]), b(e[1])]), this.selected = { kind: "zone", id: this.toolTarget }, this.changed(), this.cancelTool();
  }
  finishHose() {
    if (this.draft.length < 2) {
      this.showToast("Ein Schlauch braucht mindestens 2 Punkte", !0);
      return;
    }
    this.remember();
    const e = this.zone(this.toolTarget);
    e.polygon = this.draft.map((t) => [b(t[0]), b(t[1])]), e.center = null, (!e.radius_m || e.radius_m > 3) && (e.radius_m = 0.3), this.selected = { kind: "zone", id: e.id }, this.changed(), this.cancelTool();
  }
  clearGeometry(e) {
    const t = this.zone(e);
    this.remember(), t.center = null, t.radius_m = null, t.polygon = [], this.changed(), this.removed(`${t.name}: Zeichnung entfernt`);
  }
  startDrag(e, t) {
    if (this.tool !== "select" || e.button !== 0) return;
    e.stopPropagation(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.remember(), this.drag = t;
  }
  moveFeature(e, t, n) {
    if (!("id" in e)) return;
    const s = this.feature(e.id);
    if (s) {
      switch (e.type) {
        case "new-tree":
        case "f-radius":
          s.radius_m = b(Math.max(0.1, w(s.points[0], t)));
          break;
        case "f-vertex": {
          const i = this.snap(t, n, s.points[e.index]);
          s.points[e.index] = [b(i[0]), b(i[1])];
          break;
        }
        case "f-move": {
          const i = t[0] - e.start[0], r = t[1] - e.start[1];
          s.points = e.orig.points.map((a) => [b(a[0] + i), b(a[1] + r)]);
          break;
        }
      }
      this.changed();
    }
  }
  insertVertex(e, t, n) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const s = t.polygon[n], i = t.polygon[(n + 1) % t.polygon.length];
    t.polygon.splice(n + 1, 0, [b((s[0] + i[0]) / 2), b((s[1] + i[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "vertex", id: t.id, index: n + 1 };
  }
  removeVertex(e, t, n) {
    e.preventDefault(), e.stopPropagation();
    const s = t.type === "hose" ? 2 : 3;
    if (t.polygon.length <= s) {
      this.showToast(`Mindestens ${s} Punkte`, !0);
      return;
    }
    this.remember(), t.polygon.splice(n, 1), this.changed();
  }
  marker(e, t) {
    return (e === "valve" ? this.plan.valves : this.plan.sensors).find((s) => s.id === t);
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
    const { cx: t, cy: n } = this.view;
    this.remember(), [e.latitude, e.longitude] = St([t, n], [e.latitude, e.longitude]).map(
      (i) => Math.round(i * 1e7) / 1e7
    );
    const s = (i) => [b(i[0] - t), b(i[1] - n)];
    for (const i of this.plan.zones)
      i.center && (i.center = s(i.center)), i.polygon = i.polygon.map(s);
    for (const i of [...this.plan.valves, ...this.plan.sensors])
      i.position && (i.position = s(i.position));
    for (const i of this.features) i.points = i.points.map(s);
    this.view = { ...this.view, cx: 0, cy: 0 }, this.searchPin && (this.searchPin = { ...this.searchPin, point: s(this.searchPin.point) }), this.changed(), this.showToast("Kartenmitte gesetzt");
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
        this.searchResults = await Dt(
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
    const t = this.plan.garden, n = 1 / Ce(e.latitude, 20.5);
    if (this.autoFit = !1, !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((i) => i.position) || t.latitude == null || t.longitude == null)
      this.remember(), t.latitude = Math.round(e.latitude * 1e7) / 1e7, t.longitude = Math.round(e.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: n }, this.searchPin = { point: [0, 0], name: e.name }, this.changed(), this.showToast(`${e.name}: Kartenmitte gesetzt. Fein ausrichten mit „Mitte hier festlegen“.`);
    else {
      const i = _t(e.latitude, e.longitude, [t.latitude, t.longitude]);
      this.view = { cx: i[0], cy: i[1], scale: n }, this.searchPin = { point: i, name: e.name }, this.showToast(`${e.name} angezeigt. „Mitte hier festlegen“ übernimmt die Stelle.`);
    }
    this.searchResults = null;
  }
  renderSearch() {
    return !this.searchOpen || this.tool !== "select" || this.plan.garden.background !== "map" ? d : h`
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
        ${this.searchError ? h`<p class="search-error">${this.searchError}</p>` : d}
        ${this.searchResults?.length ? h`<ul class="results">
              ${this.searchResults.map(
      (e) => h`<li>
                  <button type="button" @click=${() => this.goToPlace(e)}>
                    <ha-icon icon="mdi:map-marker"></ha-icon>
                    <span><strong>${e.name}</strong><small>${e.detail}</small></span>
                  </button>
                </li>`
    )}
            </ul>` : d}
        <p class="search-note">${Ot}. Die Adresse geht nur an die Suche und wird nicht gespeichert.</p>
      </div>
    `;
  }
  /** Umschalter für die Kartenansicht (Luftbild, Karte, …) direkt auf dem Plan. */
  renderLayers() {
    const e = this.plan.garden;
    if (!this.layersOpen || e.background !== "map") return d;
    const t = Object.entries(this.plan.providers).map(
      ([n, s]) => [n, s.short ?? s.name, s.kind === "map" ? "mdi:map-outline" : "mdi:satellite-variant"]
    );
    return e.map_url && t.push(["custom", "Eigene Adresse", "mdi:web"]), h`
      <div class="layers" role="menu" @pointerdown=${(n) => n.stopPropagation()}>
        ${t.map(
      ([n, s, i]) => h`<button
            role="menuitemradio"
            aria-checked=${e.map_provider === n ? "true" : "false"}
            class=${e.map_provider === n ? "active" : ""}
            @click=${() => {
        e.map_provider !== n && this.updateGarden({ map_provider: n }), this.layersOpen = !1;
      }}
          >
            <ha-icon icon=${i}></ha-icon>${s}
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
    if (w(this.scaleDraft[0], this.scaleDraft[1]) < 2) {
      this.showToast("Die beiden Punkte liegen zu nah beieinander", !0);
      return;
    }
    const t = (n) => [Math.round(n[0] * 10) / 10, Math.round(n[1] * 10) / 10];
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
      await this._hass.callService(D, "run_zone", { zone_id: e.id, duration: t }), this.showToast(`${e.name}: ${ge(t)} eingereiht`);
    } catch (n) {
      this.showToast(this.message(n), !0);
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
      ${this.page === "overview" ? this.renderOverview() : this.renderPlanPage()}
      ${this.renderToast()}
    ` : h`${this.renderHeader()}<div class="empty"><div class="spinner"></div></div>`;
  }
  renderPlanPage() {
    return h`
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
    return h`
      ${this.toast ? h`<div class="toast" role="status">
            <span>${this.toast}</span>
            ${this.toastUndo ? h`<button
                  class="text"
                  @click=${() => {
      this.undo(), this.toast = "", this.toastUndo = !1;
    }}
                >
                  Rückgängig
                </button>` : d}
          </div>` : d}
    `;
  }
  // Nässekarte -----------------------------------------------------------------
  wetGrid() {
    const e = this.plan, t = this.bounds();
    if (!t) return null;
    const n = JSON.stringify([
      e.zones,
      e.valves.map((s) => [s.id, s.learned_flow_l_min]),
      e.garden.features.filter((s) => s.kind === "tree"),
      Object.entries(this.status?.zones ?? {}).map(([s, i]) => [s, i.planned_s])
    ]);
    if (this.wetCache?.key !== n) {
      const i = Bt(e.zones, e.valves, this.status, e.garden.features, [
        t[0] - 1,
        t[1] - 1,
        t[2] + 1,
        t[3] + 1
      ]);
      this.wetCache = { key: n, grid: i, url: Ft(i) };
    }
    return this.wetCache;
  }
  renderWetMap() {
    const e = this.wetGrid();
    if (!e?.url) return d;
    const t = e.grid;
    return m`<image class="wet-layer" href=${e.url} x=${t.x0} y=${t.y0}
      width=${t.cols * t.step} height=${t.rows * t.step} preserveAspectRatio="none"></image>`;
  }
  /** Messwerte der Sensoren neben dem Symbol (Bodenfeuchte farbig). */
  renderSensorValues(e) {
    const t = this.status?.sensors ?? {};
    return this.plan.sensors.map((n) => {
      const s = t[n.id];
      if (!n.position || !s || typeof s.value != "number") return d;
      let i = "";
      if (n.kind === "soil_moisture") {
        const a = s.field_capacity_pct - s.wilting_point_pct, o = a > 0 ? (s.value - s.wilting_point_pct) / a : 0.5;
        i = o < 0.35 ? "dry" : o > 0.85 ? "wet" : "ok";
      }
      const r = `${Math.round(s.value * 10) / 10}${s.unit ? ` ${s.unit}` : ""}`;
      return m`<text class="sensor-value ${i}" x=${n.position[0]} y=${n.position[1]} dy=${24 * e}
        font-size=${12 * e} stroke-width=${3 * e}>${r}</text>`;
    });
  }
  renderWetLegend() {
    const e = this.plan.zones.filter(
      (s) => s.enabled && oe(s) !== null && me(s, this.plan.valves, this.status) === null
    ), t = z[z.length - 1][0], n = z.map(([s, [i, r, a]]) => `rgb(${i},${r},${a}) ${s / t * 100}%`).join(", ");
    return h`<div class="wet-legend">
      <strong>Wasser pro Durchgang</strong>
      <div class="bar" style="background: linear-gradient(to right, ${n})"></div>
      <div class="ticks">${z.map(([s]) => h`<span>${s}${s === t ? "+" : ""}</span>`)}<em>mm</em></div>
      ${e.length ? h`<small>Ohne Wert (kein Ventil, Durchfluss oder Dauer): ${e.map((s) => s.name).join(", ")}</small>` : d}
      <small>Schätzung aus Dauer × gelerntem Durchfluss; Überlappungen zählen doppelt.</small>
    </div>`;
  }
  // Übersicht ------------------------------------------------------------------
  renderOverview() {
    const e = this.plan, t = e.zones, n = (c) => e.valves.find((f) => f.id === c.valve_id), s = t.map((c) => {
      const f = oe(c), _ = f ?? c.area_m2, S = n(c)?.learned_flow_l_min ?? null, k = Je(c, this.status), P = S && k ? k / 60 * S : null;
      return { z: c, drawn: f, area: _, flow: S, seconds: k, liters: P, mm: me(c, e.valves, this.status) };
    }), i = s.filter((c) => c.z.enabled), r = i.reduce((c, f) => c + (f.area ?? 0), 0), a = i.reduce((c, f) => c + (f.liters ?? 0), 0), o = t.reduce((c, f) => c + f.overlap_m2, 0) / 2, l = ["sprinkler", "drip", "hose"].map((c) => {
      const f = i.filter((_) => _.z.type === c);
      return { type: c, count: f.length, area: f.reduce((_, S) => _ + (S.area ?? 0), 0) };
    }), p = {
      sprinkler: ["Sprinkler", "mdi:sprinkler-variant"],
      drip: ["Tropfschlauch", "mdi:water-outline"],
      hose: ["Gießschlauch", "mdi:pipe"]
    }, u = [];
    for (const c of s)
      c.z.enabled && (c.drawn === null && !c.z.area_m2 ? u.push(`${c.z.name}: weder gezeichnet noch Fläche von Hand`) : c.drawn === null && u.push(`${c.z.name}: noch nicht gezeichnet (Fläche von Hand)`), c.z.valve_id ? c.flow || u.push(`${c.z.name}: Durchfluss noch nicht gelernt (nach dem ersten Lauf)`) : u.push(`${c.z.name}: kein Ventil zugeordnet`));
    const g = e.valves.map((c) => {
      const f = i.filter((k) => k.z.valve_id === c.id), _ = f.reduce((k, P) => k + (P.area ?? 0), 0), S = c.learned_flow_l_min && _ ? c.learned_flow_l_min * 60 / _ : null;
      return { v: c, mine: f, area: _, rate: S };
    }).filter((c) => c.mine.length), x = (c, f = 0) => c == null ? "–" : c.toLocaleString("de-DE", { maximumFractionDigits: f });
    return h`
      <div class="overview">
        <section class="tiles">
          <div class="tile"><span>Bewässerte Fläche</span><strong>${M(r)}</strong>
            <small>${i.length} aktive Zonen</small></div>
          <div class="tile"><span>Gezeichnet</span><strong>${s.filter((c) => c.drawn !== null).length} von ${t.length}</strong>
            <small>Zonen im Plan</small></div>
          <div class="tile"><span>Wasser pro Durchgang</span><strong>${x(a)} L</strong>
            <small>alle aktiven Zonen einmal</small></div>
          <div class="tile ${o > 0.5 ? "warn" : ""}"><span>Überschneidungen</span><strong>${M(o)}</strong>
            <small>werden doppelt gegossen</small></div>
        </section>
        <section class="types">
          ${l.map(
      (c) => h`<div class="type">
              <ha-icon icon=${p[c.type][1]}></ha-icon>
              <span>${p[c.type][0]}</span>
              <strong>${M(c.area)}</strong>
              <small>${c.count} Zone${c.count === 1 ? "" : "n"}</small>
            </div>`
    )}
        </section>
        ${u.length ? h`<section class="card"><h3>Noch offen</h3><ul class="hints">${u.map((c) => h`<li>${c}</li>`)}</ul></section>` : d}
        <section class="card">
          <h3>Zonen</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Zone</th><th>Art</th><th>Ventil</th><th class="n">Fläche</th><th class="n">Dauer</th>
                <th class="n">Liter</th><th class="n">mm</th><th class="n">Bedarf</th></tr></thead>
              <tbody>
                ${s.map(
      (c, f) => h`<tr class=${c.z.enabled ? "" : "off"}>
                    <td><span class="dot" style="--zone:${this.zoneColor(f)}"></span>${c.z.name}</td>
                    <td>${p[c.z.type]?.[0] ?? c.z.type}</td>
                    <td>${n(c.z)?.name ?? "–"}</td>
                    <td class="n">${c.area ? M(c.area) : "–"}${c.drawn === null && c.area ? h`<sup title="von Hand">*</sup>` : d}</td>
                    <td class="n">${c.seconds ? ge(c.seconds) : "–"}</td>
                    <td class="n">${x(c.liters)}</td>
                    <td class="n">${x(c.mm, 1)}</td>
                    <td class="n">${this.status?.zones[c.z.id] ? `${x(this.status.zones[c.z.id].need_mm, 1)} mm` : "–"}</td>
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
                ${g.map(
      (c) => h`<tr>
                    <td>${c.v.name}</td>
                    <td>${c.mine.map((f) => f.z.name).join(", ")}</td>
                    <td class="n">${M(c.area)}</td>
                    <td class="n">${c.v.learned_flow_l_min ? `${x(c.v.learned_flow_l_min, 1)} L/min` : "–"}</td>
                    <td class="n">${c.rate ? `${x(c.rate, 1)} mm/h` : "–"}</td>
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
        ${this.plan ? h`<nav class="pages">
              <button class=${this.page === "plan" ? "active" : ""} @click=${() => this.page = "plan"}>
                <ha-icon icon="mdi:map-outline"></ha-icon>Plan
              </button>
              <button class=${this.page === "overview" ? "active" : ""} @click=${() => this.page = "overview"}>
                <ha-icon icon="mdi:chart-box-outline"></ha-icon>Übersicht
              </button>
            </nav>` : d}
        ${e ? h`<div class="chips">
              ${e.winter_mode ? h`<span class="chip winter"><ha-icon icon="mdi:snowflake"></ha-icon>Winterpause</span>` : h`<span class="chip ${e.automatic ? "on" : ""}"
                    ><ha-icon icon=${e.automatic ? "mdi:calendar-check" : "mdi:calendar-remove"}></ha-icon
                    >${e.automatic ? "Automatik an" : "Automatik aus"}</span
                  >`}
              ${e.problems.length ? h`<span class="chip alarm" title=${e.problems.join(`
`)}
                    ><ha-icon icon="mdi:alert"></ha-icon>${e.problems.length} Problem${e.problems.length > 1 ? "e" : ""}</span
                  >` : d}
            </div>` : d}
        <div class="spacer"></div>
        ${this.plan ? h`
              <button class="icon" title="Rückgängig (Strg+Z)" ?disabled=${!this.history.length} @click=${this.undo}>
                <ha-icon icon="mdi:undo"></ha-icon>
              </button>
              <button class="text" ?disabled=${!this.dirty || this.saving} @click=${this.discard}>Verwerfen</button>
              <button class="primary" ?disabled=${!this.dirty || this.saving} @click=${this.save}>
                <ha-icon icon="mdi:content-save"></ha-icon>${this.saving ? "Speichert …" : "Speichern"}
              </button>
              <div class="menu-wrap">
                <button class="icon" title="Sichern und Wiederherstellen" @click=${() => this.menuOpen = !this.menuOpen}>
                  <ha-icon icon="mdi:dots-vertical"></ha-icon>
                </button>
                ${this.menuOpen ? h`<div class="popup-menu" role="menu">
                      <button role="menuitem" @click=${this.exportPlan}>
                        <ha-icon icon="mdi:download"></ha-icon>Sicherung herunterladen
                      </button>
                      <label class="menu-item" role="menuitem">
                        <ha-icon icon="mdi:upload"></ha-icon>Sicherung einspielen …
                        <input type="file" accept="application/json,.json" @change=${this.pickImport} />
                      </label>
                    </div>` : d}
              </div>
            ` : d}
      </header>
      ${this.renderImportDialog()}
    `;
  }
  // Sichern und Wiederherstellen -------------------------------------------------
  async exportPlan() {
    this.menuOpen = !1;
    try {
      const e = await this._hass.callWS({ type: `${D}/export` }), t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), n = URL.createObjectURL(t), s = document.createElement("a");
      s.href = n, s.download = `bewaesserung-sicherung-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, s.style.display = "none", document.body.appendChild(s), s.click(), s.remove(), setTimeout(() => URL.revokeObjectURL(n), 1e3), this.showToast(
        this.dirty ? "Sicherung heruntergeladen (ohne die noch nicht gespeicherten Änderungen)" : "Sicherung heruntergeladen"
      );
    } catch (e) {
      this.showToast(`Sicherung fehlgeschlagen: ${this.message(e)}`, !0);
    }
  }
  async pickImport(e) {
    const t = e.target, n = t.files?.[0];
    if (t.value = "", this.menuOpen = !1, !!n)
      try {
        const s = JSON.parse(await n.text());
        this.pendingImport = { name: n.name, data: s };
      } catch {
        this.showToast("Die Datei ist keine gültige Sicherung (kein JSON)", !0);
      }
  }
  async runImport(e) {
    const t = this.pendingImport;
    if (t) {
      this.pendingImport = null;
      try {
        const n = await this._hass.callWS({
          type: `${D}/import`,
          mode: e,
          data: t.data
        }), s = n.notes.length ? ` ${n.notes.join(" ")}` : "";
        n.reloaded ? (this.showToast(`Sicherung eingespielt, wird neu geladen …${s}`), this.unsub?.(), this.unsub = void 0, setTimeout(() => void this.load(), 4e3)) : (this.showToast(`Zeichnung übernommen.${s}`), await this.load());
      } catch (n) {
        this.showToast(`Nicht eingespielt: ${this.message(n)}`, !0);
      }
    }
  }
  renderImportDialog() {
    if (!this.pendingImport) return d;
    const e = this.pendingImport.data?.exported_at;
    return h`
      <div class="dialog-backdrop" @click=${() => this.pendingImport = null}>
        <div class="dialog" role="dialog" aria-modal="true" @click=${(t) => t.stopPropagation()}>
          <h2>Sicherung einspielen</h2>
          <p>
            <strong>${this.pendingImport.name}</strong>${e ? h`<br /><small>erstellt am ${new Date(e).toLocaleString("de-DE")}</small>` : d}
          </p>
          ${this.dirty ? h`<p class="note warn">Nicht gespeicherte Änderungen gehen dabei verloren.</p>` : d}
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
    const { w: e, h: t } = this.size, { cx: n, cy: s, scale: i } = this.view, r = `translate(${e / 2} ${t / 2}) scale(${i}) translate(${-n} ${-s})`, a = 1 / i, o = this.tool === "select" ? this.drag?.type === "pan" ? "grabbing" : "grab" : "crosshair";
    return h`
      <svg
        class="plan ${this.wetOn ? "wet" : ""}"
        width=${e}
        height=${t}
        style="cursor:${o}"
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @wheel=${this.onWheel}
        @dblclick=${(l) => {
      this.tool === "bed" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishBed()), this.tool === "hose" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishHose()), this.tool === "feature" && N(this.featureKind) !== "point" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishFeature());
    }}
      >
        <g transform=${r}>
          ${this.renderBackground(a)}
          <g class="features">${this.renderFeatures(a)}</g>
          ${this.wetOn ? this.renderWetMap() : d}
          ${this.plan.zones.map((l, p) => this.renderZone(l, p, a))}
          ${this.renderSelectedHandles(a)} ${this.renderFeatureHandles(a)}
          ${this.renderDraft(a)} ${this.renderScaleDraft(a)} ${this.renderMeasure(a)}
          ${this.renderValveLinks(a)}
          ${this.plan.valves.map((l) => this.renderMarker("valve", l, a))}
          ${this.plan.sensors.map((l) => this.renderMarker("sensor", l, a))}
          ${this.wetOn ? this.renderSensorValues(a) : d}
          ${this.renderSnapHint(a)}
          ${this.searchPin && this.plan.garden.background === "map" ? m`<g class="pin" transform="translate(${this.searchPin.point[0]} ${this.searchPin.point[1]}) scale(${a})">
                <path d="M0 0 C-3 -9 -11 -13 -11 -22 A11 11 0 1 1 11 -22 C11 -13 3 -9 0 0 Z"></path>
                <circle cx="0" cy="-22" r="4"></circle>
                <title>${this.searchPin.name}</title>
              </g>` : d}
        </g>
      </svg>
    `;
  }
  visibleBox() {
    const { cx: e, cy: t, scale: n } = this.view, s = this.size.w / 2 / n, i = this.size.h / 2 / n;
    return { x0: e - s, y0: t - i, x1: e + s, y1: t + i };
  }
  renderBackground(e) {
    const t = this.plan.garden, n = this.visibleBox(), s = [];
    if (t.background === "map" && t.latitude != null && t.longitude != null) {
      const a = this.tileTemplate();
      if (a) {
        const o = this.plan.providers[t.map_provider ?? ""], l = o?.max_zoom ?? 20, p = Math.max(
          1,
          Math.min(l, Math.round(Ie(t.latitude, this.view.scale * (window.devicePixelRatio > 1 ? 1.4 : 1))))
        ), u = Re(a, [t.latitude, t.longitude], n, p);
        s.push(m`<rect x=${n.x0} y=${n.y0} width=${n.x1 - n.x0} height=${n.y1 - n.y0} class="map-fill"></rect>`);
        const g = e * 0.5, x = (c) => c.map(
          (f) => m`<image href=${f.url} x=${f.x - g} y=${f.y - g} width=${f.size + 2 * g} height=${f.size + 2 * g} preserveAspectRatio="none" crossorigin="anonymous"></image>`
        );
        s.push(...x(u)), o?.overlay && t.map_provider !== "custom" && s.push(...x(Re(o.overlay, [t.latitude, t.longitude], n, p)));
      }
    } else if (t.background === "image" && this.imageUrl && this.imageSize) {
      const a = this.imageMpp();
      s.push(
        m`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * a} height=${this.imageSize[1] * a} preserveAspectRatio="none"></image>`
      );
    }
    const i = [m`<g class="bg" opacity=${t.background_opacity ?? 1}>${s}</g>`], r = (t.background_opacity ?? 1) < 0.35;
    return (t.background !== "map" || r) && i.push(this.renderGrid(n, e, t.background === "image" && !r)), i;
  }
  renderGrid(e, t, n) {
    const s = Xe(40 * t), i = [], r = s * 5;
    for (let a = Math.floor(e.x0 / s) * s; a <= e.x1; a += s) {
      const o = Math.abs(a / r - Math.round(a / r)) < 1e-6;
      i.push(m`<line x1=${a} y1=${e.y0} x2=${a} y2=${e.y1} class=${o ? "grid major" : "grid"}></line>`);
    }
    for (let a = Math.floor(e.y0 / s) * s; a <= e.y1; a += s) {
      const o = Math.abs(a / r - Math.round(a / r)) < 1e-6;
      i.push(m`<line x1=${e.x0} y1=${a} x2=${e.x1} y2=${a} class=${o ? "grid major" : "grid"}></line>`);
    }
    return m`<g class=${n ? "grid-layer faint" : "grid-layer"}>${i}</g>`;
  }
  tileTemplate() {
    const e = this.plan.garden;
    return e.map_provider === "custom" ? e.map_url ?? "" : this.plan.providers[e.map_provider ?? ""]?.url ?? "";
  }
  zoneColor(e) {
    return Ne[e % Ne.length];
  }
  renderZone(e, t, n) {
    const s = this.zoneColor(t), i = this.status?.zones[e.id]?.state ?? "idle", r = this.selected?.kind === "zone" && this.selected.id === e.id, a = `zone ${i} ${r ? "selected" : ""} ${e.enabled ? "" : "disabled"}`;
    let o, l = null;
    if (e.type === "sprinkler" && e.center && e.radius_m)
      o = m`<path d=${wt(e.center, e.radius_m, e.start_angle_deg, e.arc_deg)}></path>`, l = e.arc_deg >= 360 ? e.center : E(e.center, e.radius_m * 0.55, e.start_angle_deg + e.arc_deg / 2);
    else if (e.type === "hose" && e.polygon.length >= 2 && e.radius_m) {
      const u = e.polygon.map((g) => g.join(",")).join(" ");
      o = m`<polyline class="hose-band" points=${u} stroke-width=${2 * e.radius_m}></polyline>
        <polyline class="hose-line" points=${u}></polyline>`, l = this.zoneAnchor(e);
    } else e.type === "drip" && e.polygon.length >= 3 && (o = m`<polygon points=${e.polygon.map((u) => u.join(",")).join(" ")}></polygon>`, l = pe(e.polygon));
    if (!o) return d;
    const p = ne(e);
    return m`
      <g class=${a} style="--zone:${s}"
        @pointerdown=${(u) => {
      this.tool === "select" && (this.selected = { kind: "zone", id: e.id }, this.tab = "zones", this.startDrag(u, { type: "move-zone", id: e.id, start: this.toPlan(u), orig: structuredClone(e) }));
    }}>
        ${o}
        ${l ? m`<text x=${l[0]} y=${l[1]} font-size=${13 * n} stroke-width=${3 * n} class="label">
              <tspan x=${l[0]} dy="0">${e.name}</tspan>
              <tspan x=${l[0]} dy=${15 * n} class="sub">${M(p)}${ue[i] ? ` · ${ue[i]}` : ""}</tspan>
            </text>` : d}
      </g>`;
  }
  renderSelectedHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "zone") return d;
    const t = this.zone(this.selected.id), n = 7 * e, s = (r, a, o = "", l = "") => m`<circle class="handle ${o}" cx=${r[0]} cy=${r[1]} r=${n}
        @pointerdown=${(p) => this.startDrag(p, a)}><title>${l}</title></circle>`;
    if (t.type === "sprinkler" && t.center && t.radius_m) {
      const r = t.center, a = t.arc_deg >= 360, o = a ? t.start_angle_deg + 135 : t.start_angle_deg + t.arc_deg / 2, l = [
        m`<line class="guide" x1=${r[0]} y1=${r[1]} x2=${E(r, t.radius_m, t.start_angle_deg)[0]} y2=${E(r, t.radius_m, t.start_angle_deg)[1]}></line>`,
        s(r, { type: "center", id: t.id }, "center", "Mittelpunkt verschieben"),
        s(E(r, t.radius_m, o), { type: "radius", id: t.id }, "radius", "Reichweite ändern"),
        s(E(r, t.radius_m, t.start_angle_deg), { type: "start", id: t.id }, "angle", "Anfang des Bogens")
      ];
      return a ? l.push(
        s(E(r, t.radius_m * 0.8, t.start_angle_deg + 20), { type: "end", id: t.id }, "angle small", "Bogen öffnen")
      ) : l.push(
        s(E(r, t.radius_m, t.start_angle_deg + t.arc_deg), { type: "end", id: t.id }, "angle", "Ende des Bogens")
      ), l;
    }
    const i = t.type === "hose" ? 2 : 3;
    if (t.type !== "sprinkler" && t.polygon.length >= i) {
      const r = t.polygon;
      return [
        ...(t.type === "hose" ? r.slice(0, -1) : r).map((o, l) => {
          const p = r[(l + 1) % r.length], u = [(o[0] + p[0]) / 2, (o[1] + p[1]) / 2];
          return m`<circle class="handle mid" cx=${u[0]} cy=${u[1]} r=${n * 0.7}
            @pointerdown=${(g) => this.insertVertex(g, t, l)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
        }),
        ...r.map(
          (o, l) => m`<circle class="handle" cx=${o[0]} cy=${o[1]} r=${n}
            @pointerdown=${(p) => this.startDrag(p, { type: "vertex", id: t.id, index: l })}
            @contextmenu=${(p) => this.removeVertex(p, t, l)}
            @dblclick=${(p) => this.removeVertex(p, t, l)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
        )
      ];
    }
    return d;
  }
  renderFeatures(e) {
    return this.features.map((t) => {
      const n = this.selected?.kind === "feature" && this.selected.id === t.id, s = N(t.kind), i = (l) => {
        this.tool === "select" && (this.selected = { kind: "feature", id: t.id }, this.tab = "plan", this.startDrag(l, { type: "f-move", id: t.id, start: this.toPlan(l), orig: structuredClone(t) }));
      }, r = `feature ${t.kind} ${n ? "selected" : ""}`;
      if (s === "area") {
        const l = pe(t.points);
        return m`<polygon class=${r} points=${t.points.map((p) => p.join(",")).join(" ")}
          @pointerdown=${i}><title>${F(t)}</title></polygon>
          ${t.label ? m`<text class="feature-name" x=${l[0]} y=${l[1]} dy=${4 * e} font-size=${12 * e}
                stroke-width=${3 * e}>${t.label}</text>` : d}`;
      }
      if (s === "line")
        return m`<g class=${r} @pointerdown=${i}>
          <polyline class="hit" points=${t.points.map((l) => l.join(",")).join(" ")} stroke-width=${12 * e}></polyline>
          <polyline points=${t.points.map((l) => l.join(",")).join(" ")}></polyline>
          <title>${F(t)}</title></g>`;
      const [a, o] = t.points[0];
      return t.kind === "tree" ? m`<g class=${r} @pointerdown=${i}>
          <circle cx=${a} cy=${o} r=${t.radius_m ?? 1}></circle>
          <circle class="trunk" cx=${a} cy=${o} r=${Math.max(3 * e, (t.trunk_m ?? 0) / 2)}></circle>
          <title>${F(t)}</title></g>` : t.kind === "label" ? m`<text class=${r} x=${a} y=${o} font-size=${14 * e} stroke-width=${3 * e}
          @pointerdown=${i}>${t.label}</text>` : m`<g class=${r} @pointerdown=${i}>
        <circle cx=${a} cy=${o} r=${8 * e}></circle>
        <text x=${a} y=${o} dy=${4 * e} font-size=${11 * e}>H</text>
        <title>${F(t)}</title></g>`;
    });
  }
  renderFeatureHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "feature") return d;
    const t = this.feature(this.selected.id);
    if (!t) return d;
    const n = 7 * e, s = N(t.kind);
    if (s === "point") {
      if (t.kind !== "tree") return d;
      const [o, l] = t.points[0], p = E(t.points[0], t.radius_m ?? 1, 135);
      return m`
        <circle class="handle center" cx=${o} cy=${l} r=${n}
          @pointerdown=${(u) => this.startDrag(u, { type: "f-move", id: t.id, start: this.toPlan(u), orig: structuredClone(t) })}></circle>
        <circle class="handle" cx=${p[0]} cy=${p[1]} r=${n}
          @pointerdown=${(u) => this.startDrag(u, { type: "f-radius", id: t.id })}><title>Kronengröße</title></circle>`;
    }
    const i = t.points;
    return [
      ...(s === "area" ? i : i.slice(0, -1)).map((o, l) => {
        const p = i[(l + 1) % i.length], u = [(o[0] + p[0]) / 2, (o[1] + p[1]) / 2];
        return m`<circle class="handle mid" cx=${u[0]} cy=${u[1]} r=${n * 0.7}
        @pointerdown=${(g) => this.insertFeatureVertex(g, t, l)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
      }),
      ...i.map(
        (o, l) => m`<circle class="handle" cx=${o[0]} cy=${o[1]} r=${n}
          @pointerdown=${(p) => this.startDrag(p, { type: "f-vertex", id: t.id, index: l })}
          @contextmenu=${(p) => this.removeFeatureVertex(p, t, l)}
          @dblclick=${(p) => this.removeFeatureVertex(p, t, l)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
      )
    ];
  }
  insertFeatureVertex(e, t, n) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const s = t.points[n], i = t.points[(n + 1) % t.points.length];
    t.points.splice(n + 1, 0, [b((s[0] + i[0]) / 2), b((s[1] + i[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "f-vertex", id: t.id, index: n + 1 };
  }
  removeFeatureVertex(e, t, n) {
    e.preventDefault(), e.stopPropagation();
    const s = N(t.kind) === "area" ? 3 : 2;
    if (t.points.length <= s) {
      this.showToast(`${C[t.kind].label}: mindestens ${s} Punkte`, !0);
      return;
    }
    this.remember(), t.points.splice(n, 1), this.changed();
  }
  /** Messwerkzeug: Strecken mit Längen und Summe. */
  renderMeasure(e) {
    if (this.tool !== "measure" || !this.measurePts.length) return d;
    const t = this.hover ? [...this.measurePts, this.hover] : this.measurePts, n = t.slice(1).map((s, i) => {
      const r = t[i];
      if (w(r, s) < 0.01) return d;
      const a = [(r[0] + s[0]) / 2, (r[1] + s[1]) / 2];
      return m`<text class="measure-label" x=${a[0]} y=${a[1]} dy=${-6 * e} font-size=${13 * e}
        stroke-width=${3 * e}>${U(w(r, s))}</text>`;
    });
    return m`<g class="measure">
      <polyline points=${t.map((s) => s.join(",")).join(" ")}></polyline>
      ${this.measurePts.map((s) => m`<circle cx=${s[0]} cy=${s[1]} r=${4 * e}></circle>`)}
      ${n}
    </g>`;
  }
  /** Mittelpunkt einer gezeichneten Zone (für Beschriftung und Verbindungslinie). */
  zoneAnchor(e) {
    return e.type === "sprinkler" ? e.center && e.radius_m ? e.center : null : e.type === "hose" ? e.polygon.length >= 2 ? zt(e.polygon, 0.5) : null : e.polygon.length >= 3 ? pe(e.polygon) : null;
  }
  /** Gestrichelte Linie von jeder Zone zu ihrem Ventil (wenn beide im Plan sind). */
  renderValveLinks(e) {
    return this.plan.zones.map((t, n) => {
      const s = this.plan.valves.find((l) => l.id === t.valve_id), i = this.zoneAnchor(t);
      if (!s?.position || !i) return d;
      const r = this.selected?.kind === "zone" && this.selected.id === t.id || this.selected?.kind === "valve" && this.selected.id === s.id, [a, o] = s.position;
      return m`<line class="valve-link ${r ? "selected" : ""}" style="--zone:${this.zoneColor(n)}"
        x1=${i[0]} y1=${i[1]} x2=${a} y2=${o} stroke-dasharray=${`${6 * e} ${4 * e}`}></line>`;
    });
  }
  renderSnapHint(e) {
    return this.snapHint ? m`<circle class="snap-hint" cx=${this.snapHint[0]} cy=${this.snapHint[1]} r=${9 * e}></circle>` : d;
  }
  renderDraft(e) {
    if (this.tool === "feature" && this.draft.length) {
      const s = this.hover ? [...this.draft, this.hover] : this.draft, i = N(this.featureKind) === "area";
      return m`
        <g class="draft feature-draft ${this.featureKind}">
          <polyline points=${[...s, ...i && s.length > 2 ? [s[0]] : []].map((r) => r.join(",")).join(" ")}></polyline>
          ${this.draft.map((r, a) => m`<circle cx=${r[0]} cy=${r[1]} r=${(a === 0 ? 7 : 5) * e}></circle>`)}
        </g>`;
    }
    if (this.tool === "hose" && this.draft.length) {
      const s = this.hover ? [...this.draft, this.hover] : this.draft;
      return m`<g class="draft">
        <polyline points=${s.map((i) => i.join(",")).join(" ")} style="fill:none"></polyline>
        ${this.draft.map((i) => m`<circle cx=${i[0]} cy=${i[1]} r=${5 * e}></circle>`)}
      </g>`;
    }
    if (this.tool !== "bed" || !this.draft.length) return d;
    const t = this.hover ? [...this.draft, this.hover] : this.draft, n = this.plan.zones.findIndex((s) => s.id === this.toolTarget);
    return m`
      <g class="draft" style="--zone:${this.zoneColor(n)}">
        <polyline points=${t.map((s) => s.join(",")).join(" ")}></polyline>
        ${this.draft.map(
      (s, i) => m`<circle cx=${s[0]} cy=${s[1]} r=${(i === 0 ? 8 : 5) * e} class=${i === 0 ? "first" : ""}></circle>`
    )}
      </g>`;
  }
  renderScaleDraft(e) {
    if (this.tool !== "scale") return d;
    const t = this.imageMpp(), n = this.scaleDraft.map((s) => [s[0] * t, s[1] * t]);
    return m`<g class="scale-draft">
      ${n.length === 2 ? m`<line x1=${n[0][0]} y1=${n[0][1]} x2=${n[1][0]} y2=${n[1][1]}></line>` : d}
      ${n.map((s) => m`<circle cx=${s[0]} cy=${s[1]} r=${6 * e}></circle>`)}
    </g>`;
  }
  renderMarker(e, t, n) {
    if (!t.position) return d;
    const [s, i] = t.position, r = this.selected?.kind === e && this.selected.id === t.id, a = e === "valve" ? "V" : je[t.kind] ?? "S", o = 11 * n;
    return m`
      <g class="marker ${e} ${r ? "selected" : ""}"
        @pointerdown=${(l) => {
      this.tool === "select" && (this.selected = { kind: e, id: t.id }, this.tab = "zones", this.startDrag(l, { type: "marker", kind: e, id: t.id }));
    }}>
        ${e === "valve" ? m`<rect x=${s - o} y=${i - o} width=${2 * o} height=${2 * o} rx=${4 * n}></rect>` : m`<circle cx=${s} cy=${i} r=${o}></circle>`}
        <text x=${s} y=${i} font-size=${12 * n} dy=${4.2 * n}>${a}</text>
        <title>${t.name}</title>
      </g>`;
  }
  renderOverlay() {
    const e = this.plan.garden, t = this.toolBanner(), n = Gt(this.view.scale), s = e.background === "map" ? this.plan.providers[e.map_provider ?? ""] : void 0;
    return h`
      <div class="tools">
        <button class="icon" title="Vergrößern" @click=${() => this.zoomBy(1.4)}><ha-icon icon="mdi:plus"></ha-icon></button>
        <button class="icon" title="Verkleinern" @click=${() => this.zoomBy(1 / 1.4)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="icon" title="Alles zeigen" @click=${this.fitView}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
        <button class="icon ${this.wetOn ? "on" : ""}" title="Nässekarte: wie viel Wasser wo ankommt"
          @click=${() => this.wetOn = !this.wetOn}>
          <ha-icon icon="mdi:water-percent"></ha-icon>
        </button>
        <button class="icon ${this.tool === "measure" ? "on" : ""}" title="Abstand messen"
          @click=${() => this.tool === "measure" ? this.cancelTool() : this.startTool("measure")}>
          <ha-icon icon="mdi:tape-measure"></ha-icon>
        </button>
        ${e.background === "map" ? h`<button class="icon ${this.layersOpen ? "on" : ""}" title="Kartenansicht wechseln"
              @click=${() => this.layersOpen = !this.layersOpen}>
              <ha-icon icon="mdi:layers-outline"></ha-icon>
            </button>` : d}
        ${e.background === "map" ? h`<button class="icon ${this.searchOpen ? "on" : ""}" title="Adresse suchen"
              @click=${() => this.searchOpen ? this.closeSearch() : this.openSearch()}>
              <ha-icon icon="mdi:magnify"></ha-icon>
            </button>` : d}
      </div>
      ${t} ${this.renderSearch()} ${this.renderLayers()}
      <div class="compass" style="transform: rotate(${e.background === "image" ? -e.north_deg : 0}deg)" title="Norden">
        <svg viewBox="-12 -12 24 24"><path d="M0 -10 L4 2 L0 0 L-4 2 Z" class="n"></path><path d="M0 10 L4 2 L0 0 L-4 2 Z" class="s"></path></svg>
        <span>N</span>
      </div>
      <div class="scalebar"><div style="width:${n.px}px"></div><span>${n.label}</span></div>
      ${this.wetOn ? this.renderWetLegend() : d}
      ${e.background === "map" ? h`<div class="attribution">${s?.attribution ?? "Eigener Kartendienst"}</div>` : d}
      ${!this.hasAnyDrawing() && this.tool === "select" ? h`<div class="welcome">
            <ha-icon icon="mdi:draw"></ha-icon>
            <div>
              <strong>Noch nichts gezeichnet.</strong><br />
              Wähle rechts einen Hintergrund und dann bei einer Zone „Zeichnen“.
            </div>
          </div>` : d}
    `;
  }
  hasAnyDrawing() {
    return this.features.length > 0 || this.plan.zones.some((e) => ne(e) !== null);
  }
  toolBanner() {
    if (this.tool === "select") return d;
    let e = "", t = d;
    const n = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    if (this.tool === "sprinkler" && (e = `${n}: Am Sprinkler drücken und bis zum Rand ziehen.`), this.tool === "hose" && (e = `${n}: Den Verlauf des Schlauchs anklicken, Doppelklick beendet.`, t = h`<button class="text" ?disabled=${this.draft.length < 2} @click=${this.finishHose}>Fertig</button>`), this.tool === "bed" && (e = `${n}: Ecken anklicken, zum Schließen den ersten Punkt.`, t = h`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`), this.tool === "place" && (e = `${n}: Auf die Stelle im Plan klicken.`), this.tool === "feature") {
      const s = C[this.featureKind], i = s.family;
      e = i === "area" ? `${s.label}: Ecken anklicken, zum Schließen den ersten Punkt.` : i === "line" ? `${s.label}: Punkte anklicken, Doppelklick beendet.` : this.featureKind === "tree" ? `${s.label}: In die Mitte drücken und bis zum Kronenrand ziehen.` : `${s.label}: Auf die Stelle klicken.`, i !== "point" && (t = h`<button
          class="text"
          ?disabled=${this.draft.length < (i === "area" ? 3 : 2)}
          @click=${this.finishFeature}
        >
          Fertig
        </button>`);
    }
    if (this.tool === "measure") {
      const s = X(this.measurePts);
      e = this.measurePts.length < 2 ? "Messen: Punkte anklicken. Alt-Taste: ohne Einrasten." : `Gemessen: ${U(s)}${this.measurePts.length > 2 ? " (Summe)" : ""}`, this.measurePts.length && (t = h`<button class="text" @click=${() => this.measurePts = []}>Neu</button>`);
    }
    return this.tool === "scale" && (e = this.scaleDraft.length < 2 ? "Maßstab: Zwei Punkte im Bild anklicken, deren Abstand du kennst (z. B. die Ecken der Terrasse)." : "Abstand eingeben:", this.scaleDraft.length === 2 && (t = h`<input
            class="small"
            type="text"
            inputmode="decimal"
            placeholder="Meter"
            .value=${this.scaleInput}
            @input=${(s) => this.scaleInput = s.target.value}
            @keydown=${(s) => s.key === "Enter" && this.applyScale()}
          /><span>m</span>
          <button class="text" @click=${this.applyScale}>Übernehmen</button>`)), h`<div class="banner">
      <span>${e}</span>${t}
      <button class="text" @click=${this.cancelTool}>Abbrechen</button>
    </div>`;
  }
  zoneOrMarkerName(e) {
    if (e.includes(":")) {
      const [t, n] = e.split(":");
      return this.marker(t, n)?.name ?? "";
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
        ${e.zones.map((n, s) => this.renderZoneItem(n, s, t?.kind === "zone" && t.id === n.id))}
      </ul>
      ${e.valves.length || e.sensors.length ? h`<h3>Ventile und Sensoren</h3>
            <ul class="list compact">
              ${e.valves.map((n) => this.renderMarkerItem("valve", n))}
              ${e.sensors.map((n) => this.renderMarkerItem("sensor", n))}
            </ul>` : d}
      <p class="hint small">
        Ziehen verschiebt die Ansicht, das Mausrad zoomt. Gezeichnete Flächen ersetzen die Fläche
        von Hand bei der Berechnung. Namen, Pflanzen und Ventile änderst du in den Einstellungen der
        Integration.
      </p>
    `;
  }
  renderZoneItem(e, t, n) {
    const s = this.status?.zones[e.id], i = ne(e), r = i !== null, a = e.type === "sprinkler";
    return h`
      <li class="item ${n ? "open" : ""}" style="--zone:${this.zoneColor(t)}">
        <div class="row" @click=${() => {
      this.selected = n ? null : { kind: "zone", id: e.id };
    }}>
          <span class="dot"></span>
          <ha-icon icon=${a ? "mdi:sprinkler-variant" : e.type === "hose" ? "mdi:pipe" : "mdi:water-outline"}></ha-icon>
          <span class="name">${e.name}</span>
          ${s && s.state !== "idle" ? h`<span class="badge ${s.state}">${ue[s.state]}</span>` : d}
          <span class="meta">${r ? M(i) : h`<em>nicht gezeichnet</em>`}</span>
        </div>
        ${n ? this.renderInspector(e, s) : d}
      </li>
    `;
  }
  renderInspector(e, t) {
    const n = e.type === "sprinkler", s = ne(e), i = s !== null, r = n ? "sprinkler" : e.type === "hose" ? "hose" : "bed", a = (o, l, p, u, g = 0.1) => h`<label class="field">
        <span>${o}</span>
        <input type="number" step=${g} .value=${l == null ? "" : String(l)}
          @change=${(x) => {
      const c = parseFloat(x.target.value);
      Number.isFinite(c) && (this.remember(), u(c), this.changed());
    }} />
        <span class="unit">${p}</span>
      </label>`;
    return h`
      <div class="inspector">
        <label class="field wide">
          <span>Ventil</span>
          <select
            @change=${(o) => {
      const l = o.target.value;
      this.remember(), e.valve_id = l || null;
      for (const p of this.plan.valves)
        p.zone_ids = p.zone_ids.filter((u) => u !== e.id), p.id === e.valve_id && p.zone_ids.push(e.id);
      this.changed();
    }}
          >
            <option value="" ?selected=${!e.valve_id}>kein Ventil</option>
            ${this.plan.valves.map(
      (o) => h`<option value=${o.id} ?selected=${e.valve_id === o.id}>
                ${o.name}${o.zone_ids.some((l) => l !== e.id) ? " (auch andere Zonen)" : ""}
              </option>`
    )}
          </select>
        </label>
        ${!this.plan.valves.find((o) => o.id === e.valve_id)?.position && e.valve_id ? h`<p class="hint small">Setze das Ventil im Plan (unten „Platzieren“), dann siehst du die Verbindung.</p>` : d}
        <dl>
          <dt>Fläche gezeichnet</dt>
          <dd>${i ? M(s) : "–"}</dd>
          <dt>Fläche von Hand</dt>
          <dd>${e.area_m2 ? M(e.area_m2) : "–"}</dd>
          ${e.overlap_m2 > 0.05 ? h`<dt>Überschneidung</dt><dd class="warn">${M(e.overlap_m2)} mit anderen Zonen</dd>` : d}
          ${t ? h`<dt>Bedarf</dt><dd>${t.need_mm.toFixed(1)} mm</dd>
                <dt>Geplant</dt><dd>${t.planned_s ? ge(t.planned_s) : "nicht gießen"}
                  <span class="reason">(${t.reason})</span></dd>` : d}
          ${t?.locked_reason ? h`<dt>Gesperrt</dt><dd class="warn">${t.locked_reason}</dd>` : d}
        </dl>
        ${n && i ? h`<div class="fields">
              ${a("Reichweite", e.radius_m, "m", (o) => e.radius_m = Math.max(0.1, o))}
              ${a("Richtung", e.start_angle_deg, "°", (o) => e.start_angle_deg = (o % 360 + 360) % 360, 5)}
              ${a("Bogen", e.arc_deg, "°", (o) => e.arc_deg = Math.min(360, Math.max(1, o)), 5)}
            </div>
            <p class="hint small">Richtung: Anfang des Bogens, 0° = Norden (oben), 90° = Osten.</p>` : d}
        ${e.type === "hose" && i ? h`<div class="fields">
                ${a("Bewässert je Seite", e.radius_m, "m", (o) => e.radius_m = Math.max(0.05, o), 0.05)}
              </div>
              <p class="hint small">Länge ${U(X(e.polygon))}, bewässert ${U(2 * (e.radius_m ?? 0))} breit.</p>
              ${this.renderEdges(e.polygon, !1, (o) => e.polygon = o)}` : d}
        ${e.type === "drip" && i ? this.renderEdges(e.polygon, !0, (o) => e.polygon = o) : d}
        <div class="actions">
          <button class="text" @click=${() => this.startTool(r, e.id)}>
            <ha-icon icon=${i ? "mdi:pencil" : "mdi:draw"}></ha-icon>${i ? "Neu zeichnen" : "Zeichnen"}
          </button>
          ${i ? h`<button class="text danger" @click=${() => this.clearGeometry(e.id)}>
                <ha-icon icon="mdi:eraser"></ha-icon>Entfernen
              </button>` : d}
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
    const n = this.selected?.kind === e && this.selected.id === t.id, s = e === "valve" ? t.safety_level === "device" ? "schließt selbst" : "nur Home Assistant" : Vt[t.kind] ?? "";
    return h`
      <li class="item ${n ? "open" : ""}">
        <div class="row" @click=${() => this.selected = { kind: e, id: t.id }}>
          <span class="marker-icon ${e}">${e === "valve" ? "V" : je[t.kind] ?? "S"}</span>
          <span class="name">${t.name}<small>${s}</small></span>
          <button class="text small" @click=${(i) => {
      i.stopPropagation(), this.startTool("place", `${e}:${t.id}`);
    }}>${t.position ? "Versetzen" : "Platzieren"}</button>
          ${t.position ? h`<button class="icon small" title="Vom Plan nehmen" @click=${(i) => {
      i.stopPropagation(), this.remember(), t.position = null, this.changed(), this.removed(`${t.name}: vom Plan genommen`);
    }}><ha-icon icon="mdi:close"></ha-icon></button>` : d}
        </div>
      </li>
    `;
  }
  /** Regler für die Deckkraft des Luftbilds oder Bilds (zum Abpausen). */
  renderOpacity() {
    const e = this.plan.garden;
    if (e.background === "none") return d;
    const t = Math.round((e.background_opacity ?? 1) * 100);
    return h`
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
          @input=${(n) => {
      this.plan.garden.background_opacity = Number(n.target.value) / 100, this.changed();
    }}
        />
        <output>${t} %</output>
      </label>
    `;
  }
  /** Kantenlängen ansehen und als Zahl eintippen (genauer als das Luftbild). */
  renderEdges(e, t, n) {
    const s = Pt(e, t);
    return h`
      <details class="edges">
        <summary>Seitenlängen (${s.length})</summary>
        <div class="edge-list">
          ${s.map(
      (i, r) => h`<label class="field">
              <span>Seite ${r + 1}</span>
              <input
                type="number"
                step="0.05"
                min="0.05"
                .value=${i.toFixed(2)}
                @change=${(a) => {
        const o = parseFloat(a.target.value.replace(",", "."));
        o > 0 && (this.remember(), n(Mt(e, r, o).map((l) => [b(l[0]), b(l[1])])), this.changed());
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
    const e = this.selected?.kind === "feature" ? this.feature(this.selected.id) : null, t = (n) => {
      const s = C[n], i = this.tool === "feature" && this.featureKind === n;
      return h`<button
        class="tool ${i ? "active" : ""}"
        title=${s.label}
        @click=${() => i ? this.cancelTool() : this.startTool("feature", n)}
      >
        <ha-icon icon=${s.icon}></ha-icon><span>${s.label}</span>
      </button>`;
    };
    return h`
      <p class="hint small">
        Pause Haus, Wege, Zäune und Bäume vom Luftbild ab. Dann kannst du das Luftbild abblenden und
        bleibst in jeder Zoomstufe scharf. Der Grundriss dient nur zur Orientierung.
      </p>
      ${this.renderOpacity()}
      <h3>Flächen</h3>
      <div class="palette">${["building", "paving", "water", "area"].map(t)}</div>
      <h3>Linien</h3>
      <div class="palette">${["fence", "hedge", "boundary", "pipe"].map(t)}</div>
      <h3>Punkte</h3>
      <div class="palette">${["tree", "tap", "label"].map(t)}</div>
      <label class="check">
        <input type="checkbox" .checked=${this.snapOn} @change=${(n) => this.snapOn = n.target.checked} />
        An Ecken einrasten <small>(Alt-Taste: kurz aus)</small>
      </label>
      ${this.features.length ? h`<h3>Im Plan (${this.features.length})</h3>
            <ul class="list compact">
              ${this.features.map((n) => this.renderFeatureItem(n, e?.id === n.id))}
            </ul>` : d}
    `;
  }
  renderFeatureItem(e, t) {
    const n = C[e.kind], s = n?.family ?? "area", i = s === "area" ? M(ke(e.points)) : s === "line" ? U(X(e.points)) : e.kind === "tree" ? `Ø ${U(2 * (e.radius_m ?? 0))}` : "", r = Object.entries(C).filter(([, a]) => a.family === s);
    return h`
      <li class="item ${t ? "open" : ""}">
        <div class="row" @click=${() => this.selected = t ? null : { kind: "feature", id: e.id }}>
          <ha-icon icon=${n?.icon ?? "mdi:shape-outline"}></ha-icon>
          <span class="name">${F(e)}</span>
          <span class="meta">${i}</span>
        </div>
        ${t ? h`<div class="inspector">
              ${e.kind !== "label" && r.length > 1 ? h`<label class="field wide">
                    <span>Art</span>
                    <select
                      .value=${e.kind}
                      @change=${(a) => {
      this.remember(), e.kind = a.target.value, this.changed();
    }}
                    >
                      ${r.map(([a, o]) => h`<option value=${a} ?selected=${a === e.kind}>${o.label}</option>`)}
                    </select>
                  </label>` : d}
              <label class="field wide">
                <span>${e.kind === "label" ? "Text" : "Name (optional)"}</span>
                <input
                  id=${e.kind === "label" ? "feature-label" : "feature-name"}
                  type="text"
                  maxlength=${Et}
                  .value=${e.label ?? ""}
                  @change=${(a) => {
      const o = a.target.value.trim();
      e.kind === "label" && !o || (this.remember(), e.label = o || null, this.changed());
    }}
                />
              </label>
              ${e.kind === "tree" ? h`<label class="field wide">
                    <span>Kronendurchmesser</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      .value=${(2 * (e.radius_m ?? 0)).toFixed(1)}
                      @change=${(a) => {
      const o = parseFloat(a.target.value);
      o > 0 && (this.remember(), e.radius_m = b(o / 2), this.changed());
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
                      @change=${(a) => {
      const o = parseFloat(a.target.value);
      o >= 0 && (this.remember(), e.trunk_m = o > 0 ? Math.min(b(o), 2 * (e.radius_m ?? 0)) : null, this.changed());
    }}
                    />
                    <span class="unit">m</span>
                  </label>
                  <p class="hint small">Ein dicker Stamm hält den Strahl eines Sprinklers auf. Die Nässekarte zeigt dahinter einen Wasserschatten.</p>` : d}
              ${s !== "point" ? this.renderEdges(e.points, s === "area", (a) => e.points = a) : d}
              <div class="actions">
                <span class="spacer"></span>
                <button class="text danger" @click=${() => this.deleteFeature(e.id)}>
                  <ha-icon icon="mdi:delete-outline"></ha-icon>Entfernen
                </button>
              </div>
            </div>` : d}
      </li>
    `;
  }
  renderBackgroundTab() {
    const e = this.plan.garden, t = this.plan.providers, n = (s, i, r, a) => h`
      <button class="choice ${e.background === s ? "active" : ""}" @click=${() => this.setBackground(s)}>
        <ha-icon icon=${i}></ha-icon>
        <span><strong>${r}</strong><small>${a}</small></span>
      </button>`;
    return h`
      <div class="choices">
        ${n("map", "mdi:satellite-variant", "Luftbild", "Kartendienst, live im Browser geladen")}
        ${n("image", "mdi:image-outline", "Eigenes Bild", "Foto, Skizze oder Screenshot")}
        ${n("none", "mdi:grid", "Raster", "Leeres Raster in Metern")}
      </div>
      ${this.renderOpacity()}
      ${e.background === "map" ? this.renderMapSettings(e, t) : d}
      ${e.background === "image" ? this.renderImageSettings(e) : d}
    `;
  }
  renderMapSettings(e, t) {
    return h`
      <h3>Kartendienst</h3>
      <select
        .value=${e.map_provider ?? "basemap_at"}
        @change=${(n) => this.updateGarden({ map_provider: n.target.value })}
      >
        ${Object.entries(t).map(
      ([n, s]) => h`<option value=${n} ?selected=${e.map_provider === n}>${s.name}</option>`
    )}
        <option value="custom" ?selected=${e.map_provider === "custom"}>Eigene Adresse …</option>
      </select>
      ${e.map_provider === "esri" ? h`<p class="note warn">
            Esri erlaubt die Nutzung nur nach seinen Nutzungsbedingungen. Für den privaten Garten ist das
            meist in Ordnung; prüfe es bitte selbst.
          </p>` : d}
      ${e.map_provider?.startsWith("basemap_at") ? h`<p class="note">Von basemap.at, nur in Österreich. Lizenz CC BY 4.0.</p>` : d}
      ${e.map_provider === "osm" ? h`<p class="note">
            OpenStreetMap-Karte, weltweit. Bitte nur gelegentlich nutzen (Regeln der OpenStreetMap-Kacheln).
          </p>` : d}
      <p class="hint small">Schneller umschalten: Ebenen-Knopf links auf der Karte.</p>
      ${e.map_provider === "custom" ? h`<label class="field wide">
              <span>Adresse mit {z}, {x}, {y}</span>
              <input type="url" placeholder="https://…/{z}/{x}/{y}.jpg" .value=${e.map_url ?? ""}
                @change=${(n) => this.updateGarden({ map_url: n.target.value.trim() })} />
            </label>` : d}
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
                @change=${(n) => this.updateGarden({ north_deg: parseFloat(n.target.value) || 0 })} />
              <span class="unit">°</span>
            </label>
            <p class="hint small">0° = Norden ist oben im Bild. Nur für die Kompassanzeige.</p>
          ` : d}
    `;
  }
};
$.styles = Ct;
v([
  We({ type: Boolean, reflect: !0 })
], $.prototype, "narrow", 2);
v([
  y()
], $.prototype, "plan", 2);
v([
  y()
], $.prototype, "status", 2);
v([
  y()
], $.prototype, "error", 2);
v([
  y()
], $.prototype, "toast", 2);
v([
  y()
], $.prototype, "tab", 2);
v([
  y()
], $.prototype, "featureKind", 2);
v([
  y()
], $.prototype, "measurePts", 2);
v([
  y()
], $.prototype, "snapOn", 2);
v([
  y()
], $.prototype, "snapHint", 2);
v([
  y()
], $.prototype, "tool", 2);
v([
  y()
], $.prototype, "toolTarget", 2);
v([
  y()
], $.prototype, "selected", 2);
v([
  y()
], $.prototype, "draft", 2);
v([
  y()
], $.prototype, "scaleDraft", 2);
v([
  y()
], $.prototype, "scaleInput", 2);
v([
  y()
], $.prototype, "view", 2);
v([
  y()
], $.prototype, "size", 2);
v([
  y()
], $.prototype, "imageUrl", 2);
v([
  y()
], $.prototype, "imageSize", 2);
v([
  y()
], $.prototype, "saving", 2);
v([
  y()
], $.prototype, "dirty", 2);
v([
  y()
], $.prototype, "searchOpen", 2);
v([
  y()
], $.prototype, "searchQuery", 2);
v([
  y()
], $.prototype, "searchResults", 2);
v([
  y()
], $.prototype, "searching", 2);
v([
  y()
], $.prototype, "searchError", 2);
v([
  y()
], $.prototype, "searchPin", 2);
v([
  y()
], $.prototype, "toastUndo", 2);
v([
  y()
], $.prototype, "layersOpen", 2);
v([
  y()
], $.prototype, "page", 2);
v([
  y()
], $.prototype, "wetOn", 2);
v([
  y()
], $.prototype, "menuOpen", 2);
v([
  y()
], $.prototype, "pendingImport", 2);
v([
  y()
], $.prototype, "hover", 2);
$ = v([
  yt("irrigation-planner-panel")
], $);
function b(e) {
  return Math.round(e * 100) / 100;
}
function He(e) {
  return Math.round(e / 5) * 5 % 360;
}
function ne(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? Ge(e.radius_m, e.arc_deg) : null : e.type === "hose" ? e.polygon.length >= 2 && e.radius_m ? qe(e.polygon, e.radius_m) : null : e.polygon.length >= 3 ? ke(e.polygon) : null;
}
function U(e) {
  return e < 1 ? `${Math.round(e * 100)} cm` : `${e.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m`;
}
function M(e) {
  return e == null ? "–" : `${e.toLocaleString("de-DE", { maximumFractionDigits: e < 10 ? 1 : 0 })} m²`;
}
function ge(e) {
  if (e < 60) return `${e} s`;
  const t = Math.round(e / 60);
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
function Xe(e) {
  const t = 10 ** Math.floor(Math.log10(e));
  for (const n of [1, 2, 5, 10]) if (n * t >= e) return n * t;
  return 10 * t;
}
function Gt(e) {
  const t = Xe(110 / e), n = t >= 1e3 ? `${t / 1e3} km` : t >= 1 ? `${t} m` : `${t * 100} cm`;
  return { px: t * e, label: n };
}
export {
  $ as IrrigationPlannerPanel
};
