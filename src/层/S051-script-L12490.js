

(function(){
  'use strict';
  var T=window.TPL, D=window.DETAIL;
  if(!T||!D)return;

  
  function ensureRowVisible(el){
    if(!el||!el.getAttribute||!el.getAttribute('data-col'))return;
    var wrap=el.closest?el.closest('.dt-wrap'):null; if(!wrap)return;
    var box=wrap.querySelector('.dt-tblbox'); if(!box)return;
    
    if(box.scrollHeight<=box.clientHeight+1)return;
    var tr=el.closest?el.closest('tbody tr'):null; if(!tr)return;
    var br=box.getBoundingClientRect(), rr=tr.getBoundingClientRect();
    var thead=wrap.querySelector('thead'), tfoot=wrap.querySelector('tfoot');
    var th=thead?thead.querySelector('th'):null, tf=tfoot?tfoot.querySelector('td'):null;
    
    var headH=(th&&getComputedStyle(th).position==='sticky')?thead.offsetHeight:0;
    var footH=(tf&&getComputedStyle(tf).position==='sticky')?tfoot.offsetHeight:0;
    var top=rr.top-br.top, bottom=rr.bottom-br.top;
    var hi=headH, lo=box.clientHeight-footH, delta=0;
    if(top<hi)delta=top-hi;                     
    else if(bottom>lo)delta=bottom-lo;          
    if(delta)box.scrollTop=box.scrollTop+delta; 
  }
  
  function recheck(){ try{ ensureRowVisible(document.activeElement); }catch(e){} }
  function scheduleRecheck(){
    if(window.requestAnimationFrame)window.requestAnimationFrame(recheck);
    setTimeout(recheck,0);
    setTimeout(recheck,80);
  }
  
  document.addEventListener('focusin',function(e){
    ensureRowVisible(e.target);
    scheduleRecheck();
  },true);

  
  function authoritativeSources(){
    try{
      var el=document.getElementById('tplSchema'); if(!el)return null;
      var s=JSON.parse(el.textContent);
      return (s&&s.formSpec&&s.formSpec.lookupSources)||null;
    }catch(e){ return null; }
  }
  
  var FALLBACK_LABEL={'/api/batchSale':'批号目录 · 销售出库（mock）',
                      '/api/batchReturn':'批号目录 · 销退入库（mock）'};
  function sourceLabels(){
    var out={}, src=authoritativeSources(), rt=null, k;
    try{ rt=(T._formSpec()||{}).lookupSources; }catch(e){}
    if(src)for(k in src)if(Object.prototype.hasOwnProperty.call(src,k))
      out[k]=(src[k]&&src[k].label)||k;
    if(rt)for(k in rt)if(Object.prototype.hasOwnProperty.call(rt,k)&&!out[k])
      out[k]=(rt[k]&&rt[k].label)||k;
    for(k in FALLBACK_LABEL)if(Object.prototype.hasOwnProperty.call(FALLBACK_LABEL,k)&&!out[k])
      out[k]=FALLBACK_LABEL[k];
    return out;
  }
  
  var pendingSource=null;
  function patchSourceSelects(){
    var sels=document.querySelectorAll('#formWin select[onchange*="lookupSource"],.dtcfg select[onchange*="lookupSource"]');
    if(!sels.length)return;
    var labels=sourceLabels(), keys=Object.keys(labels), i,j,s,have,o;
    for(i=0;i<sels.length;i++){
      s=sels[i]; have={};
      for(j=0;j<s.options.length;j++)have[s.options[j].value]=1;
      for(j=0;j<keys.length;j++){
        if(have[keys[j]])continue;                 
        o=document.createElement('option');
        o.value=keys[j]; o.textContent=labels[keys[j]];
        s.appendChild(o);
      }
      if(pendingSource&&pendingSource.i===i&&pendingSource.v&&s.value!==pendingSource.v)
        s.value=pendingSource.v;                   
    }
  }
  
  ['_formOpen','_formSel','_formLoadPreset','_dtCol','_dtColAdd','_dtColMove',
   '_dtColDel','_dtSpec','_dtSpecJSON','_dtFlowNext','_formSave'].forEach(function(k){
    if(typeof T[k]!=='function')return;
    var raw=T[k];
    T[k]=function(){
      if(k==='_dtCol'&&String(arguments[2])==='lookupSource')
        pendingSource={i:+arguments[1],v:String(arguments[3]||'')};
      var r=raw.apply(T,arguments);
      try{ patchSourceSelects(); }catch(e){}
      return r;
    };
  });
  
  if(typeof MutationObserver!=='undefined'){
    try{
      new MutationObserver(function(ms){
        if(document.querySelector('.dtcfg,#formWin .vc-col-detail'))patchSourceSelects();
        var hit=false,i,j,m,n;
        for(i=0;i<ms.length;i++){
          m=ms[i];
          if(m.type==='attributes'&&m.attributeName==='data-b7-max')hit=true;
          if(m.type==='childList'&&m.addedNodes){
            for(j=0;j<m.addedNodes.length;j++){
              n=m.addedNodes[j];
              if(!n||n.nodeType!==1)continue;
              if((n.classList&&n.classList.contains('dt-wrap'))||
                 (n.querySelector&&n.querySelector('.dt-tblbox'))){ hit=true; break; }
            }
          }
          if(hit)break;
        }
        if(hit)recheck();
      }).observe(document.documentElement,
        {childList:true,subtree:true,attributes:true,attributeFilter:['data-b7-max']});
    }catch(e){}
  }
  
  if(typeof T._formSpec==='function'){
    var rawFormSpec=T._formSpec;
    T._formSpec=function(){
      var o=rawFormSpec.call(T)||{}, src=authoritativeSources();
      if(!src)return o;
      if(!o.lookupSources||typeof o.lookupSources!=='object')o.lookupSources={};
      var merged={},k;
      for(k in src)if(Object.prototype.hasOwnProperty.call(src,k))merged[k]=src[k];
      for(k in o.lookupSources)if(Object.prototype.hasOwnProperty.call(o.lookupSources,k))
        merged[k]=o.lookupSources[k];
      o.lookupSources=merged;
      return o;
    };
  }

  
  function lockCell(e){
    var box=document.getElementById('dtLookup');
    if(!box||!box.classList.contains('on'))return;
    var t=e.target; if(!t||!t.closest)return;
    var td=t.closest('#dtLookup td'); if(!td)return;
    var inp=td.querySelector('input[data-ba],input[data-pb]');
    if(!inp||inp.disabled||inp.readOnly)return;   
    
    e.preventDefault();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation(); else e.stopPropagation();
    
    var row=td.closest('[data-lk="row"]');
    if(row){
      var trs=box.querySelectorAll('[data-lk="row"]');
      for(var i=0;i<trs.length;i++)trs[i].classList.toggle('on',trs[i]===row);
      var idx=+row.getAttribute('data-i');
      if(!isNaN(idx)){
        try{ if(D.lookupState)D.lookupState.active=idx; }catch(x){}
        var L=window.__WL_DT_LOOKUP__||{}; L.active=idx; window.__WL_DT_LOOKUP__=L;
      }
    }
    try{ inp.focus({preventScroll:true}); }catch(x){ try{ inp.focus(); }catch(x2){} }
    try{ if(inp.select)inp.select(); }catch(x){}
  }
  window.addEventListener('mousedown',lockCell,true);
  window.addEventListener('click',lockCell,true);

  
  var U={css:false,validateWrapped:false,lastValidate:null,blockedFocus:null,
         dedupe:0,droppedTriggerButtons:0};

  var UXCSS=[
  
  '#dtLookup.lg-batch .lg-pb-ipt{border:1px solid #dadee3}',
  '#dtLookup.lg-batch .lg-pb-ipt:hover{border-color:#b7c3d4}',
  '#dtLookup.lg-batch .lg-pb-ipt:focus{border-color:#0052d9;',
  '  box-shadow:0 0 0 2px rgba(0,82,217,.10)}',
  
  '#dtLookup.lg-batch table tbody tr:hover td:first-child,',
  '#dtLookup.lg-batch table tbody tr.act-row td:first-child,',
  '#dtLookup.lg-batch table tbody tr.act-row:hover td:first-child,',
  '#dtLookup.lg-batch table tbody tr.chk td:first-child,',
  '#dtLookup.lg-batch table tbody tr.chk:hover td:first-child,',
  '#dtLookup.lg-batch table thead tr:hover th:first-child{box-shadow:none!important}',
  '#dtLookup.lg-batch table tbody tr.chk:not(.ba-expired) td{background:#fff!important}',
  
  '#dtLookup.lg-batch .lg-pane{padding-left:0;padding-right:0}',
  '#dtLookup.lg-batch .lg-pane .lg-sec-title{padding:0 0 3px}',
  '#dtLookup.lg-batch .lg-pricebar .lg-sub,',
  '#dtLookup.lg-batch .lg-returnstock .lg-sub{width:100%}',
  '#dtLookup.lg-batch .lg-sub th,',
  '#dtLookup.lg-batch .lg-sub td{width:auto!important}',
  
  '#dtLookup.lg-batch .lg-tbl tbody tr.on:not(.ba-expired) td,',
  '#dtLookup.lg-batch .lg-tbl tbody tr.on:not(.ba-expired):hover td{',
  '  background:transparent;color:inherit;font-weight:400;box-shadow:none}',
  '#dtLookup.lg-batch .lg-tbl tbody tr.on.ba-expired td{',
  '  background:#f5f5f5;color:#9aa3af;font-weight:400;box-shadow:none}',
  
  '#drawer .dt-wrap .dt-ipt.lookup + button[data-act="lookup"]{display:none!important}',
  
  '#dtLookup.lg-batch .lg-hd .lg-cap{display:flex;align-items:center;',
  '  justify-content:space-between;gap:8px;padding:6px 10px;',
  '  white-space:nowrap;overflow:hidden;min-height:0}',
  '#dtLookup.lg-batch .lg-hd .lg-cap>span{min-width:0;overflow:hidden;',
  '  text-overflow:ellipsis;white-space:nowrap}',
  '#dtLookup.lg-batch .lg-hd .ba-mode{display:none}',
  '#dtLookup.lg-batch .lg-hd .lg-meta{flex:0 0 auto;white-space:nowrap;',
  '  font-size:9.5px;color:#909aaa}'
  ].join('\n');
  
  try{
    document.head.insertAdjacentHTML('beforeend',
      '<style data-b10-ux="1">'+UXCSS+'</style>');
    U.css=true;
  }catch(e){}

  
  
  function focusSupplyAfterBlock(){
    var box=document.getElementById('dtLookup');
    if(!box||!box.classList.contains('on')||!box.classList.contains('lg-batch'))return;
    var el=box.querySelector('input[data-pb="supply"]');
    if(!el||el.disabled||el.readOnly)
      el=box.querySelector('input[data-ba="alloc"]:not([disabled])');
    if(!el)return;
    try{ el.focus({preventScroll:true}); }catch(e){ try{ el.focus(); }catch(e2){} }
    try{ if(el.select)el.select(); }catch(e){}
    U.blockedFocus={at:Date.now(),dataPb:el.getAttribute('data-pb'),
      dataBa:el.getAttribute('data-ba')};
  }
  function wrapValidate(){
    var dec=window.__WL_B9_DECORATE__;
    if(!dec||typeof dec.validate!=='function'||dec.__b10Wrapped)return;
    var raw=dec.validate;
    dec.validate=function(){
      var r=raw.apply(this,arguments);
      U.lastValidate={ok:!!(r&&r.ok!==false),reason:r?r.reason:'',at:Date.now()};
      if(r&&r.ok===false){
        setTimeout(focusSupplyAfterBlock,0);       
        setTimeout(focusSupplyAfterBlock,80);      
      }
      return r;
    };
    dec.__b10Wrapped=1;
    U.validateWrapped=true;
  }
  wrapValidate();

  
  
  function dedupeLookup(){
    var box=document.getElementById('dtLookup');
    if(!box||!box.classList.contains('on'))return;
    var modern=box.querySelector('.lg-tbl,.lg-scroll,.lg-hd');
    var legacy=box.querySelectorAll('.dt-lk-hd,#dtLkKw,.dt-lk-list,.dt-lk-tip');
    if(modern&&legacy.length){
      for(var i=0;i<legacy.length;i++){
        if(legacy[i].parentNode===box){ box.removeChild(legacy[i]); U.dedupe++; }
      }
    }
    
    var pops=[].slice.call(document.querySelectorAll('body > div')).filter(function(e){
      return e!==box&&e.classList&&e.classList.contains('on')&&
        (e.querySelector('.dt-lk-list')||e.querySelector('.lg-tbl'));
    });
    for(var j=0;j<pops.length;j++){
      if(pops[j].parentNode){ pops[j].parentNode.removeChild(pops[j]); U.dedupe++; }
    }
  }

  
  function alignSubTables(){
    var box=document.getElementById('dtLookup');
    if(!box||!box.classList.contains('on')||!box.classList.contains('lg-batch'))return;
    var tbls=box.querySelectorAll('.lg-pricebar .lg-sub,.lg-returnstock .lg-sub'),t,i;
    for(t=0;t<tbls.length;t++){
      var tbl=tbls[t], cg=tbl.querySelector('colgroup'); if(!cg)continue;
      var cols=cg.querySelectorAll('col'), ws=[], sum=0, w;
      for(i=0;i<cols.length;i++){
        w=parseFloat(cols[i].getAttribute('data-b10-w'));
        if(!(w>0)){
          w=parseFloat(cols[i].style.width)||0;
          if(w>0)cols[i].setAttribute('data-b10-w',String(w));
        }
        ws.push(w>0?w:0); sum+=w>0?w:0;
      }
      if(!sum)continue;
      for(i=0;i<cols.length;i++)if(ws[i]>0)
        cols[i].style.width=(ws[i]/sum*100).toFixed(4)+'%';
      tbl.style.width='100%';
    }
  }

  
  if(typeof MutationObserver!=='undefined'){
    try{
      new MutationObserver(function(){
        try{ dedupeLookup(); alignSubTables(); }catch(e){}
      }).observe(document.documentElement,{childList:true,subtree:true});
    }catch(e){}
  }
  
  setTimeout(function(){ try{ dedupeLookup(); alignSubTables(); }catch(e){} },0);

  
  window.__WL_LOOKUP_UX__=function(){
    var box=document.getElementById('dtLookup');
    var panes=box?box.querySelectorAll('.lg-pricebar .lg-sub,.lg-returnstock .lg-sub'):[];
    var align=[],i,r;
    if(box){
      var m=box.querySelector('.lg-scroll .lg-tbl');
      if(m){ r=m.getBoundingClientRect(); align.push({name:'main',left:Math.round(r.left),right:Math.round(r.right)}); }
      for(i=0;i<panes.length;i++){
        r=panes[i].getBoundingClientRect();
        align.push({name:i===0?'pricebar':'returnstock',left:Math.round(r.left),right:Math.round(r.right)});
      }
    }
    return {
      version:'1.47.3',cssApplied:U.css,validateWrapped:U.validateWrapped,
      lastValidate:U.lastValidate?JSON.parse(JSON.stringify(U.lastValidate)):null,
      blockedFocus:U.blockedFocus?JSON.parse(JSON.stringify(U.blockedFocus)):null,
      dedupe:U.dedupe,
      droppedTriggerButtons:document.querySelectorAll(
        '#drawer .dt-wrap .dt-ipt.lookup + button[data-act="lookup"]').length,
      alignment:align,
      capHidden:!!(box&&box.querySelector('.lg-hd .ba-mode')&&
        getComputedStyle(box.querySelector('.lg-hd .ba-mode')).display==='none'),
      greenLineCancelled:!!(box&&box.querySelector('.lg-sub tbody tr td:first-child')&&
        getComputedStyle(box.querySelector('.lg-sub tbody tr td:first-child')).boxShadow==='none'),
      rowHighlightCancelled:!!(box&&box.querySelector('.lg-tbl tbody tr.on')&&
        getComputedStyle(box.querySelector('.lg-tbl tbody tr.on td')).backgroundColor==='rgba(0, 0, 0, 0)'),
      focusBack:FB.last?JSON.parse(JSON.stringify(FB.last)):null
    };
  };

  
  var FB={confirmed:false,count:0,last:null,skipped:0};
  function batchSource(source){
    if(!source)return false;
    var f=null,a=null,o;
    try{ f=(T._formSpec()||{}).lookupSources||{}; }catch(e){}
    try{ a=authoritativeSources()||{}; }catch(e){}
    o=(f&&f[source])||(a&&a[source]);
    return !!(o&&o.mode);
  }
  
  function sessionOf(st){
    if(!st)return null;
    var el=st.triggerEl, col='';
    try{ col=el&&el.getAttribute?String(el.getAttribute('data-col')||''):''; }catch(e){}
    if(!col&&st.col&&st.col.k)col=String(st.col.k);
    return {secId:String(st.triggerSec||st.secId||''),
            rk:String(st.triggerRk!=null?st.triggerRk:(st.rk||'')),
            col:col,source:String(st.source||''),trigger:el};
  }
  
  function focusBackNow(sess){
    var sec=null,F=null,sid=sess.secId,ok=false;
    try{ sec=D.byId(sess.secId)||(D.sections()[0]||null); }catch(e){}
    try{ F=D.flowSpec(sec||{}); }catch(e){}
    if(sec&&sec.id)sid=sec.id;
    try{ ok=!!D.focusCell(sid,sess.rk,sess.col,F); }catch(e){}
    if(!ok){
      try{
        var w=document.getElementById('dtw-'+sid),trs=w?w.querySelectorAll('tbody tr'):[],i,tr,el;
        for(i=0;i<trs.length;i++){
          if(trs[i].getAttribute('data-rk')===sess.rk){ tr=trs[i]; break; }
        }
        el=tr?[].slice.call(tr.querySelectorAll('[data-col]')).filter(function(x){
          return x.getAttribute('data-col')===sess.col; })[0]:null;
        if(!el&&sess.trigger&&sess.trigger.isConnected)el=sess.trigger;
        if(el&&!el.disabled&&!el.readOnly){
          try{ el.focus({preventScroll:true}); }catch(e2){ try{ el.focus(); }catch(e3){} }
          try{ if(el.select)el.select(); }catch(e2){}
          ok=true;
        }
      }catch(e){}
    }
    var a=document.activeElement;
    FB.last={secId:sid,rowKey:sess.rk,col:sess.col,source:sess.source,ok:ok,
      landed:{tag:a?a.tagName:'',col:(a&&a.getAttribute)?a.getAttribute('data-col'):null,
        inDrawer:!!(a&&a.closest&&a.closest('#drawer'))},at:Date.now()};
    return ok;
  }
  function atOrigin(sess){
    var a=document.activeElement;
    return !!(a&&a.getAttribute&&a.getAttribute('data-col')===sess.col&&
      a.closest&&a.closest('#drawer')&&
      a.closest('tbody tr')&&a.closest('tbody tr').getAttribute('data-rk')===sess.rk);
  }
  function scheduleFocusBack(sess){
    
    setTimeout(function(){ if(!atOrigin(sess))focusBackNow(sess); else FB.skipped++; },0);
    setTimeout(function(){ if(!atOrigin(sess))focusBackNow(sess); else FB.skipped++; },80);
    FB.count++;
  }

  
  if(typeof D.refresh==='function'){
    var rawRefreshFB=D.refresh;
    D.refresh=function(){
      var r=rawRefreshFB.apply(D,arguments);
      try{
        var st=D.lookupState;
        if(st&&batchSource(st.source))FB.confirmed=true;
      }catch(e){}
      return r;
    };
  }
  
  if(typeof D.lookupClose==='function'){
    var rawCloseFB=D.lookupClose;
    D.lookupClose=function(){
      var st=null,sess=null,confirmed=false,isBatch=false;
      try{ st=D.lookupState; }catch(e){}
      sess=sessionOf(st);
      isBatch=!!(sess&&batchSource(sess.source));
      confirmed=isBatch&&FB.confirmed;
      var ret=rawCloseFB.apply(D,arguments);      
      FB.confirmed=false;
      if(isBatch&&!confirmed&&sess&&sess.rk&&sess.col)
        scheduleFocusBack(sess);
      return ret;
    };
  }

  
  window.__WL_LOOKUP_FOCUS_BACK__=function(){
    return JSON.parse(JSON.stringify({version:'1.47.4',count:FB.count,
      skipped:FB.skipped,confirmed:FB.confirmed,last:FB.last}));
  };

  
  var CFG=(function(){
    var S={tab:'cols',sel:0,kw:'',hidden:{},seen:new WeakSet(),borrowed:[],
      rows:[],labels:[],secId:'',applies:0,stats:null,
      tabs:[{k:'base',t:'区块基础'},{k:'cols',t:'列定义'},
            {k:'data',t:'数据与汇总'},{k:'flow',t:'键盘流转'}]};
    
    var META={1:'k',2:'t',3:'w',4:'control',5:'calc',6:'formula',
              7:'precision',8:'lookupSource',9:'lookupMap'};
    var GROUPS=[
      {k:'base',no:'01',t:'基础信息',em:'全展示数据',fs:[1,2,4]},
      {k:'show',no:'02',t:'显示与排序',em:'按视图配置',fs:[3]},
      {k:'calc',no:'03',t:'计算与公式',em:'配置驱动',fs:[5,6,7]},
      {k:'look',no:'04',t:'选录回填',em:'配置驱动',fs:[8,9]}
    ];
    var CSS=[
    
    '#formWin .dtcfg-tabs{position:sticky;top:0;z-index:6;margin:0 -18px 12px;',
    '  padding:8px 18px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;',
    '  background:#fff;border-bottom:1px solid #e5e8ec;',
    '  box-shadow:0 2px 8px rgba(31,35,41,.05)}',
    '#formWin .dtcfg-tabs .dt-tab{height:26px;padding:0 13px;border:1px solid transparent;',
    '  border-radius:13px;background:#f4f6f9;color:#6e7b8c;font:inherit;font-size:11px;',
    '  cursor:pointer;white-space:nowrap}',
    '#formWin .dtcfg-tabs .dt-tab:hover{border-color:#c9d8ff;color:#0052d9}',
    '#formWin .dtcfg-tabs .dt-tab.on{background:#0052d9;border-color:#0052d9;',
    '  color:#fff;font-weight:600}',
    
    '#fwRight[data-dtcfg-ui] > .fw-card,',
    '#fwRight[data-dtcfg-ui] > .fw-hintbar{display:none}',
    '#fwRight[data-dtcfg-ui="base"] > .fw-card[data-dtcfg-tab="base"],',
    '#fwRight[data-dtcfg-ui="cols"] > .fw-card[data-dtcfg-tab="cols"],',
    '#fwRight[data-dtcfg-ui="data"] > .fw-card[data-dtcfg-tab="data"],',
    '#fwRight[data-dtcfg-ui="flow"] > .fw-card[data-dtcfg-tab="flow"],',
    '#fwRight[data-dtcfg-ui="base"] > .fw-hintbar{display:block}',
    '#fwRight[data-dtcfg-ui] > .fw-card{margin-top:0}',
    
    '#fwRight[data-dtcfg-ui="cols"] .dtcfg-wrap,',
    '#fwRight[data-dtcfg-ui="cols"] > .fw-card[data-dtcfg-tab="cols"] > .fw-acts,',
    '#fwRight[data-dtcfg-ui="cols"] > .fw-card[data-dtcfg-tab="cols"] > .fw-hintbar{display:none}',
    
    '#formWin .fw-card[data-dtcfg-tab="cols"] .vcb-bar{margin:10px 12px}',
    '#formWin .fw-card[data-dtcfg-tab="cols"] .vc-cols-main{height:min(556px,64vh);',
    '  margin:0 12px 12px}',
    '#formWin .vc-col-detail .vcd-f{align-items:center}',
    '#formWin .vcd-c > td{display:block;width:100%!important;padding:0!important;',
    '  border:0!important;min-width:0}',
    '#formWin .vcd-c > td > input,',
    '#formWin .vcd-c > td > select{width:100%;max-width:300px;height:27px;',
    '  box-sizing:border-box;padding:0 8px;border:1px solid #dadee3;border-radius:4px;',
    '  background:#fff;color:#2e405e;font:inherit;font-size:11.5px;outline:0}',
    '#formWin .vcd-c > td > input:focus,',
    '#formWin .vcd-c > td > select:focus{border-color:#b5c7ff;',
    '  box-shadow:0 0 0 2px rgba(0,82,217,.08)}',
    '#formWin .vcd-c > td > input[type=checkbox]{width:14px!important;height:14px!important;',
    '  max-width:none;accent-color:#0052d9;margin:5px 0}',
    '#formWin .vcd-ft > td{display:flex;align-items:center;gap:4px}',
    '#formWin .vcd-ft .mini{width:19px;height:19px;line-height:17px;padding:0;',
    '  text-align:center;border:1px solid #e2e6ea;background:#fff;border-radius:3px;',
    '  color:#6e7b8c;cursor:pointer;font-size:11px;font-family:inherit}',
    '#formWin .vcd-ft .mini:hover{border-color:#0052d9;color:#0052d9}',
    '#formWin .vcd-ro{display:inline-block;max-width:100%;padding:3px 7px;',
    '  background:#f5f6f8;border-radius:3px;font-size:10.5px;color:#0052d9;',
    '  font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-all}',
    '#formWin .vcd-ro.db{color:#6e7b8c}',
    '#formWin .vcd-f > label small{display:block;font-size:9.5px;color:#b0b8c4;',
    '  font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:400;margin-top:1px}'
    ].join('\n');
    var MARK='__DTCFG_V149__';

    
    var MARK2='__DTCFG_V151__';
    var CSS2=[
    /* 列定义特殊放大样式已取消：不再注入 flex 撑满 / 300px 侧栏 / 两列属性卡 /
       字号与输入框放宽等特化规则，列定义回归基础样式；弹窗尺寸保持 1120x760。 */
    '#formWin [data-dtcfg-nav-toggle]{display:none}'
    ].join('\n');
    function injectCSS2(){
      var st=document.querySelector('style[data-b10-ux=\"1\"]');
      if(!st){ st=document.createElement('style'); st.setAttribute('data-b10-ux','1');
        document.head.appendChild(st); }
      if(st.textContent.indexOf(MARK2)<0)
        st.appendChild(document.createTextNode('\n/*'+MARK2+'*/\n'+CSS2));
    }
    function injectCSS(){
      var st=document.querySelector('style[data-b10-ux="1"]');
      if(!st){ st=document.createElement('style'); st.setAttribute('data-b10-ux','1');
        document.head.appendChild(st); }
      if(st.textContent.indexOf(MARK)<0)
        st.appendChild(document.createTextNode('\n/*'+MARK+'*/\n'+CSS));
      injectCSS2();                        
    }
    
    function tdOf(tr,fi){
      if(!tr)return null;
      var own=tr.querySelector(':scope > td[data-fi="'+fi+'"]');
      if(own)return own;
      var right=document.getElementById('fwRight');
      var i=String(tr.getAttribute('data-row-i')||'');
      return right?right.querySelector('td[data-row-i="'+i+'"][data-fi="'+fi+'"]'):null;
    }
    function valOf(td){
      var e=td?td.querySelector('input,select,textarea'):null; if(!e)return '';
      if(e.tagName==='SELECT'){
        var o=e.options[e.selectedIndex]; return o?String(o.textContent||o.value||''):'';
      }
      return String(e.value||'');
    }
    function keyOf(td){
      var e=td?td.querySelector('select'):null; return e?String(e.value||''):'';
    }
    function cardTab(card){
      var b=card.querySelector('.fw-card-hd b'), t=b?String(b.textContent||''):'';
      if(/^01/.test(t))return 'base'; if(/^02/.test(t))return 'cols';
      if(/^03/.test(t))return 'data'; if(/^04/.test(t))return 'flow';
      return '';
    }
    function secIdOf(tbl){
      var e=tbl.querySelector('[onchange*="_dtCol("],[onclick*="_dtColAdd"]'), m;
      if(!e)return '';
      m=/_dtCol(?:Add)?\('([^']+)'/.exec(
        String(e.getAttribute('onchange')||e.getAttribute('onclick')||''));
      return m?m[1]:'';
    }
    function presetCols(){
      try{
        var el=document.getElementById('tplSchema'); if(!el)return [];
        return ((JSON.parse(el.textContent).formSpec||{}).detailPreset||{}).spec.columns||[];
      }catch(e){ return []; }
    }
    function badgeOf(i){
      try{
        var d=T._formDraft(), sec=((d||{}).layout||{}).sections.filter(function(x){
          return x.id===S.secId; })[0];
        var cur=JSON.stringify((sec.spec.columns||[])[i]), base=JSON.stringify(presetCols()[i]);
        return cur===base?{cls:'base',txt:'SCHEMA 默认'}:{cls:'ov',txt:'草稿已改'};
      }catch(e){ return {cls:'base',txt:'SCHEMA 默认'}; }
    }

    
    function makeBar(card){
      var bar=document.createElement('div');
      bar.className='vcb-bar'; bar.setAttribute('data-dtcfg-bar','1');
      bar.innerHTML='<div class="vcb-stats">'+
        [['shown','列已显示'],['width','合计宽度'],['edit','可编辑列'],
         ['lookup','选录列'],['formula','公式列'],['controls','可用控件']]
          .map(function(p){ return '<span class="vcb-stat"><b data-stat="'+p[0]+'"></b><span>'+p[1]+'</span></span>'; }).join('')+
        '</div><div class="vcb-acts">'+
        '<button class="vcb-btn" data-act="all">全选</button>'+
        '<button class="vcb-btn" data-act="editable">仅编辑列</button>'+
        '<button class="vcb-btn" data-act="defw">默认宽度</button>'+
        '<button class="vcb-btn" data-act="restore">恢复覆盖</button>'+
        '<button class="vcb-btn pri" data-act="json">查看生效 JSON</button>'+
        '</div>';
      
      var add=card.querySelector(':scope > .fw-acts button[onclick*="_dtColAdd"]');
      if(add){ add.classList.add('vcb-btn'); bar.querySelector('.vcb-acts').appendChild(add); }
      var acts=card.querySelector(':scope > .fw-acts');
      if(acts)acts.insertAdjacentElement('afterend',bar);
      else card.appendChild(bar);
      bar.addEventListener('click',function(e){
        var b=e.target&&e.target.closest?e.target.closest('[data-act]'):null;
        if(!b)return;
        var a=b.getAttribute('data-act'),i;
        if(a==='all'){ S.hidden={}; }
        else if(a==='editable'){
          S.hidden={};
          var ctls=[]; try{ ctls=((T._formSpec()||{}).detailControls||[]); }catch(err){}
          for(i=0;i<S.rows.length;i++){
            var ck=keyOf(tdOf(S.rows[i],4));
            var m=ctls.filter(function(x){ return x.key===ck; })[0];
            if(m&&m.editable===false)S.hidden[valOf(tdOf(S.rows[i],1))]=1;
          }
        }
        else if(a==='defw'){
          try{
            var d=T._formDraft(), sec=((d||{}).layout||{}).sections.filter(function(x){
              return x.id===S.secId; })[0];
            var sp=JSON.parse(JSON.stringify(sec.spec));
            (sp.columns||[]).forEach(function(c){ c.w=90; });
            T._dtSpecJSON(S.secId,JSON.stringify(sp));
          }catch(err){}
          return;                                   
        }
        else if(a==='restore'){ S.hidden={}; S.kw=''; var f=S.side.querySelector('.vcs-search input'); if(f)f.value=''; }
        else if(a==='json'){ T._formJSON(); return; }
        buildList(); syncStats();
      });
      return bar;
    }

    
    function makeMain(card,bar){
      var main=document.createElement('div');
      main.className='vc-cols-main'; main.setAttribute('data-dtcfg-main','1');
      main.innerHTML='<div class="vc-cols-side">'+
        '<div class="vcs-hd"><span>列清单</span><em data-dtcfg-n></em></div>'+
        '<div class="vcs-search"><input type="text" placeholder="搜索列名 / 字段名…"></div>'+
        '<div class="vc-col-list"></div></div>'+
        '<div class="vc-col-detail"></div>';
      bar.insertAdjacentElement('afterend',main);
      S.side=main.querySelector('.vc-cols-side');
      S.list=main.querySelector('.vc-col-list');
      S.detail=main.querySelector('.vc-col-detail');
      var kw=S.side.querySelector('.vcs-search input');
      kw.value=S.kw;
      kw.addEventListener('input',function(){ S.kw=String(kw.value||''); buildList(); syncStats(); });
      S.list.addEventListener('click',function(e){
        var r=e.target&&e.target.closest?e.target.closest('.vc-crow'):null; if(!r)return;
        var mv=e.target.closest('[data-mv]');
        if(mv){
          e.stopPropagation();
          T._dtColMove(S.secId,+r.getAttribute('data-i'),+mv.getAttribute('data-mv'));
          return;                                  
        }
        if(e.target.classList&&e.target.classList.contains('ck'))return;
        select(+r.getAttribute('data-i'));
      });
      S.list.addEventListener('change',function(e){
        if(!e.target.classList||!e.target.classList.contains('ck'))return;
        var r=e.target.closest('.vc-crow'), k=r.getAttribute('data-k');
        if(e.target.checked)delete S.hidden[k]; else S.hidden[k]=1;
        buildList(); syncStats();
      });
      return main;
    }
    function buildList(){
      if(!S.list)return;
      var q=String(S.kw||'').trim().toLowerCase(), htmlFrag=[], on=[], off=[], i, tr;
      for(i=0;i<S.rows.length;i++){
        tr=S.rows[i];
        var k=valOf(tdOf(tr,1)), t=valOf(tdOf(tr,2)), w=valOf(tdOf(tr,3)),
            ctl=valOf(tdOf(tr,4)), hidden=!!S.hidden[k];
        var hit=!q||(t+k+ctl).toLowerCase().indexOf(q)>=0;
        if(!hit)continue;
        var row=document.createElement('div');
        row.className='vc-crow '+(hidden?'off ':'on ')+(i===S.sel?'sel':'');
        row.setAttribute('data-i',String(i)); row.setAttribute('data-k',k);
        row.innerHTML='<input class="ck" type="checkbox"><span class="ix"></span>'+
          '<span class="tx"><b></b><i></i></span><span class="w"></span>'+
          '<span class="mv"><button class="vc-mini" data-mv="-1" title="上移">↑</button>'+
          '<button class="vc-mini" data-mv="1" title="下移">↓</button></span>';
        row.querySelector('.ck').checked=!hidden;
        row.querySelector('.ck').title=hidden?'点击移到已显示':'点击移到未显示';
        row.querySelector('.ix').textContent=hidden?'—':String(i+1);
        row.querySelector('.tx b').textContent=t||('列 '+(i+1));
        row.querySelector('.tx i').textContent=k;
        row.querySelector('.w').textContent=w||'—';
        row.querySelector('.w').title='列宽';
        (hidden?off:on).push(row);
      }
      var frag=document.createDocumentFragment();
      function grp(txt,n,mt){
        var g=document.createElement('div');
        g.className='vc-crow-grp'+(mt?' mt':'');
        g.appendChild(document.createTextNode(txt+' '));
        var b=document.createElement('b'); b.textContent=String(n); g.appendChild(b);
        g.appendChild(document.createTextNode(' 列'+(mt?'':' · 点击行编辑属性')));
        frag.appendChild(g);
      }
      grp('已显示',on.length,false);
      on.forEach(function(x){ frag.appendChild(x); });
      if(!on.length){ var e1=document.createElement('div'); e1.className='vc-crow-empty';
        e1.textContent='没有匹配的列'; frag.appendChild(e1); }
      grp('未显示',off.length,true);
      off.forEach(function(x){ frag.appendChild(x); });
      if(!off.length){ var e2=document.createElement('div'); e2.className='vc-crow-empty';
        e2.textContent='无'; frag.appendChild(e2); }
      S.list.innerHTML=''; S.list.appendChild(frag);
      var n=S.side.querySelector('[data-dtcfg-n]');
      if(n)n.textContent='共 '+S.rows.length+' 列';
    }

    
    function detailSkeleton(){
      var s='<div class="vcd-hd"><div class="vcd-hd-t"><h4></h4><code></code></div>'+
        '<span class="vcd-badge base"></span></div>'+
        '<div class="vcd-nav">'+
        GROUPS.map(function(g){ return '<button data-grp-go="'+g.k+'">'+g.no+' '+g.t.slice(0,2)+'</button>'; }).join('')+
        '<span>滚动查看全部属性</span></div>';
      GROUPS.forEach(function(g){
        s+='<div class="vcd-grp" data-grp="'+g.k+'"><div class="vcd-gt"><span>'+g.no+'</span>'+
           g.t+'<em>'+g.em+'</em></div><div class="vcd-body"></div></div>';
      });
      s+='<div class="vcd-ft"><span>字段映射 / 公式 / 选录均由 spec.columns 驱动，引擎零业务字段</span></div>';
      return s;
    }
    function restore(){
      var i,b;
      for(i=0;i<S.borrowed.length;i++){
        b=S.borrowed[i];
        try{ if(b.td&&b.parent&&b.td.parentNode!==b.parent)b.parent.appendChild(b.td); }catch(e){}
      }
      S.borrowed=[];
    }
    function fieldRow(fi,tr,body){
      var td=tdOf(tr,fi); if(!td)return;
      var row=document.createElement('div'); row.className='vcd-f';
      var lab=document.createElement('label');
      lab.appendChild(document.createTextNode(S.labels[fi]||''));
      var sm=document.createElement('small'); sm.textContent=META[fi]||''; lab.appendChild(sm);
      var c=document.createElement('div'); c.className='vcd-c';
      row.appendChild(lab); row.appendChild(c); body.appendChild(row);
      c.appendChild(td);                              
      var e=td.querySelector('input,select');
      if(e)e.classList.add(e.type==='checkbox'?'vcd-ck':'vcd-in');
      S.borrowed.push({td:td,parent:tr});
    }
    function roRow(label,key,val,body){
      var row=document.createElement('div'); row.className='vcd-f';
      var lab=document.createElement('label'); lab.textContent=label;
      var sm=document.createElement('small'); sm.textContent=key; lab.appendChild(sm);
      var c=document.createElement('div'); c.className='vcd-c';
      var code=document.createElement('code'); code.className='vcd-ro'+(key==='db'?' db':'');
      code.textContent=val; c.appendChild(code);
      row.appendChild(lab); row.appendChild(c); body.appendChild(row);
    }
    function borrow(){
      var tr=S.rows[S.sel]; if(!tr)return;
      GROUPS.forEach(function(g){
        var body=S.detail.querySelector('.vcd-grp[data-grp="'+g.k+'"] .vcd-body');
        if(!body)return;
        g.fs.forEach(function(fi){ fieldRow(fi,tr,body); });
        if(g.k==='show'){
          roRow('显示顺序','order','第 '+(S.sel+1)+' / '+S.rows.length+' 列',body);
          roRow('数据库映射','db',dbOf(),body);
        }
      });
      var ops=tdOf(tr,10), ft=S.detail.querySelector('.vcd-ft');
      if(ops&&ft){ ft.insertBefore(ops,ft.firstChild); S.borrowed.push({td:ops,parent:tr}); }
    }
    function dbOf(){
      try{
        var d=T._formDraft(), sec=((d||{}).layout||{}).sections.filter(function(x){
          return x.id===S.secId; })[0];
        return (sec.spec.db||sec.spec.dataKey||'—')+'';
      }catch(e){ return '—'; }
    }
    function buildDetail(){
      if(!S.detail)return;
      restore();                                   
      S.detail.innerHTML=detailSkeleton();
      var tr=S.rows[S.sel]||null, hd=S.detail.querySelector('.vcd-hd');
      if(hd){
        hd.querySelector('h4').textContent=tr?(valOf(tdOf(tr,2))||('列 '+(S.sel+1))):'—';
        hd.querySelector('code').textContent=tr?valOf(tdOf(tr,1)):'—';
        var bg=badgeOf(S.sel), badge=hd.querySelector('.vcd-badge');
        badge.className='vcd-badge '+bg.cls; badge.textContent=bg.txt;
      }
      borrow();
      S.detail.scrollTop=0;
      if(!S.detail._dtNavBound){
        S.detail._dtNavBound=1;
        S.detail.addEventListener('click',function(e){
          var b=e.target&&e.target.closest?e.target.closest('[data-grp-go]'):null;
          if(!b)return;
          var g=S.detail.querySelector('.vcd-grp[data-grp="'+b.getAttribute('data-grp-go')+'"]');
          if(g)S.detail.scrollTo({top:Math.max(0,g.offsetTop-48),behavior:'smooth'});
        });
      }
    }
    function select(i){
      if(i<0||i>=S.rows.length)return;
      S.sel=i; buildDetail();
      var rs=S.list?S.list.querySelectorAll('.vc-crow'):[],j;
      for(j=0;j<rs.length;j++)rs[j].classList.toggle('sel',+rs[j].getAttribute('data-i')===i);
      syncStats();
    }
    function syncStats(){
      if(!S.bar)return;
      var i,total=S.rows.length,shown=0,width=0,edit=0,lookup=0,formula=0;
      var ctls=[]; try{ ctls=((T._formSpec()||{}).detailControls||[]); }catch(e){}
      for(i=0;i<total;i++){
        var tr=S.rows[i], k=valOf(tdOf(tr,1)), ck=keyOf(tdOf(tr,4));
        var m=ctls.filter(function(x){ return x.key===ck; })[0];
        if(!S.hidden[k])shown++;
        width+=(+valOf(tdOf(tr,3))||0);
        if(m&&m.editable!==false)edit++;
        if(ck==='lookup')lookup++;
        if(valOf(tdOf(tr,6)))formula++;
      }
      var ctlN=ctls.length;
      var vals={shown:shown+'/'+total,width:width+'px',edit:edit,
        lookup:lookup,formula:formula,controls:ctlN};
      var bs=S.bar.querySelectorAll('[data-stat]'),j;
      for(j=0;j<bs.length;j++)bs[j].textContent=String(vals[bs[j].getAttribute('data-stat')]);
      S.stats={columns:total,shown:shown,width:width,editable:edit,lookup:lookup,
        formula:formula,controls:ctlN,tab:S.tab,sel:S.sel,kw:S.kw,
        hidden:Object.keys(S.hidden),applies:S.applies};
    }
    function setTab(tab,keep){
      var right=document.getElementById('fwRight'); if(!right||!right.querySelector('table.dtcfg'))return;
      var ok=false,i; for(i=0;i<S.tabs.length;i++)if(S.tabs[i].k===tab)ok=true;
      if(!ok)return;
      S.tab=tab; right.setAttribute('data-dtcfg-ui',tab);
      
      var win=document.getElementById('formWin');
      if(win)win.setAttribute('data-dtcfg-ui',tab);
      var bs=right.querySelectorAll('[data-dtcfg-tabs] .dt-tab');
      for(i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i].getAttribute('data-dt-tab')===tab);
      if(!keep)right.scrollTop=0;
    }
    function makeTabs(right){
      var bar=document.createElement('div');
      bar.className='dtcfg-tabs'; bar.setAttribute('data-dtcfg-tabs','1');
      var html='';
      S.tabs.forEach(function(x){ html+='<button type="button" class="dt-tab" data-dt-tab="'+x.k+'">'+x.t+'</button>'; });
      bar.innerHTML=html;
      var acts=right.querySelector(':scope > .fw-acts');
      if(acts)acts.insertAdjacentElement('afterend',bar);
      else right.insertAdjacentElement('afterbegin',bar);
      bar.addEventListener('click',function(e){
        var b=e.target&&e.target.closest?e.target.closest('[data-dt-tab]'):null;
        if(b)setTab(b.getAttribute('data-dt-tab'));
      });
    }
    
    function syncNavLabel(){
      var w=document.getElementById('formWin'); if(!w)return;
      var b=w.querySelector('[data-dtcfg-nav-toggle]'); if(!b)return;
      var on=w.getAttribute('data-dtcfg-nav')==='1';
      var t=on?'⤡ 收起区块导航':'⤢ 显示区块导航';
      if(b.textContent!==t)b.textContent=t;
      var ti=on?'隐藏左侧骨架与区块列表，把宽度让给列定义':'显示左侧骨架与区块列表';
      if(b.getAttribute('title')!==ti)b.setAttribute('title',ti);
    }
    function injectNavToggle(){
      var w=document.getElementById('formWin'); if(!w)return;
      var tabs=w.querySelector('[data-dtcfg-tabs]'); if(!tabs)return;
      var b=tabs.querySelector('[data-dtcfg-nav-toggle]');
      if(!b){
        b=document.createElement('button');
        b.type='button'; b.className='dt-tab';
        b.setAttribute('data-dtcfg-nav-toggle','1');
        b.addEventListener('click',function(){
          var win=document.getElementById('formWin'); if(!win)return;
          if(win.getAttribute('data-dtcfg-nav')==='1')win.removeAttribute('data-dtcfg-nav');
          else win.setAttribute('data-dtcfg-nav','1');
          syncNavLabel();
        });
        tabs.appendChild(b);
      }
      syncNavLabel();
    }
    function rebuild(right,tbl){
      injectCSS();
      var cards=right.querySelectorAll(':scope > .fw-card'),i;
      for(i=0;i<cards.length;i++){
        var k=cardTab(cards[i]); if(k)cards[i].setAttribute('data-dtcfg-tab',k);
      }
      var ths=tbl.querySelectorAll('thead th'); S.labels=[];
      for(i=0;i<ths.length;i++)S.labels.push(String(ths[i].textContent||'').trim());
      S.rows=[].slice.call(tbl.querySelectorAll('tbody tr'));
      S.rows.forEach(function(tr,ri){
        tr.setAttribute('data-row-i',String(ri));
        var tds=[].slice.call(tr.children).filter(function(x){ return x.tagName==='TD'; }),j;
        for(j=0;j<tds.length;j++){
          tds[j].setAttribute('data-fi',String(j));
          tds[j].setAttribute('data-row-i',String(ri));
        }
      });
      S.secId=secIdOf(tbl);
      S.borrowed=[];                               
      if(!right.querySelector('[data-dtcfg-tabs]'))makeTabs(right);
      var card=right.querySelector('.fw-card[data-dtcfg-tab="cols"]');
      if(!card)return;
      S.bar=makeBar(card); makeMain(card,S.bar);
      buildList(); buildDetail(); setTab(S.tab,true); syncStats();
      injectNavToggle();                   
      S.applies++;
    }
    function sync(){
      var right=document.getElementById('fwRight'); if(!right)return;
      var tbl=right.querySelector('table.dtcfg');
      if(!tbl){ right.removeAttribute('data-dtcfg-ui');
        var w=document.getElementById('formWin'); if(w)w.removeAttribute('data-dtcfg-ui');
        return; }
      if(S.seen.has(tbl))return;
      S.seen.add(tbl);
      try{ rebuild(right,tbl); }catch(e){}
    }
    if(typeof MutationObserver!=='undefined'){
      try{ new MutationObserver(sync).observe(document.documentElement,
        {childList:true,subtree:true}); }catch(e){}
    }
    setTimeout(sync,0);

    window.__WL_DTCFG_UI__={
      get:function(){ return JSON.parse(JSON.stringify({version:'1.49',tab:S.tab,sel:S.sel,
        kw:S.kw,hidden:Object.keys(S.hidden),applies:S.applies,stats:S.stats,
        borrowed:S.borrowed.length,tabs:S.tabs.map(function(x){return x.k;})})); },
      setTab:setTab,
      setFilter:function(v){ S.kw=String(v||''); var f=S.side&&S.side.querySelector('.vcs-search input');
        if(f)f.value=S.kw; buildList(); syncStats(); },
      select:select
    };
    return S;
  })();
  
  var LBL=(function(){
    var OLD='明细配置', NEW='配置表单';
    var SKIP={SCRIPT:1,STYLE:1,PRE:1,CODE:1,TEXTAREA:1,NOSCRIPT:1};
    var ATTRS=['title','aria-label','placeholder','alt'];
    var C={text:0,attrs:0,scans:0};
    function repl(v){ return v.indexOf(OLD)>=0?v.split(OLD).join(NEW):v; }
    function skipTag(n){ return !!(n&&n.tagName&&SKIP[n.tagName]); }
    function fixText(root){
      if(!root||skipTag(root)||root.nodeType===3||root.nodeType===8)return;
      var w,n,p,v,nv;
      try{ w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null,false); }
      catch(e){ return; }
      while((n=w.nextNode())){
        p=n.parentNode; if(!p||skipTag(p))continue;
        v=n.nodeValue; if(!v||v.indexOf(OLD)<0)continue;
        nv=repl(v); if(nv!==v){ n.nodeValue=nv; C.text++; }
      }
    }
    function fixOne(el){
      if(!el||el.nodeType!==1||!el.getAttribute)return;
      var i,a,v,nv;
      for(i=0;i<ATTRS.length;i++){
        a=ATTRS[i];
        if(!el.hasAttribute(a))continue;
        v=el.getAttribute(a); if(!v||v.indexOf(OLD)<0)continue;
        nv=repl(v); if(nv!==v){ el.setAttribute(a,nv); C.attrs++; }
      }
    }
    function fixAttrs(root){
      if(!root)return;
      fixOne(root);
      if(root.querySelectorAll){
        var els=root.querySelectorAll('[title],[aria-label],[placeholder],[alt]'),i;
        for(i=0;i<els.length;i++)fixOne(els[i]);
      }
    }
    function apply(root){
      root=root||document.body; if(!root)return;
      C.scans++; fixText(root); fixAttrs(root);
    }
    function onMutations(ms){
      var i,j,m,t,nodes,nd;
      for(i=0;i<ms.length;i++){
        m=ms[i]; t=m.target;
        if(t&&t.nodeType===3)t=t.parentNode;
        if(t&&t.nodeType===1){
          if(m.type!=='attributes')fixText(t);
          fixAttrs(t);
        }
        nodes=m.addedNodes;
        if(nodes)for(j=0;j<nodes.length;j++){
          nd=nodes[j];
          if(nd.nodeType===1){ fixText(nd); fixAttrs(nd); }
          else if(nd.nodeType===3&&nd.parentNode&&!skipTag(nd.parentNode))
            fixText(nd.parentNode);
        }
      }
    }
    if(typeof MutationObserver!=='undefined'){
      try{
        new MutationObserver(onMutations).observe(document.documentElement,
          {childList:true,subtree:true,characterData:true,attributes:true,
           attributeFilter:ATTRS});
      }catch(e){}
    }
    apply(document.body);                       
    setTimeout(function(){ apply(document.body); },0);  
    
    ['_formOpen','_formJSON','_formSave','_wlMenu','_vcOpen'].forEach(function(k){
      if(typeof T[k]!=='function')return;
      var raw=T[k];
      T[k]=function(){ var r=raw.apply(T,arguments); try{ apply(document.body); }catch(e){} return r; };
    });
    window.__WL_LABEL_UNIFY__=function(){
      return {old:OLD,newName:NEW,textReplaced:C.text,attrsReplaced:C.attrs,
        scans:C.scans,attrs:ATTRS.slice(),skip:Object.keys(SKIP)};
    };
    return C;
  })();
})();
