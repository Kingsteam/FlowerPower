/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, ie = q.ShadowRoot && (q.ShadyCSS === void 0 || q.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ne = Symbol(), ue = /* @__PURE__ */ new WeakMap();
let Re = class {
  constructor(e, s, i) {
    if (this._$cssResult$ = !0, i !== ne) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (ie && e === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (e = ue.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && ue.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ve = (t) => new Re(typeof t == "string" ? t : t + "", void 0, ne), Ge = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((i, n, r) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + t[r + 1], t[0]);
  return new Re(s, t, ne);
}, We = (t, e) => {
  if (ie) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const i = document.createElement("style"), n = q.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = s.cssText, t.appendChild(i);
  }
}, ge = ie ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const i of e.cssRules) s += i.cssText;
  return Ve(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: qe, defineProperty: Je, getOwnPropertyDescriptor: Xe, getOwnPropertyNames: Ye, getOwnPropertySymbols: Qe, getPrototypeOf: et } = Object, Y = globalThis, me = Y.trustedTypes, tt = me ? me.emptyScript : "", st = Y.reactiveElementPolyfillSupport, j = (t, e) => t, J = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? tt : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let s = t;
  switch (e) {
    case Boolean:
      s = t !== null;
      break;
    case Number:
      s = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(t);
      } catch {
        s = null;
      }
  }
  return s;
} }, re = (t, e) => !qe(t, e), fe = { attribute: !0, type: String, converter: J, reflect: !1, useDefault: !1, hasChanged: re };
Symbol.metadata ??= Symbol("metadata"), Y.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let B = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = fe) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(e, i, s);
      n !== void 0 && Je(this.prototype, e, n);
    }
  }
  static getPropertyDescriptor(e, s, i) {
    const { get: n, set: r } = Xe(this.prototype, e) ?? { get() {
      return this[s];
    }, set(a) {
      this[s] = a;
    } };
    return { get: n, set(a) {
      const o = n?.call(this);
      r?.call(this, a), this.requestUpdate(e, o, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? fe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(j("elementProperties"))) return;
    const e = et(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(j("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(j("properties"))) {
      const s = this.properties, i = [...Ye(s), ...Qe(s)];
      for (const n of i) this.createProperty(n, s[n]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const s = litPropertyMetadata.get(e);
      if (s !== void 0) for (const [i, n] of s) this.elementProperties.set(i, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, i] of this.elementProperties) {
      const n = this._$Eu(s, i);
      n !== void 0 && this._$Eh.set(n, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const s = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const n of i) s.unshift(ge(n));
    } else e !== void 0 && s.push(ge(e));
    return s;
  }
  static _$Eu(e, s) {
    const i = s.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const i of s.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return We(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, s, i) {
    this._$AK(e, i);
  }
  _$ET(e, s) {
    const i = this.constructor.elementProperties.get(e), n = this.constructor._$Eu(e, i);
    if (n !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : J).toAttribute(s, i.type);
      this._$Em = e, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
    }
  }
  _$AK(e, s) {
    const i = this.constructor, n = i._$Eh.get(e);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : J;
      this._$Em = n;
      const o = a.fromAttribute(s, r.type);
      this[n] = o ?? this._$Ej?.get(n) ?? o, this._$Em = null;
    }
  }
  requestUpdate(e, s, i, n = !1, r) {
    if (e !== void 0) {
      const a = this.constructor;
      if (n === !1 && (r = this[e]), i ??= a.getPropertyOptions(e), !((i.hasChanged ?? re)(r, s) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, i)))) return;
      this.C(e, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: i, reflect: n, wrapped: r }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? s ?? this[e]), r !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (s = void 0), this._$AL.set(e, s)), n === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
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
    let e = !1;
    const s = this._$AL;
    try {
      e = this.shouldUpdate(s), e ? (this.willUpdate(s), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(s);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((s) => s.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((s) => this._$ET(s, this[s])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
B.elementStyles = [], B.shadowRootOptions = { mode: "open" }, B[j("elementProperties")] = /* @__PURE__ */ new Map(), B[j("finalized")] = /* @__PURE__ */ new Map(), st?.({ ReactiveElement: B }), (Y.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ae = globalThis, be = (t) => t, X = ae.trustedTypes, $e = X ? X.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Be = "$lit$", P = `lit$${Math.random().toFixed(9).slice(2)}$`, De = "?" + P, it = `<${De}>`, T = document, L = () => T.createComment(""), Z = (t) => t === null || typeof t != "object" && typeof t != "function", oe = Array.isArray, nt = (t) => oe(t) || typeof t?.[Symbol.iterator] == "function", te = `[ 	
\f\r]`, I = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ye = /-->/g, ve = />/g, z = RegExp(`>|${te}(?:([^\\s"'>=/]+)(${te}*=${te}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), xe = /'/g, ke = /"/g, He = /^(?:script|style|textarea|title)$/i, Ne = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), h = Ne(1), u = Ne(2), D = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), we = /* @__PURE__ */ new WeakMap(), E = T.createTreeWalker(T, 129);
function Ie(t, e) {
  if (!oe(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return $e !== void 0 ? $e.createHTML(e) : e;
}
const rt = (t, e) => {
  const s = t.length - 1, i = [];
  let n, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = I;
  for (let o = 0; o < s; o++) {
    const l = t[o];
    let d, p, g = -1, y = 0;
    for (; y < l.length && (a.lastIndex = y, p = a.exec(l), p !== null); ) y = a.lastIndex, a === I ? p[1] === "!--" ? a = ye : p[1] !== void 0 ? a = ve : p[2] !== void 0 ? (He.test(p[2]) && (n = RegExp("</" + p[2], "g")), a = z) : p[3] !== void 0 && (a = z) : a === z ? p[0] === ">" ? (a = n ?? I, g = -1) : p[1] === void 0 ? g = -2 : (g = a.lastIndex - p[2].length, d = p[1], a = p[3] === void 0 ? z : p[3] === '"' ? ke : xe) : a === ke || a === xe ? a = z : a === ye || a === ve ? a = I : (a = z, n = void 0);
    const v = a === z && t[o + 1].startsWith("/>") ? " " : "";
    r += a === I ? l + it : g >= 0 ? (i.push(d), l.slice(0, g) + Be + l.slice(g) + P + v) : l + P + (g === -2 ? o : v);
  }
  return [Ie(t, r + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class K {
  constructor({ strings: e, _$litType$: s }, i) {
    let n;
    this.parts = [];
    let r = 0, a = 0;
    const o = e.length - 1, l = this.parts, [d, p] = rt(e, s);
    if (this.el = K.createElement(d, i), E.currentNode = this.el.content, s === 2 || s === 3) {
      const g = this.el.content.firstChild;
      g.replaceWith(...g.childNodes);
    }
    for (; (n = E.nextNode()) !== null && l.length < o; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const g of n.getAttributeNames()) if (g.endsWith(Be)) {
          const y = p[a++], v = n.getAttribute(g).split(P), x = /([.?@])?(.*)/.exec(y);
          l.push({ type: 1, index: r, name: x[2], strings: v, ctor: x[1] === "." ? ot : x[1] === "?" ? lt : x[1] === "@" ? ct : Q }), n.removeAttribute(g);
        } else g.startsWith(P) && (l.push({ type: 6, index: r }), n.removeAttribute(g));
        if (He.test(n.tagName)) {
          const g = n.textContent.split(P), y = g.length - 1;
          if (y > 0) {
            n.textContent = X ? X.emptyScript : "";
            for (let v = 0; v < y; v++) n.append(g[v], L()), E.nextNode(), l.push({ type: 2, index: ++r });
            n.append(g[y], L());
          }
        }
      } else if (n.nodeType === 8) if (n.data === De) l.push({ type: 2, index: r });
      else {
        let g = -1;
        for (; (g = n.data.indexOf(P, g + 1)) !== -1; ) l.push({ type: 7, index: r }), g += P.length - 1;
      }
      r++;
    }
  }
  static createElement(e, s) {
    const i = T.createElement("template");
    return i.innerHTML = e, i;
  }
}
function H(t, e, s = t, i) {
  if (e === D) return e;
  let n = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const r = Z(e) ? void 0 : e._$litDirective$;
  return n?.constructor !== r && (n?._$AO?.(!1), r === void 0 ? n = void 0 : (n = new r(t), n._$AT(t, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = n : s._$Cl = n), n !== void 0 && (e = H(t, n._$AS(t, e.values), n, i)), e;
}
class at {
  constructor(e, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: s }, parts: i } = this._$AD, n = (e?.creationScope ?? T).importNode(s, !0);
    E.currentNode = n;
    let r = E.nextNode(), a = 0, o = 0, l = i[0];
    for (; l !== void 0; ) {
      if (a === l.index) {
        let d;
        l.type === 2 ? d = new V(r, r.nextSibling, this, e) : l.type === 1 ? d = new l.ctor(r, l.name, l.strings, this, e) : l.type === 6 && (d = new ht(r, this, e)), this._$AV.push(d), l = i[++o];
      }
      a !== l?.index && (r = E.nextNode(), a++);
    }
    return E.currentNode = T, n;
  }
  p(e) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, s), s += i.strings.length - 2) : i._$AI(e[s])), s++;
  }
}
class V {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, s, i, n) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = i, this.options = n, this._$Cv = n?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && e?.nodeType === 11 && (e = s.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, s = this) {
    e = H(this, e, s), Z(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== D && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : nt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && Z(this._$AH) ? this._$AA.nextSibling.data = e : this.T(T.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: s, _$litType$: i } = e, n = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = K.createElement(Ie(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(s);
    else {
      const r = new at(n, this), a = r.u(this.options);
      r.p(s), this.T(a), this._$AH = r;
    }
  }
  _$AC(e) {
    let s = we.get(e.strings);
    return s === void 0 && we.set(e.strings, s = new K(e)), s;
  }
  k(e) {
    oe(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, n = 0;
    for (const r of e) n === s.length ? s.push(i = new V(this.O(L()), this.O(L()), this, this.options)) : i = s[n], i._$AI(r), n++;
    n < s.length && (this._$AR(i && i._$AB.nextSibling, n), s.length = n);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); e !== this._$AB; ) {
      const i = be(e).nextSibling;
      be(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class Q {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, s, i, n, r) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = s, this._$AM = n, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = c;
  }
  _$AI(e, s = this, i, n) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) e = H(this, e, s, 0), a = !Z(e) || e !== this._$AH && e !== D, a && (this._$AH = e);
    else {
      const o = e;
      let l, d;
      for (e = r[0], l = 0; l < r.length - 1; l++) d = H(this, o[i + l], s, l), d === D && (d = this._$AH[l]), a ||= !Z(d) || d !== this._$AH[l], d === c ? e = c : e !== c && (e += (d ?? "") + r[l + 1]), this._$AH[l] = d;
    }
    a && !n && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ot extends Q {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class lt extends Q {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class ct extends Q {
  constructor(e, s, i, n, r) {
    super(e, s, i, n, r), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = H(this, e, s, 0) ?? c) === D) return;
    const i = this._$AH, n = e === c && i !== c || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== c && (i === c || n);
    n && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class ht {
  constructor(e, s, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    H(this, e);
  }
}
const dt = ae.litHtmlPolyfillSupport;
dt?.(K, V), (ae.litHtmlVersions ??= []).push("3.3.3");
const pt = (t, e, s) => {
  const i = s?.renderBefore ?? e;
  let n = i._$litPart$;
  if (n === void 0) {
    const r = s?.renderBefore ?? null;
    i._$litPart$ = n = new V(e.insertBefore(L(), r), r, void 0, s ?? {});
  }
  return n._$AI(t), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const le = globalThis;
class F extends B {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = pt(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return D;
  }
}
F._$litElement$ = !0, F.finalized = !0, le.litElementHydrateSupport?.({ LitElement: F });
const ut = le.litElementPolyfillSupport;
ut?.({ LitElement: F });
(le.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const gt = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const mt = { attribute: !0, type: String, converter: J, reflect: !1, hasChanged: re }, ft = (t = mt, e, s) => {
  const { kind: i, metadata: n } = s;
  let r = globalThis.litPropertyMetadata.get(n);
  if (r === void 0 && globalThis.litPropertyMetadata.set(n, r = /* @__PURE__ */ new Map()), i === "setter" && ((t = Object.create(t)).wrapped = !0), r.set(s.name, t), i === "accessor") {
    const { name: a } = s;
    return { set(o) {
      const l = e.get.call(this);
      e.set.call(this, o), this.requestUpdate(a, l, t, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(a, void 0, t, o), o;
    } };
  }
  if (i === "setter") {
    const { name: a } = s;
    return function(o) {
      const l = this[a];
      e.call(this, o), this.requestUpdate(a, l, t, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function Ue(t) {
  return (e, s) => typeof s == "object" ? ft(t, e, s) : ((i, n, r) => {
    const a = n.hasOwnProperty(r);
    return n.constructor.createProperty(r, i), a ? Object.getOwnPropertyDescriptor(n, r) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function $(t) {
  return Ue({ ...t, state: !0, attribute: !1 });
}
const A = 6378137, je = 256, U = Math.PI * A;
function bt(t, e) {
  const s = Math.max(0, Math.min(360, e));
  return Math.PI * t * t * s / 360;
}
function Fe(t) {
  if (t.length < 3) return 0;
  let e = 0;
  for (let s = 0; s < t.length; s++) {
    const [i, n] = t[s], [r, a] = t[(s + 1) % t.length];
    e += i * a - r * n;
  }
  return Math.abs(e) / 2;
}
function w(t, e, s) {
  const i = s * Math.PI / 180;
  return [t[0] + Math.sin(i) * e, t[1] - Math.cos(i) * e];
}
function _e(t, e) {
  return (Math.atan2(e[0] - t[0], -(e[1] - t[1])) * 180 / Math.PI + 360) % 360;
}
function k(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1]);
}
function $t(t, e, s, i) {
  const [n, r] = t;
  if (i >= 360)
    return `M ${n - e} ${r} a ${e} ${e} 0 1 0 ${2 * e} 0 a ${e} ${e} 0 1 0 ${-2 * e} 0 Z`;
  const [a, o] = w(t, e, s), [l, d] = w(t, e, s + i), p = i > 180 ? 1 : 0;
  return `M ${n} ${r} L ${a} ${o} A ${e} ${e} 0 ${p} 1 ${l} ${d} Z`;
}
function Ae(t) {
  const e = t.length || 1;
  return [t.reduce((s, i) => s + i[0], 0) / e, t.reduce((s, i) => s + i[1], 0) / e];
}
function Se(t, e) {
  return 2 * Math.PI * A * Math.cos(t * Math.PI / 180) / (je * 2 ** e);
}
function Pe(t, e) {
  return Math.log2(
    2 * Math.PI * A * Math.cos(t * Math.PI / 180) * e / je
  );
}
function yt(t, e, s) {
  const [i, n] = s, r = Math.PI / 180;
  return [
    (e - n) * r * A * Math.cos(i * r),
    -(t - i) * r * A
  ];
}
function vt(t, e) {
  const [s, i] = e, n = 180 / Math.PI;
  return [
    s - t[1] / A * n,
    i + t[0] / (A * Math.cos(s / n)) * n
  ];
}
function ze(t, e, s, i, n = 200) {
  const [r, a] = e, o = Math.PI / 180, l = 1 / Math.cos(r * o), d = A * a * o, p = A * Math.log(Math.tan(Math.PI / 4 + r * o / 2)), g = 2 ** i, y = 2 * U / g, v = (_) => (d + _ * l + U) / y, x = (_) => (U - (p - _ * l)) / y, ce = Math.max(0, Math.floor(v(s.x0))), he = Math.min(g - 1, Math.floor(v(s.x1))), de = Math.max(0, Math.floor(x(s.y0))), pe = Math.min(g - 1, Math.floor(x(s.y1))), ee = [];
  if ((he - ce + 1) * (pe - de + 1) > n) return ee;
  for (let _ = de; _ <= pe; _++)
    for (let N = ce; N <= he; N++) {
      const Ze = N * y - U, Ke = U - _ * y;
      ee.push({
        url: t.replace("{z}", String(i)).replace("{x}", String(N)).replace("{y}", String(_)),
        key: `${i}/${N}/${_}`,
        x: (Ze - d) / l,
        y: (p - Ke) / l,
        size: y / l
      });
    }
  return ee;
}
function xt(t, e, s) {
  let i = null, n = s;
  for (const r of e) {
    const a = k(t, r);
    a <= n && (i = r, n = a);
  }
  return i;
}
function Me(t, e = !1) {
  let s = 0;
  for (let i = 1; i < t.length; i++) s += k(t[i - 1], t[i]);
  return e && t.length > 2 && (s += k(t[t.length - 1], t[0])), s;
}
function kt(t, e) {
  const s = e ? t.length : t.length - 1, i = [];
  for (let n = 0; n < s; n++) i.push(k(t[n], t[(n + 1) % t.length]));
  return i;
}
function wt(t, e, s) {
  const i = (e + 1) % t.length, n = t[e], r = t[i], a = k(n, r);
  if (!(s > 0) || a === 0) return t;
  const o = s / a, l = [n[0] + (r[0] - n[0]) * o, n[1] + (r[1] - n[1]) * o];
  return t.map((d, p) => p === i ? l : d);
}
const S = {
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
}, _t = 60;
function M(t) {
  return S[t]?.family ?? "area";
}
function O(t) {
  return t.kind === "label" && t.label ? t.label : t.label || S[t.kind]?.label || t.kind;
}
function At(t) {
  const e = new Set(t.map((i) => i.id));
  let s = t.length + 1;
  for (; e.has(`f${s}`); ) s++;
  return `f${s}`;
}
const St = "Suche: © OpenStreetMap-Mitwirkende";
async function Pt(t, e, s = "de") {
  if (e.trim().length < 3) throw new Error("Bitte mindestens 3 Zeichen eingeben");
  return (await t({
    type: "irrigation_planner/geocode",
    query: e.trim(),
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
  polygon.feature.building {
    fill: #b0a9a1;
    stroke: #6d655d;
  }
  polygon.feature.paving {
    fill: #e8dfd2;
    stroke: #a8998a;
  }
  polygon.feature.water {
    fill: #9ccbea;
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
    fill: rgba(67, 160, 71, 0.35);
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
  .feature-draft polyline {
    fill: rgba(120, 120, 120, 0.15);
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
var Mt = Object.defineProperty, Et = Object.getOwnPropertyDescriptor, b = (t, e, s, i) => {
  for (var n = i > 1 ? void 0 : i ? Et(e, s) : e, r = t.length - 1, a; r >= 0; r--)
    (a = t[r]) && (n = (i ? a(e, s, n) : a(n)) || n);
  return i && n && Mt(e, s, n), n;
};
const C = "irrigation_planner", Ee = [
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
}, Tt = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge",
  rain_binary: "Regensensor",
  water_meter: "Wasserzähler"
}, se = {
  idle: "",
  running: "läuft",
  queued: "wartet",
  locked: "gesperrt"
}, Ot = 0.05, Ct = 10;
let f = class extends F {
  constructor() {
    super(...arguments), this.narrow = !1, this.error = "", this.toast = "", this.tab = "zones", this.featureKind = "building", this.measurePts = [], this.snapOn = !0, this.snapHint = null, this.tool = "select", this.toolTarget = "", this.selected = null, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.view = { cx: 0, cy: 0, scale: 25 }, this.size = { w: 800, h: 600 }, this.imageUrl = "", this.imageSize = null, this.saving = !1, this.dirty = !1, this.searchOpen = !1, this.searchQuery = "", this.searchResults = null, this.searching = !1, this.searchError = "", this.searchPin = null, this.savedJson = "", this.history = [], this.drag = null, this.toastUndo = !1, this.layersOpen = !1, this.autoFit = !0, this.loadedImage = "", this.onWheel = (t) => {
      t.preventDefault();
      const s = t.currentTarget.getBoundingClientRect(), i = Math.exp(-t.deltaY * (t.ctrlKey ? 0.01 : 15e-4));
      this.zoomBy(i, this.toPlan(t), [t.clientX - s.left, t.clientY - s.top]);
    }, this.onKey = (t) => {
      const e = t.composedPath()[0];
      e && ["INPUT", "SELECT", "TEXTAREA"].includes(e.tagName) || (t.key === "Escape" && this.cancelTool(), t.key === "Enter" && this.tool === "bed" && this.finishBed(), t.key === "Enter" && this.tool === "feature" && this.finishFeature(), (t.ctrlKey || t.metaKey) && t.key === "z" && (t.preventDefault(), this.undo()), t.key === "Delete" && this.selected?.kind === "zone" && this.clearGeometry(this.selected.id), t.key === "Delete" && this.selected?.kind === "feature" && this.deleteFeature(this.selected.id));
    }, this.onPointerDown = (t) => {
      if (t.button !== 0) return;
      const e = t.currentTarget, s = this.toPlan(t);
      if (this.tool === "feature") {
        const i = this.featureKind, n = this.snap(s, t), r = M(i);
        if (r === "point") {
          const o = [m(n[0]), m(n[1])];
          if (i === "tree") {
            const l = this.addFeature({ kind: i, points: [o], radius_m: 0 });
            this.drag = { type: "new-tree", id: l.id }, e.setPointerCapture(t.pointerId);
          } else
            this.addFeature({ kind: i, points: [o], label: i === "label" ? "Beschriftung" : null }), this.cancelTool(), i === "label" && this.updateComplete.then(
              () => this.renderRoot.querySelector("#feature-label")?.select()
            );
          return;
        }
        const a = (o) => k(n, o) * this.view.scale < 12;
        r === "area" && this.draft.length >= 3 && a(this.draft[0]) ? this.finishFeature() : r === "line" && this.draft.length >= 2 && a(this.draft[this.draft.length - 1]) ? this.finishFeature() : this.draft = [...this.draft, n];
        return;
      }
      if (this.tool === "measure") {
        this.measurePts = [...this.measurePts, this.snap(s, t)];
        return;
      }
      if (this.tool === "sprinkler") {
        this.remember();
        const i = this.zone(this.toolTarget), n = this.snap(s, t);
        s[0] = n[0], s[1] = n[1], i.center = [m(s[0]), m(s[1])], i.radius_m = 0, this.drag = { type: "new-sprinkler", id: i.id }, e.setPointerCapture(t.pointerId), this.changed();
        return;
      }
      if (this.tool === "bed") {
        const i = this.snap(s, t);
        this.draft.length >= 3 && k(i, this.draft[0]) * this.view.scale < 12 ? this.finishBed() : this.draft = [...this.draft, i];
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
        sx: t.clientX,
        sy: t.clientY,
        cx: this.view.cx,
        cy: this.view.cy,
        moved: !1
      }, e.setPointerCapture(t.pointerId);
    }, this.onPointerMove = (t) => {
      const e = this.drag;
      if (!e) {
        ["bed", "feature", "measure", "sprinkler"].includes(this.tool) && (this.hover = this.snap(this.toPlan(t), t));
        return;
      }
      const s = this.toPlan(t);
      if (e.type.startsWith("f-") || e.type === "new-tree") {
        this.moveFeature(e, s, t);
        return;
      }
      if (e.type === "pan") {
        const n = t.clientX - e.sx, r = t.clientY - e.sy;
        Math.abs(n) + Math.abs(r) > 3 && (e.moved = !0, this.autoFit = !1), this.view = {
          ...this.view,
          cx: e.cx - n / this.view.scale,
          cy: e.cy - r / this.view.scale
        };
        return;
      }
      if (e.type === "marker") {
        this.marker(e.kind, e.id).position = [m(s[0]), m(s[1])], this.changed();
        return;
      }
      const i = this.zone(e.id);
      switch (e.type) {
        case "new-sprinkler":
        case "radius":
          i.radius_m = m(Math.max(0.1, k(i.center, s)));
          break;
        case "center":
          i.center = [m(s[0]), m(s[1])];
          break;
        case "start": {
          const n = i.start_angle_deg + i.arc_deg, r = Oe(_e(i.center, s));
          let a = ((n - r) % 360 + 360) % 360;
          a < 5 && (a = 360), i.start_angle_deg = r, i.arc_deg = a;
          break;
        }
        case "end": {
          let r = ((Oe(_e(i.center, s)) - i.start_angle_deg) % 360 + 360) % 360;
          r < 5 && (r = 360), i.arc_deg = r;
          break;
        }
        case "vertex": {
          const n = this.snap(s, t, i.polygon[e.index]);
          i.polygon[e.index] = [m(n[0]), m(n[1])];
          break;
        }
        case "move-zone": {
          const n = s[0] - e.start[0], r = s[1] - e.start[1];
          i.type === "sprinkler" && e.orig.center ? i.center = [m(e.orig.center[0] + n), m(e.orig.center[1] + r)] : i.polygon = e.orig.polygon.map((a) => [m(a[0] + n), m(a[1] + r)]);
          break;
        }
      }
      this.changed();
    }, this.hover = null, this.onPointerUp = () => {
      const t = this.drag;
      if (this.drag = null, this.snapHint = null, !!t) {
        if (t.type === "new-tree") {
          const e = this.feature(t.id);
          (!e.radius_m || e.radius_m < 0.3) && (e.radius_m = 1.5), this.cancelTool(), this.changed();
        }
        if (t.type === "pan") {
          t.moved || (this.selected = null);
          return;
        }
        if (t.type === "new-sprinkler") {
          const e = this.zone(t.id);
          (!e.radius_m || e.radius_m < 0.3) && (e.radius_m = 3), e.arc_deg || (e.arc_deg = 360), this.selected = { kind: "zone", id: e.id }, this.cancelTool(), this.changed();
        }
        this.history[this.history.length - 1] === JSON.stringify(this.editable()) && this.history.pop();
      }
    };
  }
  // `hass` ändert sich bei jedem Zustandswechsel im Haus; das Panel braucht
  // davon nur die Verbindung und löst darum kein neues Zeichnen aus.
  set hass(t) {
    const e = !this._hass;
    this._hass = t, e && this.load();
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
  firstUpdated(t) {
    this.resizer = new ResizeObserver(() => this.measure()), this.resizer.observe(this);
  }
  updated() {
    const t = this.renderRoot.querySelector(".stage");
    t && !t.dataset.observed && (t.dataset.observed = "1", this.resizer?.observe(t), this.measure());
  }
  measure() {
    const t = this.renderRoot.querySelector(".stage");
    if (!t) return;
    const { width: e, height: s } = t.getBoundingClientRect();
    e && s && (e !== this.size.w || s !== this.size.h) && (this.size = { w: e, h: s }, this.autoFit && this.plan && this.fitView());
  }
  // Daten ----------------------------------------------------------------------
  async load() {
    try {
      const t = await this._hass.callWS({ type: `${C}/plan/get` });
      this.setPlan(t, !0), await this.subscribe();
    } catch (t) {
      this.error = this.message(t);
    }
  }
  async subscribe() {
    this.unsub || !this._hass || (this.unsub = await this._hass.connection.subscribeMessage(
      (t) => this.status = t,
      { type: `${C}/plan/subscribe` }
    ));
  }
  /** Neuer Stand vom Server. Nach dem Speichern bleibt „Rückgängig“ möglich. */
  setPlan(t, e, s = !1) {
    this.plan = t, this.savedJson = JSON.stringify(this.editable()), this.dirty = !1, s || (this.history = []), this.loadImage(), e && this.fitView();
  }
  editable() {
    const t = this.plan;
    return { garden: t.garden, zones: t.zones, valves: t.valves, sensors: t.sensors };
  }
  /** Vor jeder Änderung: Stand merken (für „Rückgängig“). */
  remember() {
    this.history.push(JSON.stringify(this.editable())), this.history.length > 100 && this.history.shift();
  }
  changed() {
    this.plan = { ...this.plan }, this.dirty = JSON.stringify(this.editable()) !== this.savedJson;
  }
  undo() {
    const t = this.history.pop();
    t && (this.plan = { ...this.plan, ...JSON.parse(t) }, this.dirty = JSON.stringify(this.editable()) !== this.savedJson, this.loadImage());
  }
  discard() {
    this.dirty && (this.remember(), this.plan = { ...this.plan, ...JSON.parse(this.savedJson) }, this.dirty = !1, this.cancelTool(), this.loadImage());
  }
  async save() {
    const t = this.plan, e = { ...t.garden };
    e.background === "map" && e.latitude != null && (e.map_zoom = Math.round(Pe(e.latitude, this.view.scale) * 100) / 100), this.saving = !0;
    try {
      const s = await this._hass.callWS({
        type: `${C}/plan/save`,
        garden: e,
        zones: t.zones.map((i) => ({
          id: i.id,
          center: i.center,
          radius_m: i.radius_m,
          start_angle_deg: i.start_angle_deg,
          arc_deg: i.arc_deg,
          polygon: i.polygon
        })),
        valves: t.valves.map((i) => ({ id: i.id, position: i.position })),
        sensors: t.sensors.map((i) => ({ id: i.id, position: i.position }))
      });
      this.setPlan(s, !1, !0), this.showToast("Plan gespeichert");
    } catch (s) {
      this.showToast(`Nicht gespeichert: ${this.message(s)}`, !0);
    } finally {
      this.saving = !1;
    }
  }
  message(t) {
    return t && typeof t == "object" && "message" in t ? String(t.message) : String(t);
  }
  showToast(t, e = !1, s = !1) {
    this.toast = (e ? "⚠ " : "") + t, this.toastUndo = s, window.clearTimeout(this.toastTimer), this.toastTimer = window.setTimeout(
      () => {
        this.toast = "", this.toastUndo = !1;
      },
      e || s ? 8e3 : 3e3
    );
  }
  /** Entfernen mit Hinweis und „Rückgängig“-Knopf. */
  removed(t) {
    this.showToast(t, !1, !0);
  }
  async loadImage() {
    const t = this.plan?.garden.background_image;
    if (!(!t || t === this.loadedImage))
      try {
        const e = await this._hass.fetchWithAuth(`/api/${C}/image/${t}`);
        if (!e.ok) throw new Error(`Bild nicht gefunden (${e.status})`);
        const s = URL.createObjectURL(await e.blob()), i = new Image();
        i.src = s, await i.decode(), this.imageUrl && URL.revokeObjectURL(this.imageUrl), this.imageUrl = s, this.imageSize = [i.naturalWidth, i.naturalHeight], this.loadedImage = t;
      } catch (e) {
        this.showToast(this.message(e), !0);
      }
  }
  async upload(t) {
    const e = t.target, s = e.files?.[0];
    if (e.value = "", !s) return;
    const i = new FormData();
    i.append("file", s);
    try {
      const n = await this._hass.fetchWithAuth(`/api/${C}/image`, {
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
    const t = this.plan.garden;
    if (t.scale_points && t.scale_distance_m) {
      const e = k(t.scale_points[0], t.scale_points[1]);
      if (e > 0) return t.scale_distance_m / e;
    }
    return Ot;
  }
  // Ansicht --------------------------------------------------------------------
  toScreen(t) {
    const { cx: e, cy: s, scale: i } = this.view;
    return [(t[0] - e) * i + this.size.w / 2, (t[1] - s) * i + this.size.h / 2];
  }
  toPlan(t) {
    const s = this.renderRoot.querySelector("svg.plan").getBoundingClientRect(), { cx: i, cy: n, scale: r } = this.view;
    return [
      (t.clientX - s.left - this.size.w / 2) / r + i,
      (t.clientY - s.top - this.size.h / 2) / r + n
    ];
  }
  bounds() {
    const t = [];
    for (const n of this.plan?.zones ?? [])
      n.type === "sprinkler" && n.center && n.radius_m && (t.push([n.center[0] - n.radius_m, n.center[1] - n.radius_m]), t.push([n.center[0] + n.radius_m, n.center[1] + n.radius_m])), n.type !== "sprinkler" && t.push(...n.polygon);
    for (const n of [...this.plan?.valves ?? [], ...this.plan?.sensors ?? []])
      n.position && t.push(n.position);
    const e = this.plan?.garden;
    for (const n of e?.features ?? [])
      if (t.push(...n.points), n.kind === "tree" && n.radius_m) {
        const [r, a] = n.points[0];
        t.push([r - n.radius_m, a - n.radius_m], [r + n.radius_m, a + n.radius_m]);
      }
    if (e?.background === "image" && this.imageSize) {
      const n = this.imageMpp();
      t.push([0, 0], [this.imageSize[0] * n, this.imageSize[1] * n]);
    }
    if (!t.length) return null;
    const s = t.map((n) => n[0]), i = t.map((n) => n[1]);
    return [Math.min(...s), Math.min(...i), Math.max(...s), Math.max(...i)];
  }
  fitView() {
    const t = this.plan?.garden, e = this.bounds();
    if (t?.background === "map" && t.latitude != null && !e) {
      const d = t.map_zoom ?? 19;
      this.view = { cx: 0, cy: 0, scale: 1 / Se(t.latitude, d) };
      return;
    }
    if (!e) {
      this.view = { cx: 0, cy: 0, scale: 25 };
      return;
    }
    const [s, i, n, r] = e, a = Math.max(n - s, 4), o = Math.max(r - i, 4), l = Math.min(this.size.w / (a * 1.15), this.size.h / (o * 1.15), 200);
    this.view = { cx: (s + n) / 2, cy: (i + r) / 2, scale: Math.max(l, 0.5) };
  }
  zoomBy(t, e, s) {
    this.autoFit = !1;
    const { cx: i, cy: n, scale: r } = this.view, a = Math.min(Math.max(r * t, 0.5), 400);
    if (!e || !s) {
      this.view = { cx: i, cy: n, scale: a };
      return;
    }
    this.view = {
      cx: e[0] - (s[0] - this.size.w / 2) / a,
      cy: e[1] - (s[1] - this.size.h / 2) / a,
      scale: a
    };
  }
  // Werkzeuge ------------------------------------------------------------------
  startTool(t, e = "") {
    this.tool = t, this.toolTarget = e, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.measurePts = [], this.hover = null, this.snapHint = null, t === "feature" && (this.featureKind = e), e && (t === "sprinkler" || t === "bed") && (this.selected = { kind: "zone", id: e });
  }
  // Grundriss -------------------------------------------------------------------
  get features() {
    return this.plan.garden.features;
  }
  feature(t) {
    return this.features.find((e) => e.id === t);
  }
  /** Alle Ecken und Mittelpunkte, an denen neue Punkte einrasten. */
  snapCandidates(t) {
    const e = [];
    for (const s of this.features) e.push(...s.points);
    for (const s of this.plan.zones)
      e.push(...s.polygon), s.center && e.push(s.center);
    for (const s of [...this.plan.valves, ...this.plan.sensors]) s.position && e.push(s.position);
    return e.push(...this.draft, ...this.measurePts), t ? e.filter((s) => s !== t) : e;
  }
  /** Punkt fangen (Alt-Taste: frei). Merkt den Fangpunkt für die Anzeige. */
  snap(t, e, s) {
    if (!this.snapOn || e?.altKey)
      return this.snapHint = null, t;
    const i = xt(t, this.snapCandidates(s), Ct / this.view.scale);
    return this.snapHint = i, i ? [i[0], i[1]] : t;
  }
  finishFeature() {
    const t = this.featureKind, e = M(t) === "area" ? 3 : 2;
    if (this.draft.length < e) {
      this.showToast(`${S[t].label}: mindestens ${e} Punkte`, !0);
      return;
    }
    this.addFeature({ kind: t, points: this.draft.map((s) => [m(s[0]), m(s[1])]) }), this.cancelTool();
  }
  addFeature(t) {
    this.remember();
    const e = {
      id: At(this.features),
      radius_m: null,
      label: null,
      ...t
    };
    return this.features.push(e), this.selected = { kind: "feature", id: e.id }, this.tab = "plan", this.changed(), e;
  }
  deleteFeature(t) {
    const e = this.feature(t);
    this.remember(), this.plan.garden.features = this.features.filter((s) => s.id !== t), this.selected?.kind === "feature" && this.selected.id === t && (this.selected = null), this.changed(), this.removed(`${O(e)} entfernt`);
  }
  cancelTool() {
    this.startTool("select");
  }
  zone(t) {
    return this.plan.zones.find((e) => e.id === t);
  }
  finishBed() {
    if (this.draft.length < 3) {
      this.showToast("Ein Beet braucht mindestens 3 Punkte", !0);
      return;
    }
    this.remember(), this.zone(this.toolTarget).polygon = this.draft.map((t) => [m(t[0]), m(t[1])]), this.selected = { kind: "zone", id: this.toolTarget }, this.changed(), this.cancelTool();
  }
  clearGeometry(t) {
    const e = this.zone(t);
    this.remember(), e.center = null, e.radius_m = null, e.polygon = [], this.changed(), this.removed(`${e.name}: Zeichnung entfernt`);
  }
  startDrag(t, e) {
    if (this.tool !== "select" || t.button !== 0) return;
    t.stopPropagation(), this.renderRoot.querySelector("svg.plan").setPointerCapture(t.pointerId), this.remember(), this.drag = e;
  }
  moveFeature(t, e, s) {
    if (!("id" in t)) return;
    const i = this.feature(t.id);
    if (i) {
      switch (t.type) {
        case "new-tree":
        case "f-radius":
          i.radius_m = m(Math.max(0.1, k(i.points[0], e)));
          break;
        case "f-vertex": {
          const n = this.snap(e, s, i.points[t.index]);
          i.points[t.index] = [m(n[0]), m(n[1])];
          break;
        }
        case "f-move": {
          const n = e[0] - t.start[0], r = e[1] - t.start[1];
          i.points = t.orig.points.map((a) => [m(a[0] + n), m(a[1] + r)]);
          break;
        }
      }
      this.changed();
    }
  }
  insertVertex(t, e, s) {
    if (this.tool !== "select") return;
    t.stopPropagation(), this.remember();
    const i = e.polygon[s], n = e.polygon[(s + 1) % e.polygon.length];
    e.polygon.splice(s + 1, 0, [m((i[0] + n[0]) / 2), m((i[1] + n[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(t.pointerId), this.drag = { type: "vertex", id: e.id, index: s + 1 };
  }
  removeVertex(t, e, s) {
    if (t.preventDefault(), t.stopPropagation(), e.polygon.length <= 3) {
      this.showToast("Ein Beet braucht mindestens 3 Punkte", !0);
      return;
    }
    this.remember(), e.polygon.splice(s, 1), this.changed();
  }
  marker(t, e) {
    return (t === "valve" ? this.plan.valves : this.plan.sensors).find((i) => i.id === e);
  }
  // Hintergrund ----------------------------------------------------------------
  setBackground(t) {
    const e = this.plan.garden;
    e.background !== t && (this.remember(), e.background = t, t === "map" && ((e.latitude == null || e.longitude == null) && (e.latitude = this.plan.home.latitude, e.longitude = this.plan.home.longitude, this.openSearch()), e.map_provider ??= "basemap_at", e.map_zoom ??= 19, this.bounds() || this.fitView()), this.changed());
  }
  updateGarden(t) {
    this.remember(), Object.assign(this.plan.garden, t), this.changed();
  }
  /**
   * Kartenmitte auf die Mitte der Ansicht legen. Die Zeichnung wird
   * mitverschoben, damit sie auf dem Luftbild an derselben Stelle bleibt.
   */
  recenterMap() {
    const t = this.plan.garden;
    if (t.latitude == null || t.longitude == null) return;
    const { cx: e, cy: s } = this.view;
    this.remember(), [t.latitude, t.longitude] = vt([e, s], [t.latitude, t.longitude]).map(
      (n) => Math.round(n * 1e7) / 1e7
    );
    const i = (n) => [m(n[0] - e), m(n[1] - s)];
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
        const t = this._hass?.language ?? "de";
        this.searchResults = await Pt(
          (e) => this._hass.callWS(e),
          this.searchQuery,
          t
        ), this.searchResults.length || (this.searchError = "Nichts gefunden. Probiere Straße, Hausnummer und Ort.");
      } catch (t) {
        this.searchResults = null, this.searchError = this.message(t);
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
  goToPlace(t) {
    const e = this.plan.garden, s = 1 / Se(t.latitude, 20.5);
    if (this.autoFit = !1, !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((n) => n.position) || e.latitude == null || e.longitude == null)
      this.remember(), e.latitude = Math.round(t.latitude * 1e7) / 1e7, e.longitude = Math.round(t.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: s }, this.searchPin = { point: [0, 0], name: t.name }, this.changed(), this.showToast(`${t.name}: Kartenmitte gesetzt. Fein ausrichten mit „Mitte hier festlegen“.`);
    else {
      const n = yt(t.latitude, t.longitude, [e.latitude, e.longitude]);
      this.view = { cx: n[0], cy: n[1], scale: s }, this.searchPin = { point: n, name: t.name }, this.showToast(`${t.name} angezeigt. „Mitte hier festlegen“ übernimmt die Stelle.`);
    }
    this.searchResults = null;
  }
  renderSearch() {
    return !this.searchOpen || this.tool !== "select" || this.plan.garden.background !== "map" ? c : h`
      <div class="search" @pointerdown=${(t) => t.stopPropagation()}>
        <form
          @submit=${(t) => {
      t.preventDefault(), this.runSearch();
    }}
        >
          <ha-icon icon="mdi:magnify"></ha-icon>
          <input
            id="address"
            type="search"
            placeholder="Adresse, z. B. Hauptstraße 5, Ort"
            autocomplete="street-address"
            .value=${this.searchQuery}
            @input=${(t) => this.searchQuery = t.target.value}
            @keydown=${(t) => t.key === "Escape" && this.closeSearch()}
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
      (t) => h`<li>
                  <button type="button" @click=${() => this.goToPlace(t)}>
                    <ha-icon icon="mdi:map-marker"></ha-icon>
                    <span><strong>${t.name}</strong><small>${t.detail}</small></span>
                  </button>
                </li>`
    )}
            </ul>` : c}
        <p class="search-note">${St}. Die Adresse geht nur an die Suche und wird nicht gespeichert.</p>
      </div>
    `;
  }
  /** Umschalter für die Kartenansicht (Luftbild, Karte, …) direkt auf dem Plan. */
  renderLayers() {
    const t = this.plan.garden;
    if (!this.layersOpen || t.background !== "map") return c;
    const e = Object.entries(this.plan.providers).map(
      ([s, i]) => [s, i.short ?? i.name, i.kind === "map" ? "mdi:map-outline" : "mdi:satellite-variant"]
    );
    return t.map_url && e.push(["custom", "Eigene Adresse", "mdi:web"]), h`
      <div class="layers" role="menu" @pointerdown=${(s) => s.stopPropagation()}>
        ${e.map(
      ([s, i, n]) => h`<button
            role="menuitemradio"
            aria-checked=${t.map_provider === s ? "true" : "false"}
            class=${t.map_provider === s ? "active" : ""}
            @click=${() => {
        t.map_provider !== s && this.updateGarden({ map_provider: s }), this.layersOpen = !1;
      }}
          >
            <ha-icon icon=${n}></ha-icon>${i}
          </button>`
    )}
      </div>
    `;
  }
  moveToHome() {
    const t = this.plan.garden, e = this.plan.home;
    this.remember(), t.latitude = e.latitude, t.longitude = e.longitude, this.view = { ...this.view, cx: 0, cy: 0 }, this.changed();
  }
  applyScale() {
    const t = parseFloat(this.scaleInput.replace(",", "."));
    if (this.scaleDraft.length < 2 || !(t > 0)) {
      this.showToast("Zwei Punkte wählen und den echten Abstand in Metern eingeben", !0);
      return;
    }
    if (k(this.scaleDraft[0], this.scaleDraft[1]) < 2) {
      this.showToast("Die beiden Punkte liegen zu nah beieinander", !0);
      return;
    }
    const e = (s) => [Math.round(s[0] * 10) / 10, Math.round(s[1] * 10) / 10];
    this.updateGarden({
      scale_points: [e(this.scaleDraft[0]), e(this.scaleDraft[1])],
      scale_distance_m: t
    }), this.cancelTool(), this.fitView(), this.showToast("Maßstab gesetzt");
  }
  // Gießen ---------------------------------------------------------------------
  async waterNow(t) {
    const e = this.status?.zones[t.id]?.planned_s || t.duration_s || 0;
    if (!e) {
      this.showToast("Keine Gießdauer: kein Bedarf und keine Dauer von Hand", !0);
      return;
    }
    try {
      await this._hass.callService(C, "run_zone", { zone_id: t.id, duration: e }), this.showToast(`${t.name}: ${Ce(e)} eingereiht`);
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
    const t = this.status;
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
        ${t ? h`<div class="chips">
              ${t.winter_mode ? h`<span class="chip winter"><ha-icon icon="mdi:snowflake"></ha-icon>Winterpause</span>` : h`<span class="chip ${t.automatic ? "on" : ""}"
                    ><ha-icon icon=${t.automatic ? "mdi:calendar-check" : "mdi:calendar-remove"}></ha-icon
                    >${t.automatic ? "Automatik an" : "Automatik aus"}</span
                  >`}
              ${t.problems.length ? h`<span class="chip alarm" title=${t.problems.join(`
`)}
                    ><ha-icon icon="mdi:alert"></ha-icon>${t.problems.length} Problem${t.problems.length > 1 ? "e" : ""}</span
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
    const { w: t, h: e } = this.size, { cx: s, cy: i, scale: n } = this.view, r = `translate(${t / 2} ${e / 2}) scale(${n}) translate(${-s} ${-i})`, a = 1 / n, o = this.tool === "select" ? this.drag?.type === "pan" ? "grabbing" : "grab" : "crosshair";
    return h`
      <svg
        class="plan"
        width=${t}
        height=${e}
        style="cursor:${o}"
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @wheel=${this.onWheel}
        @dblclick=${(l) => {
      this.tool === "bed" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishBed()), this.tool === "feature" && M(this.featureKind) !== "point" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishFeature());
    }}
      >
        <g transform=${r}>
          ${this.renderBackground(a)}
          <g class="features">${this.renderFeatures(a)}</g>
          ${this.plan.zones.map((l, d) => this.renderZone(l, d, a))}
          ${this.renderSelectedHandles(a)} ${this.renderFeatureHandles(a)}
          ${this.renderDraft(a)} ${this.renderScaleDraft(a)} ${this.renderMeasure(a)}
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
    const { cx: t, cy: e, scale: s } = this.view, i = this.size.w / 2 / s, n = this.size.h / 2 / s;
    return { x0: t - i, y0: e - n, x1: t + i, y1: e + n };
  }
  renderBackground(t) {
    const e = this.plan.garden, s = this.visibleBox(), i = [];
    if (e.background === "map" && e.latitude != null && e.longitude != null) {
      const a = this.tileTemplate();
      if (a) {
        const o = this.plan.providers[e.map_provider ?? ""], l = o?.max_zoom ?? 20, d = Math.max(
          1,
          Math.min(l, Math.round(Pe(e.latitude, this.view.scale * (window.devicePixelRatio > 1 ? 1.4 : 1))))
        ), p = ze(a, [e.latitude, e.longitude], s, d);
        i.push(u`<rect x=${s.x0} y=${s.y0} width=${s.x1 - s.x0} height=${s.y1 - s.y0} class="map-fill"></rect>`);
        const g = t * 0.5, y = (v) => v.map(
          (x) => u`<image href=${x.url} x=${x.x - g} y=${x.y - g} width=${x.size + 2 * g} height=${x.size + 2 * g} preserveAspectRatio="none" crossorigin="anonymous"></image>`
        );
        i.push(...y(p)), o?.overlay && e.map_provider !== "custom" && i.push(...y(ze(o.overlay, [e.latitude, e.longitude], s, d)));
      }
    } else if (e.background === "image" && this.imageUrl && this.imageSize) {
      const a = this.imageMpp();
      i.push(
        u`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * a} height=${this.imageSize[1] * a} preserveAspectRatio="none"></image>`
      );
    }
    const n = [u`<g class="bg" opacity=${e.background_opacity ?? 1}>${i}</g>`], r = (e.background_opacity ?? 1) < 0.35;
    return (e.background !== "map" || r) && n.push(this.renderGrid(s, t, e.background === "image" && !r)), n;
  }
  renderGrid(t, e, s) {
    const i = Le(40 * e), n = [], r = i * 5;
    for (let a = Math.floor(t.x0 / i) * i; a <= t.x1; a += i) {
      const o = Math.abs(a / r - Math.round(a / r)) < 1e-6;
      n.push(u`<line x1=${a} y1=${t.y0} x2=${a} y2=${t.y1} class=${o ? "grid major" : "grid"}></line>`);
    }
    for (let a = Math.floor(t.y0 / i) * i; a <= t.y1; a += i) {
      const o = Math.abs(a / r - Math.round(a / r)) < 1e-6;
      n.push(u`<line x1=${t.x0} y1=${a} x2=${t.x1} y2=${a} class=${o ? "grid major" : "grid"}></line>`);
    }
    return u`<g class=${s ? "grid-layer faint" : "grid-layer"}>${n}</g>`;
  }
  tileTemplate() {
    const t = this.plan.garden;
    return t.map_provider === "custom" ? t.map_url ?? "" : this.plan.providers[t.map_provider ?? ""]?.url ?? "";
  }
  zoneColor(t) {
    return Ee[t % Ee.length];
  }
  renderZone(t, e, s) {
    const i = this.zoneColor(e), n = this.status?.zones[t.id]?.state ?? "idle", r = this.selected?.kind === "zone" && this.selected.id === t.id, a = `zone ${n} ${r ? "selected" : ""} ${t.enabled ? "" : "disabled"}`;
    let o, l = null;
    if (t.type === "sprinkler" && t.center && t.radius_m ? (o = u`<path d=${$t(t.center, t.radius_m, t.start_angle_deg, t.arc_deg)}></path>`, l = t.arc_deg >= 360 ? t.center : w(t.center, t.radius_m * 0.55, t.start_angle_deg + t.arc_deg / 2)) : t.type !== "sprinkler" && t.polygon.length >= 3 && (o = u`<polygon points=${t.polygon.map((p) => p.join(",")).join(" ")}></polygon>`, l = Ae(t.polygon)), !o) return c;
    const d = G(t);
    return u`
      <g class=${a} style="--zone:${i}"
        @pointerdown=${(p) => {
      this.tool === "select" && (this.selected = { kind: "zone", id: t.id }, this.tab = "zones", this.startDrag(p, { type: "move-zone", id: t.id, start: this.toPlan(p), orig: structuredClone(t) }));
    }}>
        ${o}
        ${l ? u`<text x=${l[0]} y=${l[1]} font-size=${13 * s} stroke-width=${3 * s} class="label">
              <tspan x=${l[0]} dy="0">${t.name}</tspan>
              <tspan x=${l[0]} dy=${15 * s} class="sub">${R(d)}${se[n] ? ` · ${se[n]}` : ""}</tspan>
            </text>` : c}
      </g>`;
  }
  renderSelectedHandles(t) {
    if (this.tool !== "select" || this.selected?.kind !== "zone") return c;
    const e = this.zone(this.selected.id), s = 7 * t, i = (n, r, a = "", o = "") => u`<circle class="handle ${a}" cx=${n[0]} cy=${n[1]} r=${s}
        @pointerdown=${(l) => this.startDrag(l, r)}><title>${o}</title></circle>`;
    if (e.type === "sprinkler" && e.center && e.radius_m) {
      const n = e.center, r = e.arc_deg >= 360, a = r ? e.start_angle_deg + 135 : e.start_angle_deg + e.arc_deg / 2, o = [
        u`<line class="guide" x1=${n[0]} y1=${n[1]} x2=${w(n, e.radius_m, e.start_angle_deg)[0]} y2=${w(n, e.radius_m, e.start_angle_deg)[1]}></line>`,
        i(n, { type: "center", id: e.id }, "center", "Mittelpunkt verschieben"),
        i(w(n, e.radius_m, a), { type: "radius", id: e.id }, "radius", "Reichweite ändern"),
        i(w(n, e.radius_m, e.start_angle_deg), { type: "start", id: e.id }, "angle", "Anfang des Bogens")
      ];
      return r ? o.push(
        i(w(n, e.radius_m * 0.8, e.start_angle_deg + 20), { type: "end", id: e.id }, "angle small", "Bogen öffnen")
      ) : o.push(
        i(w(n, e.radius_m, e.start_angle_deg + e.arc_deg), { type: "end", id: e.id }, "angle", "Ende des Bogens")
      ), o;
    }
    if (e.type !== "sprinkler" && e.polygon.length >= 3) {
      const n = e.polygon;
      return [
        ...n.map((r, a) => {
          const o = n[(a + 1) % n.length], l = [(r[0] + o[0]) / 2, (r[1] + o[1]) / 2];
          return u`<circle class="handle mid" cx=${l[0]} cy=${l[1]} r=${s * 0.7}
            @pointerdown=${(d) => this.insertVertex(d, e, a)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
        }),
        ...n.map(
          (r, a) => u`<circle class="handle" cx=${r[0]} cy=${r[1]} r=${s}
            @pointerdown=${(o) => this.startDrag(o, { type: "vertex", id: e.id, index: a })}
            @contextmenu=${(o) => this.removeVertex(o, e, a)}
            @dblclick=${(o) => this.removeVertex(o, e, a)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
        )
      ];
    }
    return c;
  }
  renderFeatures(t) {
    return this.features.map((e) => {
      const s = this.selected?.kind === "feature" && this.selected.id === e.id, i = M(e.kind), n = (l) => {
        this.tool === "select" && (this.selected = { kind: "feature", id: e.id }, this.tab = "plan", this.startDrag(l, { type: "f-move", id: e.id, start: this.toPlan(l), orig: structuredClone(e) }));
      }, r = `feature ${e.kind} ${s ? "selected" : ""}`;
      if (i === "area") {
        const l = Ae(e.points);
        return u`<polygon class=${r} points=${e.points.map((d) => d.join(",")).join(" ")}
          @pointerdown=${n}><title>${O(e)}</title></polygon>
          ${e.label ? u`<text class="feature-name" x=${l[0]} y=${l[1]} dy=${4 * t} font-size=${12 * t}
                stroke-width=${3 * t}>${e.label}</text>` : c}`;
      }
      if (i === "line")
        return u`<g class=${r} @pointerdown=${n}>
          <polyline class="hit" points=${e.points.map((l) => l.join(",")).join(" ")} stroke-width=${12 * t}></polyline>
          <polyline points=${e.points.map((l) => l.join(",")).join(" ")}></polyline>
          <title>${O(e)}</title></g>`;
      const [a, o] = e.points[0];
      return e.kind === "tree" ? u`<g class=${r} @pointerdown=${n}>
          <circle cx=${a} cy=${o} r=${e.radius_m ?? 1}></circle>
          <circle class="trunk" cx=${a} cy=${o} r=${3 * t}></circle>
          <title>${O(e)}</title></g>` : e.kind === "label" ? u`<text class=${r} x=${a} y=${o} font-size=${14 * t} stroke-width=${3 * t}
          @pointerdown=${n}>${e.label}</text>` : u`<g class=${r} @pointerdown=${n}>
        <circle cx=${a} cy=${o} r=${8 * t}></circle>
        <text x=${a} y=${o} dy=${4 * t} font-size=${11 * t}>H</text>
        <title>${O(e)}</title></g>`;
    });
  }
  renderFeatureHandles(t) {
    if (this.tool !== "select" || this.selected?.kind !== "feature") return c;
    const e = this.feature(this.selected.id);
    if (!e) return c;
    const s = 7 * t, i = M(e.kind);
    if (i === "point") {
      if (e.kind !== "tree") return c;
      const [o, l] = e.points[0], d = w(e.points[0], e.radius_m ?? 1, 135);
      return u`
        <circle class="handle center" cx=${o} cy=${l} r=${s}
          @pointerdown=${(p) => this.startDrag(p, { type: "f-move", id: e.id, start: this.toPlan(p), orig: structuredClone(e) })}></circle>
        <circle class="handle" cx=${d[0]} cy=${d[1]} r=${s}
          @pointerdown=${(p) => this.startDrag(p, { type: "f-radius", id: e.id })}><title>Kronengröße</title></circle>`;
    }
    const n = e.points;
    return [
      ...(i === "area" ? n : n.slice(0, -1)).map((o, l) => {
        const d = n[(l + 1) % n.length], p = [(o[0] + d[0]) / 2, (o[1] + d[1]) / 2];
        return u`<circle class="handle mid" cx=${p[0]} cy=${p[1]} r=${s * 0.7}
        @pointerdown=${(g) => this.insertFeatureVertex(g, e, l)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
      }),
      ...n.map(
        (o, l) => u`<circle class="handle" cx=${o[0]} cy=${o[1]} r=${s}
          @pointerdown=${(d) => this.startDrag(d, { type: "f-vertex", id: e.id, index: l })}
          @contextmenu=${(d) => this.removeFeatureVertex(d, e, l)}
          @dblclick=${(d) => this.removeFeatureVertex(d, e, l)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
      )
    ];
  }
  insertFeatureVertex(t, e, s) {
    if (this.tool !== "select") return;
    t.stopPropagation(), this.remember();
    const i = e.points[s], n = e.points[(s + 1) % e.points.length];
    e.points.splice(s + 1, 0, [m((i[0] + n[0]) / 2), m((i[1] + n[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(t.pointerId), this.drag = { type: "f-vertex", id: e.id, index: s + 1 };
  }
  removeFeatureVertex(t, e, s) {
    t.preventDefault(), t.stopPropagation();
    const i = M(e.kind) === "area" ? 3 : 2;
    if (e.points.length <= i) {
      this.showToast(`${S[e.kind].label}: mindestens ${i} Punkte`, !0);
      return;
    }
    this.remember(), e.points.splice(s, 1), this.changed();
  }
  /** Messwerkzeug: Strecken mit Längen und Summe. */
  renderMeasure(t) {
    if (this.tool !== "measure" || !this.measurePts.length) return c;
    const e = this.hover ? [...this.measurePts, this.hover] : this.measurePts, s = e.slice(1).map((i, n) => {
      const r = e[n];
      if (k(r, i) < 0.01) return c;
      const a = [(r[0] + i[0]) / 2, (r[1] + i[1]) / 2];
      return u`<text class="measure-label" x=${a[0]} y=${a[1]} dy=${-6 * t} font-size=${13 * t}
        stroke-width=${3 * t}>${W(k(r, i))}</text>`;
    });
    return u`<g class="measure">
      <polyline points=${e.map((i) => i.join(",")).join(" ")}></polyline>
      ${this.measurePts.map((i) => u`<circle cx=${i[0]} cy=${i[1]} r=${4 * t}></circle>`)}
      ${s}
    </g>`;
  }
  renderSnapHint(t) {
    return this.snapHint ? u`<circle class="snap-hint" cx=${this.snapHint[0]} cy=${this.snapHint[1]} r=${9 * t}></circle>` : c;
  }
  renderDraft(t) {
    if (this.tool === "feature" && this.draft.length) {
      const i = this.hover ? [...this.draft, this.hover] : this.draft, n = M(this.featureKind) === "area";
      return u`
        <g class="draft feature-draft ${this.featureKind}">
          <polyline points=${[...i, ...n && i.length > 2 ? [i[0]] : []].map((r) => r.join(",")).join(" ")}></polyline>
          ${this.draft.map((r, a) => u`<circle cx=${r[0]} cy=${r[1]} r=${(a === 0 ? 7 : 5) * t}></circle>`)}
        </g>`;
    }
    if (this.tool !== "bed" || !this.draft.length) return c;
    const e = this.hover ? [...this.draft, this.hover] : this.draft, s = this.plan.zones.findIndex((i) => i.id === this.toolTarget);
    return u`
      <g class="draft" style="--zone:${this.zoneColor(s)}">
        <polyline points=${e.map((i) => i.join(",")).join(" ")}></polyline>
        ${this.draft.map(
      (i, n) => u`<circle cx=${i[0]} cy=${i[1]} r=${(n === 0 ? 8 : 5) * t} class=${n === 0 ? "first" : ""}></circle>`
    )}
      </g>`;
  }
  renderScaleDraft(t) {
    if (this.tool !== "scale") return c;
    const e = this.imageMpp(), s = this.scaleDraft.map((i) => [i[0] * e, i[1] * e]);
    return u`<g class="scale-draft">
      ${s.length === 2 ? u`<line x1=${s[0][0]} y1=${s[0][1]} x2=${s[1][0]} y2=${s[1][1]}></line>` : c}
      ${s.map((i) => u`<circle cx=${i[0]} cy=${i[1]} r=${6 * t}></circle>`)}
    </g>`;
  }
  renderMarker(t, e, s) {
    if (!e.position) return c;
    const [i, n] = e.position, r = this.selected?.kind === t && this.selected.id === e.id, a = t === "valve" ? "V" : Te[e.kind] ?? "S", o = 11 * s;
    return u`
      <g class="marker ${t} ${r ? "selected" : ""}"
        @pointerdown=${(l) => {
      this.tool === "select" && (this.selected = { kind: t, id: e.id }, this.tab = "zones", this.startDrag(l, { type: "marker", kind: t, id: e.id }));
    }}>
        ${t === "valve" ? u`<rect x=${i - o} y=${n - o} width=${2 * o} height=${2 * o} rx=${4 * s}></rect>` : u`<circle cx=${i} cy=${n} r=${o}></circle>`}
        <text x=${i} y=${n} font-size=${12 * s} dy=${4.2 * s}>${a}</text>
        <title>${e.name}</title>
      </g>`;
  }
  renderOverlay() {
    const t = this.plan.garden, e = this.toolBanner(), s = Rt(this.view.scale), i = t.background === "map" ? this.plan.providers[t.map_provider ?? ""] : void 0;
    return h`
      <div class="tools">
        <button class="icon" title="Vergrößern" @click=${() => this.zoomBy(1.4)}><ha-icon icon="mdi:plus"></ha-icon></button>
        <button class="icon" title="Verkleinern" @click=${() => this.zoomBy(1 / 1.4)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="icon" title="Alles zeigen" @click=${this.fitView}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
        <button class="icon ${this.tool === "measure" ? "on" : ""}" title="Abstand messen"
          @click=${() => this.tool === "measure" ? this.cancelTool() : this.startTool("measure")}>
          <ha-icon icon="mdi:tape-measure"></ha-icon>
        </button>
        ${t.background === "map" ? h`<button class="icon ${this.layersOpen ? "on" : ""}" title="Kartenansicht wechseln"
              @click=${() => this.layersOpen = !this.layersOpen}>
              <ha-icon icon="mdi:layers-outline"></ha-icon>
            </button>` : c}
        ${t.background === "map" ? h`<button class="icon ${this.searchOpen ? "on" : ""}" title="Adresse suchen"
              @click=${() => this.searchOpen ? this.closeSearch() : this.openSearch()}>
              <ha-icon icon="mdi:magnify"></ha-icon>
            </button>` : c}
      </div>
      ${e} ${this.renderSearch()} ${this.renderLayers()}
      <div class="compass" style="transform: rotate(${t.background === "image" ? -t.north_deg : 0}deg)" title="Norden">
        <svg viewBox="-12 -12 24 24"><path d="M0 -10 L4 2 L0 0 L-4 2 Z" class="n"></path><path d="M0 10 L4 2 L0 0 L-4 2 Z" class="s"></path></svg>
        <span>N</span>
      </div>
      <div class="scalebar"><div style="width:${s.px}px"></div><span>${s.label}</span></div>
      ${t.background === "map" ? h`<div class="attribution">${i?.attribution ?? "Eigener Kartendienst"}</div>` : c}
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
    return this.features.length > 0 || this.plan.zones.some((t) => G(t) !== null);
  }
  toolBanner() {
    if (this.tool === "select") return c;
    let t = "", e = c;
    const s = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    if (this.tool === "sprinkler" && (t = `${s}: Am Sprinkler drücken und bis zum Rand ziehen.`), this.tool === "bed" && (t = `${s}: Ecken anklicken, zum Schließen den ersten Punkt.`, e = h`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`), this.tool === "place" && (t = `${s}: Auf die Stelle im Plan klicken.`), this.tool === "feature") {
      const i = S[this.featureKind], n = i.family;
      t = n === "area" ? `${i.label}: Ecken anklicken, zum Schließen den ersten Punkt.` : n === "line" ? `${i.label}: Punkte anklicken, Doppelklick beendet.` : this.featureKind === "tree" ? `${i.label}: In die Mitte drücken und bis zum Kronenrand ziehen.` : `${i.label}: Auf die Stelle klicken.`, n !== "point" && (e = h`<button
          class="text"
          ?disabled=${this.draft.length < (n === "area" ? 3 : 2)}
          @click=${this.finishFeature}
        >
          Fertig
        </button>`);
    }
    if (this.tool === "measure") {
      const i = Me(this.measurePts);
      t = this.measurePts.length < 2 ? "Messen: Punkte anklicken. Alt-Taste: ohne Einrasten." : `Gemessen: ${W(i)}${this.measurePts.length > 2 ? " (Summe)" : ""}`, this.measurePts.length && (e = h`<button class="text" @click=${() => this.measurePts = []}>Neu</button>`);
    }
    return this.tool === "scale" && (t = this.scaleDraft.length < 2 ? "Maßstab: Zwei Punkte im Bild anklicken, deren Abstand du kennst (z. B. die Ecken der Terrasse)." : "Abstand eingeben:", this.scaleDraft.length === 2 && (e = h`<input
            class="small"
            type="text"
            inputmode="decimal"
            placeholder="Meter"
            .value=${this.scaleInput}
            @input=${(i) => this.scaleInput = i.target.value}
            @keydown=${(i) => i.key === "Enter" && this.applyScale()}
          /><span>m</span>
          <button class="text" @click=${this.applyScale}>Übernehmen</button>`)), h`<div class="banner">
      <span>${t}</span>${e}
      <button class="text" @click=${this.cancelTool}>Abbrechen</button>
    </div>`;
  }
  zoneOrMarkerName(t) {
    if (t.includes(":")) {
      const [e, s] = t.split(":");
      return this.marker(e, s)?.name ?? "";
    }
    return this.zone(t)?.name ?? "";
  }
  // Seitenleiste ---------------------------------------------------------------
  renderZonesTab() {
    const t = this.plan;
    if (!t.zones.length)
      return h`<p class="hint">
        Noch keine Zonen. Zonen und Ventile legst du unter Einstellungen → Geräte & Dienste →
        Bewässerungsplaner → Konfigurieren an.
      </p>`;
    const e = this.selected;
    return h`
      <ul class="list">
        ${t.zones.map((s, i) => this.renderZoneItem(s, i, e?.kind === "zone" && e.id === s.id))}
      </ul>
      ${t.valves.length || t.sensors.length ? h`<h3>Ventile und Sensoren</h3>
            <ul class="list compact">
              ${t.valves.map((s) => this.renderMarkerItem("valve", s))}
              ${t.sensors.map((s) => this.renderMarkerItem("sensor", s))}
            </ul>` : c}
      <p class="hint small">
        Ziehen verschiebt die Ansicht, das Mausrad zoomt. Gezeichnete Flächen ersetzen die Fläche
        von Hand bei der Berechnung. Namen, Pflanzen und Ventile änderst du in den Einstellungen der
        Integration.
      </p>
    `;
  }
  renderZoneItem(t, e, s) {
    const i = this.status?.zones[t.id], n = G(t), r = n !== null, a = t.type === "sprinkler";
    return h`
      <li class="item ${s ? "open" : ""}" style="--zone:${this.zoneColor(e)}">
        <div class="row" @click=${() => {
      this.selected = s ? null : { kind: "zone", id: t.id };
    }}>
          <span class="dot"></span>
          <ha-icon icon=${a ? "mdi:sprinkler-variant" : "mdi:water-outline"}></ha-icon>
          <span class="name">${t.name}</span>
          ${i && i.state !== "idle" ? h`<span class="badge ${i.state}">${se[i.state]}</span>` : c}
          <span class="meta">${r ? R(n) : h`<em>nicht gezeichnet</em>`}</span>
        </div>
        ${s ? this.renderInspector(t, i) : c}
      </li>
    `;
  }
  renderInspector(t, e) {
    const s = t.type === "sprinkler", i = G(t), n = i !== null, r = s ? "sprinkler" : "bed", a = (o, l, d, p, g = 0.1) => h`<label class="field">
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
        <dl>
          <dt>Fläche gezeichnet</dt>
          <dd>${n ? R(i) : "–"}</dd>
          <dt>Fläche von Hand</dt>
          <dd>${t.area_m2 ? R(t.area_m2) : "–"}</dd>
          ${t.overlap_m2 > 0.05 ? h`<dt>Überschneidung</dt><dd class="warn">${R(t.overlap_m2)} mit anderen Zonen</dd>` : c}
          ${e ? h`<dt>Bedarf</dt><dd>${e.need_mm.toFixed(1)} mm</dd>
                <dt>Geplant</dt><dd>${e.planned_s ? Ce(e.planned_s) : "nicht gießen"}
                  <span class="reason">(${e.reason})</span></dd>` : c}
          ${e?.locked_reason ? h`<dt>Gesperrt</dt><dd class="warn">${e.locked_reason}</dd>` : c}
        </dl>
        ${s && n ? h`<div class="fields">
              ${a("Reichweite", t.radius_m, "m", (o) => t.radius_m = Math.max(0.1, o))}
              ${a("Richtung", t.start_angle_deg, "°", (o) => t.start_angle_deg = (o % 360 + 360) % 360, 5)}
              ${a("Bogen", t.arc_deg, "°", (o) => t.arc_deg = Math.min(360, Math.max(1, o)), 5)}
            </div>
            <p class="hint small">Richtung: Anfang des Bogens, 0° = Norden (oben), 90° = Osten.</p>` : c}
        ${!s && n ? this.renderEdges(t.polygon, !0, (o) => t.polygon = o) : c}
        <div class="actions">
          <button class="text" @click=${() => this.startTool(r, t.id)}>
            <ha-icon icon=${n ? "mdi:pencil" : "mdi:draw"}></ha-icon>${n ? "Neu zeichnen" : "Zeichnen"}
          </button>
          ${n ? h`<button class="text danger" @click=${() => this.clearGeometry(t.id)}>
                <ha-icon icon="mdi:eraser"></ha-icon>Entfernen
              </button>` : c}
          <span class="spacer"></span>
          <button class="text" title="In die Warteschlange einreihen" ?disabled=${this.status?.winter_mode}
            @click=${() => this.waterNow(t)}>
            <ha-icon icon="mdi:watering-can"></ha-icon>Jetzt gießen
          </button>
        </div>
      </div>
    `;
  }
  renderMarkerItem(t, e) {
    const s = this.selected?.kind === t && this.selected.id === e.id, i = t === "valve" ? e.safety_level === "device" ? "schließt selbst" : "nur Home Assistant" : Tt[e.kind] ?? "";
    return h`
      <li class="item ${s ? "open" : ""}">
        <div class="row" @click=${() => this.selected = { kind: t, id: e.id }}>
          <span class="marker-icon ${t}">${t === "valve" ? "V" : Te[e.kind] ?? "S"}</span>
          <span class="name">${e.name}<small>${i}</small></span>
          <button class="text small" @click=${(n) => {
      n.stopPropagation(), this.startTool("place", `${t}:${e.id}`);
    }}>${e.position ? "Versetzen" : "Platzieren"}</button>
          ${e.position ? h`<button class="icon small" title="Vom Plan nehmen" @click=${(n) => {
      n.stopPropagation(), this.remember(), e.position = null, this.changed(), this.removed(`${e.name}: vom Plan genommen`);
    }}><ha-icon icon="mdi:close"></ha-icon></button>` : c}
        </div>
      </li>
    `;
  }
  /** Regler für die Deckkraft des Luftbilds oder Bilds (zum Abpausen). */
  renderOpacity() {
    const t = this.plan.garden;
    if (t.background === "none") return c;
    const e = Math.round((t.background_opacity ?? 1) * 100);
    return h`
      <label class="slider">
        <span>${t.background === "map" ? "Luftbild" : "Bild"} sichtbar</span>
        <input
          id="opacity"
          type="range"
          min="0"
          max="100"
          step="5"
          .value=${String(e)}
          @pointerdown=${() => this.remember()}
          @keydown=${() => this.remember()}
          @input=${(s) => {
      this.plan.garden.background_opacity = Number(s.target.value) / 100, this.changed();
    }}
        />
        <output>${e} %</output>
      </label>
    `;
  }
  /** Kantenlängen ansehen und als Zahl eintippen (genauer als das Luftbild). */
  renderEdges(t, e, s) {
    const i = kt(t, e);
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
        o > 0 && (this.remember(), s(wt(t, r, o).map((l) => [m(l[0]), m(l[1])])), this.changed());
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
    const t = this.selected?.kind === "feature" ? this.feature(this.selected.id) : null, e = (s) => {
      const i = S[s], n = this.tool === "feature" && this.featureKind === s;
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
      <div class="palette">${["building", "paving", "water", "area"].map(e)}</div>
      <h3>Linien</h3>
      <div class="palette">${["fence", "hedge", "boundary", "pipe"].map(e)}</div>
      <h3>Punkte</h3>
      <div class="palette">${["tree", "tap", "label"].map(e)}</div>
      <label class="check">
        <input type="checkbox" .checked=${this.snapOn} @change=${(s) => this.snapOn = s.target.checked} />
        An Ecken einrasten <small>(Alt-Taste: kurz aus)</small>
      </label>
      ${this.features.length ? h`<h3>Im Plan (${this.features.length})</h3>
            <ul class="list compact">
              ${this.features.map((s) => this.renderFeatureItem(s, t?.id === s.id))}
            </ul>` : c}
    `;
  }
  renderFeatureItem(t, e) {
    const s = S[t.kind], i = s?.family ?? "area", n = i === "area" ? R(Fe(t.points)) : i === "line" ? W(Me(t.points)) : t.kind === "tree" ? `Ø ${W(2 * (t.radius_m ?? 0))}` : "", r = Object.entries(S).filter(([, a]) => a.family === i);
    return h`
      <li class="item ${e ? "open" : ""}">
        <div class="row" @click=${() => this.selected = e ? null : { kind: "feature", id: t.id }}>
          <ha-icon icon=${s?.icon ?? "mdi:shape-outline"}></ha-icon>
          <span class="name">${O(t)}</span>
          <span class="meta">${n}</span>
        </div>
        ${e ? h`<div class="inspector">
              ${t.kind !== "label" && r.length > 1 ? h`<label class="field wide">
                    <span>Art</span>
                    <select
                      .value=${t.kind}
                      @change=${(a) => {
      this.remember(), t.kind = a.target.value, this.changed();
    }}
                    >
                      ${r.map(([a, o]) => h`<option value=${a} ?selected=${a === t.kind}>${o.label}</option>`)}
                    </select>
                  </label>` : c}
              <label class="field wide">
                <span>${t.kind === "label" ? "Text" : "Name (optional)"}</span>
                <input
                  id=${t.kind === "label" ? "feature-label" : "feature-name"}
                  type="text"
                  maxlength=${_t}
                  .value=${t.label ?? ""}
                  @change=${(a) => {
      const o = a.target.value.trim();
      t.kind === "label" && !o || (this.remember(), t.label = o || null, this.changed());
    }}
                />
              </label>
              ${t.kind === "tree" ? h`<label class="field wide">
                    <span>Kronendurchmesser</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      .value=${(2 * (t.radius_m ?? 0)).toFixed(1)}
                      @change=${(a) => {
      const o = parseFloat(a.target.value);
      o > 0 && (this.remember(), t.radius_m = m(o / 2), this.changed());
    }}
                    />
                    <span class="unit">m</span>
                  </label>` : c}
              ${i !== "point" ? this.renderEdges(t.points, i === "area", (a) => t.points = a) : c}
              <div class="actions">
                <span class="spacer"></span>
                <button class="text danger" @click=${() => this.deleteFeature(t.id)}>
                  <ha-icon icon="mdi:delete-outline"></ha-icon>Entfernen
                </button>
              </div>
            </div>` : c}
      </li>
    `;
  }
  renderBackgroundTab() {
    const t = this.plan.garden, e = this.plan.providers, s = (i, n, r, a) => h`
      <button class="choice ${t.background === i ? "active" : ""}" @click=${() => this.setBackground(i)}>
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
      ${t.background === "map" ? this.renderMapSettings(t, e) : c}
      ${t.background === "image" ? this.renderImageSettings(t) : c}
    `;
  }
  renderMapSettings(t, e) {
    return h`
      <h3>Kartendienst</h3>
      <select
        .value=${t.map_provider ?? "basemap_at"}
        @change=${(s) => this.updateGarden({ map_provider: s.target.value })}
      >
        ${Object.entries(e).map(
      ([s, i]) => h`<option value=${s} ?selected=${t.map_provider === s}>${i.name}</option>`
    )}
        <option value="custom" ?selected=${t.map_provider === "custom"}>Eigene Adresse …</option>
      </select>
      ${t.map_provider === "esri" ? h`<p class="note warn">
            Esri erlaubt die Nutzung nur nach seinen Nutzungsbedingungen. Für den privaten Garten ist das
            meist in Ordnung; prüfe es bitte selbst.
          </p>` : c}
      ${t.map_provider?.startsWith("basemap_at") ? h`<p class="note">Von basemap.at, nur in Österreich. Lizenz CC BY 4.0.</p>` : c}
      ${t.map_provider === "osm" ? h`<p class="note">
            OpenStreetMap-Karte, weltweit. Bitte nur gelegentlich nutzen (Regeln der OpenStreetMap-Kacheln).
          </p>` : c}
      <p class="hint small">Schneller umschalten: Ebenen-Knopf links auf der Karte.</p>
      ${t.map_provider === "custom" ? h`<label class="field wide">
              <span>Adresse mit {z}, {x}, {y}</span>
              <input type="url" placeholder="https://…/{z}/{x}/{y}.jpg" .value=${t.map_url ?? ""}
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
  renderImageSettings(t) {
    const e = !!(t.scale_points && t.scale_distance_m);
    return h`
      <h3>Bild</h3>
      <label class="upload">
        <input type="file" accept="image/png,image/jpeg,image/webp" @change=${this.upload} />
        <ha-icon icon="mdi:upload"></ha-icon>${t.background_image ? "Anderes Bild hochladen" : "Bild hochladen"}
      </label>
      <p class="hint small">PNG, JPEG oder WebP, höchstens 15 MB.</p>
      ${t.background_image ? h`
            <h3>Maßstab</h3>
            <p class=${e ? "note" : "note warn"}>
              ${e ? h`Gesetzt: ${t.scale_distance_m} m zwischen zwei Punkten (${(this.imageMpp() * 100).toFixed(1)} cm je Bildpunkt).` : "Noch kein Maßstab. Ohne ihn stimmen die Flächen nicht, und der Plan lässt sich nicht speichern."}
            </p>
            <button class="text" @click=${() => this.startTool("scale")}>
              <ha-icon icon="mdi:ruler"></ha-icon>${e ? "Maßstab neu setzen" : "Maßstab setzen"}
            </button>
            <h3>Norden</h3>
            <label class="field">
              <span>Norden im Bild</span>
              <input type="number" step="5" .value=${String(t.north_deg)}
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
  Ue({ type: Boolean, reflect: !0 })
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
], f.prototype, "hover", 2);
f = b([
  gt("irrigation-planner-panel")
], f);
function m(t) {
  return Math.round(t * 100) / 100;
}
function Oe(t) {
  return Math.round(t / 5) * 5 % 360;
}
function G(t) {
  return t.type === "sprinkler" ? t.center && t.radius_m ? bt(t.radius_m, t.arc_deg) : null : t.polygon.length >= 3 ? Fe(t.polygon) : null;
}
function W(t) {
  return t < 1 ? `${Math.round(t * 100)} cm` : `${t.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m`;
}
function R(t) {
  return t == null ? "–" : `${t.toLocaleString("de-DE", { maximumFractionDigits: t < 10 ? 1 : 0 })} m²`;
}
function Ce(t) {
  if (t < 60) return `${t} s`;
  const e = Math.round(t / 60);
  return e >= 60 ? `${Math.floor(e / 60)} h ${e % 60} min` : `${e} min`;
}
function Le(t) {
  const e = 10 ** Math.floor(Math.log10(t));
  for (const s of [1, 2, 5, 10]) if (s * e >= t) return s * e;
  return 10 * e;
}
function Rt(t) {
  const e = Le(110 / t), s = e >= 1e3 ? `${e / 1e3} km` : e >= 1 ? `${e} m` : `${e * 100} cm`;
  return { px: e * t, label: s };
}
export {
  f as IrrigationPlannerPanel
};
