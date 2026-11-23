

(function(){
'use strict';
var T=window.TPL, D=window.DETAIL, GU=window.GUARD;
if(!T||!D)return;
if(window.__WL_BATCH_INSTALLED__)return;
window.__WL_BATCH_INSTALLED__=1;


var CSS=[
'#dtLookup.lg-batch .ba-mode{display:inline-block;margin-left:8px;padding:1px 7px;',
'  border-radius:9px;background:#e6efff;color:#0052d9;font-size:10px;font-weight:600;font-style:normal}',
'#dtLookup.lg-batch .lg-tbl td.ba-cell{padding:0 5px}',
'#dtLookup.lg-batch .ba-ipt{width:100%;height:23px;padding:0 5px;border:1px solid #dadee3;',
'  border-radius:3px;background:#fff;color:#2e405e;font:inherit;font-size:11.5px;',
'  text-align:right;outline:none;-moz-appearance:textfield;appearance:textfield}',
'#dtLookup.lg-batch .ba-ipt::-webkit-inner-spin-button,',
'#dtLookup.lg-batch .ba-ipt::-webkit-outer-spin-button{-webkit-appearance:none;appearance:none;margin:0}',
'#dtLookup.lg-batch .ba-ipt:focus{border-color:#0052d9;box-shadow:0 0 0 2px rgba(0,82,217,.10)}',
'#dtLookup.lg-batch .ba-ipt.ba-warn{border-color:#e66544;background:#fff6f2;color:#c2462a}',
'#dtLookup.lg-batch .lg-tbl tbody tr.on .ba-ipt{background:#f2f7ff}',
'#dtLookup.lg-batch .lg-tbl tbody tr:hover .ba-ipt{background:#fbfcff}'
].join('\n');
if(!document.getElementById('tpl-b8-batch')){
  document.head.insertAdjacentHTML('beforeend','<style id="tpl-b8-batch">'+CSS+'</style>');
}


function sources(){
  try{ var f=(T._formSpec&&T._formSpec())||{}; return f.lookupSources||{}; }
  catch(e){ return {}; }
}
function finite(v,lo,hi){ var n=+v; return (isFinite(n)&&n>=lo&&n<=hi)?Math.round(n):0; }
function text(v){ return String(v==null?'':v); }
function specOf(source){
  var src=sources()[source];
  if(!src||typeof src!=='object')return null;
  var mode=text(src.mode);
  if(mode!=='sale'&&mode!=='return')return null;         
  var qtyField=text(src.qtyField), batchField=text(src.batchField), expiryField=text(src.expiryField);
  if(!qtyField||!batchField||!expiryField)return null;    
  var feat=(src.features&&src.features[mode])||{};
  var cols=[];
  (Array.isArray(src.columns)?src.columns:[]).forEach(function(c){
    c=c||{};
    if(c.hidden===true||c.hidden==='true')return;
    var role=text(c.role);
    if(role==='price'&&feat.showPrice===false)return;    
    
    if(role==='price'&&src.showPriceColumn!==true)return;
    var t=text(c.t==null?(c.label==null?c.k:c.label):c.t);
    if(role==='available'&&feat.availableLabel)t=text(feat.availableLabel);
    if(role==='alloc'&&feat.allocLabel)t=text(feat.allocLabel);
    if(role==='price'&&feat.priceLabel)t=text(feat.priceLabel);
    cols.push({k:text(c.k),t:t,w:Math.max(36,Math.min(600,+c.w||90)),role:role});
  });
  if(!cols.length)return null;
  return {
    source:source,mode:mode,label:text(src.label==null?source:src.label),
    qtyField:qtyField,priceField:text(src.priceField),batchField:batchField,expiryField:expiryField,
    demandField:text(src.demandField),priceFloorField:text(src.priceFloorField),
    priceFloor:+src.priceFloor||0,writeMap:(src.writeMap&&typeof src.writeMap==='object')?src.writeMap:{},
    
    inventoryIdField:text(src.inventoryIdField),inPriceField:text(src.inPriceField),
    priceBar:(src.priceBar&&typeof src.priceBar==='object')?src.priceBar:null,
    feat:{autoAllocate:feat.autoAllocate!==false,showPrice:feat.showPrice!==false,
          priceEditable:feat.priceEditable!==false},
    size:Math.max(1,Math.min(200,+src.pageSize||10)),
    rows:Array.isArray(src.rows)?src.rows:[],cols:cols
  };
}
function active(){
  var st=null; try{ st=D.lookupState; }catch(e){}
  return !!(st&&specOf(st.source));
}

function DEC(){ return window.__WL_B9_DECORATE__||null; }

function flowRaw(secId){
  var f=null;
  try{ var sec=D.byId(secId); f=sec&&sec.spec&&sec.spec.flow; }catch(e){}
  return (f&&typeof f==='object')?f:{};
}


var B={st:null,spec:null,source:'',mode:'',rows:[],alloc:[],prices:[],origPrices:[],
       auto:[],demand:0,rebateRate:0,
       warn:[],blocks:0,writes:0,lastSplit:0,lastResult:null,last:null};

function snapshot(){
  var sp=B.spec;
  return {mode:B.mode,source:B.source,demand:B.demand,remain:B.remain||0,
    auto:B.auto.slice(),alloc:B.alloc.slice(),prices:B.prices.slice(),
    origPrices:B.origPrices.slice(),rebateRate:B.rebateRate,rows:clone(B.rows),
    config:sp?{qtyField:sp.qtyField,priceField:sp.priceField,batchField:sp.batchField,
      expiryField:sp.expiryField,demandField:sp.demandField,writeMap:clone(sp.writeMap),
      features:clone(sp.feat),pageSize:sp.size,columns:sp.cols.map(function(c){
        return {k:c.k,t:c.t,w:c.w,role:c.role}; })}:null};
}
function clone(o){ try{ return JSON.parse(JSON.stringify(o)); }catch(e){ return {}; } }
function sum(a){ var s=0; for(var i=0;i<a.length;i++)s+=(+a[i]||0); return Math.round(s*1e6)/1e6; }
function availOf(i){ var o=B.rows[i]||{}, sp=B.spec; return Math.max(0,+o[sp.qtyField]||0); }
function floorOf(i,p){
  var sp=B.spec, o=B.rows[i]||{}, f=0, from='';
  if(sp.priceFloorField&&o[sp.priceFloorField]!=null){ f=+o[sp.priceFloorField]||0; from='进价'; }
  else if(sp.priceFloor>0){ f=sp.priceFloor; from='最低价'; }
  var hit=(f>0&&p<f);
  return {value:f,hit:hit,from:from,tip:hit?('低于'+from+' '+f+'，请确认'):'单价'};
}

function ensureState(st,sp){
  if(!st||!sp)return;
  if(B.st===st&&B.source===sp.source)return;
  B.st=st; B.spec=sp; B.source=sp.source; B.mode=sp.mode; B.rows=sp.rows;
  B.alloc=[]; B.prices=[]; B.origPrices=[]; B.auto=[]; B.rebateRate=0;
  B.warn=[]; B.lastResult=null; B.lastSplit=0;
  var rowObj=null; try{ rowObj=D.row(st.secId,st.rk); }catch(e){}
  var demand=0;
  if(sp.mode==='sale'&&sp.demandField&&rowObj)demand=Math.max(0,+rowObj[sp.demandField]||0);
  B.demand=demand;
  var remain=demand, dec=DEC();
  for(var i=0;i<sp.rows.length;i++){
    var o=sp.rows[i]||{}, avail=Math.max(0,+o[sp.qtyField]||0), take=0;
    
    var sk=!!(dec&&dec.rowFlags&&dec.rowFlags({st:st,spec:sp,rows:sp.rows},i,o).skip);
    if(!sk&&sp.mode==='sale'&&sp.feat.autoAllocate){ take=Math.min(avail,remain); remain-=take; }
    B.alloc.push(take); B.auto.push(take);
    B.prices.push(sp.priceField?(+o[sp.priceField]||0):0);
  }
  B.remain=Math.max(0,Math.round(remain*1e6)/1e6);
  
  B.origPrices=B.prices.slice();
  B.last=snapshot();
}

function rows(){
  var st=null; try{ st=D.lookupState; }catch(e){}
  var sp=st?specOf(st.source):null; if(!sp)return [];
  ensureState(st,sp);
  return sp.rows.slice();
}


function render(c){
  var st=c.st, sp=specOf(st.source);
  if(!sp)return {cap:'',grid:'',ft:'',totalW:0};
  ensureState(st,sp);
  var dec=DEC(), dctx={st:st,spec:sp,rows:sp.rows,alloc:B.alloc,tx:c.tx,at:c.at,
                       box:c.box,page:c.page,pages:c.pages};
  
  var cols=sp.cols.concat((dec&&dec.cols)?(dec.cols(dctx)||[]):[]);
  var start=c.start, slice=c.slice, activeIdx=c.active;
  var box=c.box;
  if(box&&box.classList)box.classList.add('lg-batch');
  var totalW=cols.reduce(function(a,x){ return a+x.w; },0);
  var colHtml=cols.map(function(x){ return '<col style="width:'+x.w+'px">'; }).join('');
  var th=cols.map(function(x){ return '<th style="width:'+x.w+'px">'+c.tx(x.t)+'</th>'; }).join('');
  var body=slice.length?slice.map(function(o,i){
    var gi=start+i, html='';
    var fl=(dec&&dec.rowFlags)?(dec.rowFlags(dctx,gi,o)||{}):{};
    var cls=' class="'+(gi===activeIdx?'on ':'')+(fl.cls||'')+'"';
    for(var j=0;j<cols.length;j++){
      var col=cols[j], v, s;
      if(col.role==='alloc'){
        v=B.alloc[gi]||0;
        html+='<td class="ba-cell"><input type="number" class="ba-ipt'+(fl.cls?' '+fl.cls+'-ipt':'')+
             '" data-ba="alloc" data-i="'+gi+'"'+(fl.expired?' disabled':'')+
             ' min="0" max="'+c.at(text(availOf(gi)))+'" step="any" value="'+c.at(text(fl.expired?0:v))+
             '" title="'+c.at(fl.title||('本次'+(sp.mode==='sale'?'分配':'退货')+'数量，不超过 '+availOf(gi)))+'"></td>';
      }else if(col.role==='price'){
        
        v=B.prices[gi]||0;
        var fw=floorOf(gi,v);
        if(sp.feat.priceEditable){
          html+='<td class="ba-cell"><input type="number" class="ba-ipt'+(fw.hit?' ba-warn':'')+
               '" data-ba="price" data-i="'+gi+'" min="0" step="any" value="'+c.at(text(v))+
               '" title="'+c.at(fw.tip)+'"></td>';
        }else{
          html+='<td title="'+c.at(text(v))+'">'+c.tx(text(v))+'</td>';
        }
      }else{
        v=(col.role==='available')?o[sp.qtyField]:o[col.k];
        s=text(v);
        html+='<td title="'+c.at(s)+'">'+c.tx(s)+'</td>';
      }
    }
    return '<tr data-lk="row" data-i="'+gi+'"'+cls+'>'+html+'</tr>';
  }).join(''):'<tr class="lg-none"><td colspan="'+cols.length+'">暂无批次</td></tr>';
  var modeTip=(sp.mode==='sale')
    ? '近效期优先自动分配 · 可改分配量 / 单价 · 数量为 0 的批次不回填'
    : '手动填写退货数量（不超过可退数量）· 不显示单价';
  var cap='<div class="lg-hd"><div class="lg-cap"><span>批号选录 · <b>'+c.tx(sp.label)+'</b>'+
    '<em class="ba-mode" data-mode="'+c.at(sp.mode)+'">'+
    c.tx(sp.mode==='sale'?'销售出库 · 自动分配':'销退入库 · 手动选择')+'</em></span>'+
    '<span class="lg-meta">共 '+sp.rows.length+' 批 · 需求 '+c.tx(text(B.demand))+
    ' · 已分配 '+c.tx(text(sum(B.alloc)))+'</span></div></div>';
  var grid='<div class="lg-scroll"><table class="lg-tbl" style="width:'+totalW+'px">'+
    '<colgroup>'+colHtml+'</colgroup><thead><tr>'+th+'</tr></thead><tbody>'+body+'</tbody></table></div>';
  var ft='<div class="lg-ft"><div class="lg-pager">'+
    '<button type="button" data-lk="prev"'+(c.page<=0?' disabled':'')+'>上一页</button>'+
    '<span class="lg-page">第 <b>'+(c.page+1)+'</b> / '+c.pages+' 页</span>'+
    '<button type="button" data-lk="next"'+(c.page>=c.pages-1?' disabled':'')+'>下一页</button>'+
    '</div><span class="lg-tip">'+c.tx(modeTip)+'</span>'+
    
    '<div class="lg-acts"><button type="button" class="lg-ok" data-lk="ok">确定</button>'+
    '<button type="button" data-lk="close">取消</button></div></div>';
  B.writes++;
  var out={cap:cap,grid:grid,ft:ft,totalW:totalW};
  
  if(dec&&dec.sections){
    var s=dec.sections(dctx,out)||{};
    if(s.cap!=null)out.cap=s.cap;
    if(s.grid!=null)out.grid=s.grid;
    if(s.ft!=null)out.ft=s.ft;
    if(+s.totalW>0)out.totalW=+s.totalW;
  }
  return out;
}


function syncInput(el){
  if(!el||!el.getAttribute)return;
  var a=el.getAttribute('data-ba'), i=+el.getAttribute('data-i');
  if(!a||isNaN(i)||!B.spec)return;
  if(a==='alloc'){
    var max=availOf(i), v=+el.value||0;
    if(v<0)v=0; if(v>max)v=max;
    
    if(parseFloat(el.value)!==v) el.value=text(v);
    B.alloc[i]=v;
  }else if(a==='price'){
    var p=+el.value||0; if(p<0)p=0;
    B.prices[i]=p;
    var fw=floorOf(i,p);
    if(el.classList)el.classList.toggle('ba-warn',fw.hit);
    if(el.setAttribute)el.setAttribute('title',fw.tip);
    if(fw.hit){ B.warn.push({i:i,value:p,floor:fw.value,from:fw.from,at:Date.now()}); if(B.warn.length>40)B.warn.shift(); }
  }
  
  var meta=document.querySelector('#dtLookup .lg-meta');
  if(meta)meta.textContent='共 '+B.rows.length+' 批 · 需求 '+B.demand+' · 已分配 '+sum(B.alloc);
  if(B.last){
    if(a==='alloc')B.last.alloc[i]=B.alloc[i];
    else if(a==='price')B.last.prices[i]=B.prices[i];
  }
}
document.addEventListener('input',function(e){
  if(!active())return;
  if(e&&e.target)syncInput(e.target);
},false);


function newRowKey(j){
  return 'R'+Date.now().toString(36)+'_'+j+'_'+Math.floor(Math.random()*9000+1000);
}
function applyToRow(rowObj,pick,sp){
  var wm=sp.writeMap, o=pick.o||{};
  if(wm.batch&&sp.batchField)rowObj[wm.batch]=o[sp.batchField];
  if(wm.expiry&&sp.expiryField)rowObj[wm.expiry]=o[sp.expiryField];
  if(wm.qty)rowObj[wm.qty]=pick.alloc;
  if(wm.price&&sp.priceField&&sp.feat.showPrice!==false)rowObj[wm.price]=pick.price;
  
  if(wm.inventoryId&&sp.inventoryIdField)rowObj[wm.inventoryId]=o[sp.inventoryIdField];
  if(wm.inPrice&&sp.inPriceField)rowObj[wm.inPrice]=o[sp.inPriceField];
  if(wm.rebateRate)rowObj[wm.rebateRate]=pick.rebateRate;
}
function batchConfirm(){
  var st=null; try{ st=D.lookupState; }catch(e){}
  if(!st)return;
  var sp=specOf(st.source);
  if(!sp){ try{ D.lookupClose(); }catch(e){} return; }
  ensureState(st,sp);
  var picks=[],i;
  for(i=0;i<B.rows.length;i++){
    var q=+B.alloc[i]||0, o=B.rows[i]||{};
    if(q>0)picks.push({o:o,alloc:q,price:+B.prices[i]||0,i:i,
      
      inventoryId:sp.inventoryIdField?o[sp.inventoryIdField]:'',
      inPrice:sp.inPriceField?o[sp.inPriceField]:'',
      rebateRate:B.rebateRate});
  }
  B.lastSplit=picks.length;
  B.last=snapshot();                                  
  if(!picks.length){                                  
    B.lastResult={op:'cancel',reason:'all-zero',rows:0,at:Date.now()};
    D.lookupClose();
    window.__WL_DT_LOOKUP__={open:false,batch:true,mode:sp.mode,split:0,cancelled:true};
    return;
  }
  
  var dec=DEC();
  if(dec&&dec.validate){
    var v=dec.validate({st:st,spec:sp,rows:B.rows,alloc:B.alloc,picks:picks},picks)||{};
    if(v.ok===false){
      B.lastResult={op:'blocked',reason:v.reason||'controlled',rows:picks.length,
        blocked:clone(v.blocked||[]),at:Date.now()};
      try{ if(T._toast)T._toast('批号选录未通过 · '+(v.reason||'请修正后重试')); }catch(e){}
      return;
    }
  }
  var sec=D.byId(st.secId);
  if(!sec){ D.lookupClose(); return; }
  var spSec=D.specOf(sec), F=D.flowSpec(sec), list=D.rows(sec);
  var idx=-1;
  for(i=0;i<list.length;i++){ if(String(list[i][spSec.rowKey])===String(st.rk)){ idx=i; break; } }
  if(idx<0){ D.lookupClose(); return; }
  var base=clone(list[idx]);                          
  applyToRow(list[idx],picks[0],sp);                  
  var created=[];
  for(i=1;i<picks.length;i++){
    var nr=clone(base);                               
    nr[spSec.rowKey]=newRowKey(i);
    applyToRow(nr,picks[i],sp);
    list.splice(idx+i,0,nr);                         
    created.push(String(nr[spSec.rowKey]));
  }
  D.recalc(sec);                                     
  D.refresh(st.secId);                              
  var secId=st.secId, rk0=String(st.rk);
  D.lookupClose(true);                               
  
  var lastRk=created.length?created[created.length-1]:rk0;
  var triggerCol=(st.col&&st.col.k)||'';
  if(D.flowFrom && triggerCol) D.flowFrom(secId,lastRk,triggerCol,F,true);
  var flow=window.__WL_DT_FLOW__||{};
  var focusRk=flow.rowKey||lastRk, focusCol=flow.to||'', ok=!!focusCol;
  B.lastResult={op:picks.length>1?'split':'single',mode:sp.mode,rows:picks.length,
    demand:B.demand,rowKeys:[rk0].concat(created),
    focus:{secId:secId,rowKey:focusRk,col:focusCol,ok:ok},
    appendRow:null,
    picks:picks.map(function(p){ return {i:p.i,alloc:p.alloc,price:p.price,
      inventoryId:p.inventoryId,inPrice:p.inPrice,rebateRate:p.rebateRate}; }),
    at:Date.now()};
  window.__WL_DT_LOOKUP__={open:false,batch:true,mode:sp.mode,split:picks.length,
    rowKeys:[rk0].concat(created),mapped:clone(sp.writeMap),focusTo:focusCol,rowKey:focusRk,
    appendRow:null};
}



var rawKey=D.lookupKey;
D.lookupKey=function(e){
  if(active()&&e&&e.key==='Enter'&&!e.target){ batchConfirm(); return; }
  return rawKey.call(D,e);
};
var rawClose=D.lookupClose;
D.lookupClose=function(){
  var ret=rawClose.call(D);                          
  var box=document.getElementById('dtLookup');
  if(box&&box.classList)box.classList.remove('lg-batch');
  B.st=null; B.spec=null; B.rows=[]; B.alloc=[]; B.prices=[]; B.auto=[];
  return ret;
};


function focusables(box){
  var list=[],groups=[
    'input[data-ba]:not([disabled]):not([readonly])',
    'input[data-pb]:not([disabled]):not([readonly])',
    
    'button:not([disabled]):not([data-lk="close"])'
  ];
  for(var g=0;g<groups.length;g++){
    var a=box.querySelectorAll(groups[g]);
    for(var i=0;i<a.length;i++)if(list.indexOf(a[i])<0)list.push(a[i]);
  }
  return list;
}
function moveFocus(el){
  if(!el)return false;
  try{ el.focus({preventScroll:true}); }catch(err){ try{ el.focus(); }catch(e2){} }
  if(el.tagName==='INPUT'&&typeof el.select==='function'){
    try{ el.select(); }catch(err){}                
  }
  return true;
}
function focusNext(){
  var box=document.getElementById('dtLookup'); if(!box)return false;
  var list=focusables(box);
  if(!list.length)return false;
  var i=list.indexOf(document.activeElement);
  
  if(i<0)return moveFocus(list[0]);
  if(i>=list.length-1)return false;               
  return moveFocus(list[i+1]);
}
window.addEventListener('keydown',function(e){
  if(!active())return;
  var box=document.getElementById('dtLookup');
  if(!box||!box.classList.contains('on'))return;
  var st=null; try{ st=D.lookupState; }catch(err){}
  if(!st)return;
  var inInput=!!(e.target&&e.target.closest&&e.target.closest('#dtLookup [data-ba]'));
  var inPb=!!(e.target&&e.target.closest&&e.target.closest('#dtLookup [data-pb]'));
  var k=e.key;
  if(k==='Enter'){
    var onOk=!!(e.target&&e.target.closest&&e.target.closest('#dtLookup [data-lk="ok"]'));
    if(onOk){ e.preventDefault(); e.stopImmediatePropagation(); batchConfirm(); return; }
    
    e.stopImmediatePropagation();
    var moved=focusNext();
    if(moved)e.preventDefault();                   
    return;
  }
  if(k==='Escape'){
    e.preventDefault(); e.stopImmediatePropagation();
    D.lookupClose();
    return;
  }
  if(k==='F2'||e.keyCode===113)return;             
  
  if((inInput||inPb)&&(k==='ArrowUp'||k==='ArrowDown')){
    e.stopImmediatePropagation();                    
  }
},true);

window.addEventListener('mousedown',function(e){
  if(!active())return;
  var box=document.getElementById('dtLookup');
  if(!box||!box.contains(e.target))return;
  var f=(e.target&&e.target.closest)?
    e.target.closest('#dtLookup [data-ba],#dtLookup [data-pb],#dtLookup button'):null;
  if(f)return;
  e.preventDefault(); e.stopPropagation();
},true);



function repaintPriceCells(){
  var sp=B.spec;
  if(!sp||sp.feat.showPrice===false)return 0;
  var box=document.getElementById('dtLookup'); if(!box)return 0;
  var trs=box.querySelectorAll('tbody tr[data-lk="row"]'), n=0;
  for(var i=0;i<trs.length;i++){
    var gi=+trs[i].getAttribute('data-i');
    var el=trs[i].querySelector('[data-ba="price"]');
    if(!el||isNaN(gi))continue;
    var v=(+B.prices[gi]||0);
    if(String(el.value)!==String(v))el.value=v;
    n++;
  }
  return n;
}

function setGlobalPrice(supply,rebate){
  
  var s=Math.round((+supply||0)*100)/100, r=Math.round((+rebate||0)*1000)/1000;
  B.rebateRate=r;
  if(s>0){ for(var i=0;i<B.prices.length;i++)B.prices[i]=s; }
  else { B.prices=B.origPrices.slice(); }
  if(B.last){ B.last.prices=B.prices.slice(); B.last.rebateRate=r; }
  var painted=repaintPriceCells();
  return {supply:s,rebateRate:r,prices:B.prices.slice(),painted:painted};
}
window.__WL_BATCH_CTX__=function(){
  var live=!!B.st, L=B.last||{};
  return {
    active:active(),demand:live?B.demand:(L.demand||0),remain:live?(B.remain||0):(L.remain||0),
    alloc:live?B.alloc.slice():(L.alloc||[]).slice(),
    prices:live?B.prices.slice():(L.prices||[]).slice(),
    origPrices:live?B.origPrices.slice():(L.origPrices||[]).slice(),
    rebateRate:live?B.rebateRate:(L.rebateRate||0),
    rows:live?clone(B.rows):clone(L.rows||[]),
    setGlobalPrice:setGlobalPrice
  };
};
T._batchCtx=window.__WL_BATCH_CTX__;
window.__WL_BATCH_CTX__.repaintPriceCells=repaintPriceCells;


window.__WL_BATCH_EXT__={active:active,rows:rows,render:render};


window.__WL_BATCH_ALLOCATION__=function(){
  var st=null; try{ st=D.lookupState; }catch(e){}
  var grid=null; try{ grid=(T._lookupGrid&&T._lookupGrid())||null; }catch(e){}
  
  var live=!!B.st, L=B.last||{}, sp=B.spec;
  var mode=live?B.mode:(L.mode||''), source=live?B.source:(L.source||(st?st.source:''));
  var demand=live?B.demand:(L.demand||0), remain=live?(B.remain||0):(L.remain||0);
  var auto=live?B.auto.slice():(L.auto||[]).slice();
  var alloc=live?B.alloc.slice():(L.alloc||[]).slice();
  var prices=live?B.prices.slice():(L.prices||[]).slice();
  var origPrices=live?B.origPrices.slice():(L.origPrices||[]).slice();
  var rebateRate=live?B.rebateRate:(L.rebateRate||0);
  var cfg=live?(sp?{qtyField:sp.qtyField,priceField:sp.priceField,batchField:sp.batchField,
      expiryField:sp.expiryField,demandField:sp.demandField,writeMap:clone(sp.writeMap),
      features:clone(sp.feat),pageSize:sp.size,columns:sp.cols.map(function(c){
        return {k:c.k,t:c.t,w:c.w,role:c.role}; })}:null):(L.config?clone(L.config):null);
  var dec=DEC(), legacy=null;
  if(dec&&dec.debug){
    try{ legacy=dec.debug({live:live,st:st,spec:sp,rows:B.rows,alloc:alloc,last:L}); }
    catch(e){ legacy={error:String(e)}; }
  }
  return {
    version:'1.46',active:active(),mode:mode,source:source,
    demand:demand,remain:remain,
    autoAllocated:auto,alloc:alloc,prices:prices,origPrices:origPrices,rebateRate:rebateRate,
    globalSupply:(function(){ var c=(window.__WL_BATCH_CTX__&&window.__WL_BATCH_CTX__())||{};
      return {rebateRate:c.rebateRate||0,prices:(c.prices||[]).slice(),origPrices:(c.origPrices||[]).slice()}; })(),
    allocatedTotal:sum(alloc),validRows:alloc.filter(function(v){ return (+v||0)>0; }).length,
    candidates:live?B.rows.length:(L.alloc||[]).length,splitCount:B.lastSplit,
    lastResult:clone(B.lastResult),lowPriceWarnings:B.warn.slice(),config:cfg,
    legacy:legacy,
    guard:{writes:B.writes,blocks:B.blocks,gridBlocks:grid?grid.guardBlocks:0,
      gridHardenReasons:grid?grid.guardReasons:[]},
    focus:B.lastResult?clone(B.lastResult.focus):null
  };
};
T._batchAllocation=window.__WL_BATCH_ALLOCATION__;
})();
