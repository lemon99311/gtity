// 表单·运行时 · 按需 chunk：form-runtime
// 一个块覆盖 查看 / 编辑 / 新建 / 结果 四类范围；结果页不单独成块、不经过桥。
const 块 = '表单·运行时';
const 覆盖范围 = ['查看', '编辑', '新建', '结果'];
const 契约出口 = ['_collect', '_formOpen', '_formSave', '_formConfig', '_formDraft',
                  '_close', '_closeResult', '_retry', '_save', '_formalPayload'];

function W() { return typeof window === 'undefined' ? null : window; }
function 留痕(k, d) {
  const w = W();
  if (w && w.__MOD__) w.__MOD__.状态.时序.push(Object.assign({ k, 块, at: Date.now() }, d || {}));
}

/** 只读取值汇总：collect → buildPayload → window.__DB_PAYLOAD__ 语义由既有层保留。 */
export function 数据链摘要() {
  const w = W(), T = (w && w.TPL) || {};
  let 值数 = null, 原因 = null;
  try {
    if (typeof T._collect === 'function') {
      const v = T._collect();
      值数 = v && typeof v === 'object' ? Object.keys(v).length : null;
    }
  } catch (e) { 原因 = String(e); }
  return {
    出口: 'collect() → buildPayload() → window.__DB_PAYLOAD__（键来自 S.db.dbMap）',
    演示包键数: w && w.__DB_PAYLOAD__ ? Object.keys(w.__DB_PAYLOAD__).length : 0,
    本次取值数: 值数, 原因,
  };
}

/** 承接侧打开：只按桥给出的标准参数对象动作，不读列表内部状态。 */
export function 打开(mode, params) {
  const w = W(), T = (w && w.TPL) || {};
  if (typeof T._formOpen !== 'function') {
    return { ok: false, 原因: '承接侧未就绪，按 S.pageSpec.fallback 回退为默认抽屉', mode, params };
  }
  try { T._formOpen(); 留痕('打开', { mode, 带参: !!params }); return { ok: true, mode }; }
  catch (e) { return { ok: false, 原因: String(e) }; }
}

/** 结果页路径：保存动作在表单域内闭合，不调用 PAGE.dispatch / ACT.invoke，不单独发请求。 */
export function 结果页路径() {
  const w = W(), T = (w && w.TPL) || {}, R = (w && w.TPL && w.TPL.schema && w.TPL.schema.result) || {};
  return {
    闭合链: 'submit() → finishSubmit() → showResult() / resultHTML()',
    三态: ['loading', 'success', 'fail'],
    配置键数: Object.keys(R).length,
    强制结果: T.forceResult === undefined ? null : T.forceResult,
    经桥: false,
    单独请求: false,
    依据: '04 桥契约第 6 节；源码 L8479–L8520 未调用任何桥入口',
  };
}

export function 自检() {
  const T = (W() && W().TPL) || {};
  const 出口 = 契约出口.filter(k => typeof T[k] === 'function');
  return { 块, 覆盖范围, 结果页单独成块: false, 经桥: false,
           通过: 出口.length >= 6, 出口数: 出口.length, 出口,
           数据链: 数据链摘要(), 结果页: 结果页路径() };
}

export default { 块, 覆盖范围, 数据链摘要, 打开, 结果页路径, 自检 };
留痕('装载完成', { 覆盖范围: 覆盖范围.length });
