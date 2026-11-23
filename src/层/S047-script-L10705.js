

(function(){
'use strict';
var T=window.TPL, D=window.DETAIL, GU=window.GUARD;
if(!T||!D)return;
if(window.__WL_LOOKUP_GRID_INSTALLED__)return;
window.__WL_LOOKUP_GRID_INSTALLED__=1;


var CSS=[
'#dtLookup.lg-grid{border-radius:8px;box-shadow:0 12px 36px rgba(46,64,94,.18);overflow:hidden}',
'#dtLookup.lg-grid .lg-hd{background:#f4f6f9;border-bottom:1px solid #e4e8ee}',
'#dtLookup.lg-grid .lg-cap{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;font-size:11.5px;color:#2e405e}',
'#dtLookup.lg-grid .lg-cap b{color:#0052d9}',
'#dtLookup.lg-grid .lg-meta{font-size:10px;color:#909aaa;white-space:nowrap}',
'#dtLookup.lg-grid .lg-scroll{max-height:min(42vh,320px);overflow:auto}',

'#dtLookup.lg-grid[data-lg-h]{display:flex;flex-direction:column;max-height:calc(100vh - 16px)}',
'#dtLookup.lg-grid[data-lg-h="fixed"]{height:var(--lg-h)}',
'#dtLookup.lg-grid[data-lg-h="max"]{max-height:var(--lg-h)}',
'#dtLookup.lg-grid[data-lg-h] .lg-hd,#dtLookup.lg-grid[data-lg-h] .lg-ft{flex:0 0 auto}',
'#dtLookup.lg-grid[data-lg-h] .lg-scroll{flex:1 1 auto;min-height:0;max-height:none;overflow:auto}',
'#dtLookup.lg-grid .lg-tbl{border-collapse:collapse;table-layout:fixed;font-size:11.5px;color:#2e405e;font-family:inherit}',
'#dtLookup.lg-grid .lg-tbl th,#dtLookup.lg-grid .lg-tbl td{height:30px;padding:0 9px;border-right:1px solid #edeff3;',
'  border-bottom:1px solid #edeff3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}',
'#dtLookup.lg-grid .lg-tbl th:last-child,#dtLookup.lg-grid .lg-tbl td:last-child{border-right:0}',
'#dtLookup.lg-grid .lg-tbl thead th{position:sticky;top:0;z-index:1;background:#f4f6f9;',
'  color:#6e7b8c;font-weight:600;font-size:11px}',
'#dtLookup.lg-grid .lg-tbl tbody tr{cursor:pointer}',
'#dtLookup.lg-grid .lg-tbl tbody tr:hover td{background:#f7f9ff}',
'#dtLookup.lg-grid .lg-tbl tbody tr.on td{background:#e6efff;color:#0052d9;font-weight:600;',
'  box-shadow:inset 0 1px 0 #c4d8ff,inset 0 -1px 0 #c4d8ff}',
'#dtLookup.lg-grid .lg-tbl tbody tr.lg-none td{height:44px;text-align:center;color:#909aaa;cursor:default}',
'#dtLookup.lg-grid .lg-ft{display:flex;align-items:center;gap:10px;padding:8px 12px;',
'  border-top:1px solid #e4e8ee;background:#fafbfc}',
'#dtLookup.lg-grid .lg-pager{display:flex;align-items:center;gap:6px;flex:0 0 auto}',
'#dtLookup.lg-grid .lg-pager button,#dtLookup.lg-grid .lg-acts button{height:25px;padding:0 11px;',
'  border:1px solid #dadee3;background:#fff;color:#2e405e;border-radius:4px;font:inherit;',
'  font-size:11px;cursor:pointer;white-space:nowrap}',
'#dtLookup.lg-grid .lg-pager button:hover:not(:disabled),#dtLookup.lg-grid .lg-acts button:hover{border-color:#0052d9;color:#0052d9}',
'#dtLookup.lg-grid .lg-pager button:disabled{opacity:.45;cursor:not-allowed}',
'#dtLookup.lg-grid .lg-page{font-size:10.5px;color:#6e7b8c;white-space:nowrap}',
'#dtLookup.lg-grid .lg-page b{color:#0052d9}',
'#dtLookup.lg-grid .lg-tip{flex:1 1 auto;min-width:0;text-align:center;font-size:9.5px;',
'  color:#909aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'#dtLookup.lg-grid .lg-acts{display:flex;gap:7px;flex:0 0 auto;margin-left:auto}',
'#dtLookup.lg-grid .lg-acts .lg-ok{border-color:#0052d9;background:#0052d9;color:#fff;font-weight:600}',
'#dtLookup.lg-grid .lg-acts .lg-ok:hover{background:#0046bb;border-color:#0046bb;color:#fff}'
].join('\n');
if(!document.getElementById('tpl-b6-lookup-grid')){
  document.head.insertAdjacentHTML('beforeend','<style id="tpl-b6-lookup-grid">'+CSS+'</style>');
}


var S={active:false,spec:null,page:0,q:'',trigger:null,writes:0,blocks:0,lastReasons:[]};

function EXT(){ return window.__WL_BATCH_EXT__||null; }
function extOn(){ var x=EXT(); return !!(x&&typeof x.active==='function'&&x.active()); }

function sources(){
  try{ var f=(T._formSpec&&T._formSpec())||{}; return f.lookupSources||{}; }
  catch(e){ return {}; }
}
function gridSpec(key){
  var src=sources()[key];
  if(!src||typeof src!=='object')return null;
  var arr=src.columns;
  if(!Array.isArray(arr)||!arr.length)return null;         
  var cols=[], i, c, k, w;
  for(i=0;i<arr.length;i++){
    c=arr[i]||{}; k=String(c.k==null?'':c.k);
    if(!k||c.hidden===true||c.hidden==='true')continue;    
    w=Math.max(36,Math.min(600,+c.w||90));
    cols.push({k:k,t:String(c.t==null?(c.label==null?k:c.label):c.t),w:w});
  }
  if(!cols.length)return null;
  var size=Math.max(1,Math.min(200,+src.pageSize||10));
  var rows=Array.isArray(src.rows)?src.rows:[];
  var match=(Array.isArray(src.match)&&src.match.length)?src.match.map(String):null;
  if(!match)match=Object.keys(rows[0]||{});                
  
  function legal(v){
    var n=+v;
    return (isFinite(n)&&n>=120&&n<=1200)?Math.round(n):0;
  }
  var fixed=legal(src.popupHeight), max=legal(src.popupMaxHeight);
  var hMode=fixed?'fixed':(max?'max':'auto');
  var hPx=fixed?fixed:(max?max:0);
  return {cols:cols,size:size,rows:rows,match:match,
          heightMode:hMode,heightPx:hPx,
          label:String(src.label==null?key:src.label),source:String(key)};
}
function filtered(q){
  var rows=S.spec?S.spec.rows:[], keys=S.spec?S.spec.match:[];
  var needle=String(q||'').trim().toLowerCase();
  if(!needle)return rows.slice();
  var out=[], i, j, o, v;
  for(i=0;i<rows.length;i++){
    o=rows[i]||{};
    for(j=0;j<keys.length;j++){
      v=o[keys[j]];
      if(String(v==null?'':v).toLowerCase().indexOf(needle)>=0){ out.push(o); break; }
    }
  }
  return out;
}

function tx(v){
  if(GU&&GU.text)return GU.text(v);
  return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function at(v){ return (GU&&GU.attr)?GU.attr(v):tx(v); }
function emit(box,html){
  var r=(GU&&GU.harden)?GU.harden(html):{html:html,hit:false,reasons:[]};
  if(r.hit){ S.blocks++; S.lastReasons=(r.reasons||[]).slice(0,6); }
  box.innerHTML=r.html;                                    
  S.writes++;
}


function paint(){
  var st=D.lookupState; if(!st||!S.active||!S.spec)return;
  var box=document.getElementById('dtLookup'); if(!box)return;
  var spec=S.spec, cols=spec.cols, size=spec.size;
  var list=Array.isArray(st.list)?st.list:[];
  var pages=Math.max(1,Math.ceil(list.length/size));
  S.page=Math.max(0,Math.min(pages-1,S.page));
  var start=S.page*size, slice=list.slice(start,start+size);
  var active=Math.max(0,Math.min(Math.max(0,list.length-1),+st.active||0));
  st.active=active;
  var totalW=cols.reduce(function(a,c){ return a+c.w; },0);
  var colHtml=cols.map(function(c){ return '<col style="width:'+c.w+'px">'; }).join('');
  var th=cols.map(function(c){ return '<th style="width:'+c.w+'px">'+tx(c.t)+'</th>'; }).join('');
  var body=slice.length?slice.map(function(o,i){
      var gi=start+i, cls=(gi===active)?' class="on"':'';
      return '<tr data-lk="row" data-i="'+gi+'"'+cls+'>'+cols.map(function(c){
        var s=String(o[c.k]==null?'':o[c.k]);
        return '<td title="'+at(s)+'">'+tx(s)+'</td>';
      }).join('')+'</tr>';
    }).join(''):'<tr class="lg-none"><td colspan="'+cols.length+'">无匹配候选</td></tr>';
  var cap,grid,ft,x=EXT(),on=extOn();
  if(on&&x&&typeof x.render==='function'){
    
    var out=x.render({box:box,st:st,spec:spec,cols:cols,size:size,list:list,
      pages:pages,page:S.page,start:start,slice:slice,active:active,tx:tx,at:at});
    cap=out.cap; grid=out.grid; ft=out.ft;
    if(+out.totalW>0)totalW=+out.totalW;
  }else{
    cap='<div class="lg-hd"><div class="lg-cap"><span>选录 · <b>'+tx(spec.label)+'</b></span>'+
          '<span class="lg-meta">共 '+list.length+' 条 · '+cols.length+' 列</span></div></div>';
    grid='<div class="lg-scroll"><table class="lg-tbl" style="width:'+totalW+'px">'+
           '<colgroup>'+colHtml+'</colgroup><thead><tr>'+th+'</tr></thead>'+
           '<tbody>'+body+'</tbody></table></div>';
    ft='<div class="lg-ft"><div class="lg-pager">'+
         '<button type="button" data-lk="prev"'+(S.page<=0?' disabled':'')+'>上一页</button>'+
         '<span class="lg-page">第 <b>'+(S.page+1)+'</b> / '+pages+' 页</span>'+
         '<button type="button" data-lk="next"'+(S.page>=pages-1?' disabled':'')+'>下一页</button>'+
         '</div><span class="lg-tip">↑↓ 移动 · Enter / 双击选中 · Esc 取消</span>'+
         '<div class="lg-acts"><button type="button" data-lk="close">取消</button>'+
         '<button type="button" class="lg-ok" data-lk="ok">确定</button></div></div>';
  }
  box.classList.add('lg-grid');
  box.style.width=Math.min(totalW+2,Math.max(320,window.innerWidth-16))+'px';
  
  if(S.spec.heightMode!=='auto'){
    box.setAttribute('data-lg-h',S.spec.heightMode);
    box.style.setProperty('--lg-h',S.spec.heightPx+'px');
  }else{
    box.removeAttribute('data-lg-h');
    box.style.removeProperty('--lg-h');
  }
  emit(box,cap+grid+ft);
  place(box,st.triggerEl);
  var L=window.__WL_DT_LOOKUP__||{};
  L.open=true; L.grid=true; L.candidates=list.length; L.active=active;
  L.page=S.page+1; L.pages=pages; L.pageSize=size; L.visibleCols=cols.length;
  window.__WL_DT_LOOKUP__=L;
}

function place(box,trigger){
  var rect=(trigger&&trigger.getBoundingClientRect)?trigger.getBoundingClientRect():null;
  var budget=(S.spec&&S.spec.heightPx>0)?S.spec.heightPx:0;
  var h=budget||box.offsetHeight, w=box.offsetWidth, vw=window.innerWidth, vh=window.innerHeight;
  var left=rect?Math.max(8,Math.min(Math.max(8,vw-w-8),rect.left)):Math.max(8,(vw-w)/2);
  var below=rect?(vh-rect.bottom-4):vh, above=rect?(rect.top-4):0, top;
  var flip=!!(rect&&below<=h&&above>below);
  if(flip)top=rect.top-h-4;                                       
  else top=rect?rect.bottom+4:Math.max(8,(vh-h)/2);              
  top=Math.max(8,Math.min(top,Math.max(8,vh-h-8)));
  box.style.left=left+'px';
  box.style.top=top+'px';
  window.__WL_LOOKUP_PLACE__={heightBudget:h,mode:S.spec?S.spec.heightMode:'auto',
    below:Math.round(below),above:Math.round(above),flip:flip,top:Math.round(top),left:Math.round(left)};
}


function cleanup(){
  S.active=false;
  var box=document.getElementById('dtLookup');
  if(box){ box.classList.remove('lg-grid'); box.style.width='';
    box.removeAttribute('data-lg-h'); box.style.removeProperty('--lg-h'); }
}
function syncState(){
  if(!S.active)return;
  var box=document.getElementById('dtLookup');
  if(!D.lookupState||!box||!box.classList.contains('on'))cleanup();
}

function restoreFocus(el){
  if(!el||!el.focus)return;
  if(document.activeElement===el)return;
  try{ el.focus({preventScroll:true}); }catch(e){ try{ el.focus(); }catch(e2){} }
}
function takeover(st){
  var spec=st?gridSpec(st.source):null;
  if(!spec){ cleanup(); return; }                              
  if(S.active&&S.trigger===st.triggerEl&&S.spec&&S.spec.source===spec.source)return;
  S.active=true; S.spec=spec; S.page=0; S.trigger=st.triggerEl||null;
  S.q=String((st.triggerEl&&st.triggerEl.value)||'');
  var x=EXT(), on=extOn();
  
  st.list=(on&&x&&typeof x.rows==='function')?x.rows():filtered(S.q);
  st.active=0;
  paint();
  restoreFocus(S.trigger);
}


function applyFilter(q){
  var st=D.lookupState; if(!st||!S.active)return;
  S.q=String(q||'');
  var x=EXT(), on=extOn();
  
  if(!(on&&x&&typeof x.rows==='function')){ st.list=filtered(S.q); st.active=0; S.page=0; }
  paint();
  restoreFocus(S.trigger);
}

function setActive(idx){
  var st=D.lookupState; if(!st||!S.spec)return;
  var n=(st.list||[]).length; if(!n)return;
  st.active=Math.max(0,Math.min(n-1,+idx||0));
  S.page=Math.floor(st.active/S.spec.size);
  var box=document.getElementById('dtLookup');
  if(box){
    var trs=box.querySelectorAll('[data-lk="row"]');
    for(var i=0;i<trs.length;i++){
      trs[i].classList.toggle('on',+trs[i].getAttribute('data-i')===st.active);
    }
  }
  var L=window.__WL_DT_LOOKUP__||{};
  L.active=st.active; L.page=S.page+1;
  window.__WL_DT_LOOKUP__=L;
  restoreFocus(S.trigger);
}
function move(delta){
  var st=D.lookupState; if(!st||!st.list||!st.list.length)return;
  var n=st.list.length;
  var next=((+st.active||0)+delta+n)%n;
  var page=Math.floor(next/S.spec.size);
  if(page!==S.page){ st.active=next; S.page=page; paint(); restoreFocus(S.trigger); }
  else setActive(next);                                           
}
function confirmPick(){
  var st=D.lookupState; if(!st)return;
  if(!(st.list&&st.list.length)){ D.lookupClose(); return; }       
  
  D.lookupKey({key:'Enter',preventDefault:function(){},stopPropagation:function(){}});
}
function cancel(){ D.lookupClose(); }



var rawEnterFlow=D.enterFlow;
D.enterFlow=function(secId,el){
  var ret=rawEnterFlow.call(D,secId,el);
  var st=D.lookupState;
  if(st)takeover(st);
  return ret;
};

var rawOpen=D.lookupOpen;
D.lookupOpen=function(a,b,c){
  var ret=rawOpen.call(D,a,b,c);
  var st=D.lookupState;
  if(st)takeover(st);
  else cleanup();
  return ret;
};

var rawClose=D.lookupClose;
D.lookupClose=function(){
  var ret=rawClose.call(D);
  cleanup();
  return ret;
};
var rawKey=D.lookupKey;
D.lookupKey=function(e){
  var ret=rawKey.call(D,e);
  if(S.active&&!D.lookupState)cleanup();
  return ret;
};
var rawPick=D.lookupPick;
D.lookupPick=function(idx){
  var ret=rawPick.call(D,idx);
  if(S.active&&!D.lookupState)cleanup();
  return ret;
};
var rawInput=T._dtInput;
T._dtInput=function(e,id){
  syncState();
  var ret=rawInput.call(T,e,id);                                  
  if(S.active&&e&&e.target&&S.trigger&&e.target===S.trigger)applyFilter(e.target.value);
  return ret;
};
var rawFilter=T._dtLookupFilter;
T._dtLookupFilter=function(v){
  syncState();
  if(!S.active)return rawFilter.call(T,v);                        
  applyFilter(v);
};
var rawClick=T._dtLookupClick;
T._dtLookupClick=function(e){
  syncState();
  if(!S.active)return rawClick.call(T,e);
  var b=(e.target&&e.target.closest)?e.target.closest('[data-lk]'):null;
  if(!b)return;
  var a=b.getAttribute('data-lk'), st=D.lookupState;
  if(!st)return;
  if(a==='row'){
    var idx=+b.getAttribute('data-i');
    if(!isNaN(idx))setActive(idx);                             
    return;
  }
  if(a==='prev'||a==='next'){
    var pages=Math.max(1,Math.ceil((st.list||[]).length/S.spec.size));
    S.page=Math.max(0,Math.min(pages-1,S.page+(a==='next'?1:-1)));
    paint(); restoreFocus(S.trigger); return;
  }
  if(a==='ok'){ confirmPick(); return; }
  return rawClick.call(T,e);                                     
};



document.addEventListener('keydown',function(e){
  syncState();
  if(!S.active)return;
  var box=document.getElementById('dtLookup');
  if(!box||!box.classList.contains('on'))return;
  if(e.target!==S.trigger)return;
  var k=e.key;
  if(k!=='ArrowDown'&&k!=='ArrowUp'&&k!=='Enter'&&k!=='Escape')return;
  e.preventDefault(); e.stopPropagation();
  if(k==='ArrowDown')move(1);
  else if(k==='ArrowUp')move(-1);
  else if(k==='Enter')confirmPick();
  else cancel();
},true);

document.addEventListener('mousedown',function(e){
  syncState();
  if(!S.active)return;
  var box=document.getElementById('dtLookup');
  if(!box||!box.contains(e.target))return;
  var f=(e.target&&e.target.closest)?e.target.closest('[data-ba],[data-pb],button'):null;
  if(!f)e.preventDefault();
},false);

document.addEventListener('dblclick',function(e){
  syncState();
  if(!S.active)return;
  var row=(e.target&&e.target.closest)?e.target.closest('#dtLookup [data-lk="row"]'):null;
  if(!row)return;
  e.preventDefault();
  var idx=+row.getAttribute('data-i');
  if(!isNaN(idx))setActive(idx);
  confirmPick();
},false);


window.__WL_LOOKUP_GRID__=function(){
  var st=D.lookupState||{};
  return {mode:S.active?'grid':'legacy',active:S.active,
    source:S.spec?S.spec.source:'',label:S.spec?S.spec.label:'',
    columns:S.spec?S.spec.cols.map(function(c){ return {k:c.k,t:c.t,w:c.w}; }):[],
    pageSize:S.spec?S.spec.size:0,page:S.page+1,
    heightMode:S.spec?S.spec.heightMode:'auto',heightPx:S.spec?S.spec.heightPx:0,
    boxHeight:(document.getElementById('dtLookup')||{}).offsetHeight||0,
    boxTop:(document.getElementById('dtLookup')||{}).offsetTop||0,
    place:window.__WL_LOOKUP_PLACE__||null,
    candidates:(st.list||[]).length,activeIndex:+st.active||0,
    query:S.q,writes:S.writes,guardBlocks:S.blocks,guardReasons:S.lastReasons.slice(),
    focusKept:!!(S.trigger&&document.activeElement===S.trigger)};
};
T._lookupGrid=window.__WL_LOOKUP_GRID__;
})();
