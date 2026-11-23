

(function(){
  var W=window, D=document, VER='2.0';
  var STYLE_ATTR='data-wl-flow-help-style';

  
  var FIELD = {
    'spec.flow.enabled':
      '总开关。关闭后回车交回浏览器默认，不跳列、不增行。',
    'spec.flow.next':
      '唯一的流转配置：键 = 当前列 k，值 = 下一列 k。首列由链派生，链终点固定换行；'+
      '改完点「保存并应用」生效。',
    'spec.flow.selectOnFocus':
      '三项只影响录入手感（全选 / 不滚动 / 保持位置），不影响是否换行。'
  };
  var SECTIONS = [
    { key:'spec.flow.enabled',       no:'01', title:'总开关',   sub:'是否接管回车键' },
    { key:'spec.flow.next',          no:'02', title:'流转链',   sub:'next · 唯一配置' },
    { key:'spec.flow.selectOnFocus', no:'03', title:'录入手感', sub:'聚焦与滚动' }
  ];

  
  var CARD =
  '<details class="wl-flow-help" data-wl-flow-help-card="1">'+
    '<summary>规则速查 · 一次 Enter 怎么走<span>展开 / 收起</span></summary>'+
    '<div class="wl-flow-help-bd">'+

    '<div class="wl-flow-steps">'+
      '<span><i>1</i>开关关闭 → 不接管</span>'+
      '<span><i>2</i>写回当前值</span>'+
      '<span><i>3</i>选录列 → 开弹窗、不跳列</span>'+
      '<span><i>4</i>next 有映射 → 同行跳列</span>'+
      '<span><i>5</i>链终点 → 固定换行</span>'+
      '<span><i>6</i>游离列 → 按 seq 兜底，末位换行</span>'+
    '</div>'+

    '<p><b>换行写死</b>：优先复用下方整行空行，否则新增一行，焦点落新行首列。'+
      '<b>弹窗</b>确定且回填有效时，以当前列为起点复用第 4–6 步；'+
      '取消 / 关闭 / 校验失败则留在本列，不跳列、不增行、不写流转记录。</p>'+

    '<table class="wl-flow-tbl"><thead><tr><th>现象</th><th>先查什么</th></tr></thead><tbody>'+
      '<tr><td>末列回车不换行</td><td>末列是否被写进了 next 的键，或链是否成环</td></tr>'+
      '<tr><td>弹窗确定后没跳列</td><td>是否有有效回填；next 里有没有当前列</td></tr>'+
      '<tr><td>改了配置没生效</td><td>是否点了「保存并应用」</td></tr>'+
    '</tbody></table>'+

    '<p class="wl-flow-foot">完整规则见项目根目录《明细输入_键盘流转_设置说明书.md》。</p>'+
    '</div>'+
  '</details>';

  
  var CSS=[
    
    '#formWin .fw-card.wl-flow-redesign{border-color:#d9e2f5;',
    '  box-shadow:0 1px 3px rgba(31,58,122,.05)}',
    '#formWin .wl-flow-redesign > .fw-card-hd{background:linear-gradient(90deg,#f3f8ff,#fff);',
    '  border-bottom:1px solid #e3ebfa;padding:10px 14px}',
    '#formWin .wl-flow-redesign > .fw-card-hd b{font-size:12.5px;color:#1f3a7a;font-weight:600}',
    '#formWin .wl-flow-redesign > .fw-card-hd em{font-size:10.5px;color:#7b879b;font-style:normal}',

    
    '#formWin .wl-flow-chain{display:flex;align-items:center;gap:7px;flex-wrap:wrap;',
    '  padding:12px 14px;background:#f7faff;border-bottom:1px solid #e3ebfa}',
    '#formWin .wl-flow-chain .nd{display:inline-flex;align-items:center;gap:5px;',
    '  height:26px;padding:0 10px;border:1px solid #c9d8ee;border-radius:14px;',
    '  background:#fff;font:11.5px/1 ui-monospace,Menlo,Consolas,monospace;color:#40506b;',
    '  white-space:nowrap}',
    '#formWin .wl-flow-chain .nd.first{border-color:#9ad4b3;background:#effaf3;color:#1d7a45;font-weight:600}',
    '#formWin .wl-flow-chain .nd.tail{border-color:#a9c4f5;background:#eaf1ff;color:#0052d9;font-weight:600}',
    '#formWin .wl-flow-chain .nd.wrap{border-style:dashed;border-color:#b9c6da;',
    '  background:#fbfcfe;color:#6b7688;font-family:inherit}',
    '#formWin .wl-flow-chain .ar{color:#a6b3c8;font-size:12px;flex:0 0 auto}',
    '#formWin .wl-flow-chain .tip{margin-left:auto;font-size:10.5px;color:#7b879b;',
    '  white-space:nowrap}',
    '#formWin .wl-flow-chain .tip.ok{color:#1d7a45}',
    '#formWin .wl-flow-chain .tip.bad{color:#c2410c}',
    '#formWin .wl-flow-chain.err{padding:10px 14px;background:#fff8f2;',
    '  border-bottom:1px solid #f5d9a8;color:#a15c12;font-size:11.5px}',
    '#formWin .wl-flow-chain .lg{display:inline-flex;gap:9px;margin-left:6px;font-size:10px;',
    '  color:#8a94a6}',
    '#formWin .wl-flow-chain .lg i{font-style:normal}',

    
    '#formWin .wl-flow-sec{display:flex;align-items:center;gap:8px;padding:11px 14px 3px;',
    '  font-size:11px;font-weight:600;color:#1f3a7a}',
    '#formWin .wl-flow-sec i{display:inline-flex;align-items:center;justify-content:center;',
    '  width:19px;height:19px;border-radius:5px;background:#eaf1ff;color:#0052d9;',
    '  font:10px/1 ui-monospace,Menlo,Consolas,monospace;font-style:normal}',
    '#formWin .wl-flow-sec small{font-weight:400;color:#8a94a6;font-size:10.5px}',

    
    '#formWin .wl-flow-redesign .fw-f{display:grid;grid-template-columns:168px minmax(0,1fr);',
    '  grid-template-areas:"l r" "d d";gap:0 14px;align-items:start;',
    '  padding:7px 14px 10px;border-bottom:1px solid #f2f4f7}',
    '#formWin .wl-flow-redesign .fw-f-l{grid-area:l;flex:none;display:flex;',
    '  flex-direction:column;gap:3px;padding-top:3px}',
    '#formWin .wl-flow-redesign .fw-f-l b{font-size:11.5px;color:#20304a;font-weight:600}',
    '#formWin .wl-flow-redesign .fw-f-l code{font-size:10px;color:#8a94a6;background:none;padding:0}',
    '#formWin .wl-flow-redesign .fw-f-r{grid-area:r;display:flex;align-items:center;',
    '  gap:10px;flex-wrap:wrap;min-width:0}',
    '#formWin .wl-flow-redesign .fw-f-r .dtcfg-json{min-height:76px;font-size:11px;line-height:1.65}',
    '#formWin .wl-flow-redesign .fw-f > small{grid-area:d;display:block;margin-top:7px;',
    '  padding:5px 9px;border-left:2px solid #c9d8ee;background:#f8faff;',
    '  font-size:10.5px;line-height:1.6;color:#5b6779;white-space:normal}',

    
    '#formWin .wl-flow-redesign > .fw-hintbar{font-size:10.5px;color:#5b6779;',
    '  line-height:1.65;padding:8px 14px;background:#fcfdff;',
    '  border-top:1px dashed #e5e8ec}',
    '#formWin .wl-flow-redesign > .fw-hintbar code{background:#eef2f8;padding:0 3px;border-radius:2px}',

    
    '#formWin .wl-flow-help{margin:0 14px 13px;border:1px solid #dfe6f2;border-radius:6px;',
    '  background:#fff;overflow:hidden}',
    '#formWin .wl-flow-help > summary{cursor:pointer;padding:8px 12px;font-size:11.5px;',
    '  font-weight:600;color:#1f3a7a;background:#f7f9ff;list-style:none;',
    '  display:flex;align-items:center;gap:8px}',
    '#formWin .wl-flow-help > summary::-webkit-details-marker{display:none}',
    '#formWin .wl-flow-help > summary::before{content:"▸";font-size:10px;color:#0052d9}',
    '#formWin .wl-flow-help[open] > summary::before{content:"▾"}',
    '#formWin .wl-flow-help > summary span{margin-left:auto;font-weight:400;',
    '  font-size:10px;color:#8a94a6}',
    '#formWin .wl-flow-help-bd{padding:10px 12px 12px;font-size:11px;',
    '  line-height:1.7;color:#374151}',
    '#formWin .wl-flow-steps{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 10px}',
    '#formWin .wl-flow-steps span{display:inline-flex;align-items:center;gap:5px;',
    '  padding:4px 8px;border:1px solid #e3ebfa;border-radius:4px;background:#f8faff;',
    '  font-size:10.5px;color:#40506b}',
    '#formWin .wl-flow-steps i{display:inline-flex;align-items:center;justify-content:center;',
    '  width:15px;height:15px;border-radius:50%;background:#0052d9;color:#fff;',
    '  font:9px/1 ui-monospace,Menlo,Consolas,monospace;font-style:normal}',
    '#formWin .wl-flow-help-bd p{margin:6px 0}',
    '#formWin .wl-flow-help-bd b{color:#20304a}',
    '#formWin .wl-flow-tbl{width:100%;border-collapse:collapse;margin:6px 0;font-size:10.5px}',
    '#formWin .wl-flow-tbl th,#formWin .wl-flow-tbl td{border:1px solid #e3ebfa;',
    '  padding:4px 7px;text-align:left;vertical-align:top}',
    '#formWin .wl-flow-tbl th{background:#f3f8ff;color:#1f3a7a;font-weight:600}',
    '#formWin .wl-flow-foot{margin-top:8px;padding-top:7px;border-top:1px dashed #e3ebfa;',
    '  color:#8a94a6;font-size:10px}',

    
    '@media (max-width:1100px){',
    '  #formWin .wl-flow-redesign .fw-f{grid-template-columns:130px minmax(0,1fr)}',
    '  #formWin .wl-flow-chain .tip{margin-left:0;flex-basis:100%}',
    '}'
  ].join('\n');

  
  var ST={ installed:true, version:VER, runs:0, rowsDecorated:0, cardPresent:false,
    tab:'', chain:'', chainState:'', lastError:'' };
  W.__WL_FLOW_HELP__=function(){
    return { installed:ST.installed, version:ST.version, runs:ST.runs,
      rowsDecorated:ST.rowsDecorated, cardPresent:ST.cardPresent, tab:ST.tab,
      chain:ST.chain, chainState:ST.chainState,
      schemaId:(function(){ try{ return (W.TPL&&W.TPL.schema&&W.TPL.schema.id)||''; }catch(e){ return ''; } })(),
      lastError:ST.lastError };
  };
  function injectStyle(){
    if(D.querySelector('style['+STYLE_ATTR+']'))return;
    var s=D.createElement('style'); s.setAttribute(STYLE_ATTR,'1'); s.textContent=CSS;
    (D.head||D.documentElement).appendChild(s);
  }
  function flowCard(right){
    var c=right.querySelector('.fw-card[data-dtcfg-tab="flow"]');
    if(c)return c;
    var all=right.querySelectorAll('.fw-card'), i;
    for(i=0;i<all.length;i++){
      var hd=all[i].querySelector('.fw-card-hd');
      if(hd && /04\s*·\s*键盘流转/.test(hd.textContent||'')) return all[i];
    }
    return null;
  }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  
  function seqOf(){
    try{
      var cfg=(W.TPL&&W.TPL._formConfig)?W.TPL._formConfig():null;
      if(!cfg)return [];
      var secs=cfg.layout&&cfg.layout.sections||[], i, sec=null;
      for(i=0;i<secs.length;i++) if(secs[i].renderer==='editable-table'){ sec=secs[i]; break; }
      if(!sec||!W.DETAIL)return [];
      var s=W.DETAIL.byId(sec.id), F=s?W.DETAIL.flowSpec(s):null;
      return (F&&F.seq)||[];
    }catch(e){ return []; }
  }

  
  function parseChain(txt){
    var N, err='';
    try{ N=JSON.parse(txt||'{}'); }catch(e){ err='JSON 格式错误'; }
    if(!err && (!N || typeof N!=='object' || Object.prototype.toString.call(N)==='[object Array]'))
      err='next 必须是 JSON 对象';
    if(err) return { state:'bad', msg:err, nodes:[], first:'', tail:'', chain:'' };
    var raw={}, keys=Object.keys(N), i;
    for(i=0;i<keys.length;i++) raw[keys[i]]=String(N[keys[i]]==null?'':N[keys[i]]);
    var seq=seqOf(), vals=keys.map(function(k){ return raw[k]; });
    var first='', tail='', j;
    for(j=0;j<keys.length;j++) if(vals.indexOf(keys[j])<0){ first=keys[j]; break; }
    for(j=0;j<vals.length;j++) if(keys.indexOf(vals[j])<0){ tail=vals[j]; break; }
    var nodes=[], seen={}, k=first, guard=0, warn='';
    while(k && !seen[k] && guard++<keys.length+3){ nodes.push(k); seen[k]=1; k=raw[k]||''; }
    if(!nodes.length){
      for(j=0;j<vals.length;j++) if(!seen[vals[j]]){ nodes.push(vals[j]); seen[vals[j]]=1; break; }
    }
    if(!first || !tail) warn='链不完整：请检查键与值是否成对';
    if(seq.length){
      for(j=0;j<keys.length;j++) if(seq.indexOf(keys[j])<0 || seq.indexOf(raw[keys[j]])<0){
        warn='存在不在可编辑列（seq）里的键或目标，已忽略'; break;
      }
    }
    return { state:warn?'warn':'ok', msg:warn||'链正常 · 末列固定换行',
      nodes:nodes, first:first, tail:tail, chain:nodes.join(' → ') };
  }
  function chainHTML(c){
    if(c.state==='bad')
      return '<div class="wl-flow-chain err">⚠ '+esc(c.msg)+
        ' —— 请检查逗号与引号；修正后上方链会实时刷新。</div>';
    var h='', i, n;
    for(i=0;i<c.nodes.length;i++){
      n=c.nodes[i];
      var cls='nd'+(n===c.first?' first':'')+(n===c.tail?' tail':'');
      if(i) h+='<span class="ar">→</span>';
      h+='<span class="'+cls+'">'+esc(n)+'</span>';
    }
    if(!h) h='<span class="nd">（未配置映射）</span>';
    h+='<span class="ar">→</span><span class="nd wrap">↵ 换行 · 回新行首列</span>';
    h+='<span class="lg"><i>● 首列</i><i>● 链中</i><i>● 末列</i></span>';
    h+='<span class="tip '+(c.state==='ok'?'ok':'bad')+'">'+
      (c.state==='ok'?'✓ ':'⚠ ')+esc(c.msg)+'</span>';
    return '<div class="wl-flow-chain">'+h+'</div>';
  }

  function refreshChain(card){
    var box=card.querySelector('[data-wl-flow-chain]');
    var ta=card.querySelector('textarea.dtcfg-json');
    if(!box||!ta)return;
    var c=parseChain(ta.value);
    ST.chain=c.chain; ST.chainState=c.state;
    /* 幂等写入：内容不变就不碰 DOM，避免 MutationObserver 自激占满主线程。 */
    var html=chainHTML(c), s=flowSig(html);
    if(box.getAttribute('data-wl-flow-sig')!==s){
      writing=true;
      try{ box.setAttribute('data-wl-flow-sig',s); box.innerHTML=html; }
      finally{ writing=false; }
    }
    
    if(!ta.getAttribute('data-wl-flow-bind')){
      ta.setAttribute('data-wl-flow-bind','1');
      ta.addEventListener('input',function(){ refreshChain(card); });
    }
  }

  function decorate(card,right){
    card.classList.add('wl-flow-redesign');

    
    var hd=card.querySelector('.fw-card-hd'), em=hd&&hd.querySelector('em');
    if(em && !em.getAttribute('data-wl-flow-hd')){
      em.setAttribute('data-wl-flow-hd','1');
      var seq=seqOf();
      em.textContent='唯一配置 next · 可编辑列 '+(seq.length||'—')+' 个 · 末列固定换行';
    }

    
    var rows=right.querySelectorAll('.fw-f'), i, n=0;
    for(i=0;i<rows.length;i++){
      var row=rows[i];
      if(row.closest('.fw-card')!==card) continue;
      var codeEl=row.querySelector('.fw-f-l code');
      if(!codeEl)continue;
      var key=(codeEl.textContent||'').trim();
      if(!Object.prototype.hasOwnProperty.call(FIELD,key))continue;
      var sm=row.querySelector('.fw-f-l small');
      if(!sm){ sm=D.createElement('small'); row.querySelector('.fw-f-l').appendChild(sm); }
      if(sm.parentNode!==row) row.appendChild(sm);   
      sm.innerHTML=FIELD[key];
      if(!row.previousElementSibling ||
         !row.previousElementSibling.hasAttribute('data-wl-flow-sec')){
        var S=null, j;
        for(j=0;j<SECTIONS.length;j++) if(SECTIONS[j].key===key){ S=SECTIONS[j]; break; }
        if(S){
          var sec=D.createElement('div'); sec.className='wl-flow-sec';
          sec.setAttribute('data-wl-flow-sec',S.no);
          sec.innerHTML='<i>'+S.no+'</i>'+esc(S.title)+'<small>'+esc(S.sub)+'</small>';
          card.insertBefore(sec,row);
        }
      }
      row.setAttribute('data-wl-flow-help','1');
      n++;
    }
    ST.rowsDecorated=n;

    
    if(!card.querySelector('[data-wl-flow-chain]')){
      var box=D.createElement('div'); box.setAttribute('data-wl-flow-chain','1');
      var firstRow=card.querySelector('.wl-flow-sec') || card.querySelector('.fw-f');
      card.insertBefore(box, firstRow||null);
    }

    
    var hb=card.querySelector('.fw-hintbar');
    if(hb && !hb.getAttribute('data-wl-flow-hint')){
      hb.setAttribute('data-wl-flow-hint','1');
      hb.innerHTML='<b>行内</b> = next 映射链顺序；<b>末列</b> = 只作为值出现的列，'+
        '回车固定换行（优先复用下方整行空行，否则新增行）。'+
        '<b>游离列</b>按可编辑列顺序兜底。弹窗确定复用同一套流转，取消留本列。';
    }

    
    if(!card.querySelector('[data-wl-flow-help-card]')){
      var wrap=D.createElement('div'); wrap.innerHTML=CARD;
      var node=wrap.firstElementChild;
      if(node) card.appendChild(node);
    }
    ST.cardPresent=!!card.querySelector('[data-wl-flow-help-card]');
    refreshChain(card);
  }

  function sync(){
    var win=D.getElementById('formWin');
    if(!win || !win.classList.contains('on')){
      ST.tab=''; ST.cardPresent=false; ST.rowsDecorated=0; ST.chain=''; return;
    }
    var right=D.getElementById('fwRight'); if(!right)return;
    var card=flowCard(right);
    if(!card){ ST.tab=''; ST.cardPresent=false; ST.rowsDecorated=0; ST.chain=''; return; }
    ST.runs++;
    ST.tab=right.getAttribute('data-dtcfg-ui')||win.getAttribute('data-dtcfg-ui')||'';
    if(!card.classList.contains('wl-flow-redesign')) decorate(card,right);
    else {
      ST.rowsDecorated=card.querySelectorAll('.fw-f[data-wl-flow-help]').length;
      ST.cardPresent=!!card.querySelector('[data-wl-flow-help-card]');
      refreshChain(card);
    }
  }
  var busy=false, raf=0, mo=null, writing=false;
  /* 内容签名：只在链真的变化时才写 DOM */
  function flowSig(s){ var h=0,i; for(i=0;i<s.length;i++){ h=((h<<5)-h+s.charCodeAt(i))|0; } return s.length+':'+h; }
  function run(){ if(busy)return; busy=true; try{ sync(); }catch(e){ ST.lastError=String(e); } busy=false; }
  function schedule(){
    if(raf)return;
    var tick=function(){ raf=0; if(mo){ try{ mo.takeRecords(); }catch(e){} } run(); };
    raf=W.requestAnimationFrame?W.requestAnimationFrame(tick):W.setTimeout(tick,16);
  }

  injectStyle();
  if(W.MutationObserver){
    try{
      mo=new MutationObserver(function(){ if(!writing) schedule(); });
      mo.observe(D.documentElement,{
        childList:true, subtree:true, attributes:true,
        attributeFilter:['class','data-dtcfg-ui']
      });
    }catch(e){ ST.lastError=String(e); }
  }
  if(D.readyState==='loading') D.addEventListener('DOMContentLoaded',run);
  else run();
  W.setTimeout(run,0);
})();
