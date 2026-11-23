(function() {
  var T = window.TPL, D = window.DETAIL, GU = window.GUARD;
  if (!T || !D) return;
  if (window.__WL_LOOKUP_GRID_INSTALLED__) return;
  window.__WL_LOOKUP_GRID_INSTALLED__ = 1;
  var CSS = [
    "#dtLookup.lg-grid{border-radius:8px;box-shadow:0 12px 36px rgba(46,64,94,.18);overflow:hidden}",
    "#dtLookup.lg-grid .lg-hd{background:#f4f6f9;border-bottom:1px solid #e4e8ee}",
    "#dtLookup.lg-grid .lg-cap{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;font-size:11.5px;color:#2e405e}",
    "#dtLookup.lg-grid .lg-cap b{color:#0052d9}",
    "#dtLookup.lg-grid .lg-meta{font-size:10px;color:#909aaa;white-space:nowrap}",
    "#dtLookup.lg-grid .lg-scroll{max-height:min(42vh,320px);overflow:auto}",
    "#dtLookup.lg-grid[data-lg-h]{display:flex;flex-direction:column;max-height:calc(100vh - 16px)}",
    '#dtLookup.lg-grid[data-lg-h="fixed"]{height:var(--lg-h)}',
    '#dtLookup.lg-grid[data-lg-h="max"]{max-height:var(--lg-h)}',
    "#dtLookup.lg-grid[data-lg-h] .lg-hd,#dtLookup.lg-grid[data-lg-h] .lg-ft{flex:0 0 auto}",
    "#dtLookup.lg-grid[data-lg-h] .lg-scroll{flex:1 1 auto;min-height:0;max-height:none;overflow:auto}",
    "#dtLookup.lg-grid .lg-tbl{border-collapse:collapse;table-layout:fixed;font-size:11.5px;color:#2e405e;font-family:inherit}",
    "#dtLookup.lg-grid .lg-tbl th,#dtLookup.lg-grid .lg-tbl td{height:30px;padding:0 9px;border-right:1px solid #edeff3;",
    "  border-bottom:1px solid #edeff3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}",
    "#dtLookup.lg-grid .lg-tbl th:last-child,#dtLookup.lg-grid .lg-tbl td:last-child{border-right:0}",
    "#dtLookup.lg-grid .lg-tbl thead th{position:sticky;top:0;z-index:1;background:#f4f6f9;",
    "  color:#6e7b8c;font-weight:600;font-size:11px}",
    "#dtLookup.lg-grid .lg-tbl tbody tr{cursor:pointer}",
    "#dtLookup.lg-grid .lg-tbl tbody tr:hover td{background:#f7f9ff}",
    "#dtLookup.lg-grid .lg-tbl tbody tr.on td{background:#e6efff;color:#0052d9;font-weight:600;",
    "  box-shadow:inset 0 1px 0 #c4d8ff,inset 0 -1px 0 #c4d8ff}",
    "#dtLookup.lg-grid .lg-tbl tbody tr.lg-none td{height:44px;text-align:center;color:#909aaa;cursor:default}",
    "#dtLookup.lg-grid .lg-ft{display:flex;align-items:center;gap:10px;padding:8px 12px;",
    "  border-top:1px solid #e4e8ee;background:#fafbfc}",
    "#dtLookup.lg-grid .lg-pager{display:flex;align-items:center;gap:6px;flex:0 0 auto}",
    "#dtLookup.lg-grid .lg-pager button,#dtLookup.lg-grid .lg-acts button{height:25px;padding:0 11px;",
    "  border:1px solid #dadee3;background:#fff;color:#2e405e;border-radius:4px;font:inherit;",
    "  font-size:11px;cursor:pointer;white-space:nowrap}",
    "#dtLookup.lg-grid .lg-pager button:hover:not(:disabled),#dtLookup.lg-grid .lg-acts button:hover{border-color:#0052d9;color:#0052d9}",
    "#dtLookup.lg-grid .lg-pager button:disabled{opacity:.45;cursor:not-allowed}",
    "#dtLookup.lg-grid .lg-page{font-size:10.5px;color:#6e7b8c;white-space:nowrap}",
    "#dtLookup.lg-grid .lg-page b{color:#0052d9}",
    "#dtLookup.lg-grid .lg-tip{flex:1 1 auto;min-width:0;text-align:center;font-size:9.5px;",
    "  color:#909aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "#dtLookup.lg-grid .lg-acts{display:flex;gap:7px;flex:0 0 auto;margin-left:auto}",
    "#dtLookup.lg-grid .lg-acts .lg-ok{border-color:#0052d9;background:#0052d9;color:#fff;font-weight:600}",
    "#dtLookup.lg-grid .lg-acts .lg-ok:hover{background:#0046bb;border-color:#0046bb;color:#fff}"
  ].join("\n");
  if (!document.getElementById("tpl-b6-lookup-grid")) {
    document.head.insertAdjacentHTML("beforeend", '<style id="tpl-b6-lookup-grid">' + CSS + "</style>");
  }
  var S = { active: false, spec: null, page: 0, q: "", trigger: null, writes: 0, blocks: 0, lastReasons: [] };
  function EXT() {
    return window.__WL_BATCH_EXT__ || null;
  }
  function extOn() {
    var x = EXT();
    return !!(x && typeof x.active === "function" && x.active());
  }
  function sources() {
    try {
      var f = T._formSpec && T._formSpec() || {};
      return f.lookupSources || {};
    } catch (e) {
      return {};
    }
  }
  function gridSpec(key) {
    var src = sources()[key];
    if (!src || typeof src !== "object") return null;
    var arr = src.columns;
    if (!Array.isArray(arr) || !arr.length) return null;
    var cols = [], i, c, k, w;
    for (i = 0; i < arr.length; i++) {
      c = arr[i] || {};
      k = String(c.k == null ? "" : c.k);
      if (!k || c.hidden === true || c.hidden === "true") continue;
      w = Math.max(36, Math.min(600, +c.w || 90));
      cols.push({ k, t: String(c.t == null ? c.label == null ? k : c.label : c.t), w });
    }
    if (!cols.length) return null;
    var size = Math.max(1, Math.min(200, +src.pageSize || 10));
    var rows = Array.isArray(src.rows) ? src.rows : [];
    var match = Array.isArray(src.match) && src.match.length ? src.match.map(String) : null;
    if (!match) match = Object.keys(rows[0] || {});
    function legal(v) {
      var n = +v;
      return isFinite(n) && n >= 120 && n <= 1200 ? Math.round(n) : 0;
    }
    var fixed = legal(src.popupHeight), max = legal(src.popupMaxHeight);
    var hMode = fixed ? "fixed" : max ? "max" : "auto";
    var hPx = fixed ? fixed : max ? max : 0;
    return {
      cols,
      size,
      rows,
      match,
      heightMode: hMode,
      heightPx: hPx,
      label: String(src.label == null ? key : src.label),
      source: String(key)
    };
  }
  function filtered(q) {
    var rows = S.spec ? S.spec.rows : [], keys = S.spec ? S.spec.match : [];
    var needle = String(q || "").trim().toLowerCase();
    if (!needle) return rows.slice();
    var out = [], i, j, o, v;
    for (i = 0; i < rows.length; i++) {
      o = rows[i] || {};
      for (j = 0; j < keys.length; j++) {
        v = o[keys[j]];
        if (String(v == null ? "" : v).toLowerCase().indexOf(needle) >= 0) {
          out.push(o);
          break;
        }
      }
    }
    return out;
  }
  function tx(v) {
    if (GU && GU.text) return GU.text(v);
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function at(v) {
    return GU && GU.attr ? GU.attr(v) : tx(v);
  }
  function emit(box, html) {
    var r = GU && GU.harden ? GU.harden(html) : { html, hit: false, reasons: [] };
    if (r.hit) {
      S.blocks++;
      S.lastReasons = (r.reasons || []).slice(0, 6);
    }
    box.innerHTML = r.html;
    S.writes++;
  }
  function paint() {
    var st = D.lookupState;
    if (!st || !S.active || !S.spec) return;
    var box = document.getElementById("dtLookup");
    if (!box) return;
    var spec = S.spec, cols = spec.cols, size = spec.size;
    var list = Array.isArray(st.list) ? st.list : [];
    var pages = Math.max(1, Math.ceil(list.length / size));
    S.page = Math.max(0, Math.min(pages - 1, S.page));
    var start = S.page * size, slice = list.slice(start, start + size);
    var active = Math.max(0, Math.min(Math.max(0, list.length - 1), +st.active || 0));
    st.active = active;
    var totalW = cols.reduce(function(a, c) {
      return a + c.w;
    }, 0);
    var colHtml = cols.map(function(c) {
      return '<col style="width:' + c.w + 'px">';
    }).join("");
    var th = cols.map(function(c) {
      return '<th style="width:' + c.w + 'px">' + tx(c.t) + "</th>";
    }).join("");
    var body = slice.length ? slice.map(function(o, i) {
      var gi = start + i, cls = gi === active ? ' class="on"' : "";
      return '<tr data-lk="row" data-i="' + gi + '"' + cls + ">" + cols.map(function(c) {
        var s = String(o[c.k] == null ? "" : o[c.k]);
        return '<td title="' + at(s) + '">' + tx(s) + "</td>";
      }).join("") + "</tr>";
    }).join("") : '<tr class="lg-none"><td colspan="' + cols.length + '">无匹配候选</td></tr>';
    var cap, grid, ft, x = EXT(), on = extOn();
    if (on && x && typeof x.render === "function") {
      var out = x.render({
        box,
        st,
        spec,
        cols,
        size,
        list,
        pages,
        page: S.page,
        start,
        slice,
        active,
        tx,
        at
      });
      cap = out.cap;
      grid = out.grid;
      ft = out.ft;
      if (+out.totalW > 0) totalW = +out.totalW;
    } else {
      cap = '<div class="lg-hd"><div class="lg-cap"><span>选录 · <b>' + tx(spec.label) + '</b></span><span class="lg-meta">共 ' + list.length + " 条 · " + cols.length + " 列</span></div></div>";
      grid = '<div class="lg-scroll"><table class="lg-tbl" style="width:' + totalW + 'px"><colgroup>' + colHtml + "</colgroup><thead><tr>" + th + "</tr></thead><tbody>" + body + "</tbody></table></div>";
      ft = '<div class="lg-ft"><div class="lg-pager"><button type="button" data-lk="prev"' + (S.page <= 0 ? " disabled" : "") + '>上一页</button><span class="lg-page">第 <b>' + (S.page + 1) + "</b> / " + pages + ' 页</span><button type="button" data-lk="next"' + (S.page >= pages - 1 ? " disabled" : "") + '>下一页</button></div><span class="lg-tip">↑↓ 移动 · Enter / 双击选中 · Esc 取消</span><div class="lg-acts"><button type="button" data-lk="close">取消</button><button type="button" class="lg-ok" data-lk="ok">确定</button></div></div>';
    }
    box.classList.add("lg-grid");
    box.style.width = Math.min(totalW + 2, Math.max(320, window.innerWidth - 16)) + "px";
    if (S.spec.heightMode !== "auto") {
      box.setAttribute("data-lg-h", S.spec.heightMode);
      box.style.setProperty("--lg-h", S.spec.heightPx + "px");
    } else {
      box.removeAttribute("data-lg-h");
      box.style.removeProperty("--lg-h");
    }
    emit(box, cap + grid + ft);
    place(box, st.triggerEl);
    var L = window.__WL_DT_LOOKUP__ || {};
    L.open = true;
    L.grid = true;
    L.candidates = list.length;
    L.active = active;
    L.page = S.page + 1;
    L.pages = pages;
    L.pageSize = size;
    L.visibleCols = cols.length;
    window.__WL_DT_LOOKUP__ = L;
  }
  function place(box, trigger) {
    var rect = trigger && trigger.getBoundingClientRect ? trigger.getBoundingClientRect() : null;
    var budget = S.spec && S.spec.heightPx > 0 ? S.spec.heightPx : 0;
    var h = budget || box.offsetHeight, w = box.offsetWidth, vw = window.innerWidth, vh = window.innerHeight;
    var left = rect ? Math.max(8, Math.min(Math.max(8, vw - w - 8), rect.left)) : Math.max(8, (vw - w) / 2);
    var below = rect ? vh - rect.bottom - 4 : vh, above = rect ? rect.top - 4 : 0, top;
    var flip = !!(rect && below <= h && above > below);
    if (flip) top = rect.top - h - 4;
    else top = rect ? rect.bottom + 4 : Math.max(8, (vh - h) / 2);
    top = Math.max(8, Math.min(top, Math.max(8, vh - h - 8)));
    box.style.left = left + "px";
    box.style.top = top + "px";
    window.__WL_LOOKUP_PLACE__ = {
      heightBudget: h,
      mode: S.spec ? S.spec.heightMode : "auto",
      below: Math.round(below),
      above: Math.round(above),
      flip,
      top: Math.round(top),
      left: Math.round(left)
    };
  }
  function cleanup() {
    S.active = false;
    var box = document.getElementById("dtLookup");
    if (box) {
      box.classList.remove("lg-grid");
      box.style.width = "";
      box.removeAttribute("data-lg-h");
      box.style.removeProperty("--lg-h");
    }
  }
  function syncState() {
    if (!S.active) return;
    var box = document.getElementById("dtLookup");
    if (!D.lookupState || !box || !box.classList.contains("on")) cleanup();
  }
  function restoreFocus(el) {
    if (!el || !el.focus) return;
    if (document.activeElement === el) return;
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      try {
        el.focus();
      } catch (e2) {
      }
    }
  }
  function takeover(st) {
    var spec = st ? gridSpec(st.source) : null;
    if (!spec) {
      cleanup();
      return;
    }
    if (S.active && S.trigger === st.triggerEl && S.spec && S.spec.source === spec.source) return;
    S.active = true;
    S.spec = spec;
    S.page = 0;
    S.trigger = st.triggerEl || null;
    S.q = String(st.triggerEl && st.triggerEl.value || "");
    var x = EXT(), on = extOn();
    st.list = on && x && typeof x.rows === "function" ? x.rows() : filtered(S.q);
    st.active = 0;
    paint();
    restoreFocus(S.trigger);
  }
  function applyFilter(q) {
    var st = D.lookupState;
    if (!st || !S.active) return;
    S.q = String(q || "");
    var x = EXT(), on = extOn();
    if (!(on && x && typeof x.rows === "function")) {
      st.list = filtered(S.q);
      st.active = 0;
      S.page = 0;
    }
    paint();
    restoreFocus(S.trigger);
  }
  function setActive(idx) {
    var st = D.lookupState;
    if (!st || !S.spec) return;
    var n = (st.list || []).length;
    if (!n) return;
    st.active = Math.max(0, Math.min(n - 1, +idx || 0));
    S.page = Math.floor(st.active / S.spec.size);
    var box = document.getElementById("dtLookup");
    if (box) {
      var trs = box.querySelectorAll('[data-lk="row"]');
      for (var i = 0; i < trs.length; i++) {
        trs[i].classList.toggle("on", +trs[i].getAttribute("data-i") === st.active);
      }
    }
    var L = window.__WL_DT_LOOKUP__ || {};
    L.active = st.active;
    L.page = S.page + 1;
    window.__WL_DT_LOOKUP__ = L;
    restoreFocus(S.trigger);
  }
  function move(delta) {
    var st = D.lookupState;
    if (!st || !st.list || !st.list.length) return;
    var n = st.list.length;
    var next = ((+st.active || 0) + delta + n) % n;
    var page = Math.floor(next / S.spec.size);
    if (page !== S.page) {
      st.active = next;
      S.page = page;
      paint();
      restoreFocus(S.trigger);
    } else setActive(next);
  }
  function confirmPick() {
    var st = D.lookupState;
    if (!st) return;
    if (!(st.list && st.list.length)) {
      D.lookupClose();
      return;
    }
    D.lookupKey({ key: "Enter", preventDefault: function() {
    }, stopPropagation: function() {
    } });
  }
  function cancel() {
    D.lookupClose();
  }
  var rawEnterFlow = D.enterFlow;
  D.enterFlow = function(secId, el) {
    var ret = rawEnterFlow.call(D, secId, el);
    var st = D.lookupState;
    if (st) takeover(st);
    return ret;
  };
  var rawOpen = D.lookupOpen;
  D.lookupOpen = function(a, b, c) {
    var ret = rawOpen.call(D, a, b, c);
    var st = D.lookupState;
    if (st) takeover(st);
    else cleanup();
    return ret;
  };
  var rawClose = D.lookupClose;
  D.lookupClose = function() {
    var ret = rawClose.call(D);
    cleanup();
    return ret;
  };
  var rawKey = D.lookupKey;
  D.lookupKey = function(e) {
    var ret = rawKey.call(D, e);
    if (S.active && !D.lookupState) cleanup();
    return ret;
  };
  var rawPick = D.lookupPick;
  D.lookupPick = function(idx) {
    var ret = rawPick.call(D, idx);
    if (S.active && !D.lookupState) cleanup();
    return ret;
  };
  var rawInput = T._dtInput;
  T._dtInput = function(e, id) {
    syncState();
    var ret = rawInput.call(T, e, id);
    if (S.active && e && e.target && S.trigger && e.target === S.trigger) applyFilter(e.target.value);
    return ret;
  };
  var rawFilter = T._dtLookupFilter;
  T._dtLookupFilter = function(v) {
    syncState();
    if (!S.active) return rawFilter.call(T, v);
    applyFilter(v);
  };
  var rawClick = T._dtLookupClick;
  T._dtLookupClick = function(e) {
    syncState();
    if (!S.active) return rawClick.call(T, e);
    var b = e.target && e.target.closest ? e.target.closest("[data-lk]") : null;
    if (!b) return;
    var a = b.getAttribute("data-lk"), st = D.lookupState;
    if (!st) return;
    if (a === "row") {
      var idx = +b.getAttribute("data-i");
      if (!isNaN(idx)) setActive(idx);
      return;
    }
    if (a === "prev" || a === "next") {
      var pages = Math.max(1, Math.ceil((st.list || []).length / S.spec.size));
      S.page = Math.max(0, Math.min(pages - 1, S.page + (a === "next" ? 1 : -1)));
      paint();
      restoreFocus(S.trigger);
      return;
    }
    if (a === "ok") {
      confirmPick();
      return;
    }
    return rawClick.call(T, e);
  };
  document.addEventListener("keydown", function(e) {
    syncState();
    if (!S.active) return;
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on")) return;
    if (e.target !== S.trigger) return;
    var k = e.key;
    if (k !== "ArrowDown" && k !== "ArrowUp" && k !== "Enter" && k !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    if (k === "ArrowDown") move(1);
    else if (k === "ArrowUp") move(-1);
    else if (k === "Enter") confirmPick();
    else cancel();
  }, true);
  document.addEventListener("mousedown", function(e) {
    syncState();
    if (!S.active) return;
    var box = document.getElementById("dtLookup");
    if (!box || !box.contains(e.target)) return;
    var f = e.target && e.target.closest ? e.target.closest("[data-ba],[data-pb],button") : null;
    if (!f) e.preventDefault();
  }, false);
  document.addEventListener("dblclick", function(e) {
    syncState();
    if (!S.active) return;
    var row = e.target && e.target.closest ? e.target.closest('#dtLookup [data-lk="row"]') : null;
    if (!row) return;
    e.preventDefault();
    var idx = +row.getAttribute("data-i");
    if (!isNaN(idx)) setActive(idx);
    confirmPick();
  }, false);
  window.__WL_LOOKUP_GRID__ = function() {
    var st = D.lookupState || {};
    return {
      mode: S.active ? "grid" : "legacy",
      active: S.active,
      source: S.spec ? S.spec.source : "",
      label: S.spec ? S.spec.label : "",
      columns: S.spec ? S.spec.cols.map(function(c) {
        return { k: c.k, t: c.t, w: c.w };
      }) : [],
      pageSize: S.spec ? S.spec.size : 0,
      page: S.page + 1,
      heightMode: S.spec ? S.spec.heightMode : "auto",
      heightPx: S.spec ? S.spec.heightPx : 0,
      boxHeight: (document.getElementById("dtLookup") || {}).offsetHeight || 0,
      boxTop: (document.getElementById("dtLookup") || {}).offsetTop || 0,
      place: window.__WL_LOOKUP_PLACE__ || null,
      candidates: (st.list || []).length,
      activeIndex: +st.active || 0,
      query: S.q,
      writes: S.writes,
      guardBlocks: S.blocks,
      guardReasons: S.lastReasons.slice(),
      focusKept: !!(S.trigger && document.activeElement === S.trigger)
    };
  };
  T._lookupGrid = window.__WL_LOOKUP_GRID__;
})();
(function() {
  var T = window.TPL, D = window.DETAIL, GU = window.GUARD;
  if (!T || !D) return;
  if (window.__WL_DT_UI_INSTALLED__) return;
  window.__WL_DT_UI_INSTALLED__ = 1;
  var ROWNO_W = 40;
  var ROW_H = 30, HEAD_H = 30, FOOT_H = 30;
  var ST = { writes: 0, blocks: 0, lastReasons: [], rendered: {}, delLog: [], sweeps: 0, hits: 0, lastTargets: [] };
  var CSS = [
    "#drawer .dt-tbl col.dt-rn-col{width:" + ROWNO_W + "px}",
    "#drawer .dt-tbl th.dt-rn-h{width:" + ROWNO_W + "px;text-align:center;color:#909aaa;font-weight:600}",
    "#drawer .dt-tbl td.dt-rn{position:relative;text-align:center;padding:0}",
    "#drawer .dt-tbl .dt-rn-n{display:inline-block;font-variant-numeric:tabular-nums;",
    "  color:#909aaa;transition:opacity .15s}",
    "#drawer .dt-tbl .dt-rn-del{position:absolute;inset:0;display:flex;align-items:center;",
    "  justify-content:center;width:100%;height:100%;padding:0;border:0;background:transparent;",
    "  color:#e66544;font:inherit;font-size:14px;line-height:1;cursor:pointer;",
    "  opacity:0;transition:opacity .15s}",
    "#drawer .dt-tbl td.dt-rn.has-del:hover .dt-rn-n{opacity:0}",
    "#drawer .dt-tbl td.dt-rn.has-del:hover .dt-rn-del,",
    "#drawer .dt-tbl .dt-rn-del:focus-visible{opacity:1}",
    "#drawer .dt-tbl .dt-rn-del:hover{background:#fff1ec}",
    "#drawer .dt-wrap[data-b7-max] .dt-tblbox{max-height:var(--dt-max);overflow:auto}",
    "#drawer .dt-wrap[data-b7-max] .dt-tbl thead th{position:sticky;top:0;z-index:2}",
    "#drawer .dt-wrap[data-b7-max] .dt-tbl tfoot td{position:sticky;bottom:0;z-index:2}",
    '#drawer .dt-ipt[type="number"]::-webkit-inner-spin-button,',
    '#drawer .dt-ipt[type="number"]::-webkit-outer-spin-button{-webkit-appearance:none;',
    "  appearance:none;margin:0}",
    '#drawer .dt-ipt[type="number"]{-moz-appearance:textfield;appearance:textfield}'
  ].join("\n");
  if (!document.getElementById("tpl-b7-detail-ui")) {
    document.head.insertAdjacentHTML("beforeend", '<style id="tpl-b7-detail-ui">' + CSS + "</style>");
  }
  function gt(v) {
    if (GU && GU.text) return GU.text(v);
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function harden(html) {
    var r = GU && GU.harden ? GU.harden(html) : { html, hit: false, reasons: [] };
    if (r.hit) {
      ST.blocks++;
      ST.lastReasons = (r.reasons || []).slice(0, 6);
    }
    return r.html;
  }
  function put(el, pos, html) {
    el.insertAdjacentHTML(pos, harden(html));
  }
  function finite(v, lo, hi) {
    var n = +v;
    return isFinite(n) && n >= lo && n <= hi ? Math.round(n) : 0;
  }
  function globalDefaults() {
    try {
      return (T._formSpec && T._formSpec() || {}).detailDefaults || {};
    } catch (e) {
      return {};
    }
  }
  function specOf(secId) {
    try {
      var s = D.byId(secId);
      return s ? D.specOf(s) || {} : {};
    } catch (e) {
      return {};
    }
  }
  function maxPxFor(secId) {
    var g = globalDefaults(), s = specOf(secId);
    var px = finite(s.bodyMaxHeight, 1, 2e3) || finite(g.bodyMaxHeight, 1, 2e3) || 0;
    if (!px) {
      var rows = finite(s.bodyMaxRows, 1, 200) || finite(g.bodyMaxRows, 1, 200) || 0;
      if (rows) px = rows * ROW_H + HEAD_H + FOOT_H;
    }
    return px;
  }
  function popupCfg() {
    try {
      var f = T._formSpec && T._formSpec() || {}, src = f.lookupSources || {}, out = {};
      Object.keys(src).forEach(function(k) {
        var o = src[k] || {};
        out[k] = {
          popupHeight: finite(o.popupHeight, 120, 1200),
          popupMaxHeight: finite(o.popupMaxHeight, 120, 1200),
          heightDoc: o.popupHeightDoc || "",
          maxHeightDoc: o.popupMaxHeightDoc || ""
        };
      });
      return out;
    } catch (e) {
      return {};
    }
  }
  var RN_COL = '<col class="dt-rn-col" style="width:' + ROWNO_W + 'px">';
  var RN_TH = '<th class="dt-rn-h" title="行号">' + gt("#") + "</th>";
  function rnTd(n, editable) {
    return '<td class="dt-rn' + (editable ? " has-del" : "") + '" data-rn="' + gt(String(n)) + '" title="第 ' + gt(String(n)) + ' 行"><span class="dt-rn-n">' + gt(String(n)) + "</span>" + (editable ? '<button type="button" class="dt-rn-del" data-act="del" title="删除此行">' + gt("×") + "</button>" : "") + "</td>";
  }
  function decorateDOM(w) {
    if (!w || w.getAttribute && w.getAttribute("data-b7") === "1") return;
    var tbl = w.querySelector && w.querySelector("table.dt-tbl");
    if (!tbl) return;
    var cg = tbl.querySelector("colgroup"), headTr = tbl.querySelector("thead tr"), tbody = tbl.querySelector("tbody"), footTr = tbl.querySelector("tfoot tr");
    if (!cg || !headTr || !tbody) return;
    var lastTh = headTr.lastElementChild;
    var hasOpTh = !!(lastTh && /^\s*操作\s*$/.test(lastTh.textContent || ""));
    var editable = hasOpTh || !!tbl.querySelector("input.dt-ipt");
    var trs = [].slice.call(tbody.rows);
    var removeOp = !!(hasOpTh && trs.length && trs.every(function(tr) {
      var td = tr.lastElementChild;
      return !!(td && td.classList.contains("c") && td.querySelectorAll("button").length === 1 && td.querySelector('[data-act="del"]'));
    }));
    var secId = w.getAttribute("data-sec") || "";
    var maxPx = maxPxFor(secId);
    put(cg, "afterbegin", RN_COL);
    put(headTr, "afterbegin", RN_TH);
    trs.forEach(function(tr, i) {
      put(tr, "afterbegin", rnTd(i + 1, editable));
      if (removeOp) {
        var last = tr.lastElementChild;
        if (last && last.querySelector('[data-act="del"]')) last.remove();
      }
    });
    if (removeOp) {
      if (lastTh) lastTh.remove();
      if (cg.lastElementChild) cg.lastElementChild.remove();
    } else if (footTr) {
      var cell = footTr.querySelector("[colspan]");
      if (cell) cell.setAttribute("colspan", +cell.getAttribute("colspan") + 1);
    }
    var st = tbl.getAttribute("style") || "", m = /min-width:\s*(\d+)px/i.exec(st);
    if (m) tbl.setAttribute("style", st.replace(/min-width:\s*\d+px/i, "min-width:" + (+m[1] + ROWNO_W) + "px"));
    if (maxPx > 0) {
      w.setAttribute("data-b7-max", "1");
      w.style.setProperty("--dt-max", maxPx + "px");
    }
    w.setAttribute("data-b7", "1");
    ST.writes++;
    ST.rendered[secId] = {
      secId,
      rows: trs.length,
      rowNo: true,
      rowNoWidth: ROWNO_W,
      editable,
      maxHeight: maxPx,
      opColumnRemoved: removeOp,
      at: Date.now()
    };
  }
  var LOCK = false;
  function sweep() {
    if (LOCK) return;
    var host = document.getElementById("dwBody") || document.body;
    var all = host.querySelectorAll ? host.querySelectorAll(".dt-wrap") : [];
    var hits = [], seen = {};
    [].slice.call(all).forEach(function(w) {
      if (w.getAttribute("data-b7") === "1") return;
      var id = w.id || "x" + Math.random();
      if (seen[id]) return;
      seen[id] = 1;
      hits.push(w);
    });
    ST.sweeps++;
    if (!hits.length) return;
    ST.hits += hits.length;
    ST.lastTargets = hits.map(function(w) {
      return String(w.getAttribute("data-sec") || w.id || "");
    }).slice(0, 8);
    LOCK = true;
    try {
      hits.forEach(decorateDOM);
    } catch (e) {
    } finally {
      LOCK = false;
    }
  }
  var mo = new MutationObserver(function() {
    sweep();
  });
  mo.observe(document.getElementById("dwBody") || document.body, { childList: true, subtree: true });
  sweep();
  var rawDel = D.delRow;
  D.delRow = function(secId, rk) {
    var ret = rawDel.call(D, secId, rk);
    ST.delLog.push({ secId: String(secId), rowKey: String(rk), at: Date.now() });
    if (ST.delLog.length > 60) ST.delLog.shift();
    return ret;
  };
  function clone(o) {
    try {
      return JSON.parse(JSON.stringify(o));
    } catch (e) {
      return {};
    }
  }
  window.__WL_DT_UI__ = function() {
    var g = globalDefaults();
    var pc = popupCfg(), pk = Object.keys(pc)[0] || "", pv = pc[pk] || {};
    var pMode = pv.popupHeight ? "fixed" : pv.popupMaxHeight ? "max" : "auto";
    var bySec = {};
    try {
      (D.sections() || []).forEach(function(s) {
        bySec[s.id] = {
          bodyMaxHeight: (s.spec || {}).bodyMaxHeight || 0,
          bodyMaxRows: (s.spec || {}).bodyMaxRows || 0,
          effectivePx: maxPxFor(s.id)
        };
      });
    } catch (e) {
    }
    return {
      version: "1.42",
      rowNo: {
        width: ROWNO_W,
        inSpecColumns: false,
        hasDataCol: false,
        hasDataK: false,
        readOnlyShowsNumberOnly: true
      },
      maxHeight: {
        rowH: ROW_H,
        headH: HEAD_H,
        footH: FOOT_H,
        global: { bodyMaxHeight: g.bodyMaxHeight || 0, bodyMaxRows: g.bodyMaxRows || 0 },
        bySection: bySec,
        mode: "纯 CSS / 表头吸顶 + 合计栏吸底 / 无 scrollIntoView"
      },
      numberSpinner: { cssOnly: true, typePreserved: true },
      popupHeight: {
        mode: pMode,
        activePx: pv.popupHeight || pv.popupMaxHeight || 0,
        sources: pc,
        semantics: "popupHeight=固定高度(优先) / popupMaxHeight=最大高度 / 缺失或不合法=自适应",
        runtime: window.__WL_LOOKUP_GRID__ ? window.__WL_LOOKUP_GRID__().heightMode : null
      },
      rendered: clone(ST.rendered),
      delLog: clone(ST.delLog),
      guard: { writes: ST.writes, blocks: ST.blocks, reasons: ST.lastReasons.slice() },
      observer: {
        installed: true,
        target: "#dwBody",
        mode: "childList+subtree / 全量扫描 / 就地装饰 / 不替换 wrap",
        sweeps: ST.sweeps,
        hits: ST.hits,
        lastTargets: ST.lastTargets.slice()
      },
      opColumn: { removedWhenDelOnly: true, reason: "行号格已承接删除，避免两个删除入口；操作列其他按钮保留" }
    };
  };
  T._dtUi = window.__WL_DT_UI__;
})();
(function() {
  var T = window.TPL, D = window.DETAIL;
  if (!T || !D) return;
  if (window.__WL_BATCH_INSTALLED__) return;
  window.__WL_BATCH_INSTALLED__ = 1;
  var CSS = [
    "#dtLookup.lg-batch .ba-mode{display:inline-block;margin-left:8px;padding:1px 7px;",
    "  border-radius:9px;background:#e6efff;color:#0052d9;font-size:10px;font-weight:600;font-style:normal}",
    "#dtLookup.lg-batch .lg-tbl td.ba-cell{padding:0 5px}",
    "#dtLookup.lg-batch .ba-ipt{width:100%;height:23px;padding:0 5px;border:1px solid #dadee3;",
    "  border-radius:3px;background:#fff;color:#2e405e;font:inherit;font-size:11.5px;",
    "  text-align:right;outline:none;-moz-appearance:textfield;appearance:textfield}",
    "#dtLookup.lg-batch .ba-ipt::-webkit-inner-spin-button,",
    "#dtLookup.lg-batch .ba-ipt::-webkit-outer-spin-button{-webkit-appearance:none;appearance:none;margin:0}",
    "#dtLookup.lg-batch .ba-ipt:focus{border-color:#0052d9;box-shadow:0 0 0 2px rgba(0,82,217,.10)}",
    "#dtLookup.lg-batch .ba-ipt.ba-warn{border-color:#e66544;background:#fff6f2;color:#c2462a}",
    "#dtLookup.lg-batch .lg-tbl tbody tr.on .ba-ipt{background:#f2f7ff}",
    "#dtLookup.lg-batch .lg-tbl tbody tr:hover .ba-ipt{background:#fbfcff}"
  ].join("\n");
  if (!document.getElementById("tpl-b8-batch")) {
    document.head.insertAdjacentHTML("beforeend", '<style id="tpl-b8-batch">' + CSS + "</style>");
  }
  function sources() {
    try {
      var f = T._formSpec && T._formSpec() || {};
      return f.lookupSources || {};
    } catch (e) {
      return {};
    }
  }
  function text(v) {
    return String(v == null ? "" : v);
  }
  function specOf(source) {
    var src = sources()[source];
    if (!src || typeof src !== "object") return null;
    var mode = text(src.mode);
    if (mode !== "sale" && mode !== "return") return null;
    var qtyField = text(src.qtyField), batchField = text(src.batchField), expiryField = text(src.expiryField);
    if (!qtyField || !batchField || !expiryField) return null;
    var feat = src.features && src.features[mode] || {};
    var cols = [];
    (Array.isArray(src.columns) ? src.columns : []).forEach(function(c) {
      c = c || {};
      if (c.hidden === true || c.hidden === "true") return;
      var role = text(c.role);
      if (role === "price" && feat.showPrice === false) return;
      if (role === "price" && src.showPriceColumn !== true) return;
      var t = text(c.t == null ? c.label == null ? c.k : c.label : c.t);
      if (role === "available" && feat.availableLabel) t = text(feat.availableLabel);
      if (role === "alloc" && feat.allocLabel) t = text(feat.allocLabel);
      if (role === "price" && feat.priceLabel) t = text(feat.priceLabel);
      cols.push({ k: text(c.k), t, w: Math.max(36, Math.min(600, +c.w || 90)), role });
    });
    if (!cols.length) return null;
    return {
      source,
      mode,
      label: text(src.label == null ? source : src.label),
      qtyField,
      priceField: text(src.priceField),
      batchField,
      expiryField,
      demandField: text(src.demandField),
      priceFloorField: text(src.priceFloorField),
      priceFloor: +src.priceFloor || 0,
      writeMap: src.writeMap && typeof src.writeMap === "object" ? src.writeMap : {},
      inventoryIdField: text(src.inventoryIdField),
      inPriceField: text(src.inPriceField),
      priceBar: src.priceBar && typeof src.priceBar === "object" ? src.priceBar : null,
      feat: {
        autoAllocate: feat.autoAllocate !== false,
        showPrice: feat.showPrice !== false,
        priceEditable: feat.priceEditable !== false
      },
      size: Math.max(1, Math.min(200, +src.pageSize || 10)),
      rows: Array.isArray(src.rows) ? src.rows : [],
      cols
    };
  }
  function active() {
    var st = null;
    try {
      st = D.lookupState;
    } catch (e) {
    }
    return !!(st && specOf(st.source));
  }
  function DEC() {
    return window.__WL_B9_DECORATE__ || null;
  }
  var B = {
    st: null,
    spec: null,
    source: "",
    mode: "",
    rows: [],
    alloc: [],
    prices: [],
    origPrices: [],
    auto: [],
    demand: 0,
    rebateRate: 0,
    warn: [],
    blocks: 0,
    writes: 0,
    lastSplit: 0,
    lastResult: null,
    last: null
  };
  function snapshot() {
    var sp = B.spec;
    return {
      mode: B.mode,
      source: B.source,
      demand: B.demand,
      remain: B.remain || 0,
      auto: B.auto.slice(),
      alloc: B.alloc.slice(),
      prices: B.prices.slice(),
      origPrices: B.origPrices.slice(),
      rebateRate: B.rebateRate,
      rows: clone(B.rows),
      config: sp ? {
        qtyField: sp.qtyField,
        priceField: sp.priceField,
        batchField: sp.batchField,
        expiryField: sp.expiryField,
        demandField: sp.demandField,
        writeMap: clone(sp.writeMap),
        features: clone(sp.feat),
        pageSize: sp.size,
        columns: sp.cols.map(function(c) {
          return { k: c.k, t: c.t, w: c.w, role: c.role };
        })
      } : null
    };
  }
  function clone(o) {
    try {
      return JSON.parse(JSON.stringify(o));
    } catch (e) {
      return {};
    }
  }
  function sum(a) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += +a[i] || 0;
    return Math.round(s * 1e6) / 1e6;
  }
  function availOf(i) {
    var o = B.rows[i] || {}, sp = B.spec;
    return Math.max(0, +o[sp.qtyField] || 0);
  }
  function floorOf(i, p) {
    var sp = B.spec, o = B.rows[i] || {}, f = 0, from = "";
    if (sp.priceFloorField && o[sp.priceFloorField] != null) {
      f = +o[sp.priceFloorField] || 0;
      from = "进价";
    } else if (sp.priceFloor > 0) {
      f = sp.priceFloor;
      from = "最低价";
    }
    var hit = f > 0 && p < f;
    return { value: f, hit, from, tip: hit ? "低于" + from + " " + f + "，请确认" : "单价" };
  }
  function ensureState(st, sp) {
    if (!st || !sp) return;
    if (B.st === st && B.source === sp.source) return;
    B.st = st;
    B.spec = sp;
    B.source = sp.source;
    B.mode = sp.mode;
    B.rows = sp.rows;
    B.alloc = [];
    B.prices = [];
    B.origPrices = [];
    B.auto = [];
    B.rebateRate = 0;
    B.warn = [];
    B.lastResult = null;
    B.lastSplit = 0;
    var rowObj = null;
    try {
      rowObj = D.row(st.secId, st.rk);
    } catch (e) {
    }
    var demand = 0;
    if (sp.mode === "sale" && sp.demandField && rowObj) demand = Math.max(0, +rowObj[sp.demandField] || 0);
    B.demand = demand;
    var remain = demand, dec = DEC();
    for (var i = 0; i < sp.rows.length; i++) {
      var o = sp.rows[i] || {}, avail = Math.max(0, +o[sp.qtyField] || 0), take = 0;
      var sk = !!(dec && dec.rowFlags && dec.rowFlags({ st, spec: sp, rows: sp.rows }, i, o).skip);
      if (!sk && sp.mode === "sale" && sp.feat.autoAllocate) {
        take = Math.min(avail, remain);
        remain -= take;
      }
      B.alloc.push(take);
      B.auto.push(take);
      B.prices.push(sp.priceField ? +o[sp.priceField] || 0 : 0);
    }
    B.remain = Math.max(0, Math.round(remain * 1e6) / 1e6);
    B.origPrices = B.prices.slice();
    B.last = snapshot();
  }
  function rows() {
    var st = null;
    try {
      st = D.lookupState;
    } catch (e) {
    }
    var sp = st ? specOf(st.source) : null;
    if (!sp) return [];
    ensureState(st, sp);
    return sp.rows.slice();
  }
  function render(c) {
    var st = c.st, sp = specOf(st.source);
    if (!sp) return { cap: "", grid: "", ft: "", totalW: 0 };
    ensureState(st, sp);
    var dec = DEC(), dctx = {
      st,
      spec: sp,
      rows: sp.rows,
      alloc: B.alloc,
      tx: c.tx,
      at: c.at,
      box: c.box,
      page: c.page,
      pages: c.pages
    };
    var cols = sp.cols.concat(dec && dec.cols ? dec.cols(dctx) || [] : []);
    var start = c.start, slice = c.slice, activeIdx = c.active;
    var box = c.box;
    if (box && box.classList) box.classList.add("lg-batch");
    var totalW = cols.reduce(function(a, x) {
      return a + x.w;
    }, 0);
    var colHtml = cols.map(function(x) {
      return '<col style="width:' + x.w + 'px">';
    }).join("");
    var th = cols.map(function(x) {
      return '<th style="width:' + x.w + 'px">' + c.tx(x.t) + "</th>";
    }).join("");
    var body = slice.length ? slice.map(function(o, i) {
      var gi = start + i, html = "";
      var fl = dec && dec.rowFlags ? dec.rowFlags(dctx, gi, o) || {} : {};
      var cls = ' class="' + (gi === activeIdx ? "on " : "") + (fl.cls || "") + '"';
      for (var j = 0; j < cols.length; j++) {
        var col = cols[j], v, s2;
        if (col.role === "alloc") {
          v = B.alloc[gi] || 0;
          html += '<td class="ba-cell"><input type="number" class="ba-ipt' + (fl.cls ? " " + fl.cls + "-ipt" : "") + '" data-ba="alloc" data-i="' + gi + '"' + (fl.expired ? " disabled" : "") + ' min="0" max="' + c.at(text(availOf(gi))) + '" step="any" value="' + c.at(text(fl.expired ? 0 : v)) + '" title="' + c.at(fl.title || "本次" + (sp.mode === "sale" ? "分配" : "退货") + "数量，不超过 " + availOf(gi)) + '"></td>';
        } else if (col.role === "price") {
          v = B.prices[gi] || 0;
          var fw = floorOf(gi, v);
          if (sp.feat.priceEditable) {
            html += '<td class="ba-cell"><input type="number" class="ba-ipt' + (fw.hit ? " ba-warn" : "") + '" data-ba="price" data-i="' + gi + '" min="0" step="any" value="' + c.at(text(v)) + '" title="' + c.at(fw.tip) + '"></td>';
          } else {
            html += '<td title="' + c.at(text(v)) + '">' + c.tx(text(v)) + "</td>";
          }
        } else {
          v = col.role === "available" ? o[sp.qtyField] : o[col.k];
          s2 = text(v);
          html += '<td title="' + c.at(s2) + '">' + c.tx(s2) + "</td>";
        }
      }
      return '<tr data-lk="row" data-i="' + gi + '"' + cls + ">" + html + "</tr>";
    }).join("") : '<tr class="lg-none"><td colspan="' + cols.length + '">暂无批次</td></tr>';
    var modeTip = sp.mode === "sale" ? "近效期优先自动分配 · 可改分配量 / 单价 · 数量为 0 的批次不回填" : "手动填写退货数量（不超过可退数量）· 不显示单价";
    var cap = '<div class="lg-hd"><div class="lg-cap"><span>批号选录 · <b>' + c.tx(sp.label) + '</b><em class="ba-mode" data-mode="' + c.at(sp.mode) + '">' + c.tx(sp.mode === "sale" ? "销售出库 · 自动分配" : "销退入库 · 手动选择") + '</em></span><span class="lg-meta">共 ' + sp.rows.length + " 批 · 需求 " + c.tx(text(B.demand)) + " · 已分配 " + c.tx(text(sum(B.alloc))) + "</span></div></div>";
    var grid = '<div class="lg-scroll"><table class="lg-tbl" style="width:' + totalW + 'px"><colgroup>' + colHtml + "</colgroup><thead><tr>" + th + "</tr></thead><tbody>" + body + "</tbody></table></div>";
    var ft = '<div class="lg-ft"><div class="lg-pager"><button type="button" data-lk="prev"' + (c.page <= 0 ? " disabled" : "") + '>上一页</button><span class="lg-page">第 <b>' + (c.page + 1) + "</b> / " + c.pages + ' 页</span><button type="button" data-lk="next"' + (c.page >= c.pages - 1 ? " disabled" : "") + '>下一页</button></div><span class="lg-tip">' + c.tx(modeTip) + '</span><div class="lg-acts"><button type="button" class="lg-ok" data-lk="ok">确定</button><button type="button" data-lk="close">取消</button></div></div>';
    B.writes++;
    var out = { cap, grid, ft, totalW };
    if (dec && dec.sections) {
      var s = dec.sections(dctx, out) || {};
      if (s.cap != null) out.cap = s.cap;
      if (s.grid != null) out.grid = s.grid;
      if (s.ft != null) out.ft = s.ft;
      if (+s.totalW > 0) out.totalW = +s.totalW;
    }
    return out;
  }
  function syncInput(el) {
    if (!el || !el.getAttribute) return;
    var a = el.getAttribute("data-ba"), i = +el.getAttribute("data-i");
    if (!a || isNaN(i) || !B.spec) return;
    if (a === "alloc") {
      var max = availOf(i), v = +el.value || 0;
      if (v < 0) v = 0;
      if (v > max) v = max;
      if (parseFloat(el.value) !== v) el.value = text(v);
      B.alloc[i] = v;
    } else if (a === "price") {
      var p = +el.value || 0;
      if (p < 0) p = 0;
      B.prices[i] = p;
      var fw = floorOf(i, p);
      if (el.classList) el.classList.toggle("ba-warn", fw.hit);
      if (el.setAttribute) el.setAttribute("title", fw.tip);
      if (fw.hit) {
        B.warn.push({ i, value: p, floor: fw.value, from: fw.from, at: Date.now() });
        if (B.warn.length > 40) B.warn.shift();
      }
    }
    var meta = document.querySelector("#dtLookup .lg-meta");
    if (meta) meta.textContent = "共 " + B.rows.length + " 批 · 需求 " + B.demand + " · 已分配 " + sum(B.alloc);
    if (B.last) {
      if (a === "alloc") B.last.alloc[i] = B.alloc[i];
      else if (a === "price") B.last.prices[i] = B.prices[i];
    }
  }
  document.addEventListener("input", function(e) {
    if (!active()) return;
    if (e && e.target) syncInput(e.target);
  }, false);
  function newRowKey(j) {
    return "R" + Date.now().toString(36) + "_" + j + "_" + Math.floor(Math.random() * 9e3 + 1e3);
  }
  function applyToRow(rowObj, pick, sp) {
    var wm = sp.writeMap, o = pick.o || {};
    if (wm.batch && sp.batchField) rowObj[wm.batch] = o[sp.batchField];
    if (wm.expiry && sp.expiryField) rowObj[wm.expiry] = o[sp.expiryField];
    if (wm.qty) rowObj[wm.qty] = pick.alloc;
    if (wm.price && sp.priceField && sp.feat.showPrice !== false) rowObj[wm.price] = pick.price;
    if (wm.inventoryId && sp.inventoryIdField) rowObj[wm.inventoryId] = o[sp.inventoryIdField];
    if (wm.inPrice && sp.inPriceField) rowObj[wm.inPrice] = o[sp.inPriceField];
    if (wm.rebateRate) rowObj[wm.rebateRate] = pick.rebateRate;
  }
  function batchConfirm() {
    var st = null;
    try {
      st = D.lookupState;
    } catch (e) {
    }
    if (!st) return;
    var sp = specOf(st.source);
    if (!sp) {
      try {
        D.lookupClose();
      } catch (e) {
      }
      return;
    }
    ensureState(st, sp);
    var picks = [], i;
    for (i = 0; i < B.rows.length; i++) {
      var q = +B.alloc[i] || 0, o = B.rows[i] || {};
      if (q > 0) picks.push({
        o,
        alloc: q,
        price: +B.prices[i] || 0,
        i,
        inventoryId: sp.inventoryIdField ? o[sp.inventoryIdField] : "",
        inPrice: sp.inPriceField ? o[sp.inPriceField] : "",
        rebateRate: B.rebateRate
      });
    }
    B.lastSplit = picks.length;
    B.last = snapshot();
    if (!picks.length) {
      B.lastResult = { op: "cancel", reason: "all-zero", rows: 0, at: Date.now() };
      D.lookupClose();
      window.__WL_DT_LOOKUP__ = { open: false, batch: true, mode: sp.mode, split: 0, cancelled: true };
      return;
    }
    var dec = DEC();
    if (dec && dec.validate) {
      var v = dec.validate({ st, spec: sp, rows: B.rows, alloc: B.alloc, picks }, picks) || {};
      if (v.ok === false) {
        B.lastResult = {
          op: "blocked",
          reason: v.reason || "controlled",
          rows: picks.length,
          blocked: clone(v.blocked || []),
          at: Date.now()
        };
        try {
          if (T._toast) T._toast("批号选录未通过 · " + (v.reason || "请修正后重试"));
        } catch (e) {
        }
        return;
      }
    }
    var sec = D.byId(st.secId);
    if (!sec) {
      D.lookupClose();
      return;
    }
    var spSec = D.specOf(sec), F = D.flowSpec(sec), list = D.rows(sec);
    var idx = -1;
    for (i = 0; i < list.length; i++) {
      if (String(list[i][spSec.rowKey]) === String(st.rk)) {
        idx = i;
        break;
      }
    }
    if (idx < 0) {
      D.lookupClose();
      return;
    }
    var base = clone(list[idx]);
    applyToRow(list[idx], picks[0], sp);
    var created = [];
    for (i = 1; i < picks.length; i++) {
      var nr = clone(base);
      nr[spSec.rowKey] = newRowKey(i);
      applyToRow(nr, picks[i], sp);
      list.splice(idx + i, 0, nr);
      created.push(String(nr[spSec.rowKey]));
    }
    D.recalc(sec);
    D.refresh(st.secId);
    var secId = st.secId, rk0 = String(st.rk);
    D.lookupClose(true);
    var lastRk = created.length ? created[created.length - 1] : rk0;
    var triggerCol = st.col && st.col.k || "";
    if (D.flowFrom && triggerCol) D.flowFrom(secId, lastRk, triggerCol, F, true);
    var flow = window.__WL_DT_FLOW__ || {};
    var focusRk = flow.rowKey || lastRk, focusCol = flow.to || "", ok = !!focusCol;
    B.lastResult = {
      op: picks.length > 1 ? "split" : "single",
      mode: sp.mode,
      rows: picks.length,
      demand: B.demand,
      rowKeys: [rk0].concat(created),
      focus: { secId, rowKey: focusRk, col: focusCol, ok },
      appendRow: null,
      picks: picks.map(function(p) {
        return {
          i: p.i,
          alloc: p.alloc,
          price: p.price,
          inventoryId: p.inventoryId,
          inPrice: p.inPrice,
          rebateRate: p.rebateRate
        };
      }),
      at: Date.now()
    };
    window.__WL_DT_LOOKUP__ = {
      open: false,
      batch: true,
      mode: sp.mode,
      split: picks.length,
      rowKeys: [rk0].concat(created),
      mapped: clone(sp.writeMap),
      focusTo: focusCol,
      rowKey: focusRk,
      appendRow: null
    };
  }
  var rawKey = D.lookupKey;
  D.lookupKey = function(e) {
    if (active() && e && e.key === "Enter" && !e.target) {
      batchConfirm();
      return;
    }
    return rawKey.call(D, e);
  };
  var rawClose = D.lookupClose;
  D.lookupClose = function() {
    var ret = rawClose.call(D);
    var box = document.getElementById("dtLookup");
    if (box && box.classList) box.classList.remove("lg-batch");
    B.st = null;
    B.spec = null;
    B.rows = [];
    B.alloc = [];
    B.prices = [];
    B.auto = [];
    return ret;
  };
  function focusables(box) {
    var list = [], groups = [
      "input[data-ba]:not([disabled]):not([readonly])",
      "input[data-pb]:not([disabled]):not([readonly])",
      'button:not([disabled]):not([data-lk="close"])'
    ];
    for (var g = 0; g < groups.length; g++) {
      var a = box.querySelectorAll(groups[g]);
      for (var i = 0; i < a.length; i++) if (list.indexOf(a[i]) < 0) list.push(a[i]);
    }
    return list;
  }
  function moveFocus(el) {
    if (!el) return false;
    try {
      el.focus({ preventScroll: true });
    } catch (err) {
      try {
        el.focus();
      } catch (e2) {
      }
    }
    if (el.tagName === "INPUT" && typeof el.select === "function") {
      try {
        el.select();
      } catch (err) {
      }
    }
    return true;
  }
  function focusNext() {
    var box = document.getElementById("dtLookup");
    if (!box) return false;
    var list = focusables(box);
    if (!list.length) return false;
    var i = list.indexOf(document.activeElement);
    if (i < 0) return moveFocus(list[0]);
    if (i >= list.length - 1) return false;
    return moveFocus(list[i + 1]);
  }
  window.addEventListener("keydown", function(e) {
    if (!active()) return;
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on")) return;
    var st = null;
    try {
      st = D.lookupState;
    } catch (err) {
    }
    if (!st) return;
    var inInput = !!(e.target && e.target.closest && e.target.closest("#dtLookup [data-ba]"));
    var inPb = !!(e.target && e.target.closest && e.target.closest("#dtLookup [data-pb]"));
    var k = e.key;
    if (k === "Enter") {
      var onOk = !!(e.target && e.target.closest && e.target.closest('#dtLookup [data-lk="ok"]'));
      if (onOk) {
        e.preventDefault();
        e.stopImmediatePropagation();
        batchConfirm();
        return;
      }
      e.stopImmediatePropagation();
      var moved = focusNext();
      if (moved) e.preventDefault();
      return;
    }
    if (k === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      D.lookupClose();
      return;
    }
    if (k === "F2" || e.keyCode === 113) return;
    if ((inInput || inPb) && (k === "ArrowUp" || k === "ArrowDown")) {
      e.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener("mousedown", function(e) {
    if (!active()) return;
    var box = document.getElementById("dtLookup");
    if (!box || !box.contains(e.target)) return;
    var f = e.target && e.target.closest ? e.target.closest("#dtLookup [data-ba],#dtLookup [data-pb],#dtLookup button") : null;
    if (f) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  function repaintPriceCells() {
    var sp = B.spec;
    if (!sp || sp.feat.showPrice === false) return 0;
    var box = document.getElementById("dtLookup");
    if (!box) return 0;
    var trs = box.querySelectorAll('tbody tr[data-lk="row"]'), n = 0;
    for (var i = 0; i < trs.length; i++) {
      var gi = +trs[i].getAttribute("data-i");
      var el = trs[i].querySelector('[data-ba="price"]');
      if (!el || isNaN(gi)) continue;
      var v = +B.prices[gi] || 0;
      if (String(el.value) !== String(v)) el.value = v;
      n++;
    }
    return n;
  }
  function setGlobalPrice(supply, rebate) {
    var s = Math.round((+supply || 0) * 100) / 100, r = Math.round((+rebate || 0) * 1e3) / 1e3;
    B.rebateRate = r;
    if (s > 0) {
      for (var i = 0; i < B.prices.length; i++) B.prices[i] = s;
    } else {
      B.prices = B.origPrices.slice();
    }
    if (B.last) {
      B.last.prices = B.prices.slice();
      B.last.rebateRate = r;
    }
    var painted = repaintPriceCells();
    return { supply: s, rebateRate: r, prices: B.prices.slice(), painted };
  }
  window.__WL_BATCH_CTX__ = function() {
    var live = !!B.st, L = B.last || {};
    return {
      active: active(),
      demand: live ? B.demand : L.demand || 0,
      remain: live ? B.remain || 0 : L.remain || 0,
      alloc: live ? B.alloc.slice() : (L.alloc || []).slice(),
      prices: live ? B.prices.slice() : (L.prices || []).slice(),
      origPrices: live ? B.origPrices.slice() : (L.origPrices || []).slice(),
      rebateRate: live ? B.rebateRate : L.rebateRate || 0,
      rows: live ? clone(B.rows) : clone(L.rows || []),
      setGlobalPrice
    };
  };
  T._batchCtx = window.__WL_BATCH_CTX__;
  window.__WL_BATCH_CTX__.repaintPriceCells = repaintPriceCells;
  window.__WL_BATCH_EXT__ = { active, rows, render };
  window.__WL_BATCH_ALLOCATION__ = function() {
    var st = null;
    try {
      st = D.lookupState;
    } catch (e) {
    }
    var grid = null;
    try {
      grid = T._lookupGrid && T._lookupGrid() || null;
    } catch (e) {
    }
    var live = !!B.st, L = B.last || {}, sp = B.spec;
    var mode = live ? B.mode : L.mode || "", source = live ? B.source : L.source || (st ? st.source : "");
    var demand = live ? B.demand : L.demand || 0, remain = live ? B.remain || 0 : L.remain || 0;
    var auto = live ? B.auto.slice() : (L.auto || []).slice();
    var alloc = live ? B.alloc.slice() : (L.alloc || []).slice();
    var prices = live ? B.prices.slice() : (L.prices || []).slice();
    var origPrices = live ? B.origPrices.slice() : (L.origPrices || []).slice();
    var rebateRate = live ? B.rebateRate : L.rebateRate || 0;
    var cfg = live ? sp ? {
      qtyField: sp.qtyField,
      priceField: sp.priceField,
      batchField: sp.batchField,
      expiryField: sp.expiryField,
      demandField: sp.demandField,
      writeMap: clone(sp.writeMap),
      features: clone(sp.feat),
      pageSize: sp.size,
      columns: sp.cols.map(function(c) {
        return { k: c.k, t: c.t, w: c.w, role: c.role };
      })
    } : null : L.config ? clone(L.config) : null;
    var dec = DEC(), legacy = null;
    if (dec && dec.debug) {
      try {
        legacy = dec.debug({ live, st, spec: sp, rows: B.rows, alloc, last: L });
      } catch (e) {
        legacy = { error: String(e) };
      }
    }
    return {
      version: "1.46",
      active: active(),
      mode,
      source,
      demand,
      remain,
      autoAllocated: auto,
      alloc,
      prices,
      origPrices,
      rebateRate,
      globalSupply: (function() {
        var c = window.__WL_BATCH_CTX__ && window.__WL_BATCH_CTX__() || {};
        return { rebateRate: c.rebateRate || 0, prices: (c.prices || []).slice(), origPrices: (c.origPrices || []).slice() };
      })(),
      allocatedTotal: sum(alloc),
      validRows: alloc.filter(function(v) {
        return (+v || 0) > 0;
      }).length,
      candidates: live ? B.rows.length : (L.alloc || []).length,
      splitCount: B.lastSplit,
      lastResult: clone(B.lastResult),
      lowPriceWarnings: B.warn.slice(),
      config: cfg,
      legacy,
      guard: {
        writes: B.writes,
        blocks: B.blocks,
        gridBlocks: grid ? grid.guardBlocks : 0,
        gridHardenReasons: grid ? grid.guardReasons : []
      },
      focus: B.lastResult ? clone(B.lastResult.focus) : null
    };
  };
  T._batchAllocation = window.__WL_BATCH_ALLOCATION__;
})();
(function() {
  var T = window.TPL, D = window.DETAIL, GU = window.GUARD;
  if (!T || !D) return;
  if (window.__WL_B9_INSTALLED__) return;
  window.__WL_B9_INSTALLED__ = 1;
  var CSS = [
    "#dtLookup.lg-batch .lg-item{flex:0 0 auto;padding:4px 10px;text-align:left;",
    "  border-bottom:1px solid #e4e8ee;background:#fff;font-size:10.5px;color:#6e7b8c;",
    "  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:18px}",
    "#dtLookup.lg-batch .lg-item b{font-weight:600;color:#2e405e}",
    "#dtLookup.lg-batch .lg-item .lg-item-title{font-size:11px;margin-right:8px}",
    "#dtLookup.lg-batch .lg-item-title,#dtLookup.lg-batch .lg-item-meta{display:inline;margin:0}",
    "#dtLookup.lg-batch .lg-pane{flex:0 0 auto;padding:5px 10px 6px;background:#fff;",
    "  border-top:1px solid #e4e8ee}",
    "#dtLookup.lg-batch .lg-sec-title{font-size:10.5px;color:#6e7b8c;margin:0 0 3px}",
    "#dtLookup.lg-batch .lg-sub{border-collapse:collapse;table-layout:fixed;",
    "  font-family:inherit;font-size:11px;color:#2e405e;width:100%}",
    "#dtLookup.lg-batch .lg-sub th,#dtLookup.lg-batch .lg-sub td{height:22px;padding:0 6px;",
    "  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}",
    "#dtLookup.lg-batch .lg-sub th{background:#EFF7FF;color:#2e405e;font-weight:600;font-size:10.5px}",
    "#dtLookup.lg-batch .lg-sub td{background:#fff;text-align:right}",
    "#dtLookup.lg-batch .lg-tbl tbody tr.ba-expired td{background:#f5f5f5;color:#9aa3af}",
    "#dtLookup.lg-batch .lg-tbl tbody tr.ba-expired .ba-ipt{background:#f0f0f0;color:#9aa3af;cursor:not-allowed}",
    "#dtLookup.lg-batch .ba-ipt.ba-over{border-color:#e66544;background:#fff6f2;color:#c2462a}",
    "#dtLookup.lg-batch .lg-tbl tbody tr.on.ba-expired td{background:#eef1f5;color:#7c8794}",
    "#dtLookup.lg-batch .lg-pb-ipt{width:100%;height:21px;padding:0 4px;",
    "  border:1px solid transparent;border-radius:2px;background:#fff;color:#2e405e;",
    "  font:inherit;font-size:11px;text-align:right;outline:none;-moz-appearance:textfield;",
    "  appearance:textfield;-webkit-appearance:none}",
    "#dtLookup.lg-batch .lg-pb-ipt::-webkit-inner-spin-button,",
    "#dtLookup.lg-batch .lg-pb-ipt::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}",
    "#dtLookup.lg-batch .lg-pb-ipt:hover{border-color:#dadee3}",
    "#dtLookup.lg-batch .lg-pb-ipt:focus{border-color:#0052d9;box-shadow:0 0 0 2px rgba(0,82,217,.10)}",
    "#dtLookup.lg-batch .lg-pricebar .lg-sub td{padding:0 2px}",
    "#dtLookup.lg-batch .lg-pricebar .lg-sub .pb-ro{text-align:right;padding:0 6px}",
    "#dtLookup.lg-batch .lg-returnstock .lg-sub th{border:1px solid #dfe4ea;background:#EFF7FF}",
    "#dtLookup.lg-batch .lg-returnstock .lg-sub td{border:0;background:#fff;text-align:center;",
    "  color:#2e405e;cursor:default}",
    "#dtLookup.lg-batch.lg-one-page .lg-pager{display:none}",
    "#dtLookup.lg-grid.lg-batch .lg-hd{background:#EFF7FF}",
    "#dtLookup.lg-grid.lg-batch .lg-tbl thead th{background:#EFF7FF}",
    "#dtLookup.lg-grid.lg-batch .lg-tbl thead th,",
    "#dtLookup.lg-batch .lg-pricebar .lg-sub th,",
    "#dtLookup.lg-batch .lg-returnstock .lg-sub th,",
    "#dtLookupPriceLayer .pl-tbl th{background:#EFF7FF}",
    "#dtLookup.lg-grid.lg-batch .lg-ft{justify-content:flex-start}",
    "#dtLookup.lg-grid.lg-batch .lg-pager{order:1;flex:0 0 auto}",
    "#dtLookup.lg-grid.lg-batch .lg-acts{order:2;margin-left:0;margin-right:auto;flex:0 0 auto}",
    "#dtLookup.lg-grid.lg-batch .lg-acts{gap:4px}",
    "#dtLookup.lg-grid.lg-batch .lg-acts button{min-width:52px;padding:0 9px}",
    "#dtLookup.lg-grid.lg-batch .lg-tip{order:3;flex:0 0 auto;margin-left:0;text-align:right}",
    "#dtLookup.lg-grid.lg-batch .lg-acts .lg-ok{border-color:#c9dcf5;background:#fff;",
    "  color:#0052d9;font-weight:400}",
    "#dtLookup.lg-grid.lg-batch .lg-acts .lg-ok:hover{background:#ecf4ff;",
    "  border-color:#0052d9;color:#0052d9}",
    "#dtLookupPriceLayer{position:fixed;z-index:99998;background:#fff;",
    "  border:1px solid #dadee3;border-radius:6px;",
    "  box-shadow:0 12px 34px rgba(46,64,94,.20);padding:8px 10px 10px;",
    "  font-family:inherit;color:#2e405e;font-size:11px}",
    "#dtLookupPriceLayer .pl-hd{display:flex;align-items:center;justify-content:space-between;",
    "  margin-bottom:6px;font-size:10.5px;color:#6e7b8c}",
    "#dtLookupPriceLayer .pl-hd b{color:#2e405e;font-weight:600;font-size:11.5px}",
    "#dtLookupPriceLayer .pl-close{height:20px;padding:0 8px;border:1px solid #dadee3;",
    "  border-radius:3px;background:#fff;color:#6e7b8c;font:inherit;font-size:10.5px;cursor:pointer}",
    "#dtLookupPriceLayer .pl-close:hover{border-color:#0052d9;color:#0052d9}",
    "#dtLookupPriceLayer .pl-scroll{max-height:220px;overflow:auto}",
    "#dtLookupPriceLayer .pl-tbl{border-collapse:collapse;table-layout:fixed;width:100%}",
    "#dtLookupPriceLayer .pl-tbl th,#dtLookupPriceLayer .pl-tbl td{height:22px;padding:0 6px;",
    "  border:1px solid #e4e8ee;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;",
    "  text-align:center;font-size:10.5px}",
    "#dtLookupPriceLayer .pl-tbl th{background:#EFF7FF;font-weight:600;position:sticky;top:0}",
    "#dtLookupPriceLayer .pl-tbl td{background:#fff;text-align:right}"
  ].join("\n");
  if (!document.getElementById("tpl-b9-legacy-ui")) {
    document.head.insertAdjacentHTML("beforeend", '<style id="tpl-b9-legacy-ui">' + CSS + "</style>");
  }
  function sources() {
    try {
      var f = T._formSpec && T._formSpec() || {};
      return f.lookupSources || {};
    } catch (e) {
      return {};
    }
  }
  function raw(source) {
    var o = sources()[source];
    return o && typeof o === "object" ? o : {};
  }
  function text(v) {
    return String(v == null ? "" : v);
  }
  function num(v) {
    var n = +v;
    return isFinite(n) ? n : 0;
  }
  function clone(o) {
    try {
      return JSON.parse(JSON.stringify(o));
    } catch (e) {
      return {};
    }
  }
  function sum(a) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += +a[i] || 0;
    return Math.round(s * 1e6) / 1e6;
  }
  var V = {
    violations: [],
    lastValidate: null,
    priceFloor: null,
    expiredRows: [],
    writes: 0,
    initialFocus: "none",
    focusSt: null,
    priceLayer: null,
    rafPending: false
  };
  function day(v) {
    var s = text(v).trim();
    if (!s) return 0;
    var m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    if (!m) return 0;
    return +m[1] * 1e4 + +m[2] * 100 + +m[3];
  }
  function todayInt(ctrl) {
    if (ctrl.today) return day(ctrl.today) || 0;
    var d = /* @__PURE__ */ new Date();
    return d.getFullYear() * 1e4 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function expiryKey(spec, cfg) {
    var ctrl = cfg.controls || {};
    return text(ctrl.expiryField || spec.expiryField || "");
  }
  function isExpired(o, spec, cfg) {
    var ctrl = cfg.controls || {};
    if (ctrl.expiredBatch === false) return false;
    var k = expiryKey(spec, cfg), d = day(o && o[k]), t = todayInt(ctrl);
    return !!(d && t && d <= t);
  }
  function expiredTitle() {
    return "已过有效期，不能出售";
  }
  function cols() {
    return [];
  }
  function rowFlags(ctx, i, o) {
    var cfg = raw(ctx.st.source);
    if (isExpired(o, ctx.spec, cfg)) {
      if (V.expiredRows.indexOf(i) < 0) V.expiredRows.push(i);
      return { skip: true, expired: true, cls: "ba-expired", title: expiredTitle() };
    }
    return {};
  }
  function rowOf(st) {
    var r = null, i, sec = null, sp = null, list = [], rk = "";
    try {
      r = D.row(st.secId, st.rk);
    } catch (e) {
    }
    if (r && Object.keys(r).length) return r;
    try {
      sec = D.byId(st.secId) || D.sections()[0];
    } catch (e) {
    }
    if (!sec) return {};
    try {
      sp = D.specOf(sec);
      rk = sp ? sp.rowKey : "";
      list = D.rows(sec) || [];
    } catch (e) {
      return {};
    }
    for (i = 0; i < list.length; i++) {
      if (String(list[i][rk]) === String(st.rk)) return list[i];
    }
    return list[0] || {};
  }
  function itemHtml(ctx, cfg, tx, at) {
    var ii = cfg.itemInfo;
    if (!ii || typeof ii !== "object") return "";
    var rowObj = rowOf(ctx.st), parts = [], i, x, v;
    var title = text(ii.title !== void 0 && ii.title !== "" ? ii.title : ii.titleField ? rowObj[ii.titleField] : "");
    if (title) parts.push('<b class="lg-item-title">' + tx(title) + "</b>");
    var f = Array.isArray(ii.fields) ? ii.fields : [];
    for (i = 0; i < f.length; i++) {
      x = f[i] || {};
      v = x.value !== void 0 && x.value !== "" ? x.value : x.k ? rowObj[x.k] : "";
      parts.push(tx(text(x.t || "")) + " ： <b>" + tx(text(v)) + "</b>");
    }
    if (!parts.length) return "";
    return '<div class="lg-item">' + parts.join(" &nbsp; ") + "</div>";
  }
  function priceBarHtml(cfg, tx, at) {
    var pb = cfg.priceBar;
    if (!pb || pb.globalPrice === false) return "";
    var cols2 = Array.isArray(pb.columns) ? pb.columns : [];
    if (!cols2.length) return "";
    var vals = pb.values && typeof pb.values === "object" ? pb.values : {};
    var hasVals = Object.keys(vals).some(function(k) {
      return text(vals[k]) !== "";
    });
    if (!hasVals) return "";
    var th = "", td = "", cg = "", i, c, w, s, role, ed;
    for (i = 0; i < cols2.length; i++) {
      c = cols2[i] || {};
      w = Math.max(40, Math.min(300, num(c.w) || 72));
      cg += '<col style="width:' + w + 'px">';
      th += '<th style="width:' + w + 'px">' + tx(text(c.t == null ? c.label == null ? c.k : c.label : c.t)) + "</th>";
      role = text(c.role);
      ed = !!c.editable;
      s = text(vals[c.k]);
      if (ed) {
        td += '<td><input type="number" class="lg-pb-ipt" data-pb="' + at(role) + '" data-k="' + at(text(c.k)) + '" step="any" min="0" value="' + at(s) + '" title="' + at(text(c.t || "")) + '"></td>';
      } else if (role === "wPrice") {
        td += '<td data-pb="wPrice" class="pb-ro">' + tx(s) + "</td>";
      } else {
        td += '<td class="pb-ro">' + tx(s) + "</td>";
      }
    }
    return '<div class="lg-pane lg-pricebar"><table class="lg-sub"><colgroup>' + cg + "</colgroup><thead><tr>" + th + "</tr></thead><tbody><tr>" + td + "</tr></tbody></table></div>";
  }
  function returnStockHtml(cfg, tx, at) {
    var rs = cfg.returnStock;
    if (!rs || typeof rs !== "object") return "";
    var cols2 = Array.isArray(rs.columns) ? rs.columns : [];
    var rows = Array.isArray(rs.rows) ? rs.rows : [];
    if (!cols2.length || !rows.length) return "";
    var cg = "", th = "", body = "", i, j, c, w, s;
    for (i = 0; i < cols2.length; i++) {
      c = cols2[i] || {};
      w = Math.max(40, Math.min(300, num(c.w) || 72));
      cg += '<col style="width:' + w + 'px">';
      th += '<th style="width:' + w + 'px">' + tx(text(c.t == null ? c.label == null ? c.k : c.label : c.t)) + "</th>";
    }
    for (i = 0; i < rows.length; i++) {
      body += "<tr>";
      for (j = 0; j < cols2.length; j++) {
        s = text(rows[i] && rows[i][cols2[j].k]);
        body += "<td>" + tx(s) + "</td>";
      }
      body += "</tr>";
    }
    return '<div class="lg-pane lg-returnstock"><div class="lg-sec-title">' + tx(text(rs.label || "")) + '：</div><table class="lg-sub"><colgroup>' + cg + "</colgroup><thead><tr>" + th + "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }
  function initialFocus(ctx) {
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on") || !box.classList.contains("lg-batch")) {
      V.initialFocus = "none";
      return;
    }
    var C = window.__WL_BATCH_CTX__ && window.__WL_BATCH_CTX__() || {};
    var spec = ctx.spec;
    raw(ctx.st.source);
    var demand = +C.demand || 0, alloc = C.alloc || [];
    var satisfied = spec.mode === "sale" && sum(alloc) >= demand;
    var supply = box.querySelector('[data-pb="supply"]');
    if (satisfied && supply) {
      try {
        supply.focus({ preventScroll: true });
      } catch (e) {
        try {
          supply.focus();
        } catch (e2) {
        }
      }
      V.initialFocus = "supply";
      return;
    }
    var list = [].slice.call(box.querySelectorAll('input[data-ba="alloc"]:not([disabled])'));
    if (list.length) {
      var last = list[list.length - 1];
      try {
        last.focus({ preventScroll: true });
      } catch (e) {
        try {
          last.focus();
        } catch (e2) {
        }
      }
      V.initialFocus = "last-alloc";
      return;
    }
    V.initialFocus = "none";
  }
  function sections(ctx, out) {
    var cfg = raw(ctx.st.source), tx = ctx.tx, at = ctx.at;
    if (tx == null || at == null) return out;
    var item = itemHtml(ctx, cfg, tx);
    var price = priceBarHtml(cfg, tx, at);
    var stock = returnStockHtml(cfg, tx);
    var box = ctx.box || document.getElementById("dtLookup");
    if (box && box.classList) {
      if (+ctx.pages <= 1) box.classList.add("lg-one-page");
      else box.classList.remove("lg-one-page");
    }
    V.writes++;
    if (V.focusSt !== ctx.st) {
      V.focusSt = ctx.st;
      V.initialFocus = "none";
      var c2 = ctx;
      setTimeout(function() {
        initialFocus(c2);
      }, 0);
    }
    return {
      cap: item ? item + out.cap : out.cap,
      grid: out.grid + price + stock,
      ft: out.ft,
      totalW: out.totalW
    };
  }
  function ctxApi() {
    return window.__WL_BATCH_CTX__ ? window.__WL_BATCH_CTX__() : null;
  }
  function wPriceOf(box) {
    var w = box && box.querySelector ? box.querySelector('[data-pb="wPrice"]') : null;
    return w ? num(w.textContent) : 0;
  }
  function setSupplyRebate(box, supply, rebate) {
    var s = box.querySelector('[data-pb="supply"]'), r = box.querySelector('[data-pb="rebate"]');
    if (s) s.value = supply > 0 ? String(Math.round(supply * 100) / 100) : "";
    if (r) r.value = rebate > 0 ? String(Math.round(rebate * 1e3) / 1e3) : "";
    var C = ctxApi();
    if (C && C.setGlobalPrice) C.setGlobalPrice(supply, rebate);
  }
  function onPriceInput(el) {
    var box = document.getElementById("dtLookup");
    if (!box) return;
    var role = el.getAttribute("data-pb"), w = wPriceOf(box), v = num(el.value);
    if (role === "supply") {
      if (w <= 0) {
        setSupplyRebate(box, 0, 0);
        return;
      }
      setSupplyRebate(box, v, v / w);
    } else if (role === "rebate") {
      if (w <= 0) {
        setSupplyRebate(box, 0, 0);
        return;
      }
      setSupplyRebate(box, v * w, v);
    }
  }
  document.addEventListener("input", function(e) {
    var el = e && e.target;
    if (!el || !el.getAttribute) return;
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("lg-batch")) return;
    var pb = el.getAttribute("data-pb");
    if (pb === "supply" || pb === "rebate") {
      onPriceInput(el);
      return;
    }
    if (pb === "wPrice" || pb) return;
    if (el.getAttribute("data-ba") !== "alloc") return;
    var max = num(el.getAttribute("max")), rawv = num(el.value);
    if (rawv > max) {
      el.classList.add("ba-over");
      el.setAttribute("title", "销售数量不能大于库存数量 " + max + "（已自动钳制）");
      V.violations.push({
        i: +el.getAttribute("data-i"),
        input: rawv,
        max,
        reason: "销售数量不能大于库存数量",
        at: Date.now()
      });
      if (V.violations.length > 60) V.violations.shift();
    } else el.classList.remove("ba-over");
  }, true);
  function priceLayerHtml(ctx) {
    var tx = GU && GU.text ? function(v2) {
      return GU.text(text(v2));
    } : function(v2) {
      return text(v2);
    };
    var cfg = raw(ctx.source), types = Array.isArray(cfg.priceTypes) ? cfg.priceTypes : [];
    var rows = ctx.spec && Array.isArray(ctx.spec.rows) ? ctx.spec.rows : [];
    var batchKey = ctx.spec ? ctx.spec.batchField : "";
    var specCols = ctx.spec && Array.isArray(ctx.spec.cols) ? ctx.spec.cols : [];
    var batchTitle = "批号", i, j, c, w, o;
    for (i = 0; i < specCols.length; i++) {
      if (specCols[i].k === batchKey) {
        batchTitle = text(specCols[i].t);
        break;
      }
    }
    var cg = '<col style="width:110px">', th = '<th style="width:110px">' + tx(batchTitle) + "</th>", body = "";
    for (j = 0; j < types.length; j++) {
      c = types[j] || {};
      w = Math.max(40, Math.min(300, num(c.w) || 72));
      cg += '<col style="width:' + w + 'px">';
      th += '<th style="width:' + w + 'px">' + tx(c.t == null ? c.label == null ? c.k : c.label : c.t) + "</th>";
    }
    for (i = 0; i < rows.length; i++) {
      o = rows[i] || {};
      body += "<tr><td>" + tx(o[batchKey]) + "</td>";
      for (j = 0; j < types.length; j++) {
        var v = o[types[j].k];
        body += "<td>" + (v == null || v === "" ? tx("—") : tx(v)) + "</td>";
      }
      body += "</tr>";
    }
    if (!rows.length) body = '<tr><td colspan="' + (types.length + 1) + '">暂无批次价格</td></tr>';
    var html = '<div class="pl-hd"><b>价格参考 · ' + tx(cfg.label || "") + '</b><button type="button" class="pl-close" data-pl="close">关闭 (F2)</button></div><div class="pl-scroll"><table class="pl-tbl"><colgroup>' + cg + "</colgroup><thead><tr>" + th + "</tr></thead><tbody>" + body + "</tbody></table></div>";
    if (GU && typeof GU.harden === "function") {
      var h = GU.harden(html);
      return h && h.html != null ? h.html : html;
    }
    return html;
  }
  function placePriceLayer() {
    var layer = V.priceLayer, box = document.getElementById("dtLookup");
    if (!layer || !box || !box.classList.contains("on")) return;
    var r = box.getBoundingClientRect();
    var c = currentCtx(), types = Array.isArray(raw(c.source).priceTypes) ? raw(c.source).priceTypes : [];
    var need = 110, j;
    for (j = 0; j < types.length; j++) need += Math.max(40, Math.min(300, num(types[j].w) || 72));
    var w = Math.min(560, Math.max(r.width || box.offsetWidth || 520, need));
    layer.style.width = w + "px";
    layer.style.left = Math.max(6, Math.min(r.left, window.innerWidth - w - 6)) + "px";
    layer.style.top = r.bottom + 6 + "px";
  }
  function schedulePlace() {
    if (V.rafPending) return;
    V.rafPending = true;
    var run = function() {
      V.rafPending = false;
      placePriceLayer();
    };
    window.requestAnimationFrame ? window.requestAnimationFrame(run) : setTimeout(run, 16);
  }
  function removePriceLayer() {
    if (V.priceLayer && V.priceLayer.parentNode) V.priceLayer.parentNode.removeChild(V.priceLayer);
    V.priceLayer = null;
  }
  function currentCtx() {
    var st = null;
    try {
      st = D.lookupState;
    } catch (e) {
    }
    var src = st && st.source || "";
    return { st, source: src, spec: specOf(src) };
  }
  function specOf(source) {
    var g = raw(source), cols2 = [], i, c;
    var arr = Array.isArray(g.columns) ? g.columns : [];
    var feat = g.features && g.features[g.mode] || {};
    for (i = 0; i < arr.length; i++) {
      c = arr[i] || {};
      if (c.hidden === true || c.hidden === "true") continue;
      if (text(c.role) === "price" && feat.showPrice === false) continue;
      cols2.push({ k: text(c.k), t: text(c.t == null ? c.label == null ? c.k : c.label : c.t) });
    }
    return {
      batchField: text(g.batchField),
      cols: cols2,
      rows: Array.isArray(g.rows) ? g.rows : [],
      source
    };
  }
  function togglePriceLayer() {
    if (V.priceLayer) {
      removePriceLayer();
      return;
    }
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on") || !box.classList.contains("lg-batch")) return;
    var c = currentCtx();
    var layer = document.createElement("div");
    layer.id = "dtLookupPriceLayer";
    layer.setAttribute("data-pl-layer", "1");
    layer.innerHTML = priceLayerHtml(c);
    document.body.appendChild(layer);
    V.priceLayer = layer;
    placePriceLayer();
  }
  window.addEventListener("keydown", function(e) {
    if (e.key !== "F2" && e.keyCode !== 113) return;
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on") || !box.classList.contains("lg-batch")) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    togglePriceLayer();
  }, true);
  window.addEventListener("click", function(e) {
    if (!V.priceLayer) return;
    var t = e && e.target;
    if (!t || !t.closest || !t.closest("#dtLookupPriceLayer")) return;
    e.stopImmediatePropagation();
    if (t.closest('[data-pl="close"]')) removePriceLayer();
  }, true);
  window.addEventListener("mousedown", function(e) {
    if (!V.priceLayer) return;
    var t = e && e.target;
    if (t && t.closest && t.closest("#dtLookupPriceLayer")) e.stopImmediatePropagation();
  }, true);
  window.addEventListener("scroll", function() {
    if (V.priceLayer) schedulePlace();
  }, true);
  window.addEventListener("resize", function() {
    if (V.priceLayer) schedulePlace();
  }, false);
  function priceFloorCheck(ctx, picks, cfg, spec) {
    var out = { applied: false, supply: 0, floor: 0, floorFrom: "", hit: false, detail: [] };
    var box = document.getElementById("dtLookup");
    var el = box && box.querySelector ? box.querySelector('[data-pb="supply"]') : null;
    var supply = el ? num(el.value) : 0;
    out.supply = supply;
    if (supply <= 0) return out;
    out.applied = true;
    var pb = cfg.priceBar && typeof cfg.priceBar === "object" ? cfg.priceBar : {};
    var vals = pb.values && typeof pb.values === "object" ? pb.values : {};
    var minKey = text(pb.minPriceKey || "minPrice"), min = num(vals[minKey]);
    var floors = [], i, p, o, v;
    if (min > 0) {
      floors.push({ v: min, from: "minPrice", batch: "" });
    } else if (spec && spec.inPriceField) {
      for (i = 0; i < picks.length; i++) {
        p = picks[i];
        o = p.o || {};
        v = num(o[spec.inPriceField]);
        floors.push({ v, from: "inPrice", batch: o[spec.batchField] });
      }
    }
    for (i = 0; i < floors.length; i++) {
      if (supply < floors[i].v) {
        out.hit = true;
        out.floor = floors[i].v;
        out.floorFrom = floors[i].from;
        out.detail.push({ batch: floors[i].batch, floor: floors[i].v, supply });
      }
    }
    return out;
  }
  function validate(ctx, picks) {
    var cfg = raw(ctx.st.source), spec = ctx.spec, ctrl = cfg.controls || {};
    var blocked = [], i, p, o;
    for (i = 0; i < picks.length; i++) {
      p = picks[i];
      o = p.o || {};
      if (ctrl.expiredBatch !== false && isExpired(o, spec, cfg))
        blocked.push({ i: p.i, batch: o[spec.batchField], reason: expiredTitle() });
      if (ctrl.overStock !== false && num(p.alloc) > num(o[spec.qtyField]))
        blocked.push({ i: p.i, batch: o[spec.batchField], reason: "销售数量不能大于库存数量" });
    }
    var res = { ok: true, reason: "", blocked };
    if (blocked.length) {
      res.ok = false;
      res.reason = blocked[0].reason;
    }
    var floor = priceFloorCheck(ctx, picks, cfg, spec);
    V.priceFloor = floor;
    if (res.ok && floor.hit) {
      res.ok = false;
      res.reason = "销售价格不得低于设定最低价/进价";
    }
    var ps = cfg.preSubmit || {}, gate = {
      applied: false,
      enabled: !!ps.enabled,
      validator: text(ps.validator),
      returned: null
    };
    if (res.ok && ps.enabled && ps.validator) {
      var fn = window[ps.validator], r = null, err = null;
      if (typeof fn === "function") {
        gate.applied = true;
        try {
          r = fn({ mode: spec.mode, source: ctx.st.source, picks, alloc: ctx.alloc });
        } catch (e) {
          r = false;
          err = String(e);
        }
        gate.returned = r;
        if (r === false) {
          res.ok = false;
          res.reason = text(ps.message || "提交前校验未通过");
        }
        if (err) gate.error = err;
      }
    }
    V.lastValidate = {
      ok: res.ok,
      reason: res.reason,
      blocked: blocked.slice(),
      priceFloor: clone(floor),
      preSubmit: gate,
      at: Date.now()
    };
    return res;
  }
  function activeElementInfo() {
    var a = document.activeElement;
    if (!a || !a.getAttribute) return { tag: "", dataBa: null, dataPb: null, dataLk: null };
    return {
      tag: text(a.tagName).toLowerCase(),
      dataBa: a.getAttribute("data-ba"),
      dataPb: a.getAttribute("data-pb"),
      dataLk: a.getAttribute("data-lk")
    };
  }
  function splitInherit() {
    var L = window.__WL_DT_LOOKUP__ || {};
    var keys = Array.isArray(L.rowKeys) ? L.rowKeys : [];
    if (!L.batch || keys.length < 2) return { checked: false, reason: "no-split", rows: keys.length };
    var sec = null;
    try {
      sec = D.sections()[0];
    } catch (e) {
    }
    if (!sec) return { checked: false, reason: "no-section" };
    var sp = D.specOf(sec), rk = sp ? sp.rowKey : "", list = D.rows(sec) || [];
    var mapped = L.mapped && typeof L.mapped === "object" ? L.mapped : {};
    var covered = {}, k;
    for (k in mapped) {
      if (mapped.hasOwnProperty(k)) covered[String(mapped[k])] = 1;
    }
    covered[String(rk)] = 1;
    var fields = [], cols2 = sp && Array.isArray(sp.columns) ? sp.columns : [], i, j;
    for (i = 0; i < cols2.length; i++) {
      var c = cols2[i] || {};
      if (c.formula || c.calc || c.computed) continue;
      if (covered[String(c.k)]) continue;
      fields.push(String(c.k));
    }
    var picked = [];
    for (i = 0; i < keys.length; i++) {
      for (j = 0; j < list.length; j++) {
        if (String(list[j][rk]) === String(keys[i])) {
          picked.push(list[j]);
          break;
        }
      }
    }
    if (picked.length < 2) return { checked: false, reason: "rows-not-found", fields, rows: picked.length };
    var base = picked[0], bad = [];
    for (i = 1; i < picked.length; i++) {
      for (j = 0; j < fields.length; j++) {
        if (String(picked[i][fields[j]]) !== String(base[fields[j]]))
          bad.push({
            rowKey: picked[i][rk],
            field: fields[j],
            expected: base[fields[j]],
            actual: picked[i][fields[j]]
          });
      }
    }
    return {
      checked: true,
      ok: bad.length === 0,
      fields,
      rows: picked.length,
      rowKeys: keys.slice(),
      mismatches: bad
    };
  }
  function debug(ctx) {
    var src = ctx.live ? ctx.st.source : ctx.last && ctx.last.source || "";
    if (!src) {
      var all = sources(), ks = Object.keys(all);
      for (var z = 0; z < ks.length; z++) {
        if (all[ks[z]] && all[ks[z]].mode) {
          src = ks[z];
          break;
        }
      }
    }
    var cfg = raw(src), pb = cfg.priceBar || null, rs = cfg.returnStock || null;
    var C = ctxApi() || {}, box = document.getElementById("dtLookup") || {};
    var supplyEl = box.querySelector ? box.querySelector('[data-pb="supply"]') : null;
    var rebateEl = box.querySelector ? box.querySelector('[data-pb="rebate"]') : null;
    return {
      installed: true,
      version: "1.46",
      source: src,
      itemInfo: cfg.itemInfo ? {
        titleField: text(cfg.itemInfo.titleField || ""),
        title: text(cfg.itemInfo.title || ""),
        fields: (Array.isArray(cfg.itemInfo.fields) ? cfg.itemInfo.fields : []).map(function(x) {
          return { k: text(x.k), t: text(x.t) };
        })
      } : null,
      priceTypes: (Array.isArray(cfg.priceTypes) ? cfg.priceTypes : []).map(function(c) {
        return { k: text(c.k), t: text(c.t), w: num(c.w) };
      }),
      priceBar: pb ? {
        globalPrice: !!pb.globalPrice,
        supplyField: text(pb.supplyField),
        rebateField: text(pb.rebateField),
        wPriceKey: text(pb.wPriceKey),
        minPriceKey: text(pb.minPriceKey || ""),
        columns: (Array.isArray(pb.columns) ? pb.columns : []).map(function(c) {
          return { k: text(c.k), t: text(c.t), role: text(c.role), editable: !!c.editable, w: num(c.w) };
        }),
        values: pb.values && typeof pb.values === "object" ? clone(pb.values) : null
      } : null,
      returnStock: rs ? {
        label: text(rs.label || ""),
        columns: (Array.isArray(rs.columns) ? rs.columns : []).map(function(c) {
          return { k: text(c.k), t: text(c.t), w: num(c.w) };
        }),
        rows: (Array.isArray(rs.rows) ? rs.rows : []).length
      } : null,
      controls: cfg.controls ? clone(cfg.controls) : null,
      writeMap: cfg.writeMap ? clone(cfg.writeMap) : null,
      globalPrice: {
        supply: supplyEl ? num(supplyEl.value) : 0,
        rebateRate: num(C.rebateRate || 0),
        currentSupplyInput: supplyEl ? text(supplyEl.value) : null,
        currentRebateInput: rebateEl ? text(rebateEl.value) : null,
        prices: (C.prices || []).slice(),
        origPrices: (C.origPrices || []).slice()
      },
      priceFloor: V.priceFloor ? clone(V.priceFloor) : null,
      preSubmit: cfg.preSubmit ? clone(cfg.preSubmit) : null,
      lastValidate: V.lastValidate ? clone(V.lastValidate) : null,
      focus: { initialFocus: V.initialFocus, active: activeElementInfo() },
      splitInherit: splitInherit(),
      priceLayerOpen: !!V.priceLayer,
      expiredRows: V.expiredRows.slice(),
      violations: V.violations.slice(),
      sectionWrites: V.writes
    };
  }
  var rawClose9 = D.lookupClose;
  D.lookupClose = function() {
    removePriceLayer();
    return rawClose9.call(D);
  };
  window.__WL_B9_DECORATE__ = {
    cols,
    rowFlags,
    sections,
    validate,
    debug
  };
  window.__WL_DEMO_PRE_SUBMIT__ = function() {
    if (String(location.hash).indexOf("preSubmitFail") >= 0) {
      console.log("[v1.45 demo preSubmit] 拦截：location.hash 命中 preSubmitFail");
      return false;
    }
    return true;
  };
  window.__WL_LEGACY_BATCH_UI__ = function() {
    var st = null;
    try {
      st = D.lookupState;
    } catch (e) {
    }
    var live = !!(st && raw(st.source).mode), src = live ? st.source : "";
    if (!src) {
      var all = sources(), ks = Object.keys(all);
      for (var i = 0; i < ks.length; i++) {
        if (all[ks[i]] && all[ks[i]].mode) {
          src = ks[i];
          break;
        }
      }
    }
    var out = debug({ live, st: st || { source: src }, last: null });
    out.activeSource = live ? src : "";
    out.defaultSource = src;
    return out;
  };
  T._legacyBatchUI = window.__WL_LEGACY_BATCH_UI__;
})();
(function() {
  var T = window.TPL, D = window.DETAIL;
  if (!T || !D) return;
  function ensureRowVisible(el) {
    if (!el || !el.getAttribute || !el.getAttribute("data-col")) return;
    var wrap = el.closest ? el.closest(".dt-wrap") : null;
    if (!wrap) return;
    var box = wrap.querySelector(".dt-tblbox");
    if (!box) return;
    if (box.scrollHeight <= box.clientHeight + 1) return;
    var tr = el.closest ? el.closest("tbody tr") : null;
    if (!tr) return;
    var br = box.getBoundingClientRect(), rr = tr.getBoundingClientRect();
    var thead = wrap.querySelector("thead"), tfoot = wrap.querySelector("tfoot");
    var th = thead ? thead.querySelector("th") : null, tf = tfoot ? tfoot.querySelector("td") : null;
    var headH = th && getComputedStyle(th).position === "sticky" ? thead.offsetHeight : 0;
    var footH = tf && getComputedStyle(tf).position === "sticky" ? tfoot.offsetHeight : 0;
    var top = rr.top - br.top, bottom = rr.bottom - br.top;
    var hi = headH, lo = box.clientHeight - footH, delta = 0;
    if (top < hi) delta = top - hi;
    else if (bottom > lo) delta = bottom - lo;
    if (delta) box.scrollTop = box.scrollTop + delta;
  }
  function recheck() {
    try {
      ensureRowVisible(document.activeElement);
    } catch (e) {
    }
  }
  function scheduleRecheck() {
    if (window.requestAnimationFrame) window.requestAnimationFrame(recheck);
    setTimeout(recheck, 0);
    setTimeout(recheck, 80);
  }
  document.addEventListener("focusin", function(e) {
    ensureRowVisible(e.target);
    scheduleRecheck();
  }, true);
  function authoritativeSources() {
    try {
      var el = document.getElementById("tplSchema");
      if (!el) return null;
      var s = JSON.parse(el.textContent);
      return s && s.formSpec && s.formSpec.lookupSources || null;
    } catch (e) {
      return null;
    }
  }
  var FALLBACK_LABEL = {
    "/api/batchSale": "批号目录 · 销售出库（mock）",
    "/api/batchReturn": "批号目录 · 销退入库（mock）"
  };
  function sourceLabels() {
    var out = {}, src = authoritativeSources(), rt = null, k;
    try {
      rt = (T._formSpec() || {}).lookupSources;
    } catch (e) {
    }
    if (src) {
      for (k in src) if (Object.prototype.hasOwnProperty.call(src, k))
        out[k] = src[k] && src[k].label || k;
    }
    if (rt) {
      for (k in rt) if (Object.prototype.hasOwnProperty.call(rt, k) && !out[k])
        out[k] = rt[k] && rt[k].label || k;
    }
    for (k in FALLBACK_LABEL) if (Object.prototype.hasOwnProperty.call(FALLBACK_LABEL, k) && !out[k])
      out[k] = FALLBACK_LABEL[k];
    return out;
  }
  var pendingSource = null;
  function patchSourceSelects() {
    var sels = document.querySelectorAll('#formWin select[onchange*="lookupSource"],.dtcfg select[onchange*="lookupSource"]');
    if (!sels.length) return;
    var labels = sourceLabels(), keys = Object.keys(labels), i, j, s, have, o;
    for (i = 0; i < sels.length; i++) {
      s = sels[i];
      have = {};
      for (j = 0; j < s.options.length; j++) have[s.options[j].value] = 1;
      for (j = 0; j < keys.length; j++) {
        if (have[keys[j]]) continue;
        o = document.createElement("option");
        o.value = keys[j];
        o.textContent = labels[keys[j]];
        s.appendChild(o);
      }
      if (pendingSource && pendingSource.i === i && pendingSource.v && s.value !== pendingSource.v)
        s.value = pendingSource.v;
    }
  }
  [
    "_formOpen",
    "_formSel",
    "_formLoadPreset",
    "_dtCol",
    "_dtColAdd",
    "_dtColMove",
    "_dtColDel",
    "_dtSpec",
    "_dtSpecJSON",
    "_dtFlowNext",
    "_formSave"
  ].forEach(function(k) {
    if (typeof T[k] !== "function") return;
    var raw = T[k];
    T[k] = function() {
      if (k === "_dtCol" && String(arguments[2]) === "lookupSource")
        pendingSource = { i: +arguments[1], v: String(arguments[3] || "") };
      var r = raw.apply(T, arguments);
      try {
        patchSourceSelects();
      } catch (e) {
      }
      return r;
    };
  });
  if (typeof MutationObserver !== "undefined") {
    try {
      new MutationObserver(function(ms) {
        if (document.querySelector(".dtcfg,#formWin .vc-col-detail")) patchSourceSelects();
        var hit = false, i, j, m, n;
        for (i = 0; i < ms.length; i++) {
          m = ms[i];
          if (m.type === "attributes" && m.attributeName === "data-b7-max") hit = true;
          if (m.type === "childList" && m.addedNodes) {
            for (j = 0; j < m.addedNodes.length; j++) {
              n = m.addedNodes[j];
              if (!n || n.nodeType !== 1) continue;
              if (n.classList && n.classList.contains("dt-wrap") || n.querySelector && n.querySelector(".dt-tblbox")) {
                hit = true;
                break;
              }
            }
          }
          if (hit) break;
        }
        if (hit) recheck();
      }).observe(
        document.documentElement,
        { childList: true, subtree: true, attributes: true, attributeFilter: ["data-b7-max"] }
      );
    } catch (e) {
    }
  }
  if (typeof T._formSpec === "function") {
    var rawFormSpec = T._formSpec;
    T._formSpec = function() {
      var o = rawFormSpec.call(T) || {}, src = authoritativeSources();
      if (!src) return o;
      if (!o.lookupSources || typeof o.lookupSources !== "object") o.lookupSources = {};
      var merged = {}, k;
      for (k in src) if (Object.prototype.hasOwnProperty.call(src, k)) merged[k] = src[k];
      for (k in o.lookupSources) if (Object.prototype.hasOwnProperty.call(o.lookupSources, k))
        merged[k] = o.lookupSources[k];
      o.lookupSources = merged;
      return o;
    };
  }
  function lockCell(e) {
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on")) return;
    var t = e.target;
    if (!t || !t.closest) return;
    var td = t.closest("#dtLookup td");
    if (!td) return;
    var inp = td.querySelector("input[data-ba],input[data-pb]");
    if (!inp || inp.disabled || inp.readOnly) return;
    e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    else e.stopPropagation();
    var row = td.closest('[data-lk="row"]');
    if (row) {
      var trs = box.querySelectorAll('[data-lk="row"]');
      for (var i = 0; i < trs.length; i++) trs[i].classList.toggle("on", trs[i] === row);
      var idx = +row.getAttribute("data-i");
      if (!isNaN(idx)) {
        try {
          if (D.lookupState) D.lookupState.active = idx;
        } catch (x) {
        }
        var L = window.__WL_DT_LOOKUP__ || {};
        L.active = idx;
        window.__WL_DT_LOOKUP__ = L;
      }
    }
    try {
      inp.focus({ preventScroll: true });
    } catch (x) {
      try {
        inp.focus();
      } catch (x2) {
      }
    }
    try {
      if (inp.select) inp.select();
    } catch (x) {
    }
  }
  window.addEventListener("mousedown", lockCell, true);
  window.addEventListener("click", lockCell, true);
  var U = {
    css: false,
    validateWrapped: false,
    lastValidate: null,
    blockedFocus: null,
    dedupe: 0,
    droppedTriggerButtons: 0
  };
  var UXCSS = [
    "#dtLookup.lg-batch .lg-pb-ipt{border:1px solid #dadee3}",
    "#dtLookup.lg-batch .lg-pb-ipt:hover{border-color:#b7c3d4}",
    "#dtLookup.lg-batch .lg-pb-ipt:focus{border-color:#0052d9;",
    "  box-shadow:0 0 0 2px rgba(0,82,217,.10)}",
    "#dtLookup.lg-batch table tbody tr:hover td:first-child,",
    "#dtLookup.lg-batch table tbody tr.act-row td:first-child,",
    "#dtLookup.lg-batch table tbody tr.act-row:hover td:first-child,",
    "#dtLookup.lg-batch table tbody tr.chk td:first-child,",
    "#dtLookup.lg-batch table tbody tr.chk:hover td:first-child,",
    "#dtLookup.lg-batch table thead tr:hover th:first-child{box-shadow:none!important}",
    "#dtLookup.lg-batch table tbody tr.chk:not(.ba-expired) td{background:#fff!important}",
    "#dtLookup.lg-batch .lg-pane{padding-left:0;padding-right:0}",
    "#dtLookup.lg-batch .lg-pane .lg-sec-title{padding:0 0 3px}",
    "#dtLookup.lg-batch .lg-pricebar .lg-sub,",
    "#dtLookup.lg-batch .lg-returnstock .lg-sub{width:100%}",
    "#dtLookup.lg-batch .lg-sub th,",
    "#dtLookup.lg-batch .lg-sub td{width:auto!important}",
    "#dtLookup.lg-batch .lg-tbl tbody tr.on:not(.ba-expired) td,",
    "#dtLookup.lg-batch .lg-tbl tbody tr.on:not(.ba-expired):hover td{",
    "  background:transparent;color:inherit;font-weight:400;box-shadow:none}",
    "#dtLookup.lg-batch .lg-tbl tbody tr.on.ba-expired td{",
    "  background:#f5f5f5;color:#9aa3af;font-weight:400;box-shadow:none}",
    '#drawer .dt-wrap .dt-ipt.lookup + button[data-act="lookup"]{display:none!important}',
    "#dtLookup.lg-batch .lg-hd .lg-cap{display:flex;align-items:center;",
    "  justify-content:space-between;gap:8px;padding:6px 10px;",
    "  white-space:nowrap;overflow:hidden;min-height:0}",
    "#dtLookup.lg-batch .lg-hd .lg-cap>span{min-width:0;overflow:hidden;",
    "  text-overflow:ellipsis;white-space:nowrap}",
    "#dtLookup.lg-batch .lg-hd .ba-mode{display:none}",
    "#dtLookup.lg-batch .lg-hd .lg-meta{flex:0 0 auto;white-space:nowrap;",
    "  font-size:9.5px;color:#909aaa}"
  ].join("\n");
  try {
    document.head.insertAdjacentHTML(
      "beforeend",
      '<style data-b10-ux="1">' + UXCSS + "</style>"
    );
    U.css = true;
  } catch (e) {
  }
  function focusSupplyAfterBlock() {
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on") || !box.classList.contains("lg-batch")) return;
    var el = box.querySelector('input[data-pb="supply"]');
    if (!el || el.disabled || el.readOnly)
      el = box.querySelector('input[data-ba="alloc"]:not([disabled])');
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      try {
        el.focus();
      } catch (e2) {
      }
    }
    try {
      if (el.select) el.select();
    } catch (e) {
    }
    U.blockedFocus = {
      at: Date.now(),
      dataPb: el.getAttribute("data-pb"),
      dataBa: el.getAttribute("data-ba")
    };
  }
  function wrapValidate() {
    var dec = window.__WL_B9_DECORATE__;
    if (!dec || typeof dec.validate !== "function" || dec.__b10Wrapped) return;
    var raw = dec.validate;
    dec.validate = function() {
      var r = raw.apply(this, arguments);
      U.lastValidate = { ok: !!(r && r.ok !== false), reason: r ? r.reason : "", at: Date.now() };
      if (r && r.ok === false) {
        setTimeout(focusSupplyAfterBlock, 0);
        setTimeout(focusSupplyAfterBlock, 80);
      }
      return r;
    };
    dec.__b10Wrapped = 1;
    U.validateWrapped = true;
  }
  wrapValidate();
  function dedupeLookup() {
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on")) return;
    var modern = box.querySelector(".lg-tbl,.lg-scroll,.lg-hd");
    var legacy = box.querySelectorAll(".dt-lk-hd,#dtLkKw,.dt-lk-list,.dt-lk-tip");
    if (modern && legacy.length) {
      for (var i = 0; i < legacy.length; i++) {
        if (legacy[i].parentNode === box) {
          box.removeChild(legacy[i]);
          U.dedupe++;
        }
      }
    }
    var pops = [].slice.call(document.querySelectorAll("body > div")).filter(function(e) {
      return e !== box && e.classList && e.classList.contains("on") && (e.querySelector(".dt-lk-list") || e.querySelector(".lg-tbl"));
    });
    for (var j = 0; j < pops.length; j++) {
      if (pops[j].parentNode) {
        pops[j].parentNode.removeChild(pops[j]);
        U.dedupe++;
      }
    }
  }
  function alignSubTables() {
    var box = document.getElementById("dtLookup");
    if (!box || !box.classList.contains("on") || !box.classList.contains("lg-batch")) return;
    var tbls = box.querySelectorAll(".lg-pricebar .lg-sub,.lg-returnstock .lg-sub"), t, i;
    for (t = 0; t < tbls.length; t++) {
      var tbl = tbls[t], cg = tbl.querySelector("colgroup");
      if (!cg) continue;
      var cols = cg.querySelectorAll("col"), ws = [], sum = 0, w;
      for (i = 0; i < cols.length; i++) {
        w = parseFloat(cols[i].getAttribute("data-b10-w"));
        if (!(w > 0)) {
          w = parseFloat(cols[i].style.width) || 0;
          if (w > 0) cols[i].setAttribute("data-b10-w", String(w));
        }
        ws.push(w > 0 ? w : 0);
        sum += w > 0 ? w : 0;
      }
      if (!sum) continue;
      for (i = 0; i < cols.length; i++) if (ws[i] > 0)
        cols[i].style.width = (ws[i] / sum * 100).toFixed(4) + "%";
      tbl.style.width = "100%";
    }
  }
  if (typeof MutationObserver !== "undefined") {
    try {
      new MutationObserver(function() {
        try {
          dedupeLookup();
          alignSubTables();
        } catch (e) {
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {
    }
  }
  setTimeout(function() {
    try {
      dedupeLookup();
      alignSubTables();
    } catch (e) {
    }
  }, 0);
  window.__WL_LOOKUP_UX__ = function() {
    var box = document.getElementById("dtLookup");
    var panes = box ? box.querySelectorAll(".lg-pricebar .lg-sub,.lg-returnstock .lg-sub") : [];
    var align = [], i, r;
    if (box) {
      var m = box.querySelector(".lg-scroll .lg-tbl");
      if (m) {
        r = m.getBoundingClientRect();
        align.push({ name: "main", left: Math.round(r.left), right: Math.round(r.right) });
      }
      for (i = 0; i < panes.length; i++) {
        r = panes[i].getBoundingClientRect();
        align.push({ name: i === 0 ? "pricebar" : "returnstock", left: Math.round(r.left), right: Math.round(r.right) });
      }
    }
    return {
      version: "1.47.3",
      cssApplied: U.css,
      validateWrapped: U.validateWrapped,
      lastValidate: U.lastValidate ? JSON.parse(JSON.stringify(U.lastValidate)) : null,
      blockedFocus: U.blockedFocus ? JSON.parse(JSON.stringify(U.blockedFocus)) : null,
      dedupe: U.dedupe,
      droppedTriggerButtons: document.querySelectorAll(
        '#drawer .dt-wrap .dt-ipt.lookup + button[data-act="lookup"]'
      ).length,
      alignment: align,
      capHidden: !!(box && box.querySelector(".lg-hd .ba-mode") && getComputedStyle(box.querySelector(".lg-hd .ba-mode")).display === "none"),
      greenLineCancelled: !!(box && box.querySelector(".lg-sub tbody tr td:first-child") && getComputedStyle(box.querySelector(".lg-sub tbody tr td:first-child")).boxShadow === "none"),
      rowHighlightCancelled: !!(box && box.querySelector(".lg-tbl tbody tr.on") && getComputedStyle(box.querySelector(".lg-tbl tbody tr.on td")).backgroundColor === "rgba(0, 0, 0, 0)"),
      focusBack: FB.last ? JSON.parse(JSON.stringify(FB.last)) : null
    };
  };
  var FB = { confirmed: false, count: 0, last: null, skipped: 0 };
  function batchSource(source) {
    if (!source) return false;
    var f = null, a = null, o;
    try {
      f = (T._formSpec() || {}).lookupSources || {};
    } catch (e) {
    }
    try {
      a = authoritativeSources() || {};
    } catch (e) {
    }
    o = f && f[source] || a && a[source];
    return !!(o && o.mode);
  }
  function sessionOf(st) {
    if (!st) return null;
    var el = st.triggerEl, col = "";
    try {
      col = el && el.getAttribute ? String(el.getAttribute("data-col") || "") : "";
    } catch (e) {
    }
    if (!col && st.col && st.col.k) col = String(st.col.k);
    return {
      secId: String(st.triggerSec || st.secId || ""),
      rk: String(st.triggerRk != null ? st.triggerRk : st.rk || ""),
      col,
      source: String(st.source || ""),
      trigger: el
    };
  }
  function focusBackNow(sess) {
    var sec = null, F = null, sid = sess.secId, ok = false;
    try {
      sec = D.byId(sess.secId) || (D.sections()[0] || null);
    } catch (e) {
    }
    try {
      F = D.flowSpec(sec || {});
    } catch (e) {
    }
    if (sec && sec.id) sid = sec.id;
    try {
      ok = !!D.focusCell(sid, sess.rk, sess.col, F);
    } catch (e) {
    }
    if (!ok) {
      try {
        var w = document.getElementById("dtw-" + sid), trs = w ? w.querySelectorAll("tbody tr") : [], i, tr, el;
        for (i = 0; i < trs.length; i++) {
          if (trs[i].getAttribute("data-rk") === sess.rk) {
            tr = trs[i];
            break;
          }
        }
        el = tr ? [].slice.call(tr.querySelectorAll("[data-col]")).filter(function(x) {
          return x.getAttribute("data-col") === sess.col;
        })[0] : null;
        if (!el && sess.trigger && sess.trigger.isConnected) el = sess.trigger;
        if (el && !el.disabled && !el.readOnly) {
          try {
            el.focus({ preventScroll: true });
          } catch (e2) {
            try {
              el.focus();
            } catch (e3) {
            }
          }
          try {
            if (el.select) el.select();
          } catch (e2) {
          }
          ok = true;
        }
      } catch (e) {
      }
    }
    var a = document.activeElement;
    FB.last = {
      secId: sid,
      rowKey: sess.rk,
      col: sess.col,
      source: sess.source,
      ok,
      landed: {
        tag: a ? a.tagName : "",
        col: a && a.getAttribute ? a.getAttribute("data-col") : null,
        inDrawer: !!(a && a.closest && a.closest("#drawer"))
      },
      at: Date.now()
    };
    return ok;
  }
  function atOrigin(sess) {
    var a = document.activeElement;
    return !!(a && a.getAttribute && a.getAttribute("data-col") === sess.col && a.closest && a.closest("#drawer") && a.closest("tbody tr") && a.closest("tbody tr").getAttribute("data-rk") === sess.rk);
  }
  function scheduleFocusBack(sess) {
    setTimeout(function() {
      if (!atOrigin(sess)) focusBackNow(sess);
      else FB.skipped++;
    }, 0);
    setTimeout(function() {
      if (!atOrigin(sess)) focusBackNow(sess);
      else FB.skipped++;
    }, 80);
    FB.count++;
  }
  if (typeof D.refresh === "function") {
    var rawRefreshFB = D.refresh;
    D.refresh = function() {
      var r = rawRefreshFB.apply(D, arguments);
      try {
        var st = D.lookupState;
        if (st && batchSource(st.source)) FB.confirmed = true;
      } catch (e) {
      }
      return r;
    };
  }
  if (typeof D.lookupClose === "function") {
    var rawCloseFB = D.lookupClose;
    D.lookupClose = function() {
      var st = null, sess = null, confirmed = false, isBatch = false;
      try {
        st = D.lookupState;
      } catch (e) {
      }
      sess = sessionOf(st);
      isBatch = !!(sess && batchSource(sess.source));
      confirmed = isBatch && FB.confirmed;
      var ret = rawCloseFB.apply(D, arguments);
      FB.confirmed = false;
      if (isBatch && !confirmed && sess && sess.rk && sess.col)
        scheduleFocusBack(sess);
      return ret;
    };
  }
  window.__WL_LOOKUP_FOCUS_BACK__ = function() {
    return JSON.parse(JSON.stringify({
      version: "1.47.4",
      count: FB.count,
      skipped: FB.skipped,
      confirmed: FB.confirmed,
      last: FB.last
    }));
  };
  (function() {
    var S = {
      tab: "cols",
      sel: 0,
      kw: "",
      hidden: {},
      seen: /* @__PURE__ */ new WeakSet(),
      borrowed: [],
      rows: [],
      labels: [],
      secId: "",
      applies: 0,
      stats: null,
      tabs: [
        { k: "base", t: "区块基础" },
        { k: "cols", t: "列定义" },
        { k: "data", t: "数据与汇总" },
        { k: "flow", t: "键盘流转" }
      ]
    };
    var META = {
      1: "k",
      2: "t",
      3: "w",
      4: "control",
      5: "calc",
      6: "formula",
      7: "precision",
      8: "lookupSource",
      9: "lookupMap"
    };
    var GROUPS = [
      { k: "base", no: "01", t: "基础信息", em: "全展示数据", fs: [1, 2, 4] },
      { k: "show", no: "02", t: "显示与排序", em: "按视图配置", fs: [3] },
      { k: "calc", no: "03", t: "计算与公式", em: "配置驱动", fs: [5, 6, 7] },
      { k: "look", no: "04", t: "选录回填", em: "配置驱动", fs: [8, 9] }
    ];
    var CSS = [
      "#formWin .dtcfg-tabs{position:sticky;top:0;z-index:6;margin:0 -18px 12px;",
      "  padding:8px 18px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;",
      "  background:#fff;border-bottom:1px solid #e5e8ec;",
      "  box-shadow:0 2px 8px rgba(31,35,41,.05)}",
      "#formWin .dtcfg-tabs .dt-tab{height:26px;padding:0 13px;border:1px solid transparent;",
      "  border-radius:13px;background:#f4f6f9;color:#6e7b8c;font:inherit;font-size:11px;",
      "  cursor:pointer;white-space:nowrap}",
      "#formWin .dtcfg-tabs .dt-tab:hover{border-color:#c9d8ff;color:#0052d9}",
      "#formWin .dtcfg-tabs .dt-tab.on{background:#0052d9;border-color:#0052d9;",
      "  color:#fff;font-weight:600}",
      "#fwRight[data-dtcfg-ui] > .fw-card,",
      "#fwRight[data-dtcfg-ui] > .fw-hintbar{display:none}",
      '#fwRight[data-dtcfg-ui="base"] > .fw-card[data-dtcfg-tab="base"],',
      '#fwRight[data-dtcfg-ui="cols"] > .fw-card[data-dtcfg-tab="cols"],',
      '#fwRight[data-dtcfg-ui="data"] > .fw-card[data-dtcfg-tab="data"],',
      '#fwRight[data-dtcfg-ui="flow"] > .fw-card[data-dtcfg-tab="flow"],',
      '#fwRight[data-dtcfg-ui="base"] > .fw-hintbar{display:block}',
      "#fwRight[data-dtcfg-ui] > .fw-card{margin-top:0}",
      '#fwRight[data-dtcfg-ui="cols"] .dtcfg-wrap,',
      '#fwRight[data-dtcfg-ui="cols"] > .fw-card[data-dtcfg-tab="cols"] > .fw-acts,',
      '#fwRight[data-dtcfg-ui="cols"] > .fw-card[data-dtcfg-tab="cols"] > .fw-hintbar{display:none}',
      '#formWin .fw-card[data-dtcfg-tab="cols"] .vcb-bar{margin:10px 12px}',
      '#formWin .fw-card[data-dtcfg-tab="cols"] .vc-cols-main{height:min(556px,64vh);',
      "  margin:0 12px 12px}",
      "#formWin .vc-col-detail .vcd-f{align-items:center}",
      "#formWin .vcd-c > td{display:block;width:100%!important;padding:0!important;",
      "  border:0!important;min-width:0}",
      "#formWin .vcd-c > td > input,",
      "#formWin .vcd-c > td > select{width:100%;max-width:300px;height:27px;",
      "  box-sizing:border-box;padding:0 8px;border:1px solid #dadee3;border-radius:4px;",
      "  background:#fff;color:#2e405e;font:inherit;font-size:11.5px;outline:0}",
      "#formWin .vcd-c > td > input:focus,",
      "#formWin .vcd-c > td > select:focus{border-color:#b5c7ff;",
      "  box-shadow:0 0 0 2px rgba(0,82,217,.08)}",
      "#formWin .vcd-c > td > input[type=checkbox]{width:14px!important;height:14px!important;",
      "  max-width:none;accent-color:#0052d9;margin:5px 0}",
      "#formWin .vcd-ft > td{display:flex;align-items:center;gap:4px}",
      "#formWin .vcd-ft .mini{width:19px;height:19px;line-height:17px;padding:0;",
      "  text-align:center;border:1px solid #e2e6ea;background:#fff;border-radius:3px;",
      "  color:#6e7b8c;cursor:pointer;font-size:11px;font-family:inherit}",
      "#formWin .vcd-ft .mini:hover{border-color:#0052d9;color:#0052d9}",
      "#formWin .vcd-ro{display:inline-block;max-width:100%;padding:3px 7px;",
      "  background:#f5f6f8;border-radius:3px;font-size:10.5px;color:#0052d9;",
      "  font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-all}",
      "#formWin .vcd-ro.db{color:#6e7b8c}",
      "#formWin .vcd-f > label small{display:block;font-size:9.5px;color:#b0b8c4;",
      "  font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:400;margin-top:1px}"
    ].join("\n");
    var MARK = "__DTCFG_V149__";
    var MARK2 = "__DTCFG_V151__";
    var CSS2 = [
      /* 列定义特殊放大样式已取消：不再注入 flex 撑满 / 300px 侧栏 / 两列属性卡 /
         字号与输入框放宽等特化规则，列定义回归基础样式；弹窗尺寸保持 1120x760。 */
      "#formWin [data-dtcfg-nav-toggle]{display:none}"
    ].join("\n");
    function injectCSS2() {
      var st = document.querySelector('style[data-b10-ux="1"]');
      if (!st) {
        st = document.createElement("style");
        st.setAttribute("data-b10-ux", "1");
        document.head.appendChild(st);
      }
      if (st.textContent.indexOf(MARK2) < 0)
        st.appendChild(document.createTextNode("\n/*" + MARK2 + "*/\n" + CSS2));
    }
    function injectCSS() {
      var st = document.querySelector('style[data-b10-ux="1"]');
      if (!st) {
        st = document.createElement("style");
        st.setAttribute("data-b10-ux", "1");
        document.head.appendChild(st);
      }
      if (st.textContent.indexOf(MARK) < 0)
        st.appendChild(document.createTextNode("\n/*" + MARK + "*/\n" + CSS));
      injectCSS2();
    }
    function tdOf(tr, fi) {
      if (!tr) return null;
      var own = tr.querySelector(':scope > td[data-fi="' + fi + '"]');
      if (own) return own;
      var right = document.getElementById("fwRight");
      var i = String(tr.getAttribute("data-row-i") || "");
      return right ? right.querySelector('td[data-row-i="' + i + '"][data-fi="' + fi + '"]') : null;
    }
    function valOf(td) {
      var e = td ? td.querySelector("input,select,textarea") : null;
      if (!e) return "";
      if (e.tagName === "SELECT") {
        var o = e.options[e.selectedIndex];
        return o ? String(o.textContent || o.value || "") : "";
      }
      return String(e.value || "");
    }
    function keyOf(td) {
      var e = td ? td.querySelector("select") : null;
      return e ? String(e.value || "") : "";
    }
    function cardTab(card) {
      var b = card.querySelector(".fw-card-hd b"), t = b ? String(b.textContent || "") : "";
      if (/^01/.test(t)) return "base";
      if (/^02/.test(t)) return "cols";
      if (/^03/.test(t)) return "data";
      if (/^04/.test(t)) return "flow";
      return "";
    }
    function secIdOf(tbl) {
      var e = tbl.querySelector('[onchange*="_dtCol("],[onclick*="_dtColAdd"]'), m;
      if (!e) return "";
      m = /_dtCol(?:Add)?\('([^']+)'/.exec(
        String(e.getAttribute("onchange") || e.getAttribute("onclick") || "")
      );
      return m ? m[1] : "";
    }
    function presetCols() {
      try {
        var el = document.getElementById("tplSchema");
        if (!el) return [];
        return ((JSON.parse(el.textContent).formSpec || {}).detailPreset || {}).spec.columns || [];
      } catch (e) {
        return [];
      }
    }
    function badgeOf(i) {
      try {
        var d = T._formDraft(), sec = ((d || {}).layout || {}).sections.filter(function(x) {
          return x.id === S.secId;
        })[0];
        var cur = JSON.stringify((sec.spec.columns || [])[i]), base = JSON.stringify(presetCols()[i]);
        return cur === base ? { cls: "base", txt: "SCHEMA 默认" } : { cls: "ov", txt: "草稿已改" };
      } catch (e) {
        return { cls: "base", txt: "SCHEMA 默认" };
      }
    }
    function makeBar(card) {
      var bar = document.createElement("div");
      bar.className = "vcb-bar";
      bar.setAttribute("data-dtcfg-bar", "1");
      bar.innerHTML = '<div class="vcb-stats">' + [
        ["shown", "列已显示"],
        ["width", "合计宽度"],
        ["edit", "可编辑列"],
        ["lookup", "选录列"],
        ["formula", "公式列"],
        ["controls", "可用控件"]
      ].map(function(p) {
        return '<span class="vcb-stat"><b data-stat="' + p[0] + '"></b><span>' + p[1] + "</span></span>";
      }).join("") + '</div><div class="vcb-acts"><button class="vcb-btn" data-act="all">全选</button><button class="vcb-btn" data-act="editable">仅编辑列</button><button class="vcb-btn" data-act="defw">默认宽度</button><button class="vcb-btn" data-act="restore">恢复覆盖</button><button class="vcb-btn pri" data-act="json">查看生效 JSON</button></div>';
      var add = card.querySelector(':scope > .fw-acts button[onclick*="_dtColAdd"]');
      if (add) {
        add.classList.add("vcb-btn");
        bar.querySelector(".vcb-acts").appendChild(add);
      }
      var acts = card.querySelector(":scope > .fw-acts");
      if (acts) acts.insertAdjacentElement("afterend", bar);
      else card.appendChild(bar);
      bar.addEventListener("click", function(e) {
        var b = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
        if (!b) return;
        var a = b.getAttribute("data-act"), i;
        if (a === "all") {
          S.hidden = {};
        } else if (a === "editable") {
          S.hidden = {};
          var ctls = [];
          try {
            ctls = (T._formSpec() || {}).detailControls || [];
          } catch (err) {
          }
          for (i = 0; i < S.rows.length; i++) {
            var ck = keyOf(tdOf(S.rows[i], 4));
            var m = ctls.filter(function(x) {
              return x.key === ck;
            })[0];
            if (m && m.editable === false) S.hidden[valOf(tdOf(S.rows[i], 1))] = 1;
          }
        } else if (a === "defw") {
          try {
            var d = T._formDraft(), sec = ((d || {}).layout || {}).sections.filter(function(x) {
              return x.id === S.secId;
            })[0];
            var sp = JSON.parse(JSON.stringify(sec.spec));
            (sp.columns || []).forEach(function(c) {
              c.w = 90;
            });
            T._dtSpecJSON(S.secId, JSON.stringify(sp));
          } catch (err) {
          }
          return;
        } else if (a === "restore") {
          S.hidden = {};
          S.kw = "";
          var f = S.side.querySelector(".vcs-search input");
          if (f) f.value = "";
        } else if (a === "json") {
          T._formJSON();
          return;
        }
        buildList();
        syncStats();
      });
      return bar;
    }
    function makeMain(card, bar) {
      var main = document.createElement("div");
      main.className = "vc-cols-main";
      main.setAttribute("data-dtcfg-main", "1");
      main.innerHTML = '<div class="vc-cols-side"><div class="vcs-hd"><span>列清单</span><em data-dtcfg-n></em></div><div class="vcs-search"><input type="text" placeholder="搜索列名 / 字段名…"></div><div class="vc-col-list"></div></div><div class="vc-col-detail"></div>';
      bar.insertAdjacentElement("afterend", main);
      S.side = main.querySelector(".vc-cols-side");
      S.list = main.querySelector(".vc-col-list");
      S.detail = main.querySelector(".vc-col-detail");
      var kw = S.side.querySelector(".vcs-search input");
      kw.value = S.kw;
      kw.addEventListener("input", function() {
        S.kw = String(kw.value || "");
        buildList();
        syncStats();
      });
      S.list.addEventListener("click", function(e) {
        var r = e.target && e.target.closest ? e.target.closest(".vc-crow") : null;
        if (!r) return;
        var mv = e.target.closest("[data-mv]");
        if (mv) {
          e.stopPropagation();
          T._dtColMove(S.secId, +r.getAttribute("data-i"), +mv.getAttribute("data-mv"));
          return;
        }
        if (e.target.classList && e.target.classList.contains("ck")) return;
        select(+r.getAttribute("data-i"));
      });
      S.list.addEventListener("change", function(e) {
        if (!e.target.classList || !e.target.classList.contains("ck")) return;
        var r = e.target.closest(".vc-crow"), k = r.getAttribute("data-k");
        if (e.target.checked) delete S.hidden[k];
        else S.hidden[k] = 1;
        buildList();
        syncStats();
      });
      return main;
    }
    function buildList() {
      if (!S.list) return;
      var q = String(S.kw || "").trim().toLowerCase(), on = [], off = [], i, tr;
      for (i = 0; i < S.rows.length; i++) {
        tr = S.rows[i];
        var k = valOf(tdOf(tr, 1)), t = valOf(tdOf(tr, 2)), w = valOf(tdOf(tr, 3)), ctl = valOf(tdOf(tr, 4)), hidden = !!S.hidden[k];
        var hit = !q || (t + k + ctl).toLowerCase().indexOf(q) >= 0;
        if (!hit) continue;
        var row = document.createElement("div");
        row.className = "vc-crow " + (hidden ? "off " : "on ") + (i === S.sel ? "sel" : "");
        row.setAttribute("data-i", String(i));
        row.setAttribute("data-k", k);
        row.innerHTML = '<input class="ck" type="checkbox"><span class="ix"></span><span class="tx"><b></b><i></i></span><span class="w"></span><span class="mv"><button class="vc-mini" data-mv="-1" title="上移">↑</button><button class="vc-mini" data-mv="1" title="下移">↓</button></span>';
        row.querySelector(".ck").checked = !hidden;
        row.querySelector(".ck").title = hidden ? "点击移到已显示" : "点击移到未显示";
        row.querySelector(".ix").textContent = hidden ? "—" : String(i + 1);
        row.querySelector(".tx b").textContent = t || "列 " + (i + 1);
        row.querySelector(".tx i").textContent = k;
        row.querySelector(".w").textContent = w || "—";
        row.querySelector(".w").title = "列宽";
        (hidden ? off : on).push(row);
      }
      var frag = document.createDocumentFragment();
      function grp(txt, n2, mt) {
        var g = document.createElement("div");
        g.className = "vc-crow-grp" + (mt ? " mt" : "");
        g.appendChild(document.createTextNode(txt + " "));
        var b = document.createElement("b");
        b.textContent = String(n2);
        g.appendChild(b);
        g.appendChild(document.createTextNode(" 列" + (mt ? "" : " · 点击行编辑属性")));
        frag.appendChild(g);
      }
      grp("已显示", on.length, false);
      on.forEach(function(x) {
        frag.appendChild(x);
      });
      if (!on.length) {
        var e1 = document.createElement("div");
        e1.className = "vc-crow-empty";
        e1.textContent = "没有匹配的列";
        frag.appendChild(e1);
      }
      grp("未显示", off.length, true);
      off.forEach(function(x) {
        frag.appendChild(x);
      });
      if (!off.length) {
        var e2 = document.createElement("div");
        e2.className = "vc-crow-empty";
        e2.textContent = "无";
        frag.appendChild(e2);
      }
      S.list.innerHTML = "";
      S.list.appendChild(frag);
      var n = S.side.querySelector("[data-dtcfg-n]");
      if (n) n.textContent = "共 " + S.rows.length + " 列";
    }
    function detailSkeleton() {
      var s = '<div class="vcd-hd"><div class="vcd-hd-t"><h4></h4><code></code></div><span class="vcd-badge base"></span></div><div class="vcd-nav">' + GROUPS.map(function(g) {
        return '<button data-grp-go="' + g.k + '">' + g.no + " " + g.t.slice(0, 2) + "</button>";
      }).join("") + "<span>滚动查看全部属性</span></div>";
      GROUPS.forEach(function(g) {
        s += '<div class="vcd-grp" data-grp="' + g.k + '"><div class="vcd-gt"><span>' + g.no + "</span>" + g.t + "<em>" + g.em + '</em></div><div class="vcd-body"></div></div>';
      });
      s += '<div class="vcd-ft"><span>字段映射 / 公式 / 选录均由 spec.columns 驱动，引擎零业务字段</span></div>';
      return s;
    }
    function restore() {
      var i, b;
      for (i = 0; i < S.borrowed.length; i++) {
        b = S.borrowed[i];
        try {
          if (b.td && b.parent && b.td.parentNode !== b.parent) b.parent.appendChild(b.td);
        } catch (e) {
        }
      }
      S.borrowed = [];
    }
    function fieldRow(fi, tr, body) {
      var td = tdOf(tr, fi);
      if (!td) return;
      var row = document.createElement("div");
      row.className = "vcd-f";
      var lab = document.createElement("label");
      lab.appendChild(document.createTextNode(S.labels[fi] || ""));
      var sm = document.createElement("small");
      sm.textContent = META[fi] || "";
      lab.appendChild(sm);
      var c = document.createElement("div");
      c.className = "vcd-c";
      row.appendChild(lab);
      row.appendChild(c);
      body.appendChild(row);
      c.appendChild(td);
      var e = td.querySelector("input,select");
      if (e) e.classList.add(e.type === "checkbox" ? "vcd-ck" : "vcd-in");
      S.borrowed.push({ td, parent: tr });
    }
    function roRow(label, key, val, body) {
      var row = document.createElement("div");
      row.className = "vcd-f";
      var lab = document.createElement("label");
      lab.textContent = label;
      var sm = document.createElement("small");
      sm.textContent = key;
      lab.appendChild(sm);
      var c = document.createElement("div");
      c.className = "vcd-c";
      var code = document.createElement("code");
      code.className = "vcd-ro" + (key === "db" ? " db" : "");
      code.textContent = val;
      c.appendChild(code);
      row.appendChild(lab);
      row.appendChild(c);
      body.appendChild(row);
    }
    function borrow() {
      var tr = S.rows[S.sel];
      if (!tr) return;
      GROUPS.forEach(function(g) {
        var body = S.detail.querySelector('.vcd-grp[data-grp="' + g.k + '"] .vcd-body');
        if (!body) return;
        g.fs.forEach(function(fi) {
          fieldRow(fi, tr, body);
        });
        if (g.k === "show") {
          roRow("显示顺序", "order", "第 " + (S.sel + 1) + " / " + S.rows.length + " 列", body);
          roRow("数据库映射", "db", dbOf(), body);
        }
      });
      var ops = tdOf(tr, 10), ft = S.detail.querySelector(".vcd-ft");
      if (ops && ft) {
        ft.insertBefore(ops, ft.firstChild);
        S.borrowed.push({ td: ops, parent: tr });
      }
    }
    function dbOf() {
      try {
        var d = T._formDraft(), sec = ((d || {}).layout || {}).sections.filter(function(x) {
          return x.id === S.secId;
        })[0];
        return (sec.spec.db || sec.spec.dataKey || "—") + "";
      } catch (e) {
        return "—";
      }
    }
    function buildDetail() {
      if (!S.detail) return;
      restore();
      S.detail.innerHTML = detailSkeleton();
      var tr = S.rows[S.sel] || null, hd = S.detail.querySelector(".vcd-hd");
      if (hd) {
        hd.querySelector("h4").textContent = tr ? valOf(tdOf(tr, 2)) || "列 " + (S.sel + 1) : "—";
        hd.querySelector("code").textContent = tr ? valOf(tdOf(tr, 1)) : "—";
        var bg = badgeOf(S.sel), badge = hd.querySelector(".vcd-badge");
        badge.className = "vcd-badge " + bg.cls;
        badge.textContent = bg.txt;
      }
      borrow();
      S.detail.scrollTop = 0;
      if (!S.detail._dtNavBound) {
        S.detail._dtNavBound = 1;
        S.detail.addEventListener("click", function(e) {
          var b = e.target && e.target.closest ? e.target.closest("[data-grp-go]") : null;
          if (!b) return;
          var g = S.detail.querySelector('.vcd-grp[data-grp="' + b.getAttribute("data-grp-go") + '"]');
          if (g) S.detail.scrollTo({ top: Math.max(0, g.offsetTop - 48), behavior: "smooth" });
        });
      }
    }
    function select(i) {
      if (i < 0 || i >= S.rows.length) return;
      S.sel = i;
      buildDetail();
      var rs = S.list ? S.list.querySelectorAll(".vc-crow") : [], j;
      for (j = 0; j < rs.length; j++) rs[j].classList.toggle("sel", +rs[j].getAttribute("data-i") === i);
      syncStats();
    }
    function syncStats() {
      if (!S.bar) return;
      var i, total = S.rows.length, shown = 0, width = 0, edit = 0, lookup = 0, formula = 0;
      var ctls = [];
      try {
        ctls = (T._formSpec() || {}).detailControls || [];
      } catch (e) {
      }
      for (i = 0; i < total; i++) {
        var tr = S.rows[i], k = valOf(tdOf(tr, 1)), ck = keyOf(tdOf(tr, 4));
        var m = ctls.filter(function(x) {
          return x.key === ck;
        })[0];
        if (!S.hidden[k]) shown++;
        width += +valOf(tdOf(tr, 3)) || 0;
        if (m && m.editable !== false) edit++;
        if (ck === "lookup") lookup++;
        if (valOf(tdOf(tr, 6))) formula++;
      }
      var ctlN = ctls.length;
      var vals = {
        shown: shown + "/" + total,
        width: width + "px",
        edit,
        lookup,
        formula,
        controls: ctlN
      };
      var bs = S.bar.querySelectorAll("[data-stat]"), j;
      for (j = 0; j < bs.length; j++) bs[j].textContent = String(vals[bs[j].getAttribute("data-stat")]);
      S.stats = {
        columns: total,
        shown,
        width,
        editable: edit,
        lookup,
        formula,
        controls: ctlN,
        tab: S.tab,
        sel: S.sel,
        kw: S.kw,
        hidden: Object.keys(S.hidden),
        applies: S.applies
      };
    }
    function setTab(tab, keep) {
      var right = document.getElementById("fwRight");
      if (!right || !right.querySelector("table.dtcfg")) return;
      var ok = false, i;
      for (i = 0; i < S.tabs.length; i++) if (S.tabs[i].k === tab) ok = true;
      if (!ok) return;
      S.tab = tab;
      right.setAttribute("data-dtcfg-ui", tab);
      var win = document.getElementById("formWin");
      if (win) win.setAttribute("data-dtcfg-ui", tab);
      var bs = right.querySelectorAll("[data-dtcfg-tabs] .dt-tab");
      for (i = 0; i < bs.length; i++) bs[i].classList.toggle("on", bs[i].getAttribute("data-dt-tab") === tab);
      if (!keep) right.scrollTop = 0;
    }
    function makeTabs(right) {
      var bar = document.createElement("div");
      bar.className = "dtcfg-tabs";
      bar.setAttribute("data-dtcfg-tabs", "1");
      var html = "";
      S.tabs.forEach(function(x) {
        html += '<button type="button" class="dt-tab" data-dt-tab="' + x.k + '">' + x.t + "</button>";
      });
      bar.innerHTML = html;
      var acts = right.querySelector(":scope > .fw-acts");
      if (acts) acts.insertAdjacentElement("afterend", bar);
      else right.insertAdjacentElement("afterbegin", bar);
      bar.addEventListener("click", function(e) {
        var b = e.target && e.target.closest ? e.target.closest("[data-dt-tab]") : null;
        if (b) setTab(b.getAttribute("data-dt-tab"));
      });
    }
    function syncNavLabel() {
      var w = document.getElementById("formWin");
      if (!w) return;
      var b = w.querySelector("[data-dtcfg-nav-toggle]");
      if (!b) return;
      var on = w.getAttribute("data-dtcfg-nav") === "1";
      var t = on ? "⤡ 收起区块导航" : "⤢ 显示区块导航";
      if (b.textContent !== t) b.textContent = t;
      var ti = on ? "隐藏左侧骨架与区块列表，把宽度让给列定义" : "显示左侧骨架与区块列表";
      if (b.getAttribute("title") !== ti) b.setAttribute("title", ti);
    }
    function injectNavToggle() {
      var w = document.getElementById("formWin");
      if (!w) return;
      var tabs = w.querySelector("[data-dtcfg-tabs]");
      if (!tabs) return;
      var b = tabs.querySelector("[data-dtcfg-nav-toggle]");
      if (!b) {
        b = document.createElement("button");
        b.type = "button";
        b.className = "dt-tab";
        b.setAttribute("data-dtcfg-nav-toggle", "1");
        b.addEventListener("click", function() {
          var win = document.getElementById("formWin");
          if (!win) return;
          if (win.getAttribute("data-dtcfg-nav") === "1") win.removeAttribute("data-dtcfg-nav");
          else win.setAttribute("data-dtcfg-nav", "1");
          syncNavLabel();
        });
        tabs.appendChild(b);
      }
      syncNavLabel();
    }
    function rebuild(right, tbl) {
      injectCSS();
      var cards = right.querySelectorAll(":scope > .fw-card"), i;
      for (i = 0; i < cards.length; i++) {
        var k = cardTab(cards[i]);
        if (k) cards[i].setAttribute("data-dtcfg-tab", k);
      }
      var ths = tbl.querySelectorAll("thead th");
      S.labels = [];
      for (i = 0; i < ths.length; i++) S.labels.push(String(ths[i].textContent || "").trim());
      S.rows = [].slice.call(tbl.querySelectorAll("tbody tr"));
      S.rows.forEach(function(tr, ri) {
        tr.setAttribute("data-row-i", String(ri));
        var tds = [].slice.call(tr.children).filter(function(x) {
          return x.tagName === "TD";
        }), j;
        for (j = 0; j < tds.length; j++) {
          tds[j].setAttribute("data-fi", String(j));
          tds[j].setAttribute("data-row-i", String(ri));
        }
      });
      S.secId = secIdOf(tbl);
      S.borrowed = [];
      if (!right.querySelector("[data-dtcfg-tabs]")) makeTabs(right);
      var card = right.querySelector('.fw-card[data-dtcfg-tab="cols"]');
      if (!card) return;
      S.bar = makeBar(card);
      makeMain(card, S.bar);
      buildList();
      buildDetail();
      setTab(S.tab, true);
      syncStats();
      injectNavToggle();
      S.applies++;
    }
    function sync() {
      var right = document.getElementById("fwRight");
      if (!right) return;
      var tbl = right.querySelector("table.dtcfg");
      if (!tbl) {
        right.removeAttribute("data-dtcfg-ui");
        var w = document.getElementById("formWin");
        if (w) w.removeAttribute("data-dtcfg-ui");
        return;
      }
      if (S.seen.has(tbl)) return;
      S.seen.add(tbl);
      try {
        rebuild(right, tbl);
      } catch (e) {
      }
    }
    if (typeof MutationObserver !== "undefined") {
      try {
        new MutationObserver(sync).observe(
          document.documentElement,
          { childList: true, subtree: true }
        );
      } catch (e) {
      }
    }
    setTimeout(sync, 0);
    window.__WL_DTCFG_UI__ = {
      get: function() {
        return JSON.parse(JSON.stringify({
          version: "1.49",
          tab: S.tab,
          sel: S.sel,
          kw: S.kw,
          hidden: Object.keys(S.hidden),
          applies: S.applies,
          stats: S.stats,
          borrowed: S.borrowed.length,
          tabs: S.tabs.map(function(x) {
            return x.k;
          })
        }));
      },
      setTab,
      setFilter: function(v) {
        S.kw = String(v || "");
        var f = S.side && S.side.querySelector(".vcs-search input");
        if (f) f.value = S.kw;
        buildList();
        syncStats();
      },
      select
    };
    return S;
  })();
  (function() {
    var OLD = "明细配置", NEW = "配置表单";
    var SKIP = { SCRIPT: 1, STYLE: 1, PRE: 1, CODE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
    var ATTRS = ["title", "aria-label", "placeholder", "alt"];
    var C = { text: 0, attrs: 0, scans: 0 };
    function repl(v) {
      return v.indexOf(OLD) >= 0 ? v.split(OLD).join(NEW) : v;
    }
    function skipTag(n) {
      return !!(n && n.tagName && SKIP[n.tagName]);
    }
    function fixText(root) {
      if (!root || skipTag(root) || root.nodeType === 3 || root.nodeType === 8) return;
      var w, n, p, v, nv;
      try {
        w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      } catch (e) {
        return;
      }
      while (n = w.nextNode()) {
        p = n.parentNode;
        if (!p || skipTag(p)) continue;
        v = n.nodeValue;
        if (!v || v.indexOf(OLD) < 0) continue;
        nv = repl(v);
        if (nv !== v) {
          n.nodeValue = nv;
          C.text++;
        }
      }
    }
    function fixOne(el) {
      if (!el || el.nodeType !== 1 || !el.getAttribute) return;
      var i, a, v, nv;
      for (i = 0; i < ATTRS.length; i++) {
        a = ATTRS[i];
        if (!el.hasAttribute(a)) continue;
        v = el.getAttribute(a);
        if (!v || v.indexOf(OLD) < 0) continue;
        nv = repl(v);
        if (nv !== v) {
          el.setAttribute(a, nv);
          C.attrs++;
        }
      }
    }
    function fixAttrs(root) {
      if (!root) return;
      fixOne(root);
      if (root.querySelectorAll) {
        var els = root.querySelectorAll("[title],[aria-label],[placeholder],[alt]"), i;
        for (i = 0; i < els.length; i++) fixOne(els[i]);
      }
    }
    function apply(root) {
      root = root || document.body;
      if (!root) return;
      C.scans++;
      fixText(root);
      fixAttrs(root);
    }
    function onMutations(ms) {
      var i, j, m, t, nodes, nd;
      for (i = 0; i < ms.length; i++) {
        m = ms[i];
        t = m.target;
        if (t && t.nodeType === 3) t = t.parentNode;
        if (t && t.nodeType === 1) {
          if (m.type !== "attributes") fixText(t);
          fixAttrs(t);
        }
        nodes = m.addedNodes;
        if (nodes) for (j = 0; j < nodes.length; j++) {
          nd = nodes[j];
          if (nd.nodeType === 1) {
            fixText(nd);
            fixAttrs(nd);
          } else if (nd.nodeType === 3 && nd.parentNode && !skipTag(nd.parentNode))
            fixText(nd.parentNode);
        }
      }
    }
    if (typeof MutationObserver !== "undefined") {
      try {
        new MutationObserver(onMutations).observe(
          document.documentElement,
          {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATTRS
          }
        );
      } catch (e) {
      }
    }
    apply(document.body);
    setTimeout(function() {
      apply(document.body);
    }, 0);
    ["_formOpen", "_formJSON", "_formSave", "_wlMenu", "_vcOpen"].forEach(function(k) {
      if (typeof T[k] !== "function") return;
      var raw = T[k];
      T[k] = function() {
        var r = raw.apply(T, arguments);
        try {
          apply(document.body);
        } catch (e) {
        }
        return r;
      };
    });
    window.__WL_LABEL_UNIFY__ = function() {
      return {
        old: OLD,
        newName: NEW,
        textReplaced: C.text,
        attrsReplaced: C.attrs,
        scans: C.scans,
        attrs: ATTRS.slice(),
        skip: Object.keys(SKIP)
      };
    };
    return C;
  })();
})();
(function() {
  var W = window, SETS = W.__TPL_SETS__ || {}, KEY = "TPL_ACTIVE_SET_V1", SCHEMA_STORE = "TPL_SCHEMA_V113";
  if (!Object.keys(SETS).length || document.getElementById("wlSetSwitch")) return;
  var active = W.__TPL_ACTIVE_SET__ || "product";
  try {
    var real = W.TPL && W.TPL.schema && W.TPL.schema.id || "";
    Object.keys(SETS).forEach(function(k) {
      if (SETS[k].id === real) active = k;
    });
  } catch (e) {
  }
  var wrap = document.createElement("div");
  wrap.id = "wlSetSwitch";
  wrap.className = "wlset-wrap";
  var items = Object.keys(SETS).map(function(k) {
    var s = SETS[k], sc = s.schema || {}, cols = ((sc.list || {}).columns || []).length, gs = ((sc.detail || {}).groups || []).reduce(function(n, g) {
      return n + (g.fields || []).length;
    }, 0);
    return '<div class="wlset-item' + (k === active ? " cur" : "") + '" data-k="' + k + '"><span class="wlset-radio"></span><div><div class="wlset-lb">' + s.label + (k === "product" ? '<span class="wlset-tag">默认</span>' : "") + '</div><div class="wlset-ds">' + s.desc + '</div><div class="wlset-meta">' + cols + " 列 · " + gs + " 个表头字段 · id=" + s.id + "</div></div></div>";
  }).join("");
  wrap.innerHTML = '<div class="wlset-panel"><div class="wlset-ttl">业务配置集</div><div class="wlset-sub">切换后整页按该业务的列、字段与动作重新渲染；配置按 schema.id 隔离存档</div>' + items + '<div class="wlset-foot">配置集是纯数据：在 config-data.js 的 __TPL_SETS__ 里加一项即可扩展新业务，前端 0 代码。<br>预览器可用 ?set=saleBill 直达销售单（销售开票），不传参数即为默认的产品档案。</div></div><div class="wlset-pill"><span class="wlset-dot"></span><span style="color:#8a94a6">业务</span><span class="wlset-name">' + (SETS[active] ? SETS[active].label : active) + '</span><span class="wlset-caret">▲</span></div>';
  document.body.appendChild(wrap);
  wrap.querySelector(".wlset-pill").addEventListener("click", function() {
    wrap.classList.toggle("on");
  });
  wrap.querySelectorAll(".wlset-item").forEach(function(el) {
    el.addEventListener("click", function() {
      var k = el.getAttribute("data-k");
      try {
        W.localStorage.setItem(KEY, k);
      } catch (e) {
      }
      try {
        W.name = "TPL_SET:" + k;
      } catch (e) {
      }
      try {
        W.localStorage.removeItem(SCHEMA_STORE);
      } catch (e) {
      }
      try {
        var u = new URL(W.location.href);
        if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "file:") {
          u.searchParams.set("set", k);
          W.location.href = u.toString();
          return;
        }
      } catch (e) {
      }
      try {
        W.location.reload();
      } catch (e) {
      }
    });
  });
  W.__WL_SET_SWITCH__ = function() {
    return {
      active,
      keys: Object.keys(SETS),
      current: SETS[active] ? SETS[active].label : active,
      schemaId: W.TPL && W.TPL.schema && W.TPL.schema.id || null,
      urlParam: (W.location.search || "").match(/[?&]set=([^&]+)/) ? RegExp.$1 : null
    };
  };
})();
(function() {
  var W = window;
  if (W.__WL_EXT_CORE__) return;
  function get(field, ctx) {
    if (!field) return void 0;
    var s = String(field);
    if (s.charAt(0) !== "@") return ctx[s];
    var dot = s.indexOf(".");
    if (dot < 0) return void 0;
    var ns = s.slice(1, dot), key = s.slice(dot + 1);
    var box = ctx["@" + ns];
    return box ? box[key] : void 0;
  }
  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }
  function atom(c, ctx) {
    var a = get(c.field, ctx), b = c.value;
    switch (String(c.op || "eq")) {
      case "eq":
        return String(a) === String(b);
      case "ne":
        return String(a) !== String(b);
      case "gt":
        return num(a) > num(b);
      case "ge":
        return num(a) >= num(b);
      case "lt":
        return num(a) < num(b);
      case "le":
        return num(a) <= num(b);
      case "in":
        return (Array.isArray(b) ? b : [b]).map(String).indexOf(String(a)) >= 0;
      case "contains":
        return String(a == null ? "" : a).indexOf(String(b)) >= 0;
      case "empty":
        return a === "" || a == null || Array.isArray(a) && !a.length;
      case "notEmpty":
        return !(a === "" || a == null || Array.isArray(a) && !a.length);
      case "between":
        return Array.isArray(b) && num(a) >= num(b[0]) && num(a) <= num(b[1]);
      default:
        return false;
    }
  }
  function evalRule(c, ctx) {
    if (!c) return true;
    if (Array.isArray(c.all)) return c.all.every(function(x) {
      return evalRule(x, ctx);
    });
    if (Array.isArray(c.any)) return c.any.some(function(x) {
      return evalRule(x, ctx);
    });
    if (c.not) return !evalRule(c.not, ctx);
    return atom(c, ctx || {});
  }
  function expr(s, row) {
    var m = String(s || "").match(/^\s*([\w.@]+)\s*(>=|<=|==|!=|>|<)\s*([\w.@]+|-?\d+(?:\.\d+)?|'[^']*'|"[^"]*")\s*$/);
    if (!m) return false;
    var op = { ">": "gt", "<": "lt", ">=": "ge", "<=": "le", "==": "eq", "!=": "ne" }[m[2]];
    var rv = m[3].replace(/^['"]|['"]$/g, "");
    var lv = /^-?\d+(\.\d+)?$/.test(rv) ? Number(rv) : get(rv, row);
    return atom({ field: m[1], op, value: lv }, row);
  }
  W.__WL_RULE__ = { eval: evalRule, expr, get, atom };
  function schema() {
    try {
      return W.TPL && W.TPL.schema;
    } catch (e) {
      return null;
    }
  }
  function ext() {
    var S = schema();
    if (!S) return {};
    var fs = S.formSpec || {};
    var e = fs.extension || {};
    return {
      active: !!fs.extension || !!fs.ruleSpec || !!fs.onLookup || !!fs.contextKeys,
      ruleSpec: e.ruleSpec || fs.ruleSpec || {},
      contextKeys: e.contextKeys || fs.contextKeys || [],
      onLookup: e.onLookup || fs.onLookup || null,
      fields: e.fieldRules || {},
      sections: e.sectionRules || {},
      columns: e.columnRules || {},
      actions: e.actionRules || {},
      rowSelect: e.rowSelect || (S.pageSpec || {}).rowSelect || null,
      detail: e.detailRules || e.detail || {},
      filters: e.filterRules || {},
      panels: e.panels || {},
      fixtures: e.fixtures || {},
      apiParams: e.apiParams || {}
    };
  }
  function fieldRule(k) {
    var e = ext(), r = e.fields[k];
    if (r) return r;
    var S = schema();
    if (!S) return null;
    var gs = (S.detail || {}).groups || [];
    for (var i = 0; i < gs.length; i++) {
      var fs = gs[i].fields || [];
      for (var j = 0; j < fs.length; j++) {
        if (fs[j].k === k && (fs[j].visibleIf || fs[j].disabledWhen || fs[j].labelWhen))
          return { visibleIf: fs[j].visibleIf, disabledWhen: fs[j].disabledWhen, labelWhen: fs[j].labelWhen };
      }
    }
    try {
      var fc = W.TPL._formConfig ? W.TPL._formConfig() : null;
      var secs = ((fc || {}).layout || {}).sections || [];
      for (var a = 0; a < secs.length; a++) {
        var ff = secs[a].fields || [];
        for (var b = 0; b < ff.length; b++)
          if (ff[b].k === k && (ff[b].visibleIf || ff[b].disabledWhen || ff[b].labelWhen))
            return { visibleIf: ff[b].visibleIf, disabledWhen: ff[b].disabledWhen, labelWhen: ff[b].labelWhen };
      }
    } catch (e2) {
    }
    return null;
  }
  function columnRule(k) {
    var e = ext(), r = e.columns[k];
    if (r) return r;
    var S = schema();
    var cs = (S && S.list || {}).columns || [];
    for (var i = 0; i < cs.length; i++)
      if (cs[i].k === k && (cs[i].visibleIf || cs[i].rowStyle || cs[i].valueMap))
        return { visibleIf: cs[i].visibleIf, rowStyle: cs[i].rowStyle, valueMap: cs[i].valueMap };
    return null;
  }
  function actionRule(id, label) {
    var e = ext(), r = e.actions[id] || e.actions[label];
    if (r) return r;
    var S = schema();
    var ds = (S && S.actionSpec || {}).defaults || [];
    for (var i = 0; i < ds.length; i++)
      if (ds[i].id === id || ds[i].label === label) {
        if (ds[i].visibleIf || ds[i].confirm || ds[i].guard)
          return { visibleIf: ds[i].visibleIf, confirm: ds[i].confirm, guard: ds[i].guard };
      }
    return null;
  }
  function formValues() {
    var o = {}, root = document.getElementById("drawer") || document.getElementById("formWin") || document.body;
    var els = root.querySelectorAll("[data-k]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i], k = el.getAttribute("data-k");
      if (k && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA"))
        o[k] = el.value;
    }
    return o;
  }
  function currentRow() {
    try {
      if (W.__WL_EXT_ROW__ && Object.keys(W.__WL_EXT_ROW__).length) return W.__WL_EXT_ROW__;
      var tr = document.querySelector("#main tbody tr.act-row") || document.querySelector("#main tbody tr[data-i].row-active");
      if (!tr) return W.__WL_EXT_ROW__ || {};
      var i = +tr.getAttribute("data-i"), rows = W.TPL.rows ? W.TPL.rows() : [];
      return rows[i] || W.__WL_EXT_ROW__ || {};
    } catch (e) {
      return W.__WL_EXT_ROW__ || {};
    }
  }
  function context() {
    var S = schema(), e = ext(), vals = formValues(), row = currentRow();
    var ctxBox = {}, keys = e.contextKeys || [];
    var injected = W.__WL_EXT_CTX__ || {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      ctxBox[k] = injected[k] !== void 0 ? injected[k] : row[k] !== void 0 ? row[k] : vals[k] !== void 0 ? vals[k] : S && S[k];
    }
    var c = {};
    for (var v in vals) c[v] = vals[v];
    c["@ctx"] = ctxBox;
    c["@row"] = row;
    return c;
  }
  var handlers = [], acts = [], scheduled = false, mo = null;
  var OPTS = { childList: true, subtree: true };
  function replay() {
    try {
      for (var i = 0; i < handlers.length; i++) {
        try {
          handlers[i]();
        } catch (e) {
        }
      }
    } catch (e) {
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function() {
      scheduled = false;
      if (!acts.some(function(f) {
        try {
          return f();
        } catch (e) {
          return false;
        }
      })) return;
      if (mo) mo.disconnect();
      try {
        replay();
      } catch (e) {
      }
      if (mo) {
        try {
          mo.observe(document.body, OPTS);
        } catch (e) {
        }
      }
    }, 30);
  }
  function initObserver() {
    if (mo || !document.body || typeof MutationObserver === "undefined") return;
    mo = new MutationObserver(function() {
      schedule();
    });
    try {
      mo.observe(document.body, OPTS);
    } catch (e) {
    }
  }
  ["_formOpen", "_vcOpen", "_view", "_redraw", "_open", "_drawerEdit"].forEach(function(k) {
    try {
      var T = W.TPL;
      if (!T || typeof T[k] !== "function") return;
      var raw = T[k];
      T[k] = function() {
        var r = raw.apply(T, arguments);
        schedule();
        return r;
      };
    } catch (e) {
    }
  });
  W.__WL_EXT__ = {
    on: function(fn) {
      handlers.push(fn);
    },
    active: function(fn) {
      acts.push(fn);
    },
    replay,
    schedule,
    ext,
    schema,
    fieldRule,
    columnRule,
    actionRule,
    context,
    formValues,
    currentRow,
    rule: W.__WL_RULE__,
    version: "T1-T9/1.0"
  };
  W.__WL_EXT_CORE__ = function() {
    return {
      version: "1.0",
      handlers: handlers.length,
      activeChecks: acts.length,
      observer: !!mo,
      ruleSpec: Object.keys(ext().ruleSpec || {}).length
    };
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initObserver);
  else initObserver();
})();
(function() {
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T1__) return;
  function rulesExist() {
    var e = X.ext();
    if (!e.active) return false;
    if (Object.keys(e.fields).length || Object.keys(e.sections).length || Object.keys(e.columns).length || Object.keys(e.actions).length || e.ruleSpec && (e.ruleSpec.filterGroupVisibleIf || e.ruleSpec.auditMode)) return true;
    var S = X.schema();
    if (!S) return false;
    var gs = (S.detail || {}).groups || [], cs = (S.list || {}).columns || [], ds = (S.actionSpec || {}).defaults || [];
    var i, j;
    for (i = 0; i < gs.length; i++) {
      var fs = gs[i].fields || [];
      for (j = 0; j < fs.length; j++) if (fs[j].visibleIf || fs[j].disabledWhen || fs[j].labelWhen) return true;
    }
    for (i = 0; i < cs.length; i++) if (cs[i].visibleIf) return true;
    for (i = 0; i < ds.length; i++) if (ds[i].visibleIf) return true;
    return false;
  }
  X.active(rulesExist);
  function setShow(box, on) {
    if (!box) return;
    if (on) {
      if (box.style.display === "none") box.style.display = "";
    } else if (box.style.display !== "none") box.style.display = "none";
  }
  function setDisabled(ipt, on) {
    if (!ipt) return;
    if (!!ipt.disabled !== !!on) ipt.disabled = !!on;
  }
  function setLabel(box, text) {
    if (!box) return;
    var dt = box.querySelector ? box.querySelector("dt, label, .fi-label") : null;
    if (!dt) return;
    var orig = dt.getAttribute("data-wl-label");
    if (orig === null) dt.setAttribute("data-wl-label", dt.textContent);
    var want = text === void 0 || text === null || text === "" ? dt.getAttribute("data-wl-label") : String(text);
    if (dt.textContent !== want) dt.textContent = want;
  }
  function labelOf(lw, ctx) {
    if (!Array.isArray(lw)) return void 0;
    for (var i = 0; i < lw.length; i++)
      if (R.eval(lw[i].when, ctx)) return lw[i].text;
    return void 0;
  }
  function fieldPass() {
    var ctx = X.context();
    var roots = [document.getElementById("drawer"), document.getElementById("formWin")];
    roots.forEach(function(root) {
      if (!root) return;
      var els = root.querySelectorAll("[data-k]");
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) continue;
        var k = el.getAttribute("data-k"), r = X.fieldRule(k);
        if (!r) continue;
        var box = el.closest ? el.closest(".da-fld") || el.closest(".fi") || el.parentElement : el.parentElement;
        if (r.visibleIf !== void 0) setShow(box, R.eval(r.visibleIf, ctx));
        if (r.disabledWhen !== void 0) setDisabled(el, R.eval(r.disabledWhen, ctx));
        if (r.labelWhen !== void 0) setLabel(box, labelOf(r.labelWhen, ctx));
      }
    });
  }
  function columnPass() {
    var ctx = X.context(), S = X.schema();
    var cols = (S && S.list || {}).columns || [];
    var idx = {};
    cols.forEach(function(c, i) {
      idx[c.k] = i;
    });
    var ths = document.querySelectorAll("#main thead th");
    cols.forEach(function(c, i) {
      var r = X.columnRule(c.k), on = true;
      if (r && r.visibleIf !== void 0) on = R.eval(r.visibleIf, ctx);
      if (i < ths.length) setShow(ths[i], on);
      var tds = document.querySelectorAll('#main tbody td[data-c="' + c.k + '"]');
      for (var j = 0; j < tds.length; j++) setShow(tds[j], on);
    });
    cols.forEach(function(c) {
      var r = X.columnRule(c.k);
      if (!r || !r.valueMap) return;
      var tds = document.querySelectorAll('#main tbody td[data-c="' + c.k + '"]');
      for (var j = 0; j < tds.length; j++) {
        var td = tds[j], orig = td.getAttribute("data-wl-vm");
        if (orig === null) {
          orig = td.textContent;
          td.setAttribute("data-wl-vm", orig);
        }
        var key = String(orig).trim(), want = r.valueMap[key];
        if (want === void 0) want = r.valueMap["*"] !== void 0 ? r.valueMap["*"] : orig;
        if (td.textContent !== String(want)) td.textContent = String(want);
      }
    });
  }
  function sectionPass() {
    var ctx = X.context(), e = X.ext();
    Object.keys(e.sections).forEach(function(id) {
      var r = e.sections[id], box = document.querySelector('[data-sec="' + id + '"]');
      if (box && r && r.visibleIf !== void 0) setShow(box, R.eval(r.visibleIf, ctx));
    });
  }
  function actionPass() {
    var ctx = X.context();
    var btns = document.querySelectorAll("#main .wl-actions button, #wlMenu button, #main .wl-btn");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i], label = (b.textContent || "").trim();
      var r = X.actionRule(b.getAttribute("data-act-id") || "", label);
      if (r && r.visibleIf !== void 0) setShow(b, R.eval(r.visibleIf, ctx));
    }
  }
  function filterPass() {
    var e = X.ext(), rs = e.ruleSpec || {}, ctx = X.context();
    var bar = document.querySelector("#main .wl-filterbar") || document.querySelector("#tplAdvWrap") || document.querySelector("#tplAdv");
    if (bar && rs.filterGroupVisibleIf !== void 0)
      setShow(bar, R.eval(rs.filterGroupVisibleIf, ctx));
    if (rs.auditMode && rs.auditMode.when) {
      var audit = R.eval(rs.auditMode.when, ctx);
      (rs.auditMode.hideActions || []).forEach(function(label) {
        var bs = document.querySelectorAll("#main .wl-actions button, #main .wl-btn");
        for (var i = 0; i < bs.length; i++)
          if ((bs[i].textContent || "").indexOf(label) >= 0) setShow(bs[i], !audit);
      });
    }
  }
  X.on(function() {
    fieldPass();
    columnPass();
    sectionPass();
    actionPass();
    filterPass();
  });
  W.__WL_EXT_T1__ = function() {
    var hidden = { fields: 0, cols: 0, actions: 0 };
    var bs = document.querySelectorAll('.da-fld[style*="display: none"]');
    hidden.fields = bs.length;
    document.querySelectorAll('#main thead th[style*="display: none"]').forEach(function() {
      hidden.cols++;
    });
    document.querySelectorAll('#main .wl-actions button[style*="display: none"]').forEach(function() {
      hidden.actions++;
    });
    return { active: rulesExist(), hidden, ruleSpec: X.ext().ruleSpec };
  };
  X.schedule();
})();
(function() {
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T2__) return;
  var LOG = { requests: [], fills: 0, options: 0, chains: 0, fallbacks: 0, hidden: 0 };
  function cfg() {
    return X.ext().onLookup;
  }
  X.active(function() {
    return !!(cfg() && cfg().trigger && cfg().trigger.field);
  });
  function resolveParams(params, ctx) {
    var out = {};
    X.ext();
    Object.keys(params || {}).forEach(function(k) {
      var v = params[k];
      if (typeof v === "string" && v.charAt(0) === "@") v = R.get(v, ctx);
      out[k] = v;
    });
    return out;
  }
  function fixtureFor(o) {
    var fx = X.ext().fixtures || {};
    return fx[o.fixture || o.source] || null;
  }
  function request(o, params) {
    LOG.requests.push({ source: o.source, params, fixture: !!fixtureFor(o) });
    var fx = fixtureFor(o);
    if (fx) return Promise.resolve(fx);
    if (typeof fetch !== "function") return Promise.reject(new Error("no fetch"));
    var url = o.source;
    try {
      var q = Object.keys(params).map(function(k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      }).join("&");
      if (q) url += (url.indexOf("?") >= 0 ? "&" : "?") + q;
    } catch (e) {
    }
    return fetch(url, { method: o.method || "GET" }).then(function(r) {
      return r.json();
    });
  }
  function findField(k) {
    return document.querySelector('#drawer [data-k="' + k + '"], #formWin [data-k="' + k + '"]');
  }
  function put(k, v, hidden) {
    var el = findField(k);
    if (!el) {
      var root = document.getElementById("drawer") || document.getElementById("formWin");
      if (!root) return;
      el = document.createElement("input");
      el.type = "hidden";
      el.setAttribute("data-k", k);
      el.setAttribute("data-wl-hidden-id", "1");
      root.appendChild(el);
      LOG.hidden++;
    }
    if (el.tagName === "SELECT") {
      var opts = [].slice.call(el.options).map(function(x) {
        return x.value;
      });
      if (opts.indexOf(String(v)) < 0) {
        var op = document.createElement("option");
        op.value = v;
        op.textContent = v;
        el.appendChild(op);
      }
      el.value = String(v);
    } else el.value = v == null ? "" : String(v);
    if (hidden) el.setAttribute("data-wl-hidden-id", "1");
    LOG.fills++;
  }
  function setOptions(target, list) {
    var el = findField(target);
    if (!el) return;
    var vals = (list || []).map(function(x) {
      return x && typeof x === "object" ? x.label !== void 0 ? x.label : x.value : x;
    });
    if (el.tagName === "SELECT") {
      var keep = el.value;
      el.innerHTML = vals.map(function(v) {
        return "<option>" + String(v).replace(/</g, "&lt;") + "</option>";
      }).join("");
      if (vals.indexOf(keep) >= 0) el.value = keep;
    } else if (el.tagName === "INPUT") {
      var dl = document.getElementById("wlDl_" + target);
      if (!dl) {
        dl = document.createElement("datalist");
        dl.id = "wlDl_" + target;
        document.body.appendChild(dl);
      }
      dl.innerHTML = vals.map(function(v) {
        return '<option value="' + String(v).replace(/"/g, "&quot;") + '">';
      }).join("");
      el.setAttribute("list", dl.id);
    }
    LOG.options++;
  }
  function apply(o, data) {
    if (!data || typeof data !== "object") return;
    (o.fill || []).forEach(function(f) {
      if (data[f.from] !== void 0) put(f.to, data[f.from]);
    });
    (o.setOptions || []).forEach(function(s) {
      setOptions(s.target, data[s.from]);
    });
    (o.defaults || []).forEach(function(d) {
      var el = findField(d.target);
      if (el && (el.value === "" || el.value === void 0) && data[d.from] !== void 0) {
        el.value = String(data[d.from]);
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    if (o.valueField && data[o.valueField] !== void 0) put(o.valueField, data[o.valueField], true);
    W.__WL_EXT_LOOKUP_DATA__ = data;
    X.schedule();
  }
  function run(o, triggerEl) {
    var ctx = X.context();
    var params = resolveParams(o.params, ctx);
    W.__WL_EXT_LAST_PARAMS__ = params;
    return request(o, params).then(function(data) {
      apply(o, data);
    }).catch(function() {
      LOG.fallbacks++;
    });
  }
  function onChange(e) {
    var o = cfg();
    if (!o || !o.trigger || !o.trigger.field) return;
    var el = e.target, k = el && el.getAttribute ? el.getAttribute("data-k") : null;
    if (k === o.trigger.field) {
      run(o);
      return;
    }
    (o.chain || []).forEach(function(c) {
      if (c.when !== k || !W.__WL_EXT_LOOKUP_DATA__) return;
      (c.set || []).forEach(function(s) {
        var v = W.__WL_EXT_LOOKUP_DATA__[s.from];
        if (v === void 0 && s.by) {
          var hit = (W.__WL_EXT_LOOKUP_DATA__[s.by.array] || []).filter(function(x) {
            return String(x[s.by.key]) === String(el.value);
          })[0];
          if (hit) v = hit[s.by.value];
        }
        if (v !== void 0) {
          put(s.to || s.col, v);
          LOG.chains++;
        }
      });
    });
  }
  document.addEventListener("change", onChange, true);
  W.__WL_EXT_DETAIL_MAP__ = function(secId, rk, data) {
    try {
      var D = W.DETAIL, sec = D.byId(secId), sp = sec ? D.specOf(sec) : null;
      if (!sp) return 0;
      var map = (X.ext().onLookup || {}).detailMap || {};
      var n = 0;
      Object.keys(map).forEach(function(from) {
        var col = map[from];
        if (data[from] === void 0) return;
        var c = sp.columns.filter(function(x) {
          return x.k === col;
        })[0];
        if (c) {
          D.setCell(secId, rk, col, data[from]);
          n++;
        }
      });
      var wrap = document.getElementById("dtw-" + secId);
      if (wrap) {
        Object.keys(map).forEach(function(from) {
          var el = wrap.querySelector('tr[data-rk="' + rk + '"] [data-col="' + map[from] + '"]');
          if (el && data[from] !== void 0) el.value = String(data[from]);
        });
      }
      return n;
    } catch (err) {
      return 0;
    }
  };
  W.__WL_EXT_T2__ = function() {
    var o = cfg() || {};
    return {
      active: !!(o.trigger && o.trigger.field),
      log: {
        requests: LOG.requests.slice(),
        fills: LOG.fills,
        options: LOG.options,
        chains: LOG.chains,
        fallbacks: LOG.fallbacks,
        hiddenInputs: LOG.hidden
      },
      lastParams: W.__WL_EXT_LAST_PARAMS__ || null,
      hasData: !!W.__WL_EXT_LOOKUP_DATA__
    };
  };
})();
(function() {
  var W = window, X = W.__WL_EXT__;
  if (!X || W.__WL_EXT_T3__) return;
  var LOG = { hits: 0, writes: 0, protected: 0, skips: 0, rules: 0 };
  function rulesFor(secId) {
    var e = X.ext(), out = [];
    var agg = (e.detail || {}).recalc;
    if (Array.isArray(agg) && agg.length) {
      var g = { secId: secId || "*", rules: agg };
      out.push(g);
    }
    try {
      var D = W.DETAIL;
      (D.sections ? D.sections() : []).forEach(function(sec) {
        var sp = D.specOf(sec) || {};
        if (Array.isArray(sp.recalc) && sp.recalc.length)
          out.push({ secId: sec.id, rules: sp.recalc });
      });
    } catch (err) {
    }
    return out;
  }
  function active() {
    return rulesFor().length > 0;
  }
  X.active(active);
  function sourceOf(rule, row) {
    var sr = rule.sourceRef, out = {};
    if (!sr) return out;
    var fx = (X.ext().fixtures || {})[sr.from] || W.__WL_EXT_SOURCE__ || {};
    var rec = Array.isArray(fx) ? fx.filter(function(x) {
      return String(x[sr.keyField || "PID"]) === String(row[sr.key]);
    })[0] : fx;
    if (rec && sr.field !== void 0) out[sr.field] = rec[sr.field];
    if (sr.field === void 0 && rec) for (var k in rec) out[k] = rec[k];
    return out;
  }
  function prep(formula, row, rows, source) {
    var s = String(formula);
    Object.keys(source || {}).forEach(function(k) {
      s = s.split("@source." + k).join("(" + Number(source[k] || 0) + ")");
    });
    return s;
  }
  function safe(v) {
    var n = Number(v);
    if (!isFinite(n)) {
      LOG.protected++;
      return 0;
    }
    return n;
  }
  function syncInputs(secId, rk, writes) {
    var wrap = document.getElementById("dtw-" + secId);
    if (!wrap) return;
    var tr = wrap.querySelector('tr[data-rk="' + rk + '"]');
    if (!tr) return;
    Object.keys(writes).forEach(function(k) {
      var ipt = tr.querySelector('[data-col="' + k + '"]');
      if (ipt && (ipt.tagName === "INPUT" || ipt.tagName === "SELECT")) {
        if (String(ipt.value) !== String(writes[k])) ipt.value = String(writes[k]);
      } else {
        var ro = tr.querySelector('[data-ccol="' + k + '"]');
        if (ro && String(ro.textContent) !== String(writes[k])) ro.textContent = String(writes[k]);
      }
    });
  }
  function onEdit(e) {
    if (!active()) return;
    var el = e.target;
    if (!el || !el.dataset || !el.dataset.col) return;
    var wrap = el.closest ? el.closest(".dt-wrap") : null;
    if (!wrap) return;
    var secId = wrap.getAttribute("data-sec");
    var tr = el.closest ? el.closest("tr") : null;
    var rk = tr ? tr.getAttribute("data-rk") : "";
    var edited = el.dataset.col, D = W.DETAIL;
    if (!D || !D.row) return;
    var groups = rulesFor(secId).filter(function(g) {
      return g.secId === "*" || g.secId === secId;
    });
    if (!groups.length) return;
    groups.forEach(function(g) {
      g.rules.forEach(function(rule) {
        var when = rule.when || {};
        if (String(when.edited || "") !== String(edited)) {
          LOG.skips++;
          return;
        }
        LOG.hits++;
        LOG.rules = g.rules.length;
        var row = D.row(secId, rk);
        if (!row) return;
        var ctx = Object.assign({}, row);
        ctx[edited] = el.type === "number" || /^-?\d+(\.\d+)?$/.test(String(el.value)) ? Number(el.value) : el.value;
        var rows = [];
        try {
          rows = D.rows(D.byId(secId)) || [];
        } catch (er) {
        }
        var source = sourceOf(rule, row), writes = {};
        (rule.set || []).forEach(function(s) {
          var f = prep(s.formula, ctx, rows, source);
          var v;
          try {
            v = W.__WL_FORMULA__.eval(f, ctx, rows, s.precision);
          } catch (err) {
            v = 0;
          }
          v = safe(v);
          try {
            D.setCell(secId, rk, s.col, v);
          } catch (err) {
          }
          writes[s.col] = v;
          LOG.writes++;
        });
        syncInputs(secId, rk, writes);
        W.__WL_EXT_RECALC_LAST__ = {
          secId,
          rk,
          edited,
          writes,
          source,
          dtCalc: W.__WL_DT_CALC__ || null
        };
      });
    });
  }
  document.addEventListener("input", onEdit, false);
  document.addEventListener("change", onEdit, false);
  W.__WL_EXT_T3__ = function() {
    return {
      active: active(),
      ruleGroups: rulesFor().length,
      log: { hits: LOG.hits, writes: LOG.writes, protected: LOG.protected, skips: LOG.skips },
      last: W.__WL_EXT_RECALC_LAST__ || null
    };
  };
})();
