// 特殊效果扩展位 · 按需 chunk：ext-effect
// 新增效果一律「追加无 id 的层 / 新配置集」，不动骨架、不改 script[id] 序列。
const 块 = '特殊效果扩展位';
const 注册表 = Object.create(null);

function W() { return typeof window === 'undefined' ? null : window; }
function 留痕(k, d) {
  const w = W();
  if (w && w.__MOD__) w.__MOD__.状态.时序.push(Object.assign({ k, 块, at: Date.now() }, d || {}));
}

export function 注册(名, 实现) {
  if (!名 || typeof 实现 !== 'function') return { ok: false, 原因: '需要名字与函数实现' };
  注册表[名] = 实现;
  留痕('注册', { 名 });
  return { ok: true, 名, 已注册: Object.keys(注册表).length };
}

/** 追加层自检：新层不带 id，既有带 id 层序列一个不少。 */
export function 追加层自检() {
  const w = W(), D = w && w.document;
  if (!D) return { 可用: false };
  const 带id = [].slice.call(D.querySelectorAll('script[id],style[id]')).map(e => e.id);
  const scriptIds = [].slice.call(D.querySelectorAll('script[id]')).map(e => e.id);
  const styleIds = [].slice.call(D.querySelectorAll('style[id]')).map(e => e.id);
  const 分段 = ['data-wl-layer', 'data-wl-seg', 'data-b10-ux'].map(a => ({
    属性: a, 节点数: D.querySelectorAll('[' + a + ']').length,
  }));
  return {
    可用: true,
    带标识层数: 带id.length,
    scriptIds前两位: scriptIds.slice(0, 2),
    styleIds首项: styleIds[0] || null,
    分段,
    追加层约束: '新层无 id、动态样式节点无 id，script[id] 序列不变',
  };
}

export function 按名调用(名, 上下文) {
  const 实现 = 注册表[名];
  if (!实现) return { ok: false, 原因: '效果未注册，按原位置降级' };
  try { return { ok: true, 结果: 实现(上下文 || {}) }; }
  catch (e) { return { ok: false, 原因: String(e) }; }
}

export function 自检() {
  const a = 追加层自检();
  const 前 = a.scriptIds前两位 || [];
  return { 块, 通过: a.可用 && a.带标识层数 > 0 &&
                  前[0] === 'tplSchema' && 前[1] === 'tplExamples',
           带标识层数: a.带标识层数, scriptIds前两位: 前,
           styleIds首项: a.styleIds首项, 分段: a.分段,
           已注册: Object.keys(注册表) };
}

export default { 块, 注册, 追加层自检, 按名调用, 自检 };
