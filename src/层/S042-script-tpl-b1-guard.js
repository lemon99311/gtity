

(function(){
'use strict';
if(window.__WL_GUARD_LATE__)return;
window.__WL_GUARD_LATE__=1;
var G=window.__WL_GUARD__||(window.__WL_GUARD__={batch:'1',writes:0,blocks:[],audits:[]});


function audit(name,obj){
  var raw;
  try{ raw=typeof obj==='string'?obj:JSON.stringify(obj); }catch(e){ raw=String(obj); }
  raw=raw||'';
  var hits={
    script:(raw.match(/<\s*script/gi)||[]).length,
    protocol:(raw.match(/javascript\s*:|vbscript\s*:|data\s*:\s*text\s*\/\s*html/gi)||[]).length,
    onattr:(raw.match(/\bon[a-z]+\s*=\s*["']/gi)||[]).length,
    angle:(raw.match(/<\s*\/?\s*[a-z][^>]{0,80}>/gi)||[]).length
  };
  var suspicious=hits.script+hits.protocol+hits.onattr;
  G.audits.push({name:name,at:Date.now(),length:raw.length,suspicious:suspicious,hits:hits});
  if(G.audits.length>80)G.audits.shift();
  return suspicious;
}
var T=window.TPL;
if(T){
  if(typeof T.apply==='function'){
    var origApply=T.apply;
    T.apply=function(s){ audit('TPL.apply',s); return origApply.call(T,s); };
  }
  
  T._guard=function(){
    return {writes:G.writes,blocks:G.blocks.slice(),audits:G.audits.slice(),
      coverage:(G.coverage||[]).slice(),install:G.install||'early',
      harden:window.GUARD?window.GUARD.harden:null,
      scan:scan};
  };
  T._guardHarden=function(v){ return window.GUARD?window.GUARD.harden(v):{html:v,hit:false,reasons:[]}; };
}


function scan(){
  var out={elements:0,badAttrs:[],scripts:[]};
  var all=document.querySelectorAll('*');
  for(var i=0;i<all.length;i++){
    var el=all[i]; out.elements++;
    var ats=el.attributes||[];
    for(var j=0;j<ats.length;j++){
      var n=ats[j].name||'', v=ats[j].value||'';
      if(/^on/i.test(n)&&/\b(?:alert\s*\(|eval\s*\(|prompt\s*\(|confirm\s*\(|Function\s*\(|javascript\s*:|<\s*script)/i.test(v))
        out.badAttrs.push({tag:el.tagName,attr:n,value:v.slice(0,80)});
    }
    
    if(/^script$/i.test(el.tagName)&&!el.type){
      var src=el.getAttribute('src')||'', txt=(el.textContent||'').slice(0,400);
      if(/javascript\s*:|vbscript\s*:/i.test(src)||/\b(?:alert|eval|prompt|confirm|Function)\s*\(/.test(txt))
        out.scripts.push({id:el.id||'',src:src.slice(0,60)});
    }
  }
  return out;
}
window.GUARD.scan=scan;


var KEYS=['TPL_SCHEMA_V113','TPL_VIEW_CFG_V113'];
try{
  for(var k=0;k<localStorage.length;k++){
    var key=localStorage.key(k);
    if(key&&key.indexOf('TPL_VIEW_CFG_V113:')===0)KEYS.push(key);
    if(key&&key.indexOf('TPL_FORM_CFG_V113:')===0)KEYS.push(key);
  }
}catch(e){}
KEYS.forEach(function(k){
  try{ var v=localStorage.getItem(k); if(v!=null)audit('localStorage:'+k,v); }catch(e){}
});
G.ready=true;
})();
