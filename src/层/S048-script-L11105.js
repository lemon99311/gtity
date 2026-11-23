

(function(){
'use strict';
var T=window.TPL, D=window.DETAIL, GU=window.GUARD;
if(!T||!D)return;
if(window.__WL_DT_UI_INSTALLED__)return;
window.__WL_DT_UI_INSTALLED__=1;

var ROWNO_W=40;          
var ROW_H=30, HEAD_H=30, FOOT_H=30;   
var ST={writes:0,blocks:0,lastReasons:[],rendered:{},delLog:[],sweeps:0,hits:0,lastTargets:[]};


var CSS=[

'#drawer .dt-tbl col.dt-rn-col{width:'+ROWNO_W+'px}',
'#drawer .dt-tbl th.dt-rn-h{width:'+ROWNO_W+'px;text-align:center;color:#909aaa;font-weight:600}',
'#drawer .dt-tbl td.dt-rn{position:relative;text-align:center;padding:0}',
'#drawer .dt-tbl .dt-rn-n{display:inline-block;font-variant-numeric:tabular-nums;',
'  color:#909aaa;transition:opacity .15s}',
'#drawer .dt-tbl .dt-rn-del{position:absolute;inset:0;display:flex;align-items:center;',
'  justify-content:center;width:100%;height:100%;padding:0;border:0;background:transparent;',
'  color:#e66544;font:inherit;font-size:14px;line-height:1;cursor:pointer;',
'  opacity:0;transition:opacity .15s}',
'#drawer .dt-tbl td.dt-rn.has-del:hover .dt-rn-n{opacity:0}',
'#drawer .dt-tbl td.dt-rn.has-del:hover .dt-rn-del,',
'#drawer .dt-tbl .dt-rn-del:focus-visible{opacity:1}',
'#drawer .dt-tbl .dt-rn-del:hover{background:#fff1ec}',

'#drawer .dt-wrap[data-b7-max] .dt-tblbox{max-height:var(--dt-max);overflow:auto}',
'#drawer .dt-wrap[data-b7-max] .dt-tbl thead th{position:sticky;top:0;z-index:2}',
'#drawer .dt-wrap[data-b7-max] .dt-tbl tfoot td{position:sticky;bottom:0;z-index:2}',

'#drawer .dt-ipt[type="number"]::-webkit-inner-spin-button,',
'#drawer .dt-ipt[type="number"]::-webkit-outer-spin-button{-webkit-appearance:none;',
'  appearance:none;margin:0}',
'#drawer .dt-ipt[type="number"]{-moz-appearance:textfield;appearance:textfield}'
].join('\n');
if(!document.getElementById('tpl-b7-detail-ui')){
  
  document.head.insertAdjacentHTML('beforeend','<style id="tpl-b7-detail-ui">'+CSS+'</style>');
}


function gt(v){
  if(GU&&GU.text)return GU.text(v);
  return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function harden(html){
  var r=(GU&&GU.harden)?GU.harden(html):{html:html,hit:false,reasons:[]};
  if(r.hit){ ST.blocks++; ST.lastReasons=(r.reasons||[]).slice(0,6); }
  return r.html;
}

function put(el,pos,html){ el.insertAdjacentHTML(pos,harden(html)); }
function finite(v,lo,hi){
  var n=+v;
  return (isFinite(n)&&n>=lo&&n<=hi)?Math.round(n):0;
}
function globalDefaults(){
  try{ return ((T._formSpec&&T._formSpec())||{}).detailDefaults||{}; }catch(e){ return {}; }
}
function specOf(secId){
  try{ var s=D.byId(secId); return s?(D.specOf(s)||{}):{}; }catch(e){ return {}; }
}

function maxPxFor(secId){
  var g=globalDefaults(), s=specOf(secId);
  var px=finite(s.bodyMaxHeight,1,2000)||finite(g.bodyMaxHeight,1,2000)||0;
  if(!px){
    var rows=finite(s.bodyMaxRows,1,200)||finite(g.bodyMaxRows,1,200)||0;
    if(rows)px=rows*ROW_H+HEAD_H+FOOT_H;
  }
  return px;
}
function popupCfg(){
  try{
    var f=(T._formSpec&&T._formSpec())||{}, src=f.lookupSources||{}, out={};
    Object.keys(src).forEach(function(k){
      var o=src[k]||{};
      out[k]={popupHeight:finite(o.popupHeight,120,1200),
              popupMaxHeight:finite(o.popupMaxHeight,120,1200),
              heightDoc:o.popupHeightDoc||'', maxHeightDoc:o.popupMaxHeightDoc||''};
    });
    return out;
  }catch(e){ return {}; }
}


var RN_COL='<col class="dt-rn-col" style="width:'+ROWNO_W+'px">';
var RN_TH='<th class="dt-rn-h" title="行号">'+gt('#')+'</th>';
function rnTd(n,editable){
  return '<td class="dt-rn'+(editable?' has-del':'')+'" data-rn="'+gt(String(n))+'" title="第 '+gt(String(n))+' 行">'
       + '<span class="dt-rn-n">'+gt(String(n))+'</span>'
       + (editable?'<button type="button" class="dt-rn-del" data-act="del" title="删除此行">'
                  + gt('×') + '</button>':'')
       + '</td>';
}


function decorateDOM(w){
  if(!w||w.getAttribute&&w.getAttribute('data-b7')==='1')return;
  var tbl=w.querySelector&&w.querySelector('table.dt-tbl'); if(!tbl)return;
  var cg=tbl.querySelector('colgroup'),
      headTr=tbl.querySelector('thead tr'),
      tbody=tbl.querySelector('tbody'),
      footTr=tbl.querySelector('tfoot tr');
  if(!cg||!headTr||!tbody)return;

  var lastTh=headTr.lastElementChild;
  var hasOpTh=!!(lastTh&&/^\s*操作\s*$/.test(lastTh.textContent||''));
  var editable=hasOpTh||!!tbl.querySelector('input.dt-ipt');
  var trs=[].slice.call(tbody.rows);
  
  var removeOp=!!(hasOpTh&&trs.length&&trs.every(function(tr){
    var td=tr.lastElementChild;
    return !!(td&&td.classList.contains('c')&&
      td.querySelectorAll('button').length===1&&td.querySelector('[data-act="del"]'));
  }));

  var secId=w.getAttribute('data-sec')||'';
  var maxPx=maxPxFor(secId);

  put(cg,'afterbegin',RN_COL);
  put(headTr,'afterbegin',RN_TH);
  trs.forEach(function(tr,i){
    put(tr,'afterbegin',rnTd(i+1,editable));
    if(removeOp){
      var last=tr.lastElementChild;
      if(last&&last.querySelector('[data-act="del"]'))last.remove();
    }
  });
  if(removeOp){
    if(lastTh)lastTh.remove();
    if(cg.lastElementChild)cg.lastElementChild.remove();
  }else if(footTr){
    
    var cell=footTr.querySelector('[colspan]');
    if(cell)cell.setAttribute('colspan',+cell.getAttribute('colspan')+1);
  }
  
  var st=tbl.getAttribute('style')||'', m=/min-width:\s*(\d+)px/i.exec(st);
  if(m)tbl.setAttribute('style',st.replace(/min-width:\s*\d+px/i,'min-width:'+(+m[1]+ROWNO_W)+'px'));
  
  if(maxPx>0){ w.setAttribute('data-b7-max','1'); w.style.setProperty('--dt-max',maxPx+'px'); }
  w.setAttribute('data-b7','1');
  ST.writes++;
  ST.rendered[secId]={secId:secId,rows:trs.length,rowNo:true,rowNoWidth:ROWNO_W,
    editable:editable,maxHeight:maxPx,opColumnRemoved:removeOp,at:Date.now()};
}


var LOCK=false;

function sweep(){
  if(LOCK)return;
  var host=document.getElementById('dwBody')||document.body;
  var all=host.querySelectorAll?host.querySelectorAll('.dt-wrap'):[];
  var hits=[], seen={};
  [].slice.call(all).forEach(function(w){
    if(w.getAttribute('data-b7')==='1')return;
    var id=w.id||('x'+Math.random());
    if(seen[id])return; seen[id]=1; hits.push(w);
  });
  ST.sweeps++;
  if(!hits.length)return;
  ST.hits+=hits.length;
  ST.lastTargets=hits.map(function(w){ return String(w.getAttribute('data-sec')||w.id||''); }).slice(0,8);
  LOCK=true;
  try{ hits.forEach(decorateDOM); }catch(e){}finally{ LOCK=false; }
}
var mo=new MutationObserver(function(){ sweep(); });
mo.observe(document.getElementById('dwBody')||document.body,{childList:true,subtree:true});

sweep();


var rawDel=D.delRow;
D.delRow=function(secId,rk){
  var ret=rawDel.call(D,secId,rk);
  ST.delLog.push({secId:String(secId),rowKey:String(rk),at:Date.now()});
  if(ST.delLog.length>60)ST.delLog.shift();
  return ret;
};


function clone(o){ try{ return JSON.parse(JSON.stringify(o)); }catch(e){ return {}; } }
window.__WL_DT_UI__=function(){
  var g=globalDefaults();
  var pc=popupCfg(), pk=Object.keys(pc)[0]||'', pv=pc[pk]||{};
  var pMode=pv.popupHeight?'fixed':(pv.popupMaxHeight?'max':'auto');
  var bySec={};
  try{ (D.sections()||[]).forEach(function(s){
    bySec[s.id]={bodyMaxHeight:(s.spec||{}).bodyMaxHeight||0,
                 bodyMaxRows:(s.spec||{}).bodyMaxRows||0,
                 effectivePx:maxPxFor(s.id)};
  }); }catch(e){}
  return {
    version:'1.42',
    rowNo:{width:ROWNO_W,inSpecColumns:false,hasDataCol:false,hasDataK:false,
           readOnlyShowsNumberOnly:true},
    maxHeight:{rowH:ROW_H,headH:HEAD_H,footH:FOOT_H,
      global:{bodyMaxHeight:g.bodyMaxHeight||0,bodyMaxRows:g.bodyMaxRows||0},
      bySection:bySec,mode:'纯 CSS / 表头吸顶 + 合计栏吸底 / 无 scrollIntoView'},
    numberSpinner:{cssOnly:true,typePreserved:true},
    popupHeight:{mode:pMode,activePx:pv.popupHeight||pv.popupMaxHeight||0,
      sources:pc,
      semantics:'popupHeight=固定高度(优先) / popupMaxHeight=最大高度 / 缺失或不合法=自适应',
      runtime:(window.__WL_LOOKUP_GRID__?window.__WL_LOOKUP_GRID__().heightMode:null)},
    rendered:clone(ST.rendered),
    delLog:clone(ST.delLog),
    guard:{writes:ST.writes,blocks:ST.blocks,reasons:ST.lastReasons.slice()},
    observer:{installed:true,target:'#dwBody',mode:'childList+subtree / 全量扫描 / 就地装饰 / 不替换 wrap',
      sweeps:ST.sweeps,hits:ST.hits,lastTargets:ST.lastTargets.slice()},
    opColumn:{removedWhenDelOnly:true,reason:'行号格已承接删除，避免两个删除入口；操作列其他按钮保留'}
  };
};
T._dtUi=window.__WL_DT_UI__;
})();
