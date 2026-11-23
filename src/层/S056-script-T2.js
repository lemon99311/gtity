

(function(){
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T2__) return;

  var LOG = { requests: [], fills: 0, options: 0, chains: 0, fallbacks: 0, hidden: 0 };
  function cfg(){ return X.ext().onLookup; }
  X.active(function(){ return !!(cfg() && cfg().trigger && cfg().trigger.field); });

  function resolveParams(params, ctx){
    var out = {}, e = X.ext();
    Object.keys(params || {}).forEach(function(k){
      var v = params[k];
      if (typeof v === 'string' && v.charAt(0) === '@') v = R.get(v, ctx);
      out[k] = v;
    });
    return out;
  }
  function fixtureFor(o){
    var fx = X.ext().fixtures || {};
    return fx[o.fixture || o.source] || null;
  }
  function request(o, params){
    LOG.requests.push({ source: o.source, params: params, fixture: !!fixtureFor(o) });
    var fx = fixtureFor(o);
    if (fx) return Promise.resolve(fx);                 
    if (typeof fetch !== 'function') return Promise.reject(new Error('no fetch'));
    var url = o.source;
    try {
      var q = Object.keys(params).map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
      if (q) url += (url.indexOf('?') >= 0 ? '&' : '?') + q;
    } catch (e) {}
    return fetch(url, { method: o.method || 'GET' }).then(function(r){ return r.json(); });
  }
  function findField(k){
    return document.querySelector('#drawer [data-k="' + k + '"], #formWin [data-k="' + k + '"]');
  }
  function put(k, v, hidden){
    var el = findField(k);
    if (!el) {
      
      var root = document.getElementById('drawer') || document.getElementById('formWin');
      if (!root) return;
      el = document.createElement('input');
      el.type = 'hidden'; el.setAttribute('data-k', k); el.setAttribute('data-wl-hidden-id', '1');
      root.appendChild(el); LOG.hidden++;
    }
    if (el.tagName === 'SELECT') {
      var opts = [].slice.call(el.options).map(function(x){ return x.value; });
      if (opts.indexOf(String(v)) < 0) {
        var op = document.createElement('option'); op.value = v; op.textContent = v; el.appendChild(op);
      }
      el.value = String(v);
    } else el.value = (v == null ? '' : String(v));
    if (hidden) el.setAttribute('data-wl-hidden-id', '1');
    LOG.fills++;
  }
  function setOptions(target, list){
    var el = findField(target); if (!el) return;
    var vals = (list || []).map(function(x){
      return (x && typeof x === 'object') ? (x.label !== undefined ? x.label : x.value) : x;
    });
    if (el.tagName === 'SELECT') {
      var keep = el.value;
      el.innerHTML = vals.map(function(v){ return '<option>' + String(v).replace(/</g, '&lt;') + '</option>'; }).join('');
      if (vals.indexOf(keep) >= 0) el.value = keep;
    } else if (el.tagName === 'INPUT') {
      var dl = document.getElementById('wlDl_' + target);
      if (!dl) { dl = document.createElement('datalist'); dl.id = 'wlDl_' + target; document.body.appendChild(dl); }
      dl.innerHTML = vals.map(function(v){ return '<option value="' + String(v).replace(/"/g, '&quot;') + '">'; }).join('');
      el.setAttribute('list', dl.id);
    }
    LOG.options++;
  }
  function apply(o, data){
    if (!data || typeof data !== 'object') return;
    (o.fill || []).forEach(function(f){ if (data[f.from] !== undefined) put(f.to, data[f.from]); });
    (o.setOptions || []).forEach(function(s){ setOptions(s.target, data[s.from]); });
    (o.defaults || []).forEach(function(d){
      var el = findField(d.target);
      if (el && (el.value === '' || el.value === undefined) && data[d.from] !== undefined) {
        el.value = String(data[d.from]);
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    if (o.valueField && data[o.valueField] !== undefined) put(o.valueField, data[o.valueField], true);
    W.__WL_EXT_LOOKUP_DATA__ = data;
    X.schedule();
  }
  function run(o, triggerEl){
    var ctx = X.context();
    var params = resolveParams(o.params, ctx);
    W.__WL_EXT_LAST_PARAMS__ = params;
    return request(o, params).then(function(data){ apply(o, data); })
      .catch(function(){ LOG.fallbacks++; });       
  }

  function onChange(e){
    var o = cfg(); if (!o || !o.trigger || !o.trigger.field) return;
    var el = e.target, k = el && el.getAttribute ? el.getAttribute('data-k') : null;
    if (k === o.trigger.field) { run(o, el); return; }
    (o.chain || []).forEach(function(c){
      if (c.when !== k || !W.__WL_EXT_LOOKUP_DATA__) return;
      (c.set || []).forEach(function(s){
        var v = W.__WL_EXT_LOOKUP_DATA__[s.from];
        if (v === undefined && s.by) {
          var hit = (W.__WL_EXT_LOOKUP_DATA__[s.by.array] || []).filter(function(x){
            return String(x[s.by.key]) === String(el.value);
          })[0];
          if (hit) v = hit[s.by.value];
        }
        if (v !== undefined) { put(s.to || s.col, v); LOG.chains++; }
      });
    });
  }
  document.addEventListener('change', onChange, true);

  
  W.__WL_EXT_DETAIL_MAP__ = function(secId, rk, data){
    try {
      var D = W.DETAIL, sec = D.byId(secId), sp = sec ? D.specOf(sec) : null;
      if (!sp) return 0;
      var map = (X.ext().onLookup || {}).detailMap || {};
      var n = 0;
      Object.keys(map).forEach(function(from){
        var col = map[from];
        if (data[from] === undefined) return;
        var c = sp.columns.filter(function(x){ return x.k === col; })[0];
        if (c) { D.setCell(secId, rk, col, data[from]); n++; }
      });
      var wrap = document.getElementById('dtw-' + secId);
      if (wrap) {
        Object.keys(map).forEach(function(from){
          var el = wrap.querySelector('tr[data-rk="' + rk + '"] [data-col="' + map[from] + '"]');
          if (el && data[from] !== undefined) el.value = String(data[from]);
        });
      }
      return n;
    } catch (err) { return 0; }
  };

  W.__WL_EXT_T2__ = function(){
    var o = cfg() || {};
    return { active: !!(o.trigger && o.trigger.field), log: {
      requests: LOG.requests.slice(), fills: LOG.fills, options: LOG.options,
      chains: LOG.chains, fallbacks: LOG.fallbacks, hiddenInputs: LOG.hidden },
      lastParams: W.__WL_EXT_LAST_PARAMS__ || null,
      hasData: !!W.__WL_EXT_LOOKUP_DATA__ };
  };
})();
