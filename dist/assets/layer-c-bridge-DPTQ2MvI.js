window.__WL_HAS_EL__ = false;
const Formula = /* @__PURE__ */ (function() {
  function toks(src) {
    const out = [], str = String(src == null ? "" : src);
    let i = 0;
    while (i < str.length) {
      const c = str[i];
      if (/\s/.test(c)) {
        i++;
        continue;
      }
      if (/[0-9]/.test(c) || c === "." && /[0-9]/.test(str[i + 1] || "")) {
        let j = i;
        while (j < str.length && /[0-9.]/.test(str[j])) j++;
        out.push({ t: "num", v: parseFloat(str.slice(i, j)) });
        i = j;
        continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        let j = i;
        while (j < str.length && /[A-Za-z0-9_$.]/.test(str[j])) j++;
        out.push({ t: "id", v: str.slice(i, j) });
        i = j;
        continue;
      }
      const two = str.slice(i, i + 2);
      if (["<=", ">=", "==", "!=", "&&", "||"].indexOf(two) >= 0) {
        out.push({ t: "op", v: two });
        i += 2;
        continue;
      }
      if ("+-*/(),<>!%".indexOf(c) >= 0) {
        out.push({ t: "op", v: c });
        i++;
        continue;
      }
      if (c === '"' || c === "'" || c === "&" || c === "|") {
        i++;
        continue;
      }
      i++;
    }
    return out;
  }
  const num = (x) => {
    const n = Number(x);
    return isFinite(n) ? n : 0;
  };
  function roundN(v, n) {
    const f = Math.pow(10, Math.max(0, Math.min(8, +n || 0)));
    return Math.round((num(v) + Number.EPSILON) * f) / f;
  }
  function evalExpr(src, ctx, rows, prec) {
    const tk = toks(src);
    let p = 0;
    ctx = ctx || {};
    rows = rows || [];
    const peek = () => tk[p] || {}, eat = (v) => {
      if (peek().v === v) {
        p++;
        return true;
      }
      return false;
    };
    const resolve = (n) => {
      if (Object.prototype.hasOwnProperty.call(ctx, n)) return num(ctx[n]);
      if (n.indexOf(".") > 0) {
        let o = ctx;
        n.split(".").forEach((q) => {
          o = o && typeof o === "object" ? o[q] : void 0;
        });
        return num(o);
      }
      return 0;
    };
    function call(name, args) {
      const A = args.map((a) => a.val), nm = args[0] && args[0].name || "";
      if (name === "sum" && nm) return rows.reduce((a, r) => a + num(r && r[nm]), 0);
      if (name === "round") return roundN(A[0], A[1]);
      if (name === "min") return Math.min.apply(null, A.length ? A : [0]);
      if (name === "max") return Math.max.apply(null, A.length ? A : [0]);
      if (name === "abs") return Math.abs(num(A[0]));
      if (name === "number") return num(A[0]);
      return 0;
    }
    function primary() {
      const t = peek();
      if (t.t === "num") {
        p++;
        return t.v;
      }
      if (t.t === "id") {
        p++;
        const name = t.v;
        if (eat("(")) {
          const args = [];
          if (peek().v !== ")") {
            const st = p, val = expr();
            args.push({ val, name: tk[st] && tk[st].t === "id" && p === st + 1 ? tk[st].v : null });
            while (eat(",")) args.push({ val: expr() });
          }
          eat(")");
          return call(name, args);
        }
        return resolve(name);
      }
      if (t.v === "(") {
        p++;
        const v = expr();
        eat(")");
        return v;
      }
      if (t.v === "-") {
        p++;
        return -primary();
      }
      if (t.v === "+") {
        p++;
        return primary();
      }
      if (t.v === "!") {
        p++;
        return primary() ? 0 : 1;
      }
      p++;
      return 0;
    }
    function mul() {
      let v = primary();
      for (; ; ) {
        const o = peek().v;
        if (o === "*") {
          p++;
          v = v * primary();
        } else if (o === "/") {
          p++;
          const d = primary();
          v = d ? v / d : 0;
        } else if (o === "%") {
          p++;
          const d = primary();
          v = d ? v % d : 0;
        } else break;
      }
      return v;
    }
    function add() {
      let v = mul();
      for (; ; ) {
        const o = peek().v;
        if (o === "+") {
          p++;
          v = v + mul();
        } else if (o === "-") {
          p++;
          v = v - mul();
        } else break;
      }
      return v;
    }
    function cmp() {
      let v = add();
      for (; ; ) {
        const o = peek().v;
        if (["<", ">", "<=", ">=", "==", "!="].indexOf(o) < 0) break;
        p++;
        const r = add();
        v = (o === "<" ? v < r : o === ">" ? v > r : o === "<=" ? v <= r : o === ">=" ? v >= r : o === "==" ? v === r : v !== r) ? 1 : 0;
      }
      return v;
    }
    function land() {
      let v = cmp();
      while (peek().v === "&&") {
        p++;
        const r = cmp();
        v = v && r ? 1 : 0;
      }
      return v;
    }
    function expr() {
      let v = land();
      while (peek().v === "||") {
        p++;
        const r = land();
        v = v || r ? 1 : 0;
      }
      return v;
    }
    let out = 0;
    try {
      out = expr();
    } catch (e) {
      out = 0;
    }
    if (!isFinite(out)) out = 0;
    if (prec !== void 0 && prec !== null && prec !== "") out = roundN(out, prec);
    return out;
  }
  return { eval: evalExpr, round: roundN, tokens: toks };
})();
(function() {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const escA = (v) => esc(v).replace(/'/g, "&#39;");
  const escJS = (v) => {
    let t = String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    t = t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return "'" + t + "'";
  };
  const CN = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十"];
  const STORE = "TPL_SCHEMA_V113";
  const VSTORE = "TPL_VIEW_CFG_V113";
  let S;
  try {
    const ov = localStorage.getItem(STORE);
    S = ov ? JSON.parse(ov) : JSON.parse($("tplSchema").textContent);
  } catch (e) {
    S = JSON.parse($("tplSchema").textContent);
  }
  window.TPL = {
    get schema() {
      return S;
    },
    apply(s) {
      localStorage.setItem(STORE, JSON.stringify(s));
      location.reload();
    },
    reset() {
      localStorage.removeItem(STORE);
      location.reload();
    },
    export() {
      return JSON.parse(JSON.stringify(S));
    },
    forceResult: "auto",
    examples: (function() {
      try {
        return JSON.parse($("tplExamples").textContent);
      } catch (e) {
        return {};
      }
    })(),
    dbPayload() {
      return window.__DB_PAYLOAD__ || null;
    },
    rows() {
      return ROWS.map((r) => Object.assign({}, r));
    }
  };
  function seedRows() {
    const d = S.data || {}, n = d.count || 64, base = S.detail.samples || {}, v = d.variants || {};
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = Object.assign({}, base);
      r.__idx = i;
      Object.keys(v).forEach((k) => {
        const a = v[k];
        if (a && a.length) r[k] = a[i % a.length];
      });
      const kf = S.list.linkField;
      const bk = String(base[kf] || "CODE-0001"), m = bk.match(/^(.*?)(\d+)$/);
      r[kf] = m ? m[1] + (Number(m[2]) + i) : bk + i;
      const nf = S.detail.primaryField;
      const nv = d.nameList;
      if (nf && nv && nv.length) r[nf] = nv[i % nv.length];
      const pf = S.detail.pinyinField, pv = d.pinyinList;
      if (pf && pv && pv.length) r[pf] = pv[i % pv.length];
      out.push(r);
    }
    return out;
  }
  let ROWS = seedRows();
  let st = {
    view: "all",
    adv: false,
    kw: "",
    checked: /* @__PURE__ */ new Set(),
    activeRow: null,
    page: 1,
    size: 10,
    sort: null,
    asc: true,
    q: {},
    toolbar: {}
  };
  function normWhere(w) {
    if (!w) return null;
    if (Array.isArray(w.rules)) {
      const rules = w.rules.filter((x) => x && x.field).map((x) => ({
        field: x.field,
        op: x.op || "eq",
        value: x.value,
        join: x.join === "or" ? "or" : "and"
      }));
      return rules.length ? { rules } : null;
    }
    if (w.field) return { rules: [{ field: w.field, op: w.op || "eq", value: w.value, join: "and" }] };
    return null;
  }
  const VC = (function() {
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const sid = () => S.id || "default";
    const key = () => VSTORE + ":" + sid();
    const allCols = () => (S.list.columns || []).filter((c) => !c.hidden).map((c) => c.k);
    const allFilterKeys = () => (S.list.filters || []).map((f) => f.k);
    const colMap = () => {
      const m = {};
      (S.list.columns || []).forEach((c) => m[c.k] = c);
      return m;
    };
    function featDefaults() {
      const out = {};
      ((S.features || {}).groups || []).forEach((g) => {
        out[g.key] = out[g.key] || {};
        (g.items || []).forEach((it) => {
          out[g.key][it.key] = clone(it.default !== void 0 ? it.default : it.type === "switch" ? true : "");
        });
      });
      return out;
    }
    function actionDefaults() {
      return clone((S.actionSpec || {}).defaults || []);
    }
    function normAction(a) {
      const o = a && typeof a === "object" ? a : {};
      return {
        id: String(o.id || "a_" + Math.random().toString(36).slice(2, 9)),
        zone: o.zone === "menu" ? "menu" : "toolbar",
        menuGroup: ["header", "new", "more"].indexOf(o.menuGroup) >= 0 ? o.menuGroup : o.zone === "menu" ? "more" : "",
        fg: o.fg || "",
        key: o.key || "",
        icon: String(o.icon || ""),
        iconSvg: String(o.iconSvg || ""),
        label: String(o.label || "未命名动作"),
        action: String(o.action || "none"),
        params: String(o.params || ""),
        desc: String(o.desc || ""),
        enabled: o.enabled !== false,
        builtin: !!o.builtin,
        sepBefore: !!o.sepBefore,
        caret: !!o.caret,
        badge: !!o.badge,
        estate: String(o.estate || ""),
        staticOn: !!o.staticOn,
        title: String(o.title || "")
      };
    }
    function normActions(arr, features) {
      if (!Array.isArray(arr)) {
        const d = actionDefaults();
        if (features && typeof features === "object") d.forEach((a) => {
          if (a.key && a.fg && features[a.fg] && features[a.fg][a.key] === false) a.enabled = false;
        });
        return d;
      }
      const seen = {};
      return arr.map(normAction).filter((a) => {
        if (seen[a.id]) return false;
        seen[a.id] = 1;
        return true;
      });
    }
    const ACTION_BASELINE = +((S.actionSpec || {}).baseline || 131);
    function mergeNewActions(c) {
      const cur2 = +(c.actionSince || 0);
      if (!Array.isArray(c.actions)) c.actions = actionDefaults();
      if (cur2 >= ACTION_BASELINE) {
        c.actionSince = ACTION_BASELINE;
        return 0;
      }
      const defs = (S.actionSpec || {}).defaults || [], known = {};
      c.actions.forEach((a) => {
        known[a.id] = 1;
      });
      let added = 0;
      defs.forEach((d, i) => {
        const since = +(d.since || 0);
        if (!(since > cur2) || known[d.id]) return;
        const o = normAction(clone(d));
        const prev = defs.slice(0, i).reverse().find((x) => known[x.id]);
        if (prev) {
          const j = c.actions.findIndex((a) => a.id === prev.id);
          c.actions.splice(j + 1, 0, o);
        } else c.actions.push(o);
        known[d.id] = 1;
        added++;
      });
      c.actionSince = ACTION_BASELINE;
      return added;
    }
    function pageActionDefaults() {
      return clone((S.pageSpec || {}).defaults || []);
    }
    function normPageAction(a) {
      const o = a && typeof a === "object" ? a : {};
      return {
        id: String(o.id || "pi_" + Math.random().toString(36).slice(2, 9)),
        scene: String(o.scene || "custom"),
        label: String(o.label || "未命名场景"),
        trigger: String(o.trigger || ""),
        method: String(o.method || "drawer"),
        params: String(o.params || ""),
        desc: String(o.desc || ""),
        enabled: o.enabled !== false,
        builtin: !!o.builtin
      };
    }
    function normRouteParams(v) {
      const t = String(v == null ? "" : v).trim();
      if (!t) return "";
      if (t.indexOf("{") >= 0 || t.indexOf("=") >= 0) return t;
      return "{param}={value}";
    }
    function normPageActions(arr, features) {
      if (!Array.isArray(arr)) {
        const rs = features && features.page && Array.isArray(features.page.routes) ? features.page.routes : null;
        if (rs && rs.length) return rs.map(function(r) {
          const m = r.mode === "page" ? "gotoPage" : r.mode === "blank" ? "openWindow" : "drawer";
          return {
            id: "pi_" + (r.scene || "custom"),
            scene: String(r.scene || "custom"),
            label: String(r.label || r.scene || "未命名场景"),
            trigger: (pageActionDefaults().find(function(b) {
              return b.scene === r.scene;
            }) || {}).trigger || "",
            method: m,
            params: JSON.stringify({
              page: r.page || "",
              params: normRouteParams(r.params || "")
            }),
            desc: "由旧版页面路由迁移" + (r.params && String(r.params).indexOf("{") < 0 && String(r.params).indexOf("=") < 0 ? "（旧参数键名已归一为列按钮 param 模板）" : ""),
            enabled: true,
            builtin: true
          };
        });
        return pageActionDefaults();
      }
      const seen = {};
      return arr.map(normPageAction).filter(function(a) {
        if (seen[a.id]) return false;
        seen[a.id] = 1;
        return true;
      });
    }
    function normFeatures(f) {
      const d = featDefaults(), o = f && typeof f === "object" ? f : {};
      Object.keys(d).forEach((g) => {
        o[g] = Object.assign({}, d[g], o[g] && typeof o[g] === "object" ? o[g] : {});
      });
      if (!Array.isArray(o.page.routes) || !o.page.routes.length) o.page.routes = clone(d.page.routes || []);
      o.page.routes = o.page.routes.map(function(r) {
        const n = Object.assign({}, r);
        n.params = normRouteParams(n.params);
        return n;
      });
      return o;
    }
    function defaults() {
      return {
        schemaId: sid(),
        active: ((S.list.views || [])[0] || {}).id || "all",
        features: featDefaults(),
        actions: actionDefaults(),
        actionSince: +((S.actionSpec || {}).baseline || 131),
        pageActions: pageActionDefaults(),
        views: (S.list.views || []).map((v) => ({
          id: v.id,
          label: v.label,
          where: normWhere(v.where),
          cols: v.cols && v.cols.length ? v.cols.slice() : allCols(),
          colW: clone(v.colW || {}),
          colDef: clone(v.colDef || {}),
          filterKeys: v.filterKeys && v.filterKeys.length ? v.filterKeys.slice() : allFilterKeys(),
          filters: clone(v.filters || {}),
          toolbar: clone(v.toolbar || {}),
          toolbarDefs: normTb(v.toolbarDefs || (S.list.toolbarSelects || []))
        }))
      };
    }
    let cfg = defaults();
    function normalize(c) {
      const m = colMap();
      c.schemaId = sid();
      c.features = normFeatures(c.features);
      c.actions = normActions(c.actions, c.features);
      mergeNewActions(c);
      c.pageActions = normPageActions(c.pageActions, c.features);
      c.views = c.views.map((v) => {
        v.where = normWhere(v.where);
        v.cols = v.cols && v.cols.length ? v.cols.filter((k) => m[k]) : allCols();
        v.colW = v.colW || {};
        v.colDef = v.colDef || {};
        v.filterKeys = v.filterKeys || allFilterKeys();
        v.filters = v.filters || {};
        v.toolbar = v.toolbar || {};
        v.toolbarDefs = normTb(Array.isArray(v.toolbarDefs) ? v.toolbarDefs : S.list.toolbarSelects || []);
        return v;
      });
      if (!c.views.length) return defaults();
      return c;
    }
    function load() {
      try {
        const o = JSON.parse(localStorage.getItem(key()));
        if (o && o.schemaId === sid() && Array.isArray(o.views) && o.views.length) return normalize(o);
      } catch (e) {
      }
      return defaults();
    }
    function init() {
      cfg = load();
      if (!cfg.views.some((v) => v.id === cfg.active)) cfg.active = cfg.views[0].id;
      st.view = cfg.active;
      save();
    }
    function setCfg(c) {
      cfg = c;
    }
    function views() {
      return cfg.views;
    }
    function view(id) {
      return cfg.views.find((v) => v.id === id) || {
        where: null,
        cols: allCols(),
        colW: {},
        colDef: {},
        filterKeys: allFilterKeys(),
        filters: {},
        toolbar: {},
        toolbarDefs: normTb(S.list.toolbarSelects || [])
      };
    }
    function cols(id) {
      const v = view(id), m = colMap(), ks = v.cols && v.cols.length ? v.cols : allCols();
      const cw = v.colW || {}, cd = v.colDef || {};
      const out = ks.filter((k) => m[k]).map((k) => {
        const base = m[k], ov = cd[k] || {};
        const c = Object.assign({}, base, ov);
        c.sortable = c.sortable !== void 0 ? !!c.sortable : !c.nosort;
        c.nosort = !c.sortable;
        c.align = c.align || "left";
        c.dataType = c.dataType || "text";
        c.renderer = c.renderer || "text";
        c.w = +cw[k] || c.w || 100;
        return c;
      });
      return out.length ? out : S.list.columns || [];
    }
    function filterDefs(id) {
      const v = view(id), ks = v.filterKeys || allFilterKeys();
      return (S.list.filters || []).filter((f) => ks.indexOf(f.k) >= 0);
    }
    function normTb(list) {
      return (Array.isArray(list) ? list : []).filter((t) => t && t.field).map((t) => ({ field: t.field, label: t.label || t.field }));
    }
    function tbOptions(field) {
      const f = tbFieldOptions().find((x) => x.k === field);
      if (f && f.opts.length) return f.opts.slice();
      const vals = [];
      ROWS.slice(0, 60).forEach((r) => {
        const x = String(r[field] == null ? "" : r[field]);
        if (x && vals.indexOf(x) < 0 && vals.length < 8) vals.push(x);
      });
      if (vals.length) return vals;
      const t = (S.list.toolbarSelects || []).find((x) => x.field === field);
      return t && Array.isArray(t.options) ? t.options.slice() : [];
    }
    function toolbarDefs(id) {
      const v = view(id);
      return (Array.isArray(v.toolbarDefs) ? v.toolbarDefs : S.list.toolbarSelects || []).filter((t) => t && t.field).map((t) => ({ field: t.field, label: t.label || t.field, options: tbOptions(t.field) }));
    }
    function tbFieldOptions() {
      const out = [], seen = {};
      (S.list.filters || []).forEach((f) => {
        const k = f.sa || f.k;
        if (!k || seen[k]) return;
        seen[k] = 1;
        out.push({ k, l: f.l || k, opts: (f.opt || []).filter((o) => o !== "全部").slice(0, 12) });
      });
      (S.list.columns || []).forEach((c) => {
        const k = c.k;
        if (k === "chk" || k === "ops" || c.hidden || seen[k]) return;
        seen[k] = 1;
        const vals = [];
        ROWS.slice(0, 40).forEach((r) => {
          const x = String(r[k] == null ? "" : r[k]);
          if (x && vals.indexOf(x) < 0 && vals.length < 8) vals.push(x);
        });
        out.push({ k, l: c.t || k, opts: vals });
      });
      return out;
    }
    function count(v) {
      const keys = v.filterKeys || allFilterKeys(), tb = v.toolbar || {}, q = v.filters || {};
      return ROWS.filter((r) => {
        if (!viewMatch(r, v.where)) return false;
        const tbs = Array.isArray(v.toolbarDefs) ? v.toolbarDefs : S.list.toolbarSelects || [];
        for (const t of tbs) {
          const val = tb[t.field];
          if (val && val !== "全部" && String(r[t.field]) !== String(val)) return false;
        }
        for (const f of S.list.filters || []) {
          if (keys.indexOf(f.k) < 0) continue;
          const val = q[f.k];
          if (!val || val === "全部") continue;
          const rv2 = String(r[f.sa || f.k] == null ? "" : r[f.sa || f.k]);
          if (rv2.toLowerCase().indexOf(String(val).toLowerCase()) < 0) return false;
        }
        return true;
      }).length;
    }
    function apply(id, reset) {
      const v = view(id);
      st.view = id;
      st.page = 1;
      if (reset) {
        st.q = Object.assign({}, v.filters || {});
        st.toolbar = Object.assign({}, v.toolbar || {});
        st.checked.clear();
        st.activeRow = null;
        st.sort = null;
        st.asc = true;
        const f = cfg.features && cfg.features.form || {};
        st.size = +f.pageSize || 10;
        const ds = f.defaultSort || {};
        st.sort = ds.field || null;
        st.asc = ds.order !== "desc";
      }
    }
    function activate(id) {
      if (!cfg.views.some((v) => v.id === id)) id = cfg.views[0].id;
      cfg.active = id;
      apply(id, true);
      save();
      renderList();
    }
    function save() {
      cfg.actionSince = ACTION_BASELINE;
      try {
        localStorage.setItem(key(), JSON.stringify(cfg));
      } catch (e) {
      }
    }
    function whereFields() {
      const out = (S.list.columns || []).filter((c) => c.k !== "chk" && c.k !== "ops").map((c) => ({ k: c.k, l: c.t || c.k }));
      const r0 = ROWS[0] || {};
      [["kind", "类别"], ["status", "状态"], ["flow", "流转节点"], ["level", "等级"], ["stock", "库存量"], ["warn", "警戒线"]].forEach((x) => {
        if (x[0] in r0 && !out.some((f) => f.k === x[0])) out.push({ k: x[0], l: x[1] });
      });
      return out;
    }
    return {
      sid,
      key,
      clone,
      defaults,
      normalize,
      init,
      setCfg,
      views,
      view,
      cols,
      filterDefs,
      toolbarDefs,
      tbFieldOptions,
      tbOptions,
      normTb,
      count,
      apply,
      activate,
      save,
      whereFields,
      allCols,
      allFilterKeys,
      colMap,
      featDefaults,
      normFeatures,
      actionDefaults,
      normActions,
      mergeNewActions,
      pageActionDefaults,
      normPageActions,
      normRouteParams,
      get actions() {
        return cfg.actions;
      },
      get pageActions() {
        return cfg.pageActions;
      },
      get features() {
        return cfg.features;
      },
      get cfg() {
        return cfg;
      }
    };
  })();
  const ACT = /* @__PURE__ */ (function() {
    const spec = () => S.actionSpec || {};
    const icons = () => spec().icons || {};
    const labels = () => spec().iconLabels || {};
    const all = () => VC.actions || [];
    const icon = function(key, custom, cls) {
      let v = custom || icons()[key] || "";
      if (cls && v) v = v.replace("<svg ", '<svg class="' + cls + '" ');
      return v;
    };
    const items = function(zone, mg, includeDisabled) {
      return all().filter((a) => a.zone === zone && (!mg || a.menuGroup === mg)).filter((a) => includeDisabled || a.enabled !== false).map((a) => Object.assign({}, a, { svg: icon(a.icon, a.iconSvg) }));
    };
    const byKey = (k) => all().find((a) => a.key === k) || null;
    const has = (zone, mg) => items(zone, mg).length > 0;
    const toolbar = () => items("toolbar");
    const header = () => items("menu", "header");
    const newMenu = () => items("menu", "new");
    const more = () => items("menu", "more");
    const methodOptions = () => (spec().methods || []).slice();
    const iconOptions = () => Object.keys(icons()).map((k) => ({ key: k, label: labels()[k] || k, svg: icons()[k] }));
    const menuGroups = () => (spec().menuGroups || []).slice();
    const zones = () => (spec().zones || []).slice();
    function params(a) {
      try {
        const o = JSON.parse(a.params || "");
        return o && typeof o === "object" ? o : {};
      } catch (e) {
        return { value: a.params || "" };
      }
    }
    const toast = (m) => {
      const f = window.TPL && window.TPL._toast;
      if (f) f(m);
    };
    const log = (o) => {
      (window.__WL_ACTION_LOG__ = window.__WL_ACTION_LOG__ || []).push(
        Object.assign({ at: (/* @__PURE__ */ new Date()).toISOString() }, o)
      );
    };
    const METHODS = {
      expand: (a, el) => window.TPL._wlExpand(el),
      filter: () => window.TPL._adv(),
      group: () => window.TPL._wlGroup(),
      table: (a, el) => window.TPL._wlMode("table", el),
      tree: (a, el) => window.TPL._wlMode("tree", el),
      new: () => window.TPL._new(),
      node: () => window.TPL._wlNode(),
      import: () => window.TPL._wlImport(),
      frame: () => window.TPL._wlFocus(),
      watermark: () => window.TPL._wlWatermark(),
      config: () => window.TPL._vcOpen(),
      fullscreen: () => {
        toast("全屏 / 恢复界面");
        try {
          if (document.fullscreenElement) {
            (document.exitFullscreen || function() {
            })();
            toast("已退出全屏");
          } else {
            const el = document.documentElement;
            if (!el.requestFullscreen) {
              window.TPL._wlFocus();
              toast("浏览器不支持全屏，已切换完整框架显示");
              return;
            }
            const p = el.requestFullscreen();
            if (p && p.catch) p.catch(function() {
              window.TPL._wlFocus();
              toast("浏览器未允许全屏，已切换完整框架显示");
            });
          }
        } catch (e) {
          window.TPL._wlFocus();
          toast("已切换完整框架显示");
        }
      },
      exportExcel: () => {
        try {
          const d = window.TPL._exportData(), cols = d.cols.filter((c) => c.k !== "chk" && c.k !== "ops" && !c.hidden);
          const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
          const lines = [cols.map((c) => q(c.t || c.k)).join(",")].concat(
            d.rows.map((r) => cols.map((c) => q(r[c.k])).join(","))
          );
          const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob), a = document.createElement("a");
          a.href = url;
          a.download = (window.__ACT_FILE__ || "列表导出") + ".csv";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1e3);
          toast("已导出 " + d.rows.length + " 条为 Excel（CSV）");
          log({ type: "exportExcel", rows: d.rows.length });
        } catch (e) {
          toast("导出失败：" + (e && e.message || e));
        }
      },
      exportPdf: () => {
        toast("已打开打印对话框，选「另存为 PDF」即可导出");
        log({ type: "exportPdf" });
        setTimeout(function() {
          try {
            window.print();
          } catch (e) {
          }
        }, 30);
      },
      print: () => {
        toast("已调用浏览器打印");
        setTimeout(function() {
          try {
            window.print();
          } catch (e) {
          }
        }, 30);
      },
      callApi: () => {
        const p = window.__ACT_PARAMS__ || {};
        log({ type: "callApi", url: p.url || "", method: p.method || "GET", body: p.body || "" });
        toast("调用 API · " + (p.method || "GET") + " " + (p.url || "(未填 url)") + "（原型级，已写入 __WL_ACTION_LOG__）");
      },
      custom: () => {
        const p = window.__ACT_PARAMS__ || {};
        const f = p.fn && window.TPL[p.fn];
        if (typeof f === "function") {
          f.call(window.TPL);
          toast("已调用自定义方法 " + p.fn);
        } else toast("未找到自定义方法 " + (p.fn || "(未填 fn)"));
      },
      none: () => toast(window.__ACT_LABEL__ || "该动作当前为占位")
    };
    function invoke(method, pm, label, el) {
      const p = pm && typeof pm === "object" ? pm : params({ params: pm || "" });
      window.__ACT_PARAMS__ = p;
      window.__ACT_LABEL__ = label || method;
      window.__ACT_FILE__ = p.filename || label || "列表导出";
      const f = METHODS[method];
      if (f) {
        f({ action: method, params: "" }, el);
        return true;
      }
      const t = window.TPL[method];
      if (typeof t === "function") {
        t.call(window.TPL, el);
        return true;
      }
      toast("未注册的交互方法：" + method);
      return true;
    }
    function run(id, el) {
      const a = all().find((x) => x.id === id);
      if (!a) return;
      try {
        window.TPL._wlCloseMenu && window.TPL._wlCloseMenu();
        window.TPL._wlCloseNew && window.TPL._wlCloseNew();
      } catch (e) {
      }
      invoke(a.action, params(a), a.label, el);
    }
    return {
      spec,
      icons,
      icon,
      items,
      byKey,
      has,
      toolbar,
      header,
      newMenu,
      more,
      methodOptions,
      iconOptions,
      menuGroups,
      zones,
      run,
      invoke,
      get count() {
        return all().length;
      }
    };
  })();
  window.ACT = ACT;
  window.TPL._actRun = function(id, el) {
    return ACT.run(id, el);
  };
  window.TPL._actions = function() {
    return VC.clone(VC.actions || []);
  };
  window.TPL._actionSpec = function() {
    return VC.clone(ACT.spec());
  };
  window.TPL._actionLog = function() {
    return (window.__WL_ACTION_LOG__ || []).slice();
  };
  window.TPL._exportData = function() {
    return { rows: filtered().slice(), cols: VC.cols(st.view).map((c) => Object.assign({}, c)) };
  };
  const PAGE = /* @__PURE__ */ (function() {
    const spec = () => S.pageSpec || {};
    const all = () => VC.pageActions || [];
    const methods = () => (spec().methods || []).slice();
    const method = (k) => methods().find((m) => m.key === k) || { key: k, label: k || "—", desc: "", params: "" };
    const scenes = () => (spec().scenes || []).slice();
    const parse = (a) => {
      try {
        const o = JSON.parse(a.params || "");
        return o && typeof o === "object" ? o : {};
      } catch (e) {
        return { value: a.params || "" };
      }
    };
    const modeOf = (m) => m === "gotoPage" ? "page" : m === "openWindow" ? "blank" : m === "drawer" ? "drawer" : "method";
    const toast = (m) => {
      const f = window.TPL && window.TPL._toast;
      if (f) f(m);
    };
    const fb = () => spec().fallback || { missing: "drawer", disabled: "drawer", methodMissing: "none" };
    function escJson(v) {
      return JSON.stringify(String(v == null ? "" : v)).slice(1, -1);
    }
    function interpolate(tpl, ctx) {
      const row = ctx && ctx.row || {}, q = escJson;
      const map = {
        "{value}": q(ctx && ctx.value),
        "{code}": q(ctx && ctx.value),
        "{param}": q(ctx && ctx.param || "code"),
        "{field}": q(ctx && ctx.field),
        "{col}": q(ctx && ctx.col),
        "{scene}": q(ctx && ctx.scene),
        "{idx}": q(ctx && ctx.idx),
        "{title}": q(ctx && ctx.title)
      };
      let out = String(tpl == null ? "" : tpl);
      Object.keys(map).forEach((k) => {
        out = out.split(k).join(map[k]);
      });
      out = out.replace(/\{row\.([A-Za-z0-9_]+)\}/g, (m, k) => q(row[k]));
      return out;
    }
    function resolveParams(a, ctx) {
      const raw = interpolate(a && a.params, ctx || {});
      let o;
      try {
        o = JSON.parse(raw);
        if (!o || typeof o !== "object") o = { value: raw };
      } catch (e) {
        o = { value: raw };
      }
      if (ctx && ctx.value !== void 0) {
        o.code = ctx.value;
        o.value = ctx.value;
        o.paramKey = ctx.param || "code";
        o.__ctx = { col: ctx.col, field: ctx.field, scene: ctx.scene, idx: ctx.idx };
      }
      return o;
    }
    function methodRegistered(k) {
      return methods().some((m) => m.key === k) || window.TPL && typeof window.TPL[k] === "function" || !!(window.ACT && window.ACT.methodOptions && window.ACT.methodOptions().some((x) => x.key === k));
    }
    function resolve(sceneKey, list) {
      const arr = list || all(), key = String(sceneKey || "");
      let a = arr.find((x) => x.scene === key), byLabel = false;
      if (!a) {
        a = arr.find((x) => x.label === key);
        byLabel = !!a;
      }
      if (!arr.length) return { status: "missing", action: null, label: "场景列表为空" };
      if (!a) return { status: "missing", action: null, label: "未找到场景 " + key };
      if (a.enabled === false) return { status: "disabled", action: a, label: a.label, byLabel };
      if (!methodRegistered(a.method || "drawer"))
        return { status: "methodMissing", action: a, label: a.label, byLabel };
      return { status: "ok", action: a, label: a.label, byLabel };
    }
    function routes() {
      return all().map(function(a) {
        const p = parse(a);
        return {
          scene: a.scene,
          label: a.label,
          page: p.page || p.value || "",
          mode: modeOf(a.method),
          params: p.params !== void 0 ? p.params : p.value || "",
          method: a.method,
          enabled: a.enabled !== false,
          desc: a.desc,
          trigger: a.trigger
        };
      });
    }
    function route(sc) {
      return routes().find((r) => r.scene === sc) || { scene: sc, page: "", mode: "drawer", params: "", method: "drawer" };
    }
    function dispatch(scene, ctx) {
      ctx = ctx || {};
      const rs = resolve(scene, ctx.list), a = rs.action, f = fb();
      const m = a ? a.method || "drawer" : "drawer", p = a ? resolveParams(a, ctx) : {};
      const rec = {
        scene,
        sceneName: rs.label || "",
        resolution: rs.status,
        resolvedBy: rs.byLabel ? "label" : "key",
        resolvedScene: a ? a.scene : "",
        method: m,
        label: a ? a.label : rs.label || scene,
        page: p.page || "",
        mode: modeOf(m),
        params: p.params || "",
        paramsResolved: p,
        value: ctx.value !== void 0 ? ctx.value : null,
        field: ctx.field || "",
        col: ctx.col || "",
        idx: ctx.idx !== void 0 ? ctx.idx : null,
        at: Date.now(),
        source: ctx.source || "column-cell",
        buttonIndex: ctx.buttonIndex,
        buttonLabel: ctx.buttonLabel || "",
        resolutionButton: ctx.resolution || "",
        display: ctx.display || ""
      };
      window.__WL_ROUTE__ = rec;
      (window.__WL_ROUTE_LOG__ = window.__WL_ROUTE_LOG__ || []).push(rec);
      if (rs.status !== "ok") {
        const policy = f[rs.status] || "drawer";
        rec.fallback = policy;
        const why = { missing: "场景未配置", disabled: "场景已停用", methodMissing: "交互方法未注册" }[rs.status];
        if (policy === "none") {
          toast(why + "：" + rec.label + "（回退策略：不执行）");
          return true;
        }
        toast(why + "：" + rec.label + "（回退策略：打开抽屉）");
        return false;
      }
      if (m === "drawer") return false;
      if (m === "gotoPage" || m === "openWindow") {
        toast("跳转 " + (p.page || "未配置") + " · 打开方式：" + method(m).label + " · 参数 " + (p.params || "无"));
        return true;
      }
      ACT.invoke(m, p, a.label, ctx.el || null);
      return true;
    }
    function dispatchCustom(scene, el) {
      return dispatch(scene, { el });
    }
    return {
      spec,
      all,
      methods,
      method,
      scenes,
      parse,
      modeOf,
      routes,
      route,
      dispatch,
      dispatchCustom,
      resolve,
      interpolate,
      resolveParams,
      escJson,
      fb,
      get count() {
        return all().length;
      }
    };
  })();
  window.PAGE = PAGE;
  window.TPL._pageActions = function() {
    return VC.clone(PAGE.all());
  };
  window.TPL._pageSpec = function() {
    return VC.clone(PAGE.spec());
  };
  window.TPL._pageScene = function(sc, el) {
    return PAGE.dispatchCustom(sc, el);
  };
  window.TPL._clickCfg = function(colKey) {
    const c = VC.cols(st.view).find((x) => x.k === colKey) || { k: colKey };
    const g = clickCfg(c), list = typeof vDraft !== "undefined" && vDraft && vDraft.pageActions || PAGE.all();
    return VC.clone({ col: c.k, cfg: g, resolution: g.scene ? PAGE.resolve(g.scene, list).status : "unbound" });
  };
  window.TPL._pageResolve = function(scene, list) {
    return VC.clone(PAGE.resolve(scene, list));
  };
  window.TPL._buttonSpec = function() {
    return VC.clone(S.buttonSpec || {});
  };
  window.TPL._buttonResolve = function(colKey, idx, list) {
    const c = VC.cols(st.view).find((x) => x.k === colKey) || { k: colKey };
    const bs = vcBtnList(c), b = bs[idx] || {};
    return VC.clone(Object.assign({
      col: colKey,
      index: idx,
      label: String(b.label || ""),
      cfg: clickCfg(c, b)
    }, buttonResolve(c, b, list)));
  };
  window.TPL._pageInterpolate = function(tpl, ctx) {
    return PAGE.interpolate(tpl, ctx || {});
  };
  const FEAT = /* @__PURE__ */ (function() {
    const groups = () => (S.features || {}).groups || [];
    const all = () => VC.features || VC.normFeatures({});
    const grp = (k) => all()[k] || {};
    const tb = (k) => {
      const a = ACT.byKey(k);
      return a ? a.enabled !== false : !!grp("general")[k];
    };
    const menu = (k) => {
      const a = ACT.byKey(k);
      return a ? a.enabled !== false : !!grp("menu")[k];
    };
    const form = (k) => grp("form")[k];
    const item = (g, k) => {
      const G = groups().find((x) => x.key === g);
      return G ? (G.items || []).find((i) => i.key === k) : null;
    };
    const routes = () => window.PAGE ? PAGE.routes() : [];
    const route = (scene) => window.PAGE ? PAGE.route(scene) : { scene, page: "", mode: "drawer", params: "" };
    const switches = () => {
      const o = {}, a = all();
      groups().forEach((g) => (g.items || []).forEach((it) => {
        if (it.type === "switch") o[it.key] = !!(a[g.key] || {})[it.key];
      }));
      return o;
    };
    const menuItems = (grpName) => ACT.items("menu", grpName).map((a) => ({
      id: a.id,
      key: a.key || a.id,
      label: a.label,
      action: a.action || "none",
      group: a.menuGroup,
      groupLabel: (ACT.menuGroups().find((g) => g.key === a.menuGroup) || {}).label || "",
      icon: a.icon,
      iconSvg: a.iconSvg,
      svg: ACT.icon(a.icon, a.iconSvg)
    }));
    const newMenuItems = () => menuItems("new");
    const moreMenuItems = () => menuItems("more");
    const anyMenu = () => ACT.more().length > 0;
    const menuTarget = (k) => {
      const it = item("menu", k);
      return it ? it.target || "menu" : "menu";
    };
    return {
      groups,
      all,
      grp,
      tb,
      menu,
      form,
      item,
      routes,
      route,
      switches,
      anyMenu,
      menuTarget,
      menuItems,
      newMenuItems,
      moreMenuItems,
      get actions() {
        return (VC.actions || []).slice();
      },
      get spec() {
        return S.features || {};
      }
    };
  })();
  window.FEAT = FEAT;
  let _featSig = "";
  function applyFeaturePresentation(force) {
    const sig = JSON.stringify(FEAT.all());
    if (!force && sig === _featSig) return;
    _featSig = sig;
    const m = $("main");
    if (!m) return;
    m.classList.remove("wl-density-compact", "wl-density-normal", "wl-density-loose");
    m.classList.add("wl-density-" + (FEAT.form("density") || "normal"));
    m.classList.toggle("wl-group-on", !!FEAT.form("groupOn"));
  }
  function densityCSS() {
    return `<style id="tpl-v121-density">
#main.wl-density-compact .wl-el-table .el-table__body tr.el-table__row>td.el-table__cell,
#main.wl-density-compact .wl-el-table .el-table__fixed-body-wrapper tr.el-table__row>td.el-table__cell{height:32px!important}
#main.wl-density-compact .wl-el-table .cell{height:31px!important;line-height:31px!important}
#main.wl-density-compact .drug-table tbody td{height:32px!important;line-height:31px!important}
#main.wl-density-loose .wl-el-table .el-table__body tr.el-table__row>td.el-table__cell,
#main.wl-density-loose .wl-el-table .el-table__fixed-body-wrapper tr.el-table__row>td.el-table__cell{height:48px!important}
#main.wl-density-loose .wl-el-table .cell{height:47px!important;line-height:47px!important}
#main.wl-density-loose .drug-table tbody td{height:48px!important;line-height:47px!important}
</style>`;
  }
  function renderList() {
    $("main").innerHTML = listHTML();
    const q = $("tplQuick");
    if (q) q.innerHTML = VC.views().slice(0, 4).map((v) => `<a href="#" onclick="TPL._view(${escJS(v.id)});return false">${esc(v.label)}</a>`).join("");
    renderRows();
    applyFeaturePresentation();
  }
  let vDraft = null, vSel = null, vTab = "cols";
  let vMode = "views", vFeatGroup = "general";
  let vSelCol = null, vColKw = "";
  let vFixedDir = {};
  function vcCur() {
    return (vDraft.views || []).find((v) => v.id === vSel) || vDraft.views[0];
  }
  function vcRefreshCount() {
    const v = vcCur(), hit = VC.count(v);
    const n = document.querySelector("#vcList .vc-item.on .n");
    if (n) n.textContent = (v.cols || []).length + "列 · " + hit + "条";
    const rn = $("vcRuleN");
    if (rn) {
      const nr = (v.where && v.where.rules || []).filter((x) => x.field).length;
      rn.innerHTML = nr + ' 个条件 · 命中 <b id="vcRuleHit">' + hit + "</b> 条";
    }
    const tbs = (Array.isArray(v.toolbarDefs) ? v.toolbarDefs : S.list.toolbarSelects || []).filter((t) => t && t.field);
    const tn = $("vcTbN");
    if (tn) tn.textContent = tbs.length + " 项 · 可增删";
    const an = $("vcAdvN");
    if (an) an.textContent = "已启用 " + (v.filterKeys || []).length + " / " + (S.list.filters || []).length;
  }
  function vcShow(on) {
    const m = $("vcMask"), w = $("vcWin");
    if (m) m.classList.toggle("on", on);
    if (w) w.classList.toggle("on", on);
  }
  function buildVCDom() {
    if ($("vcWin")) return;
    const specSub = "";
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="vc-mask" id="vcMask" onclick="TPL._vcClose()"></div>
    <div class="vc-win" id="vcWin">
      <div class="vc-hd"><div><h3>视图配置</h3><span class="sub" id="vcHdSub">${specSub}</span></div>
        <button class="vc-x" onclick="TPL._vcClose()" title="关闭">×</button></div>
      <div class="vc-bd">
        <div class="vc-left">
          <!-- v1.21：与「视图列表」同级的「功能设置」入口 -->
          <div class="vc-modes">
            <div class="vc-mode" data-m="views" onclick="TPL._vcMode('views')">视图列表</div>
            <div class="vc-mode" data-m="features" onclick="TPL._vcMode('features')">功能设置</div>
          </div>
          <div class="vc-left-pane" id="vcLeftViews">
            <div class="vc-left-hd">视图列表 <span id="vcViewN"></span></div>
            <div class="vc-list" id="vcList"></div>
            <div class="vc-left-ft"><button class="vc-add" onclick="TPL._vcAdd()">＋ 新建视图</button></div>
          </div>
          <div class="vc-left-pane" id="vcLeftFeat">
            <div class="vc-left-hd">配置概览 <span id="vcFeatN"></span></div>
            <div class="vc-list fs-left" id="vcFeatList"></div>
            <div class="vc-left-ft fs-left-ft"><button class="vc-add" onclick="TPL._vcFeatJSON()">配置 JSON</button>
              <button class="vc-add" onclick="TPL._vcFeatResetAll()">恢复全部</button></div>
          </div>
        </div>
        <div class="vc-right">
          <div class="vc-rhd" id="vcRhdViews"><label>视图名称</label><input id="vcName" oninput="TPL._vcRename(this.value)">
            <span class="vc-badge" id="vcCurBadge"></span></div>
          <div class="vc-rhd" id="vcRhdFeat"><label>作用范围</label><b class="vf-scope">全部视图 · 与视图列表平级</b>
            <span class="vc-badge" id="vcFeatBadge"></span><span class="vf-hint">保存并应用后统一生效</span></div>
          <div class="vc-tabs" id="vcTabs">
            <div class="vc-tab" data-t="filters" onclick="TPL._vcTab('filters')">筛选选项</div>
            <div class="vc-tab" data-t="toolbar" onclick="TPL._vcTab('toolbar')">快捷筛选</div>
            <div class="vc-tab" data-t="adv" onclick="TPL._vcTab('adv')">高级筛选</div>
            <div class="vc-tab" data-t="cols" onclick="TPL._vcTab('cols')">列选项</div>
            <div class="vc-tab" data-t="where" onclick="TPL._vcTab('where')">数据范围</div></div>
          <div class="vc-pane" id="vcPane"></div>
        </div>
      </div>
      <div class="vc-ft"><button class="vc-btn" onclick="TPL._vcReset()">恢复默认</button><span style="flex:1"></span>
        <button class="vc-btn" onclick="TPL._vcClose()">取消</button>
        <button class="vc-btn pri" onclick="TPL._vcSave()">保存并应用</button></div>
    </div>`
    );
  }
  function vcDefSpec(key) {
    const fs = (S.list.columnSpec || {}).fields || [];
    return fs.find((f) => f.key === key) || {};
  }
  function vcDefOpts(key) {
    const f = vcDefSpec(key), vs = f.values || [];
    return vs.map((v) => ({ v, l: f.labels && f.labels[v] !== void 0 ? f.labels[v] : v || "" }));
  }
  function vcColDefaultPick(v) {
    const m = VC.colMap(), ks = (v.cols || []).filter((k) => m[k] && k !== "chk" && k !== "ops");
    const lf = S.list.linkField;
    return lf && ks.indexOf(lf) >= 0 ? lf : ks[0] || ((S.list.columns || [])[0] || {}).k;
  }
  function vcColEff(v, k) {
    const m = VC.colMap(), cw = v.colW || {}, cd = v.colDef || {};
    const c = Object.assign({}, m[k], cd[k] || {});
    c.w = +cw[k] || c.w || 100;
    c.sortable = c.sortable !== void 0 ? !!c.sortable : !c.nosort;
    c.align = c.align || "left";
    c.dataType = c.dataType || "text";
    c.renderer = c.renderer || "text";
    return c;
  }
  function vcColOverridden(v, k) {
    const cd = v.colDef || {}, cw = v.colW || {};
    return !!(cd[k] && Object.keys(cd[k]).length || cw[k]);
  }
  function vcFixedGet(v, k) {
    const m = VC.colMap(), ov = (v.colDef || {})[k] || {};
    return Object.prototype.hasOwnProperty.call(ov, "fixed") ? ov.fixed || "" : (m[k] || {}).fixed || "";
  }
  function vcFixedCols(v) {
    const m = VC.colMap();
    return (v.cols || []).filter((k) => m[k]);
  }
  function vcFixedWrite(v, cols, next) {
    const m = VC.colMap();
    v.colDef = v.colDef || {};
    let n = 0;
    cols.forEach((x, j) => {
      const baseF = (m[x] || {}).fixed || "", curF = vcFixedGet(v, x);
      if (next[j] === curF) return;
      const d = v.colDef[x] = v.colDef[x] || {};
      if (next[j] === baseF) delete d.fixed;
      else d.fixed = next[j];
      if (!Object.keys(d).length) delete v.colDef[x];
      n++;
    });
    return n;
  }
  function vcFixedNormalize(v) {
    const cols = vcFixedCols(v), cur2 = cols.map((k) => vcFixedGet(v, k)), n = cur2.length, next = cur2.slice();
    let L = 0;
    while (L < n && cur2[L] === "left") L++;
    let R = n;
    while (R > 0 && cur2[R - 1] === "right") R--;
    for (let j = L; j < n; j++) if (next[j] === "left") next[j] = "";
    for (let j = 0; j < R; j++) if (next[j] === "right") next[j] = "";
    if (L > R) {
      for (let j = R; j < L; j++) next[j] = "right";
    }
    return vcFixedWrite(v, cols, next);
  }
  function vcFixedApply(v, k, val) {
    const cols = vcFixedCols(v), i = cols.indexOf(k);
    if (i < 0) {
      api._toast("该列未显示，请先在左栏勾选");
      return 0;
    }
    const cur2 = cols.map((x) => vcFixedGet(v, x)), old = cur2[i] || "", next = cur2.slice(), n = cols.length;
    if (val === "left") {
      for (let j = 0; j < n; j++) next[j] = j <= i ? "left" : cur2[j] === "left" ? "" : cur2[j];
    } else if (val === "right") {
      for (let j = 0; j < n; j++) next[j] = j >= i ? "right" : cur2[j] === "right" ? "" : cur2[j];
    } else {
      if (old === "left") {
        for (let j = i; j < n; j++) if (cur2[j] === "left") next[j] = "";
      } else if (old === "right") {
        for (let j = 0; j <= i; j++) if (cur2[j] === "right") next[j] = "";
      }
    }
    const changed = vcFixedWrite(v, cols, next);
    if (val === "left" && changed > 1) api._toast(`已冻结前 ${i + 1} 列（冻结列须从首列连续）`);
    else if (val === "right" && changed > 1) api._toast(`已冻结末 ${n - i} 列（冻结列须到末列连续）`);
    else if (!val && changed > 1) api._toast(`已连带解除 ${changed} 列冻结（保持连续）`);
    else if (val) api._toast(val === "left" ? "已冻结该列到左侧" : "已冻结该列到右侧");
    else if (changed === 1) api._toast("已取消该列冻结");
    return changed;
  }
  function vcColsBarHTML(v) {
    const defs = S.list.columns || [], m = VC.colMap(), cw = v.colW || {}, cd = v.colDef || {};
    const chosen = (v.cols || []).filter((k) => m[k]);
    const total = chosen.reduce((a, k) => a + (+cw[k] || m[k].w || 100), 0);
    const ovN = Object.keys(cd).filter((k) => cd[k] && Object.keys(cd[k]).length).length;
    const rdN = vcDefOpts("renderer").length;
    const fxN = chosen.filter((k) => !!vcFixedGet(v, k)).length;
    const ckN = chosen.filter((k) => {
      const g = clickCfg(vcColEff(v, k));
      return g.enabled && !!g.scene;
    }).length;
    const stat = (val, label) => `<span class="vcb-stat"><b>${val}</b><span>${label}</span></span>`;
    return `<div class="vcb-stats">
      ${stat(chosen.length + "<i>/</i>" + defs.length, "列已显示")}
      ${stat(total + "<i>px</i>", "合计宽度")}
      ${stat(fxN, "列已冻结")}
      ${stat(ckN, "已绑定点击")}
      ${stat(ovN, "列属性覆盖")}
      ${stat(rdN, "可用渲染器")}
    </div>
    <div class="vcb-acts">
      <button class="vcb-btn" onclick="TPL._vcColsAll(1)" title="显示全部列选项（含默认隐藏列）">全选</button>
      <button class="vcb-btn" onclick="TPL._vcColsAll(0)" title="仅保留勾选列、链接列、主名称列与操作列">仅常用列</button>
      <button class="vcb-btn" onclick="TPL._vcColWReset()" title="清除本视图的列宽覆盖">默认宽度</button>
      <button class="vcb-btn" onclick="TPL._vcDefResetAll()" title="清除本视图全部列选项覆盖">恢复覆盖</button>
      <button class="vcb-btn pri" onclick="TPL._vcDefJSON()">查看生效 JSON</button>
    </div>`;
  }
  function vcColListHTML(v) {
    const defs = S.list.columns || [], m = VC.colMap();
    v.colW || {};
    const chosen = (v.cols || []).filter((k) => m[k]);
    const rest = defs.map((c) => c.k).filter((k) => chosen.indexOf(k) < 0);
    const kw = String(vColKw || "").trim().toLowerCase();
    const hit = (k) => {
      if (!kw) return true;
      const c = m[k];
      return (String(c.t || "") + k + String(c.db || "")).toLowerCase().indexOf(kw) >= 0;
    };
    const row = (k, pos) => {
      const base = m[k], c = vcColEff(v, k), on = pos >= 0;
      const label = c.t || (k === "chk" ? "勾选列" : k === "ops" ? "操作列" : k);
      const ov = vcColOverridden(v, k);
      const last = chosen.length - 1;
      return `<div class="vc-crow ${on ? "on" : "off"} ${k === vSelCol ? "sel" : ""}" data-k="${escA(k)}" onclick="TPL._vcColPick(${escJS(k)})">
      <input class="ck" type="checkbox" ${on ? "checked" : ""} title="${on ? "点击隐藏此列" : "点击显示此列"}"
        onclick="event.stopPropagation()" onchange="TPL._vcColToggle(${escJS(k)},this.checked)">
      <span class="ix">${on ? pos + 1 : "—"}</span>
      <span class="tx"><b>${esc(label)}</b><i>${esc(k)}</i></span>
      ${base.hidden ? '<span class="hid-tag">默认隐藏</span>' : ""}
      <span class="w" title="列宽">${c.w}</span>
      ${c.fixed ? `<span class="fx ${c.fixed === "left" ? "fx-l" : "fx-r"}" title="${c.fixed === "left" ? "冻结在左侧" : "冻结在右侧"}">${c.fixed === "left" ? "左" : "右"}</span>` : ""}
      ${ov ? '<i class="ov-dot" title="本视图已覆盖"></i>' : ""}
      ${on ? `<span class="mv"><button class="vc-mini" ${pos <= 0 ? "disabled" : ""} title="上移（左移一列）" onclick="event.stopPropagation();TPL._vcColMove(${escJS(k)},-1)">↑</button><button class="vc-mini" ${pos >= last ? "disabled" : ""} title="下移（右移一列）" onclick="event.stopPropagation();TPL._vcColMove(${escJS(k)},1)">↓</button></span>` : ""}
    </div>`;
    };
    const a = chosen.map((k, i) => row(k, i)).filter((_, i) => hit(chosen[i])).join("");
    const b = rest.map((k) => row(k, -1)).filter((_, i) => hit(rest[i])).join("");
    const none = '<div class="vc-crow-empty">没有匹配的列</div>';
    return `<div class="vc-crow-grp">已显示 <b>${chosen.length}</b> 列 · 点击行编辑属性</div>${a || (kw ? none : "")}
    <div class="vc-crow-grp mt">未显示 <b>${rest.length}</b> 列</div>${b || (kw ? none : "")}`;
  }
  function vcClickSceneOptions() {
    const draft = typeof vDraft !== "undefined" && vDraft && vDraft.pageActions || [];
    const out = [];
    draft.forEach((a) => out.push({
      v: a.scene,
      l: a.label + "（" + a.scene + "）· " + PAGE.method(a.method).label + (a.enabled === false ? " · 已停用" : "")
    }));
    ((S.pageSpec || {}).scenes || []).forEach((sc) => {
      if (!out.some((o) => o.v === sc.key)) out.push({ v: sc.key, l: sc.label + "（" + sc.key + "）· 未配置" });
    });
    return [{ v: "", l: "— 不绑定（本列不响应点击）" }].concat(out);
  }
  function vcClickFieldOptions() {
    const m = VC.colMap();
    return [{ v: "", l: "（本列字段）" }].concat(Object.keys(m).map((k) => ({ v: k, l: (m[k].t || k) + " · " + k })));
  }
  function vcClickSelect(key, cur2, k, opts) {
    return `<select class="vcd-in" onchange="TPL._vcDef(${escJS(k)},${escJS(key)},this.value)">${opts.map((o) => `<option value="${escA(o.v)}" ${String(cur2 || "") === String(o.v) ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>`;
  }
  function vcClickStatusHTML(v, k, c) {
    const g = clickCfg(c), list = typeof vDraft !== "undefined" && vDraft && vDraft.pageActions || [];
    if (!g.scene) return `<div class="vcd-click-st no"><b>未绑定</b><span>本列渲染为纯文本，不响应点击；显示与操作由同一份配置决定。</span></div>`;
    const rs = PAGE.resolve(g.scene, list), a = rs.action, fb = PAGE.fb();
    const st2 = {
      ok: { cls: "ok", t: "已绑定" },
      missing: { cls: "warn", t: "场景缺失" },
      disabled: { cls: "warn", t: "场景已停用" },
      methodMissing: { cls: "warn", t: "方法未注册" }
    }[rs.status];
    const policy = rs.status === "ok" ? "" : fb[rs.status] || "drawer";
    const meth = a ? PAGE.method(a.method).label : "—";
    const by = rs.byLabel ? "按名称兜底解析" : "按场景 key 解析";
    let tpl = "—", demo = "—";
    if (a) {
      tpl = a.params || "（空）";
      const rows = typeof filtered === "function" ? filtered() : [];
      const row = rows[0] || {};
      const ctx = {
        idx: row.__idx,
        col: k,
        field: g.field,
        param: g.param,
        title: g.title,
        value: row[g.field],
        row,
        scene: g.scene
      };
      demo = PAGE.interpolate(a.params || "", ctx);
    }
    return `<div class="vcd-click-st ${st2.cls}">
      <div class="vcd-cs-top"><b>${st2.t}</b><span>${esc(rs.label || g.scene)}</span>
        <em>${esc(g.scene)} · ${by}</em></div>
      <div class="vcd-cs-meta"><span>交互方法 <b>${esc(meth)}</b></span>
        ${policy ? `<span>回退策略 <b>${policy === "none" ? "不执行" : "打开抽屉"}</b></span>` : "<span>启用中</span>"}</div>
      <div class="vcd-cs-param"><i>参数模板</i><code>${esc(tpl)}</code></div>
      <div class="vcd-cs-param"><i>点击时（示例行）</i><code>${esc(demo)}</code></div>
      ${rs.status !== "ok" ? `<div class="vcd-cs-fix">到「页面配置」检查该场景，或在此重新选择其它场景。</div>` : ""}
    </div>`;
  }
  function vcBtnSpec() {
    return S.buttonSpec || { fields: [], display: {}, defaults: [] };
  }
  function vcBtnField(key) {
    return (vcBtnSpec().fields || []).find((f) => f.key === key) || {};
  }
  function vcBtnOpts(key) {
    const f = vcBtnField(key), vs = f.values || [];
    if (key === "scene") return vcClickSceneOptions();
    if (key === "field") return vcClickFieldOptions();
    return vs.map((v) => ({ v, l: f.labels && f.labels[v] !== void 0 ? f.labels[v] : String(v) }));
  }
  function vcBtnList(c) {
    return (c && c.render && c.render.buttons || []).slice();
  }
  function vcBtnSelect(prop, cur2, k, idx, opts) {
    return `<select class="vcd-in" onchange="TPL._vcBtn(${escJS(k)},${idx},${escJS(prop)},this.value)">${opts.map((o) => `<option value="${escA(o.v)}" ${String(cur2 || "") === String(o.v) ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>`;
  }
  function vcBtnCardHTML(v, k, c) {
    vcBtnSpec();
    const bs = vcBtnList(c);
    const draft = typeof vDraft !== "undefined" && vDraft && vDraft.pageActions || [];
    const rows = typeof filtered === "function" ? filtered() : [];
    const row = rows[0] || {};
    const cards = bs.map(function(b, idx) {
      const g = clickCfg(c, b), rs = buttonResolve(c, b, draft), a = rs.action;
      const stCls = { ok: "ok", missing: "warn", disabled: "warn", methodMissing: "warn", unbound: "no" }[rs.status];
      const stTxt = {
        ok: "已绑定",
        missing: "场景缺失",
        disabled: "场景已停用",
        methodMissing: "方法未注册",
        unbound: "未绑定"
      }[rs.status];
      const dispTxt = rs.status === "ok" ? "正常显示" : { show: "仍显示（按回退策略执行）", disable: "置灰不可点", hide: "隐藏按钮" }[rs.display] || rs.display;
      let tpl = "—", demo = "—";
      if (a) {
        tpl = a.params || "（空）";
        const ctx = {
          idx: row.__idx,
          col: k,
          field: g.field,
          param: g.param,
          title: g.title,
          value: row[g.field],
          row,
          scene: g.scene
        };
        demo = PAGE.interpolate(a.params || "", ctx);
      }
      const status = `<div class="vcd-click-st ${stCls} vcb-st">
        <div class="vcd-cs-top"><b>${stTxt}</b><span>${esc(rs.sceneLabel || g.scene || "—")}</span>
          <em>${esc(g.scene || "无场景")} · ${rs.byLabel ? "按名称兜底" : "按 key 解析"}</em></div>
        <div class="vcd-cs-meta"><span>交互方法 <b>${esc(a ? PAGE.method(a.method).label : "—")}</b></span>
          <span>显示策略 <b>${esc(dispTxt)}</b></span></div>
        <div class="vcd-cs-param"><i>参数模板</i><code>${esc(tpl)}</code></div>
        <div class="vcd-cs-param"><i>点击时（示例行）</i><code>${esc(demo)}</code></div>
        ${rs.status !== "ok" && rs.status !== "unbound" ? `<div class="vcd-cs-fix">到「页面配置」检查该场景，或在下方改绑其它场景 / 调整显示策略。</div>` : ""}
      </div>`;
      const F = (label, key, ctrl, hint) => vcColFieldRow(label, key, ctrl, hint);
      const fields = F("按钮文案", "label", `<input class="vcd-in" value="${escA(b.label || "")}" onchange="TPL._vcBtn(${escJS(k)},${idx},'label',this.value)">`, "由配置驱动按钮显示文字") + F("交互场景", "scene", vcBtnSelect("scene", g.scene, k, idx, vcBtnOpts("scene")), "对应「页面配置」里的场景 key") + F("取值字段", "field", vcBtnSelect("field", g.field, k, idx, vcBtnOpts("field")), "点击时携带该字段在当前行的真实值") + F("参数键名", "param", `<input class="vcd-in" value="${escA(g.param)}" onchange="TPL._vcBtn(${escJS(k)},${idx},'param',this.value)">`, "模板里用 {param} 引用") + F("悬停提示", "title", `<input class="vcd-in" value="${escA(g.title || "")}" onchange="TPL._vcBtn(${escJS(k)},${idx},'title',this.value)">`, "按钮 title，异常时自动附加原因") + F("启用", "enabled", vcColSwitch("渲染并可点击", g.enabled, `TPL._vcBtn('${k}',${idx},'enabled',this.checked)`), "关闭后按钮不渲染") + F(
        "场景异常时显示",
        "onMissing",
        vcBtnSelect("onMissing", g.onMissing, k, idx, vcBtnOpts("onMissing")),
        "按钮级策略优先于 buttonSpec.display 全局表"
      );
      return `<div class="vcb-card">
      <div class="vcb-card-hd"><span class="vcb-no">${String(idx + 1).padStart(2, "0")}</span>
        <b>${esc(b.label || "未命名按钮")}</b><code>${esc(g.scene || "—")}</code>
        <span class="vcb-badge ${stCls}">${stTxt}</span>
        <span class="vcb-ops">
          <button class="vc-mini" ${idx === 0 ? "disabled" : ""} title="上移" onclick="TPL._vcBtnMove(${escJS(k)},${idx},-1)">↑</button>
          <button class="vc-mini" ${idx === bs.length - 1 ? "disabled" : ""} title="下移" onclick="TPL._vcBtnMove(${escJS(k)},${idx},1)">↓</button>
          <button class="vc-mini act-del" title="删除该按钮" onclick="TPL._vcBtnDel(${escJS(k)},${idx})">×</button>
        </span></div>
      ${status}${fields}
      <div class="vcb-card-ft"><button class="vcb-btn pri" onclick="TPL._vcClickGoPage(${escJS(g.scene)})">去「页面配置」编辑该场景 →</button>
        <span>按钮决定「点哪个按钮、带哪个值」，场景决定「执行什么方法」</span></div>
    </div>`;
    }).join("");
    return `<div class="vcb-sec">
      <div class="vcb-sec-hd"><div><b>操作按钮清单</b><span>共 ${bs.length} 个 · 逐项绑定「页面配置」场景</span></div>
        <button class="vcb-btn" onclick="TPL._vcBtnAdd(${escJS(k)})">＋ 添加操作按钮</button></div>
      <p class="vcb-sec-tip">字段规格读 <code>SCHEMA.buttonSpec</code>；显示策略按 <code>PAGE.resolve()</code> 状态查 <code>buttonSpec.display</code> / 按钮级 <code>onMissing</code>。删场景、停场景、改方法都会实时反映到这里的解析状态。</p>
      ${cards || '<div class="vcb-empty">暂无操作按钮，点「＋ 添加操作按钮」新增。</div>'}
    </div>`;
  }
  function vcClickCardHTML(v, k, c) {
    const isAct = c.renderer === "actions";
    if (isAct) {
      return `<div class="vcd-click">
      <div class="vcd-click-st ok"><b>操作按钮列</b><span>本列不绑定单一场景；每个按钮各自绑定一个「页面配置」场景，显示与执行由下方清单逐项驱动。</span></div>
      ${vcBtnCardHTML(v, k, c)}
    </div>`;
    }
    const g = clickCfg(c);
    const rows = vcColFieldRow(
      "点击场景",
      "clickScene",
      vcClickSelect("clickScene", g.scene, k, vcClickSceneOptions()),
      "对应「页面配置」里的交互场景 key；改名 / 删除 / 停用会在这里实时显示解析状态"
    ) + vcColFieldRow(
      "取值字段",
      "clickField",
      vcClickSelect("clickField", g.field, k, vcClickFieldOptions()),
      "点击时携带该字段在当前行的真实值；默认取本列（药品编码列即携带药品编码）"
    ) + vcColFieldRow(
      "参数键名",
      "clickParam",
      `<input class="vcd-in" value="${escA(g.param)}" onchange="TPL._vcDef(${escJS(k)},'clickParam',this.value)">`,
      "注入场景参数时使用的键名，模板里可用 {param} 引用"
    ) + vcColFieldRow(
      "启用点击",
      "clickEnabled",
      vcColSwitch("本列响应点击", g.enabled, `TPL._vcDef('${k}','clickEnabled',this.checked)`),
      "关闭后单元格渲染为纯文本、不显示链接样式"
    ) + vcColFieldRow(
      "点击提示",
      "clickTitle",
      `<input class="vcd-in" value="${escA(g.title)}" onchange="TPL._vcDef(${escJS(k)},'clickTitle',this.value)">`,
      "悬停提示文案，由列配置驱动显示"
    );
    return `<div class="vcd-click">${vcClickStatusHTML(v, k, c)}${rows}
    <div class="vcd-click-link"><button class="vcb-btn pri" onclick="TPL._vcClickGoPage(${escJS(g.scene)})">去「页面配置」编辑交互场景 →</button>
      <span>列选项决定「点哪一列、带什么值」，页面配置决定「执行什么方法」；两者按场景 key 关联。</span></div>
  </div>`;
  }
  function vcColFieldRow(label, key, ctrl, hint) {
    return `<div class="vcd-f"><label title="${escA(vcDefSpec(key).desc || "")}">${label}<small>${esc(key)}</small></label>
    <div class="vcd-c">${ctrl}${hint ? `<p class="vcd-hint">${hint}</p>` : ""}</div></div>`;
  }
  function vcColSelect(key, cur2, k) {
    const opts = vcDefOpts(key);
    return `<select class="vcd-in" onchange="TPL._vcDef(${escJS(k)},${escJS(key)},this.value)">${opts.map((o) => `<option value="${escA(o.v)}" ${String(cur2) === String(o.v) ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>`;
  }
  function vcColSwitch(label, checked, fn) {
    return `<label class="vcd-sw"><input type="checkbox" ${checked ? "checked" : ""} onchange="${fn}"><i></i><span>${label}</span></label>`;
  }
  function vcFixedCtrl(v, k, c) {
    const fx = c.fixed || "", dir = fx || vFixedDir[k] || "left";
    const cols = vcFixedCols(v), pos = cols.indexOf(k), n = cols.length;
    const opts = vcDefOpts("fixed").filter((o) => o.v).map((o) => ({
      v: o.v,
      l: o.l + (o.v === "left" ? `（前 ${pos + 1} 列）` : `（末 ${n - pos} 列）`)
    }));
    const tag = fx ? fx === "left" ? `冻结至第 ${pos + 1} 列` : `右侧末 ${n - pos} 列` : "";
    return `<div class="vcd-fx">
      ${vcColSwitch("横向滚动时固定", !!fx, `TPL._vcFixed('${k}',this.checked)`)}
      <select class="vcd-in vcd-fx-dir" ${fx ? "" : "disabled"} title="冻结方向（括号内为联动范围）"
        onchange="TPL._vcFixedDir(${escJS(k)},this.value)">${opts.map((o) => `<option value="${escA(o.v)}" ${o.v === dir ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>
      ${fx ? `<span class="vcd-fx-tag ${fx === "left" ? "l" : "r"}">${tag}</span>` : ""}
    </div>`;
  }
  function vcColDetailHTML(v, k) {
    const m = VC.colMap();
    if (!k || !m[k]) return '<div class="vcd-empty">从左侧选择一列以编辑属性</div>';
    const base = m[k], c = vcColEff(v, k), chosen = (v.cols || []).filter((x) => m[x]);
    const pos = chosen.indexOf(k), ov = vcColOverridden(v, k);
    const specW = (S.list.columnSpec || {}).width || { min: 36, max: 600 };
    const label = c.t || (k === "chk" ? "勾选列" : k === "ops" ? "操作列" : k);
    const rd = vcDefSpec("renderer"), dt = vcDefSpec("dataType");
    const renderTxt = c.render && Object.keys(c.render).length ? JSON.stringify(c.render, null, 2) : "—（使用渲染器默认行为）";
    const grp = (n, title, note, body, id) => `<div class="vcd-grp" id="${id}"><div class="vcd-gt"><span>${n}</span>${title}<em>${note}</em></div>${body}</div>`;
    const basics = vcColFieldRow("字段名", "k", `<code class="vcd-ro">${esc(k)}</code>`, "行数据取值键，稳定标识，不可在界面修改") + vcColFieldRow("标题", "t", `<input class="vcd-in" value="${escA(c.t)}" onchange="TPL._vcDef(${escJS(k)},'t',this.value)">`) + vcColFieldRow("数据库映射", "db", `<code class="vcd-ro db">${esc(base.db || "—")}</code>`);
    const shows = vcColFieldRow("显示此列", "cols", vcColSwitch(pos >= 0 ? "在本视图中显示" : "已隐藏", pos >= 0, `TPL._vcColToggle('${k}',this.checked)`)) + vcColFieldRow("宽度", "w", `<div class="vcd-w"><input class="vcd-in" type="number" min="${specW.min}" max="${specW.max}" step="2" value="${c.w}" onchange="TPL._vcColW(${escJS(k)},this.value)"><span>px</span></div>`) + vcColFieldRow("对齐", "align", vcColSelect("align", c.align, k)) + vcColFieldRow("可排序", "sortable", vcColSwitch("点击表头排序", c.sortable, `TPL._vcDef('${k}','sortable',this.checked)`)) + vcColFieldRow(
      "列冻结",
      "fixed",
      vcFixedCtrl(v, k, c),
      "左侧冻结须从首列起连续、右侧冻结须到末列止连续；开启或关闭会联动相邻列，冻结列在横向滚动时不动"
    ) + vcColFieldRow("显示顺序", "order", `<code class="vcd-ro">${pos >= 0 ? `第 ${pos + 1} / ${chosen.length} 列` : "未显示"}</code>`, "在左侧清单用 ↑↓ 调整从左到右的顺序");
    const data = vcColFieldRow("数据类型", "dataType", vcColSelect("dataType", c.dataType, k), dt.desc || "决定值的格式化") + vcColFieldRow("渲染器", "renderer", vcColSelect("renderer", c.renderer, k), rd.desc || "决定单元格 HTML 形态") + vcColFieldRow("渲染器参数", "render", `<pre class="vcd-pre">${esc(renderTxt)}</pre>`, "全局参数在 SCHEMA.list.columns[].render 定义");
    return `<div class="vcd-hd">
      <div class="vcd-hd-t"><h4>${esc(label)}</h4><code>${esc(k)}</code></div>
      <span class="vcd-badge ${ov ? "ov" : "base"}">${ov ? "本视图已覆盖" : "SCHEMA 默认"}</span>
    </div>
    <div class="vcd-nav"><button onclick="TPL._vcColGo('vcdG1')">01 基础</button>
      <button onclick="TPL._vcColGo('vcdG2')">02 显示</button>
      <button onclick="TPL._vcColGo('vcdG3')">03 渲染</button>
      <button class="hit" onclick="TPL._vcColGo('vcdG4')">04 点击</button>
      <span>滚动查看全部属性</span></div>
    ${grp("01", "基础信息", "全局元数据", basics, "vcdG1")}
    ${grp("02", "显示与排序", "按视图配置", shows, "vcdG2")}
    ${grp("03", "数据与渲染", "注册表分派", data, "vcdG3")}
    ${grp("04", "点击操作", "配置驱动页面操作", vcClickCardHTML(v, k, c), "vcdG4")}
    <div class="vcd-ft"><button class="vcb-btn" onclick="TPL._vcDefReset(${escJS(k)})">↺ 恢复该列为默认</button>
      <span>改 SCHEMA.list.columns 即改列，渲染引擎零业务判断</span></div>`;
  }
  function vcColsHTML(v) {
    if (!vSelCol || !VC.colMap()[vSelCol]) vSelCol = vcColDefaultPick(v);
    return `<div class="vc-cols-tip">「列选项」整合显示、列定义与点击操作：右侧 04 卡片把「点哪一列、带哪个值」绑定到「页面配置」的交互场景，点击时按场景配置的执行方法打开链接 / 页面。枚举读 <code>SCHEMA.list.columnSpec</code>，场景候选项读 <code>cfg.pageActions</code>，保存后立即重绘。</div>
    <div class="vcb-bar" id="vcColsBar">${vcColsBarHTML(v)}</div>
    <div class="vc-cols-main">
      <div class="vc-cols-side">
        <div class="vcs-hd"><span>列清单</span><em>共 ${(S.list.columns || []).length} 列</em></div>
        <div class="vcs-search"><input id="vcColKw" value="${escA(vColKw)}" placeholder="搜索列名 / 字段名…" oninput="TPL._vcColSearch(this.value)"></div>
        <div class="vc-col-list" id="vcColList">${vcColListHTML(v)}</div>
      </div>
      <div class="vc-col-detail" id="vcColDetail">${vcColDetailHTML(v, vSelCol)}</div>
    </div>`;
  }
  function vcColsRender() {
    const v = vcCur();
    const sc = $("vcColList") ? $("vcColList").scrollTop : 0;
    const ds = $("vcColDetail") ? $("vcColDetail").scrollTop : 0;
    if (!vSelCol || !VC.colMap()[vSelCol]) vSelCol = vcColDefaultPick(v);
    if ($("vcColsBar")) $("vcColsBar").innerHTML = vcColsBarHTML(v);
    if ($("vcColList")) $("vcColList").innerHTML = vcColListHTML(v);
    if ($("vcColDetail")) $("vcColDetail").innerHTML = vcColDetailHTML(v, vSelCol);
    if ($("vcColList")) $("vcColList").scrollTop = sc;
    if ($("vcColDetail")) $("vcColDetail").scrollTop = ds;
    const n = document.querySelector("#vcList .vc-item.on .n");
    if (n) n.textContent = (v.cols || []).length + "列 · " + VC.count(v) + "条";
  }
  const VC_OPS = [["eq", "等于"], ["ne", "不等于"], ["contains", "包含"], ["gt", "大于"], ["lt", "小于"], ["ltField", "低于字段"], ["in", "属于（逗号分隔）"]];
  function vcRuleHTML(rule, i, wf) {
    const op = rule.op || "eq";
    const valCtl = op === "ltField" ? `<select class="vr-v" onchange="TPL._vcRule('value',${i},this.value)">${wf.map((f) => `<option value="${escA(f.k)}" ${String(rule.value) === f.k ? "selected" : ""}>${esc(f.l)}</option>`).join("")}</select>` : `<input class="vr-v" value="${escA(Array.isArray(rule.value) ? rule.value.join(",") : rule.value == null ? "" : rule.value)}" placeholder="${op === "in" ? "值1, 值2" : "值"}" oninput="TPL._vcRule('value',${i},this.value)">`;
    const join = i > 0 ? `<select class="vr-j" title="与上一项的关系" onchange="TPL._vcRuleJoin(${i},this.value)"><option value="and" ${rule.join !== "or" ? "selected" : ""}>且 AND</option><option value="or" ${rule.join === "or" ? "selected" : ""}>或 OR</option></select>` : `<span class="vr-j vr-first">首项</span>`;
    return `<div class="vc-rule"><span class="vr-i">${i + 1}</span>${join}
      <select class="vr-f" onchange="TPL._vcRule('field',${i},this.value)"><option value="">全部数据（不设条件）</option>
        ${wf.map((f) => `<option value="${escA(f.k)}" ${rule.field === f.k ? "selected" : ""}>${esc(f.l)}</option>`).join("")}</select>
      <select class="vr-o" onchange="TPL._vcRule('op',${i},this.value)">${VC_OPS.map((o) => `<option value="${o[0]}" ${op === o[0] ? "selected" : ""}>${o[1]}</option>`).join("")}</select>
      ${valCtl}<button class="vc-mini" title="删除该条件" onclick="TPL._vcRuleDel(${i})">×</button></div>`;
  }
  function vcTbHTML(t, i, v) {
    const fo = VC.tbFieldOptions(), preset = (v.toolbar || {})[t.field] || "";
    const dataOpts = VC.tbOptions(t.field);
    const opts = ["全部"].concat(dataOpts).filter((x, j, a) => a.indexOf(x) === j);
    return `<div class="vc-tb"><span class="vt-i">${i + 1}</span>
      <select class="vt-f" title="绑定字段" onchange="TPL._vcTbField(${i},this.value)">${fo.map((f) => `<option value="${escA(f.k)}" ${f.k === t.field ? "selected" : ""}>${esc(f.l)}</option>`).join("")}</select>
      <input class="vt-l" value="${escA(t.label || "")}" placeholder="显示名称" oninput="TPL._vcTbLabel(${i},this.value)">
      <select class="vt-p" title="切换视图时自动带入的预设值" onchange="TPL._vcTbPreset(${i},this.value)"><option value="">不预设</option>${opts.map((o) => `<option ${String(preset) === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
      <button class="vc-mini" title="删除该下拉" onclick="TPL._vcTbDel(${i})">×</button></div>`;
  }
  function vcOverviewHTML(v) {
    const fs = S.list.filters || [], keys = v.filterKeys || [];
    const rules = (v.where && Array.isArray(v.where.rules) ? v.where.rules : []).filter((r) => r && r.field);
    const tbs = (Array.isArray(v.toolbarDefs) ? v.toolbarDefs : S.list.toolbarSelects || []).filter((t) => t && t.field);
    const hit = VC.count(v);
    return `<div class="vc-tip">各配置项已拆成独立页签：<b>快捷筛选</b>、<b>高级筛选</b>、<b>列选项</b>与<b>数据范围</b>。本页只做总览与跳转，点「去配置 →」直接到对应页签；所有改动在草稿里，点「保存并应用」才生效。用户临时改的筛选不写回配置，筛选角标 = 该视图当前被隐藏的字段数。</div>
    <div class="vc-ov">
      <div class="vc-ov-card"><span class="t">数据范围</span><b id="vcOvRule">${rules.length} 个条件</b>
        <em>多条条件，项与项之间可选「且 / 或」，且优先于或（与 SQL 一致）；留空 = 全部数据</em>
        <span class="foot"><button class="vc-btn" onclick="TPL._vcTab('where')">去配置 →</button></span></div>
      <div class="vc-ov-card"><span class="t">快捷筛选</span><b id="vcOvTb">${tbs.length} 项</b>
        <em>可增删下拉条目、改绑定字段 / 显示名 / 预设值；候选项数据由业务字典提供，不在此配置</em>
        <span class="foot"><button class="vc-btn" onclick="TPL._vcTab('toolbar')">去配置 →</button></span></div>
      <div class="vc-ov-card"><span class="t">高级筛选</span><b id="vcOvAdv">${keys.length} / ${fs.length}</b>
        <em>逐行列表：勾选启用哪些字段，右侧是切换视图时自动带入的预设值</em>
        <span class="foot"><button class="vc-btn" onclick="TPL._vcTab('adv')">去配置 →</button></span></div>
      <div class="vc-ov-card"><span class="t">当前命中</span><b id="vcOvHit">${hit} 条</b>
        <em>按「${esc(v.label)}」当前的数据范围实时计算；改任一页签后数字随之变化</em>
        <span class="foot"><button class="vc-btn" onclick="TPL._vcTab('cols')">去「列选项」 →</button></span></div>
    </div>`;
  }
  function vcWhereHTML(v) {
    const wf = VC.whereFields();
    const rules = (v.where && Array.isArray(v.where.rules) ? v.where.rules : []).filter((r) => r && r.field);
    const rulesHTML = rules.map((r, i) => vcRuleHTML(r, i, wf)).join("") || '<div class="vc-rule-empty">未设置条件 = 全部数据，点下方「＋ 添加范围条件」开始</div>';
    return `<div class="vc-tip">数据范围决定「${esc(v.label)}」视图能看到哪些数据。可添加多条条件，第 2 项起选「且 AND / 或 OR」；求值按「且」优先于「或」（与 SQL 一致）。条件值留空不参与过滤，新增一行不会把结果清空。</div>
     <div class="vc-sect">数据范围 <span class="vc-sect-n" id="vcRuleN">${rules.length} 个条件 · 命中 <b id="vcRuleHit">${VC.count(v)}</b> 条</span></div>
     <div class="vc-rules">${rulesHTML}</div>
     <div class="vc-rule-acts"><button class="vc-btn" onclick="TPL._vcRuleAdd()">＋ 添加范围条件</button><span>「且」优先于「或」（与 SQL 一致）；条件留空不参与过滤</span></div>`;
  }
  function vcToolbarHTML(v) {
    const tbs = (Array.isArray(v.toolbarDefs) ? v.toolbarDefs : S.list.toolbarSelects || []).filter((t) => t && t.field);
    const tbHTML = tbs.map((t, i) => vcTbHTML(t, i, v)).join("") || '<div class="vc-rule-empty">该视图暂无工具栏下拉，可点下方添加</div>';
    return `<div class="vc-tip">快捷筛选只配置「有哪些 / 叫什么 / 切换视图带入什么值」：可增删条目、改绑定字段、改显示名、设预设值。<b>候选项数据内容由业务字典提供，不在此显示、也不写进配置</b>（接真实字典表时只改 VC.tbOptions(field) 一处）。</div>
     <div class="vc-sect">快捷筛选 <span class="vc-sect-n" id="vcTbN">${tbs.length} 项 · 可增删</span></div>
     <div class="vc-tbs">${tbHTML}</div>
     <button class="vc-btn" onclick="TPL._vcTbAdd()">＋ 添加下拉</button>`;
  }
  function vcAdvHTML(v) {
    const fs = S.list.filters || [], keys = v.filterKeys || [];
    const frows = fs.map((f) => {
      const on = keys.indexOf(f.k) >= 0, val = (v.filters || {})[f.k] || "";
      const uniq = ["全部"].concat(f.opt || []).filter((x, i, a) => a.indexOf(x) === i);
      const ctl = f.type === "sel" ? `<select onchange="TPL._vcFilterVal(${escJS(f.k)},this.value)" ${on ? "" : "disabled"}><option value="">不预设</option>${uniq.map((o) => `<option ${String(val) === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>` : `<input value="${escA(val)}" placeholder="不预设" ${on ? "" : "disabled"} oninput="TPL._vcFilterVal(${escJS(f.k)},this.value)">`;
      return `<div class="vc-frow ${on ? "" : "off"}"><input class="ck" type="checkbox" ${on ? "checked" : ""} onchange="TPL._vcFilterKey(${escJS(f.k)},this.checked)"><span class="fn" title="${escA(f.l)}">${esc(f.l)}</span>${ctl}</div>`;
    }).join("");
    return `<div class="vc-tip">高级筛选改成了单列列表：左侧勾选决定「${esc(v.label)}」视图启用哪些字段，右侧是切换视图时自动带入的预设值；未启用的行会变灰并禁用控件。用户临时改的筛选不写回配置，切回来仍是预设值。筛选角标 = 该视图当前被隐藏的字段数。</div>
     <div class="vc-sect">高级筛选 <span class="vc-sect-n" id="vcAdvN">已启用 ${keys.length} / ${fs.length}</span></div>
     <div class="vc-flist"><div class="vc-frow vc-fhead"><span></span><span>字段</span><span>切换视图时自动带入的预设值</span></div>${frows}</div>`;
  }
  function vcFeatGroups() {
    return FEAT.groups();
  }
  function vcFeatGroup() {
    return vcFeatGroups().find((g) => g.key === vFeatGroup) || vcFeatGroups()[0] || { key: "", label: "", items: [] };
  }
  function vcFeatVal(g, k) {
    return (vDraft.features[g] || {})[k];
  }
  function vcFeatSet(g, k, val) {
    vDraft.features[g] = vDraft.features[g] || {};
    vDraft.features[g][k] = val;
    vcFeatSoftRender();
  }
  function vcFeatColumnOptions() {
    return [{ v: "", l: "不排序（默认）" }].concat(
      (S.list.columns || []).filter((c) => c.k !== "chk" && c.k !== "ops" && !c.hidden).map((c) => ({ v: c.k, l: c.t || c.k }))
    );
  }
  function vcFeatFieldOptions() {
    return [{ v: "", l: "不指定（取第一个快捷筛选字段）" }].concat(
      VC.tbFieldOptions().map((f) => ({ v: f.k, l: f.l || f.k }))
    );
  }
  function vcFeatOpts(it) {
    const vs = it.values || [];
    return vs.map((v) => ({ v, l: it.labels && it.labels[v] !== void 0 ? it.labels[v] : String(v) }));
  }
  function vcFeatSel(opts, cur2, fn, cls) {
    return `<select class="vf-in ${cls || ""}" onchange="${fn}">${opts.map((o) => `<option value="${escA(o.v)}" ${String(cur2) === String(o.v) ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>`;
  }
  function vcFeatSwitch(checked, fn, label) {
    return `<label class="vf-sw"><input type="checkbox" ${checked ? "checked" : ""} onchange="${fn}"><i></i><span>${esc(checked ? "已开启" : "已关闭")}</span></label>`;
  }
  function vcFeatRoutesHTML(it) {
    const rows = vcFeatVal("page", it.key) || [];
    const modes = vcFeatOpts({ values: it.modeValues || [], labels: it.modeLabels || {} });
    const scenes = (it.sceneValues || []).concat(["custom"]).filter((x, j, a) => a.indexOf(x) === j);
    const body = rows.map((r, i) => `<tr>
      <td><span class="vf-scene">${esc(r.scene)}</span></td>
      <td><input class="vf-in" value="${escA(r.label || "")}" onchange="TPL._vcFeatRoute(${i},'label',this.value)" placeholder="场景名称"></td>
      <td><input class="vf-in" value="${escA(r.page || "")}" onchange="TPL._vcFeatRoute(${i},'page',this.value)" placeholder="如 drug.detail"></td>
      <td>${vcFeatSel(modes, r.mode || "drawer", `TPL._vcFeatRoute(${i},'mode',this.value)`, "vf-sel")}</td>
      <td><input class="vf-in" value="${escA(r.params || "")}" onchange="TPL._vcFeatRoute(${i},'params',this.value)" placeholder="如 {param}={value}"></td>
      <td><button class="vc-mini" title="删除该跳转" onclick="TPL._vcFeatRouteDel(${i})">×</button></td>
    </tr>`).join("");
    const used = rows.map((r) => r.scene), next = scenes.find((x) => used.indexOf(x) < 0) || "scene_" + (rows.length + 1);
    return `<div class="fs-routes"><table class="vf-routes"><thead><tr>
      <th>场景 scene</th><th>说明</th><th>目标页面 page</th><th>打开方式</th><th>参数</th><th></th>
    </tr></thead><tbody>${body}</tbody></table></div>
    <div class="fs-routes-ft"><button class="vcb-btn" onclick="TPL._vcFeatRouteAdd(${escJS(next)})">＋ 添加跳转</button>
      <span>渲染引擎按 scene 查表：link 编码链接 · view 详情 · edit 编辑 · new 新建；drawer 走抽屉，其余记录路由并反馈</span></div>`;
  }
  function vcFeatCtrl(g, it) {
    const val = vcFeatVal(g.key, it.key), k = it.key;
    switch (it.type) {
      case "switch":
        return vcFeatSwitch(!!val, `TPL._vcFeatSwitch('${g.key}','${k}',this.checked)`);
      case "select":
        return vcFeatSel(vcFeatOpts(it), val, `TPL._vcFeatVal('${g.key}','${k}',this.value)`, "vf-sel");
      case "sort": {
        const s = val && typeof val === "object" ? val : { field: "", order: "asc" };
        return `<div class="vf-combo">
        ${vcFeatSel(vcFeatColumnOptions(), s.field || "", `TPL._vcFeatSort('field',this.value)`, "vf-sel")}
        ${vcFeatSel(vcFeatOpts({ values: it.orderValues || [], labels: it.orderLabels || {} }), s.order || "asc", `TPL._vcFeatSort('order',this.value)`, "vf-sel vf-sel-sm")}
      </div>`;
      }
      case "field":
        return vcFeatSel(vcFeatFieldOptions(), val || "", `TPL._vcFeatVal('${g.key}','${k}',this.value)`, "vf-sel");
      case "routes":
        return vcFeatRoutesHTML(it);
      default:
        return `<span class="vf-ro">${esc(String(val == null ? "" : val))}</span>`;
    }
  }
  let vFeatKw = "";
  const FS_TYPES = { switch: "开关", select: "下拉", sort: "排序", field: "字段", routes: "路由表" };
  function vcIsActGroup(g) {
    return g && (g.key === "general" || g.key === "menu");
  }
  function vcIsPageGroup(g) {
    return g && g.key === "page";
  }
  function vcPageAll() {
    return (vDraft.pageActions || []).slice();
  }
  function vcPageIcon(a) {
    const map = { link: "link", view: "eye", edit: "setting", new: "plus" };
    return ACT.icon(map[a.scene] || "bolt") || ACT.icon("bolt") || "";
  }
  function vcPageBindings(scene) {
    const cols = [], buttons = [], seen = {}, sb = {}, m = VC.colMap();
    const views = typeof vDraft !== "undefined" && vDraft && vDraft.views || [];
    views.forEach(function(v) {
      (v.cols || []).filter((k) => m[k]).forEach(function(k) {
        const eff = vcColEff(v, k), g = clickCfg(eff);
        if (g.enabled && g.scene === scene && !seen[k]) {
          seen[k] = 1;
          cols.push((m[k] || {}).t || k);
        }
        if (eff.renderer === "actions") {
          vcBtnList(eff).forEach(function(b, idx) {
            const bg = clickCfg(eff, b);
            if (bg.enabled && bg.scene === scene) {
              const key = k + "#" + idx + "#" + String(b.label || "");
              if (!sb[key]) {
                sb[key] = 1;
                buttons.push(((m[k] || {}).t || k) + " · " + (b.label || "按钮" + (idx + 1)));
              }
            }
          });
        }
      });
    });
    return { cols, buttons };
  }
  function vcPageRowHTML(a, i, total) {
    const m = PAGE.method(a.method), svg = vcPageIcon(a);
    const bd = vcPageBindings(a.scene);
    const parts = [];
    if (bd.cols.length) parts.push(bd.cols.length + " 列");
    if (bd.buttons.length) parts.push(bd.buttons.length + " 按钮");
    const all = bd.cols.concat(bd.buttons);
    const boundTag = all.length ? `<span class="pi-bound" title="列选项中的引用：${escA(all.join("、"))}">被 ${parts.join(" · ")}引用 · ${esc(all.slice(0, 2).join("、"))}</span>` : "";
    const trig = a.trigger ? `<span class="pi-trigger" title="${escA(a.trigger)}">${esc(a.trigger)}</span>` : "";
    const builtin = a.builtin ? '<span class="act-builtin">内置</span>' : '<span class="act-custom">自定义</span>';
    const params = a.params ? `<span class="act-param" title="${escA(a.params)}">参数 ${esc(a.params.length > 36 ? a.params.slice(0, 36) + "…" : a.params)}</span>` : "";
    return `<div class="fs-row act-row pi-row ${a.enabled === false ? "off" : ""}" data-id="${escA(a.id)}">
    <div class="act-ico">${svg || '<span class="act-noico">—</span>'}</div>
    <div class="act-main">
      <div class="act-t"><span class="fs-no">${String(i + 1).padStart(2, "0")}</span>
        <b>${esc(a.label)}</b><code>${esc(a.scene)}</code>${trig}${builtin}
        <span class="act-meth pi-meth" title="${escA(m.desc)}">${esc(m.label)}</span>${boundTag}${params}</div>
      <p class="act-d">${esc(a.desc || m.desc || "（未填写说明）")}</p>
    </div>
    <div class="act-ops">
      <label class="vf-sw" title="启用 / 停用"><input type="checkbox" ${a.enabled !== false ? "checked" : ""} onchange="TPL._pageToggle(${escJS(a.id)},this.checked)"><i></i></label>
      <span class="fs-state ${a.enabled !== false ? "on" : "off"}">${a.enabled !== false ? "已启用" : "已停用"}</span>
      <button class="vc-mini" title="上移" ${i === 0 ? "disabled" : ""} onclick="TPL._pageMove(${escJS(a.id)},-1)">↑</button>
      <button class="vc-mini" title="下移" ${i === total - 1 ? "disabled" : ""} onclick="TPL._pageMove(${escJS(a.id)},1)">↓</button>
      <button class="vc-mini act-edit" title="编辑" onclick="TPL._pageEdit(${escJS(a.id)})">✎</button>
      <button class="vc-mini act-del" title="删除" onclick="TPL._pageDel(${escJS(a.id)})">×</button>
    </div>
  </div>`;
  }
  function vcActZone(g) {
    return g && g.key === "menu" ? "menu" : "toolbar";
  }
  function vcActAll(g) {
    const z = vcActZone(g);
    return (vDraft.actions || []).filter((a) => a.zone === z);
  }
  function vcActMethod(k) {
    return ACT.methodOptions().find((m) => m.key === k) || { label: k || "—", desc: "", params: "" };
  }
  function vcActGroupLabel(a) {
    if (a.zone !== "menu") return "工具栏按钮";
    return (ACT.menuGroups().find((g) => g.key === a.menuGroup) || {}).label || "更多菜单";
  }
  function vcActSummary() {
    const gs = vcFeatGroups(), f = vDraft.features || {};
    let items = 0, sw = 0, on = 0;
    gs.forEach((g) => (g.items || []).forEach((it) => {
      items++;
      if (it.type === "switch") {
        sw++;
        if ((f[g.key] || {})[it.key]) on++;
      }
    }));
    const acts = vDraft.actions || [], actOn = acts.filter((a) => a.enabled !== false).length;
    const pgs = vDraft.pageActions || [], pgOn = pgs.filter((a) => a.enabled !== false).length;
    return {
      groups: gs.length,
      items,
      sw,
      on,
      actions: acts.length,
      actionsOn: actOn,
      scenes: pgs.length,
      scenesOn: pgOn
    };
  }
  function vcFeatRowHTML(g, it, i) {
    const isRoute = it.type === "routes";
    const where = g.key === "menu" && it.groupLabel ? `<span class="vf-where w-${esc(it.group || "more")}">${esc(it.groupLabel)}</span>` : "";
    const ctrl = vcFeatCtrl(g, it);
    const val = vcFeatVal(g.key, it.key);
    const state = it.type === "switch" ? `<span class="fs-state ${val ? "on" : "off"}">${val ? "已开启" : "已关闭"}</span>` : "";
    return `<div class="fs-row ${isRoute ? "wide" : ""}" data-k="${escA(it.key)}">
    <div class="fs-row-l">
      <div class="fs-row-t"><span class="fs-no">${String(i + 1).padStart(2, "0")}</span>
        <b>${esc(it.label)}</b><code>${esc(it.key)}</code>${where}
        <span class="fs-type">${esc(FS_TYPES[it.type] || it.type)}</span></div>
      ${it.desc ? `<p class="fs-row-d">${esc(it.desc)}</p>` : ""}
    </div>
    ${isRoute ? `<div class="fs-row-r fs-row-r-wide">${ctrl}</div>` : `<div class="fs-row-r">${ctrl}${state}</div>`}
  </div>`;
  }
  function vcActRowHTML(g, a, i, total, idx) {
    const svg = a.iconSvg || ACT.icon(a.icon) || "";
    const m = vcActMethod(a.action);
    const where = a.zone === "menu" ? `<span class="vf-where w-${esc(a.menuGroup || "more")}">${esc(vcActGroupLabel(a))}</span>` : "";
    const params = a.params ? `<span class="act-param" title="${escA(a.params)}">参数 ${esc(a.params.length > 34 ? a.params.slice(0, 34) + "…" : a.params)}</span>` : "";
    const builtin = a.builtin ? '<span class="act-builtin">内置</span>' : '<span class="act-custom">自定义</span>';
    return `<div class="fs-row act-row ${a.enabled === false ? "off" : ""}" data-id="${escA(a.id)}">
    <div class="act-ico">${svg || '<span class="act-noico">—</span>'}</div>
    <div class="act-main">
      <div class="act-t"><span class="fs-no">${String(idx + 1).padStart(2, "0")}</span>
        <b>${esc(a.label)}</b><code>${esc(a.id)}</code>${where}${builtin}
        <span class="act-meth" title="${escA(m.desc)}">${esc(a.action)}</span>${params}</div>
      <p class="act-d">${esc(a.desc || m.desc || "（未填写说明）")}</p>
    </div>
    <div class="act-ops">
      <label class="vf-sw" title="启用 / 停用"><input type="checkbox" ${a.enabled !== false ? "checked" : ""} onchange="TPL._actToggle(${escJS(a.id)},this.checked)"><i></i></label>
      <span class="fs-state ${a.enabled !== false ? "on" : "off"}">${a.enabled !== false ? "已启用" : "已停用"}</span>
      <button class="vc-mini" title="上移" ${i === 0 ? "disabled" : ""} onclick="TPL._actMove(${escJS(a.id)},-1)">↑</button>
      <button class="vc-mini" title="下移" ${i === total - 1 ? "disabled" : ""} onclick="TPL._actMove(${escJS(a.id)},1)">↓</button>
      <button class="vc-mini act-edit" title="编辑" onclick="TPL._actEdit(${escJS(a.id)})">✎</button>
      <button class="vc-mini act-del" title="删除" onclick="TPL._actDel(${escJS(a.id)})">×</button>
    </div>
  </div>`;
  }
  function vcFeatRowsHTML() {
    const g = vcFeatGroup(), kw = vFeatKw.trim().toLowerCase();
    if (vcIsPageGroup(g)) {
      const all = vcPageAll(), m = PAGE.method;
      const hit2 = kw ? all.filter((a) => [a.label, a.scene, a.trigger, a.method, m(a.method).label, a.params, a.desc].join(" ").toLowerCase().indexOf(kw) >= 0) : all;
      if (!hit2.length) return `<div class="fs-empty">没有匹配「${esc(vFeatKw)}」的交互场景 · <button onclick="TPL._vcFeatSearch('')">清除搜索</button></div>`;
      return all.map((a, i) => hit2.indexOf(a) >= 0 ? vcPageRowHTML(a, i, all.length) : "").join("");
    }
    if (vcIsActGroup(g)) {
      const all = vcActAll(g);
      const hit2 = kw ? all.filter((a) => [a.label, a.id, a.action, a.params, a.desc, a.menuGroup].join(" ").toLowerCase().indexOf(kw) >= 0) : all;
      if (!hit2.length) return `<div class="fs-empty">没有匹配「${esc(vFeatKw)}」的动作 · <button onclick="TPL._vcFeatSearch('')">清除搜索</button></div>`;
      return all.map((a, i) => hit2.indexOf(a) >= 0 ? vcActRowHTML(g, a, i, all.length, i) : "").join("");
    }
    const items = g.items || [];
    const hit = kw ? items.filter((it) => [it.label, it.key, it.desc, it.groupLabel].join(" ").toLowerCase().indexOf(kw) >= 0) : items;
    if (!hit.length) return `<div class="fs-empty">没有匹配「${esc(vFeatKw)}」的配置项 · <button onclick="TPL._vcFeatSearch('')">清除搜索</button></div>`;
    return hit.map((it) => vcFeatRowHTML(g, it, items.indexOf(it))).join("");
  }
  function vcFeatMetaInner(g) {
    if (vcIsPageGroup(g)) {
      const all = vcPageAll(), on2 = all.filter((a) => a.enabled !== false).length;
      const custom = all.filter((a) => !a.builtin).length;
      return `<span><b>${on2}<i>/</i>${all.length}</b> 个场景已启用</span><i></i><span>${all.length} 个交互场景</span><i></i><span>${custom} 个自定义</span><i></i><span>${PAGE.methods().length} 种交互方法</span><i></i><span>全局生效</span>`;
    }
    if (vcIsActGroup(g)) {
      const all = vcActAll(g), on2 = all.filter((a) => a.enabled !== false).length;
      const custom = all.filter((a) => !a.builtin).length;
      return `<span><b>${on2}<i>/</i>${all.length}</b> 个动作已启用</span><i></i><span>${all.length} 个动作</span><i></i><span>${custom} 个自定义</span><i></i><span>${ACT.methodOptions().length} 种调用方法</span><i></i><span>全局生效</span>`;
    }
    const items = g.items || [], f = vDraft.features || {};
    const sw = items.filter((it) => it.type === "switch");
    const on = sw.filter((it) => !!(f[g.key] || {})[it.key]).length;
    const m = sw.length >= 2 ? `<span><b>${on}<i>/</i>${sw.length}</b> 开关已开启</span>` : `<span><b>${items.length}</b> 条配置</span>`;
    return `${m}<i></i><span>${items.length} 项配置</span><i></i>
    <span>${new Set(items.map((x) => x.type)).size} 种控件</span><i></i><span>全局生效</span>`;
  }
  function vcFeatSumText() {
    const s = vcActSummary();
    return `${s.groups} 组 / 动作 ${s.actionsOn}·${s.actions} / 场景 ${s.scenesOn}·${s.scenes} / 开关 ${s.on}·${s.sw}`;
  }
  function vcFeatHTML() {
    const g = vcFeatGroup(), isPage = vcIsPageGroup(g), isAct = vcIsActGroup(g) || isPage;
    const items = isAct ? isPage ? vcPageAll() : vcActAll(g) : g.items || [];
    vDraft.features || {};
    const sw = isAct ? [] : items.filter((it) => it.type === "switch");
    const gi = vcFeatGroups().findIndex((x) => x.key === g.key) + 1;
    let bulk, resetFn, resetLabel, sheetTitle, foot, note, ph;
    if (isPage) {
      bulk = `<button class="fs-btn pri" onclick="TPL._pageAdd()">＋ 添加交互场景</button>
       <button class="fs-btn" onclick="TPL._pageAll(true)">全部启用</button>
       <button class="fs-btn" onclick="TPL._pageAll(false)">全部停用</button>`;
      resetFn = "TPL._pageReset()";
      resetLabel = "恢复默认场景";
      sheetTitle = "交互场景";
      foot = `<span>场景落在 <code>cfg.pageActions</code> · 每个触发点绑定一个交互方法 + 参数 + 说明 · 与快捷工具栏共用方法注册表</span>`;
      note = PAGE.spec().note || g.note || "";
      ph = "搜索场景 / 方法 / 说明";
    } else if (isAct) {
      bulk = `<button class="fs-btn pri" onclick="TPL._actAdd()">＋ 添加动作</button>
       <button class="fs-btn" onclick="TPL._actAll(true)">全部启用</button>
       <button class="fs-btn" onclick="TPL._actAll(false)">全部停用</button>`;
      resetFn = "TPL._actReset()";
      resetLabel = "恢复默认动作";
      sheetTitle = "动作项";
      foot = `<span>动作落在 <code>cfg.actions</code> · 图标 / 名称 / 参数 / 调用方法 / 说明均可自定义 · 保存后对全部视图生效</span>`;
      note = ACT.spec().note || g.note || "";
      ph = "搜索名称 / 方法 / 说明";
    } else {
      bulk = sw.length >= 2 ? `<button class="fs-btn" onclick="TPL._vcFeatAll(true)">全部开启</button>
         <button class="fs-btn" onclick="TPL._vcFeatAll(false)">全部关闭</button>` : "";
      resetFn = "TPL._vcFeatReset()";
      resetLabel = "恢复本组默认";
      sheetTitle = "配置项";
      foot = `<span>改动保存后对全部视图生效 · 配置落在 <code>cfg.features</code>，候选项读 <code>SCHEMA.features.groups</code></span>`;
      note = g.note || "";
      ph = "搜索名称 / 字段 / 说明";
    }
    const tail = isPage ? " · 可添加 / 删除 / 排序" : isAct ? " · 可添加 / 删除 / 排序" : " · 全部视图共享";
    return `<div class="fs-page">
    <div class="fs-head">
      <div class="fs-head-l"><span class="fs-idx">${String(gi).padStart(2, "0")}</span>
        <div><h4>${esc(g.label)}<span class="fs-head-en">${esc(g.key)}</span></h4>
          <p>${esc(note)}</p>
          <div class="fs-meta" id="fsMeta">${vcFeatMetaInner(g)}</div></div>
      </div>
      <div class="fs-head-r">${bulk}
        <button class="fs-btn" onclick="${resetFn}">${resetLabel}</button>
        <button class="fs-btn pri" onclick="TPL._vcFeatJSON()">查看配置 JSON</button></div>
    </div>
    <div class="fs-sheet">
      <div class="fs-sheet-hd"><div><b>${sheetTitle}</b><span id="fsRowCount">共 ${items.length} 项${tail}</span></div>
        <div class="fs-search"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4.4"/><path d="M10.2 10.2L14 14"/></svg>
          <input id="fsSearch" value="${escA(vFeatKw)}" placeholder="${ph}" oninput="TPL._vcFeatSearch(this.value)"></div></div>
      <div class="fs-rows" id="fsRows">${vcFeatRowsHTML()}</div>
      <div class="fs-sheet-ft">${foot}
        <span id="fsFtSum">${vcFeatSumText()}</span></div>
    </div>
  </div>`;
  }
  function vcActEditorHTML(a, isNew) {
    const io = ACT.iconOptions(), mo = ACT.methodOptions(), mg = ACT.menuGroups(), zo = ACT.zones();
    const svg = a.iconSvg || ACT.icon(a.icon) || "";
    const m = vcActMethod(a.action);
    return `<div class="act-mask" id="actMask" onclick="TPL._actClose()"></div>
  <div class="act-win" id="actEditWin">
    <div class="act-hd"><div><b>${isNew ? "添加动作" : "编辑动作"}</b><span>${esc(isNew ? "新增一个按钮 / 菜单项，字段由 actionSpec 驱动" : a.id)}</span></div>
      <button onclick="TPL._actClose()" title="关闭">×</button></div>
    <div class="act-bd">
      <input type="hidden" id="aeId" value="${escA(a.id)}">
      <div class="act-grid">
        <label class="act-f"><span>归属区域</span><select id="aeZone" onchange="TPL._actZoneChange(this.value)">
          ${zo.map((z) => `<option value="${escA(z.key)}" ${a.zone === z.key ? "selected" : ""}>${esc(z.label)}</option>`).join("")}</select></label>
        <label class="act-f" id="aeMgWrap"><span>菜单归属</span><select id="aeMenuGroup">
          ${mg.map((x) => `<option value="${escA(x.key)}" ${a.menuGroup === x.key ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
        <label class="act-f"><span>名称</span><input id="aeLabel" value="${escA(a.label)}" placeholder="如：导出 Excel"></label>
        <label class="act-f"><span>调用方法</span><select id="aeAction" onchange="TPL._actMethodChange(this.value)">
          ${mo.map((x) => `<option value="${escA(x.key)}" ${a.action === x.key ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
        <label class="act-f wide"><span>图标</span><div class="act-icon-row">
          <select id="aeIcon" onchange="TPL._actIconChange(this.value)">
            <option value="">无图标</option>${io.map((x) => `<option value="${escA(x.key)}" ${a.icon === x.key ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select>
          <div class="act-prev" id="aePreview">${svg || "—"}</div>
          <input id="aeIconSvg" value="${escA(a.iconSvg)}" placeholder="自定义 SVG（可选，填了优先用）" oninput="TPL._actSvgInput(this.value)"></div></label>
        <label class="act-f wide"><span>参数 <em>JSON 或文本</em></span><input id="aeParams" value="${escA(a.params)}" placeholder="${escA(m.params || "可留空")}"></label>
        <label class="act-f wide"><span>说明</span><textarea id="aeDesc" rows="2" placeholder="写清楚这个动作做什么，会显示在配置行与工具提示里">${esc(a.desc)}</textarea></label>
        <label class="act-f wide act-f-sw"><span>启用</span><label class="vf-sw"><input type="checkbox" id="aeEnabled" ${a.enabled !== false ? "checked" : ""}><i></i><span>保存后立即出现在对应区域</span></label></label>
      </div>
      <div class="act-hint" id="aeHint"><b>${esc(m.label)}</b> · ${esc(m.desc || "—")}${m.params ? ` · 参数示例 <code>${esc(m.params)}</code>` : ""}</div>
    </div>
    <div class="act-ft"><span>删掉内置项后，「恢复默认动作」可一键还原 13 个默认动作</span>
      <button class="fs-btn" onclick="TPL._actClose()">取消</button>
      <button class="fs-btn pri" onclick="TPL._actSave()">保存动作</button></div>
  </div>`;
  }
  function vcActEditorOpen(a, isNew) {
    const old = $("actEditWin"), om = $("actMask");
    if (old) old.remove();
    if (om) om.remove();
    document.body.insertAdjacentHTML("beforeend", vcActEditorHTML(a, isNew));
    isNew ? null : a.id;
    const z = $("aeZone");
    if (z) window.TPL._actZoneChange(z.value);
  }
  function vcPageEditorHTML(a, isNew) {
    const ms = PAGE.methods(), m = PAGE.method(a.method), scs = PAGE.scenes();
    return `<div class="act-mask" id="pageMask" onclick="TPL._pageClose()"></div>
  <div class="act-win" id="pageEditWin">
    <div class="act-hd"><div><b>${isNew ? "添加交互场景" : "编辑交互场景"}</b><span>${esc(isNew ? "给一个触发点绑定交互方法，字段由 pageSpec 驱动" : a.scene)}</span></div>
      <button onclick="TPL._pageClose()" title="关闭">×</button></div>
    <div class="act-bd">
      <input type="hidden" id="peId" value="${escA(a.id)}">
      <div class="act-grid">
        <label class="act-f"><span>场景 key <em>内置或自定义</em></span>
          <input id="peScene" value="${escA(a.scene)}" list="peSceneList" placeholder="如 link / view / custom_1">
          <datalist id="peSceneList">${scs.map((x) => `<option value="${escA(x.key)}">${esc(x.label)}</option>`).join("")}</datalist></label>
        <label class="act-f"><span>名称</span><input id="peLabel" value="${escA(a.label)}" placeholder="如：点击编码链接"></label>
        <label class="act-f wide"><span>触发位置</span><input id="peTrigger" value="${escA(a.trigger)}" placeholder="如：表格编码列 / 操作列「详情」按钮"></label>
        <label class="act-f wide"><span>交互方法</span><select id="peMethod" onchange="TPL._pageMethodChange(this.value)">
          ${ms.map((x) => `<option value="${escA(x.key)}" ${a.method === x.key ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
        <label class="act-f wide"><span>参数 <em>JSON 或文本</em></span><input id="peParams" value="${escA(a.params)}" placeholder="${escA(m.params || "可留空")}"></label>
        <label class="act-f wide"><span>说明</span><textarea id="peDesc" rows="2" placeholder="写清楚这个场景触发后会发生什么">${esc(a.desc)}</textarea></label>
        <label class="act-f wide act-f-sw"><span>启用</span><label class="vf-sw"><input type="checkbox" id="peEnabled" ${a.enabled !== false ? "checked" : ""}><i></i><span>停用后该场景回退为默认抽屉行为</span></label></label>
      </div>
      <div class="act-hint" id="peHint"><b>${esc(m.label)}</b> · ${esc(m.desc || "—")}${m.params ? ` · 参数示例 <code>${esc(m.params)}</code>` : ""}</div>
      ${isNew ? '<div class="pi-note">自定义场景在列表中没有内置控件，可由 <code>TPL._pageScene(key)</code> 触发；内置场景 link / view / edit / new 已接到编码列、操作列与新建按钮。</div>' : ""}
    </div>
    <div class="act-ft"><span>删掉内置场景后，「恢复默认场景」可一键还原 4 个默认场景</span>
      <button class="fs-btn" onclick="TPL._pageClose()">取消</button>
      <button class="fs-btn pri" onclick="TPL._pageSave()">保存场景</button></div>
  </div>`;
  }
  function vcPageEditorOpen(a, isNew) {
    const ow = $("actEditWin"), om = $("actMask"), pw = $("pageEditWin"), pm = $("pageMask");
    if (ow) ow.remove();
    if (om) om.remove();
    if (pw) pw.remove();
    if (pm) pm.remove();
    document.body.insertAdjacentHTML("beforeend", vcPageEditorHTML(a, isNew));
  }
  function vcFeatJSONOpen() {
    const data = {
      说明: "功能设置 · 当前配置编辑态（与视图列表平级，作用于全部视图，含未保存修改）",
      schemaId: S.id,
      scope: "global",
      spec: FEAT.spec,
      features: vDraft.features,
      pageRoutes: (vDraft.features.page || {}).routes || [],
      savedFeatures: VC.features,
      actionSpec: ACT.spec(),
      actions: vDraft.actions || [],
      savedActions: VC.actions || [],
      pageSpec: PAGE.spec(),
      pageActions: vDraft.pageActions || [],
      savedPageActions: VC.pageActions || []
    };
    let host = $("vcJsonWin");
    if (!host) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div class="vc-json-mask" id="vcJsonMask" onclick="TPL._vcDefJSONClose()"></div>
       <div class="vc-json-win" id="vcJsonWin"><div class="vc-json-hd"><b id="vcJsonHdTitle">功能设置 · 当前配置</b>
         <button onclick="TPL._vcDefJSONClose()" title="关闭">×</button></div>
         <div class="vc-json-bd"><pre id="vcJsonPre"></pre></div>
         <div class="vc-json-ft"><span>动作读 cfg.actions / actionSpec；交互场景读 cfg.pageActions / pageSpec；pageRoutes 为兼容视图，均按元数据分派</span>
           <button class="vc-btn" onclick="TPL._vcDefJSONCopy()">复制 JSON</button></div></div>`
      );
      host = $("vcJsonWin");
    }
    const t = $("vcJsonHdTitle") || document.querySelector("#vcJsonHd b");
    if (t) t.textContent = "功能设置 · 当前配置（含未保存修改）";
    $("vcJsonPre").textContent = JSON.stringify(data, null, 2);
    host.classList.add("on");
    $("vcJsonMask").classList.add("on");
    window.__VC_JSON__ = $("vcJsonPre").textContent;
  }
  function vcFeatRender() {
    const pane = $("vcPane"), sc = pane ? pane.scrollTop : 0;
    const list = $("vcFeatList"), ls = list ? list.scrollTop : 0;
    const si = $("fsSearch");
    const focused = !!(si && document.activeElement === si), caret = si ? si.selectionStart : 0;
    if (pane) pane.innerHTML = vcFeatHTML();
    if (list) list.innerHTML = vcFeatListHTML();
    if (pane) pane.scrollTop = sc;
    if (list) list.scrollTop = ls;
    if (focused) {
      setTimeout(function() {
        const n = $("fsSearch");
        if (n) {
          try {
            n.focus();
            n.setSelectionRange(caret, caret);
          } catch (e) {
          }
        }
      }, 0);
    }
    if ($("vcFeatBadge")) $("vcFeatBadge").textContent = vcFeatGroup().label;
    if ($("vcFeatN")) $("vcFeatN").textContent = "共 " + vcFeatGroups().length + " 组";
  }
  let _featSoftPend = false;
  function vcFeatMetaRefresh() {
    const pane = $("vcPane");
    if (!pane || !$("fsRows")) {
      vcFeatRender();
      return false;
    }
    const meta = $("fsMeta");
    if (meta) meta.innerHTML = vcFeatMetaInner(vcFeatGroup());
    const list = $("vcFeatList");
    if (list) list.innerHTML = vcFeatListHTML();
    const ft = $("fsFtSum");
    if (ft) ft.textContent = vcFeatSumText();
    return true;
  }
  function vcFeatSoftRender(opt) {
    if (!vcFeatMetaRefresh()) return;
    if (opt && opt.rows === false) return;
    if (_featSoftPend) return;
    _featSoftPend = true;
    setTimeout(function() {
      _featSoftPend = false;
      const pane = $("vcPane"), rows = pane ? pane.querySelector("#fsRows") : null;
      if (rows) rows.innerHTML = vcFeatRowsHTML();
      vcFeatCountRender();
    }, 0);
  }
  function vcFeatCountText() {
    const g = vcFeatGroup(), kw = vFeatKw.trim().toLowerCase();
    if (vcIsPageGroup(g)) {
      const n2 = vcPageAll(), m = PAGE.method;
      const hit2 = kw ? n2.filter((a) => [a.label, a.scene, a.trigger, a.method, m(a.method).label, a.params, a.desc].join(" ").toLowerCase().indexOf(kw) >= 0).length : n2.length;
      return kw ? `匹配 ${hit2} / ${n2.length} 个交互场景` : `共 ${n2.length} 个交互场景 · 可添加 / 删除 / 排序`;
    }
    if (vcIsActGroup(g)) {
      const n2 = vcActAll(g);
      const hit2 = kw ? n2.filter((a) => [a.label, a.id, a.action, a.params, a.desc, a.menuGroup].join(" ").toLowerCase().indexOf(kw) >= 0).length : n2.length;
      return kw ? `匹配 ${hit2} / ${n2.length} 个动作` : `共 ${n2.length} 个动作 · 可添加 / 删除 / 排序`;
    }
    const n = g.items || [];
    const hit = kw ? n.filter((it) => [it.label, it.key, it.desc, it.groupLabel].join(" ").toLowerCase().indexOf(kw) >= 0).length : n.length;
    return kw ? `匹配 ${hit} / ${n.length} 项` : `共 ${n.length} 项 · 全部视图共享`;
  }
  function vcFeatCountRender() {
    const ft = $("fsRowCount");
    if (ft) ft.textContent = vcFeatCountText();
  }
  function vcFeatRowsRender() {
    const box = $("fsRows");
    if (box) box.innerHTML = vcFeatRowsHTML();
    vcFeatCountRender();
  }
  function vcFeatListHTML() {
    const f = vDraft.features || {}, sum = vcActSummary();
    const nav = vcFeatGroups().map((g, i) => {
      let meta, bar = "", rate = 0, total = 0;
      if (vcIsPageGroup(g)) {
        const a = vcPageAll(), on = a.filter((x) => x.enabled !== false).length;
        meta = `${on}/${a.length} 启用`;
        total = a.length;
        rate = a.length ? on / a.length : 0;
      } else if (vcIsActGroup(g)) {
        const a = vcActAll(g), on = a.filter((x) => x.enabled !== false).length;
        meta = `${on}/${a.length} 启用`;
        total = a.length;
        rate = a.length ? on / a.length : 0;
      } else {
        const items = g.items || [], sw = items.filter((it) => it.type === "switch");
        const on = sw.filter((it) => !!(f[g.key] || {})[it.key]).length;
        if (sw.length >= 2) {
          meta = `${on}/${sw.length} 开启`;
          total = sw.length;
          rate = sw.length ? on / sw.length : 0;
        } else meta = items.length + " 项";
      }
      if (total >= 2) bar = `<span class="fs-nav-bar"><i style="width:${Math.round(rate * 100)}%"></i></span>`;
      return `<div class="fs-nav ${g.key === vFeatGroup ? "on" : ""}" onclick="TPL._vcFeatPick(${escJS(g.key)})">
      <span class="fs-nav-i">${String(i + 1).padStart(2, "0")}</span>
      <span class="fs-nav-t"><b>${esc(g.label)}</b>${bar}</span>
      <span class="fs-nav-n">${esc(meta)}</span></div>`;
    }).join("");
    return `<div class="fs-summary">
      <div class="fs-summary-t"><b>功能设置</b><span>全局 · 全部视图</span></div>
      <div class="fs-summary-n"><b>${sum.groups}</b><span>分组</span><b>${sum.actionsOn}<i>/</i>${sum.actions}</b><span>动作启用</span><b>${sum.scenesOn}<i>/</i>${sum.scenes}</b><span>场景启用</span></div>
      <p>动作读 <code>cfg.actions</code>，交互场景读 <code>cfg.pageActions</code> + <code>pageSpec</code>；共用方法注册表，均可增删自定义。</p>
    </div>
    <div class="fs-nav-ttl">配置分组</div>
    <div class="fs-nav-list">${nav}</div>`;
  }
  function vcPaneHTML(t, v) {
    switch (t) {
      case "filters":
        return vcOverviewHTML(v);
      case "where":
        return vcWhereHTML(v);
      case "toolbar":
        return vcToolbarHTML(v);
      case "adv":
        return vcAdvHTML(v);
      case "defs":
      case "cols":
      default:
        return vcColsHTML(v);
    }
  }
  function renderVC() {
    buildVCDom();
    const isFeat = vMode === "features";
    document.querySelectorAll("#vcWin .vc-mode").forEach((t) => t.classList.toggle("on", t.dataset.m === vMode));
    $("vcLeftViews").style.display = isFeat ? "none" : "flex";
    $("vcLeftFeat").style.display = isFeat ? "flex" : "none";
    $("vcRhdViews").style.display = isFeat ? "none" : "flex";
    $("vcRhdFeat").style.display = isFeat ? "flex" : "none";
    $("vcTabs").style.display = isFeat ? "none" : "flex";
    $("vcHdSub").textContent = isFeat ? "功能设置 · 快捷工具栏 / 表单配置 / 菜单栏 / 页面配置 · 动作与交互场景均可增删自定义" : "";
    const pane = $("vcPane");
    pane.classList.toggle("pane-cols", !isFeat && (vTab === "cols" || vTab === "defs"));
    pane.classList.toggle("pane-feat", isFeat);
    if (isFeat) {
      if (!vcFeatGroups().some((g) => g.key === vFeatGroup)) vFeatGroup = (vcFeatGroups()[0] || {}).key || "general";
      $("vcFeatList").innerHTML = vcFeatListHTML();
      $("vcFeatBadge").textContent = vcFeatGroup().label;
      $("vcFeatN").textContent = "共 " + vcFeatGroups().length + " 组";
      pane.innerHTML = vcFeatHTML();
      pane.scrollTop = 0;
      return;
    }
    $("vcViewN").textContent = "共 " + vDraft.views.length + " 个";
    $("vcList").innerHTML = vDraft.views.map((v2) => `<div class="vc-item ${v2.id === vSel ? "on" : ""}" onclick="TPL._vcPick(${escJS(v2.id)})">
      <span class="nm">${esc(v2.label)}</span><span class="n">${(v2.cols || []).length}列 · ${VC.count(v2)}条</span>
      <span class="ops"><button class="vc-mini" title="上移" onclick="event.stopPropagation();TPL._vcMove(${escJS(v2.id)},-1)">↑</button>
        <button class="vc-mini" title="下移" onclick="event.stopPropagation();TPL._vcMove(${escJS(v2.id)},1)">↓</button>
        <button class="vc-mini" title="删除" onclick="event.stopPropagation();TPL._vcDel(${escJS(v2.id)})">×</button></span></div>`).join("");
    const v = vcCur(), nm = $("vcName");
    if (nm && document.activeElement !== nm) nm.value = v.label;
    $("vcCurBadge").textContent = v.id === VC.cfg.active ? "当前使用" : "";
    document.querySelectorAll("#vcWin .vc-tab").forEach((t) => t.classList.toggle("on", t.dataset.t === vTab));
    pane.innerHTML = vcPaneHTML(vTab, v);
  }
  const vcApi = {
    _vcOpen() {
      vDraft = VC.clone(VC.cfg);
      vDraft.features = VC.normFeatures(vDraft.features);
      vDraft.actions = VC.normActions(vDraft.actions, vDraft.features);
      vDraft.pageActions = VC.normPageActions(vDraft.pageActions, vDraft.features);
      vSel = vDraft.views.some((v) => v.id === VC.cfg.active) ? VC.cfg.active : vDraft.views[0].id;
      vTab = "cols";
      vSelCol = null;
      vColKw = "";
      renderVC();
      vcShow(true);
    },
    _vcClose() {
      vcShow(false);
    },
    _vcPick(id) {
      vSel = id;
      vSelCol = null;
      renderVC();
    },
    _vcTab(t) {
      vTab = t;
      renderVC();
    },
    _vcMode(m) {
      vMode = m === "features" ? "features" : "views";
      renderVC();
    },
    _vcFeatPick(k) {
      vFeatGroup = k;
      vFeatKw = "";
      const p = $("vcPane");
      if (p) p.scrollTop = 0;
      vcFeatRender();
    },
    _vcFeatSearch(kw) {
      vFeatKw = String(kw || "");
      vcFeatRowsRender();
    },
    _vcFeatAll(on) {
      const g = vcFeatGroup();
      if (vcIsPageGroup(g)) return this._pageAll(!!on);
      if (vcIsActGroup(g)) return this._actAll(!!on);
      let n = 0;
      vDraft.features[g.key] = vDraft.features[g.key] || {};
      (g.items || []).forEach((it) => {
        if (it.type === "switch") {
          vDraft.features[g.key][it.key] = !!on;
          n++;
        }
      });
      vcFeatRender();
      if (n) api._toast(`「${g.label}」${n} 个开关已${on ? "全部开启" : "全部关闭"}`);
    },
    _vcFeatSwitch(g, k, on) {
      vcFeatSet(g, k, !!on);
    },
    _vcFeatVal(g, k, val) {
      const it = FEAT.item(g, k), d = it ? it.default : void 0;
      vcFeatSet(g, k, typeof d === "number" ? val === "" ? 0 : +val : val);
    },
    _vcFeatSort(part, val) {
      const s = Object.assign({}, vDraft.features.form.defaultSort || {});
      s[part] = val;
      vcFeatSet("form", "defaultSort", s);
    },
    _vcFeatRoute(i, part, val) {
      const a = (vDraft.features.page.routes || []).slice();
      if (!a[i]) return;
      a[i] = Object.assign({}, a[i]);
      a[i][part] = val;
      vDraft.features.page.routes = a;
      vcFeatSoftRender({ rows: false });
    },
    _vcFeatRouteAdd(scene) {
      const a = (vDraft.features.page.routes || []).slice();
      a.push({ scene: scene || "scene_" + (a.length + 1), label: "自定义跳转", page: "", mode: "drawer", params: "" });
      vDraft.features.page.routes = a;
      vcFeatSoftRender();
    },
    _vcFeatRouteDel(i) {
      const a = (vDraft.features.page.routes || []).slice();
      if (!a[i]) return;
      a.splice(i, 1);
      vDraft.features.page.routes = a;
      vcFeatSoftRender();
    },
    _vcFeatReset() {
      const g = vcFeatGroup();
      if (vcIsPageGroup(g)) return this._pageReset();
      if (vcIsActGroup(g)) return this._actReset();
      const d = VC.featDefaults();
      vDraft.features[vFeatGroup] = VC.clone(d[vFeatGroup] || {});
      vcFeatRender();
      api._toast("已恢复「" + g.label + "」为默认");
    },
    _vcFeatResetAll() {
      vDraft.features = VC.featDefaults();
      vDraft.actions = VC.actionDefaults();
      vDraft.pageActions = VC.pageActionDefaults();
      vcFeatRender();
      api._toast("已恢复全部功能设置、默认动作与默认交互场景");
    },
    _vcFeatJSON() {
      vcFeatJSONOpen();
    },
    _actSyncFeature(a) {
      if (a.key && a.fg) {
        vDraft.features[a.fg] = vDraft.features[a.fg] || {};
        vDraft.features[a.fg][a.key] = a.enabled !== false;
      }
    },
    _actFind(id) {
      return (vDraft.actions || []).find((x) => x.id === id) || null;
    },
    _actAdd() {
      const g = vcFeatGroup(), z = vcActZone(g), m = ACT.methodOptions()[0] || { key: "none", params: "" };
      vcActEditorOpen({
        id: "a_" + Date.now().toString(36),
        zone: z,
        menuGroup: z === "menu" ? "more" : "",
        icon: "",
        iconSvg: "",
        label: "新动作",
        action: m.key,
        params: m.params || "",
        desc: "",
        enabled: true
      }, true);
    },
    _actEdit(id) {
      const a = this._actFind(id);
      if (!a) return;
      vcActEditorOpen(Object.assign({}, a), false);
    },
    _actClose() {
      const w = $("actEditWin"), m = $("actMask");
      if (w) w.remove();
      if (m) m.remove();
    },
    _actZoneChange(v) {
      const w = $("aeMgWrap");
      if (w) w.style.display = v === "menu" ? "" : "none";
      const sel = $("aeMenuGroup");
      if (sel && v !== "menu") sel.value = "more";
    },
    _actMethodChange(k) {
      const m = vcActMethod(k), h = $("aeHint");
      if (h) h.innerHTML = `<b>${esc(m.label)}</b> · ${esc(m.desc || "—")}${m.params ? ` · 参数示例 <code>${esc(m.params)}</code>` : ""}`;
      const p = $("aeParams");
      if (p) p.placeholder = m.params || "可留空";
    },
    _actPreview() {
      const k = $("aeIcon") ? $("aeIcon").value : "", custom = $("aeIconSvg") ? $("aeIconSvg").value : "";
      const pv = $("aePreview");
      if (pv) pv.innerHTML = custom || ACT.icon(k) || "—";
    },
    _actIconChange() {
      this._actPreview();
    },
    _actSvgInput() {
      this._actPreview();
    },
    _actSave() {
      const id = $("aeId") ? $("aeId").value : "";
      const raw = {
        id,
        zone: $("aeZone") ? $("aeZone").value : "toolbar",
        menuGroup: $("aeMenuGroup") ? $("aeMenuGroup").value : "more",
        icon: $("aeIcon") ? $("aeIcon").value : "",
        iconSvg: $("aeIconSvg") ? $("aeIconSvg").value.trim() : "",
        label: ($("aeLabel") ? $("aeLabel").value : "").trim() || "未命名动作",
        action: $("aeAction") ? $("aeAction").value : "none",
        params: $("aeParams") ? $("aeParams").value : "",
        desc: $("aeDesc") ? $("aeDesc").value : "",
        enabled: $("aeEnabled") ? $("aeEnabled").checked : true,
        builtin: false
      };
      if (raw.zone !== "menu") raw.menuGroup = "";
      const old = this._actFind(id);
      if (old) raw.builtin = old.builtin;
      const a = VC.normActions([raw])[0];
      if (old) {
        a.sepBefore = old.sepBefore;
        a.caret = old.caret;
        a.badge = old.badge;
        a.estate = old.estate;
        a.staticOn = old.staticOn;
        a.title = old.title;
        a.fg = old.fg;
        a.key = old.key;
      }
      vDraft.actions = vDraft.actions || [];
      const i = vDraft.actions.findIndex((x) => x.id === id);
      if (i >= 0) vDraft.actions[i] = a;
      else vDraft.actions.push(a);
      this._actSyncFeature(a);
      this._actClose();
      vcFeatRender();
      api._toast(old ? "已保存动作「" + a.label + "」" : "已添加动作「" + a.label + "」");
    },
    _actDel(id) {
      const a = this._actFind(id);
      if (!a) return;
      vDraft.actions = (vDraft.actions || []).filter((x) => x.id !== id);
      if (a.key && a.fg) {
        vDraft.features[a.fg] = vDraft.features[a.fg] || {};
        vDraft.features[a.fg][a.key] = false;
      }
      vcFeatRender();
      api._toast("已删除动作「" + a.label + "」");
    },
    _actToggle(id, on) {
      const a = this._actFind(id);
      if (!a) return;
      a.enabled = !!on;
      this._actSyncFeature(a);
      vcFeatRender();
    },
    _actMove(id, dir) {
      const arr = vDraft.actions || [], i = arr.findIndex((x) => x.id === id);
      if (i < 0) return;
      const a = arr[i], peer = i + dir < 0 ? null : arr[i + dir];
      if (!peer || peer.zone !== a.zone || a.zone === "menu" && peer.menuGroup !== a.menuGroup) return;
      arr[i] = peer;
      arr[i + dir] = a;
      vcFeatRender();
    },
    _actAll(on) {
      const g = vcFeatGroup(), z = vcActZone(g);
      let n = 0;
      (vDraft.actions || []).forEach((a) => {
        if (a.zone === z) {
          a.enabled = !!on;
          this._actSyncFeature(a);
          n++;
        }
      });
      vcFeatRender();
      api._toast(`「${g.label}」${n} 个动作已${on ? "全部启用" : "全部停用"}`);
    },
    _actReset() {
      const g = vcFeatGroup(), z = vcActZone(g);
      const d = VC.actionDefaults().filter((a) => a.zone === z);
      vDraft.actions = (vDraft.actions || []).filter((a) => a.zone !== z).concat(d);
      const fd = VC.featDefaults();
      vDraft.features[g.key] = VC.clone(fd[g.key] || {});
      vcFeatRender();
      api._toast("已恢复「" + g.label + "」为 " + d.length + " 个默认动作");
    },
    _pageFind(id) {
      return (vDraft.pageActions || []).find((x) => x.id === id) || null;
    },
    _pageAdd() {
      const used = vcPageAll().map((a) => a.scene);
      const next = PAGE.scenes().find((x) => used.indexOf(x.key) < 0);
      const m = PAGE.method("drawer");
      vcPageEditorOpen({
        id: "pi_" + Date.now().toString(36),
        scene: next ? next.key : "scene_" + (used.length + 1),
        label: next ? next.label : "新交互场景",
        trigger: next ? next.trigger : "",
        method: "drawer",
        params: m.params || "",
        desc: "",
        enabled: true
      }, true);
    },
    _pageEdit(id) {
      const a = this._pageFind(id);
      if (!a) return;
      vcPageEditorOpen(Object.assign({}, a), false);
    },
    _pageClose() {
      const w = $("pageEditWin"), m = $("pageMask");
      if (w) w.remove();
      if (m) m.remove();
    },
    _pageMethodChange(k) {
      const m = PAGE.method(k), h = $("peHint"), p = $("peParams");
      if (h) h.innerHTML = `<b>${esc(m.label)}</b> · ${esc(m.desc || "—")}${m.params ? ` · 参数示例 <code>${esc(m.params)}</code>` : ""}`;
      if (p) p.placeholder = m.params || "可留空";
    },
    _pageSave() {
      const id = $("peId") ? $("peId").value : "";
      const raw = {
        id,
        scene: ($("peScene") ? $("peScene").value : "").trim() || "custom",
        label: ($("peLabel") ? $("peLabel").value : "").trim() || "未命名场景",
        trigger: ($("peTrigger") ? $("peTrigger").value : "").trim(),
        method: $("peMethod") ? $("peMethod").value : "drawer",
        params: $("peParams") ? $("peParams").value : "",
        desc: $("peDesc") ? $("peDesc").value : "",
        enabled: $("peEnabled") ? $("peEnabled").checked : true,
        builtin: false
      };
      const old = this._pageFind(id);
      if (old) raw.builtin = old.builtin;
      let relinked = 0;
      if (old && old.scene !== raw.scene && typeof vDraft !== "undefined" && vDraft && vDraft.views) {
        const m = VC.colMap();
        vDraft.views.forEach(function(v) {
          v.colDef = v.colDef || {};
          const ks = Array.from(new Set((v.cols || []).concat(Object.keys(v.colDef)).concat(Object.keys(m)))).filter((k) => m[k]);
          ks.forEach(function(k) {
            const eff = vcColEff(v, k);
            if (clickCfg(eff).scene === old.scene) {
              v.colDef[k] = v.colDef[k] || {};
              v.colDef[k].clickScene = raw.scene;
              relinked++;
            }
            const bs = eff.render && eff.render.buttons || [];
            let ch = 0;
            const nb = bs.map(function(b) {
              if (b.scene === old.scene) {
                ch++;
                return Object.assign({}, b, { scene: raw.scene });
              }
              return b;
            });
            if (ch) {
              v.colDef[k] = v.colDef[k] || {};
              v.colDef[k].render = Object.assign({}, eff.render, { buttons: nb });
              relinked += ch;
            }
          });
        });
      }
      const a = VC.normPageActions([raw])[0];
      vDraft.pageActions = vDraft.pageActions || [];
      const i = vDraft.pageActions.findIndex((x) => x.id === id);
      if (i >= 0) vDraft.pageActions[i] = a;
      else vDraft.pageActions.push(a);
      this._pageClose();
      vcFeatRender();
      api._toast((old ? "已保存场景「" + a.label + "」" : "已添加场景「" + a.label + "」") + (relinked ? " · 已同步 " + relinked + " 处列绑定" : ""));
    },
    _pageDel(id) {
      const a = this._pageFind(id);
      if (!a) return;
      vDraft.pageActions = (vDraft.pageActions || []).filter((x) => x.id !== id);
      const left = vcPageBindings(a.scene), n = left.cols.length + left.buttons.length;
      vcFeatRender();
      api._toast("已删除场景「" + a.label + "」" + (n ? " · 仍有 " + left.cols.length + " 列 / " + left.buttons.length + " 按钮引用，请到「列选项」重新绑定" : ""));
    },
    _pageToggle(id, on) {
      const a = this._pageFind(id);
      if (!a) return;
      a.enabled = !!on;
      vcFeatRender();
    },
    _pageMove(id, dir) {
      const arr = vDraft.pageActions || [], i = arr.findIndex((x) => x.id === id);
      if (i < 0) return;
      const j = i + dir;
      if (j < 0 || j >= arr.length) return;
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
      vcFeatRender();
    },
    _pageAll(on) {
      let n = 0;
      (vDraft.pageActions || []).forEach((a) => {
        a.enabled = !!on;
        n++;
      });
      vcFeatRender();
      api._toast(`${n} 个交互场景已${on ? "全部启用" : "全部停用"}`);
    },
    _pageReset() {
      vDraft.pageActions = VC.pageActionDefaults();
      vcFeatRender();
      api._toast("已恢复 4 个默认交互场景");
    },
    _vcRename(val) {
      const v = vcCur();
      v.label = val || "未命名视图";
      const n = document.querySelector("#vcList .vc-item.on .nm");
      if (n) n.textContent = v.label;
    },
    _vcAdd() {
      const n = vDraft.views.length + 1;
      const v = {
        id: "v_" + Date.now() + "_" + n,
        label: "新视图 " + n,
        where: null,
        cols: VC.allCols().slice(),
        colW: {},
        filterKeys: VC.allFilterKeys(),
        filters: {},
        toolbar: {},
        toolbarDefs: VC.normTb(S.list.toolbarSelects || [])
      };
      vDraft.views.push(v);
      vSel = v.id;
      renderVC();
    },
    _vcDel(id) {
      if (vDraft.views.length <= 1) {
        api._toast("至少保留一个视图");
        return;
      }
      vDraft.views = vDraft.views.filter((v) => v.id !== id);
      if (vSel === id) vSel = vDraft.views[0].id;
      renderVC();
    },
    _vcMove(id, d) {
      const a = vDraft.views, i = a.findIndex((v) => v.id === id), j = i + d;
      if (i < 0 || j < 0 || j >= a.length) return;
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
      renderVC();
    },
    _vcColPick(k) {
      vSelCol = k;
      vcColsRender();
    },
    _vcColSearch(val) {
      vColKw = val || "";
      vcColsRender();
    },
    _vcFixed(k, on) {
      const v = vcCur(), cur2 = vcFixedGet(v, k);
      const val = on ? cur2 || vFixedDir[k] || "left" : "";
      vcFixedApply(v, k, val);
      vcColsRender();
    },
    _vcFixedDir(k, dir) {
      vFixedDir[k] = dir;
      const v = vcCur();
      if (vcFixedGet(v, k)) vcFixedApply(v, k, dir);
      vcColsRender();
    },
    _vcColGo(id) {
      const d = $("vcColDetail"), t = document.getElementById(id);
      if (!d || !t) return;
      const top = t.getBoundingClientRect().top - d.getBoundingClientRect().top + d.scrollTop - 8;
      d.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    },
    _vcColToggle(k, on) {
      const v = vcCur(), a = v.cols || [];
      if (on) {
        if (a.indexOf(k) < 0) a.push(k);
      } else {
        v.cols = a.filter((x) => x !== k);
      }
      vcColsRender();
    },
    _vcColMove(k, d) {
      const v = vcCur(), a = v.cols || [], i = a.indexOf(k), j = i + d;
      if (i < 0 || j < 0 || j >= a.length) return;
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
      const fx = vcFixedNormalize(v);
      if (fx) api._toast(`移动后已调整 ${fx} 列冻结，保持首/末连续`);
      vcColsRender();
    },
    _vcColsAll(mode) {
      const v = vcCur();
      if (mode === 1) v.cols = (S.list.columns || []).map((c) => c.k);
      else {
        const must = ["chk", S.list.linkField, S.detail.primaryField, "ops"];
        v.cols = VC.allCols().filter((k) => must.indexOf(k) >= 0);
      }
      vcColsRender();
    },
    _vcFilterKey(k, on) {
      const v = vcCur(), a = v.filterKeys || [];
      if (on) {
        if (a.indexOf(k) < 0) a.push(k);
      } else {
        v.filterKeys = a.filter((x) => x !== k);
        delete (v.filters || {})[k];
      }
      renderVC();
    },
    _vcFilterVal(k, val) {
      const v = vcCur();
      v.filters = v.filters || {};
      if (!val || val === "全部") delete v.filters[k];
      else v.filters[k] = val;
      vcRefreshCount();
    },
    _vcToolbar(f, val) {
      const v = vcCur();
      v.toolbar = v.toolbar || {};
      if (!val || val === "全部") delete v.toolbar[f];
      else v.toolbar[f] = val;
      vcRefreshCount();
    },
    _vcColW(k, val) {
      const v = vcCur(), m = VC.colMap();
      let n = parseInt(val, 10);
      if (isNaN(n)) n = m[k].w || 100;
      n = Math.max(36, Math.min(600, n));
      v.colW = v.colW || {};
      v.colW[k] = n;
      vcColsRender();
    },
    _vcColWReset() {
      vcCur().colW = {};
      vcColsRender();
    },
    _vcDef(k, prop, val) {
      const v = vcCur();
      v.colDef = v.colDef || {};
      const d = v.colDef[k] = v.colDef[k] || {};
      const ty = (vcDefSpec(prop) || {}).type;
      if (ty === "boolean" || prop === "sortable") d[prop] = !!val;
      else if (ty === "number") d[prop] = +val;
      else d[prop] = val;
      vcColsRender();
    },
    _vcClickGoPage(scene) {
      vMode = "features";
      vFeatGroup = "page";
      vFeatKw = String(scene || "");
      renderVC();
      api._toast("已定位到「页面配置」· 场景 " + (scene || "（未绑定）"));
    },
    _vcBtnWrite(k, arr) {
      const v = vcCur();
      v.colDef = v.colDef || {};
      const eff = vcColEff(v, k);
      v.colDef[k] = v.colDef[k] || {};
      v.colDef[k].render = Object.assign({}, eff.render || {}, { buttons: arr });
      vcColsRender();
    },
    _vcBtn(k, idx, prop, val) {
      const eff = vcColEff(vcCur(), k), arr = JSON.parse(JSON.stringify(vcBtnList(eff)));
      if (!arr[idx]) return;
      const ty = (vcBtnField(prop) || {}).type;
      arr[idx][prop] = ty === "boolean" ? !!val : val;
      this._vcBtnWrite(k, arr);
    },
    _vcBtnAdd(k) {
      const eff = vcColEff(vcCur(), k), arr = JSON.parse(JSON.stringify(vcBtnList(eff)));
      const d = (vcBtnSpec().defaults || [])[0] || {};
      const nb = {};
      (vcBtnSpec().fields || []).forEach((f) => {
        nb[f.key] = f.default !== void 0 ? f.default : "";
      });
      nb.label = "新操作";
      nb.scene = "";
      nb.field = "";
      nb.param = "code";
      nb.title = "";
      nb.enabled = true;
      nb.onMissing = vcBtnField("onMissing").default || "disable";
      if (d.label) nb.label = d.label;
      arr.push(nb);
      this._vcBtnWrite(k, arr);
      api._toast("已添加操作按钮，请绑定交互场景");
    },
    _vcBtnDel(k, idx) {
      const eff = vcColEff(vcCur(), k), arr = JSON.parse(JSON.stringify(vcBtnList(eff)));
      if (!arr[idx]) return;
      const lb = arr[idx].label || "未命名按钮";
      arr.splice(idx, 1);
      this._vcBtnWrite(k, arr);
      api._toast("已删除操作按钮「" + lb + "」");
    },
    _vcBtnMove(k, idx, dir) {
      const eff = vcColEff(vcCur(), k), arr = JSON.parse(JSON.stringify(vcBtnList(eff)));
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return;
      const t = arr[idx];
      arr[idx] = arr[j];
      arr[j] = t;
      this._vcBtnWrite(k, arr);
    },
    _vcDefReset(k) {
      const v = vcCur();
      if (v.colDef) delete v.colDef[k];
      if (v.colW) delete v.colW[k];
      vcFixedNormalize(v);
      vcColsRender();
    },
    _vcDefResetAll() {
      const v = vcCur();
      v.colDef = {};
      v.colW = {};
      vcFixedNormalize(v);
      vcColsRender();
      api._toast("已恢复本视图全部列定义覆盖");
    },
    _vcDefJSON() {
      const spec = S.list.columnSpec || {}, base = S.list.columns || [];
      const dv = vDraft && vDraft.views.find((x) => x.id === vSel) || vcCur();
      const m = VC.colMap(), dcd = dv.colDef || {}, dcw = dv.colW || {};
      const eff = (dv.cols && dv.cols.length ? dv.cols : VC.allCols()).filter((k) => m[k]).map((k) => {
        const c = Object.assign({}, m[k], dcd[k] || {});
        c.w = +dcw[k] || c.w || 100;
        c.sortable = c.sortable !== void 0 ? !!c.sortable : !c.nosort;
        c.align = c.align || "left";
        c.dataType = c.dataType || "text";
        c.renderer = c.renderer || "text";
        return {
          k: c.k,
          t: c.t,
          w: c.w,
          align: c.align,
          sortable: c.sortable,
          dataType: c.dataType,
          renderer: c.renderer,
          render: c.render || void 0,
          fixed: c.fixed || void 0,
          db: c.db
        };
      });
      const data = {
        说明: "列定义元数据 · 当前配置编辑态（SCHEMA 全局 + 本视图覆盖，含未保存修改）",
        schemaId: S.id,
        view: dv.id,
        columnSpec: { align: spec.align, dataType: spec.dataType, renderer: spec.renderer, width: spec.width, fields: (spec.fields || []).map((f) => ({ key: f.key, label: f.label, values: f.values, labels: f.labels, default: f.default })) },
        schemaColumns: base,
        effectiveColumns: eff
      };
      let host = $("vcJsonWin");
      if (!host) {
        document.body.insertAdjacentHTML(
          "beforeend",
          `<div class="vc-json-mask" id="vcJsonMask" onclick="TPL._vcDefJSONClose()"></div>
         <div class="vc-json-win" id="vcJsonWin"><div class="vc-json-hd"><b id="vcJsonHdTitle">列定义元数据 · 当前配置</b>
           <button onclick="TPL._vcDefJSONClose()" title="关闭">×</button></div>
           <div class="vc-json-bd"><pre id="vcJsonPre"></pre></div>
           <div class="vc-json-ft"><span>含尚未保存的编辑 · 改 SCHEMA.list.columns / columnSpec 即可改列，无需改渲染引擎</span>
             <button class="vc-btn" onclick="TPL._vcDefJSONCopy()">复制 JSON</button></div></div>`
        );
        host = $("vcJsonWin");
      }
      const th = $("vcJsonHdTitle") || document.querySelector("#vcJsonHd b");
      if (th) th.textContent = "列定义元数据 · 当前配置";
      $("vcJsonPre").textContent = JSON.stringify(data, null, 2);
      host.classList.add("on");
      $("vcJsonMask").classList.add("on");
      window.__VC_JSON__ = $("vcJsonPre").textContent;
    },
    _vcDefJSONClose() {
      const w = $("vcJsonWin"), m = $("vcJsonMask");
      if (w) w.classList.remove("on");
      if (m) m.classList.remove("on");
    },
    _vcDefJSONCopy() {
      const t = window.__VC_JSON__ || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(() => api._toast("元数据 JSON 已复制")).catch(() => api._toast("复制失败，请手动选择文本"));
      } else {
        const ta = document.createElement("textarea");
        ta.value = t;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          api._toast("元数据 JSON 已复制");
        } catch (e) {
          api._toast("复制失败，请手动选择文本");
        }
        document.body.removeChild(ta);
      }
    },
    _vcRuleAdd() {
      const v = vcCur(), wf = VC.whereFields();
      const rules = (v.where && Array.isArray(v.where.rules) ? v.where.rules : []).slice();
      rules.push({ field: wf[0] ? wf[0].k : "", op: "eq", value: "", join: "and" });
      v.where = { rules };
      renderVC();
    },
    _vcRuleDel(i) {
      const v = vcCur();
      const rules = (v.where && v.where.rules || []).slice();
      rules.splice(i, 1);
      v.where = normWhere({ rules });
      renderVC();
    },
    _vcRuleJoin(i, val) {
      const r = ((vcCur().where || {}).rules || [])[i];
      if (r) r.join = val === "or" ? "or" : "and";
      vcRefreshCount();
    },
    _vcRule(part, i, val) {
      const v = vcCur();
      const rules = (v.where && v.where.rules || []).slice();
      const r = rules[i];
      if (!r) return;
      if (part === "field") {
        r.field = val;
        if (!val) {
          rules.splice(i, 1);
          v.where = normWhere({ rules });
          renderVC();
          return;
        }
      } else if (part === "op") {
        r.op = val;
        if (val === "ltField") r.value = VC.whereFields().some((f) => f.k === r.value) ? r.value : "warn";
        else if (Array.isArray(r.value)) r.value = r.value.join(",");
        v.where = { rules };
        renderVC();
        return;
      } else {
        r.value = r.op === "in" ? String(val).split(/[,，]/).map((x) => x.trim()).filter(Boolean) : val;
      }
      v.where = { rules };
      if (part !== "value") renderVC();
      else vcRefreshCount();
    },
    _vcTbAdd() {
      const v = vcCur();
      v.toolbarDefs = v.toolbarDefs || [];
      const used = v.toolbarDefs.map((t) => t.field), fo = VC.tbFieldOptions();
      const f = fo.find((x) => used.indexOf(x.k) < 0);
      if (!f) {
        api._toast("已无可添加的行字段");
        return;
      }
      v.toolbarDefs.push({ field: f.k, label: f.l });
      renderVC();
    },
    _vcTbDel(i) {
      const v = vcCur(), t = (v.toolbarDefs || [])[i];
      if (!t) return;
      v.toolbarDefs.splice(i, 1);
      delete (v.toolbar || {})[t.field];
      renderVC();
    },
    _vcTbField(i, val) {
      const v = vcCur(), t = (v.toolbarDefs || [])[i];
      if (!t) return;
      const f = VC.tbFieldOptions().find((x) => x.k === val);
      delete (v.toolbar || {})[t.field];
      t.field = val;
      t.label = f ? f.l : val;
      renderVC();
    },
    _vcTbLabel(i, val) {
      const t = (vcCur().toolbarDefs || [])[i];
      if (t) t.label = val;
    },
    _vcTbPreset(i, val) {
      const v = vcCur(), t = (v.toolbarDefs || [])[i];
      if (!t) return;
      v.toolbar = v.toolbar || {};
      if (!val || val === "全部") delete v.toolbar[t.field];
      else v.toolbar[t.field] = val;
      vcRefreshCount();
    },
    _vcReset() {
      vDraft = VC.defaults();
      vSel = vDraft.views[0].id;
      vTab = "cols";
      renderVC();
      api._toast("已恢复默认配置，点「保存并应用」生效");
    },
    _vcSave() {
      if (!vDraft.views.length) {
        api._toast("至少保留一个视图");
        return;
      }
      vDraft.features = VC.normFeatures(vDraft.features);
      vDraft.actions = VC.normActions(vDraft.actions);
      vDraft.pageActions = VC.normPageActions(vDraft.pageActions);
      vDraft.features.page = vDraft.features.page || {};
      vDraft.features.page.routes = vDraft.pageActions.map(function(a) {
        let q = {};
        try {
          q = JSON.parse(a.params || "");
        } catch (e) {
        }
        return {
          scene: a.scene,
          label: a.label,
          page: q.page || "",
          mode: PAGE.modeOf(a.method),
          params: VC.normRouteParams(q.params !== void 0 ? q.params : a.params || "")
        };
      });
      vDraft.views.forEach((v) => {
        if (!v.label) v.label = "未命名视图";
        v.where = normWhere(v.where);
      });
      vDraft.active = vDraft.views.some((v) => v.id === vSel) ? vSel : vDraft.views[0].id;
      vDraft.schemaId = VC.sid();
      VC.setCfg(VC.clone(vDraft));
      vcShow(false);
      VC.activate(VC.cfg.active);
      applyFeaturePresentation(true);
      api._toast("视图配置已保存");
    }
  };
  function matchOne(r, w) {
    if (!w.field) return true;
    if (w.op !== "ltField" && (w.value === "" || w.value == null || Array.isArray(w.value) && !w.value.length)) return true;
    const a = r[w.field];
    switch (w.op) {
      case "eq":
        return String(a) === String(w.value);
      case "ne":
        return String(a) !== String(w.value);
      case "lt":
        return +a < +w.value;
      case "gt":
        return +a > +w.value;
      case "ltField":
        return +a < +r[w.value];
      case "in":
        return (Array.isArray(w.value) ? w.value : String(w.value).split(",")).map(String).indexOf(String(a)) >= 0;
      case "contains":
        return String(a == null ? "" : a).indexOf(String(w.value)) >= 0;
      default:
        return true;
    }
  }
  function viewMatch(r, w) {
    if (!w) return true;
    const rules = Array.isArray(w.rules) ? w.rules : [w];
    const valid = rules.filter((x) => x && x.field);
    if (!valid.length) return true;
    const groups = [];
    let g = [];
    valid.forEach((x, i) => {
      if (i > 0 && x.join === "or") {
        groups.push(g);
        g = [];
      }
      g.push(x);
    });
    groups.push(g);
    return groups.some((grp) => grp.every((x) => matchOne(r, x)));
  }
  function filtered() {
    const view = VC.view(st.view);
    const cols = VC.cols(st.view);
    let list = ROWS.filter((r) => {
      if (!viewMatch(r, view.where)) return false;
      if (st.kw) {
        const hay = cols.filter((c) => c.k !== "chk" && c.k !== "ops").map((c) => String(r[c.k] == null ? "" : r[c.k])).join(" ").toLowerCase();
        if (hay.indexOf(st.kw.toLowerCase()) < 0) return false;
      }
      for (const t of VC.toolbarDefs(st.view)) {
        const val = st.toolbar[t.field];
        if (val && val !== "全部" && String(r[t.field]) !== String(val)) return false;
      }
      for (const f of VC.filterDefs(st.view)) {
        const val = st.q[f.k];
        if (!val || val === "全部") continue;
        const rv2 = String(r[f.sa || f.k] == null ? "" : r[f.sa || f.k]);
        if (rv2.toLowerCase().indexOf(String(val).toLowerCase()) < 0) return false;
      }
      return true;
    });
    if (st.sort) {
      const k = st.sort, s = st.asc ? 1 : -1;
      list.sort((a, b) => {
        const x = a[k], y = b[k];
        if (typeof x === "number" && typeof y === "number") return (x - y) * s;
        return String(x == null ? "" : x).localeCompare(String(y == null ? "" : y), "zh-CN") * s;
      });
    }
    return list;
  }
  function hiddenCount() {
    return st.adv ? 0 : VC.filterDefs(st.view).length;
  }
  const WL_TAG_COLORS = {
    "中药饮片": "#20c22e",
    "精制饮片": "#f2711c",
    "毒性饮片": "#db2828",
    "颗粒剂": "#00b5ad",
    "饮片": "#b5cc18",
    "Rx": "#ec0019",
    "阴凉": "#767676",
    "常温": "#1b1c1d",
    "浙江省": "#0052d9",
    "中成药仓库": "#6435c9",
    "中药材仓库": "#e03997",
    "医药常温库": "#2185d0",
    "其他": "#767676",
    "贵细品种": "#f2711c",
    "首营品种": "#00b5ad",
    "中药饮片(9%)": "#b5cc18",
    "中成药(13%)": "#6435c9",
    "普通品种": "#20c22e"
  };
  const WL_TAG_FALLBACK = ["#20c22e", "#f2711c", "#db2828", "#00b5ad", "#b5cc18", "#767676", "#1b1c1d", "#0052d9", "#6435c9", "#e03997"];
  function wlTagColor(v) {
    if (WL_TAG_COLORS[v]) return WL_TAG_COLORS[v];
    let h = 0;
    for (const ch of String(v)) h = h * 31 + ch.charCodeAt(0) >>> 0;
    return WL_TAG_FALLBACK[h % WL_TAG_FALLBACK.length];
  }
  function wlDate(v) {
    const m = String(v == null ? "" : v).match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    return m ? `${m[1]}年${m[2].padStart(2, "0")}月${m[3].padStart(2, "0")}日` : String(v || "—");
  }
  function wlAvatar(name, tone) {
    const bg = ["#8d99ae", "#a9826b", "#6b8e9f", "#9b7fa8"][((tone || 0) % 4 + 4) % 4];
    return `<i class="wl-avatar" title="${escA(name)}" style="background-color:${bg}"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="7.1" r="3.1" fill="#fff" opacity=".93"/><path d="M3.4 18.4c.5-3.7 3.1-5.5 6.6-5.5s6.1 1.8 6.6 5.5z" fill="#fff" opacity=".93"/></svg></i>`;
  }
  function fmtValue(r, c) {
    const v = r[c.k];
    switch (c.dataType) {
      case "money": {
        const n = +v;
        return isNaN(n) ? String(v == null ? "—" : v) : n.toFixed(4);
      }
      case "date":
        return wlDate(v);
      case "text":
      default:
        return String(v == null ? "" : v);
    }
  }
  function rv(r, c) {
    const o = c.render || {};
    return r[o.field || c.k];
  }
  function clickCfg(c, btn) {
    c = c || {};
    const o = c.render || {}, b = btn || {};
    return {
      scene: String(b.scene !== void 0 ? b.scene : c.clickScene !== void 0 ? c.clickScene : o.scene || ""),
      field: String(b.field || c.clickField || c.k || ""),
      param: String(b.param || c.clickParam || "code"),
      enabled: b.enabled !== void 0 ? b.enabled : c.clickEnabled !== false,
      title: String(b.title !== void 0 ? b.title : c.clickTitle !== void 0 ? c.clickTitle : ""),
      onMissing: String(b.onMissing !== void 0 ? b.onMissing : c.onMissing || "")
    };
  }
  function buttonResolve(c, b, list) {
    const g = clickCfg(c, b);
    if (!g.enabled || !g.scene) return { status: "unbound", action: null, byLabel: false, label: "未绑定", display: "hide" };
    const rs = PAGE.resolve(g.scene, list);
    const spec = S.buttonSpec || {}, tbl = spec.display || {}, fld = (spec.fields || []).find((x) => x.key === "onMissing") || {};
    const disp = g.onMissing || fld.default || tbl[rs.status] || "show";
    return {
      status: rs.status,
      action: rs.action,
      byLabel: rs.byLabel,
      sceneLabel: rs.label || g.scene,
      display: rs.status === "ok" ? tbl.ok || "show" : disp
    };
  }
  const RENDERERS = {
    checkbox(r, c) {
      return `<input type="checkbox" class="wl-ck" ${st.checked.has(r.__idx) ? "checked" : ""} onclick="event.stopPropagation();TPL._sel(${r.__idx},this.checked)" aria-label="选择该行">`;
    },
    link(r, c) {
      const g = clickCfg(c), body = "#" + esc(fmtValue(r, c));
      if (!g.enabled || !g.scene) return `<span class="wl-code-off">${body}</span>`;
      return `<span class="lnk wl-code" title="${escA(g.title)}" onclick="event.stopPropagation();TPL._cellClick(${r.__idx},${escJS(c.k)})">${body}</span>`;
    },
    primary(r, c) {
      const i = r.__idx || 0;
      return `<span class="wl-pname">${i % 7 === 6 ? '<i class="wl-exp">▶</i>' : ""}<i class="wl-ico"></i><b class="pname">${esc(fmtValue(r, c))}</b></span>`;
    },
    status(r, c) {
      const o = c.render || {}, raw = rv(r, c);
      const s = String(raw == null || raw === "" ? o.fallbackText || "" : raw);
      const k = o.map && o.map[s] || o.fallback || "done";
      return `<span class="wl-st wl-st-${k}"><i></i>${esc(s)}</span>`;
    },
    tag(r, c) {
      const o = c.render || {}, fs = o.fields || [c.k], max = +o.max || 2;
      const vals = fs.map((k) => String(r[k] == null ? "" : r[k])).filter((x) => x && x !== "—");
      const show = vals.slice(0, max), rest = vals.length - show.length;
      return `<span class="wl-tags">` + show.map((v) => `<span class="wl-tag-solid" style="background-color:${wlTagColor(v)}">${esc(v)}</span>`).join("") + (rest ? `<span class="wl-tag-more">+${rest}</span>` : "") + `</span>`;
    },
    priority(r, c) {
      const o = c.render || {}, raw = rv(r, c);
      const l = String(raw == null ? "" : raw);
      if (!l) return "";
      const k = o.map && o.map[l] || "none";
      return `<span class="wl-pri wl-pri-${k}">${esc(l)}</span>`;
    },
    date(r, c) {
      return `<span class="wl-date">${esc(fmtValue(r, c))}</span>`;
    },
    money(r, c) {
      return `<span class="wl-num">${esc(fmtValue(r, c))}</span>`;
    },
    avatars(r, c) {
      const i = r.__idx || 0, o = c.render || {}, fs = o.fields || [c.k];
      if (i % 3 !== 0) return `<span class="wl-empty">-</span>`;
      return `<span class="wl-avatars">${fs.map((k, j) => wlAvatar(String(r[k] || "—"), i + j)).join("")}</span>`;
    },
    person(r, c) {
      const i = r.__idx || 0, v = fmtValue(r, c) || "—";
      return `<span class="wl-person">${wlAvatar(String(v), i)}<span class="wl-person-t">${esc(String(v))}</span></span>`;
    },
    plan(r, c) {
      c.render || {};
      const d = String(rv(r, c) == null ? "" : rv(r, c)), i = r.__idx || 0;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || i % 3 !== 0) return `<span class="wl-empty">-</span>`;
      const mm = d.slice(5, 7), dd = d.slice(8, 10), days = 90 + i * 7;
      return `<span class="wl-plan-txt">${d.slice(0, 4)}-${mm}-${dd}~${mm}-10</span> <span class="wl-overdue">逾期${days}天</span>`;
    },
    linkText(r, c) {
      const i = r.__idx || 0, o = c.render || {}, v = fmtValue(r, c) || "—";
      return i % 2 === 0 ? `<span class="wl-link-txt">${esc(o.prefix || "")}${esc(String(v))}</span>` : `<span class="wl-empty">-</span>`;
    },
    progress(r, c) {
      const o = c.render || {}, f = o.field || c.k, max = +o.max || 100;
      const cur2 = +r[f] || 0, base = o.baseline ? +r[o.baseline] || 0 : 0;
      const pct = Math.max(0, Math.min(100, Math.round(cur2 / max * 100)));
      const warn = base > 0 && cur2 < base;
      const label = o.unit ? `${cur2}${o.unit}` : String(cur2);
      return `<span class="wl-progress"><span class="wl-progress-bar"><i class="wl-progress-fill${warn ? " warn" : ""}" style="width:${pct}%"></i></span><span class="wl-progress-t">${esc(label)}</span></span>`;
    },
    text(r, c) {
      const o = c.render || {}, s = fmtValue(r, c);
      const t = s == null || s === "" ? "—" : esc(String(s));
      return o.wrap ? `<span class="${escA(o.wrap)}">${t}</span>` : t;
    },
    actions(r, c) {
      const bs = c.render && c.render.buttons || [];
      return '<div class="row-ops">' + bs.map((b, i) => {
        const g = clickCfg(c, b);
        if (!g.enabled || !g.scene) return "";
        const rs = buttonResolve(c, b);
        if (rs.display === "hide") return "";
        const dis = rs.display === "disable";
        const why = {
          missing: "场景未配置",
          disabled: "场景已停用",
          methodMissing: "交互方法未注册",
          unbound: "未绑定场景"
        }[rs.status] || "";
        const tip = dis ? why + (g.title ? " · " + g.title : "") : g.title || "";
        return `<button class="ro-btn wl-ops-btn${dis ? " is-disabled" : ""}" ${dis ? "disabled" : ""}${tip ? ` title="${escA(tip)}"` : ""} data-res="${escA(rs.status)}" data-btn="${i}" onclick="event.stopPropagation();TPL._cellClick(${r.__idx},${escJS(c.k)},${escJS(g.scene)},${i})">${esc(b.label || S.buttonSpec && ((S.buttonSpec.fields || []).find((x) => x.key === "label") || {}).default || "操作")}</button>`;
      }).join("") + "</div>";
    }
  };
  function cellHTML(r, c) {
    const fn = RENDERERS[c.renderer] || RENDERERS.text;
    try {
      return fn(r, c);
    } catch (e) {
      return RENDERERS.text(r, c);
    }
  }
  function nativeFixedAttrs(cols, i, head) {
    const c = cols[i], m = VC.colMap();
    const eff = c.fixed || "", base = (m[c.k] || {}).fixed || "";
    if (eff === base) return { cls: "", style: "" };
    if (!eff) return { cls: "", style: "position:static;left:auto;right:auto;z-index:auto;box-shadow:none;background:#fff" };
    let off = 0;
    if (eff === "left") {
      for (let j = 0; j < i; j++) off += +cols[j].w || 100;
    } else {
      for (let j = i + 1; j < cols.length; j++) off += +cols[j].w || 100;
    }
    return {
      cls: eff === "left" ? " stk" : " stkr",
      style: `position:sticky;${eff === "left" ? "left" : "right"}:${off}px;z-index:${head ? 7 : 3};background:#fff;box-shadow:none`
    };
  }
  function tableHTML() {
    if (window.__WL_HAS_EL__) {
      return `<div class="tbl-wrap drug-table wl-el-wrap"><div id="wlElTable"></div></div>`;
    }
    const cols = VC.cols(st.view);
    const cg = cols.map((c) => `<col style="width:${c.w || 100}px">`).join("");
    const th = cols.map((c, i) => {
      const fx = nativeFixedAttrs(cols, i, true);
      return `<th class="${c.cls || ""} ${c.nosort ? "nosort" : ""}${fx.cls}" ${!c.nosort ? `onclick="TPL._sort('${c.k}')"` : ""} title="${escA(c.db || "")}" style="width:${c.w || 100}px;text-align:${c.align || "left"}${fx.style ? ";" + fx.style : ""}">${esc(c.t)}</th>`;
    }).join("");
    return `<div class="tbl-wrap drug-table"><div class="tbl-scroll"><table><colgroup>${cg}</colgroup><thead><tr>${th}</tr></thead><tbody id="tplTbody"></tbody></table></div></div>`;
  }
  function renderRows() {
    const el = window.__WL_EL__;
    if (el && el.ready) {
      el.sync();
    } else {
      const tb = $("tplTbody");
      if (tb) {
        const list0 = filtered();
        list0.length;
        const s0 = (st.page - 1) * st.size, page0 = list0.slice(s0, s0 + st.size);
        const cols0 = VC.cols(st.view);
        tb.innerHTML = page0.length ? page0.map((r) => `<tr data-i="${r.__idx}" class="${st.checked.has(r.__idx) ? "chk" : ""} ${st.activeRow === r.__idx ? "act-row" : ""}">` + cols0.map((c, i) => {
          const fx = nativeFixedAttrs(cols0, i, false);
          const tip = c.db && c.db !== "—" ? `title="${escA(c.db)}"` : "";
          const cg = clickCfg(c), clickable = c.renderer === "link" && cg.enabled && !!cg.scene;
          const link = clickable ? ` onclick="event.stopPropagation();TPL._cellClick(${r.__idx},${escJS(c.k)})" title="${escA(cg.title)}"` : "";
          return `<td data-c="${c.k}" class="${c.cls || ""}${clickable ? " td-lnk" : ""}${fx.cls}" ${fx.style ? `style="${fx.style}"` : ""} ${tip}${link}>${cellHTML(r, c)}</td>`;
        }).join("") + `</tr>`).join("") : `<tr><td colspan="${cols0.length}" class="drug-empty">${esc(S.list.emptyText || "未查询到符合条件的数据")}</td></tr>`;
        tb.querySelectorAll("tr[data-i]").forEach((tr) => {
          const i = +tr.dataset.i;
          tr.onclick = (e) => {
            const td = e.target.closest("td");
            if (!td) return;
            if (td.dataset.c === "chk") {
              api._sel(i, !st.checked.has(i));
              return;
            }
            api._row(i);
          };
        });
      }
    }
    const total = filtered().length;
    const tc = $("tplTotal");
    if (tc) tc.textContent = total;
    const cc = $("tplCondN");
    if (cc) cc.textContent = hiddenCount();
    const sc = $("tplSelCount");
    if (sc) sc.textContent = st.checked.size;
    renderPager();
  }
  function renderPager() {
    const p = $("tplPager");
    if (!p) return;
    const total = filtered().length, pages = Math.max(1, Math.ceil(total / st.size));
    if (st.page > pages) st.page = pages;
    const flows = S.list.flowValues || [];
    const wc = flows.map((f) => `<span>${esc(f)}：<i>${ROWS.filter((r) => r[S.list.flowField] === f).length}</i></span>`).join("");
    const ctrl = window.__WL_EL_CONTROLS__;
    if (ctrl && p.querySelector("#wlElPagerHost")) {
      const a = $("tplPagerTotal"), b = $("tplSelCount"), c = $("tplWorkcounts");
      if (a) a.textContent = total;
      if (b) b.textContent = st.checked.size;
      if (c) c.innerHTML = wc;
      ctrl.sync();
      return;
    }
    let arr = [];
    for (let i = 1; i <= pages; i++) {
      if (i <= 2 || i >= pages - 1 || Math.abs(i - st.page) <= 1) arr.push(i);
      else if (arr[arr.length - 1] !== "…") arr.push("…");
    }
    const pg = arr.map((x) => x === "…" ? '<span class="ellipsis">…</span>' : `<span class="${x === st.page ? "on" : ""}" onclick="TPL._page(${x})">${x}</span>`).join("");
    const EL = !!window.__WL_HAS_EL__;
    const pagerCtl = EL ? `<span>每页</span><span id="wlElPageSizeHost"></span><span id="wlElPagerHost"></span>` : `<span>每页</span><select onchange="TPL._size(+this.value)">${[10, 20, 50, 100].map((n) => `<option ${n === st.size ? "selected" : ""}>${n}</option>`).join("")}</select>
    <div class="pages"><span class="${st.page <= 1 ? "off" : ""}" onclick="TPL._page(${st.page - 1})">‹</span>${pg}<span class="${st.page >= pages ? "off" : ""}" onclick="TPL._page(${st.page + 1})">›</span></div>`;
    p.innerHTML = `<span>共 <b id="tplPagerTotal">${total}</b> ${esc(S.meta.unit || "项")} · 已勾选 <b id="tplSelCount">${st.checked.size}</b> 条</span>
    ${pagerCtl}
    <div class="workcounts" id="tplWorkcounts">${wc}</div>`;
  }
  function advHTML() {
    const fs = VC.filterDefs(st.view);
    return `<div class="drug-adv ${st.adv ? "on" : ""}" id="tplAdv"><div class="drug-adv-hd"><b>高级筛选</b><span class="sp">${st.adv ? "已展开" : "收起"} · 共 ${fs.length} 个条件</span><button onclick="TPL._adv()">${st.adv ? "收起筛选" : "展开筛选"}</button></div>
    <div class="drug-adv-grid">${fs.map((f) => {
      const v = st.q[f.k] || "";
      const ctl = f.type === "sel" ? `<select id="tplA_${f.k}" onchange="TPL._q(${escJS(f.k)},this.value)"><option value="">全部</option>${(f.opt || []).map((o) => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>` : `<input type="text" id="tplA_${f.k}" value="${escA(v)}" placeholder="${escA(f.ph || "")}" oninput="TPL._q(${escJS(f.k)},this.value)">`;
      return `<div class="fi"><label title="${escA(f.l)} = ${escA(f.db || "")}">${esc(f.l)}</label>${ctl}</div>`;
    }).join("")}</div></div>`;
  }
  function listHTML() {
    S.list;
    const M = S.meta;
    const order = ["all", "gx", "yp", "dx", "kl", "warn", "audit", "off"];
    const vs = VC.views().slice().sort((a, b) => {
      const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    const views = vs.map((v) => `<button type="button" class="wl-tab ${v.id === st.view ? "on" : ""}" data-v="${v.id}" onclick="TPL._view(${escJS(v.id)})">${esc(v.label)}<i>${VC.count(v)}</i></button>`).join("");
    const tbDefs = VC.toolbarDefs(st.view);
    const tsel = tbDefs.map((t) => {
      const cur2 = st.toolbar[t.field] || "";
      return `<div class="wl-dd"><select class="wl-select" id="tplT_${t.field}" onchange="TPL._toolbar(${escJS(t.field)},this.value)"><option value="" ${!cur2 ? "selected" : ""}>${esc(t.label)}</option><option value="全部" ${cur2 === "全部" ? "selected" : ""}>全部</option>${(t.options || []).map((o) => `<option ${String(cur2) === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></div>`;
    }).join("");
    const sv = VC.views().filter((v) => /^(warn|audit|off)$/.test(v.id));
    const statusDD = `<div class="wl-dd"><select class="wl-select" onchange="TPL._view(this.value||'all')"><option value="" ${!sv.some((v) => v.id === st.view) ? "selected" : ""}>状态</option>${sv.map((v) => `<option value="${v.id}" ${v.id === st.view ? "selected" : ""}>${esc(v.label)}</option>`).join("")}<option value="all">全部状态</option></select></div>`;
    const gk = FEAT.form("groupBy");
    const gf = (gk ? tbDefs.find((t) => t.field === gk) : null) || tbDefs[0];
    const groupbar = gf ? `<div class="wl-groupbar"><span>按 <b>${esc(gf.label)}</b> 分组</span><button type="button" class="wl-gchip" data-v="" onclick="TPL._toolbar(${escJS(gf.field)},this.dataset.v)">全部</button>${(gf.options || []).slice(0, 6).map((o) => `<button type="button" class="wl-gchip" data-v="${escA(o)}" onclick="TPL._toolbar(${escJS(gf.field)},this.dataset.v)">${esc(o)}</button>`).join("")}<span class="wl-groupbar-tip">点击分组值快速筛选 · 字段可在「⚙ 配置视图」调整</span></div>` : "";
    const EL = !!window.__WL_HAS_EL__;
    const hdr = ACT.items("menu", "header");
    const newAct = hdr.find((x) => x.action === "new") || null;
    const otherHdr = hdr.filter((x) => x !== newAct);
    const newItems = ACT.items("menu", "new");
    const moreItems = ACT.items("menu", "more");
    const caretSVG = '<svg class="wl-new-caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10L8 5.5l4.5 4.5"/></svg>';
    const newMenuHTML = newItems.map((it) => `<button type="button" onclick="TPL._actRun(${escJS(it.id)})">${it.svg ? `<span class="wl-menu-ico">${it.svg}</span>` : ""}${esc(it.label)}</button>`).join("");
    const newBtnHTML = newAct ? newItems.length ? `<div class="wl-new-dd">
           <button type="button" class="el-button el-button--primary wl-btn wl-btn-pri wl-new-btn" title="${escA(M.newLabel || "+ 新建")}" onclick="TPL._wlNewMenu()">${ACT.icon(newAct.icon, newAct.iconSvg, "wl-new-plus")}<span>${esc(newAct.label)}</span>${caretSVG}</button>
           <div class="wl-new-menu">${newMenuHTML}</div>
         </div>` : `<button type="button" class="el-button el-button--primary wl-btn wl-btn-pri wl-new-btn" title="${escA(M.newLabel || "+ 新建")}" onclick="TPL._actRun(${escJS(newAct.id)})">${ACT.icon(newAct.icon, newAct.iconSvg, "wl-new-plus")}<span>${esc(newAct.label)}</span></button>` : "";
    const btnNative = [
      newBtnHTML
    ].concat(otherHdr.map(
      (a) => `<button type="button" class="el-button wl-btn wl-btn-ghost" onclick="TPL._actRun(${escJS(a.id)})">${a.svg ? `<span class="wl-btn-ico">${a.svg}</span>` : ""}${esc(a.label)}</button>`
    )).concat(moreItems.length ? [`<button type="button" class="el-button wl-btn wl-btn-more" title="更多" onclick="TPL._wlMenu()">···</button>`] : []).join("");
    const btnHost = `<div class="wl-eb-host" id="wlElBtnHost"></div>`;
    const ctxNative = `<select class="wl-select wl-ctx-sel" onchange="TPL._wlCtx(this.value)" title="项目 / 库房上下文"><option>档案中心</option><option>全部库房</option><option>中药材仓库</option><option>中成药仓库</option><option>医药常温库</option></select>`;
    const ctxHost = `<span class="wl-ectx-host" id="wlElCtxHost"></span>`;
    const ddsNative = tsel + statusDD;
    const ddsHost = `<div class="wl-esels-host" id="wlElSelHost"></div>`;
    const toolsNative = ACT.toolbar().map((a) => {
      const sep = a.sepBefore ? '<span class="wl-vt-sep"></span>' : "";
      const cls = a.staticOn ? "wl-vt on" : "wl-vt";
      const title = a.title ? ` title="${escA(a.title)}"` : "";
      const mode = a.action === "table" || a.action === "tree" ? ` data-mode="${a.action}"` : "";
      const badge = a.badge ? ' <b id="tplCondN">0</b>' : "";
      const caret = a.caret ? " ▾" : "";
      return `${sep}<button type="button" class="${cls}"${title}${mode} onclick="TPL._actRun(${escJS(a.id)},this)">${a.svg}${esc(a.label)}${badge}${caret}</button>`;
    }).join("");
    const toolsHost = `<span class="wl-etool-host" id="wlElToolHost"></span>`;
    const menuItemsHTML = moreItems.map((it) => `<button type="button" onclick="TPL._actRun(${escJS(it.id)})">${it.svg ? `<span class="wl-menu-ico">${it.svg}</span>` : ""}${esc(it.label)}</button>`).join("");
    return `<div class="page on drug-page wl-page">
    <header class="wl-head">
      <h1 class="wl-title">${esc(M.pageTitle)}</h1>
      <nav class="wl-tabs" id="tplViews">${views}</nav>
      <div class="wl-actions">
        ${EL ? btnHost : btnNative}
        <div class="wl-menu" id="wlMenu">${menuItemsHTML}</div>
      </div>
    </header>
    <div class="wl-filterbar">
      ${EL ? ctxHost : ctxNative}
      <span class="wl-count">共 <b id="tplTotal">0</b> ${esc(M.unit || "项")}</span>
      <div class="wl-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="tplKw" value="${escA(st.kw)}" placeholder="${escA(M.searchPlaceholder || "输入关键词")}" oninput="TPL._kw(this.value)"></div>
      <div class="wl-dds">${EL ? ddsHost : ddsNative}</div>
      <div class="wl-viewtools">${EL ? toolsHost : toolsNative}</div>
    </div>
    <div id="tplAdvWrap">${advHTML()}</div>
    <div class="drug-chips" id="tplChips"></div>
    ${groupbar}
    <div class="wl-grid">${tableHTML()}
      <button type="button" class="wl-colgear" title="视图配置" onclick="TPL._vcOpen()">⚙</button>
      <button type="button" class="wl-rail-toggle" title="展开侧边面板" onclick="TPL._wlRail()">‹</button>
      <aside class="wl-rail">
        <div class="wl-rail-hd"><b>视图概览</b><button type="button" title="收起" onclick="TPL._wlRail()">›</button></div>
        <div class="wl-rail-bd">
          <p>当前视图</p><div class="wl-rail-view">${esc((VC.views().find((v) => v.id === st.view) || {}).label || "全部")} · 共 <b id="wlRailN">0</b> ${esc(M.unit || "项")}</div>
          <p>快捷筛选</p><div class="wl-rail-chips">${(gf ? (gf.options || []).slice(0, 5) : []).map((o) => `<button type="button" data-v="${escA(o)}" onclick="TPL._toolbar(${escJS(gf.field)},this.dataset.v)">${esc(o)}</button>`).join("")}</div>
          <p class="wl-rail-note">列选项、数据范围、快捷筛选与高级筛选，均可在「⚙ 配置视图」里按视图独立设置并保存在本地。</p>
        </div>
      </aside>
    </div>
    <div class="pager" id="tplPager"></div>
  </div>`;
  }
  const FORM_STORE = "TPL_FORM_CFG_V113:";
  function formStoreKey() {
    return FORM_STORE + (S.id || "default");
  }
  (function injectFormVars() {
    if (document.getElementById("tplFormVars")) return;
    document.head.insertAdjacentHTML(
      "beforeend",
      `<style id="tplFormVars">
    /* 变量关联（条件生效，不改写原有抽屉 CSS） */
    #drawer .da-fld{display:var(--dw-fld-display,block)}
    #drawer .da-main .da-sec[style*="--dw-cols"] .da-grid{
      grid-template-columns:repeat(var(--dw-cols,3),minmax(0,1fr))}
    html[data-dw-density] #drawer .da-main .da-grid{gap:var(--dw-grid-gap,11px 16px)}
    html[data-dw-density] #drawer .da-main .da-sec.g{padding-top:var(--dw-sec-pad,13px)}
    html[data-dw-density] #drawer .da-main .da-fld dt{padding-bottom:var(--dw-fld-pad,0px)}
    #drawer[data-label-pos="inline"] .da-fld{
      display:var(--dw-fld-display,grid);grid-template-columns:minmax(72px,140px) minmax(0,1fr);
      align-items:baseline;gap:8px}
    #drawer[data-label-pos="inline"] .da-fld dd{margin-top:0}
    #drawer[data-label-pos="inline"] .da-fld.edit dd{margin:0}
    #drawer .da-detail[data-kind="single"] .da-card{display:none}
    #drawer .da-detail[data-kind="single"] .da-main{width:100%;flex:1}
    #drawer .da-card[style*="--dw-left-width"]{
      flex-basis:var(--dw-left-width,244px);width:var(--dw-left-width,244px)}
    </style>`
    );
  })();
  function applyFormTheme(theme) {
    const t = theme || {}, sp = S.formSpec || {}, root = document.documentElement;
    const dens = (sp.densities || []).find((x) => x.key === (t.density || "normal")) || (sp.densities || []).find((x) => x.key === "normal") || {};
    root.style.setProperty("--dw-density", t.density || "normal");
    root.style.setProperty("--dw-label-pos", t.labelPos || "top");
    root.style.setProperty("--dw-grid-gap", dens.gap || "11px 16px");
    root.style.setProperty("--dw-sec-pad", dens.secPad || "13px");
    root.style.setProperty("--dw-fld-pad", dens.fldPad || "0px");
    root.style.setProperty("--dw-fld-display", t.labelPos === "inline" ? "grid" : "block");
    if ((t.density || "normal") !== "normal") root.setAttribute("data-dw-density", t.density);
    else root.removeAttribute("data-dw-density");
    window.__WL_FORM_THEME__ = Object.assign({}, t, { _gap: dens.gap, _secPad: dens.secPad });
  }
  const FORM = /* @__PURE__ */ (function() {
    const clone = (o) => JSON.parse(JSON.stringify(o));
    let cfg = null;
    const spec = () => S.formSpec || {};
    function allFields() {
      return (S.detail.groups || []).reduce((a, g) => a.concat(
        (g.fields || []).map((f) => Object.assign({ group: g.title }, f))
      ), []);
    }
    function fieldMap() {
      const m = {};
      allFields().forEach((f) => m[f.k] = f);
      return m;
    }
    function fromSchema() {
      const D = S.detail, gs = D.groups || [], B = D.batch || {}, F = D.timeline || [], extra = D.tocExtra || [];
      const sections = gs.map((g, i) => ({
        id: "tpl-sec-" + (i + 1),
        title: String(g.title || "区块 " + (i + 1)),
        note: String(g.note || (g.fields || []).length + " 项"),
        tocTitle: String(g.title || "").replace(/^[一二三四五六七八九十]+、/, ""),
        renderer: g.cards ? "cards" : "form",
        cols: 3,
        fields: (g.fields || []).map((f) => f.k),
        show: true,
        showSummary: false,
        builtin: true,
        spec: g.cards ? { archKey: D.archKey || "sa_arch" } : {}
      }));
      extra.forEach((x) => {
        const isBatch = x.id === "tpl-sec-batch", isFlow = x.id === "tpl-sec-flow";
        if (isBatch && B.enabled === false) return;
        sections.push({
          id: x.id,
          title: isBatch ? B.title || "批次明细" : isFlow ? D.timelineTitle || "流转节点时间轴" : String(x.title || ""),
          note: isBatch ? B.note || "附" : isFlow ? "横向 · " + F.length + " 节点" : String(x.note || ""),
          tocTitle: String(x.title || ""),
          renderer: isBatch ? "table" : isFlow ? "flow" : "note",
          cols: 3,
          fields: [],
          show: true,
          showSummary: false,
          builtin: true,
          spec: isBatch ? { columns: clone(B.columns || []), rows: clone(B.rows || []) } : isFlow ? { nodes: clone(F) } : { text: "" }
        });
      });
      return {
        version: "1.31",
        schemaId: S.id || "default",
        layout: {
          kind: "left-right",
          theme: { density: "normal", labelPos: "top" },
          left: { width: 244, renderer: "card", spec: clone(D.leftCard || {}), tocExtra: clone(extra) },
          sections,
          footer: { actions: ["save", "reset", "close"], viewActions: ["edit", "close"] }
        }
      };
    }
    function normDetailSpec(sp) {
      const d = spec().detailDefaults || {}, o = Object.assign({}, d, sp && typeof sp === "object" ? sp : {});
      o.columns = (Array.isArray(o.columns) ? o.columns : []).map((c) => {
        const x = Object.assign({}, c || {});
        x.k = String(x.k || "");
        x.t = String(x.t || x.k || "");
        x.w = Math.max(36, Math.min(600, +x.w || 90));
        x.control = String(x.control || "text");
        if (x.precision !== void 0 && x.precision !== "") x.precision = +x.precision || 0;
        if (x.lookup && typeof x.lookup !== "object") x.lookup = { source: String(x.lookup) };
        return x;
      }).filter((c) => c.k);
      o.seed = Array.isArray(o.seed) ? o.seed : [];
      o.summary = Object.assign({}, d.summary || {}, o.summary || {});
      o.preValidate = Object.assign({}, d.preValidate || {}, o.preValidate || {});
      o.preValidate.enabled = !!o.preValidate.enabled;
      const F = Object.assign({}, d.flow || {}, o.flow && typeof o.flow === "object" ? o.flow : {});
      F.enabled = F.enabled !== false;
      F.selectOnFocus = F.selectOnFocus !== false;
      F.preventScroll = F.preventScroll !== false;
      F.keepScroll = F.keepScroll !== false;
      F.next = F.next && typeof F.next === "object" && !Array.isArray(F.next) ? F.next : {};
      ["first", "tail", "lookupNext", "autoAppend", "reuseEmptyRow", "confirmAppendRow"].forEach((k) => {
        delete F[k];
      });
      o.flow = F;
      return o;
    }
    function normFormConfig(raw) {
      const base = fromSchema(), sp = spec();
      if (!raw || typeof raw !== "object" || !raw.layout) return base;
      const L = raw.layout || {}, o = clone(raw);
      o.version = "1.31";
      o.schemaId = S.id || "default";
      o.layout = o.layout || {};
      const valid = (list, k, d) => (list || []).some((x) => x.key === k) ? k : d;
      o.layout.kind = valid(sp.layoutKinds, L.kind, "left-right");
      const T = L.theme || {};
      o.layout.theme = {
        density: valid(sp.densities, T.density, "normal"),
        labelPos: valid(sp.labelPositions, T.labelPos, "top")
      };
      const lf = L.left || {};
      o.layout.left = {
        width: Math.max(160, Math.min(420, +(lf.width || base.layout.left.width) || 244)),
        renderer: valid(sp.renderers, lf.renderer, "card"),
        spec: lf.spec && typeof lf.spec === "object" ? lf.spec : clone(base.layout.left.spec),
        tocExtra: Array.isArray(lf.tocExtra) ? lf.tocExtra : clone(base.layout.left.tocExtra)
      };
      const ft = L.footer || {};
      o.layout.footer = {
        actions: Array.isArray(ft.actions) ? ft.actions.slice() : ["save", "reset", "close"],
        viewActions: Array.isArray(ft.viewActions) ? ft.viewActions.slice() : ["edit", "close"]
      };
      const seen = {};
      o.layout.sections = (Array.isArray(L.sections) ? L.sections : []).map((x, i) => {
        const sec = x || {}, id = String(sec.id || "fw-sec-" + i);
        const b = base.layout.sections.find((z) => z.id === id) || {};
        const out = {
          id,
          title: String(sec.title || b.title || "区块 " + (i + 1)),
          note: String(sec.note || b.note || ""),
          tocTitle: String(sec.tocTitle || b.tocTitle || sec.title || ""),
          renderer: valid(sp.renderers, sec.renderer, b.renderer || "form"),
          cols: Math.max(1, Math.min(6, +(sec.cols || b.cols || 3) || 3)),
          fields: Array.isArray(sec.fields) ? sec.fields.slice() : (b.fields || []).slice(),
          show: sec.show !== false,
          showSummary: !!sec.showSummary,
          builtin: !!(sec.builtin || b.builtin),
          spec: sec.spec && typeof sec.spec === "object" ? sec.spec : clone(b.spec || {})
        };
        if (out.renderer === "editable-table") out.spec = normDetailSpec(out.spec);
        if (seen[out.id]) out.id = out.id + "-" + i;
        seen[out.id] = 1;
        return out;
      });
      if (!o.layout.sections.length) o.layout.sections = clone(base.layout.sections);
      return o;
    }
    function init() {
      let raw = null;
      try {
        const t = localStorage.getItem(formStoreKey());
        if (t) raw = JSON.parse(t);
      } catch (e) {
      }
      cfg = normFormConfig(raw);
      applyFormTheme(cfg.layout.theme);
      return cfg;
    }
    function get() {
      return cfg || init();
    }
    function set(c) {
      cfg = normFormConfig(c);
      try {
        localStorage.setItem(formStoreKey(), JSON.stringify(cfg));
      } catch (e) {
      }
      applyFormTheme(cfg.layout.theme);
      return cfg;
    }
    function reset() {
      try {
        localStorage.removeItem(formStoreKey());
      } catch (e) {
      }
      cfg = fromSchema();
      applyFormTheme(cfg.layout.theme);
      return cfg;
    }
    function hasStore() {
      try {
        return !!localStorage.getItem(formStoreKey());
      } catch (e) {
        return false;
      }
    }
    return {
      init,
      get,
      set,
      reset,
      normFormConfig,
      normDetailSpec,
      fromSchema,
      allFields,
      fieldMap,
      spec,
      hasStore,
      get storeKey() {
        return formStoreKey();
      }
    };
  })();
  FORM.init();
  if (!VC.formConfig) Object.defineProperty(VC, "formConfig", {
    value: () => FORM.get(),
    configurable: true,
    writable: true
  });
  window.TPL._formSpec = () => VC.clone(FORM.spec());
  window.TPL._formConfig = () => VC.clone(FORM.get());
  window.TPL._formDraft = () => fDraft ? VC.clone(fDraft) : null;
  window.TPL._formStoreKey = () => FORM.storeKey;
  window.TPL._actionBaseline = () => ({
    baseline: +(S.actionSpec && S.actionSpec.baseline || 131),
    store: +(VC.cfg && VC.cfg.actionSince || 0),
    actionCount: (VC.actions || []).length,
    hasFormConfig: (VC.actions || []).some((a) => a.id === "a_m_formConfig")
  });
  window.TPL._formApplyTheme = (t) => {
    applyFormTheme(t || {});
    return window.__WL_FORM_THEME__;
  };
  let cur = null, curMode = "view", submitting = false;
  function fieldDefs() {
    return (S.detail.groups || []).reduce((a, g) => a.concat((g.fields || []).map((f) => Object.assign({ group: g.title }, f))), []);
  }
  function dbOf(k) {
    const m = (S.db.dbMap || {})[k];
    return m && m.c ? m.c : "";
  }
  function optList(f) {
    const O = S.detail.options || {};
    return O[f.opt] || [];
  }
  const DT_STYLE = `<style id="tplDetailTableStyle">
/* ---- 抽屉内可编辑明细表 ---- */
#drawer .dt-wrap{margin-top:2px}
#drawer .dt-tblbox{width:100%;overflow:auto;border:1px solid var(--line2,#e5e8ec);border-radius:6px;background:#fff}
#drawer .dt-tbl{width:100%;border-collapse:collapse;table-layout:fixed;font-size:var(--fs-list,12.5px);color:var(--ink,#2e405e)}
#drawer .dt-tbl th,#drawer .dt-tbl td{height:30px;padding:0 7px;border-right:1px solid #eeeff1;
  border-bottom:1px solid #eeeff1;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#drawer .dt-tbl th:last-child,#drawer .dt-tbl td:last-child{border-right:0}
#drawer .dt-tbl thead th{background:var(--card2,#f7f8fa);font-weight:600;color:var(--ink2,#6e7b8c);font-size:11.5px;text-align:left}
#drawer .dt-tbl tbody tr:hover td{background:#fafbff}
#drawer .dt-tbl tfoot td{background:#f2f3ff;color:#0052d9;font-weight:600;border-bottom:0}
#drawer .dt-tbl td.r,#drawer .dt-tbl th.r{text-align:right}
#drawer .dt-tbl td.c,#drawer .dt-tbl th.c{text-align:center}
#drawer .dt-ipt{width:100%;height:24px;padding:0 6px;border:1px solid transparent;border-radius:3px;
  background:transparent;color:var(--ink,#2e405e);font:inherit;font-size:11.5px;outline:0;box-sizing:border-box}
#drawer .dt-ipt:hover{border-color:#dadee3}
#drawer .dt-ipt:focus{border-color:#0052d9;background:#fff;box-shadow:0 0 0 2px rgba(0,82,217,.08)}
#drawer .dt-ipt.lookup{cursor:pointer;color:#0052d9}
#drawer .dt-ro{display:block;font-variant-numeric:tabular-nums}
#drawer .dt-del{border:0;background:none;color:#e66544;font-size:13px;cursor:pointer;padding:0 4px;line-height:1}
#drawer .dt-del:hover{text-decoration:underline}
#drawer .dt-bar{display:flex;align-items:center;gap:8px;margin-top:7px;flex-wrap:wrap}
#drawer .dt-btn{height:25px;padding:0 10px;border:1px solid #dadee3;background:#fff;color:#0052d9;
  border-radius:4px;font-size:11px;cursor:pointer;font-family:inherit}
#drawer .dt-btn:hover{border-color:#0052d9;background:#f2f3ff}
#drawer .dt-count{font-size:10.5px;color:var(--ink4,#909aaa)}
#drawer .dt-sum{margin-left:auto;font-size:11.5px;color:#0052d9;background:#f2f3ff;
  border:1px solid #d9e1ff;border-radius:4px;padding:3px 9px;font-variant-numeric:tabular-nums}
#drawer .dt-err{display:none;width:100%;margin-top:6px;padding:6px 9px;border:1px solid #f5c6b8;
  background:#fff4f0;color:#c94f30;border-radius:4px;font-size:10.5px}
#drawer .dt-err.on{display:block}
#drawer .dt-empty{padding:14px;text-align:center;color:#909aaa;font-size:11px}
/* ---- 选录候选浮层（原生 DOM） ---- */
#dtLookup{position:fixed;z-index:340;width:288px;background:#fff;border:1px solid #dadee3;
  border-radius:6px;box-shadow:0 10px 30px rgba(46,64,94,.16);display:none;overflow:hidden}
#dtLookup.on{display:block}
#dtLookup .dt-lk-hd{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;
  border-bottom:1px solid #eef0f3;background:#fafbfc;font-size:11.5px;color:#2e405e}
#dtLookup .dt-lk-hd b{color:#0052d9}
#dtLookup .dt-lk-x{border:0;background:none;cursor:pointer;font-size:15px;color:#909aaa;line-height:1}
#dtLookup .dt-lk-kw{width:calc(100% - 20px);margin:8px 10px;height:26px;padding:0 8px;
  border:1px solid #dadee3;border-radius:4px;font:inherit;font-size:11px;outline:0}
#dtLookup .dt-lk-kw:focus{border-color:#0052d9}
#dtLookup .dt-lk-list{max-height:224px;overflow:auto;padding:0 6px 6px}
#dtLookup .dt-lk-item{display:flex;gap:8px;width:100%;text-align:left;border:0;background:none;
  padding:6px 7px;border-radius:4px;cursor:pointer;font:inherit;font-size:11px;color:#2e405e}
#dtLookup .dt-lk-list{position:relative}
#dtLookup .dt-lk-item:hover{background:#f2f3ff}
#dtLookup .dt-lk-item.on{background:#eef3ff;color:#0052d9;box-shadow:inset 2px 0 0 #0052d9}
#dtLookup .dt-lk-item.on code,#dtLookup .dt-lk-item.on em{color:#0052d9}
#dtLookup .dt-lk-item code{font:10px ui-monospace,Menlo,Consolas,monospace;color:#0052d9;flex:0 0 46px}
#dtLookup .dt-lk-item span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#dtLookup .dt-lk-item em{font-style:normal;color:#6e7b8c;font-variant-numeric:tabular-nums}
#dtLookup .dt-lk-none{padding:14px;text-align:center;color:#909aaa;font-size:10.5px}
#dtLookup .dt-lk-tip{display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:6px 10px;border-top:1px solid #eef0f3;background:#fafbfc;font-size:9.5px;color:#909aaa}
#dtLookup .dt-lk-tip kbd{font:9px ui-monospace,Menlo,Consolas,monospace;background:#fff;
  border:1px solid #dadee3;border-bottom-width:2px;border-radius:3px;padding:1px 4px;color:#6e7b8c}
#dtLookup .dt-lk-tip b{color:#0052d9;font-weight:600}
/* 键盘流转焦点态：仅描边变化，不改布局、不产生滚动 */
#drawer .dt-ipt.dt-flow-focus{border-color:#0052d9;background:#fff;box-shadow:0 0 0 2px rgba(0,82,217,.08)}
/* ---- 配置表单面板：列定义编辑表 ---- */
#formWin .dtcfg{width:100%;border-collapse:collapse;font-size:10.5px}
#formWin .dtcfg th,#formWin .dtcfg td{padding:5px 4px;border-bottom:1px solid #f0f2f5;text-align:left}
#formWin .dtcfg th{background:#fafbfc;color:#6e7b8c;font-weight:500;white-space:nowrap}
#formWin .dtcfg input,#formWin .dtcfg select{height:24px;width:100%;min-width:0;padding:0 5px;
  border:1px solid #dadee3;border-radius:3px;background:#fff;color:#2e405e;font:inherit;font-size:10px}
#formWin .dtcfg input[type=checkbox]{width:13px;height:13px;accent-color:#0052d9}
#formWin .dtcfg input:focus,#formWin .dtcfg select:focus{outline:0;border-color:#0052d9}
#formWin .dtcfg .mini{width:19px;height:19px;line-height:17px;padding:0;text-align:center;
  border:1px solid #e2e6ea;background:#fff;border-radius:3px;color:#6e7b8c;cursor:pointer;font-size:10px}
#formWin .dtcfg .mini:hover{border-color:#0052d9;color:#0052d9}
#formWin .dtcfg-wrap{overflow:auto;max-height:330px;padding:0 12px 10px}
#formWin .dtcfg-json{width:100%;min-height:132px;padding:8px 10px;border:1px solid #dadee3;border-radius:4px;
  font:10px/1.6 ui-monospace,Menlo,Consolas,monospace;color:#2e405e;background:#fafbfc;resize:vertical}
#formWin .dtcfg-json:focus{outline:0;border-color:#0052d9}
</style>`;
  (function injectDTStyle() {
    if (!document.getElementById("tplDetailTableStyle"))
      document.head.insertAdjacentHTML("beforeend", DT_STYLE);
  })();
  window.__WL_FORMULA__ = Formula;
  const DETAIL_CONTROLS = {
    input(c, row) {
      return `<input class="dt-ipt" data-col="${escA(c.k)}" value="${escA(fmtDT(c, row[c.k]))}" autocomplete="off">`;
    },
    number(c, row) {
      return `<input class="dt-ipt r" type="number" step="any" data-col="${escA(c.k)}" value="${escA(fmtDT(c, row[c.k]))}" autocomplete="off">`;
    },
    readonly(c, row) {
      return `<span class="dt-ro" data-ccol="${escA(c.k)}">${esc(fmtDT(c, row[c.k]))}</span>`;
    },
    text(c, row) {
      return `<span class="dt-ro" data-ccol="${escA(c.k)}">${esc(fmtDT(c, row[c.k]))}</span>`;
    },
    lookup(c, row) {
      return `<div style="display:flex;align-items:center;gap:2px">
      <input class="dt-ipt lookup" data-col="${escA(c.k)}" data-control="lookup" value="${escA(fmtDT(c, row[c.k]))}" autocomplete="off" title="输入后回车或失焦打开选录">
      <button class="dt-del" data-act="lookup" title="选录" style="color:#0052d9">⌕</button></div>`;
    },
    select(c, row) {
      const list = c.options || [], v = String(row[c.k] == null ? "" : row[c.k]);
      return `<select class="dt-ipt" data-col="${escA(c.k)}">${list.map((o) => `<option ${String(o) === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    },
    date(c, row) {
      return `<input class="dt-ipt" type="date" data-col="${escA(c.k)}" value="${escA(fmtDT(c, row[c.k]))}">`;
    }
  };
  function fmtDT(c, v) {
    if (v == null || v === "") return "";
    if (c.precision != null && c.precision !== "" && (c.control === "readonly" || c.control === "number")) {
      const n = Number(v);
      if (isFinite(n)) return String(Formula.round(n, c.precision).toFixed(+c.precision));
    }
    return String(v);
  }
  const DETAIL = /* @__PURE__ */ (function() {
    const clone = (o) => JSON.parse(JSON.stringify(o));
    let lk = null;
    function specOf(sec) {
      const d = (FORM.spec() || {}).detailDefaults || {}, sp = Object.assign({}, d, sec && sec.spec || {});
      sp.columns = Array.isArray(sp.columns) ? sp.columns : [];
      sp.summary = Object.assign({}, d.summary || {}, sp.summary || {});
      sp.preValidate = Object.assign({}, d.preValidate || {}, sp.preValidate || {});
      sp.seed = Array.isArray(sp.seed) ? sp.seed : [];
      return sp;
    }
    function sections() {
      return ((VC.formConfig() || {}).layout || {}).sections ? VC.formConfig().layout.sections.filter((s) => s.show !== false && s.renderer === "editable-table") : [];
    }
    function byId(id) {
      return sections().find((s) => s.id === id) || null;
    }
    function rows(sec) {
      const sp = specOf(sec);
      return Array.isArray(cur[sp.dataKey]) ? cur[sp.dataKey] : [];
    }
    function row(secId, rk) {
      const sec = byId(secId);
      if (!sec) return null;
      const sp = specOf(sec);
      return rows(sec).find((x) => String(x[sp.rowKey]) === String(rk)) || null;
    }
    function col(secId, k) {
      const sec = byId(secId);
      return sec ? specOf(sec).columns.find((c) => c.k === k) || null : null;
    }
    function sig() {
      return JSON.stringify(sections().map((s) => [s.id, s.spec]));
    }
    function ensure(r) {
      if (!r) return;
      const secs = sections();
      if (!secs.length) return;
      const sg = sig(), st2 = r.__dtState;
      if (st2 && st2.sig === sg) return;
      const origin = {}, sumOrigin = {};
      secs.forEach((sec) => {
        const sp = specOf(sec), k = sp.dataKey;
        if (st2 && st2.origin && Object.prototype.hasOwnProperty.call(st2.origin, k)) origin[k] = clone(st2.origin[k]);
        else origin[k] = clone(Array.isArray(r[k]) ? r[k] : sp.seed);
        if (sp.summary && sp.summary.target && !(sp.summary.target in sumOrigin))
          sumOrigin[sp.summary.target] = st2 && st2.sumOrigin && sp.summary.target in st2.sumOrigin ? st2.sumOrigin[sp.summary.target] : r[sp.summary.target];
      });
      r.__dtState = { sig: sg, origin, sumOrigin };
      secs.forEach((sec) => {
        const k = specOf(sec).dataKey;
        r[k] = clone(origin[k]);
      });
      secs.forEach(recalc);
      window.__WL_DT_STATE__ = { dataKeys: Object.keys(origin), sections: secs.map((s) => s.id), rows: secs.map((s) => rows(s).length) };
    }
    function restore(r) {
      if (!r || !r.__dtState) return;
      const st2 = r.__dtState;
      Object.keys(st2.origin || {}).forEach((k) => {
        r[k] = clone(st2.origin[k]);
      });
      Object.keys(st2.sumOrigin || {}).forEach((k) => {
        r[k] = st2.sumOrigin[k];
      });
      delete r.__dtState;
    }
    function commit(r) {
      if (r && r.__dtState) delete r.__dtState;
    }
    function recalc(sec) {
      const sp = specOf(sec), list = rows(sec);
      sp.columns.forEach((c) => {
        if (!c.formula) return;
        list.forEach((row2) => {
          row2[c.k] = Formula.eval(c.formula, row2, list, c.precision);
        });
      });
      const sm = sp.summary || {};
      if (sm.formula && sm.target) cur[sm.target] = Formula.eval(sm.formula, {}, list, sm.precision);
    }
    function flowChain(F, seq) {
      const raw = F && F.next || {}, next = {};
      Object.keys(raw).forEach((k) => {
        const v = String(raw[k] == null ? "" : raw[k]);
        if (seq.indexOf(k) >= 0 && seq.indexOf(v) >= 0) next[k] = v;
      });
      const keys = Object.keys(next), vals = keys.map((k) => next[k]);
      let first = "", tail = "";
      for (const k of keys) {
        if (vals.indexOf(k) < 0) {
          first = k;
          break;
        }
      }
      for (const v of vals) {
        if (keys.indexOf(v) < 0) {
          tail = v;
          break;
        }
      }
      if (!first) first = seq[0] || "";
      if (!tail) tail = seq[seq.length - 1] || "";
      return { next, first, tail };
    }
    function flowSpec(sec) {
      const sp = specOf(sec || {}), F = sp.flow || {};
      const ctl = (FORM.spec() || {}).detailControls || [];
      const editable = (c) => {
        const m = ctl.find((x) => x.key === c.control);
        return !!(m && m.editable !== false);
      };
      const seq = sp.columns.filter(editable).map((c) => c.k);
      const C = flowChain(F, seq);
      return {
        enabled: F.enabled !== false,
        seq,
        next: C.next,
        first: C.first,
        tail: C.tail,
        selectOnFocus: F.selectOnFocus !== false,
        preventScroll: F.preventScroll !== false,
        keepScroll: F.keepScroll !== false
      };
    }
    function nextCol(F, k) {
      const N = F.next || {}, seq = F.seq || [];
      if (Object.prototype.hasOwnProperty.call(N, k) && String(N[k] || "")) return String(N[k]);
      if (k === F.tail) return "";
      const i = seq.indexOf(k);
      if (i < 0 || i >= seq.length - 1) return "";
      return seq[i + 1];
    }
    function isEmptyRow(sec, row2, F) {
      const keys = F.seq || [];
      if (!keys.length) return true;
      return keys.every((k) => {
        const v = row2[k];
        return v == null || String(v).trim() === "";
      });
    }
    function scrollSnapshot() {
      const o = { x: window.scrollX, y: window.scrollY, doc: document.documentElement.scrollTop };
      ["dwBody", "tplMain"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) o[id] = el.scrollTop;
      });
      return o;
    }
    function scrollRestore(s) {
      if (!s) return;
      if (window.scrollX !== s.x || window.scrollY !== s.y) {
        try {
          window.scrollTo(s.x, s.y);
        } catch (e) {
        }
      }
      const de = document.documentElement;
      if (de.scrollTop !== s.doc) de.scrollTop = s.doc;
      ["dwBody", "tplMain"].forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.scrollTop !== s[id]) el.scrollTop = s[id];
      });
    }
    function focusCell(secId, rk, colKey, F) {
      if (!rk || !colKey) return false;
      const w = document.getElementById("dtw-" + secId);
      if (!w) return false;
      const tr = [].slice.call(w.querySelectorAll("tbody tr")).find((x) => x.getAttribute("data-rk") === String(rk));
      if (!tr) return false;
      const el = [].slice.call(tr.querySelectorAll("[data-col]")).find((x) => x.getAttribute("data-col") === String(colKey));
      if (!el || el.disabled || el.readOnly) return false;
      const fl = F || flowSpec(byId(secId) || {});
      const snap = fl.keepScroll ? scrollSnapshot() : null;
      w.querySelectorAll(".dt-flow-focus").forEach((x) => x.classList.remove("dt-flow-focus"));
      try {
        el.focus({ preventScroll: !!fl.preventScroll });
      } catch (e) {
        try {
          el.focus();
        } catch (e2) {
        }
      }
      if (fl.selectOnFocus && typeof el.select === "function") {
        try {
          el.select();
        } catch (e) {
        }
      }
      el.classList.add("dt-flow-focus");
      if (snap) scrollRestore(snap);
      window.__WL_DT_FOCUS__ = {
        secId,
        rowKey: String(rk),
        col: String(colKey),
        value: el.value != null ? String(el.value) : "",
        selected: !!fl.selectOnFocus,
        scrollY: window.scrollY,
        scroll: {
          y: window.scrollY,
          doc: document.documentElement.scrollTop,
          dw: (document.getElementById("dwBody") || {}).scrollTop || 0,
          main: (document.getElementById("tplMain") || {}).scrollTop || 0
        },
        at: Date.now()
      };
      return true;
    }
    function focusAfterRedraw(secId, rk, colKey, F) {
      const fl = F || flowSpec(byId(secId) || {});
      const go = () => {
        if (!focusCell(secId, rk, colKey, fl)) {
          const retry = () => focusCell(secId, rk, colKey, fl);
          window.requestAnimationFrame ? window.requestAnimationFrame(retry) : setTimeout(retry, 16);
        }
      };
      setTimeout(go, 0);
    }
    function highlightLookup() {
      if (!lk) return;
      const box = document.getElementById("dtLkList");
      if (!box) return;
      const items = [].slice.call(box.querySelectorAll('[data-lk="pick"]'));
      const a = Math.max(0, Math.min(items.length - 1, +lk.active || 0));
      items.forEach((x, i) => x.classList.toggle("on", i === a));
      const el = items[a];
      if (el) {
        const top = el.offsetTop, h = el.offsetHeight, bh = box.clientHeight, st2 = box.scrollTop;
        if (top < st2) box.scrollTop = top;
        else if (top + h > st2 + bh) box.scrollTop = top + h - bh;
      }
      const badge = document.getElementById("dtLkActive");
      if (badge) badge.textContent = items.length ? a + 1 + " / " + items.length : "0 / 0";
    }
    function lookupKey(e) {
      if (!lk) return;
      const n = (lk.list || []).length;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        if (!n) return;
        lk.active = ((+lk.active || 0) + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
        highlightLookup();
        const L = window.__WL_DT_LOOKUP__ || {};
        L.active = lk.active;
        L.highlight = lk.list[lk.active];
        window.__WL_DT_LOOKUP__ = L;
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (n) lookupPick(+lk.active || 0);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        lookupClose();
      }
    }
    function applyFlowStep(secId, rk, k, F, afterRedraw) {
      const sec = byId(secId);
      if (!sec) return;
      const dest = nextCol(F, k);
      if (dest) {
        if (afterRedraw) focusAfterRedraw(secId, rk, dest, F);
        else focusCell(secId, rk, dest, F);
        window.__WL_DT_FLOW__ = { op: "next", secId, rowKey: rk, from: k, to: dest, at: Date.now() };
        return;
      }
      const sp = specOf(sec), list = rows(sec);
      const i = list.findIndex((x) => String(x[sp.rowKey]) === String(rk));
      for (let j = i + 1; j < list.length; j++) {
        if (isEmptyRow(sec, list[j], F)) {
          const r2 = String(list[j][sp.rowKey]);
          if (afterRedraw) focusAfterRedraw(secId, r2, F.first, F);
          else focusCell(secId, r2, F.first, F);
          window.__WL_DT_FLOW__ = { op: "reuse-empty", secId, rowKey: r2, from: k, to: F.first, at: Date.now() };
          return;
        }
      }
      const nrk = addRow(secId);
      focusAfterRedraw(secId, nrk, F.first, F);
      window.__WL_DT_FLOW__ = { op: "append", secId, rowKey: nrk, from: k, to: F.first, at: Date.now() };
    }
    function enterFlow(secId, el) {
      const sec = byId(secId);
      if (!sec || curMode !== "edit") return;
      const F = flowSpec(sec);
      if (!F.enabled) return;
      const tr = el.closest ? el.closest("tr") : null;
      if (!tr) return;
      const rk = tr.getAttribute("data-rk"), k = el.dataset.col;
      if (!rk || !k) return;
      setCell(secId, rk, k, el.value);
      const c = specOf(sec).columns.find((x) => x.k === k) || {};
      if (c.lookup) {
        lookupOpen(secId, rk, el);
        return;
      }
      applyFlowStep(secId, rk, k, F, false);
    }
    function tableHTML2(sec, r, ed) {
      const sp = specOf(sec), list = rows(sec), cols = sp.columns, rk = sp.rowKey, sm = sp.summary || {};
      const totalW = cols.reduce((a, c) => a + (+c.w || 90), 0) + (ed ? 46 : 0);
      const head = cols.map((c) => `<th style="width:${+c.w || 90}px" class="${c.control === "number" || c.control === "readonly" ? "r" : ""}">${esc(c.t || c.k)}</th>`).join("") + (ed ? `<th class="c" style="width:46px">操作</th>` : "");
      const body = list.map((row2, i) => `<tr data-rk="${escA(row2[rk] != null ? row2[rk] : "R" + i)}">` + cols.map((c) => {
        const fn = DETAIL_CONTROLS[c.control] || DETAIL_CONTROLS.text;
        return `<td class="${c.control === "number" || c.control === "readonly" ? "r" : ""}">${ed ? fn(c, row2) : `<span class="dt-ro" ${c.formula ? `data-ccol="${escA(c.k)}"` : ""}>${esc(fmtDT(c, row2[c.k]))}</span>`}</td>`;
      }).join("") + (ed ? `<td class="c"><button class="dt-del" data-act="del" title="删除此行">×</button></td>` : "") + `</tr>`).join("");
      const empty = list.length ? "" : `<div class="dt-empty">暂无明细行，点「＋ 新增行」开始录入</div>`;
      const sumVal = sm.target && r[sm.target] != null ? r[sm.target] : "";
      const foot = sm.formula && sm.target ? `<tr><td colspan="${Math.max(1, cols.length + (ed ? 1 : 0) - 1)}">${esc(sm.label || "合计")} · ${esc(sm.formula)}</td>
          <td class="r" data-dtsum="${escA(sm.target)}">${esc(fmtDT({ precision: sm.precision, control: "readonly" }, sumVal))}</td></tr>` : "";
      const bar = `<div class="dt-bar">
        ${ed ? `<button class="dt-btn" data-act="add">＋ 新增行</button>` : ""}
        <span class="dt-count" data-dtcount="${escA(sp.dataKey)}">共 <b>${list.length}</b> 行 · 数据键 <code>${esc(sp.dataKey)}</code></span>
        ${sm.formula && sm.target ? `<span class="dt-sum">${esc(sm.label || "合计")}：<b data-dtsum2="${escA(sm.target)}">${esc(fmtDT({ precision: sm.precision, control: "readonly" }, sumVal))}</b></span>` : ""}
      </div><div class="dt-err" data-err="${escA(sec.id)}"></div>`;
      return `<div class="dt-wrap" id="dtw-${escA(sec.id)}" data-sec="${escA(sec.id)}"
        oninput="TPL._dtInput(event,${escJS(sec.id)})" onchange="TPL._dtChange(event,${escJS(sec.id)})"
        onclick="TPL._dtClick(event,${escJS(sec.id)})">
      <div class="dt-tblbox"><table class="dt-tbl" style="min-width:${Math.max(360, totalW)}px">
        <colgroup>${cols.map((c) => `<col style="width:${+c.w || 90}px">`).join("")}${ed ? '<col style="width:46px">' : ""}</colgroup>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>${foot ? `<tfoot>${foot}</tfoot>` : ""}
      </table>${empty}</div>${bar}</div>`;
    }
    function refresh(secId) {
      const sec = byId(secId);
      if (!sec || !cur) return;
      const w = document.getElementById("dtw-" + secId);
      if (!w) return;
      w.outerHTML = tableHTML2(sec, cur, curMode === "edit");
    }
    function refreshComputed(secId) {
      const sec = byId(secId);
      if (!sec) return;
      const sp = specOf(sec), list = rows(sec), w = document.getElementById("dtw-" + secId);
      if (!w) return;
      const trs = w.querySelectorAll("tbody tr");
      list.forEach((row2, i) => {
        const tr = trs[i];
        if (!tr) return;
        sp.columns.filter((c) => c.formula).forEach((c) => {
          [...tr.querySelectorAll("[data-ccol]")].forEach((el) => {
            if (el.getAttribute("data-ccol") === String(c.k)) el.textContent = fmtDT(c, row2[c.k]);
          });
        });
      });
      const sm = sp.summary || {};
      if (sm.target) {
        const v = cur[sm.target];
        w.querySelectorAll("[data-dtsum],[data-dtsum2]").forEach((el) => {
          el.textContent = fmtDT({ precision: sm.precision, control: "readonly" }, v);
        });
      }
      window.__WL_DT_CALC__ = { secId, rows: list.map((r) => clone(r)), summary: sm.target ? { [sm.target]: cur[sm.target] } : {} };
    }
    function addRow(secId) {
      const sec = byId(secId);
      if (!sec || !cur) return;
      const sp = specOf(sec), list = rows(sec);
      const o = {};
      o[sp.rowKey] = "R" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);
      sp.columns.forEach((c) => {
        o[c.k] = c.default != null ? c.default : "";
      });
      list.push(o);
      recalc(sec);
      refresh(secId);
      window.__WL_DT_OP__ = { op: "add", secId, rowKey: sp.rowKey, value: o[sp.rowKey], count: list.length };
      return String(o[sp.rowKey]);
    }
    function delRow(secId, rk) {
      const sec = byId(secId);
      if (!sec || !cur) return;
      const sp = specOf(sec), list = rows(sec), i = list.findIndex((x) => String(x[sp.rowKey]) === String(rk));
      if (i < 0) return;
      const removed = clone(list[i]);
      list.splice(i, 1);
      recalc(sec);
      refresh(secId);
      window.__WL_DT_OP__ = { op: "del", secId, rowKey: sp.rowKey, value: rk, removed, count: list.length };
    }
    function setCell(secId, rk, k, v) {
      const sec = byId(secId), c = col(secId, k), target = row(secId, rk);
      if (!sec || !target) return;
      target[k] = c && c.control === "number" ? v === "" ? "" : Number(v) : v;
      recalc(sec);
      refreshComputed(secId);
    }
    function lookupSources() {
      return (FORM.spec() || {}).lookupSources || {};
    }
    function lookupOpen(secId, rk, el) {
      const sec = byId(secId), c = col(secId, el && el.dataset ? el.dataset.col : "");
      if (!sec || !c || !c.lookup) return;
      const src = lookupSources()[c.lookup.source || c.lookup.url] || { label: "候选", rows: [], match: [] };
      const q = String(el && el.value || "").trim().toLowerCase();
      const match = src.match && src.match.length ? src.match : Object.keys((src.rows || [])[0] || {});
      const list = (src.rows || []).filter((o) => !q || match.some((k) => String(o[k] == null ? "" : o[k]).toLowerCase().indexOf(q) >= 0));
      lk = {
        secId,
        rk,
        col: c,
        map: c.lookup.map || {},
        list,
        source: c.lookup.source || c.lookup.url,
        triggerEl: el,
        active: 0,
        triggerEl: el,
        triggerSec: secId,
        triggerRk: String(rk)
      };
      let box = document.getElementById("dtLookup");
      if (!box) {
        document.body.insertAdjacentHTML("beforeend", '<div id="dtLookup"></div>');
        box = document.getElementById("dtLookup");
      }
      const rect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 200, bottom: 220 };
      box.style.left = Math.max(8, Math.min(window.innerWidth - 300, rect.left)) + "px";
      box.style.top = Math.min(window.innerHeight - 260, rect.bottom + 4) + "px";
      box.innerHTML = `<div class="dt-lk-hd"><span>选录 · <b>${esc(src.label || lk.source)}</b></span>
        <button class="dt-lk-x" data-lk="close" title="关闭">×</button></div>
      <input class="dt-lk-kw" id="dtLkKw" value="${escA(q)}" placeholder="输入关键字过滤…" oninput="TPL._dtLookupFilter(this.value)">
      <div class="dt-lk-list" id="dtLkList"></div>
      <div class="dt-lk-tip"><span><kbd>↑</kbd> <kbd>↓</kbd> 切换 · <kbd>Enter</kbd> 选中并回填 · <kbd>Esc</kbd> 取消</span>
        <b id="dtLkActive">1 / ${list.length}</b></div>`;
      box.classList.add("on");
      renderLookupList(q);
      window.__WL_DT_LOOKUP__ = {
        open: true,
        secId,
        col: c.k,
        source: lk.source,
        candidates: list.length,
        active: 0
      };
      setTimeout(() => {
        const kw = document.getElementById("dtLkKw");
        if (!kw) return;
        try {
          kw.focus({ preventScroll: true });
        } catch (e) {
          try {
            kw.focus();
          } catch (e2) {
          }
        }
        try {
          kw.setSelectionRange(kw.value.length, kw.value.length);
        } catch (e) {
        }
      }, 0);
    }
    function renderLookupList(q) {
      if (!lk) return;
      const box = document.getElementById("dtLkList");
      if (!box) return;
      q = String(q || "").trim().toLowerCase();
      const src = lookupSources()[lk.source] || {}, match = src.match && src.match.length ? src.match : Object.keys((src.rows || [])[0] || {});
      const list = (src.rows || []).map((o, i) => ({ o, i })).filter((x) => !q || match.some((k) => String(x.o[k] == null ? "" : x.o[k]).toLowerCase().indexOf(q) >= 0));
      lk.list = list.map((x) => x.o);
      const disp = src.display || {}, dk = disp.key || "", dl = disp.label || "", dv = disp.value || "";
      box.innerHTML = list.length ? list.map((x, idx) => `<button class="dt-lk-item" data-lk="pick" data-i="${idx}">
        <code>${esc(dk && x.o[dk] != null ? x.o[dk] : idx + 1)}</code><span>${esc(dl && x.o[dl] != null ? x.o[dl] : JSON.stringify(x.o))}</span>
        <em>${esc(dv && x.o[dv] != null ? x.o[dv] : "")}</em></button>`).join("") : '<div class="dt-lk-none">无匹配候选</div>';
      if (lk) lk.active = 0;
      highlightLookup();
      const L = window.__WL_DT_LOOKUP__ || {};
      if (L.open) {
        L.candidates = (lk && lk.list || []).length;
        L.active = 0;
        window.__WL_DT_LOOKUP__ = L;
      }
    }
    function lookupClose(skipFocus) {
      const b = document.getElementById("dtLookup");
      if (b) b.classList.remove("on");
      const el = lk && lk.triggerEl;
      lk = null;
      if (!skipFocus && el && el.isConnected) {
        try {
          el.focus({ preventScroll: true });
        } catch (e) {
        }
      }
    }
    function lookupPick(idx) {
      if (!lk) return;
      const sec = byId(lk.secId), target = row(lk.secId, lk.rk), cand = lk.list[idx];
      if (!sec || !target || !cand) return;
      Object.keys(lk.map).forEach((srcKey) => {
        const dst = lk.map[srcKey];
        if (dst) target[dst] = cand[srcKey];
      });
      if (lk.col && cand[lk.col.k] != null) target[lk.col.k] = cand[lk.col.k];
      const secId = lk.secId, rk = String(lk.rk), mapped = clone(lk.map), colKey = lk.col.k;
      const F = flowSpec(sec);
      recalc(sec);
      refresh(secId);
      lookupClose(true);
      applyFlowStep(secId, rk, colKey, F, true);
      window.__WL_DT_LOOKUP__ = {
        open: false,
        picked: clone(cand),
        row: clone(target),
        mapped,
        col: colKey,
        rowKey: rk
      };
    }
    function preValidateTasks(vals, payload) {
      const tasks = [];
      sections().forEach((sec) => {
        const sp = specOf(sec), pv = sp.preValidate || {};
        if (!pv.enabled) return;
        const api2 = (FORM.spec().mockApis || {})[pv.api] || { label: "mock", delay: 120 };
        const amount = vals[pv.amountField] != null ? Number(vals[pv.amountField]) : Number(payload[(sp.summary || {}).db] || 0);
        const limit = pv.limitField ? Number(cur[pv.limitField]) : Number(pv.limit);
        tasks.push(new Promise((resolve) => setTimeout(() => {
          const ok = !!Formula.eval(pv.rule || "amount <= limit", { amount, limit, api: pv.api }, [], 0);
          resolve({
            ok,
            secId: sec.id,
            api: pv.api,
            label: api2.label,
            amount,
            limit,
            message: pv.message || "预校验未通过，请调整后重试"
          });
        }, +api2.delay || 120)));
      });
      return tasks;
    }
    function showValidateError(res) {
      window.__WL_PREVALIDATE__ = { ok: false, result: res, ts: Date.now() };
      window.TPL._toast("预校验未通过 · " + res.message);
      document.querySelectorAll(".dt-err").forEach((el) => {
        if (el.getAttribute("data-err") === res.secId) {
          el.textContent = "⛔ " + res.message;
          el.classList.add("on");
        }
      });
    }
    function clearValidateError() {
      document.querySelectorAll(".dt-err.on").forEach((el) => {
        el.classList.remove("on");
        el.textContent = "";
      });
    }
    return {
      specOf,
      sections,
      byId,
      rows,
      row,
      col,
      ensure,
      restore,
      commit,
      recalc,
      tableHTML: tableHTML2,
      refresh,
      refreshComputed,
      addRow,
      delRow,
      setCell,
      lookupOpen,
      renderLookupList,
      lookupClose,
      lookupPick,
      preValidateTasks,
      showValidateError,
      clearValidateError,
      flowSpec,
      nextCol,
      isEmptyRow,
      focusCell,
      focusAfterRedraw,
      highlightLookup,
      lookupKey,
      enterFlow,
      flowFrom: applyFlowStep,
      get lookupState() {
        return lk;
      }
    };
  })();
  window.DETAIL = DETAIL;
  Object.assign(window.TPL, {
    _dtInput(e, id) {
      const el = e.target;
      if (!el || !el.dataset || !el.dataset.col) return;
      const tr = el.closest ? el.closest("tr") : null;
      if (!tr) return;
      DETAIL.setCell(id, tr.getAttribute("data-rk"), el.dataset.col, el.value);
    },
    _dtChange(e, id) {
      const el = e.target;
      if (!el || !el.dataset || el.dataset.control !== "lookup") return;
      const st2 = DETAIL.lookupState;
      if (st2 && st2.triggerEl === el && st2.triggerSec === id) return;
      const tr = el.closest ? el.closest("tr") : null;
      DETAIL.lookupOpen(id, tr ? tr.getAttribute("data-rk") : "", el);
    },
    _dtKey(e, id) {
      if (e.key !== "Enter") return;
      const el = e.target;
      const wrap = el && el.closest ? el.closest(".dt-wrap") : null;
      if (!wrap || !el.dataset || !el.dataset.col) return;
      e.preventDefault();
      DETAIL.enterFlow(wrap.getAttribute("data-sec"), el);
    },
    _dtClick(e, id) {
      const b = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
      if (!b) return;
      const act = b.getAttribute("data-act"), tr = b.closest ? b.closest("tr") : null;
      if (act === "add") DETAIL.addRow(id);
      else if (act === "del" && tr) DETAIL.delRow(id, tr.getAttribute("data-rk"));
      else if (act === "lookup" && tr) {
        const ipt = tr.querySelector(".dt-ipt.lookup");
        DETAIL.lookupOpen(id, tr.getAttribute("data-rk"), ipt);
      }
    },
    _dtLookupFilter(v) {
      DETAIL.renderLookupList(v);
    },
    _dtLookupKey(e) {
      DETAIL.lookupKey(e);
    },
    _dtLookupClick(e) {
      const b = e.target && e.target.closest ? e.target.closest("[data-lk]") : null;
      if (!b) return;
      const a = b.getAttribute("data-lk");
      if (a === "close") DETAIL.lookupClose();
      else if (a === "pick") DETAIL.lookupPick(+b.getAttribute("data-i"));
    },
    _dtState() {
      return window.__WL_DT_STATE__ || null;
    },
    _dtFlow(secId) {
      const sec = DETAIL.byId(secId) || DETAIL.sections()[0];
      return sec ? VC.clone(DETAIL.flowSpec(sec)) : null;
    },
    _dtFlowLog() {
      return {
        focus: window.__WL_DT_FOCUS__ || null,
        flow: window.__WL_DT_FLOW__ || null,
        lookup: window.__WL_DT_LOOKUP__ || null
      };
    },
    _dtRows(dataKey) {
      const k = dataKey || (FORM.spec().detailDefaults || {}).dataKey;
      return cur && Array.isArray(cur[k]) ? VC.clone(cur[k]) : [];
    }
  });
  document.addEventListener("click", function(e) {
    const box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on")) return;
    if (box.contains(e.target)) {
      window.TPL._dtLookupClick(e);
      return;
    }
    if (e.target && e.target.classList && e.target.classList.contains("dt-ipt") && e.target.dataset.control === "lookup") {
      const st2 = DETAIL.lookupState;
      if (st2 && st2.triggerEl === e.target) return;
      const tr = e.target.closest("tr");
      const wrap = e.target.closest(".dt-wrap");
      if (tr && wrap) DETAIL.lookupOpen(wrap.getAttribute("data-sec"), tr.getAttribute("data-rk"), e.target);
      return;
    }
    if (e.target && e.target.closest && e.target.closest('[data-act="lookup"]')) return;
    DETAIL.lookupClose();
  });
  document.addEventListener("keydown", function(e) {
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("#dtLookup")) {
      DETAIL.lookupKey(e);
      return;
    }
    const wrap = t.closest(".dt-wrap");
    if (!wrap) return;
    if (!t.dataset || !t.dataset.col) return;
    if (e.key !== "Enter") return;
    e.preventDefault();
    DETAIL.enterFlow(wrap.getAttribute("data-sec"), t);
  }, false);
  const CONTROLS = {
    text(f, r) {
      const val = r[f.k] == null ? "" : String(r[f.k]);
      if (f.yn) return val === "是" || val === "1" || val === "true" ? "是" : "否";
      return val === "" ? "—" : esc(val);
    },
    input(f, r) {
      const k = f.k, val = r[k] == null ? "" : String(r[k]), db = dbOf(k);
      return `<input class="dd-ipt" data-k="${k}" data-db="${escA(db)}" value="${escA(val)}">`;
    },
    switch(f, r) {
      const k = f.k, val = r[k] == null ? "" : String(r[k]), db = dbOf(k);
      const on = val === "是" || val === "1" || val === "true";
      return `<label class="sa-sw"><input type="checkbox" class="sa-sw-cb" ${on ? "checked" : ""} onchange="TPL._sw(this)" data-k="${k}" data-db="${escA(db)}" value="${on ? "是" : "否"}"><span class="track"></span><span class="txt">${on ? "是" : "否"}</span></label><input type="hidden" data-k="${k}" data-db="${escA(db)}" value="${on ? "是" : "否"}">`;
    },
    date(f, r) {
      const k = f.k, val = r[k] == null ? "" : String(r[k]), db = dbOf(k);
      return `<input type="date" class="dd-ipt" data-k="${k}" data-db="${escA(db)}" value="${escA(normDate(val))}">`;
    },
    combo(f, r) {
      const k = f.k, val = r[k] == null ? "" : String(r[k]), db = dbOf(k);
      return `<div class="tpl-combo"><input class="dd-ipt tpl-combo-ipt" data-k="${k}" data-db="${escA(db)}" value="${escA(val)}" autocomplete="off" oninput="TPL._comboInput(this)" onfocus="TPL._comboOpen(this)" onblur="TPL._comboBlur(this)"><div class="tpl-combo-panel"></div><span class="tpl-combo-n">${optList(f).length} 项</span></div>`;
    },
    tree(f, r) {
      const k = f.k, val = r[k] == null ? "" : String(r[k]), db = dbOf(k);
      const tree = (S.detail.optTree || {})[f.opt];
      const opts = tree.map((g) => `<optgroup label="${escA(g.label)}">${(g.items || []).map((o) => `<option ${o === val ? "selected" : ""}>${esc(o)}</option>`).join("")}</optgroup>`).join("");
      return `<select class="dd-ipt sa-opt" data-k="${k}" data-db="${escA(db)}">${opts}</select>`;
    },
    select(f, r) {
      const k = f.k, val = r[k] == null ? "" : String(r[k]), db = dbOf(k);
      const list = optList(f);
      const opts = `<option value="">请选择</option>` + list.map((o) => `<option ${o === val ? "selected" : ""}>${esc(o)}</option>`).join("");
      const keep = val && list.indexOf(val) < 0 ? `<option selected>${esc(val)}</option>` : "";
      return `<select class="dd-ipt sa-opt" data-k="${k}" data-db="${escA(db)}">${keep}${opts}</select>`;
    }
  };
  function controlKey(f, ed) {
    const c = String(f.control || "");
    if (c && CONTROLS[c]) return c;
    if (!ed) return "text";
    if (f.yn) return "switch";
    if (f.date) return "date";
    if (f.opt && f.search) return "combo";
    if (f.opt && (S.detail.optTree || {})[f.opt]) return "tree";
    if (f.opt) return "select";
    return "input";
  }
  function fieldHTML(f, r, ed) {
    f.k;
    const cls = "da-fld" + (ed ? " edit" : "") + (f.wide ? " wide" : "") + (f.yn ? " sw" : "");
    const body = (CONTROLS[controlKey(f, ed)] || CONTROLS.input)(f, r, ed);
    return `<div class="${cls}"><dt>${esc(f.l)}</dt><dd>${body}</dd></div>`;
  }
  function normDate(v) {
    if (!v) return "";
    const m = String(v).match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
  }
  function archHTML(r, ed) {
    const A = S.detail, list = Array.isArray(r[A.archKey || "sa_arch"]) ? r[A.archKey || "sa_arch"] : JSON.parse(r[A.archKey || "sa_arch"] || "[]");
    const types = A.archTypes || [], fs = A.archFields || [];
    const cards = list.map((o, i) => `<div class="da-arch-card" data-ai="${i}">
    <div class="da-arch-hd"><span class="da-arch-no">${i + 1}</span>${ed ? `<select class="dd-ipt sa-arch-type" onchange="TPL._archType(${i},this.value)">${types.map((t) => `<option ${t === o.type ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>` : `<b>${esc(o.type || "—")}</b>`}${ed ? `<a class="da-arch-del" onclick="TPL._archDel(${i})">删除</a>` : ""}</div>
    <dl class="da-arch-kv">${fs.map((f) => {
      const v = o[f.k] == null ? "" : String(o[f.k]);
      const ctl = !ed ? f.file ? `<span class="lnk">${esc(v || "—")}</span>` : esc(v || "—") : f.file ? `<div class="da-arch-up"><input type="file" onchange="TPL._archFile(${i},this)"><span>${esc(v || "未选择文件")}</span><input type="hidden" class="arch-f" data-af="${f.k}" value="${escA(v)}"></div>` : f.date ? `<input type="date" class="dd-ipt arch-f" data-af="${f.k}" value="${escA(normDate(v))}">` : `<input class="dd-ipt arch-f" data-af="${f.k}" value="${escA(v)}">`;
      return `<div class="${f.wide ? "wide" : ""}"><dt>${esc(f.l)}</dt><dd>${ctl}</dd></div>`;
    }).join("")}</dl></div>`).join("");
    return `<div class="da-arch ${ed ? "editing" : ""}" id="tplArch">${cards || `<div class="da-arch-empty">${esc(A.archEmpty || "暂无资料，点击下方添加")}</div>`}
    ${ed ? `<button class="da-arch-add" onclick="TPL._archAdd()">＋ 添加资料</button>` : ""}
    ${ed ? `<input type="hidden" id="tplArchHidden" data-k="${A.archKey || "sa_arch"}" data-db="${escA(A.archTable || "ProductAnnex")}" value="${escA(JSON.stringify(list))}">` : ""}</div>`;
  }
  const DETAIL_RENDERERS = {
    form(sec, r, ed) {
      const map = FORM.fieldMap();
      const fs = (sec.fields || []).map((k) => map[k]).filter(Boolean);
      return `<dl class="da-grid">${fs.map((f) => fieldHTML(f, r, ed)).join("")}</dl>`;
    },
    cards(sec, r, ed) {
      return archHTML(r, ed);
    },
    table(sec, r) {
      const B = S.detail.batch || {}, sp = sec.spec || {};
      const C = sp.columns || B.columns || [], rows = sp.rows || B.rows || [];
      let html = `
    <div class="da-tbl-wrap"><table class="da-tbl"><thead><tr>${C.map((c) => `<th>${esc(c.t)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${C.map((c) => `<td>${esc(row[c.k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      if (sec.showSummary && rows.length) {
        html += `<div class="fw-summary"><span>合计 <b>${rows.length}</b> 条批次</span>
        <span>配置项 <code>showSummary=true</code> 由配置表单驱动</span></div>`;
      }
      return html;
    },
    flow(sec, r) {
      const F = sec.spec && sec.spec.nodes || S.detail.timeline || [];
      return `
    <div class="da-flow">${F.map((n, i) => `<div class="da-fn ${n.state || (i === 0 ? "cur" : "todo")}"><span class="d"></span><span class="t"><b>${esc(n.name)}</b><small>${esc(n.time || "")}</small></span></div>`).join("")}</div>`;
    },
    note(sec, r) {
      const t = sec.spec && sec.spec.text || "";
      return `<div class="fw-note">${esc(t || "（在配置表单里填写长文本内容）")}</div>`;
    },
    "editable-table"(sec, r, ed) {
      return DETAIL.tableHTML(sec, r, ed);
    },
    card(sec, r) {
      const L = sec && sec.spec || S.detail.leftCard || {}, toc = tocItems();
      const kv = (L.kv || []).map((x) => `<div><dt>${esc(x.label)}</dt><dd>${esc(r[x.from] || "—")}</dd></div>`).join("");
      const met = (L.metrics || []).map((x) => `<div class="da-metric"><span>${esc(x.label)}</span><b>${esc(r[x.from] != null ? r[x.from] : "—")} ${x.unit ? `<i>${esc(x.unit)}</i>` : ""}</b></div>`).join("");
      const lv = L.level;
      const level = lv ? `<div class="da-level"><div class="da-level-hd"><span>${esc(lv.title || "水位")}</span><b class="${+r[lv.current] < +r[lv.baseline] ? "warn" : ""}">${+r[lv.current] < +r[lv.baseline] ? lv.warnText || "低于基线" : lv.okText || "正常"}</b></div><div class="da-bar"><i class="${+r[lv.current] < +r[lv.baseline] ? "warn" : ""}" style="width:${Math.min(100, Math.round(+r[lv.current] / Math.max(1, +r[lv.baseline]) * 100))}%"></i></div><small>${esc(lv.note || "")}</small></div>` : "";
      const w = sec && sec.width ? +sec.width : 244;
      const wStyle = w !== 244 ? ` style="--dw-left-width:${w}px"` : "";
      return `<aside class="da-card"${wStyle}>
    <div class="da-card-top"><span class="da-kind">${esc(r[L.kindField] || "")}</span><h2>${esc(r[L.titleField] || "—")}</h2><div class="da-code">${esc(r[L.codeField] || "")}</div></div>
    <dl class="da-card-kv">${kv}</dl>
    <div class="da-metrics">${met}</div>${level}
    <section class="da-toc"><h4>目录 <em>共 ${toc.length} 章</em><a class="da-toc-top" onclick="TPL._jump(${escJS(toc[0] && toc[0].id)})" title="回到开头">↑ 顶部</a></h4><ol>
      ${toc.map((t, i) => `<li><a data-target="${t.id}" class="${i === 0 ? "on" : ""}" title="${escA(t.title + "（" + t.note + "）")}"><i>${CN[i] || i + 1}</i><span><b>${esc(t.title)}</b><small>${esc(t.note)}</small></span></a></li>`).join("")}
    </ol></section>
    <div class="da-card-foot">${esc(L.footLabel || "建档")} ${esc(r[L.footDateField] || "")} · ${esc(r[L.footUserField] || "")}</div>
  </aside>`;
    }
  };
  function renderSection(sec, r, ed) {
    const fn = DETAIL_RENDERERS[sec.renderer] || DETAIL_RENDERERS.form;
    const style = +sec.cols !== 3 ? ` style="--dw-cols:${+sec.cols}"` : "";
    return `<section class="da-sec g" id="${escA(sec.id)}"${style}><h4>${esc(sec.title)}<em>${esc(sec.note)}</em></h4>${fn(sec, r, ed)}</section>`;
  }
  function renderSections(secs, r, ed) {
    return (secs || []).filter((x) => x.show !== false).map((x) => renderSection(x, r, ed)).join("");
  }
  function tocItems() {
    return VC.formConfig().layout.sections.filter((s) => s.show !== false).map((s) => ({ id: s.id, title: s.tocTitle, note: s.note }));
  }
  function leftHTML(r) {
    const L = VC.formConfig().layout.left;
    return DETAIL_RENDERERS.card(Object.assign({}, L), r);
  }
  function rightHTML(r, ed) {
    return `<div class="da-main" id="tplMain">${renderSections(VC.formConfig().layout.sections, r, ed)}</div>`;
  }
  function headHTML(r, mode) {
    const M = S.meta, D = S.detail;
    const badges = (D.badges || []).map((b) => `<span class="dw-badge ${b.pri ? "pri" : ""}">${esc(r[b.field] || "")}</span>`).join("");
    return `<div class="dw-head-main"><h3 id="dwTitle">${esc(M.drawerTitle || M.pageTitle)} · ${esc(r[D.primaryField] || "")}</h3>
    <span class="dw-mode" id="dwMode">${mode === "edit" ? M.editLabel || "编辑" : M.viewLabel || "详情"}</span>
    <div class="dw-badges" id="dwBadges">${badges}</div>
    <div class="dw-head-acts"><div class="dw-tools">
      <button class="dw-tool" title="刷新详情" onclick="TPL._refresh()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></button>
      <span class="dw-sep"></span>
      <button class="dw-tool close" title="关闭" onclick="TPL._close()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div></div></div>
    <div class="dw-head-sub"><span class="org">${esc(M.businessDomain || M.pageTitle)}</span><span class="dot">·</span>
      <span>${esc(D.subCodeLabel || "编号")} <b>${esc(r[D.subCodeField] || "")}</b></span><span class="dot">·</span>
      <span>${esc(D.subDateLabel || "建档")} ${esc(r[D.subDateField] || "")}</span></div>`;
  }
  function footHTML(mode) {
    const ft = VC.formConfig().layout.footer || {};
    const acts = mode === "edit" ? ft.actions || ["save", "reset", "close"] : ft.viewActions || ["edit", "close"];
    const M = S.meta;
    const map = {
      save: `<button class="btn primary" onclick="TPL._save()">${esc(M.saveLabel || "保存修改")}</button>`,
      reset: `<button class="btn ghost" onclick="TPL._reset()">${esc(M.resetLabel || "重置")}</button>`,
      close: `<button class="btn ghost" onclick="TPL._close()">${esc(M.closeLabel || "关闭")}</button>`,
      edit: `<button class="btn primary" onclick="TPL._drawerEdit()">${esc(M.editLabel || "编辑")}</button>`
    };
    return acts.map((a) => map[a] || "").filter(Boolean).join("\n    ");
  }
  function renderDrawer() {
    DETAIL.ensure(cur);
    const d = $("drawer"), r = cur, mode = curMode, L = VC.formConfig().layout;
    const kind = L.kind || "left-right";
    d.classList.add("detail", "on");
    d.setAttribute("data-mode", mode);
    d.setAttribute("data-label-pos", L.theme && L.theme.labelPos || "top");
    $("dwHead").innerHTML = headHTML(r, mode);
    const body = `<div class="da-detail ${mode === "edit" ? "editing" : ""}" data-kind="${escA(kind)}">` + (kind === "left-right" ? leftHTML(r) : "") + rightHTML(r, mode === "edit") + `</div>`;
    $("dwBody").innerHTML = body;
    $("dwFoot").innerHTML = footHTML(mode);
    bindToc();
    syncArch();
  }
  const FORM_STYLE = '<style id="tplFormStyle">\n/* ---- v1.31 · 配置表单独立弹窗（复用 vc-win 骨架，全部规则限定在 #formWin 内） ---- */\n#formWin{width:min(1120px,94vw);height:min(760px,90vh)}\n#formWin .fw-bd{min-height:0}\n#formWin .fw-left{width:268px;flex:0 0 268px;display:flex;flex-direction:column;\n  border-right:1px solid var(--line);background:var(--bg2)}\n#formWin .fw-left-hd{padding:10px 14px;font-size:var(--fs-12);color:var(--ink3);\n  border-bottom:1px solid var(--line);display:flex;justify-content:space-between}\n#formWin .fw-left-hd span{color:var(--ink4)}\n#formWin .fw-global{margin:10px 10px 4px;padding:9px 11px;border:1px solid #dadee3;border-radius:5px;\n  background:#fff;font-size:12px;color:var(--ink2);cursor:pointer;display:flex;align-items:center;gap:8px}\n#formWin .fw-global:hover{border-color:#0052d9;color:#0052d9}\n#formWin .fw-global.on{background:#eef3ff;border-color:#0052d9;color:#0052d9;font-weight:600;\n  box-shadow:inset 3px 0 0 #0052d9}\n#formWin .fw-list{flex:1;min-height:0;overflow:auto;padding:4px 10px 10px}\n#formWin .fw-row{display:flex;align-items:center;gap:7px;padding:7px 8px;margin:0 0 5px;\n  background:#fff;border:1px solid #e9ecf0;border-radius:5px;cursor:pointer;font-size:11.5px}\n#formWin .fw-row:hover{border-color:#c9d8ff}\n#formWin .fw-row.on{border-color:#0052d9;background:#f2f3ff;box-shadow:inset 3px 0 0 #0052d9}\n#formWin .fw-row.drag-over{border-color:#0052d9;border-style:dashed}\n#formWin .fw-row.off{opacity:.55}\n#formWin .fw-no{font:10px ui-monospace,Menlo,Consolas,monospace;color:#909aaa;flex:0 0 18px}\n#formWin .fw-row .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink)}\n#formWin .fw-tag{font-size:9px;padding:1px 5px;border-radius:3px;background:#eef3ff;color:#0052d9;flex:0 0 auto}\n#formWin .fw-mini{width:17px;height:17px;line-height:15px;text-align:center;border:1px solid #e2e6ea;\n  background:#fff;border-radius:3px;color:#6e7b8c;cursor:pointer;font-size:11px;padding:0}\n#formWin .fw-mini:hover{border-color:#0052d9;color:#0052d9}\n#formWin .fw-mini:disabled{opacity:.35;cursor:default}\n#formWin .fw-mini.del:hover{border-color:#e66544;color:#e66544}\n#formWin .fw-grip{cursor:grab;color:#b0b5bc;font-size:12px;flex:0 0 auto}\n#formWin .fw-left-ft{padding:9px 10px;border-top:1px solid var(--line)}\n#formWin .fw-right{flex:1;min-width:0;overflow:auto;padding:16px 18px 22px;background:#fafbfc}\n#formWin .fw-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}\n#formWin .fw-hd h4{margin:0;font-size:14px;font-weight:600;color:var(--ink);display:flex;align-items:baseline;gap:9px}\n#formWin .fw-hd h4 i{font:11px ui-monospace,Menlo,Consolas,monospace;color:#0052d9;font-style:normal}\n#formWin .fw-hd p{margin:4px 0 0;font-size:10.5px;color:var(--ink3);line-height:1.6}\n#formWin .fw-hd .fw-stat{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}\n#formWin .fw-stat span{font-size:10px;color:var(--ink2);background:#fff;border:1px solid #e5e8ec;\n  border-radius:12px;padding:3px 9px;white-space:nowrap}\n#formWin .fw-stat b{color:#0052d9}\n#formWin .fw-acts{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}\n#formWin .fw-btn{height:28px;padding:0 11px;border:1px solid #dadee3;background:#fff;color:var(--ink2);\n  border-radius:4px;font-size:11px;cursor:pointer;font-family:inherit}\n#formWin .fw-btn:hover{border-color:#0052d9;color:#0052d9;background:#f2f3ff}\n#formWin .fw-btn.pri{background:#0052d9;border-color:#0052d9;color:#fff}\n#formWin .fw-btn.pri:hover{background:#366ef4}\n#formWin .fw-card{background:#fff;border:1px solid #e5e8ec;border-radius:6px;overflow:hidden}\n#formWin .fw-card-hd{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;\n  border-bottom:1px solid #eef0f3;background:#f8fafc;font-size:11.5px;color:var(--ink2)}\n#formWin .fw-card-hd b{color:var(--ink);font-weight:600}\n#formWin .fw-card-hd em{font-style:normal;color:var(--ink4);font-size:10px}\n#formWin .fw-f{display:flex;align-items:flex-start;gap:14px;padding:9px 13px;border-bottom:1px solid #f2f4f7}\n#formWin .fw-f:last-child{border-bottom:0}\n#formWin .fw-f-l{flex:0 0 236px;min-width:0}\n#formWin .fw-f-l b{display:block;font-size:11.5px;font-weight:500;color:var(--ink)}\n#formWin .fw-f-l code{display:block;font:9.5px ui-monospace,Menlo,Consolas,monospace;color:#0052d9;margin-top:2px}\n#formWin .fw-f-l small{display:block;font-size:9.5px;color:var(--ink4);line-height:1.5;margin-top:3px}\n#formWin .fw-f-r{flex:1;min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n#formWin .fw-in,#formWin .fw-sel{height:28px;padding:0 8px;border:1px solid #dadee3;border-radius:4px;\n  background:#fff;color:var(--ink);font-size:11.5px;font-family:inherit;min-width:0}\n#formWin .fw-in{flex:1;max-width:330px}\n#formWin .fw-sel{min-width:170px}\n#formWin .fw-in:focus,#formWin .fw-sel:focus{outline:0;border-color:#0052d9;box-shadow:0 0 0 2px rgba(0,82,217,.08)}\n#formWin .fw-sw{display:inline-flex;align-items:center;gap:7px;font-size:11px;color:var(--ink2);cursor:pointer}\n#formWin .fw-sw input{accent-color:#0052d9;width:14px;height:14px}\n#formWin .fw-hintbar{font-size:10.5px;color:var(--ink3);line-height:1.6;padding:9px 13px;\n  background:#fcfdff;border-top:1px dashed #e5e8ec}\n#formWin .fw-hintbar code{font:9.5px ui-monospace,Menlo,Consolas,monospace;background:#eef3ff;\n  color:#0052d9;padding:1px 4px;border-radius:2px}\n#formWin .fw-chips{display:flex;flex-wrap:wrap;gap:5px;padding:9px 13px;background:#fcfdff;border-bottom:1px solid #eef0f3}\n#formWin .fw-chip{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;padding:3px 7px;\n  background:#eef3ff;color:#0052d9;border:1px solid #c9daff;border-radius:3px}\n#formWin .fw-chip button{border:0;background:none;color:#0052d9;cursor:pointer;padding:0;font-size:11px;line-height:1}\n#formWin .fw-pool{max-height:230px;overflow:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));\n  gap:2px 10px;padding:9px 13px}\n#formWin .fw-pool label{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--ink2);\n  padding:3px 2px;cursor:pointer;min-width:0}\n#formWin .fw-pool label input{accent-color:#0052d9;width:13px;height:13px;flex:0 0 auto}\n#formWin .fw-pool label span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n#formWin .fw-pool label i{font-style:normal;color:var(--ink4);font-size:9px;flex:0 0 auto}\n#formWin .fw-empty{padding:16px;text-align:center;font-size:11px;color:var(--ink4)}\n#formWin .fw-ft{height:54px;display:flex;align-items:center;gap:7px;padding:0 16px;\n  border-top:1px solid var(--line);background:#fff}\n#formWin .fw-ft .sp{flex:1;font-size:10px;color:var(--ink4)}\n#fwJson{position:fixed;inset:0;z-index:330;background:rgba(31,35,41,.22);display:none;\n  align-items:center;justify-content:center}\n#fwJson.on{display:flex}\n#fwJson .box{width:min(780px,90vw);height:min(620px,82vh);background:#fff;border-radius:8px;\n  border:1px solid var(--line);box-shadow:0 12px 40px rgba(0,0,0,.16);display:flex;flex-direction:column;overflow:hidden}\n#fwJson .hd{height:46px;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;\n  padding:0 16px;border-bottom:1px solid var(--line);font-size:13px;font-weight:600;color:var(--ink)}\n#fwJson pre{flex:1;min-height:0;overflow:auto;margin:0;padding:14px 16px;\n  font:11px/1.6 ui-monospace,Menlo,Consolas,monospace;color:var(--ink2);background:#fafbfc}\n/* 抽屉内新增元素（showSummary / note 渲染器） */\n#drawer .fw-summary{display:flex;justify-content:space-between;gap:10px;margin-top:7px;padding:6px 9px;\n  background:#f2f3ff;border:1px solid #d9e1ff;border-radius:4px;font-size:10.5px;color:#0052d9}\n#drawer .fw-summary code{font:inherit;background:#fff;padding:0 4px;border-radius:2px}\n#drawer .fw-note{font-size:var(--fs-115);line-height:var(--lh-15);color:var(--ink2);white-space:pre-wrap}\n</style>';
  let fDraft = null, fSel = "__global__", fKw = "", fDragId = null;
  function buildFormDom() {
    if ($("formWin")) return;
    if (!$("tplFormStyle")) document.head.insertAdjacentHTML("beforeend", FORM_STYLE);
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="vc-mask" id="formMask" onclick="TPL._formClose()"></div>
    <div class="vc-win" id="formWin" role="dialog" aria-label="配置表单">
      <div class="vc-hd"><div><h3>配置表单</h3><span class="sub" id="fwHdSub">抽屉渲染引擎 · 独立存储</span></div>
        <button class="vc-x" onclick="TPL._formClose()" title="关闭">×</button></div>
      <div class="vc-bd fw-bd">
        <div class="fw-left">
          <div class="fw-left-hd">骨架与区块 <span id="fwSecN"></span></div>
          <div class="fw-global" id="fwGlobal" onclick="TPL._formSel('__global__')">⚙ 全局骨架与主题</div>
          <div class="fw-list" id="fwList"></div>
          <div class="fw-left-ft"><button class="vc-add" onclick="TPL._formSecAdd()">＋ 添加区块</button></div>
        </div>
        <div class="fw-right" id="fwRight"></div>
      </div>
      <div class="fw-ft">
        <span class="sp" id="fwFtHint"></span>
        <button class="fw-btn" onclick="TPL._formJSON()">查看配置 JSON</button>
        <button class="fw-btn" onclick="TPL._formReset()">恢复默认</button>
        <button class="fw-btn" onclick="TPL._formClose()">取消</button>
        <button class="fw-btn pri" onclick="TPL._formSave()">保存并应用</button>
      </div>
    </div>
    <div id="fwJson" onclick="if(event.target===this)TPL._formJSONClose()">
      <div class="box"><div class="hd"><span>配置表单 JSON（当前编辑态）</span>
        <button class="vc-x" onclick="TPL._formJSONClose()" title="关闭">×</button></div>
        <pre id="fwJsonPre"></pre></div>
    </div>`
    );
  }
  function fwShow(on) {
    const m = $("formMask"), w = $("formWin");
    if (m) m.classList.toggle("on", on);
    if (w) w.classList.toggle("on", on);
    if (!on) {
      const j = $("fwJson");
      if (j) j.classList.remove("on");
    }
  }
  function fwSec(id) {
    return (fDraft.layout.sections || []).find((x) => x.id === id) || null;
  }
  function fwStat() {
    const secs = fDraft.layout.sections || [];
    const on = secs.filter((x) => x.show !== false).length;
    const fld = secs.reduce((n, x) => n + (x.fields || []).length, 0);
    const th = fDraft.layout.theme || {};
    return `<span>区块 <b>${on}/${secs.length}</b></span><span>字段 <b>${fld}</b></span>
    <span>骨架 <b>${fDraft.layout.kind === "single" ? "单栏" : "左右分栏"}</b></span>
    <span>密度 <b>${esc(th.density || "normal")}</b></span>
    <span>标签 <b>${th.labelPos === "inline" ? "在左" : "在上"}</b></span>`;
  }
  function fwOpts(list, cur2) {
    return list.map((x) => `<option value="${escA(x.key)}" ${String(cur2) === String(x.key) ? "selected" : ""}>${esc(x.label)}</option>`).join("");
  }
  function fwF(label, key, ctrl, desc, extra) {
    return `<div class="fw-f"><div class="fw-f-l"><b>${esc(label)}</b><code>${esc(key)}</code>
    ${desc ? `<small>${esc(desc)}</small>` : ""}</div><div class="fw-f-r">${ctrl}${""}</div></div>`;
  }
  function fwLeftHTML() {
    const secs = fDraft.layout.sections || [];
    $("fwSecN").textContent = secs.filter((x) => x.show !== false).length + "/" + secs.length + " 显示";
    $("fwGlobal").classList.toggle("on", fSel === "__global__");
    $("fwList").innerHTML = secs.map((s, i) => `<div class="fw-row ${fSel === s.id ? "on" : ""} ${s.show === false ? "off" : ""}" draggable="true"
       data-id="${escA(s.id)}" onclick="TPL._formSel(${escJS(s.id)})"
       ondragstart="TPL._formDragStart(${escJS(s.id)})" ondragover="TPL._formDragOver(event,this)"
       ondrop="TPL._formDrop(event,${escJS(s.id)})" ondragend="TPL._formDragEnd()">
       <span class="fw-grip" title="拖拽排序">⋮⋮</span><span class="fw-no">${String(i + 1).padStart(2, "0")}</span>
       <span class="t" title="${escA(s.title)}">${esc(s.title)}</span>
       <span class="fw-tag">${esc(s.renderer)}</span>
       <button class="fw-mini" ${i === 0 ? "disabled" : ""} title="上移" onclick="event.stopPropagation();TPL._formSecMove(${escJS(s.id)},-1)">↑</button>
       <button class="fw-mini" ${i === secs.length - 1 ? "disabled" : ""} title="下移" onclick="event.stopPropagation();TPL._formSecMove(${escJS(s.id)},1)">↓</button>
       <button class="fw-mini del" title="删除区块" onclick="event.stopPropagation();TPL._formSecDel(${escJS(s.id)})">×</button>
     </div>`).join("");
  }
  function fwGlobalHTML() {
    const L = fDraft.layout, sp = FORM.spec(), T = L.theme || {}, lf = L.left || {}, ft = L.footer || {};
    const secs = L.sections || [], on = secs.filter((x) => x.show !== false).length;
    const actBox = (acts, mode) => {
      const list = (sp.footerActions || []).filter((x) => x.mode === mode || x.mode === "both");
      return list.map((x) => `<label class="fw-sw"><input type="checkbox" ${acts.indexOf(x.key) >= 0 ? "checked" : ""}
      onchange="TPL._formFooter(${escJS(mode)},${escJS(x.key)},this.checked)">${esc(x.label)}</label>`).join("");
    };
    return `<div class="fw-hd"><div><h4><i>00</i> 全局骨架与主题 <em>layout</em></h4>
      <p>配置作用于整个抽屉；保存后写入独立存储 <code>${esc(FORM.storeKey)}</code>，与列表配置 vcWin 互不影响。</p></div>
      <div class="fw-stat">${fwStat()}</div></div>
    <div class="fw-acts">
      <button class="fw-btn" onclick="TPL._formShowAll(true)">全部显示区块</button>
      <button class="fw-btn" onclick="TPL._formShowAll(false)">全部隐藏区块</button>
      <button class="fw-btn" onclick="TPL._formSel(TPL._formFirstSec())">编辑第一个区块 →</button>
      <button class="fw-btn" onclick="TPL._formLoadPreset(false)">载入主子表示例（草稿）</button>
      <button class="fw-btn pri" onclick="TPL._formLoadPreset(true)">载入并应用（入库单）</button>
      <button class="fw-btn" onclick="TPL._formJSON()">查看配置 JSON</button>
    </div>
    <div class="fw-card"><div class="fw-card-hd"><b>01 · 骨架与主题</b><em>${secs.length} 个区块 · ${on} 个显示</em></div>
      ${fwF(
      "骨架模式",
      "layout.kind",
      `<select class="fw-sel" onchange="TPL._formSet('kind',this.value)">${fwOpts(sp.layoutKinds || [], L.kind)}</select>`,
      "single = 隐藏左卡，区块按单栏流式纵向排列；left-right = 左卡 + 右主区（改造前默认）"
    )}
      ${fwF(
      "全局密度",
      "layout.theme.density",
      `<select class="fw-sel" onchange="TPL._formSet('density',this.value)">${fwOpts(sp.densities || [], T.density)}</select>`,
      "控制栅格 gap 与区块上边距；normal 与改造前逐像素一致"
    )}
      ${fwF(
      "标签位置",
      "layout.theme.labelPos",
      `<select class="fw-sel" onchange="TPL._formSet('labelPos',this.value)">${fwOpts(sp.labelPositions || [], T.labelPos)}</select>`,
      "top = 标签在上（改造前默认）；inline = 标签在左横向排布"
    )}
      ${fwF(
      "左卡宽度",
      "layout.left.width",
      `<input class="fw-in" type="number" min="160" max="420" value="${+lf.width || 244}" onchange="TPL._formSet('leftWidth',this.value)">`,
      "px，默认 244；仅非默认值才注入 --dw-left-width，保留原有响应式"
    )}
        '左卡默认 card（名片 + 目录），目录内容自动跟随区块显示与排序')}
    </div>
    <div class="fw-card" style="margin-top:12px"><div class="fw-card-hd"><b>02 · 页脚动作</b><em>footer.actions / viewActions</em></div>
      ${fwF("编辑态动作", "layout.footer.actions", actBox(ft.actions || ["save", "reset", "close"], "edit"), "按勾选顺序渲染；决定 collect() 之后可用的按钮")}
      ${fwF("查看态动作", "layout.footer.viewActions", actBox(ft.viewActions || ["edit", "close"], "view"), "「编辑」按钮仍走 v1.29 的 _drawerEdit 配置链路")}
    </div>
    <div class="fw-hintbar">读取出口 <code>VC.formConfig()</code> · 渲染分派 <code>DETAIL_RENDERERS</code> ·
      字段控件 <code>CONTROLS</code> · 主题注入 <code>applyFormTheme()</code>。
      本面板只改 <code>cfg.formConfig</code>，列表的列、排序、筛选、行状态机一行未动。</div>`;
  }
  function dtCfgHTML(sec) {
    const sp = FORM.spec(), spec = FORM.normDetailSpec(sec.spec || {}), cols = spec.columns || [];
    Object.keys(sp.lookupSources || {});
    const pv = spec.preValidate || {}, sm = spec.summary || {}, mock = Object.keys(sp.mockApis || {});
    const sel = (id, key, list, cur2) => `<select class="fw-sel" onchange="TPL._dtSpec(${escJS(id)},${escJS(key)},this.value)">${list.map((k) => `<option value="${escA(k)}" ${String(cur2) === String(k) ? "selected" : ""}>${esc(k)}</option>`).join("")}</select>`;
    return `<div class="fw-card" style="margin-top:12px">
      <div class="fw-card-hd"><b>02 · 明细列定义</b><em>spec.columns · ${cols.length} 列 · 控件 / 公式 / 回填映射均可编辑</em></div>
      <div class="fw-acts" style="padding:9px 13px 0;margin:0">
        <button class="fw-btn" onclick="TPL._dtColAdd(${escJS(sec.id)})">＋ 添加列</button>
        <span style="font-size:10px;color:#909aaa;align-self:center">公式函数：${esc((sp.formulaFns || []).map((x) => x.key).join(" · "))}</span></div>
      <div class="dtcfg-wrap"><table class="dtcfg"><thead><tr>
        <th>#</th><th>字段名 k</th><th>标题 t</th><th>宽 w</th><th>控件 control</th><th>计算列</th>
        <th>行公式 formula</th><th>精度</th><th>候选源</th><th>回填映射 map</th><th>操作</th>
      </tr></thead><tbody>${dtCfgRows(sec, sp, cols)}</tbody></table></div>
      <div class="fw-hintbar">列名 / 字段名 / 公式 / 映射全部来自配置；引擎只读 <code>spec.columns[].k</code>，
        没有写死 <code>qty / price / amount</code> 等业务字段。<code>sum(amount)</code> 由 <code>spec.summary.formula</code> 决定。</div>
    </div>
    <div class="fw-card" style="margin-top:12px">
      <div class="fw-card-hd"><b>03 · 数据键、汇总与保存前校验</b><em>spec.dataKey / summary / preValidate / db</em></div>
      ${fwF(
      "明细数据键",
      "spec.dataKey",
      `<input class="fw-in" value="${escA(spec.dataKey)}" onchange="TPL._dtSpec(${escJS(sec.id)},'root','dataKey',this.value)">`,
      "对应 cur[spec.dataKey] 数组；collect() 直接读内存，不扫明细 input"
    )}
      ${fwF("行唯一键", "spec.rowKey", `<input class="fw-in" value="${escA(spec.rowKey)}" onchange="TPL._dtSpec(${escJS(sec.id)},'root','rowKey',this.value)">`, "增删行定位用")}
      ${fwF(
      "数据包键名",
      "spec.db",
      `<input class="fw-in" value="${escA(spec.db || "")}" onchange="TPL._dtSpec(${escJS(sec.id)},'root','db',this.value)">`,
      "__DB_PAYLOAD__ 里明细数组的键；默认与 dataKey 同名"
    )}
      ${fwF("汇总目标字段", "spec.summary.target", `<input class="fw-in" value="${escA(sm.target || "")}" onchange="TPL._dtSpec(${escJS(sec.id)},'summary','target',this.value)">`, "汇总值写回 cur[target]，并在 payload 输出")}
      ${fwF("汇总公式", "spec.summary.formula", `<input class="fw-in" value="${escA(sm.formula || "")}" onchange="TPL._dtSpec(${escJS(sec.id)},'summary','formula',this.value)">`, "如 sum(amount)，字段名来自列定义")}
      ${fwF("汇总标签 / 精度 / 键", "spec.summary", `<input class="fw-in" style="max-width:110px" value="${escA(sm.label || "")}" onchange="TPL._dtSpec(${escJS(sec.id)},'summary','label',this.value)">
        <input class="fw-in" style="max-width:62px" type="number" value="${escA(sm.precision == null ? "" : sm.precision)}" onchange="TPL._dtSpec(${escJS(sec.id)},'summary','precision',this.value)">
        <input class="fw-in" style="max-width:120px" value="${escA(sm.db || "")}" onchange="TPL._dtSpec(${escJS(sec.id)},'summary','db',this.value)">`, "标签 / 小数位 / payload 键名")}
      ${fwF(
      "启用保存前校验",
      "spec.preValidate.enabled",
      `<label class="fw-sw"><input type="checkbox" ${pv.enabled ? "checked" : ""} onchange="TPL._dtSpec(${escJS(sec.id)},'preValidate','enabled',this.checked)">提交前 await mock API</label>`,
      "关闭时 submit 同步走原流程，逐字等价；开启才异步"
    )}
      ${fwF("校验接口", "spec.preValidate.api", sel(sec.id, "preValidate|api", mock, pv.api), "mockApis 里声明的异步接口与延迟")}
      ${fwF(
      "金额字段 / 额度",
      "spec.preValidate",
      `<input class="fw-in" style="max-width:140px" value="${escA(pv.amountField || "")}" placeholder="取 vals 的字段" onchange="TPL._dtSpec(${escJS(sec.id)},'preValidate','amountField',this.value)">
        <input class="fw-in" style="max-width:100px" type="number" value="${escA(pv.limit == null ? "" : pv.limit)}" placeholder="固定额度" onchange="TPL._dtSpec(${escJS(sec.id)},'preValidate','limit',this.value)">
        <input class="fw-in" style="max-width:120px" value="${escA(pv.limitField || "")}" placeholder="或取单头字段作额度" onchange="TPL._dtSpec(${escJS(sec.id)},'preValidate','limitField',this.value)">`,
      "字段名与阈值均来自配置，引擎不写死"
    )}
      ${fwF(
      "判定规则 / 失败提示",
      "spec.preValidate.rule",
      `<input class="fw-in" style="max-width:190px" value="${escA(pv.rule || "")}" onchange="TPL._dtSpec(${escJS(sec.id)},'preValidate','rule',this.value)">
        <input class="fw-in" value="${escA(pv.message || "")}" onchange="TPL._dtSpec(${escJS(sec.id)},'preValidate','message',this.value)">`,
      "规则走通用公式求值器，如 amount <= limit；失败阻断 submit 并提示"
    )}
      ${fwF(
      "spec 高级编辑（JSON）",
      "spec",
      `<textarea class="dtcfg-json" onchange="TPL._dtSpecJSON(${escJS(sec.id)},this.value)">${esc(JSON.stringify(spec, null, 2))}</textarea>`,
      "配置信息不足时可直接补字段；保存时由 normDetailSpec 归一化"
    )}
    </div>
    ${dtFlowHTML(sec, sp, spec)}`;
  }
  function dtFlowSeqOf(spec) {
    const sp = FORM.spec(), ctl = sp.detailControls || [];
    return (spec.columns || []).filter((c) => {
      const m = ctl.find((x) => x.key === c.control);
      return m && m.editable !== false;
    }).map((c) => c.k);
  }
  function dtFlowNextRowsHTML(secId, seq, N, colMap) {
    const id = escJS(secId), keys = Object.keys(N);
    const opts = (cur2) => seq.map((k) => `<option value="${escA(k)}" ${k === cur2 ? "selected" : ""}>${esc(k)}${colMap[k] && colMap[k] !== k ? " · " + esc(colMap[k]) : ""}</option>`).join("");
    const grid = "display:grid;grid-template-columns:minmax(0,1fr) 22px minmax(0,1fr) 62px;gap:6px;align-items:center";
    const rows = keys.length ? keys.map((k, i) => `<div data-wl-flow-next-row="${i}" style="${grid};margin-bottom:5px">
      <select class="fw-sel" style="width:100%;height:27px" onchange="TPL._dtFlowNextRow(${id},${i},'key',this.value)">${opts(k)}</select>
      <span style="text-align:center;color:#0052d9;font-weight:600">→</span>
      <select class="fw-sel" style="width:100%;height:27px" onchange="TPL._dtFlowNextRow(${id},${i},'val',this.value)">${opts(N[k])}</select>
      <button type="button" class="fw-btn" style="height:27px;padding:0 8px;white-space:nowrap" onclick="TPL._dtFlowNextRowDel(${id},${i})">✕ 删除</button>
    </div>`).join("") : '<div style="font-size:11px;color:#909aaa;padding:6px 0">暂无映射，点下方「＋ 添加映射」开始配置</div>';
    return `<div data-wl-flow-next-ui="1" style="width:100%;box-sizing:border-box">
    <div style="${grid};font-size:10.5px;color:#8a94a6;padding-bottom:4px">
      <span>当前列（键）</span><span></span><span>下一列（值）</span><span style="text-align:right">操作</span></div>
    ${rows}
    <div style="display:flex;gap:10px;align-items:center;margin-top:6px;flex-wrap:wrap">
      <button type="button" class="fw-btn" style="height:27px" onclick="TPL._dtFlowNextRowAdd(${id})">＋ 添加映射</button>
      <span style="font-size:10.5px;color:#8a94a6">下拉选列即生成 next；首列 / 末列由链自动推导，无需手输 JSON</span>
    </div>
    <div style="margin-top:8px;font-size:10.5px;color:#6b7688">生成的 next（只读预览）</div>
    <pre data-wl-flow-next-preview style="margin:3px 0 0;padding:7px 9px;background:#f5f6f8;border:1px solid #e3e8ef;border-radius:4px;font:11px/1.6 ui-monospace,Menlo,Consolas,monospace;color:#2e405e;white-space:pre-wrap;word-break:break-all">${esc(JSON.stringify(N, null, 2))}</pre>
  </div>`;
  }
  function dtFlowHTML(sec, sp, spec) {
    const F = spec.flow || {}, ctl = sp.detailControls || [];
    const seq = spec.columns.filter((c) => {
      const m = ctl.find((x) => x.key === c.control);
      return m && m.editable !== false;
    }).map((c) => c.k);
    const H = {};
    (sp.flowHints || []).forEach((x) => H[x.key] = x.desc || "");
    const colMap = {};
    (spec.columns || []).forEach((c) => {
      colMap[c.k] = c.t || c.k;
    });
    const rawNext = F.next || {}, N = {};
    Object.keys(rawNext).forEach((key) => {
      const v = String(rawNext[key] == null ? "" : rawNext[key]);
      if (seq.indexOf(key) >= 0 && seq.indexOf(v) >= 0) N[key] = v;
    });
    const cKeys = Object.keys(N), cVals = cKeys.map((key) => N[key]);
    let first = "", tail = "";
    for (const key of cKeys) {
      if (cVals.indexOf(key) < 0) {
        first = key;
        break;
      }
    }
    for (const v of cVals) {
      if (cKeys.indexOf(v) < 0) {
        tail = v;
        break;
      }
    }
    if (!first) first = seq[0] || "";
    if (!tail) tail = seq[seq.length - 1] || "";
    const chain = [], seen = {};
    let k = first, guard = 0;
    while (k && !seen[k] && guard++ < seq.length + 2) {
      chain.push(k);
      seen[k] = 1;
      k = N[k] || "";
    }
    chain.push("＋ 新行 / 复用空行");
    chain.push(first || "—");
    const flowSet = (key) => `TPL._dtSpec('${escA(sec.id)}','flow','${key}',this.checked)`;
    return `<div class="fw-card" style="margin-top:12px">
      <div class="fw-card-hd"><b>04 · 键盘流转（纯键盘录入）</b><em>spec.flow · 唯一流转配置 next · 可编辑列 ${seq.length} 个</em></div>
      ${fwF(
      "启用键盘流转",
      "spec.flow.enabled",
      `<label class="fw-sw"><input type="checkbox" ${F.enabled !== false ? "checked" : ""} onchange="${flowSet("enabled")}">接管明细表回车键</label>`,
      H.enabled
    )}
      ${fwF("下一跳映射 next", "spec.flow.next", `${dtFlowNextRowsHTML(sec.id, seq, N, colMap)}<textarea class="dtcfg-json" style="display:none" readonly aria-hidden="true" onchange="TPL._dtFlowNext(${escJS(sec.id)},this.value)">${esc(JSON.stringify(N, null, 2))}</textarea>`, H.next)}
      ${fwF(
      "聚焦行为",
      "spec.flow.selectOnFocus",
      `<label class="fw-sw"><input type="checkbox" ${F.selectOnFocus !== false ? "checked" : ""} onchange="${flowSet("selectOnFocus")}">聚焦时全选</label>
         <label class="fw-sw"><input type="checkbox" ${F.preventScroll !== false ? "checked" : ""} onchange="${flowSet("preventScroll")}">聚焦不滚动页面</label>
         <label class="fw-sw"><input type="checkbox" ${F.keepScroll !== false ? "checked" : ""} onchange="${flowSet("keepScroll")}">保持滚动位置</label>`,
      H.selectOnFocus + " · " + H.preventScroll + " · " + H.keepScroll
    )}
      <div class="fw-hintbar"><b>next 链即首末列</b>：首列 = 没有被任何值指向的键
        <code>${esc(first || "—")}</code>；末列 = 只作为值出现、不作为键出现的列
        <code>${esc(tail || "—")}</code>；行内顺序 = 映射链顺序。<br>
        可编辑列顺序（<code>seq</code>，仅用于游离列兜底）：<code>${esc(seq.join(" → ") || "—")}</code><br>
        当前闭环：<b>${esc(chain.join(" → "))}</b><br>
        末列回车固定换行（优先复用下方整行空行，否则新增行）；弹窗确定回填后复用同一套流转，
        取消 / 校验失败留本列。first / tail / lookupNext / autoAppend / reuseEmptyRow 已废弃，旧配置忽略不报错。</div>
    </div>`;
  }
  function dtCfgRows(sec, sp, cols) {
    const srcKeys = Object.keys(sp.lookupSources || {}), id = sec.id;
    return cols.map((c, i) => `<tr>
    <td style="width:22px;color:#909aaa">${i + 1}</td>
    <td style="width:90px"><input value="${escA(c.k)}" onchange="TPL._dtCol(${escJS(id)},${i},'k',this.value)"></td>
    <td style="width:96px"><input value="${escA(c.t)}" onchange="TPL._dtCol(${escJS(id)},${i},'t',this.value)"></td>
    <td style="width:52px"><input type="number" value="${+c.w || 90}" onchange="TPL._dtCol(${escJS(id)},${i},'w',this.value)"></td>
    <td style="width:96px"><select onchange="TPL._dtCol(${escJS(id)},${i},'control',this.value)">
      ${(sp.detailControls || []).map((x) => `<option value="${escA(x.key)}" ${x.key === c.control ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></td>
    <td style="width:36px;text-align:center"><input type="checkbox" ${c.calc ? "checked" : ""} onchange="TPL._dtCol(${escJS(id)},${i},'calc',this.checked)"></td>
    <td style="width:118px"><input value="${escA(c.formula || "")}" placeholder="qty * price" onchange="TPL._dtCol(${escJS(id)},${i},'formula',this.value)"></td>
    <td style="width:48px"><input type="number" value="${escA(c.precision == null ? "" : c.precision)}" onchange="TPL._dtCol(${escJS(id)},${i},'precision',this.value)"></td>
    <td style="width:104px"><select onchange="TPL._dtCol(${escJS(id)},${i},'lookupSource',this.value)">
      <option value="">—</option>${srcKeys.map((k) => `<option value="${escA(k)}" ${(c.lookup || {}).source === k ? "selected" : ""}>${esc((sp.lookupSources[k] || {}).label || k)}</option>`).join("")}</select></td>
    <td style="width:130px"><input value="${escA(JSON.stringify((c.lookup || {}).map || {}))}" placeholder='{"name":"pName"}' onchange="TPL._dtCol(${escJS(id)},${i},'lookupMap',this.value)"></td>
    <td style="width:62px;white-space:nowrap">
      <button class="mini" title="上移" onclick="TPL._dtColMove(${escJS(id)},${i},-1)">↑</button>
      <button class="mini" title="下移" onclick="TPL._dtColMove(${escJS(id)},${i},1)">↓</button>
      <button class="mini" title="删除" onclick="TPL._dtColDel(${escJS(id)},${i})">×</button></td>
  </tr>`).join("");
  }
  function fwSecHTML(sec) {
    const sp = FORM.spec(), idx = (fDraft.layout.sections || []).indexOf(sec);
    const pool = FORM.allFields(), chosen = (sec.fields || []).slice();
    const q = fKw.trim();
    const hits = pool.filter((f) => !q || (f.l || "").indexOf(q) >= 0 || (f.k || "").indexOf(q) >= 0 || (f.group || "").indexOf(q) >= 0);
    const chips = chosen.map((k, i) => {
      const f = pool.find((x) => x.k === k) || { l: k };
      return `<span class="fw-chip">${esc(f.l)}
      <button title="上移" onclick="TPL._formFieldMove(${escJS(sec.id)},${i},-1)">↑</button>
      <button title="下移" onclick="TPL._formFieldMove(${escJS(sec.id)},${i},1)">↓</button>
      <button title="移除" onclick="TPL._formFieldToggle(${escJS(sec.id)},${escJS(k)},false)">×</button></span>`;
    }).join("");
    const grid = hits.map((f) => `<label title="${escA(f.k + " · " + f.l + " · " + (f.group || ""))}">
      <input type="checkbox" ${chosen.indexOf(f.k) >= 0 ? "checked" : ""}
        onchange="TPL._formFieldToggle(${escJS(sec.id)},${escJS(f.k)},this.checked)">
      <span>${esc(f.l)}</span><i>${esc(f.k)}</i></label>`).join("");
    const isForm = sec.renderer === "form", isTable = sec.renderer === "table", isNote = sec.renderer === "note", isET = sec.renderer === "editable-table";
    const colsCtrl = `<select class="fw-sel" onchange="TPL._formSec(${escJS(sec.id)},'cols',this.value)">
      ${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${+sec.cols === n ? "selected" : ""}>${n} 列</option>`).join("")}</select>`;
    return `<div class="fw-hd"><div><h4><i>${String(idx + 1).padStart(2, "0")}</i> ${esc(sec.title)} <em>${esc(sec.id)}</em></h4>
      <p>区块级配置：渲染器、列数、包含字段、显隐与合计，全部写进 <code>layout.sections[]</code>。</p></div>
      <div class="fw-stat">${fwStat()}</div></div>
    <div class="fw-acts">
      <button class="fw-btn" onclick="TPL._formSecMove(${escJS(sec.id)},-1)">↑ 上移</button>
      <button class="fw-btn" onclick="TPL._formSecMove(${escJS(sec.id)},1)">↓ 下移</button>
      <button class="fw-btn" onclick="TPL._formSel('__global__')">← 返回全局</button>
      <button class="fw-btn" onclick="TPL._formSecDel(${escJS(sec.id)})">删除此区块</button>
    </div>
    <div class="fw-card"><div class="fw-card-hd"><b>01 · 区块基础</b><em>${esc(sec.renderer)} / ${esc(sec.id)}</em></div>
      ${fwF("区块标题", "title", `<input class="fw-in" value="${escA(sec.title)}" onchange="TPL._formSec(${escJS(sec.id)},'title',this.value)">`, "显示在 section 的 h4 主标题")}
      ${fwF("副标题 / 计数", "note", `<input class="fw-in" value="${escA(sec.note)}" onchange="TPL._formSec(${escJS(sec.id)},'note',this.value)">`, "h4 右侧 em 文案；左卡目录的 note 同源")}
      ${fwF("左卡目录标题", "tocTitle", `<input class="fw-in" value="${escA(sec.tocTitle)}" onchange="TPL._formSec(${escJS(sec.id)},'tocTitle',this.value)">`, "左卡目录里显示的短标题")}
      ${fwF(
      "渲染器",
      "renderer",
      `<select class="fw-sel" onchange="TPL._formSec(${escJS(sec.id)},'renderer',this.value)">${fwOpts(sp.renderers || [], sec.renderer)}</select>`,
      "分派到 DETAIL_RENDERERS；form/table/cards/flow/note 由配置决定"
    )}
      ${fwF(
      "显示此区块",
      "show",
      `<label class="fw-sw"><input type="checkbox" ${sec.show !== false ? "checked" : ""} onchange="TPL._formSec(${escJS(sec.id)},'show',this.checked)">渲染并进入左卡目录</label>`,
      "关闭后 section 不渲染、目录自动移除，collect() 不再收集其字段"
    )}
      ${isForm ? fwF("栅格列数", "cols", colsCtrl, "写入 --dw-cols；默认 3 列与改造前一致，非默认值才激活覆盖") : ""}
      ${isTable ? fwF(
      "显示合计栏",
      "showSummary",
      `<label class="fw-sw"><input type="checkbox" ${!!sec.showSummary ? "checked" : ""} onchange="TPL._formSec(${escJS(sec.id)},'showSummary',this.checked)">表格下方追加批次合计</label>`,
      "由 table 渲染器读取，默认关闭以保持改造前 UI"
    ) : ""}
      ${isNote ? fwF("长文本内容", "spec.text", `<textarea class="fw-in" rows="4" style="height:auto;padding:6px 8px" onchange="TPL._formSecSpec(${escJS(sec.id)},'text',this.value)">${esc((sec.spec || {}).text || "")}</textarea>`, "note 渲染器输出") : ""}
    </div>
    ${isForm ? `<div class="fw-card" style="margin-top:12px">
      <div class="fw-card-hd"><b>02 · 包含字段</b><em>已选 ${chosen.length} / 共 ${pool.length}</em></div>
      <div class="fw-chips">${chips || '<span class="fw-empty">尚未选择字段</span>'}</div>
      <div class="fw-f" style="border-bottom:1px solid #eef0f3">
        <div class="fw-f-l"><b>字段池</b><code>layout.sections[].fields</code><small>按名称 / 字段名 / 分组搜索，勾选即写入顺序</small></div>
        <div class="fw-f-r"><input class="fw-in" id="fwFieldKw" value="${escA(fKw)}" placeholder="搜索字段…" oninput="TPL._formKw(this.value)">
          <button class="fw-btn" onclick="TPL._formFieldAll(${escJS(sec.id)},true)">全选可见</button>
          <button class="fw-btn" onclick="TPL._formFieldAll(${escJS(sec.id)},false)">清空</button></div></div>
      <div class="fw-pool" id="fwPool">${grid || '<div class="fw-empty">无匹配字段</div>'}</div>
     </div>` : ""}
    ${isET ? dtCfgHTML(sec) : ""}
    <div class="fw-hintbar">区块顺序可拖拽左栏行，也可用 ↑↓；保存后 <code>renderDrawer()</code> 按新顺序遍历
      <code>DETAIL_RENDERERS[sec.renderer]</code>，左卡目录 <code>tocItems()</code> 同源刷新。
      ${isET ? "主子表区块读 <code>cur[spec.dataKey]</code>，增删行 / 选录 / 公式 / 汇总 / 预校验均由同一份 <code>spec</code> 驱动；键盘流转读 <code>spec.flow</code>。" : ""}</div>`;
  }
  function fwRender() {
    buildFormDom();
    $("fwHdSub").textContent = "抽屉渲染引擎 · " + FORM.storeKey + " · 入口：「···」→ ⚙ 配置表单";
    fwLeftHTML();
    const r = $("fwRight"), sc = r.scrollTop;
    const kw = $("fwFieldKw"), focus = !!(kw && document.activeElement === kw), pos = kw ? kw.selectionStart : 0;
    const sec = fwSec(fSel);
    r.innerHTML = sec ? fwSecHTML(sec) : fwGlobalHTML();
    r.scrollTop = sc;
    const nk = $("fwFieldKw");
    if (nk && focus) {
      nk.focus();
      try {
        nk.setSelectionRange(pos, pos);
      } catch (e) {
      }
    }
    $("fwFtHint").textContent = "草稿未保存 · 共 " + (fDraft.layout.sections || []).length + " 个区块" + (FORM.hasStore() ? " · 已存在独立存档" : " · 首次配置（当前由 detail.groups 反推）");
  }
  function fwRedrawSoft() {
    fwRender();
  }
  Object.assign(window.TPL, {
    _formOpen() {
      buildFormDom();
      fDraft = VC.clone(VC.formConfig());
      fSel = "__global__";
      fKw = "";
      fwRender();
      fwShow(true);
    },
    _formClose() {
      fwShow(false);
      fDraft = null;
    },
    _formSel(id) {
      fSel = id;
      fKw = "";
      fwRender();
      $("fwRight").scrollTop = 0;
    },
    _formFirstSec() {
      return (fDraft.layout.sections[0] || {}).id || "__global__";
    },
    _formSet(k, v) {
      const L = fDraft.layout;
      L.theme = L.theme || {};
      L.left = L.left || {};
      if (k === "kind") L.kind = v;
      else if (k === "density") L.theme.density = v;
      else if (k === "labelPos") L.theme.labelPos = v;
      else if (k === "leftWidth") L.left.width = Math.max(160, Math.min(420, +v || 244));
      else if (k === "leftRenderer") L.left.renderer = v;
      fwRedrawSoft();
    },
    _formFooter(mode, key, on) {
      const ft = fDraft.layout.footer = fDraft.layout.footer || {};
      const prop = mode === "edit" ? "actions" : "viewActions";
      ft[prop] = ft[prop] || [];
      const i = ft[prop].indexOf(key);
      if (on && i < 0) ft[prop].push(key);
      if (!on && i >= 0) ft[prop].splice(i, 1);
      fwRedrawSoft();
    },
    _formSec(id, prop, v) {
      const s = fwSec(id);
      if (!s) return;
      if (prop === "cols") s.cols = +v;
      else if (prop === "show") s.show = !!v;
      else if (prop === "showSummary") s.showSummary = !!v;
      else s[prop] = v;
      if (prop === "renderer" && v === "editable-table" && (!s.spec || !s.spec.columns || !s.spec.columns.length)) {
        const pre = VC.clone((FORM.spec().detailPreset || {}).spec || {});
        s.spec = FORM.normDetailSpec(pre);
      }
      fwRedrawSoft();
    },
    _formSecSpec(id, k, v) {
      const s = fwSec(id);
      if (s) {
        s.spec = s.spec || {};
        s.spec[k] = v;
      }
    },
    _formSecMove(id, dir) {
      const a = fDraft.layout.sections, i = a.findIndex((x) => x.id === id), j = i + dir;
      if (i < 0 || j < 0 || j >= a.length) return;
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
      fwRedrawSoft();
    },
    _formSecAdd() {
      const a = fDraft.layout.sections;
      const id = "fw-sec-" + (a.length + 1) + "-" + Math.random().toString(36).slice(2, 6);
      a.push({
        id,
        title: "新区块 " + (a.length + 1),
        note: "自定义",
        tocTitle: "新区块",
        renderer: "note",
        cols: 3,
        fields: [],
        show: true,
        showSummary: false,
        builtin: false,
        spec: { text: "在右侧填写长文本内容" }
      });
      fSel = id;
      fwRedrawSoft();
    },
    _formSecDel(id) {
      const a = fDraft.layout.sections, i = a.findIndex((x) => x.id === id);
      if (i < 0) return;
      a.splice(i, 1);
      if (fSel === id) fSel = "__global__";
      fwRedrawSoft();
    },
    _formShowAll(on) {
      fDraft.layout.sections.forEach((s) => s.show = !!on);
      fwRedrawSoft();
    },
    _formKw(v) {
      fKw = String(v || "");
      fwRedrawSoft();
    },
    _formFieldToggle(id, k, on) {
      const s = fwSec(id);
      if (!s) return;
      s.fields = s.fields || [];
      const i = s.fields.indexOf(k);
      if (on && i < 0) s.fields.push(k);
      if (!on && i >= 0) s.fields.splice(i, 1);
      fwRedrawSoft();
    },
    _formFieldAll(id, on) {
      const s = fwSec(id);
      if (!s) return;
      const q = fKw.trim(), pool = FORM.allFields().filter((f) => !q || (f.l || "").indexOf(q) >= 0 || (f.k || "").indexOf(q) >= 0 || (f.group || "").indexOf(q) >= 0);
      if (on) pool.forEach((f) => {
        if ((s.fields || []).indexOf(f.k) < 0) s.fields.push(f.k);
      });
      else s.fields = [];
      fwRedrawSoft();
    },
    _formFieldMove(id, i, dir) {
      const s = fwSec(id);
      if (!s) return;
      const a = s.fields || [], j = i + dir;
      if (j < 0 || j >= a.length) return;
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
      fwRedrawSoft();
    },
    _formDragStart(id) {
      fDragId = id;
    },
    _formDragOver(e, el) {
      e.preventDefault();
      el.classList.add("drag-over");
    },
    _formDragEnd() {
      document.querySelectorAll("#fwList .drag-over").forEach((x) => x.classList.remove("drag-over"));
    },
    _formDrop(e, target) {
      e.preventDefault();
      e.stopPropagation();
      this._formDragEnd();
      if (!fDragId || fDragId === target) return;
      const a = fDraft.layout.sections, from = a.findIndex((x) => x.id === fDragId), to = a.findIndex((x) => x.id === target);
      if (from < 0 || to < 0) return;
      const [it] = a.splice(from, 1);
      a.splice(to, 0, it);
      fDragId = null;
      fwRedrawSoft();
    },
    _formReset() {
      fDraft = VC.clone(FORM.fromSchema());
      fSel = "__global__";
      fKw = "";
      fwRedrawSoft();
      window.TPL._toast("已恢复由 detail.groups 反推的默认配置，点「保存并应用」后生效");
    },
    _formSave() {
      FORM.set(fDraft);
      fwShow(false);
      const d = $("drawer");
      if (d && d.classList.contains("on") && cur) {
        try {
          renderDrawer();
        } catch (e) {
        }
      }
      fDraft = null;
      window.TPL._toast("配置表单已保存 · 独立存储 " + FORM.storeKey + " · 抽屉已应用");
    },
    _dtCol(id, i, prop, v) {
      const s = fwSec(id);
      if (!s) return;
      s.spec = s.spec || {};
      s.spec.columns = s.spec.columns || [];
      const c = s.spec.columns[i];
      if (!c) return;
      if (prop === "calc") c.calc = !!v;
      else if (prop === "w" || prop === "precision") c[prop] = v === "" ? "" : +v;
      else if (prop === "lookupSource") {
        c.lookup = Object.assign({}, c.lookup, { source: v });
      } else if (prop === "lookupMap") {
        try {
          c.lookup = Object.assign({}, c.lookup, { map: JSON.parse(v || "{}") });
        } catch (e) {
          window.TPL._toast("回填映射不是合法 JSON");
          return;
        }
      } else c[prop] = v;
      fwRedrawSoft();
    },
    _dtColAdd(id) {
      const s = fwSec(id);
      if (!s) return;
      s.spec = s.spec || {};
      s.spec.columns = s.spec.columns || [];
      s.spec.columns.push({ k: "col" + (s.spec.columns.length + 1), t: "新列", w: 90, control: "input" });
      fwRedrawSoft();
    },
    _dtColDel(id, i) {
      const s = fwSec(id);
      if (!s || !s.spec || !s.spec.columns) return;
      s.spec.columns.splice(i, 1);
      fwRedrawSoft();
    },
    _dtColMove(id, i, dir) {
      const s = fwSec(id);
      if (!s || !s.spec || !s.spec.columns) return;
      const a = s.spec.columns, j = i + dir;
      if (j < 0 || j >= a.length) return;
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
      fwRedrawSoft();
    },
    _dtSpec(id, group, key, v) {
      const s = fwSec(id);
      if (!s) return;
      s.spec = s.spec || {};
      let val = v;
      if (key === "enabled") val = !!v;
      else if (key === "limit" || key === "precision") val = +v;
      if (group === "root") s.spec[key] = val;
      else if (key.indexOf("|") > 0) {
        const parts = key.split("|");
        s.spec[parts[0]] = s.spec[parts[0]] || {};
        s.spec[parts[0]][parts[1]] = val;
      } else {
        s.spec[group] = s.spec[group] || {};
        s.spec[group][key] = val;
      }
      fwRedrawSoft();
    },
    _dtFlowNext(id, text) {
      const s = fwSec(id);
      if (!s) return;
      let o;
      try {
        o = JSON.parse(text || "{}");
      } catch (e) {
        window.TPL._toast("下一跳映射不是合法 JSON");
        return;
      }
      if (!o || typeof o !== "object" || Array.isArray(o)) {
        window.TPL._toast("下一跳映射须为 JSON 对象");
        return;
      }
      s.spec = s.spec || {};
      s.spec.flow = s.spec.flow || {};
      s.spec.flow.next = o;
      window.TPL._toast("下一跳映射已更新 · 点「保存并应用」生效");
      fwRedrawSoft();
    },
    _dtFlowNextPairs(id) {
      if (!fDraft) return null;
      const s = fwSec(id);
      if (!s) return null;
      s.spec = s.spec || {};
      s.spec.flow = s.spec.flow || {};
      const N = s.spec.flow.next || {};
      return { s, N, pairs: Object.keys(N).map((k) => [k, String(N[k] == null ? "" : N[k])]) };
    },
    _dtFlowNextRow(id, i, part, v) {
      const p = window.TPL._dtFlowNextPairs(id);
      if (!p || !p.pairs[i]) return;
      const val = String(v || "");
      if (part === "key") {
        if (!val) {
          window.TPL._toast("当前列不能为空");
          fwRedrawSoft();
          return;
        }
        if (p.pairs.some((x, j) => j !== i && x[0] === val)) {
          window.TPL._toast("该列已在其它映射中作为当前列");
          fwRedrawSoft();
          return;
        }
        p.pairs[i][0] = val;
      } else p.pairs[i][1] = val;
      const o = {};
      p.pairs.forEach((x) => {
        if (x[0]) o[x[0]] = x[1];
      });
      window.TPL._dtFlowNext(id, JSON.stringify(o));
    },
    _dtFlowNextRowAdd(id) {
      const p = window.TPL._dtFlowNextPairs(id);
      if (!p) return;
      const seq = dtFlowSeqOf(p.s.spec || {});
      const usedK = {}, usedV = {};
      p.pairs.forEach((x) => {
        usedK[x[0]] = 1;
        usedV[x[1]] = 1;
      });
      const key = seq.find((k) => !usedK[k]) || "";
      if (!key) {
        window.TPL._toast("所有可编辑列都已作为当前列");
        return;
      }
      const val = seq.find((k) => k !== key && !usedV[k]) || key;
      const o = {};
      p.pairs.forEach((x) => {
        if (x[0]) o[x[0]] = x[1];
      });
      o[key] = val;
      window.TPL._dtFlowNext(id, JSON.stringify(o));
    },
    _dtFlowNextRowDel(id, i) {
      const p = window.TPL._dtFlowNextPairs(id);
      if (!p || !p.pairs[i]) return;
      const o = {};
      p.pairs.forEach((x, j) => {
        if (j !== i && x[0]) o[x[0]] = x[1];
      });
      window.TPL._dtFlowNext(id, JSON.stringify(o));
    },
    _dtSpecJSON(id, text) {
      const s = fwSec(id);
      if (!s) return;
      try {
        s.spec = FORM.normDetailSpec(JSON.parse(text));
        window.TPL._toast("spec 已更新，点「保存并应用」生效");
      } catch (e) {
        window.TPL._toast("spec 不是合法 JSON");
        return;
      }
      fwRedrawSoft();
    },
    _formLoadPreset(apply) {
      const pre = VC.clone((FORM.spec() || {}).detailPreset || {});
      if (!pre.id) return;
      pre.spec = FORM.normDetailSpec(pre.spec || {});
      const a = fDraft.layout.sections, i = a.findIndex((x) => x.id === pre.id);
      if (i >= 0) a[i] = pre;
      else a.push(pre);
      fSel = pre.id;
      if (apply) {
        FORM.set(fDraft);
        fwShow(false);
        const d = $("drawer");
        if (d && d.classList.contains("on") && cur) {
          try {
            renderDrawer();
          } catch (e) {
          }
        }
        fDraft = null;
        window.TPL._toast("已载入并应用「入库明细」· 打开任一行的编辑态即可增删明细行");
      } else {
        fwRedrawSoft();
        window.TPL._toast("已载入主子表示例到草稿，点「保存并应用」后生效");
      }
    },
    _formJSON() {
      buildFormDom();
      const data = {
        storeKey: FORM.storeKey,
        hasStore: FORM.hasStore(),
        spec: FORM.spec(),
        draft: fDraft,
        saved: VC.formConfig()
      };
      $("fwJsonPre").textContent = JSON.stringify(data, null, 2);
      window.__FW_JSON__ = $("fwJsonPre").textContent;
      $("fwJson").classList.add("on");
    },
    _formJSONClose() {
      const j = $("fwJson");
      if (j) j.classList.remove("on");
    }
  });
  function scrollTopFor(t, main) {
    return t.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 8;
  }
  function bindToc() {
    const main = $("tplMain");
    if (!main) return;
    const links = document.querySelectorAll(".da-toc a[data-target]");
    links.forEach((a) => a.onclick = () => {
      const t = $("dwBody").querySelector("#" + a.dataset.target);
      if (t) main.scrollTo({ top: scrollTopFor(t, main), behavior: "smooth" });
      links.forEach((x) => x.classList.remove("on"));
      a.classList.add("on");
    });
    document.querySelector(".da-toc-top")?.addEventListener("click", () => main.scrollTo({ top: 0, behavior: "smooth" }));
    main.onscroll = () => {
      const secs = [...main.querySelectorAll("section[id]")];
      let act = secs[0];
      for (const s of secs) {
        if (s.offsetTop - main.offsetTop - 40 <= main.scrollTop) act = s;
      }
      links.forEach((x) => x.classList.toggle("on", x.dataset.target === act.id));
    };
  }
  function collect() {
    syncArch();
    const out = {};
    const dtRoots = [].slice.call($("dwBody").querySelectorAll(".dt-wrap"));
    $("dwBody").querySelectorAll("[data-k]").forEach((el) => {
      if (el.classList.contains("sa-sw-cb")) return;
      if (dtRoots.some((w) => w.contains(el))) return;
      out[el.dataset.k] = el.value;
    });
    const dm = [];
    DETAIL.sections().forEach((sec) => {
      const sp = DETAIL.specOf(sec), sm = sp.summary || {};
      out[sp.dataKey] = VC.clone(DETAIL.rows(sec));
      if (sm.target) out[sm.target] = cur[sm.target];
      dm.push({
        secId: sec.id,
        dataKey: sp.dataKey,
        db: sp.db || sp.dataKey,
        rowKey: sp.rowKey,
        columns: sp.columns.map((c) => c.k),
        summaryKey: sm.target || "",
        summaryDb: sm.db || sm.target || "",
        summaryFormula: sm.formula || "",
        preValidate: VC.clone(sp.preValidate || {})
      });
    });
    if (dm.length) out.__detailSections = dm;
    return out;
  }
  function buildPayload(vals) {
    const map = S.db.dbMap || {}, rules = S.db.valueRules || {}, out = {};
    const dm = vals.__detailSections || [], dkeys = {};
    dm.forEach((d) => {
      dkeys[d.dataKey] = 1;
      if (d.summaryKey) dkeys[d.summaryKey] = 1;
    });
    Object.keys(vals).forEach((k) => {
      if (k === "__detailSections" || dkeys[k]) return;
      const m = map[k];
      if (!m || !m.p) {
        return;
      }
      let v = vals[k];
      if (rules.split && rules.split[k]) {
        const parts = String(v).split(/[\/／]/);
        rules.split[k].forEach((p, i) => out[p] = +(parts[i] || 0));
        return;
      }
      if ((rules.bool || []).indexOf(m.p) >= 0) v = v === "是" || v === "1" || v === "true" ? 1 : 0;
      if ((rules.invert || []).indexOf(m.p) >= 0) v = v ? 0 : 1;
      if ((rules.date || []).indexOf(m.p) >= 0) v = normDate(v);
      out[m.p] = v;
    });
    const archKey = S.detail.archKey || "sa_arch";
    if (vals[archKey]) {
      try {
        out.__annex = JSON.parse(vals[archKey]);
      } catch (e) {
      }
    }
    out.__pageRoutes = VC.clone(FEAT.routes());
    out.__pageActions = VC.clone(PAGE.all());
    out.__pageSpec = VC.clone(PAGE.spec());
    out.__columnClick = VC.cols(st.view).map(function(c) {
      const g = clickCfg(c);
      const o = {
        col: c.k,
        title: c.t,
        renderer: c.renderer,
        scene: g.scene,
        field: g.field,
        param: g.param,
        enabled: g.enabled,
        clickTitle: g.title,
        resolution: g.scene ? PAGE.resolve(g.scene).status : "unbound"
      };
      if (c.renderer === "actions") {
        o.buttons = vcBtnList(c).map(function(b, i) {
          const bg = clickCfg(c, b), rs = buttonResolve(c, b);
          return {
            index: i,
            label: String(b.label || ""),
            scene: bg.scene,
            field: bg.field,
            param: bg.param,
            title: bg.title,
            enabled: bg.enabled,
            onMissing: bg.onMissing,
            status: rs.status,
            display: rs.display
          };
        });
      }
      return o;
    });
    out.__features = VC.clone(FEAT.all());
    dm.forEach((d) => {
      out[d.db] = VC.clone(vals[d.dataKey] || []);
      if (d.summaryKey) out[d.summaryDb] = vals[d.summaryKey];
    });
    if (dm.length) out.__detailMeta = VC.clone(dm);
    window.__DB_PAYLOAD__ = out;
    return out;
  }
  function resultHTML(state, payload, info) {
    const R = S.result || {};
    const ok = state === "success";
    const title = state === "loading" ? R.pendingTitle || "提交中" : ok ? R.okTitle || "保存成功" : R.failTitle || "保存失败";
    const msg = state === "loading" ? R.pendingMsg || "正在提交，请稍候" : ok ? R.okMsg || "操作已完成" : R.failMsg || "提交未成功，请检查后重试";
    const ico = state === "loading" ? '<div class="sr-spin"></div>' : ok ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6L9 17l-5-5"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    const lines = info && info.lines || [];
    const kv = lines.map((x) => `<div class="ss-line"><span class="k">${esc(x.k)}</span><span class="v">${esc(x.v)}</span></div>`).join("");
    return `<div class="ss-hd"><span class="hd-t">处理结果</span><span class="hd-sub">${esc(info && info.sub || "")}</span>
    <span class="hd-mode">${esc(curMode === "edit" ? "编辑模式" : "详情模式")}</span><span class="hd-time">${(/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false })}</span>
    <button class="ss-x" title="返回" onclick="TPL._closeResult()">×</button></div>
    <div class="ss-bd"><div class="ss-center"><div class="ss-ico">${ico}</div>
      <div class="ss-h1">${esc(title)}</div><div class="ss-msg">${esc(msg)}</div>
      <div class="ss-lead">${esc(info && info.lead || "")}</div>
      <div class="ss-meta"><span><i></i>${esc(info && info.http || "HTTP 200")}</span><span><i></i>${esc(info && info.ms || "—")}</span><span><i></i>${esc(info && info.req || "—")}</span><span><i></i>${esc(S.meta.pageTitle)}</span></div>
      <details class="ss-more" ontoggle="this.closest('.sr-sheet').dataset.expanded=this.open?1:0"><summary>查看返回明细 <b>${lines.length} 项</b></summary>
        <div class="ss-body"><div class="ss-kv">${kv}</div><div class="ss-note">${esc(R.note || "以上为本次保存的完整返回信息，已在一屏内平铺展示。")}</div></div></details>
    </div></div>
    <div class="ss-ft"><span class="ss-ftchip"><i></i>${esc(ok ? R.okFoot || "数据已写回，列表与详情已同步刷新" : R.failFoot || "未写入数据，可返回修改后重试")}</span>
      <div class="acts">${ok ? `<button class="btn ss-main" onclick="TPL._closeResult(true)">${esc(R.okBtn || "完成")}</button><button class="btn ghost" onclick="TPL._closeResult()">${esc(R.backBtn || "返回编辑")}</button>` : `<button class="btn ss-main" onclick="TPL._retry()">${esc(R.retryBtn || "重试")}</button><button class="btn ghost" onclick="TPL._closeResult()">${esc(R.backBtn || "返回修改")}</button>`}</div></div>`;
  }
  function showResult(state, payload, info) {
    const sh = $("srSheet");
    sh.className = "sr-sheet on";
    sh.setAttribute("data-state", state);
    sh.setAttribute("data-expanded", "0");
    sh.innerHTML = resultHTML(state, payload, info);
  }
  function submit(force) {
    if (submitting) return;
    submitting = true;
    const vals = collect(), payload = buildPayload(vals);
    const tasks = DETAIL.preValidateTasks(vals, payload);
    if (tasks.length) {
      Promise.all(tasks).then(function(rs) {
        const bad = rs.find((r) => !r.ok);
        if (bad) {
          submitting = false;
          DETAIL.showValidateError(bad);
          return;
        }
        DETAIL.clearValidateError();
        window.__WL_PREVALIDATE__ = { ok: true, results: rs, ts: Date.now() };
        finishSubmit(force, vals, payload);
      });
      return;
    }
    finishSubmit(force, vals, payload);
  }
  function finishSubmit(force, vals, payload) {
    const info = {
      sub: `${cur[S.detail.subCodeField] || ""} · ${cur[S.detail.primaryField] || ""}`,
      lead: `${cur[S.detail.primaryField] || ""} · 更新字段 ${Object.keys(vals).length} 项`,
      http: force === "fail" ? "HTTP 500" : "HTTP 200",
      ms: "632 ms",
      req: "REQ-" + Math.floor(1e7 + Math.random() * 89999999),
      lines: [
        { k: "更新字段", v: Object.keys(vals).length + " 项" },
        { k: "业务域", v: S.meta.pageTitle },
        { k: "主键", v: S.db.primaryTable + "." + S.db.primaryKey },
        { k: "写入表", v: S.db.primaryTable },
        { k: "字典表", v: S.db.dictTable || "OptionText" },
        { k: "资料卡表", v: S.db.annexTable || "—" },
        { k: "接口", v: "magic_api /save" },
        { k: "请求标识", v: "REQ-" + Math.floor(1e7 + Math.random() * 89999999) },
        { k: "数据落地", v: "前端演示数据（未连数据库）" },
        { k: "响应", v: (force === "fail" ? "HTTP 500" : "HTTP 200") + " · 632 ms" }
      ]
    };
    showResult("loading", payload, info);
    setTimeout(() => {
      submitting = false;
      if (!cur) return;
      const res = force === "fail" || force !== "ok" && window.TPL.forceResult === "fail" ? "fail" : "success";
      if (res === "success") {
        Object.keys(vals).forEach((k) => {
          if (k !== (S.detail.archKey || "sa_arch") && k.indexOf("__") !== 0) cur[k] = vals[k];
        });
        try {
          cur[S.detail.archKey || "sa_arch"] = JSON.parse(vals[S.detail.archKey || "sa_arch"] || "[]");
        } catch (e) {
        }
        if (cur.__new) {
          delete cur.__new;
          ROWS.push(cur);
        }
        DETAIL.commit(cur);
        renderRows();
      }
      info.http = res === "success" ? "HTTP 200" : "HTTP 500";
      info.lines[info.lines.length - 1] = { k: "响应", v: info.http + " · 632 ms" };
      showResult(res, payload, info);
    }, 520);
  }
  const api = {
    _toast(m) {
      const t = $("tplToast");
      if (!t) return;
      t.textContent = m;
      t.classList.add("on");
      clearTimeout(t._tm);
      t._tm = setTimeout(() => t.classList.remove("on"), 1800);
    },
    _view(id) {
      VC.activate(id);
    },
    _kw(v) {
      st.kw = v;
      st.page = 1;
      renderRows();
    },
    _toolbar(f, v) {
      st.toolbar[f] = v;
      st.page = 1;
      renderRows();
    },
    _q(k, v) {
      st.q[k] = v;
      st.page = 1;
      renderRows();
    },
    _adv() {
      st.adv = !st.adv;
      $("tplAdvWrap").innerHTML = advHTML();
      const c = $("tplCondN");
      if (c) c.textContent = hiddenCount();
    },
    _sort(k) {
      if (st.sort === k) st.asc = !st.asc;
      else {
        st.sort = k;
        st.asc = true;
      }
      renderRows();
    },
    _page(n) {
      st.page = Math.max(1, n);
      renderRows();
    },
    _size(n) {
      st.size = n;
      st.page = 1;
      renderRows();
    },
    _row(i) {
      st.activeRow = i;
      renderRows();
    },
    _sel(i, on) {
      if (typeof on !== "boolean") on = !st.checked.has(i);
      on ? st.checked.add(i) : st.checked.delete(i);
      renderRows();
    },
    _cellClick(i, colKey, sceneOverride, btnIdx, el) {
      const r = ROWS.find((x) => x.__idx === i);
      if (!r) return;
      const cols = VC.cols(st.view), c = cols.find((x) => x.k === colKey) || { k: colKey };
      const bs = c.render && c.render.buttons || [];
      const btn = typeof btnIdx === "number" ? bs[btnIdx] || {} : {};
      const g = clickCfg(c, btn);
      const scene = sceneOverride || g.scene;
      if (!g.enabled || !scene) return;
      const field = g.field || c.k || colKey;
      const rs = buttonResolve(c, btn);
      const ctx = {
        idx: i,
        col: c.k || colKey,
        field,
        param: g.param,
        title: g.title,
        value: r[field],
        row: r,
        scene,
        el: el || null,
        source: "column-button",
        buttonIndex: btnIdx,
        buttonLabel: String(btn.label || ""),
        buttonTitle: g.title,
        resolution: rs.status,
        display: rs.display
      };
      if (rs.display === "disable" || rs.display === "hide") return;
      api._open(i, scene === "edit" ? "edit" : scene === "link" ? "link" : "view", ctx);
    },
    _drawerEdit() {
      const cols = VC.cols(st.view), i = cur && cur.__idx != null ? cur.__idx : 0;
      const r = ROWS.find((x) => x.__idx === i) || cur || {};
      let btn = null, col = null;
      cols.forEach(function(c) {
        if (c.renderer !== "actions") return;
        (c.render && c.render.buttons || []).forEach(function(b) {
          if (b.scene === "edit" && !btn) {
            btn = b;
            col = c;
          }
        });
      });
      const lf = S.list.linkField || "";
      const g = clickCfg(
        col || { k: "drawer", clickField: lf },
        btn || { scene: "edit", field: lf, param: "code" }
      );
      const field = g.field || lf;
      const ctx = {
        idx: i,
        col: col && col.k || "drawer",
        field,
        param: g.param || "code",
        title: g.title || "编辑",
        value: r[field],
        row: r,
        scene: g.scene || "edit",
        source: "drawer-button",
        buttonIndex: null,
        buttonLabel: S.meta.editLabel || "编辑",
        buttonTitle: g.title || "编辑"
      };
      if (window.PAGE && PAGE.dispatch(ctx.scene, ctx)) return;
      curMode = "edit";
      renderDrawer();
    },
    _open(i, mode, ctx) {
      if (i == null) {
        i = cur ? cur.__idx : 0;
      }
      const r = ROWS.find((x) => x.__idx === i);
      if (!r) return;
      const scene = ctx && ctx.scene ? ctx.scene : mode === "edit" ? "edit" : mode === "link" ? "link" : "view";
      if (window.PAGE && PAGE.dispatch(scene, ctx || { idx: i })) return;
      cur = r;
      curMode = scene === "edit" || mode === "edit" ? "edit" : "view";
      api._row(i);
      $("mask").classList.add("on");
      renderDrawer();
    },
    _new() {
      if (window.PAGE && PAGE.dispatch("new", {})) return;
      const base = Object.assign({}, S.detail.samples || {});
      Object.keys(base).forEach((k) => {
        if (!(S.data && S.data.variants && S.data.variants[k])) base[k] = "";
      });
      base.__idx = ROWS.length ? Math.max(...ROWS.map((r) => r.__idx)) + 1 : 0;
      base.__new = 1;
      base[S.list.linkField] = String((S.detail.samples || {})[S.list.linkField] || "NEW-").replace(/\d+$/, "") + String(1e3 + base.__idx).padStart(4, "0");
      base[S.detail.primaryField] = S.meta.newDefaultName || "新建记录";
      (S.detail.newDefaults || []).forEach((x) => base[x.k] = x.v);
      cur = base;
      curMode = "edit";
      $("mask").classList.add("on");
      renderDrawer();
    },
    _close() {
      if (cur && cur.__new) ;
      $("mask").classList.remove("on");
      $("drawer").classList.remove("on");
      $("srSheet").className = "sr-sheet";
      cur = null;
    },
    _refresh() {
      if (cur) renderDrawer();
      api._toast("详情已刷新");
    },
    _reset() {
      if (cur) renderDrawer();
      api._toast("已重置为当前记录值");
    },
    _save() {
      submit("auto");
    },
    _retry() {
      submit("ok");
    },
    _closeResult(done) {
      $("srSheet").className = "sr-sheet";
      if (done) api._close();
    },
    _sw(cb) {
      const hid = cb.parentNode.parentNode.querySelector("input[type=hidden]");
      const v = cb.checked ? "是" : "否";
      cb.value = v;
      if (hid) hid.value = v;
      cb.parentNode.querySelector(".txt").textContent = v;
    },
    _comboInput(el) {
      api._comboOpen(el);
    },
    _comboOpen(el) {
      const wrap = el.closest(".tpl-combo"), f = fieldDefs().find((x) => x.k === el.dataset.k), list = optList(f || {}), q = el.value.trim();
      const hit = list.filter((x) => !q || x.indexOf(q) >= 0).slice(0, 60);
      wrap.querySelector(".tpl-combo-panel").innerHTML = hit.length ? hit.map((x) => `<div onmousedown="TPL._comboPick(this,${escJS(x)})">${esc(x)}</div>`).join("") : '<div class="empty">无匹配项，可保留自定义值</div>';
      wrap.classList.add("open");
    },
    _comboBlur(el) {
      setTimeout(() => el.closest(".tpl-combo").classList.remove("open"), 160);
    },
    _comboPick(node, v) {
      const wrap = node.closest(".tpl-combo");
      wrap.querySelector(".tpl-combo-ipt").value = v;
      wrap.classList.remove("open");
    },
    _archAdd() {
      const h = $("tplArchHidden");
      if (!h) return;
      syncArch();
      const list = JSON.parse(h.value || "[]");
      list.push({ type: (S.detail.archTypes || [])[0] || "新建资料", content: "", valid: "", scan: "", file: "", update: "" });
      h.value = JSON.stringify(list);
      if (cur && S.detail.archKey) cur[S.detail.archKey] = list;
      renderDrawer();
    },
    _archDel(i) {
      syncArch();
      const h = $("tplArchHidden"), list = JSON.parse(h.value || "[]");
      list.splice(i, 1);
      h.value = JSON.stringify(list);
      if (cur && S.detail.archKey) cur[S.detail.archKey] = list;
      renderDrawer();
    },
    _archType(i, v) {
      syncArch();
      const h = $("tplArchHidden"), list = JSON.parse(h.value || "[]");
      if (list[i]) list[i].type = v;
      h.value = JSON.stringify(list);
    },
    _archFile(i, el) {
      const name = el.files && el.files[0] ? el.files[0].name : "";
      const hid = el.parentNode.querySelector(".arch-f");
      if (hid) hid.value = name;
      const sp = el.parentNode.querySelector("span");
      if (sp) sp.textContent = name || "未选择文件";
      syncArch();
    },
    _jump(id) {
      const m = $("tplMain"), t = id && document.getElementById(id);
      if (m && t) m.scrollTo({ top: scrollTopFor(t, m), behavior: "smooth" });
    }
  };
  Object.assign(window.TPL, api);
  Object.assign(window.TPL, vcApi);
  (function() {
    const close0 = api._close, reset0 = api._reset;
    const wc = function() {
      DETAIL.restore(cur);
      return close0.apply(this, arguments);
    };
    const wr = function() {
      DETAIL.restore(cur);
      return reset0.apply(this, arguments);
    };
    api._close = wc;
    window.TPL._close = wc;
    api._reset = wr;
    window.TPL._reset = wr;
    window.TPL._collect = () => VC.clone(collect());
    window.TPL._dtConfig = () => VC.clone(VC.formConfig());
    window.TPL._dtSpecOf = (id) => {
      const sec = DETAIL.byId(id);
      return sec ? VC.clone(DETAIL.specOf(sec)) : null;
    };
  })();
  window.TPL.viewConfig = () => VC.clone(VC.cfg);
  window.TPL.resetViewConfig = () => {
    try {
      localStorage.removeItem(VC.key());
    } catch (e) {
    }
    location.reload();
  };
  function syncArch() {
    const h = $("tplArchHidden");
    if (!h) return;
    const list = [...document.querySelectorAll("#tplArch .da-arch-card")].map((card) => {
      const o = { type: (card.querySelector(".sa-arch-type") || {}).value || card.querySelector(".da-arch-hd b")?.textContent || "" };
      card.querySelectorAll(".arch-f").forEach((el) => o[el.dataset.af] = el.value);
      return o;
    });
    h.value = JSON.stringify(list);
    if (cur && S.detail.archKey) cur[S.detail.archKey] = list;
  }
  function fillShell() {
    const M = S.meta;
    document.title = `${M.pageTitle} · 列表 UI v1.33 · 键盘流录入`;
    const set = (id, v) => {
      const e = $(id);
      if (e) e.textContent = v;
    };
    set("tplAppName", M.appName === "中药饮片代煎管理平台" ? "H₂O管理平台" : M.appName);
    set("tplAppSub", M.appSub);
    set("tplCrumb", M.crumb);
    set("tplTab", M.pageTitle);
    set("tplSideGroup", M.sideGroup);
    set("tplSideItem", M.pageTitle);
    set("tplSideNoteTitle", M.sideNoteTitle || "说明");
    const note = $("tplSideNote");
    if (note) note.innerHTML = `<b>${esc(M.sideNoteBold || "")}</b><p>${esc(M.sideNote || "")}</p><small><span>目录条目 <b>${ROWS.length}</b></span><span>流转节点 <b>${(S.detail.timeline || []).length}</b></span></small>`;
    const q = $("tplQuick");
    if (q) q.innerHTML = VC.views().slice(0, 4).map((v) => `<a href="#" onclick="TPL._view(${escJS(v.id)});return false">${esc(v.label)}</a>`).join("");
    const st_ = $("sideToggle");
    if (st_) st_.onclick = () => $("app").classList.toggle("side-collapsed");
    const mask = $("mask");
    if (mask) mask.onclick = () => api._close();
  }
  window.TPL._cell = cellHTML;
  window.TPL._renderers = Object.keys(RENDERERS);
  window.TPL._columnSpec = function() {
    return S.list.columnSpec || {};
  };
  window.TPL._features = function() {
    return VC.clone(FEAT.all());
  };
  window.TPL._featureSpec = function() {
    return VC.clone(FEAT.spec);
  };
  window.TPL._pageRoutes = function() {
    return VC.clone(FEAT.routes());
  };
  window.TPL._routeLog = function() {
    return (window.__WL_ROUTE_LOG__ || []).slice();
  };
  window.TPL._columnDefs = function() {
    return S.list.columns || [];
  };
  window.TPL._snapshot = function() {
    const list = filtered(), total = list.length;
    const s = (st.page - 1) * st.size;
    const cols = VC.cols(st.view).map((c) => Object.assign({}, c, {
      fixed: c.fixed !== void 0 ? c.fixed : /\bstk\d?\b/.test(c.cls || "") ? "left" : false,
      nosort: !!c.nosort
    }));
    const d = VC.toolbarDefs(st.view);
    return {
      cols,
      rows: list.slice(s, s + st.size),
      total,
      activeRow: st.activeRow,
      checked: Array.from(st.checked),
      emptyText: S.list.emptyText || "未查询到符合条件的数据",
      linkField: S.list.linkField,
      sort: st.sort,
      asc: st.asc,
      ft: Object.assign(FEAT.switches(), { anyMenu: FEAT.anyMenu(), groupBy: FEAT.form("groupBy") || "", density: FEAT.form("density") || "normal" }),
      page: st.page,
      size: st.size,
      view: st.view,
      toolbar: Object.assign({}, st.toolbar),
      tbDefs: d.map((t) => ({ field: t.field, label: t.label, options: (t.options || []).slice() })),
      statusViews: VC.views().filter((v) => /^(warn|audit|off)$/.test(v.id)).map((v) => ({ id: v.id, label: v.label })),
      unit: S.meta.unit || "项"
    };
  };
  function boot() {
    if (!$("tpl-v121-density")) document.head.insertAdjacentHTML("beforeend", densityCSS());
    VC.init();
    VC.apply(VC.cfg.active, true);
    fillShell();
    $("main").innerHTML = listHTML();
    buildVCDom();
    renderRows();
    applyFeaturePresentation(true);
  }
  boot();
  if (location.hash === "#formConfig") {
    try {
      window.TPL._formOpen();
    } catch (e) {
    }
  }
  window.addEventListener("hashchange", function() {
    if (location.hash === "#formConfig") {
      try {
        window.TPL._formOpen();
      } catch (e) {
      }
    }
  });
})();
(function() {
  const T = window.TPL, V = window.Vue, main = document.getElementById("main");
  if (!T || !V || !window.__WL_HAS_EL__ || !main) return;
  var TEMPLATE = [
    '<el-table ref="tbl" class="wl-el-table" :data="rows" :fit="false"',
    '  :border="false" :stripe="false" :height="height" :empty-text="emptyText"',
    '  :row-class-name="rowClass" @row-click="onRowClick" @header-click="onHeaderClick">',
    '  <el-table-column v-for="(c,ci) in cols" :key="c.k" :prop="c.k" :label="c.t"',
    `    :width="c.w" :fixed="c.fixed" :align="c.align||'left'" :header-align="c.align||'left'"`,
    `    :class-name="'col-'+c.k+(c.nosort?' is-nosort':'')"`,
    '    :show-overflow-tooltip="false">',
    '    <template slot-scope="s"><span class="wl-cell" v-html="html(s.row,c)"></span></template>',
    "  </el-table-column>",
    "</el-table>"
  ].join("\n");
  function create() {
    const host = document.getElementById("wlElTable");
    if (!host || host.__wlMounted) return;
    if (window.__WL_EL__) {
      try {
        window.__WL_EL__.$destroy();
      } catch (e) {
      }
    }
    host.__wlMounted = true;
    host.innerHTML = "<div></div>";
    const vm = new V({
      template: TEMPLATE,
      data: function() {
        return {
          cols: [],
          rows: [],
          height: 600,
          emptyText: "未查询到符合条件的数据",
          activeRow: null,
          checked: [],
          nosort: {}
        };
      },
      methods: {
        html: function(row, c) {
          try {
            return T._cell(row, c);
          } catch (e) {
            return "";
          }
        },
        rowClass: function(o) {
          const i = o.row && o.row.__idx;
          const a = i != null && i === this.activeRow ? "act-row" : "";
          const b = i != null && this.checked.indexOf(i) >= 0 ? "chk" : "";
          return (a + " " + b).trim();
        },
        onRowClick: function(row, column, event) {
          const t = event && event.target;
          if (t && t.closest) {
            if (t.closest("td.col-chk")) return;
            if (t.closest(".lnk,.row-ops")) return;
          }
          if (row && row.__idx != null) T._row(row.__idx);
        },
        onHeaderClick: function(column) {
          const p = column && column.property;
          if (!p || this.nosort[p]) return;
          T._sort(p);
        },
        fitHeight: function() {
          const g = main.querySelector(".wl-grid");
          if (g) this.height = Math.max(160, g.clientHeight - 40);
          this.$nextTick(function() {
            try {
              this.$refs.tbl && this.$refs.tbl.doLayout();
            } catch (e) {
            }
          });
        },
        sync: function() {
          const d = T._snapshot();
          this.cols = d.cols;
          this.rows = d.rows;
          this.activeRow = d.activeRow;
          this.checked = d.checked;
          this.emptyText = d.emptyText;
          const m = {};
          d.cols.forEach(function(c) {
            if (c.nosort) m[c.k] = 1;
          });
          this.nosort = m;
          this.$nextTick(function() {
            try {
              this.$refs.tbl && this.$refs.tbl.doLayout();
            } catch (e) {
            }
          });
        }
      },
      mounted: function() {
        const self = this;
        this.fitHeight();
        this._ro = window.ResizeObserver ? new ResizeObserver(function() {
          self.fitHeight();
        }) : null;
        const g = main.querySelector(".wl-grid");
        if (this._ro && g) this._ro.observe(g);
        this._onResize = function() {
          self.fitHeight();
        };
        window.addEventListener("resize", this._onResize);
        this.ready = true;
        this.sync();
        this.$nextTick(function() {
          self.fitHeight();
        });
      },
      beforeDestroy: function() {
        if (this._ro) try {
          this._ro.disconnect();
        } catch (e) {
        }
        if (this._onResize) window.removeEventListener("resize", this._onResize);
      }
    });
    vm.$mount(host.firstElementChild);
    vm.ready = true;
    window.__WL_EL__ = vm;
  }
  let raf = null;
  if (window.MutationObserver) {
    new MutationObserver(function() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function() {
        create();
      });
    }).observe(main, { childList: true, subtree: true });
  }
  create();
})();
(function() {
  const T = window.TPL, E = window.ELEMENT, main = document.getElementById("main");
  if (!T || !main) return;
  document.body.classList.add("wl-v112");
  const wmSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='250' height='150'><text x='14' y='86' transform='rotate(-24 125 75)' font-family='sans-serif' font-size='13' fill='#2e405e' fill-opacity='.07'>Hello... 5709</text></svg>";
  const wmCss = document.createElement("style");
  wmCss.textContent = '#main .wl-page::after{background-image:url("data:image/svg+xml;utf8,' + encodeURIComponent(wmSvg) + '")}';
  document.head.appendChild(wmCss);
  function say(m, t) {
    if (E && E.Message) E.Message({ message: m, type: t || "info", duration: 1800 });
    else T._toast(m);
  }
  function note(title, text) {
    if (E && E.Notification) E.Notification({ title, message: text, type: "info", duration: 2600, position: "bottom-right" });
    else T._toast(title + " · " + text);
  }
  function confirmDo(text, title, cb) {
    if (E && E.MessageBox) {
      E.MessageBox.confirm(text, title, { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }).then(cb).catch(function() {
        say("已取消", "info");
      });
    } else if (window.confirm(text)) cb();
    else say("已取消", "info");
  }
  function activeFilters() {
    let n = 0;
    main.querySelectorAll("#tplAdvWrap input, #tplAdvWrap select").forEach(function(el) {
      if (el.value && el.value !== "全部") n++;
    });
    main.querySelectorAll(".wl-dds select").forEach(function(el) {
      if (el.value && el.value !== "全部") n++;
    });
    const kw = main.querySelector("#tplKw");
    if (kw && kw.value.trim()) n++;
    return n;
  }
  function updateCond() {
    const b = main.querySelector("#tplCondN");
    if (b) b.textContent = activeFilters();
  }
  function syncUI() {
    const tree = main.classList.contains("wl-tree-on");
    main.querySelectorAll(".wl-vt[data-mode]").forEach(function(b) {
      b.classList.toggle("on", b.dataset.mode === "tree" === tree);
    });
    const pick = function(frag, on) {
      const b = main.querySelector('.wl-vt[onclick*="' + frag + '"]');
      if (b) b.classList.toggle("on", on);
    };
    pick("_wlExpand", main.classList.contains("wl-expand-on"));
    pick("_wlGroup", main.classList.contains("wl-group-on"));
    pick("_adv", !!main.querySelector(".drug-adv.on"));
    const n = main.querySelector("#tplTotal"), rn = main.querySelector("#wlRailN");
    if (rn && n) rn.textContent = n.textContent;
    const first = main.querySelector(".wl-dds select");
    const val = first ? first.value : "";
    main.querySelectorAll(".wl-gchip").forEach(function(c) {
      c.classList.toggle("on", c.dataset.v === val);
    });
    updateCond();
  }
  ["_adv", "_q", "_toolbar", "_view", "_kw"].forEach(function(k) {
    const raw = T[k];
    T[k] = function() {
      const r = raw.apply(T, arguments);
      updateCond();
      return r;
    };
  });
  let raf = null;
  if (window.MutationObserver) {
    new MutationObserver(function() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncUI);
    }).observe(main, { childList: true, subtree: true });
  }
  syncUI();
  T._wlMenu = function() {
    main.classList.toggle("wl-menu-on");
    main.classList.remove("wl-new-open");
  };
  T._wlCloseMenu = function() {
    main.classList.remove("wl-menu-on");
  };
  T._wlNewMenu = function() {
    main.classList.toggle("wl-new-open");
    main.classList.remove("wl-menu-on");
  };
  T._wlCloseNew = function() {
    main.classList.remove("wl-new-open");
  };
  T._wlNewAction = function(a) {
    T._wlCloseMenu();
    T._wlCloseNew();
    const f = T[a];
    if (typeof f === "function") f.call(T);
  };
  document.addEventListener("click", function(e) {
    const inside = e.target.closest(".wl-new-dd") || e.target.closest(".wl-btn-more") || e.target.closest(".wl-menu") || e.target.closest(".wl-new-menu");
    if (!inside) {
      main.classList.remove("wl-menu-on");
      main.classList.remove("wl-new-open");
    }
  });
  T._wlImport = function() {
    confirmDo("从 Excel 批量导入药品档案？该操作为原型演示，不写入任何数据。", "批量导入", function() {
      say("导入任务已创建（原型演示）", "success");
    });
  };
  T._wlNode = function() {
    const act = main.querySelector(".wl-tab.on");
    const label = act ? act.textContent.replace(/\d+\s*$/, "").trim() : "全部药品";
    note("批次 / 养护节点", "当前视图：" + label + "；节点：建档 → 资质审核 → 价格复核 → 上架在库 → 停用淘汰");
  };
  T._wlFocus = function() {
    document.body.classList.toggle("wl-v113-full");
    const pure = document.body.classList.contains("wl-v113-full");
    say(pure ? "已切换为纯列表视图（对齐基准图）" : "已显示模板完整框架（顶栏 / 侧栏 / 标签栏）", "success");
  };
  T._wlCtx = function(v) {
    say("当前范围：" + v, "success");
  };
  T._wlExpand = function() {
    main.classList.toggle("wl-expand-on");
    say(main.classList.contains("wl-expand-on") ? "已展开全部行（长文本完整显示）" : "已收起行", "success");
    syncUI();
  };
  T._wlGroup = function() {
    main.classList.toggle("wl-group-on");
    say(main.classList.contains("wl-group-on") ? "已按工具栏字段分组，点击分组值可直接筛选" : "已取消分组", "success");
    syncUI();
  };
  T._wlMode = function(m) {
    main.classList.toggle("wl-tree-on", m === "tree");
    say(m === "tree" ? "已切换为树状视图（原型演示，列配置不变）" : "已切换为表格视图", "success");
    syncUI();
  };
  T._wlRail = function() {
    main.classList.toggle("wl-rail-on");
    syncUI();
  };
  T._wlWatermark = function() {
    main.classList.toggle("wl-no-wm");
    say(main.classList.contains("wl-no-wm") ? "水印已隐藏" : "水印已显示", "success");
  };
})();
(function() {
  const V = window.Vue, T = window.TPL, main = document.getElementById("main");
  if (!V || !T || !window.__WL_HAS_EL__ || !main) return;
  const ICONS = {
    expand: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h10M3 11h10M5 3l-2 2 2 2M5 9l-2 2 2 2"/></svg>',
    filter: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h12l-4.5 5v4l-3 1.5V8z"/></svg>',
    group: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="12" height="5"/></svg>',
    table: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12"/><path d="M2 6h12M2 10h12M7 2v12"/></svg>',
    tree: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v10M3 5h5M3 11h5M8 5h5M8 11h5"/></svg>'
  };
  const store = V.observable({
    total: 0,
    page: 1,
    size: 10,
    view: "all",
    unit: "项",
    toolbar: {},
    tbDefs: [],
    statusViews: [],
    ctxOptions: ["档案中心", "全部库房", "中药材仓库", "中成药仓库", "医药常温库"],
    ctx: "档案中心",
    expandOn: false,
    groupOn: false,
    treeOn: false,
    advOn: false,
    ft: (function() {
      try {
        return (T._snapshot() || {}).ft || {};
      } catch (e) {
        return {};
      }
    })()
  });
  const base = {
    computed: {
      st: function() {
        return store;
      },
      tbDefs: function() {
        return store.tbDefs;
      },
      toolActs: function() {
        const A = window.ACT;
        if (!A) return [];
        const map = {
          expandOn: store.expandOn,
          advOn: store.advOn,
          groupOn: store.groupOn,
          "!treeOn": !store.treeOn,
          treeOn: store.treeOn
        };
        return A.toolbar().map(function(a) {
          return {
            id: a.id,
            icon: a.icon,
            iconSvg: a.iconSvg,
            label: a.label,
            title: a.title,
            badge: a.badge,
            sepBefore: a.sepBefore,
            estate: a.estate,
            text: (a.badge ? a.label + " " : a.label) + (a.caret ? " ▾" : ""),
            on: !!map[a.estate]
          };
        });
      },
      newBtn: function() {
        const A = window.ACT;
        if (!A) return null;
        const a = A.header().filter(function(x) {
          return x.action === "new";
        })[0];
        if (!a) return null;
        return {
          id: a.id,
          label: a.label,
          svg: A.icon(a.icon, a.iconSvg, "wl-new-plus"),
          plain: !a.iconSvg && (!a.icon || a.icon === "plus")
        };
      },
      otherHeaderActs: function() {
        const A = window.ACT;
        if (!A) return [];
        const nb = this.newBtn;
        return A.header().filter(function(a) {
          return !nb || a.id !== nb.id;
        }).map(function(a) {
          return { id: a.id, label: a.label, svg: A.icon(a.icon, a.iconSvg) };
        });
      },
      newItems: function() {
        const A = window.ACT;
        if (!A) return [];
        return A.newMenu().map(function(a) {
          return { id: a.id, label: a.label, svg: A.icon(a.icon, a.iconSvg) };
        });
      },
      hasMore: function() {
        const A = window.ACT;
        return A ? A.more().length > 0 : false;
      },
      statusOpts: function() {
        return [{ l: "状态", v: "" }].concat(store.statusViews.map(function(v) {
          return { l: v.label, v: v.id };
        })).concat([{ l: "全部状态", v: "all" }]);
      },
      statusVal: function() {
        return /^(warn|audit|off)$/.test(store.view) ? store.view : "";
      },
      ctxOptions: function() {
        return store.ctxOptions;
      }
    },
    methods: {
      onNewCommand: function(id) {
        this.call("_actRun", id);
      },
      runAct: function(a) {
        if (a && a.id) this.call("_actRun", a.id);
      },
      iconSvg: function(a) {
        const A = window.ACT;
        return A ? A.icon(a.icon, a.iconSvg) : "";
      },
      call: function(name) {
        const a = Array.prototype.slice.call(arguments, 1), f = window.TPL[name];
        if (typeof f === "function") return f.apply(window.TPL, a);
      },
      icon: function(k) {
        return ICONS[k] || "";
      },
      opts: function(d) {
        return [{ l: d.label, v: "" }, { l: "全部", v: "全部" }].concat((d.options || []).map(function(o) {
          return { l: o, v: o };
        }));
      },
      optsW: function(os) {
        let m = 0;
        (os || []).forEach(function(o) {
          let w = 0;
          for (const ch of String(o.l)) w += /[\u4e00-\u9fa5]/.test(ch) ? 13 : 7.5;
          if (w > m) m = w;
        });
        return Math.max(92, Math.min(154, Math.round(m + 34)));
      },
      selW: function(d) {
        return this.optsW(this.opts(d));
      },
      onCtx: function(v) {
        store.ctx = v;
        this.call("_wlCtx", v);
      },
      onTb: function(f, v) {
        this.call("_toolbar", f, v);
      },
      onStatus: function(v) {
        this.call("_view", v || "all");
      },
      onSize: function(v) {
        this.call("_size", +v);
      },
      onPage: function(v) {
        if (v === store.page) return;
        this.call("_page", v);
      }
    }
  };
  const TPL_BTN = `<div class="wl-eb-line">
  <el-dropdown v-if="newBtn && newItems.length" class="wl-new-dd" trigger="click" placement="bottom-start" @command="onNewCommand">
    <el-button type="primary" class="wl-btn wl-btn-pri wl-new-btn" title="+ 新建"><svg v-if="newBtn.plain" class="wl-new-plus" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3.2v9.6M3.2 8h9.6"/></svg><span v-else class="wl-new-ico" v-html="newBtn.svg"></span><span>{{newBtn.label}}</span><svg class="wl-new-caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10L8 5.5l4.5 4.5"/></svg></el-button>
    <el-dropdown-menu slot="dropdown" class="wl-new-menu">
      <el-dropdown-item v-for="it in newItems" :key="it.id" :command="it.id"><span v-if="it.svg" class="wl-menu-ico" v-html="it.svg"></span>{{it.label}}</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
  <el-button v-else-if="newBtn" type="primary" class="wl-btn wl-btn-pri wl-new-btn" @click="runAct(newBtn)">＋ {{newBtn.label}}</el-button>
  <el-button v-for="a in otherHeaderActs" :key="a.id" class="wl-btn wl-btn-ghost" @click="runAct(a)"><span v-if="a.svg" class="wl-btn-ico" v-html="a.svg"></span>{{a.label}}</el-button>
  <el-button v-if="hasMore" class="wl-btn wl-btn-more" title="更多" @click="call('_wlMenu')">···</el-button>
</div>`;
  const TPL_CTX = `<el-select class="wl-ectx" :value="st.ctx" @change="onCtx" title="项目 / 库房上下文">
  <el-option v-for="o in ctxOptions" :key="o" :label="o" :value="o"></el-option>
</el-select>`;
  const TPL_SELS = `<div class="wl-esels-line">
  <el-select v-for="(d,ti) in tbDefs" :key="d.field" class="wl-esel"
    :style="{width:selW(d)+'px'}" :value="st.toolbar[d.field]||''" @change="onTb(d.field,$event)">
    <el-option v-for="o in opts(d)" :key="o.v" :label="o.l" :value="o.v"></el-option>
  </el-select>
  <el-select class="wl-esel wl-esel-status" :style="{width:optsW(statusOpts)+'px'}"
    :value="statusVal" @change="onStatus">
    <el-option v-for="o in statusOpts" :key="o.v" :label="o.l" :value="o.v"></el-option>
  </el-select>
</div>`;
  const TPL_TOOLS = `<div class="wl-etool-line"><template v-for="a in toolActs"><span class="wl-vt-sep" v-if="a.sepBefore" :key="a.id+'_s'"></span><el-button type="text" class="wl-vt" :key="a.id" :class="{on:a.on}" :title="a.title" @click="runAct(a)"><span v-html="iconSvg(a)"></span>{{a.text}}<b v-if="a.badge" id="tplCondN">0</b></el-button></template></div>`;
  const TPL_PAGESIZE = `<el-select class="wl-epagesize" :value="String(st.size)" @change="onSize">
  <el-option v-for="n in [10,20,50,100]" :key="n" :label="n" :value="String(n)"></el-option>
</el-select>`;
  const TPL_PAGER = `<el-pagination class="wl-epager" layout="prev,pager,next"
  :current-page="st.page" :page-size="st.size" :total="st.total" :pager-count="5"
  @current-change="onPage"></el-pagination>`;
  const DEFS = [
    { sel: "#wlElBtnHost", tpl: TPL_BTN },
    { sel: "#wlElCtxHost", tpl: TPL_CTX },
    { sel: "#wlElSelHost", tpl: TPL_SELS },
    { sel: "#wlElToolHost", tpl: TPL_TOOLS },
    { sel: "#wlElPageSizeHost", tpl: TPL_PAGESIZE },
    { sel: "#wlElPagerHost", tpl: TPL_PAGER }
  ];
  const mounted = {};
  function put(k, v) {
    const cur = store[k];
    if (cur && typeof cur === "object") {
      if (JSON.stringify(cur) === JSON.stringify(v)) return;
    } else if (cur === v) return;
    store[k] = v;
  }
  function sync() {
    if (!T._snapshot) return;
    const s = T._snapshot();
    put("total", s.total);
    put("page", s.page);
    put("size", s.size);
    put("view", s.view);
    put("unit", s.unit);
    put("toolbar", s.toolbar);
    put("tbDefs", s.tbDefs);
    put("statusViews", s.statusViews);
    put("expandOn", main.classList.contains("wl-expand-on"));
    put("groupOn", main.classList.contains("wl-group-on"));
    put("treeOn", main.classList.contains("wl-tree-on"));
    put("advOn", !!main.querySelector(".drug-adv.on"));
    put("ft", s.ft || {});
  }
  function escA(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function setShadows() {
    const host = document.getElementById("wlElSelHost");
    if (!host) return;
    let box = host.querySelector(".wl-dds-shadows");
    if (!box) {
      box = document.createElement("span");
      box.className = "wl-dds-shadows";
      box.style.display = "none";
      host.appendChild(box);
    }
    const vals = store.tbDefs.map(function(d) {
      return store.toolbar[d.field] || "";
    });
    vals.push(/^(warn|audit|off)$/.test(store.view) ? store.view : "");
    const key = vals.join("|");
    if (box.dataset.key === key) return;
    box.dataset.key = key;
    box.innerHTML = vals.map(function(v) {
      return v ? '<select><option value=""></option><option value="' + escA(v) + '" selected>' + escA(v) + "</option></select>" : '<select><option value="" selected></option></select>';
    }).join("");
  }
  function fixCond() {
    const b = document.getElementById("tplCondN");
    if (!b) return;
    let n = 0;
    document.querySelectorAll("#tplAdvWrap input, #tplAdvWrap select").forEach(function(el) {
      if (el.value && el.value !== "全部") n++;
    });
    document.querySelectorAll(".wl-dds select").forEach(function(el) {
      if (el.value && el.value !== "全部") n++;
    });
    const kw = document.getElementById("tplKw");
    if (kw && kw.value.trim()) n++;
    if (b.textContent !== String(n)) b.textContent = n;
  }
  function mountAll() {
    sync();
    DEFS.forEach(function(d) {
      const host = main.querySelector(d.sel);
      if (!host) return;
      const rec = mounted[d.sel];
      if (rec && rec.el === host && host.__wlMounted) return;
      if (rec && rec.vm) {
        try {
          rec.vm.$destroy();
        } catch (e) {
        }
      }
      host.__wlMounted = true;
      host.innerHTML = "<div></div>";
      const vm = new V({ mixins: [base], template: d.tpl });
      vm.$mount(host.firstElementChild);
      mounted[d.sel] = { el: host, vm };
    });
    setShadows();
    fixCond();
  }
  let busy = false, pending = false;
  function schedule() {
    if (busy) {
      pending = true;
      return;
    }
    busy = true;
    try {
      mountAll();
    } catch (e) {
    } finally {
      busy = false;
    }
    if (pending) {
      pending = false;
      requestAnimationFrame(schedule);
    }
  }
  if (window.MutationObserver) {
    new MutationObserver(function() {
      schedule();
    }).observe(main, { childList: true, subtree: true });
  }
  schedule();
  window.__WL_EL_CONTROLS__ = { sync };
})();
(function() {
  if (window.__WL_GUARD_LATE__) return;
  window.__WL_GUARD_LATE__ = 1;
  var G = window.__WL_GUARD__ || (window.__WL_GUARD__ = { batch: "1", writes: 0, blocks: [], audits: [] });
  function audit(name, obj) {
    var raw;
    try {
      raw = typeof obj === "string" ? obj : JSON.stringify(obj);
    } catch (e) {
      raw = String(obj);
    }
    raw = raw || "";
    var hits = {
      script: (raw.match(/<\s*script/gi) || []).length,
      protocol: (raw.match(/javascript\s*:|vbscript\s*:|data\s*:\s*text\s*\/\s*html/gi) || []).length,
      onattr: (raw.match(/\bon[a-z]+\s*=\s*["']/gi) || []).length,
      angle: (raw.match(/<\s*\/?\s*[a-z][^>]{0,80}>/gi) || []).length
    };
    var suspicious = hits.script + hits.protocol + hits.onattr;
    G.audits.push({ name, at: Date.now(), length: raw.length, suspicious, hits });
    if (G.audits.length > 80) G.audits.shift();
    return suspicious;
  }
  var T = window.TPL;
  if (T) {
    if (typeof T.apply === "function") {
      var origApply = T.apply;
      T.apply = function(s) {
        audit("TPL.apply", s);
        return origApply.call(T, s);
      };
    }
    T._guard = function() {
      return {
        writes: G.writes,
        blocks: G.blocks.slice(),
        audits: G.audits.slice(),
        coverage: (G.coverage || []).slice(),
        install: G.install || "early",
        harden: window.GUARD ? window.GUARD.harden : null,
        scan
      };
    };
    T._guardHarden = function(v) {
      return window.GUARD ? window.GUARD.harden(v) : { html: v, hit: false, reasons: [] };
    };
  }
  function scan() {
    var out = { elements: 0, badAttrs: [], scripts: [] };
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      out.elements++;
      var ats = el.attributes || [];
      for (var j = 0; j < ats.length; j++) {
        var n = ats[j].name || "", v = ats[j].value || "";
        if (/^on/i.test(n) && /\b(?:alert\s*\(|eval\s*\(|prompt\s*\(|confirm\s*\(|Function\s*\(|javascript\s*:|<\s*script)/i.test(v))
          out.badAttrs.push({ tag: el.tagName, attr: n, value: v.slice(0, 80) });
      }
      if (/^script$/i.test(el.tagName) && !el.type) {
        var src = el.getAttribute("src") || "", txt = (el.textContent || "").slice(0, 400);
        if (/javascript\s*:|vbscript\s*:/i.test(src) || /\b(?:alert|eval|prompt|confirm|Function)\s*\(/.test(txt))
          out.scripts.push({ id: el.id || "", src: src.slice(0, 60) });
      }
    }
    return out;
  }
  window.GUARD.scan = scan;
  var KEYS = ["TPL_SCHEMA_V113", "TPL_VIEW_CFG_V113"];
  try {
    for (var k = 0; k < localStorage.length; k++) {
      var key = localStorage.key(k);
      if (key && key.indexOf("TPL_VIEW_CFG_V113:") === 0) KEYS.push(key);
      if (key && key.indexOf("TPL_FORM_CFG_V113:") === 0) KEYS.push(key);
    }
  } catch (e) {
  }
  KEYS.forEach(function(k2) {
    try {
      var v = localStorage.getItem(k2);
      if (v != null) audit("localStorage:" + k2, v);
    } catch (e) {
    }
  });
  G.ready = true;
})();
(function() {
  if (window.__WL_B2_LATE__) return;
  window.__WL_B2_LATE__ = 1;
  var T = window.TPL, D = window.DETAIL;
  var R = window.__WL_REDRAW__ = {
    batch: "2",
    epoch: 0,
    shortCircuits: 0,
    redraws: 0,
    idempotent: 0,
    focusSync: 0,
    gated: 0,
    logs: [],
    ready: true,
    pending: null,
    queue: [],
    hosts: []
  };
  function log(kind, data) {
    R.logs.push(Object.assign({ at: Date.now(), epoch: R.epoch, kind }, data || {}));
    if (R.logs.length > 160) R.logs.shift();
  }
  function stamp() {
    R.epoch++;
  }
  var G = { expect: null, inputEpoch: 0, focusEpoch: 0, mode: "" };
  window.__WL_B2_GATE__ = function(el, name) {
    if (!el) return false;
    var box = document.getElementById("dtLookup");
    if (name === "focus" && (el.id === "dtLkKw" || el.closest && el.closest("#dtLookup"))) {
      if (!box || !box.classList.contains("on")) {
        R.gated++;
        log("skip-stale-lookup-focus", { id: el.id });
        return true;
      }
    }
    if ((name === "focus" || name === "select") && el.classList && el.classList.contains("dt-ipt") && G.expect) {
      var tr = el.closest ? el.closest("tr") : null;
      var rk = tr ? tr.getAttribute("data-rk") : "", col = el.dataset ? el.dataset.col : "";
      if (String(rk) !== String(G.expect.rk) || String(col) !== String(G.expect.col)) {
        R.gated++;
        log("skip-stale-cell-focus", { rk, col, expect: G.expect });
        return true;
      }
    }
    if (name === "select" && el.classList && el.classList.contains("dt-ipt") && G.inputEpoch > G.focusEpoch) {
      R.gated++;
      log("skip-stale-select", { col: el.dataset ? el.dataset.col : "" });
      return true;
    }
    return false;
  };
  if (T && typeof T._dtInput === "function") {
    var rawInput = T._dtInput;
    T._dtInput = function(e, id) {
      G.inputEpoch++;
      return rawInput.call(T, e, id);
    };
  }
  function syncFocus(secId, rk, col, F, why) {
    if (!D || typeof D.focusCell !== "function") return false;
    try {
      G.expect = null;
      G.focusEpoch = G.inputEpoch;
      var ok = D.focusCell(secId, String(rk), String(col), F || {});
      if (ok) {
        G.expect = { rk: String(rk), col: String(col) };
        G.focusEpoch = G.inputEpoch;
        R.focusSync++;
        log("sync-focus", { secId, rowKey: String(rk), col: String(col), why });
      }
      return ok;
    } catch (e) {
      return false;
    }
  }
  function flowOf(secId) {
    try {
      return D.flowSpec(D.byId(secId) || {});
    } catch (e) {
      return {};
    }
  }
  if (D) {
    if (typeof D.lookupKey === "function") {
      var rawLookupKey = D.lookupKey;
      D.lookupKey = function(e) {
        var before = null;
        try {
          before = D.lookupState;
        } catch (err) {
        }
        var willPick = e && e.key === "Enter" && before && before.list && before.list.length;
        var secId, rk, F;
        if (willPick) {
          secId = before.secId;
          rk = String(before.rk);
          F = flowOf(secId);
        }
        stamp();
        var ret = rawLookupKey.call(D, e);
        if (willPick) {
          var after = null;
          try {
            after = D.lookupState;
          } catch (err) {
          }
          if (!after) {
            G.mode = "picked";
            var fl = window.__WL_DT_FLOW__ || {};
            if (fl.to) syncFocus(fl.secId || secId, fl.rowKey || rk, fl.to, F, "lookup-pick");
          }
        }
        return ret;
      };
    }
    if (typeof D.enterFlow === "function") {
      var rawEnterFlow = D.enterFlow;
      D.enterFlow = function(secId, el) {
        var F = flowOf(secId);
        stamp();
        G.expect = null;
        G.focusEpoch = G.inputEpoch;
        var ret = rawEnterFlow.call(D, secId, el);
        var fl = window.__WL_DT_FLOW__ || {};
        if (D.lookupState) {
          try {
            var kw = document.getElementById("dtLkKw");
            if (kw) {
              try {
                kw.focus({ preventScroll: true });
              } catch (e) {
                try {
                  kw.focus();
                } catch (e2) {
                }
              }
              R.focusSync++;
              log("sync-focus", { col: "#dtLkKw", why: "lookup-open" });
            }
          } catch (e) {
          }
          G.mode = "lookup";
        } else if (fl.op === "append") {
          syncFocus(secId, fl.rowKey, fl.to, F, "append");
          G.mode = "flow";
        } else if (fl.op === "next" || fl.op === "reuse-empty") {
          G.expect = { rk: String(fl.rowKey), col: String(fl.to) };
          G.focusEpoch = G.inputEpoch;
          G.mode = "flow";
          log("expect", { op: fl.op, rowKey: fl.rowKey, col: fl.to });
        }
        return ret;
      };
    }
    if (typeof D.lookupClose === "function") {
      var rawClose = D.lookupClose;
      D.lookupClose = function() {
        stamp();
        G.mode = "";
        G.expect = null;
        return rawClose.call(D);
      };
    }
    if (typeof D.lookupOpen === "function") {
      var rawOpen = D.lookupOpen;
      D.lookupOpen = function(a, b, c) {
        stamp();
        G.mode = "lookup";
        return rawOpen.call(D, a, b, c);
      };
    }
  }
  if (T && typeof T._snapshot === "function") {
    let clearSig2 = function() {
      sig.kw = void 0;
      sig.toolbar = void 0;
      sig.q = void 0;
    }, snap2 = function() {
      try {
        return T._snapshot() || {};
      } catch (e) {
        return {};
      }
    }, wrapIdem2 = function(name, test, redraw, rec) {
      if (typeof T[name] !== "function") return;
      var raw = T[name];
      T[name] = function() {
        var s = snap2();
        try {
          if (test.apply(null, [s, arguments])) {
            R.idempotent++;
            log("idempotent", { fn: name, args: Array.prototype.slice.call(arguments, 0, 2) });
            return;
          }
        } catch (e) {
        }
        var ret = raw.apply(T, arguments);
        if (rec) {
          try {
            rec(arguments);
          } catch (e) {
          }
        }
        if (redraw) markRedraw(name);
        return ret;
      };
    };
    var clearSig = clearSig2, snap = snap2, wrapIdem = wrapIdem2;
    var sig = { kw: void 0, toolbar: void 0, q: void 0 };
    wrapIdem2("_view", function(s, a) {
      return s.view === a[0];
    }, true);
    wrapIdem2("_page", function(s, a) {
      return s.page === Math.max(1, +a[0] || 1);
    });
    wrapIdem2("_size", function(s, a) {
      return s.size === +a[0] && s.page === 1;
    });
    wrapIdem2("_kw", function(s, a) {
      return sig.kw === a[0] && s.page === 1;
    }, false, function(a) {
      sig.kw = a[0];
    });
    wrapIdem2("_toolbar", function(s, a) {
      return sig.toolbar === a[0] + "\0" + a[1] && s.page === 1;
    }, false, function(a) {
      sig.toolbar = a[0] + "\0" + a[1];
    });
    wrapIdem2("_q", function(s, a) {
      return sig.q === a[0] + "\0" + a[1] && s.page === 1;
    }, false, function(a) {
      sig.q = a[0] + "\0" + a[1];
    });
    window.__WL_B2_CLEARSIG__ = clearSig2;
  }
  var HOSTS = ["#wlElBtnHost", "#wlElToolHost", "#wlElCtxHost", "#wlElSelHost", "#wlElPageSizeHost", "#wlElPagerHost", "#wlElTable"];
  function hostState() {
    var out = [];
    HOSTS.forEach(function(sel) {
      var h = document.querySelector(sel);
      if (h) out.push({ sel, mounted: !!h.__wlMounted });
    });
    return out;
  }
  function isReady() {
    var hs = hostState();
    R.hosts = hs;
    if (!hs.length) return true;
    if (window.__WL_HAS_EL__ && (!window.__WL_EL__ || !window.__WL_EL__.ready)) return false;
    return hs.every(function(h) {
      return h.mounted;
    });
  }
  function markRedraw(reason) {
    stamp();
    var now = Date.now();
    if (reason === "main-replaced" && now - (R.lastMarkAt || 0) < 80) {
      return;
    }
    R.lastMarkAt = now;
    R.redraws++;
    R.ready = false;
    R.pending = reason;
    log("redraw", { reason });
    if (typeof window.__WL_B2_CLEARSIG__ === "function") window.__WL_B2_CLEARSIG__();
    var tries = 0;
    var check = function() {
      if (isReady()) {
        R.ready = true;
        R.pending = null;
        log("ready", { hosts: R.hosts.length, tries });
        var q = R.queue.splice(0);
        q.forEach(function(fn) {
          try {
            fn();
          } catch (e) {
            log("gate-error", { msg: String(e).slice(0, 120) });
          }
        });
      } else if (++tries < 24) {
        window.requestAnimationFrame ? requestAnimationFrame(check) : setTimeout(check, 16);
      } else {
        R.ready = true;
        R.pending = null;
        log("ready-timeout", { hosts: R.hosts.length });
        var q2 = R.queue.splice(0);
        q2.forEach(function(fn) {
          try {
            fn();
          } catch (e) {
          }
        });
      }
    };
    Promise.resolve().then(function() {
      Promise.resolve().then(check);
    });
  }
  ["_vcSave", "_formSave"].forEach(function(k) {
    if (!T || typeof T[k] !== "function") return;
    var raw = T[k];
    T[k] = function() {
      var ret = raw.apply(T, arguments);
      markRedraw(k);
      return ret;
    };
  });
  var main = document.getElementById("main");
  if (main && window.MutationObserver) {
    var seen = main.querySelector(".wl-page");
    new MutationObserver(function() {
      var now = main.querySelector(".wl-page");
      if (now && now !== seen) {
        seen = now;
        markRedraw("main-replaced");
      }
    }).observe(main, { childList: true, subtree: false });
  }
  if (T) {
    T._redrawReady = function() {
      return { ready: R.ready, pending: R.pending, hosts: hostState(), queue: R.queue.length, epoch: R.epoch };
    };
    T._redrawGate = function(fn) {
      if (typeof fn !== "function") return false;
      if (R.ready) {
        try {
          fn();
        } catch (e) {
        }
      } else R.queue.push(fn);
      return true;
    };
    T._redraw = function() {
      return {
        epoch: R.epoch,
        shortCircuits: R.shortCircuits,
        redraws: R.redraws,
        idempotent: R.idempotent,
        focusSync: R.focusSync,
        gated: R.gated,
        ready: R.ready,
        logs: R.logs.slice(-40)
      };
    };
  }
  R.installed = true;
})();
(function() {
  if (window.__WL_B3_LATE__) return;
  window.__WL_B3_LATE__ = 1;
  var T = window.TPL, D = window.DETAIL;
  var LOG = [], SESSIONS = [];
  window.__WL_B3_LOG__ = LOG;
  window.__WL_B3_SESSIONS__ = SESSIONS;
  function log(kind, data) {
    LOG.push(Object.assign({ at: Date.now(), kind }, data || {}));
    if (LOG.length > 240) LOG.shift();
  }
  function clone(o2) {
    try {
      return JSON.parse(JSON.stringify(o2));
    } catch (e) {
      return {};
    }
  }
  function now() {
    return Date.now();
  }
  var BSTORE = "TPL_BOUNDARY_V113:";
  function bkey() {
    return BSTORE + (T.schema && T.schema.id || "default");
  }
  var DEFAULT = {
    mode: "demo",
    demoLabel: "前端演示数据（未连数据库）",
    strip: ["^__"],
    annexFromDb: true,
    emitFormal: true,
    note: "demo = 下游取用演示包；formal = 下游取用干净正式包；两种模式演示反馈都完整保留"
  };
  var BC = clone(DEFAULT);
  try {
    var raw = localStorage.getItem(bkey());
    if (raw) {
      var o = JSON.parse(raw);
      if (o && typeof o === "object") BC = Object.assign(clone(DEFAULT), o);
    }
  } catch (e) {
  }
  function saveBC() {
    try {
      localStorage.setItem(bkey(), JSON.stringify(BC));
    } catch (e) {
    }
  }
  if (BC.mode !== "demo" && BC.mode !== "formal") BC.mode = "demo";
  window.__WL_BOUNDARY__ = clone(BC);
  function debugKeys(p) {
    return Object.keys(p || {}).filter(function(k) {
      return (BC.strip || ["^__"]).some(function(r) {
        try {
          return new RegExp(r).test(k);
        } catch (e) {
          return k.indexOf("__") === 0;
        }
      });
    });
  }
  function formalize(p) {
    var out = {};
    clone(p || {});
    var skip = debugKeys(p);
    Object.keys(p || {}).forEach(function(k) {
      if (skip.indexOf(k) < 0) out[k] = clone(p[k]);
    });
    if (skip.indexOf("__annex") >= 0 && BC.annexFromDb) {
      var name = T.schema && T.schema.db && T.schema.db.annexTable || "Annex";
      out[name] = clone(p.__annex);
    }
    return { payload: out, removed: skip, annexKey: BC.annexFromDb && (T.schema && T.schema.db && T.schema.db.annexTable) || "Annex" };
  }
  function demoOnlyFields() {
    return [
      "__pageRoutes",
      "__pageActions",
      "__pageSpec",
      "__columnClick",
      "__features",
      "__detailMeta",
      "__annex→" + (T.schema && T.schema.db && T.schema.db.annexTable || "Annex")
    ];
  }
  function internalKeys() {
    var S = T.schema || {}, out = {};
    try {
      (D.sections() || []).forEach(function(sec) {
        var sp = D.specOf(sec) || {}, sm = sp.summary || {};
        if (sp.dataKey) out[sp.dataKey] = "明细数组 · " + sp.dataKey;
        if (sm.target) out[sm.target] = "汇总值 · " + sm.target;
      });
    } catch (e) {
    }
    out[S.detail && S.detail.archKey || "sa_arch"] = "资料卡 JSON";
    return out;
  }
  function destinations() {
    var S = T.schema || {}, map = S.db && S.db.dbMap || {}, inner = internalKeys();
    var body = document.getElementById("dwBody"), pairs = [];
    if (body) {
      var roots = [].slice.call(body.querySelectorAll(".dt-wrap"));
      [].slice.call(body.querySelectorAll("[data-k]")).forEach(function(e) {
        if (e.classList.contains("sa-sw-cb")) return;
        if (roots.some(function(w) {
          return w.contains(e);
        })) return;
        pairs.push({ k: e.dataset.k, v: e.value });
      });
    }
    var seen = {}, rows = [], missed = {};
    pairs.filter(function(x) {
      if (seen[x.k]) return false;
      seen[x.k] = 1;
      return true;
    }).forEach(function(x) {
      var k = x.k;
      var m = map[k];
      if (m && m.p) rows.push({ k, to: m.p, kind: "mapped", note: "dbMap 映射到存储过程参数" });
      else if (inner[k]) rows.push({ k, to: inner[k], kind: "internal", note: "由明细 / 资料卡链路处理" });
      else if (k.indexOf("__") === 0) rows.push({ k, to: "不进入输出包", kind: "internal", note: "内部状态键" });
      else {
        rows.push({ k, to: "不进入任何输出包", kind: "unmapped", note: "dbMap 无映射，buildPayload 的 skipped 此前从未暴露" });
        missed[k] = x.v;
      }
    });
    window.__WL_UNMAPPED_VALUES__ = missed;
    return {
      at: now(),
      total: rows.length,
      rows,
      mapped: rows.filter(function(x) {
        return x.kind === "mapped";
      }).length,
      internal: rows.filter(function(x) {
        return x.kind === "internal";
      }).length,
      unmapped: rows.filter(function(x) {
        return x.kind === "unmapped";
      }).map(function(x) {
        return x.k;
      })
    };
  }
  function refreshUnmapped() {
    var d = destinations();
    window.__WL_UNMAPPED__ = d;
    log("unmapped", { total: d.total, unmapped: d.unmapped.length, keys: d.unmapped });
    return d;
  }
  function conflictScan(secs) {
    var used = {}, conflicts = [];
    (secs || []).forEach(function(sec) {
      var sp = sec && sec.spec || {}, sm = sp.summary || {};
      var keys = ["dataKey", "db"].map(function(k) {
        return { k, v: String(sp[k] || "") };
      }).concat([{ k: "summary.target", v: String(sm.target || "") }, { k: "summary.db", v: String(sm.db || "") }]);
      keys.forEach(function(x) {
        if (!x.v) return;
        if (used[x.v]) conflicts.push({ sec: sec.id, key: x.k, value: x.v, with: used[x.v] });
        else used[x.v] = sec.id;
      });
    });
    return conflicts;
  }
  function suffix(base, taken) {
    var v = base + "_2", i = 3;
    while (taken[v]) {
      v = base + "_" + i++;
    }
    return v;
  }
  function normalizeSections(reason, beforeSave) {
    var secs = [];
    try {
      secs = D.sections() || [];
    } catch (e) {
    }
    var et = secs.filter(function(s) {
      return s.renderer === "editable-table";
    });
    var before = conflictScan(et), resolved = [], taken = {};
    et.forEach(function(sec, i) {
      var sp = sec.spec || {}, sm = sp.summary || {};
      ["dataKey", "db"].forEach(function(k) {
        if (sp[k]) taken[String(sp[k])] = 1;
      });
      if (sm.target) taken[String(sm.target)] = 1;
      if (sm.db) taken[String(sm.db)] = 1;
    });
    if (et.length > 1) {
      et.forEach(function(sec, i) {
        if (i === 0) return;
        var sp = sec.spec || (sec.spec = {}), sm = sp.summary || (sp.summary = {});
        var prev = {};
        et.slice(0, i).forEach(function(o2) {
          var a = o2.spec || {}, b = a.summary || {};
          [a.dataKey, a.db, b.target, b.db].forEach(function(v) {
            if (v) prev[String(v)] = 1;
          });
        });
        var ren = {};
        [["spec", "dataKey"], ["spec", "db"], ["summary", "target"], ["summary", "db"]].forEach(function(pair) {
          var obj = pair[0] === "spec" ? sp : sm, k = pair[1], old = String(obj[k] || "");
          if (!old || !prev[old]) return;
          var nv = suffix(old, taken);
          taken[nv] = 1;
          obj[k] = nv;
          ren[pair[0] + "." + k] = old + " → " + nv;
        });
        var pv = sp.preValidate || {};
        if (pv.amountField && ren["summary.target"] && String(pv.amountField) !== String(sm.target)) {
          if (String(pv.amountField) === String(ren["summary.target"].split(" → ")[0])) pv.amountField = sm.target;
        }
        if (Object.keys(ren).length) resolved.push({ sec: sec.id, renamed: ren });
      });
    }
    var report = {
      at: now(),
      reason,
      sections: et.map(function(s) {
        var sp = s.spec || {}, sm = sp.summary || {};
        return {
          id: s.id,
          dataKey: sp.dataKey,
          db: sp.db,
          summaryTarget: sm.target,
          summaryDb: sm.db,
          amountField: (sp.preValidate || {}).amountField || "",
          preValidate: !!(sp.preValidate || {}).enabled
        };
      }),
      conflicts: before,
      resolved,
      normalized: !!resolved.length,
      beforeSave: beforeSave || null
    };
    window.__WL_B3_SECTIONS__ = report;
    if (resolved.length) {
      try {
        localStorage.setItem(T._formStoreKey(), JSON.stringify(T._formConfig()));
      } catch (e) {
      }
      log("sections-normalized", {
        reason,
        resolved: resolved.length,
        conflicts: before.length,
        beforeSave: (beforeSave || []).length
      });
      try {
        T._toast("配置表单：检测到 " + before.length + " 处区块键冲突，已派生唯一键（可在 __WL_B3_SECTIONS__ 查看）");
      } catch (e) {
      }
    } else {
      log("sections-ok", { reason, count: et.length, conflicts: before.length });
    }
    return report;
  }
  var seq = 0;
  function newSession(op) {
    var s = {
      id: "B3-" + ++seq + "-" + now(),
      op,
      at: now(),
      phase: "created",
      closedDuring: false,
      result: null,
      committed: false,
      restored: false,
      preValidate: null,
      boundaryMode: BC.mode,
      demoKeys: 0,
      formalKeys: 0,
      unmapped: []
    };
    SESSIONS.push(s);
    if (SESSIONS.length > 40) SESSIONS.shift();
    log("session-created", { id: s.id, op });
    return s;
  }
  function current() {
    return SESSIONS[SESSIONS.length - 1] || null;
  }
  function phase(p, extra) {
    var s = current();
    if (!s) return;
    s.phase = p;
    if (extra) Object.assign(s, extra);
    log("session-phase", { id: s.id, phase: p, extra: extra || {} });
  }
  function publishFormal(s) {
    var demo = window.__DB_PAYLOAD__ || {};
    var f = formalize(demo);
    window.__WL_FORMAL_PAYLOAD__ = f.payload;
    window.__WL_HANDOFF__ = {
      mode: BC.mode,
      at: now(),
      sessionId: s ? s.id : null,
      payload: BC.mode === "formal" ? clone(f.payload) : clone(demo),
      formal: clone(f.payload),
      demo: clone(demo),
      removedFromFormal: f.removed,
      annexKey: f.annexKey,
      demoOnly: demoOnlyFields(),
      note: BC.mode === "formal" ? "下游交出物 = 干净正式包；演示反馈仍完整保留" : "下游交出物 = 演示包（与优化前一致）；正式包见 handoff.formal",
      result: s ? s.result : null,
      validated: s ? s.preValidate : null
    };
    if (s) {
      s.demoKeys = Object.keys(demo).length;
      s.formalKeys = Object.keys(f.payload).length;
    }
    log("handoff", { mode: BC.mode, demoKeys: s ? s.demoKeys : 0, formalKeys: s ? s.formalKeys : 0, removed: f.removed.length });
    return window.__WL_HANDOFF__;
  }
  function wrap(name, fn) {
    if (typeof T[name] !== "function") return;
    var raw2 = T[name];
    T[name] = function() {
      return fn.call(this, raw2, arguments);
    };
  }
  function submitWrap(raw2, args, op) {
    var s = newSession(op);
    refreshUnmapped();
    s.unmapped = (window.__WL_UNMAPPED__ || {}).unmapped || [];
    var d = destinations();
    window.__WL_FIELD_DEST__ = d;
    var ret = raw2.apply(T, args);
    s.demoKeys = Object.keys(window.__DB_PAYLOAD__ || {}).length;
    if (s.phase === "created") phase("collected", { demoKeys: s.demoKeys });
    else log("payload-built", { id: s.id, phase: s.phase, demoKeys: s.demoKeys });
    publishFormal(s);
    return ret;
  }
  wrap("_save", function(raw2, args) {
    return submitWrap(raw2, args, "save");
  });
  wrap("_retry", function(raw2, args) {
    return submitWrap(raw2, args, "retry");
  });
  function markClosed(how) {
    var s = current();
    if (s && ["created", "collected", "validating", "loading"].indexOf(s.phase) >= 0) {
      s.closedDuring = true;
      phase("aborted", { how });
    } else log("closed", { how, phase: s ? s.phase : "none" });
  }
  wrap("_close", function(raw2, args) {
    markClosed("drawer-close");
    return raw2.apply(T, args);
  });
  wrap("_closeResult", function(raw2, args) {
    log("close-result", { done: !!args[0] });
    return raw2.apply(T, args);
  });
  ["commit", "restore", "showValidateError", "clearValidateError", "preValidateTasks"].forEach(function(k) {
    if (!D || typeof D[k] !== "function") return;
    var raw2 = D[k];
    D[k] = function() {
      var s = current();
      if (k === "commit") {
        if (s) s.committed = true;
        log("detail-commit", { session: s ? s.id : null });
      }
      if (k === "restore") {
        if (s) s.restored = true;
        log("detail-restore", { session: s ? s.id : null });
      }
      if (k === "showValidateError") {
        var bad = arguments[0] || {};
        if (bad && bad.aborted) {
          window.__WL_B3_PREVALIDATE__ = {
            ok: false,
            aborted: true,
            session: s ? s.id : null,
            secId: bad.secId,
            message: bad.message,
            at: now()
          };
          if (s) {
            s.preValidate = "aborted";
            s.result = "aborted";
          }
          if (window.__WL_HANDOFF__) {
            window.__WL_HANDOFF__.validated = "aborted";
            window.__WL_HANDOFF__.result = "aborted";
          }
          log("submit-aborted-safe", { session: s ? s.id : null, how: "prevalidate" });
          return;
        }
        window.__WL_B3_PREVALIDATE__ = {
          ok: false,
          session: s ? s.id : null,
          secId: bad.secId,
          api: bad.api,
          amount: bad.amount,
          limit: bad.limit,
          message: bad.message,
          at: now()
        };
        if (s) {
          s.preValidate = "fail";
          s.result = "blocked";
        }
        if (window.__WL_HANDOFF__) {
          window.__WL_HANDOFF__.validated = "fail";
          window.__WL_HANDOFF__.result = "blocked";
        }
        phase("blocked", { secId: bad.secId, amount: bad.amount });
      }
      if (k === "preValidateTasks") {
        var ret = raw2.apply(D, arguments);
        var n = ret && ret.length || 0;
        if (s) {
          s.preValidateTasks = n;
          s.preValidate = n ? "running" : "skip";
        }
        if (s && n) {
          ret = ret.map(function(pr) {
            return Promise.resolve(pr).then(function(r) {
              if (s.closedDuring) {
                log("prevalidate-aborted", { session: s.id, secId: r && r.secId });
                return {
                  ok: false,
                  aborted: true,
                  secId: r && r.secId,
                  api: r && r.api,
                  message: "提交途中抽屉已关闭，本次提交已安全取消"
                };
              }
              return r;
            });
          });
          phase("validating", { tasks: n });
        } else log("prevalidate-none", { session: s ? s.id : null });
        return ret;
      }
      return raw2.apply(D, arguments);
    };
  });
  var sh = document.getElementById("srSheet");
  if (sh && window.MutationObserver) {
    new MutationObserver(function(rs) {
      rs.forEach(function(r) {
        var st = sh.getAttribute("data-state"), s = current();
        if (st && s && s.phase !== st) {
          s.result = st === "loading" ? null : st;
          if (s.preValidate === "running" && (st === "loading" || st === "success")) {
            s.preValidate = "pass";
            var pv = window.__WL_PREVALIDATE__;
            window.__WL_B3_PREVALIDATE__ = Object.assign({ ok: true, session: s.id, at: now() }, pv && pv.results ? { results: pv.results } : {});
          }
          phase(st, { result: s.result, preValidate: s.preValidate });
          publishFormal(s);
        }
      });
    }).observe(sh, { attributes: true, attributeFilter: ["data-state"] });
  }
  wrap("_formSave", function(raw2, args) {
    var beforeSave = [];
    try {
      var d = T._formDraft();
      var draftEt = (d && d.layout && d.layout.sections || []).filter(function(x) {
        return x.renderer === "editable-table" && x.show !== false && x.spec;
      });
      beforeSave = conflictScan(draftEt);
      if (beforeSave.length) log("sections-conflict-before-save", { count: beforeSave.length, items: beforeSave });
    } catch (e) {
    }
    var ret = raw2.apply(T, args);
    try {
      normalizeSections("form-save", beforeSave);
    } catch (e) {
      log("normalize-error", { msg: String(e).slice(0, 160) });
    }
    return ret;
  });
  try {
    normalizeSections("boot");
  } catch (e) {
    log("boot-normalize-error", { msg: String(e).slice(0, 160) });
  }
  Object.assign(T, {
    _boundary() {
      return clone(BC);
    },
    _boundaryMode(m) {
      if (m !== "demo" && m !== "formal") return clone(BC);
      BC.mode = m;
      saveBC();
      window.__WL_BOUNDARY__ = clone(BC);
      log("boundary-mode", { mode: m });
      publishFormal(current());
      return clone(BC);
    },
    _boundaryConfig(o2) {
      if (o2 && typeof o2 === "object") {
        BC = Object.assign(clone(BC), o2);
        if (BC.mode !== "demo" && BC.mode !== "formal") BC.mode = "demo";
        saveBC();
        window.__WL_BOUNDARY__ = clone(BC);
        log("boundary-config", { keys: Object.keys(o2) });
      }
      return clone(BC);
    },
    _formalPayload() {
      if (window.__WL_FORMAL_PAYLOAD__) return clone(window.__WL_FORMAL_PAYLOAD__);
      if (window.__DB_PAYLOAD__) return clone(formalize(window.__DB_PAYLOAD__).payload);
      return null;
    },
    _handoff() {
      return clone(window.__WL_HANDOFF__ || null);
    },
    _unmapped() {
      return clone(window.__WL_UNMAPPED__ || null);
    },
    _fieldDestinations() {
      return clone(window.__WL_FIELD_DEST__ || destinations());
    },
    _sectionConflicts() {
      return clone(window.__WL_B3_SECTIONS__ || null);
    },
    _sections() {
      return clone((window.__WL_B3_SECTIONS__ || {}).sections || []);
    },
    _sessions() {
      return clone(SESSIONS);
    },
    _boundaryReport() {
      return {
        boundary: clone(BC),
        store: bkey(),
        demoPayloadKeys: Object.keys(window.__DB_PAYLOAD__ || {}).length,
        formalPayloadKeys: Object.keys(window.__WL_FORMAL_PAYLOAD__ || {}).length,
        removedFromFormal: (window.__WL_HANDOFF__ || {}).removedFromFormal || [],
        demoOnly: demoOnlyFields(),
        unmapped: (window.__WL_UNMAPPED__ || {}).unmapped || [],
        unmappedValues: clone(window.__WL_UNMAPPED_VALUES__ || {}),
        destinations: (window.__WL_FIELD_DEST__ || {}).total || 0,
        sections: (window.__WL_B3_SECTIONS__ || {}).sections || [],
        conflicts: (window.__WL_B3_SECTIONS__ || {}).conflicts || [],
        sessions: SESSIONS.length,
        lastSession: clone(current()),
        logs: LOG.slice(-30),
        dbPayloadContract: "保持不变"
      };
    },
    _b3DualPreset(conflict) {
      var pre = clone((T._formSpec() || {}).detailPreset || {});
      if (!pre.spec) return null;
      T._formOpen();
      T._formLoadPreset(false);
      T._formSecAdd();
      var d = T._formDraft(), arr = d && d.layout && d.layout.sections || [], sec = arr[arr.length - 1];
      if (!sec) return null;
      var sp = clone(pre.spec);
      if (!conflict) {
        sp.dataKey = "details2";
        sp.db = "Details2";
        sp.summary = Object.assign({}, sp.summary, { target: "totalAmount2", db: "TotalAmount2" });
        sp.preValidate = Object.assign({}, sp.preValidate, { amountField: "totalAmount2", limit: 8e3 });
      }
      T._formSec(sec.id, "renderer", "editable-table");
      T._formSec(sec.id, "title", conflict ? "入库明细（键冲突示例）" : "入库复核明细（第二区块）");
      T._dtSpecJSON(sec.id, JSON.stringify(sp));
      T._formSave();
      var rep = clone(window.__WL_B3_SECTIONS__ || {});
      return { secondId: sec.id, conflict: !!conflict, report: rep };
    },
    _b3DualConflict() {
      return T._b3DualPreset(true);
    },
    _b3Report() {
      return T._boundaryReport();
    }
  });
  window.__WL_B3_READY__ = true;
})();
(function() {
  if (window.__WL_B4_READY__) return;
  window.__WL_B4_READY__ = 1;
  var T = window.TPL, LOG = [], CHANGED = false, G = null, DEF = null;
  window.__WL_B4_LOG__ = LOG;
  function log(k, d) {
    LOG.push(Object.assign({ at: Date.now(), k }, d || {}));
    if (LOG.length > 240) LOG.shift();
  }
  function clone(o) {
    try {
      return JSON.parse(JSON.stringify(o));
    } catch (e) {
      return {};
    }
  }
  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escA(v) {
    return esc(v).replace(/'/g, "&#39;");
  }
  function escJS(v) {
    var t = String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    t = t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return "'" + t + "'";
  }
  var BASE = {
    statusViewIds: ["warn", "audit", "off"],
    statusLabels: { status: "状态", all: "全部状态" },
    quickViewCount: 4,
    contextOptions: ["档案中心", "全部库房", "中药材仓库", "中成药仓库", "医药常温库"],
    contextDefault: "档案中心",
    toolbarAllLabel: "全部",
    whereFallback: [
      ["kind", "类别"],
      ["status", "状态"],
      ["flow", "流转节点"],
      ["level", "等级"],
      ["stock", "库存量"],
      ["warn", "警戒线"]
    ],
    tagColors: {
      "中药饮片": "#20c22e",
      "精制饮片": "#f2711c",
      "毒性饮片": "#db2828",
      "颗粒剂": "#00b5ad",
      "饮片": "#b5cc18",
      "Rx": "#ec0019",
      "阴凉": "#767676",
      "常温": "#1b1c1d",
      "浙江省": "#0052d9",
      "中成药仓库": "#6435c9",
      "中药材仓库": "#e03997",
      "医药常温库": "#2185d0",
      "其他": "#767676",
      "贵细品种": "#f2711c",
      "首营品种": "#00b5ad",
      "中药饮片(9%)": "#b5cc18",
      "中成药(13%)": "#6435c9",
      "普通品种": "#20c22e"
    },
    tagFallback: [
      "#20c22e",
      "#f2711c",
      "#db2828",
      "#00b5ad",
      "#b5cc18",
      "#767676",
      "#1b1c1d",
      "#0052d9",
      "#6435c9",
      "#e03997"
    ],
    demoVisual: { indexShift: 0 },
    titleSuffix: "列表 UI v1.33 · 键盘流录入",
    unit: "项"
  };
  var SUP_GENERIC = {
    statusViewIds: ["on", "audit"],
    statusLabels: { status: "审核状态", all: "全部审核状态" },
    quickViewCount: 2,
    contextOptions: ["供应链中心", "华东仓", "华南仓", "冷链仓"],
    contextDefault: "供应链中心",
    toolbarAllLabel: "不限",
    unit: "家",
    whereFallback: [
      ["kind", "供应商类别"],
      ["status", "合作状态"],
      ["flow", "准入节点"],
      ["level", "评级"],
      ["stock", "供货量"],
      ["warn", "预警线"]
    ],
    tagColors: { "生产企业": "#0052d9", "流通企业": "#366ef4", "合作中": "#20c22e" },
    tagFallback: ["#0052d9", "#366ef4", "#618dff", "#8eabff", "#b5c7ff", "#d9e1ff", "#f2f3ff", "#003cab", "#6435c9", "#00b5ad"],
    demoVisual: { indexShift: 1 },
    titleSuffix: "通用配置驱动"
  };
  function norm(raw, S2) {
    var g = clone(BASE);
    if (raw && typeof raw === "object") Object.keys(BASE).forEach(function(k) {
      if (raw[k] !== void 0 && raw[k] !== null) g[k] = clone(raw[k]);
    });
    if (!raw || raw.unit === void 0) g.unit = S2 && S2.meta && S2.meta.unit || "项";
    g.statusLabels = Object.assign(clone(BASE.statusLabels), g.statusLabels || {});
    g.demoVisual = Object.assign(clone(BASE.demoVisual), g.demoVisual || {});
    g.specVersion = "b4";
    return g;
  }
  var S = T.schema;
  if (!S.generic) S.generic = norm(null, S);
  G = norm(S.generic, S);
  S.generic = G;
  DEF = norm(null, S);
  CHANGED = JSON.stringify(G) !== JSON.stringify(DEF);
  if (T.examples && T.examples.supplier && !T.examples.supplier.generic) {
    T.examples.supplier.generic = clone(SUP_GENERIC);
  }
  window.__WL_B4_GENERIC__ = clone(G);
  log("boot", { schema: S.id, changed: CHANGED, genericKeys: Object.keys(G) });
  function allViews() {
    var out = null;
    try {
      var raw = localStorage.getItem("TPL_VIEW_CFG_V113:" + (S.id || "default"));
      if (raw) {
        var c = JSON.parse(raw);
        if (c && Array.isArray(c.views)) out = c.views;
      }
    } catch (e) {
    }
    if (!out || !out.length) out = S.list && S.list.views || [];
    return out;
  }
  function ids() {
    return (G.statusViewIds || []).map(String);
  }
  function tagColor(v) {
    var m = G.tagColors || {}, f = G.tagFallback || [];
    if (m[v]) return m[v];
    var h = 0, str = String(v);
    for (var i = 0; i < str.length; i++) h = h * 31 + str.charCodeAt(i) >>> 0;
    return f.length ? f[h % f.length] : "#767676";
  }
  function quickHTML(views, n) {
    return views.slice(0, n).map(function(v) {
      return '<a href="#" onclick="TPL._view(' + escJS(v.id) + ');return false">' + esc(v.label) + "</a>";
    }).join("");
  }
  function roots() {
    var main = document.getElementById("main");
    if (!main) return [];
    return [].slice.call(main.querySelectorAll("*")).filter(function(e) {
      var v = e.__vue__;
      return !!(v && v.st && typeof v.st === "object" && v.$options && v.$options.computed && v.$options.computed.statusOpts);
    }).map(function(e) {
      return e.__vue__;
    });
  }
  function applyVM() {
    roots().forEach(function(vm) {
      if (vm.__b4) return;
      vm.__b4 = 1;
      try {
        Object.defineProperty(vm, "statusVal", { configurable: true, enumerable: true, get: function() {
          var st2 = vm.st;
          return ids().indexOf(String(st2.view)) >= 0 ? st2.view : "";
        } });
        Object.defineProperty(vm, "statusOpts", { configurable: true, enumerable: true, get: function() {
          var st2 = vm.st;
          return [{ l: G.statusLabels.status, v: "" }].concat((st2.statusViews || []).map(function(v) {
            return { l: v.label, v: v.id };
          })).concat([{ l: G.statusLabels.all, v: "all" }]);
        } });
        if (G.toolbarAllLabel !== BASE.toolbarAllLabel) {
          vm.opts = function(d) {
            return [{ l: d.label, v: "" }, { l: G.toolbarAllLabel, v: "全部" }].concat((d.options || []).map(function(o) {
              return { l: o, v: o };
            }));
          };
        }
        var st = vm.st;
        if (JSON.stringify(st.ctxOptions || []) !== JSON.stringify(G.contextOptions)) st.ctxOptions = G.contextOptions.slice();
        if (st.ctx !== G.contextDefault) st.ctx = G.contextDefault;
        vm.$forceUpdate();
        log("vm-patched", { cls: String(vm.$el && vm.$el.className || "").slice(0, 42) });
      } catch (e) {
        log("vm-error", { msg: String(e).slice(0, 160) });
      }
    });
  }
  var fixQueued = false, lastView = "all";
  function scheduleFix(view) {
    if (!CHANGED) return;
    if (view !== void 0) lastView = String(view);
    if (fixQueued) return;
    fixQueued = true;
    setTimeout(function() {
      fixQueued = false;
      fixAll();
    }, 0);
  }
  function fixQuick() {
    var q = document.getElementById("tplQuick");
    if (!q) return;
    var want = quickHTML(allViews(), G.quickViewCount);
    if (q.innerHTML !== want) {
      q.innerHTML = want;
      log("quick", { n: G.quickViewCount, links: q.children.length });
    }
  }
  function fixShadowCond() {
    var v = String(lastView), want = ids().indexOf(v) >= 0 ? v : "";
    var box = document.querySelector(".wl-dds-shadows");
    if (box) {
      var sels = box.querySelectorAll("select"), last = sels[sels.length - 1];
      if (last && last.value !== want) {
        var tmp = document.createElement("span");
        tmp.innerHTML = want ? '<select><option value=""></option><option value="' + escA(want) + '" selected>' + escA(want) + "</option></select>" : '<select><option value="" selected></option></select>';
        if (tmp.firstElementChild) last.parentNode.replaceChild(tmp.firstElementChild, last);
        log("shadow", { view: v, want });
      }
    }
    var b = document.getElementById("tplCondN");
    if (!b) return;
    var n = 0;
    document.querySelectorAll("#tplAdvWrap input, #tplAdvWrap select").forEach(function(el) {
      if (el.value && el.value !== "全部") n++;
    });
    var mirrors = [].slice.call(document.querySelectorAll(".wl-dds select"));
    mirrors.forEach(function(el) {
      if (el.value && el.value !== "全部") n++;
    });
    if (want && !mirrors.some(function(s) {
      return s.value === want;
    })) n++;
    var kw = document.getElementById("tplKw");
    if (kw && kw.value.trim()) n++;
    if (b.textContent !== String(n)) {
      b.textContent = String(n);
      log("cond", { n });
    }
  }
  function fixWhere() {
    var tab = document.querySelector('#vcWin .vc-tab.on[data-t="where"]');
    if (!tab) return;
    var pane = document.getElementById("vcPane");
    if (!pane) return;
    var map = {};
    (G.whereFallback || []).forEach(function(x) {
      if (x && x.length > 1) map[x[0]] = x[1];
    });
    pane.querySelectorAll(".vc-rule select").forEach(function(sel) {
      [].slice.call(sel.options).forEach(function(op) {
        if (map[op.value] && op.textContent !== map[op.value]) {
          op.textContent = map[op.value];
          log("where", { field: op.value, label: map[op.value] });
        }
      });
    });
  }
  function fixTitle() {
    var M = S.meta || {}, want = M.pageTitle + " · " + G.titleSuffix;
    if (document.title !== want) {
      document.title = want;
      log("title", { t: want });
    }
  }
  function fixAll() {
    fixQuick();
    fixShadowCond();
    fixWhere();
    fixTitle();
  }
  function wrap(name, fn) {
    if (typeof T[name] !== "function") return;
    var raw = T[name];
    T[name] = function() {
      return fn.call(this, raw, arguments);
    };
    log("wrapped", { name });
  }
  var VISUAL = ["primary", "avatars", "person", "plan", "linkText"];
  wrap("_cell", function(raw, args) {
    var h = raw.apply(T, args);
    if (!CHANGED) return h;
    var r = args[0], c = args[1], kind = c && c.renderer;
    try {
      if (kind === "tag" && h && h.indexOf("wl-tag-solid") >= 0) {
        h = String(h).replace(
          /<span class="wl-tag-solid" style="background-color:(#[0-9a-fA-F]{3,8})">([^<]*)<\/span>/g,
          function(m, old, v) {
            return '<span class="wl-tag-solid" style="background-color:' + tagColor(v) + '">' + v + "</span>";
          }
        );
      }
      var sh = G.demoVisual && +G.demoVisual.indexShift || 0;
      if (sh && VISUAL.indexOf(kind) >= 0) {
        var rr = Object.assign({}, r, { __idx: (+r.__idx || 0) + sh });
        h = raw.call(T, rr, c);
      }
    } catch (e) {
      log("cell-error", { msg: String(e).slice(0, 160) });
    }
    return h;
  });
  wrap("_snapshot", function(raw, args) {
    var s = raw.apply(T, args);
    if (!CHANGED) return s;
    try {
      var views = allViews();
      s.statusViews = ids().map(function(id) {
        var v = views.filter(function(x) {
          return String(x.id) === id;
        })[0];
        return v ? { id: v.id, label: v.label } : null;
      }).filter(Boolean);
      s.unit = G.unit;
      applyVM();
      scheduleFix(s.view);
    } catch (e) {
      log("snapshot-error", { msg: String(e).slice(0, 160) });
    }
    return s;
  });
  [
    "_view",
    "_toolbar",
    "_kw",
    "_page",
    "_size",
    "_sort",
    "_vcTab",
    "_vcOpen",
    "_vcPick",
    "_vcSave",
    "_vcReset",
    "_vcRuleAdd",
    "_vcRuleDel",
    "_vcRuleJoin",
    "_vcRule",
    "_vcRuleField"
  ].forEach(function(k) {
    wrap(k, function(raw, args) {
      var ret = raw.apply(T, args);
      if (CHANGED) scheduleFix(T._snapshot ? T._snapshot().view : void 0);
      return ret;
    });
  });
  if (CHANGED) scheduleFix(T._snapshot ? T._snapshot().view : void 0);
  var DEAD = [
    {
      name: "WL_TAG_FIELDS",
      where: "主引擎「v1.13 截图高保真单元格」层",
      reason: "声明后 0 引用；v1.17 起 tag 渲染器改读 c.render.fields，6 个业务字段数组不再被读取",
      occurrences: 1
    },
    {
      name: "_vcTbOptions",
      where: "v1.7 注释提及的旧出口名",
      reason: "符号已移除（v1.7 由 VC.tbOptions 取代），去注释全文件 0 次",
      occurrences: 0
    },
    {
      name: "activeCol",
      where: "v1.2 注释提及的旧状态字段 st.activeCol",
      reason: "已删除的「当前格」状态机字段，去注释全文件 0 次；行单选/勾选两套状态机未受影响",
      occurrences: 0
    }
  ];
  window.__WL_B4_DEAD__ = clone(DEAD);
  function refresh() {
    G = norm(S.generic, S);
    S.generic = G;
    DEF = norm(null, S);
    CHANGED = JSON.stringify(G) !== JSON.stringify(DEF);
    window.__WL_B4_GENERIC__ = clone(G);
    roots().forEach(function(vm) {
      delete vm.__b4;
    });
    if (CHANGED) {
      applyVM();
      var s = T._snapshot ? T._snapshot() : {};
      scheduleFix(s.view);
      try {
        if (window.__WL_EL_CONTROLS__ && __WL_EL_CONTROLS__.sync) __WL_EL_CONTROLS__.sync();
      } catch (e) {
      }
    }
    log("refresh", { changed: CHANGED, schema: S.id });
    return clone(G);
  }
  Object.assign(T, {
    _generic() {
      return clone(G);
    },
    _genericDefault() {
      return clone(DEF);
    },
    _genericSchema() {
      return (T.schema || {}).generic || null;
    },
    _genericConfig(o) {
      if (o && typeof o === "object") {
        S.generic = Object.assign(clone(S.generic || {}), o);
        log("config", { keys: Object.keys(o) });
        return refresh();
      }
      return clone(G);
    },
    _genericRefresh() {
      return refresh();
    },
    _genericChanged() {
      return CHANGED;
    },
    _genericViews() {
      return clone(allViews());
    },
    _genericDead() {
      return clone(DEAD);
    },
    _genericLog() {
      return clone(LOG);
    },
    _genericReport() {
      return {
        schema: S.id,
        changed: CHANGED,
        generic: clone(G),
        default: clone(DEF),
        views: allViews().map(function(v) {
          return { id: v.id, label: v.label };
        }),
        statusViews: T._snapshot ? T._snapshot().statusViews : [],
        quickCount: G.quickViewCount,
        contextDefault: G.contextDefault,
        title: document.title,
        vmPatched: roots().filter(function(v) {
          return !!v.__b4;
        }).length,
        dead: clone(DEAD),
        logs: LOG.slice(-24),
        contracts: { dbPayload: "保持不变", export: "新增 generic 段（点名）", examples: "supplier 运行时追加 generic（点名）" }
      };
    }
  });
})();
(function() {
  if (window.__WL_B5_READY__) return;
  window.__WL_B5_READY__ = 1;
  var T = window.TPL;
  if (!T) return;
  var LOG = [], REG = [], OVERLAY = { renderers: {}, count: 0 }, SIG = {}, BASE = null;
  var LAST = 0, THROTTLE = 120;
  window.__WL_B5_LOG__ = LOG;
  window.__WL_B5_REGISTRY__ = REG;
  window.__WL_B5_OVERLAY__ = OVERLAY;
  function log(k, d) {
    LOG.push(Object.assign({ at: Date.now(), k }, d || {}));
    if (LOG.length > 300) LOG.shift();
  }
  function clone(o) {
    try {
      return JSON.parse(JSON.stringify(o));
    } catch (e) {
      return o;
    }
  }
  function keys(o) {
    try {
      return Object.keys(o || {});
    } catch (e) {
      return [];
    }
  }
  function arr(v) {
    return Array.isArray(v) ? v : [];
  }
  function layerRows() {
    var out = [];
    (window.__WL_LAYER_REGISTRY__ || []).forEach(function(e, i) {
      var id = e.id, tag = e.tag;
      var m = id.match(/v1(\d+)/), b = id.match(/(?:^|-)b(\d)(?:-|$)/);
      var era = m ? "v1." + m[1] : b ? "批次 " + b[1] : id === "tplSchema" || id === "tplExamples" ? "业务定义" : "外壳 / 原始层";
      var role = /^tpl-b\d/.test(id) ? "批次追加层" : /^tpl-v1\d/.test(id) ? "版本收口层" : id === "tplSchema" ? "唯一业务定义" : id === "tplExamples" ? "第二套示例业务" : "原始样式 / 结构层";
      out.push({
        i,
        tag,
        id,
        era,
        role,
        immutable: true,
        note: "总纲红线：既有收口层不得删除或改写；新增内容以追加新层接入"
      });
    });
    return out;
  }
  var LAYERS = layerRows();
  var BASE_STYLE = LAYERS.filter(function(x) {
    return x.tag === "style";
  }).map(function(x) {
    return x.id;
  });
  var BASE_SCRIPT = LAYERS.filter(function(x) {
    return x.tag === "script" && x.id !== "tpl-b5-handoff";
  }).map(function(x) {
    return x.id;
  });
  var BASE_TPL = Object.keys(T).filter(function(k) {
    return k.charAt(0) === "_";
  }).sort();
  var BASE_WL = Object.keys(window).filter(function(k) {
    return k.indexOf("__WL_") === 0 && k !== "__WL_B5_LOG__" && k !== "__WL_B5_REGISTRY__" && k !== "__WL_B5_OVERLAY__" && k !== "__WL_B5_READY__" && k !== "__WL_B5_LAYERS__" && k !== "__WL_B5_HANDOFF__";
  }).sort();
  BASE = {
    style: BASE_STYLE,
    script: BASE_SCRIPT,
    tpl: BASE_TPL,
    wl: BASE_WL,
    styleCount: BASE_STYLE.length,
    scriptCount: BASE_SCRIPT.length
  };
  window.__WL_B5_LAYERS__ = clone(LAYERS);
  log("boot", {
    layers: LAYERS.length,
    style: BASE_STYLE.length,
    script: BASE_SCRIPT.length,
    tpl: BASE_TPL.length,
    wl: BASE_WL.length
  });
  var RISK = [
    "document.write",
    "eval",
    "new Function",
    "setAttribute('on*')",
    "Range.createContextualFragment",
    "把配置拼进 location / URL"
  ];
  var PROTECT = [
    "tpl-b1-guard-early（innerHTML / outerHTML / insertAdjacentHTML 写入净化）",
    "tpl-b1-guard（localStorage 存档审计 + TPL._guard().scan()）"
  ];
  var LOGMAP = {
    "renderer.list": ["TPL._renderers", "TPL._cell", "TPL._genericLog", "__WL_B5_LOG__"],
    "renderer.detail": ["TPL._formSpec().renderers", "DETAIL_RENDERERS", "__WL_B5_LOG__"],
    "control.form": ["TPL._formSpec().controls", "CONTROLS", "TPL._collect", "__DB_PAYLOAD__"],
    "control.detail": ["TPL._formSpec().detailControls", "DETAIL_CONTROLS", "__WL_DT_FLOW__", "__WL_DT_FOCUS__"],
    "action.instance": ["TPL._actions", "TPL._actionLog", "__WL_ACTION_LOG__", "__WL_B5_LOG__"],
    "action.method": ["TPL._actionSpec().methods", "ACT.METHODS", "TPL._actionLog"],
    "scene.instance": ["TPL._pageActions", "TPL._routeLog", "__WL_ROUTE__", "__WL_B5_LOG__"],
    "scene.method": ["TPL._pageSpec().methods", "PAGE.dispatch", "TPL._routeLog"],
    "section.instance": ["TPL._formConfig", "TPL._sections", "__WL_B3_SECTIONS__", "TPL._dtFlowLog"],
    "section.button": ["TPL._columnDefs", "TPL._buttonSpec", "TPL._buttonResolve", "__DB_PAYLOAD__.__columnClick"],
    "column.instance": ["TPL._columnDefs", "TPL._snapshot", "VC.cols()", "__DB_PAYLOAD__"],
    "column.spec": ["TPL._columnSpec", "TPL._generic", "__WL_B4_GENERIC__"],
    "generic.spec": ["TPL._generic", "TPL._genericReport", "__WL_B4_GENERIC__", "__WL_B4_LOG__"],
    "dead": ["TPL._genericDead", "__WL_B4_DEAD__"],
    "layer": ["TPL._layers", "__WL_B5_LAYERS__"]
  };
  var SOURCES = [
    { kind: "renderer.list", label: "列表单元格渲染器", get: function() {
      return arr(T._renderers).map(function(k) {
        return { key: k, label: k };
      });
    } },
    { kind: "renderer.detail", label: "抽屉区块渲染器", get: function() {
      return arr((T._formSpec() || {}).renderers).map(function(x) {
        return { key: x.key, label: x.label || x.key };
      });
    } },
    { kind: "control.form", label: "单头表单控件", get: function() {
      return keys((T._formSpec() || {}).controls).map(function(k) {
        return { key: k, label: k };
      });
    } },
    { kind: "control.detail", label: "明细表控件", get: function() {
      return arr((T._formSpec() || {}).detailControls).map(function(x) {
        return { key: x.key, label: x.label || x.key };
      });
    } },
    { kind: "action.instance", label: "动作实例（工具栏 / 菜单栏）", get: function() {
      return arr(T._actions()).map(function(a) {
        return { key: a.id, label: a.label || a.id, builtin: a.builtin };
      });
    } },
    { kind: "action.method", label: "动作方法", get: function() {
      return arr((T._actionSpec() || {}).methods).map(function(m) {
        return { key: m.key, label: m.label || m.key };
      });
    } },
    { kind: "scene.instance", label: "页面交互场景实例", get: function() {
      return arr(T._pageActions()).map(function(a) {
        return { key: a.scene, label: a.label || a.scene, builtin: a.builtin };
      });
    } },
    { kind: "scene.method", label: "页面交互方法", get: function() {
      return arr((T._pageSpec() || {}).methods).map(function(m) {
        return { key: m.key, label: m.label || m.key };
      });
    } },
    { kind: "section.instance", label: "抽屉区块实例", get: function() {
      var fc = T._formConfig() || {};
      var sec = arr((fc.layout || {}).sections);
      return sec.map(function(x) {
        return { key: x.id, label: x.title || x.id, builtin: x.builtin };
      });
    } },
    { kind: "section.button", label: "操作列按钮", get: function() {
      var out = [];
      arr(T._columnDefs()).forEach(function(c) {
        if (c.renderer === "actions") arr((c.render || {}).buttons).forEach(function(b) {
          out.push({ key: (c.k || "ops") + ":" + (b.label || ""), label: b.label || "" });
        });
      });
      return out;
    } },
    { kind: "column.instance", label: "列定义实例", get: function() {
      return arr(T._columnDefs()).map(function(c) {
        return { key: c.k, label: c.t || c.k };
      });
    } },
    { kind: "column.spec", label: "列定义规格字段", get: function() {
      var cs = T._columnSpec() || {};
      return arr(cs.fields).map(function(f) {
        return { key: f.key || f.name || f.k, label: f.label || f.key };
      });
    } },
    { kind: "generic.spec", label: "通用性配置字段（批次 4）", get: function() {
      return keys(T._generic()).map(function(k) {
        return { key: k, label: k };
      });
    } },
    { kind: "dead", label: "清理台账（批次 4）", get: function() {
      return arr(T._genericDead()).map(function(d) {
        return { key: d.name, label: d.name };
      });
    } },
    { kind: "layer", label: "收口层（批次 5 追溯）", get: function() {
      return LAYERS.map(function(l) {
        return { key: l.id, label: l.era + " · " + l.id };
      });
    } }
  ];
  function rec(kind, item, how) {
    return {
      kind,
      key: String(item.key),
      label: String(item.label || item.key),
      firstSeen: Date.now(),
      discoveredBy: how || "auto",
      guard: { protectedBy: PROTECT.slice(), audited: false, probe: null, callerOwnRisk: RISK.slice() },
      logs: (LOGMAP[kind] || ["__WL_B5_LOG__"]).slice(),
      layers: { appendOnly: true, dependsOn: ["tpl-b1-guard-early", "tpl-b1-guard", "tpl-b2-redraw-early", "tpl-b2-redraw", "tpl-b3-boundary", "tpl-b4-generic", "tpl-b5-handoff"] },
      note: "按原方式新增即自动登记；DOM 写入受批次 1 净化层保护，无需作者额外补登记"
    };
  }
  function guardAudit(r) {
    try {
      var g = T._guard ? T._guard() : null;
      if (g && typeof g.scan === "function") {
        var sc = g.scan();
        r.guard.audited = true;
        r.guard.scan = { elements: sc.elements, badAttrs: arr(sc.badAttrs).length, scripts: arr(sc.scripts).length };
        r.guard.coverage = g.coverage || [];
      }
    } catch (e) {
      r.guard.auditError = String(e).slice(0, 140);
    }
    return r;
  }
  function scan(force) {
    var now = Date.now();
    if (!force && now - LAST < THROTTLE) return 0;
    LAST = now;
    var added = 0;
    SOURCES.forEach(function(src) {
      var items = [];
      try {
        items = src.get() || [];
      } catch (e) {
        return;
      }
      var ks = items.map(function(x) {
        return String(x.key);
      }).sort();
      var sig = JSON.stringify(ks);
      if (SIG[src.kind] === void 0) {
        var isInstance = /\.instance$/.test(src.kind);
        items.forEach(function(it) {
          REG.push(guardAudit(rec(src.kind, it, isInstance && it.builtin === false ? "auto" : "baseline")));
          if (isInstance && it.builtin === false) {
            log("discovered", { kind: src.kind, key: String(it.key), label: String(it.label || it.key), by: "baseline" });
          }
        });
        SIG[src.kind] = sig;
        return;
      }
      if (SIG[src.kind] === sig) return;
      var seen = {};
      REG.forEach(function(r) {
        if (r.kind === src.kind) seen[r.key] = 1;
      });
      items.forEach(function(it) {
        if (!seen[String(it.key)]) {
          REG.push(guardAudit(rec(src.kind, it, "auto")));
          added++;
          log("discovered", { kind: src.kind, key: String(it.key), label: String(it.label || it.key) });
        }
      });
      SIG[src.kind] = sig;
    });
    if (added) log("scan", { added, total: REG.length });
    return added;
  }
  scan(true);
  log("baseline", { records: REG.length, kinds: SOURCES.length });
  function probe(html, name) {
    var out = { executed: false, badAttrs: null, scripts: null, coverage: null, detached: true, offscreen: true };
    try {
      window.__B5_PWNED__ = void 0;
      var d = document.createElement("div");
      d.innerHTML = String(html == null ? "" : html);
      out.executed = !!window.__B5_PWNED__;
      d.style.cssText = "position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden";
      document.body.appendChild(d);
      out.executed = out.executed || !!window.__B5_PWNED__;
      var g = T._guard ? T._guard() : null, sc = g && g.scan ? g.scan() : {};
      out.badAttrs = arr(sc.badAttrs).length;
      out.scripts = arr(sc.scripts).length;
      out.coverage = g ? g.coverage : null;
      d.parentNode.removeChild(d);
      delete window.__B5_PWNED__;
    } catch (e) {
      out.error = String(e).slice(0, 160);
    }
    return out;
  }
  function register(kind, name, payload) {
    if (kind === "renderer") {
      if (typeof payload !== "function") throw new Error("renderer payload 必须是函数 (r,c)=>HTML");
      var fn = payload, sample = { __idx: 0, v: "B5 探针" }, col = { k: "b5", renderer: String(name) };
      var html = "";
      try {
        html = fn(sample, col);
      } catch (e) {
        html = "";
      }
      OVERLAY.renderers[String(name)] = fn;
      OVERLAY.count++;
      var r = guardAudit(rec("renderer.list", { key: name, label: name + "（批次 5 热注册）" }, "register"));
      r.guard.probe = probe(html);
      r.guard.probe.htmlLength = String(html).length;
      r.logs = LOGMAP["renderer.list"].concat(["TPL._b5Register", "__WL_B5_OVERLAY__"]);
      REG.push(r);
      SIG["renderer.list"] = JSON.stringify(arr(T._renderers).concat([String(name)]).sort());
      log("register", {
        kind: "renderer",
        key: String(name),
        executed: r.guard.probe.executed,
        badAttrs: r.guard.probe.badAttrs,
        scripts: r.guard.probe.scripts
      });
      return clone(r);
    }
    var r2 = guardAudit(rec(
      kind === "section" ? "section.instance" : kind === "action" ? "action.instance" : "scene.instance",
      { key: name, label: payload && payload.label ? payload.label : String(name) },
      "register"
    ));
    REG.push(r2);
    log("register", { kind, key: String(name), mode: "既有入口新增后的显式登记" });
    return clone(r2);
  }
  function wrap(name, fn) {
    if (typeof T[name] !== "function") return;
    var raw = T[name];
    T[name] = function() {
      return fn.call(this, raw, arguments);
    };
    log("wrapped", { name });
  }
  wrap("_cell", function(raw, args) {
    var c = args[1], n = c && c.renderer;
    if (OVERLAY.count && n && OVERLAY.renderers[n]) {
      try {
        return OVERLAY.renderers[n](args[0], c);
      } catch (e) {
        return "";
      }
    }
    return raw.apply(T, args);
  });
  var FORCE = {
    "_vcSave": 1,
    "_formSave": 1,
    "_actSave": 1,
    "_pageSave": 1,
    "_formSecAdd": 1,
    "_formLoadPreset": 1,
    "_actReset": 1,
    "_pageReset": 1,
    "_vcReset": 1
  };
  [
    "_vcSave",
    "_formSave",
    "_actSave",
    "_pageSave",
    "_dtRows",
    "_redraw",
    "_refresh",
    "_formSecAdd",
    "_formLoadPreset",
    "_actReset",
    "_pageReset",
    "_vcReset",
    "_vcRuleAdd",
    "_vcTab",
    "_view",
    "_page",
    "_size",
    "_sort",
    "_kw",
    "_toolbar",
    "_snapshot"
  ].forEach(function(k) {
    wrap(k, function(raw, args) {
      var ret = raw.apply(T, args);
      scan(!!FORCE[k]);
      return ret;
    });
  });
  var STEPS = [
    "/* 总纲 · 每批必跑的基线回归 7 项 */",
    "1) 清存档后分别联网打开、拦截 unpkg/jsdelivr 断网打开，比较默认视图截图",
    "2) TPL.apply(TPL.examples.supplier) → 查配置隔离 → TPL.reset() 回切",
    "3) 预置旧版 localStorage 存档 → reload → 查改名/调序/已删动作与视图",
    "4) TPL._vcOpen()/_vcSave()、TPL._formOpen()/_formSave()、功能设置保存 → reload 复查",
    "5) 载入入库单示例 → 编辑态 5 轮键盘录入 → 查 __WL_DT_FLOW__/__WL_DT_FOCUS__/__WL_DT_LOOKUP__",
    '6) TPL.forceResult="fail"/"ok"、提交途中 TPL._close()、DETAIL.commit/restore、结果页重试/返回',
    "7) TPL._regressionRun()；比对 TPL._* / __WL_* / style,script[id] / tplExamples / #formConfig",
    "",
    "/* 批次 1 · 可信边界 */",
    "localStorage 动作名称/视图名/区块 id/列标题/图标片段写入 O'B <img src=x onerror=...> 与 <script> → reload",
    "查 window.__PWNED__===undefined、TPL._guard().scan().badAttrs/scripts 为空、两配置面板与抽屉不破版",
    "",
    "/* 批次 2 · 重绘稳定 */",
    'new MutationObserver(rs=>rs.forEach(()=>window.__M__++)).observe(document.getElementById("main"),{childList:true,subtree:true,characterData:true});',
    "静置 2200ms 查 __M__===0；连续 6 轮 _kw/_page/_view；查 TPL._redrawReady().ready",
    "",
    "/* 批次 3 · 数据链路边界 */",
    "TPL._b3DualPreset(false) 查两个 editable-table 区块；TPL._formalPayload() vs __DB_PAYLOAD__",
    "TPL._boundaryReport() 查 __* 键、未映射去向、sessions；TPL._handoff() 查演示/正式边界",
    "",
    "/* 批次 4 · 通用性收口 */",
    'TPL._genericChanged()===false；TPL.apply(TPL.examples.supplier) → TPL._view("on")',
    "查 _snapshot().statusViews、Vue statusOpts/statusVal、ctxOptions、unit、#tplQuick a 数、document.title",
    'TPL._vcTab("where") → TPL._vcRuleAdd() → 读 #vcPane .vc-rule select 的 6 个兜底中文名',
    "",
    "/* 批次 5 · 三类新增（默认即受保护 / 可查出口，不需要额外登记） */",
    "A 新增渲染器：",
    '  TPL._b5Register("renderer","b5_probe",(r,c)=>`<b>${r.v}</b><img src=x onerror="window.__B5_PWNED__=1">`);',
    '  TPL._cell({__idx:0,v:"B5"},{k:"b5",renderer:"b5_probe"});  // 走 overlay 分派',
    '  TPL._b5Registry().find(x=>x.key==="b5_probe").guard.probe;  // executed=false / badAttrs=0',
    '  document.createElement("div").innerHTML=TPL._cell({__idx:0,v:"B5"},{k:"b5",renderer:"b5_probe"}); // 净化',
    "B 新增明细区块（走既有入口，自动发现）：",
    "  TPL._formOpen(); TPL._formSecAdd(); TPL._formSave(); TPL._b5Scan();",
    '  TPL._b5Log().filter(x=>x.k==="discovered"&&x.kind==="section.instance");',
    "C 新增动作（改配置存档 + reload，自动发现）：",
    '  const k="TPL_VIEW_CFG_V113:drugArchive",c=JSON.parse(localStorage.getItem(k));',
    `  c.actions.push({id:"a_b5_probe",zone:"toolbar",menuGroup:"",label:"O'B <img src=x onerror=...>",`,
    '    action:"none",params:"",desc:"批次5 探针",enabled:true,builtin:false});',
    "  localStorage.setItem(k,JSON.stringify(c)); location.reload();",
    '  TPL._b5Registry().filter(x=>x.key==="a_b5_probe"); TPL._guard().scan();',
    "",
    "/* 一键只读自检 */",
    "TPL._regressionRun()  // {pass,total,failed,items}；TPL._regression() 看完整清单",
    "TPL._handoffSummary() // 五批总览 / 限制 / 接后端待办；TPL._layers() 看历史叠层"
  ];
  function regression() {
    (function() {
      var a = [];
      try {
        a = (T._boundaryReport || T._b3Report || function() {
          return {};
        })();
      } catch (e) {
      }
      return a;
    })();
    return [
      { id: "B0-1", batch: "总纲", title: "联网/断网默认视图一致", steps: STEPS.slice(0, 2), expect: "像素差 0.00%", auto: "manual" },
      { id: "B0-2", batch: "总纲", title: "supplier 切换与回切", steps: STEPS.slice(1, 2), expect: "按 schemaId 隔离，回切无报错", auto: "manual" },
      { id: "B0-3", batch: "总纲", title: "旧版存档升级", steps: STEPS.slice(2, 3), expect: "改名/调序/已删动作与视图不丢", auto: "manual" },
      { id: "B0-4", batch: "总纲", title: "三处配置保存→刷新生效", steps: STEPS.slice(3, 4), expect: "列选项/配置表单/功能设置均保留", auto: "manual" },
      { id: "B0-5", batch: "总纲", title: "键盘流全链路与滚动不跳", steps: STEPS.slice(4, 5), expect: "5 轮闭环、__WL_DT_* 可查", auto: "manual" },
      { id: "B0-6", batch: "总纲", title: "预校验/关闭/还原/结果页三态", steps: STEPS.slice(5, 6), expect: "互不污染、三态逐项一致", auto: "manual" },
      { id: "B0-7", batch: "总纲", title: "出口与层清单齐全", steps: STEPS.slice(6, 7), expect: "TPL._* / __WL_* / style,script[id] / tplExamples / #formConfig 一个不少", auto: "auto", check: "exports" },
      { id: "B1-1", batch: "批次1", title: "特殊字符与片段化标记注入", steps: STEPS.slice(8, 10), expect: "不执行 / 不报错 / 不破版", auto: "manual" },
      { id: "B1-2", batch: "批次1", title: "新注册项默认受约束", steps: STEPS.slice(18, 22), expect: "guard.probe.executed=false、badAttrs/scripts=0", auto: "auto", check: "guard" },
      { id: "B2-1", batch: "批次2", title: "静置 0 mutation / 连续交互", steps: STEPS.slice(11, 13), expect: "__M__===0、控件不丢、_redrawReady().ready", auto: "auto", check: "ready" },
      { id: "B3-1", batch: "批次3", title: "演示与正式边界", steps: STEPS.slice(14, 16), expect: "正式包无 __*、dbPayload 契约不变、未映射有去向", auto: "auto", check: "boundary" },
      { id: "B4-1", batch: "批次4", title: "默认零偏差 / 新业务配置生效", steps: STEPS.slice(17, 21), expect: "changed=false；supplier 下 statusViews/ctx/unit/title 由配置生效", auto: "auto", check: "generic" },
      { id: "B5-1", batch: "批次5", title: "三类新增自动登记", steps: STEPS.slice(23, 34), expect: "discovered 日志 + registry 记录 + guard 保护", auto: "auto", check: "registry" },
      { id: "B5-2", batch: "批次5", title: "历史叠层可追溯", steps: ["TPL._layers()", "TPL._layersCheck()"], expect: "顺序一致、不可删标记齐全", auto: "auto", check: "layers" },
      { id: "B5-3", batch: "批次5", title: "总览与复现入口", steps: ["TPL._handoffSummary()", "TPL._regressionSteps()"], expect: "五批说明 / 限制 / 待办 / 命令齐全", auto: "auto", check: "summary" }
    ];
  }
  function runCheck(name) {
    try {
      if (name === "exports") {
        var t = Object.keys(T).filter(function(k) {
          return k.charAt(0) === "_";
        });
        var w = Object.keys(window).filter(function(k) {
          return k.indexOf("__WL_") === 0;
        });
        var R = window.__WL_LAYER_REGISTRY__ || [];
        var st = R.filter(function(e) {
          return e.tag === "style";
        }).map(function(e) {
          return e.id;
        });
        var sc = R.filter(function(e) {
          return e.tag === "script";
        }).map(function(e) {
          return e.id;
        });
        var miss = [];
        BASE.tpl.forEach(function(k) {
          if (t.indexOf(k) < 0) miss.push("TPL." + k);
        });
        BASE.wl.forEach(function(k) {
          if (w.indexOf(k) < 0) miss.push(k);
        });
        BASE.style.forEach(function(k) {
          if (st.indexOf(k) < 0) miss.push("style#" + k);
        });
        BASE.script.forEach(function(k) {
          if (sc.indexOf(k) < 0) miss.push("script#" + k);
        });
        return { ok: miss.length === 0, detail: {
          missing: miss,
          tpl: t.length,
          wl: w.length,
          style: st.length,
          script: sc.length,
          tplExamples: !!document.getElementById("tplExamples"),
          formConfig: document.documentElement.outerHTML.indexOf("#formConfig") > 0
        } };
      }
      if (name === "guard") {
        var g = T._guard ? T._guard() : {}, sc2 = g.scan ? g.scan() : {};
        return {
          ok: (g.coverage || []).length >= 3 && !arr(sc2.badAttrs).length && !arr(sc2.scripts).length,
          detail: {
            coverage: g.coverage,
            badAttrs: arr(sc2.badAttrs).length,
            scripts: arr(sc2.scripts).length,
            early: !!window.__WL_GUARD_EARLY__,
            late: !!window.__WL_GUARD_LATE__
          }
        };
      }
      if (name === "ready") {
        var r = T._redrawReady ? T._redrawReady() : {};
        return {
          ok: r.ready === true && !!window.__WL_B2_EARLY__ && !!window.__WL_B3_READY__ && !!window.__WL_B4_READY__ && !!window.__WL_B5_READY__,
          detail: {
            ready: r.ready,
            epoch: r.epoch,
            b2: !!window.__WL_B2_EARLY__,
            b3: !!window.__WL_B3_READY__,
            b4: !!window.__WL_B4_READY__,
            b5: !!window.__WL_B5_READY__
          }
        };
      }
      if (name === "boundary") {
        var rep = (T._boundaryReport || T._b3Report || function() {
          return {};
        })();
        var formal = Array.isArray(rep.formalPayloadKeys) ? rep.formalPayloadKeys : [];
        var demo = Array.isArray(rep.demoPayloadKeys) ? rep.demoPayloadKeys : [];
        var dbg = formal.filter(function(k) {
          return k.indexOf("__") === 0;
        });
        var contract = rep.dbPayloadContract === "保持不变";
        if (!demo.length) {
          return {
            ok: !!window.__WL_BOUNDARY__ && contract && dbg.length === 0,
            detail: {
              pendingSubmit: true,
              demo: 0,
              formal: 0,
              debugInFormal: [],
              boundaryObject: !!window.__WL_BOUNDARY__,
              dbPayloadContract: rep.dbPayloadContract,
              mode: T._boundary ? T._boundary().mode : ""
            }
          };
        }
        return {
          ok: dbg.length === 0 && contract,
          detail: {
            pendingSubmit: false,
            demo: demo.length,
            formal: formal.length,
            debugInFormal: dbg,
            dbPayloadContract: rep.dbPayloadContract,
            unmapped: rep.unmapped
          }
        };
      }
      if (name === "generic") {
        var ch = T._genericChanged ? T._genericChanged() : null;
        var g2 = T._generic ? T._generic() : {};
        return {
          ok: ch === false && !!g2.specVersion && Object.keys(g2).length >= 12,
          detail: {
            changed: ch,
            specVersion: g2.specVersion,
            keys: Object.keys(g2).length,
            statusViewIds: g2.statusViewIds,
            quickViewCount: g2.quickViewCount
          }
        };
      }
      if (name === "registry") {
        var kinds = {};
        REG.forEach(function(r2) {
          kinds[r2.kind] = 1;
        });
        return {
          ok: REG.length >= 100 && Object.keys(kinds).length >= 14 && !!window.__WL_B5_REGISTRY__ && !!window.__WL_B5_LOG__,
          detail: {
            records: REG.length,
            kinds: Object.keys(kinds).length,
            log: LOG.length,
            overlayRenderers: OVERLAY.count,
            discovered: LOG.filter(function(x) {
              return x.k === "discovered";
            }).length
          }
        };
      }
      if (name === "layers") {
        var cur = layerRows(), st2 = cur.filter(function(x) {
          return x.tag === "style";
        }).map(function(x) {
          return x.id;
        });
        var sc3 = cur.filter(function(x) {
          return x.tag === "script" && x.id !== "tpl-b5-handoff";
        }).map(function(x) {
          return x.id;
        });
        var stPrefix = st2.slice(0, BASE.style.length);
        var dynamic = st2.slice(BASE.style.length);
        var ok = JSON.stringify(stPrefix) === JSON.stringify(BASE.style) && JSON.stringify(sc3) === JSON.stringify(BASE.script) && cur.every(function(x) {
          return x.immutable === true;
        });
        return { ok, detail: {
          style: st2.length,
          styleBaseline: BASE.style.length,
          script: sc3.length,
          dynamicLayers: dynamic,
          allImmutable: cur.every(function(x) {
            return x.immutable;
          }),
          orderKept: JSON.stringify(stPrefix) === JSON.stringify(BASE.style),
          scriptOrderKept: JSON.stringify(sc3) === JSON.stringify(BASE.script)
        } };
      }
      if (name === "summary") {
        var s = summary();
        return {
          ok: s.batches.length === 5 && s.limits.length >= 10 && s.backendTodo.length >= 8 && s.neverChanged.length >= 8,
          detail: {
            batches: s.batches.length,
            limits: s.limits.length,
            todo: s.backendTodo.length,
            neverChanged: s.neverChanged.length,
            regressionSteps: STEPS.length
          }
        };
      }
    } catch (e) {
      return { ok: false, detail: { error: String(e).slice(0, 180) } };
    }
    return { ok: false, detail: { unknown: name } };
  }
  function run() {
    var items = regression().filter(function(x) {
      return x.auto === "auto";
    }).map(function(x) {
      var c = runCheck(x.check);
      return { id: x.id, batch: x.batch, title: x.title, check: x.check, ok: c.ok, detail: c.detail };
    });
    var failed = items.filter(function(x) {
      return !x.ok;
    });
    var out = {
      pass: failed.length === 0,
      total: items.length,
      failed,
      items,
      at: Date.now(),
      manual: regression().filter(function(x) {
        return x.auto === "manual";
      }).map(function(x) {
        return x.id;
      })
    };
    log("regressionRun", { pass: out.pass, total: out.total, failed: failed.map(function(x) {
      return x.id;
    }) });
    return out;
  }
  var SUMMARY = {
    version: "v1.38",
    batch: 5,
    batches: [
      { n: 1, title: "输入与渲染的可信边界", did: "head 早装层统一净化 innerHTML/outerHTML/insertAdjacentHTML 的写入；128 处内联事件参数改走 escJS 专用编码；localStorage 存档审计；TPL._guard().scan()/harden() 出口", left: "二次解析根因留给批次 2；document.write / eval / new Function / setAttribute(on*) / Range / location 仍属调用方自行负责" },
      { n: 2, title: "重绘、观察器与连续录入稳定性", did: "同值 textContent 短路、状态签名幂等、focus/select 焦点闸门、_redrawGate 排队与 _redrawReady() 出口；静置自激 mutation 722→0", left: "幂等是状态签名级；真实数据源需主动清签名；宏任务级异步渲染需接入队列" },
      { n: 3, title: "演示态与正式数据链路分离", did: "__DB_PAYLOAD__ 74 键演示包原样保留；新增 68 键正式包（TPL._formalPayload / _handoff）；未映射字段去向表；多区块键唯一归一；提交会话三路径互不污染", left: "未映射字段不进入任何输出包；会话是内存数组刷新即清空；预校验仍是 mock" },
      { n: 4, title: "通用性收口", did: "10 类残留业务/视图假设收进 S.generic（状态视图、状态/上下文文案、快捷视图数量、标签色板、演示取模、where 兜底、单位、标题后缀）；supplier 自带配置生效；清理台账 3 项", left: "清理台账只登记未物理删文本；断网原生回落不经过 _cell 包装；渲染器内取模常量等仍写死（12 条清单已交接）" },
      { n: 5, title: "可维护性、回归入口与总收口", did: "层追溯（_layers / __WL_B5_LAYERS__）、15 类注册项自动发现与 guard 审计（_b5Registry / __WL_B5_REGISTRY__ / __WL_B5_LOG__）、三类新增复现（_b5Register / _b5Scan / _b5Replay）、回归清单与只读自检（_regression / _regressionRun / _regressionSteps）、五批总览（_handoffSummary）", left: "本批不再新增功能方向、不改视觉、不调整前四批链路；自动登记为懒触发，未被任何出口调用的纯注册项需手动 _b5Scan()" }
    ],
    neverChanged: [
      "tplSchema 仍是唯一业务定义；tplExamples（supplier）保留；三套 localStorage 存储键不变",
      "Vue 2.7.16 + element-ui 2.15.14 CDN 版本与 CDN 全断原生回落双路径不变",
      "腾讯蓝 #0052D9 主色阶、v1.13 基准图采样色板、字号档位、行高、间距、圆角、阴影层级、水印文案与角度",
      "默认视图、默认列序、默认每页 10 行、默认主色、默认冻结列、默认抽屉骨架与结果页三态",
      '既有 <style id="tpl-v1xx-..."> / <script id="tpl-v1xx-..."> 收口层不得删除或改写，新增内容一律追加新层',
      "视图 Tab、关键词、快捷/高级筛选、数据范围多条件、列选项/列宽/列序/列冻结、分页排序、行单选与勾选两套状态机",
      "配置中心五页签、草稿态、保存并应用、恢复默认、生效 JSON、功能设置、动作管理、交互场景管理、列点击绑定、操作按钮显示策略",
      "抽屉独立 FORM_STORE、独立配置表单面板、各区块渲染器、左卡目录联动、资料卡、时间轴、DB 映射",
      "主子表工作副本、公式与汇总、增删行、选录浮层、回填映射、异步预校验、关闭/重置还原、成功后固化",
      "v1.33 键盘流全链路（spec.flow 派生顺序、document 级键盘委托、Enter 下一跳、末列复用空行/自动增行、重绘后 rowKey 重定位焦点、聚焦全选、不滚动、浮层 ↑↓/Enter/Esc）",
      "TPL.schema/apply/reset/export/rows/dbPayload/examples/forceResult、全部既有 TPL._*、全部 __WL_*、全部 style/script id、#formConfig 直达入口",
      "演示用 HTTP / REQ / 延时反馈、结果页、水印及其文案；文件头 v1.2~v1.33 全部版本说明按原文保留"
    ],
    regression: {
      base7: "总纲每批必跑 7 项",
      all: "TPL._regression()",
      auto: "TPL._regressionRun()",
      steps: "TPL._regressionSteps()",
      report: "TPL._handoffSummary()",
      layers: "TPL._layers() / _layersCheck()",
      registry: "TPL._b5Registry() / _b5Log() / _b5Scan() / _b5Replay() / __WL_B5_REGISTRY__",
      quick: "清 localStorage → 联网/断网截图对照 → _regressionRun() → apply(supplier) → 载入入库单示例跑键盘流 → 结果页三态"
    },
    limits: [
      "批次 1：esc() 编码片段被二次写入后实体还原的根因未从渲染侧根治，靠非白名单 on* 属性规则纵深兜底；RISK 是文本级判定，不承诺完整语法级防护",
      "批次 1：document.write / eval / new Function / 直接 setAttribute(on*) / Range 片段 / 把配置拼进 location 仍属调用方自行负责",
      "批次 2：幂等是状态签名级而非数据级；接真实数据源后需主动清签名或调重绘标记",
      "批次 2：过期任务被闸门拦下时 __WL_DT_FOCUS__ 仍记一次「尝试」（实际焦点不动）；textContent 短路只覆盖纯文本元素与文本节点；焦点闸门只拦 JS 的 focus()/select()",
      "批次 3：未映射字段仍不进入任何输出包，值只在 __WL_UNMAPPED_VALUES__ 旁路，落库须补 S.db.dbMap",
      "批次 3：键唯一归一仅覆盖显示中的 editable-table 区块；提交会话是内存数组（最多 40 条），刷新即清空",
      "批次 3：gotoPage / openWindow / callApi / PDF / 打印仍是原型级记录与反馈，drawer 是真实抽屉；预校验是 mock",
      "批次 4：清理台账 3 项只登记注销、未物理删除既有脚本文本（红线禁止改写收口层）",
      "批次 4：断网原生回落路径不经过 _cell 包装，supplier 断网态色板/取模迁移不生效；默认业务断网态零变化",
      "批次 4：默认态包装直通，「配置生效」只在 S.generic 与反推默认不同时可见；DOM 校正依赖既有同步渲染时序",
      "批次 4 剩余业务假设：RENDERERS 取模常量 7/3/2 与 90+i*7、wlAvatar 调色算法、VC.whereFields 的 in r0、setShadows 旧正则、opts 的「全部」value、st 初值 all/10、.drug-table 类名 68 处、[10,20,50,100]、seedRows 取模规则、title 拼接形态",
      "批次 5：自动登记为懒触发，未被任何出口调用的纯注册项需手动 TPL._b5Scan()；热注册渲染器依赖 _cell overlay，默认态零命中",
      "批次 5：回归自检只跑只读自动判定项，7 项总纲基线中的截图对照、旧存档、键盘流、结果页三态仍须人工/脚本复现",
      "原型整体：纯前端演示，未连数据库；submit() 是 setTimeout 模拟；全部配置存 localStorage 而非服务端配置中心"
    ],
    backendTodo: [
      "submit() 的 setTimeout 换成真实 fetch；mock 预校验换成额度 / 库存 / 审批接口并保留阻断语义",
      "gotoPage / openWindow / callApi / PDF / 打印接真实路由表与请求；FEAT.route(scene) 接路由中心",
      "VC.tbOptions(field) 换成按 OpTypeID 查 OptionText 的字典表（一处生效，候选项不写进视图配置）",
      "补齐 S.db.dbMap 的 3 个未映射字段（sa_grade / sa_supplier / sa_diagScope），让它们进入正式包而非旁路",
      "三套 localStorage（STORE / VSTORE / FORM_STORE）迁到服务端配置中心，带 schemaId、版本、灰度与回滚",
      "从重绘侧根治批次 1 的二次解析根因，随后可重新评估非白名单 on* 兜底规则是否仍需要",
      "真实数据源接入后，在数据订阅处主动清批次 2 的状态签名或调用 TPL._redraw() 标记",
      "若放宽「不得改写既有收口层」约束，物理删除清理台账 3 项与 .drug-table 等遗留类名",
      "补用户鉴权 / 权限与动作可见性：cfg.actions 的 enabled 之外需按角色过滤",
      "把 TPL._regressionSteps() 的命令序列固化为 CI 脚本，接入截图逐像素对照与断网拦截",
      "接后端前决定「正式包」消费方：TPL._formalPayload() / _handoff().payload，勿再从 __DB_PAYLOAD__ 取"
    ]
  };
  function summary() {
    return clone(SUMMARY);
  }
  window.__WL_B5_HANDOFF__ = clone(SUMMARY);
  Object.assign(T, {
    _layers() {
      return clone(LAYERS);
    },
    _layersCheck() {
      return runCheck("layers");
    },
    _b5Registry() {
      return clone(REG);
    },
    _b5Log() {
      return clone(LOG);
    },
    _b5Scan(force) {
      var n = scan(force !== false);
      log("manualScan", { added: n });
      return { added: n, records: REG.length, kinds: Object.keys(SIG).length };
    },
    _b5Register(kind, name, payload) {
      return register(kind, name, payload);
    },
    _b5Replay() {
      return { steps: STEPS.slice(), threeKinds: {
        renderer: 'TPL._b5Register("renderer","b5_probe",(r,c)=>`<b>${r.v}</b><img src=x onerror="window.__B5_PWNED__=1">`)',
        section: "TPL._formOpen(); TPL._formSecAdd(); TPL._formSave(); TPL._b5Scan()",
        action: "改 TPL_VIEW_CFG_V113:<schemaId> 的 cfg.actions push 一项 → location.reload() → TPL._b5Registry()"
      } };
    },
    _b5Report() {
      return {
        version: SUMMARY.version,
        batch: 5,
        ready: !!window.__WL_B5_READY__,
        layers: { count: LAYERS.length, style: BASE.style.length, script: BASE.script.length, check: runCheck("layers") },
        registry: {
          records: REG.length,
          kinds: Object.keys(SIG).length,
          overlayRenderers: OVERLAY.count,
          discovered: LOG.filter(function(x) {
            return x.k === "discovered";
          }),
          registered: LOG.filter(function(x) {
            return x.k === "register";
          })
        },
        guard: {
          coverage: (function() {
            try {
              return T._guard().coverage;
            } catch (e) {
              return [];
            }
          })(),
          callerOwnRisk: RISK.slice(),
          protectedBy: PROTECT.slice()
        },
        regression: run(),
        regressionManual: regression().filter(function(x) {
          return x.auto === "manual";
        }).map(function(x) {
          return x.id;
        }),
        logs: LOG.slice(-30),
        summary: clone(SUMMARY)
      };
    },
    _regression() {
      return regression();
    },
    _regressionRun() {
      return run();
    },
    _regressionSteps() {
      return STEPS.join("\n");
    },
    _handoffSummary() {
      return summary();
    }
  });
  log("ready", { newTpl: Object.keys(T).filter(function(k) {
    return k.indexOf("_b5") === 0 || k.indexOf("_regression") === 0 || k.indexOf("_layers") === 0 || k === "_handoffSummary";
  }).length });
})();
