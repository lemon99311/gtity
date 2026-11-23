

(function(){
  var W = window;
  if (W.__WL_EXT_CORE__) return;

  
  function get(field, ctx){
    if (!field) return undefined;
    var s = String(field);
    if (s.charAt(0) !== '@') return ctx[s];
    var dot = s.indexOf('.');
    if (dot < 0) return undefined;
    var ns = s.slice(1, dot), key = s.slice(dot + 1);
    var box = ctx['@' + ns];
    return box ? box[key] : undefined;
  }
  function num(v){ var n = Number(v); return isFinite(n) ? n : 0; }
  function atom(c, ctx){
    var a = get(c.field, ctx), b = c.value;
    switch (String(c.op || 'eq')) {
      case 'eq':       return String(a) === String(b);
      case 'ne':       return String(a) !== String(b);
      case 'gt':       return num(a) >  num(b);
      case 'ge':       return num(a) >= num(b);
      case 'lt':       return num(a) <  num(b);
      case 'le':       return num(a) <= num(b);
      case 'in':       return (Array.isArray(b) ? b : [b]).map(String).indexOf(String(a)) >= 0;
      case 'contains': return String(a == null ? '' : a).indexOf(String(b)) >= 0;
      case 'empty':    return a === '' || a == null || (Array.isArray(a) && !a.length);
      case 'notEmpty': return !(a === '' || a == null || (Array.isArray(a) && !a.length));
      case 'between':  return Array.isArray(b) && num(a) >= num(b[0]) && num(a) <= num(b[1]);
      default:         return false;
    }
  }
  function evalRule(c, ctx){
    if (!c) return true;
    if (Array.isArray(c.all)) return c.all.every(function(x){ return evalRule(x, ctx); });
    if (Array.isArray(c.any)) return c.any.some(function(x){ return evalRule(x, ctx); });
    if (c.not) return !evalRule(c.not, ctx);
    return atom(c, ctx || {});
  }
  
  function expr(s, row){
    var m = String(s || '').match(/^\s*([\w.@]+)\s*(>=|<=|==|!=|>|<)\s*([\w.@]+|-?\d+(?:\.\d+)?|'[^']*'|"[^"]*")\s*$/);
    if (!m) return false;
    var op = { '>':'gt', '<':'lt', '>=':'ge', '<=':'le', '==':'eq', '!=':'ne' }[m[2]];
    var rv = m[3].replace(/^['"]|['"]$/g, '');
    var lv = /^-?\d+(\.\d+)?$/.test(rv) ? Number(rv) : get(rv, row);
    return atom({ field: m[1], op: op, value: lv }, row);
  }
  W.__WL_RULE__ = { eval: evalRule, expr: expr, get: get, atom: atom };

  
  function schema(){ try { return W.TPL && W.TPL.schema; } catch (e) { return null; } }
  function ext(){
    var S = schema(); if (!S) return {};
    var fs = S.formSpec || {};
    var e  = fs.extension || {};                 
    return {
      active: !!fs.extension || !!fs.ruleSpec || !!fs.onLookup || !!fs.contextKeys,
      ruleSpec:   e.ruleSpec   || fs.ruleSpec   || {},
      contextKeys:e.contextKeys|| fs.contextKeys|| [],
      onLookup:   e.onLookup   || fs.onLookup   || null,
      fields:     e.fieldRules || {},           
      sections:   e.sectionRules || {},
      columns:    e.columnRules || {},
      actions:    e.actionRules || {},
      rowSelect:  e.rowSelect   || (S.pageSpec || {}).rowSelect || null,
      detail:     e.detailRules || e.detail || {},  
      filters:    e.filterRules || {},
      panels:     e.panels      || {},
      fixtures:   e.fixtures    || {},
      apiParams:  e.apiParams   || {}
    };
  }
  
  function fieldRule(k){
    var e = ext(), r = e.fields[k];
    if (r) return r;
    var S = schema(); if (!S) return null;
    var gs = ((S.detail || {}).groups) || [];
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
    } catch (e2) {}
    return null;
  }
  function columnRule(k){
    var e = ext(), r = e.columns[k];
    if (r) return r;
    var S = schema(); var cs = ((S && S.list) || {}).columns || [];
    for (var i = 0; i < cs.length; i++)
      if (cs[i].k === k && (cs[i].visibleIf || cs[i].rowStyle || cs[i].valueMap))
        return { visibleIf: cs[i].visibleIf, rowStyle: cs[i].rowStyle, valueMap: cs[i].valueMap };
    return null;
  }
  function actionRule(id, label){
    var e = ext(), r = e.actions[id] || e.actions[label];
    if (r) return r;
    var S = schema(); var ds = (((S && S.actionSpec) || {}).defaults) || [];
    for (var i = 0; i < ds.length; i++)
      if (ds[i].id === id || ds[i].label === label)
        if (ds[i].visibleIf || ds[i].confirm || ds[i].guard)
          return { visibleIf: ds[i].visibleIf, confirm: ds[i].confirm, guard: ds[i].guard };
    return null;
  }

  
  function formValues(){
    var o = {}, root = document.getElementById('drawer') || document.getElementById('formWin') || document.body;
    var els = root.querySelectorAll('[data-k]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], k = el.getAttribute('data-k');
      if (k && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'))
        o[k] = el.value;
    }
    return o;
  }
  function currentRow(){
    try {
      if (W.__WL_EXT_ROW__ && Object.keys(W.__WL_EXT_ROW__).length) return W.__WL_EXT_ROW__;
      var tr = document.querySelector('#main tbody tr.act-row') ||
               document.querySelector('#main tbody tr[data-i].row-active');
      if (!tr) return W.__WL_EXT_ROW__ || {};
      var i = +tr.getAttribute('data-i'), rows = W.TPL.rows ? W.TPL.rows() : [];
      return rows[i] || W.__WL_EXT_ROW__ || {};
    } catch (e) { return W.__WL_EXT_ROW__ || {}; }
  }
  function context(){
    var S = schema(), e = ext(), vals = formValues(), row = currentRow();
    var ctxBox = {}, keys = e.contextKeys || [];
    var injected = W.__WL_EXT_CTX__ || {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      ctxBox[k] = injected[k] !== undefined ? injected[k] :
                  (row[k] !== undefined ? row[k] : (vals[k] !== undefined ? vals[k] : (S && S[k])));
    }
    var c = {}; for (var v in vals) c[v] = vals[v];
    c['@ctx'] = ctxBox; c['@row'] = row;
    return c;
  }

  
  var handlers = [], acts = [], scheduled = false, mo = null;
  var OPTS = { childList: true, subtree: true };
  function replay(){
    try { for (var i = 0; i < handlers.length; i++) { try { handlers[i](); } catch (e) {} } } catch (e) {}
  }
  function schedule(){
    if (scheduled) return;
    scheduled = true;
    setTimeout(function(){
      scheduled = false;
      if (!acts.some(function(f){ try { return f(); } catch (e) { return false; } })) return;
      if (mo) mo.disconnect();
      try { replay(); } catch (e) {}
      if (mo) { try { mo.observe(document.body, OPTS); } catch (e) {} }
    }, 30);
  }
  function initObserver(){
    if (mo || !document.body || typeof MutationObserver === 'undefined') return;
    mo = new MutationObserver(function(){ schedule(); });
    
    try { mo.observe(document.body, OPTS); } catch (e) {}
  }
  
  ['_formOpen', '_vcOpen', '_view', '_redraw', '_open', '_drawerEdit'].forEach(function(k){
    try {
      var T = W.TPL; if (!T || typeof T[k] !== 'function') return;
      var raw = T[k];
      T[k] = function(){ var r = raw.apply(T, arguments); schedule(); return r; };
    } catch (e) {}
  });

  W.__WL_EXT__ = {
    on: function(fn){ handlers.push(fn); },
    active: function(fn){ acts.push(fn); },
    replay: replay, schedule: schedule,
    ext: ext, schema: schema,
    fieldRule: fieldRule, columnRule: columnRule, actionRule: actionRule,
    context: context, formValues: formValues, currentRow: currentRow,
    rule: W.__WL_RULE__,
    version: 'T1-T9/1.0'
  };
  W.__WL_EXT_CORE__ = function(){
    return { version: '1.0', handlers: handlers.length, activeChecks: acts.length,
             observer: !!mo, ruleSpec: Object.keys(ext().ruleSpec || {}).length };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initObserver);
  else initObserver();
})();
