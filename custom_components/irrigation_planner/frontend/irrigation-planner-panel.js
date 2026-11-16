/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const be = globalThis, Te = be.ShadowRoot && (be.ShadyCSS === void 0 || be.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, De = Symbol(), je = /* @__PURE__ */ new WeakMap();
let ct = class {
  constructor(t, n, s) {
    if (this._$cssResult$ = !0, s !== De) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = n;
  }
  get styleSheet() {
    let t = this.o;
    const n = this.t;
    if (Te && t === void 0) {
      const s = n !== void 0 && n.length === 1;
      s && (t = je.get(n)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && je.set(n, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const kt = (e) => new ct(typeof e == "string" ? e : e + "", void 0, De), _t = (e, ...t) => {
  const n = e.length === 1 ? e[0] : t.reduce((s, i, a) => s + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + e[a + 1], e[0]);
  return new ct(n, e, De);
}, St = (e, t) => {
  if (Te) e.adoptedStyleSheets = t.map((n) => n instanceof CSSStyleSheet ? n : n.styleSheet);
  else for (const n of t) {
    const s = document.createElement("style"), i = be.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = n.cssText, e.appendChild(s);
  }
}, Ze = Te ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let n = "";
  for (const s of t.cssRules) n += s.cssText;
  return kt(n);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Pt, defineProperty: At, getOwnPropertyDescriptor: Mt, getOwnPropertyNames: Et, getOwnPropertySymbols: zt, getPrototypeOf: Tt } = Object, ye = globalThis, He = ye.trustedTypes, Dt = He ? He.emptyScript : "", Ot = ye.reactiveElementPolyfillSupport, re = (e, t) => e, $e = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Dt : null;
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
} }, Oe = (e, t) => !Pt(e, t), Fe = { attribute: !0, type: String, converter: $e, reflect: !1, useDefault: !1, hasChanged: Oe };
Symbol.metadata ??= Symbol("metadata"), ye.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let ee = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, n = Fe) {
    if (n.state && (n.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((n = Object.create(n)).wrapped = !0), this.elementProperties.set(t, n), !n.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(t, s, n);
      i !== void 0 && At(this.prototype, t, i);
    }
  }
  static getPropertyDescriptor(t, n, s) {
    const { get: i, set: a } = Mt(this.prototype, t) ?? { get() {
      return this[n];
    }, set(r) {
      this[n] = r;
    } };
    return { get: i, set(r) {
      const o = i?.call(this);
      a?.call(this, r), this.requestUpdate(t, o, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Fe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(re("elementProperties"))) return;
    const t = Tt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(re("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(re("properties"))) {
      const n = this.properties, s = [...Et(n), ...zt(n)];
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
      for (const i of s) n.unshift(Ze(i));
    } else t !== void 0 && n.push(Ze(t));
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
    return St(t, this.constructor.elementStyles), t;
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
      const a = (s.converter?.toAttribute !== void 0 ? s.converter : $e).toAttribute(n, s.type);
      this._$Em = t, a == null ? this.removeAttribute(i) : this.setAttribute(i, a), this._$Em = null;
    }
  }
  _$AK(t, n) {
    const s = this.constructor, i = s._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const a = s.getPropertyOptions(i), r = typeof a.converter == "function" ? { fromAttribute: a.converter } : a.converter?.fromAttribute !== void 0 ? a.converter : $e;
      this._$Em = i;
      const o = r.fromAttribute(n, a.type);
      this[i] = o ?? this._$Ej?.get(i) ?? o, this._$Em = null;
    }
  }
  requestUpdate(t, n, s, i = !1, a) {
    if (t !== void 0) {
      const r = this.constructor;
      if (i === !1 && (a = this[t]), s ??= r.getPropertyOptions(t), !((s.hasChanged ?? Oe)(a, n) || s.useDefault && s.reflect && a === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, s)))) return;
      this.C(t, n, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, n, { useDefault: s, reflect: i, wrapped: a }, r) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? n ?? this[t]), a !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (n = void 0), this._$AL.set(t, n)), i === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        for (const [i, a] of this._$Ep) this[i] = a;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, a] of s) {
        const { wrapped: r } = a, o = this[i];
        r !== !0 || this._$AL.has(i) || o === void 0 || this.C(i, void 0, a, o);
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
ee.elementStyles = [], ee.shadowRootOptions = { mode: "open" }, ee[re("elementProperties")] = /* @__PURE__ */ new Map(), ee[re("finalized")] = /* @__PURE__ */ new Map(), Ot?.({ ReactiveElement: ee }), (ye.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ne = globalThis, Ue = (e) => e, ve = Ne.trustedTypes, We = ve ? ve.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, dt = "$lit$", H = `lit$${Math.random().toFixed(9).slice(2)}$`, ht = "?" + H, Nt = `<${ht}>`, q = document, oe = () => q.createComment(""), le = (e) => e === null || typeof e != "object" && typeof e != "function", Le = Array.isArray, Lt = (e) => Le(e) || typeof e?.[Symbol.iterator] == "function", ke = `[ 	
\f\r]`, ie = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ve = /-->/g, Ke = />/g, F = RegExp(`>|${ke}(?:([^\\s"'>=/]+)(${ke}*=${ke}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ge = /'/g, qe = /"/g, pt = /^(?:script|style|textarea|title)$/i, ut = (e) => (t, ...n) => ({ _$litType$: e, strings: t, values: n }), c = ut(1), g = ut(2), ne = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), Je = /* @__PURE__ */ new WeakMap(), V = q.createTreeWalker(q, 129);
function mt(e, t) {
  if (!Le(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return We !== void 0 ? We.createHTML(t) : t;
}
const Rt = (e, t) => {
  const n = e.length - 1, s = [];
  let i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = ie;
  for (let o = 0; o < n; o++) {
    const l = e[o];
    let p, m, u = -1, b = 0;
    for (; b < l.length && (r.lastIndex = b, m = r.exec(l), m !== null); ) b = r.lastIndex, r === ie ? m[1] === "!--" ? r = Ve : m[1] !== void 0 ? r = Ke : m[2] !== void 0 ? (pt.test(m[2]) && (i = RegExp("</" + m[2], "g")), r = F) : m[3] !== void 0 && (r = F) : r === F ? m[0] === ">" ? (r = i ?? ie, u = -1) : m[1] === void 0 ? u = -2 : (u = r.lastIndex - m[2].length, p = m[1], r = m[3] === void 0 ? F : m[3] === '"' ? qe : Ge) : r === qe || r === Ge ? r = F : r === Ve || r === Ke ? r = ie : (r = F, i = void 0);
    const v = r === F && e[o + 1].startsWith("/>") ? " " : "";
    a += r === ie ? l + Nt : u >= 0 ? (s.push(p), l.slice(0, u) + dt + l.slice(u) + H + v) : l + H + (u === -2 ? o : v);
  }
  return [mt(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class ce {
  constructor({ strings: t, _$litType$: n }, s) {
    let i;
    this.parts = [];
    let a = 0, r = 0;
    const o = t.length - 1, l = this.parts, [p, m] = Rt(t, n);
    if (this.el = ce.createElement(p, s), V.currentNode = this.el.content, n === 2 || n === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (i = V.nextNode()) !== null && l.length < o; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const u of i.getAttributeNames()) if (u.endsWith(dt)) {
          const b = m[r++], v = i.getAttribute(u).split(H), d = /([.?@])?(.*)/.exec(b);
          l.push({ type: 1, index: a, name: d[2], strings: v, ctor: d[1] === "." ? Bt : d[1] === "?" ? It : d[1] === "@" ? jt : xe }), i.removeAttribute(u);
        } else u.startsWith(H) && (l.push({ type: 6, index: a }), i.removeAttribute(u));
        if (pt.test(i.tagName)) {
          const u = i.textContent.split(H), b = u.length - 1;
          if (b > 0) {
            i.textContent = ve ? ve.emptyScript : "";
            for (let v = 0; v < b; v++) i.append(u[v], oe()), V.nextNode(), l.push({ type: 2, index: ++a });
            i.append(u[b], oe());
          }
        }
      } else if (i.nodeType === 8) if (i.data === ht) l.push({ type: 2, index: a });
      else {
        let u = -1;
        for (; (u = i.data.indexOf(H, u + 1)) !== -1; ) l.push({ type: 7, index: a }), u += H.length - 1;
      }
      a++;
    }
  }
  static createElement(t, n) {
    const s = q.createElement("template");
    return s.innerHTML = t, s;
  }
}
function se(e, t, n = e, s) {
  if (t === ne) return t;
  let i = s !== void 0 ? n._$Co?.[s] : n._$Cl;
  const a = le(t) ? void 0 : t._$litDirective$;
  return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, s)), s !== void 0 ? (n._$Co ??= [])[s] = i : n._$Cl = i), i !== void 0 && (t = se(e, i._$AS(e, t.values), i, s)), t;
}
class Ct {
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
    const { el: { content: n }, parts: s } = this._$AD, i = (t?.creationScope ?? q).importNode(n, !0);
    V.currentNode = i;
    let a = V.nextNode(), r = 0, o = 0, l = s[0];
    for (; l !== void 0; ) {
      if (r === l.index) {
        let p;
        l.type === 2 ? p = new pe(a, a.nextSibling, this, t) : l.type === 1 ? p = new l.ctor(a, l.name, l.strings, this, t) : l.type === 6 && (p = new Zt(a, this, t)), this._$AV.push(p), l = s[++o];
      }
      r !== l?.index && (a = V.nextNode(), r++);
    }
    return V.currentNode = q, i;
  }
  p(t) {
    let n = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, n), n += s.strings.length - 2) : s._$AI(t[n])), n++;
  }
}
class pe {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, n, s, i) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = t, this._$AB = n, this._$AM = s, this.options = i, this._$Cv = i?.isConnected ?? !0;
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
    t = se(this, t, n), le(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== ne && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Lt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && le(this._$AH) ? this._$AA.nextSibling.data = t : this.T(q.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: n, _$litType$: s } = t, i = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = ce.createElement(mt(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(n);
    else {
      const a = new Ct(i, this), r = a.u(this.options);
      a.p(n), this.T(r), this._$AH = a;
    }
  }
  _$AC(t) {
    let n = Je.get(t.strings);
    return n === void 0 && Je.set(t.strings, n = new ce(t)), n;
  }
  k(t) {
    Le(this._$AH) || (this._$AH = [], this._$AR());
    const n = this._$AH;
    let s, i = 0;
    for (const a of t) i === n.length ? n.push(s = new pe(this.O(oe()), this.O(oe()), this, this.options)) : s = n[i], s._$AI(a), i++;
    i < n.length && (this._$AR(s && s._$AB.nextSibling, i), n.length = i);
  }
  _$AR(t = this._$AA.nextSibling, n) {
    for (this._$AP?.(!1, !0, n); t !== this._$AB; ) {
      const s = Ue(t).nextSibling;
      Ue(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class xe {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, n, s, i, a) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = t, this.name = n, this._$AM = i, this.options = a, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = h;
  }
  _$AI(t, n = this, s, i) {
    const a = this.strings;
    let r = !1;
    if (a === void 0) t = se(this, t, n, 0), r = !le(t) || t !== this._$AH && t !== ne, r && (this._$AH = t);
    else {
      const o = t;
      let l, p;
      for (t = a[0], l = 0; l < a.length - 1; l++) p = se(this, o[s + l], n, l), p === ne && (p = this._$AH[l]), r ||= !le(p) || p !== this._$AH[l], p === h ? t = h : t !== h && (t += (p ?? "") + a[l + 1]), this._$AH[l] = p;
    }
    r && !i && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Bt extends xe {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class It extends xe {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class jt extends xe {
  constructor(t, n, s, i, a) {
    super(t, n, s, i, a), this.type = 5;
  }
  _$AI(t, n = this) {
    if ((t = se(this, t, n, 0) ?? h) === ne) return;
    const s = this._$AH, i = t === h && s !== h || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, a = t !== h && (s === h || i);
    i && this.element.removeEventListener(this.name, this, s), a && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Zt {
  constructor(t, n, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = n, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    se(this, t);
  }
}
const Ht = Ne.litHtmlPolyfillSupport;
Ht?.(ce, pe), (Ne.litHtmlVersions ??= []).push("3.3.3");
const Ft = (e, t, n) => {
  const s = n?.renderBefore ?? t;
  let i = s._$litPart$;
  if (i === void 0) {
    const a = n?.renderBefore ?? null;
    s._$litPart$ = i = new pe(t.insertBefore(oe(), a), a, void 0, n ?? {});
  }
  return i._$AI(e), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Re = globalThis;
class G extends ee {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const n = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ft(n, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return ne;
  }
}
G._$litElement$ = !0, G.finalized = !0, Re.litElementHydrateSupport?.({ LitElement: G });
const Ut = Re.litElementPolyfillSupport;
Ut?.({ LitElement: G });
(Re.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ce = (e) => (t, n) => {
  n !== void 0 ? n.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Wt = { attribute: !0, type: String, converter: $e, reflect: !1, hasChanged: Oe }, Vt = (e = Wt, t, n) => {
  const { kind: s, metadata: i } = n;
  let a = globalThis.litPropertyMetadata.get(i);
  if (a === void 0 && globalThis.litPropertyMetadata.set(i, a = /* @__PURE__ */ new Map()), s === "setter" && ((e = Object.create(e)).wrapped = !0), a.set(n.name, e), s === "accessor") {
    const { name: r } = n;
    return { set(o) {
      const l = t.get.call(this);
      t.set.call(this, o), this.requestUpdate(r, l, e, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(r, void 0, e, o), o;
    } };
  }
  if (s === "setter") {
    const { name: r } = n;
    return function(o) {
      const l = this[r];
      t.call(this, o), this.requestUpdate(r, l, e, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function ue(e) {
  return (t, n) => typeof n == "object" ? Vt(e, t, n) : ((s, i, a) => {
    const r = i.hasOwnProperty(a);
    return i.constructor.createProperty(a, s), r ? Object.getOwnPropertyDescriptor(i, a) : void 0;
  })(e, t, n);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function f(e) {
  return ue({ ...e, state: !0, attribute: !1 });
}
const B = 6378137, gt = 256, ae = Math.PI * B;
function ft(e, t) {
  const n = Math.max(0, Math.min(360, t));
  return Math.PI * e * e * n / 360;
}
function K(e) {
  if (e.length < 3) return 0;
  let t = 0;
  for (let n = 0; n < e.length; n++) {
    const [s, i] = e[n], [a, r] = e[(n + 1) % e.length];
    t += s * r - a * i;
  }
  return Math.abs(t) / 2;
}
function L(e, t, n) {
  const s = n * Math.PI / 180;
  return [e[0] + Math.sin(s) * t, e[1] - Math.cos(s) * t];
}
function de(e, t) {
  return (Math.atan2(t[0] - e[0], -(t[1] - e[1])) * 180 / Math.PI + 360) % 360;
}
function S(e, t) {
  return Math.hypot(e[0] - t[0], e[1] - t[1]);
}
function Kt(e, t, n, s) {
  const [i, a] = e;
  if (s >= 360)
    return `M ${i - t} ${a} a ${t} ${t} 0 1 0 ${2 * t} 0 a ${t} ${t} 0 1 0 ${-2 * t} 0 Z`;
  const [r, o] = L(e, t, n), [l, p] = L(e, t, n + s), m = s > 180 ? 1 : 0;
  return `M ${i} ${a} L ${r} ${o} A ${t} ${t} 0 ${m} 1 ${l} ${p} Z`;
}
function me(e) {
  const t = e.length || 1;
  return [e.reduce((n, s) => n + s[0], 0) / t, e.reduce((n, s) => n + s[1], 0) / t];
}
function _e(e, t) {
  return 2 * Math.PI * B * Math.cos(e * Math.PI / 180) / (gt * 2 ** t);
}
function Xe(e, t) {
  return Math.log2(
    2 * Math.PI * B * Math.cos(e * Math.PI / 180) * t / gt
  );
}
function Ye(e, t, n) {
  const [s, i] = n, a = Math.PI / 180;
  return [
    (t - i) * a * B * Math.cos(s * a),
    -(e - s) * a * B
  ];
}
function Gt(e, t) {
  const [n, s] = t, i = 180 / Math.PI;
  return [
    n - e[1] / B * i,
    s + e[0] / (B * Math.cos(n / i)) * i
  ];
}
function Qe(e, t, n, s, i = 200) {
  const [a, r] = t, o = Math.PI / 180, l = 1 / Math.cos(a * o), p = B * r * o, m = B * Math.log(Math.tan(Math.PI / 4 + a * o / 2)), u = 2 ** s, b = 2 * ae / u, v = (E) => (p + E * l + ae) / b, d = (E) => (ae - (m - E * l)) / b, w = Math.max(0, Math.floor(v(n.x0))), P = Math.min(u - 1, Math.floor(v(n.x1))), k = Math.max(0, Math.floor(d(n.y0))), A = Math.min(u - 1, Math.floor(d(n.y1))), z = [];
  if ((P - w + 1) * (A - k + 1) > i) return z;
  for (let E = k; E <= A; E++)
    for (let N = w; N <= P; N++) {
      const J = N * b - ae, we = ae - E * b;
      z.push({
        url: e.replace("{z}", String(s)).replace("{x}", String(N)).replace("{y}", String(E)),
        key: `${s}/${N}/${E}`,
        x: (J - p) / l,
        y: (m - we) / l,
        size: b / l
      });
    }
  return z;
}
function qt(e, t, n) {
  let s = null, i = n;
  for (const a of t) {
    const r = S(e, a);
    r <= i && (s = a, i = r);
  }
  return s;
}
function te(e, t = !1) {
  let n = 0;
  for (let s = 1; s < e.length; s++) n += S(e[s - 1], e[s]);
  return t && e.length > 2 && (n += S(e[e.length - 1], e[0])), n;
}
function Jt(e, t) {
  const n = t ? e.length : e.length - 1, s = [];
  for (let i = 0; i < n; i++) s.push(S(e[i], e[(i + 1) % e.length]));
  return s;
}
function Xt(e, t, n) {
  const s = (t + 1) % e.length, i = e[t], a = e[s], r = S(i, a);
  if (!(n > 0) || r === 0) return e;
  const o = n / r, l = [i[0] + (a[0] - i[0]) * o, i[1] + (a[1] - i[1]) * o];
  return e.map((p, m) => m === s ? l : p);
}
function bt(e, t) {
  return e.length < 2 || t <= 0 ? 0 : te(e) * 2 * t + Math.PI * t * t;
}
function Yt(e, t) {
  let n = te(e) * Math.max(0, Math.min(1, t));
  for (let s = 1; s < e.length; s++) {
    const i = S(e[s - 1], e[s]);
    if (n <= i && i > 0) {
      const a = n / i;
      return [
        e[s - 1][0] + (e[s][0] - e[s - 1][0]) * a,
        e[s - 1][1] + (e[s][1] - e[s - 1][1]) * a
      ];
    }
    n -= i;
  }
  return e[e.length - 1];
}
function Qt(e, t) {
  let n = Number.POSITIVE_INFINITY;
  for (let s = 1; s < t.length; s++) {
    const [i, a] = [t[s - 1], t[s]], r = a[0] - i[0], o = a[1] - i[1], l = r * r + o * o, p = l === 0 ? 0 : Math.max(0, Math.min(1, ((e[0] - i[0]) * r + (e[1] - i[1]) * o) / l));
    n = Math.min(n, Math.hypot(e[0] - (i[0] + p * r), e[1] - (i[1] + p * o)));
  }
  return n;
}
function et(e, t) {
  let n = 1;
  for (let r = 2; r < e.length; r++)
    S(e[r - 1], e[r]) > S(e[n - 1], e[n]) && (n = r);
  const [s, i] = [e[n - 1], e[n]], a = S(s, i) || 1;
  return [(s[0] + i[0]) / 2 + (i[1] - s[1]) / a * t, (s[1] + i[1]) / 2 - (i[0] - s[0]) / a * t];
}
function en(e, t) {
  if (e.length < 2) return "";
  const n = (a) => Math.round(a * 1e3) / 1e3;
  let s = `M${n(e[0][0])} ${n(e[0][1])}`;
  for (let a = 1; a < e.length - 1; a++) {
    const [r, o, l] = [e[a - 1], e[a], e[a + 1]], p = S(r, o), m = S(o, l), u = Math.min(t, p / 2, m / 2);
    if (u <= 0) {
      s += ` L${n(o[0])} ${n(o[1])}`;
      continue;
    }
    const b = [o[0] + (r[0] - o[0]) / p * u, o[1] + (r[1] - o[1]) / p * u], v = [o[0] + (l[0] - o[0]) / m * u, o[1] + (l[1] - o[1]) / m * u];
    s += ` L${n(b[0])} ${n(b[1])} Q${n(o[0])} ${n(o[1])} ${n(v[0])} ${n(v[1])}`;
  }
  const i = e[e.length - 1];
  return `${s} L${n(i[0])} ${n(i[1])}`;
}
const Z = {
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
}, tn = 60;
function U(e) {
  return Z[e]?.family ?? "area";
}
function X(e) {
  return e.kind === "label" && e.label ? e.label : e.label || Z[e.kind]?.label || e.kind;
}
function nn(e) {
  const t = new Set(e.map((s) => s.id));
  let n = e.length + 1;
  for (; t.has(`f${n}`); ) n++;
  return `f${n}`;
}
const Se = {
  sand: "#e9d8a6",
  loamy_sand: "#dcc28c",
  sandy_loam: "#c9a46c",
  loam: "#a9825a",
  silt_loam: "#c4a27a",
  clay_loam: "#8e6a4f",
  clay: "#6f5443"
};
function sn(e) {
  const t = e.filter((n) => n.kind === "boundary" && n.points.length >= 3);
  return t.length ? t.reduce((n, s) => n + K(s.points), 0) : null;
}
const an = "Suche: © OpenStreetMap-Mitwirkende";
async function rn(e, t, n = "de") {
  if (t.trim().length < 3) throw new Error("Bitte mindestens 3 Zeichen eingeben");
  return (await e({
    type: "irrigation_planner/geocode",
    query: t.trim(),
    language: n
  })).places ?? [];
}
const Be = _t`
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
  button.chip.toggle {
    color: inherit;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid transparent;
  }
  button.chip.toggle:hover {
    border-color: currentColor;
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
    stroke: color-mix(in srgb, var(--zone) 14%, transparent);
    stroke-linecap: round;
    stroke-linejoin: round;
    cursor: pointer;
  }
  .zone:hover polyline.hose-band,
  .zone.selected polyline.hose-band {
    stroke: color-mix(in srgb, var(--zone) 24%, transparent);
  }
  .zone polyline.hose-reach {
    fill: none;
    stroke: var(--zone);
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.9;
    pointer-events: none;
  }
  .zone .hose-end {
    fill: var(--zone);
    stroke: #fff;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .banner label.inline {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
  }
  .banner label.inline input {
    width: 64px;
    padding: 2px 4px;
  }
  .zone polyline.hose-line {
    fill: none;
    stroke: var(--zone);
    stroke-width: 4;
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
  :host([narrow]) .pages .label {
    display: none;
  }
  :host([narrow]) .pages {
    margin-left: 8px;
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
  svg.plan.wet .zone.nowet path,
  svg.plan.wet .zone.nowet polygon {
    fill: url(#wet-hatch);
  }
  svg.plan.wet .zone.nowet polyline.hose-band {
    stroke: url(#wet-hatch);
    stroke-width: calc(var(--band) * 1px);
  }
  svg.plan.wet .zone.nowet .label .sub {
    fill: var(--bad);
  }
  .wet-missing {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .wet-missing .hatch {
    display: inline-block;
    width: 12px;
    height: 10px;
    margin-right: 6px;
    vertical-align: -1px;
    border: 1px solid var(--muted);
    background: repeating-linear-gradient(45deg, rgba(90, 90, 90, 0.55) 0 2px, transparent 2px 6px);
  }
  svg.plan.wet .zone polyline.hose-reach {
    opacity: 0.5;
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
  .levels button ha-icon {
    --mdc-icon-size: 16px;
    margin-right: 4px;
    vertical-align: -3px;
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
    fill: none;
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

  /* Betrieb */
  .operation .card h2 {
    font-size: 16px;
    font-weight: 500;
    margin: 12px 0 8px;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .card-head .spacer {
    flex: 1;
  }
  .card-head select {
    width: auto;
    max-width: 50%;
    font: inherit;
    padding: 4px 6px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--card);
    color: inherit;
  }
  .queue,
  .history {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .queue li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 4px 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .queue li:first-child {
    border-top: none;
  }
  .queue li.running ha-icon {
    color: var(--accent);
  }
  .queue li.waiting {
    color: var(--muted);
  }
  .queue .what {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .queue .what strong {
    color: var(--primary-text-color, #212121);
  }
  .queue .what small,
  .queue .left {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .operation .bar {
    height: 6px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    overflow: hidden;
    margin-top: 4px;
  }
  .operation .bar > div {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
    transition: width 0.9s linear;
  }
  .operation .bar.small {
    width: 120px;
    max-width: 100%;
    background: color-mix(in srgb, var(--warn) 18%, transparent);
  }
  .operation .bar.small > div {
    background: var(--warn);
  }
  .operation td small,
  .operation p.small {
    color: var(--muted);
  }
  .operation small.bad {
    color: var(--bad);
  }
  .legend {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: var(--muted);
  }
  .legend i {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-right: 6px;
    vertical-align: -1px;
  }
  svg.chart {
    width: 100%;
    height: auto;
    max-height: 260px;
    margin-top: 8px;
    font-size: 13px;
  }
  svg.chart .grid {
    stroke: var(--line);
    stroke-width: 1;
  }
  svg.chart .axis {
    stroke: var(--muted);
    stroke-width: 1;
  }
  svg.chart text {
    fill: var(--muted);
  }
  svg.chart .day,
  svg.chart .liters {
    text-anchor: middle;
  }
  svg.chart .liters {
    fill: var(--accent);
  }
  svg.chart .hit {
    fill: transparent;
  }
  svg.chart g:hover .hit {
    fill: color-mix(in srgb, currentColor 6%, transparent);
  }
  .history li {
    display: grid;
    grid-template-columns: auto 110px 1fr;
    gap: 2px 10px;
    align-items: start;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .history li:first-child {
    border-top: none;
  }
  .history .time {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .history li div {
    display: flex;
    flex-direction: column;
  }
  .history li small {
    color: var(--muted);
  }
  .history li.ok ha-icon {
    color: var(--ok);
  }
  .history li.warn ha-icon {
    color: var(--warn);
  }
  .history li.bad ha-icon {
    color: var(--bad);
  }
  .history li.muted ha-icon {
    color: var(--muted);
  }
  :host([narrow]) .history li {
    grid-template-columns: auto 1fr;
  }
  :host([narrow]) .history li > div {
    grid-column: 2;
  }
  :host([narrow]) .queue li {
    grid-template-columns: auto 1fr auto;
  }
  :host([narrow]) .queue .left {
    grid-column: 2;
  }
`;
var on = Object.defineProperty, ln = Object.getOwnPropertyDescriptor, I = (e, t, n, s) => {
  for (var i = s > 1 ? void 0 : s ? ln(t, n) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (s ? r(t, n, i) : r(i)) || i);
  return s && i && on(t, n, i), i;
};
const ge = "irrigation_planner", tt = "#eb6834", nt = "#2a78d6";
function R(e) {
  if (e = Math.max(0, Math.round(e)), e < 60) return `${e} s`;
  const t = Math.floor(e / 60), n = e % 60;
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : n && t < 10 ? `${t}:${String(n).padStart(2, "0")} min` : `${Math.round(e / 60)} min`;
}
function _(e, t = 1) {
  return e == null ? "–" : e.toLocaleString("de-DE", { maximumFractionDigits: t });
}
function cn(e, t) {
  if (!e.started_at || !e.ends_at) return { left: e.duration_s, done: 0 };
  const n = Date.parse(e.started_at), s = Date.parse(e.ends_at), i = Math.max(0, (s - t) / 1e3), a = s > n ? Math.min(1, Math.max(0, (t - n) / (s - n))) : 0;
  return { left: i, done: a };
}
const ze = {
  queued: "wartet",
  opening: "öffnet",
  running: "gießt",
  closing: "schließt",
  pause: "Pause",
  done: "fertig",
  skipped: "abgebrochen",
  failed: "Fehler",
  cancelled: "nicht gestartet"
};
function dn(e) {
  if (e.kind === "run") {
    const t = [`${R(e.seconds ?? 0)} von ${R(e.planned_s ?? 0)}`];
    e.liters != null && t.push(`${_(e.liters)} L${e.measured ? " (gemessen)" : " (geschätzt)"}`), e.mm != null && t.push(`${_(e.mm)} mm`), e.source_text && t.push(e.source_text);
    const n = e.state === "done" ? "ok" : e.state === "failed" ? "bad" : "warn";
    return { title: `${e.zone_name}: ${ze[e.state ?? ""] ?? e.state}${e.error ? ` (${e.error})` : ""}`, detail: t.join(" · "), tone: n, icon: "mdi:water" };
  }
  if (e.kind === "cancelled")
    return {
      title: `${e.zone_name}: aus der Warteschlange genommen`,
      detail: [e.source_text, `${R(e.planned_s ?? 0)} geplant`].filter(Boolean).join(" · "),
      tone: "muted",
      icon: "mdi:playlist-remove"
    };
  if (e.kind === "program_started") {
    const t = e.source === "schedule" ? "nach Zeitplan" : "von Hand";
    return {
      title: `Programm ${e.program_name} gestartet`,
      detail: [t, e.planned_s ? `${R(e.planned_s)} gesamt` : ""].filter(Boolean).join(" · "),
      tone: "ok",
      icon: "mdi:play-circle-outline"
    };
  }
  return e.kind === "program_skipped" ? { title: `Programm ${e.program_name} übersprungen`, detail: e.reason ?? "", tone: "warn", icon: "mdi:skip-next-circle-outline" } : {
    title: e.severity === "alarm" ? "Alarm" : "Warnung",
    detail: e.message ?? "",
    tone: "bad",
    icon: "mdi:alert-outline"
  };
}
let D = class extends G {
  constructor() {
    super(...arguments), this.history = [], this.historyZone = "", this.error = "", this.now = Date.now(), this.busy = "", this.showTable = !1, this.historyKey = "";
  }
  get tz() {
    return this.hass?.config?.time_zone;
  }
  connectedCallback() {
    super.connectedCallback(), this.subscribe(), this.timer = window.setInterval(() => {
      this.data?.queue.some((e) => e.ends_at) && (this.now = Date.now());
    }, 1e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.unsub?.(), this.unsub = void 0, window.clearInterval(this.timer);
  }
  async subscribe() {
    if (!(!this.hass || this.unsub))
      try {
        this.unsub = await this.hass.connection.subscribeMessage(
          (e) => {
            this.data = e, this.now = Date.now();
            const t = `${e.history_count}|${e.history_last}`;
            t !== this.historyKey && (this.historyKey = t, this.loadHistory());
          },
          { type: `${ge}/operation/subscribe` }
        );
      } catch (e) {
        this.error = this.message(e);
      }
  }
  async loadHistory() {
    try {
      const e = await this.hass.callWS({
        type: `${ge}/history/get`,
        limit: 150,
        ...this.historyZone ? { zone_id: this.historyZone } : {}
      });
      this.history = e.entries;
    } catch (e) {
      this.toast(this.message(e), !0);
    }
  }
  toast(e, t = !1) {
    this.dispatchEvent(new CustomEvent("ip-toast", { detail: { text: e, isError: t }, bubbles: !0, composed: !0 }));
  }
  message(e) {
    return e && typeof e == "object" && "message" in e ? String(e.message) : String(e);
  }
  async cancel(e, t) {
    this.busy = JSON.stringify(e);
    try {
      await this.hass.callWS({ type: `${ge}/queue/cancel`, ...e }), this.toast(t);
    } catch (n) {
      this.toast(this.message(n), !0);
    } finally {
      this.busy = "";
    }
  }
  async waterNow(e) {
    if (!e.planned_s) {
      this.toast(`${e.name}: keine Gießdauer (kein Bedarf und keine Dauer von Hand)`, !0);
      return;
    }
    try {
      await this.hass.callService(ge, "run_zone", { zone_id: e.id, duration: e.planned_s }), this.toast(`${e.name}: ${R(e.planned_s)} eingereiht`);
    } catch (t) {
      this.toast(this.message(t), !0);
    }
  }
  when(e, t = !0) {
    const n = new Date(e), s = { timeZone: this.tz, hour: "2-digit", minute: "2-digit" };
    if (!t) return n.toLocaleTimeString("de-DE", s);
    const i = new Date(this.now).toLocaleDateString("de-DE", { timeZone: this.tz }), a = new Date(this.now + 864e5).toLocaleDateString("de-DE", { timeZone: this.tz }), r = new Date(this.now - 864e5).toLocaleDateString("de-DE", { timeZone: this.tz }), o = n.toLocaleDateString("de-DE", { timeZone: this.tz });
    return `${o === i ? "heute" : o === a ? "morgen" : o === r ? "gestern" : n.toLocaleDateString("de-DE", { timeZone: this.tz, weekday: "short", day: "numeric", month: "numeric" })} ${n.toLocaleTimeString("de-DE", s)}`;
  }
  render() {
    if (this.error)
      return c`<div class="overview"><div class="card"><p>${this.error}</p></div></div>`;
    const e = this.data;
    return e ? c`<div class="overview operation">
      ${this.renderTiles(e)} ${this.renderNow(e)} ${this.renderZones(e)} ${this.renderWeather(e)} ${this.renderHistory(e)}
    </div>` : c`<div class="empty"><div class="spinner"></div></div>`;
  }
  // Kacheln ------------------------------------------------------------------------
  renderTiles(e) {
    const t = e.days[e.days.length - 1], n = e.programs.filter((i) => i.next).sort((i, a) => i.next < a.next ? -1 : 1)[0], s = e.weather_today;
    return c`<div class="tiles">
      <div class="tile ${e.problems.length ? "warn" : ""}">
        <span>Zustand</span>
        <strong>${e.winter_mode ? "Winterpause" : e.problems.length ? `${e.problems.length} Problem${e.problems.length > 1 ? "e" : ""}` : e.automatic ? "Automatik an" : "Automatik aus"}</strong>
        <small>${e.problems[0] ?? (e.queue.length ? `${e.queue.length} Zone(n) aktiv oder wartend` : "Alles ruhig")}</small>
      </div>
      <div class="tile">
        <span>Heute gegossen</span>
        <strong>${_(t?.liters ?? 0, 0)} L</strong>
        <small>${Object.keys(t?.zones_mm ?? {}).length} Zone(n)</small>
      </div>
      <div class="tile">
        <span>Nächster Start</span>
        <strong>${n ? this.when(n.next) : "–"}</strong>
        <small>${n ? n.name : e.automatic ? "kein Programm geplant" : "Automatik ist aus"}</small>
      </div>
      <div class="tile">
        <span>Wetter heute</span>
        <strong>${s && s.t_max != null ? `${_(s.t_min, 0)}–${_(s.t_max, 0)} °C` : "–"}</strong>
        <small>${s ? [
      s.rain_mm != null ? `Regen ${_(s.rain_mm)} mm` : "",
      s.wind_ms != null ? `Wind ${_(s.wind_ms * 3.6, 0)} km/h` : "",
      s.rh_mean != null ? `Luftfeuchte ${_(s.rh_mean, 0)} %` : ""
    ].filter(Boolean).join(" · ") : e.weather_entity ? "noch keine Messwerte" : "keine Wetterquelle eingerichtet"}</small>
      </div>
    </div>`;
  }
  // Jetzt ----------------------------------------------------------------------------
  renderNow(e) {
    const t = [...new Set(e.queue.map((s) => s.program_id).filter((s) => !!s))], n = (s) => e.programs.find((i) => i.id === s)?.name ?? s;
    return c`<section class="card now">
      <div class="card-head">
        <h2>Jetzt</h2>
        <span class="spacer"></span>
        ${t.map(
      (s) => c`<button class="text" ?disabled=${!!this.busy}
            @click=${() => this.cancel({ program_id: s }, `Programm ${n(s)} abgebrochen`)}>
            <ha-icon icon="mdi:stop-circle-outline"></ha-icon>${n(s)} abbrechen
          </button>`
    )}
        ${e.queue.length ? c`<button class="text danger" ?disabled=${!!this.busy}
              @click=${() => this.cancel({ all: !0 }, "Alles gestoppt")}>
              <ha-icon icon="mdi:stop"></ha-icon>Alles stoppen
            </button>` : h}
      </div>
      ${e.queue.length ? c`<ul class="queue">${e.queue.map((s) => this.renderQueueItem(s))}</ul>` : c`<p class="hint">Gerade läuft nichts.</p>`}
    </section>`;
  }
  renderQueueItem(e) {
    const { left: t, done: n } = cn(e, this.now), s = e.active, i = s ? e.state === "running" ? `noch ${R(t)} von ${R(e.duration_s)}` : ze[e.state] ?? e.state : `wartet · ${R(e.duration_s)}`;
    return c`<li class="${s ? "running" : "waiting"}">
      <ha-icon icon=${s ? "mdi:water" : "mdi:timer-sand"}></ha-icon>
      <div class="what">
        <strong>${e.zone_name}</strong>
        <small>${e.source_text}${e.supply ? ` · ${e.supply}` : ""}</small>
        ${s && e.state === "running" ? c`<div class="bar" role="progressbar" aria-valuenow=${Math.round(n * 100)}><div style="width:${n * 100}%"></div></div>` : h}
      </div>
      <span class="left">${i}</span>
      <button class="text" ?disabled=${!!this.busy}
        title=${s ? "Diese Zone jetzt schließen, dann mit der nächsten weitermachen" : "Diese Zone nicht gießen"}
        @click=${() => this.cancel({ zone_id: e.zone_id }, s ? `${e.zone_name} übersprungen` : `${e.zone_name} herausgenommen`)}>
        <ha-icon icon=${s ? "mdi:skip-next" : "mdi:close"}></ha-icon>${s ? "Überspringen" : "Herausnehmen"}
      </button>
    </li>`;
  }
  // Zonen ----------------------------------------------------------------------------
  renderZones(e) {
    return c`<section class="card">
      <h2>Zonen</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Zuletzt gegossen</th>
              <th class="n">Menge</th>
              <th>Bedarf jetzt</th>
              <th>Nächstes Mal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${e.zones.map((t) => {
      const n = t.last, s = t.capacity_mm > 0 ? Math.min(1, t.need_mm / t.capacity_mm) : 0;
      return c`<tr class=${t.enabled ? "" : "off"}>
                <td>
                  <strong>${t.name}</strong>
                  ${t.locked ? c`<br /><small class="bad">gesperrt: ${t.locked}</small>` : h}
                </td>
                <td>
                  ${n ? c`${this.when(n.at)}<br /><small>${R(n.seconds ?? 0)}${n.state !== "done" ? ` · ${ze[n.state ?? ""] ?? n.state}` : ""}</small>` : c`<small>noch nie</small>`}
                </td>
                <td class="n">
                  ${n?.liters != null ? c`${_(n.liters)} L` : "–"}
                  ${n?.mm != null ? c`<br /><small>${_(n.mm)} mm</small>` : h}
                </td>
                <td>
                  ${t.duration_mode === "calculated" ? c`<div class="need" title=${`${_(t.need_mm)} von ${_(t.capacity_mm)} mm nutzbarem Wasser fehlen`}>
                        <div class="bar small"><div style="width:${s * 100}%"></div></div>
                        <small>${_(t.need_mm)} mm fehlen${t.measured ? " (Sensor)" : ""}</small>
                      </div>` : c`<small>${t.duration_mode === "entity" ? "aus Entität" : "Dauer von Hand"}</small>`}
                </td>
                <td>
                  ${t.next ? c`${this.when(t.next.at)}<br /><small>${t.next.program}</small>` : c`<small>nicht geplant</small>`}
                  <br /><small>${t.planned_s ? `${R(t.planned_s)}${t.planned_liters != null ? `, ca. ${_(t.planned_liters, 0)} L` : ""}` : t.reason}</small>
                </td>
                <td class="n">
                  <button class="text" ?disabled=${!t.enabled || e.winter_mode || !!t.locked} title="In die Warteschlange einreihen"
                    @click=${() => this.waterNow(t)}>
                    <ha-icon icon="mdi:watering-can"></ha-icon>Jetzt gießen
                  </button>
                </td>
              </tr>`;
    })}
          </tbody>
        </table>
      </div>
    </section>`;
  }
  // Wetter -----------------------------------------------------------------------------
  renderWeather(e) {
    const n = this.getBoundingClientRect().width < 640 && !this.showTable ? e.days.slice(-7) : e.days, s = n.flatMap((d) => [d.et0_mm ?? 0, d.rain_mm ?? 0]), i = Math.max(4, ...s), a = 1e3, r = 190, o = 10, l = r - 24, p = a / n.length, m = Math.min(14, p / 3), u = (d) => l - d / i * (l - o), b = [0, i / 2, i].map((d) => Math.round(d * 10) / 10), v = n.some((d) => d.et0_mm != null);
    return c`<section class="card">
      <div class="card-head">
        <h2>Wetter und Wasserhaushalt (${n.length} Tage)</h2>
        <span class="spacer"></span>
        <button class="text" @click=${() => this.showTable = !this.showTable}>
          <ha-icon icon=${this.showTable ? "mdi:chart-bar" : "mdi:table"}></ha-icon>${this.showTable ? "Als Grafik" : "Als Tabelle"}
        </button>
      </div>
      <div class="legend">
        <span><i style="background:${tt}"></i>Verdunstung (mm)</span>
        <span><i style="background:${nt}"></i>Regen (mm)</span>
      </div>
      ${this.showTable ? c`<div class="table-wrap"><table>
            <thead><tr><th>Tag</th><th class="n">Verdunstung</th><th class="n">Regen</th><th class="n">Gegossen</th></tr></thead>
            <tbody>${[...n].reverse().map(
      (d) => c`<tr><td>${this.dayLabel(d.day)}</td><td class="n">${_(d.et0_mm)} mm</td>
                <td class="n">${_(d.rain_mm)} mm</td><td class="n">${_(d.liters, 0)} L</td></tr>`
    )}</tbody>
          </table></div>` : c`<svg class="chart" viewBox="0 0 ${a} ${r + 18}" role="img" aria-label="Verdunstung und Regen je Tag">
            ${b.map(
      (d) => g`<line class="grid" x1="0" x2=${a} y1=${u(d)} y2=${u(d)}></line>
                <text class="tick" x="2" y=${u(d) - 3}>${_(d)} mm</text>`
    )}
            ${n.map((d, w) => {
      const P = w * p + p / 2, k = (A, z, E, N) => A == null ? h : g`<path d=${hn(P + z, u(A), m, l - u(A))} fill=${E}>
                      <title>${this.dayLabel(d.day)}: ${N} ${_(A)} mm</title></path>`;
      return g`<g>
                <rect class="hit" x=${w * p} y=${o} width=${p} height=${l - o}>
                  <title>${this.dayLabel(d.day)}: Verdunstung ${_(d.et0_mm)} mm, Regen ${_(d.rain_mm)} mm, gegossen ${_(d.liters, 0)} L</title>
                </rect>
                ${k(d.et0_mm, -m - 1, tt, "Verdunstung")} ${k(d.rain_mm, 1, nt, "Regen")}
                <text class="day" x=${P} y=${l + 14}>${this.dayLabel(d.day, !0)}</text>
                ${d.liters ? g`<text class="liters" x=${P} y=${l + 28}>${_(d.liters, 0)} L</text>` : h}
              </g>`;
    })}
            <line class="axis" x1="0" x2=${a} y1=${l} y2=${l}></line>
          </svg>`}
      <p class="hint small">
        ${v ? h : c`<strong>Noch keine abgeschlossenen Wettertage. </strong>`}
        So rechnet die Planung (bei Zonen mit berechneter Dauer): Aus Temperatur, Luftfeuchte und Wind ergibt sich jeden
        Tag die Verdunstung. Mal Pflanzenfaktor ist das der Wasserverbrauch der Zone. Wirksamer Regen und gegossenes Wasser
        werden abgezogen. Was fehlt, ist der Bedarf („Bedarf jetzt“); daraus folgen Liter und Gießdauer.
        ${e.weather_entity ? h : c`<br /><strong>Es ist keine Wetterquelle eingerichtet</strong> (Einstellungen → Integration → Konfigurieren).`}
      </p>
    </section>`;
  }
  dayLabel(e, t = !1) {
    const n = /* @__PURE__ */ new Date(`${e}T12:00:00Z`);
    return t ? n.toLocaleDateString("de-DE", { timeZone: "UTC", day: "numeric", month: "numeric" }) : n.toLocaleDateString("de-DE", { timeZone: "UTC", weekday: "short", day: "numeric", month: "numeric" });
  }
  // Verlauf ----------------------------------------------------------------------------
  renderHistory(e) {
    return c`<section class="card">
      <div class="card-head">
        <h2>Verlauf</h2>
        <span class="spacer"></span>
        <select aria-label="Zone" .value=${this.historyZone}
          @change=${(t) => {
      this.historyZone = t.target.value, this.loadHistory();
    }}>
          <option value="">Alle Zonen</option>
          ${e.zones.map((t) => c`<option value=${t.id} ?selected=${t.id === this.historyZone}>${t.name}</option>`)}
        </select>
      </div>
      ${this.history.length ? c`<ul class="history">
            ${this.history.map((t) => {
      const n = dn(t);
      return c`<li class=${n.tone}>
                <ha-icon icon=${n.icon}></ha-icon>
                <span class="time">${this.when(t.at)}</span>
                <div><strong>${n.title}</strong>${n.detail ? c`<small>${n.detail}</small>` : h}</div>
              </li>`;
    })}
          </ul>` : c`<p class="hint">Noch nichts aufgezeichnet. Ab jetzt wird jeder Lauf mitgeschrieben.</p>`}
    </section>`;
  }
};
D.styles = Be;
I([
  ue({ attribute: !1 })
], D.prototype, "hass", 2);
I([
  f()
], D.prototype, "data", 2);
I([
  f()
], D.prototype, "history", 2);
I([
  f()
], D.prototype, "historyZone", 2);
I([
  f()
], D.prototype, "error", 2);
I([
  f()
], D.prototype, "now", 2);
I([
  f()
], D.prototype, "busy", 2);
I([
  f()
], D.prototype, "showTable", 2);
D = I([
  Ce("ip-operation")
], D);
function hn(e, t, n, s) {
  if (s <= 0) return "";
  const i = Math.min(4, n / 2, s);
  return `M${e} ${t + s}V${t + i}Q${e} ${t} ${e + i} ${t}H${e + n - i}Q${e + n} ${t} ${e + n} ${t + i}V${t + s}Z`;
}
var pn = Object.defineProperty, un = Object.getOwnPropertyDescriptor, j = (e, t, n, s) => {
  for (var i = s > 1 ? void 0 : s ? un(t, n) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (s ? r(t, n, i) : r(i)) || i);
  return s && i && pn(t, n, i), i;
};
const Y = "irrigation_planner", $t = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], fe = ["#1565c0", "#2e7d32", "#ef6c00", "#6a1b9a", "#00838f", "#c62828"], st = {
  sequence: "Nacheinander",
  cycle_soak: "Abwechselnd (mit Einziehzeit)",
  priority: "Nach Bedarf (größter zuerst)"
};
function vt(e) {
  return e.start_time === "sunrise" || e.start_time === "sunset" ? "start_sun" : e.finish_by === "sunrise" || e.finish_by === "sunset" ? "finish_sun" : e.start_time ? "start_time" : e.finish_by ? "finish_by" : "window";
}
function mn(e, t) {
  const n = (o) => o === "sunset" ? "Sonnenuntergang" : "Sonnenaufgang", s = (o) => o === 0 ? "" : `${Math.abs(o) >= 60 && Math.abs(o) % 60 === 0 ? `${Math.abs(o) / 60} h` : `${Math.abs(o)} min`} ${o < 0 ? "vor" : "nach"} `, i = (o) => (o ?? "").slice(0, 5);
  let a = "";
  switch (vt(e)) {
    case "start_sun":
      a = e.sun_offset_min ? `Start ${s(e.sun_offset_min)}${n(e.start_time)}` : `Start bei ${n(e.start_time)}`;
      break;
    case "finish_sun":
      a = e.sun_offset_min ? `fertig ${s(e.sun_offset_min)}${n(e.finish_by)}` : `fertig bei ${n(e.finish_by)}`;
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
  const r = e.interval_days ? `alle ${e.interval_days} Tage` : e.weekdays.length && e.weekdays.length < 7 ? e.weekdays.map((o) => $t[o]).join(" ") : "täglich";
  return `${a}, ${r}`;
}
function Pe(e) {
  if (e < 60) return `${e} s`;
  const t = Math.round(e / 60);
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
function it(e, t) {
  const n = typeof e == "string" ? new Date(e) : e, s = Object.fromEntries(
    new Intl.DateTimeFormat("de-DE", {
      timeZone: t,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(n).map((i) => [i.type, i.value])
  );
  return {
    day: `${s.year}-${s.month}-${s.day}`,
    minutes: Number(s.hour) * 60 + Number(s.minute),
    time: `${s.hour}:${s.minute}`
  };
}
let O = class extends G {
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
      this.data = await this.hass.callWS({ type: `${Y}/programs/get` }), this.error = "";
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
        type: `${Y}/programs/save`,
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
        type: `${Y}/programs/save`,
        program_id: e.id,
        enabled: !e.enabled
      });
    } catch (t) {
      this.toast(this.message(t), !0);
    }
  }
  async service(e, t, n) {
    try {
      await this.hass.callService(Y, e, { program_id: t.id }), this.toast(n), await this.load();
    } catch (s) {
      this.toast(this.message(s), !0);
    }
  }
  async create() {
    const e = this.newName.trim();
    if (e)
      try {
        await this.hass.callWS({ type: `${Y}/programs/create`, name: e }), this.newName = "", this.toast(`„${e}“ angelegt, wird geladen …`), setTimeout(() => void this.load(), 4e3);
      } catch (t) {
        this.toast(this.message(t), !0);
      }
  }
  async deleteProgram(e) {
    try {
      await this.hass.callWS({ type: `${Y}/programs/delete`, program_id: e.id }), this.editing = null, this.toast(`„${e.name}“ gelöscht, wird geladen …`), setTimeout(() => void this.load(), 4e3);
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
        ${e.winter_mode ? c`<p class="note warn">Winterpause: Es startet kein Programm automatisch.</p>` : e.automatic ? h : c`<p class="note warn">Automatik ist aus: Programme starten nur von Hand oder per Automation.</p>`}
        ${this.renderWeek()}
        <section class="programs">
          ${e.programs.map((t, n) => this.renderProgram(t, n))}
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
    const e = this.data, t = it(/* @__PURE__ */ new Date(), this.tz), n = Array.from({ length: 7 }, (i, a) => {
      const r = /* @__PURE__ */ new Date(`${t.day}T12:00:00Z`);
      return r.setUTCDate(r.getUTCDate() + a), r;
    }), s = t.minutes / 1440 * 100;
    return c`
      <section class="card week">
        <h3>Die nächsten 7 Tage</h3>
        <div class="week-grid">
          <div class="hours">${[0, 3, 6, 9, 12, 15, 18, 21].map((i) => c`<span style="left:${i / 24 * 100}%">${i}</span>`)}</div>
          ${n.map((i, a) => {
      const r = i.toISOString().slice(0, 10), o = a === 0 ? "Heute" : i.toLocaleDateString("de-DE", { timeZone: "UTC", weekday: "short", day: "numeric" }), l = e.programs.flatMap(
        (p, m) => p.upcoming.map((u) => it(u, this.tz)).filter((u) => u.day === r).map((u) => {
          const b = u.minutes / 1440 * 100, v = Math.max(0.6, p.total_s / 86400 * 100);
          return c`<div class="block ${p.enabled ? "" : "off"}" title=${`${p.name}: ${u.time} Uhr, ${Pe(p.total_s)}`}
                    style="left:${b}%; width:${v}%; --c:${fe[m % fe.length]}">
                    <span>${u.time} ${p.name}</span>
                  </div>`;
        })
      );
      return c`<div class="day"><span class="day-label">${o}</span>
              <div class="track">${l}${a === 0 ? c`<div class="now" style="left:${s}%"></div>` : h}</div></div>`;
    })}
        </div>
        <p class="hint small">Nur Programme, die automatisch starten (aktiv, Automatik an, keine Winterpause). Wetter kann einen Start noch überspringen.</p>
      </section>
    `;
  }
  renderProgram(e, t) {
    const n = this.editing === e.id;
    return c`
      <div class="card program" style="--c:${fe[t % fe.length]}">
        <div class="program-head">
          <span class="swatch" style="background:var(--c)"></span>
          <h3>${e.name}</h3>
          <span class="spacer"></span>
          <label class="check" title="Programm startet automatisch">
            <input type="checkbox" .checked=${e.enabled} @change=${() => this.toggle(e)} /> aktiv
          </label>
        </div>
        <p class="when">${mn(e, this.data.window_end)}</p>
        <dl>
          <dt>Nächster Start</dt>
          <dd>${e.next_start ? this.fmtWhen(e.next_start) : "–"}${e.skip_next ? c` <em>(wird übersprungen)</em>` : h}</dd>
          <dt>Ablauf</dt>
          <dd>${st[e.mode] ?? e.mode}, ${Pe(e.total_s)} gesamt</dd>
          <dt>Zonen</dt>
          <dd>${e.steps.length ? c`<ol class="steps">${e.steps.map((s) => c`<li>${s.zone_name} <small>${Pe(s.duration_s)}</small></li>`)}</ol>` : c`<em>keine Zone mit Bedarf oder Dauer</em>`}</dd>
          ${e.last_result ? c`<dt>Zuletzt</dt><dd>${this.fmtWhen(e.last_result.at)}: ${e.last_result.started ? "gestartet" : `übersprungen (${e.last_result.reason})`}</dd>` : h}
        </dl>
        <div class="actions">
          <button class="text" @click=${() => n ? this.editing = null : this.edit(e)}>
            <ha-icon icon="mdi:pencil"></ha-icon>${n ? "Schließen" : "Bearbeiten"}
          </button>
          <span class="spacer"></span>
          <button class="text" ?disabled=${!e.next_start || e.skip_next} @click=${() => this.service("skip_next", e, `${e.name}: nächster Start wird übersprungen`)}>
            <ha-icon icon="mdi:skip-next"></ha-icon>Nächsten überspringen
          </button>
          <button class="text" @click=${() => this.service("run_program", e, `${e.name}: eingereiht`)}>
            <ha-icon icon="mdi:play"></ha-icon>Jetzt starten
          </button>
        </div>
        ${n && this.draft ? this.renderEditor(this.draft) : h}
      </div>
    `;
  }
  renderEditor(e) {
    const t = vt(e), n = () => this.draft = { ...e }, s = (a) => {
      const r = e.start_time === "sunset" || e.finish_by === "sunset" ? "sunset" : "sunrise";
      e.start_time = a === "start_time" ? "06:00" : a === "start_sun" ? r : null, e.finish_by = a === "finish_by" ? "07:00" : a === "finish_sun" ? r : null, a !== "start_sun" && a !== "finish_sun" && (e.sun_offset_min = 0), n();
    }, i = e.start_time === "sunset" || e.finish_by === "sunset" ? "sunset" : "sunrise";
    return c`
      <div class="editor">
        <label class="field wide"><span>Name</span>
          <input type="text" .value=${e.name} @change=${(a) => (e.name = a.target.value, n())} />
        </label>
        <div class="field wide"><span>Zonen (Reihenfolge = Ablauf)</span>
          <div class="zone-pick">
            ${this.zones.map((a) => {
      const r = e.zone_ids.indexOf(a.id);
      return c`<button class=${r >= 0 ? "active" : ""} @click=${() => {
        e.zone_ids = r >= 0 ? e.zone_ids.filter((o) => o !== a.id) : [...e.zone_ids, a.id], n();
      }}>${r >= 0 ? c`<b>${r + 1}</b>` : h}${a.name}</button>`;
    })}
          </div>
        </div>
        <label class="field wide"><span>Ablauf</span>
          <select @change=${(a) => (e.mode = a.target.value, n())}>
            ${Object.entries(st).map(([a, r]) => c`<option value=${a} ?selected=${a === e.mode}>${r}</option>`)}
          </select>
        </label>
        <div class="fields">
          <label class="field"><span>Pause zwischen Zonen</span>
            <input type="number" min="0" .value=${String(e.pause_between_s)}
              @change=${(a) => (e.pause_between_s = Number(a.target.value) || 0, n())} />
            <span class="unit">s</span></label>
          ${e.mode === "cycle_soak" ? c`<label class="field"><span>Gießphase</span>
                <input type="number" min="1" .value=${String(Math.round((e.cycle_s ?? 300) / 60))}
                  @change=${(a) => (e.cycle_s = Math.max(1, Number(a.target.value)) * 60, n())} />
                <span class="unit">min</span></label>
              <label class="field"><span>Einziehzeit</span>
                <input type="number" min="0" .value=${String(Math.round((e.soak_s ?? 0) / 60))}
                  @change=${(a) => (e.soak_s = Number(a.target.value) * 60 || null, n())} />
                <span class="unit">min</span></label>` : h}
        </div>
        <label class="field wide"><span>Wann?</span>
          <select @change=${(a) => s(a.target.value)}>
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
      t === "start_time" ? e.start_time = r : e.finish_by = r, n();
    }} /></label>` : h}
        ${t === "start_sun" || t === "finish_sun" ? c`<div class="fields">
              <label class="field"><span>Sonne</span>
                <select @change=${(a) => {
      const r = a.target.value;
      t === "start_sun" ? e.start_time = r : e.finish_by = r, n();
    }}>
                  <option value="sunrise" ?selected=${i === "sunrise"}>Sonnenaufgang</option>
                  <option value="sunset" ?selected=${i === "sunset"}>Sonnenuntergang</option>
                </select></label>
              <label class="field"><span>Versatz (− = vorher)</span>
                <input type="number" step="5" min="-360" max="360" .value=${String(e.sun_offset_min)}
                  @change=${(a) => (e.sun_offset_min = Math.round(Number(a.target.value) || 0), n())} />
                <span class="unit">min</span></label>
            </div>` : h}
        <div class="field wide"><span>Tage</span>
          <div class="levels">
            ${$t.map((a, r) => c`<button class=${e.weekdays.includes(r) ? "active" : ""} ?disabled=${!!e.interval_days}
              @click=${() => (e.weekdays = e.weekdays.includes(r) ? e.weekdays.filter((o) => o !== r) : [...e.weekdays, r].sort(), n())}>${a}</button>`)}
          </div>
          <small class="hint">Keiner gewählt = jeden Tag.</small>
        </div>
        <label class="field wide"><span>Oder alle N Tage (0 = aus)</span>
          <input type="number" min="0" max="60" .value=${String(e.interval_days ?? 0)}
            @change=${(a) => (e.interval_days = Number(a.target.value) || null, n())} /></label>
        <div class="checks">
          ${["skip_on_rain", "skip_on_frost", "skip_on_wind"].map(
      (a) => c`<label class="check"><input type="checkbox" .checked=${e[a]}
              @change=${(r) => (e[a] = r.target.checked, n())} />
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
        ({{ (trigger.event.data.seconds_open / 60) | round }} min)`, n = e.programs[0]?.id ?? "morgens";
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
      (s) => c`<tr>
                  <td>${s.name}</td>
                  <td><code>irrigation_planner.run_program</code><br /><small>program_id: <code>${s.id}</code></small></td>
                  <td>${Object.values(s.entities).map((i) => c`<code>${i}</code><br />`)}</td>
                </tr>`
    )}
            </tbody>
          </table>
        </div>
        <h3>Ereignisse</h3>
        <ul class="events">
          ${e.events.map((s) => c`<li><code>${s.type}</code> – ${s.description}</li>`)}
        </ul>
        <h3>Beispiele</h3>
        <p class="hint small">Benachrichtigung, wenn eine Zone fertig ist:</p>
        <pre>${t}</pre>
        <p class="hint small">Programm aus einer Automation starten:</p>
        <pre>actions:
  - action: irrigation_planner.run_program
    data:
      program_id: ${n}</pre>
        <p class="hint small">Weitere Dienste: <code>run_zone</code> (Zone mit Dauer einreihen), <code>stop_all</code>, <code>skip_next</code>, <code>release_zone</code>.</p>
      </section>
    `;
  }
};
O.styles = Be;
j([
  ue({ attribute: !1 })
], O.prototype, "hass", 2);
j([
  ue({ attribute: !1 })
], O.prototype, "zones", 2);
j([
  f()
], O.prototype, "data", 2);
j([
  f()
], O.prototype, "error", 2);
j([
  f()
], O.prototype, "editing", 2);
j([
  f()
], O.prototype, "draft", 2);
j([
  f()
], O.prototype, "newName", 2);
j([
  f()
], O.prototype, "busy", 2);
O = j([
  Ce("ip-schedule")
], O);
function gn(e, t) {
  return t ? e ? null : "Orten geht nur, wenn Home Assistant über https geöffnet ist (z. B. in der App oder über Nabu Casa)." : "Dieser Browser kann nicht orten.";
}
function fn(e) {
  return e === 1 ? "Orten nicht erlaubt. Bitte in den Browser-Einstellungen den Standort erlauben." : e === 3 ? "Kein Standort gefunden (Zeit abgelaufen). Am besten im Freien noch einmal versuchen." : "Standort nicht verfügbar.";
}
function Ae(e) {
  return e >= 1e3 ? `± ${(e / 1e3).toFixed(1).replace(".", ",")} km` : `± ${Math.round(e)} m`;
}
function bn(e, t, n, s, i) {
  return S(e, t) > n ? !1 : i >= 360 ? !0 : ((de(t, e) - s) % 360 + 360) % 360 <= i;
}
function yt(e, t) {
  let n = !1;
  for (let s = 0, i = t.length - 1; s < t.length; i = s++) {
    const [a, r] = t[s], [o, l] = t[i];
    r > e[1] != l > e[1] && e[0] < (o - a) * (e[1] - r) / (l - r) + a && (n = !n);
  }
  return n;
}
function $n(e, t, n) {
  const s = n[0] - t[0], i = n[1] - t[1], a = s * s + i * i, r = a === 0 ? 0 : Math.max(0, Math.min(1, ((e[0] - t[0]) * s + (e[1] - t[1]) * i) / a));
  return Math.hypot(e[0] - (t[0] + r * s), e[1] - (t[1] + r * i));
}
function vn(e, t) {
  if (e.type === "sprinkler")
    return !!(e.center && e.radius_m) && bn(t, e.center, e.radius_m, e.start_angle_deg, e.arc_deg);
  if (e.type === "hose") {
    const n = e.radius_m ?? 0;
    for (let s = 1; s < e.polygon.length; s++)
      if ($n(t, e.polygon[s - 1], e.polygon[s]) <= n) return !0;
    return !1;
  }
  return e.polygon.length >= 3 && yt(t, e.polygon);
}
function he(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? ft(e.radius_m, e.arc_deg) : null : e.type === "hose" ? e.polygon.length >= 2 && e.radius_m ? bt(e.polygon, e.radius_m) : null : e.polygon.length >= 3 ? K(e.polygon) : null;
}
function yn(e, t, n) {
  const s = S(t, e);
  for (const i of n) {
    const a = i.points[0], r = (i.trunk_m ?? 0) / 2, o = S(t, a);
    if (r <= 0 || o <= r || s <= o) continue;
    const l = Math.asin(Math.min(1, r / o)) * 180 / Math.PI;
    if (Math.abs((de(t, e) - de(t, a) + 540) % 360 - 180) <= l) return !0;
  }
  return !1;
}
function Ie(e, t) {
  return t?.zones[e.id]?.planned_s || e.duration_s || 0;
}
function xt(e, t, n) {
  const s = t.find((r) => r.id === e.valve_id)?.learned_flow_l_min, i = he(e) ?? e.area_m2, a = Ie(e, n);
  return !s || !i || !a ? null : a / 60 * s / i;
}
function at(e, t, n) {
  return e.valve_id ? t.find((s) => s.id === e.valve_id)?.learned_flow_l_min ? he(e) ?? e.area_m2 ? Ie(e, n) ? null : "keine Gießdauer" : "keine Fläche" : "Durchfluss unbekannt" : "kein Ventil";
}
function xn(e, t, n, s, i, a = 160) {
  const [r, o, l, p] = i, m = Math.max(0.05, Math.max(l - r, p - o) / a), u = Math.max(1, Math.ceil((l - r) / m)), b = Math.max(1, Math.ceil((p - o) / m)), v = new Float32Array(u * b).fill(Number.NaN), d = s.filter((k) => k.kind === "tree" && (k.trunk_m ?? 0) > 0), w = e.filter((k) => k.enabled && he(k) !== null).map((k) => ({ zone: k, mm: xt(k, t, n) })).filter((k) => k.mm !== null);
  let P = 0;
  for (let k = 0; k < b; k++)
    for (let A = 0; A < u; A++) {
      const z = [r + (A + 0.5) * m, o + (k + 0.5) * m];
      let E = 0, N = !1;
      for (const { zone: J, mm: we } of w)
        vn(J, z) && (J.type === "sprinkler" && J.center && yn(z, J.center, d) || (E += we, N = !0));
      N && (v[k * u + A] = E, P = Math.max(P, E));
    }
  return { x0: r, y0: o, step: m, cols: u, rows: b, values: v, max: P };
}
const T = [
  [0, [120, 200, 250]],
  [2, [50, 160, 240]],
  [5, [25, 105, 220]],
  [10, [35, 45, 170]],
  [20, [115, 25, 150]],
  [30, [175, 20, 105]]
];
function wn(e) {
  if (e <= T[0][0]) return T[0][1];
  for (let t = 1; t < T.length; t++) {
    const [n, s] = T[t], [i, a] = T[t - 1];
    if (e <= n) {
      const r = (e - i) / (n - i);
      return [0, 1, 2].map((o) => Math.round(a[o] + (s[o] - a[o]) * r));
    }
  }
  return T[T.length - 1][1];
}
function kn(e) {
  const t = document.createElement("canvas");
  t.width = e.cols, t.height = e.rows;
  const n = t.getContext("2d");
  if (!n) return "";
  const s = n.createImageData(e.cols, e.rows);
  for (let i = 0; i < e.values.length; i++) {
    const a = e.values[i];
    if (Number.isNaN(a)) continue;
    const [r, o, l] = wn(a);
    s.data.set([r, o, l, 230], i * 4);
  }
  return n.putImageData(s, 0, 0), t.toDataURL();
}
var _n = Object.defineProperty, Sn = Object.getOwnPropertyDescriptor, x = (e, t, n, s) => {
  for (var i = s > 1 ? void 0 : s ? Sn(t, n) : t, a = e.length - 1, r; a >= 0; a--)
    (r = e[a]) && (i = (s ? r(t, n, i) : r(i)) || i);
  return s && i && _n(t, n, i), i;
};
const C = "irrigation_planner", rt = [
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
], ot = {
  soil_moisture: "B",
  rain_mm: "R",
  rain_binary: "R",
  water_meter: "W"
}, Pn = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge",
  rain_binary: "Regensensor",
  water_meter: "Wasserzähler"
}, Me = {
  idle: "",
  running: "läuft",
  queued: "wartet",
  locked: "gesperrt"
}, An = 0.05, Mn = 10;
let y = class extends G {
  constructor() {
    super(...arguments), this.narrow = !1, this.error = "", this.toast = "", this.tab = "zones", this.featureKind = "building", this.measurePts = [], this.snapOn = !0, this.snapHint = null, this.tool = "select", this.toolTarget = "", this.selected = null, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.view = { cx: 0, cy: 0, scale: 25 }, this.size = { w: 800, h: 600 }, this.imageUrl = "", this.imageSize = null, this.saving = !1, this.dirty = !1, this.searchOpen = !1, this.searchQuery = "", this.searchResults = null, this.searching = !1, this.searchError = "", this.searchPin = null, this.locating = !1, this.hoseRadius = 0.5, this.flowEdited = /* @__PURE__ */ new Set(), this.savedJson = "", this.history = [], this.drag = null, this.toastUndo = !1, this.layersOpen = !1, this.page = "plan", this.wetOn = !1, this.soilOn = !1, this.wetCache = null, this.menuOpen = !1, this.pendingImport = null, this.autoFit = !0, this.loadedImage = "", this.onWheel = (e) => {
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
        const s = this.featureKind, i = this.snap(n, e), a = U(s);
        if (a === "point") {
          const o = [$(i[0]), $(i[1])];
          if (s === "tree") {
            const l = this.addFeature({ kind: s, points: [o], radius_m: 0 });
            this.drag = { type: "new-tree", id: l.id }, t.setPointerCapture(e.pointerId);
          } else
            this.addFeature({ kind: s, points: [o], label: s === "label" ? "Beschriftung" : null }), this.cancelTool(), s === "label" && this.updateComplete.then(
              () => this.renderRoot.querySelector("#feature-label")?.select()
            );
          return;
        }
        const r = (o) => S(i, o) * this.view.scale < 12;
        a === "area" && this.draft.length >= 3 && r(this.draft[0]) ? this.finishFeature() : a === "line" && this.draft.length >= 2 && r(this.draft[this.draft.length - 1]) ? this.finishFeature() : this.draft = [...this.draft, i];
        return;
      }
      if (this.tool === "measure") {
        this.measurePts = [...this.measurePts, this.snap(n, e)];
        return;
      }
      if (this.tool === "hose") {
        const s = this.snap(n, e), i = this.draft[this.draft.length - 1];
        this.draft.length >= 2 && S(s, i) * this.view.scale < 12 ? this.finishHose() : this.draft = [...this.draft, s];
        return;
      }
      if (this.tool === "sprinkler") {
        this.remember();
        const s = this.zone(this.toolTarget), i = this.snap(n, e);
        n[0] = i[0], n[1] = i[1], s.center = [$(n[0]), $(n[1])], s.radius_m = 0, this.drag = { type: "new-sprinkler", id: s.id }, t.setPointerCapture(e.pointerId), this.changed();
        return;
      }
      if (this.tool === "bed") {
        const s = this.snap(n, e);
        this.draft.length >= 3 && S(s, this.draft[0]) * this.view.scale < 12 ? this.finishBed() : this.draft = [...this.draft, s];
        return;
      }
      if (this.tool === "place") {
        const [s, i] = this.toolTarget.split(":");
        this.remember();
        const a = this.marker(s, i);
        a.position = [$(n[0]), $(n[1])], this.selected = { kind: s, id: i }, this.changed(), this.cancelTool();
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
        const i = e.clientX - t.sx, a = e.clientY - t.sy;
        Math.abs(i) + Math.abs(a) > 3 && (t.moved = !0, this.autoFit = !1), this.view = {
          ...this.view,
          cx: t.cx - i / this.view.scale,
          cy: t.cy - a / this.view.scale
        };
        return;
      }
      if (t.type === "marker") {
        this.marker(t.kind, t.id).position = [$(n[0]), $(n[1])], this.changed();
        return;
      }
      const s = this.zone(t.id);
      switch (t.type) {
        case "new-sprinkler":
        case "radius":
          s.radius_m = $(Math.max(0.1, S(s.center, n)));
          break;
        case "hose-radius":
          s.radius_m = $(Math.min(20, Math.max(0.05, Qt(n, s.polygon))));
          break;
        case "center":
          s.center = [$(n[0]), $(n[1])];
          break;
        case "start": {
          const i = s.start_angle_deg + s.arc_deg, a = lt(de(s.center, n));
          let r = ((i - a) % 360 + 360) % 360;
          r < 5 && (r = 360), s.start_angle_deg = a, s.arc_deg = r;
          break;
        }
        case "end": {
          let a = ((lt(de(s.center, n)) - s.start_angle_deg) % 360 + 360) % 360;
          a < 5 && (a = 360), s.arc_deg = a;
          break;
        }
        case "route": {
          const i = s.valve_route ?? [], a = this.snap(n, e, i[t.index]);
          i[t.index] = [$(a[0]), $(a[1])], s.valve_route = i;
          break;
        }
        case "vertex": {
          const i = this.snap(n, e, s.polygon[t.index]);
          s.polygon[t.index] = [$(i[0]), $(i[1])];
          break;
        }
        case "move-zone": {
          const i = n[0] - t.start[0], a = n[1] - t.start[1];
          s.type === "sprinkler" && t.orig.center ? s.center = [$(t.orig.center[0] + i), $(t.orig.center[1] + a)] : s.polygon = t.orig.polygon.map((r) => [$(r[0] + i), $(r[1] + a)]);
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
  setPlan(e, t, n = !1) {
    this.plan = e, this.flowEdited.clear(), this.savedJson = JSON.stringify(this.editable()), this.dirty = !1, n || (this.history = []), this.loadImage(), t && this.fitView();
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
    t.background === "map" && t.latitude != null && (t.map_zoom = Math.round(Xe(t.latitude, this.view.scale) * 100) / 100), this.saving = !0;
    try {
      const n = await this._hass.callWS({
        type: `${C}/plan/save`,
        garden: t,
        zones: e.zones.map((s) => ({
          id: s.id,
          type: s.type,
          center: s.center,
          radius_m: s.radius_m,
          start_angle_deg: s.start_angle_deg,
          arc_deg: s.arc_deg,
          polygon: s.polygon,
          valve_route: s.valve_route ?? [],
          valve_id: s.valve_id,
          plant_type: s.plant_type,
          kc: s.kc,
          soil_type: s.soil_type,
          root_depth_m: s.root_depth_m
        })),
        // Durchfluss nur mitschicken, wenn er hier geändert wurde (sonst
        // würde ein inzwischen neu gelernter Wert überschrieben).
        valves: e.valves.map(
          (s) => this.flowEdited.has(s.id) ? { id: s.id, position: s.position, learned_flow_l_min: s.learned_flow_l_min } : { id: s.id, position: s.position }
        ),
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
        const t = await this._hass.fetchWithAuth(`/api/${C}/image/${e}`);
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
      const i = await this._hass.fetchWithAuth(`/api/${C}/image`, {
        method: "POST",
        body: s
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
      const t = S(e.scale_points[0], e.scale_points[1]);
      if (t > 0) return e.scale_distance_m / t;
    }
    return An;
  }
  // Ansicht --------------------------------------------------------------------
  toScreen(e) {
    const { cx: t, cy: n, scale: s } = this.view;
    return [(e[0] - t) * s + this.size.w / 2, (e[1] - n) * s + this.size.h / 2];
  }
  toPlan(e) {
    const n = this.renderRoot.querySelector("svg.plan").getBoundingClientRect(), { cx: s, cy: i, scale: a } = this.view;
    return [
      (e.clientX - n.left - this.size.w / 2) / a + s,
      (e.clientY - n.top - this.size.h / 2) / a + i
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
    const n = e.map((i) => i[0]), s = e.map((i) => i[1]);
    return [Math.min(...n), Math.min(...s), Math.max(...n), Math.max(...s)];
  }
  fitView() {
    const e = this.plan?.garden, t = this.bounds();
    if (e?.background === "map" && e.latitude != null && !t) {
      const p = e.map_zoom ?? 19;
      this.view = { cx: 0, cy: 0, scale: 1 / _e(e.latitude, p) };
      return;
    }
    if (!t) {
      this.view = { cx: 0, cy: 0, scale: 25 };
      return;
    }
    const [n, s, i, a] = t, r = Math.max(i - n, 4), o = Math.max(a - s, 4), l = Math.min(this.size.w / (r * 1.15), this.size.h / (o * 1.15), 200);
    this.view = { cx: (n + i) / 2, cy: (s + a) / 2, scale: Math.max(l, 0.5) };
  }
  zoomBy(e, t, n) {
    this.autoFit = !1;
    const { cx: s, cy: i, scale: a } = this.view, r = Math.min(Math.max(a * e, 0.5), 400);
    if (!t || !n) {
      this.view = { cx: s, cy: i, scale: r };
      return;
    }
    this.view = {
      cx: t[0] - (n[0] - this.size.w / 2) / r,
      cy: t[1] - (n[1] - this.size.h / 2) / r,
      scale: r
    };
  }
  // Werkzeuge ------------------------------------------------------------------
  startTool(e, t = "") {
    this.tool = e, this.toolTarget = t, this.draft = [], this.scaleDraft = [], this.scaleInput = "", this.measurePts = [], this.hover = null, this.snapHint = null, e === "feature" && (this.featureKind = t), e === "hose" && t && (this.hoseRadius = this.zone(t).radius_m ?? 0.5), t && (e === "sprinkler" || e === "bed" || e === "hose") && (this.selected = { kind: "zone", id: t });
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
    const s = qt(e, this.snapCandidates(n), Mn / this.view.scale);
    return this.snapHint = s, s ? [s[0], s[1]] : e;
  }
  finishFeature() {
    const e = this.featureKind, t = U(e) === "area" ? 3 : 2;
    if (this.draft.length < t) {
      this.showToast(`${Z[e].label}: mindestens ${t} Punkte`, !0);
      return;
    }
    this.addFeature({
      kind: e,
      points: this.draft.map((n) => [$(n[0]), $(n[1])]),
      soil_type: e === "soil" ? "loam" : null
    }), this.cancelTool();
  }
  addFeature(e) {
    this.remember();
    const t = {
      id: nn(this.features),
      radius_m: null,
      label: null,
      ...e
    };
    return this.features.push(t), this.selected = { kind: "feature", id: t.id }, this.tab = "plan", this.changed(), t;
  }
  deleteFeature(e) {
    const t = this.feature(e);
    this.remember(), this.plan.garden.features = this.features.filter((n) => n.id !== e), this.selected?.kind === "feature" && this.selected.id === e && (this.selected = null), this.changed(), this.removed(`${X(t)} entfernt`);
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
    e.polygon = this.draft.map((t) => [$(t[0]), $(t[1])]), e.center = null, e.radius_m = this.hoseRadius, this.selected = { kind: "zone", id: e.id }, this.changed(), this.cancelTool();
  }
  async toggleAutomatic(e) {
    try {
      await this._hass.callWS({ type: `${C}/settings/automatic`, on: e }), this.showToast(e ? "Automatik an: Programme starten nach Zeitplan" : "Automatik aus: keine Starts nach Zeitplan");
    } catch (t) {
      this.showToast(this.message(t), !0);
    }
  }
  /** Durchfluss des Ventils (gelernt oder von Hand), für Liter und Nässekarte. */
  renderValveFlow(e) {
    const t = this.plan.valves.find((n) => n.id === e.valve_id);
    return t ? c`<label class="field">
        <span>Durchfluss</span>
        <input type="number" min="0.1" max="500" step="0.1" placeholder="unbekannt"
          .value=${t.learned_flow_l_min == null ? "" : String(t.learned_flow_l_min)}
          @change=${(n) => {
      const s = n.target.value.trim(), i = s === "" ? null : parseFloat(s.replace(",", "."));
      i !== null && (!Number.isFinite(i) || i <= 0 || i > 500) || (this.remember(), t.learned_flow_l_min = i, this.flowEdited.add(t.id), this.changed());
    }} />
        <span class="unit">L/min</span>
      </label>
      <p class="hint small">${t.learned_flow_l_min ? `${t.name}. Mit Durchflusssensor wird der Wert bei jedem Lauf nachgeführt.` : `${t.name}: noch unbekannt. Ohne Sensor hier eintragen (z. B. Eimer auslitern), sonst fehlen Liter und Nässekarte.`}</p>` : h;
  }
  /**
   * Art der Zone ändern. Die Zeichnung passt meist nicht mehr: Beet und
   * Schlauch behalten ihre Punkte (wenn es genug sind), sonst wird neu gezeichnet.
   */
  setZoneType(e, t) {
    if (e.type === t) return;
    this.remember();
    const n = e.polygon;
    e.type = t, t === "sprinkler" ? (e.polygon = [], e.radius_m = null) : (e.center = null, t === "hose" ? e.radius_m = 0.5 : (e.radius_m = null, n.length < 3 && (e.polygon = []))), this.changed(), Q(e) === null ? (this.startTool(t === "sprinkler" ? "sprinkler" : t === "hose" ? "hose" : "bed", e.id), this.showToast(`${e.name}: jetzt im Plan zeichnen, dann „Speichern“`)) : this.showToast(`${e.name}: Art geändert. „Speichern“ nicht vergessen.`);
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
          s.radius_m = $(Math.max(0.1, S(s.points[0], t)));
          break;
        case "f-vertex": {
          const i = this.snap(t, n, s.points[e.index]);
          s.points[e.index] = [$(i[0]), $(i[1])];
          break;
        }
        case "f-move": {
          const i = t[0] - e.start[0], a = t[1] - e.start[1];
          s.points = e.orig.points.map((r) => [$(r[0] + i), $(r[1] + a)]);
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
    t.polygon.splice(n + 1, 0, [$((s[0] + i[0]) / 2), $((s[1] + i[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "vertex", id: t.id, index: n + 1 };
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
    this.remember(), [e.latitude, e.longitude] = Gt([t, n], [e.latitude, e.longitude]).map(
      (i) => Math.round(i * 1e7) / 1e7
    );
    const s = (i) => [$(i[0] - t), $(i[1] - n)];
    for (const i of this.plan.zones)
      i.center && (i.center = s(i.center)), i.polygon = i.polygon.map(s), i.valve_route = (i.valve_route ?? []).map(s);
    for (const i of [...this.plan.valves, ...this.plan.sensors])
      i.position && (i.position = s(i.position));
    for (const i of this.features) i.points = i.points.map(s);
    this.view = { ...this.view, cx: 0, cy: 0 }, this.searchPin && (this.searchPin = { ...this.searchPin, point: s(this.searchPin.point) }), this.changed(), this.showToast("Kartenmitte gesetzt");
  }
  // Orten ---------------------------------------------------------------------------
  /** Standort einmal aus dem Browser holen (kein Dauer-Orten, nichts gespeichert). */
  locateOnce() {
    const e = gn(window.isSecureContext, "geolocation" in navigator);
    return e ? (this.showToast(e, !0), Promise.resolve(null)) : (this.locating = !0, new Promise((t) => {
      navigator.geolocation.getCurrentPosition(
        (n) => {
          this.locating = !1, t({ latitude: n.coords.latitude, longitude: n.coords.longitude, accuracy: n.coords.accuracy });
        },
        (n) => {
          this.locating = !1, this.showToast(fn(n.code), !0), t(null);
        },
        { enableHighAccuracy: !0, maximumAge: 0, timeout: 3e4 }
      );
    }));
  }
  geoPoint(e) {
    const t = this.plan?.garden;
    return t?.background !== "map" || t.latitude == null || t.longitude == null ? null : Ye(e.latitude, e.longitude, [t.latitude, t.longitude]);
  }
  /** Orten-Knopf: Karte zum eigenen Standort (ist noch nichts gezeichnet: Kartenmitte). */
  async goToMe() {
    if (this.locating) return;
    const e = await this.locateOnce();
    if (!e || !this.plan) return;
    const t = this.plan.garden, n = Math.max(this.view.scale, 1 / _e(e.latitude, 20));
    this.autoFit = !1;
    const s = t.background === "none";
    if (s && (this.remember(), t.background = "map", t.map_provider ??= "basemap_at", t.map_zoom ??= 19), !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((r) => r.position) || t.latitude == null || t.longitude == null) {
      s || this.remember(), t.latitude = Math.round(e.latitude * 1e7) / 1e7, t.longitude = Math.round(e.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: n }, this.changed(), this.showToast(`Kartenmitte auf deinen Standort gesetzt (${Ae(e.accuracy)}).`);
      return;
    }
    const a = this.geoPoint(e);
    this.view = { cx: a[0], cy: a[1], scale: n }, s && this.changed(), this.showToast(
      Math.hypot(a[0], a[1]) > 2e3 ? "Du bist weit weg vom Garten. Die Karte zeigt, wo du gerade bist." : `Karte auf deinen Standort gelegt (${Ae(e.accuracy)}).`
    );
  }
  /** Ventil oder Sensor, der gerade platziert wird, an den eigenen Standort setzen. */
  async placeAtMe() {
    if (this.tool !== "place" || this.locating) return;
    const e = this.toolTarget, t = await this.locateOnce(), n = t && this.geoPoint(t);
    if (!n || this.tool !== "place" || this.toolTarget !== e) return;
    const [s, i] = e.split(":");
    this.remember(), this.marker(s, i).position = [$(n[0]), $(n[1])], this.selected = { kind: s, id: i }, this.changed(), this.cancelTool(), this.view = { ...this.view, cx: n[0], cy: n[1] }, this.showToast(`An deinen Standort gesetzt (${Ae(t.accuracy)})`);
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
        this.searchResults = await rn(
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
    const t = this.plan.garden, n = 1 / _e(e.latitude, 20.5);
    if (this.autoFit = !1, !this.hasAnyDrawing() && ![...this.plan.valves, ...this.plan.sensors].some((i) => i.position) || t.latitude == null || t.longitude == null)
      this.remember(), t.latitude = Math.round(e.latitude * 1e7) / 1e7, t.longitude = Math.round(e.longitude * 1e7) / 1e7, this.view = { cx: 0, cy: 0, scale: n }, this.searchPin = { point: [0, 0], name: e.name }, this.changed(), this.showToast(`${e.name}: Kartenmitte gesetzt. Fein ausrichten mit „Mitte hier festlegen“.`);
    else {
      const i = Ye(e.latitude, e.longitude, [t.latitude, t.longitude]);
      this.view = { cx: i[0], cy: i[1], scale: n }, this.searchPin = { point: i, name: e.name }, this.showToast(`${e.name} angezeigt. „Mitte hier festlegen“ übernimmt die Stelle.`);
    }
    this.searchResults = null;
  }
  renderSearch() {
    return !this.searchOpen || this.tool !== "select" || this.plan.garden.background !== "map" ? h : c`
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
        ${this.searchError ? c`<p class="search-error">${this.searchError}</p>` : h}
        ${this.searchResults?.length ? c`<ul class="results">
              ${this.searchResults.map(
      (e) => c`<li>
                  <button type="button" @click=${() => this.goToPlace(e)}>
                    <ha-icon icon="mdi:map-marker"></ha-icon>
                    <span><strong>${e.name}</strong><small>${e.detail}</small></span>
                  </button>
                </li>`
    )}
            </ul>` : h}
        <p class="search-note">${an}. Die Adresse geht nur an die Suche und wird nicht gespeichert.</p>
      </div>
    `;
  }
  /** Umschalter für die Kartenansicht (Luftbild, Karte, …) direkt auf dem Plan. */
  renderLayers() {
    const e = this.plan.garden;
    if (!this.layersOpen || e.background !== "map") return h;
    const t = Object.entries(this.plan.providers).map(
      ([n, s]) => [n, s.short ?? s.name, s.kind === "map" ? "mdi:map-outline" : "mdi:satellite-variant"]
    );
    return e.map_url && t.push(["custom", "Eigene Adresse", "mdi:web"]), c`
      <div class="layers" role="menu" @pointerdown=${(n) => n.stopPropagation()}>
        ${t.map(
      ([n, s, i]) => c`<button
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
    if (S(this.scaleDraft[0], this.scaleDraft[1]) < 2) {
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
      await this._hass.callService(C, "run_zone", { zone_id: e.id, duration: t }), this.showToast(`${e.name}: ${Ee(t)} eingereiht`);
    } catch (n) {
      this.showToast(this.message(n), !0);
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
      ${this.page === "operation" ? c`<ip-operation
            .hass=${this._hass}
            @ip-toast=${(e) => this.showToast(e.detail.text, e.detail.isError)}
          ></ip-operation>` : this.page === "overview" ? this.renderOverview() : this.page === "schedule" ? c`<ip-schedule
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
                </button>` : h}
          </div>` : h}
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
      const i = xn(e.zones, e.valves, this.status, e.garden.features, [
        t[0] - 1,
        t[1] - 1,
        t[2] + 1,
        t[3] + 1
      ]);
      this.wetCache = { key: n, grid: i, url: kn(i) };
    }
    return this.wetCache;
  }
  renderWetMap() {
    const e = this.wetGrid();
    if (!e?.url) return h;
    const t = e.grid;
    return g`<image class="wet-layer" href=${e.url} x=${t.x0} y=${t.y0}
      width=${t.cols * t.step} height=${t.rows * t.step} preserveAspectRatio="none"></image>`;
  }
  /** Messwerte der Sensoren neben dem Symbol (Bodenfeuchte farbig). */
  renderSensorValues(e) {
    const t = this.status?.sensors ?? {};
    return this.plan.sensors.map((n) => {
      const s = t[n.id];
      if (!n.position || !s || typeof s.value != "number") return h;
      let i = "";
      if (n.kind === "soil_moisture") {
        const r = s.field_capacity_pct - s.wilting_point_pct, o = r > 0 ? (s.value - s.wilting_point_pct) / r : 0.5;
        i = o < 0.35 ? "dry" : o > 0.85 ? "wet" : "ok";
      }
      const a = `${Math.round(s.value * 10) / 10}${s.unit ? ` ${s.unit}` : ""}`;
      return g`<text class="sensor-value ${i}" x=${n.position[0]} y=${n.position[1]} dy=${24 * e}
        font-size=${12 * e} stroke-width=${3 * e}>${a}</text>`;
    });
  }
  soilName(e) {
    return e && this.plan.catalog.soils[e]?.name || "unbekannt";
  }
  /** Bodenart einer Fläche im Grundriss, in der die Zone liegt. */
  soilFromPlan(e) {
    const t = this.zoneAnchor(e);
    return t ? this.features.find((s) => s.kind === "soil" && s.points.length >= 3 && yt(t, s.points))?.soil_type ?? null : null;
  }
  renderSoilLegend() {
    const e = /* @__PURE__ */ new Set([
      ...this.plan.zones.map((t) => t.soil_type ?? "loam"),
      ...this.features.filter((t) => t.kind === "soil").map((t) => t.soil_type ?? "loam")
    ]);
    return c`<div class="wet-legend">
      <strong>Bodenart</strong>
      ${Object.entries(this.plan.catalog.soils).filter(([t]) => e.has(t)).map(
      ([t, n]) => c`<div class="soil-row"><span class="swatch" style="background:${Se[t]}"></span>${n.name}
            <small>${n.awc_mm_per_m} mm/m</small></div>`
    )}
      <small>Zahl: Wasser, das der Boden je Meter Tiefe speichern kann. Sandiger Boden braucht öfter, aber weniger Wasser.</small>
    </div>`;
  }
  /** Pflanzen, Wasserbedarf und Boden einer Zone. */
  renderPlantSoil(e) {
    const t = this.plan.catalog, n = e.plant_type ? t.plants[e.plant_type] : void 0, i = ((o) => t.needs.find((l) => o <= zn(l.key)) ?? t.needs[t.needs.length - 1])(e.kc), a = this.soilFromPlan(e), r = (o) => {
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
            Pflanzenfaktor ${e.kc.toLocaleString("de-DE")}${n && n.kc !== e.kc ? c` (für ${n.name} üblich: ${n.kc.toLocaleString("de-DE")})` : h}
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
            </button>` : h}
        <p class="hint small">Gilt für die berechnete Gießdauer. Mehr Einstellungen (Wurzeltiefe, Effizienz) unter Einstellungen → Integration → Konfigurieren.</p>
      </details>
    `;
  }
  renderWetLegend() {
    const e = this.plan.zones.filter((s) => s.enabled && he(s) !== null).map((s) => ({ z: s, why: at(s, this.plan.valves, this.status) })).filter((s) => s.why !== null), t = T[T.length - 1][0], n = T.map(([, [s, i, a]], r) => `rgb(${s},${i},${a}) ${r / (T.length - 1) * 100}%`).join(", ");
    return c`<div class="wet-legend">
      <strong>Wasser pro Durchgang</strong>
      <div class="bar" style="background: linear-gradient(to right, ${n})"></div>
      <div class="ticks">${T.map(([s]) => c`<span>${s}${s === t ? "+" : ""}</span>`)}<em>mm</em></div>
      ${e.length ? c`<div class="wet-missing">
            <small><span class="hatch"></span><strong>Ohne Wert (schraffiert):</strong>
              ${e.map((s) => `${s.z.name} (${s.why})`).join(", ")}</small>
            ${e.some((s) => s.why === "Durchfluss unbekannt") ? c`<small>Den Durchfluss lernt die Integration bei einem Lauf von mindestens 1 Minute mit Durchflusssensor.
                  Ohne Sensor: bei der Zone unter „Ventil“ den Durchfluss von Hand eintragen (z. B. Eimer auslitern).</small>` : h}
          </div>` : h}
      <small>Schätzung aus Dauer × gelerntem Durchfluss; Überlappungen zählen doppelt.</small>
    </div>`;
  }
  // Übersicht ------------------------------------------------------------------
  renderOverview() {
    const e = this.plan, t = e.zones, n = (d) => e.valves.find((w) => w.id === d.valve_id), s = t.map((d) => {
      const w = he(d), P = w ?? d.area_m2, k = n(d)?.learned_flow_l_min ?? null, A = Ie(d, this.status), z = k && A ? A / 60 * k : null;
      return { z: d, drawn: w, area: P, flow: k, seconds: A, liters: z, mm: xt(d, e.valves, this.status) };
    }), i = s.filter((d) => d.z.enabled), a = i.reduce((d, w) => d + (w.area ?? 0), 0), r = i.reduce((d, w) => d + (w.liters ?? 0), 0), o = t.reduce((d, w) => d + w.overlap_m2, 0) / 2, l = sn(e.garden.features), p = ["sprinkler", "drip", "hose"].map((d) => {
      const w = i.filter((P) => P.z.type === d);
      return { type: d, count: w.length, area: w.reduce((P, k) => P + (k.area ?? 0), 0) };
    }), m = {
      sprinkler: ["Sprinkler", "mdi:sprinkler-variant"],
      drip: ["Tropfschlauch", "mdi:water-outline"],
      hose: ["Gießschlauch", "mdi:pipe"]
    }, u = [];
    for (const d of s)
      d.z.enabled && (d.drawn === null && !d.z.area_m2 ? u.push(`${d.z.name}: weder gezeichnet noch Fläche von Hand`) : d.drawn === null && u.push(`${d.z.name}: noch nicht gezeichnet (Fläche von Hand)`), d.z.valve_id ? d.flow || u.push(`${d.z.name}: Durchfluss noch nicht gelernt (nach dem ersten Lauf)`) : u.push(`${d.z.name}: kein Ventil zugeordnet`));
    const b = e.valves.map((d) => {
      const w = i.filter((A) => A.z.valve_id === d.id), P = w.reduce((A, z) => A + (z.area ?? 0), 0), k = d.learned_flow_l_min && P ? d.learned_flow_l_min * 60 / P : null;
      return { v: d, mine: w, area: P, rate: k };
    }).filter((d) => d.mine.length), v = (d, w = 0) => d == null ? "–" : d.toLocaleString("de-DE", { maximumFractionDigits: w });
    return c`
      <div class="overview">
        <section class="tiles">
          <div class="tile"><span>Bewässerte Fläche</span><strong>${M(a)}</strong>
            <small>${i.length} aktive Zonen</small></div>
          ${l ? c`<div class="tile"><span>Grundstück</span><strong>${M(l)}</strong>
                <small>davon ${Math.round(a / l * 100)} % bewässert</small></div>` : h}
          <div class="tile"><span>Gezeichnet</span><strong>${s.filter((d) => d.drawn !== null).length} von ${t.length}</strong>
            <small>Zonen im Plan</small></div>
          <div class="tile"><span>Wasser pro Durchgang</span><strong>${v(r)} L</strong>
            <small>alle aktiven Zonen einmal</small></div>
          <div class="tile ${o > 0.5 ? "warn" : ""}"><span>Überschneidungen</span><strong>${M(o)}</strong>
            <small>werden doppelt gegossen</small></div>
        </section>
        <section class="types">
          ${p.map(
      (d) => c`<div class="type">
              <ha-icon icon=${m[d.type][1]}></ha-icon>
              <span>${m[d.type][0]}</span>
              <strong>${M(d.area)}</strong>
              <small>${d.count} Zone${d.count === 1 ? "" : "n"}</small>
            </div>`
    )}
        </section>
        ${u.length ? c`<section class="card"><h3>Noch offen</h3><ul class="hints">${u.map((d) => c`<li>${d}</li>`)}</ul></section>` : h}
        <section class="card">
          <h3>Zonen</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Zone</th><th>Art</th><th>Ventil</th><th class="n">Fläche</th><th class="n">Dauer</th>
                <th class="n">Liter</th><th class="n">mm</th><th class="n">Bedarf</th></tr></thead>
              <tbody>
                ${s.map(
      (d, w) => c`<tr class=${d.z.enabled ? "" : "off"}>
                    <td><span class="dot" style="--zone:${this.zoneColor(w)}"></span>${d.z.name}</td>
                    <td>${m[d.z.type]?.[0] ?? d.z.type}</td>
                    <td>${n(d.z)?.name ?? "–"}</td>
                    <td class="n">${d.area ? M(d.area) : "–"}${d.drawn === null && d.area ? c`<sup title="von Hand">*</sup>` : h}</td>
                    <td class="n">${d.seconds ? Ee(d.seconds) : "–"}</td>
                    <td class="n">${v(d.liters)}</td>
                    <td class="n">${v(d.mm, 1)}</td>
                    <td class="n">${this.status?.zones[d.z.id] ? `${v(this.status.zones[d.z.id].need_mm, 1)} mm` : "–"}</td>
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
                ${b.map(
      (d) => c`<tr>
                    <td>${d.v.name}</td>
                    <td>${d.mine.map((w) => w.z.name).join(", ")}</td>
                    <td class="n">${M(d.area)}</td>
                    <td class="n">${d.v.learned_flow_l_min ? `${v(d.v.learned_flow_l_min, 1)} L/min` : "–"}</td>
                    <td class="n">${d.rate ? `${v(d.rate, 1)} mm/h` : "–"}</td>
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
              <button class=${this.page === "plan" ? "active" : ""} title="Plan" @click=${() => this.page = "plan"}>
                <ha-icon icon="mdi:map-outline"></ha-icon><span class="label">Plan</span>
              </button>
              <button class=${this.page === "operation" ? "active" : ""} title="Betrieb" @click=${() => this.page = "operation"}>
                <ha-icon icon="mdi:play-circle-outline"></ha-icon><span class="label">Betrieb</span>
              </button>
              <button class=${this.page === "overview" ? "active" : ""} title="Flächen" @click=${() => this.page = "overview"}>
                <ha-icon icon="mdi:chart-box-outline"></ha-icon><span class="label">Flächen</span>
              </button>
              <button class=${this.page === "schedule" ? "active" : ""} title="Zeitplan" @click=${() => this.page = "schedule"}>
                <ha-icon icon="mdi:calendar-clock"></ha-icon><span class="label">Zeitplan</span>
              </button>
            </nav>` : h}
        ${e ? c`<div class="chips">
              ${e.winter_mode ? c`<span class="chip winter"><ha-icon icon="mdi:snowflake"></ha-icon>Winterpause</span>` : c`<button class="chip toggle ${e.automatic ? "on" : ""}" role="switch"
                    aria-checked=${e.automatic ? "true" : "false"}
                    title=${e.automatic ? "Programme starten nach Zeitplan. Klicken: Automatik aus (was läuft, läuft zu Ende)" : "Programme starten nicht von selbst. Klicken: Automatik ein"}
                    @click=${() => this.toggleAutomatic(!e.automatic)}
                    ><ha-icon icon=${e.automatic ? "mdi:calendar-check" : "mdi:calendar-remove"}></ha-icon
                    >${e.automatic ? "Automatik an" : "Automatik aus"}</button
                  >`}
              ${e.problems.length ? c`<span class="chip alarm" title=${e.problems.join(`
`)}
                    ><ha-icon icon="mdi:alert"></ha-icon>${e.problems.length} Problem${e.problems.length > 1 ? "e" : ""}</span
                  >` : h}
            </div>` : h}
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
                    </div>` : h}
              </div>
            ` : h}
      </header>
      ${this.renderImportDialog()}
    `;
  }
  // Sichern und Wiederherstellen -------------------------------------------------
  async exportPlan() {
    this.menuOpen = !1;
    try {
      const e = await this._hass.callWS({ type: `${C}/export` }), t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), n = URL.createObjectURL(t), s = document.createElement("a");
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
          type: `${C}/import`,
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
    if (!this.pendingImport) return h;
    const e = this.pendingImport.data?.exported_at;
    return c`
      <div class="dialog-backdrop" @click=${() => this.pendingImport = null}>
        <div class="dialog" role="dialog" aria-modal="true" @click=${(t) => t.stopPropagation()}>
          <h2>Sicherung einspielen</h2>
          <p>
            <strong>${this.pendingImport.name}</strong>${e ? c`<br /><small>erstellt am ${new Date(e).toLocaleString("de-DE")}</small>` : h}
          </p>
          ${this.dirty ? c`<p class="note warn">Nicht gespeicherte Änderungen gehen dabei verloren.</p>` : h}
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
    const { w: e, h: t } = this.size, { cx: n, cy: s, scale: i } = this.view, a = `translate(${e / 2} ${t / 2}) scale(${i}) translate(${-n} ${-s})`, r = 1 / i, o = this.tool === "select" ? this.drag?.type === "pan" ? "grabbing" : "grab" : "crosshair";
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
      this.tool === "bed" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishBed()), this.tool === "hose" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishHose()), this.tool === "feature" && U(this.featureKind) !== "point" && (l.preventDefault(), this.draft = this.draft.slice(0, -1), this.finishFeature());
    }}
      >
        <defs>
          <pattern id="wet-hatch" patternUnits="userSpaceOnUse" width=${8 * r} height=${8 * r} patternTransform="rotate(45)">
            <rect width=${8 * r} height=${8 * r} fill="rgba(120,120,120,0.12)"></rect>
            <line x1="0" y1="0" x2="0" y2=${8 * r} stroke="rgba(90,90,90,0.55)" stroke-width=${2 * r}></line>
          </pattern>
        </defs>
        <g transform=${a}>
          ${this.renderBackground(r)}
          <g class="features">${this.renderFeatures(r)}</g>
          ${this.wetOn ? this.renderWetMap() : h}
          ${this.plan.zones.map((l, p) => this.renderZone(l, p, r))}
          ${this.renderSelectedHandles(r)} ${this.renderFeatureHandles(r)}
          ${this.renderDraft(r)} ${this.renderScaleDraft(r)} ${this.renderMeasure(r)}
          ${this.renderValveLinks(r)}
          ${this.plan.valves.map((l) => this.renderMarker("valve", l, r))}
          ${this.plan.sensors.map((l) => this.renderMarker("sensor", l, r))}
          ${this.wetOn ? this.renderSensorValues(r) : h}
          ${this.renderSnapHint(r)}
          ${this.searchPin && this.plan.garden.background === "map" ? g`<g class="pin" transform="translate(${this.searchPin.point[0]} ${this.searchPin.point[1]}) scale(${r})">
                <path d="M0 0 C-3 -9 -11 -13 -11 -22 A11 11 0 1 1 11 -22 C11 -13 3 -9 0 0 Z"></path>
                <circle cx="0" cy="-22" r="4"></circle>
                <title>${this.searchPin.name}</title>
              </g>` : h}
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
      const r = this.tileTemplate();
      if (r) {
        const o = this.plan.providers[t.map_provider ?? ""], l = o?.max_zoom ?? 20, p = Math.max(
          1,
          Math.min(l, Math.round(Xe(t.latitude, this.view.scale * (window.devicePixelRatio > 1 ? 1.4 : 1))))
        ), m = Qe(r, [t.latitude, t.longitude], n, p);
        s.push(g`<rect x=${n.x0} y=${n.y0} width=${n.x1 - n.x0} height=${n.y1 - n.y0} class="map-fill"></rect>`);
        const u = e * 0.5, b = (v) => v.map(
          (d) => g`<image href=${d.url} x=${d.x - u} y=${d.y - u} width=${d.size + 2 * u} height=${d.size + 2 * u} preserveAspectRatio="none" crossorigin="anonymous"></image>`
        );
        s.push(...b(m)), o?.overlay && t.map_provider !== "custom" && s.push(...b(Qe(o.overlay, [t.latitude, t.longitude], n, p)));
      }
    } else if (t.background === "image" && this.imageUrl && this.imageSize) {
      const r = this.imageMpp();
      s.push(
        g`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * r} height=${this.imageSize[1] * r} preserveAspectRatio="none"></image>`
      );
    }
    const i = [g`<g class="bg" opacity=${t.background_opacity ?? 1}>${s}</g>`], a = (t.background_opacity ?? 1) < 0.35;
    return (t.background !== "map" || a) && i.push(this.renderGrid(n, e, t.background === "image" && !a)), i;
  }
  renderGrid(e, t, n) {
    const s = wt(40 * t), i = [], a = s * 5;
    for (let r = Math.floor(e.x0 / s) * s; r <= e.x1; r += s) {
      const o = Math.abs(r / a - Math.round(r / a)) < 1e-6;
      i.push(g`<line x1=${r} y1=${e.y0} x2=${r} y2=${e.y1} class=${o ? "grid major" : "grid"}></line>`);
    }
    for (let r = Math.floor(e.y0 / s) * s; r <= e.y1; r += s) {
      const o = Math.abs(r / a - Math.round(r / a)) < 1e-6;
      i.push(g`<line x1=${e.x0} y1=${r} x2=${e.x1} y2=${r} class=${o ? "grid major" : "grid"}></line>`);
    }
    return g`<g class=${n ? "grid-layer faint" : "grid-layer"}>${i}</g>`;
  }
  tileTemplate() {
    const e = this.plan.garden;
    return e.map_provider === "custom" ? e.map_url ?? "" : this.plan.providers[e.map_provider ?? ""]?.url ?? "";
  }
  zoneColor(e) {
    return rt[e % rt.length];
  }
  renderZone(e, t, n) {
    const s = this.zoneColor(t), i = this.status?.zones[e.id]?.state ?? "idle", a = this.selected?.kind === "zone" && this.selected.id === e.id, r = this.wetOn && e.enabled ? at(e, this.plan.valves, this.status) : null, o = `zone ${i} ${a ? "selected" : ""} ${e.enabled ? "" : "disabled"} ${r ? "nowet" : ""}`;
    let l, p = null;
    if (e.type === "sprinkler" && e.center && e.radius_m ? (l = g`<path d=${Kt(e.center, e.radius_m, e.start_angle_deg, e.arc_deg)}></path>`, p = e.arc_deg >= 360 ? e.center : L(e.center, e.radius_m * 0.55, e.start_angle_deg + e.arc_deg / 2)) : e.type === "hose" && e.polygon.length >= 2 && e.radius_m ? (l = this.hoseShape(e.id, e.polygon, e.radius_m, n), p = this.zoneAnchor(e)) : e.type === "drip" && e.polygon.length >= 3 && (l = g`<polygon points=${e.polygon.map((b) => b.join(",")).join(" ")}></polygon>`, p = me(e.polygon)), !l) return h;
    const m = Q(e), u = this.soilOn ? Se[e.soil_type ?? "loam"] : "";
    return g`
      <g class=${o} style="--zone:${u || s}"
        @pointerdown=${(b) => {
      this.tool === "select" && (this.selected = { kind: "zone", id: e.id }, this.tab = "zones", this.startDrag(b, { type: "move-zone", id: e.id, start: this.toPlan(b), orig: structuredClone(e) }));
    }}>
        ${l}
        ${p ? g`<text x=${p[0]} y=${p[1]} font-size=${13 * n} stroke-width=${3 * n} class="label">
              <tspan x=${p[0]} dy="0">${e.name}</tspan>
              <tspan x=${p[0]} dy=${15 * n} class="sub">${r ? `kein Wert: ${r}` : `${M(m)}${Me[i] ? ` · ${Me[i]}` : ""}`}</tspan>
            </text>` : h}
      </g>`;
  }
  /**
   * Schlauch: kräftige Linie, darum die Reichweite als Umriss (gleicher
   * Abstand zur Linie, runde Enden) mit leichter Füllung.
   */
  hoseShape(e, t, n, s, i = "") {
    const a = t.map((l) => l.join(",")).join(" "), r = 2 * s, o = `hose-mask-${e}`;
    return g`<g class="hose ${i}">
      <mask id=${o} maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000">
        <rect x="-100000" y="-100000" width="200000" height="200000" fill="white"></rect>
        <polyline points=${a} fill="none" stroke="black" stroke-width=${2 * n}
          stroke-linecap="round" stroke-linejoin="round"></polyline>
      </mask>
      <polyline class="hose-band" points=${a} stroke-width=${2 * n} style="--band:${2 * n}"></polyline>
      <polyline class="hose-reach" points=${a} stroke-width=${2 * n + 2 * r} mask="url(#${o})"></polyline>
      <polyline class="hose-line" points=${a}></polyline>
      ${t.map((l, p) => p === 0 || p === t.length - 1 ? g`<circle class="hose-end" cx=${l[0]} cy=${l[1]} r=${3.5 * s}></circle>` : h)}
    </g>`;
  }
  renderSelectedHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "zone") return h;
    const t = this.zone(this.selected.id), n = 7 * e, s = (a, r, o = "", l = "") => g`<circle class="handle ${o}" cx=${a[0]} cy=${a[1]} r=${n}
        @pointerdown=${(p) => this.startDrag(p, r)}><title>${l}</title></circle>`;
    if (t.type === "sprinkler" && t.center && t.radius_m) {
      const a = t.center, r = t.arc_deg >= 360, o = r ? t.start_angle_deg + 135 : t.start_angle_deg + t.arc_deg / 2, l = [
        g`<line class="guide" x1=${a[0]} y1=${a[1]} x2=${L(a, t.radius_m, t.start_angle_deg)[0]} y2=${L(a, t.radius_m, t.start_angle_deg)[1]}></line>`,
        s(a, { type: "center", id: t.id }, "center", "Mittelpunkt verschieben"),
        s(L(a, t.radius_m, o), { type: "radius", id: t.id }, "radius", "Reichweite ändern"),
        s(L(a, t.radius_m, t.start_angle_deg), { type: "start", id: t.id }, "angle", "Anfang des Bogens")
      ];
      return r ? l.push(
        s(L(a, t.radius_m * 0.8, t.start_angle_deg + 20), { type: "end", id: t.id }, "angle small", "Bogen öffnen")
      ) : l.push(
        s(L(a, t.radius_m, t.start_angle_deg + t.arc_deg), { type: "end", id: t.id }, "angle", "Ende des Bogens")
      ), l;
    }
    const i = t.type === "hose" ? 2 : 3;
    if (t.type !== "sprinkler" && t.polygon.length >= i) {
      const a = t.polygon, r = t.type === "hose" ? a.slice(0, -1) : a;
      return [
        ...t.type === "hose" && t.radius_m ? (() => {
          const l = et(a, t.radius_m), p = et(a, 0);
          return [
            g`<line class="guide" x1=${p[0]} y1=${p[1]} x2=${l[0]} y2=${l[1]}></line>`,
            s(l, { type: "hose-radius", id: t.id }, "radius", "Reichweite ändern")
          ];
        })() : [],
        ...r.map((l, p) => {
          const m = a[(p + 1) % a.length], u = [(l[0] + m[0]) / 2, (l[1] + m[1]) / 2];
          return g`<circle class="handle mid" cx=${u[0]} cy=${u[1]} r=${n * 0.7}
            @pointerdown=${(b) => this.insertVertex(b, t, p)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
        }),
        ...a.map(
          (l, p) => g`<circle class="handle" cx=${l[0]} cy=${l[1]} r=${n}
            @pointerdown=${(m) => this.startDrag(m, { type: "vertex", id: t.id, index: p })}
            @contextmenu=${(m) => this.removeVertex(m, t, p)}
            @dblclick=${(m) => this.removeVertex(m, t, p)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
        )
      ];
    }
    return h;
  }
  renderFeatures(e) {
    return this.features.map((t) => {
      const n = this.selected?.kind === "feature" && this.selected.id === t.id, s = U(t.kind), i = (l) => {
        this.tool === "select" && (this.selected = { kind: "feature", id: t.id }, this.tab = "plan", this.startDrag(l, { type: "f-move", id: t.id, start: this.toPlan(l), orig: structuredClone(t) }));
      }, a = `feature ${t.kind} ${n ? "selected" : ""}`;
      if (s === "area") {
        const l = me(t.points), p = t.kind === "soil" ? Se[t.soil_type ?? ""] ?? "#a9825a" : "";
        return g`<polygon class=${a} points=${t.points.map((m) => m.join(",")).join(" ")}
          style=${p ? `fill:${p}44;stroke:${p}` : ""}
          @pointerdown=${i}><title>${X(t)}${t.kind === "soil" ? `: ${this.soilName(t.soil_type)}` : ""}</title></polygon>
          ${t.label ? g`<text class="feature-name" x=${l[0]} y=${l[1]} dy=${4 * e} font-size=${12 * e}
                stroke-width=${3 * e}>${t.label}</text>` : h}`;
      }
      if (s === "line") {
        const l = t.kind === "boundary" && t.points.length >= 3 ? me(t.points) : null;
        return g`<g class=${a} @pointerdown=${i}>
          <polyline class="hit" points=${t.points.map((p) => p.join(",")).join(" ")} stroke-width=${12 * e}></polyline>
          <polyline points=${t.points.map((p) => p.join(",")).join(" ")}></polyline>
          <title>${X(t)}${l ? `: ${M(K(t.points))}` : ""}</title></g>
          ${l && n ? g`<text class="feature-name plot" x=${l[0]} y=${l[1]} font-size=${13 * e} stroke-width=${3 * e}>
                Grundstück ${M(K(t.points))}</text>` : h}`;
      }
      const [r, o] = t.points[0];
      return t.kind === "tree" ? g`<g class=${a} @pointerdown=${i}>
          <circle cx=${r} cy=${o} r=${t.radius_m ?? 1}></circle>
          <circle class="trunk" cx=${r} cy=${o} r=${Math.max(3 * e, (t.trunk_m ?? 0) / 2)}></circle>
          <title>${X(t)}</title></g>` : t.kind === "label" ? g`<text class=${a} x=${r} y=${o} font-size=${14 * e} stroke-width=${3 * e}
          @pointerdown=${i}>${t.label}</text>` : g`<g class=${a} @pointerdown=${i}>
        <circle cx=${r} cy=${o} r=${8 * e}></circle>
        <text x=${r} y=${o} dy=${4 * e} font-size=${11 * e}>H</text>
        <title>${X(t)}</title></g>`;
    });
  }
  renderFeatureHandles(e) {
    if (this.tool !== "select" || this.selected?.kind !== "feature") return h;
    const t = this.feature(this.selected.id);
    if (!t) return h;
    const n = 7 * e, s = U(t.kind);
    if (s === "point") {
      if (t.kind !== "tree") return h;
      const [o, l] = t.points[0], p = L(t.points[0], t.radius_m ?? 1, 135);
      return g`
        <circle class="handle center" cx=${o} cy=${l} r=${n}
          @pointerdown=${(m) => this.startDrag(m, { type: "f-move", id: t.id, start: this.toPlan(m), orig: structuredClone(t) })}></circle>
        <circle class="handle" cx=${p[0]} cy=${p[1]} r=${n}
          @pointerdown=${(m) => this.startDrag(m, { type: "f-radius", id: t.id })}><title>Kronengröße</title></circle>`;
    }
    const i = t.points;
    return [
      ...(s === "area" ? i : i.slice(0, -1)).map((o, l) => {
        const p = i[(l + 1) % i.length], m = [(o[0] + p[0]) / 2, (o[1] + p[1]) / 2];
        return g`<circle class="handle mid" cx=${m[0]} cy=${m[1]} r=${n * 0.7}
        @pointerdown=${(u) => this.insertFeatureVertex(u, t, l)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
      }),
      ...i.map(
        (o, l) => g`<circle class="handle" cx=${o[0]} cy=${o[1]} r=${n}
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
    t.points.splice(n + 1, 0, [$((s[0] + i[0]) / 2), $((s[1] + i[1]) / 2)]), this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "f-vertex", id: t.id, index: n + 1 };
  }
  removeFeatureVertex(e, t, n) {
    e.preventDefault(), e.stopPropagation();
    const s = U(t.kind) === "area" ? 3 : 2;
    if (t.points.length <= s) {
      this.showToast(`${Z[t.kind].label}: mindestens ${s} Punkte`, !0);
      return;
    }
    this.remember(), t.points.splice(n, 1), this.changed();
  }
  /** Messwerkzeug: Strecken mit Längen und Summe. */
  renderMeasure(e) {
    if (this.tool !== "measure" || !this.measurePts.length) return h;
    const t = this.hover ? [...this.measurePts, this.hover] : this.measurePts, n = t.slice(1).map((s, i) => {
      const a = t[i];
      if (S(a, s) < 0.01) return h;
      const r = [(a[0] + s[0]) / 2, (a[1] + s[1]) / 2];
      return g`<text class="measure-label" x=${r[0]} y=${r[1]} dy=${-6 * e} font-size=${13 * e}
        stroke-width=${3 * e}>${W(S(a, s))}</text>`;
    });
    return g`<g class="measure">
      <polyline points=${t.map((s) => s.join(",")).join(" ")}></polyline>
      ${this.measurePts.map((s) => g`<circle cx=${s[0]} cy=${s[1]} r=${4 * e}></circle>`)}
      ${n}
    </g>`;
  }
  /** Mittelpunkt einer gezeichneten Zone (für Beschriftung und Verbindungslinie). */
  zoneAnchor(e) {
    return e.type === "sprinkler" ? e.center && e.radius_m ? e.center : null : e.type === "hose" ? e.polygon.length >= 2 ? Yt(e.polygon, 0.5) : null : e.polygon.length >= 3 ? me(e.polygon) : null;
  }
  /** Gestrichelte Linie von jeder Zone zu ihrem Ventil (wenn beide im Plan sind). */
  /**
   * Leitung vom Ventil zur Zone: durch die Zwischenpunkte, Ecken abgerundet.
   * Ist die Zone ausgewählt, lassen sich Punkte einfügen (Ziehen an der
   * Mitte eines Stücks), verschieben und löschen (Doppelklick).
   */
  renderValveLinks(e) {
    return this.plan.zones.map((t, n) => {
      const s = this.plan.valves.find((u) => u.id === t.valve_id), i = this.zoneAnchor(t);
      if (!s?.position || !i) return h;
      const a = this.selected?.kind === "zone" && this.selected.id === t.id, r = a || this.selected?.kind === "valve" && this.selected.id === s.id, o = t.valve_route ?? [], l = [s.position, ...o, i], p = g`<path class="valve-link ${r ? "selected" : ""}" style="--zone:${this.zoneColor(n)}"
        d=${en(l, Math.max(0.4, 16 * e))} stroke-dasharray=${`${6 * e} ${4 * e}`}></path>`;
      if (!a || this.tool !== "select") return p;
      const m = 6 * e;
      return g`${p}
        ${l.slice(0, -1).map((u, b) => {
        const v = l[b + 1], d = [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
        return g`<circle class="handle mid link" cx=${d[0]} cy=${d[1]} r=${m * 0.7}
            @pointerdown=${(w) => this.insertRoutePoint(w, t, b, d)}>
            <title>Ziehen: Knick in der Leitung einfügen</title></circle>`;
      })}
        ${o.map(
        (u, b) => g`<circle class="handle link" cx=${u[0]} cy=${u[1]} r=${m}
            @pointerdown=${(v) => this.startDrag(v, { type: "route", id: t.id, index: b })}
            @dblclick=${(v) => this.removeRoutePoint(v, t, b)}
            @contextmenu=${(v) => this.removeRoutePoint(v, t, b)}>
            <title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`
      )}`;
    });
  }
  insertRoutePoint(e, t, n, s) {
    if (this.tool !== "select") return;
    e.stopPropagation(), this.remember();
    const i = [...t.valve_route ?? []];
    i.splice(n, 0, [$(s[0]), $(s[1])]), t.valve_route = i, this.changed(), this.renderRoot.querySelector("svg.plan").setPointerCapture(e.pointerId), this.drag = { type: "route", id: t.id, index: n };
  }
  removeRoutePoint(e, t, n) {
    e.preventDefault(), e.stopPropagation(), this.remember(), t.valve_route = (t.valve_route ?? []).filter((s, i) => i !== n), this.changed();
  }
  renderSnapHint(e) {
    return this.snapHint ? g`<circle class="snap-hint" cx=${this.snapHint[0]} cy=${this.snapHint[1]} r=${9 * e}></circle>` : h;
  }
  renderDraft(e) {
    if (this.tool === "feature" && this.draft.length) {
      const s = this.hover ? [...this.draft, this.hover] : this.draft, i = U(this.featureKind) === "area";
      return g`
        <g class="draft feature-draft ${this.featureKind}">
          <polyline points=${[...s, ...i && s.length > 2 ? [s[0]] : []].map((a) => a.join(",")).join(" ")}></polyline>
          ${this.draft.map((a, r) => g`<circle cx=${a[0]} cy=${a[1]} r=${(r === 0 ? 7 : 5) * e}></circle>`)}
        </g>`;
    }
    if (this.tool === "hose" && this.draft.length) {
      const s = this.hover ? [...this.draft, this.hover] : this.draft;
      return g`<g class="draft">
        ${s.length >= 2 ? g`<g class="zone" style="--zone:#1e88e5">${this.hoseShape("draft", s, this.hoseRadius, e)}</g>` : h}
        <polyline points=${s.map((i) => i.join(",")).join(" ")} style="fill:none"></polyline>
        ${this.draft.map((i) => g`<circle cx=${i[0]} cy=${i[1]} r=${5 * e}></circle>`)}
      </g>`;
    }
    if (this.tool !== "bed" || !this.draft.length) return h;
    const t = this.hover ? [...this.draft, this.hover] : this.draft, n = this.plan.zones.findIndex((s) => s.id === this.toolTarget);
    return g`
      <g class="draft" style="--zone:${this.zoneColor(n)}">
        <polyline points=${t.map((s) => s.join(",")).join(" ")}></polyline>
        ${this.draft.map(
      (s, i) => g`<circle cx=${s[0]} cy=${s[1]} r=${(i === 0 ? 8 : 5) * e} class=${i === 0 ? "first" : ""}></circle>`
    )}
      </g>`;
  }
  renderScaleDraft(e) {
    if (this.tool !== "scale") return h;
    const t = this.imageMpp(), n = this.scaleDraft.map((s) => [s[0] * t, s[1] * t]);
    return g`<g class="scale-draft">
      ${n.length === 2 ? g`<line x1=${n[0][0]} y1=${n[0][1]} x2=${n[1][0]} y2=${n[1][1]}></line>` : h}
      ${n.map((s) => g`<circle cx=${s[0]} cy=${s[1]} r=${6 * e}></circle>`)}
    </g>`;
  }
  renderMarker(e, t, n) {
    if (!t.position) return h;
    const [s, i] = t.position, a = this.selected?.kind === e && this.selected.id === t.id, r = e === "valve" ? "V" : ot[t.kind] ?? "S", o = 11 * n;
    return g`
      <g class="marker ${e} ${a ? "selected" : ""}"
        @pointerdown=${(l) => {
      this.tool === "select" && (this.selected = { kind: e, id: t.id }, this.tab = "zones", this.startDrag(l, { type: "marker", kind: e, id: t.id }));
    }}>
        ${e === "valve" ? g`<rect x=${s - o} y=${i - o} width=${2 * o} height=${2 * o} rx=${4 * n}></rect>` : g`<circle cx=${s} cy=${i} r=${o}></circle>`}
        <text x=${s} y=${i} font-size=${12 * n} dy=${4.2 * n}>${r}</text>
        <title>${t.name}</title>
      </g>`;
  }
  renderOverlay() {
    const e = this.plan.garden, t = this.toolBanner(), n = En(this.view.scale), s = e.background === "map" ? this.plan.providers[e.map_provider ?? ""] : void 0;
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
            </button>` : h}
        ${e.background === "map" ? c`<button class="icon ${this.searchOpen ? "on" : ""}" title="Adresse suchen"
              @click=${() => this.searchOpen ? this.closeSearch() : this.openSearch()}>
              <ha-icon icon="mdi:magnify"></ha-icon>
            </button>` : h}
        ${e.background !== "image" ? c`<button class="icon ${this.locating ? "on" : ""}" title="Orten: Karte zu meinem Standort"
              ?disabled=${this.locating} @click=${this.goToMe}>
              <ha-icon icon=${this.locating ? "mdi:crosshairs-question" : "mdi:crosshairs-gps"}></ha-icon>
            </button>` : h}
      </div>
      ${t} ${this.renderSearch()} ${this.renderLayers()}
      <div class="compass" style="transform: rotate(${e.background === "image" ? -e.north_deg : 0}deg)" title="Norden">
        <svg viewBox="-12 -12 24 24"><path d="M0 -10 L4 2 L0 0 L-4 2 Z" class="n"></path><path d="M0 10 L4 2 L0 0 L-4 2 Z" class="s"></path></svg>
        <span>N</span>
      </div>
      <div class="scalebar"><div style="width:${n.px}px"></div><span>${n.label}</span></div>
      ${this.wetOn ? this.renderWetLegend() : h}
      ${this.soilOn && !this.wetOn ? this.renderSoilLegend() : h}
      ${e.background === "map" ? c`<div class="attribution">${s?.attribution ?? "Eigener Kartendienst"}</div>` : h}
      ${!this.hasAnyDrawing() && this.tool === "select" ? c`<div class="welcome">
            <ha-icon icon="mdi:draw"></ha-icon>
            <div>
              <strong>Noch nichts gezeichnet.</strong><br />
              Wähle rechts einen Hintergrund und dann bei einer Zone „Zeichnen“.
            </div>
          </div>` : h}
    `;
  }
  hasAnyDrawing() {
    return this.features.length > 0 || this.plan.zones.some((e) => Q(e) !== null);
  }
  toolBanner() {
    if (this.tool === "select") return h;
    let e = "", t = h;
    const n = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    if (this.tool === "sprinkler" && (e = `${n}: Am Sprinkler drücken und bis zum Rand ziehen.`), this.tool === "hose" && (e = `${n}: Den Verlauf des Schlauchs als Linie anklicken, Doppelklick beendet.`, t = c`<label class="inline">Reichweite
          <input type="number" min="0.05" max="20" step="0.05" .value=${String(this.hoseRadius)}
            @input=${(s) => {
      const i = Number(s.target.value);
      i > 0 && (this.hoseRadius = Math.min(20, i));
    }} /> m</label>
        <button class="text" ?disabled=${this.draft.length < 2} @click=${this.finishHose}>Fertig</button>`), this.tool === "bed" && (e = `${n}: Ecken anklicken, zum Schließen den ersten Punkt.`, t = c`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`), this.tool === "place") {
      const s = this.plan.garden.background === "map";
      e = `${n}: Auf die Stelle im Plan klicken${s ? " oder an deinen Standort setzen" : ""}.`, s && (t = c`<button class="text" ?disabled=${this.locating} @click=${this.placeAtMe}><ha-icon icon="mdi:crosshairs-gps"></ha-icon>Mein Standort</button>`);
    }
    if (this.tool === "feature") {
      const s = Z[this.featureKind], i = s.family;
      e = i === "area" ? `${s.label}: Ecken anklicken, zum Schließen den ersten Punkt.` : i === "line" ? `${s.label}: Punkte anklicken, Doppelklick beendet.` : this.featureKind === "tree" ? `${s.label}: In die Mitte drücken und bis zum Kronenrand ziehen.` : `${s.label}: Auf die Stelle klicken.`, i !== "point" && (t = c`<button
          class="text"
          ?disabled=${this.draft.length < (i === "area" ? 3 : 2)}
          @click=${this.finishFeature}
        >
          Fertig
        </button>`);
    }
    if (this.tool === "measure") {
      const s = te(this.measurePts);
      e = this.measurePts.length < 2 ? "Messen: Punkte anklicken. Alt-Taste: ohne Einrasten." : `Gemessen: ${W(s)}${this.measurePts.length > 2 ? " (Summe)" : ""}`, this.measurePts.length && (t = c`<button class="text" @click=${() => this.measurePts = []}>Neu</button>`);
    }
    return this.tool === "scale" && (e = this.scaleDraft.length < 2 ? "Maßstab: Zwei Punkte im Bild anklicken, deren Abstand du kennst (z. B. die Ecken der Terrasse)." : "Abstand eingeben:", this.scaleDraft.length === 2 && (t = c`<input
            class="small"
            type="text"
            inputmode="decimal"
            placeholder="Meter"
            .value=${this.scaleInput}
            @input=${(s) => this.scaleInput = s.target.value}
            @keydown=${(s) => s.key === "Enter" && this.applyScale()}
          /><span>m</span>
          <button class="text" @click=${this.applyScale}>Übernehmen</button>`)), c`<div class="banner">
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
      return c`<p class="hint">
        Noch keine Zonen. Zonen und Ventile legst du unter Einstellungen → Geräte & Dienste →
        Bewässerungsplaner → Konfigurieren an.
      </p>`;
    const t = this.selected;
    return c`
      <ul class="list">
        ${e.zones.map((n, s) => this.renderZoneItem(n, s, t?.kind === "zone" && t.id === n.id))}
      </ul>
      ${e.valves.length || e.sensors.length ? c`<h3>Ventile und Sensoren</h3>
            <ul class="list compact">
              ${e.valves.map((n) => this.renderMarkerItem("valve", n))}
              ${e.sensors.map((n) => this.renderMarkerItem("sensor", n))}
            </ul>` : h}
      <p class="hint small">
        Ziehen verschiebt die Ansicht, das Mausrad zoomt. Gezeichnete Flächen ersetzen die Fläche
        von Hand bei der Berechnung. Namen, Pflanzen und Ventile änderst du in den Einstellungen der
        Integration.
      </p>
    `;
  }
  renderZoneItem(e, t, n) {
    const s = this.status?.zones[e.id], i = Q(e), a = i !== null, r = e.type === "sprinkler";
    return c`
      <li class="item ${n ? "open" : ""}" style="--zone:${this.zoneColor(t)}">
        <div class="row" @click=${() => {
      this.selected = n ? null : { kind: "zone", id: e.id };
    }}>
          <span class="dot"></span>
          <ha-icon icon=${r ? "mdi:sprinkler-variant" : e.type === "hose" ? "mdi:pipe" : "mdi:water-outline"}></ha-icon>
          <span class="name">${e.name}</span>
          ${s && s.state !== "idle" ? c`<span class="badge ${s.state}">${Me[s.state]}</span>` : h}
          <span class="meta">${a ? M(i) : c`<em>nicht gezeichnet</em>`}</span>
        </div>
        ${n ? this.renderInspector(e, s) : h}
      </li>
    `;
  }
  renderInspector(e, t) {
    const n = e.type === "sprinkler", s = Q(e), i = s !== null, a = n ? "sprinkler" : e.type === "hose" ? "hose" : "bed", r = (l, p, m, u, b = 0.1) => c`<label class="field">
        <span>${l}</span>
        <input type="number" step=${b} .value=${p == null ? "" : String(p)}
          @change=${(v) => {
      const d = parseFloat(v.target.value);
      Number.isFinite(d) && (this.remember(), u(d), this.changed());
    }} />
        <span class="unit">${m}</span>
      </label>`;
    return c`
      <div class="inspector">
        <div class="field wide">
          <span>Art</span>
          <div class="levels" role="radiogroup">
            ${[
      ["sprinkler", "Sprinkler", "mdi:sprinkler-variant"],
      ["drip", "Beet / Tropfschlauch", "mdi:water-outline"],
      ["hose", "Gießschlauch", "mdi:pipe"]
    ].map(
      ([l, p, m]) => c`<button role="radio" aria-checked=${e.type === l ? "true" : "false"}
                class=${e.type === l ? "active" : ""} @click=${() => this.setZoneType(e, l)}>
                <ha-icon icon=${m}></ha-icon>${p}</button>`
    )}
          </div>
          <small class="hint">${e.type === "hose" ? "Eine Linie, darum die Reichweite (Radius)." : e.type === "sprinkler" ? "Kreis oder Kreisausschnitt um den Sprinkler." : "Eine Fläche aus Ecken."}</small>
        </div>
        <label class="field wide">
          <span>Ventil</span>
          <select
            @change=${(l) => {
      const p = l.target.value;
      this.remember(), e.valve_id = p || null;
      for (const m of this.plan.valves)
        m.zone_ids = m.zone_ids.filter((u) => u !== e.id), m.id === e.valve_id && m.zone_ids.push(e.id);
      this.changed();
    }}
          >
            <option value="" ?selected=${!e.valve_id}>kein Ventil</option>
            ${this.plan.valves.map(
      (l) => c`<option value=${l.id} ?selected=${e.valve_id === l.id}>
                ${l.name}${l.zone_ids.some((p) => p !== e.id) ? " (auch andere Zonen)" : ""}
              </option>`
    )}
          </select>
        </label>
        ${this.renderValveFlow(e)}
        ${this.renderPlantSoil(e)}
        ${!this.plan.valves.find((l) => l.id === e.valve_id)?.position && e.valve_id ? c`<p class="hint small">Setze das Ventil im Plan (unten „Platzieren“), dann siehst du die Verbindung.</p>` : e.valve_id ? c`<p class="hint small">
                Leitung zum Ventil: am kleinen Punkt in der Mitte der Linie ziehen, um einen Knick einzufügen
                (Doppelklick auf einen Knick löscht ihn).
                ${e.valve_route?.length ? c`<button class="text" @click=${() => {
      this.remember(), e.valve_route = [], this.changed();
    }}><ha-icon icon="mdi:vector-line"></ha-icon>Leitung wieder gerade</button>` : h}
              </p>` : h}
        <dl>
          <dt>Fläche gezeichnet</dt>
          <dd>${i ? M(s) : "–"}</dd>
          <dt>Fläche von Hand</dt>
          <dd>${e.area_m2 ? M(e.area_m2) : "–"}</dd>
          ${e.overlap_m2 > 0.05 ? c`<dt>Überschneidung</dt><dd class="warn">${M(e.overlap_m2)} mit anderen Zonen</dd>` : h}
          ${t ? c`<dt>Bedarf</dt><dd>${t.need_mm.toFixed(1)} mm</dd>
                <dt>Geplant</dt><dd>${t.planned_s ? Ee(t.planned_s) : "nicht gießen"}
                  <span class="reason">(${t.reason})</span></dd>` : h}
          ${t?.locked_reason ? c`<dt>Gesperrt</dt><dd class="warn">${t.locked_reason}</dd>` : h}
        </dl>
        ${n && i ? c`<div class="fields">
              ${r("Reichweite", e.radius_m, "m", (l) => e.radius_m = Math.max(0.1, l))}
              ${r("Richtung", e.start_angle_deg, "°", (l) => e.start_angle_deg = (l % 360 + 360) % 360, 5)}
              ${r("Bogen", e.arc_deg, "°", (l) => e.arc_deg = Math.min(360, Math.max(1, l)), 5)}
            </div>
            <p class="hint small">Richtung: Anfang des Bogens, 0° = Norden (oben), 90° = Osten.</p>` : h}
        ${e.type === "hose" && i ? c`<div class="fields">
                ${r("Reichweite (Radius)", e.radius_m, "m", (l) => e.radius_m = Math.min(20, Math.max(0.05, l)), 0.05)}
              </div>
              <p class="hint small">Schlauch ${W(te(e.polygon))} lang. Bewässert wird alles bis
                ${W(e.radius_m ?? 0)} um die Linie: ${M(Q(e))}.
                Reichweite auch am runden Anfasser im Plan ziehen.</p>
              ${this.renderEdges(e.polygon, !1, (l) => e.polygon = l)}` : h}
        ${e.type === "drip" && i ? this.renderEdges(e.polygon, !0, (l) => e.polygon = l) : h}
        <div class="actions">
          <button class="text" @click=${() => this.startTool(a, e.id)}>
            <ha-icon icon=${i ? "mdi:pencil" : "mdi:draw"}></ha-icon>${i ? "Neu zeichnen" : "Zeichnen"}
          </button>
          ${i ? c`<button class="text danger" @click=${() => this.clearGeometry(e.id)}>
                <ha-icon icon="mdi:eraser"></ha-icon>Entfernen
              </button>` : h}
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
    const n = this.selected?.kind === e && this.selected.id === t.id, s = e === "valve" ? t.safety_level === "device" ? "schließt selbst" : "nur Home Assistant" : Pn[t.kind] ?? "";
    return c`
      <li class="item ${n ? "open" : ""}">
        <div class="row" @click=${() => this.selected = { kind: e, id: t.id }}>
          <span class="marker-icon ${e}">${e === "valve" ? "V" : ot[t.kind] ?? "S"}</span>
          <span class="name">${t.name}<small>${s}</small></span>
          <button class="text small" @click=${(i) => {
      i.stopPropagation(), this.startTool("place", `${e}:${t.id}`);
    }}>${t.position ? "Versetzen" : "Platzieren"}</button>
          ${t.position ? c`<button class="icon small" title="Vom Plan nehmen" @click=${(i) => {
      i.stopPropagation(), this.remember(), t.position = null, this.changed(), this.removed(`${t.name}: vom Plan genommen`);
    }}><ha-icon icon="mdi:close"></ha-icon></button>` : h}
        </div>
      </li>
    `;
  }
  /** Regler für die Deckkraft des Luftbilds oder Bilds (zum Abpausen). */
  renderOpacity() {
    const e = this.plan.garden;
    if (e.background === "none") return h;
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
    const s = Jt(e, t);
    return c`
      <details class="edges">
        <summary>Seitenlängen (${s.length})</summary>
        <div class="edge-list">
          ${s.map(
      (i, a) => c`<label class="field">
              <span>Seite ${a + 1}</span>
              <input
                type="number"
                step="0.05"
                min="0.05"
                .value=${i.toFixed(2)}
                @change=${(r) => {
        const o = parseFloat(r.target.value.replace(",", "."));
        o > 0 && (this.remember(), n(Xt(e, a, o).map((l) => [$(l[0]), $(l[1])])), this.changed());
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
      const s = Z[n], i = this.tool === "feature" && this.featureKind === n;
      return c`<button
        class="tool ${i ? "active" : ""}"
        title=${s.label}
        @click=${() => i ? this.cancelTool() : this.startTool("feature", n)}
      >
        <ha-icon icon=${s.icon}></ha-icon><span>${s.label}</span>
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
        <input type="checkbox" .checked=${this.snapOn} @change=${(n) => this.snapOn = n.target.checked} />
        An Ecken einrasten <small>(Alt-Taste: kurz aus)</small>
      </label>
      ${this.features.length ? c`<h3>Im Plan (${this.features.length})</h3>
            <ul class="list compact">
              ${this.features.map((n) => this.renderFeatureItem(n, e?.id === n.id))}
            </ul>` : h}
    `;
  }
  renderFeatureItem(e, t) {
    const n = Z[e.kind], s = n?.family ?? "area", i = s === "area" ? M(K(e.points)) : s === "line" ? e.kind === "boundary" && e.points.length >= 3 ? `${M(K(e.points))} · ${W(te(e.points, !0))} Umfang` : W(te(e.points)) : e.kind === "tree" ? `Ø ${W(2 * (e.radius_m ?? 0))}` : "", a = Object.entries(Z).filter(([, r]) => r.family === s);
    return c`
      <li class="item ${t ? "open" : ""}">
        <div class="row" @click=${() => this.selected = t ? null : { kind: "feature", id: e.id }}>
          <ha-icon icon=${n?.icon ?? "mdi:shape-outline"}></ha-icon>
          <span class="name">${X(e)}</span>
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
                  </label>` : h}
              <label class="field wide">
                <span>${e.kind === "label" ? "Text" : "Name (optional)"}</span>
                <input
                  id=${e.kind === "label" ? "feature-label" : "feature-name"}
                  type="text"
                  maxlength=${tn}
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
                  <p class="hint small">Zonen in dieser Fläche können den Boden mit einem Klick übernehmen.</p>` : h}
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
                  <p class="hint small">Ein dicker Stamm hält den Strahl eines Sprinklers auf. Die Nässekarte zeigt dahinter einen Wasserschatten.</p>` : h}
              ${s !== "point" ? this.renderEdges(e.points, s === "area", (r) => e.points = r) : h}
              <div class="actions">
                <span class="spacer"></span>
                <button class="text danger" @click=${() => this.deleteFeature(e.id)}>
                  <ha-icon icon="mdi:delete-outline"></ha-icon>Entfernen
                </button>
              </div>
            </div>` : h}
      </li>
    `;
  }
  renderBackgroundTab() {
    const e = this.plan.garden, t = this.plan.providers, n = (s, i, a, r) => c`
      <button class="choice ${e.background === s ? "active" : ""}" @click=${() => this.setBackground(s)}>
        <ha-icon icon=${i}></ha-icon>
        <span><strong>${a}</strong><small>${r}</small></span>
      </button>`;
    return c`
      <div class="choices">
        ${n("map", "mdi:satellite-variant", "Luftbild", "Kartendienst, live im Browser geladen")}
        ${n("image", "mdi:image-outline", "Eigenes Bild", "Foto, Skizze oder Screenshot")}
        ${n("none", "mdi:grid", "Raster", "Leeres Raster in Metern")}
      </div>
      ${this.renderOpacity()}
      ${e.background === "map" ? this.renderMapSettings(e, t) : h}
      ${e.background === "image" ? this.renderImageSettings(e) : h}
    `;
  }
  renderMapSettings(e, t) {
    return c`
      <h3>Kartendienst</h3>
      <select
        .value=${e.map_provider ?? "basemap_at"}
        @change=${(n) => this.updateGarden({ map_provider: n.target.value })}
      >
        ${Object.entries(t).map(
      ([n, s]) => c`<option value=${n} ?selected=${e.map_provider === n}>${s.name}</option>`
    )}
        <option value="custom" ?selected=${e.map_provider === "custom"}>Eigene Adresse …</option>
      </select>
      ${e.map_provider === "esri" ? c`<p class="note warn">
            Esri erlaubt die Nutzung nur nach seinen Nutzungsbedingungen. Für den privaten Garten ist das
            meist in Ordnung; prüfe es bitte selbst.
          </p>` : h}
      ${e.map_provider?.startsWith("basemap_at") ? c`<p class="note">Von basemap.at, nur in Österreich. Lizenz CC BY 4.0.</p>` : h}
      ${e.map_provider === "osm" ? c`<p class="note">
            OpenStreetMap-Karte, weltweit. Bitte nur gelegentlich nutzen (Regeln der OpenStreetMap-Kacheln).
          </p>` : h}
      <p class="hint small">Schneller umschalten: Ebenen-Knopf links auf der Karte.</p>
      ${e.map_provider === "custom" ? c`<label class="field wide">
              <span>Adresse mit {z}, {x}, {y}</span>
              <input type="url" placeholder="https://…/{z}/{x}/{y}.jpg" .value=${e.map_url ?? ""}
                @change=${(n) => this.updateGarden({ map_url: n.target.value.trim() })} />
            </label>` : h}
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
                @change=${(n) => this.updateGarden({ north_deg: parseFloat(n.target.value) || 0 })} />
              <span class="unit">°</span>
            </label>
            <p class="hint small">0° = Norden ist oben im Bild. Nur für die Kompassanzeige.</p>
          ` : h}
    `;
  }
};
y.styles = Be;
x([
  ue({ type: Boolean, reflect: !0 })
], y.prototype, "narrow", 2);
x([
  f()
], y.prototype, "plan", 2);
x([
  f()
], y.prototype, "status", 2);
x([
  f()
], y.prototype, "error", 2);
x([
  f()
], y.prototype, "toast", 2);
x([
  f()
], y.prototype, "tab", 2);
x([
  f()
], y.prototype, "featureKind", 2);
x([
  f()
], y.prototype, "measurePts", 2);
x([
  f()
], y.prototype, "snapOn", 2);
x([
  f()
], y.prototype, "snapHint", 2);
x([
  f()
], y.prototype, "tool", 2);
x([
  f()
], y.prototype, "toolTarget", 2);
x([
  f()
], y.prototype, "selected", 2);
x([
  f()
], y.prototype, "draft", 2);
x([
  f()
], y.prototype, "scaleDraft", 2);
x([
  f()
], y.prototype, "scaleInput", 2);
x([
  f()
], y.prototype, "view", 2);
x([
  f()
], y.prototype, "size", 2);
x([
  f()
], y.prototype, "imageUrl", 2);
x([
  f()
], y.prototype, "imageSize", 2);
x([
  f()
], y.prototype, "saving", 2);
x([
  f()
], y.prototype, "dirty", 2);
x([
  f()
], y.prototype, "searchOpen", 2);
x([
  f()
], y.prototype, "searchQuery", 2);
x([
  f()
], y.prototype, "searchResults", 2);
x([
  f()
], y.prototype, "searching", 2);
x([
  f()
], y.prototype, "searchError", 2);
x([
  f()
], y.prototype, "searchPin", 2);
x([
  f()
], y.prototype, "locating", 2);
x([
  f()
], y.prototype, "hoseRadius", 2);
x([
  f()
], y.prototype, "toastUndo", 2);
x([
  f()
], y.prototype, "layersOpen", 2);
x([
  f()
], y.prototype, "page", 2);
x([
  f()
], y.prototype, "wetOn", 2);
x([
  f()
], y.prototype, "soilOn", 2);
x([
  f()
], y.prototype, "menuOpen", 2);
x([
  f()
], y.prototype, "pendingImport", 2);
x([
  f()
], y.prototype, "hover", 2);
y = x([
  Ce("irrigation-planner-panel")
], y);
function $(e) {
  return Math.round(e * 100) / 100;
}
function lt(e) {
  return Math.round(e / 5) * 5 % 360;
}
function Q(e) {
  return e.type === "sprinkler" ? e.center && e.radius_m ? ft(e.radius_m, e.arc_deg) : null : e.type === "hose" ? e.polygon.length >= 2 && e.radius_m ? bt(e.polygon, e.radius_m) : null : e.polygon.length >= 3 ? K(e.polygon) : null;
}
function W(e) {
  return e < 1 ? `${Math.round(e * 100)} cm` : `${e.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m`;
}
function M(e) {
  return e == null ? "–" : `${e.toLocaleString("de-DE", { maximumFractionDigits: e < 10 ? 1 : 0 })} m²`;
}
function Ee(e) {
  if (e < 60) return `${e} s`;
  const t = Math.round(e / 60);
  return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
function wt(e) {
  const t = 10 ** Math.floor(Math.log10(e));
  for (const n of [1, 2, 5, 10]) if (n * t >= e) return n * t;
  return 10 * t;
}
function En(e) {
  const t = wt(110 / e), n = t >= 1e3 ? `${t / 1e3} km` : t >= 1 ? `${t} m` : `${t * 100} cm`;
  return { px: t * e, label: n };
}
function zn(e) {
  return { very_low: 0.45, low: 0.7, medium: 0.95, high: 1.08 }[e] ?? 9;
}
export {
  y as IrrigationPlannerPanel
};
