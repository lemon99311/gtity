

(function(){
'use strict';
if(window.__WL_B4_READY__)return;
window.__WL_B4_READY__=1;
var T=window.TPL, LOG=[], CHANGED=false, G=null, DEF=null, SUP=null;
window.__WL_B4_LOG__=LOG;
function log(k,d){LOG.push(Object.assign({at:Date.now(),k:k},d||{}));if(LOG.length>240)LOG.shift()}
function clone(o){try{return JSON.parse(JSON.stringify(o))}catch(e){return {}}}
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function escA(v){return esc(v).replace(/'/g,'&#39;')}
function escJS(v){
  var t=String(v==null?'':v).replace(/\\/g,'\\\\').replace(/'/g,"\\'")
    .replace(/\r/g,'\\r').replace(/\n/g,'\\n')
    .replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  t=t.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return "'"+t+"'";
}


var BASE={
  statusViewIds:['warn','audit','off'],                    
  statusLabels:{status:'状态',all:'全部状态'},              
  quickViewCount:4,                                       
  contextOptions:['档案中心','全部库房','中药材仓库','中成药仓库','医药常温库'],
  contextDefault:'档案中心',                               
  toolbarAllLabel:'全部',                                  
  whereFallback:[['kind','类别'],['status','状态'],['flow','流转节点'],
                 ['level','等级'],['stock','库存量'],['warn','警戒线']],  
  tagColors:{
    '中药饮片':'#20c22e','精制饮片':'#f2711c','毒性饮片':'#db2828',
    '颗粒剂':'#00b5ad','饮片':'#b5cc18','Rx':'#ec0019',
    '阴凉':'#767676','常温':'#1b1c1d','浙江省':'#0052d9',
    '中成药仓库':'#6435c9','中药材仓库':'#e03997','医药常温库':'#2185d0',
    '其他':'#767676','贵细品种':'#f2711c','首营品种':'#00b5ad',
    '中药饮片(9%)':'#b5cc18','中成药(13%)':'#6435c9','普通品种':'#20c22e'
  },
  tagFallback:['#20c22e','#f2711c','#db2828','#00b5ad','#b5cc18',
               '#767676','#1b1c1d','#0052d9','#6435c9','#e03997'],
  demoVisual:{indexShift:0},                              
  titleSuffix:'列表 UI v1.33 · 键盘流录入',                
  unit:'项'                                               
};


var SUP_GENERIC={
  statusViewIds:['on','audit'],                           
  statusLabels:{status:'审核状态',all:'全部审核状态'},
  quickViewCount:2,
  contextOptions:['供应链中心','华东仓','华南仓','冷链仓'],
  contextDefault:'供应链中心',
  toolbarAllLabel:'不限',
  unit:'家',
  whereFallback:[['kind','供应商类别'],['status','合作状态'],['flow','准入节点'],
                 ['level','评级'],['stock','供货量'],['warn','预警线']],
  tagColors:{'生产企业':'#0052d9','流通企业':'#366ef4','合作中':'#20c22e'},
  tagFallback:['#0052d9','#366ef4','#618dff','#8eabff','#b5c7ff','#d9e1ff','#f2f3ff','#003cab','#6435c9','#00b5ad'],
  demoVisual:{indexShift:1},
  titleSuffix:'通用配置驱动'
};


function norm(raw,S){
  var g=clone(BASE);
  if(raw&&typeof raw==='object')Object.keys(BASE).forEach(function(k){
    if(raw[k]!==undefined&&raw[k]!==null)g[k]=clone(raw[k]);
  });
  if(!raw||raw.unit===undefined) g.unit=(S&&S.meta&&S.meta.unit)||'项';
  g.statusLabels=Object.assign(clone(BASE.statusLabels),g.statusLabels||{});
  g.demoVisual=Object.assign(clone(BASE.demoVisual),g.demoVisual||{});
  g.specVersion='b4';
  return g;
}
var S=T.schema;
if(!S.generic) S.generic=norm(null,S);       
G=norm(S.generic,S); S.generic=G;
DEF=norm(null,S);
CHANGED=JSON.stringify(G)!==JSON.stringify(DEF);

if(T.examples&&T.examples.supplier&&!T.examples.supplier.generic){
  T.examples.supplier.generic=clone(SUP_GENERIC);
}
window.__WL_B4_GENERIC__=clone(G);
log('boot',{schema:S.id,changed:CHANGED,genericKeys:Object.keys(G)});


function allViews(){
  var out=null;
  try{
    var raw=localStorage.getItem('TPL_VIEW_CFG_V113:'+(S.id||'default'));
    if(raw){var c=JSON.parse(raw);if(c&&Array.isArray(c.views))out=c.views;}
  }catch(e){}
  if(!out||!out.length)out=(S.list&&S.list.views)||[];
  return out;
}
function ids(){ return (G.statusViewIds||[]).map(String); }
function tagColor(v){
  var m=G.tagColors||{}, f=G.tagFallback||[];
  if(m[v])return m[v];
  var h=0, str=String(v);
  for(var i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))>>>0;
  return f.length?f[h%f.length]:'#767676';
}
function quickHTML(views,n){
  return views.slice(0,n).map(function(v){
    return '<a href="#" onclick="TPL._view('+escJS(v.id)+');return false">'+esc(v.label)+'</a>';
  }).join('');
}


function roots(){
  var main=document.getElementById('main'); if(!main)return [];
  return [].slice.call(main.querySelectorAll('*')).filter(function(e){
    var v=e.__vue__;
    return !!(v&&v.st&&typeof v.st==='object'&&v.$options&&v.$options.computed&&v.$options.computed.statusOpts);
  }).map(function(e){return e.__vue__});
}
function applyVM(){
  roots().forEach(function(vm){
    if(vm.__b4)return;
    vm.__b4=1;
    try{
      Object.defineProperty(vm,'statusVal',{configurable:true,enumerable:true,get:function(){
        var st=vm.st; return ids().indexOf(String(st.view))>=0?st.view:'';
      }});
      Object.defineProperty(vm,'statusOpts',{configurable:true,enumerable:true,get:function(){
        var st=vm.st;
        return [{l:G.statusLabels.status,v:''}]
          .concat((st.statusViews||[]).map(function(v){return {l:v.label,v:v.id}}))
          .concat([{l:G.statusLabels.all,v:'all'}]);
      }});
      if(G.toolbarAllLabel!==BASE.toolbarAllLabel){
        vm.opts=function(d){
          return [{l:d.label,v:''},{l:G.toolbarAllLabel,v:'全部'}]
            .concat((d.options||[]).map(function(o){return {l:o,v:o}}));
        };
      }
      var st=vm.st;
      if(JSON.stringify(st.ctxOptions||[])!==JSON.stringify(G.contextOptions))st.ctxOptions=G.contextOptions.slice();
      if(st.ctx!==G.contextDefault)st.ctx=G.contextDefault;
      vm.$forceUpdate();
      log('vm-patched',{cls:String((vm.$el&&vm.$el.className)||'').slice(0,42)});
    }catch(e){log('vm-error',{msg:String(e).slice(0,160)})}
  });
}


var fixQueued=false, lastView='all';
function scheduleFix(view){
  if(!CHANGED)return;
  if(view!==undefined)lastView=String(view);
  if(fixQueued)return; fixQueued=true;
  setTimeout(function(){fixQueued=false;fixAll();},0);
}
function fixQuick(){
  var q=document.getElementById('tplQuick'); if(!q)return;
  
  var want=quickHTML(allViews(),G.quickViewCount);
  if(q.innerHTML!==want){q.innerHTML=want;log('quick',{n:G.quickViewCount,links:q.children.length})}
}
function fixShadowCond(){
  var v=String(lastView), want=ids().indexOf(v)>=0?v:'';
  var box=document.querySelector('.wl-dds-shadows');
  if(box){
    var sels=box.querySelectorAll('select'), last=sels[sels.length-1];
    if(last&&last.value!==want){
      var tmp=document.createElement('span');
      tmp.innerHTML=want
        ? '<select><option value=""></option><option value="'+escA(want)+'" selected>'+escA(want)+'</option></select>'
        : '<select><option value="" selected></option></select>';
      if(tmp.firstElementChild)last.parentNode.replaceChild(tmp.firstElementChild,last);
      log('shadow',{view:v,want:want});
    }
  }
  var b=document.getElementById('tplCondN'); if(!b)return;
  var n=0;
  document.querySelectorAll('#tplAdvWrap input, #tplAdvWrap select').forEach(function(el){if(el.value&&el.value!=='全部')n++});
  var mirrors=[].slice.call(document.querySelectorAll('.wl-dds select'));
  mirrors.forEach(function(el){if(el.value&&el.value!=='全部')n++});
  if(want&&!mirrors.some(function(s){return s.value===want}))n++;
  var kw=document.getElementById('tplKw'); if(kw&&kw.value.trim())n++;
  if(b.textContent!==String(n)){b.textContent=String(n);log('cond',{n:n})}
}
function fixWhere(){
  var tab=document.querySelector('#vcWin .vc-tab.on[data-t="where"]'); if(!tab)return;
  var pane=document.getElementById('vcPane'); if(!pane)return;
  var map={}; (G.whereFallback||[]).forEach(function(x){if(x&&x.length>1)map[x[0]]=x[1]});
  pane.querySelectorAll('.vc-rule select').forEach(function(sel){
    [].slice.call(sel.options).forEach(function(op){
      if(map[op.value]&&op.textContent!==map[op.value]){
        op.textContent=map[op.value];log('where',{field:op.value,label:map[op.value]});
      }
    });
  });
}
function fixTitle(){
  var M=(S.meta||{}), want=M.pageTitle+' · '+G.titleSuffix;
  if(document.title!==want){document.title=want;log('title',{t:want})}
}
function fixAll(){ fixQuick(); fixShadowCond(); fixWhere(); fixTitle(); }


function wrap(name,fn){
  if(typeof T[name]!=='function')return;
  var raw=T[name];
  T[name]=function(){return fn.call(this,raw,arguments)};
  log('wrapped',{name:name});
}

var VISUAL=['primary','avatars','person','plan','linkText'];
wrap('_cell',function(raw,args){
  var h=raw.apply(T,args);
  if(!CHANGED)return h;
  var r=args[0], c=args[1], kind=c&&c.renderer;
  try{
    if(kind==='tag'&&h&&h.indexOf('wl-tag-solid')>=0){
      h=String(h).replace(/<span class="wl-tag-solid" style="background-color:(#[0-9a-fA-F]{3,8})">([^<]*)<\/span>/g,
        function(m,old,v){return '<span class="wl-tag-solid" style="background-color:'+tagColor(v)+'">'+v+'</span>'});
    }
    var sh=(G.demoVisual&&+G.demoVisual.indexShift)||0;
    if(sh&&VISUAL.indexOf(kind)>=0){
      var rr=Object.assign({},r,{__idx:(+r.__idx||0)+sh});
      h=raw.call(T,rr,c);
    }
  }catch(e){log('cell-error',{msg:String(e).slice(0,160)})}
  return h;
});

wrap('_snapshot',function(raw,args){
  var s=raw.apply(T,args);
  if(!CHANGED)return s;
  try{
    var views=allViews();
    s.statusViews=ids().map(function(id){
      var v=views.filter(function(x){return String(x.id)===id})[0];
      return v?{id:v.id,label:v.label}:null;
    }).filter(Boolean);
    s.unit=G.unit;
    applyVM();
    scheduleFix(s.view);
  }catch(e){log('snapshot-error',{msg:String(e).slice(0,160)})}
  return s;
});

['_view','_toolbar','_kw','_page','_size','_sort','_vcTab','_vcOpen','_vcPick','_vcSave','_vcReset',
 '_vcRuleAdd','_vcRuleDel','_vcRuleJoin','_vcRule','_vcRuleField'].forEach(function(k){
  wrap(k,function(raw,args){
    var ret=raw.apply(T,args);
    if(CHANGED)scheduleFix(T._snapshot?T._snapshot().view:undefined);
    return ret;
  });
});

if(CHANGED)scheduleFix(T._snapshot?T._snapshot().view:undefined);


var DEAD=[
  {name:'WL_TAG_FIELDS',where:'主引擎「v1.13 截图高保真单元格」层',
   reason:'声明后 0 引用；v1.17 起 tag 渲染器改读 c.render.fields，6 个业务字段数组不再被读取',occurrences:1},
  {name:'_vcTbOptions',where:'v1.7 注释提及的旧出口名',
   reason:'符号已移除（v1.7 由 VC.tbOptions 取代），去注释全文件 0 次',occurrences:0},
  {name:'activeCol',where:'v1.2 注释提及的旧状态字段 st.activeCol',
   reason:'已删除的「当前格」状态机字段，去注释全文件 0 次；行单选/勾选两套状态机未受影响',occurrences:0}
];
window.__WL_B4_DEAD__=clone(DEAD);


function refresh(){
  G=norm(S.generic,S); S.generic=G; DEF=norm(null,S);
  CHANGED=JSON.stringify(G)!==JSON.stringify(DEF);
  window.__WL_B4_GENERIC__=clone(G);
  roots().forEach(function(vm){delete vm.__b4});
  if(CHANGED){
    applyVM();
    var s=T._snapshot?T._snapshot():{};
    scheduleFix(s.view);
    try{ if(window.__WL_EL_CONTROLS__&&__WL_EL_CONTROLS__.sync)__WL_EL_CONTROLS__.sync(); }catch(e){}
  }
  log('refresh',{changed:CHANGED,schema:S.id});
  return clone(G);
}
Object.assign(T,{
  _generic(){ return clone(G); },
  _genericDefault(){ return clone(DEF); },
  _genericSchema(){ return (T.schema||{}).generic||null; },
  _genericConfig(o){
    if(o&&typeof o==='object'){
      S.generic=Object.assign(clone(S.generic||{}),o);
      log('config',{keys:Object.keys(o)});
      return refresh();
    }
    return clone(G);
  },
  _genericRefresh(){ return refresh(); },
  _genericChanged(){ return CHANGED; },
  _genericViews(){ return clone(allViews()); },
  _genericDead(){ return clone(DEAD); },
  _genericLog(){ return clone(LOG); },
  _genericReport(){ return {
    schema:S.id,changed:CHANGED,generic:clone(G),default:clone(DEF),
    views:allViews().map(function(v){return {id:v.id,label:v.label}}),
    statusViews:(T._snapshot?T._snapshot().statusViews:[]),
    quickCount:G.quickViewCount,contextDefault:G.contextDefault,
    title:document.title,vmPatched:roots().filter(function(v){return !!v.__b4}).length,
    dead:clone(DEAD),logs:LOG.slice(-24),
    contracts:{dbPayload:'保持不变',export:'新增 generic 段（点名）',examples:'supplier 运行时追加 generic（点名）'}
  }; }
});
})();
