

(function(){
  var W = window, X = W.__WL_EXT__;
  if (!X || W.__WL_EXT_T3__) return;

  var LOG = { hits: 0, writes: 0, protected: 0, skips: 0, rules: 0 };

  function rulesFor(secId){
    var e = X.ext(), out = [];
    
    var agg = (e.detail || {}).recalc;
    if (Array.isArray(agg) && agg.length) {
      var g = { secId: secId || '*', rules: agg };
      out.push(g);
    }
    
    try {
      var D = W.DETAIL;
      (D.sections ? D.sections() : []).forEach(function(sec){
        var sp = D.specOf(sec) || {};
        if (Array.isArray(sp.recalc) && sp.recalc.length)
          out.push({ secId: sec.id, rules: sp.recalc });
      });
    } catch (err) {}
    return out;
  }
  function active(){
    return rulesFor().length > 0;
  }
  X.active(active);

  function sourceOf(rule, row){
    var sr = rule.sourceRef, out = {};
    if (!sr) return out;
    var fx = (X.ext().fixtures || {})[sr.from] || W.__WL_EXT_SOURCE__ || {};
    var rec = Array.isArray(fx) ? fx.filter(function(x){ return String(x[sr.keyField || 'PID']) === String(row[sr.key]); })[0] : fx;
    if (rec && sr.field !== undefined) out[sr.field] = rec[sr.field];
    if (sr.field === undefined && rec) for (var k in rec) out[k] = rec[k];
    return out;
  }
  function prep(formula, row, rows, source){
    var s = String(formula);
    Object.keys(source || {}).forEach(function(k){
      s = s.split('@source.' + k).join('(' + Number(source[k] || 0) + ')');
    });
    return s;
  }
  function safe(v){
    var n = Number(v);
    if (!isFinite(n)) { LOG.protected++; return 0; }
    return n;
  }
  function syncInputs(secId, rk, writes){
    var wrap = document.getElementById('dtw-' + secId); if (!wrap) return;
    var tr = wrap.querySelector('tr[data-rk="' + rk + '"]');
    if (!tr) return;
    Object.keys(writes).forEach(function(k){
      var ipt = tr.querySelector('[data-col="' + k + '"]');
      if (ipt && (ipt.tagName === 'INPUT' || ipt.tagName === 'SELECT')) {
        if (String(ipt.value) !== String(writes[k])) ipt.value = String(writes[k]);
      } else {
        var ro = tr.querySelector('[data-ccol="' + k + '"]');
        if (ro && String(ro.textContent) !== String(writes[k])) ro.textContent = String(writes[k]);
      }
    });
  }

  function onEdit(e){
    if (!active()) return;
    var el = e.target;
    if (!el || !el.dataset || !el.dataset.col) return;
    var wrap = el.closest ? el.closest('.dt-wrap') : null;
    if (!wrap) return;
    var secId = wrap.getAttribute('data-sec');
    var tr = el.closest ? el.closest('tr') : null;
    var rk = tr ? tr.getAttribute('data-rk') : '';
    var edited = el.dataset.col, D = W.DETAIL;
    if (!D || !D.row) return;
    var groups = rulesFor(secId).filter(function(g){ return g.secId === '*' || g.secId === secId; });
    if (!groups.length) return;

    groups.forEach(function(g){
      g.rules.forEach(function(rule){
        var when = rule.when || {};
        if (String(when.edited || '') !== String(edited)) { LOG.skips++; return; }
        LOG.hits++; LOG.rules = g.rules.length;
        var row = D.row(secId, rk);
        if (!row) return;
        
        var ctx = Object.assign({}, row);
        ctx[edited] = (el.type === 'number' || /^-?\d+(\.\d+)?$/.test(String(el.value)))
          ? Number(el.value) : el.value;
        var rows = [];
        try { rows = D.rows(D.byId(secId)) || []; } catch (er) {}
        var source = sourceOf(rule, row), writes = {};
        (rule.set || []).forEach(function(s){
          var f = prep(s.formula, ctx, rows, source);
          var v;
          try { v = W.__WL_FORMULA__.eval(f, ctx, rows, s.precision); }
          catch (err) { v = 0; }
          v = safe(v);
          
          try { D.setCell(secId, rk, s.col, v); } catch (err) {}
          writes[s.col] = v;
          LOG.writes++;
        });
        syncInputs(secId, rk, writes);
        W.__WL_EXT_RECALC_LAST__ = { secId: secId, rk: rk, edited: edited, writes: writes,
                                     source: source, dtCalc: W.__WL_DT_CALC__ || null };
      });
    });
  }
  
  document.addEventListener('input', onEdit, false);
  document.addEventListener('change', onEdit, false);

  W.__WL_EXT_T3__ = function(){
    return { active: active(), ruleGroups: rulesFor().length,
             log: { hits: LOG.hits, writes: LOG.writes, protected: LOG.protected, skips: LOG.skips },
             last: W.__WL_EXT_RECALC_LAST__ || null };
  };
})();
