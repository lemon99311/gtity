

(function(){
'use strict';
if(window.__WL_B5_READY__)return;
window.__WL_B5_READY__=1;
var T=window.TPL;
if(!T)return;
var LOG=[], REG=[], OVERLAY={renderers:{},count:0}, SIG={}, BASE=null;
var LAST=0, THROTTLE=120;
window.__WL_B5_LOG__=LOG;
window.__WL_B5_REGISTRY__=REG;
window.__WL_B5_OVERLAY__=OVERLAY;
function log(k,d){LOG.push(Object.assign({at:Date.now(),k:k},d||{}));if(LOG.length>300)LOG.shift()}
function clone(o){try{return JSON.parse(JSON.stringify(o))}catch(e){return o}}
function keys(o){try{return Object.keys(o||{})}catch(e){return []}}
function arr(v){return Array.isArray(v)?v:[]}


function layerRows(){
  var out=[];
  (window.__WL_LAYER_REGISTRY__||[]).forEach(function(e,i){
    var id=e.id, tag=e.tag;
    var m=id.match(/v1(\d+)/), b=id.match(/(?:^|-)b(\d)(?:-|$)/);
    var era=m?('v1.'+m[1]):(b?('批次 '+b[1]):(id==='tplSchema'||id==='tplExamples'?'业务定义':'外壳 / 原始层'));
    var role=/^tpl-b\d/.test(id)?'批次追加层':(/^tpl-v1\d/.test(id)?'版本收口层':
      (id==='tplSchema'?'唯一业务定义':id==='tplExamples'?'第二套示例业务':'原始样式 / 结构层'));
    out.push({i:i,tag:tag,id:id,era:era,role:role,immutable:true,
      note:'总纲红线：既有收口层不得删除或改写；新增内容以追加新层接入'});
  });
  return out;
}
var LAYERS=layerRows();
var BASE_STYLE=LAYERS.filter(function(x){return x.tag==='style'}).map(function(x){return x.id});
var BASE_SCRIPT=LAYERS.filter(function(x){return x.tag==='script'&&x.id!=='tpl-b5-handoff'}).map(function(x){return x.id});
var BASE_TPL=Object.keys(T).filter(function(k){return k.charAt(0)==='_'}).sort();
var BASE_WL=Object.keys(window).filter(function(k){return k.indexOf('__WL_')===0&&k!=='__WL_B5_LOG__'&&k!=='__WL_B5_REGISTRY__'&&k!=='__WL_B5_OVERLAY__'&&k!=='__WL_B5_READY__'&&k!=='__WL_B5_LAYERS__'&&k!=='__WL_B5_HANDOFF__'}).sort();
BASE={style:BASE_STYLE,script:BASE_SCRIPT,tpl:BASE_TPL,wl:BASE_WL,
      styleCount:BASE_STYLE.length,scriptCount:BASE_SCRIPT.length};
window.__WL_B5_LAYERS__=clone(LAYERS);
log('boot',{layers:LAYERS.length,style:BASE_STYLE.length,script:BASE_SCRIPT.length,
  tpl:BASE_TPL.length,wl:BASE_WL.length});


var RISK=['document.write','eval','new Function',"setAttribute('on*')",
          'Range.createContextualFragment','把配置拼进 location / URL'];
var PROTECT=['tpl-b1-guard-early（innerHTML / outerHTML / insertAdjacentHTML 写入净化）',
             'tpl-b1-guard（localStorage 存档审计 + TPL._guard().scan()）'];
var LOGMAP={
  'renderer.list':['TPL._renderers','TPL._cell','TPL._genericLog','__WL_B5_LOG__'],
  'renderer.detail':['TPL._formSpec().renderers','DETAIL_RENDERERS','__WL_B5_LOG__'],
  'control.form':['TPL._formSpec().controls','CONTROLS','TPL._collect','__DB_PAYLOAD__'],
  'control.detail':['TPL._formSpec().detailControls','DETAIL_CONTROLS','__WL_DT_FLOW__','__WL_DT_FOCUS__'],
  'action.instance':['TPL._actions','TPL._actionLog','__WL_ACTION_LOG__','__WL_B5_LOG__'],
  'action.method':['TPL._actionSpec().methods','ACT.METHODS','TPL._actionLog'],
  'scene.instance':['TPL._pageActions','TPL._routeLog','__WL_ROUTE__','__WL_B5_LOG__'],
  'scene.method':['TPL._pageSpec().methods','PAGE.dispatch','TPL._routeLog'],
  'section.instance':['TPL._formConfig','TPL._sections','__WL_B3_SECTIONS__','TPL._dtFlowLog'],
  'section.button':['TPL._columnDefs','TPL._buttonSpec','TPL._buttonResolve','__DB_PAYLOAD__.__columnClick'],
  'column.instance':['TPL._columnDefs','TPL._snapshot','VC.cols()','__DB_PAYLOAD__'],
  'column.spec':['TPL._columnSpec','TPL._generic','__WL_B4_GENERIC__'],
  'generic.spec':['TPL._generic','TPL._genericReport','__WL_B4_GENERIC__','__WL_B4_LOG__'],
  'dead':['TPL._genericDead','__WL_B4_DEAD__'],
  'layer':['TPL._layers','__WL_B5_LAYERS__']
};
var SOURCES=[
  {kind:'renderer.list',label:'列表单元格渲染器',get:function(){return arr(T._renderers).map(function(k){return {key:k,label:k}})}},
  {kind:'renderer.detail',label:'抽屉区块渲染器',get:function(){
    return arr((T._formSpec()||{}).renderers).map(function(x){return {key:x.key,label:x.label||x.key}})}},
  {kind:'control.form',label:'单头表单控件',get:function(){
    return keys((T._formSpec()||{}).controls).map(function(k){return {key:k,label:k}})}},
  {kind:'control.detail',label:'明细表控件',get:function(){
    return arr((T._formSpec()||{}).detailControls).map(function(x){return {key:x.key,label:x.label||x.key}})}},
  {kind:'action.instance',label:'动作实例（工具栏 / 菜单栏）',get:function(){
    return arr(T._actions()).map(function(a){return {key:a.id,label:a.label||a.id,builtin:a.builtin}})}},
  {kind:'action.method',label:'动作方法',get:function(){
    return arr((T._actionSpec()||{}).methods).map(function(m){return {key:m.key,label:m.label||m.key}})}},
  {kind:'scene.instance',label:'页面交互场景实例',get:function(){
    return arr(T._pageActions()).map(function(a){return {key:a.scene,label:a.label||a.scene,builtin:a.builtin}})}},
  {kind:'scene.method',label:'页面交互方法',get:function(){
    return arr((T._pageSpec()||{}).methods).map(function(m){return {key:m.key,label:m.label||m.key}})}},
  {kind:'section.instance',label:'抽屉区块实例',get:function(){
    var fc=T._formConfig()||{};var sec=arr((fc.layout||{}).sections);
    return sec.map(function(x){return {key:x.id,label:x.title||x.id,builtin:x.builtin}})}},
  {kind:'section.button',label:'操作列按钮',get:function(){
    var out=[];arr(T._columnDefs()).forEach(function(c){
      if(c.renderer==='actions')arr((c.render||{}).buttons).forEach(function(b){
        out.push({key:(c.k||'ops')+':'+(b.label||''),label:b.label||''})})});
    return out}},
  {kind:'column.instance',label:'列定义实例',get:function(){
    return arr(T._columnDefs()).map(function(c){return {key:c.k,label:c.t||c.k}})}},
  {kind:'column.spec',label:'列定义规格字段',get:function(){
    var cs=T._columnSpec()||{};return arr(cs.fields).map(function(f){
      return {key:f.key||f.name||f.k,label:f.label||f.key}})}},
  {kind:'generic.spec',label:'通用性配置字段（批次 4）',get:function(){
    return keys(T._generic()).map(function(k){return {key:k,label:k}})}},
  {kind:'dead',label:'清理台账（批次 4）',get:function(){
    return arr(T._genericDead()).map(function(d){return {key:d.name,label:d.name}})}},
  {kind:'layer',label:'收口层（批次 5 追溯）',get:function(){
    return LAYERS.map(function(l){return {key:l.id,label:l.era+' · '+l.id}})}}
];
function rec(kind,item,how){
  return {kind:kind,key:String(item.key),label:String(item.label||item.key),
    firstSeen:Date.now(),discoveredBy:how||'auto',
    guard:{protectedBy:PROTECT.slice(),audited:false,probe:null,callerOwnRisk:RISK.slice()},
    logs:(LOGMAP[kind]||['__WL_B5_LOG__']).slice(),
    layers:{appendOnly:true,dependsOn:['tpl-b1-guard-early','tpl-b1-guard','tpl-b2-redraw-early','tpl-b2-redraw','tpl-b3-boundary','tpl-b4-generic','tpl-b5-handoff']},
    note:'按原方式新增即自动登记；DOM 写入受批次 1 净化层保护，无需作者额外补登记'};
}
function guardAudit(r){
  try{
    var g=T._guard?T._guard():null;
    if(g&&typeof g.scan==='function'){
      var sc=g.scan();
      r.guard.audited=true;
      r.guard.scan={elements:sc.elements,badAttrs:arr(sc.badAttrs).length,scripts:arr(sc.scripts).length};
      r.guard.coverage=g.coverage||[];
    }
  }catch(e){r.guard.auditError=String(e).slice(0,140)}
  return r;
}
function scan(force){
  var now=Date.now();
  if(!force&&now-LAST<THROTTLE)return 0;
  LAST=now;
  var added=0;
  SOURCES.forEach(function(src){
    var items=[];
    try{items=src.get()||[]}catch(e){return}
    var ks=items.map(function(x){return String(x.key)}).sort();
    var sig=JSON.stringify(ks);
    if(SIG[src.kind]===undefined){
      
      var isInstance=/\.instance$/.test(src.kind);
      items.forEach(function(it){
        REG.push(guardAudit(rec(src.kind,it,isInstance&&it.builtin===false?'auto':'baseline')));
        if(isInstance&&it.builtin===false){
          log('discovered',{kind:src.kind,key:String(it.key),label:String(it.label||it.key),by:'baseline'});
        }
      });
      SIG[src.kind]=sig;return;
    }
    if(SIG[src.kind]===sig)return;
    var seen={};REG.forEach(function(r){if(r.kind===src.kind)seen[r.key]=1});
    items.forEach(function(it){
      if(!seen[String(it.key)]){
        REG.push(guardAudit(rec(src.kind,it,'auto')));added++;
        log('discovered',{kind:src.kind,key:String(it.key),label:String(it.label||it.key)});
      }
    });
    SIG[src.kind]=sig;
  });
  if(added)log('scan',{added:added,total:REG.length});
  return added;
}
scan(true);
log('baseline',{records:REG.length,kinds:SOURCES.length});



function probe(html,name){
  var out={executed:false,badAttrs:null,scripts:null,coverage:null,detached:true,offscreen:true};
  try{
    window.__B5_PWNED__=undefined;
    var d=document.createElement('div');
    d.innerHTML=String(html==null?'':html);              
    out.executed=!!window.__B5_PWNED__;
    d.style.cssText='position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden';
    document.body.appendChild(d);
    out.executed=out.executed||!!window.__B5_PWNED__;
    var g=T._guard?T._guard():null, sc=(g&&g.scan)?g.scan():{};
    out.badAttrs=arr(sc.badAttrs).length;out.scripts=arr(sc.scripts).length;
    out.coverage=g?g.coverage:null;
    d.parentNode.removeChild(d);
    delete window.__B5_PWNED__;
  }catch(e){out.error=String(e).slice(0,160)}
  return out;
}
function register(kind,name,payload){
  if(kind==='renderer'){
    if(typeof payload!=='function')throw new Error('renderer payload 必须是函数 (r,c)=>HTML');
    var fn=payload, sample={__idx:0,v:'B5 探针'}, col={k:'b5',renderer:String(name)};
    var html='';try{html=fn(sample,col)}catch(e){html=''}
    OVERLAY.renderers[String(name)]=fn;OVERLAY.count++;
    var r=guardAudit(rec('renderer.list',{key:name,label:name+'（批次 5 热注册）'},'register'));
    r.guard.probe=probe(html,name);
    r.guard.probe.htmlLength=String(html).length;
    r.logs=LOGMAP['renderer.list'].concat(['TPL._b5Register','__WL_B5_OVERLAY__']);
    REG.push(r);
    SIG['renderer.list']=JSON.stringify(arr(T._renderers).concat([String(name)]).sort());
    log('register',{kind:'renderer',key:String(name),executed:r.guard.probe.executed,
      badAttrs:r.guard.probe.badAttrs,scripts:r.guard.probe.scripts});
    return clone(r);
  }
  
  var r2=guardAudit(rec(kind==='section'?'section.instance':(kind==='action'?'action.instance':'scene.instance'),
    {key:name,label:payload&&payload.label?payload.label:String(name)},'register'));
  REG.push(r2);
  log('register',{kind:kind,key:String(name),mode:'既有入口新增后的显式登记'});
  return clone(r2);
}

function wrap(name,fn){
  if(typeof T[name]!=='function')return;
  var raw=T[name];
  T[name]=function(){return fn.call(this,raw,arguments)};
  log('wrapped',{name:name});
}
wrap('_cell',function(raw,args){
  var c=args[1], n=c&&c.renderer;
  if(OVERLAY.count&&n&&OVERLAY.renderers[n]){
    try{return OVERLAY.renderers[n](args[0],c)}catch(e){return ''}
  }
  return raw.apply(T,args);
});
var FORCE={'_vcSave':1,'_formSave':1,'_actSave':1,'_pageSave':1,'_formSecAdd':1,
  '_formLoadPreset':1,'_actReset':1,'_pageReset':1,'_vcReset':1};
['_vcSave','_formSave','_actSave','_pageSave','_dtRows','_redraw','_refresh',
 '_formSecAdd','_formLoadPreset','_actReset','_pageReset','_vcReset','_vcRuleAdd',
 '_vcTab','_view','_page','_size','_sort','_kw','_toolbar','_snapshot'].forEach(function(k){
  wrap(k,function(raw,args){
    var ret=raw.apply(T,args);
    
    scan(!!FORCE[k]);
    return ret;
  });
});


var STEPS=[
 '/* 总纲 · 每批必跑的基线回归 7 项 */',
 '1) 清存档后分别联网打开、拦截 unpkg/jsdelivr 断网打开，比较默认视图截图',
 '2) TPL.apply(TPL.examples.supplier) → 查配置隔离 → TPL.reset() 回切',
 '3) 预置旧版 localStorage 存档 → reload → 查改名/调序/已删动作与视图',
 '4) TPL._vcOpen()/_vcSave()、TPL._formOpen()/_formSave()、功能设置保存 → reload 复查',
 '5) 载入入库单示例 → 编辑态 5 轮键盘录入 → 查 __WL_DT_FLOW__/__WL_DT_FOCUS__/__WL_DT_LOOKUP__',
 '6) TPL.forceResult="fail"/"ok"、提交途中 TPL._close()、DETAIL.commit/restore、结果页重试/返回',
 '7) TPL._regressionRun()；比对 TPL._* / __WL_* / style,script[id] / tplExamples / #formConfig',
 '',
 '/* 批次 1 · 可信边界 */',
 "localStorage 动作名称/视图名/区块 id/列标题/图标片段写入 O'B <img src=x onerror=...> 与 <script> → reload",
 '查 window.__PWNED__===undefined、TPL._guard().scan().badAttrs/scripts 为空、两配置面板与抽屉不破版',
 '',
 '/* 批次 2 · 重绘稳定 */',
 'new MutationObserver(rs=>rs.forEach(()=>window.__M__++)).observe(document.getElementById("main"),{childList:true,subtree:true,characterData:true});',
 '静置 2200ms 查 __M__===0；连续 6 轮 _kw/_page/_view；查 TPL._redrawReady().ready',
 '',
 '/* 批次 3 · 数据链路边界 */',
 'TPL._b3DualPreset(false) 查两个 editable-table 区块；TPL._formalPayload() vs __DB_PAYLOAD__',
 'TPL._boundaryReport() 查 __* 键、未映射去向、sessions；TPL._handoff() 查演示/正式边界',
 '',
 '/* 批次 4 · 通用性收口 */',
 'TPL._genericChanged()===false；TPL.apply(TPL.examples.supplier) → TPL._view("on")',
 '查 _snapshot().statusViews、Vue statusOpts/statusVal、ctxOptions、unit、#tplQuick a 数、document.title',
 'TPL._vcTab("where") → TPL._vcRuleAdd() → 读 #vcPane .vc-rule select 的 6 个兜底中文名',
 '',
 '/* 批次 5 · 三类新增（默认即受保护 / 可查出口，不需要额外登记） */',
 'A 新增渲染器：',
 '  TPL._b5Register("renderer","b5_probe",(r,c)=>`<b>${r.v}</b><img src=x onerror="window.__B5_PWNED__=1">`);',
 '  TPL._cell({__idx:0,v:"B5"},{k:"b5",renderer:"b5_probe"});  // 走 overlay 分派',
 '  TPL._b5Registry().find(x=>x.key==="b5_probe").guard.probe;  // executed=false / badAttrs=0',
 '  document.createElement("div").innerHTML=TPL._cell({__idx:0,v:"B5"},{k:"b5",renderer:"b5_probe"}); // 净化',
 'B 新增明细区块（走既有入口，自动发现）：',
 '  TPL._formOpen(); TPL._formSecAdd(); TPL._formSave(); TPL._b5Scan();',
 '  TPL._b5Log().filter(x=>x.k==="discovered"&&x.kind==="section.instance");',
 'C 新增动作（改配置存档 + reload，自动发现）：',
 '  const k="TPL_VIEW_CFG_V113:drugArchive",c=JSON.parse(localStorage.getItem(k));',
 '  c.actions.push({id:"a_b5_probe",zone:"toolbar",menuGroup:"",label:"O\'B <img src=x onerror=...>",',
 '    action:"none",params:"",desc:"批次5 探针",enabled:true,builtin:false});',
 '  localStorage.setItem(k,JSON.stringify(c)); location.reload();',
 '  TPL._b5Registry().filter(x=>x.key==="a_b5_probe"); TPL._guard().scan();',
 '',
 '/* 一键只读自检 */',
 'TPL._regressionRun()  // {pass,total,failed,items}；TPL._regression() 看完整清单',
 'TPL._handoffSummary() // 五批总览 / 限制 / 接后端待办；TPL._layers() 看历史叠层'
];
function regression(){
  var B=(function(){
    var a=[];try{a=(T._boundaryReport||T._b3Report||function(){return {}})()}catch(e){}
    return a;
  })();
  return [
    {id:'B0-1',batch:'总纲',title:'联网/断网默认视图一致',steps:STEPS.slice(0,2),expect:'像素差 0.00%',auto:'manual'},
    {id:'B0-2',batch:'总纲',title:'supplier 切换与回切',steps:STEPS.slice(1,2),expect:'按 schemaId 隔离，回切无报错',auto:'manual'},
    {id:'B0-3',batch:'总纲',title:'旧版存档升级',steps:STEPS.slice(2,3),expect:'改名/调序/已删动作与视图不丢',auto:'manual'},
    {id:'B0-4',batch:'总纲',title:'三处配置保存→刷新生效',steps:STEPS.slice(3,4),expect:'列选项/配置表单/功能设置均保留',auto:'manual'},
    {id:'B0-5',batch:'总纲',title:'键盘流全链路与滚动不跳',steps:STEPS.slice(4,5),expect:'5 轮闭环、__WL_DT_* 可查',auto:'manual'},
    {id:'B0-6',batch:'总纲',title:'预校验/关闭/还原/结果页三态',steps:STEPS.slice(5,6),expect:'互不污染、三态逐项一致',auto:'manual'},
    {id:'B0-7',batch:'总纲',title:'出口与层清单齐全',steps:STEPS.slice(6,7),expect:'TPL._* / __WL_* / style,script[id] / tplExamples / #formConfig 一个不少',auto:'auto',check:'exports'},
    {id:'B1-1',batch:'批次1',title:'特殊字符与片段化标记注入',steps:STEPS.slice(8,10),expect:'不执行 / 不报错 / 不破版',auto:'manual'},
    {id:'B1-2',batch:'批次1',title:'新注册项默认受约束',steps:STEPS.slice(18,22),expect:'guard.probe.executed=false、badAttrs/scripts=0',auto:'auto',check:'guard'},
    {id:'B2-1',batch:'批次2',title:'静置 0 mutation / 连续交互',steps:STEPS.slice(11,13),expect:'__M__===0、控件不丢、_redrawReady().ready',auto:'auto',check:'ready'},
    {id:'B3-1',batch:'批次3',title:'演示与正式边界',steps:STEPS.slice(14,16),expect:'正式包无 __*、dbPayload 契约不变、未映射有去向',auto:'auto',check:'boundary'},
    {id:'B4-1',batch:'批次4',title:'默认零偏差 / 新业务配置生效',steps:STEPS.slice(17,21),expect:'changed=false；supplier 下 statusViews/ctx/unit/title 由配置生效',auto:'auto',check:'generic'},
    {id:'B5-1',batch:'批次5',title:'三类新增自动登记',steps:STEPS.slice(23,34),expect:'discovered 日志 + registry 记录 + guard 保护',auto:'auto',check:'registry'},
    {id:'B5-2',batch:'批次5',title:'历史叠层可追溯',steps:['TPL._layers()','TPL._layersCheck()'],expect:'顺序一致、不可删标记齐全',auto:'auto',check:'layers'},
    {id:'B5-3',batch:'批次5',title:'总览与复现入口',steps:['TPL._handoffSummary()','TPL._regressionSteps()'],expect:'五批说明 / 限制 / 待办 / 命令齐全',auto:'auto',check:'summary'}
  ];
}
function runCheck(name){
  try{
    if(name==='exports'){
      var t=Object.keys(T).filter(function(k){return k.charAt(0)==='_'});
      var w=Object.keys(window).filter(function(k){return k.indexOf('__WL_')===0});
      var R=window.__WL_LAYER_REGISTRY__||[];
      var st=R.filter(function(e){return e.tag==='style'}).map(function(e){return e.id});
      var sc=R.filter(function(e){return e.tag==='script'}).map(function(e){return e.id});
      var miss=[];
      BASE.tpl.forEach(function(k){if(t.indexOf(k)<0)miss.push('TPL.'+k)});
      BASE.wl.forEach(function(k){if(w.indexOf(k)<0)miss.push(k)});
      BASE.style.forEach(function(k){if(st.indexOf(k)<0)miss.push('style#'+k)});
      BASE.script.forEach(function(k){if(sc.indexOf(k)<0)miss.push('script#'+k)});
      return {ok:miss.length===0,detail:{missing:miss,tpl:t.length,wl:w.length,style:st.length,script:sc.length,
        tplExamples:!!document.getElementById('tplExamples'),
        formConfig:document.documentElement.outerHTML.indexOf('#formConfig')>0}};
    }
    if(name==='guard'){
      var g=T._guard?T._guard():{}, sc2=g.scan?g.scan():{};
      return {ok:(g.coverage||[]).length>=3&&!arr(sc2.badAttrs).length&&!arr(sc2.scripts).length,
        detail:{coverage:g.coverage,badAttrs:arr(sc2.badAttrs).length,scripts:arr(sc2.scripts).length,
          early:!!window.__WL_GUARD_EARLY__,late:!!window.__WL_GUARD_LATE__}};
    }
    if(name==='ready'){
      var r=T._redrawReady?T._redrawReady():{};
      return {ok:r.ready===true&&!!window.__WL_B2_EARLY__&&!!window.__WL_B3_READY__&&!!window.__WL_B4_READY__&&!!window.__WL_B5_READY__,
        detail:{ready:r.ready,epoch:r.epoch,b2:!!window.__WL_B2_EARLY__,b3:!!window.__WL_B3_READY__,
          b4:!!window.__WL_B4_READY__,b5:!!window.__WL_B5_READY__}};
    }
    if(name==='boundary'){
      var rep=(T._boundaryReport||T._b3Report||function(){return {}})();
      
      var formal=Array.isArray(rep.formalPayloadKeys)?rep.formalPayloadKeys:[];
      var demo=Array.isArray(rep.demoPayloadKeys)?rep.demoPayloadKeys:[];
      var dbg=formal.filter(function(k){return k.indexOf('__')===0});
      var contract=rep.dbPayloadContract==='保持不变';
      if(!demo.length){
        
        
        return {ok:!!window.__WL_BOUNDARY__&&contract&&dbg.length===0,
          detail:{pendingSubmit:true,demo:0,formal:0,debugInFormal:[],
            boundaryObject:!!window.__WL_BOUNDARY__,dbPayloadContract:rep.dbPayloadContract,mode:T._boundary?T._boundary().mode:''}};
      }
      return {ok:dbg.length===0&&contract,
        detail:{pendingSubmit:false,demo:demo.length,formal:formal.length,debugInFormal:dbg,
          dbPayloadContract:rep.dbPayloadContract,unmapped:rep.unmapped}};
    }
    if(name==='generic'){
      var ch=T._genericChanged?T._genericChanged():null;
      var g2=T._generic?T._generic():{};
      return {ok:ch===false&&!!g2.specVersion&&Object.keys(g2).length>=12,
        detail:{changed:ch,specVersion:g2.specVersion,keys:Object.keys(g2).length,
          statusViewIds:g2.statusViewIds,quickViewCount:g2.quickViewCount}};
    }
    if(name==='registry'){
      var kinds={};REG.forEach(function(r){kinds[r.kind]=1});
      return {ok:REG.length>=100&&Object.keys(kinds).length>=14&&!!window.__WL_B5_REGISTRY__&&!!window.__WL_B5_LOG__,
        detail:{records:REG.length,kinds:Object.keys(kinds).length,log:LOG.length,
          overlayRenderers:OVERLAY.count,discovered:LOG.filter(function(x){return x.k==='discovered'}).length}};
    }
    if(name==='layers'){
      var cur=layerRows(), st2=cur.filter(function(x){return x.tag==='style'}).map(function(x){return x.id});
      var sc3=cur.filter(function(x){return x.tag==='script'&&x.id!=='tpl-b5-handoff'}).map(function(x){return x.id});
      
      var stPrefix=st2.slice(0,BASE.style.length);
      var dynamic=st2.slice(BASE.style.length);
      var ok=JSON.stringify(stPrefix)===JSON.stringify(BASE.style)&&
             JSON.stringify(sc3)===JSON.stringify(BASE.script)&&
             cur.every(function(x){return x.immutable===true});
      return {ok:ok,detail:{style:st2.length,styleBaseline:BASE.style.length,script:sc3.length,
        dynamicLayers:dynamic,allImmutable:cur.every(function(x){return x.immutable}),
        orderKept:JSON.stringify(stPrefix)===JSON.stringify(BASE.style),
        scriptOrderKept:JSON.stringify(sc3)===JSON.stringify(BASE.script)}};
    }
    if(name==='summary'){
      var s=summary();
      return {ok:s.batches.length===5&&s.limits.length>=10&&s.backendTodo.length>=8&&s.neverChanged.length>=8,
        detail:{batches:s.batches.length,limits:s.limits.length,todo:s.backendTodo.length,
          neverChanged:s.neverChanged.length,regressionSteps:STEPS.length}};
    }
  }catch(e){return {ok:false,detail:{error:String(e).slice(0,180)}}}
  return {ok:false,detail:{unknown:name}};
}
function run(){
  var items=regression().filter(function(x){return x.auto==='auto'}).map(function(x){
    var c=runCheck(x.check);return {id:x.id,batch:x.batch,title:x.title,check:x.check,ok:c.ok,detail:c.detail};
  });
  var failed=items.filter(function(x){return !x.ok});
  var out={pass:failed.length===0,total:items.length,failed:failed,items:items,at:Date.now(),
    manual:regression().filter(function(x){return x.auto==='manual'}).map(function(x){return x.id})};
  log('regressionRun',{pass:out.pass,total:out.total,failed:failed.map(function(x){return x.id})});
  return out;
}


var SUMMARY={
  version:'v1.38',batch:5,
  batches:[
    {n:1,title:'输入与渲染的可信边界',did:'head 早装层统一净化 innerHTML/outerHTML/insertAdjacentHTML 的写入；128 处内联事件参数改走 escJS 专用编码；localStorage 存档审计；TPL._guard().scan()/harden() 出口',left:'二次解析根因留给批次 2；document.write / eval / new Function / setAttribute(on*) / Range / location 仍属调用方自行负责'},
    {n:2,title:'重绘、观察器与连续录入稳定性',did:'同值 textContent 短路、状态签名幂等、focus/select 焦点闸门、_redrawGate 排队与 _redrawReady() 出口；静置自激 mutation 722→0',left:'幂等是状态签名级；真实数据源需主动清签名；宏任务级异步渲染需接入队列'},
    {n:3,title:'演示态与正式数据链路分离',did:'__DB_PAYLOAD__ 74 键演示包原样保留；新增 68 键正式包（TPL._formalPayload / _handoff）；未映射字段去向表；多区块键唯一归一；提交会话三路径互不污染',left:'未映射字段不进入任何输出包；会话是内存数组刷新即清空；预校验仍是 mock'},
    {n:4,title:'通用性收口',did:'10 类残留业务/视图假设收进 S.generic（状态视图、状态/上下文文案、快捷视图数量、标签色板、演示取模、where 兜底、单位、标题后缀）；supplier 自带配置生效；清理台账 3 项',left:'清理台账只登记未物理删文本；断网原生回落不经过 _cell 包装；渲染器内取模常量等仍写死（12 条清单已交接）'},
    {n:5,title:'可维护性、回归入口与总收口',did:'层追溯（_layers / __WL_B5_LAYERS__）、15 类注册项自动发现与 guard 审计（_b5Registry / __WL_B5_REGISTRY__ / __WL_B5_LOG__）、三类新增复现（_b5Register / _b5Scan / _b5Replay）、回归清单与只读自检（_regression / _regressionRun / _regressionSteps）、五批总览（_handoffSummary）',left:'本批不再新增功能方向、不改视觉、不调整前四批链路；自动登记为懒触发，未被任何出口调用的纯注册项需手动 _b5Scan()'}
  ],
  neverChanged:[
    'tplSchema 仍是唯一业务定义；tplExamples（supplier）保留；三套 localStorage 存储键不变',
    'Vue 2.7.16 + element-ui 2.15.14 CDN 版本与 CDN 全断原生回落双路径不变',
    '腾讯蓝 #0052D9 主色阶、v1.13 基准图采样色板、字号档位、行高、间距、圆角、阴影层级、水印文案与角度',
    '默认视图、默认列序、默认每页 10 行、默认主色、默认冻结列、默认抽屉骨架与结果页三态',
    '既有 <style id="tpl-v1xx-..."> / <script id="tpl-v1xx-..."> 收口层不得删除或改写，新增内容一律追加新层',
    '视图 Tab、关键词、快捷/高级筛选、数据范围多条件、列选项/列宽/列序/列冻结、分页排序、行单选与勾选两套状态机',
    '配置中心五页签、草稿态、保存并应用、恢复默认、生效 JSON、功能设置、动作管理、交互场景管理、列点击绑定、操作按钮显示策略',
    '抽屉独立 FORM_STORE、独立配置表单面板、各区块渲染器、左卡目录联动、资料卡、时间轴、DB 映射',
    '主子表工作副本、公式与汇总、增删行、选录浮层、回填映射、异步预校验、关闭/重置还原、成功后固化',
    'v1.33 键盘流全链路（spec.flow 派生顺序、document 级键盘委托、Enter 下一跳、末列复用空行/自动增行、重绘后 rowKey 重定位焦点、聚焦全选、不滚动、浮层 ↑↓/Enter/Esc）',
    'TPL.schema/apply/reset/export/rows/dbPayload/examples/forceResult、全部既有 TPL._*、全部 __WL_*、全部 style/script id、#formConfig 直达入口',
    '演示用 HTTP / REQ / 延时反馈、结果页、水印及其文案；文件头 v1.2~v1.33 全部版本说明按原文保留'
  ],
  regression:{base7:'总纲每批必跑 7 项',all:'TPL._regression()',auto:'TPL._regressionRun()',
    steps:'TPL._regressionSteps()',report:'TPL._handoffSummary()',layers:'TPL._layers() / _layersCheck()',
    registry:'TPL._b5Registry() / _b5Log() / _b5Scan() / _b5Replay() / __WL_B5_REGISTRY__',
    quick:'清 localStorage → 联网/断网截图对照 → _regressionRun() → apply(supplier) → 载入入库单示例跑键盘流 → 结果页三态'},
  limits:[
    '批次 1：esc() 编码片段被二次写入后实体还原的根因未从渲染侧根治，靠非白名单 on* 属性规则纵深兜底；RISK 是文本级判定，不承诺完整语法级防护',
    '批次 1：document.write / eval / new Function / 直接 setAttribute(on*) / Range 片段 / 把配置拼进 location 仍属调用方自行负责',
    '批次 2：幂等是状态签名级而非数据级；接真实数据源后需主动清签名或调重绘标记',
    '批次 2：过期任务被闸门拦下时 __WL_DT_FOCUS__ 仍记一次「尝试」（实际焦点不动）；textContent 短路只覆盖纯文本元素与文本节点；焦点闸门只拦 JS 的 focus()/select()',
    '批次 3：未映射字段仍不进入任何输出包，值只在 __WL_UNMAPPED_VALUES__ 旁路，落库须补 S.db.dbMap',
    '批次 3：键唯一归一仅覆盖显示中的 editable-table 区块；提交会话是内存数组（最多 40 条），刷新即清空',
    '批次 3：gotoPage / openWindow / callApi / PDF / 打印仍是原型级记录与反馈，drawer 是真实抽屉；预校验是 mock',
    '批次 4：清理台账 3 项只登记注销、未物理删除既有脚本文本（红线禁止改写收口层）',
    '批次 4：断网原生回落路径不经过 _cell 包装，supplier 断网态色板/取模迁移不生效；默认业务断网态零变化',
    '批次 4：默认态包装直通，「配置生效」只在 S.generic 与反推默认不同时可见；DOM 校正依赖既有同步渲染时序',
    '批次 4 剩余业务假设：RENDERERS 取模常量 7/3/2 与 90+i*7、wlAvatar 调色算法、VC.whereFields 的 in r0、setShadows 旧正则、opts 的「全部」value、st 初值 all/10、.drug-table 类名 68 处、[10,20,50,100]、seedRows 取模规则、title 拼接形态',
    '批次 5：自动登记为懒触发，未被任何出口调用的纯注册项需手动 TPL._b5Scan()；热注册渲染器依赖 _cell overlay，默认态零命中',
    '批次 5：回归自检只跑只读自动判定项，7 项总纲基线中的截图对照、旧存档、键盘流、结果页三态仍须人工/脚本复现',
    '原型整体：纯前端演示，未连数据库；submit() 是 setTimeout 模拟；全部配置存 localStorage 而非服务端配置中心'
  ],
  backendTodo:[
    'submit() 的 setTimeout 换成真实 fetch；mock 预校验换成额度 / 库存 / 审批接口并保留阻断语义',
    'gotoPage / openWindow / callApi / PDF / 打印接真实路由表与请求；FEAT.route(scene) 接路由中心',
    'VC.tbOptions(field) 换成按 OpTypeID 查 OptionText 的字典表（一处生效，候选项不写进视图配置）',
    '补齐 S.db.dbMap 的 3 个未映射字段（sa_grade / sa_supplier / sa_diagScope），让它们进入正式包而非旁路',
    '三套 localStorage（STORE / VSTORE / FORM_STORE）迁到服务端配置中心，带 schemaId、版本、灰度与回滚',
    '从重绘侧根治批次 1 的二次解析根因，随后可重新评估非白名单 on* 兜底规则是否仍需要',
    '真实数据源接入后，在数据订阅处主动清批次 2 的状态签名或调用 TPL._redraw() 标记',
    '若放宽「不得改写既有收口层」约束，物理删除清理台账 3 项与 .drug-table 等遗留类名',
    '补用户鉴权 / 权限与动作可见性：cfg.actions 的 enabled 之外需按角色过滤',
    '把 TPL._regressionSteps() 的命令序列固化为 CI 脚本，接入截图逐像素对照与断网拦截',
    '接后端前决定「正式包」消费方：TPL._formalPayload() / _handoff().payload，勿再从 __DB_PAYLOAD__ 取'
  ]
};
function summary(){return clone(SUMMARY)}
window.__WL_B5_HANDOFF__=clone(SUMMARY);


Object.assign(T,{
  _layers(){return clone(LAYERS)},
  _layersCheck(){return runCheck('layers')},
  _b5Registry(){return clone(REG)},
  _b5Log(){return clone(LOG)},
  _b5Scan(force){
    var n=scan(force!==false);
    log('manualScan',{added:n});
    return {added:n,records:REG.length,kinds:Object.keys(SIG).length};
  },
  _b5Register(kind,name,payload){return register(kind,name,payload)},
  _b5Replay(){return {steps:STEPS.slice(),threeKinds:{
    renderer:'TPL._b5Register("renderer","b5_probe",(r,c)=>`<b>${r.v}</b><img src=x onerror="window.__B5_PWNED__=1">`)',
    section:'TPL._formOpen(); TPL._formSecAdd(); TPL._formSave(); TPL._b5Scan()',
    action:'改 TPL_VIEW_CFG_V113:<schemaId> 的 cfg.actions push 一项 → location.reload() → TPL._b5Registry()'
  }}},
  _b5Report(){return {
    version:SUMMARY.version,batch:5,ready:!!window.__WL_B5_READY__,
    layers:{count:LAYERS.length,style:BASE.style.length,script:BASE.script.length,check:runCheck('layers')},
    registry:{records:REG.length,kinds:Object.keys(SIG).length,overlayRenderers:OVERLAY.count,
      discovered:LOG.filter(function(x){return x.k==='discovered'}),
      registered:LOG.filter(function(x){return x.k==='register'})},
    guard:{coverage:(function(){try{return T._guard().coverage}catch(e){return []}})(),
      callerOwnRisk:RISK.slice(),protectedBy:PROTECT.slice()},
    regression:run(),regressionManual:regression().filter(function(x){return x.auto==='manual'}).map(function(x){return x.id}),
    logs:LOG.slice(-30),summary:clone(SUMMARY)
  }},
  _regression(){return regression()},
  _regressionRun(){return run()},
  _regressionSteps(){return STEPS.join('\n')},
  _handoffSummary(){return summary()}
});
log('ready',{newTpl:Object.keys(T).filter(function(k){return k.indexOf('_b5')===0||k.indexOf('_regression')===0||k.indexOf('_layers')===0||k==='_handoffSummary'}).length});
})();
