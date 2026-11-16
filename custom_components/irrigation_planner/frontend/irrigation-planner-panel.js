/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const J = globalThis, re = J.ShadowRoot && (J.ShadyCSS === void 0 || J.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ae = Symbol(), me = /* @__PURE__ */ new WeakMap();
let Ce = class {
  constructor(t, s, i) {
    if (this._$cssResult$ = !0, i !== ae) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = s;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (re && t === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (t = me.get(s)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && me.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Ke = (e) => new Ce(typeof e == "string" ? e : e + "", void 0, ae), Ge = (e, ...t) => {
  const s = e.length === 1 ? e[0] : t.reduce((i, n, r) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + e[r + 1], e[0]);
  return new Ce(s, e, ae);
}, We = (e, t) => {
  if (re) e.adoptedStyleSheets = t.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of t) {
    const i = document.createElement("style"), n = J.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = s.cssText, e.appendChild(i);
  }
}, fe = re ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let s = "";
  for (const i of t.cssRules) s += i.cssText;
  return Ke(s);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: qe, defineProperty: Je, getOwnPropertyDescriptor: Xe, getOwnPropertyNames: Ye, getOwnPropertySymbols: Qe, getPrototypeOf: et } = Object, Q = globalThis, be = Q.trustedTypes, tt = be ? be.emptyScript : "", st = Q.reactiveElementPolyfillSupport, L = (e, t) => e, X = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? tt : null;
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
} }, oe = (e, t) => !qe(e, t), $e = { attribute: !0, type: String, converter: X, reflect: !1, useDefault: !1, hasChanged: oe };
Symbol.metadata ??= Symbol("metadata"), Q.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let R = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, s = $e) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(t, i, s);
      n !== void 0 && Je(this.prototype, t, n);
    }
  }
  static getPropertyDescriptor(t, s, i) {
    const { get: n, set: r } = Xe(this.prototype, t) ?? { get() {
      return this[s];
    }, set(a) {
      this[s] = a;
    } };
    return { get: n, set(a) {
      const o = n?.call(this);
      r?.call(this, a), this.requestUpdate(t, o, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? $e;
  }
  static _$Ei() {
    if (this.hasOwnProperty(L("elementProperties"))) return;
    const t = et(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(L("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(L("properties"))) {
      const s = this.properties, i = [...Ye(s), ...Qe(s)];
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
      for (const n of i) s.unshift(fe(n));
    } else t !== void 0 && s.push(fe(t));
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
    return We(t, this.constructor.elementStyles), t;
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
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : X).toAttribute(s, i.type);
      this._$Em = t, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
    }
  }
  _$AK(t, s) {
    const i = this.constructor, n = i._$Eh.get(t);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : X;
      this._$Em = n;
      const o = a.fromAttribute(s, r.type);
      this[n] = o ?? this._$Ej?.get(n) ?? o, this._$Em = null;
    }
  }
  requestUpdate(t, s, i, n = !1, r) {
    if (t !== void 0) {
      const a = this.constructor;
      if (n === !1 && (r = this[t]), i ??= a.getPropertyOptions(t), !((i.hasChanged ?? oe)(r, s) || i.useDefault && i.reflect && r === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, i)))) return;
      this.C(t, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, s, { useDefault: i, reflect: n, wrapped: r }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? s ?? this[t]), r !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), n === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        const { wrapped: a } = r, o = this[n];
        a !== !0 || this._$AL.has(n) || o === void 0 || this.C(n, void 0, r, o);
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
R.elementStyles = [], R.shadowRootOptions = { mode: "open" }, R[L("elementProperties")] = /* @__PURE__ */ new Map(), R[L("finalized")] = /* @__PURE__ */ new Map(), st?.({ ReactiveElement: R }), (Q.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const le = globalThis, ye = (e) => e, Y = le.trustedTypes, ve = Y ? Y.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, De = "$lit$", M = `lit$${Math.random().toFixed(9).slice(2)}$`, Re = "?" + M, it = `<${Re}>`, O = document, V = () => O.createComment(""), K = (e) => e === null || typeof e != "object" && typeof e != "function", ce = Array.isArray, nt = (e) => ce(e) || typeof e?.[Symbol.iterator] == "function", se = `[ 	
\f\r]`, j = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, xe = /-->/g, ke = />/g, E = RegExp(`>|${se}(?:([^\\s"'>=/]+)(${se}*=${se}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), we = /'/g, _e = /"/g, Be = /^(?:script|style|textarea|title)$/i, He = (e) => (t, ...s) => ({ _$litType$: e, strings: t, values: s }), h = He(1), u = He(2), B = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), Se = /* @__PURE__ */ new WeakMap(), T = O.createTreeWalker(O, 129);
function Ne(e, t) {
  if (!ce(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ve !== void 0 ? ve.createHTML(t) : t;
}
const rt = (e, t) => {
  const s = e.length - 1, i = [];
  let n, r = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = j;
  for (let o = 0; o < s; o++) {
    const l = e[o];
    let d, p, g = -1, y = 0;
    for (; y < l.length && (a.lastIndex = y, p = a.exec(l), p !== null); ) y = a.lastIndex, a === j ? p[1] === "!--" ? a = xe : p[1] !== void 0 ? a = ke : p[2] !== void 0 ? (Be.test(p[2]) && (n = RegExp("</" + p[2], "g")), a = E) : p[3] !== void 0 && (a = E) : a === E ? p[0] === ">" ? (a = n ?? j, g = -1) : p[1] === void 0 ? g = -2 : (g = a.lastIndex - p[2].length, d = p[1], a = p[3] === void 0 ? E : p[3] === '"' ? _e : we) : a === _e || a === we ? a = E : a === xe || a === ke ? a = j : (a = E, n = void 0);
    const v = a === E && e[o + 1].startsWith("/>") ? " " : "";
    r += a === j ? l + it : g >= 0 ? (i.push(d), l.slice(0, g) + De + l.slice(g) + M + v) : l + M + (g === -2 ? o : v);
  }
  return [Ne(e, r + (e[s] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class G {
  constructor({ strings: t, _$litType$: s }, i) {
    let n;
    this.parts = [];
    let r = 0, a = 0;
    const o = t.length - 1, l = this.parts, [d, p] = rt(t, s);
    if (this.el = G.createElement(d, i), T.currentNode = this.el.content, s === 2 || s === 3) {
      const g = this.el.content.firstChild;
      g.replaceWith(...g.childNodes);
    }
    for (; (n = T.nextNode()) !== null && l.length < o; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const g of n.getAttributeNames()) if (g.endsWith(De)) {
          const y = p[a++], v = n.getAttribute(g).split(M), k = /([.?@])?(.*)/.exec(y);
          l.push({ type: 1, index: r, name: k[2], strings: v, ctor: k[1] === "." ? ot : k[1] === "?" ? lt : k[1] === "@" ? ct : ee }), n.removeAttribute(g);
        } else g.startsWith(M) && (l.push({ type: 6, index: r }), n.removeAttribute(g));
        if (Be.test(n.tagName)) {
          const g = n.textContent.split(M), y = g.length - 1;
          if (y > 0) {
            n.textContent = Y ? Y.emptyScript : "";
            for (let v = 0; v < y; v++) n.append(g[v], V()), T.nextNode(), l.push({ type: 2, index: ++r });
            n.append(g[y], V());
          }
        }
      } else if (n.nodeType === 8) if (n.data === Re) l.push({ type: 2, index: r });
      else {
        let g = -1;
        for (; (g = n.data.indexOf(M, g + 1)) !== -1; ) l.push({ type: 7, index: r }), g += M.length - 1;
      }
      r++;
    }
  }
  static createElement(t, s) {
    const i = O.createElement("template");
    return i.innerHTML = t, i;
  }
}
function H(e, t, s = e, i) {
  if (t === B) return t;
  let n = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const r = K(t) ? void 0 : t._$litDirective$;
  return n?.constructor !== r && (n?._$AO?.(!1), r === void 0 ? n = void 0 : (n = new r(e), n._$AT(e, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = n : s._$Cl = n), n !== void 0 && (t = H(e, n._$AS(e, t.values), n, i)), t;
}
class at {
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
    const { el: { content: s }, parts: i } = this._$AD, n = (t?.creationScope ?? O).importNode(s, !0);
    T.currentNode = n;
    let r = T.nextNode(), a = 0, o = 0, l = i[0];
    for (; l !== void 0; ) {
      if (a === l.index) {
        let d;
        l.type === 2 ? d = new W(r, r.nextSibling, this, t) : l.type === 1 ? d = new l.ctor(r, l.name, l.strings, this, t) : l.type === 6 && (d = new ht(r, this, t)), this._$AV.push(d), l = i[++o];
      }
      a !== l?.index && (r = T.nextNode(), a++);
    }
    return T.currentNode = O, n;
  }
  p(t) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, s), s += i.strings.length - 2) : i._$AI(t[s])), s++;
  }
}
class W {
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
    t = H(this, t, s), K(t) ? t === c || t == null || t === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : t !== this._$AH && t !== B && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : nt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== c && K(this._$AH) ? this._$AA.nextSibling.data = t : this.T(O.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: s, _$litType$: i } = t, n = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = G.createElement(Ne(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(s);
    else {
      const r = new at(n, this), a = r.u(this.options);
      r.p(s), this.T(a), this._$AH = r;
    }
  }
  _$AC(t) {
    let s = Se.get(t.strings);
    return s === void 0 && Se.set(t.strings, s = new G(t)), s;
  }
  k(t) {
    ce(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, n = 0;
    for (const r of t) n === s.length ? s.push(i = new W(this.O(V()), this.O(V()), this, this.options)) : i = s[n], i._$AI(r), n++;
    n < s.length && (this._$AR(i && i._$AB.nextSibling, n), s.length = n);
  }
  _$AR(t = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); t !== this._$AB; ) {
      const i = ye(t).nextSibling;
      ye(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class ee {
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
    let a = !1;
    if (r === void 0) t = H(this, t, s, 0), a = !K(t) || t !== this._$AH && t !== B, a && (this._$AH = t);
    else {
      const o = t;
      let l, d;
      for (t = r[0], l = 0; l < r.length - 1; l++) d = H(this, o[i + l], s, l), d === B && (d = this._$AH[l]), a ||= !K(d) || d !== this._$AH[l], d === c ? t = c : t !== c && (t += (d ?? "") + r[l + 1]), this._$AH[l] = d;
    }
    a && !n && this.j(t);
  }
  j(t) {
    t === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class ot extends ee {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === c ? void 0 : t;
  }
}
class lt extends ee {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== c);
  }
}
class ct extends ee {
  constructor(t, s, i, n, r) {
    super(t, s, i, n, r), this.type = 5;
  }
  _$AI(t, s = this) {
    if ((t = H(this, t, s, 0) ?? c) === B) return;
    const i = this._$AH, n = t === c && i !== c || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, r = t !== c && (i === c || n);
    n && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class ht {
  constructor(t, s, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    H(this, t);
  }
}
const dt = le.litHtmlPolyfillSupport;
dt?.(G, W), (le.litHtmlVersions ??= []).push("3.3.3");
const pt = (e, t, s) => {
  const i = s?.renderBefore ?? t;
  let n = i._$litPart$;
  if (n === void 0) {
    const r = s?.renderBefore ?? null;
    i._$litPart$ = n = new W(t.insertBefore(V(), r), r, void 0, s ?? {});
  }
  return n._$AI(e), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const he = globalThis;
class F extends R {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = pt(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return B;
  }
}
F._$litElement$ = !0, F.finalized = !0, he.litElementHydrateSupport?.({ LitElement: F });
const ut = he.litElementPolyfillSupport;
ut?.({ LitElement: F });
(he.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const gt = (e) => (t, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const mt = { attribute: !0, type: String, converter: X, reflect: !1, hasChanged: oe }, ft = (e = mt, t, s) => {
  const { kind: i, metadata: n } = s;
  let r = globalThis.litPropertyMetadata.get(n);
  if (r === void 0 && globalThis.litPropertyMetadata.set(n, r = /* @__PURE__ */ new Map()), i === "setter" && ((e = Object.create(e)).wrapped = !0), r.set(s.name, e), i === "accessor") {
    const { name: a } = s;
    return { set(o) {
      const l = t.get.call(this);
      t.set.call(this, o), this.requestUpdate(a, l, e, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(a, void 0, e, o), o;
    } };
  }
  if (i === "setter") {
    const { name: a } = s;
    return function(o) {
      const l = this[a];
      t.call(this, o), this.requestUpdate(a, l, e, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function je(e) {
  return (t, s) => typeof s == "object" ? ft(e, t, s) : ((i, n, r) => {
    const a = n.hasOwnProperty(r);
    return n.constructor.createProperty(r, i), a ? Object.getOwnPropertyDescriptor(n, r) : void 0;
  })(e, t, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function $(e) {
  return je({ ...e, state: !0, attribute: !1 });
}
const S = 6378137, Ue = 256, U = Math.PI * S;
function bt(e, t) {
  const s = Math.max(0, Math.min(360, t));
  return Math.PI * e * e * s / 360;
}
function Le(e) {
  if (e.length < 3) return 0;
  let t = 0;
  for (let s = 0; s < e.length; s++) {
    const [i, n] = e[s], [r, a] = e[(s + 1) % e.length];
    t += i * a - r * n;
  }
  return Math.abs(t) / 2;
}
function w(e, t, s) {
  const i = s * Math.PI / 180;
  return [e[0] + Math.sin(i) * t, e[1] - Math.cos(i) * t];
}
function Ae(e, t) {
  return (Math.atan2(t[0] - e[0], -(t[1] - e[1])) * 180 / Math.PI + 360) % 360;
}
function x(e, t) {
  return Math.hypot(e[0] - t[0], e[1] - t[1]);
}
function $t(e, t, s, i) {
  const [n, r] = e;
  if (i >= 360)
    return `M ${n - t} ${r} a ${t} ${t} 0 1 0 ${2 * t} 0 a ${t} ${t} 0 1 0 ${-2 * t} 0 Z`;
  const [a, o] = w(e, t, s), [l, d] = w(e, t, s + i), p = i > 180 ? 1 : 0;
  return `M ${n} ${r} L ${a} ${o} A ${t} ${t} 0 ${p} 1 ${l} ${d} Z`;
}
function ie(e) {
  const t = e.length || 1;
  return [e.reduce((s, i) => s + i[0], 0) / t, e.reduce((s, i) => s + i[1], 0) / t];
}
function Pe(e, t) {
  return 2 * Math.PI * S * Math.cos(e * Math.PI / 180) / (Ue * 2 ** t);
}
function Me(e, t) {
  return Math.log2(
    2 * Math.PI * S * Math.cos(e * Math.PI / 180) * t / Ue
  );
}
function yt(e, t, s) {
  const [i, n] = s, r = Math.PI / 180;
  return [
    (t - n) * r * S * Math.cos(i * r),
    -(e - i) * r * S
  ];
}
function vt(e, t) {
  const [s, i] = t, n = 180 / Math.PI;
  return [
    s - e[1] / S * n,
    i + e[0] / (S * Math.cos(s / n)) * n
  ];
}
function Ee(e, t, s, i, n = 200) {
  const [r, a] = t, o = Math.PI / 180, l = 1 / Math.cos(r * o), d = S * a * o, p = S * Math.log(Math.tan(Math.PI / 4 + r * o / 2)), g = 2 ** i, y = 2 * U / g, v = (_) => (d + _ * l + U) / y, k = (_) => (U - (p - _ * l)) / y, de = Math.max(0, Math.floor(v(s.x0))), pe = Math.min(g - 1, Math.floor(v(s.x1))), ue = Math.max(0, Math.floor(k(s.y0))), ge = Math.min(g - 1, Math.floor(k(s.y1))), te = [];
  if ((pe - de + 1) * (ge - ue + 1) > n) return te;
  for (let _ = ue; _ <= ge; _++)
    for (let N = de; N <= pe; N++) {
      const Ze = N * y - U, Ve = U - _ * y;
      te.push({
        url: e.replace("{z}", String(i)).replace("{x}", String(N)).replace("{y}", String(_)),
        key: `${i}/${N}/${_}`,
        x: (Ze - d) / l,
        y: (p - Ve) / l,
        size: y / l
      });
    }
  return te;
}
function xt(e, t, s) {
  let i = null, n = s;
  for (const r of t) {
    const a = x(e, r);
    a <= n && (i = r, n = a);
  }
  return i;
}
function Z(e, t = !1) {
  let s = 0;
  for (let i = 1; i < e.length; i++) s += x(e[i - 1], e[i]);
  return t && e.length > 2 && (s += x(e[e.length - 1], e[0])), s;
}
function kt(e, t) {
  const s = t ? e.length : e.length - 1, i = [];
  for (let n = 0; n < s; n++) i.push(x(e[n], e[(n + 1) % e.length]));
  return i;
}
function wt(e, t, s) {
  const i = (t + 1) % e.length, n = e[t], r = e[i], a = x(n, r);
  if (!(s > 0) || a === 0) return e;
  const o = s / a, l = [n[0] + (r[0] - n[0]) * o, n[1] + (r[1] - n[1]) * o];
  return e.map((d, p) => p === i ? l : d);
}
function _t(e, t) {
  return e.length < 2 || t <= 0 ? 0 : Z(e) * 2 * t + Math.PI * t * t;
}
function St(e, t) {
  let s = Z(e) * Math.max(0, Math.min(1, t));
  for (let i = 1; i < e.length; i++) {
    const n = x(e[i - 1], e[i]);
    if (s <= n && n > 0) {
      const r = s / n;
      return [
        e[i - 1][0] + (e[i][0] - e[i - 1][0]) * r,
        e[i - 1][1] + (e[i][1] - e[i - 1][1]) * r
      ];
    }
    s -= n;
  }
  return e[e.length - 1];
}
const P = {
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
}, At = 60;
function z(e) {
  return P[e]?.family ?? "area";
}
function I(e) {
  return e.kind === "label" && e.label ? e.label : e.label || P[e.kind]?.label || e.kind;
}
function Pt(e) {
  const t = new Set(e.map((i) => i.id));
  let s = e.length + 1;
  for (; t.has(`f${s}`); ) s++;
  return `f${s}`;
}
const Mt = "Suche: © OpenStreetMap-Mitwirkende";
async function Et(e, t, s = "de") {
  if (t.trim().length < 3) throw new Error("Bitte mindestens 3 Zeichen eingeben");
  return (await e({
    type: "irrigation_planner/geocode",
    query: t.trim(),
    language: s
  })).places ?? [];
}
const zt = Ge`
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
var Tt = Object.defineProperty, Ot = Object.getOwnPropertyDescriptor, b = (e, t, s, i) => {
  for (var n = i > 1 ? void 0 : i ? Ot(t, s) : t, r = e.length - 1, a; r >= 0; r--)
    (a = e[r]) && (n = (i ? a(t, s, n) : a(n)) || n);
  return i && n && Tt(t, s, n), n;
};
const A = "irrigation_planner", ze = [
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
], Te = {
  soil_moisture: "B",
  rain_mm: "R",
  rain_binary: "R",
  water_meter: "W"
}, It = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge",
  rain_binary: "Regensensor",
  water_meter: "Wasserzähler"
}, ne = {
  idle: "",
  running: "läuft",
  queued: "wartet",
  locked: "gesperrt"
}, Ct = 0.05, Dt = 10;
let f = class extends F {
  constructor() {
    super(...arguments), this.narrow = !1, this.error = "", this.toast = "", this.tab = "zones", this.featureKind = "building", this.measurePts = [], this.snapOn = !0, this.snapHint = null, this.tool = "select", this.toolTarget = "", this.selected = null, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.view = { cx: 0, cy: 0, scale: 25 }, this.size = { w: 800, h: 600 }, this.imageUrl = "", this.imageSize = null, this.saving = !1, this.dirty = !1, this.searchOpen = !1, this.searchQuery = "", this.searchResults = null, this.searching = !1, this.searchError = "", this.searchPin = null, this.savedJson = "", this.history = [], this.drag = null, this.toastUndo = !1, this.layersOpen = !1, this.menuOpen = !1, this.pendingImport = null, this.autoFit = !0, this.loadedImage = "", this.onWheel = (e) => {
      e.preventDefault();
      const s = e.currentTarget.getBoundingClientRect(), i = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 15e-4));
      this.zoomBy(i, this.toPlan(e), [e.clientX - s.left, e.clientY - s.top]);
    }, this.onKey = (e) => {
      const t = e.composedPath()[0];
      t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName) || (e.key === "Escape" && this.cancelTool(), e.key === "Enter" && this.tool === "bed" && this.finishBed(), e.key === "Enter" && this.tool === "feature" && this.finishFeature(), e.key === "Enter" && this.tool === "hose" && this.finishHose(), (e.ctrlKey || e.metaKey) && e.key === "z" && (e.preventDefault(), this.undo()), e.key === "Delete" && this.selected?.kind === "zone" && this.clearGeometry(this.selected.id), e.key === "Delete" && this.selected?.kind === "feature" && this.deleteFeature(this.selected.id));
    }, this.onPointerDown = (e) => {
      if (e.button !== 0) return;
      const t = e.currentTarget, s = this.toPlan(e);
      if (this.tool === "feature") {
        const i = this.featureKind, n = this.snap(s, e), r = z(i);
        if (r === "point") {
          const o = [m(n[0]), m(n[1])];
          if (i === "tree") {
            const l = this.addFeature({ kind: i, points: [o], radius_m: 0 });
            this.drag = { type: "new-tree", id: l.id }, t.setPointerCapture(e.pointerId);
          } else
            this.addFeature({ kind: i, points: [o], label: i === "label" ? "Beschriftung" : null }), this.cancelTool(), i === "label" && this.updateComplete.then(
              () => this.renderRoot.querySelector("#feature-label")?.select()
            );
          return;
        }
        const a = (o) => x(n, o) * this.view.scale < 12;
        r === "area" && this.draft.length >= 3 && a(this.draft[0]) ? this.finishFeature() : r === "line" && this.draft.length >= 2 && a(this.draft[this.draft.length - 1]) ? this.finishFeature() : this.draft = [...this.draft, n];
        return;
      }
      if (this.tool === "measure") {
        this.measurePts = [...this.measurePts, this.snap(s, e)];
        return;
      }
      if (this.tool === "hose") {
        const i = this.snap(s, e), n = this.draft[this.draft.length - 1];
        this.draft.length >= 2 && x(i, n) * this.view.scale < 12 ? this.finishHose() : this.draft = [...this.draft, i];
        return;
      }
      if (this.tool === "sprinkler") {
        this.remember();
        const i = this.zone(this.toolTarget), n = this.snap(s, e);
        s[0] = n[0], s[1] = n[1], i.center = [m(s[0]), m(s[1])], i.radius_m = 0, this.drag = { type: "new-sprinkler", id: i.id }, t.setPointerCapture(e.pointerId), this.changed();
        return;
      }
      if (this.tool === "bed") {
        const i = this.snap(s, e);
        this.draft.length >= 3 && x(i, this.draft[0]) * this.view.scale < 12 ? this.finishBed() : this.draft = [...this.draft, i];
        return;
      }
      if (this.tool === "place") {
        const [i, n] = this.toolTarget.split(":");
        this.remember();
        const r = this.marker(i, n);
        r.position = [m(s[0]), m(s[1])], this.selected = { kind: i, id: n }, this.changed(), this.cancelTool();
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
        ["bed", "hose", "feature", "measure", "sprinkler"].includes(this.tool) && (this.hover = this.snap(this.toPlan(e), e));
        return;
      }
      const s = this.toPlan(e);
      if (t.type.startsWith("f-") || t.type === "new-tree") {
        this.moveFeature(t, s, e);
        return;
      }
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
        this.marker(t.kind, t.id).position = [m(s[0]), m(s[1])], this.changed();
        return;
      }
      const i = this.zone(t.id);
      switch (t.type) {
        case "new-sprinkler":
        case "radius":
          i.radius_m = m(Math.max(0.1, x(i.center, s)));
          break;
        case "center":
          i.center = [m(s[0]), m(s[1])];
          break;
        case "start": {
          const n = i.start_angle_deg + i.arc_deg, r = Oe(Ae(i.center, s));
          let a = ((n - r) % 360 + 360) % 360;
          a < 5 && (a = 360), i.start_angle_deg = r, i.arc_deg = a;
          break;
        }
        case "end": {
          let r = ((Oe(Ae(i.center, s)) - i.start_angle_deg) % 360 + 360) % 360;
          r < 5 && (r = 360), i.arc_deg = r;
          break;
        }
        case "vertex": {
          const n = this.snap(s, e, i.polygon[t.index]);
          i.polygon[t.index] = [m(n[0]), m(n[1])];
          break;
        }
        case "move-zone": {
          const n = s[0] - t.start[0], r = s[1] - t.start[1];
          i.type === "sprinkler" && t.orig.center ? i.center = [m(t.orig.center[0] + n), m(t.orig.center[1] + r)] : i.polygon = t.orig.polygon.map((a) => [m(a[0] + n), m(a[1] + r)]);
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
    const { width: t, height: s } = e.getBoundingClientRect();
    t && s && (t !== this.size.w || s !== this.size.h) && (this.size = { w: t, h: s }, this.autoFit && this.plan && this.fitView());
  }
  // Daten ----------------------------------------------------------------------
  async load() {
    try {
      const e = await this._hass.callWS({ type: `${A}/plan/get` });
      this.setPlan(e, !0), await this.subscribe();
    } catch (e) {
      this.error = this.message(e);
    }
  }
  async subscribe() {
    this.unsub || !this._hass || (this.unsub = await this._hass.connection.subscribeMessage(
      (e) => this.status = e,
      { type: `${A}/plan/subscribe` }
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
    t.background === "map" && t.latitude != null && (t.map_zoom = Math.round(Me(t.latitude, this.view.scale) * 100) / 100), this.saving = !0;
    try {
      const s = await this._hass.callWS({
        type: `${A}/plan/save`,
        garden: t,
        zones: e.zones.map((i) => ({
          id: i.id,
          center: i.center,
          radius_m: i.radius_m,
          start_angle_deg: i.start_angle_deg,
          arc_deg: i.arc_deg,
          polygon: i.polygon,
          valve_id: i.valve_id
        })),
        valves: e.valves.map((i) => ({ id: i.id, position: i.position })),
        sensors: e.sensors.map((i) => ({ id: i.id, position: i.position }))
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
        const t = await this._hass.fetchWithAuth(`/api/${A}/image/${e}`);
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
      const n = await this._hass.fetchWithAuth(`/api/${A}/image`, {
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
      const t = x(e.scale_points[0], e.scale_points[1]);
      if (t > 0) return e.scale_distance_m / t;
    }
    return Ct;
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
    const t = this.plan?.garden;
    for (const n of t?.features ?? [])
      if (e.push(...n.points), n.kind === "tree" && n.radius_m) {
        const [r, a] = n.points[0];
        e.push([r - n.radius_m, a - n.radius_m], [r + n.radius_m, a + n.radius_m]);
      }
    if (t?.background === "image" && this.imageSize) {
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
      this.view = { cx: 0, cy: 0, scale: 1 / Pe(e.latitude, d) };
      return;
    }
    if (!t) {
      this.view = { cx: 0, cy: 0, scale: 25 };
      return;
    }
    const [s, i, n, r] = t, a = Math.max(n - s, 4), o = Math.max(r - i, 4), l = Math.min(this.size.w / (a * 1.15), this.size.h / (o * 1.15), 200);
    this.view = { cx: (s + n) / 2, cy: (i + r) / 2, scale: Math.max(l, 0.5) };
  }
  zoomBy(e, t, s) {
    this.autoFit = !1;
    const { cx: i, cy: n, scale: r } = this.view, a = Math.min(Math.max(r * e, 0.5), 400);
    if (!t || !s) {
      this.view = { cx: i, cy: n, scale: a };
      return;
    }
    this.view = {
      cx: t[0] - (s[0] - this.size.w / 2) / a,
      cy: t[1] - (s[1] - this.size.h / 2) / a,
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
    const i = xt(e, this.snapCandidates(s), Dt / this.view.scale);
    return this.snapHint = i, i ? [i[0], i[1]] : e;
  }
  finishFeature() {
    const e = this.featureKind, t = z(e) === "area" ? 3 : 2;
    if (this.draft.length < t) {
      this.showToast(`${P[e].label}: mindestens ${t} Punkte`, !0);
      return;
    }
    this.addFeature({ kind: e, points: this.draft.map((s) => [m(s[0]), m(s[1])]) }), this.cancelTool();
  }
  addFeature(e) {
    this.remember();
    const t = {
      id: Pt(this.features),
      radius_m: null,
      label: null,
      ...e
    };
    return this.features.push(t), this.selected = { kind: "feature", id: t.id }, this.tab = "plan", this.changed(), t;
  }
  deleteFeature(e) {
    const t = this.feature(e);
    this.remember(), this.plan.garden.features = this.features.filter((s) => s.id !== e), this.selected?.kind === "feature" && this.selected.id === e && (this.selected = null), this.changed(), this.removed(`${I(t)} entfernt`);
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
    this.remember(), this.zone(this.toolTarget).polygon = this.draft.map((e) => [m(e[0]), m(e[1])]), this.selected = { kind: "zone", id: this.toolTarget }, this.changed(), this.cancelTool();
  }
  finishHose() {
    if (this.draft.length < 2) {
      this.showToast("Ein Schlauch braucht mindestens 2 Punkte", !0);
      return;
    }
    this.remember();
    const e = this.zone(this.toolTarget);
    e.polygon = this.draft.map((t) => [m(t[0]), m(t[1])]), e.center = null, (!e.radius_m || e.radius_m > 3) && (e.radius_m = 0.3), this.selected = { kind: "zone", id: e.id }, this.changed(), this.cancelTool();
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
    const i = this.feature(e.id);
    if (i) {
      switch (e.type) {
        case "new-tree":
        case "f-radius":
          i.radius_m = m(Math.max(0.1, x(i.points[0], t)));
          break;
        case "f-vertex": {
          const n = this.snap(t, s, i.points[e.index]);
          i.points[e.index] = [m(n[0]), m(n[1])];
          break;
        }
        case "f-move": {
          const n = t[0] - e.start[0], r = t[1] - e.start[1];
          i.points = e.orig.points.map((a) => [m(a[0] + n), m(a[1] + r)]);
          break;
        }
      }
      this.changed();
    }
  }
  insertVertex(e, t, s) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const i = t.polygon[s], n = t.polygon[(s + 1) % t.polygon.length];
    t.polygon.splice(s + 1, 0, [m((i[0] + n[0]) / 2), m((i[1] + n[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "vertex", id: t.id, index: s + 1 };
  }
  removeVertex(e, t, s) {
    e.preventDefault(), e.stopPropagation();
    const i = t.type === "hose" ? 2 : 3;
    if (t.polygon.length <= i) {
      this.showToast(`Mindestens ${i} Punkte`, !0);
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
    this.remember(), [e.latitude, e.longitude] = vt([t, s], [e.latitude, e.longitude]).map(
      (n) => Math.round(n * 1e7) / 1e7
    );
    const i = (n) => [m(n[0] - t), m(n[1] - s)];
    for (const n of this.plan.zones)
      n.center && (n.center = i(n.center)), n.polygon = n.polygon.map(i);
    for (const n of [...this.plan.valves, ...this.plan.sensors])
      n.position && (n.position = i(n.position));
    for (const n of this.features) n.points = n.points.map(i);
    this.view = { ...this.view, cx: 0, cy: 0 }, this.searchPin && (this.searchPin = { ...this.searchPin, point: i(this.searchPin.point) }), this.changed(), this.showToast("Kartenmitte gesetzt");
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
        this.searchResults = await Et(
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
    const t = this.plan.garden, s = 1 / Pe(e.latitude, 20.5);
    if (this.autoFit = !1, !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((n) => n.position) || t.latitude == null || t.longitude == null)
      this.remember(), t.latitude = Math.round(e.latitude * 1e7) / 1e7, t.longitude = Math.round(e.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: s }, this.searchPin = { point: [0, 0], name: e.name }, this.changed(), this.showToast(`${e.name}: Kartenmitte gesetzt. Fein ausrichten mit „Mitte hier festlegen“.`);
    else {
      const n = yt(e.latitude, e.longitude, [t.latitude, t.longitude]);
      this.view = { cx: n[0], cy: n[1], scale: s }, this.searchPin = { point: n, name: e.name }, this.showToast(`${e.name} angezeigt. „Mitte hier festlegen“ übernimmt die Stelle.`);
    }
    this.searchResults = null;
  }
  renderSearch() {
    return !this.searchOpen || this.tool !== "select" || this.plan.garden.background !== "map" ? c : h`
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
        ${this.searchError ? h`<p class="search-error">${this.searchError}</p>` : c}
        ${this.searchResults?.length ? h`<ul class="results">
              ${this.searchResults.map(
      (e) => h`<li>
                  <button type="button" @click=${() => this.goToPlace(e)}>
                    <ha-icon icon="mdi:map-marker"></ha-icon>
                    <span><strong>${e.name}</strong><small>${e.detail}</small></span>
                  </button>
                </li>`
    )}
            </ul>` : c}
        <p class="search-note">${Mt}. Die Adresse geht nur an die Suche und wird nicht gespeichert.</p>
      </div>
    `;
  }
  /** Umschalter für die Kartenansicht (Luftbild, Karte, …) direkt auf dem Plan. */
  renderLayers() {
    const e = this.plan.garden;
    if (!this.layersOpen || e.background !== "map") return c;
    const t = Object.entries(this.plan.providers).map(
      ([s, i]) => [s, i.short ?? i.name, i.kind === "map" ? "mdi:map-outline" : "mdi:satellite-variant"]
    );
    return e.map_url && t.push(["custom", "Eigene Adresse", "mdi:web"]), h`
      <div class="layers" role="menu" @pointerdown=${(s) => s.stopPropagation()}>
        ${t.map(
      ([s, i, n]) => h`<button
            role="menuitemradio"
            aria-checked=${e.map_provider === s ? "true" : "false"}
            class=${e.map_provider === s ? "active" : ""}
            @click=${() => {
        e.map_provider !== s && this.updateGarden({ map_provider: s }), this.layersOpen = !1;
      }}
          >
            <ha-icon icon=${n}></ha-icon>${i}
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
    if (x(this.scaleDraft[0], this.scaleDraft[1]) < 2) {
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
      await this._hass.callService(A, "run_zone", { zone_id: e.id, duration: t }), this.showToast(`${e.name}: ${Ie(t)} eingereiht`);
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
      ${this.toast ? h`<div class="toast" role="status">
            <span>${this.toast}</span>
            ${this.toastUndo ? h`<button
                  class="text"
                  @click=${() => {
      this.undo(), this.toast = "", this.toastUndo = !1;
    }}
                >
                  Rückgängig
                </button>` : c}
          </div>` : c}
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
                    </div>` : c}
              </div>
            ` : c}
      </header>
      ${this.renderImportDialog()}
    `;
  }
  // Sichern und Wiederherstellen -------------------------------------------------
  async exportPlan() {
    this.menuOpen = !1;
    try {
      const e = await this._hass.callWS({ type: `${A}/export` }), t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), s = URL.createObjectURL(t), i = document.createElement("a");
      i.href = s, i.download = `bewaesserung-sicherung-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, i.style.display = "none", document.body.appendChild(i), i.click(), i.remove(), setTimeout(() => URL.revokeObjectURL(s), 1e3), this.showToast(
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
        const i = JSON.parse(await s.text());
        this.pendingImport = { name: s.name, data: i };
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
          type: `${A}/import`,
          mode: e,
          data: t.data
        }), i = s.notes.length ? ` ${s.notes.join(" ")}` : "";
        s.reloaded ? (this.showToast(`Sicherung eingespielt, wird neu geladen …${i}`), this.unsub?.(), this.unsub = void 0, setTimeout(() => void this.load(), 4e3)) : (this.showToast(`Zeichnung übernommen.${i}`), await this.load());
      } catch (s) {
        this.showToast(`Nicht eingespielt: ${this.message(s)}`, !0);
      }
    }
  }
  renderImportDialog() {
    if (!this.pendingImport) return c;
    const e = this.pendingImport.data?.exported_at;
    return h`
      <div class="dialog-backdrop" @click=${() => this.pendingImport = null}>
        <div class="dialog" role="dialog" aria-modal="true" @click=${(t) => t.stopPropagation()}>
          <h2>Sicherung einspielen</h2>
          <p>
            <strong>${this.pendingImport.name}</strong>${e ? h`<br /><small>erstellt am ${new Date(e).toLocaleString("de-DE")}</small>` : c}
          </p>
          ${this.dirty ? h`<p class="note warn">Nicht gespeicherte Änderungen gehen dabei verloren.</p>` : c}
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
    const { w: e, h: t } = this.size, { cx: s, cy: i, scale: n } = this.view, r = `translate(${e / 2} ${t / 2}) scale(${n}) translate(${-s} ${-i})`, a = 1 / n, o = this.tool === "select" ? this.drag?.type === "pan" ? "grabbing" : "grab" : "crosshair";
    return h`
      <svg
        class="plan"
        width=${e}
        height=${t}
        style="cursor:${o}"
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @wheel=${this.onWheel}
        @dblclick=${(l) => {
      this.tool === "bed" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishBed()), this.tool === "hose" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishHose()), this.tool === "feature" && z(this.featureKind) !== "point" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishFeature());
    }}
      >
        <g transform=${r}>
          ${this.renderBackground(a)}
          <g class="features">${this.renderFeatures(a)}</g>
          ${this.plan.zones.map((l, d) => this.renderZone(l, d, a))}
          ${this.renderSelectedHandles(a)} ${this.renderFeatureHandles(a)}
          ${this.renderDraft(a)} ${this.renderScaleDraft(a)} ${this.renderMeasure(a)}
          ${this.renderValveLinks(a)}
          ${this.plan.valves.map((l) => this.renderMarker("valve", l, a))}
          ${this.plan.sensors.map((l) => this.renderMarker("sensor", l, a))}
          ${this.renderSnapHint(a)}
          ${this.searchPin && this.plan.garden.background === "map" ? u`<g class="pin" transform="translate(${this.searchPin.point[0]} ${this.searchPin.point[1]}) scale(${a})">
                <path d="M0 0 C-3 -9 -11 -13 -11 -22 A11 11 0 1 1 11 -22 C11 -13 3 -9 0 0 Z"></path>
                <circle cx="0" cy="-22" r="4"></circle>
                <title>${this.searchPin.name}</title>
              </g>` : c}
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
      const a = this.tileTemplate();
      if (a) {
        const o = this.plan.providers[t.map_provider ?? ""], l = o?.max_zoom ?? 20, d = Math.max(
          1,
          Math.min(l, Math.round(Me(t.latitude, this.view.scale * (window.devicePixelRatio > 1 ? 1.4 : 1))))
        ), p = Ee(a, [t.latitude, t.longitude], s, d);
        i.push(u`<rect x=${s.x0} y=${s.y0} width=${s.x1 - s.x0} height=${s.y1 - s.y0} class="map-fill"></rect>`);
        const g = e * 0.5, y = (v) => v.map(
          (k) => u`<image href=${k.url} x=${k.x - g} y=${k.y - g} width=${k.size + 2 * g} height=${k.size + 2 * g} preserveAspectRatio="none" crossorigin="anonymous"></image>`
        );
        i.push(...y(p)), o?.overlay && t.map_provider !== "custom" && i.push(...y(Ee(o.overlay, [t.latitude, t.longitude], s, d)));
      }
    } else if (t.background === "image" && this.imageUrl && this.imageSize) {
      const a = this.imageMpp();
      i.push(
        u`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * a} height=${this.imageSize[1] * a} preserveAspectRatio="none"></image>`
      );
    }
    const n = [u`<g class="bg" opacity=${t.background_opacity ?? 1}>${i}</g>`], r = (t.background_opacity ?? 1) < 0.35;
    return (t.background !== "map" || r) && n.push(this.renderGrid(s, e, t.background === "image" && !r)), n;
  }
  renderGrid(e, t, s) {
    const i = Fe(40 * t), n = [], r = i * 5;
    for (let a = Math.floor(e.x0 / i) * i; a <= e.x1; a += i) {
      const o = Math.abs(a / r - Math.round(a / r)) < 1e-6;
      n.push(u`<line x1=${a} y1=${e.y0} x2=${a} y2=${e.y1} class=${o ? "grid major" : "grid"}></line>`);
    }
    for (let a = Math.floor(e.y0 / i) * i; a <= e.y1; a += i) {
      const o = Math.abs(a / r - Math.round(a / r)) < 1e-6;
      n.push(u`<line x1=${e.x0} y1=${a} x2=${e.x1} y2=${a} class=${o ? "grid major" : "grid"}></line>`);
    }
    return u`<g class=${s ? "grid-layer faint" : "grid-layer"}>${n}</g>`;
  }
  tileTemplate() {
    const e = this.plan.garden;
    return e.map_provider === "custom" ? e.map_url ?? "" : this.plan.providers[e.map_provider ?? ""]?.url ?? "";
  }
  zoneColor(e) {
    return ze[e % ze.length];
  }
  renderZone(e, t, s) {
    const i = this.zoneColor(t), n = this.status?.zones[e.id]?.state ?? "idle", r = this.selected?.kind === "zone" && this.selected.id === e.id, a = `zone ${n} ${r ? "selected" : ""} ${e.enabled ? "" : "disabled"}`;
    let o, l = null;
    if (e.type === "sprinkler" && e.center && e.radius_m)
      o = u`<path d=${$t(e.center, e.radius_m, e.start_angle_deg, e.arc_deg)}></path>`, l = e.arc_deg >= 360 ? e.center : w(e.center, e.radius_m * 0.55, e.start_angle_deg + e.arc_deg / 2);
    else if (e.type === "hose" && e.polygon.length >= 2 && e.radius_m) {
      const p = e.polygon.map((g) => g.join(",")).join(" ");
      o = u`<polyline class="hose-band" points=${p} stroke-width=${2 * e.radius_m}></polyline>
        <polyline class="hose-line" points=${p}></polyline>`, l = this.zoneAnchor(e);
    } else e.type === "drip" && e.polygon.length >= 3 && (o = u`<polygon points=${e.polygon.map((p) => p.join(",")).join(" ")}></polygon>`, l = ie(e.polygon));
    if (!o) return c;
    const d = q(e);
    return u`
      <g class=${a} style="--zone:${i}"
        @pointerdown=${(p) => {
      this.tool === "select" && (this.selected = { kind: "zone", id: e.id }, this.tab = "zones", this.startDrag(p, { type: "move-zone", id: e.id, start: this.toPlan(p), orig: structuredClone(e) }));
    }}>
        ${o}
        ${l ? u`<text x=${l[0]} y=${l[1]} font-size=${13 * s} stroke-width=${3 * s} class="label">
              <tspan x=${l[0]} dy="0">${e.name}</tspan>
              <tspan x=${l[0]} dy=${15 * s} class="sub">${D(d)}${ne[n] ? ` · ${ne[n]}` : ""}</tspan>
            </text>` : c}
      </g>`;
  }
  renderSelectedHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "zone") return c;
    const t = this.zone(this.selected.id), s = 7 * e, i = (r, a, o = "", l = "") => u`<circle class="handle ${o}" cx=${r[0]} cy=${r[1]} r=${s}
        @pointerdown=${(d) => this.startDrag(d, a)}><title>${l}</title></circle>`;
    if (t.type === "sprinkler" && t.center && t.radius_m) {
      const r = t.center, a = t.arc_deg >= 360, o = a ? t.start_angle_deg + 135 : t.start_angle_deg + t.arc_deg / 2, l = [
        u`<line class="guide" x1=${r[0]} y1=${r[1]} x2=${w(r, t.radius_m, t.start_angle_deg)[0]} y2=${w(r, t.radius_m, t.start_angle_deg)[1]}></line>`,
        i(r, { type: "center", id: t.id }, "center", "Mittelpunkt verschieben"),
        i(w(r, t.radius_m, o), { type: "radius", id: t.id }, "radius", "Reichweite ändern"),
        i(w(r, t.radius_m, t.start_angle_deg), { type: "start", id: t.id }, "angle", "Anfang des Bogens")
      ];
      return a ? l.push(
        i(w(r, t.radius_m * 0.8, t.start_angle_deg + 20), { type: "end", id: t.id }, "angle small", "Bogen öffnen")
      ) : l.push(
        i(w(r, t.radius_m, t.start_angle_deg + t.arc_deg), { type: "end", id: t.id }, "angle", "Ende des Bogens")
      ), l;
    }
    const n = t.type === "hose" ? 2 : 3;
    if (t.type !== "sprinkler" && t.polygon.length >= n) {
      const r = t.polygon;
      return [
        ...(t.type === "hose" ? r.slice(0, -1) : r).map((o, l) => {
          const d = r[(l + 1) % r.length], p = [(o[0] + d[0]) / 2, (o[1] + d[1]) / 2];
          return u`<circle class="handle mid" cx=${p[0]} cy=${p[1]} r=${s * 0.7}
            @pointerdown=${(g) => this.insertVertex(g, t, l)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
        }),
        ...r.map(
          (o, l) => u`<circle class="handle" cx=${o[0]} cy=${o[1]} r=${s}
            @pointerdown=${(d) => this.startDrag(d, { type: "vertex", id: t.id, index: l })}
            @contextmenu=${(d) => this.removeVertex(d, t, l)}
            @dblclick=${(d) => this.removeVertex(d, t, l)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
        )
      ];
    }
    return c;
  }
  renderFeatures(e) {
    return this.features.map((t) => {
      const s = this.selected?.kind === "feature" && this.selected.id === t.id, i = z(t.kind), n = (l) => {
        this.tool === "select" && (this.selected = { kind: "feature", id: t.id }, this.tab = "plan", this.startDrag(l, { type: "f-move", id: t.id, start: this.toPlan(l), orig: structuredClone(t) }));
      }, r = `feature ${t.kind} ${s ? "selected" : ""}`;
      if (i === "area") {
        const l = ie(t.points);
        return u`<polygon class=${r} points=${t.points.map((d) => d.join(",")).join(" ")}
          @pointerdown=${n}><title>${I(t)}</title></polygon>
          ${t.label ? u`<text class="feature-name" x=${l[0]} y=${l[1]} dy=${4 * e} font-size=${12 * e}
                stroke-width=${3 * e}>${t.label}</text>` : c}`;
      }
      if (i === "line")
        return u`<g class=${r} @pointerdown=${n}>
          <polyline class="hit" points=${t.points.map((l) => l.join(",")).join(" ")} stroke-width=${12 * e}></polyline>
          <polyline points=${t.points.map((l) => l.join(",")).join(" ")}></polyline>
          <title>${I(t)}</title></g>`;
      const [a, o] = t.points[0];
      return t.kind === "tree" ? u`<g class=${r} @pointerdown=${n}>
          <circle cx=${a} cy=${o} r=${t.radius_m ?? 1}></circle>
          <circle class="trunk" cx=${a} cy=${o} r=${3 * e}></circle>
          <title>${I(t)}</title></g>` : t.kind === "label" ? u`<text class=${r} x=${a} y=${o} font-size=${14 * e} stroke-width=${3 * e}
          @pointerdown=${n}>${t.label}</text>` : u`<g class=${r} @pointerdown=${n}>
        <circle cx=${a} cy=${o} r=${8 * e}></circle>
        <text x=${a} y=${o} dy=${4 * e} font-size=${11 * e}>H</text>
        <title>${I(t)}</title></g>`;
    });
  }
  renderFeatureHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "feature") return c;
    const t = this.feature(this.selected.id);
    if (!t) return c;
    const s = 7 * e, i = z(t.kind);
    if (i === "point") {
      if (t.kind !== "tree") return c;
      const [o, l] = t.points[0], d = w(t.points[0], t.radius_m ?? 1, 135);
      return u`
        <circle class="handle center" cx=${o} cy=${l} r=${s}
          @pointerdown=${(p) => this.startDrag(p, { type: "f-move", id: t.id, start: this.toPlan(p), orig: structuredClone(t) })}></circle>
        <circle class="handle" cx=${d[0]} cy=${d[1]} r=${s}
          @pointerdown=${(p) => this.startDrag(p, { type: "f-radius", id: t.id })}><title>Kronengröße</title></circle>`;
    }
    const n = t.points;
    return [
      ...(i === "area" ? n : n.slice(0, -1)).map((o, l) => {
        const d = n[(l + 1) % n.length], p = [(o[0] + d[0]) / 2, (o[1] + d[1]) / 2];
        return u`<circle class="handle mid" cx=${p[0]} cy=${p[1]} r=${s * 0.7}
        @pointerdown=${(g) => this.insertFeatureVertex(g, t, l)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
      }),
      ...n.map(
        (o, l) => u`<circle class="handle" cx=${o[0]} cy=${o[1]} r=${s}
          @pointerdown=${(d) => this.startDrag(d, { type: "f-vertex", id: t.id, index: l })}
          @contextmenu=${(d) => this.removeFeatureVertex(d, t, l)}
          @dblclick=${(d) => this.removeFeatureVertex(d, t, l)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
      )
    ];
  }
  insertFeatureVertex(e, t, s) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const i = t.points[s], n = t.points[(s + 1) % t.points.length];
    t.points.splice(s + 1, 0, [m((i[0] + n[0]) / 2), m((i[1] + n[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "f-vertex", id: t.id, index: s + 1 };
  }
  removeFeatureVertex(e, t, s) {
    e.preventDefault(), e.stopPropagation();
    const i = z(t.kind) === "area" ? 3 : 2;
    if (t.points.length <= i) {
      this.showToast(`${P[t.kind].label}: mindestens ${i} Punkte`, !0);
      return;
    }
    this.remember(), t.points.splice(s, 1), this.changed();
  }
  /** Messwerkzeug: Strecken mit Längen und Summe. */
  renderMeasure(e) {
    if (this.tool !== "measure" || !this.measurePts.length) return c;
    const t = this.hover ? [...this.measurePts, this.hover] : this.measurePts, s = t.slice(1).map((i, n) => {
      const r = t[n];
      if (x(r, i) < 0.01) return c;
      const a = [(r[0] + i[0]) / 2, (r[1] + i[1]) / 2];
      return u`<text class="measure-label" x=${a[0]} y=${a[1]} dy=${-6 * e} font-size=${13 * e}
        stroke-width=${3 * e}>${C(x(r, i))}</text>`;
    });
    return u`<g class="measure">
      <polyline points=${t.map((i) => i.join(",")).join(" ")}></polyline>
      ${this.measurePts.map((i) => u`<circle cx=${i[0]} cy=${i[1]} r=${4 * e}></circle>`)}
      ${s}
    </g>`;
  }
  /** Mittelpunkt einer gezeichneten Zone (für Beschriftung und Verbindungslinie). */
  zoneAnchor(e) {
    return e.type === "sprinkler" ? e.center && e.radius_m ? e.center : null : e.type === "hose" ? e.polygon.length >= 2 ? St(e.polygon, 0.5) : null : e.polygon.length >= 3 ? ie(e.polygon) : null;
  }
  /** Gestrichelte Linie von jeder Zone zu ihrem Ventil (wenn beide im Plan sind). */
  renderValveLinks(e) {
    return this.plan.zones.map((t, s) => {
      const i = this.plan.valves.find((l) => l.id === t.valve_id), n = this.zoneAnchor(t);
      if (!i?.position || !n) return c;
      const r = this.selected?.kind === "zone" && this.selected.id === t.id || this.selected?.kind === "valve" && this.selected.id === i.id, [a, o] = i.position;
      return u`<line class="valve-link ${r ? "selected" : ""}" style="--zone:${this.zoneColor(s)}"
        x1=${n[0]} y1=${n[1]} x2=${a} y2=${o} stroke-dasharray=${`${6 * e} ${4 * e}`}></line>`;
    });
  }
  renderSnapHint(e) {
    return this.snapHint ? u`<circle class="snap-hint" cx=${this.snapHint[0]} cy=${this.snapHint[1]} r=${9 * e}></circle>` : c;
  }
  renderDraft(e) {
    if (this.tool === "feature" && this.draft.length) {
      const i = this.hover ? [...this.draft, this.hover] : this.draft, n = z(this.featureKind) === "area";
      return u`
        <g class="draft feature-draft ${this.featureKind}">
          <polyline points=${[...i, ...n && i.length > 2 ? [i[0]] : []].map((r) => r.join(",")).join(" ")}></polyline>
          ${this.draft.map((r, a) => u`<circle cx=${r[0]} cy=${r[1]} r=${(a === 0 ? 7 : 5) * e}></circle>`)}
        </g>`;
    }
    if (this.tool === "hose" && this.draft.length) {
      const i = this.hover ? [...this.draft, this.hover] : this.draft;
      return u`<g class="draft">
        <polyline points=${i.map((n) => n.join(",")).join(" ")} style="fill:none"></polyline>
        ${this.draft.map((n) => u`<circle cx=${n[0]} cy=${n[1]} r=${5 * e}></circle>`)}
      </g>`;
    }
    if (this.tool !== "bed" || !this.draft.length) return c;
    const t = this.hover ? [...this.draft, this.hover] : this.draft, s = this.plan.zones.findIndex((i) => i.id === this.toolTarget);
    return u`
      <g class="draft" style="--zone:${this.zoneColor(s)}">
        <polyline points=${t.map((i) => i.join(",")).join(" ")}></polyline>
        ${this.draft.map(
      (i, n) => u`<circle cx=${i[0]} cy=${i[1]} r=${(n === 0 ? 8 : 5) * e} class=${n === 0 ? "first" : ""}></circle>`
    )}
      </g>`;
  }
  renderScaleDraft(e) {
    if (this.tool !== "scale") return c;
    const t = this.imageMpp(), s = this.scaleDraft.map((i) => [i[0] * t, i[1] * t]);
    return u`<g class="scale-draft">
      ${s.length === 2 ? u`<line x1=${s[0][0]} y1=${s[0][1]} x2=${s[1][0]} y2=${s[1][1]}></line>` : c}
      ${s.map((i) => u`<circle cx=${i[0]} cy=${i[1]} r=${6 * e}></circle>`)}
    </g>`;
  }
  renderMarker(e, t, s) {
    if (!t.position) return c;
    const [i, n] = t.position, r = this.selected?.kind === e && this.selected.id === t.id, a = e === "valve" ? "V" : Te[t.kind] ?? "S", o = 11 * s;
    return u`
      <g class="marker ${e} ${r ? "selected" : ""}"
        @pointerdown=${(l) => {
      this.tool === "select" && (this.selected = { kind: e, id: t.id }, this.tab = "zones", this.startDrag(l, { type: "marker", kind: e, id: t.id }));
    }}>
        ${e === "valve" ? u`<rect x=${i - o} y=${n - o} width=${2 * o} height=${2 * o} rx=${4 * s}></rect>` : u`<circle cx=${i} cy=${n} r=${o}></circle>`}
        <text x=${i} y=${n} font-size=${12 * s} dy=${4.2 * s}>${a}</text>
        <title>${t.name}</title>
      </g>`;
  }
  renderOverlay() {
    const e = this.plan.garden, t = this.toolBanner(), s = Rt(this.view.scale), i = e.background === "map" ? this.plan.providers[e.map_provider ?? ""] : void 0;
    return h`
      <div class="tools">
        <button class="icon" title="Vergrößern" @click=${() => this.zoomBy(1.4)}><ha-icon icon="mdi:plus"></ha-icon></button>
        <button class="icon" title="Verkleinern" @click=${() => this.zoomBy(1 / 1.4)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="icon" title="Alles zeigen" @click=${this.fitView}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
        <button class="icon ${this.tool === "measure" ? "on" : ""}" title="Abstand messen"
          @click=${() => this.tool === "measure" ? this.cancelTool() : this.startTool("measure")}>
          <ha-icon icon="mdi:tape-measure"></ha-icon>
        </button>
        ${e.background === "map" ? h`<button class="icon ${this.layersOpen ? "on" : ""}" title="Kartenansicht wechseln"
              @click=${() => this.layersOpen = !this.layersOpen}>
              <ha-icon icon="mdi:layers-outline"></ha-icon>
            </button>` : c}
        ${e.background === "map" ? h`<button class="icon ${this.searchOpen ? "on" : ""}" title="Adresse suchen"
              @click=${() => this.searchOpen ? this.closeSearch() : this.openSearch()}>
              <ha-icon icon="mdi:magnify"></ha-icon>
            </button>` : c}
      </div>
      ${t} ${this.renderSearch()} ${this.renderLayers()}
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
    return this.features.length > 0 || this.plan.zones.some((e) => q(e) !== null);
  }
  toolBanner() {
    if (this.tool === "select") return c;
    let e = "", t = c;
    const s = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    if (this.tool === "sprinkler" && (e = `${s}: Am Sprinkler drücken und bis zum Rand ziehen.`), this.tool === "hose" && (e = `${s}: Den Verlauf des Schlauchs anklicken, Doppelklick beendet.`, t = h`<button class="text" ?disabled=${this.draft.length < 2} @click=${this.finishHose}>Fertig</button>`), this.tool === "bed" && (e = `${s}: Ecken anklicken, zum Schließen den ersten Punkt.`, t = h`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`), this.tool === "place" && (e = `${s}: Auf die Stelle im Plan klicken.`), this.tool === "feature") {
      const i = P[this.featureKind], n = i.family;
      e = n === "area" ? `${i.label}: Ecken anklicken, zum Schließen den ersten Punkt.` : n === "line" ? `${i.label}: Punkte anklicken, Doppelklick beendet.` : this.featureKind === "tree" ? `${i.label}: In die Mitte drücken und bis zum Kronenrand ziehen.` : `${i.label}: Auf die Stelle klicken.`, n !== "point" && (t = h`<button
          class="text"
          ?disabled=${this.draft.length < (n === "area" ? 3 : 2)}
          @click=${this.finishFeature}
        >
          Fertig
        </button>`);
    }
    if (this.tool === "measure") {
      const i = Z(this.measurePts);
      e = this.measurePts.length < 2 ? "Messen: Punkte anklicken. Alt-Taste: ohne Einrasten." : `Gemessen: ${C(i)}${this.measurePts.length > 2 ? " (Summe)" : ""}`, this.measurePts.length && (t = h`<button class="text" @click=${() => this.measurePts = []}>Neu</button>`);
    }
    return this.tool === "scale" && (e = this.scaleDraft.length < 2 ? "Maßstab: Zwei Punkte im Bild anklicken, deren Abstand du kennst (z. B. die Ecken der Terrasse)." : "Abstand eingeben:", this.scaleDraft.length === 2 && (t = h`<input
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
    const i = this.status?.zones[e.id], n = q(e), r = n !== null, a = e.type === "sprinkler";
    return h`
      <li class="item ${s ? "open" : ""}" style="--zone:${this.zoneColor(t)}">
        <div class="row" @click=${() => {
      this.selected = s ? null : { kind: "zone", id: e.id };
    }}>
          <span class="dot"></span>
          <ha-icon icon=${a ? "mdi:sprinkler-variant" : e.type === "hose" ? "mdi:pipe" : "mdi:water-outline"}></ha-icon>
          <span class="name">${e.name}</span>
          ${i && i.state !== "idle" ? h`<span class="badge ${i.state}">${ne[i.state]}</span>` : c}
          <span class="meta">${r ? D(n) : h`<em>nicht gezeichnet</em>`}</span>
        </div>
        ${s ? this.renderInspector(e, i) : c}
      </li>
    `;
  }
  renderInspector(e, t) {
    const s = e.type === "sprinkler", i = q(e), n = i !== null, r = s ? "sprinkler" : e.type === "hose" ? "hose" : "bed", a = (o, l, d, p, g = 0.1) => h`<label class="field">
        <span>${o}</span>
        <input type="number" step=${g} .value=${l == null ? "" : String(l)}
          @change=${(y) => {
      const v = parseFloat(y.target.value);
      Number.isFinite(v) && (this.remember(), p(v), this.changed());
    }} />
        <span class="unit">${d}</span>
      </label>`;
    return h`
      <div class="inspector">
        <label class="field wide">
          <span>Ventil</span>
          <select
            @change=${(o) => {
      const l = o.target.value;
      this.remember(), e.valve_id = l || null;
      for (const d of this.plan.valves)
        d.zone_ids = d.zone_ids.filter((p) => p !== e.id), d.id === e.valve_id && d.zone_ids.push(e.id);
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
        ${!this.plan.valves.find((o) => o.id === e.valve_id)?.position && e.valve_id ? h`<p class="hint small">Setze das Ventil im Plan (unten „Platzieren“), dann siehst du die Verbindung.</p>` : c}
        <dl>
          <dt>Fläche gezeichnet</dt>
          <dd>${n ? D(i) : "–"}</dd>
          <dt>Fläche von Hand</dt>
          <dd>${e.area_m2 ? D(e.area_m2) : "–"}</dd>
          ${e.overlap_m2 > 0.05 ? h`<dt>Überschneidung</dt><dd class="warn">${D(e.overlap_m2)} mit anderen Zonen</dd>` : c}
          ${t ? h`<dt>Bedarf</dt><dd>${t.need_mm.toFixed(1)} mm</dd>
                <dt>Geplant</dt><dd>${t.planned_s ? Ie(t.planned_s) : "nicht gießen"}
                  <span class="reason">(${t.reason})</span></dd>` : c}
          ${t?.locked_reason ? h`<dt>Gesperrt</dt><dd class="warn">${t.locked_reason}</dd>` : c}
        </dl>
        ${s && n ? h`<div class="fields">
              ${a("Reichweite", e.radius_m, "m", (o) => e.radius_m = Math.max(0.1, o))}
              ${a("Richtung", e.start_angle_deg, "°", (o) => e.start_angle_deg = (o % 360 + 360) % 360, 5)}
              ${a("Bogen", e.arc_deg, "°", (o) => e.arc_deg = Math.min(360, Math.max(1, o)), 5)}
            </div>
            <p class="hint small">Richtung: Anfang des Bogens, 0° = Norden (oben), 90° = Osten.</p>` : c}
        ${e.type === "hose" && n ? h`<div class="fields">
                ${a("Bewässert je Seite", e.radius_m, "m", (o) => e.radius_m = Math.max(0.05, o), 0.05)}
              </div>
              <p class="hint small">Länge ${C(Z(e.polygon))}, bewässert ${C(2 * (e.radius_m ?? 0))} breit.</p>
              ${this.renderEdges(e.polygon, !1, (o) => e.polygon = o)}` : c}
        ${e.type === "drip" && n ? this.renderEdges(e.polygon, !0, (o) => e.polygon = o) : c}
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
    const s = this.selected?.kind === e && this.selected.id === t.id, i = e === "valve" ? t.safety_level === "device" ? "schließt selbst" : "nur Home Assistant" : It[t.kind] ?? "";
    return h`
      <li class="item ${s ? "open" : ""}">
        <div class="row" @click=${() => this.selected = { kind: e, id: t.id }}>
          <span class="marker-icon ${e}">${e === "valve" ? "V" : Te[t.kind] ?? "S"}</span>
          <span class="name">${t.name}<small>${i}</small></span>
          <button class="text small" @click=${(n) => {
      n.stopPropagation(), this.startTool("place", `${e}:${t.id}`);
    }}>${t.position ? "Versetzen" : "Platzieren"}</button>
          ${t.position ? h`<button class="icon small" title="Vom Plan nehmen" @click=${(n) => {
      n.stopPropagation(), this.remember(), t.position = null, this.changed(), this.removed(`${t.name}: vom Plan genommen`);
    }}><ha-icon icon="mdi:close"></ha-icon></button>` : c}
        </div>
      </li>
    `;
  }
  /** Regler für die Deckkraft des Luftbilds oder Bilds (zum Abpausen). */
  renderOpacity() {
    const e = this.plan.garden;
    if (e.background === "none") return c;
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
    const i = kt(e, t);
    return h`
      <details class="edges">
        <summary>Seitenlängen (${i.length})</summary>
        <div class="edge-list">
          ${i.map(
      (n, r) => h`<label class="field">
              <span>Seite ${r + 1}</span>
              <input
                type="number"
                step="0.05"
                min="0.05"
                .value=${n.toFixed(2)}
                @change=${(a) => {
        const o = parseFloat(a.target.value.replace(",", "."));
        o > 0 && (this.remember(), s(wt(e, r, o).map((l) => [m(l[0]), m(l[1])])), this.changed());
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
      const i = P[s], n = this.tool === "feature" && this.featureKind === s;
      return h`<button
        class="tool ${n ? "active" : ""}"
        title=${i.label}
        @click=${() => n ? this.cancelTool() : this.startTool("feature", s)}
      >
        <ha-icon icon=${i.icon}></ha-icon><span>${i.label}</span>
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
        <input type="checkbox" .checked=${this.snapOn} @change=${(s) => this.snapOn = s.target.checked} />
        An Ecken einrasten <small>(Alt-Taste: kurz aus)</small>
      </label>
      ${this.features.length ? h`<h3>Im Plan (${this.features.length})</h3>
            <ul class="list compact">
              ${this.features.map((s) => this.renderFeatureItem(s, e?.id === s.id))}
            </ul>` : c}
    `;
  }
  renderFeatureItem(e, t) {
    const s = P[e.kind], i = s?.family ?? "area", n = i === "area" ? D(Le(e.points)) : i === "line" ? C(Z(e.points)) : e.kind === "tree" ? `Ø ${C(2 * (e.radius_m ?? 0))}` : "", r = Object.entries(P).filter(([, a]) => a.family === i);
    return h`
      <li class="item ${t ? "open" : ""}">
        <div class="row" @click=${() => this.selected = t ? null : { kind: "feature", id: e.id }}>
          <ha-icon icon=${s?.icon ?? "mdi:shape-outline"}></ha-icon>
          <span class="name">${I(e)}</span>
          <span class="meta">${n}</span>
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
                  </label>` : c}
              <label class="field wide">
                <span>${e.kind === "label" ? "Text" : "Name (optional)"}</span>
                <input
                  id=${e.kind === "label" ? "feature-label" : "feature-name"}
                  type="text"
                  maxlength=${At}
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
      o > 0 && (this.remember(), e.radius_m = m(o / 2), this.changed());
    }}
                    />
                    <span class="unit">m</span>
                  </label>` : c}
              ${i !== "point" ? this.renderEdges(e.points, i === "area", (a) => e.points = a) : c}
              <div class="actions">
                <span class="spacer"></span>
                <button class="text danger" @click=${() => this.deleteFeature(e.id)}>
                  <ha-icon icon="mdi:delete-outline"></ha-icon>Entfernen
                </button>
              </div>
            </div>` : c}
      </li>
    `;
  }
  renderBackgroundTab() {
    const e = this.plan.garden, t = this.plan.providers, s = (i, n, r, a) => h`
      <button class="choice ${e.background === i ? "active" : ""}" @click=${() => this.setBackground(i)}>
        <ha-icon icon=${n}></ha-icon>
        <span><strong>${r}</strong><small>${a}</small></span>
      </button>`;
    return h`
      <div class="choices">
        ${s("map", "mdi:satellite-variant", "Luftbild", "Kartendienst, live im Browser geladen")}
        ${s("image", "mdi:image-outline", "Eigenes Bild", "Foto, Skizze oder Screenshot")}
        ${s("none", "mdi:grid", "Raster", "Leeres Raster in Metern")}
      </div>
      ${this.renderOpacity()}
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
      ${e.map_provider?.startsWith("basemap_at") ? h`<p class="note">Von basemap.at, nur in Österreich. Lizenz CC BY 4.0.</p>` : c}
      ${e.map_provider === "osm" ? h`<p class="note">
            OpenStreetMap-Karte, weltweit. Bitte nur gelegentlich nutzen (Regeln der OpenStreetMap-Kacheln).
          </p>` : c}
      <p class="hint small">Schneller umschalten: Ebenen-Knopf links auf der Karte.</p>
      ${e.map_provider === "custom" ? h`<label class="field wide">
              <span>Adresse mit {z}, {x}, {y}</span>
              <input type="url" placeholder="https://…/{z}/{x}/{y}.jpg" .value=${e.map_url ?? ""}
                @change=${(s) => this.updateGarden({ map_url: s.target.value.trim() })} />
            </label>` : c}
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
                @change=${(s) => this.updateGarden({ north_deg: parseFloat(s.target.value) || 0 })} />
              <span class="unit">°</span>
            </label>
            <p class="hint small">0° = Norden ist oben im Bild. Nur für die Kompassanzeige.</p>
          ` : c}
    `;
  }
};
f.styles = zt;
b([
  je({ type: Boolean, reflect: !0 })
], f.prototype, "narrow", 2);
b([
  $()
], f.prototype, "plan", 2);
b([
  $()
], f.prototype, "status", 2);
b([
  $()
], f.prototype, "error", 2);
b([
  $()
], f.prototype, "toast", 2);
b([
  $()
], f.prototype, "tab", 2);
b([
  $()
], f.prototype, "featureKind", 2);
b([
  $()
], f.prototype, "measurePts", 2);
b([
  $()
], f.prototype, "snapOn", 2);
b([
  $()
], f.prototype, "snapHint", 2);
b([
  $()
], f.prototype, "tool", 2);
b([
  $()
], f.prototype, "toolTarget", 2);
b([
  $()
], f.prototype, "selected", 2);
b([
  $()
], f.prototype, "draft", 2);
b([
  $()
], f.prototype, "scaleDraft", 2);
b([
  $()
], f.prototype, "scaleInput", 2);
b([
  $()
], f.prototype, "view", 2);
b([
  $()
], f.prototype, "size", 2);
b([
  $()
], f.prototype, "imageUrl", 2);
b([
  $()
], f.prototype, "imageSize", 2);
b([
  $()
], f.prototype, "saving", 2);
b([
  $()
], f.prototype, "dirty", 2);
b([
  $()
], f.prototype, "searchOpen", 2);
b([
  $()
], f.prototype, "searchQuery", 2);
b([
  $()
], f.prototype, "searchResults", 2);
b([
  $()
], f.prototype, "searching", 2);
b([
  $()
], f.prototype, "searchError", 2);
b([
  $()
], f.prototype, "searchPin", 2);
b([
  $()
], f.prototype, "toastUndo", 2);
b([
  $()
], f.prototype, "layersOpen", 2);
b([
  $()
], f.prototype, "menuOpen", 2);
b([
  $()
], f.prototype, "pendingImport", 2);
b([
  $()
], f.prototype, "hover", 2);
f = b([
  gt("irrigation-planner-panel")
], f);
function m(e) {
  return Math.round(e * 100) / 100;
}
function Oe(e) {
  return Math.round(e / 5) * 5 % 360;
}
function q(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? bt(e.radius_m, e.arc_deg) : null : e.type === "hose" ? e.polygon.length >= 2 && e.radius_m ? _t(e.polygon, e.radius_m) : null : e.polygon.length >= 3 ? Le(e.polygon) : null;
}
function C(e) {
  return e < 1 ? `${Math.round(e * 100)} cm` : `${e.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m`;
}
function D(e) {
  return e == null ? "–" : `${e.toLocaleString("de-DE", { maximumFractionDigits: e < 10 ? 1 : 0 })} m²`;
}
function Ie(e) {
  if (e < 60) return `${e} s`;
  const t = Math.round(e / 60);
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
function Fe(e) {
  const t = 10 ** Math.floor(Math.log10(e));
  for (const s of [1, 2, 5, 10]) if (s * t >= e) return s * t;
  return 10 * t;
}
function Rt(e) {
  const t = Fe(110 / e), s = t >= 1e3 ? `${t / 1e3} km` : t >= 1 ? `${t} m` : `${t * 100} cm`;
  return { px: t * e, label: s };
}
export {
  f as IrrigationPlannerPanel
};
