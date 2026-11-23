(function() {
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T4__) return;
  var LOG = { checks: 0, blocks: 0, zeros: 0, styled: 0, errors: [] };
  function specFor(secId) {
    var e = X.ext(), out = { validators: [], rowStyle: [] };
    var agg = e.detail || {};
    if (Array.isArray(agg.validators)) out.validators = out.validators.concat(agg.validators);
    if (Array.isArray(agg.rowStyle)) out.rowStyle = out.rowStyle.concat(agg.rowStyle);
    try {
      var D = W.DETAIL;
      (D.sections ? D.sections() : []).forEach(function(sec) {
        if (secId && sec.id !== secId) return;
        var sp = D.specOf(sec) || {};
        if (Array.isArray(sp.validators)) out.validators = out.validators.concat(sp.validators);
        if (Array.isArray(sp.rowStyle)) out.rowStyle = out.rowStyle.concat(sp.rowStyle);
      });
    } catch (err) {
    }
    return out;
  }
  function active() {
    var s = specFor();
    return !!(s.validators.length || s.rowStyle.length);
  }
  X.active(active);
  function errBox(secId) {
    return document.querySelector("#dtw-" + secId + " .dt-err[data-err]") || document.querySelector('.dt-err[data-err="' + secId + '"]');
  }
  function showErr(secId, msg, tr, col) {
    var box = errBox(secId);
    if (box) {
      box.textContent = msg || "";
      box.setAttribute("data-wl-err", msg || "");
    }
    LOG.errors.push({ secId, col, message: msg });
    if (tr && col) {
      var ipt = tr.querySelector('[data-col="' + col + '"]');
      if (ipt && ipt.focus) {
        try {
          ipt.focus();
        } catch (e) {
        }
      }
    }
    X.schedule();
  }
  function clearErr(secId) {
    var box = errBox(secId);
    if (box && box.getAttribute("data-wl-err")) {
      box.textContent = "";
      box.removeAttribute("data-wl-err");
    }
  }
  function nextRowFirst(tr) {
    var n = tr && tr.nextElementSibling;
    while (n && n.tagName !== "TR") n = n.nextElementSibling;
    if (!n) return;
    var ipt = n.querySelector("[data-col]");
    if (ipt && ipt.focus) {
      try {
        ipt.focus();
      } catch (e) {
      }
    }
  }
  function validate(el) {
    if (!active()) return;
    var col = el.dataset && el.dataset.col;
    if (!col) return;
    var wrap = el.closest ? el.closest(".dt-wrap") : null;
    if (!wrap) return;
    var secId = wrap.getAttribute("data-sec"), s = specFor(secId);
    RULE_V(el);
    var tr = el.closest ? el.closest("tr") : null;
    s.validators.forEach(function(vd) {
      if (String(vd.col) !== String(col)) return;
      LOG.checks++;
      var raw = el.value, n = Number(raw), bad = null, zeroIt = false, skip = false;
      if (vd.required && (raw === "" || raw == null)) bad = vd.message || "该项为必填项";
      else if (raw !== "" && !isFinite(n)) bad = vd.message || "请输入有效数字";
      else if (raw !== "" && isFinite(n)) {
        if (n < 0 && vd.onNegative === "zero") {
          zeroIt = true;
          bad = vd.message || "不能为负数";
        } else if (vd.min !== void 0 && (vd.excludeMin ? n <= Number(vd.min) : n < Number(vd.min))) {
          bad = vd.message || "数值超出允许范围";
        } else if (vd.max !== void 0 && n > Number(vd.max)) bad = vd.message || "数值超出允许范围";
        if (!bad && n === 0 && vd.onZero === "skipNext") skip = true;
      }
      if (bad) {
        LOG.blocks++;
        if (zeroIt) {
          el.value = "0";
          LOG.zeros++;
          try {
            W.DETAIL.setCell(secId, tr ? tr.getAttribute("data-rk") : "", col, 0);
          } catch (e) {
          }
        }
        showErr(secId, bad, vd.focusCell ? tr : null, vd.focusCell ? col : null);
      } else if (skip) nextRowFirst(tr);
      else clearErr(secId);
    });
  }
  function RULE_V(el) {
    return el.value;
  }
  function styleRows() {
    var s = specFor(), D = W.DETAIL;
    if (!s.rowStyle.length || !D || !D.sections) return;
    D.sections().forEach(function(sec) {
      var wrap = document.getElementById("dtw-" + sec.id);
      if (!wrap) return;
      var list = [];
      try {
        list = D.rows(sec) || [];
      } catch (e) {
      }
      var trs = wrap.querySelectorAll("tbody tr");
      Array.prototype.forEach.call(trs, function(tr, i) {
        var row = list[i] || {}, cls = "";
        for (var j = 0; j < s.rowStyle.length; j++) {
          var rs = s.rowStyle[j];
          if (rs.when && R.expr(rs.when, row)) {
            cls = rs["class"] || rs.cls || "";
            break;
          }
        }
        ["dt-row-green", "dt-row-red", "dt-row-black"].forEach(function(c) {
          tr.classList.remove(c);
        });
        if (cls) {
          tr.classList.add(cls);
          LOG.styled++;
        }
      });
    });
  }
  document.addEventListener("change", function(e) {
    if (!active()) return;
    if (e.target && e.target.dataset && e.target.dataset.col) validate(e.target);
    styleRows();
  }, false);
  X.on(styleRows);
  W.__WL_EXT_T4__ = function() {
    return {
      active: active(),
      validators: specFor().validators.length,
      rowStyles: specFor().rowStyle.length,
      log: {
        checks: LOG.checks,
        blocks: LOG.blocks,
        zeros: LOG.zeros,
        styled: LOG.styled,
        errors: LOG.errors.slice(-6)
      },
      validateAll: function() {
        var n = 0;
        document.querySelectorAll(".dt-wrap .dt-ipt[data-col]").forEach(function(el) {
          validate(el);
          n++;
        });
        return { checked: n, blocks: LOG.blocks };
      }
    };
  };
})();
(function() {
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T5__) return;
  var LOG = { guards: 0, confirms: 0, cancels: 0, contextOpens: 0, runs: [], inputValues: {} };
  function actions() {
    var S = X.schema(), ds = (S && S.actionSpec || {}).defaults || [];
    return ds;
  }
  function find(id) {
    var a = actions();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function ruleOf(id) {
    var a = find(id), r = X.actionRule(id, a ? a.label : "");
    return r || null;
  }
  function menuActions() {
    var e = X.ext(), out = [];
    Object.keys(e.actions || {}).forEach(function(k) {
      var r = e.actions[k];
      if (r && r.zone === "contextMenu") out.push(Object.assign({ id: k, label: r.label || k }, r));
    });
    var S = X.schema(), ds = (S && S.actionSpec || {}).defaults || [];
    ds.forEach(function(a) {
      if (a.zone === "contextMenu" && !out.some(function(x) {
        return x.id === a.id;
      })) out.push(a);
    });
    return out;
  }
  function active() {
    var e = X.ext();
    if (Object.keys(e.actions || {}).length) return true;
    return actions().some(function(a) {
      return a.confirm || a.guard || a.zone === "contextMenu";
    });
  }
  X.active(active);
  function toast(msg) {
    var t = document.getElementById("wlExtToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "wlExtToast";
      t.className = "wl-ext-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(t._tm);
    t._tm = setTimeout(function() {
      t.classList.remove("on");
    }, 2600);
  }
  W.__WL_EXT_TOAST__ = toast;
  function confirmBox(cfg, id, btn, raw, args) {
    var mask = document.getElementById("wlExtConfirm");
    if (!mask) {
      mask = document.createElement("div");
      mask.id = "wlExtConfirm";
      mask.className = "wl-ext-mask";
      document.body.appendChild(mask);
    }
    var msg = String(cfg.message || "确定执行该操作吗？").replace(/\[([^\]]+)\]/g, function(_, k) {
      var row = X.currentRow();
      return row[k] === void 0 ? "" : row[k];
    });
    var hasInput = !!(cfg.input && cfg.input.key);
    mask.innerHTML = '<div class="wl-ext-dlg"><div class="wl-ext-dlg-hd">' + (cfg.title || "操作确认") + '</div><div class="wl-ext-dlg-bd">' + msg.replace(/</g, "&lt;") + "</div>" + (hasInput ? '<div class="wl-ext-dlg-in"><label>' + (cfg.input.label || "请输入") + '</label><input id="wlExtConfirmInput" placeholder="' + (cfg.input.placeholder || "") + '"></div>' : "") + '<div class="wl-ext-dlg-ft"><button data-wl="cancel">取消</button><button data-wl="ok" class="pri">确定</button></div></div>';
    mask.classList.add("on");
    LOG.confirms++;
    function close() {
      mask.classList.remove("on");
      mask.innerHTML = "";
    }
    mask.onclick = function(ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest("[data-wl]") : null;
      if (!b) return;
      var act = b.getAttribute("data-wl");
      if (act === "cancel") {
        LOG.cancels++;
        close();
        return;
      }
      if (hasInput) {
        var v = (document.getElementById("wlExtConfirmInput") || {}).value || "";
        if (cfg.input.required && !v.trim()) {
          toast(cfg.input.emptyMessage || "输入不能为空");
          return;
        }
        LOG.inputValues[cfg.input.key] = v;
        W.__WL_EXT_CONFIRM_INPUT__ = Object.assign({}, LOG.inputValues);
        if (cfg.input.payloadKey) {
          try {
            (W.__DB_PAYLOAD__ = W.__DB_PAYLOAD__ || {})[cfg.input.payloadKey] = v;
          } catch (e) {
          }
        }
      }
      close();
      try {
        raw.apply(W.TPL, args);
      } catch (e) {
      }
    };
  }
  try {
    var T = W.TPL, rawRun = T._actRun;
    T._actRun = function(id, btn) {
      var r = ruleOf(id);
      if (r && r.guard) {
        var ctx = X.context();
        if (!R.eval(r.guard, ctx)) {
          LOG.guards++;
          toast(r.guard.message || "当前状态不允许该操作");
          return void 0;
        }
      }
      if (r && r.confirm) {
        confirmBox(r.confirm, id, btn, rawRun, arguments);
        return void 0;
      }
      LOG.runs.push(id);
      return rawRun.apply(T, arguments);
    };
  } catch (e) {
  }
  var menu = null;
  function closeMenu() {
    if (menu) {
      menu.remove();
      menu = null;
    }
  }
  function openMenu(x, y, rowIndex) {
    var list = menuActions();
    if (!list.length) return;
    closeMenu();
    menu = document.createElement("div");
    menu.className = "wl-ext-ctx";
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.innerHTML = list.map(function(a) {
      var r = X.actionRule(a.id, a.label) || {};
      var ctx = X.context(), on = r.visibleIf === void 0 ? true : R.eval(r.visibleIf, ctx);
      return '<button data-id="' + a.id + '"' + (on ? "" : ' disabled title="当前状态不可用"') + ">" + String(a.label || a.id).replace(/</g, "&lt;") + "</button>";
    }).join("");
    document.body.appendChild(menu);
    LOG.contextOpens++;
    menu.addEventListener("click", function(ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest("[data-id]") : null;
      if (!b || b.disabled) return;
      var id = b.getAttribute("data-id");
      W.__WL_EXT_ROW__ = (function() {
        try {
          return W.TPL.rows()[rowIndex] || {};
        } catch (e) {
          return {};
        }
      })();
      closeMenu();
      try {
        W.TPL._actRun(id);
      } catch (e) {
      }
    });
  }
  document.addEventListener("contextmenu", function(e) {
    var tr = e.target && e.target.closest ? e.target.closest("#main tbody tr[data-i]") : null;
    if (!tr || !active()) return;
    if (!menuActions().length) return;
    e.preventDefault();
    openMenu(e.clientX, e.clientY, +tr.getAttribute("data-i"));
  }, false);
  document.addEventListener("click", function(e) {
    if (menu && !menu.contains(e.target)) closeMenu();
  }, false);
  W.__WL_EXT_T5__ = function() {
    return {
      active: active(),
      contextMenuActions: menuActions().map(function(a) {
        return a.id + ":" + a.label;
      }),
      log: {
        guards: LOG.guards,
        confirms: LOG.confirms,
        cancels: LOG.cancels,
        contextOpens: LOG.contextOpens,
        runs: LOG.runs.slice(-8),
        inputValues: LOG.inputValues
      }
    };
  };
})();
(function() {
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T6__) return;
  var LOG = { dblclicks: 0, fills: 0, loaded: 0, disabled: 0, lastRow: null };
  function cfg() {
    var e = X.ext();
    return e.rowSelect || (X.schema() && X.schema().pageSpec || {}).rowSelect || null;
  }
  function active() {
    var c = cfg();
    return !!(c && c.on);
  }
  X.active(active);
  function panel() {
    var p = document.getElementById("wlExtRowPanel");
    if (!p) {
      p = document.createElement("div");
      p.id = "wlExtRowPanel";
      p.className = "wl-ext-rowpanel";
      document.body.appendChild(p);
    }
    return p;
  }
  function ensureTarget(sel) {
    var t = sel ? document.querySelector(sel) : null;
    if (t) return t;
    var p = panel(), id = String(sel || "").replace(/^#/, "") || "wlExtRowFill";
    var box = p.querySelector("#" + id);
    if (!box) {
      box = document.createElement("span");
      box.id = id;
      p.appendChild(box);
    }
    return box;
  }
  function loadDetail(c, row) {
    if (!c.loadDetail) return;
    var key = String(c.loadDetail.key || "").replace(/^@row\./, "");
    var fx = (X.ext().fixtures || {})[c.loadDetail.source] || null;
    var target = ensureTarget(c.loadDetail.target || c.show);
    function render(data) {
      if (!data) return;
      var rows = Array.isArray(data) ? data : data.rows || [];
      if (!rows.length) {
        target.innerHTML = "<em>暂无明细</em>";
        return;
      }
      var ks = Object.keys(rows[0]).filter(function(k) {
        return k.charAt(0) !== "_";
      });
      target.innerHTML = '<table class="wl-ext-mini"><thead><tr>' + ks.map(function(k) {
        return "<th>" + k + "</th>";
      }).join("") + "</tr></thead><tbody>" + rows.map(function(r) {
        return "<tr>" + ks.map(function(k) {
          return "<td>" + String(r[k] == null ? "" : r[k]).replace(/</g, "&lt;") + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table>";
      LOG.loaded++;
    }
    if (fx) {
      render(fx);
      return;
    }
    if (typeof fetch === "function") {
      fetch(c.loadDetail.source + "?key=" + encodeURIComponent(row[key])).then(function(r) {
        return r.json();
      }).then(render).catch(function() {
      });
    }
  }
  function disableActions(c, row) {
    (c.disableActions || []).forEach(function(d) {
      var ctx = X.context();
      ctx["@row"] = row;
      var off = d.when ? R.eval(d.when, ctx) : false;
      var bs = document.querySelectorAll("#main .wl-actions button, #main .wl-btn, #wlMenu button");
      for (var i = 0; i < bs.length; i++) {
        var b = bs[i];
        if (b.getAttribute("data-act-id") === d.id || (b.textContent || "").indexOf(d.label || d.id) >= 0) {
          if (b.disabled !== !!off) b.disabled = !!off;
          if (off) LOG.disabled++;
        }
      }
    });
  }
  function onDblClick(e) {
    var c = cfg();
    if (!c || c.on !== "dblclick") return;
    var tr = e.target && e.target.closest ? e.target.closest("#main tbody tr[data-i]") : null;
    if (!tr) return;
    var i = +tr.getAttribute("data-i"), row = {};
    try {
      row = W.TPL.rows()[i] || {};
    } catch (err) {
    }
    LOG.dblclicks++;
    LOG.lastRow = row;
    W.__WL_EXT_ROW__ = row;
    var p = panel();
    p.classList.add("on");
    (c.fill || []).forEach(function(f) {
      var t = ensureTarget(f.to);
      var v = row[f.from];
      if (t.textContent !== String(v == null ? "" : v)) {
        t.textContent = String(v == null ? "" : v);
        LOG.fills++;
      }
      if (f.label) t.setAttribute("title", f.label);
    });
    if (c.show) {
      var s = ensureTarget(c.show);
      s.style.display = "";
    }
    loadDetail(c, row);
    disableActions(c, row);
    X.schedule();
  }
  document.addEventListener("dblclick", onDblClick, false);
  try {
    var T = W.TPL, rawView = T._view;
    T._view = function() {
      var r = rawView.apply(T, arguments);
      var p = document.getElementById("wlExtRowPanel");
      if (p) {
        p.classList.remove("on");
        p.innerHTML = "";
      }
      W.__WL_EXT_ROW__ = {};
      return r;
    };
  } catch (e) {
  }
  W.__WL_EXT_T6__ = function() {
    var c = cfg() || {};
    return {
      active: active(),
      on: c.on || null,
      fills: (c.fill || []).length,
      hasLoadDetail: !!c.loadDetail,
      log: {
        dblclicks: LOG.dblclicks,
        fills: LOG.fills,
        loaded: LOG.loaded,
        disabled: LOG.disabled,
        lastRowKeys: LOG.lastRow ? Object.keys(LOG.lastRow).slice(0, 8) : []
      }
    };
  };
})();
(function() {
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T7__) return;
  var LOG = {
    numbers: 0,
    dateRanges: 0,
    exists: 0,
    summaries: 0,
    hidden: 0,
    panels: 0,
    actionParams: []
  };
  function extCfg() {
    return X.ext();
  }
  function detail() {
    var e = extCfg(), o = e.detail || {};
    return o;
  }
  function active() {
    var e = extCfg(), d = e.detail || {}, S = X.schema();
    if (e.filters && Object.keys(e.filters).length) return true;
    if (d.summaries || d.hiddenCols) return true;
    if (Object.keys(e.panels || {}).length) return true;
    var gs = (S && S.detail || {}).groups || [];
    for (var i = 0; i < gs.length; i++) {
      var fs = gs[i].fields || [];
      for (var j = 0; j < fs.length; j++) if (fs[j].control === "number" || fs[j].type === "number") return true;
    }
    var fl = (S && S.list || {}).filters || [];
    for (var k = 0; k < fl.length; k++) if (fl[k].type === "dateRange" || fl[k].type === "exists") return true;
    if (e.fields) {
      for (var f in e.fields) if (e.fields[f].control === "number") return true;
    }
    return false;
  }
  X.active(active);
  function numberFields() {
    var S = X.schema(), out = {}, e = extCfg();
    Object.keys(e.fields || {}).forEach(function(k) {
      if (e.fields[k].control === "number") out[k] = e.fields[k];
    });
    var gs = (S && S.detail || {}).groups || [];
    gs.forEach(function(g) {
      (g.fields || []).forEach(function(f) {
        if (f.control === "number" || f.type === "number") out[f.k] = f;
      });
    });
    return out;
  }
  function applyNumbers() {
    var f = numberFields(), roots = [document.getElementById("drawer"), document.getElementById("formWin")];
    roots.forEach(function(root) {
      if (!root) return;
      Object.keys(f).forEach(function(k) {
        var el = root.querySelector('[data-k="' + k + '"]');
        if (!el || el.tagName !== "INPUT") return;
        if (el.type !== "number") {
          el.type = "number";
          el.step = "any";
          LOG.numbers++;
        }
        var spec = f[k];
        if (spec.min !== void 0) el.min = spec.min;
        if (spec.max !== void 0) el.max = spec.max;
      });
    });
  }
  W.__WL_EXT_SEARCH_PARAMS__ = {};
  function filterDefs() {
    var S = X.schema(), out = [];
    ((S && S.list || {}).filters || []).forEach(function(f) {
      if (f.type === "dateRange" || f.type === "exists") out.push(f);
    });
    var e = extCfg();
    Object.keys(e.filters || {}).forEach(function(k) {
      out.push(Object.assign({ k }, e.filters[k]));
    });
    return out;
  }
  function syncSearchParams() {
    var p = W.__WL_EXT_SEARCH_PARAMS__;
    document.querySelectorAll("[data-wl-range]").forEach(function(el) {
      var k = el.getAttribute("data-wl-range"), which = el.getAttribute("data-wl-which");
      p[k + (which === "to" ? "To" : "From")] = el.value;
    });
    document.querySelectorAll("[data-wl-exists]").forEach(function(el) {
      p[el.getAttribute("data-wl-exists")] = el.value;
    });
    W.__WL_EXT_SEARCH_PARAMS_JSON__ = JSON.stringify(p);
  }
  function applyFilters() {
    filterDefs().forEach(function(f) {
      var el = document.getElementById("tplA_" + f.k) || document.querySelector('[data-k="' + f.k + '"]');
      if (!el) return;
      if (f.type === "dateRange") {
        if (el.getAttribute("data-wl-range") === f.k) return;
        el.type = "date";
        el.setAttribute("data-wl-range", f.k);
        el.setAttribute("data-wl-which", "from");
        var to = document.createElement("input");
        to.type = "date";
        to.className = el.className || "";
        to.setAttribute("data-wl-range", f.k);
        to.setAttribute("data-wl-which", "to");
        to.style.width = "130px";
        to.style.marginLeft = "4px";
        el.parentNode.insertBefore(document.createTextNode(" ~ "), el.nextSibling);
        el.parentNode.insertBefore(to, el.nextSibling.nextSibling || null);
        LOG.dateRanges++;
      } else if (f.type === "exists") {
        if (el.getAttribute("data-wl-exists") !== f.k) {
          el.setAttribute("data-wl-exists", f.k);
          LOG.exists++;
        }
      }
    });
  }
  document.addEventListener("change", function(e) {
    if (e.target && (e.target.hasAttribute("data-wl-range") || e.target.hasAttribute("data-wl-exists"))) syncSearchParams();
  }, false);
  function summaries() {
    var d = detail(), out = [];
    if (Array.isArray(d.summaries)) out = out.concat(d.summaries);
    try {
      (W.DETAIL.sections ? W.DETAIL.sections() : []).forEach(function(sec) {
        var sp = W.DETAIL.specOf(sec) || {};
        if (Array.isArray(sp.summaries)) out = out.concat(sp.summaries);
      });
    } catch (e) {
    }
    return out;
  }
  function applySummaries() {
    var ss = summaries();
    if (!ss.length) return;
    ss.forEach(function(s, i) {
      var bar = document.querySelector(".dt-wrap .dt-bar");
      if (!bar) return;
      var id = "wlExtSum" + i, el = document.getElementById(id);
      if (!el) {
        el = document.createElement("span");
        el.id = id;
        el.className = "dt-sum wl-ext-sum";
        bar.appendChild(el);
      }
      var rows = [];
      try {
        rows = W.DETAIL.rows(W.DETAIL.sections()[0]) || [];
      } catch (e) {
      }
      var v;
      try {
        v = W.__WL_FORMULA__.eval(s.formula, {}, rows, s.precision);
      } catch (e) {
        v = 0;
      }
      if (!isFinite(Number(v))) v = 0;
      var want = (s.label || "合计") + "：" + Number(v).toFixed(s.precision === void 0 ? 2 : s.precision);
      if (el.textContent !== want) {
        el.textContent = want;
        LOG.summaries++;
      }
      el.setAttribute("data-wl-sum-target", s.target || "");
      W.__WL_EXT_SUMMARIES__ = W.__WL_EXT_SUMMARIES__ || {};
      W.__WL_EXT_SUMMARIES__[s.target || i] = v;
    });
  }
  document.addEventListener("input", function(e) {
    if (e.target && e.target.dataset && e.target.dataset.col) applySummaries();
  }, false);
  function hiddenCols() {
    var d = detail(), out = [], ctx = X.context();
    if (Array.isArray(d.hiddenCols)) out = out.concat(d.hiddenCols);
    (Array.isArray(d.hiddenColsWhen) ? d.hiddenColsWhen : []).forEach(function(g) {
      if (R.eval(g.when, ctx)) out = out.concat(g.cols || []);
    });
    try {
      (W.DETAIL.sections ? W.DETAIL.sections() : []).forEach(function(sec) {
        var sp = W.DETAIL.specOf(sec) || {};
        if (Array.isArray(sp.hiddenCols)) out = out.concat(sp.hiddenCols);
      });
    } catch (e) {
    }
    return out;
  }
  function applyHidden() {
    var hs = hiddenCols();
    if (!hs.length) return;
    document.querySelectorAll(".dt-wrap").forEach(function(wrap) {
      var trs = wrap.querySelectorAll("tbody tr");
      Array.prototype.forEach.call(trs, function(tr) {
        Array.prototype.forEach.call(tr.children, function(td) {
          var cell = td.querySelector("[data-col], [data-ccol]");
          var k = cell ? cell.getAttribute("data-col") || cell.getAttribute("data-ccol") : "";
          if (k && hs.indexOf(k) >= 0) {
            if (td.style.display !== "none") {
              td.style.display = "none";
              LOG.hidden++;
            }
          }
        });
      });
      var first = wrap.querySelector("tbody tr");
      if (first) {
        var ths = wrap.querySelectorAll("thead th");
        Array.prototype.forEach.call(first.children, function(td, i) {
          if (td.style.display === "none" && ths[i] && ths[i].style.display !== "none")
            ths[i].style.display = "none";
        });
      }
    });
  }
  function openPanel(cfg, row) {
    var mask = document.getElementById("wlExtPanel");
    if (!mask) {
      mask = document.createElement("div");
      mask.id = "wlExtPanel";
      mask.className = "wl-ext-mask";
      document.body.appendChild(mask);
    }
    var fx = (extCfg().fixtures || {})[cfg.source] || cfg.rows || [];
    var rows = Array.isArray(fx) ? fx : fx.rows || [];
    var ks = rows.length ? Object.keys(rows[0]).filter(function(k) {
      return k.charAt(0) !== "_";
    }) : [];
    mask.innerHTML = '<div class="wl-ext-dlg wide"><div class="wl-ext-dlg-hd">' + (cfg.title || "只读查看") + '</div><div class="wl-ext-dlg-bd">' + (ks.length ? '<table class="wl-ext-mini"><thead><tr>' + ks.map(function(k) {
      return "<th>" + k + "</th>";
    }).join("") + "</tr></thead><tbody>" + rows.map(function(r) {
      return "<tr>" + ks.map(function(k) {
        return "<td>" + String(r[k] == null ? "" : r[k]).replace(/</g, "&lt;") + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody></table>" : "<em>暂无数据</em>") + '</div><div class="wl-ext-dlg-ft"><button data-wl="close">关闭</button></div></div>';
    mask.classList.add("on");
    LOG.panels++;
    mask.onclick = function(ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest("[data-wl]") : null;
      if (b && b.getAttribute("data-wl") === "close") {
        mask.classList.remove("on");
        mask.innerHTML = "";
      }
    };
  }
  document.addEventListener("click", function(e) {
    var b = e.target && e.target.closest ? e.target.closest('[onclick*="_actRun"]') : null;
    if (!b) return;
    var m = String(b.getAttribute("onclick") || "").match(/_actRun\(['"]([^'"]+)['"]/);
    if (!m) return;
    var id = m[1], S = X.schema(), ds = (S && S.actionSpec || {}).defaults || [];
    var a = ds.filter(function(x) {
      return x.id === id;
    })[0];
    if (!a) return;
    var row = X.currentRow();
    var params = String(a.params || "");
    Object.keys(row).forEach(function(k) {
      params = params.split("{" + k + "}").join(String(row[k]));
    });
    LOG.actionParams.push({ id, action: a.action, params, zone: a.zone });
    W.__WL_EXT_ACTION_PARAMS__ = LOG.actionParams.slice(-10);
    if (a.action === "openPanel" || (extCfg().panels || {})[id]) openPanel(Object.assign({ source: id }, (extCfg().panels || {})[id] || {}));
  }, true);
  X.on(function() {
    applyNumbers();
    applyFilters();
    applySummaries();
    applyHidden();
  });
  W.__WL_EXT_T7__ = function() {
    return { active: active(), log: {
      numberFields: Object.keys(numberFields()).length,
      appliedNumbers: LOG.numbers,
      dateRanges: LOG.dateRanges,
      exists: LOG.exists,
      summaries: summaries().length,
      renderedSummaries: LOG.summaries,
      hiddenCols: hiddenCols().length,
      hiddenCells: LOG.hidden,
      panels: LOG.panels,
      actionParams: LOG.actionParams.slice(-6),
      searchParams: W.__WL_EXT_SEARCH_PARAMS__,
      confirmInputs: W.__WL_EXT_CONFIRM_INPUT__ || {}
    } };
  };
  X.schedule();
})();
(function() {
  var W = window, D = document, VER = "2.0";
  var STYLE_ATTR = "data-wl-flow-help-style";
  var FIELD = {
    "spec.flow.enabled": "总开关。关闭后回车交回浏览器默认，不跳列、不增行。",
    "spec.flow.next": "唯一的流转配置：键 = 当前列 k，值 = 下一列 k。首列由链派生，链终点固定换行；改完点「保存并应用」生效。",
    "spec.flow.selectOnFocus": "三项只影响录入手感（全选 / 不滚动 / 保持位置），不影响是否换行。"
  };
  var SECTIONS = [
    { key: "spec.flow.enabled", no: "01", title: "总开关", sub: "是否接管回车键" },
    { key: "spec.flow.next", no: "02", title: "流转链", sub: "next · 唯一配置" },
    { key: "spec.flow.selectOnFocus", no: "03", title: "录入手感", sub: "聚焦与滚动" }
  ];
  var CARD = '<details class="wl-flow-help" data-wl-flow-help-card="1"><summary>规则速查 · 一次 Enter 怎么走<span>展开 / 收起</span></summary><div class="wl-flow-help-bd"><div class="wl-flow-steps"><span><i>1</i>开关关闭 → 不接管</span><span><i>2</i>写回当前值</span><span><i>3</i>选录列 → 开弹窗、不跳列</span><span><i>4</i>next 有映射 → 同行跳列</span><span><i>5</i>链终点 → 固定换行</span><span><i>6</i>游离列 → 按 seq 兜底，末位换行</span></div><p><b>换行写死</b>：优先复用下方整行空行，否则新增一行，焦点落新行首列。<b>弹窗</b>确定且回填有效时，以当前列为起点复用第 4–6 步；取消 / 关闭 / 校验失败则留在本列，不跳列、不增行、不写流转记录。</p><table class="wl-flow-tbl"><thead><tr><th>现象</th><th>先查什么</th></tr></thead><tbody><tr><td>末列回车不换行</td><td>末列是否被写进了 next 的键，或链是否成环</td></tr><tr><td>弹窗确定后没跳列</td><td>是否有有效回填；next 里有没有当前列</td></tr><tr><td>改了配置没生效</td><td>是否点了「保存并应用」</td></tr></tbody></table><p class="wl-flow-foot">完整规则见项目根目录《明细输入_键盘流转_设置说明书.md》。</p></div></details>';
  var CSS = [
    "#formWin .fw-card.wl-flow-redesign{border-color:#d9e2f5;",
    "  box-shadow:0 1px 3px rgba(31,58,122,.05)}",
    "#formWin .wl-flow-redesign > .fw-card-hd{background:linear-gradient(90deg,#f3f8ff,#fff);",
    "  border-bottom:1px solid #e3ebfa;padding:10px 14px}",
    "#formWin .wl-flow-redesign > .fw-card-hd b{font-size:12.5px;color:#1f3a7a;font-weight:600}",
    "#formWin .wl-flow-redesign > .fw-card-hd em{font-size:10.5px;color:#7b879b;font-style:normal}",
    "#formWin .wl-flow-chain{display:flex;align-items:center;gap:7px;flex-wrap:wrap;",
    "  padding:12px 14px;background:#f7faff;border-bottom:1px solid #e3ebfa}",
    "#formWin .wl-flow-chain .nd{display:inline-flex;align-items:center;gap:5px;",
    "  height:26px;padding:0 10px;border:1px solid #c9d8ee;border-radius:14px;",
    "  background:#fff;font:11.5px/1 ui-monospace,Menlo,Consolas,monospace;color:#40506b;",
    "  white-space:nowrap}",
    "#formWin .wl-flow-chain .nd.first{border-color:#9ad4b3;background:#effaf3;color:#1d7a45;font-weight:600}",
    "#formWin .wl-flow-chain .nd.tail{border-color:#a9c4f5;background:#eaf1ff;color:#0052d9;font-weight:600}",
    "#formWin .wl-flow-chain .nd.wrap{border-style:dashed;border-color:#b9c6da;",
    "  background:#fbfcfe;color:#6b7688;font-family:inherit}",
    "#formWin .wl-flow-chain .ar{color:#a6b3c8;font-size:12px;flex:0 0 auto}",
    "#formWin .wl-flow-chain .tip{margin-left:auto;font-size:10.5px;color:#7b879b;",
    "  white-space:nowrap}",
    "#formWin .wl-flow-chain .tip.ok{color:#1d7a45}",
    "#formWin .wl-flow-chain .tip.bad{color:#c2410c}",
    "#formWin .wl-flow-chain.err{padding:10px 14px;background:#fff8f2;",
    "  border-bottom:1px solid #f5d9a8;color:#a15c12;font-size:11.5px}",
    "#formWin .wl-flow-chain .lg{display:inline-flex;gap:9px;margin-left:6px;font-size:10px;",
    "  color:#8a94a6}",
    "#formWin .wl-flow-chain .lg i{font-style:normal}",
    "#formWin .wl-flow-sec{display:flex;align-items:center;gap:8px;padding:11px 14px 3px;",
    "  font-size:11px;font-weight:600;color:#1f3a7a}",
    "#formWin .wl-flow-sec i{display:inline-flex;align-items:center;justify-content:center;",
    "  width:19px;height:19px;border-radius:5px;background:#eaf1ff;color:#0052d9;",
    "  font:10px/1 ui-monospace,Menlo,Consolas,monospace;font-style:normal}",
    "#formWin .wl-flow-sec small{font-weight:400;color:#8a94a6;font-size:10.5px}",
    "#formWin .wl-flow-redesign .fw-f{display:grid;grid-template-columns:168px minmax(0,1fr);",
    '  grid-template-areas:"l r" "d d";gap:0 14px;align-items:start;',
    "  padding:7px 14px 10px;border-bottom:1px solid #f2f4f7}",
    "#formWin .wl-flow-redesign .fw-f-l{grid-area:l;flex:none;display:flex;",
    "  flex-direction:column;gap:3px;padding-top:3px}",
    "#formWin .wl-flow-redesign .fw-f-l b{font-size:11.5px;color:#20304a;font-weight:600}",
    "#formWin .wl-flow-redesign .fw-f-l code{font-size:10px;color:#8a94a6;background:none;padding:0}",
    "#formWin .wl-flow-redesign .fw-f-r{grid-area:r;display:flex;align-items:center;",
    "  gap:10px;flex-wrap:wrap;min-width:0}",
    "#formWin .wl-flow-redesign .fw-f-r .dtcfg-json{min-height:76px;font-size:11px;line-height:1.65}",
    "#formWin .wl-flow-redesign .fw-f > small{grid-area:d;display:block;margin-top:7px;",
    "  padding:5px 9px;border-left:2px solid #c9d8ee;background:#f8faff;",
    "  font-size:10.5px;line-height:1.6;color:#5b6779;white-space:normal}",
    "#formWin .wl-flow-redesign > .fw-hintbar{font-size:10.5px;color:#5b6779;",
    "  line-height:1.65;padding:8px 14px;background:#fcfdff;",
    "  border-top:1px dashed #e5e8ec}",
    "#formWin .wl-flow-redesign > .fw-hintbar code{background:#eef2f8;padding:0 3px;border-radius:2px}",
    "#formWin .wl-flow-help{margin:0 14px 13px;border:1px solid #dfe6f2;border-radius:6px;",
    "  background:#fff;overflow:hidden}",
    "#formWin .wl-flow-help > summary{cursor:pointer;padding:8px 12px;font-size:11.5px;",
    "  font-weight:600;color:#1f3a7a;background:#f7f9ff;list-style:none;",
    "  display:flex;align-items:center;gap:8px}",
    "#formWin .wl-flow-help > summary::-webkit-details-marker{display:none}",
    '#formWin .wl-flow-help > summary::before{content:"▸";font-size:10px;color:#0052d9}',
    '#formWin .wl-flow-help[open] > summary::before{content:"▾"}',
    "#formWin .wl-flow-help > summary span{margin-left:auto;font-weight:400;",
    "  font-size:10px;color:#8a94a6}",
    "#formWin .wl-flow-help-bd{padding:10px 12px 12px;font-size:11px;",
    "  line-height:1.7;color:#374151}",
    "#formWin .wl-flow-steps{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 10px}",
    "#formWin .wl-flow-steps span{display:inline-flex;align-items:center;gap:5px;",
    "  padding:4px 8px;border:1px solid #e3ebfa;border-radius:4px;background:#f8faff;",
    "  font-size:10.5px;color:#40506b}",
    "#formWin .wl-flow-steps i{display:inline-flex;align-items:center;justify-content:center;",
    "  width:15px;height:15px;border-radius:50%;background:#0052d9;color:#fff;",
    "  font:9px/1 ui-monospace,Menlo,Consolas,monospace;font-style:normal}",
    "#formWin .wl-flow-help-bd p{margin:6px 0}",
    "#formWin .wl-flow-help-bd b{color:#20304a}",
    "#formWin .wl-flow-tbl{width:100%;border-collapse:collapse;margin:6px 0;font-size:10.5px}",
    "#formWin .wl-flow-tbl th,#formWin .wl-flow-tbl td{border:1px solid #e3ebfa;",
    "  padding:4px 7px;text-align:left;vertical-align:top}",
    "#formWin .wl-flow-tbl th{background:#f3f8ff;color:#1f3a7a;font-weight:600}",
    "#formWin .wl-flow-foot{margin-top:8px;padding-top:7px;border-top:1px dashed #e3ebfa;",
    "  color:#8a94a6;font-size:10px}",
    "@media (max-width:1100px){",
    "  #formWin .wl-flow-redesign .fw-f{grid-template-columns:130px minmax(0,1fr)}",
    "  #formWin .wl-flow-chain .tip{margin-left:0;flex-basis:100%}",
    "}"
  ].join("\n");
  var ST = {
    installed: true,
    version: VER,
    runs: 0,
    rowsDecorated: 0,
    cardPresent: false,
    tab: "",
    chain: "",
    chainState: "",
    lastError: ""
  };
  W.__WL_FLOW_HELP__ = function() {
    return {
      installed: ST.installed,
      version: ST.version,
      runs: ST.runs,
      rowsDecorated: ST.rowsDecorated,
      cardPresent: ST.cardPresent,
      tab: ST.tab,
      chain: ST.chain,
      chainState: ST.chainState,
      schemaId: (function() {
        try {
          return W.TPL && W.TPL.schema && W.TPL.schema.id || "";
        } catch (e) {
          return "";
        }
      })(),
      lastError: ST.lastError
    };
  };
  function injectStyle() {
    if (D.querySelector("style[" + STYLE_ATTR + "]")) return;
    var s = D.createElement("style");
    s.setAttribute(STYLE_ATTR, "1");
    s.textContent = CSS;
    (D.head || D.documentElement).appendChild(s);
  }
  function flowCard(right) {
    var c = right.querySelector('.fw-card[data-dtcfg-tab="flow"]');
    if (c) return c;
    var all = right.querySelectorAll(".fw-card"), i;
    for (i = 0; i < all.length; i++) {
      var hd = all[i].querySelector(".fw-card-hd");
      if (hd && /04\s*·\s*键盘流转/.test(hd.textContent || "")) return all[i];
    }
    return null;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function seqOf() {
    try {
      var cfg = W.TPL && W.TPL._formConfig ? W.TPL._formConfig() : null;
      if (!cfg) return [];
      var secs = cfg.layout && cfg.layout.sections || [], i, sec = null;
      for (i = 0; i < secs.length; i++) if (secs[i].renderer === "editable-table") {
        sec = secs[i];
        break;
      }
      if (!sec || !W.DETAIL) return [];
      var s = W.DETAIL.byId(sec.id), F = s ? W.DETAIL.flowSpec(s) : null;
      return F && F.seq || [];
    } catch (e) {
      return [];
    }
  }
  function parseChain(txt) {
    var N, err = "";
    try {
      N = JSON.parse(txt || "{}");
    } catch (e) {
      err = "JSON 格式错误";
    }
    if (!err && (!N || typeof N !== "object" || Object.prototype.toString.call(N) === "[object Array]"))
      err = "next 必须是 JSON 对象";
    if (err) return { state: "bad", msg: err, nodes: [], first: "", tail: "", chain: "" };
    var raw = {}, keys = Object.keys(N), i;
    for (i = 0; i < keys.length; i++) raw[keys[i]] = String(N[keys[i]] == null ? "" : N[keys[i]]);
    var seq = seqOf(), vals = keys.map(function(k2) {
      return raw[k2];
    });
    var first = "", tail = "", j;
    for (j = 0; j < keys.length; j++) if (vals.indexOf(keys[j]) < 0) {
      first = keys[j];
      break;
    }
    for (j = 0; j < vals.length; j++) if (keys.indexOf(vals[j]) < 0) {
      tail = vals[j];
      break;
    }
    var nodes = [], seen = {}, k = first, guard = 0, warn = "";
    while (k && !seen[k] && guard++ < keys.length + 3) {
      nodes.push(k);
      seen[k] = 1;
      k = raw[k] || "";
    }
    if (!nodes.length) {
      for (j = 0; j < vals.length; j++) if (!seen[vals[j]]) {
        nodes.push(vals[j]);
        seen[vals[j]] = 1;
        break;
      }
    }
    if (!first || !tail) warn = "链不完整：请检查键与值是否成对";
    if (seq.length) {
      for (j = 0; j < keys.length; j++) if (seq.indexOf(keys[j]) < 0 || seq.indexOf(raw[keys[j]]) < 0) {
        warn = "存在不在可编辑列（seq）里的键或目标，已忽略";
        break;
      }
    }
    return {
      state: warn ? "warn" : "ok",
      msg: warn || "链正常 · 末列固定换行",
      nodes,
      first,
      tail,
      chain: nodes.join(" → ")
    };
  }
  function chainHTML(c) {
    if (c.state === "bad")
      return '<div class="wl-flow-chain err">⚠ ' + esc(c.msg) + " —— 请检查逗号与引号；修正后上方链会实时刷新。</div>";
    var h = "", i, n;
    for (i = 0; i < c.nodes.length; i++) {
      n = c.nodes[i];
      var cls = "nd" + (n === c.first ? " first" : "") + (n === c.tail ? " tail" : "");
      if (i) h += '<span class="ar">→</span>';
      h += '<span class="' + cls + '">' + esc(n) + "</span>";
    }
    if (!h) h = '<span class="nd">（未配置映射）</span>';
    h += '<span class="ar">→</span><span class="nd wrap">↵ 换行 · 回新行首列</span>';
    h += '<span class="lg"><i>● 首列</i><i>● 链中</i><i>● 末列</i></span>';
    h += '<span class="tip ' + (c.state === "ok" ? "ok" : "bad") + '">' + (c.state === "ok" ? "✓ " : "⚠ ") + esc(c.msg) + "</span>";
    return '<div class="wl-flow-chain">' + h + "</div>";
  }
  function refreshChain(card) {
    var box = card.querySelector("[data-wl-flow-chain]");
    var ta = card.querySelector("textarea.dtcfg-json");
    if (!box || !ta) return;
    var c = parseChain(ta.value);
    ST.chain = c.chain;
    ST.chainState = c.state;
    var html = chainHTML(c), s = flowSig(html);
    if (box.getAttribute("data-wl-flow-sig") !== s) {
      writing = true;
      try {
        box.setAttribute("data-wl-flow-sig", s);
        box.innerHTML = html;
      } finally {
        writing = false;
      }
    }
    if (!ta.getAttribute("data-wl-flow-bind")) {
      ta.setAttribute("data-wl-flow-bind", "1");
      ta.addEventListener("input", function() {
        refreshChain(card);
      });
    }
  }
  function decorate(card, right) {
    card.classList.add("wl-flow-redesign");
    var hd = card.querySelector(".fw-card-hd"), em = hd && hd.querySelector("em");
    if (em && !em.getAttribute("data-wl-flow-hd")) {
      em.setAttribute("data-wl-flow-hd", "1");
      var seq = seqOf();
      em.textContent = "唯一配置 next · 可编辑列 " + (seq.length || "—") + " 个 · 末列固定换行";
    }
    var rows = right.querySelectorAll(".fw-f"), i, n = 0;
    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row.closest(".fw-card") !== card) continue;
      var codeEl = row.querySelector(".fw-f-l code");
      if (!codeEl) continue;
      var key = (codeEl.textContent || "").trim();
      if (!Object.prototype.hasOwnProperty.call(FIELD, key)) continue;
      var sm = row.querySelector(".fw-f-l small");
      if (!sm) {
        sm = D.createElement("small");
        row.querySelector(".fw-f-l").appendChild(sm);
      }
      if (sm.parentNode !== row) row.appendChild(sm);
      sm.innerHTML = FIELD[key];
      if (!row.previousElementSibling || !row.previousElementSibling.hasAttribute("data-wl-flow-sec")) {
        var S = null, j;
        for (j = 0; j < SECTIONS.length; j++) if (SECTIONS[j].key === key) {
          S = SECTIONS[j];
          break;
        }
        if (S) {
          var sec = D.createElement("div");
          sec.className = "wl-flow-sec";
          sec.setAttribute("data-wl-flow-sec", S.no);
          sec.innerHTML = "<i>" + S.no + "</i>" + esc(S.title) + "<small>" + esc(S.sub) + "</small>";
          card.insertBefore(sec, row);
        }
      }
      row.setAttribute("data-wl-flow-help", "1");
      n++;
    }
    ST.rowsDecorated = n;
    if (!card.querySelector("[data-wl-flow-chain]")) {
      var box = D.createElement("div");
      box.setAttribute("data-wl-flow-chain", "1");
      var firstRow = card.querySelector(".wl-flow-sec") || card.querySelector(".fw-f");
      card.insertBefore(box, firstRow || null);
    }
    var hb = card.querySelector(".fw-hintbar");
    if (hb && !hb.getAttribute("data-wl-flow-hint")) {
      hb.setAttribute("data-wl-flow-hint", "1");
      hb.innerHTML = "<b>行内</b> = next 映射链顺序；<b>末列</b> = 只作为值出现的列，回车固定换行（优先复用下方整行空行，否则新增行）。<b>游离列</b>按可编辑列顺序兜底。弹窗确定复用同一套流转，取消留本列。";
    }
    if (!card.querySelector("[data-wl-flow-help-card]")) {
      var wrap = D.createElement("div");
      wrap.innerHTML = CARD;
      var node = wrap.firstElementChild;
      if (node) card.appendChild(node);
    }
    ST.cardPresent = !!card.querySelector("[data-wl-flow-help-card]");
    refreshChain(card);
  }
  function sync() {
    var win = D.getElementById("formWin");
    if (!win || !win.classList.contains("on")) {
      ST.tab = "";
      ST.cardPresent = false;
      ST.rowsDecorated = 0;
      ST.chain = "";
      return;
    }
    var right = D.getElementById("fwRight");
    if (!right) return;
    var card = flowCard(right);
    if (!card) {
      ST.tab = "";
      ST.cardPresent = false;
      ST.rowsDecorated = 0;
      ST.chain = "";
      return;
    }
    ST.runs++;
    ST.tab = right.getAttribute("data-dtcfg-ui") || win.getAttribute("data-dtcfg-ui") || "";
    if (!card.classList.contains("wl-flow-redesign")) decorate(card, right);
    else {
      ST.rowsDecorated = card.querySelectorAll(".fw-f[data-wl-flow-help]").length;
      ST.cardPresent = !!card.querySelector("[data-wl-flow-help-card]");
      refreshChain(card);
    }
  }
  var busy = false, raf = 0, mo = null, writing = false;
  function flowSig(s) {
    var h = 0, i;
    for (i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i) | 0;
    }
    return s.length + ":" + h;
  }
  function run() {
    if (busy) return;
    busy = true;
    try {
      sync();
    } catch (e) {
      ST.lastError = String(e);
    }
    busy = false;
  }
  function schedule() {
    if (raf) return;
    var tick = function() {
      raf = 0;
      if (mo) {
        try {
          mo.takeRecords();
        } catch (e) {
        }
      }
      run();
    };
    raf = W.requestAnimationFrame ? W.requestAnimationFrame(tick) : W.setTimeout(tick, 16);
  }
  injectStyle();
  if (W.MutationObserver) {
    try {
      mo = new MutationObserver(function() {
        if (!writing) schedule();
      });
      mo.observe(D.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "data-dtcfg-ui"]
      });
    } catch (e) {
      ST.lastError = String(e);
    }
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", run);
  else run();
  W.setTimeout(run, 0);
})();
(function() {
  var W = window, D = document, STYLE_ATTR = "data-wl-set-pos-style";
  var ST = {
    installed: true,
    version: "v12",
    runs: 0,
    placed: 0,
    fallback: 0,
    reason: "init",
    mode: "init",
    anchor: null,
    pager: null,
    lastError: ""
  };
  var CSS = [
    /* 顶栏落位：面板改为从胶囊下方、右对齐展开，避免被视口上沿裁掉 */
    '#wlSetSwitch[data-wl-set-pos="1"] .wlset-panel{top:44px!important;',
    "  bottom:auto!important;right:0!important;left:auto!important;transform:none!important}",
    '#wlSetSwitch[data-wl-set-pos="1"] .wlset-pill{white-space:nowrap}',
    "@media (max-width:900px){#wlSetSwitch .wlset-name{max-width:88px}}"
  ].join("\n");
  function injectStyle() {
    if (D.querySelector("style[" + STYLE_ATTR + "]")) return;
    var s = D.createElement("style");
    s.setAttribute(STYLE_ATTR, "1");
    s.textContent = CSS;
    (D.head || D.documentElement).appendChild(s);
  }
  function wrap() {
    return D.getElementById("wlSetSwitch");
  }
  function userChip() {
    return D.querySelector(".top-actions .user-chip");
  }
  function pager() {
    return D.getElementById("tplPager");
  }
  function clear(w) {
    if (!w) return;
    w.style.left = w.style.top = w.style.right = w.style.bottom = "";
    w.removeAttribute("data-wl-set-pos");
    ST.mode = "corner";
  }
  function apply(w, left, top, reason) {
    w.style.right = "auto";
    w.style.bottom = "auto";
    w.style.left = Math.round(left) + "px";
    w.style.top = Math.round(top) + "px";
    w.setAttribute("data-wl-set-pos", "1");
    ST.placed++;
    ST.reason = reason;
    ST.mode = "topbar";
  }
  function hitsTopbar(box) {
    var hdr = D.querySelector("header.topbar");
    if (!hdr) return false;
    var kids = [].slice.call(hdr.querySelectorAll(".logo,.crumb")), i, b;
    for (i = 0; i < kids.length; i++) {
      b = kids[i].getBoundingClientRect();
      if (!b.width || !b.height) continue;
      if (b.right > box.left && b.left < box.right && b.bottom > box.top && b.top < box.bottom) return true;
    }
    return false;
  }
  function place() {
    ST.runs++;
    var w = wrap(), u = userChip();
    if (!w) {
      ST.reason = "no-wrap";
      return;
    }
    var wW = w.offsetWidth, wH = w.offsetHeight;
    if (!wW || !wH) {
      ST.reason = "wrap-not-laid-out";
      return;
    }
    if (!u || !u.isConnected) {
      clear(w);
      ST.reason = "no-user-chip";
      ST.fallback++;
      return;
    }
    var r = u.getBoundingClientRect();
    if (!r.width || !r.height) {
      clear(w);
      ST.reason = "user-chip-hidden";
      ST.fallback++;
      return;
    }
    ST.anchor = {
      left: Math.round(r.left),
      top: Math.round(r.top),
      width: Math.round(r.width),
      height: Math.round(r.height),
      centerY: Math.round(r.top + r.height / 2)
    };
    var pg = pager();
    if (pg && pg.isConnected) {
      var pr = pg.getBoundingClientRect();
      ST.pager = {
        left: Math.round(pr.left),
        top: Math.round(pr.top),
        width: Math.round(pr.width),
        height: Math.round(pr.height),
        centerX: Math.round(pr.left + pr.width / 2),
        centerY: Math.round(pr.top + pr.height / 2)
      };
    }
    if (W.innerWidth < 760) {
      clear(w);
      ST.reason = "narrow";
      ST.fallback++;
      return;
    }
    var gap = 10, left = r.left - wW - gap, top = r.top + (r.height - wH) / 2;
    var box = { left, right: left + wW, top, bottom: top + wH };
    if (left < 8 || top < 0 || hitsTopbar(box)) {
      clear(w);
      ST.reason = "narrow-or-crowded";
      ST.fallback++;
      ST.mode = "corner";
      return;
    }
    apply(w, left, top, "topbar-left");
  }
  W.__WL_SET_POS__ = function() {
    var w = wrap(), pg = pager(), u = userChip(), out = {
      installed: ST.installed,
      version: ST.version,
      runs: ST.runs,
      placed: ST.placed,
      fallback: ST.fallback,
      reason: ST.reason,
      mode: ST.mode,
      anchor: ST.anchor,
      pager: ST.pager,
      inMain: !!(w && w.closest && w.closest("#main")),
      parent: w ? w.parentElement.tagName : null,
      cssNode: !!D.querySelector("style[" + STYLE_ATTR + "]"),
      lastError: ST.lastError
    };
    try {
      if (w) {
        var b = w.getBoundingClientRect();
        out.wrap = {
          left: Math.round(b.left),
          top: Math.round(b.top),
          width: Math.round(b.width),
          height: Math.round(b.height),
          right: Math.round(b.right),
          bottom: Math.round(b.bottom),
          centerX: Math.round(b.left + b.width / 2),
          centerY: Math.round(b.top + b.height / 2),
          position: getComputedStyle(w).position
        };
      }
      if (u) {
        var ur = u.getBoundingClientRect();
        out.userChip = {
          left: Math.round(ur.left),
          top: Math.round(ur.top),
          width: Math.round(ur.width),
          height: Math.round(ur.height),
          centerY: Math.round(ur.top + ur.height / 2)
        };
        if (out.wrap) out.gap = Math.round(ur.left - out.wrap.right);
      }
      if (pg) {
        var rr = pg.getBoundingClientRect();
        out.pagerNow = {
          centerX: Math.round(rr.left + rr.width / 2),
          centerY: Math.round(rr.top + rr.height / 2),
          width: Math.round(rr.width),
          height: Math.round(rr.height)
        };
      }
    } catch (e) {
      out.lastError = String(e);
    }
    return out;
  };
  var busy = false, raf = 0, mo = null;
  function run() {
    if (busy) return;
    busy = true;
    try {
      place();
    } catch (e) {
      ST.lastError = String(e);
    }
    busy = false;
  }
  function schedule() {
    if (raf) return;
    var tick = function() {
      raf = 0;
      if (mo) {
        try {
          mo.takeRecords();
        } catch (e) {
        }
      }
      run();
    };
    raf = W.requestAnimationFrame ? W.requestAnimationFrame(tick) : W.setTimeout(tick, 16);
  }
  injectStyle();
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", run);
  else run();
  W.setTimeout(run, 0);
  W.addEventListener("resize", schedule);
  W.addEventListener("scroll", schedule, true);
  if (W.MutationObserver) {
    try {
      mo = new MutationObserver(function() {
        schedule();
      });
      mo.observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    } catch (e) {
      ST.lastError = String(e);
    }
  }
})();
