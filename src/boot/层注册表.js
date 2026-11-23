// 首屏防闪烁兜底（dev 模式专用，不改变正常渲染）：
// Vite dev 的 CSS 由 JS 模块异步注入 <style>，HTML 会先绘制一次无样式画面；
// 内联 SVG 没有尺寸时会撑满父容器（实测 1424×1424），出现巨大黑色 logo 一闪。
// 本模块是启动入口第一个 import，顶层同步注入一条 @layer 规则；layer 内规则
// 优先级低于所有业务 CSS（unlayered），所以正常渲染时尺寸仍完全由原 CSS 决定。
if (typeof window !== 'undefined' && window.document && window.document.head) {
  const 兜底 = window.document.createElement('style');
  兜底.textContent = '@layer fouc-guard{svg:not([width]):not([height]){width:16px;height:16px}}';
  window.document.head.appendChild(兜底);
}

// 层登记注册表（真拆后新增）：替代 layerRows() 的 DOM 扫描。
// 42 个槽位逐项对齐基线页 TPL._layers() 的冻结快照顺序：
//   39 项静态层 → 真实 src/层/ 模块（或保留在 index.html 的 JSON 空壳）
//    3 项运行时注入 style → 插在中间（index 31–33），仅在 DOM 中真实存在时纳入
// 冻结时刻（b5 层 L10248）这 3 项已注入，因此 LAYERS 仍是 42 项且与基线逐项一致；
// 之后注入的 b6–b9 由 取层() 追加到末尾，与基线页「head 末尾追加」的 DOM 顺序一致。
export const 层表 = [
  {
    "i": 0,
    "tag": "style",
    "id": "tpl-v116-element-tencent",
    "起行": 16,
    "文件": "src/层/S000-style-tpl-v116-element-tencent.css",
    "容器": "ESM"
  },
  {
    "i": 1,
    "tag": "style",
    "id": "tpl-v123-feat-ui",
    "起行": 19,
    "文件": "src/层/S001-style-tpl-v123-feat-ui.css",
    "容器": "ESM"
  },
  {
    "i": 2,
    "tag": "script",
    "id": "tplSchema",
    "起行": 154,
    "文件": "index.html#tplSchema",
    "容器": "DOM"
  },
  {
    "i": 3,
    "tag": "script",
    "id": "tplExamples",
    "起行": 155,
    "文件": "index.html#tplExamples",
    "容器": "DOM"
  },
  {
    "i": 4,
    "tag": "style",
    "id": "drug-v14-style",
    "起行": 1414,
    "文件": "src/层/S008-style-drug-v14-style.css",
    "容器": "ESM"
  },
  {
    "i": 5,
    "tag": "style",
    "id": "drug-sa-style",
    "起行": 1604,
    "文件": "src/层/S009-style-drug-sa-style.css",
    "容器": "ESM"
  },
  {
    "i": 6,
    "tag": "style",
    "id": "sa-v13-css",
    "起行": 1812,
    "文件": "src/层/S010-style-sa-v13-css.css",
    "容器": "ESM"
  },
  {
    "i": 7,
    "tag": "style",
    "id": "sa-v14-css",
    "起行": 1823,
    "文件": "src/层/S011-style-sa-v14-css.css",
    "容器": "ESM"
  },
  {
    "i": 8,
    "tag": "style",
    "id": "sa-v15-css",
    "起行": 1885,
    "文件": "src/层/S012-style-sa-v15-css.css",
    "容器": "ESM"
  },
  {
    "i": 9,
    "tag": "style",
    "id": "sa-v16-css",
    "起行": 1901,
    "文件": "src/层/S013-style-sa-v16-css.css",
    "容器": "ESM"
  },
  {
    "i": 10,
    "tag": "style",
    "id": "sa-v17-css",
    "起行": 1931,
    "文件": "src/层/S014-style-sa-v17-css.css",
    "容器": "ESM"
  },
  {
    "i": 11,
    "tag": "style",
    "id": "sa-v18-css",
    "起行": 1986,
    "文件": "src/层/S015-style-sa-v18-css.css",
    "容器": "ESM"
  },
  {
    "i": 12,
    "tag": "style",
    "id": "sa-v19-css",
    "起行": 2014,
    "文件": "src/层/S016-style-sa-v19-css.css",
    "容器": "ESM"
  },
  {
    "i": 13,
    "tag": "style",
    "id": "sa-v110-css",
    "起行": 2030,
    "文件": "src/层/S017-style-sa-v110-css.css",
    "容器": "ESM"
  },
  {
    "i": 14,
    "tag": "style",
    "id": "sa-v111-css",
    "起行": 2071,
    "文件": "src/层/S018-style-sa-v111-css.css",
    "容器": "ESM"
  },
  {
    "i": 15,
    "tag": "style",
    "id": "tplVCStyle",
    "起行": 2129,
    "文件": "src/层/S021-style-tplVCStyle.css",
    "容器": "ESM"
  },
  {
    "i": 16,
    "tag": "style",
    "id": "tpl-v16-font",
    "起行": 2281,
    "文件": "src/层/S022-style-tpl-v16-font.css",
    "容器": "ESM"
  },
  {
    "i": 17,
    "tag": "style",
    "id": "tpl-v18-vc-layout",
    "起行": 2355,
    "文件": "src/层/S023-style-tpl-v18-vc-layout.css",
    "容器": "ESM"
  },
  {
    "i": 18,
    "tag": "style",
    "id": "tpl-v19-type",
    "起行": 2408,
    "文件": "src/层/S024-style-tpl-v19-type.css",
    "容器": "ESM"
  },
  {
    "i": 19,
    "tag": "style",
    "id": "tpl-v110-type",
    "起行": 2470,
    "文件": "src/层/S025-style-tpl-v110-type.css",
    "容器": "ESM"
  },
  {
    "i": 20,
    "tag": "style",
    "id": "tpl-v111-vc-tabs",
    "起行": 2571,
    "文件": "src/层/S026-style-tpl-v111-vc-tabs.css",
    "容器": "ESM"
  },
  {
    "i": 21,
    "tag": "style",
    "id": "tpl-v112-worklist",
    "起行": 2596,
    "文件": "src/层/S027-style-tpl-v112-worklist.css",
    "容器": "ESM"
  },
  {
    "i": 22,
    "tag": "style",
    "id": "tpl-v113-restore",
    "起行": 2834,
    "文件": "src/层/S028-style-tpl-v113-restore.css",
    "容器": "ESM"
  },
  {
    "i": 23,
    "tag": "style",
    "id": "tpl-v114-eltable",
    "起行": 3079,
    "文件": "src/层/S029-style-tpl-v114-eltable.css",
    "容器": "ESM"
  },
  {
    "i": 24,
    "tag": "style",
    "id": "tpl-v115-elcontrols",
    "起行": 8984,
    "文件": "src/层/S041-script-tpl-v115-elcontrols.js",
    "容器": "ESM"
  },
  {
    "i": 25,
    "tag": "style",
    "id": "tpl-v117-colmeta",
    "起行": 3307,
    "文件": "src/层/S031-style-tpl-v117-colmeta.css",
    "容器": "ESM"
  },
  {
    "i": 26,
    "tag": "style",
    "id": "tpl-v121-features",
    "起行": 3491,
    "文件": "src/层/S032-style-tpl-v121-features.css",
    "容器": "ESM"
  },
  {
    "i": 27,
    "tag": "style",
    "id": "tpl-v122-newbtn",
    "起行": 3576,
    "文件": "src/层/S033-style-tpl-v122-newbtn.css",
    "容器": "ESM"
  },
  {
    "i": 28,
    "tag": "style",
    "id": "tpl-v126-actions",
    "起行": 3622,
    "文件": "src/层/S034-style-tpl-v126-actions.css",
    "容器": "ESM"
  },
  {
    "i": 29,
    "tag": "script",
    "id": "tpl-b1-guard-early",
    "起行": 3778,
    "文件": "src/层/S035-script-tpl-b1-guard-early.js",
    "容器": "ESM"
  },
  {
    "i": 30,
    "tag": "script",
    "id": "tpl-b2-redraw-early",
    "起行": 3874,
    "文件": "src/层/S036-script-tpl-b2-redraw-early.js",
    "容器": "ESM"
  },
  {
    "i": 31,
    "tag": "style",
    "id": "tplFormVars",
    "起行": null,
    "文件": null,
    "容器": "运行时DOM"
  },
  {
    "i": 32,
    "tag": "style",
    "id": "tplDetailTableStyle",
    "起行": null,
    "文件": null,
    "容器": "运行时DOM"
  },
  {
    "i": 33,
    "tag": "style",
    "id": "tpl-v121-density",
    "起行": null,
    "文件": null,
    "容器": "运行时DOM"
  },
  {
    "i": 34,
    "tag": "script",
    "id": "tpl-v114-elbridge",
    "起行": 8752,
    "文件": "src/层/S039-script-tpl-v114-elbridge.js",
    "容器": "ESM"
  },
  {
    "i": 35,
    "tag": "script",
    "id": "tpl-v112-bridge",
    "起行": 8856,
    "文件": "src/层/S040-script-tpl-v112-bridge.js",
    "容器": "ESM"
  },
  {
    "i": 36,
    "tag": "script",
    "id": "tpl-v115-elcontrols",
    "起行": 8984,
    "文件": "src/层/S041-script-tpl-v115-elcontrols.js",
    "容器": "ESM"
  },
  {
    "i": 37,
    "tag": "script",
    "id": "tpl-b1-guard",
    "起行": 9224,
    "文件": "src/层/S042-script-tpl-b1-guard.js",
    "容器": "ESM"
  },
  {
    "i": 38,
    "tag": "script",
    "id": "tpl-b2-redraw",
    "起行": 9302,
    "文件": "src/层/S043-script-tpl-b2-redraw.js",
    "容器": "ESM"
  },
  {
    "i": 39,
    "tag": "script",
    "id": "tpl-b3-boundary",
    "起行": 9524,
    "文件": "src/层/S044-script-tpl-b3-boundary.js",
    "容器": "ESM"
  },
  {
    "i": 40,
    "tag": "script",
    "id": "tpl-b4-generic",
    "起行": 9905,
    "文件": "src/层/S045-script-tpl-b4-generic.js",
    "容器": "ESM"
  },
  {
    "i": 41,
    "tag": "script",
    "id": "tpl-b5-handoff",
    "起行": 10216,
    "文件": "src/层/S046-script-tpl-b5-handoff.js",
    "容器": "ESM"
  }
];

function 取层() {
  if (typeof window === 'undefined' || !window.document) return 层表.filter(x => x.容器 !== '运行时DOM');
  const dom = {};
  window.document.querySelectorAll('style[id],script[id]').forEach(e => {
    if (e.id) dom[e.id] = e.tagName.toLowerCase();
  });
  const out = [], seen = {};
  层表.forEach(x => {
    if (x.容器 === '运行时DOM' && !dom[x.id]) return;   // 尚未注入则不占位
    seen[x.id] = 1;
    out.push({ i: out.length, tag: x.tag, id: x.id, 起行: x.起行, 文件: x.文件, 容器: x.容器 });
  });
  Object.keys(dom).forEach(id => {
    if (!seen[id]) out.push({ i: out.length, tag: dom[id], id: id, 起行: null,
                              文件: null, 容器: '运行时DOM' });
  });
  return out;
}

if (typeof window !== 'undefined') {
  // 用 getter：运行时动态层在读取时才并入；冻结基线时刻的顺序仍由 42 槽位保证。
  Object.defineProperty(window, '__WL_LAYER_REGISTRY__', {
    configurable: true,
    get: 取层,
  });
  window.__WL_LAYER_REGISTRY_META__ = {
    槽位数: 层表.length,
    静态层: 层表.filter(x => x.容器 !== '运行时DOM').length,
    运行时槽位: 层表.filter(x => x.容器 === '运行时DOM').map(x => x.id),
    口径: '42 槽位对齐基线冻结层序；静态层走模块图登记，运行时层按 DOM 实况纳入',
  };
}

export default 层表;
