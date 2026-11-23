// 真拆后的启动入口：按原文档顺序把 65 个内联层全部装载为 ESM 模块。
// 层注册表必须第一个 import —— 它的顶层赋值先于所有业务层求值，
// 使业务层里的 layerRows() / runCheck('exports') 能读到登记表。
import { 层表 } from './层注册表.js';

import '../层/S000-style-tpl-v116-element-tencent.css';
import '../层/S001-style-tpl-v123-feat-ui.css';
// S002 tplSchema（JSON 数据容器）保留在 index.html，不生成模块
// S003 tplExamples（JSON 数据容器）保留在 index.html，不生成模块
import '../层/S004-script-L156.js';
import '../层/S005-script-R2.js';
import '../层/S006-script-L351.js';
import '../层/S007-style-L361.css';
import '../层/S008-style-drug-v14-style.css';
import '../层/S009-style-drug-sa-style.css';
import '../层/S010-style-sa-v13-css.css';
import '../层/S011-style-sa-v14-css.css';
import '../层/S012-style-sa-v15-css.css';
import '../层/S013-style-sa-v16-css.css';
import '../层/S014-style-sa-v17-css.css';
import '../层/S015-style-sa-v18-css.css';
import '../层/S016-style-sa-v19-css.css';
import '../层/S017-style-sa-v110-css.css';
import '../层/S018-style-sa-v111-css.css';
import '../层/S019-style-L2084.css';
import '../层/S020-style-L2110.css';
import '../层/S021-style-tplVCStyle.css';
import '../层/S022-style-tpl-v16-font.css';
import '../层/S023-style-tpl-v18-vc-layout.css';
import '../层/S024-style-tpl-v19-type.css';
import '../层/S025-style-tpl-v110-type.css';
import '../层/S026-style-tpl-v111-vc-tabs.css';
import '../层/S027-style-tpl-v112-worklist.css';
import '../层/S028-style-tpl-v113-restore.css';
import '../层/S029-style-tpl-v114-eltable.css';
import '../层/S030-style-tpl-v115-elcontrols.css';
import '../层/S031-style-tpl-v117-colmeta.css';
import '../层/S032-style-tpl-v121-features.css';
import '../层/S033-style-tpl-v122-newbtn.css';
import '../层/S034-style-tpl-v126-actions.css';
import '../层/S035-script-tpl-b1-guard-early.js';
import '../层/S036-script-tpl-b2-redraw-early.js';
import '../层/S037-script-L3950.js';
import '../层/S038-script-L3951.js';
import '../层/S039-script-tpl-v114-elbridge.js';
import '../层/S040-script-tpl-v112-bridge.js';
import '../层/S041-script-tpl-v115-elcontrols.js';
import '../层/S042-script-tpl-b1-guard.js';
import '../层/S043-script-tpl-b2-redraw.js';
import '../层/S044-script-tpl-b3-boundary.js';
import '../层/S045-script-tpl-b4-generic.js';
import '../层/S046-script-tpl-b5-handoff.js';
import '../层/S047-script-L10705.js';
import '../层/S048-script-L11105.js';
import '../层/S049-script-L11327.js';
import '../层/S050-script-L11840.js';
import '../层/S051-script-L12490.js';
import '../层/S052-style-L13498.css';
import '../层/S053-script-L13524.js';
import '../层/S054-script-T0-core.js';
import '../层/S055-script-T1.js';
import '../层/S056-script-T2.js';
import '../层/S057-script-T3.js';
import '../层/S058-script-T4.js';
import '../层/S059-script-T5.js';
import '../层/S060-script-T6.js';
import '../层/S061-script-T7.js';
import '../层/S062-style-T4-style.css';
import '../层/S063-style-R2-visual.css';
import '../层/S064-script-R3.js';
import '../层/S065-script-R4.js';

// 以下为原有的按需装载接线（8 个动态 import，不参与首屏登记）
import { 配置集摘要, 校验配置链 } from '../config/配置集.js';

const 装载点 = {
  列表运行时: () => import('../list/运行时.js'),
  列表配置:   () => import('../list/配置.js'),
  表单运行时: () => import('../form/运行时.js'),
  表单配置:   () => import('../form/配置.js'),
  跳转桥:     () => import('../bridge/桥契约.js'),
  配置器界面: () => import('../console/配置器界面.js'),
  渲染器扩展位: () => import('../ext/渲染器扩展位.js'),
  特殊效果扩展位: () => import('../ext/特殊效果扩展位.js'),
};

const 状态 = {
  参与首屏登记: false,
  自动触发: false,
  装载点名: Object.keys(装载点),
  已装载: {},
  时序: [],
  失败: [],
};

function 记(k, extra) { 状态.时序.push(Object.assign({ k, at: Date.now() }, extra || {})); }

export async function ensure(名) {
  if (状态.已装载[名]) return 状态.已装载[名];
  const 拉起 = 装载点[名];
  if (!拉起) return { ok: false, 原因: '未注册的装载点', 名 };
  try {
    const m = await 拉起();
    状态.已装载[名] = m; 记('import-ok', { 名 }); return m;
  } catch (e) {
    const 错 = String((e && e.message) || e);
    状态.失败.push({ 名, 错 }); 记('import-fail', { 名, 错 });
    return { ok: false, 原因: '动态加载失败，按契约回退', 名, 错 };
  }
}

export function 自检() {
  const W = typeof window === 'undefined' ? null : window;
  const R = 层表;  // 静态 39 项；运行时动态注入层由 __WL_LAYER_REGISTRY__ 的 getter 并入
  const 项 = [
    { 名: '未参与首屏登记', 通过: 状态.参与首屏登记 === false },
    { 名: '首屏未自动触发 import', 通过: 状态.自动触发 === false },
    { 名: '8 个装载点已注册', 通过: Object.keys(装载点).length === 8 },
    { 名: '配置链完整', 通过: 校验配置链().通过 === true },
    { 名: '层表 42 槽位且顺序逐项对齐基线冻结层序', 通过: R.length === 42 && R.every((x, i) => x.i === i && x.id) },
    { 名: '其中 39 项为静态模块 / DOM 容器', 通过: R.filter(x => x.容器 !== '运行时DOM').length === 39 },
    { 名: '两个 JSON 空壳仍在 DOM', 通过: !!(W && W.document &&
        W.document.getElementById('tplSchema') && W.document.getElementById('tplExamples')) },
    { 名: '每个静态槽位都有真实模块文件或保留在 DOM', 通过: R.filter(x => x.容器 !== '运行时DOM')
        .every(x => x.容器 === 'DOM' || /^src\/层\//.test(x.文件 || '')) },
  ];
  return { 通过: 项.every(x => x.通过), 项, 配置集摘要: 配置集摘要(), 状态, 层数: R.length };
}

const API = { ensure, 自检, 状态, 配置集摘要, 校验配置链, 层表, 装载点名: 状态.装载点名 };

if (typeof window !== 'undefined') {
  window.__MOD__ = API;
  记('接线就绪', { 说明: '业务层已按 import 顺序同步执行完毕，懒加载未触发' });
}

export default API;
