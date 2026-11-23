

(function(){
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T6__) return;

  var LOG = { dblclicks: 0, fills: 0, loaded: 0, disabled: 0, lastRow: null };
  function cfg(){
    var e = X.ext();
    return e.rowSelect || ((X.schema() && X.schema().pageSpec || {}).rowSelect) || null;
  }
  function active(){ var c = cfg(); return !!(c && c.on); }
  X.active(active);

  function panel(){
    var p = document.getElementById('wlExtRowPanel');
    if (!p) {
      p = document.createElement('div'); p.id = 'wlExtRowPanel'; p.className = 'wl-ext-rowpanel';
      document.body.appendChild(p);
    }
    return p;
  }
  function ensureTarget(sel){
    var t = sel ? document.querySelector(sel) : null;
    if (t) return t;
    var p = panel(), id = String(sel || '').replace(/^#/, '') || 'wlExtRowFill';
    var box = p.querySelector('#' + id);
    if (!box) { box = document.createElement('span'); box.id = id; p.appendChild(box); }
    return box;
  }
  function loadDetail(c, row){
    if (!c.loadDetail) return;
    var key = String(c.loadDetail.key || '').replace(/^@row\./, '');
    var fx = (X.ext().fixtures || {})[c.loadDetail.source] || null;
    var target = ensureTarget(c.loadDetail.target || c.show);
    function render(data){
      if (!data) return;
      var rows = Array.isArray(data) ? data : (data.rows || []);
      if (!rows.length) { target.innerHTML = '<em>暂无明细</em>'; return; }
      var ks = Object.keys(rows[0]).filter(function(k){ return k.charAt(0) !== '_'; });
      target.innerHTML = '<table class="wl-ext-mini"><thead><tr>' +
        ks.map(function(k){ return '<th>' + k + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function(r){ return '<tr>' + ks.map(function(k){ return '<td>' + String(r[k] == null ? '' : r[k]).replace(/</g, '&lt;') + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table>';
      LOG.loaded++;
    }
    if (fx) { render(fx); return; }
    if (typeof fetch === 'function') {
      fetch(c.loadDetail.source + '?key=' + encodeURIComponent(row[key]))
        .then(function(r){ return r.json(); }).then(render).catch(function(){});
    }
  }
  function disableActions(c, row){
    (c.disableActions || []).forEach(function(d){
      var ctx = X.context(); ctx['@row'] = row;
      var off = d.when ? R.eval(d.when, ctx) : false;
      var bs = document.querySelectorAll('#main .wl-actions button, #main .wl-btn, #wlMenu button');
      for (var i = 0; i < bs.length; i++) {
        var b = bs[i];
        if (b.getAttribute('data-act-id') === d.id || (b.textContent || '').indexOf(d.label || d.id) >= 0) {
          if (b.disabled !== !!off) b.disabled = !!off;
          if (off) LOG.disabled++;
        }
      }
    });
  }
  function onDblClick(e){
    var c = cfg(); if (!c || c.on !== 'dblclick') return;
    var tr = e.target && e.target.closest ? e.target.closest('#main tbody tr[data-i]') : null;
    if (!tr) return;
    var i = +tr.getAttribute('data-i'), row = {};
    try { row = W.TPL.rows()[i] || {}; } catch (err) {}
    LOG.dblclicks++; LOG.lastRow = row;
    W.__WL_EXT_ROW__ = row;
    var p = panel(); p.classList.add('on');
    (c.fill || []).forEach(function(f){
      var t = ensureTarget(f.to);
      var v = row[f.from];
      if (t.textContent !== String(v == null ? '' : v)) { t.textContent = String(v == null ? '' : v); LOG.fills++; }
      if (f.label) t.setAttribute('title', f.label);
    });
    if (c.show) { var s = ensureTarget(c.show); s.style.display = ''; }
    loadDetail(c, row);
    disableActions(c, row);
    X.schedule();
  }
  document.addEventListener('dblclick', onDblClick, false);
  
  try {
    var T = W.TPL, rawView = T._view;
    T._view = function(){
      var r = rawView.apply(T, arguments);
      var p = document.getElementById('wlExtRowPanel');
      if (p) { p.classList.remove('on'); p.innerHTML = ''; }
      W.__WL_EXT_ROW__ = {};
      return r;
    };
  } catch (e) {}

  W.__WL_EXT_T6__ = function(){
    var c = cfg() || {};
    return { active: active(), on: c.on || null,
             fills: (c.fill || []).length, hasLoadDetail: !!c.loadDetail,
             log: { dblclicks: LOG.dblclicks, fills: LOG.fills, loaded: LOG.loaded,
                    disabled: LOG.disabled, lastRowKeys: LOG.lastRow ? Object.keys(LOG.lastRow).slice(0, 8) : [] } };
  };
})();
