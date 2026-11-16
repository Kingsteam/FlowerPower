/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const le = globalThis, Se = le.ShadowRoot && (le.ShadyCSS === void 0 || le.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Pe = Symbol(), Oe = /* @__PURE__ */ new WeakMap();
let Xe = class {
  constructor(t, s, n) {
    if (this._$cssResult$ = !0, n !== Pe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = s;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (Se && t === void 0) {
      const n = s !== void 0 && s.length === 1;
      n && (t = Oe.get(s)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), n && Oe.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const ut = (e) => new Xe(typeof e == "string" ? e : e + "", void 0, Pe), mt = (e, ...t) => {
  const s = e.length === 1 ? e[0] : t.reduce((n, i, a) => n + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + e[a + 1], e[0]);
  return new Xe(s, e, Pe);
}, gt = (e, t) => {
  if (Se) e.adoptedStyleSheets = t.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of t) {
    const n = document.createElement("style"), i = le.litNonce;
    i !== void 0 && n.setAttribute("nonce", i), n.textContent = s.cssText, e.appendChild(n);
  }
}, De = Se ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let s = "";
  for (const n of t.cssRules) s += n.cssText;
  return ut(s);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ft, defineProperty: bt, getOwnPropertyDescriptor: $t, getOwnPropertyNames: vt, getOwnPropertySymbols: yt, getPrototypeOf: xt } = Object, pe = globalThis, Ne = pe.trustedTypes, kt = Ne ? Ne.emptyScript : "", wt = pe.reactiveElementPolyfillSupport, Q = (e, t) => e, ce = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? kt : null;
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
} }, Ae = (e, t) => !ft(e, t), Ce = { attribute: !0, type: String, converter: ce, reflect: !1, useDefault: !1, hasChanged: Ae };
Symbol.metadata ??= Symbol("metadata"), pe.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let K = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, s = Ce) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
      const n = Symbol(), i = this.getPropertyDescriptor(t, n, s);
      i !== void 0 && bt(this.prototype, t, i);
    }
  }
  static getPropertyDescriptor(t, s, n) {
    const { get: i, set: a } = $t(this.prototype, t) ?? { get() {
      return this[s];
    }, set(r) {
      this[s] = r;
    } };
    return { get: i, set(r) {
      const o = i?.call(this);
      a?.call(this, r), this.requestUpdate(t, o, n);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Ce;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Q("elementProperties"))) return;
    const t = xt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Q("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Q("properties"))) {
      const s = this.properties, n = [...vt(s), ...yt(s)];
      for (const i of n) this.createProperty(i, s[i]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const s = litPropertyMetadata.get(t);
      if (s !== void 0) for (const [n, i] of s) this.elementProperties.set(n, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, n] of this.elementProperties) {
      const i = this._$Eu(s, n);
      i !== void 0 && this._$Eh.set(i, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const s = [];
    if (Array.isArray(t)) {
      const n = new Set(t.flat(1 / 0).reverse());
      for (const i of n) s.unshift(De(i));
    } else t !== void 0 && s.push(De(t));
    return s;
  }
  static _$Eu(t, s) {
    const n = s.attribute;
    return n === !1 ? void 0 : typeof n == "string" ? n : typeof t == "string" ? t.toLowerCase() : void 0;
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
    for (const n of s.keys()) this.hasOwnProperty(n) && (t.set(n, this[n]), delete this[n]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return gt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, s, n) {
    this._$AK(t, n);
  }
  _$ET(t, s) {
    const n = this.constructor.elementProperties.get(t), i = this.constructor._$Eu(t, n);
    if (i !== void 0 && n.reflect === !0) {
      const a = (n.converter?.toAttribute !== void 0 ? n.converter : ce).toAttribute(s, n.type);
      this._$Em = t, a == null ? this.removeAttribute(i) : this.setAttribute(i, a), this._$Em = null;
    }
  }
  _$AK(t, s) {
    const n = this.constructor, i = n._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const a = n.getPropertyOptions(i), r = typeof a.converter == "function" ? { fromAttribute: a.converter } : a.converter?.fromAttribute !== void 0 ? a.converter : ce;
      this._$Em = i;
      const o = r.fromAttribute(s, a.type);
      this[i] = o ?? this._$Ej?.get(i) ?? o, this._$Em = null;
    }
  }
  requestUpdate(t, s, n, i = !1, a) {
    if (t !== void 0) {
      const r = this.constructor;
      if (i === !1 && (a = this[t]), n ??= r.getPropertyOptions(t), !((n.hasChanged ?? Ae)(a, s) || n.useDefault && n.reflect && a === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, n)))) return;
      this.C(t, s, n);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, s, { useDefault: n, reflect: i, wrapped: a }, r) {
    n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? s ?? this[t]), a !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || n || (s = void 0), this._$AL.set(t, s)), i === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        for (const [i, a] of this._$Ep) this[i] = a;
        this._$Ep = void 0;
      }
      const n = this.constructor.elementProperties;
      if (n.size > 0) for (const [i, a] of n) {
        const { wrapped: r } = a, o = this[i];
        r !== !0 || this._$AL.has(i) || o === void 0 || this.C(i, void 0, a, o);
      }
    }
    let t = !1;
    const s = this._$AL;
    try {
      t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((n) => n.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (n) {
      throw t = !1, this._$EM(), n;
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
K.elementStyles = [], K.shadowRootOptions = { mode: "open" }, K[Q("elementProperties")] = /* @__PURE__ */ new Map(), K[Q("finalized")] = /* @__PURE__ */ new Map(), wt?.({ ReactiveElement: K }), (pe.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Me = globalThis, Be = (e) => e, de = Me.trustedTypes, Ie = de ? de.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Ye = "$lit$", I = `lit$${Math.random().toFixed(9).slice(2)}$`, Qe = "?" + I, _t = `<${Qe}>`, H = document, te = () => H.createComment(""), se = (e) => e === null || typeof e != "object" && typeof e != "function", ze = Array.isArray, St = (e) => ze(e) || typeof e?.[Symbol.iterator] == "function", fe = `[ 	
\f\r]`, X = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, je = /-->/g, Le = />/g, j = RegExp(`>|${fe}(?:([^\\s"'>=/]+)(${fe}*=${fe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Re = /'/g, He = /"/g, et = /^(?:script|style|textarea|title)$/i, tt = (e) => (t, ...s) => ({ _$litType$: e, strings: t, values: s }), c = tt(1), g = tt(2), q = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), Fe = /* @__PURE__ */ new WeakMap(), R = H.createTreeWalker(H, 129);
function st(e, t) {
  if (!ze(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ie !== void 0 ? Ie.createHTML(t) : t;
}
const Pt = (e, t) => {
  const s = e.length - 1, n = [];
  let i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = X;
  for (let o = 0; o < s; o++) {
    const l = e[o];
    let p, m, u = -1, x = 0;
    for (; x < l.length && (r.lastIndex = x, m = r.exec(l), m !== null); ) x = r.lastIndex, r === X ? m[1] === "!--" ? r = je : m[1] !== void 0 ? r = Le : m[2] !== void 0 ? (et.test(m[2]) && (i = RegExp("</" + m[2], "g")), r = j) : m[3] !== void 0 && (r = j) : r === j ? m[0] === ">" ? (r = i ?? X, u = -1) : m[1] === void 0 ? u = -2 : (u = r.lastIndex - m[2].length, p = m[1], r = m[3] === void 0 ? j : m[3] === '"' ? He : Re) : r === He || r === Re ? r = j : r === je || r === Le ? r = X : (r = j, i = void 0);
    const h = r === j && e[o + 1].startsWith("/>") ? " " : "";
    a += r === X ? l + _t : u >= 0 ? (n.push(p), l.slice(0, u) + Ye + l.slice(u) + I + h) : l + I + (u === -2 ? o : h);
  }
  return [st(e, a + (e[s] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), n];
};
class ne {
  constructor({ strings: t, _$litType$: s }, n) {
    let i;
    this.parts = [];
    let a = 0, r = 0;
    const o = t.length - 1, l = this.parts, [p, m] = Pt(t, s);
    if (this.el = ne.createElement(p, n), R.currentNode = this.el.content, s === 2 || s === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (i = R.nextNode()) !== null && l.length < o; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const u of i.getAttributeNames()) if (u.endsWith(Ye)) {
          const x = m[r++], h = i.getAttribute(u).split(I), y = /([.?@])?(.*)/.exec(x);
          l.push({ type: 1, index: a, name: y[2], strings: h, ctor: y[1] === "." ? Mt : y[1] === "?" ? zt : y[1] === "@" ? Et : ue }), i.removeAttribute(u);
        } else u.startsWith(I) && (l.push({ type: 6, index: a }), i.removeAttribute(u));
        if (et.test(i.tagName)) {
          const u = i.textContent.split(I), x = u.length - 1;
          if (x > 0) {
            i.textContent = de ? de.emptyScript : "";
            for (let h = 0; h < x; h++) i.append(u[h], te()), R.nextNode(), l.push({ type: 2, index: ++a });
            i.append(u[x], te());
          }
        }
      } else if (i.nodeType === 8) if (i.data === Qe) l.push({ type: 2, index: a });
      else {
        let u = -1;
        for (; (u = i.data.indexOf(I, u + 1)) !== -1; ) l.push({ type: 7, index: a }), u += I.length - 1;
      }
      a++;
    }
  }
  static createElement(t, s) {
    const n = H.createElement("template");
    return n.innerHTML = t, n;
  }
}
function J(e, t, s = e, n) {
  if (t === q) return t;
  let i = n !== void 0 ? s._$Co?.[n] : s._$Cl;
  const a = se(t) ? void 0 : t._$litDirective$;
  return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, s, n)), n !== void 0 ? (s._$Co ??= [])[n] = i : s._$Cl = i), i !== void 0 && (t = J(e, i._$AS(e, t.values), i, n)), t;
}
class At {
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
    const { el: { content: s }, parts: n } = this._$AD, i = (t?.creationScope ?? H).importNode(s, !0);
    R.currentNode = i;
    let a = R.nextNode(), r = 0, o = 0, l = n[0];
    for (; l !== void 0; ) {
      if (r === l.index) {
        let p;
        l.type === 2 ? p = new ae(a, a.nextSibling, this, t) : l.type === 1 ? p = new l.ctor(a, l.name, l.strings, this, t) : l.type === 6 && (p = new Tt(a, this, t)), this._$AV.push(p), l = n[++o];
      }
      r !== l?.index && (a = R.nextNode(), r++);
    }
    return R.currentNode = H, i;
  }
  p(t) {
    let s = 0;
    for (const n of this._$AV) n !== void 0 && (n.strings !== void 0 ? (n._$AI(t, n, s), s += n.strings.length - 2) : n._$AI(t[s])), s++;
  }
}
class ae {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, s, n, i) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = t, this._$AB = s, this._$AM = n, this.options = i, this._$Cv = i?.isConnected ?? !0;
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
    t = J(this, t, s), se(t) ? t === d || t == null || t === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : t !== this._$AH && t !== q && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : St(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== d && se(this._$AH) ? this._$AA.nextSibling.data = t : this.T(H.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: s, _$litType$: n } = t, i = typeof n == "number" ? this._$AC(t) : (n.el === void 0 && (n.el = ne.createElement(st(n.h, n.h[0]), this.options)), n);
    if (this._$AH?._$AD === i) this._$AH.p(s);
    else {
      const a = new At(i, this), r = a.u(this.options);
      a.p(s), this.T(r), this._$AH = a;
    }
  }
  _$AC(t) {
    let s = Fe.get(t.strings);
    return s === void 0 && Fe.set(t.strings, s = new ne(t)), s;
  }
  k(t) {
    ze(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let n, i = 0;
    for (const a of t) i === s.length ? s.push(n = new ae(this.O(te()), this.O(te()), this, this.options)) : n = s[i], n._$AI(a), i++;
    i < s.length && (this._$AR(n && n._$AB.nextSibling, i), s.length = i);
  }
  _$AR(t = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); t !== this._$AB; ) {
      const n = Be(t).nextSibling;
      Be(t).remove(), t = n;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class ue {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, s, n, i, a) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = t, this.name = s, this._$AM = i, this.options = a, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(new String()), this.strings = n) : this._$AH = d;
  }
  _$AI(t, s = this, n, i) {
    const a = this.strings;
    let r = !1;
    if (a === void 0) t = J(this, t, s, 0), r = !se(t) || t !== this._$AH && t !== q, r && (this._$AH = t);
    else {
      const o = t;
      let l, p;
      for (t = a[0], l = 0; l < a.length - 1; l++) p = J(this, o[n + l], s, l), p === q && (p = this._$AH[l]), r ||= !se(p) || p !== this._$AH[l], p === d ? t = d : t !== d && (t += (p ?? "") + a[l + 1]), this._$AH[l] = p;
    }
    r && !i && this.j(t);
  }
  j(t) {
    t === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Mt extends ue {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === d ? void 0 : t;
  }
}
class zt extends ue {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== d);
  }
}
class Et extends ue {
  constructor(t, s, n, i, a) {
    super(t, s, n, i, a), this.type = 5;
  }
  _$AI(t, s = this) {
    if ((t = J(this, t, s, 0) ?? d) === q) return;
    const n = this._$AH, i = t === d && n !== d || t.capture !== n.capture || t.once !== n.once || t.passive !== n.passive, a = t !== d && (n === d || i);
    i && this.element.removeEventListener(this.name, this, n), a && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Tt {
  constructor(t, s, n) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = n;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    J(this, t);
  }
}
const Ot = Me.litHtmlPolyfillSupport;
Ot?.(ne, ae), (Me.litHtmlVersions ??= []).push("3.3.3");
const Dt = (e, t, s) => {
  const n = s?.renderBefore ?? t;
  let i = n._$litPart$;
  if (i === void 0) {
    const a = s?.renderBefore ?? null;
    n._$litPart$ = i = new ae(t.insertBefore(te(), a), a, void 0, s ?? {});
  }
  return i._$AI(e), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ee = globalThis;
class G extends K {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Dt(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return q;
  }
}
G._$litElement$ = !0, G.finalized = !0, Ee.litElementHydrateSupport?.({ LitElement: G });
const Nt = Ee.litElementPolyfillSupport;
Nt?.({ LitElement: G });
(Ee.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const nt = (e) => (t, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ct = { attribute: !0, type: String, converter: ce, reflect: !1, hasChanged: Ae }, Bt = (e = Ct, t, s) => {
  const { kind: n, metadata: i } = s;
  let a = globalThis.litPropertyMetadata.get(i);
  if (a === void 0 && globalThis.litPropertyMetadata.set(i, a = /* @__PURE__ */ new Map()), n === "setter" && ((e = Object.create(e)).wrapped = !0), a.set(s.name, e), n === "accessor") {
    const { name: r } = s;
    return { set(o) {
      const l = t.get.call(this);
      t.set.call(this, o), this.requestUpdate(r, l, e, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(r, void 0, e, o), o;
    } };
  }
  if (n === "setter") {
    const { name: r } = s;
    return function(o) {
      const l = this[r];
      t.call(this, o), this.requestUpdate(r, l, e, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + n);
};
function me(e) {
  return (t, s) => typeof s == "object" ? Bt(e, t, s) : ((n, i, a) => {
    const r = i.hasOwnProperty(a);
    return i.constructor.createProperty(a, n), r ? Object.getOwnPropertyDescriptor(i, a) : void 0;
  })(e, t, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function f(e) {
  return me({ ...e, state: !0, attribute: !1 });
}
const O = 6378137, it = 256, Y = Math.PI * O;
function at(e, t) {
  const s = Math.max(0, Math.min(360, t));
  return Math.PI * e * e * s / 360;
}
function Te(e) {
  if (e.length < 3) return 0;
  let t = 0;
  for (let s = 0; s < e.length; s++) {
    const [n, i] = e[s], [a, r] = e[(s + 1) % e.length];
    t += n * r - a * i;
  }
  return Math.abs(t) / 2;
}
function T(e, t, s) {
  const n = s * Math.PI / 180;
  return [e[0] + Math.sin(n) * t, e[1] - Math.cos(n) * t];
}
function ie(e, t) {
  return (Math.atan2(t[0] - e[0], -(t[1] - e[1])) * 180 / Math.PI + 360) % 360;
}
function w(e, t) {
  return Math.hypot(e[0] - t[0], e[1] - t[1]);
}
function It(e, t, s, n) {
  const [i, a] = e;
  if (n >= 360)
    return `M ${i - t} ${a} a ${t} ${t} 0 1 0 ${2 * t} 0 a ${t} ${t} 0 1 0 ${-2 * t} 0 Z`;
  const [r, o] = T(e, t, s), [l, p] = T(e, t, s + n), m = n > 180 ? 1 : 0;
  return `M ${i} ${a} L ${r} ${o} A ${t} ${t} 0 ${m} 1 ${l} ${p} Z`;
}
function be(e) {
  const t = e.length || 1;
  return [e.reduce((s, n) => s + n[0], 0) / t, e.reduce((s, n) => s + n[1], 0) / t];
}
function $e(e, t) {
  return 2 * Math.PI * O * Math.cos(e * Math.PI / 180) / (it * 2 ** t);
}
function Ue(e, t) {
  return Math.log2(
    2 * Math.PI * O * Math.cos(e * Math.PI / 180) * t / it
  );
}
function Ze(e, t, s) {
  const [n, i] = s, a = Math.PI / 180;
  return [
    (t - i) * a * O * Math.cos(n * a),
    -(e - n) * a * O
  ];
}
function jt(e, t) {
  const [s, n] = t, i = 180 / Math.PI;
  return [
    s - e[1] / O * i,
    n + e[0] / (O * Math.cos(s / i)) * i
  ];
}
function We(e, t, s, n, i = 200) {
  const [a, r] = t, o = Math.PI / 180, l = 1 / Math.cos(a * o), p = O * r * o, m = O * Math.log(Math.tan(Math.PI / 4 + a * o / 2)), u = 2 ** n, x = 2 * Y / u, h = (P) => (p + P * l + Y) / x, y = (P) => (Y - (m - P * l)) / x, _ = Math.max(0, Math.floor(h(s.x0))), S = Math.min(u - 1, Math.floor(h(s.x1))), k = Math.max(0, Math.floor(y(s.y0))), A = Math.min(u - 1, Math.floor(y(s.y1))), F = [];
  if ((S - _ + 1) * (A - k + 1) > i) return F;
  for (let P = k; P <= A; P++)
    for (let N = _; N <= S; N++) {
      const U = N * x - Y, ge = Y - P * x;
      F.push({
        url: e.replace("{z}", String(n)).replace("{x}", String(N)).replace("{y}", String(P)),
        key: `${n}/${N}/${P}`,
        x: (U - p) / l,
        y: (m - ge) / l,
        size: x / l
      });
    }
  return F;
}
function Lt(e, t, s) {
  let n = null, i = s;
  for (const a of t) {
    const r = w(e, a);
    r <= i && (n = a, i = r);
  }
  return n;
}
function ee(e, t = !1) {
  let s = 0;
  for (let n = 1; n < e.length; n++) s += w(e[n - 1], e[n]);
  return t && e.length > 2 && (s += w(e[e.length - 1], e[0])), s;
}
function Rt(e, t) {
  const s = t ? e.length : e.length - 1, n = [];
  for (let i = 0; i < s; i++) n.push(w(e[i], e[(i + 1) % e.length]));
  return n;
}
function Ht(e, t, s) {
  const n = (t + 1) % e.length, i = e[t], a = e[n], r = w(i, a);
  if (!(s > 0) || r === 0) return e;
  const o = s / r, l = [i[0] + (a[0] - i[0]) * o, i[1] + (a[1] - i[1]) * o];
  return e.map((p, m) => m === n ? l : p);
}
function rt(e, t) {
  return e.length < 2 || t <= 0 ? 0 : ee(e) * 2 * t + Math.PI * t * t;
}
function Ft(e, t) {
  let s = ee(e) * Math.max(0, Math.min(1, t));
  for (let n = 1; n < e.length; n++) {
    const i = w(e[n - 1], e[n]);
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
const B = {
  building: { label: "Gebäude", icon: "mdi:home-outline", family: "area" },
  paving: { label: "Terrasse / Weg", icon: "mdi:texture-box", family: "area" },
  water: { label: "Teich / Pool", icon: "mdi:waves", family: "area" },
  area: { label: "Sonstige Fläche", icon: "mdi:vector-square", family: "area" },
  soil: { label: "Bodenfläche", icon: "mdi:layers-triple-outline", family: "area" },
  fence: { label: "Zaun", icon: "mdi:fence", family: "line" },
  hedge: { label: "Hecke", icon: "mdi:leaf", family: "line" },
  boundary: { label: "Grundstücksgrenze", icon: "mdi:vector-polyline", family: "line" },
  pipe: { label: "Leitung", icon: "mdi:pipe", family: "line" },
  tree: { label: "Baum / Strauch", icon: "mdi:tree-outline", family: "point" },
  label: { label: "Beschriftung", icon: "mdi:format-text", family: "point" },
  tap: { label: "Wasserhahn", icon: "mdi:water-pump", family: "point" }
}, Ut = 60;
function L(e) {
  return B[e]?.family ?? "area";
}
function Z(e) {
  return e.kind === "label" && e.label ? e.label : e.label || B[e.kind]?.label || e.kind;
}
function Zt(e) {
  const t = new Set(e.map((n) => n.id));
  let s = e.length + 1;
  for (; t.has(`f${s}`); ) s++;
  return `f${s}`;
}
const ve = {
  sand: "#e9d8a6",
  loamy_sand: "#dcc28c",
  sandy_loam: "#c9a46c",
  loam: "#a9825a",
  silt_loam: "#c4a27a",
  clay_loam: "#8e6a4f",
  clay: "#6f5443"
}, Wt = "Suche: © OpenStreetMap-Mitwirkende";
async function Vt(e, t, s = "de") {
  if (t.trim().length < 3) throw new Error("Bitte mindestens 3 Zeichen eingeben");
  return (await e({
    type: "irrigation_planner/geocode",
    query: t.trim(),
    language: s
  })).places ?? [];
}
const ot = mt`
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
  .mypos {
    pointer-events: none;
  }
  .mypos .acc {
    fill: rgba(26, 115, 232, 0.15);
    stroke: rgba(26, 115, 232, 0.5);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .mypos .dot {
    fill: #1a73e8;
    stroke: #fff;
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
var Kt = Object.defineProperty, Gt = Object.getOwnPropertyDescriptor, D = (e, t, s, n) => {
  for (var i = n > 1 ? void 0 : n ? Gt(t, s) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (n ? r(t, s, i) : r(i)) || i);
  return n && i && Kt(t, s, i), i;
};
const W = "irrigation_planner", lt = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], re = ["#1565c0", "#2e7d32", "#ef6c00", "#6a1b9a", "#00838f", "#c62828"], Ve = {
  sequence: "Nacheinander",
  cycle_soak: "Abwechselnd (mit Einziehzeit)",
  priority: "Nach Bedarf (größter zuerst)"
};
function ct(e) {
  return e.start_time === "sunrise" || e.start_time === "sunset" ? "start_sun" : e.finish_by === "sunrise" || e.finish_by === "sunset" ? "finish_sun" : e.start_time ? "start_time" : e.finish_by ? "finish_by" : "window";
}
function qt(e, t) {
  const s = (o) => o === "sunset" ? "Sonnenuntergang" : "Sonnenaufgang", n = (o) => o === 0 ? "" : `${Math.abs(o) >= 60 && Math.abs(o) % 60 === 0 ? `${Math.abs(o) / 60} h` : `${Math.abs(o)} min`} ${o < 0 ? "vor" : "nach"} `, i = (o) => (o ?? "").slice(0, 5);
  let a = "";
  switch (ct(e)) {
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
  const r = e.interval_days ? `alle ${e.interval_days} Tage` : e.weekdays.length && e.weekdays.length < 7 ? e.weekdays.map((o) => lt[o]).join(" ") : "täglich";
  return `${a}, ${r}`;
}
function ye(e) {
  if (e < 60) return `${e} s`;
  const t = Math.round(e / 60);
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
function Ke(e, t) {
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
let E = class extends G {
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
      this.data = await this.hass.callWS({ type: `${W}/programs/get` }), this.error = "";
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
        type: `${W}/programs/save`,
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
        type: `${W}/programs/save`,
        program_id: e.id,
        enabled: !e.enabled
      });
    } catch (t) {
      this.toast(this.message(t), !0);
    }
  }
  async service(e, t, s) {
    try {
      await this.hass.callService(W, e, { program_id: t.id }), this.toast(s), await this.load();
    } catch (n) {
      this.toast(this.message(n), !0);
    }
  }
  async create() {
    const e = this.newName.trim();
    if (e)
      try {
        await this.hass.callWS({ type: `${W}/programs/create`, name: e }), this.newName = "", this.toast(`„${e}“ angelegt, wird geladen …`), setTimeout(() => void this.load(), 4e3);
      } catch (t) {
        this.toast(this.message(t), !0);
      }
  }
  async deleteProgram(e) {
    try {
      await this.hass.callWS({ type: `${W}/programs/delete`, program_id: e.id }), this.editing = null, this.toast(`„${e.name}“ gelöscht, wird geladen …`), setTimeout(() => void this.load(), 4e3);
    } catch (t) {
      this.toast(this.message(t), !0);
    }
  }
  // Darstellung -----------------------------------------------------------------
  render() {
    if (this.error) return c`<div class="overview"><p class="note warn">${this.error}</p></div>`;
    if (!this.data) return c`<div class="empty"><div class="spinner"></div></div>`;
    const e = this.data;
    return c`
      <div class="overview">
        ${e.winter_mode ? c`<p class="note warn">Winterpause: Es startet kein Programm automatisch.</p>` : e.automatic ? d : c`<p class="note warn">Automatik ist aus: Programme starten nur von Hand oder per Automation.</p>`}
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
    const e = this.data, t = Ke(/* @__PURE__ */ new Date(), this.tz), s = Array.from({ length: 7 }, (i, a) => {
      const r = /* @__PURE__ */ new Date(`${t.day}T12:00:00Z`);
      return r.setUTCDate(r.getUTCDate() + a), r;
    }), n = t.minutes / 1440 * 100;
    return c`
      <section class="card week">
        <h3>Die nächsten 7 Tage</h3>
        <div class="week-grid">
          <div class="hours">${[0, 3, 6, 9, 12, 15, 18, 21].map((i) => c`<span style="left:${i / 24 * 100}%">${i}</span>`)}</div>
          ${s.map((i, a) => {
      const r = i.toISOString().slice(0, 10), o = a === 0 ? "Heute" : i.toLocaleDateString("de-DE", { timeZone: "UTC", weekday: "short", day: "numeric" }), l = e.programs.flatMap(
        (p, m) => p.upcoming.map((u) => Ke(u, this.tz)).filter((u) => u.day === r).map((u) => {
          const x = u.minutes / 1440 * 100, h = Math.max(0.6, p.total_s / 86400 * 100);
          return c`<div class="block ${p.enabled ? "" : "off"}" title=${`${p.name}: ${u.time} Uhr, ${ye(p.total_s)}`}
                    style="left:${x}%; width:${h}%; --c:${re[m % re.length]}">
                    <span>${u.time} ${p.name}</span>
                  </div>`;
        })
      );
      return c`<div class="day"><span class="day-label">${o}</span>
              <div class="track">${l}${a === 0 ? c`<div class="now" style="left:${n}%"></div>` : d}</div></div>`;
    })}
        </div>
        <p class="hint small">Nur Programme, die automatisch starten (aktiv, Automatik an, keine Winterpause). Wetter kann einen Start noch überspringen.</p>
      </section>
    `;
  }
  renderProgram(e, t) {
    const s = this.editing === e.id;
    return c`
      <div class="card program" style="--c:${re[t % re.length]}">
        <div class="program-head">
          <span class="swatch" style="background:var(--c)"></span>
          <h3>${e.name}</h3>
          <span class="spacer"></span>
          <label class="check" title="Programm startet automatisch">
            <input type="checkbox" .checked=${e.enabled} @change=${() => this.toggle(e)} /> aktiv
          </label>
        </div>
        <p class="when">${qt(e, this.data.window_end)}</p>
        <dl>
          <dt>Nächster Start</dt>
          <dd>${e.next_start ? this.fmtWhen(e.next_start) : "–"}${e.skip_next ? c` <em>(wird übersprungen)</em>` : d}</dd>
          <dt>Ablauf</dt>
          <dd>${Ve[e.mode] ?? e.mode}, ${ye(e.total_s)} gesamt</dd>
          <dt>Zonen</dt>
          <dd>${e.steps.length ? c`<ol class="steps">${e.steps.map((n) => c`<li>${n.zone_name} <small>${ye(n.duration_s)}</small></li>`)}</ol>` : c`<em>keine Zone mit Bedarf oder Dauer</em>`}</dd>
          ${e.last_result ? c`<dt>Zuletzt</dt><dd>${this.fmtWhen(e.last_result.at)}: ${e.last_result.started ? "gestartet" : `übersprungen (${e.last_result.reason})`}</dd>` : d}
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
        ${s && this.draft ? this.renderEditor(this.draft) : d}
      </div>
    `;
  }
  renderEditor(e) {
    const t = ct(e), s = () => this.draft = { ...e }, n = (a) => {
      const r = e.start_time === "sunset" || e.finish_by === "sunset" ? "sunset" : "sunrise";
      e.start_time = a === "start_time" ? "06:00" : a === "start_sun" ? r : null, e.finish_by = a === "finish_by" ? "07:00" : a === "finish_sun" ? r : null, a !== "start_sun" && a !== "finish_sun" && (e.sun_offset_min = 0), s();
    }, i = e.start_time === "sunset" || e.finish_by === "sunset" ? "sunset" : "sunrise";
    return c`
      <div class="editor">
        <label class="field wide"><span>Name</span>
          <input type="text" .value=${e.name} @change=${(a) => (e.name = a.target.value, s())} />
        </label>
        <div class="field wide"><span>Zonen (Reihenfolge = Ablauf)</span>
          <div class="zone-pick">
            ${this.zones.map((a) => {
      const r = e.zone_ids.indexOf(a.id);
      return c`<button class=${r >= 0 ? "active" : ""} @click=${() => {
        e.zone_ids = r >= 0 ? e.zone_ids.filter((o) => o !== a.id) : [...e.zone_ids, a.id], s();
      }}>${r >= 0 ? c`<b>${r + 1}</b>` : d}${a.name}</button>`;
    })}
          </div>
        </div>
        <label class="field wide"><span>Ablauf</span>
          <select @change=${(a) => (e.mode = a.target.value, s())}>
            ${Object.entries(Ve).map(([a, r]) => c`<option value=${a} ?selected=${a === e.mode}>${r}</option>`)}
          </select>
        </label>
        <div class="fields">
          <label class="field"><span>Pause zwischen Zonen</span>
            <input type="number" min="0" .value=${String(e.pause_between_s)}
              @change=${(a) => (e.pause_between_s = Number(a.target.value) || 0, s())} />
            <span class="unit">s</span></label>
          ${e.mode === "cycle_soak" ? c`<label class="field"><span>Gießphase</span>
                <input type="number" min="1" .value=${String(Math.round((e.cycle_s ?? 300) / 60))}
                  @change=${(a) => (e.cycle_s = Math.max(1, Number(a.target.value)) * 60, s())} />
                <span class="unit">min</span></label>
              <label class="field"><span>Einziehzeit</span>
                <input type="number" min="0" .value=${String(Math.round((e.soak_s ?? 0) / 60))}
                  @change=${(a) => (e.soak_s = Number(a.target.value) * 60 || null, s())} />
                <span class="unit">min</span></label>` : d}
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
        ${t === "start_time" || t === "finish_by" ? c`<label class="field wide"><span>Uhrzeit</span>
              <input type="time" .value=${((t === "start_time" ? e.start_time : e.finish_by) ?? "").slice(0, 5)}
                @change=${(a) => {
      const r = a.target.value;
      t === "start_time" ? e.start_time = r : e.finish_by = r, s();
    }} /></label>` : d}
        ${t === "start_sun" || t === "finish_sun" ? c`<div class="fields">
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
            </div>` : d}
        <div class="field wide"><span>Tage</span>
          <div class="levels">
            ${lt.map((a, r) => c`<button class=${e.weekdays.includes(r) ? "active" : ""} ?disabled=${!!e.interval_days}
              @click=${() => (e.weekdays = e.weekdays.includes(r) ? e.weekdays.filter((o) => o !== r) : [...e.weekdays, r].sort(), s())}>${a}</button>`)}
          </div>
          <small class="hint">Keiner gewählt = jeden Tag.</small>
        </div>
        <label class="field wide"><span>Oder alle N Tage (0 = aus)</span>
          <input type="number" min="0" max="60" .value=${String(e.interval_days ?? 0)}
            @change=${(a) => (e.interval_days = Number(a.target.value) || null, s())} /></label>
        <div class="checks">
          ${["skip_on_rain", "skip_on_frost", "skip_on_wind"].map(
      (a) => c`<label class="check"><input type="checkbox" .checked=${e[a]}
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
    return c`
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
      (n) => c`<tr>
                  <td>${n.name}</td>
                  <td><code>irrigation_planner.run_program</code><br /><small>program_id: <code>${n.id}</code></small></td>
                  <td>${Object.values(n.entities).map((i) => c`<code>${i}</code><br />`)}</td>
                </tr>`
    )}
            </tbody>
          </table>
        </div>
        <h3>Ereignisse</h3>
        <ul class="events">
          ${e.events.map((n) => c`<li><code>${n.type}</code> – ${n.description}</li>`)}
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
E.styles = ot;
D([
  me({ attribute: !1 })
], E.prototype, "hass", 2);
D([
  me({ attribute: !1 })
], E.prototype, "zones", 2);
D([
  f()
], E.prototype, "data", 2);
D([
  f()
], E.prototype, "error", 2);
D([
  f()
], E.prototype, "editing", 2);
D([
  f()
], E.prototype, "draft", 2);
D([
  f()
], E.prototype, "newName", 2);
D([
  f()
], E.prototype, "busy", 2);
E = D([
  nt("ip-schedule")
], E);
function Jt(e, t) {
  return t ? e ? null : "Orten geht nur, wenn Home Assistant über https geöffnet ist (z. B. in der App oder über Nabu Casa)." : "Dieser Browser kann nicht orten.";
}
function Xt(e) {
  return e === 1 ? "Orten nicht erlaubt. Bitte in den Browser-Einstellungen den Standort erlauben." : e === 3 ? "Kein Standort gefunden (Zeit abgelaufen). Am besten im Freien noch einmal versuchen." : "Standort nicht verfügbar.";
}
function xe(e) {
  return e >= 1e3 ? `± ${(e / 1e3).toFixed(1).replace(".", ",")} km` : `± ${Math.round(e)} m`;
}
function Yt(e, t, s, n, i) {
  return w(e, t) > s ? !1 : i >= 360 ? !0 : ((ie(t, e) - n) % 360 + 360) % 360 <= i;
}
function dt(e, t) {
  let s = !1;
  for (let n = 0, i = t.length - 1; n < t.length; i = n++) {
    const [a, r] = t[n], [o, l] = t[i];
    r > e[1] != l > e[1] && e[0] < (o - a) * (e[1] - r) / (l - r) + a && (s = !s);
  }
  return s;
}
function Qt(e, t, s) {
  const n = s[0] - t[0], i = s[1] - t[1], a = n * n + i * i, r = a === 0 ? 0 : Math.max(0, Math.min(1, ((e[0] - t[0]) * n + (e[1] - t[1]) * i) / a));
  return Math.hypot(e[0] - (t[0] + r * n), e[1] - (t[1] + r * i));
}
function es(e, t) {
  if (e.type === "sprinkler")
    return !!(e.center && e.radius_m) && Yt(t, e.center, e.radius_m, e.start_angle_deg, e.arc_deg);
  if (e.type === "hose") {
    const s = e.radius_m ?? 0;
    for (let n = 1; n < e.polygon.length; n++)
      if (Qt(t, e.polygon[n - 1], e.polygon[n]) <= s) return !0;
    return !1;
  }
  return e.polygon.length >= 3 && dt(t, e.polygon);
}
function he(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? at(e.radius_m, e.arc_deg) : null : e.type === "hose" ? e.polygon.length >= 2 && e.radius_m ? rt(e.polygon, e.radius_m) : null : e.polygon.length >= 3 ? Te(e.polygon) : null;
}
function ts(e, t, s) {
  const n = w(t, e);
  for (const i of s) {
    const a = i.points[0], r = (i.trunk_m ?? 0) / 2, o = w(t, a);
    if (r <= 0 || o <= r || n <= o) continue;
    const l = Math.asin(Math.min(1, r / o)) * 180 / Math.PI;
    if (Math.abs((ie(t, e) - ie(t, a) + 540) % 360 - 180) <= l) return !0;
  }
  return !1;
}
function ht(e, t) {
  return t?.zones[e.id]?.planned_s || e.duration_s || 0;
}
function _e(e, t, s) {
  const n = t.find((r) => r.id === e.valve_id)?.learned_flow_l_min, i = he(e) ?? e.area_m2, a = ht(e, s);
  return !n || !i || !a ? null : a / 60 * n / i;
}
function ss(e, t, s, n, i, a = 160) {
  const [r, o, l, p] = i, m = Math.max(0.05, Math.max(l - r, p - o) / a), u = Math.max(1, Math.ceil((l - r) / m)), x = Math.max(1, Math.ceil((p - o) / m)), h = new Float32Array(u * x).fill(Number.NaN), y = n.filter((k) => k.kind === "tree" && (k.trunk_m ?? 0) > 0), _ = e.filter((k) => k.enabled && he(k) !== null).map((k) => ({ zone: k, mm: _e(k, t, s) })).filter((k) => k.mm !== null);
  let S = 0;
  for (let k = 0; k < x; k++)
    for (let A = 0; A < u; A++) {
      const F = [r + (A + 0.5) * m, o + (k + 0.5) * m];
      let P = 0, N = !1;
      for (const { zone: U, mm: ge } of _)
        es(U, F) && (U.type === "sprinkler" && U.center && ts(F, U.center, y) || (P += ge, N = !0));
      N && (h[k * u + A] = P, S = Math.max(S, P));
    }
  return { x0: r, y0: o, step: m, cols: u, rows: x, values: h, max: S };
}
const z = [
  [0, [224, 242, 254]],
  [3, [125, 196, 240]],
  [8, [33, 120, 210]],
  [15, [40, 50, 160]],
  [25, [120, 30, 150]]
];
function ns(e) {
  if (e <= z[0][0]) return z[0][1];
  for (let t = 1; t < z.length; t++) {
    const [s, n] = z[t], [i, a] = z[t - 1];
    if (e <= s) {
      const r = (e - i) / (s - i);
      return [0, 1, 2].map((o) => Math.round(a[o] + (n[o] - a[o]) * r));
    }
  }
  return z[z.length - 1][1];
}
function is(e) {
  const t = document.createElement("canvas");
  t.width = e.cols, t.height = e.rows;
  const s = t.getContext("2d");
  if (!s) return "";
  const n = s.createImageData(e.cols, e.rows);
  for (let i = 0; i < e.values.length; i++) {
    const a = e.values[i];
    if (Number.isNaN(a)) continue;
    const [r, o, l] = ns(a);
    n.data.set([r, o, l, 200], i * 4);
  }
  return s.putImageData(n, 0, 0), t.toDataURL();
}
var as = Object.defineProperty, rs = Object.getOwnPropertyDescriptor, v = (e, t, s, n) => {
  for (var i = n > 1 ? void 0 : n ? rs(t, s) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (n ? r(t, s, i) : r(i)) || i);
  return n && i && as(t, s, i), i;
};
const C = "irrigation_planner", Ge = [
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
], qe = {
  soil_moisture: "B",
  rain_mm: "R",
  rain_binary: "R",
  water_meter: "W"
}, os = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge",
  rain_binary: "Regensensor",
  water_meter: "Wasserzähler"
}, ke = {
  idle: "",
  running: "läuft",
  queued: "wartet",
  locked: "gesperrt"
}, ls = 0.05, cs = 10;
let b = class extends G {
  constructor() {
    super(...arguments), this.narrow = !1, this.error = "", this.toast = "", this.tab = "zones", this.featureKind = "building", this.measurePts = [], this.snapOn = !0, this.snapHint = null, this.tool = "select", this.toolTarget = "", this.selected = null, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.view = { cx: 0, cy: 0, scale: 25 }, this.size = { w: 800, h: 600 }, this.imageUrl = "", this.imageSize = null, this.saving = !1, this.dirty = !1, this.searchOpen = !1, this.searchQuery = "", this.searchResults = null, this.searching = !1, this.searchError = "", this.searchPin = null, this.myPos = null, this.locating = !1, this.savedJson = "", this.history = [], this.drag = null, this.toastUndo = !1, this.layersOpen = !1, this.page = "plan", this.wetOn = !1, this.soilOn = !1, this.wetCache = null, this.menuOpen = !1, this.pendingImport = null, this.autoFit = !0, this.loadedImage = "", this.onWheel = (e) => {
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
        const n = this.featureKind, i = this.snap(s, e), a = L(n);
        if (a === "point") {
          const o = [$(i[0]), $(i[1])];
          if (n === "tree") {
            const l = this.addFeature({ kind: n, points: [o], radius_m: 0 });
            this.drag = { type: "new-tree", id: l.id }, t.setPointerCapture(e.pointerId);
          } else
            this.addFeature({ kind: n, points: [o], label: n === "label" ? "Beschriftung" : null }), this.cancelTool(), n === "label" && this.updateComplete.then(
              () => this.renderRoot.querySelector("#feature-label")?.select()
            );
          return;
        }
        const r = (o) => w(i, o) * this.view.scale < 12;
        a === "area" && this.draft.length >= 3 && r(this.draft[0]) ? this.finishFeature() : a === "line" && this.draft.length >= 2 && r(this.draft[this.draft.length - 1]) ? this.finishFeature() : this.draft = [...this.draft, i];
        return;
      }
      if (this.tool === "measure") {
        this.measurePts = [...this.measurePts, this.snap(s, e)];
        return;
      }
      if (this.tool === "hose") {
        const n = this.snap(s, e), i = this.draft[this.draft.length - 1];
        this.draft.length >= 2 && w(n, i) * this.view.scale < 12 ? this.finishHose() : this.draft = [...this.draft, n];
        return;
      }
      if (this.tool === "sprinkler") {
        this.remember();
        const n = this.zone(this.toolTarget), i = this.snap(s, e);
        s[0] = i[0], s[1] = i[1], n.center = [$(s[0]), $(s[1])], n.radius_m = 0, this.drag = { type: "new-sprinkler", id: n.id }, t.setPointerCapture(e.pointerId), this.changed();
        return;
      }
      if (this.tool === "bed") {
        const n = this.snap(s, e);
        this.draft.length >= 3 && w(n, this.draft[0]) * this.view.scale < 12 ? this.finishBed() : this.draft = [...this.draft, n];
        return;
      }
      if (this.tool === "place") {
        const [n, i] = this.toolTarget.split(":");
        this.remember();
        const a = this.marker(n, i);
        a.position = [$(s[0]), $(s[1])], this.selected = { kind: n, id: i }, this.changed(), this.cancelTool();
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
        this.marker(t.kind, t.id).position = [$(s[0]), $(s[1])], this.changed();
        return;
      }
      const n = this.zone(t.id);
      switch (t.type) {
        case "new-sprinkler":
        case "radius":
          n.radius_m = $(Math.max(0.1, w(n.center, s)));
          break;
        case "center":
          n.center = [$(s[0]), $(s[1])];
          break;
        case "start": {
          const i = n.start_angle_deg + n.arc_deg, a = Je(ie(n.center, s));
          let r = ((i - a) % 360 + 360) % 360;
          r < 5 && (r = 360), n.start_angle_deg = a, n.arc_deg = r;
          break;
        }
        case "end": {
          let a = ((Je(ie(n.center, s)) - n.start_angle_deg) % 360 + 360) % 360;
          a < 5 && (a = 360), n.arc_deg = a;
          break;
        }
        case "vertex": {
          const i = this.snap(s, e, n.polygon[t.index]);
          n.polygon[t.index] = [$(i[0]), $(i[1])];
          break;
        }
        case "move-zone": {
          const i = s[0] - t.start[0], a = s[1] - t.start[1];
          n.type === "sprinkler" && t.orig.center ? n.center = [$(t.orig.center[0] + i), $(t.orig.center[1] + a)] : n.polygon = t.orig.polygon.map((r) => [$(r[0] + i), $(r[1] + a)]);
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
    super.disconnectedCallback(), window.removeEventListener("keydown", this.onKey), this.unsub?.(), this.unsub = void 0, this.resizer?.disconnect(), this.stopLocate();
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
      const e = await this._hass.callWS({ type: `${C}/plan/get` });
      this.setPlan(e, !0), await this.subscribe();
    } catch (e) {
      this.error = this.message(e);
    }
  }
  async subscribe() {
    this.unsub || !this._hass || (this.unsub = await this._hass.connection.subscribeMessage(
      (e) => this.status = e,
      { type: `${C}/plan/subscribe` }
    ));
  }
  /** Neuer Stand vom Server. Nach dem Speichern bleibt „Rückgängig“ möglich. */
  setPlan(e, t, s = !1) {
    this.plan = e, this.savedJson = JSON.stringify(this.editable()), this.dirty = !1, s || (this.history = []), this.loadImage(), t && this.fitView();
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
    t.background === "map" && t.latitude != null && (t.map_zoom = Math.round(Ue(t.latitude, this.view.scale) * 100) / 100), this.saving = !0;
    try {
      const s = await this._hass.callWS({
        type: `${C}/plan/save`,
        garden: t,
        zones: e.zones.map((n) => ({
          id: n.id,
          center: n.center,
          radius_m: n.radius_m,
          start_angle_deg: n.start_angle_deg,
          arc_deg: n.arc_deg,
          polygon: n.polygon,
          valve_id: n.valve_id,
          plant_type: n.plant_type,
          kc: n.kc,
          soil_type: n.soil_type,
          root_depth_m: n.root_depth_m
        })),
        valves: e.valves.map((n) => ({ id: n.id, position: n.position })),
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
        const t = await this._hass.fetchWithAuth(`/api/${C}/image/${e}`);
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
      const i = await this._hass.fetchWithAuth(`/api/${C}/image`, {
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
      const t = w(e.scale_points[0], e.scale_points[1]);
      if (t > 0) return e.scale_distance_m / t;
    }
    return ls;
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
  fitView() {
    const e = this.plan?.garden, t = this.bounds();
    if (e?.background === "map" && e.latitude != null && !t) {
      const p = e.map_zoom ?? 19;
      this.view = { cx: 0, cy: 0, scale: 1 / $e(e.latitude, p) };
      return;
    }
    if (!t) {
      this.view = { cx: 0, cy: 0, scale: 25 };
      return;
    }
    const [s, n, i, a] = t, r = Math.max(i - s, 4), o = Math.max(a - n, 4), l = Math.min(this.size.w / (r * 1.15), this.size.h / (o * 1.15), 200);
    this.view = { cx: (s + i) / 2, cy: (n + a) / 2, scale: Math.max(l, 0.5) };
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
    const n = Lt(e, this.snapCandidates(s), cs / this.view.scale);
    return this.snapHint = n, n ? [n[0], n[1]] : e;
  }
  finishFeature() {
    const e = this.featureKind, t = L(e) === "area" ? 3 : 2;
    if (this.draft.length < t) {
      this.showToast(`${B[e].label}: mindestens ${t} Punkte`, !0);
      return;
    }
    this.addFeature({
      kind: e,
      points: this.draft.map((s) => [$(s[0]), $(s[1])]),
      soil_type: e === "soil" ? "loam" : null
    }), this.cancelTool();
  }
  addFeature(e) {
    this.remember();
    const t = {
      id: Zt(this.features),
      radius_m: null,
      label: null,
      ...e
    };
    return this.features.push(t), this.selected = { kind: "feature", id: t.id }, this.tab = "plan", this.changed(), t;
  }
  deleteFeature(e) {
    const t = this.feature(e);
    this.remember(), this.plan.garden.features = this.features.filter((s) => s.id !== e), this.selected?.kind === "feature" && this.selected.id === e && (this.selected = null), this.changed(), this.removed(`${Z(t)} entfernt`);
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
    this.remember(), this.zone(this.toolTarget).polygon = this.draft.map((e) => [$(e[0]), $(e[1])]), this.selected = { kind: "zone", id: this.toolTarget }, this.changed(), this.cancelTool();
  }
  finishHose() {
    if (this.draft.length < 2) {
      this.showToast("Ein Schlauch braucht mindestens 2 Punkte", !0);
      return;
    }
    this.remember();
    const e = this.zone(this.toolTarget);
    e.polygon = this.draft.map((t) => [$(t[0]), $(t[1])]), e.center = null, (!e.radius_m || e.radius_m > 3) && (e.radius_m = 0.3), this.selected = { kind: "zone", id: e.id }, this.changed(), this.cancelTool();
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
          n.radius_m = $(Math.max(0.1, w(n.points[0], t)));
          break;
        case "f-vertex": {
          const i = this.snap(t, s, n.points[e.index]);
          n.points[e.index] = [$(i[0]), $(i[1])];
          break;
        }
        case "f-move": {
          const i = t[0] - e.start[0], a = t[1] - e.start[1];
          n.points = e.orig.points.map((r) => [$(r[0] + i), $(r[1] + a)]);
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
    t.polygon.splice(s + 1, 0, [$((n[0] + i[0]) / 2), $((n[1] + i[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "vertex", id: t.id, index: s + 1 };
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
    this.remember(), [e.latitude, e.longitude] = jt([t, s], [e.latitude, e.longitude]).map(
      (i) => Math.round(i * 1e7) / 1e7
    );
    const n = (i) => [$(i[0] - t), $(i[1] - s)];
    for (const i of this.plan.zones)
      i.center && (i.center = n(i.center)), i.polygon = i.polygon.map(n);
    for (const i of [...this.plan.valves, ...this.plan.sensors])
      i.position && (i.position = n(i.position));
    for (const i of this.features) i.points = i.points.map(n);
    this.view = { ...this.view, cx: 0, cy: 0 }, this.searchPin && (this.searchPin = { ...this.searchPin, point: n(this.searchPin.point) }), this.changed(), this.showToast("Kartenmitte gesetzt");
  }
  // Orten ---------------------------------------------------------------------------
  toggleLocate() {
    if (this.locating) {
      this.stopLocate();
      return;
    }
    const e = Jt(window.isSecureContext, "geolocation" in navigator);
    if (e) {
      this.showToast(e, !0);
      return;
    }
    this.locating = !0;
    let t = !0;
    this.watchId = navigator.geolocation.watchPosition(
      (s) => {
        this.myPos = {
          latitude: s.coords.latitude,
          longitude: s.coords.longitude,
          accuracy: s.coords.accuracy
        }, t && (t = !1, this.showMyPosition());
      },
      (s) => {
        this.showToast(Xt(s.code), !0), this.stopLocate();
      },
      { enableHighAccuracy: !0, maximumAge: 0, timeout: 3e4 }
    );
  }
  stopLocate() {
    this.watchId !== void 0 && navigator.geolocation?.clearWatch(this.watchId), this.watchId = void 0, this.locating = !1, this.myPos = null;
  }
  /** Standort in Planmetern (null: noch keiner oder keine Kartenmitte). */
  myPoint() {
    const e = this.plan?.garden;
    return !this.myPos || e?.background !== "map" || e.latitude == null || e.longitude == null ? null : Ze(this.myPos.latitude, this.myPos.longitude, [e.latitude, e.longitude]);
  }
  /** Ansicht auf den eigenen Standort legen (ist noch nichts gezeichnet: Kartenmitte). */
  showMyPosition() {
    const e = this.myPos;
    if (!e) return;
    const t = this.plan.garden, s = Math.max(this.view.scale, 1 / $e(e.latitude, 20));
    this.autoFit = !1;
    const n = t.background === "none";
    if (n && (this.remember(), t.background = "map", t.map_provider ??= "basemap_at", t.map_zoom ??= 19), !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((r) => r.position) || t.latitude == null || t.longitude == null) {
      this.remember(), t.latitude = Math.round(e.latitude * 1e7) / 1e7, t.longitude = Math.round(e.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: s }, this.changed(), this.showToast(`Kartenmitte auf deinen Standort gesetzt (${xe(e.accuracy)}).`);
      return;
    }
    const a = this.myPoint();
    this.view = { cx: a[0], cy: a[1], scale: s }, n && this.changed(), Math.hypot(a[0], a[1]) > 2e3 ? this.showToast("Du bist weit weg vom Garten. Der Punkt zeigt, wo du gerade bist.") : this.showToast(`Standort gefunden (${xe(e.accuracy)}).`);
  }
  /** Ventil oder Sensor, der gerade platziert wird, an den eigenen Standort setzen. */
  placeAtMe() {
    const e = this.myPoint();
    if (!e || this.tool !== "place") return;
    const [t, s] = this.toolTarget.split(":");
    this.remember(), this.marker(t, s).position = [$(e[0]), $(e[1])], this.selected = { kind: t, id: s }, this.changed(), this.cancelTool(), this.showToast("An deinen Standort gesetzt");
  }
  renderMyPosition(e) {
    const t = this.myPoint();
    return !t || !this.myPos ? d : g`<g class="mypos">
      <circle class="acc" cx=${t[0]} cy=${t[1]} r=${this.myPos.accuracy}></circle>
      <circle class="dot" cx=${t[0]} cy=${t[1]} r=${7 * e} stroke-width=${3 * e}></circle>
      <title>Du bist hier (${xe(this.myPos.accuracy)})</title>
    </g>`;
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
        this.searchResults = await Vt(
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
    const t = this.plan.garden, s = 1 / $e(e.latitude, 20.5);
    if (this.autoFit = !1, !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((i) => i.position) || t.latitude == null || t.longitude == null)
      this.remember(), t.latitude = Math.round(e.latitude * 1e7) / 1e7, t.longitude = Math.round(e.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: s }, this.searchPin = { point: [0, 0], name: e.name }, this.changed(), this.showToast(`${e.name}: Kartenmitte gesetzt. Fein ausrichten mit „Mitte hier festlegen“.`);
    else {
      const i = Ze(e.latitude, e.longitude, [t.latitude, t.longitude]);
      this.view = { cx: i[0], cy: i[1], scale: s }, this.searchPin = { point: i, name: e.name }, this.showToast(`${e.name} angezeigt. „Mitte hier festlegen“ übernimmt die Stelle.`);
    }
    this.searchResults = null;
  }
  renderSearch() {
    return !this.searchOpen || this.tool !== "select" || this.plan.garden.background !== "map" ? d : c`
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
        ${this.searchError ? c`<p class="search-error">${this.searchError}</p>` : d}
        ${this.searchResults?.length ? c`<ul class="results">
              ${this.searchResults.map(
      (e) => c`<li>
                  <button type="button" @click=${() => this.goToPlace(e)}>
                    <ha-icon icon="mdi:map-marker"></ha-icon>
                    <span><strong>${e.name}</strong><small>${e.detail}</small></span>
                  </button>
                </li>`
    )}
            </ul>` : d}
        <p class="search-note">${Wt}. Die Adresse geht nur an die Suche und wird nicht gespeichert.</p>
      </div>
    `;
  }
  /** Umschalter für die Kartenansicht (Luftbild, Karte, …) direkt auf dem Plan. */
  renderLayers() {
    const e = this.plan.garden;
    if (!this.layersOpen || e.background !== "map") return d;
    const t = Object.entries(this.plan.providers).map(
      ([s, n]) => [s, n.short ?? n.name, n.kind === "map" ? "mdi:map-outline" : "mdi:satellite-variant"]
    );
    return e.map_url && t.push(["custom", "Eigene Adresse", "mdi:web"]), c`
      <div class="layers" role="menu" @pointerdown=${(s) => s.stopPropagation()}>
        ${t.map(
      ([s, n, i]) => c`<button
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
    if (w(this.scaleDraft[0], this.scaleDraft[1]) < 2) {
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
      await this._hass.callService(C, "run_zone", { zone_id: e.id, duration: t }), this.showToast(`${e.name}: ${we(t)} eingereiht`);
    } catch (s) {
      this.showToast(this.message(s), !0);
    }
  }
  // Darstellung ----------------------------------------------------------------
  render() {
    return this.error ? c`${this.renderHeader()}
        <div class="empty">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <p>${this.error}</p>
          <p class="hint">Ist der Bewässerungsplaner eingerichtet?</p>
        </div>` : this.plan ? c`
      ${this.renderHeader()}
      ${this.page === "overview" ? this.renderOverview() : this.page === "schedule" ? c`<ip-schedule
              .hass=${this._hass}
              .zones=${this.plan.zones}
              @ip-toast=${(e) => this.showToast(e.detail.text, e.detail.isError)}
            ></ip-schedule>` : this.renderPlanPage()}
      ${this.renderToast()}
    ` : c`${this.renderHeader()}<div class="empty"><div class="spinner"></div></div>`;
  }
  renderPlanPage() {
    return c`
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
    return c`
      ${this.toast ? c`<div class="toast" role="status">
            <span>${this.toast}</span>
            ${this.toastUndo ? c`<button
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
    const s = JSON.stringify([
      e.zones,
      e.valves.map((n) => [n.id, n.learned_flow_l_min]),
      e.garden.features.filter((n) => n.kind === "tree"),
      Object.entries(this.status?.zones ?? {}).map(([n, i]) => [n, i.planned_s])
    ]);
    if (this.wetCache?.key !== s) {
      const i = ss(e.zones, e.valves, this.status, e.garden.features, [
        t[0] - 1,
        t[1] - 1,
        t[2] + 1,
        t[3] + 1
      ]);
      this.wetCache = { key: s, grid: i, url: is(i) };
    }
    return this.wetCache;
  }
  renderWetMap() {
    const e = this.wetGrid();
    if (!e?.url) return d;
    const t = e.grid;
    return g`<image class="wet-layer" href=${e.url} x=${t.x0} y=${t.y0}
      width=${t.cols * t.step} height=${t.rows * t.step} preserveAspectRatio="none"></image>`;
  }
  /** Messwerte der Sensoren neben dem Symbol (Bodenfeuchte farbig). */
  renderSensorValues(e) {
    const t = this.status?.sensors ?? {};
    return this.plan.sensors.map((s) => {
      const n = t[s.id];
      if (!s.position || !n || typeof n.value != "number") return d;
      let i = "";
      if (s.kind === "soil_moisture") {
        const r = n.field_capacity_pct - n.wilting_point_pct, o = r > 0 ? (n.value - n.wilting_point_pct) / r : 0.5;
        i = o < 0.35 ? "dry" : o > 0.85 ? "wet" : "ok";
      }
      const a = `${Math.round(n.value * 10) / 10}${n.unit ? ` ${n.unit}` : ""}`;
      return g`<text class="sensor-value ${i}" x=${s.position[0]} y=${s.position[1]} dy=${24 * e}
        font-size=${12 * e} stroke-width=${3 * e}>${a}</text>`;
    });
  }
  soilName(e) {
    return e && this.plan.catalog.soils[e]?.name || "unbekannt";
  }
  /** Bodenart einer Fläche im Grundriss, in der die Zone liegt. */
  soilFromPlan(e) {
    const t = this.zoneAnchor(e);
    return t ? this.features.find((n) => n.kind === "soil" && n.points.length >= 3 && dt(t, n.points))?.soil_type ?? null : null;
  }
  renderSoilLegend() {
    const e = /* @__PURE__ */ new Set([
      ...this.plan.zones.map((t) => t.soil_type ?? "loam"),
      ...this.features.filter((t) => t.kind === "soil").map((t) => t.soil_type ?? "loam")
    ]);
    return c`<div class="wet-legend">
      <strong>Bodenart</strong>
      ${Object.entries(this.plan.catalog.soils).filter(([t]) => e.has(t)).map(
      ([t, s]) => c`<div class="soil-row"><span class="swatch" style="background:${ve[t]}"></span>${s.name}
            <small>${s.awc_mm_per_m} mm/m</small></div>`
    )}
      <small>Zahl: Wasser, das der Boden je Meter Tiefe speichern kann. Sandiger Boden braucht öfter, aber weniger Wasser.</small>
    </div>`;
  }
  /** Pflanzen, Wasserbedarf und Boden einer Zone. */
  renderPlantSoil(e) {
    const t = this.plan.catalog, s = e.plant_type ? t.plants[e.plant_type] : void 0, i = ((o) => t.needs.find((l) => o <= hs(l.key)) ?? t.needs[t.needs.length - 1])(e.kc), a = this.soilFromPlan(e), r = (o) => {
      this.remember(), o(), this.changed();
    };
    return c`
      <details class="plant" open>
        <summary>Pflanzen und Boden</summary>
        <label class="field wide">
          <span>Was wächst hier?</span>
          <select @change=${(o) => {
      const l = o.target.value;
      r(() => {
        e.plant_type = l || null, l && (e.kc = t.plants[l].kc), e.root_depth_m = null;
      });
    }}>
            <option value="" ?selected=${!e.plant_type}>(keine Angabe)</option>
            ${Object.entries(t.plants).sort((o, l) => o[1].name.localeCompare(l[1].name, "de")).map(([o, l]) => c`<option value=${o} ?selected=${o === e.plant_type}>${l.name}</option>`)}
          </select>
        </label>
        <div class="field wide">
          <span>Wasserbedarf</span>
          <div class="levels" role="radiogroup">
            ${t.needs.map(
      (o) => c`<button role="radio" aria-checked=${o.key === i.key ? "true" : "false"}
                class=${o.key === i.key ? "active" : ""} title=${`Pflanzenfaktor ${o.kc}`}
                @click=${() => r(() => e.kc = o.kc)}>${o.name}</button>`
    )}
          </div>
          <small class="hint">
            Pflanzenfaktor ${e.kc.toLocaleString("de-DE")}${s && s.kc !== e.kc ? c` (für ${s.name} üblich: ${s.kc.toLocaleString("de-DE")})` : d}
          </small>
        </div>
        <label class="field wide">
          <span>Boden</span>
          <select @change=${(o) => {
      const l = o.target.value;
      r(() => e.soil_type = l || null);
    }}>
            <option value="" ?selected=${!e.soil_type}>unbekannt (gilt als Lehm)</option>
            ${Object.entries(t.soils).map(
      ([o, l]) => c`<option value=${o} ?selected=${o === e.soil_type}>${l.name}</option>`
    )}
          </select>
        </label>
        ${a && a !== e.soil_type ? c`<button class="text small" @click=${() => r(() => e.soil_type = a)}>
              <ha-icon icon="mdi:layers-triple-outline"></ha-icon>Boden aus dem Plan übernehmen: ${this.soilName(a)}
            </button>` : d}
        <p class="hint small">Gilt für die berechnete Gießdauer. Mehr Einstellungen (Wurzeltiefe, Effizienz) unter Einstellungen → Integration → Konfigurieren.</p>
      </details>
    `;
  }
  renderWetLegend() {
    const e = this.plan.zones.filter(
      (n) => n.enabled && he(n) !== null && _e(n, this.plan.valves, this.status) === null
    ), t = z[z.length - 1][0], s = z.map(([n, [i, a, r]]) => `rgb(${i},${a},${r}) ${n / t * 100}%`).join(", ");
    return c`<div class="wet-legend">
      <strong>Wasser pro Durchgang</strong>
      <div class="bar" style="background: linear-gradient(to right, ${s})"></div>
      <div class="ticks">${z.map(([n]) => c`<span>${n}${n === t ? "+" : ""}</span>`)}<em>mm</em></div>
      ${e.length ? c`<small>Ohne Wert (kein Ventil, Durchfluss oder Dauer): ${e.map((n) => n.name).join(", ")}</small>` : d}
      <small>Schätzung aus Dauer × gelerntem Durchfluss; Überlappungen zählen doppelt.</small>
    </div>`;
  }
  // Übersicht ------------------------------------------------------------------
  renderOverview() {
    const e = this.plan, t = e.zones, s = (h) => e.valves.find((y) => y.id === h.valve_id), n = t.map((h) => {
      const y = he(h), _ = y ?? h.area_m2, S = s(h)?.learned_flow_l_min ?? null, k = ht(h, this.status), A = S && k ? k / 60 * S : null;
      return { z: h, drawn: y, area: _, flow: S, seconds: k, liters: A, mm: _e(h, e.valves, this.status) };
    }), i = n.filter((h) => h.z.enabled), a = i.reduce((h, y) => h + (y.area ?? 0), 0), r = i.reduce((h, y) => h + (y.liters ?? 0), 0), o = t.reduce((h, y) => h + y.overlap_m2, 0) / 2, l = ["sprinkler", "drip", "hose"].map((h) => {
      const y = i.filter((_) => _.z.type === h);
      return { type: h, count: y.length, area: y.reduce((_, S) => _ + (S.area ?? 0), 0) };
    }), p = {
      sprinkler: ["Sprinkler", "mdi:sprinkler-variant"],
      drip: ["Tropfschlauch", "mdi:water-outline"],
      hose: ["Gießschlauch", "mdi:pipe"]
    }, m = [];
    for (const h of n)
      h.z.enabled && (h.drawn === null && !h.z.area_m2 ? m.push(`${h.z.name}: weder gezeichnet noch Fläche von Hand`) : h.drawn === null && m.push(`${h.z.name}: noch nicht gezeichnet (Fläche von Hand)`), h.z.valve_id ? h.flow || m.push(`${h.z.name}: Durchfluss noch nicht gelernt (nach dem ersten Lauf)`) : m.push(`${h.z.name}: kein Ventil zugeordnet`));
    const u = e.valves.map((h) => {
      const y = i.filter((k) => k.z.valve_id === h.id), _ = y.reduce((k, A) => k + (A.area ?? 0), 0), S = h.learned_flow_l_min && _ ? h.learned_flow_l_min * 60 / _ : null;
      return { v: h, mine: y, area: _, rate: S };
    }).filter((h) => h.mine.length), x = (h, y = 0) => h == null ? "–" : h.toLocaleString("de-DE", { maximumFractionDigits: y });
    return c`
      <div class="overview">
        <section class="tiles">
          <div class="tile"><span>Bewässerte Fläche</span><strong>${M(a)}</strong>
            <small>${i.length} aktive Zonen</small></div>
          <div class="tile"><span>Gezeichnet</span><strong>${n.filter((h) => h.drawn !== null).length} von ${t.length}</strong>
            <small>Zonen im Plan</small></div>
          <div class="tile"><span>Wasser pro Durchgang</span><strong>${x(r)} L</strong>
            <small>alle aktiven Zonen einmal</small></div>
          <div class="tile ${o > 0.5 ? "warn" : ""}"><span>Überschneidungen</span><strong>${M(o)}</strong>
            <small>werden doppelt gegossen</small></div>
        </section>
        <section class="types">
          ${l.map(
      (h) => c`<div class="type">
              <ha-icon icon=${p[h.type][1]}></ha-icon>
              <span>${p[h.type][0]}</span>
              <strong>${M(h.area)}</strong>
              <small>${h.count} Zone${h.count === 1 ? "" : "n"}</small>
            </div>`
    )}
        </section>
        ${m.length ? c`<section class="card"><h3>Noch offen</h3><ul class="hints">${m.map((h) => c`<li>${h}</li>`)}</ul></section>` : d}
        <section class="card">
          <h3>Zonen</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Zone</th><th>Art</th><th>Ventil</th><th class="n">Fläche</th><th class="n">Dauer</th>
                <th class="n">Liter</th><th class="n">mm</th><th class="n">Bedarf</th></tr></thead>
              <tbody>
                ${n.map(
      (h, y) => c`<tr class=${h.z.enabled ? "" : "off"}>
                    <td><span class="dot" style="--zone:${this.zoneColor(y)}"></span>${h.z.name}</td>
                    <td>${p[h.z.type]?.[0] ?? h.z.type}</td>
                    <td>${s(h.z)?.name ?? "–"}</td>
                    <td class="n">${h.area ? M(h.area) : "–"}${h.drawn === null && h.area ? c`<sup title="von Hand">*</sup>` : d}</td>
                    <td class="n">${h.seconds ? we(h.seconds) : "–"}</td>
                    <td class="n">${x(h.liters)}</td>
                    <td class="n">${x(h.mm, 1)}</td>
                    <td class="n">${this.status?.zones[h.z.id] ? `${x(this.status.zones[h.z.id].need_mm, 1)} mm` : "–"}</td>
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
                ${u.map(
      (h) => c`<tr>
                    <td>${h.v.name}</td>
                    <td>${h.mine.map((y) => y.z.name).join(", ")}</td>
                    <td class="n">${M(h.area)}</td>
                    <td class="n">${h.v.learned_flow_l_min ? `${x(h.v.learned_flow_l_min, 1)} L/min` : "–"}</td>
                    <td class="n">${h.rate ? `${x(h.rate, 1)} mm/h` : "–"}</td>
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
    return c`
      <header>
        <button
          class="icon menu"
          title="Menü"
          @click=${() => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: !0, composed: !0 }))}
        >
          <ha-icon icon="mdi:menu"></ha-icon>
        </button>
        <div class="title">Bewässerung</div>
        ${this.plan ? c`<nav class="pages">
              <button class=${this.page === "plan" ? "active" : ""} @click=${() => this.page = "plan"}>
                <ha-icon icon="mdi:map-outline"></ha-icon>Plan
              </button>
              <button class=${this.page === "overview" ? "active" : ""} @click=${() => this.page = "overview"}>
                <ha-icon icon="mdi:chart-box-outline"></ha-icon>Übersicht
              </button>
              <button class=${this.page === "schedule" ? "active" : ""} @click=${() => this.page = "schedule"}>
                <ha-icon icon="mdi:calendar-clock"></ha-icon>Zeitplan
              </button>
            </nav>` : d}
        ${e ? c`<div class="chips">
              ${e.winter_mode ? c`<span class="chip winter"><ha-icon icon="mdi:snowflake"></ha-icon>Winterpause</span>` : c`<span class="chip ${e.automatic ? "on" : ""}"
                    ><ha-icon icon=${e.automatic ? "mdi:calendar-check" : "mdi:calendar-remove"}></ha-icon
                    >${e.automatic ? "Automatik an" : "Automatik aus"}</span
                  >`}
              ${e.problems.length ? c`<span class="chip alarm" title=${e.problems.join(`
`)}
                    ><ha-icon icon="mdi:alert"></ha-icon>${e.problems.length} Problem${e.problems.length > 1 ? "e" : ""}</span
                  >` : d}
            </div>` : d}
        <div class="spacer"></div>
        ${this.plan ? c`
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
                ${this.menuOpen ? c`<div class="popup-menu" role="menu">
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
      const e = await this._hass.callWS({ type: `${C}/export` }), t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), s = URL.createObjectURL(t), n = document.createElement("a");
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
          type: `${C}/import`,
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
    if (!this.pendingImport) return d;
    const e = this.pendingImport.data?.exported_at;
    return c`
      <div class="dialog-backdrop" @click=${() => this.pendingImport = null}>
        <div class="dialog" role="dialog" aria-modal="true" @click=${(t) => t.stopPropagation()}>
          <h2>Sicherung einspielen</h2>
          <p>
            <strong>${this.pendingImport.name}</strong>${e ? c`<br /><small>erstellt am ${new Date(e).toLocaleString("de-DE")}</small>` : d}
          </p>
          ${this.dirty ? c`<p class="note warn">Nicht gespeicherte Änderungen gehen dabei verloren.</p>` : d}
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
    const { w: e, h: t } = this.size, { cx: s, cy: n, scale: i } = this.view, a = `translate(${e / 2} ${t / 2}) scale(${i}) translate(${-s} ${-n})`, r = 1 / i, o = this.tool === "select" ? this.drag?.type === "pan" ? "grabbing" : "grab" : "crosshair";
    return c`
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
      this.tool === "bed" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishBed()), this.tool === "hose" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishHose()), this.tool === "feature" && L(this.featureKind) !== "point" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishFeature());
    }}
      >
        <g transform=${a}>
          ${this.renderBackground(r)}
          <g class="features">${this.renderFeatures(r)}</g>
          ${this.wetOn ? this.renderWetMap() : d}
          ${this.plan.zones.map((l, p) => this.renderZone(l, p, r))}
          ${this.renderSelectedHandles(r)} ${this.renderFeatureHandles(r)}
          ${this.renderDraft(r)} ${this.renderScaleDraft(r)} ${this.renderMeasure(r)}
          ${this.renderValveLinks(r)}
          ${this.plan.valves.map((l) => this.renderMarker("valve", l, r))}
          ${this.plan.sensors.map((l) => this.renderMarker("sensor", l, r))}
          ${this.wetOn ? this.renderSensorValues(r) : d}
          ${this.renderSnapHint(r)} ${this.renderMyPosition(r)}
          ${this.searchPin && this.plan.garden.background === "map" ? g`<g class="pin" transform="translate(${this.searchPin.point[0]} ${this.searchPin.point[1]}) scale(${r})">
                <path d="M0 0 C-3 -9 -11 -13 -11 -22 A11 11 0 1 1 11 -22 C11 -13 3 -9 0 0 Z"></path>
                <circle cx="0" cy="-22" r="4"></circle>
                <title>${this.searchPin.name}</title>
              </g>` : d}
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
        const o = this.plan.providers[t.map_provider ?? ""], l = o?.max_zoom ?? 20, p = Math.max(
          1,
          Math.min(l, Math.round(Ue(t.latitude, this.view.scale * (window.devicePixelRatio > 1 ? 1.4 : 1))))
        ), m = We(r, [t.latitude, t.longitude], s, p);
        n.push(g`<rect x=${s.x0} y=${s.y0} width=${s.x1 - s.x0} height=${s.y1 - s.y0} class="map-fill"></rect>`);
        const u = e * 0.5, x = (h) => h.map(
          (y) => g`<image href=${y.url} x=${y.x - u} y=${y.y - u} width=${y.size + 2 * u} height=${y.size + 2 * u} preserveAspectRatio="none" crossorigin="anonymous"></image>`
        );
        n.push(...x(m)), o?.overlay && t.map_provider !== "custom" && n.push(...x(We(o.overlay, [t.latitude, t.longitude], s, p)));
      }
    } else if (t.background === "image" && this.imageUrl && this.imageSize) {
      const r = this.imageMpp();
      n.push(
        g`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * r} height=${this.imageSize[1] * r} preserveAspectRatio="none"></image>`
      );
    }
    const i = [g`<g class="bg" opacity=${t.background_opacity ?? 1}>${n}</g>`], a = (t.background_opacity ?? 1) < 0.35;
    return (t.background !== "map" || a) && i.push(this.renderGrid(s, e, t.background === "image" && !a)), i;
  }
  renderGrid(e, t, s) {
    const n = pt(40 * t), i = [], a = n * 5;
    for (let r = Math.floor(e.x0 / n) * n; r <= e.x1; r += n) {
      const o = Math.abs(r / a - Math.round(r / a)) < 1e-6;
      i.push(g`<line x1=${r} y1=${e.y0} x2=${r} y2=${e.y1} class=${o ? "grid major" : "grid"}></line>`);
    }
    for (let r = Math.floor(e.y0 / n) * n; r <= e.y1; r += n) {
      const o = Math.abs(r / a - Math.round(r / a)) < 1e-6;
      i.push(g`<line x1=${e.x0} y1=${r} x2=${e.x1} y2=${r} class=${o ? "grid major" : "grid"}></line>`);
    }
    return g`<g class=${s ? "grid-layer faint" : "grid-layer"}>${i}</g>`;
  }
  tileTemplate() {
    const e = this.plan.garden;
    return e.map_provider === "custom" ? e.map_url ?? "" : this.plan.providers[e.map_provider ?? ""]?.url ?? "";
  }
  zoneColor(e) {
    return Ge[e % Ge.length];
  }
  renderZone(e, t, s) {
    const n = this.zoneColor(t), i = this.status?.zones[e.id]?.state ?? "idle", a = this.selected?.kind === "zone" && this.selected.id === e.id, r = `zone ${i} ${a ? "selected" : ""} ${e.enabled ? "" : "disabled"}`;
    let o, l = null;
    if (e.type === "sprinkler" && e.center && e.radius_m)
      o = g`<path d=${It(e.center, e.radius_m, e.start_angle_deg, e.arc_deg)}></path>`, l = e.arc_deg >= 360 ? e.center : T(e.center, e.radius_m * 0.55, e.start_angle_deg + e.arc_deg / 2);
    else if (e.type === "hose" && e.polygon.length >= 2 && e.radius_m) {
      const u = e.polygon.map((x) => x.join(",")).join(" ");
      o = g`<polyline class="hose-band" points=${u} stroke-width=${2 * e.radius_m}></polyline>
        <polyline class="hose-line" points=${u}></polyline>`, l = this.zoneAnchor(e);
    } else e.type === "drip" && e.polygon.length >= 3 && (o = g`<polygon points=${e.polygon.map((u) => u.join(",")).join(" ")}></polygon>`, l = be(e.polygon));
    if (!o) return d;
    const p = oe(e), m = this.soilOn ? ve[e.soil_type ?? "loam"] : "";
    return g`
      <g class=${r} style="--zone:${m || n}"
        @pointerdown=${(u) => {
      this.tool === "select" && (this.selected = { kind: "zone", id: e.id }, this.tab = "zones", this.startDrag(u, { type: "move-zone", id: e.id, start: this.toPlan(u), orig: structuredClone(e) }));
    }}>
        ${o}
        ${l ? g`<text x=${l[0]} y=${l[1]} font-size=${13 * s} stroke-width=${3 * s} class="label">
              <tspan x=${l[0]} dy="0">${e.name}</tspan>
              <tspan x=${l[0]} dy=${15 * s} class="sub">${M(p)}${ke[i] ? ` · ${ke[i]}` : ""}</tspan>
            </text>` : d}
      </g>`;
  }
  renderSelectedHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "zone") return d;
    const t = this.zone(this.selected.id), s = 7 * e, n = (a, r, o = "", l = "") => g`<circle class="handle ${o}" cx=${a[0]} cy=${a[1]} r=${s}
        @pointerdown=${(p) => this.startDrag(p, r)}><title>${l}</title></circle>`;
    if (t.type === "sprinkler" && t.center && t.radius_m) {
      const a = t.center, r = t.arc_deg >= 360, o = r ? t.start_angle_deg + 135 : t.start_angle_deg + t.arc_deg / 2, l = [
        g`<line class="guide" x1=${a[0]} y1=${a[1]} x2=${T(a, t.radius_m, t.start_angle_deg)[0]} y2=${T(a, t.radius_m, t.start_angle_deg)[1]}></line>`,
        n(a, { type: "center", id: t.id }, "center", "Mittelpunkt verschieben"),
        n(T(a, t.radius_m, o), { type: "radius", id: t.id }, "radius", "Reichweite ändern"),
        n(T(a, t.radius_m, t.start_angle_deg), { type: "start", id: t.id }, "angle", "Anfang des Bogens")
      ];
      return r ? l.push(
        n(T(a, t.radius_m * 0.8, t.start_angle_deg + 20), { type: "end", id: t.id }, "angle small", "Bogen öffnen")
      ) : l.push(
        n(T(a, t.radius_m, t.start_angle_deg + t.arc_deg), { type: "end", id: t.id }, "angle", "Ende des Bogens")
      ), l;
    }
    const i = t.type === "hose" ? 2 : 3;
    if (t.type !== "sprinkler" && t.polygon.length >= i) {
      const a = t.polygon;
      return [
        ...(t.type === "hose" ? a.slice(0, -1) : a).map((o, l) => {
          const p = a[(l + 1) % a.length], m = [(o[0] + p[0]) / 2, (o[1] + p[1]) / 2];
          return g`<circle class="handle mid" cx=${m[0]} cy=${m[1]} r=${s * 0.7}
            @pointerdown=${(u) => this.insertVertex(u, t, l)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
        }),
        ...a.map(
          (o, l) => g`<circle class="handle" cx=${o[0]} cy=${o[1]} r=${s}
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
      const s = this.selected?.kind === "feature" && this.selected.id === t.id, n = L(t.kind), i = (l) => {
        this.tool === "select" && (this.selected = { kind: "feature", id: t.id }, this.tab = "plan", this.startDrag(l, { type: "f-move", id: t.id, start: this.toPlan(l), orig: structuredClone(t) }));
      }, a = `feature ${t.kind} ${s ? "selected" : ""}`;
      if (n === "area") {
        const l = be(t.points), p = t.kind === "soil" ? ve[t.soil_type ?? ""] ?? "#a9825a" : "";
        return g`<polygon class=${a} points=${t.points.map((m) => m.join(",")).join(" ")}
          style=${p ? `fill:${p}44;stroke:${p}` : ""}
          @pointerdown=${i}><title>${Z(t)}${t.kind === "soil" ? `: ${this.soilName(t.soil_type)}` : ""}</title></polygon>
          ${t.label ? g`<text class="feature-name" x=${l[0]} y=${l[1]} dy=${4 * e} font-size=${12 * e}
                stroke-width=${3 * e}>${t.label}</text>` : d}`;
      }
      if (n === "line")
        return g`<g class=${a} @pointerdown=${i}>
          <polyline class="hit" points=${t.points.map((l) => l.join(",")).join(" ")} stroke-width=${12 * e}></polyline>
          <polyline points=${t.points.map((l) => l.join(",")).join(" ")}></polyline>
          <title>${Z(t)}</title></g>`;
      const [r, o] = t.points[0];
      return t.kind === "tree" ? g`<g class=${a} @pointerdown=${i}>
          <circle cx=${r} cy=${o} r=${t.radius_m ?? 1}></circle>
          <circle class="trunk" cx=${r} cy=${o} r=${Math.max(3 * e, (t.trunk_m ?? 0) / 2)}></circle>
          <title>${Z(t)}</title></g>` : t.kind === "label" ? g`<text class=${a} x=${r} y=${o} font-size=${14 * e} stroke-width=${3 * e}
          @pointerdown=${i}>${t.label}</text>` : g`<g class=${a} @pointerdown=${i}>
        <circle cx=${r} cy=${o} r=${8 * e}></circle>
        <text x=${r} y=${o} dy=${4 * e} font-size=${11 * e}>H</text>
        <title>${Z(t)}</title></g>`;
    });
  }
  renderFeatureHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "feature") return d;
    const t = this.feature(this.selected.id);
    if (!t) return d;
    const s = 7 * e, n = L(t.kind);
    if (n === "point") {
      if (t.kind !== "tree") return d;
      const [o, l] = t.points[0], p = T(t.points[0], t.radius_m ?? 1, 135);
      return g`
        <circle class="handle center" cx=${o} cy=${l} r=${s}
          @pointerdown=${(m) => this.startDrag(m, { type: "f-move", id: t.id, start: this.toPlan(m), orig: structuredClone(t) })}></circle>
        <circle class="handle" cx=${p[0]} cy=${p[1]} r=${s}
          @pointerdown=${(m) => this.startDrag(m, { type: "f-radius", id: t.id })}><title>Kronengröße</title></circle>`;
    }
    const i = t.points;
    return [
      ...(n === "area" ? i : i.slice(0, -1)).map((o, l) => {
        const p = i[(l + 1) % i.length], m = [(o[0] + p[0]) / 2, (o[1] + p[1]) / 2];
        return g`<circle class="handle mid" cx=${m[0]} cy=${m[1]} r=${s * 0.7}
        @pointerdown=${(u) => this.insertFeatureVertex(u, t, l)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
      }),
      ...i.map(
        (o, l) => g`<circle class="handle" cx=${o[0]} cy=${o[1]} r=${s}
          @pointerdown=${(p) => this.startDrag(p, { type: "f-vertex", id: t.id, index: l })}
          @contextmenu=${(p) => this.removeFeatureVertex(p, t, l)}
          @dblclick=${(p) => this.removeFeatureVertex(p, t, l)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
      )
    ];
  }
  insertFeatureVertex(e, t, s) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const n = t.points[s], i = t.points[(s + 1) % t.points.length];
    t.points.splice(s + 1, 0, [$((n[0] + i[0]) / 2), $((n[1] + i[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "f-vertex", id: t.id, index: s + 1 };
  }
  removeFeatureVertex(e, t, s) {
    e.preventDefault(), e.stopPropagation();
    const n = L(t.kind) === "area" ? 3 : 2;
    if (t.points.length <= n) {
      this.showToast(`${B[t.kind].label}: mindestens ${n} Punkte`, !0);
      return;
    }
    this.remember(), t.points.splice(s, 1), this.changed();
  }
  /** Messwerkzeug: Strecken mit Längen und Summe. */
  renderMeasure(e) {
    if (this.tool !== "measure" || !this.measurePts.length) return d;
    const t = this.hover ? [...this.measurePts, this.hover] : this.measurePts, s = t.slice(1).map((n, i) => {
      const a = t[i];
      if (w(a, n) < 0.01) return d;
      const r = [(a[0] + n[0]) / 2, (a[1] + n[1]) / 2];
      return g`<text class="measure-label" x=${r[0]} y=${r[1]} dy=${-6 * e} font-size=${13 * e}
        stroke-width=${3 * e}>${V(w(a, n))}</text>`;
    });
    return g`<g class="measure">
      <polyline points=${t.map((n) => n.join(",")).join(" ")}></polyline>
      ${this.measurePts.map((n) => g`<circle cx=${n[0]} cy=${n[1]} r=${4 * e}></circle>`)}
      ${s}
    </g>`;
  }
  /** Mittelpunkt einer gezeichneten Zone (für Beschriftung und Verbindungslinie). */
  zoneAnchor(e) {
    return e.type === "sprinkler" ? e.center && e.radius_m ? e.center : null : e.type === "hose" ? e.polygon.length >= 2 ? Ft(e.polygon, 0.5) : null : e.polygon.length >= 3 ? be(e.polygon) : null;
  }
  /** Gestrichelte Linie von jeder Zone zu ihrem Ventil (wenn beide im Plan sind). */
  renderValveLinks(e) {
    return this.plan.zones.map((t, s) => {
      const n = this.plan.valves.find((l) => l.id === t.valve_id), i = this.zoneAnchor(t);
      if (!n?.position || !i) return d;
      const a = this.selected?.kind === "zone" && this.selected.id === t.id || this.selected?.kind === "valve" && this.selected.id === n.id, [r, o] = n.position;
      return g`<line class="valve-link ${a ? "selected" : ""}" style="--zone:${this.zoneColor(s)}"
        x1=${i[0]} y1=${i[1]} x2=${r} y2=${o} stroke-dasharray=${`${6 * e} ${4 * e}`}></line>`;
    });
  }
  renderSnapHint(e) {
    return this.snapHint ? g`<circle class="snap-hint" cx=${this.snapHint[0]} cy=${this.snapHint[1]} r=${9 * e}></circle>` : d;
  }
  renderDraft(e) {
    if (this.tool === "feature" && this.draft.length) {
      const n = this.hover ? [...this.draft, this.hover] : this.draft, i = L(this.featureKind) === "area";
      return g`
        <g class="draft feature-draft ${this.featureKind}">
          <polyline points=${[...n, ...i && n.length > 2 ? [n[0]] : []].map((a) => a.join(",")).join(" ")}></polyline>
          ${this.draft.map((a, r) => g`<circle cx=${a[0]} cy=${a[1]} r=${(r === 0 ? 7 : 5) * e}></circle>`)}
        </g>`;
    }
    if (this.tool === "hose" && this.draft.length) {
      const n = this.hover ? [...this.draft, this.hover] : this.draft;
      return g`<g class="draft">
        <polyline points=${n.map((i) => i.join(",")).join(" ")} style="fill:none"></polyline>
        ${this.draft.map((i) => g`<circle cx=${i[0]} cy=${i[1]} r=${5 * e}></circle>`)}
      </g>`;
    }
    if (this.tool !== "bed" || !this.draft.length) return d;
    const t = this.hover ? [...this.draft, this.hover] : this.draft, s = this.plan.zones.findIndex((n) => n.id === this.toolTarget);
    return g`
      <g class="draft" style="--zone:${this.zoneColor(s)}">
        <polyline points=${t.map((n) => n.join(",")).join(" ")}></polyline>
        ${this.draft.map(
      (n, i) => g`<circle cx=${n[0]} cy=${n[1]} r=${(i === 0 ? 8 : 5) * e} class=${i === 0 ? "first" : ""}></circle>`
    )}
      </g>`;
  }
  renderScaleDraft(e) {
    if (this.tool !== "scale") return d;
    const t = this.imageMpp(), s = this.scaleDraft.map((n) => [n[0] * t, n[1] * t]);
    return g`<g class="scale-draft">
      ${s.length === 2 ? g`<line x1=${s[0][0]} y1=${s[0][1]} x2=${s[1][0]} y2=${s[1][1]}></line>` : d}
      ${s.map((n) => g`<circle cx=${n[0]} cy=${n[1]} r=${6 * e}></circle>`)}
    </g>`;
  }
  renderMarker(e, t, s) {
    if (!t.position) return d;
    const [n, i] = t.position, a = this.selected?.kind === e && this.selected.id === t.id, r = e === "valve" ? "V" : qe[t.kind] ?? "S", o = 11 * s;
    return g`
      <g class="marker ${e} ${a ? "selected" : ""}"
        @pointerdown=${(l) => {
      this.tool === "select" && (this.selected = { kind: e, id: t.id }, this.tab = "zones", this.startDrag(l, { type: "marker", kind: e, id: t.id }));
    }}>
        ${e === "valve" ? g`<rect x=${n - o} y=${i - o} width=${2 * o} height=${2 * o} rx=${4 * s}></rect>` : g`<circle cx=${n} cy=${i} r=${o}></circle>`}
        <text x=${n} y=${i} font-size=${12 * s} dy=${4.2 * s}>${r}</text>
        <title>${t.name}</title>
      </g>`;
  }
  renderOverlay() {
    const e = this.plan.garden, t = this.toolBanner(), s = ds(this.view.scale), n = e.background === "map" ? this.plan.providers[e.map_provider ?? ""] : void 0;
    return c`
      <div class="tools">
        <button class="icon" title="Vergrößern" @click=${() => this.zoomBy(1.4)}><ha-icon icon="mdi:plus"></ha-icon></button>
        <button class="icon" title="Verkleinern" @click=${() => this.zoomBy(1 / 1.4)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="icon" title="Alles zeigen" @click=${this.fitView}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
        <button class="icon ${this.wetOn ? "on" : ""}" title="Nässekarte: wie viel Wasser wo ankommt"
          @click=${() => this.wetOn = !this.wetOn}>
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
        ${e.background === "map" ? c`<button class="icon ${this.layersOpen ? "on" : ""}" title="Kartenansicht wechseln"
              @click=${() => this.layersOpen = !this.layersOpen}>
              <ha-icon icon="mdi:layers-outline"></ha-icon>
            </button>` : d}
        ${e.background === "map" ? c`<button class="icon ${this.searchOpen ? "on" : ""}" title="Adresse suchen"
              @click=${() => this.searchOpen ? this.closeSearch() : this.openSearch()}>
              <ha-icon icon="mdi:magnify"></ha-icon>
            </button>` : d}
        ${e.background !== "image" ? c`<button class="icon ${this.locating ? "on" : ""}"
              title=${this.locating ? "Orten beenden" : "Orten: meinen Standort zeigen"}
              @click=${this.toggleLocate}>
              <ha-icon icon=${this.locating ? this.myPos ? "mdi:crosshairs-gps" : "mdi:crosshairs-question" : "mdi:crosshairs"}></ha-icon>
            </button>` : d}
      </div>
      ${t} ${this.renderSearch()} ${this.renderLayers()}
      <div class="compass" style="transform: rotate(${e.background === "image" ? -e.north_deg : 0}deg)" title="Norden">
        <svg viewBox="-12 -12 24 24"><path d="M0 -10 L4 2 L0 0 L-4 2 Z" class="n"></path><path d="M0 10 L4 2 L0 0 L-4 2 Z" class="s"></path></svg>
        <span>N</span>
      </div>
      <div class="scalebar"><div style="width:${s.px}px"></div><span>${s.label}</span></div>
      ${this.wetOn ? this.renderWetLegend() : d}
      ${this.soilOn && !this.wetOn ? this.renderSoilLegend() : d}
      ${e.background === "map" ? c`<div class="attribution">${n?.attribution ?? "Eigener Kartendienst"}</div>` : d}
      ${!this.hasAnyDrawing() && this.tool === "select" ? c`<div class="welcome">
            <ha-icon icon="mdi:draw"></ha-icon>
            <div>
              <strong>Noch nichts gezeichnet.</strong><br />
              Wähle rechts einen Hintergrund und dann bei einer Zone „Zeichnen“.
            </div>
          </div>` : d}
    `;
  }
  hasAnyDrawing() {
    return this.features.length > 0 || this.plan.zones.some((e) => oe(e) !== null);
  }
  toolBanner() {
    if (this.tool === "select") return d;
    let e = "", t = d;
    const s = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    if (this.tool === "sprinkler" && (e = `${s}: Am Sprinkler drücken und bis zum Rand ziehen.`), this.tool === "hose" && (e = `${s}: Den Verlauf des Schlauchs anklicken, Doppelklick beendet.`, t = c`<button class="text" ?disabled=${this.draft.length < 2} @click=${this.finishHose}>Fertig</button>`), this.tool === "bed" && (e = `${s}: Ecken anklicken, zum Schließen den ersten Punkt.`, t = c`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`), this.tool === "place" && (e = `${s}: Auf die Stelle im Plan klicken${this.myPoint() ? " oder an deinen Standort setzen" : ""}.`, this.myPoint() && (t = c`<button class="text" @click=${this.placeAtMe}><ha-icon icon="mdi:crosshairs-gps"></ha-icon>Mein Standort</button>`)), this.tool === "feature") {
      const n = B[this.featureKind], i = n.family;
      e = i === "area" ? `${n.label}: Ecken anklicken, zum Schließen den ersten Punkt.` : i === "line" ? `${n.label}: Punkte anklicken, Doppelklick beendet.` : this.featureKind === "tree" ? `${n.label}: In die Mitte drücken und bis zum Kronenrand ziehen.` : `${n.label}: Auf die Stelle klicken.`, i !== "point" && (t = c`<button
          class="text"
          ?disabled=${this.draft.length < (i === "area" ? 3 : 2)}
          @click=${this.finishFeature}
        >
          Fertig
        </button>`);
    }
    if (this.tool === "measure") {
      const n = ee(this.measurePts);
      e = this.measurePts.length < 2 ? "Messen: Punkte anklicken. Alt-Taste: ohne Einrasten." : `Gemessen: ${V(n)}${this.measurePts.length > 2 ? " (Summe)" : ""}`, this.measurePts.length && (t = c`<button class="text" @click=${() => this.measurePts = []}>Neu</button>`);
    }
    return this.tool === "scale" && (e = this.scaleDraft.length < 2 ? "Maßstab: Zwei Punkte im Bild anklicken, deren Abstand du kennst (z. B. die Ecken der Terrasse)." : "Abstand eingeben:", this.scaleDraft.length === 2 && (t = c`<input
            class="small"
            type="text"
            inputmode="decimal"
            placeholder="Meter"
            .value=${this.scaleInput}
            @input=${(n) => this.scaleInput = n.target.value}
            @keydown=${(n) => n.key === "Enter" && this.applyScale()}
          /><span>m</span>
          <button class="text" @click=${this.applyScale}>Übernehmen</button>`)), c`<div class="banner">
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
      return c`<p class="hint">
        Noch keine Zonen. Zonen und Ventile legst du unter Einstellungen → Geräte & Dienste →
        Bewässerungsplaner → Konfigurieren an.
      </p>`;
    const t = this.selected;
    return c`
      <ul class="list">
        ${e.zones.map((s, n) => this.renderZoneItem(s, n, t?.kind === "zone" && t.id === s.id))}
      </ul>
      ${e.valves.length || e.sensors.length ? c`<h3>Ventile und Sensoren</h3>
            <ul class="list compact">
              ${e.valves.map((s) => this.renderMarkerItem("valve", s))}
              ${e.sensors.map((s) => this.renderMarkerItem("sensor", s))}
            </ul>` : d}
      <p class="hint small">
        Ziehen verschiebt die Ansicht, das Mausrad zoomt. Gezeichnete Flächen ersetzen die Fläche
        von Hand bei der Berechnung. Namen, Pflanzen und Ventile änderst du in den Einstellungen der
        Integration.
      </p>
    `;
  }
  renderZoneItem(e, t, s) {
    const n = this.status?.zones[e.id], i = oe(e), a = i !== null, r = e.type === "sprinkler";
    return c`
      <li class="item ${s ? "open" : ""}" style="--zone:${this.zoneColor(t)}">
        <div class="row" @click=${() => {
      this.selected = s ? null : { kind: "zone", id: e.id };
    }}>
          <span class="dot"></span>
          <ha-icon icon=${r ? "mdi:sprinkler-variant" : e.type === "hose" ? "mdi:pipe" : "mdi:water-outline"}></ha-icon>
          <span class="name">${e.name}</span>
          ${n && n.state !== "idle" ? c`<span class="badge ${n.state}">${ke[n.state]}</span>` : d}
          <span class="meta">${a ? M(i) : c`<em>nicht gezeichnet</em>`}</span>
        </div>
        ${s ? this.renderInspector(e, n) : d}
      </li>
    `;
  }
  renderInspector(e, t) {
    const s = e.type === "sprinkler", n = oe(e), i = n !== null, a = s ? "sprinkler" : e.type === "hose" ? "hose" : "bed", r = (o, l, p, m, u = 0.1) => c`<label class="field">
        <span>${o}</span>
        <input type="number" step=${u} .value=${l == null ? "" : String(l)}
          @change=${(x) => {
      const h = parseFloat(x.target.value);
      Number.isFinite(h) && (this.remember(), m(h), this.changed());
    }} />
        <span class="unit">${p}</span>
      </label>`;
    return c`
      <div class="inspector">
        <label class="field wide">
          <span>Ventil</span>
          <select
            @change=${(o) => {
      const l = o.target.value;
      this.remember(), e.valve_id = l || null;
      for (const p of this.plan.valves)
        p.zone_ids = p.zone_ids.filter((m) => m !== e.id), p.id === e.valve_id && p.zone_ids.push(e.id);
      this.changed();
    }}
          >
            <option value="" ?selected=${!e.valve_id}>kein Ventil</option>
            ${this.plan.valves.map(
      (o) => c`<option value=${o.id} ?selected=${e.valve_id === o.id}>
                ${o.name}${o.zone_ids.some((l) => l !== e.id) ? " (auch andere Zonen)" : ""}
              </option>`
    )}
          </select>
        </label>
        ${this.renderPlantSoil(e)}
        ${!this.plan.valves.find((o) => o.id === e.valve_id)?.position && e.valve_id ? c`<p class="hint small">Setze das Ventil im Plan (unten „Platzieren“), dann siehst du die Verbindung.</p>` : d}
        <dl>
          <dt>Fläche gezeichnet</dt>
          <dd>${i ? M(n) : "–"}</dd>
          <dt>Fläche von Hand</dt>
          <dd>${e.area_m2 ? M(e.area_m2) : "–"}</dd>
          ${e.overlap_m2 > 0.05 ? c`<dt>Überschneidung</dt><dd class="warn">${M(e.overlap_m2)} mit anderen Zonen</dd>` : d}
          ${t ? c`<dt>Bedarf</dt><dd>${t.need_mm.toFixed(1)} mm</dd>
                <dt>Geplant</dt><dd>${t.planned_s ? we(t.planned_s) : "nicht gießen"}
                  <span class="reason">(${t.reason})</span></dd>` : d}
          ${t?.locked_reason ? c`<dt>Gesperrt</dt><dd class="warn">${t.locked_reason}</dd>` : d}
        </dl>
        ${s && i ? c`<div class="fields">
              ${r("Reichweite", e.radius_m, "m", (o) => e.radius_m = Math.max(0.1, o))}
              ${r("Richtung", e.start_angle_deg, "°", (o) => e.start_angle_deg = (o % 360 + 360) % 360, 5)}
              ${r("Bogen", e.arc_deg, "°", (o) => e.arc_deg = Math.min(360, Math.max(1, o)), 5)}
            </div>
            <p class="hint small">Richtung: Anfang des Bogens, 0° = Norden (oben), 90° = Osten.</p>` : d}
        ${e.type === "hose" && i ? c`<div class="fields">
                ${r("Bewässert je Seite", e.radius_m, "m", (o) => e.radius_m = Math.max(0.05, o), 0.05)}
              </div>
              <p class="hint small">Länge ${V(ee(e.polygon))}, bewässert ${V(2 * (e.radius_m ?? 0))} breit.</p>
              ${this.renderEdges(e.polygon, !1, (o) => e.polygon = o)}` : d}
        ${e.type === "drip" && i ? this.renderEdges(e.polygon, !0, (o) => e.polygon = o) : d}
        <div class="actions">
          <button class="text" @click=${() => this.startTool(a, e.id)}>
            <ha-icon icon=${i ? "mdi:pencil" : "mdi:draw"}></ha-icon>${i ? "Neu zeichnen" : "Zeichnen"}
          </button>
          ${i ? c`<button class="text danger" @click=${() => this.clearGeometry(e.id)}>
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
    const s = this.selected?.kind === e && this.selected.id === t.id, n = e === "valve" ? t.safety_level === "device" ? "schließt selbst" : "nur Home Assistant" : os[t.kind] ?? "";
    return c`
      <li class="item ${s ? "open" : ""}">
        <div class="row" @click=${() => this.selected = { kind: e, id: t.id }}>
          <span class="marker-icon ${e}">${e === "valve" ? "V" : qe[t.kind] ?? "S"}</span>
          <span class="name">${t.name}<small>${n}</small></span>
          <button class="text small" @click=${(i) => {
      i.stopPropagation(), this.startTool("place", `${e}:${t.id}`);
    }}>${t.position ? "Versetzen" : "Platzieren"}</button>
          ${t.position ? c`<button class="icon small" title="Vom Plan nehmen" @click=${(i) => {
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
    return c`
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
    const n = Rt(e, t);
    return c`
      <details class="edges">
        <summary>Seitenlängen (${n.length})</summary>
        <div class="edge-list">
          ${n.map(
      (i, a) => c`<label class="field">
              <span>Seite ${a + 1}</span>
              <input
                type="number"
                step="0.05"
                min="0.05"
                .value=${i.toFixed(2)}
                @change=${(r) => {
        const o = parseFloat(r.target.value.replace(",", "."));
        o > 0 && (this.remember(), s(Ht(e, a, o).map((l) => [$(l[0]), $(l[1])])), this.changed());
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
      const n = B[s], i = this.tool === "feature" && this.featureKind === s;
      return c`<button
        class="tool ${i ? "active" : ""}"
        title=${n.label}
        @click=${() => i ? this.cancelTool() : this.startTool("feature", s)}
      >
        <ha-icon icon=${n.icon}></ha-icon><span>${n.label}</span>
      </button>`;
    };
    return c`
      <p class="hint small">
        Pause Haus, Wege, Zäune und Bäume vom Luftbild ab. Dann kannst du das Luftbild abblenden und
        bleibst in jeder Zoomstufe scharf. Der Grundriss dient nur zur Orientierung.
      </p>
      ${this.renderOpacity()}
      <h3>Flächen</h3>
      <div class="palette">${["building", "paving", "water", "area", "soil"].map(t)}</div>
      <h3>Linien</h3>
      <div class="palette">${["fence", "hedge", "boundary", "pipe"].map(t)}</div>
      <h3>Punkte</h3>
      <div class="palette">${["tree", "tap", "label"].map(t)}</div>
      <label class="check">
        <input type="checkbox" .checked=${this.snapOn} @change=${(s) => this.snapOn = s.target.checked} />
        An Ecken einrasten <small>(Alt-Taste: kurz aus)</small>
      </label>
      ${this.features.length ? c`<h3>Im Plan (${this.features.length})</h3>
            <ul class="list compact">
              ${this.features.map((s) => this.renderFeatureItem(s, e?.id === s.id))}
            </ul>` : d}
    `;
  }
  renderFeatureItem(e, t) {
    const s = B[e.kind], n = s?.family ?? "area", i = n === "area" ? M(Te(e.points)) : n === "line" ? V(ee(e.points)) : e.kind === "tree" ? `Ø ${V(2 * (e.radius_m ?? 0))}` : "", a = Object.entries(B).filter(([, r]) => r.family === n);
    return c`
      <li class="item ${t ? "open" : ""}">
        <div class="row" @click=${() => this.selected = t ? null : { kind: "feature", id: e.id }}>
          <ha-icon icon=${s?.icon ?? "mdi:shape-outline"}></ha-icon>
          <span class="name">${Z(e)}</span>
          <span class="meta">${i}</span>
        </div>
        ${t ? c`<div class="inspector">
              ${e.kind !== "label" && a.length > 1 ? c`<label class="field wide">
                    <span>Art</span>
                    <select
                      .value=${e.kind}
                      @change=${(r) => {
      this.remember(), e.kind = r.target.value, e.kind === "soil" && !e.soil_type && (e.soil_type = "loam"), this.changed();
    }}
                    >
                      ${a.map(([r, o]) => c`<option value=${r} ?selected=${r === e.kind}>${o.label}</option>`)}
                    </select>
                  </label>` : d}
              <label class="field wide">
                <span>${e.kind === "label" ? "Text" : "Name (optional)"}</span>
                <input
                  id=${e.kind === "label" ? "feature-label" : "feature-name"}
                  type="text"
                  maxlength=${Ut}
                  .value=${e.label ?? ""}
                  @change=${(r) => {
      const o = r.target.value.trim();
      e.kind === "label" && !o || (this.remember(), e.label = o || null, this.changed());
    }}
                />
              </label>
              ${e.kind === "soil" ? c`<label class="field wide">
                    <span>Bodenart</span>
                    <select
                      @change=${(r) => {
      this.remember(), e.soil_type = r.target.value, this.changed();
    }}
                    >
                      ${Object.entries(this.plan.catalog.soils).map(
      ([r, o]) => c`<option value=${r} ?selected=${r === e.soil_type}>${o.name}</option>`
    )}
                    </select>
                  </label>
                  <p class="hint small">Zonen in dieser Fläche können den Boden mit einem Klick übernehmen.</p>` : d}
              ${e.kind === "tree" ? c`<label class="field wide">
                    <span>Kronendurchmesser</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      .value=${(2 * (e.radius_m ?? 0)).toFixed(1)}
                      @change=${(r) => {
      const o = parseFloat(r.target.value);
      o > 0 && (this.remember(), e.radius_m = $(o / 2), this.changed());
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
      const o = parseFloat(r.target.value);
      o >= 0 && (this.remember(), e.trunk_m = o > 0 ? Math.min($(o), 2 * (e.radius_m ?? 0)) : null, this.changed());
    }}
                    />
                    <span class="unit">m</span>
                  </label>
                  <p class="hint small">Ein dicker Stamm hält den Strahl eines Sprinklers auf. Die Nässekarte zeigt dahinter einen Wasserschatten.</p>` : d}
              ${n !== "point" ? this.renderEdges(e.points, n === "area", (r) => e.points = r) : d}
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
    const e = this.plan.garden, t = this.plan.providers, s = (n, i, a, r) => c`
      <button class="choice ${e.background === n ? "active" : ""}" @click=${() => this.setBackground(n)}>
        <ha-icon icon=${i}></ha-icon>
        <span><strong>${a}</strong><small>${r}</small></span>
      </button>`;
    return c`
      <div class="choices">
        ${s("map", "mdi:satellite-variant", "Luftbild", "Kartendienst, live im Browser geladen")}
        ${s("image", "mdi:image-outline", "Eigenes Bild", "Foto, Skizze oder Screenshot")}
        ${s("none", "mdi:grid", "Raster", "Leeres Raster in Metern")}
      </div>
      ${this.renderOpacity()}
      ${e.background === "map" ? this.renderMapSettings(e, t) : d}
      ${e.background === "image" ? this.renderImageSettings(e) : d}
    `;
  }
  renderMapSettings(e, t) {
    return c`
      <h3>Kartendienst</h3>
      <select
        .value=${e.map_provider ?? "basemap_at"}
        @change=${(s) => this.updateGarden({ map_provider: s.target.value })}
      >
        ${Object.entries(t).map(
      ([s, n]) => c`<option value=${s} ?selected=${e.map_provider === s}>${n.name}</option>`
    )}
        <option value="custom" ?selected=${e.map_provider === "custom"}>Eigene Adresse …</option>
      </select>
      ${e.map_provider === "esri" ? c`<p class="note warn">
            Esri erlaubt die Nutzung nur nach seinen Nutzungsbedingungen. Für den privaten Garten ist das
            meist in Ordnung; prüfe es bitte selbst.
          </p>` : d}
      ${e.map_provider?.startsWith("basemap_at") ? c`<p class="note">Von basemap.at, nur in Österreich. Lizenz CC BY 4.0.</p>` : d}
      ${e.map_provider === "osm" ? c`<p class="note">
            OpenStreetMap-Karte, weltweit. Bitte nur gelegentlich nutzen (Regeln der OpenStreetMap-Kacheln).
          </p>` : d}
      <p class="hint small">Schneller umschalten: Ebenen-Knopf links auf der Karte.</p>
      ${e.map_provider === "custom" ? c`<label class="field wide">
              <span>Adresse mit {z}, {x}, {y}</span>
              <input type="url" placeholder="https://…/{z}/{x}/{y}.jpg" .value=${e.map_url ?? ""}
                @change=${(s) => this.updateGarden({ map_url: s.target.value.trim() })} />
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
    return c`
      <h3>Bild</h3>
      <label class="upload">
        <input type="file" accept="image/png,image/jpeg,image/webp" @change=${this.upload} />
        <ha-icon icon="mdi:upload"></ha-icon>${e.background_image ? "Anderes Bild hochladen" : "Bild hochladen"}
      </label>
      <p class="hint small">PNG, JPEG oder WebP, höchstens 15 MB.</p>
      ${e.background_image ? c`
            <h3>Maßstab</h3>
            <p class=${t ? "note" : "note warn"}>
              ${t ? c`Gesetzt: ${e.scale_distance_m} m zwischen zwei Punkten (${(this.imageMpp() * 100).toFixed(1)} cm je Bildpunkt).` : "Noch kein Maßstab. Ohne ihn stimmen die Flächen nicht, und der Plan lässt sich nicht speichern."}
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
          ` : d}
    `;
  }
};
b.styles = ot;
v([
  me({ type: Boolean, reflect: !0 })
], b.prototype, "narrow", 2);
v([
  f()
], b.prototype, "plan", 2);
v([
  f()
], b.prototype, "status", 2);
v([
  f()
], b.prototype, "error", 2);
v([
  f()
], b.prototype, "toast", 2);
v([
  f()
], b.prototype, "tab", 2);
v([
  f()
], b.prototype, "featureKind", 2);
v([
  f()
], b.prototype, "measurePts", 2);
v([
  f()
], b.prototype, "snapOn", 2);
v([
  f()
], b.prototype, "snapHint", 2);
v([
  f()
], b.prototype, "tool", 2);
v([
  f()
], b.prototype, "toolTarget", 2);
v([
  f()
], b.prototype, "selected", 2);
v([
  f()
], b.prototype, "draft", 2);
v([
  f()
], b.prototype, "scaleDraft", 2);
v([
  f()
], b.prototype, "scaleInput", 2);
v([
  f()
], b.prototype, "view", 2);
v([
  f()
], b.prototype, "size", 2);
v([
  f()
], b.prototype, "imageUrl", 2);
v([
  f()
], b.prototype, "imageSize", 2);
v([
  f()
], b.prototype, "saving", 2);
v([
  f()
], b.prototype, "dirty", 2);
v([
  f()
], b.prototype, "searchOpen", 2);
v([
  f()
], b.prototype, "searchQuery", 2);
v([
  f()
], b.prototype, "searchResults", 2);
v([
  f()
], b.prototype, "searching", 2);
v([
  f()
], b.prototype, "searchError", 2);
v([
  f()
], b.prototype, "searchPin", 2);
v([
  f()
], b.prototype, "myPos", 2);
v([
  f()
], b.prototype, "locating", 2);
v([
  f()
], b.prototype, "toastUndo", 2);
v([
  f()
], b.prototype, "layersOpen", 2);
v([
  f()
], b.prototype, "page", 2);
v([
  f()
], b.prototype, "wetOn", 2);
v([
  f()
], b.prototype, "soilOn", 2);
v([
  f()
], b.prototype, "menuOpen", 2);
v([
  f()
], b.prototype, "pendingImport", 2);
v([
  f()
], b.prototype, "hover", 2);
b = v([
  nt("irrigation-planner-panel")
], b);
function $(e) {
  return Math.round(e * 100) / 100;
}
function Je(e) {
  return Math.round(e / 5) * 5 % 360;
}
function oe(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? at(e.radius_m, e.arc_deg) : null : e.type === "hose" ? e.polygon.length >= 2 && e.radius_m ? rt(e.polygon, e.radius_m) : null : e.polygon.length >= 3 ? Te(e.polygon) : null;
}
function V(e) {
  return e < 1 ? `${Math.round(e * 100)} cm` : `${e.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m`;
}
function M(e) {
  return e == null ? "–" : `${e.toLocaleString("de-DE", { maximumFractionDigits: e < 10 ? 1 : 0 })} m²`;
}
function we(e) {
  if (e < 60) return `${e} s`;
  const t = Math.round(e / 60);
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
function pt(e) {
  const t = 10 ** Math.floor(Math.log10(e));
  for (const s of [1, 2, 5, 10]) if (s * t >= e) return s * t;
  return 10 * t;
}
function ds(e) {
  const t = pt(110 / e), s = t >= 1e3 ? `${t / 1e3} km` : t >= 1 ? `${t} m` : `${t * 100} cm`;
  return { px: t * e, label: s };
}
function hs(e) {
  return { very_low: 0.45, low: 0.7, medium: 0.95, high: 1.08 }[e] ?? 9;
}
export {
  b as IrrigationPlannerPanel
};
