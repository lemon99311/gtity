

(function(){
'use strict';
const T=window.TPL, V=window.Vue, main=document.getElementById('main');
if(!T||!V||!window.__WL_HAS_EL__||!main)return;   

var TEMPLATE = [
'<el-table ref="tbl" class="wl-el-table" :data="rows" :fit="false"',
'  :border="false" :stripe="false" :height="height" :empty-text="emptyText"',
'  :row-class-name="rowClass" @row-click="onRowClick" @header-click="onHeaderClick">',
'  <el-table-column v-for="(c,ci) in cols" :key="c.k" :prop="c.k" :label="c.t"',
'    :width="c.w" :fixed="c.fixed" :align="c.align||\'left\'" :header-align="c.align||\'left\'"',
'    :class-name="\'col-\'+c.k+(c.nosort?\' is-nosort\':\'\')"',
'    :show-overflow-tooltip="false">',
'    <template slot-scope="s"><span class="wl-cell" v-html="html(s.row,c)"></span></template>',
'  </el-table-column>',
'</el-table>'
].join('\n');

function create(){
  const host=document.getElementById('wlElTable');
  if(!host||host.__wlMounted)return;
  if(window.__WL_EL__){try{window.__WL_EL__.$destroy()}catch(e){}}
  host.__wlMounted=true;
  host.innerHTML='<div></div>';
  const vm=new V({
    template:TEMPLATE,
    data:function(){return {
      cols:[], rows:[], height:600,
      emptyText:'未查询到符合条件的数据',
      activeRow:null, checked:[], nosort:{}
    }},
    methods:{
      html:function(row,c){ try{return T._cell(row,c)}catch(e){return ''} },
      rowClass:function(o){
        const i=o.row&&o.row.__idx;
        const a=(i!=null&&i===this.activeRow)?'act-row':'';
        const b=(i!=null&&this.checked.indexOf(i)>=0)?'chk':'';
        return (a+' '+b).trim();
      },
      onRowClick:function(row,column,event){
        const t=event&&event.target;
        if(t&&t.closest){
          if(t.closest('td.col-chk'))return;            
          if(t.closest('.lnk,.row-ops'))return;          
        }
        if(row&&row.__idx!=null)T._row(row.__idx);
      },
      onHeaderClick:function(column){
        const p=column&&column.property;
        if(!p||this.nosort[p])return;
        T._sort(p);
      },
      fitHeight:function(){
        
        const g=main.querySelector('.wl-grid');
        if(g)this.height=Math.max(160,g.clientHeight-40);
        this.$nextTick(function(){try{this.$refs.tbl&&this.$refs.tbl.doLayout()}catch(e){}});
      },
      sync:function(){
        const d=T._snapshot();                          
        this.cols=d.cols;
        this.rows=d.rows;
        this.activeRow=d.activeRow;
        this.checked=d.checked;
        this.emptyText=d.emptyText;
        const m={}; d.cols.forEach(function(c){if(c.nosort)m[c.k]=1});
        this.nosort=m;
        this.$nextTick(function(){try{this.$refs.tbl&&this.$refs.tbl.doLayout()}catch(e){}});
      }
    },
    mounted:function(){
      const self=this;
      this.fitHeight();
      this._ro=window.ResizeObserver?new ResizeObserver(function(){self.fitHeight()}):null;
      const g=main.querySelector('.wl-grid');
      if(this._ro&&g)this._ro.observe(g);
      this._onResize=function(){self.fitHeight()};
      window.addEventListener('resize',this._onResize);
      this.ready=true;
      this.sync();
      this.$nextTick(function(){self.fitHeight()});
    },
    beforeDestroy:function(){
      if(this._ro)try{this._ro.disconnect()}catch(e){}
      if(this._onResize)window.removeEventListener('resize',this._onResize);
    }
  });
  vm.$mount(host.firstElementChild);                  
  vm.ready=true;
  window.__WL_EL__=vm;
}

let raf=null;
if(window.MutationObserver){
  new MutationObserver(function(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){create()});
  }).observe(main,{childList:true,subtree:true});
}
create();
})();
