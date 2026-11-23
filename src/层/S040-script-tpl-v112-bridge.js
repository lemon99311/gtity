
(function(){
'use strict';
const T = window.TPL, E = window.ELEMENT, main = document.getElementById('main');
if(!T || !main) return;
document.body.classList.add('wl-v112');



const wmSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='250' height='150'><text x='14' y='86' transform='rotate(-24 125 75)' font-family='sans-serif' font-size='13' fill='#2e405e' fill-opacity='.07'>Hello... 5709</text></svg>";
const wmCss = document.createElement('style');
wmCss.textContent = '#main .wl-page::after{background-image:url("data:image/svg+xml;utf8,' + encodeURIComponent(wmSvg) + '")}';
document.head.appendChild(wmCss);


function say(m,t){ if(E && E.Message) E.Message({message:m,type:t||'info',duration:1800}); else T._toast(m); }
function note(title,text){
  if(E && E.Notification) E.Notification({title:title,message:text,type:'info',duration:2600,position:'bottom-right'});
  else T._toast(title + ' · ' + text);
}
function confirmDo(text,title,cb){
  if(E && E.MessageBox){
    E.MessageBox.confirm(text,title,{confirmButtonText:'确定',cancelButtonText:'取消',type:'warning'})
      .then(cb).catch(function(){ say('已取消','info'); });
  } else if(window.confirm(text)) cb(); else say('已取消','info');
}


function activeFilters(){
  let n = 0;
  main.querySelectorAll('#tplAdvWrap input, #tplAdvWrap select').forEach(function(el){
    if(el.value && el.value!=='全部') n++;
  });
  main.querySelectorAll('.wl-dds select').forEach(function(el){
    if(el.value && el.value!=='全部') n++;
  });
  const kw = main.querySelector('#tplKw');
  if(kw && kw.value.trim()) n++;
  return n;
}
function updateCond(){ const b = main.querySelector('#tplCondN'); if(b) b.textContent = activeFilters(); }


function syncUI(){
  const tree = main.classList.contains('wl-tree-on');
  main.querySelectorAll('.wl-vt[data-mode]').forEach(function(b){
    b.classList.toggle('on', (b.dataset.mode==='tree')===tree);
  });
  const pick = function(frag,on){
    const b = main.querySelector('.wl-vt[onclick*="'+frag+'"]');
    if(b) b.classList.toggle('on',on);
  };
  pick('_wlExpand', main.classList.contains('wl-expand-on'));
  pick('_wlGroup',  main.classList.contains('wl-group-on'));
  pick('_adv',      !!main.querySelector('.drug-adv.on'));
  const n = main.querySelector('#tplTotal'), rn = main.querySelector('#wlRailN');
  if(rn && n) rn.textContent = n.textContent;
  const first = main.querySelector('.wl-dds select');
  const val = first ? first.value : '';
  main.querySelectorAll('.wl-gchip').forEach(function(c){ c.classList.toggle('on', c.dataset.v===val); });
  updateCond();
}

['_adv','_q','_toolbar','_view','_kw'].forEach(function(k){
  const raw = T[k];
  T[k] = function(){ const r = raw.apply(T, arguments); updateCond(); return r; };
});
let raf = null;
if(window.MutationObserver){
  new MutationObserver(function(){
    cancelAnimationFrame(raf); raf = requestAnimationFrame(syncUI);
  }).observe(main,{childList:true,subtree:true});
}
syncUI();


T._wlMenu      = function(){ main.classList.toggle('wl-menu-on'); main.classList.remove('wl-new-open'); };
T._wlCloseMenu = function(){ main.classList.remove('wl-menu-on'); };

T._wlNewMenu   = function(){ main.classList.toggle('wl-new-open'); main.classList.remove('wl-menu-on'); };
T._wlCloseNew  = function(){ main.classList.remove('wl-new-open'); };

T._wlNewAction = function(a){
  T._wlCloseMenu(); T._wlCloseNew();
  const f=T[a]; if(typeof f==='function') f.call(T);
};
document.addEventListener('click',function(e){
  const inside = e.target.closest('.wl-new-dd') || e.target.closest('.wl-btn-more') ||
                 e.target.closest('.wl-menu') || e.target.closest('.wl-new-menu');
  if(!inside){ main.classList.remove('wl-menu-on'); main.classList.remove('wl-new-open'); }
});
T._wlImport = function(){
  confirmDo('从 Excel 批量导入药品档案？该操作为原型演示，不写入任何数据。','批量导入',function(){
    say('导入任务已创建（原型演示）','success');
  });
};
T._wlNode = function(){
  const act = main.querySelector('.wl-tab.on');
  const label = act ? act.textContent.replace(/\d+\s*$/,'').trim() : '全部药品';
  note('批次 / 养护节点','当前视图：' + label + '；节点：建档 → 资质审核 → 价格复核 → 上架在库 → 停用淘汰');
};
T._wlFocus = function(){
  document.body.classList.toggle('wl-v113-full');
  const pure = document.body.classList.contains('wl-v113-full');
  say(pure ? '已切换为纯列表视图（对齐基准图）' : '已显示模板完整框架（顶栏 / 侧栏 / 标签栏）','success');
};
T._wlCtx = function(v){ say('当前范围：' + v,'success'); };


T._wlExpand = function(){
  main.classList.toggle('wl-expand-on');
  say(main.classList.contains('wl-expand-on') ? '已展开全部行（长文本完整显示）' : '已收起行','success'); syncUI();
};
T._wlGroup = function(){
  main.classList.toggle('wl-group-on');
  say(main.classList.contains('wl-group-on') ? '已按工具栏字段分组，点击分组值可直接筛选' : '已取消分组','success'); syncUI();
};
T._wlMode = function(m){
  main.classList.toggle('wl-tree-on', m==='tree');
  say(m==='tree' ? '已切换为树状视图（原型演示，列配置不变）' : '已切换为表格视图','success'); syncUI();
};
T._wlRail = function(){ main.classList.toggle('wl-rail-on'); syncUI(); };
T._wlWatermark = function(){
  main.classList.toggle('wl-no-wm');
  say(main.classList.contains('wl-no-wm') ? '水印已隐藏' : '水印已显示','success');
};
})();
