

(function(){
'use strict';
var T=window.TPL, D=window.DETAIL, GU=window.GUARD;
if(!T||!D)return;
if(window.__WL_B9_INSTALLED__)return;
window.__WL_B9_INSTALLED__=1;


var CSS=[

'#dtLookup.lg-batch .lg-item{flex:0 0 auto;padding:4px 10px;text-align:left;',
'  border-bottom:1px solid #e4e8ee;background:#fff;font-size:10.5px;color:#6e7b8c;',
'  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:18px}',
'#dtLookup.lg-batch .lg-item b{font-weight:600;color:#2e405e}',
'#dtLookup.lg-batch .lg-item .lg-item-title{font-size:11px;margin-right:8px}',
'#dtLookup.lg-batch .lg-item-title,#dtLookup.lg-batch .lg-item-meta{display:inline;margin:0}',
'#dtLookup.lg-batch .lg-pane{flex:0 0 auto;padding:5px 10px 6px;background:#fff;',
'  border-top:1px solid #e4e8ee}',
'#dtLookup.lg-batch .lg-sec-title{font-size:10.5px;color:#6e7b8c;margin:0 0 3px}',
'#dtLookup.lg-batch .lg-sub{border-collapse:collapse;table-layout:fixed;',
'  font-family:inherit;font-size:11px;color:#2e405e;width:100%}',
'#dtLookup.lg-batch .lg-sub th,#dtLookup.lg-batch .lg-sub td{height:22px;padding:0 6px;',
'  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}',
'#dtLookup.lg-batch .lg-sub th{background:#EFF7FF;color:#2e405e;font-weight:600;font-size:10.5px}',
'#dtLookup.lg-batch .lg-sub td{background:#fff;text-align:right}',
'#dtLookup.lg-batch .lg-tbl tbody tr.ba-expired td{background:#f5f5f5;color:#9aa3af}',
'#dtLookup.lg-batch .lg-tbl tbody tr.ba-expired .ba-ipt{background:#f0f0f0;color:#9aa3af;cursor:not-allowed}',
'#dtLookup.lg-batch .ba-ipt.ba-over{border-color:#e66544;background:#fff6f2;color:#c2462a}',
'#dtLookup.lg-batch .lg-tbl tbody tr.on.ba-expired td{background:#eef1f5;color:#7c8794}',

'#dtLookup.lg-batch .lg-pb-ipt{width:100%;height:21px;padding:0 4px;',
'  border:1px solid transparent;border-radius:2px;background:#fff;color:#2e405e;',
'  font:inherit;font-size:11px;text-align:right;outline:none;-moz-appearance:textfield;',
'  appearance:textfield;-webkit-appearance:none}',
'#dtLookup.lg-batch .lg-pb-ipt::-webkit-inner-spin-button,',
'#dtLookup.lg-batch .lg-pb-ipt::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}',
'#dtLookup.lg-batch .lg-pb-ipt:hover{border-color:#dadee3}',
'#dtLookup.lg-batch .lg-pb-ipt:focus{border-color:#0052d9;box-shadow:0 0 0 2px rgba(0,82,217,.10)}',
'#dtLookup.lg-batch .lg-pricebar .lg-sub td{padding:0 2px}',
'#dtLookup.lg-batch .lg-pricebar .lg-sub .pb-ro{text-align:right;padding:0 6px}',

'#dtLookup.lg-batch .lg-returnstock .lg-sub th{border:1px solid #dfe4ea;background:#EFF7FF}',
'#dtLookup.lg-batch .lg-returnstock .lg-sub td{border:0;background:#fff;text-align:center;',
'  color:#2e405e;cursor:default}',

'#dtLookup.lg-batch.lg-one-page .lg-pager{display:none}',

'#dtLookup.lg-grid.lg-batch .lg-hd{background:#EFF7FF}',
'#dtLookup.lg-grid.lg-batch .lg-tbl thead th{background:#EFF7FF}',

'#dtLookup.lg-grid.lg-batch .lg-tbl thead th,',
'#dtLookup.lg-batch .lg-pricebar .lg-sub th,',
'#dtLookup.lg-batch .lg-returnstock .lg-sub th,',
'#dtLookupPriceLayer .pl-tbl th{background:#EFF7FF}',

'#dtLookup.lg-grid.lg-batch .lg-ft{justify-content:flex-start}',
'#dtLookup.lg-grid.lg-batch .lg-pager{order:1;flex:0 0 auto}',
'#dtLookup.lg-grid.lg-batch .lg-acts{order:2;margin-left:0;margin-right:auto;flex:0 0 auto}',

'#dtLookup.lg-grid.lg-batch .lg-acts{gap:4px}',
'#dtLookup.lg-grid.lg-batch .lg-acts button{min-width:52px;padding:0 9px}',
'#dtLookup.lg-grid.lg-batch .lg-tip{order:3;flex:0 0 auto;margin-left:0;text-align:right}',
'#dtLookup.lg-grid.lg-batch .lg-acts .lg-ok{border-color:#c9dcf5;background:#fff;',
'  color:#0052d9;font-weight:400}',
'#dtLookup.lg-grid.lg-batch .lg-acts .lg-ok:hover{background:#ecf4ff;',
'  border-color:#0052d9;color:#0052d9}',

'#dtLookupPriceLayer{position:fixed;z-index:99998;background:#fff;',
'  border:1px solid #dadee3;border-radius:6px;',
'  box-shadow:0 12px 34px rgba(46,64,94,.20);padding:8px 10px 10px;',
'  font-family:inherit;color:#2e405e;font-size:11px}',
'#dtLookupPriceLayer .pl-hd{display:flex;align-items:center;justify-content:space-between;',
'  margin-bottom:6px;font-size:10.5px;color:#6e7b8c}',
'#dtLookupPriceLayer .pl-hd b{color:#2e405e;font-weight:600;font-size:11.5px}',
'#dtLookupPriceLayer .pl-close{height:20px;padding:0 8px;border:1px solid #dadee3;',
'  border-radius:3px;background:#fff;color:#6e7b8c;font:inherit;font-size:10.5px;cursor:pointer}',
'#dtLookupPriceLayer .pl-close:hover{border-color:#0052d9;color:#0052d9}',
'#dtLookupPriceLayer .pl-scroll{max-height:220px;overflow:auto}',
'#dtLookupPriceLayer .pl-tbl{border-collapse:collapse;table-layout:fixed;width:100%}',
'#dtLookupPriceLayer .pl-tbl th,#dtLookupPriceLayer .pl-tbl td{height:22px;padding:0 6px;',
'  border:1px solid #e4e8ee;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
'  text-align:center;font-size:10.5px}',
'#dtLookupPriceLayer .pl-tbl th{background:#EFF7FF;font-weight:600;position:sticky;top:0}',
'#dtLookupPriceLayer .pl-tbl td{background:#fff;text-align:right}'
].join('\n');
if(!document.getElementById('tpl-b9-legacy-ui')){
  document.head.insertAdjacentHTML('beforeend','<style id="tpl-b9-legacy-ui">'+CSS+'</style>');
}


function sources(){
  try{ var f=(T._formSpec&&T._formSpec())||{}; return f.lookupSources||{}; }
  catch(e){ return {}; }
}
function raw(source){ var o=sources()[source]; return (o&&typeof o==='object')?o:{}; }
function text(v){ return String(v==null?'':v); }
function num(v){ var n=+v; return isFinite(n)?n:0; }
function clone(o){ try{ return JSON.parse(JSON.stringify(o)); }catch(e){ return {}; } }
function sum(a){ var s=0; for(var i=0;i<a.length;i++)s+=(+a[i]||0); return Math.round(s*1e6)/1e6; }

var V={violations:[],lastValidate:null,priceFloor:null,expiredRows:[],writes:0,
       initialFocus:'none',focusSt:null,priceLayer:null,rafPending:false};


function day(v){
  var s=text(v).trim(); if(!s)return 0;
  var m=s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if(!m)return 0;
  return (+m[1])*10000+(+m[2])*100+(+m[3]);
}
function todayInt(ctrl){
  if(ctrl.today)return day(ctrl.today)||0;
  var d=new Date();
  return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
}
function expiryKey(spec,cfg){
  var ctrl=cfg.controls||{};
  return text(ctrl.expiryField||spec.expiryField||'');
}
function isExpired(o,spec,cfg){
  var ctrl=cfg.controls||{};
  if(ctrl.expiredBatch===false)return false;
  var k=expiryKey(spec,cfg), d=day(o&&o[k]), t=todayInt(ctrl);
  return !!(d&&t&&d<=t);
}
function expiredTitle(){ return '已过有效期，不能出售'; }



function cols(){ return []; }


function rowFlags(ctx,i,o){
  var cfg=raw(ctx.st.source);
  if(isExpired(o,ctx.spec,cfg)){
    if(V.expiredRows.indexOf(i)<0)V.expiredRows.push(i);
    return {skip:true,expired:true,cls:'ba-expired',title:expiredTitle()};
  }
  return {};
}



function rowOf(st){
  var r=null,i,sec=null,sp=null,list=[],rk='';
  try{ r=D.row(st.secId,st.rk); }catch(e){}
  if(r&&Object.keys(r).length)return r;
  try{ sec=D.byId(st.secId)||D.sections()[0]; }catch(e){}
  if(!sec)return {};
  try{ sp=D.specOf(sec); rk=sp?sp.rowKey:''; list=D.rows(sec)||[]; }catch(e){ return {}; }
  for(i=0;i<list.length;i++){ if(String(list[i][rk])===String(st.rk))return list[i]; }
  return list[0]||{};
}
function itemHtml(ctx,cfg,tx,at){
  
  var ii=cfg.itemInfo;
  if(!ii||typeof ii!=='object')return '';
  var rowObj=rowOf(ctx.st), parts=[], i, x, v;
  var title=text(ii.title!==undefined&&ii.title!==''?ii.title:
    (ii.titleField?rowObj[ii.titleField]:''));
  if(title)parts.push('<b class="lg-item-title">'+tx(title)+'</b>');
  var f=Array.isArray(ii.fields)?ii.fields:[];
  for(i=0;i<f.length;i++){
    x=f[i]||{};
    v=(x.value!==undefined&&x.value!=='')?x.value:(x.k?rowObj[x.k]:'');
    parts.push(tx(text(x.t||''))+' ： <b>'+tx(text(v))+'</b>');
  }
  if(!parts.length)return '';
  return '<div class="lg-item">'+parts.join(' &nbsp; ')+'</div>';
}


function priceBarHtml(cfg,tx,at){
  var pb=cfg.priceBar;
  if(!pb||pb.globalPrice===false)return '';      
  var cols=Array.isArray(pb.columns)?pb.columns:[];
  if(!cols.length)return '';
  var vals=(pb.values&&typeof pb.values==='object')?pb.values:{};
  
  var hasVals=Object.keys(vals).some(function(k){ return text(vals[k])!==''; });
  if(!hasVals)return '';
  var th='',td='',cg='',i,c,w,s,role,ed;
  for(i=0;i<cols.length;i++){
    c=cols[i]||{};
    w=Math.max(40,Math.min(300,num(c.w)||72));
    cg+='<col style="width:'+w+'px">';
    th+='<th style="width:'+w+'px">'+tx(text(c.t==null?(c.label==null?c.k:c.label):c.t))+'</th>';
    role=text(c.role); ed=!!c.editable; s=text(vals[c.k]);
    if(ed){
      td+='<td><input type="number" class="lg-pb-ipt" data-pb="'+at(role)+'" data-k="'+at(text(c.k))+
          '" step="any" min="0" value="'+at(s)+'" title="'+at(text(c.t||''))+'"></td>';
    }else if(role==='wPrice'){
      
      td+='<td data-pb="wPrice" class="pb-ro">'+tx(s)+'</td>';
    }else{
      td+='<td class="pb-ro">'+tx(s)+'</td>';
    }
  }
  return '<div class="lg-pane lg-pricebar"><table class="lg-sub"><colgroup>'+cg+
    '</colgroup><thead><tr>'+th+'</tr></thead><tbody><tr>'+td+'</tr></tbody></table></div>';
}
function returnStockHtml(cfg,tx,at){
  
  var rs=cfg.returnStock;
  if(!rs||typeof rs!=='object')return '';
  var cols=Array.isArray(rs.columns)?rs.columns:[];
  var rows=Array.isArray(rs.rows)?rs.rows:[];
  if(!cols.length||!rows.length)return '';
  var cg='',th='',body='',i,j,c,w,s;
  for(i=0;i<cols.length;i++){
    c=cols[i]||{};
    w=Math.max(40,Math.min(300,num(c.w)||72));
    cg+='<col style="width:'+w+'px">';
    th+='<th style="width:'+w+'px">'+tx(text(c.t==null?(c.label==null?c.k:c.label):c.t))+'</th>';
  }
  for(i=0;i<rows.length;i++){
    body+='<tr>';
    for(j=0;j<cols.length;j++){
      s=text(rows[i]&&rows[i][cols[j].k]);
      body+='<td>'+tx(s)+'</td>';
    }
    body+='</tr>';
  }
  return '<div class="lg-pane lg-returnstock"><div class="lg-sec-title">'+
    tx(text(rs.label||''))+'：</div><table class="lg-sub"><colgroup>'+cg+
    '</colgroup><thead><tr>'+th+'</tr></thead><tbody>'+body+'</tbody></table></div>';
}


function initialFocus(ctx){
  
  var box=document.getElementById('dtLookup');
  if(!box||!box.classList.contains('on')||!box.classList.contains('lg-batch')){
    V.initialFocus='none'; return;
  }
  var C=(window.__WL_BATCH_CTX__&&window.__WL_BATCH_CTX__())||{};
  var spec=ctx.spec, cfg=raw(ctx.st.source);
  var demand=+C.demand||0, alloc=C.alloc||[];
  var satisfied=(spec.mode==='sale')&&(sum(alloc)>=demand);   
  var supply=box.querySelector('[data-pb="supply"]');
  if(satisfied&&supply){
    try{ supply.focus({preventScroll:true}); }catch(e){ try{ supply.focus(); }catch(e2){} }
    V.initialFocus='supply'; return;
  }
  
  var list=[].slice.call(box.querySelectorAll('input[data-ba="alloc"]:not([disabled])'));
  if(list.length){
    var last=list[list.length-1];
    try{ last.focus({preventScroll:true}); }catch(e){ try{ last.focus(); }catch(e2){} }
    V.initialFocus='last-alloc'; return;
  }
  V.initialFocus='none';
}
function sections(ctx,out){
  var cfg=raw(ctx.st.source), tx=ctx.tx, at=ctx.at;
  if(tx==null||at==null)return out;
  var item=itemHtml(ctx,cfg,tx,at);
  var price=priceBarHtml(cfg,tx,at);
  var stock=returnStockHtml(cfg,tx,at);
  
  var box=ctx.box||document.getElementById('dtLookup');
  if(box&&box.classList){
    if(+ctx.pages<=1)box.classList.add('lg-one-page');
    else box.classList.remove('lg-one-page');
  }
  V.writes++;
  
  if(V.focusSt!==ctx.st){
    V.focusSt=ctx.st; V.initialFocus='none';
    var c2=ctx;
    setTimeout(function(){ initialFocus(c2); },0);
  }
  return {
    cap:item?item+out.cap:out.cap,
    grid:out.grid+price+stock,        
    ft:out.ft,
    totalW:out.totalW
  };
}


function ctxApi(){ return window.__WL_BATCH_CTX__?window.__WL_BATCH_CTX__():null; }
function wPriceOf(box){
  var w=box&&box.querySelector?box.querySelector('[data-pb="wPrice"]'):null;
  return w?num(w.textContent):0;
}
function setSupplyRebate(box,supply,rebate){
  var s=box.querySelector('[data-pb="supply"]'), r=box.querySelector('[data-pb="rebate"]');
  if(s)s.value=(supply>0)?String(Math.round(supply*100)/100):'';
  if(r)r.value=(rebate>0)?String(Math.round(rebate*1000)/1000):'';
  var C=ctxApi();
  if(C&&C.setGlobalPrice)C.setGlobalPrice(supply,rebate);
}
function onPriceInput(el){
  var box=document.getElementById('dtLookup'); if(!box)return;
  var role=el.getAttribute('data-pb'), w=wPriceOf(box), v=num(el.value);
  if(role==='supply'){
    if(w<=0){ setSupplyRebate(box,0,0); return; }
    setSupplyRebate(box,v,v/w);                    
  }else if(role==='rebate'){
    if(w<=0){ setSupplyRebate(box,0,0); return; }
    setSupplyRebate(box,v*w,v);                    
  }
}
document.addEventListener('input',function(e){
  var el=e&&e.target;
  if(!el||!el.getAttribute)return;
  var box=document.getElementById('dtLookup');
  if(!box||!box.classList.contains('lg-batch'))return;
  var pb=el.getAttribute('data-pb');
  if(pb==='supply'||pb==='rebate'){ onPriceInput(el); return; }
  if(pb==='wPrice'||pb)return;                    
  
  if(el.getAttribute('data-ba')!=='alloc')return;
  var max=num(el.getAttribute('max')), rawv=num(el.value);
  if(rawv>max){
    el.classList.add('ba-over');
    el.setAttribute('title','销售数量不能大于库存数量 '+max+'（已自动钳制）');
    V.violations.push({i:+el.getAttribute('data-i'),input:rawv,max:max,
      reason:'销售数量不能大于库存数量',at:Date.now()});
    if(V.violations.length>60)V.violations.shift();
  }else el.classList.remove('ba-over');
},true);


function priceLayerHtml(ctx){
  
  var tx=GU&&GU.text?function(v){return GU.text(text(v));}:function(v){return text(v);};
  var cfg=raw(ctx.source), types=Array.isArray(cfg.priceTypes)?cfg.priceTypes:[];
  var rows=(ctx.spec&&Array.isArray(ctx.spec.rows))?ctx.spec.rows:[];
  var batchKey=ctx.spec?ctx.spec.batchField:'';
  var specCols=(ctx.spec&&Array.isArray(ctx.spec.cols))?ctx.spec.cols:[];
  var batchTitle='批号',i,j,c,w,s,o;
  for(i=0;i<specCols.length;i++){
    if(specCols[i].k===batchKey){ batchTitle=text(specCols[i].t); break; }
  }
  var cg='<col style="width:110px">',th='<th style="width:110px">'+tx(batchTitle)+'</th>',body='';
  for(j=0;j<types.length;j++){
    c=types[j]||{}; w=Math.max(40,Math.min(300,num(c.w)||72));
    cg+='<col style="width:'+w+'px">';
    th+='<th style="width:'+w+'px">'+tx(c.t==null?(c.label==null?c.k:c.label):c.t)+'</th>';
  }
  for(i=0;i<rows.length;i++){
    o=rows[i]||{};
    body+='<tr><td>'+tx(o[batchKey])+'</td>';
    for(j=0;j<types.length;j++){
      var v=o[types[j].k];
      body+='<td>'+(v==null||v===''?tx('—'):tx(v))+'</td>';
    }
    body+='</tr>';
  }
  if(!rows.length)body='<tr><td colspan="'+(types.length+1)+'">暂无批次价格</td></tr>';
  var html='<div class="pl-hd"><b>价格参考 · '+tx(cfg.label||'')+'</b>'+
    '<button type="button" class="pl-close" data-pl="close">关闭 (F2)</button></div>'+
    '<div class="pl-scroll"><table class="pl-tbl"><colgroup>'+cg+'</colgroup>'+
    '<thead><tr>'+th+'</tr></thead><tbody>'+body+'</tbody></table></div>';
  
  if(GU&&typeof GU.harden==='function'){
    var h=GU.harden(html);
    return h&&h.html!=null?h.html:html;
  }
  return html;
}
function placePriceLayer(){
  var layer=V.priceLayer, box=document.getElementById('dtLookup');
  if(!layer||!box||!box.classList.contains('on'))return;
  var r=box.getBoundingClientRect();
  
  var c=currentCtx(), types=Array.isArray(raw(c.source).priceTypes)?raw(c.source).priceTypes:[];
  var need=110,j;
  for(j=0;j<types.length;j++)need+=Math.max(40,Math.min(300,num(types[j].w)||72));
  var w=Math.min(560,Math.max(r.width||box.offsetWidth||520,need));
  layer.style.width=w+'px';
  layer.style.left=Math.max(6,Math.min(r.left,window.innerWidth-w-6))+'px';
  layer.style.top=(r.bottom+6)+'px';
}
function schedulePlace(){
  if(V.rafPending)return;
  V.rafPending=true;
  var run=function(){ V.rafPending=false; placePriceLayer(); };
  window.requestAnimationFrame?window.requestAnimationFrame(run):setTimeout(run,16);
}
function removePriceLayer(){
  if(V.priceLayer&&V.priceLayer.parentNode)V.priceLayer.parentNode.removeChild(V.priceLayer);
  V.priceLayer=null;
}
function currentCtx(){
  var st=null; try{ st=D.lookupState; }catch(e){}
  var src=(st&&st.source)||'';
  return {st:st,source:src,spec:specOf(src)};
}
function specOf(source){
  
  var g=raw(source), cols=[],i,c;
  var arr=Array.isArray(g.columns)?g.columns:[];
  var feat=(g.features&&g.features[g.mode])||{};
  for(i=0;i<arr.length;i++){
    c=arr[i]||{};
    if(c.hidden===true||c.hidden==='true')continue;
    if(text(c.role)==='price'&&feat.showPrice===false)continue;
    cols.push({k:text(c.k),t:text(c.t==null?(c.label==null?c.k:c.label):c.t)});
  }
  return {batchField:text(g.batchField),cols:cols,
    rows:Array.isArray(g.rows)?g.rows:[],source:source};
}
function togglePriceLayer(){
  if(V.priceLayer){ removePriceLayer(); return; }
  var box=document.getElementById('dtLookup');
  if(!box||!box.classList.contains('on')||!box.classList.contains('lg-batch'))return;
  var c=currentCtx();
  var layer=document.createElement('div');
  layer.id='dtLookupPriceLayer';
  layer.setAttribute('data-pl-layer','1');
  
  layer.innerHTML=priceLayerHtml(c);
  document.body.appendChild(layer);
  V.priceLayer=layer;
  placePriceLayer();
}

window.addEventListener('keydown',function(e){
  if(e.key!=='F2'&&e.keyCode!==113)return;
  var box=document.getElementById('dtLookup');
  if(!box||!box.classList.contains('on')||!box.classList.contains('lg-batch'))return;
  e.preventDefault(); e.stopImmediatePropagation();
  togglePriceLayer();
},true);

window.addEventListener('click',function(e){
  if(!V.priceLayer)return;
  var t=e&&e.target;
  if(!t||!t.closest||!t.closest('#dtLookupPriceLayer'))return;
  e.stopImmediatePropagation();
  if(t.closest('[data-pl="close"]'))removePriceLayer();
},true);

window.addEventListener('mousedown',function(e){
  if(!V.priceLayer)return;
  var t=e&&e.target;
  if(t&&t.closest&&t.closest('#dtLookupPriceLayer'))e.stopImmediatePropagation();
},true);

window.addEventListener('scroll',function(){ if(V.priceLayer)schedulePlace(); },true);
window.addEventListener('resize',function(){ if(V.priceLayer)schedulePlace(); },false);



function priceFloorCheck(ctx,picks,cfg,spec){
  var out={applied:false,supply:0,floor:0,floorFrom:'',hit:false,detail:[]};
  var box=document.getElementById('dtLookup');
  var el=box&&box.querySelector?box.querySelector('[data-pb="supply"]'):null;
  var supply=el?num(el.value):0;
  out.supply=supply;
  if(supply<=0)return out;                         
  out.applied=true;
  var pb=(cfg.priceBar&&typeof cfg.priceBar==='object')?cfg.priceBar:{};
  var vals=(pb.values&&typeof pb.values==='object')?pb.values:{};
  var minKey=text(pb.minPriceKey||'minPrice'), min=num(vals[minKey]);
  var floors=[],i,p,o,v;
  if(min>0){ floors.push({v:min,from:'minPrice',batch:''}); }
  else if(spec&&spec.inPriceField){
    for(i=0;i<picks.length;i++){
      p=picks[i]; o=p.o||{}; v=num(o[spec.inPriceField]);
      floors.push({v:v,from:'inPrice',batch:o[spec.batchField]});
    }
  }
  for(i=0;i<floors.length;i++){
    if(supply<floors[i].v){
      out.hit=true; out.floor=floors[i].v; out.floorFrom=floors[i].from;
      out.detail.push({batch:floors[i].batch,floor:floors[i].v,supply:supply});
    }
  }
  return out;
}


function validate(ctx,picks){
  var cfg=raw(ctx.st.source), spec=ctx.spec, ctrl=cfg.controls||{};
  var blocked=[],i,p,o;
  for(i=0;i<picks.length;i++){
    p=picks[i]; o=p.o||{};
    if(ctrl.expiredBatch!==false&&isExpired(o,spec,cfg))
      blocked.push({i:p.i,batch:o[spec.batchField],reason:expiredTitle()});
    if(ctrl.overStock!==false&&num(p.alloc)>num(o[spec.qtyField]))
      blocked.push({i:p.i,batch:o[spec.batchField],reason:'销售数量不能大于库存数量'});
  }
  var res={ok:true,reason:'',blocked:blocked};
  if(blocked.length){ res.ok=false; res.reason=blocked[0].reason; }
  
  var floor=priceFloorCheck(ctx,picks,cfg,spec);
  V.priceFloor=floor;
  if(res.ok&&floor.hit){
    res.ok=false;
    res.reason='销售价格不得低于设定最低价/进价';
  }
  var ps=cfg.preSubmit||{}, gate={applied:false,enabled:!!ps.enabled,
    validator:text(ps.validator),returned:null};
  
  if(res.ok&&ps.enabled&&ps.validator){
    var fn=window[ps.validator], r=null, err=null;
    if(typeof fn==='function'){
      gate.applied=true;
      try{ r=fn({mode:spec.mode,source:ctx.st.source,picks:picks,alloc:ctx.alloc}); }
      catch(e){ r=false; err=String(e); }
      gate.returned=r;
      if(r===false){
        res.ok=false;
        res.reason=text(ps.message||'提交前校验未通过');
      }
      if(err)gate.error=err;
    }
  }
  V.lastValidate={ok:res.ok,reason:res.reason,blocked:blocked.slice(),
    priceFloor:clone(floor),preSubmit:gate,at:Date.now()};
  return res;
}


function activeElementInfo(){
  var a=document.activeElement;
  if(!a||!a.getAttribute)return {tag:'',dataBa:null,dataPb:null,dataLk:null};
  return {tag:text(a.tagName).toLowerCase(),dataBa:a.getAttribute('data-ba'),
    dataPb:a.getAttribute('data-pb'),dataLk:a.getAttribute('data-lk')};
}
function splitInherit(){
  
  var L=window.__WL_DT_LOOKUP__||{};
  var keys=Array.isArray(L.rowKeys)?L.rowKeys:[];
  if(!L.batch||keys.length<2)return {checked:false,reason:'no-split',rows:keys.length};
  var sec=null;
  try{ sec=D.sections()[0]; }catch(e){}
  if(!sec)return {checked:false,reason:'no-section'};
  var sp=D.specOf(sec), rk=sp?sp.rowKey:'', list=D.rows(sec)||[];
  var mapped=(L.mapped&&typeof L.mapped==='object')?L.mapped:{};
  var covered={},k;
  for(k in mapped){ if(mapped.hasOwnProperty(k))covered[String(mapped[k])]=1; }
  covered[String(rk)]=1;
  var fields=[],cols=(sp&&Array.isArray(sp.columns))?sp.columns:[],i,j;
  for(i=0;i<cols.length;i++){
    var c=cols[i]||{};
    if(c.formula||c.calc||c.computed)continue;     
    if(covered[String(c.k)])continue;
    fields.push(String(c.k));
  }
  var picked=[];
  for(i=0;i<keys.length;i++){
    for(j=0;j<list.length;j++){
      if(String(list[j][rk])===String(keys[i])){ picked.push(list[j]); break; }
    }
  }
  if(picked.length<2)return {checked:false,reason:'rows-not-found',fields:fields,rows:picked.length};
  var base=picked[0], bad=[];
  for(i=1;i<picked.length;i++){
    for(j=0;j<fields.length;j++){
      if(String(picked[i][fields[j]])!==String(base[fields[j]]))
        bad.push({rowKey:picked[i][rk],field:fields[j],
          expected:base[fields[j]],actual:picked[i][fields[j]]});
    }
  }
  return {checked:true,ok:bad.length===0,fields:fields,rows:picked.length,
    rowKeys:keys.slice(),mismatches:bad};
}
function debug(ctx){
  var src=ctx.live?ctx.st.source:((ctx.last&&ctx.last.source)||'');
  if(!src){ var all=sources(), ks=Object.keys(all);
    for(var z=0;z<ks.length;z++){ if(all[ks[z]]&&all[ks[z]].mode){ src=ks[z]; break; } } }
  var cfg=raw(src), pb=cfg.priceBar||null, rs=cfg.returnStock||null;
  var C=ctxApi()||{}, box=document.getElementById('dtLookup')||{};
  var supplyEl=box.querySelector?box.querySelector('[data-pb="supply"]'):null;
  var rebateEl=box.querySelector?box.querySelector('[data-pb="rebate"]'):null;
  return {
    installed:true,version:'1.46',source:src,
    itemInfo:cfg.itemInfo?{titleField:text(cfg.itemInfo.titleField||''),
      title:text(cfg.itemInfo.title||''),
      fields:(Array.isArray(cfg.itemInfo.fields)?cfg.itemInfo.fields:[]).map(function(x){
        return {k:text(x.k),t:text(x.t)}; })}:null,
    priceTypes:(Array.isArray(cfg.priceTypes)?cfg.priceTypes:[]).map(function(c){
      return {k:text(c.k),t:text(c.t),w:num(c.w)}; }),
    priceBar:pb?{globalPrice:!!pb.globalPrice,supplyField:text(pb.supplyField),
      rebateField:text(pb.rebateField),wPriceKey:text(pb.wPriceKey),
      minPriceKey:text(pb.minPriceKey||''),
      columns:(Array.isArray(pb.columns)?pb.columns:[]).map(function(c){
        return {k:text(c.k),t:text(c.t),role:text(c.role),editable:!!c.editable,w:num(c.w)}; }),
      values:(pb.values&&typeof pb.values==='object')?clone(pb.values):null}:null,
    returnStock:rs?{label:text(rs.label||''),
      columns:(Array.isArray(rs.columns)?rs.columns:[]).map(function(c){
        return {k:text(c.k),t:text(c.t),w:num(c.w)}; }),
      rows:(Array.isArray(rs.rows)?rs.rows:[]).length}:null,
    controls:cfg.controls?clone(cfg.controls):null,
    writeMap:cfg.writeMap?clone(cfg.writeMap):null,
    
    globalPrice:{supply:(supplyEl?num(supplyEl.value):0),
      rebateRate:num(C.rebateRate||0),
      currentSupplyInput:supplyEl?text(supplyEl.value):null,
      currentRebateInput:rebateEl?text(rebateEl.value):null,
      prices:(C.prices||[]).slice(),origPrices:(C.origPrices||[]).slice()},
    
    priceFloor:V.priceFloor?clone(V.priceFloor):null,
    
    preSubmit:cfg.preSubmit?clone(cfg.preSubmit):null,
    lastValidate:V.lastValidate?clone(V.lastValidate):null,
    
    focus:{initialFocus:V.initialFocus,active:activeElementInfo()},
    
    splitInherit:splitInherit(),
    priceLayerOpen:!!V.priceLayer,
    expiredRows:V.expiredRows.slice(),
    violations:V.violations.slice(),
    sectionWrites:V.writes
  };
}


var rawClose9=D.lookupClose;
D.lookupClose=function(){
  removePriceLayer();
  return rawClose9.call(D);
};


window.__WL_B9_DECORATE__={
  cols:cols,rowFlags:rowFlags,sections:sections,validate:validate,debug:debug
};


window.__WL_DEMO_PRE_SUBMIT__=function(){
  if(String(location.hash).indexOf('preSubmitFail')>=0){
    console.log('[v1.45 demo preSubmit] 拦截：location.hash 命中 preSubmitFail');
    return false;
  }
  return true;
};


window.__WL_LEGACY_BATCH_UI__=function(){
  var st=null; try{ st=D.lookupState; }catch(e){}
  var live=!!(st&&raw(st.source).mode), src=live?st.source:'';
  if(!src){
    var all=sources(), ks=Object.keys(all);
    for(var i=0;i<ks.length;i++){ if(all[ks[i]]&&all[ks[i]].mode){ src=ks[i]; break; } }
  }
  var out=debug({live:live,st:st||{source:src},spec:null,rows:[],alloc:[],last:null});
  out.activeSource=live?src:''; out.defaultSource=src;
  return out;
};
T._legacyBatchUI=window.__WL_LEGACY_BATCH_UI__;
})();
