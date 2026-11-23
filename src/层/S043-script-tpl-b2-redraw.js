

(function(){
'use strict';
if(window.__WL_B2_LATE__)return;
window.__WL_B2_LATE__=1;

var T=window.TPL, D=window.DETAIL;
var R=window.__WL_REDRAW__={
  batch:'2',epoch:0,shortCircuits:0,redraws:0,idempotent:0,focusSync:0,gated:0,
  logs:[],ready:true,pending:null,queue:[],hosts:[]
};
function log(kind,data){
  R.logs.push(Object.assign({at:Date.now(),epoch:R.epoch,kind:kind},data||{}));
  if(R.logs.length>160)R.logs.shift();
}
function stamp(){ R.epoch++; }


var G={expect:null,inputEpoch:0,focusEpoch:0,mode:''};
window.__WL_B2_GATE__=function(el,name){
  if(!el)return false;
  var box=document.getElementById('dtLookup');
  
  if(name==='focus'&&(el.id==='dtLkKw'||(el.closest&&el.closest('#dtLookup')))){
    if(!box||!box.classList.contains('on')){ R.gated++; log('skip-stale-lookup-focus',{id:el.id}); return true; }
  }
  
  
  if((name==='focus'||name==='select')&&el.classList&&el.classList.contains('dt-ipt')&&G.expect){
    var tr=el.closest?el.closest('tr'):null;
    var rk=tr?tr.getAttribute('data-rk'):'', col=el.dataset?el.dataset.col:'';
    if(String(rk)!==String(G.expect.rk)||String(col)!==String(G.expect.col)){
      R.gated++; log('skip-stale-cell-focus',{rk:rk,col:col,expect:G.expect}); return true;
    }
  }
  
  if(name==='select'&&el.classList&&el.classList.contains('dt-ipt')&&G.inputEpoch>G.focusEpoch){
    R.gated++; log('skip-stale-select',{col:el.dataset?el.dataset.col:''}); return true;
  }
  return false;
};


if(T&&typeof T._dtInput==='function'){
  var rawInput=T._dtInput;
  T._dtInput=function(e,id){ G.inputEpoch++; return rawInput.call(T,e,id); };
}

function syncFocus(secId,rk,col,F,why){
  if(!D||typeof D.focusCell!=='function')return false;
  try{
    
    G.expect=null; G.focusEpoch=G.inputEpoch;
    var ok=D.focusCell(secId,String(rk),String(col),F||{});
    if(ok){
      G.expect={rk:String(rk),col:String(col)};
      G.focusEpoch=G.inputEpoch;
      R.focusSync++; log('sync-focus',{secId:secId,rowKey:String(rk),col:String(col),why:why});
    }
    return ok;
  }catch(e){ return false; }
}
function flowOf(secId){ try{ return D.flowSpec(D.byId(secId)||{}); }catch(e){ return {}; } }


if(D){
  
  if(typeof D.lookupKey==='function'){
    var rawLookupKey=D.lookupKey;
    D.lookupKey=function(e){
      var before=null; try{ before=D.lookupState; }catch(err){}
      var willPick=(e&&e.key==='Enter'&&before&&before.list&&before.list.length);
      var secId,rk,F;
      if(willPick){
        secId=before.secId; rk=String(before.rk);
        F=flowOf(secId);
      }
      stamp();
      var ret=rawLookupKey.call(D,e);
      if(willPick){
        var after=null; try{ after=D.lookupState; }catch(err){}
        if(!after){
          G.mode='picked';
          var fl=window.__WL_DT_FLOW__||{};
          if(fl.to) syncFocus(fl.secId||secId, fl.rowKey||rk, fl.to, F, 'lookup-pick');
        }
      }
      return ret;
    };
  }
  
  if(typeof D.enterFlow==='function'){
    var rawEnterFlow=D.enterFlow;
    D.enterFlow=function(secId,el){
      var F=flowOf(secId);
      stamp();
      
      G.expect=null; G.focusEpoch=G.inputEpoch;
      var ret=rawEnterFlow.call(D,secId,el);
      var fl=window.__WL_DT_FLOW__||{};
      if(D.lookupState){
        
        try{
          var kw=document.getElementById('dtLkKw');
          if(kw){ try{kw.focus({preventScroll:true});}catch(e){try{kw.focus();}catch(e2){}} R.focusSync++; log('sync-focus',{col:'#dtLkKw',why:'lookup-open'}); }
        }catch(e){}
        G.mode='lookup';
      }else if(fl.op==='append'){
        syncFocus(secId,fl.rowKey,fl.to,F,'append');
        G.mode='flow';
      }else if(fl.op==='next'||fl.op==='reuse-empty'){
        G.expect={rk:String(fl.rowKey),col:String(fl.to)}; G.focusEpoch=G.inputEpoch;
        G.mode='flow'; log('expect',{op:fl.op,rowKey:fl.rowKey,col:fl.to});
      }
      return ret;
    };
  }
  
  if(typeof D.lookupClose==='function'){
    var rawClose=D.lookupClose;
    
    D.lookupClose=function(){ stamp(); G.mode=''; G.expect=null; return rawClose.call(D); };
  }
  
  if(typeof D.lookupOpen==='function'){
    var rawOpen=D.lookupOpen;
    D.lookupOpen=function(a,b,c){ stamp(); G.mode='lookup'; return rawOpen.call(D,a,b,c); };
  }
}


if(T&&typeof T._snapshot==='function'){
  var sig={kw:undefined,toolbar:undefined,q:undefined};
  function clearSig(){ sig.kw=undefined; sig.toolbar=undefined; sig.q=undefined; }
  function snap(){ try{ return T._snapshot()||{}; }catch(e){ return {}; } }
  function wrapIdem(name,test,redraw,rec){
    if(typeof T[name]!=='function')return;
    var raw=T[name];
    T[name]=function(){
      var s=snap();
      try{
        if(test.apply(null,[s,arguments])){ R.idempotent++; log('idempotent',{fn:name,args:Array.prototype.slice.call(arguments,0,2)}); return; }
      }catch(e){}
      var ret=raw.apply(T,arguments);
      
      if(rec){ try{ rec(arguments); }catch(e){} }
      
      if(redraw)markRedraw(name);
      return ret;
    };
  }
  wrapIdem('_view',function(s,a){ return s.view===a[0]; },true);
  wrapIdem('_page',function(s,a){ return s.page===Math.max(1,+a[0]||1); });
  wrapIdem('_size',function(s,a){ return s.size===+a[0]&&s.page===1; });
  wrapIdem('_kw',function(s,a){ return sig.kw===a[0]&&s.page===1; },false,function(a){sig.kw=a[0];});
  wrapIdem('_toolbar',function(s,a){ return sig.toolbar===a[0]+'\u0000'+a[1]&&s.page===1; },false,function(a){sig.toolbar=a[0]+'\u0000'+a[1];});
  wrapIdem('_q',function(s,a){ return sig.q===a[0]+'\u0000'+a[1]&&s.page===1; },false,function(a){sig.q=a[0]+'\u0000'+a[1];});
  window.__WL_B2_CLEARSIG__=clearSig;
}


var HOSTS=['#wlElBtnHost','#wlElToolHost','#wlElCtxHost','#wlElSelHost','#wlElPageSizeHost','#wlElPagerHost','#wlElTable'];
function hostState(){
  var out=[];
  HOSTS.forEach(function(sel){ var h=document.querySelector(sel); if(h)out.push({sel:sel,mounted:!!h.__wlMounted}); });
  return out;
}
function isReady(){
  var hs=hostState(); R.hosts=hs;
  if(!hs.length)return true;                       
  if(window.__WL_HAS_EL__&&(!window.__WL_EL__||!window.__WL_EL__.ready))return false;
  return hs.every(function(h){return h.mounted});
}
function markRedraw(reason){
  stamp();
  var now=Date.now();
  if(reason==='main-replaced'&&now-(R.lastMarkAt||0)<80){ return; }  
  R.lastMarkAt=now;
  R.redraws++; R.ready=false; R.pending=reason; log('redraw',{reason:reason});
  if(typeof window.__WL_B2_CLEARSIG__==='function')window.__WL_B2_CLEARSIG__();
  
  var tries=0;
  var check=function(){
    if(isReady()){
      R.ready=true; R.pending=null; log('ready',{hosts:R.hosts.length,tries:tries});
      var q=R.queue.splice(0); q.forEach(function(fn){ try{fn()}catch(e){ log('gate-error',{msg:String(e).slice(0,120)}); } });
    }else if(++tries<24){
      window.requestAnimationFrame?requestAnimationFrame(check):setTimeout(check,16);
    }else{
      R.ready=true; R.pending=null; log('ready-timeout',{hosts:R.hosts.length});
      var q2=R.queue.splice(0); q2.forEach(function(fn){ try{fn()}catch(e){} });
    }
  };
  Promise.resolve().then(function(){ Promise.resolve().then(check); });
}

['_vcSave','_formSave'].forEach(function(k){
  if(!T||typeof T[k]!=='function')return;
  var raw=T[k];
  T[k]=function(){ var ret=raw.apply(T,arguments); markRedraw(k); return ret; };
});

var main=document.getElementById('main');
if(main&&window.MutationObserver){
  var seen=main.querySelector('.wl-page');
  new MutationObserver(function(){
    var now=main.querySelector('.wl-page');
    if(now&&now!==seen){ seen=now; markRedraw('main-replaced'); }
  }).observe(main,{childList:true,subtree:false});
}

if(T){
  T._redrawReady=function(){ return {ready:R.ready,pending:R.pending,hosts:hostState(),queue:R.queue.length,epoch:R.epoch}; };
  T._redrawGate=function(fn){ if(typeof fn!=='function')return false; if(R.ready){try{fn()}catch(e){}} else R.queue.push(fn); return true; };
  T._redraw=function(){ return {epoch:R.epoch,shortCircuits:R.shortCircuits,redraws:R.redraws,
    idempotent:R.idempotent,focusSync:R.focusSync,gated:R.gated,ready:R.ready,
    logs:R.logs.slice(-40)}; };
}
R.installed=true;
})();
