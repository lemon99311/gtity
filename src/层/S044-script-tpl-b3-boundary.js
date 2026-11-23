

(function(){
'use strict';
if(window.__WL_B3_LATE__)return;
window.__WL_B3_LATE__=1;
var T=window.TPL, D=window.DETAIL;
var LOG=[], SESSIONS=[];
window.__WL_B3_LOG__=LOG;
window.__WL_B3_SESSIONS__=SESSIONS;
function log(kind,data){
  LOG.push(Object.assign({at:Date.now(),kind:kind},data||{}));
  if(LOG.length>240)LOG.shift();
}
function clone(o){ try{ return JSON.parse(JSON.stringify(o)); }catch(e){ return {}; } }
function now(){ return Date.now(); }


var BSTORE='TPL_BOUNDARY_V113:';
function bkey(){ return BSTORE+((T.schema&&T.schema.id)||'default'); }
var DEFAULT={mode:'demo',demoLabel:'前端演示数据（未连数据库）',
  strip:['^__'],annexFromDb:true,emitFormal:true,
  note:'demo = 下游取用演示包；formal = 下游取用干净正式包；两种模式演示反馈都完整保留'};
var BC=clone(DEFAULT);
try{ var raw=localStorage.getItem(bkey()); if(raw){ var o=JSON.parse(raw); if(o&&typeof o==='object')BC=Object.assign(clone(DEFAULT),o); } }catch(e){}
function saveBC(){ try{ localStorage.setItem(bkey(),JSON.stringify(BC)); }catch(e){} }
if(BC.mode!=='demo'&&BC.mode!=='formal')BC.mode='demo';
window.__WL_BOUNDARY__=clone(BC);


function debugKeys(p){
  return Object.keys(p||{}).filter(function(k){
    return (BC.strip||['^__']).some(function(r){ try{return new RegExp(r).test(k)}catch(e){return k.indexOf('__')===0} });
  });
}
function formalize(p){
  var out={}, demo=clone(p||{}), skip=debugKeys(p);
  Object.keys(p||{}).forEach(function(k){ if(skip.indexOf(k)<0)out[k]=clone(p[k]); });
  
  if(skip.indexOf('__annex')>=0&&BC.annexFromDb){
    var name=(T.schema&&T.schema.db&&T.schema.db.annexTable)||'Annex';
    out[name]=clone(p.__annex);
  }
  return {payload:out,removed:skip,annexKey:(BC.annexFromDb&&(T.schema&&T.schema.db&&T.schema.db.annexTable))||'Annex'};
}
function demoOnlyFields(){
  return ['__pageRoutes','__pageActions','__pageSpec','__columnClick','__features','__detailMeta',
    '__annex→' + ((T.schema&&T.schema.db&&T.schema.db.annexTable)||'Annex')];
}


function internalKeys(){
  var S=(T.schema||{}), out={};
  try{
    (D.sections()||[]).forEach(function(sec){
      var sp=D.specOf(sec)||{}, sm=sp.summary||{};
      if(sp.dataKey)out[sp.dataKey]='明细数组 · '+sp.dataKey;
      if(sm.target)out[sm.target]='汇总值 · '+sm.target;
    });
  }catch(e){}
  out[(S.detail&&S.detail.archKey)||'sa_arch']='资料卡 JSON';
  return out;
}
function destinations(){
  var S=T.schema||{}, map=(S.db&&S.db.dbMap)||{}, inner=internalKeys();
  var body=document.getElementById('dwBody'), pairs=[];
  if(body){
    var roots=[].slice.call(body.querySelectorAll('.dt-wrap'));
    [].slice.call(body.querySelectorAll('[data-k]')).forEach(function(e){
      if(e.classList.contains('sa-sw-cb'))return;              
      if(roots.some(function(w){return w.contains(e)}))return; 
      pairs.push({k:e.dataset.k,v:e.value});
    });
  }
  var seen={}, rows=[], missed={};
  pairs.filter(function(x){ if(seen[x.k])return false; seen[x.k]=1; return true; }).forEach(function(x){
    var k=x.k;
    var m=map[k];
    if(m&&m.p)rows.push({k:k,to:m.p,kind:'mapped',note:'dbMap 映射到存储过程参数'});
    else if(inner[k])rows.push({k:k,to:inner[k],kind:'internal',note:'由明细 / 资料卡链路处理'});
    else if(k.indexOf('__')===0)rows.push({k:k,to:'不进入输出包',kind:'internal',note:'内部状态键'});
    else { rows.push({k:k,to:'不进入任何输出包',kind:'unmapped',note:'dbMap 无映射，buildPayload 的 skipped 此前从未暴露'}); missed[k]=x.v; }
  });
  
  window.__WL_UNMAPPED_VALUES__=missed;
  return {at:now(),total:rows.length,rows:rows,
    mapped:rows.filter(function(x){return x.kind==='mapped'}).length,
    internal:rows.filter(function(x){return x.kind==='internal'}).length,
    unmapped:rows.filter(function(x){return x.kind==='unmapped'}).map(function(x){return x.k})};
}
function refreshUnmapped(){
  var d=destinations();
  window.__WL_UNMAPPED__=d;
  log('unmapped',{total:d.total,unmapped:d.unmapped.length,keys:d.unmapped});
  return d;
}


function conflictScan(secs){
  var used={}, conflicts=[];
  (secs||[]).forEach(function(sec){
    var sp=(sec&&sec.spec)||{}, sm=sp.summary||{};
    var keys=['dataKey','db'].map(function(k){return {k:k,v:String(sp[k]||'')}})
      .concat([{k:'summary.target',v:String(sm.target||'')},{k:'summary.db',v:String(sm.db||'')}]);
    keys.forEach(function(x){ if(!x.v)return; if(used[x.v])conflicts.push({sec:sec.id,key:x.k,value:x.v,with:used[x.v]}); else used[x.v]=sec.id; });
  });
  return conflicts;
}
function suffix(base,taken){
  var v=base+'_2', i=3;
  while(taken[v]){v=base+'_'+(i++);}
  return v;
}
function normalizeSections(reason,beforeSave){
  var secs=[]; try{ secs=D.sections()||[]; }catch(e){}
  var et=secs.filter(function(s){return s.renderer==='editable-table'});
  var before=conflictScan(et), resolved=[], taken={};
  et.forEach(function(sec,i){
    var sp=sec.spec||{}, sm=sp.summary||{};
    ['dataKey','db'].forEach(function(k){ if(sp[k])taken[String(sp[k])]=1; });
    if(sm.target)taken[String(sm.target)]=1; if(sm.db)taken[String(sm.db)]=1;
  });
  if(et.length>1){
    
    et.forEach(function(sec,i){
      if(i===0)return;
      var sp=sec.spec||(sec.spec={}), sm=sp.summary||(sp.summary={});
      var prev={};
      et.slice(0,i).forEach(function(o){ var a=o.spec||{}, b=a.summary||{};
        [a.dataKey,a.db,b.target,b.db].forEach(function(v){if(v)prev[String(v)]=1}); });
      var ren={};
      [['spec','dataKey'],['spec','db'],['summary','target'],['summary','db']].forEach(function(pair){
        var obj=pair[0]==='spec'?sp:sm, k=pair[1], old=String(obj[k]||'');
        if(!old||!prev[old])return;
        var nv=suffix(old,taken); taken[nv]=1; obj[k]=nv; ren[pair[0]+'.'+k]=old+' → '+nv;
      });
      
      var pv=sp.preValidate||{};
      if(pv.amountField&&ren['summary.target']&&String(pv.amountField)!==String(sm.target)){
        if(String(pv.amountField)===String(ren['summary.target'].split(' → ')[0]))pv.amountField=sm.target;
      }
      if(Object.keys(ren).length)resolved.push({sec:sec.id,renamed:ren});
    });
  }
  var report={at:now(),reason:reason,sections:et.map(function(s){
    var sp=s.spec||{}, sm=sp.summary||{};
    return {id:s.id,dataKey:sp.dataKey,db:sp.db,summaryTarget:sm.target,summaryDb:sm.db,
      amountField:(sp.preValidate||{}).amountField||'',preValidate:!!(sp.preValidate||{}).enabled};
  }),conflicts:before,resolved:resolved,normalized:!!resolved.length,
    beforeSave:beforeSave||null};
  window.__WL_B3_SECTIONS__=report;
  if(resolved.length){
    
    try{ localStorage.setItem(T._formStoreKey(),JSON.stringify(T._formConfig())); }catch(e){}
    log('sections-normalized',{reason:reason,resolved:resolved.length,conflicts:before.length,
      beforeSave:(beforeSave||[]).length});
    try{ T._toast('配置表单：检测到 '+before.length+' 处区块键冲突，已派生唯一键（可在 __WL_B3_SECTIONS__ 查看）'); }catch(e){}
  }else{
    log('sections-ok',{reason:reason,count:et.length,conflicts:before.length});
  }
  return report;
}


var seq=0;
function newSession(op){
  var s={id:'B3-'+(++seq)+'-'+now(),op:op,at:now(),phase:'created',
    closedDuring:false,result:null,committed:false,restored:false,preValidate:null,
    boundaryMode:BC.mode,demoKeys:0,formalKeys:0,unmapped:[]};
  SESSIONS.push(s); if(SESSIONS.length>40)SESSIONS.shift();
  log('session-created',{id:s.id,op:op});
  return s;
}
function current(){ return SESSIONS[SESSIONS.length-1]||null; }
function phase(p,extra){
  var s=current(); if(!s)return;
  s.phase=p; if(extra)Object.assign(s,extra);
  log('session-phase',{id:s.id,phase:p,extra:extra||{}});
}
function publishFormal(s){
  var demo=window.__DB_PAYLOAD__||{};
  var f=formalize(demo);
  window.__WL_FORMAL_PAYLOAD__=f.payload;
  window.__WL_HANDOFF__={
    mode:BC.mode,at:now(),sessionId:s?s.id:null,
    payload:(BC.mode==='formal')?clone(f.payload):clone(demo),
    formal:clone(f.payload),demo:clone(demo),
    removedFromFormal:f.removed,annexKey:f.annexKey,
    demoOnly:demoOnlyFields(),
    note:BC.mode==='formal'?'下游交出物 = 干净正式包；演示反馈仍完整保留':'下游交出物 = 演示包（与优化前一致）；正式包见 handoff.formal',
    result:s?s.result:null,validated:s?s.preValidate:null
  };
  if(s){ s.demoKeys=Object.keys(demo).length; s.formalKeys=Object.keys(f.payload).length; }
  log('handoff',{mode:BC.mode,demoKeys:s?s.demoKeys:0,formalKeys:s?s.formalKeys:0,removed:f.removed.length});
  return window.__WL_HANDOFF__;
}
function wrap(name,fn){
  if(typeof T[name]!=='function')return;
  var raw=T[name];
  T[name]=function(){ return fn.call(this,raw,arguments); };
}

function submitWrap(raw,args,op){
  var s=newSession(op);
  refreshUnmapped();
  s.unmapped=(window.__WL_UNMAPPED__||{}).unmapped||[];
  var d=destinations(); window.__WL_FIELD_DEST__=d;
  var ret=raw.apply(T,args);
  
  s.demoKeys=Object.keys(window.__DB_PAYLOAD__||{}).length;
  if(s.phase==='created')phase('collected',{demoKeys:s.demoKeys});
  else log('payload-built',{id:s.id,phase:s.phase,demoKeys:s.demoKeys});
  publishFormal(s);
  return ret;
}
wrap('_save',function(raw,args){ return submitWrap(raw,args,'save'); });
wrap('_retry',function(raw,args){ return submitWrap(raw,args,'retry'); });


function markClosed(how){
  var s=current();
  if(s&&['created','collected','validating','loading'].indexOf(s.phase)>=0){
    s.closedDuring=true; phase('aborted',{how:how});
  }else log('closed',{how:how,phase:s?s.phase:'none'});
}
wrap('_close',function(raw,args){ markClosed('drawer-close'); return raw.apply(T,args); });
wrap('_closeResult',function(raw,args){ log('close-result',{done:!!args[0]}); return raw.apply(T,args); });


['commit','restore','showValidateError','clearValidateError','preValidateTasks'].forEach(function(k){
  if(!D||typeof D[k]!=='function')return;
  var raw=D[k];
  D[k]=function(){
    var s=current();
    if(k==='commit'){ if(s)s.committed=true; log('detail-commit',{session:s?s.id:null}); }
    if(k==='restore'){ if(s)s.restored=true; log('detail-restore',{session:s?s.id:null}); }
    if(k==='showValidateError'){
      var bad=arguments[0]||{};
      
      if(bad&&bad.aborted){
        window.__WL_B3_PREVALIDATE__={ok:false,aborted:true,session:s?s.id:null,
          secId:bad.secId,message:bad.message,at:now()};
        if(s){ s.preValidate='aborted'; s.result='aborted'; }
        if(window.__WL_HANDOFF__){ window.__WL_HANDOFF__.validated='aborted'; window.__WL_HANDOFF__.result='aborted'; }
        log('submit-aborted-safe',{session:s?s.id:null,how:'prevalidate'});
        return;
      }
      window.__WL_B3_PREVALIDATE__={ok:false,session:s?s.id:null,secId:bad.secId,api:bad.api,
        amount:bad.amount,limit:bad.limit,message:bad.message,at:now()};
      if(s){s.preValidate='fail';s.result='blocked';}
      if(window.__WL_HANDOFF__){ window.__WL_HANDOFF__.validated='fail'; window.__WL_HANDOFF__.result='blocked'; }
      phase('blocked',{secId:bad.secId,amount:bad.amount});
    }
    if(k==='preValidateTasks'){
      var ret=raw.apply(D,arguments);
      var n=(ret&&ret.length)||0;
      if(s){ s.preValidateTasks=n; s.preValidate=n?'running':'skip'; }
      if(s&&n){
        
        ret=ret.map(function(pr){
          return Promise.resolve(pr).then(function(r){
            if(s.closedDuring){
              log('prevalidate-aborted',{session:s.id,secId:r&&r.secId});
              return {ok:false,aborted:true,secId:r&&r.secId,api:r&&r.api,
                message:'提交途中抽屉已关闭，本次提交已安全取消'};
            }
            return r;
          });
        });
        phase('validating',{tasks:n});
      }
      else log('prevalidate-none',{session:s?s.id:null});
      return ret;
    }
    return raw.apply(D,arguments);
  };
});

var sh=document.getElementById('srSheet');
if(sh&&window.MutationObserver){
  new MutationObserver(function(rs){
    rs.forEach(function(r){
      var st=sh.getAttribute('data-state'), s=current();
      if(st&&s&&s.phase!==st){
        s.result=(st==='loading')?null:st;
        if(s.preValidate==='running'&&(st==='loading'||st==='success')){
          s.preValidate='pass';
          var pv=window.__WL_PREVALIDATE__;
          window.__WL_B3_PREVALIDATE__=Object.assign({ok:true,session:s.id,at:now()},pv&&pv.results?{results:pv.results}:{});
        }
        phase(st,{result:s.result,preValidate:s.preValidate});
        publishFormal(s);
      }
    });
  }).observe(sh,{attributes:true,attributeFilter:['data-state']});
}


wrap('_formSave',function(raw,args){
  
  var beforeSave=[];
  try{
    var d=T._formDraft();
    var draftEt=((d&&d.layout&&d.layout.sections)||[]).filter(function(x){
      return x.renderer==='editable-table'&&x.show!==false&&x.spec; });
    beforeSave=conflictScan(draftEt);
    if(beforeSave.length)log('sections-conflict-before-save',{count:beforeSave.length,items:beforeSave});
  }catch(e){}
  var ret=raw.apply(T,args);
  try{ normalizeSections('form-save',beforeSave); }catch(e){ log('normalize-error',{msg:String(e).slice(0,160)}); }
  return ret;
});

try{ normalizeSections('boot'); }catch(e){ log('boot-normalize-error',{msg:String(e).slice(0,160)}); }


Object.assign(T,{
  _boundary(){ return clone(BC); },
  _boundaryMode(m){
    if(m!=='demo'&&m!=='formal')return clone(BC);
    BC.mode=m; saveBC(); window.__WL_BOUNDARY__=clone(BC);
    log('boundary-mode',{mode:m});
    publishFormal(current());
    return clone(BC);
  },
  _boundaryConfig(o){
    if(o&&typeof o==='object'){ BC=Object.assign(clone(BC),o); if(BC.mode!=='demo'&&BC.mode!=='formal')BC.mode='demo';
      saveBC(); window.__WL_BOUNDARY__=clone(BC); log('boundary-config',{keys:Object.keys(o)}); }
    return clone(BC);
  },
  _formalPayload(){
    if(window.__WL_FORMAL_PAYLOAD__)return clone(window.__WL_FORMAL_PAYLOAD__);
    if(window.__DB_PAYLOAD__)return clone(formalize(window.__DB_PAYLOAD__).payload);
    return null;
  },
  _handoff(){ return clone(window.__WL_HANDOFF__||null); },
  _unmapped(){ return clone(window.__WL_UNMAPPED__||null); },
  _fieldDestinations(){ return clone(window.__WL_FIELD_DEST__||destinations()); },
  _sectionConflicts(){ return clone(window.__WL_B3_SECTIONS__||null); },
  _sections(){ return clone((window.__WL_B3_SECTIONS__||{}).sections||[]); },
  _sessions(){ return clone(SESSIONS); },
  _boundaryReport(){ return {
    boundary:clone(BC),store:bkey(),
    demoPayloadKeys:Object.keys(window.__DB_PAYLOAD__||{}).length,
    formalPayloadKeys:Object.keys(window.__WL_FORMAL_PAYLOAD__||{}).length,
    removedFromFormal:(window.__WL_HANDOFF__||{}).removedFromFormal||[],
    demoOnly:demoOnlyFields(),
    unmapped:(window.__WL_UNMAPPED__||{}).unmapped||[],
    unmappedValues:clone(window.__WL_UNMAPPED_VALUES__||{}),
    destinations:(window.__WL_FIELD_DEST__||{}).total||0,
    sections:(window.__WL_B3_SECTIONS__||{}).sections||[],
    conflicts:(window.__WL_B3_SECTIONS__||{}).conflicts||[],
    sessions:SESSIONS.length,lastSession:clone(current()),
    logs:LOG.slice(-30),dbPayloadContract:'保持不变'
  }; },
  
  _b3DualPreset(conflict){
    var pre=clone((T._formSpec()||{}).detailPreset||{}); if(!pre.spec)return null;
    T._formOpen(); T._formLoadPreset(false); T._formSecAdd();
    var d=T._formDraft(), arr=(d&&d.layout&&d.layout.sections)||[], sec=arr[arr.length-1];
    if(!sec)return null;
    var sp=clone(pre.spec);
    if(!conflict){
      sp.dataKey='details2'; sp.db='Details2';
      sp.summary=Object.assign({},sp.summary,{target:'totalAmount2',db:'TotalAmount2'});
      sp.preValidate=Object.assign({},sp.preValidate,{amountField:'totalAmount2',limit:8000});
    }
    T._formSec(sec.id,'renderer','editable-table');
    T._formSec(sec.id,'title',conflict?'入库明细（键冲突示例）':'入库复核明细（第二区块）');
    T._dtSpecJSON(sec.id,JSON.stringify(sp));
    T._formSave();
    
    var rep=clone(window.__WL_B3_SECTIONS__||{});
    return {secondId:sec.id,conflict:!!conflict,report:rep};
  },
  _b3DualConflict(){ return T._b3DualPreset(true); },
  _b3Report(){ return T._boundaryReport(); }
});
window.__WL_B3_READY__=true;
})();
