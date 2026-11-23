

(function(){
  var W = window, X = W.__WL_EXT__, R = W.__WL_RULE__;
  if (!X || W.__WL_EXT_T5__) return;

  var LOG = { guards: 0, confirms: 0, cancels: 0, contextOpens: 0, runs: [], inputValues: {} };
  function actions(){
    var S = X.schema(), ds = (((S && S.actionSpec) || {}).defaults) || [];
    return ds;
  }
  function find(id){
    var a = actions();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function ruleOf(id){
    var a = find(id), r = X.actionRule(id, a ? a.label : '');
    return r || null;
  }
  function menuActions(){
    var e = X.ext(), out = [];
    Object.keys(e.actions || {}).forEach(function(k){
      var r = e.actions[k];
      if (r && r.zone === 'contextMenu') out.push(Object.assign({ id: k, label: r.label || k }, r));
    });
    var S = X.schema(), ds = (((S && S.actionSpec) || {}).defaults) || [];
    ds.forEach(function(a){ if (a.zone === 'contextMenu' && !out.some(function(x){ return x.id === a.id; })) out.push(a); });
    return out;
  }
  function active(){
    var e = X.ext();
    if (Object.keys(e.actions || {}).length) return true;
    return actions().some(function(a){ return a.confirm || a.guard || a.zone === 'contextMenu'; });
  }
  X.active(active);

  
  function toast(msg){
    var t = document.getElementById('wlExtToast');
    if (!t) {
      t = document.createElement('div'); t.id = 'wlExtToast';
      t.className = 'wl-ext-toast'; document.body.appendChild(t);
    }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._tm); t._tm = setTimeout(function(){ t.classList.remove('on'); }, 2600);
  }
  W.__WL_EXT_TOAST__ = toast;

  
  function confirmBox(cfg, id, btn, raw, args){
    var mask = document.getElementById('wlExtConfirm');
    if (!mask) {
      mask = document.createElement('div'); mask.id = 'wlExtConfirm'; mask.className = 'wl-ext-mask';
      document.body.appendChild(mask);
    }
    var msg = String(cfg.message || '确定执行该操作吗？')
      .replace(/\[([^\]]+)\]/g, function(_, k){ var row = X.currentRow(); return row[k] === undefined ? '' : row[k]; });
    var hasInput = !!(cfg.input && cfg.input.key);
    mask.innerHTML = '<div class="wl-ext-dlg"><div class="wl-ext-dlg-hd">' + (cfg.title || '操作确认') + '</div>' +
      '<div class="wl-ext-dlg-bd">' + msg.replace(/</g, '&lt;') + '</div>' +
      (hasInput ? '<div class="wl-ext-dlg-in"><label>' + (cfg.input.label || '请输入') +
        '</label><input id="wlExtConfirmInput" placeholder="' + (cfg.input.placeholder || '') + '"></div>' : '') +
      '<div class="wl-ext-dlg-ft"><button data-wl="cancel">取消</button>' +
      '<button data-wl="ok" class="pri">确定</button></div></div>';
    mask.classList.add('on');
    LOG.confirms++;
    function close(){ mask.classList.remove('on'); mask.innerHTML = ''; }
    mask.onclick = function(ev){
      var b = ev.target && ev.target.closest ? ev.target.closest('[data-wl]') : null;
      if (!b) return;
      var act = b.getAttribute('data-wl');
      if (act === 'cancel') { LOG.cancels++; close(); return; }
      if (hasInput) {
        var v = (document.getElementById('wlExtConfirmInput') || {}).value || '';
        if (cfg.input.required && !v.trim()) { toast(cfg.input.emptyMessage || '输入不能为空'); return; }
        LOG.inputValues[cfg.input.key] = v;
        W.__WL_EXT_CONFIRM_INPUT__ = Object.assign({}, LOG.inputValues);
        if (cfg.input.payloadKey) {
          try { (W.__DB_PAYLOAD__ = W.__DB_PAYLOAD__ || {})[cfg.input.payloadKey] = v; } catch (e) {}
        }
      }
      close();
      try { raw.apply(W.TPL, args); } catch (e) {}
    };
  }

  
  try {
    var T = W.TPL, rawRun = T._actRun;
    T._actRun = function(id, btn){
      var r = ruleOf(id);
      if (r && r.guard) {
        var ctx = X.context();
        if (!R.eval(r.guard, ctx)) {
          LOG.guards++;
          toast((r.guard.message || '当前状态不允许该操作'));
          return undefined;
        }
      }
      if (r && r.confirm) {
        confirmBox(r.confirm, id, btn, rawRun, arguments);
        return undefined;
      }
      LOG.runs.push(id);
      return rawRun.apply(T, arguments);
    };
  } catch (e) {}

  
  var menu = null;
  function closeMenu(){ if (menu) { menu.remove(); menu = null; } }
  function openMenu(x, y, rowIndex){
    var list = menuActions(); if (!list.length) return;
    closeMenu();
    menu = document.createElement('div'); menu.className = 'wl-ext-ctx';
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
    menu.innerHTML = list.map(function(a){
      var r = X.actionRule(a.id, a.label) || {};
      var ctx = X.context(), on = r.visibleIf === undefined ? true : R.eval(r.visibleIf, ctx);
      return '<button data-id="' + a.id + '"' + (on ? '' : ' disabled title="当前状态不可用"') + '>' +
             String(a.label || a.id).replace(/</g, '&lt;') + '</button>';
    }).join('');
    document.body.appendChild(menu);
    LOG.contextOpens++;
    menu.addEventListener('click', function(ev){
      var b = ev.target && ev.target.closest ? ev.target.closest('[data-id]') : null;
      if (!b || b.disabled) return;
      var id = b.getAttribute('data-id');
      W.__WL_EXT_ROW__ = (function(){ try { return W.TPL.rows()[rowIndex] || {}; } catch (e) { return {}; } })();
      closeMenu();
      try { W.TPL._actRun(id); } catch (e) {}
    });
  }
  document.addEventListener('contextmenu', function(e){
    var tr = e.target && e.target.closest ? e.target.closest('#main tbody tr[data-i]') : null;
    if (!tr || !active()) return;
    if (!menuActions().length) return;
    e.preventDefault();
    openMenu(e.clientX, e.clientY, +tr.getAttribute('data-i'));
  }, false);
  document.addEventListener('click', function(e){
    if (menu && !menu.contains(e.target)) closeMenu();
  }, false);

  W.__WL_EXT_T5__ = function(){
    return { active: active(), contextMenuActions: menuActions().map(function(a){ return a.id + ':' + a.label; }),
             log: { guards: LOG.guards, confirms: LOG.confirms, cancels: LOG.cancels,
                    contextOpens: LOG.contextOpens, runs: LOG.runs.slice(-8),
                    inputValues: LOG.inputValues } };
  };
})();
