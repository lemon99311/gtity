

(function(){
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T4__) return;

  var LOG = { checks: 0, blocks: 0, zeros: 0, styled: 0, errors: [] };

  function specFor(secId){
    var e = X.ext(), out = { validators: [], rowStyle: [] };
    var agg = e.detail || {};
    if (Array.isArray(agg.validators)) out.validators = out.validators.concat(agg.validators);
    if (Array.isArray(agg.rowStyle))   out.rowStyle   = out.rowStyle.concat(agg.rowStyle);
    try {
      var D = W.DETAIL;
      (D.sections ? D.sections() : []).forEach(function(sec){
        if (secId && sec.id !== secId) return;
        var sp = D.specOf(sec) || {};
        if (Array.isArray(sp.validators)) out.validators = out.validators.concat(sp.validators);
        if (Array.isArray(sp.rowStyle))   out.rowStyle   = out.rowStyle.concat(sp.rowStyle);
      });
    } catch (err) {}
    return out;
  }
  function active(){ var s = specFor(); return !!(s.validators.length || s.rowStyle.length); }
  X.active(active);

  function errBox(secId){
    return document.querySelector('#dtw-' + secId + ' .dt-err[data-err]') ||
           document.querySelector('.dt-err[data-err="' + secId + '"]');
  }
  function showErr(secId, msg, tr, col){
    var box = errBox(secId);
    if (box) { box.textContent = msg || ''; box.setAttribute('data-wl-err', msg || ''); }
    LOG.errors.push({ secId: secId, col: col, message: msg });
    if (tr && col) {
      var ipt = tr.querySelector('[data-col="' + col + '"]');
      if (ipt && ipt.focus) { try { ipt.focus(); } catch (e) {} }
    }
    X.schedule();
  }
  function clearErr(secId){
    var box = errBox(secId);
    if (box && box.getAttribute('data-wl-err')) { box.textContent = ''; box.removeAttribute('data-wl-err'); }
  }
  function nextRowFirst(tr){
    var n = tr && tr.nextElementSibling;
    while (n && n.tagName !== 'TR') n = n.nextElementSibling;
    if (!n) return;
    var ipt = n.querySelector('[data-col]');
    if (ipt && ipt.focus) { try { ipt.focus(); } catch (e) {} }
  }

  function validate(el){
    if (!active()) return;
    var col = el.dataset && el.dataset.col; if (!col) return;
    var wrap = el.closest ? el.closest('.dt-wrap') : null; if (!wrap) return;
    var secId = wrap.getAttribute('data-sec'), s = specFor(secId);
    var v = RULE_V(el), tr = el.closest ? el.closest('tr') : null;
    s.validators.forEach(function(vd){
      if (String(vd.col) !== String(col)) return;
      LOG.checks++;
      var raw = el.value, n = Number(raw), bad = null, zeroIt = false, skip = false;
      if (vd.required && (raw === '' || raw == null)) bad = vd.message || '该项为必填项';
      else if (raw !== '' && !isFinite(n)) bad = vd.message || '请输入有效数字';
      else if (raw !== '' && isFinite(n)) {
        
        if (n < 0 && vd.onNegative === 'zero') { zeroIt = true; bad = vd.message || '不能为负数'; }
        else if (vd.min !== undefined && (vd.excludeMin ? n <= Number(vd.min) : n < Number(vd.min))) {
          bad = vd.message || '数值超出允许范围';
        } else if (vd.max !== undefined && n > Number(vd.max)) bad = vd.message || '数值超出允许范围';
        if (!bad && n === 0 && vd.onZero === 'skipNext') skip = true;
      }
      if (bad) {
        LOG.blocks++;
        if (zeroIt) { el.value = '0'; LOG.zeros++; try { W.DETAIL.setCell(secId, tr ? tr.getAttribute('data-rk') : '', col, 0); } catch (e) {} }
        showErr(secId, bad, vd.focusCell ? tr : null, vd.focusCell ? col : null);
      } else if (skip) nextRowFirst(tr);
      else clearErr(secId);
    });
  }
  function RULE_V(el){ return el.value; }

  function styleRows(){
    var s = specFor(), D = W.DETAIL;
    if (!s.rowStyle.length || !D || !D.sections) return;
    D.sections().forEach(function(sec){
      var wrap = document.getElementById('dtw-' + sec.id); if (!wrap) return;
      var list = [];
      try { list = D.rows(sec) || []; } catch (e) {}
      var trs = wrap.querySelectorAll('tbody tr');
      Array.prototype.forEach.call(trs, function(tr, i){
        var row = list[i] || {}, cls = '';
        for (var j = 0; j < s.rowStyle.length; j++) {
          var rs = s.rowStyle[j];
          if (rs.when && R.expr(rs.when, row)) { cls = rs['class'] || rs.cls || ''; break; }
        }
        ['dt-row-green', 'dt-row-red', 'dt-row-black'].forEach(function(c){ tr.classList.remove(c); });
        if (cls) { tr.classList.add(cls); LOG.styled++; }
      });
    });
  }
  document.addEventListener('change', function(e){
    if (!active()) return;
    if (e.target && e.target.dataset && e.target.dataset.col) validate(e.target);
    styleRows();
  }, false);
  X.on(styleRows);

  W.__WL_EXT_T4__ = function(){
    return { active: active(), validators: specFor().validators.length,
             rowStyles: specFor().rowStyle.length,
             log: { checks: LOG.checks, blocks: LOG.blocks, zeros: LOG.zeros, styled: LOG.styled,
                    errors: LOG.errors.slice(-6) },
             validateAll: function(){
               var n = 0;
               document.querySelectorAll('.dt-wrap .dt-ipt[data-col]').forEach(function(el){ validate(el); n++; });
               return { checked: n, blocks: LOG.blocks };
             } };
  };
})();
