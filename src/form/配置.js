// 表单·配置 · 按需 chunk：form-config
// 与列表配置各自独立存储；字段名照抄源文件，不改不新增。
const 块 = '表单·配置';
const 表单段 = ['storeKey', 'layoutKinds', 'densities', 'labelPositions', 'renderers', 'controls',
                'footerActions', 'detailControls', 'detailDefaults', 'lookupSources', 'mockApis',
                'formulaFns', 'detailPreset', 'flowHints'];
const 结果键 = ['okTitle', 'failTitle', 'pendingTitle', 'okMsg', 'failMsg', 'pendingMsg',
                'note', 'okFoot', 'failFoot', 'okBtn', 'backBtn', 'retryBtn'];

function W() { return typeof window === 'undefined' ? null : window; }

export function 读配置() {
  const w = W();
  const s = (w && w.TPL && w.TPL.schema) || {};
  const f = s.formSpec || {}, r = s.result || {}, d = s.detail || {}, db = s.db || {};
  return {
    块,
    schemaId: s.id || null,
    表单段: 表单段.map(k => ({ k, 存在: Object.prototype.hasOwnProperty.call(f, k) })),
    表单段数: Object.keys(f).length,
    结果键: 结果键.map(k => ({ k, 存在: Object.prototype.hasOwnProperty.call(r, k) })),
    结果键数: Object.keys(r).length,
    字段组数: (d.groups || []).length,
    映射键数: Object.keys(db.dbMap || {}).length,
    值规则数: Object.keys(db.valueRules || {}).length,
    独立存储键: 'TPL_FORM_CFG_V113:' + (s.id || 'default'),
  };
}

/** 只读独立存储摘要，不写回。 */
export function 读草稿摘要() {
  const w = W();
  if (!w || !w.localStorage) return { 可用: false };
  try {
    const k = 'TPL_FORM_CFG_V113:' + ((w.TPL && w.TPL.schema && w.TPL.schema.id) || 'default');
    const raw = w.localStorage.getItem(k);
    return { 可用: true, 键: k, 有存档: !!raw, 字节: raw ? raw.length : 0,
             口径: '抽屉渲染引擎 · 独立存储；「保存并应用」才生效' };
  } catch (e) { return { 可用: false, 原因: String(e) }; }
}

export function 标准姿势() {
  return {
    加字段: 'S.detail.groups 追加字段，控件类型走 S.formSpec.controls',
    加区块: 'fDraft.layout.sections 追加，走「＋ 添加区块」与 _formSave',
    改反馈: '只改 S.result 的 12 键，不动桥、不动列表运行时',
    重渲染器: '配置里只留 renderer 类型标记，实现进扩展位',
    禁止: '不定义列表列、不改桥契约、不回写 STORE 业务定义源',
  };
}

export function 自检() {
  const c = 读配置();
  return {
    块,
    通过: c.表单段.every(x => x.存在) && c.结果键.every(x => x.存在) && c.映射键数 >= 60,
    表单段数: c.表单段数, 结果键数: c.结果键数,
    字段组数: c.字段组数, 映射键数: c.映射键数, 独立存储键: c.独立存储键,
  };
}

export default { 块, 读配置, 读草稿摘要, 标准姿势, 自检 };
