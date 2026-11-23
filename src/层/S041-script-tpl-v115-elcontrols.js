

(function(){
'use strict';
const V=window.Vue, T=window.TPL, main=document.getElementById('main');
if(!V||!T||!window.__WL_HAS_EL__||!main)return;   

const ICONS={
  expand:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h10M3 11h10M5 3l-2 2 2 2M5 9l-2 2 2 2"/></svg>',
  filter:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h12l-4.5 5v4l-3 1.5V8z"/></svg>',
  group:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="12" height="5"/></svg>',
  table:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12"/><path d="M2 6h12M2 10h12M7 2v12"/></svg>',
  tree:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v10M3 5h5M3 11h5M8 5h5M8 11h5"/></svg>'
};


const store=V.observable({
  total:0, page:1, size:10, view:'all', unit:'项',
  toolbar:{}, tbDefs:[], statusViews:[],
  ctxOptions:['档案中心','全部库房','中药材仓库','中成药仓库','医药常温库'],
  ctx:'档案中心',
  expandOn:false, groupOn:false, treeOn:false, advOn:false,
  
  ft:(function(){ try{ return (T._snapshot()||{}).ft||{}; }catch(e){ return {}; } })()
});

const base={
  computed:{
    st:function(){return store},
    tbDefs:function(){return store.tbDefs},
    
    toolActs:function(){
      const A=window.ACT; if(!A)return [];
      const map={expandOn:store.expandOn,advOn:store.advOn,groupOn:store.groupOn,
                 '!treeOn':!store.treeOn,treeOn:store.treeOn};
      return A.toolbar().map(function(a){
        return {id:a.id,icon:a.icon,iconSvg:a.iconSvg,label:a.label,title:a.title,
          badge:a.badge,sepBefore:a.sepBefore,estate:a.estate,
          text:(a.badge?a.label+' ':a.label)+(a.caret?' ▾':''),
          on:!!map[a.estate]};
      });
    },
    newBtn:function(){
      const A=window.ACT; if(!A)return null;
      const a=A.header().filter(function(x){return x.action==='new'})[0];
      if(!a)return null;
      return {id:a.id,label:a.label,svg:A.icon(a.icon,a.iconSvg,'wl-new-plus'),
              plain:!a.iconSvg && (!a.icon||a.icon==='plus')};
    },
    otherHeaderActs:function(){
      const A=window.ACT; if(!A)return [];
      const nb=this.newBtn;
      return A.header().filter(function(a){return !nb || a.id!==nb.id}).map(function(a){
        return {id:a.id,label:a.label,svg:A.icon(a.icon,a.iconSvg)};
      });
    },
    newItems:function(){
      const A=window.ACT; if(!A)return [];
      return A.newMenu().map(function(a){return {id:a.id,label:a.label,svg:A.icon(a.icon,a.iconSvg)}});
    },
    hasMore:function(){ const A=window.ACT; return A?A.more().length>0:false; },
    statusOpts:function(){
      return [{l:'状态',v:''}].concat(store.statusViews.map(function(v){return {l:v.label,v:v.id}}))
             .concat([{l:'全部状态',v:'all'}]);
    },
    statusVal:function(){return /^(warn|audit|off)$/.test(store.view)?store.view:''},
    ctxOptions:function(){return store.ctxOptions}
  },
  methods:{
    
    onNewCommand:function(id){ this.call('_actRun',id); },
    runAct:function(a){ if(a&&a.id)this.call('_actRun',a.id); },
    iconSvg:function(a){ const A=window.ACT; return A?A.icon(a.icon,a.iconSvg):''; },
    call:function(name){
      const a=Array.prototype.slice.call(arguments,1), f=window.TPL[name];
      if(typeof f==='function')return f.apply(window.TPL,a);
    },
    icon:function(k){return ICONS[k]||''},
    opts:function(d){
      return [{l:d.label,v:''},{l:'全部',v:'全部'}]
        .concat((d.options||[]).map(function(o){return {l:o,v:o}}));
    },
    
    optsW:function(os){
      let m=0;
      (os||[]).forEach(function(o){
        let w=0; for(const ch of String(o.l))w+=/[\u4e00-\u9fa5]/.test(ch)?13:7.5;
        if(w>m)m=w;
      });
      return Math.max(92,Math.min(154,Math.round(m+34)));
    },
    selW:function(d){return this.optsW(this.opts(d))},
    onCtx:function(v){store.ctx=v;this.call('_wlCtx',v)},
    onTb:function(f,v){this.call('_toolbar',f,v)},
    onStatus:function(v){this.call('_view',v||'all')},
    onSize:function(v){this.call('_size',+v)},
    onPage:function(v){if(v===store.page)return;this.call('_page',v)}
  }
};




const TPL_BTN=`<div class="wl-eb-line">
  <el-dropdown v-if="newBtn && newItems.length" class="wl-new-dd" trigger="click" placement="bottom-start" @command="onNewCommand">
    <el-button type="primary" class="wl-btn wl-btn-pri wl-new-btn" title="+ 新建"><svg v-if="newBtn.plain" class="wl-new-plus" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3.2v9.6M3.2 8h9.6"/></svg><span v-else class="wl-new-ico" v-html="newBtn.svg"></span><span>{{newBtn.label}}</span><svg class="wl-new-caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10L8 5.5l4.5 4.5"/></svg></el-button>
    <el-dropdown-menu slot="dropdown" class="wl-new-menu">
      <el-dropdown-item v-for="it in newItems" :key="it.id" :command="it.id"><span v-if="it.svg" class="wl-menu-ico" v-html="it.svg"></span>{{it.label}}</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
  <el-button v-else-if="newBtn" type="primary" class="wl-btn wl-btn-pri wl-new-btn" @click="runAct(newBtn)">＋ {{newBtn.label}}</el-button>
  <el-button v-for="a in otherHeaderActs" :key="a.id" class="wl-btn wl-btn-ghost" @click="runAct(a)"><span v-if="a.svg" class="wl-btn-ico" v-html="a.svg"></span>{{a.label}}</el-button>
  <el-button v-if="hasMore" class="wl-btn wl-btn-more" title="更多" @click="call('_wlMenu')">···</el-button>
</div>`;

const TPL_CTX=`<el-select class="wl-ectx" :value="st.ctx" @change="onCtx" title="项目 / 库房上下文">
  <el-option v-for="o in ctxOptions" :key="o" :label="o" :value="o"></el-option>
</el-select>`;

const TPL_SELS=`<div class="wl-esels-line">
  <el-select v-for="(d,ti) in tbDefs" :key="d.field" class="wl-esel"
    :style="{width:selW(d)+'px'}" :value="st.toolbar[d.field]||''" @change="onTb(d.field,$event)">
    <el-option v-for="o in opts(d)" :key="o.v" :label="o.l" :value="o.v"></el-option>
  </el-select>
  <el-select class="wl-esel wl-esel-status" :style="{width:optsW(statusOpts)+'px'}"
    :value="statusVal" @change="onStatus">
    <el-option v-for="o in statusOpts" :key="o.v" :label="o.l" :value="o.v"></el-option>
  </el-select>
</div>`;


const TPL_TOOLS=`<div class="wl-etool-line"><template v-for="a in toolActs"><span class="wl-vt-sep" v-if="a.sepBefore" :key="a.id+'_s'"></span><el-button type="text" class="wl-vt" :key="a.id" :class="{on:a.on}" :title="a.title" @click="runAct(a)"><span v-html="iconSvg(a)"></span>{{a.text}}<b v-if="a.badge" id="tplCondN">0</b></el-button></template></div>`;

const TPL_PAGESIZE=`<el-select class="wl-epagesize" :value="String(st.size)" @change="onSize">
  <el-option v-for="n in [10,20,50,100]" :key="n" :label="n" :value="String(n)"></el-option>
</el-select>`;

const TPL_PAGER=`<el-pagination class="wl-epager" layout="prev,pager,next"
  :current-page="st.page" :page-size="st.size" :total="st.total" :pager-count="5"
  @current-change="onPage"></el-pagination>`;

const DEFS=[
  {sel:'#wlElBtnHost',     tpl:TPL_BTN},
  {sel:'#wlElCtxHost',     tpl:TPL_CTX},
  {sel:'#wlElSelHost',     tpl:TPL_SELS},
  {sel:'#wlElToolHost',    tpl:TPL_TOOLS},
  {sel:'#wlElPageSizeHost',tpl:TPL_PAGESIZE},
  {sel:'#wlElPagerHost',   tpl:TPL_PAGER}
];
const mounted={};


function put(k,v){
  const cur=store[k];
  if(cur&&typeof cur==='object'){
    if(JSON.stringify(cur)===JSON.stringify(v))return;
  }else if(cur===v)return;
  store[k]=v;
}
function sync(){
  if(!T._snapshot)return;
  const s=T._snapshot();
  put('total',s.total); put('page',s.page); put('size',s.size); put('view',s.view);
  put('unit',s.unit); put('toolbar',s.toolbar);
  put('tbDefs',s.tbDefs); put('statusViews',s.statusViews);
  put('expandOn',main.classList.contains('wl-expand-on'));
  put('groupOn', main.classList.contains('wl-group-on'));
  put('treeOn',  main.classList.contains('wl-tree-on'));
  put('advOn',   !!main.querySelector('.drug-adv.on'));
  put('ft',      s.ft||{});              
}


function escA(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function setShadows(){
  const host=document.getElementById('wlElSelHost'); if(!host)return;
  let box=host.querySelector('.wl-dds-shadows');
  if(!box){box=document.createElement('span');box.className='wl-dds-shadows';
    box.style.display='none';host.appendChild(box)}
  const vals=store.tbDefs.map(function(d){return store.toolbar[d.field]||''});
  vals.push(/^(warn|audit|off)$/.test(store.view)?store.view:'');
  const key=vals.join('|');
  if(box.dataset.key===key)return;                 
  box.dataset.key=key;
  box.innerHTML=vals.map(function(v){
    return v?'<select><option value=""></option><option value="'+escA(v)+'" selected>'+escA(v)+'</option></select>'
            :'<select><option value="" selected></option></select>';
  }).join('');
}


function fixCond(){
  const b=document.getElementById('tplCondN'); if(!b)return;
  let n=0;
  document.querySelectorAll('#tplAdvWrap input, #tplAdvWrap select').forEach(function(el){
    if(el.value&&el.value!=='全部')n++;
  });
  document.querySelectorAll('.wl-dds select').forEach(function(el){
    if(el.value&&el.value!=='全部')n++;
  });
  const kw=document.getElementById('tplKw');
  if(kw&&kw.value.trim())n++;
  if(b.textContent!==String(n))b.textContent=n;
}

function mountAll(){
  sync();
  DEFS.forEach(function(d){
    const host=main.querySelector(d.sel); if(!host)return;
    const rec=mounted[d.sel];
    if(rec&&rec.el===host&&host.__wlMounted)return;
    if(rec&&rec.vm){try{rec.vm.$destroy()}catch(e){}}
    host.__wlMounted=true;
    host.innerHTML='<div></div>';
    const vm=new V({mixins:[base],template:d.tpl});
    vm.$mount(host.firstElementChild);
    mounted[d.sel]={el:host,vm:vm};
  });
  setShadows();
  fixCond();
}


let busy=false, pending=false;
function schedule(){
  if(busy){pending=true;return}
  busy=true;
  try{mountAll()}catch(e){}
  finally{busy=false}
  if(pending){pending=false;requestAnimationFrame(schedule)}
}
if(window.MutationObserver){
  new MutationObserver(function(){schedule()}).observe(main,{childList:true,subtree:true});
}
schedule();


window.__WL_EL_CONTROLS__={sync:sync};
})();
