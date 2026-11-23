

(function(){
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T7__) return;

  var LOG = { numbers: 0, dateRanges: 0, exists: 0, summaries: 0, hidden: 0,
              panels: 0, actionParams: [], confirmInputs: 0 };
  function extCfg(){ return X.ext(); }
  function detail(){
    var e = extCfg(), o = e.detail || {};
    return o;
  }
  function active(){
    var e = extCfg(), d = e.detail || {}, S = X.schema();
    if (e.filters && Object.keys(e.filters).length) return true;
    if (d.summaries || d.hiddenCols) return true;
    if (Object.keys(e.panels || {}).length) return true;
    var gs = ((S && S.detail) || {}).groups || [];
    for (var i = 0; i < gs.length; i++) {
      var fs = gs[i].fields || [];
      for (var j = 0; j < fs.length; j++) if (fs[j].control === 'number' || fs[j].type === 'number') return true;
    }
    var fl = ((S && S.list) || {}).filters || [];
    for (var k = 0; k < fl.length; k++) if (fl[k].type === 'dateRange' || fl[k].type === 'exists') return true;
    if (e.fields) for (var f in e.fields) if (e.fields[f].control === 'number') return true;
    return false;
  }
  X.active(active);

  
  function numberFields(){
    var S = X.schema(), out = {}, e = extCfg();
    Object.keys(e.fields || {}).forEach(function(k){ if (e.fields[k].control === 'number') out[k] = e.fields[k]; });
    var gs = ((S && S.detail) || {}).groups || [];
    gs.forEach(function(g){ (g.fields || []).forEach(function(f){
      if (f.control === 'number' || f.type === 'number') out[f.k] = f;
    }); });
    return out;
  }
  function applyNumbers(){
    var f = numberFields(), roots = [document.getElementById('drawer'), document.getElementById('formWin')];
    roots.forEach(function(root){
      if (!root) return;
      Object.keys(f).forEach(function(k){
        var el = root.querySelector('[data-k="' + k + '"]');
        if (!el || el.tagName !== 'INPUT') return;
        if (el.type !== 'number') { el.type = 'number'; el.step = 'any'; LOG.numbers++; }
        var spec = f[k];
        if (spec.min !== undefined) el.min = spec.min;
        if (spec.max !== undefined) el.max = spec.max;
      });
    });
  }

  
  W.__WL_EXT_SEARCH_PARAMS__ = {};
  function filterDefs(){
    var S = X.schema(), out = [];
    (((S && S.list) || {}).filters || []).forEach(function(f){
      if (f.type === 'dateRange' || f.type === 'exists') out.push(f);
    });
    var e = extCfg();
    Object.keys(e.filters || {}).forEach(function(k){ out.push(Object.assign({ k: k }, e.filters[k])); });
    return out;
  }
  function syncSearchParams(){
    var p = W.__WL_EXT_SEARCH_PARAMS__;
    document.querySelectorAll('[data-wl-range]').forEach(function(el){
      var k = el.getAttribute('data-wl-range'), which = el.getAttribute('data-wl-which');
      p[k + (which === 'to' ? 'To' : 'From')] = el.value;
    });
    document.querySelectorAll('[data-wl-exists]').forEach(function(el){
      p[el.getAttribute('data-wl-exists')] = el.value;
    });
    W.__WL_EXT_SEARCH_PARAMS_JSON__ = JSON.stringify(p);
  }
  function applyFilters(){
    filterDefs().forEach(function(f){
      var el = document.getElementById('tplA_' + f.k) || document.querySelector('[data-k="' + f.k + '"]');
      if (!el) return;
      if (f.type === 'dateRange') {
        if (el.getAttribute('data-wl-range') === f.k) return;   
        el.type = 'date'; el.setAttribute('data-wl-range', f.k); el.setAttribute('data-wl-which', 'from');
        var to = document.createElement('input');
        to.type = 'date'; to.className = el.className || '';
        to.setAttribute('data-wl-range', f.k); to.setAttribute('data-wl-which', 'to');
        to.style.width = '130px'; to.style.marginLeft = '4px';
        el.parentNode.insertBefore(document.createTextNode(' ~ '), el.nextSibling);
        el.parentNode.insertBefore(to, el.nextSibling.nextSibling || null);
        LOG.dateRanges++;
      } else if (f.type === 'exists') {
        if (el.getAttribute('data-wl-exists') !== f.k) {
          el.setAttribute('data-wl-exists', f.k); LOG.exists++;
        }
      }
    });
  }
  document.addEventListener('change', function(e){
    if (e.target && (e.target.hasAttribute('data-wl-range') || e.target.hasAttribute('data-wl-exists'))) syncSearchParams();
  }, false);

  
  function summaries(){
    var d = detail(), out = [];
    if (Array.isArray(d.summaries)) out = out.concat(d.summaries);
    try {
      (W.DETAIL.sections ? W.DETAIL.sections() : []).forEach(function(sec){
        var sp = W.DETAIL.specOf(sec) || {};
        if (Array.isArray(sp.summaries)) out = out.concat(sp.summaries);
      });
    } catch (e) {}
    return out;
  }
  function applySummaries(){
    var ss = summaries(); if (!ss.length) return;
    ss.forEach(function(s, i){
      var bar = document.querySelector('.dt-wrap .dt-bar');
      if (!bar) return;
      var id = 'wlExtSum' + i, el = document.getElementById(id);
      if (!el) {
        el = document.createElement('span'); el.id = id; el.className = 'dt-sum wl-ext-sum';
        bar.appendChild(el);
      }
      var rows = [];
      try { rows = W.DETAIL.rows(W.DETAIL.sections()[0]) || []; } catch (e) {}
      var v;
      try { v = W.__WL_FORMULA__.eval(s.formula, {}, rows, s.precision); } catch (e) { v = 0; }
      if (!isFinite(Number(v))) v = 0;
      var want = (s.label || '合计') + '：' + Number(v).toFixed(s.precision === undefined ? 2 : s.precision);
      if (el.textContent !== want) { el.textContent = want; LOG.summaries++; }
      el.setAttribute('data-wl-sum-target', s.target || '');
      W.__WL_EXT_SUMMARIES__ = (W.__WL_EXT_SUMMARIES__ || {});
      W.__WL_EXT_SUMMARIES__[s.target || i] = v;
    });
  }
  document.addEventListener('input', function(e){ if (e.target && e.target.dataset && e.target.dataset.col) applySummaries(); }, false);

  
  function hiddenCols(){
    var d = detail(), out = [], ctx = X.context();
    if (Array.isArray(d.hiddenCols)) out = out.concat(d.hiddenCols);
    
    (Array.isArray(d.hiddenColsWhen) ? d.hiddenColsWhen : []).forEach(function(g){
      if (R.eval(g.when, ctx)) out = out.concat(g.cols || []);
    });
    try {
      (W.DETAIL.sections ? W.DETAIL.sections() : []).forEach(function(sec){
        var sp = W.DETAIL.specOf(sec) || {};
        if (Array.isArray(sp.hiddenCols)) out = out.concat(sp.hiddenCols);
      });
    } catch (e) {}
    return out;
  }
  function applyHidden(){
    var hs = hiddenCols(); if (!hs.length) return;
    document.querySelectorAll('.dt-wrap').forEach(function(wrap){
      var trs = wrap.querySelectorAll('tbody tr');
      Array.prototype.forEach.call(trs, function(tr){
        Array.prototype.forEach.call(tr.children, function(td){
          var cell = td.querySelector('[data-col], [data-ccol]');
          var k = cell ? (cell.getAttribute('data-col') || cell.getAttribute('data-ccol')) : '';
          if (k && hs.indexOf(k) >= 0) {
            if (td.style.display !== 'none') { td.style.display = 'none'; LOG.hidden++; }
          }
        });
      });
      
      var first = wrap.querySelector('tbody tr');
      if (first) {
        var ths = wrap.querySelectorAll('thead th');
        Array.prototype.forEach.call(first.children, function(td, i){
          if (td.style.display === 'none' && ths[i] && ths[i].style.display !== 'none')
            ths[i].style.display = 'none';
        });
      }
    });
  }

  
  function openPanel(cfg, row){
    var mask = document.getElementById('wlExtPanel');
    if (!mask) { mask = document.createElement('div'); mask.id = 'wlExtPanel'; mask.className = 'wl-ext-mask'; document.body.appendChild(mask); }
    var fx = (extCfg().fixtures || {})[cfg.source] || cfg.rows || [];
    var rows = Array.isArray(fx) ? fx : (fx.rows || []);
    var ks = rows.length ? Object.keys(rows[0]).filter(function(k){ return k.charAt(0) !== '_'; }) : [];
    mask.innerHTML = '<div class="wl-ext-dlg wide"><div class="wl-ext-dlg-hd">' + (cfg.title || '只读查看') + '</div>' +
      '<div class="wl-ext-dlg-bd">' + (ks.length ? '<table class="wl-ext-mini"><thead><tr>' +
        ks.map(function(k){ return '<th>' + k + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function(r){ return '<tr>' + ks.map(function(k){ return '<td>' + String(r[k] == null ? '' : r[k]).replace(/</g, '&lt;') + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table>' : '<em>暂无数据</em>') + '</div>' +
      '<div class="wl-ext-dlg-ft"><button data-wl="close">关闭</button></div></div>';
    mask.classList.add('on'); LOG.panels++;
    mask.onclick = function(ev){
      var b = ev.target && ev.target.closest ? ev.target.closest('[data-wl]') : null;
      if (b && b.getAttribute('data-wl') === 'close') { mask.classList.remove('on'); mask.innerHTML = ''; }
    };
  }
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('[onclick*="_actRun"]') : null;
    if (!b) return;
    var m = String(b.getAttribute('onclick') || '').match(/_actRun\(['"]([^'"]+)['"]/);
    if (!m) return;
    var id = m[1], S = X.schema(), ds = (((S && S.actionSpec) || {}).defaults) || [];
    var a = ds.filter(function(x){ return x.id === id; })[0];
    if (!a) return;
    var row = X.currentRow();
    var params = String(a.params || '');
    Object.keys(row).forEach(function(k){ params = params.split('{' + k + '}').join(String(row[k])); });
    LOG.actionParams.push({ id: id, action: a.action, params: params, zone: a.zone });
    W.__WL_EXT_ACTION_PARAMS__ = LOG.actionParams.slice(-10);
    if (a.action === 'openPanel' || (extCfg().panels || {})[id]) openPanel(Object.assign({ source: id }, (extCfg().panels || {})[id] || {}), row);
  }, true);

  X.on(function(){ applyNumbers(); applyFilters(); applySummaries(); applyHidden(); });
  W.__WL_EXT_T7__ = function(){
    return { active: active(), log: {
      numberFields: Object.keys(numberFields()).length, appliedNumbers: LOG.numbers,
      dateRanges: LOG.dateRanges, exists: LOG.exists,
      summaries: summaries().length, renderedSummaries: LOG.summaries,
      hiddenCols: hiddenCols().length, hiddenCells: LOG.hidden,
      panels: LOG.panels, actionParams: LOG.actionParams.slice(-6),
      searchParams: W.__WL_EXT_SEARCH_PARAMS__,
      confirmInputs: W.__WL_EXT_CONFIRM_INPUT__ || {} } };
  };
  X.schedule();
})();
