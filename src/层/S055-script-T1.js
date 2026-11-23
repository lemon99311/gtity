

(function(){
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T1__) return;

  function rulesExist(){
    var e = X.ext();
    if (!e.active) return false;
    if (Object.keys(e.fields).length || Object.keys(e.sections).length ||
        Object.keys(e.columns).length || Object.keys(e.actions).length ||
        (e.ruleSpec && (e.ruleSpec.filterGroupVisibleIf || e.ruleSpec.auditMode))) return true;
    
    var S = X.schema(); if (!S) return false;
    var gs = ((S.detail || {}).groups) || [], cs = ((S.list || {}).columns) || [],
        ds = (((S.actionSpec || {}).defaults) || []);
    var i, j;
    for (i = 0; i < gs.length; i++) { var fs = gs[i].fields || [];
      for (j = 0; j < fs.length; j++) if (fs[j].visibleIf || fs[j].disabledWhen || fs[j].labelWhen) return true; }
    for (i = 0; i < cs.length; i++) if (cs[i].visibleIf) return true;
    for (i = 0; i < ds.length; i++) if (ds[i].visibleIf) return true;
    return false;
  }
  X.active(rulesExist);

  function setShow(box, on){
    if (!box) return;
    if (on) { if (box.style.display === 'none') box.style.display = ''; }
    else if (box.style.display !== 'none') box.style.display = 'none';
  }
  function setDisabled(ipt, on){
    if (!ipt) return;
    if (!!ipt.disabled !== !!on) ipt.disabled = !!on;
  }
  function setLabel(box, text){
    if (!box) return;
    var dt = box.querySelector ? box.querySelector('dt, label, .fi-label') : null;
    if (!dt) return;
    var orig = dt.getAttribute('data-wl-label');
    if (orig === null) dt.setAttribute('data-wl-label', dt.textContent);
    var want = (text === undefined || text === null || text === '') ?
               dt.getAttribute('data-wl-label') : String(text);
    if (dt.textContent !== want) dt.textContent = want;
  }
  function labelOf(lw, ctx){
    if (!Array.isArray(lw)) return undefined;
    for (var i = 0; i < lw.length; i++)
      if (R.eval(lw[i].when, ctx)) return lw[i].text;
    return undefined;
  }

  function fieldPass(){
    var ctx = X.context();
    var roots = [document.getElementById('drawer'), document.getElementById('formWin')];
    roots.forEach(function(root){
      if (!root) return;
      var els = root.querySelectorAll('[data-k]');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) continue;
        var k = el.getAttribute('data-k'), r = X.fieldRule(k);
        if (!r) continue;
        var box = el.closest ? (el.closest('.da-fld') || el.closest('.fi') || el.parentElement) : el.parentElement;
        if (r.visibleIf !== undefined) setShow(box, R.eval(r.visibleIf, ctx));
        if (r.disabledWhen !== undefined) setDisabled(el, R.eval(r.disabledWhen, ctx));
        if (r.labelWhen !== undefined) setLabel(box, labelOf(r.labelWhen, ctx));
      }
    });
  }
  function columnPass(){
    var ctx = X.context(), S = X.schema();
    var cols = ((S && S.list) || {}).columns || [];
    var idx = {};
    cols.forEach(function(c, i){ idx[c.k] = i; });
    
    var ths = document.querySelectorAll('#main thead th');
    cols.forEach(function(c, i){
      var r = X.columnRule(c.k), on = true;
      if (r && r.visibleIf !== undefined) on = R.eval(r.visibleIf, ctx);
      if (i < ths.length) setShow(ths[i], on);
      var tds = document.querySelectorAll('#main tbody td[data-c="' + c.k + '"]');
      for (var j = 0; j < tds.length; j++) setShow(tds[j], on);
    });
    
    cols.forEach(function(c){
      var r = X.columnRule(c.k);
      if (!r || !r.valueMap) return;
      var tds = document.querySelectorAll('#main tbody td[data-c="' + c.k + '"]');
      for (var j = 0; j < tds.length; j++) {
        var td = tds[j], orig = td.getAttribute('data-wl-vm');
        if (orig === null) { orig = td.textContent; td.setAttribute('data-wl-vm', orig); }
        var key = String(orig).trim(), want = r.valueMap[key];
        if (want === undefined) want = (r.valueMap['*'] !== undefined) ? r.valueMap['*'] : orig;
        if (td.textContent !== String(want)) td.textContent = String(want);
      }
    });
  }
  function sectionPass(){
    var ctx = X.context(), e = X.ext();
    Object.keys(e.sections).forEach(function(id){
      var r = e.sections[id], box = document.querySelector('[data-sec="' + id + '"]');
      if (box && r && r.visibleIf !== undefined) setShow(box, R.eval(r.visibleIf, ctx));
    });
  }
  function actionPass(){
    var ctx = X.context();
    var btns = document.querySelectorAll('#main .wl-actions button, #wlMenu button, #main .wl-btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i], label = (b.textContent || '').trim();
      var r = X.actionRule(b.getAttribute('data-act-id') || '', label);
      
      if (r && r.visibleIf !== undefined) setShow(b, R.eval(r.visibleIf, ctx));
    }
  }
  function filterPass(){
    var e = X.ext(), rs = e.ruleSpec || {}, ctx = X.context();
    var bar = document.querySelector('#main .wl-filterbar') ||
              document.querySelector('#tplAdvWrap') || document.querySelector('#tplAdv');
    if (bar && rs.filterGroupVisibleIf !== undefined)
      setShow(bar, R.eval(rs.filterGroupVisibleIf, ctx));
    if (rs.auditMode && rs.auditMode.when) {
      var audit = R.eval(rs.auditMode.when, ctx);
      (rs.auditMode.hideActions || []).forEach(function(label){
        var bs = document.querySelectorAll('#main .wl-actions button, #main .wl-btn');
        for (var i = 0; i < bs.length; i++)
          if ((bs[i].textContent || '').indexOf(label) >= 0) setShow(bs[i], !audit);
      });
    }
  }

  X.on(function(){ fieldPass(); columnPass(); sectionPass(); actionPass(); filterPass(); });
  W.__WL_EXT_T1__ = function(){
    var hidden = { fields: 0, cols: 0, actions: 0 };
    var bs = document.querySelectorAll('.da-fld[style*="display: none"]'); hidden.fields = bs.length;
    document.querySelectorAll('#main thead th[style*="display: none"]').forEach(function(){ hidden.cols++; });
    document.querySelectorAll('#main .wl-actions button[style*="display: none"]').forEach(function(){ hidden.actions++; });
    return { active: rulesExist(), hidden: hidden, ruleSpec: X.ext().ruleSpec };
  };
  X.schedule();
})();
