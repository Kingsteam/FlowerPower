/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const F = globalThis, Q = F.ShadowRoot && (F.ShadyCSS === void 0 || F.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ee = Symbol(), ce = /* @__PURE__ */ new WeakMap();
let ze = class {
  constructor(e, s, i) {
    if (this._$cssResult$ = !0, i !== ee) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (Q && e === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (e = ce.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && ce.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const De = (t) => new ze(typeof t == "string" ? t : t + "", void 0, ee), He = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((i, n, r) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + t[r + 1], t[0]);
  return new ze(s, t, ee);
}, Le = (t, e) => {
  if (Q) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const i = document.createElement("style"), n = F.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = s.cssText, t.appendChild(i);
  }
}, he = Q ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const i of e.cssRules) s += i.cssText;
  return De(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: je, defineProperty: Ze, getOwnPropertyDescriptor: Ve, getOwnPropertyNames: Fe, getOwnPropertySymbols: Ke, getPrototypeOf: We } = Object, G = globalThis, de = G.trustedTypes, Ge = de ? de.emptyScript : "", qe = G.reactiveElementPolyfillSupport, U = (t, e) => t, K = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Ge : null;
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
} }, te = (t, e) => !je(t, e), pe = { attribute: !0, type: String, converter: K, reflect: !1, useDefault: !1, hasChanged: te };
Symbol.metadata ??= Symbol("metadata"), G.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let P = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = pe) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(e, i, s);
      n !== void 0 && Ze(this.prototype, e, n);
    }
  }
  static getPropertyDescriptor(e, s, i) {
    const { get: n, set: r } = Ve(this.prototype, e) ?? { get() {
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
    return this.elementProperties.get(e) ?? pe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(U("elementProperties"))) return;
    const e = We(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(U("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(U("properties"))) {
      const s = this.properties, i = [...Fe(s), ...Ke(s)];
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
      for (const n of i) s.unshift(he(n));
    } else e !== void 0 && s.push(he(e));
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
    return Le(e, this.constructor.elementStyles), e;
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
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : K).toAttribute(s, i.type);
      this._$Em = e, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
    }
  }
  _$AK(e, s) {
    const i = this.constructor, n = i._$Eh.get(e);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : K;
      this._$Em = n;
      const o = a.fromAttribute(s, r.type);
      this[n] = o ?? this._$Ej?.get(n) ?? o, this._$Em = null;
    }
  }
  requestUpdate(e, s, i, n = !1, r) {
    if (e !== void 0) {
      const a = this.constructor;
      if (n === !1 && (r = this[e]), i ??= a.getPropertyOptions(e), !((i.hasChanged ?? te)(r, s) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, i)))) return;
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
P.elementStyles = [], P.shadowRootOptions = { mode: "open" }, P[U("elementProperties")] = /* @__PURE__ */ new Map(), P[U("finalized")] = /* @__PURE__ */ new Map(), qe?.({ ReactiveElement: P }), (G.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const se = globalThis, ue = (t) => t, W = se.trustedTypes, ge = W ? W.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Ee = "$lit$", k = `lit$${Math.random().toFixed(9).slice(2)}$`, Pe = "?" + k, Je = `<${Pe}>`, z = document, D = () => z.createComment(""), H = (t) => t === null || typeof t != "object" && typeof t != "function", ie = Array.isArray, Xe = (t) => ie(t) || typeof t?.[Symbol.iterator] == "function", X = `[ 	
\f\r]`, R = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, me = /-->/g, fe = />/g, S = RegExp(`>|${X}(?:([^\\s"'>=/]+)(${X}*=${X}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), be = /'/g, $e = /"/g, Te = /^(?:script|style|textarea|title)$/i, Oe = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), h = Oe(1), $ = Oe(2), T = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), ve = /* @__PURE__ */ new WeakMap(), M = z.createTreeWalker(z, 129);
function Ce(t, e) {
  if (!ie(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ge !== void 0 ? ge.createHTML(e) : e;
}
const Ye = (t, e) => {
  const s = t.length - 1, i = [];
  let n, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = R;
  for (let o = 0; o < s; o++) {
    const l = t[o];
    let d, u, p = -1, b = 0;
    for (; b < l.length && (a.lastIndex = b, u = a.exec(l), u !== null); ) b = a.lastIndex, a === R ? u[1] === "!--" ? a = me : u[1] !== void 0 ? a = fe : u[2] !== void 0 ? (Te.test(u[2]) && (n = RegExp("</" + u[2], "g")), a = S) : u[3] !== void 0 && (a = S) : a === S ? u[0] === ">" ? (a = n ?? R, p = -1) : u[1] === void 0 ? p = -2 : (p = a.lastIndex - u[2].length, d = u[1], a = u[3] === void 0 ? S : u[3] === '"' ? $e : be) : a === $e || a === be ? a = S : a === me || a === fe ? a = R : (a = S, n = void 0);
    const y = a === S && t[o + 1].startsWith("/>") ? " " : "";
    r += a === R ? l + Je : p >= 0 ? (i.push(d), l.slice(0, p) + Ee + l.slice(p) + k + y) : l + k + (p === -2 ? o : y);
  }
  return [Ce(t, r + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class L {
  constructor({ strings: e, _$litType$: s }, i) {
    let n;
    this.parts = [];
    let r = 0, a = 0;
    const o = e.length - 1, l = this.parts, [d, u] = Ye(e, s);
    if (this.el = L.createElement(d, i), M.currentNode = this.el.content, s === 2 || s === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (n = M.nextNode()) !== null && l.length < o; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const p of n.getAttributeNames()) if (p.endsWith(Ee)) {
          const b = u[a++], y = n.getAttribute(p).split(k), A = /([.?@])?(.*)/.exec(b);
          l.push({ type: 1, index: r, name: A[2], strings: y, ctor: A[1] === "." ? et : A[1] === "?" ? tt : A[1] === "@" ? st : q }), n.removeAttribute(p);
        } else p.startsWith(k) && (l.push({ type: 6, index: r }), n.removeAttribute(p));
        if (Te.test(n.tagName)) {
          const p = n.textContent.split(k), b = p.length - 1;
          if (b > 0) {
            n.textContent = W ? W.emptyScript : "";
            for (let y = 0; y < b; y++) n.append(p[y], D()), M.nextNode(), l.push({ type: 2, index: ++r });
            n.append(p[b], D());
          }
        }
      } else if (n.nodeType === 8) if (n.data === Pe) l.push({ type: 2, index: r });
      else {
        let p = -1;
        for (; (p = n.data.indexOf(k, p + 1)) !== -1; ) l.push({ type: 7, index: r }), p += k.length - 1;
      }
      r++;
    }
  }
  static createElement(e, s) {
    const i = z.createElement("template");
    return i.innerHTML = e, i;
  }
}
function O(t, e, s = t, i) {
  if (e === T) return e;
  let n = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const r = H(e) ? void 0 : e._$litDirective$;
  return n?.constructor !== r && (n?._$AO?.(!1), r === void 0 ? n = void 0 : (n = new r(t), n._$AT(t, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = n : s._$Cl = n), n !== void 0 && (e = O(t, n._$AS(t, e.values), n, i)), e;
}
class Qe {
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
    const { el: { content: s }, parts: i } = this._$AD, n = (e?.creationScope ?? z).importNode(s, !0);
    M.currentNode = n;
    let r = M.nextNode(), a = 0, o = 0, l = i[0];
    for (; l !== void 0; ) {
      if (a === l.index) {
        let d;
        l.type === 2 ? d = new j(r, r.nextSibling, this, e) : l.type === 1 ? d = new l.ctor(r, l.name, l.strings, this, e) : l.type === 6 && (d = new it(r, this, e)), this._$AV.push(d), l = i[++o];
      }
      a !== l?.index && (r = M.nextNode(), a++);
    }
    return M.currentNode = z, n;
  }
  p(e) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, s), s += i.strings.length - 2) : i._$AI(e[s])), s++;
  }
}
class j {
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
    e = O(this, e, s), H(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== T && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Xe(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && H(this._$AH) ? this._$AA.nextSibling.data = e : this.T(z.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: s, _$litType$: i } = e, n = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = L.createElement(Ce(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(s);
    else {
      const r = new Qe(n, this), a = r.u(this.options);
      r.p(s), this.T(a), this._$AH = r;
    }
  }
  _$AC(e) {
    let s = ve.get(e.strings);
    return s === void 0 && ve.set(e.strings, s = new L(e)), s;
  }
  k(e) {
    ie(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, n = 0;
    for (const r of e) n === s.length ? s.push(i = new j(this.O(D()), this.O(D()), this, this.options)) : i = s[n], i._$AI(r), n++;
    n < s.length && (this._$AR(i && i._$AB.nextSibling, n), s.length = n);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); e !== this._$AB; ) {
      const i = ue(e).nextSibling;
      ue(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class q {
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
    if (r === void 0) e = O(this, e, s, 0), a = !H(e) || e !== this._$AH && e !== T, a && (this._$AH = e);
    else {
      const o = e;
      let l, d;
      for (e = r[0], l = 0; l < r.length - 1; l++) d = O(this, o[i + l], s, l), d === T && (d = this._$AH[l]), a ||= !H(d) || d !== this._$AH[l], d === c ? e = c : e !== c && (e += (d ?? "") + r[l + 1]), this._$AH[l] = d;
    }
    a && !n && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class et extends q {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class tt extends q {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class st extends q {
  constructor(e, s, i, n, r) {
    super(e, s, i, n, r), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = O(this, e, s, 0) ?? c) === T) return;
    const i = this._$AH, n = e === c && i !== c || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== c && (i === c || n);
    n && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class it {
  constructor(e, s, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    O(this, e);
  }
}
const nt = se.litHtmlPolyfillSupport;
nt?.(L, j), (se.litHtmlVersions ??= []).push("3.3.3");
const rt = (t, e, s) => {
  const i = s?.renderBefore ?? e;
  let n = i._$litPart$;
  if (n === void 0) {
    const r = s?.renderBefore ?? null;
    i._$litPart$ = n = new j(e.insertBefore(D(), r), r, void 0, s ?? {});
  }
  return n._$AI(t), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ne = globalThis;
class I extends P {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = rt(s, this.renderRoot, this.renderOptions);
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
I._$litElement$ = !0, I.finalized = !0, ne.litElementHydrateSupport?.({ LitElement: I });
const at = ne.litElementPolyfillSupport;
at?.({ LitElement: I });
(ne.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ot = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const lt = { attribute: !0, type: String, converter: K, reflect: !1, hasChanged: te }, ct = (t = lt, e, s) => {
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
function Re(t) {
  return (e, s) => typeof s == "object" ? ct(t, e, s) : ((i, n, r) => {
    const a = n.hasOwnProperty(r);
    return n.constructor.createProperty(r, i), a ? Object.getOwnPropertyDescriptor(n, r) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function f(t) {
  return Re({ ...t, state: !0, attribute: !1 });
}
const w = 6378137, Be = 256, B = Math.PI * w;
function ht(t, e) {
  const s = Math.max(0, Math.min(360, e));
  return Math.PI * t * t * s / 360;
}
function dt(t) {
  if (t.length < 3) return 0;
  let e = 0;
  for (let s = 0; s < t.length; s++) {
    const [i, n] = t[s], [r, a] = t[(s + 1) % t.length];
    e += i * a - r * n;
  }
  return Math.abs(e) / 2;
}
function _(t, e, s) {
  const i = s * Math.PI / 180;
  return [t[0] + Math.sin(i) * e, t[1] - Math.cos(i) * e];
}
function ye(t, e) {
  return (Math.atan2(e[0] - t[0], -(e[1] - t[1])) * 180 / Math.PI + 360) % 360;
}
function Z(t, e) {
  return Math.hypot(t[0] - e[0], t[1] - e[1]);
}
function pt(t, e, s, i) {
  const [n, r] = t;
  if (i >= 360)
    return `M ${n - e} ${r} a ${e} ${e} 0 1 0 ${2 * e} 0 a ${e} ${e} 0 1 0 ${-2 * e} 0 Z`;
  const [a, o] = _(t, e, s), [l, d] = _(t, e, s + i), u = i > 180 ? 1 : 0;
  return `M ${n} ${r} L ${a} ${o} A ${e} ${e} 0 ${u} 1 ${l} ${d} Z`;
}
function ut(t) {
  const e = t.length || 1;
  return [t.reduce((s, i) => s + i[0], 0) / e, t.reduce((s, i) => s + i[1], 0) / e];
}
function xe(t, e) {
  return 2 * Math.PI * w * Math.cos(t * Math.PI / 180) / (Be * 2 ** e);
}
function _e(t, e) {
  return Math.log2(
    2 * Math.PI * w * Math.cos(t * Math.PI / 180) * e / Be
  );
}
function gt(t, e, s) {
  const [i, n] = s, r = Math.PI / 180;
  return [
    (e - n) * r * w * Math.cos(i * r),
    -(t - i) * r * w
  ];
}
function mt(t, e) {
  const [s, i] = e, n = 180 / Math.PI;
  return [
    s - t[1] / w * n,
    i + t[0] / (w * Math.cos(s / n)) * n
  ];
}
function we(t, e, s, i, n = 200) {
  const [r, a] = e, o = Math.PI / 180, l = 1 / Math.cos(r * o), d = w * a * o, u = w * Math.log(Math.tan(Math.PI / 4 + r * o / 2)), p = 2 ** i, b = 2 * B / p, y = (x) => (d + x * l + B) / b, A = (x) => (B - (u - x * l)) / b, re = Math.max(0, Math.floor(y(s.x0))), ae = Math.min(p - 1, Math.floor(y(s.x1))), oe = Math.max(0, Math.floor(A(s.y0))), le = Math.min(p - 1, Math.floor(A(s.y1))), J = [];
  if ((ae - re + 1) * (le - oe + 1) > n) return J;
  for (let x = oe; x <= le; x++)
    for (let C = re; C <= ae; C++) {
      const Ue = C * b - B, Ie = B - x * b;
      J.push({
        url: t.replace("{z}", String(i)).replace("{x}", String(C)).replace("{y}", String(x)),
        key: `${i}/${C}/${x}`,
        x: (Ue - d) / l,
        y: (u - Ie) / l,
        size: b / l
      });
    }
  return J;
}
const ft = "Suche: © OpenStreetMap-Mitwirkende";
async function bt(t, e, s = "de") {
  if (e.trim().length < 3) throw new Error("Bitte mindestens 3 Zeichen eingeben");
  return (await t({
    type: "irrigation_planner/geocode",
    query: e.trim(),
    language: s
  })).places ?? [];
}
const $t = He`
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
var vt = Object.defineProperty, yt = Object.getOwnPropertyDescriptor, m = (t, e, s, i) => {
  for (var n = i > 1 ? void 0 : i ? yt(e, s) : e, r = t.length - 1, a; r >= 0; r--)
    (a = t[r]) && (n = (i ? a(e, s, n) : a(n)) || n);
  return i && n && vt(e, s, n), n;
};
const E = "irrigation_planner", ke = [
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
], Ae = {
  soil_moisture: "B",
  rain_mm: "R",
  rain_binary: "R",
  water_meter: "W"
}, xt = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge",
  rain_binary: "Regensensor",
  water_meter: "Wasserzähler"
}, Y = {
  idle: "",
  running: "läuft",
  queued: "wartet",
  locked: "gesperrt"
}, _t = 0.05;
let g = class extends I {
  constructor() {
    super(...arguments), this.narrow = !1, this.error = "", this.toast = "", this.tab = "zones", this.tool = "select", this.toolTarget = "", this.selected = null, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.view = { cx: 0, cy: 0, scale: 25 }, this.size = { w: 800, h: 600 }, this.imageUrl = "", this.imageSize = null, this.saving = !1, this.dirty = !1, this.searchOpen = !1, this.searchQuery = "", this.searchResults = null, this.searching = !1, this.searchError = "", this.searchPin = null, this.savedJson = "", this.history = [], this.drag = null, this.toastUndo = !1, this.layersOpen = !1, this.autoFit = !0, this.loadedImage = "", this.onWheel = (t) => {
      t.preventDefault();
      const s = t.currentTarget.getBoundingClientRect(), i = Math.exp(-t.deltaY * (t.ctrlKey ? 0.01 : 15e-4));
      this.zoomBy(i, this.toPlan(t), [t.clientX - s.left, t.clientY - s.top]);
    }, this.onKey = (t) => {
      const e = t.composedPath()[0];
      e && ["INPUT", "SELECT", "TEXTAREA"].includes(e.tagName) || (t.key === "Escape" && this.cancelTool(), t.key === "Enter" && this.tool === "bed" && this.finishBed(), (t.ctrlKey || t.metaKey) && t.key === "z" && (t.preventDefault(), this.undo()), t.key === "Delete" && this.selected?.kind === "zone" && this.clearGeometry(this.selected.id));
    }, this.onPointerDown = (t) => {
      if (t.button !== 0) return;
      const e = t.currentTarget, s = this.toPlan(t);
      if (this.tool === "sprinkler") {
        this.remember();
        const i = this.zone(this.toolTarget);
        i.center = [v(s[0]), v(s[1])], i.radius_m = 0, this.drag = { type: "new-sprinkler", id: i.id }, e.setPointerCapture(t.pointerId), this.changed();
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
        r.position = [v(s[0]), v(s[1])], this.selected = { kind: i, id: n }, this.changed(), this.cancelTool();
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
        this.tool === "bed" && this.draft.length && (this.hover = this.toPlan(t));
        return;
      }
      const s = this.toPlan(t);
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
        this.marker(e.kind, e.id).position = [v(s[0]), v(s[1])], this.changed();
        return;
      }
      const i = this.zone(e.id);
      switch (e.type) {
        case "new-sprinkler":
        case "radius":
          i.radius_m = v(Math.max(0.1, Z(i.center, s)));
          break;
        case "center":
          i.center = [v(s[0]), v(s[1])];
          break;
        case "start": {
          const n = i.start_angle_deg + i.arc_deg, r = Se(ye(i.center, s));
          let a = ((n - r) % 360 + 360) % 360;
          a < 5 && (a = 360), i.start_angle_deg = r, i.arc_deg = a;
          break;
        }
        case "end": {
          let r = ((Se(ye(i.center, s)) - i.start_angle_deg) % 360 + 360) % 360;
          r < 5 && (r = 360), i.arc_deg = r;
          break;
        }
        case "vertex":
          i.polygon[e.index] = [v(s[0]), v(s[1])];
          break;
        case "move-zone": {
          const n = s[0] - e.start[0], r = s[1] - e.start[1];
          i.type === "sprinkler" && e.orig.center ? i.center = [v(e.orig.center[0] + n), v(e.orig.center[1] + r)] : i.polygon = e.orig.polygon.map((a) => [v(a[0] + n), v(a[1] + r)]);
          break;
        }
      }
      this.changed();
    }, this.hover = null, this.onPointerUp = () => {
      const t = this.drag;
      if (this.drag = null, !!t) {
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
      const t = await this._hass.callWS({ type: `${E}/plan/get` });
      this.setPlan(t, !0), await this.subscribe();
    } catch (t) {
      this.error = this.message(t);
    }
  }
  async subscribe() {
    this.unsub || !this._hass || (this.unsub = await this._hass.connection.subscribeMessage(
      (t) => this.status = t,
      { type: `${E}/plan/subscribe` }
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
    e.background === "map" && e.latitude != null && (e.map_zoom = Math.round(_e(e.latitude, this.view.scale) * 100) / 100), this.saving = !0;
    try {
      const s = await this._hass.callWS({
        type: `${E}/plan/save`,
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
        const e = await this._hass.fetchWithAuth(`/api/${E}/image/${t}`);
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
    const t = this.plan.garden;
    if (t.scale_points && t.scale_distance_m) {
      const e = Z(t.scale_points[0], t.scale_points[1]);
      if (e > 0) return t.scale_distance_m / e;
    }
    return _t;
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
    if (this.plan?.garden?.background === "image" && this.imageSize) {
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
      this.view = { cx: 0, cy: 0, scale: 1 / xe(t.latitude, d) };
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
    this.tool = t, this.toolTarget = e, this.draft = [], this.scaleDraft = [], this.scaleInput = "", e && t !== "place" && (this.selected = { kind: "zone", id: e });
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
    this.remember(), this.zone(this.toolTarget).polygon = this.draft.map((t) => [v(t[0]), v(t[1])]), this.selected = { kind: "zone", id: this.toolTarget }, this.changed(), this.cancelTool();
  }
  clearGeometry(t) {
    const e = this.zone(t);
    this.remember(), e.center = null, e.radius_m = null, e.polygon = [], this.changed(), this.removed(`${e.name}: Zeichnung entfernt`);
  }
  startDrag(t, e) {
    if (this.tool !== "select" || t.button !== 0) return;
    t.stopPropagation(), this.renderRoot.querySelector("svg.plan").setPointerCapture(t.pointerId), this.remember(), this.drag = e;
  }
  insertVertex(t, e, s) {
    if (this.tool !== "select") return;
    t.stopPropagation(), this.remember();
    const i = e.polygon[s], n = e.polygon[(s + 1) % e.polygon.length];
    e.polygon.splice(s + 1, 0, [v((i[0] + n[0]) / 2), v((i[1] + n[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(t.pointerId), this.drag = { type: "vertex", id: e.id, index: s + 1 };
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
    this.remember(), [t.latitude, t.longitude] = mt([e, s], [t.latitude, t.longitude]).map(
      (n) => Math.round(n * 1e7) / 1e7
    );
    const i = (n) => [v(n[0] - e), v(n[1] - s)];
    for (const n of this.plan.zones)
      n.center && (n.center = i(n.center)), n.polygon = n.polygon.map(i);
    for (const n of [...this.plan.valves, ...this.plan.sensors])
      n.position && (n.position = i(n.position));
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
        this.searchResults = await bt(
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
    const e = this.plan.garden, s = 1 / xe(t.latitude, 19);
    if (this.autoFit = !1, !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((n) => n.position) || e.latitude == null || e.longitude == null)
      this.remember(), e.latitude = Math.round(t.latitude * 1e7) / 1e7, e.longitude = Math.round(t.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: s }, this.searchPin = { point: [0, 0], name: t.name }, this.changed(), this.showToast(`${t.name}: Kartenmitte gesetzt. Fein ausrichten mit „Mitte hier festlegen“.`);
    else {
      const n = gt(t.latitude, t.longitude, [e.latitude, e.longitude]);
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
        <p class="search-note">${ft}. Die Adresse geht nur an die Suche und wird nicht gespeichert.</p>
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
    if (Z(this.scaleDraft[0], this.scaleDraft[1]) < 2) {
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
      await this._hass.callService(E, "run_zone", { zone_id: t.id, duration: e }), this.showToast(`${t.name}: ${Me(e)} eingereiht`);
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
      this.tool === "bed" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishBed());
    }}
      >
        <g transform=${r}>
          ${this.renderBackground(a)}
          ${this.plan.zones.map((l, d) => this.renderZone(l, d, a))}
          ${this.renderSelectedHandles(a)} ${this.renderDraft(a)} ${this.renderScaleDraft(a)}
          ${this.plan.valves.map((l) => this.renderMarker("valve", l, a))}
          ${this.plan.sensors.map((l) => this.renderMarker("sensor", l, a))}
          ${this.searchPin && this.plan.garden.background === "map" ? $`<g class="pin" transform="translate(${this.searchPin.point[0]} ${this.searchPin.point[1]}) scale(${a})">
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
      const n = this.tileTemplate();
      if (n) {
        const r = this.plan.providers[e.map_provider ?? ""], a = r?.max_zoom ?? 20, o = Math.max(
          1,
          Math.min(a, Math.round(_e(e.latitude, this.view.scale * (window.devicePixelRatio > 1 ? 1.4 : 1))))
        ), l = we(n, [e.latitude, e.longitude], s, o);
        i.push($`<rect x=${s.x0} y=${s.y0} width=${s.x1 - s.x0} height=${s.y1 - s.y0} class="map-fill"></rect>`);
        const d = t * 0.5, u = (p) => p.map(
          (b) => $`<image href=${b.url} x=${b.x - d} y=${b.y - d} width=${b.size + 2 * d} height=${b.size + 2 * d} preserveAspectRatio="none" crossorigin="anonymous"></image>`
        );
        i.push(...u(l)), r?.overlay && e.map_provider !== "custom" && i.push(...u(we(r.overlay, [e.latitude, e.longitude], s, o)));
      }
    } else if (e.background === "image" && this.imageUrl && this.imageSize) {
      const n = this.imageMpp();
      i.push(
        $`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * n} height=${this.imageSize[1] * n} preserveAspectRatio="none"></image>`
      );
    }
    return e.background !== "map" && i.push(this.renderGrid(s, t, e.background === "image")), i;
  }
  renderGrid(t, e, s) {
    const i = Ne(40 * e), n = [], r = i * 5;
    for (let a = Math.floor(t.x0 / i) * i; a <= t.x1; a += i) {
      const o = Math.abs(a / r - Math.round(a / r)) < 1e-6;
      n.push($`<line x1=${a} y1=${t.y0} x2=${a} y2=${t.y1} class=${o ? "grid major" : "grid"}></line>`);
    }
    for (let a = Math.floor(t.y0 / i) * i; a <= t.y1; a += i) {
      const o = Math.abs(a / r - Math.round(a / r)) < 1e-6;
      n.push($`<line x1=${t.x0} y1=${a} x2=${t.x1} y2=${a} class=${o ? "grid major" : "grid"}></line>`);
    }
    return $`<g class=${s ? "grid-layer faint" : "grid-layer"}>${n}</g>`;
  }
  tileTemplate() {
    const t = this.plan.garden;
    return t.map_provider === "custom" ? t.map_url ?? "" : this.plan.providers[t.map_provider ?? ""]?.url ?? "";
  }
  zoneColor(t) {
    return ke[t % ke.length];
  }
  renderZone(t, e, s) {
    const i = this.zoneColor(e), n = this.status?.zones[t.id]?.state ?? "idle", r = this.selected?.kind === "zone" && this.selected.id === t.id, a = `zone ${n} ${r ? "selected" : ""} ${t.enabled ? "" : "disabled"}`;
    let o, l = null;
    if (t.type === "sprinkler" && t.center && t.radius_m ? (o = $`<path d=${pt(t.center, t.radius_m, t.start_angle_deg, t.arc_deg)}></path>`, l = t.arc_deg >= 360 ? t.center : _(t.center, t.radius_m * 0.55, t.start_angle_deg + t.arc_deg / 2)) : t.type !== "sprinkler" && t.polygon.length >= 3 && (o = $`<polygon points=${t.polygon.map((u) => u.join(",")).join(" ")}></polygon>`, l = ut(t.polygon)), !o) return c;
    const d = V(t);
    return $`
      <g class=${a} style="--zone:${i}"
        @pointerdown=${(u) => {
      this.tool === "select" && (this.selected = { kind: "zone", id: t.id }, this.tab = "zones", this.startDrag(u, { type: "move-zone", id: t.id, start: this.toPlan(u), orig: structuredClone(t) }));
    }}>
        ${o}
        ${l ? $`<text x=${l[0]} y=${l[1]} font-size=${13 * s} stroke-width=${3 * s} class="label">
              <tspan x=${l[0]} dy="0">${t.name}</tspan>
              <tspan x=${l[0]} dy=${15 * s} class="sub">${N(d)}${Y[n] ? ` · ${Y[n]}` : ""}</tspan>
            </text>` : c}
      </g>`;
  }
  renderSelectedHandles(t) {
    if (this.tool !== "select" || this.selected?.kind !== "zone") return c;
    const e = this.zone(this.selected.id), s = 7 * t, i = (n, r, a = "", o = "") => $`<circle class="handle ${a}" cx=${n[0]} cy=${n[1]} r=${s}
        @pointerdown=${(l) => this.startDrag(l, r)}><title>${o}</title></circle>`;
    if (e.type === "sprinkler" && e.center && e.radius_m) {
      const n = e.center, r = e.arc_deg >= 360, a = r ? e.start_angle_deg + 135 : e.start_angle_deg + e.arc_deg / 2, o = [
        $`<line class="guide" x1=${n[0]} y1=${n[1]} x2=${_(n, e.radius_m, e.start_angle_deg)[0]} y2=${_(n, e.radius_m, e.start_angle_deg)[1]}></line>`,
        i(n, { type: "center", id: e.id }, "center", "Mittelpunkt verschieben"),
        i(_(n, e.radius_m, a), { type: "radius", id: e.id }, "radius", "Reichweite ändern"),
        i(_(n, e.radius_m, e.start_angle_deg), { type: "start", id: e.id }, "angle", "Anfang des Bogens")
      ];
      return r ? o.push(
        i(_(n, e.radius_m * 0.8, e.start_angle_deg + 20), { type: "end", id: e.id }, "angle small", "Bogen öffnen")
      ) : o.push(
        i(_(n, e.radius_m, e.start_angle_deg + e.arc_deg), { type: "end", id: e.id }, "angle", "Ende des Bogens")
      ), o;
    }
    if (e.type !== "sprinkler" && e.polygon.length >= 3) {
      const n = e.polygon;
      return [
        ...n.map((r, a) => {
          const o = n[(a + 1) % n.length], l = [(r[0] + o[0]) / 2, (r[1] + o[1]) / 2];
          return $`<circle class="handle mid" cx=${l[0]} cy=${l[1]} r=${s * 0.7}
            @pointerdown=${(d) => this.insertVertex(d, e, a)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
        }),
        ...n.map(
          (r, a) => $`<circle class="handle" cx=${r[0]} cy=${r[1]} r=${s}
            @pointerdown=${(o) => this.startDrag(o, { type: "vertex", id: e.id, index: a })}
            @contextmenu=${(o) => this.removeVertex(o, e, a)}
            @dblclick=${(o) => this.removeVertex(o, e, a)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
        )
      ];
    }
    return c;
  }
  renderDraft(t) {
    if (this.tool !== "bed" || !this.draft.length) return c;
    const e = this.hover ? [...this.draft, this.hover] : this.draft, s = this.plan.zones.findIndex((i) => i.id === this.toolTarget);
    return $`
      <g class="draft" style="--zone:${this.zoneColor(s)}">
        <polyline points=${e.map((i) => i.join(",")).join(" ")}></polyline>
        ${this.draft.map(
      (i, n) => $`<circle cx=${i[0]} cy=${i[1]} r=${(n === 0 ? 8 : 5) * t} class=${n === 0 ? "first" : ""}></circle>`
    )}
      </g>`;
  }
  renderScaleDraft(t) {
    if (this.tool !== "scale") return c;
    const e = this.imageMpp(), s = this.scaleDraft.map((i) => [i[0] * e, i[1] * e]);
    return $`<g class="scale-draft">
      ${s.length === 2 ? $`<line x1=${s[0][0]} y1=${s[0][1]} x2=${s[1][0]} y2=${s[1][1]}></line>` : c}
      ${s.map((i) => $`<circle cx=${i[0]} cy=${i[1]} r=${6 * t}></circle>`)}
    </g>`;
  }
  renderMarker(t, e, s) {
    if (!e.position) return c;
    const [i, n] = e.position, r = this.selected?.kind === t && this.selected.id === e.id, a = t === "valve" ? "V" : Ae[e.kind] ?? "S", o = 11 * s;
    return $`
      <g class="marker ${t} ${r ? "selected" : ""}"
        @pointerdown=${(l) => {
      this.tool === "select" && (this.selected = { kind: t, id: e.id }, this.tab = "zones", this.startDrag(l, { type: "marker", kind: t, id: e.id }));
    }}>
        ${t === "valve" ? $`<rect x=${i - o} y=${n - o} width=${2 * o} height=${2 * o} rx=${4 * s}></rect>` : $`<circle cx=${i} cy=${n} r=${o}></circle>`}
        <text x=${i} y=${n} font-size=${12 * s} dy=${4.2 * s}>${a}</text>
        <title>${e.name}</title>
      </g>`;
  }
  renderOverlay() {
    const t = this.plan.garden, e = this.toolBanner(), s = wt(this.view.scale), i = t.background === "map" ? this.plan.providers[t.map_provider ?? ""] : void 0;
    return h`
      <div class="tools">
        <button class="icon" title="Vergrößern" @click=${() => this.zoomBy(1.4)}><ha-icon icon="mdi:plus"></ha-icon></button>
        <button class="icon" title="Verkleinern" @click=${() => this.zoomBy(1 / 1.4)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="icon" title="Alles zeigen" @click=${this.fitView}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
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
    return this.plan.zones.some((t) => V(t) !== null);
  }
  toolBanner() {
    if (this.tool === "select") return c;
    let t = "", e = c;
    const s = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    return this.tool === "sprinkler" && (t = `${s}: Am Sprinkler drücken und bis zum Rand ziehen.`), this.tool === "bed" && (t = `${s}: Ecken anklicken, zum Schließen den ersten Punkt.`, e = h`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`), this.tool === "place" && (t = `${s}: Auf die Stelle im Plan klicken.`), this.tool === "scale" && (t = this.scaleDraft.length < 2 ? "Maßstab: Zwei Punkte im Bild anklicken, deren Abstand du kennst (z. B. die Ecken der Terrasse)." : "Abstand eingeben:", this.scaleDraft.length === 2 && (e = h`<input
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
    const i = this.status?.zones[t.id], n = V(t), r = n !== null, a = t.type === "sprinkler";
    return h`
      <li class="item ${s ? "open" : ""}" style="--zone:${this.zoneColor(e)}">
        <div class="row" @click=${() => {
      this.selected = s ? null : { kind: "zone", id: t.id };
    }}>
          <span class="dot"></span>
          <ha-icon icon=${a ? "mdi:sprinkler-variant" : "mdi:water-outline"}></ha-icon>
          <span class="name">${t.name}</span>
          ${i && i.state !== "idle" ? h`<span class="badge ${i.state}">${Y[i.state]}</span>` : c}
          <span class="meta">${r ? N(n) : h`<em>nicht gezeichnet</em>`}</span>
        </div>
        ${s ? this.renderInspector(t, i) : c}
      </li>
    `;
  }
  renderInspector(t, e) {
    const s = t.type === "sprinkler", i = V(t), n = i !== null, r = s ? "sprinkler" : "bed", a = (o, l, d, u, p = 0.1) => h`<label class="field">
        <span>${o}</span>
        <input type="number" step=${p} .value=${l == null ? "" : String(l)}
          @change=${(b) => {
      const y = parseFloat(b.target.value);
      Number.isFinite(y) && (this.remember(), u(y), this.changed());
    }} />
        <span class="unit">${d}</span>
      </label>`;
    return h`
      <div class="inspector">
        <dl>
          <dt>Fläche gezeichnet</dt>
          <dd>${n ? N(i) : "–"}</dd>
          <dt>Fläche von Hand</dt>
          <dd>${t.area_m2 ? N(t.area_m2) : "–"}</dd>
          ${t.overlap_m2 > 0.05 ? h`<dt>Überschneidung</dt><dd class="warn">${N(t.overlap_m2)} mit anderen Zonen</dd>` : c}
          ${e ? h`<dt>Bedarf</dt><dd>${e.need_mm.toFixed(1)} mm</dd>
                <dt>Geplant</dt><dd>${e.planned_s ? Me(e.planned_s) : "nicht gießen"}
                  <span class="reason">(${e.reason})</span></dd>` : c}
          ${e?.locked_reason ? h`<dt>Gesperrt</dt><dd class="warn">${e.locked_reason}</dd>` : c}
        </dl>
        ${s && n ? h`<div class="fields">
              ${a("Reichweite", t.radius_m, "m", (o) => t.radius_m = Math.max(0.1, o))}
              ${a("Richtung", t.start_angle_deg, "°", (o) => t.start_angle_deg = (o % 360 + 360) % 360, 5)}
              ${a("Bogen", t.arc_deg, "°", (o) => t.arc_deg = Math.min(360, Math.max(1, o)), 5)}
            </div>
            <p class="hint small">Richtung: Anfang des Bogens, 0° = Norden (oben), 90° = Osten.</p>` : c}
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
    const s = this.selected?.kind === t && this.selected.id === e.id, i = t === "valve" ? e.safety_level === "device" ? "schließt selbst" : "nur Home Assistant" : xt[e.kind] ?? "";
    return h`
      <li class="item ${s ? "open" : ""}">
        <div class="row" @click=${() => this.selected = { kind: t, id: e.id }}>
          <span class="marker-icon ${t}">${t === "valve" ? "V" : Ae[e.kind] ?? "S"}</span>
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
g.styles = $t;
m([
  Re({ type: Boolean, reflect: !0 })
], g.prototype, "narrow", 2);
m([
  f()
], g.prototype, "plan", 2);
m([
  f()
], g.prototype, "status", 2);
m([
  f()
], g.prototype, "error", 2);
m([
  f()
], g.prototype, "toast", 2);
m([
  f()
], g.prototype, "tab", 2);
m([
  f()
], g.prototype, "tool", 2);
m([
  f()
], g.prototype, "toolTarget", 2);
m([
  f()
], g.prototype, "selected", 2);
m([
  f()
], g.prototype, "draft", 2);
m([
  f()
], g.prototype, "scaleDraft", 2);
m([
  f()
], g.prototype, "scaleInput", 2);
m([
  f()
], g.prototype, "view", 2);
m([
  f()
], g.prototype, "size", 2);
m([
  f()
], g.prototype, "imageUrl", 2);
m([
  f()
], g.prototype, "imageSize", 2);
m([
  f()
], g.prototype, "saving", 2);
m([
  f()
], g.prototype, "dirty", 2);
m([
  f()
], g.prototype, "searchOpen", 2);
m([
  f()
], g.prototype, "searchQuery", 2);
m([
  f()
], g.prototype, "searchResults", 2);
m([
  f()
], g.prototype, "searching", 2);
m([
  f()
], g.prototype, "searchError", 2);
m([
  f()
], g.prototype, "searchPin", 2);
m([
  f()
], g.prototype, "toastUndo", 2);
m([
  f()
], g.prototype, "layersOpen", 2);
m([
  f()
], g.prototype, "hover", 2);
g = m([
  ot("irrigation-planner-panel")
], g);
function v(t) {
  return Math.round(t * 100) / 100;
}
function Se(t) {
  return Math.round(t / 5) * 5 % 360;
}
function V(t) {
  return t.type === "sprinkler" ? t.center && t.radius_m ? ht(t.radius_m, t.arc_deg) : null : t.polygon.length >= 3 ? dt(t.polygon) : null;
}
function N(t) {
  return t == null ? "–" : `${t.toLocaleString("de-DE", { maximumFractionDigits: t < 10 ? 1 : 0 })} m²`;
}
function Me(t) {
  if (t < 60) return `${t} s`;
  const e = Math.round(t / 60);
  return e >= 60 ? `${Math.floor(e / 60)} h ${e % 60} min` : `${e} min`;
}
function Ne(t) {
  const e = 10 ** Math.floor(Math.log10(t));
  for (const s of [1, 2, 5, 10]) if (s * e >= t) return s * e;
  return 10 * e;
}
function wt(t) {
  const e = Ne(110 / t), s = e >= 1e3 ? `${e / 1e3} km` : e >= 1 ? `${e} m` : `${e * 100} cm`;
  return { px: e * t, label: s };
}
export {
  g as IrrigationPlannerPanel
};
