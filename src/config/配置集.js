// 配置集 · 静态引入，并入首屏包。
// 红线：不复制、不改写、不重命名任何配置内容；只读既有全局出口，配置仍是唯一业务定义。
const 存储键 = ['TPL_SCHEMA_V113', 'TPL_VIEW_CFG_V113', 'TPL_FORM_CFG_V113:'];

function 取全局() {
  return typeof window === 'undefined' ? null : window;
}

export function 配置集摘要() {
  const W = 取全局();
  if (!W) return { 可用: false, 原因: '非浏览器环境' };
  const T = W.TPL || {};
  let schemaId = null, 顶层段 = 0;
  try {
    const s = T.schema || {};
    schemaId = s.id || null;
    顶层段 = Object.keys(s).length;
  } catch (e) { /* 只读，不抛到对方 */ }
  let 业务集 = [];
  try { 业务集 = (W.__WL_SETS__ && W.__WL_SETS__().keys) || []; } catch (e) { 业务集 = []; }
  const 空壳 = ['tplSchema', 'tplExamples'].map(id => {
    const e = W.document && W.document.getElementById(id);
    return { id, 存在: !!e, 为JSON壳: !!e && e.getAttribute('type') === 'application/json',
             已注入: !!e && String(e.textContent || '').trim().length > 2 };
  });
  return {
    可用: !!T.schema,
    schemaId,
    顶层段,
    空壳,
    业务集,
    存储键,
    配置源: 'window.__TPL_CONFIG__ → 两个空壳 textContent → TPL.schema（唯一业务定义）',
  };
}

export function 校验配置链() {
  const W = 取全局();
  const 项 = [];
  if (!W || !W.document) return { 通过: false, 项: [{ 名: '运行环境', 通过: false }] };
  const D = W.document;
  const 查空壳 = id => {
    const e = D.getElementById(id);
    return !!e && e.getAttribute('type') === 'application/json' &&
           String(e.textContent || '').trim().length > 2;
  };
  项.push({ 名: '__TPL_CONFIG__ 内联配置源', 通过: !!W.__TPL_CONFIG__ });
  项.push({ 名: 'tplSchema 空壳已注入', 通过: 查空壳('tplSchema') });
  项.push({ 名: 'tplExamples 空壳已注入', 通过: 查空壳('tplExamples') });
  项.push({ 名: 'TPL.schema 可读', 通过: !!(W.TPL && W.TPL.schema) });
  项.push({ 名: 'TPL.apply / reset / export', 通过: ['apply', 'reset', 'export']
    .every(k => typeof (W.TPL || {})[k] === 'function') });
  项.push({ 名: 'dbPayload 数据出口', 通过: typeof (W.TPL || {}).dbPayload === 'function' });
  项.push({ 名: '_collect 取值入口', 通过: typeof (W.TPL || {})._collect === 'function' });
  项.push({ 名: '_formalPayload 正式包出口', 通过: typeof (W.TPL || {})._formalPayload === 'function' });
  return { 通过: 项.every(x => x.通过), 项 };
}

export default { 配置集摘要, 校验配置链, 存储键 };
