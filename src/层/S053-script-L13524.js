

(function(){
  var W=window, SETS=W.__TPL_SETS__||{}, KEY='TPL_ACTIVE_SET_V1', SCHEMA_STORE='TPL_SCHEMA_V113';
  if(!Object.keys(SETS).length || document.getElementById('wlSetSwitch')) return;
  var active=W.__TPL_ACTIVE_SET__||'product';
  
  try{
    var real=(W.TPL&&W.TPL.schema&&W.TPL.schema.id)||'';
    Object.keys(SETS).forEach(function(k){ if(SETS[k].id===real) active=k; });
  }catch(e){}
  var wrap=document.createElement('div'); wrap.id='wlSetSwitch'; wrap.className='wlset-wrap';
  var items=Object.keys(SETS).map(function(k){
    var s=SETS[k], sc=s.schema||{}, cols=((sc.list||{}).columns||[]).length,
        gs=((sc.detail||{}).groups||[]).reduce(function(n,g){return n+((g.fields||[]).length);},0);
    return '<div class="wlset-item'+(k===active?' cur':'')+'" data-k="'+k+'">'
      +'<span class="wlset-radio"></span><div><div class="wlset-lb">'+s.label
      +(k==='product'?'<span class="wlset-tag">默认</span>':'')+'</div>'
      +'<div class="wlset-ds">'+s.desc+'</div>'
      +'<div class="wlset-meta">'+cols+' 列 · '+gs+' 个表头字段 · id='+s.id+'</div></div></div>';
  }).join('');
  wrap.innerHTML='<div class="wlset-panel"><div class="wlset-ttl">业务配置集</div>'
    +'<div class="wlset-sub">切换后整页按该业务的列、字段与动作重新渲染；配置按 schema.id 隔离存档</div>'
    +items+'<div class="wlset-foot">配置集是纯数据：在 config-data.js 的 __TPL_SETS__ 里加一项即可扩展新业务，前端 0 代码。<br>'
    +'预览器可用 ?set=saleBill 直达销售单（销售开票），不传参数即为默认的产品档案。</div></div>'
    +'<div class="wlset-pill"><span class="wlset-dot"></span><span style="color:#8a94a6">业务</span>'
    +'<span class="wlset-name">'+(SETS[active]?SETS[active].label:active)+'</span><span class="wlset-caret">▲</span></div>';
  document.body.appendChild(wrap);
  wrap.querySelector('.wlset-pill').addEventListener('click',function(){ wrap.classList.toggle('on'); });
  wrap.querySelectorAll('.wlset-item').forEach(function(el){
    el.addEventListener('click',function(){
      var k=el.getAttribute('data-k');
      try{ W.localStorage.setItem(KEY,k); }catch(e){}
      try{ W.name='TPL_SET:'+k; }catch(e){}
      try{ W.localStorage.removeItem(SCHEMA_STORE); }catch(e){}
      try{
        var u=new URL(W.location.href);
        if(u.protocol==='http:'||u.protocol==='https:'||u.protocol==='file:'){
          u.searchParams.set('set',k); W.location.href=u.toString(); return;
        }
      }catch(e){}
      try{ W.location.reload(); }catch(e){}
    });
  });
  W.__WL_SET_SWITCH__=function(){
    return {active:active, keys:Object.keys(SETS),
      current:SETS[active]?SETS[active].label:active,
      schemaId:(W.TPL&&W.TPL.schema&&W.TPL.schema.id)||null,
      urlParam:(W.location.search||'').match(/[?&]set=([^&]+)/)?RegExp.$1:null};
  };
})();
