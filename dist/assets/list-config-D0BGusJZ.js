const 块 = "列表·配置";
const 段 = [
  "columns",
  "views",
  "filters",
  "toolbarSelects",
  "columnSpec",
  "linkField",
  "emptyText",
  "flowField"
];
function W() {
  return typeof window === "undefined" ? null : window;
}
function 读配置() {
  const w = W();
  const s = w && w.TPL && w.TPL.schema || {};
  const list = s.list || {};
  return {
    块,
    schemaId: s.id || null,
    顶层段: Object.keys(s).length,
    段: 段.map((k) => {
      const v = list[k];
      const 量 = Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : v === void 0 ? null : 1;
      return { k, 存在: Object.prototype.hasOwnProperty.call(list, k), 量 };
    })
  };
}
function 视图存档键() {
  const w = W();
  const id = w && w.TPL && w.TPL.schema && w.TPL.schema.id || null;
  return id ? "TPL_VIEW_CFG_V113:" + id : null;
}
function 读草稿摘要() {
  const w = W();
  if (!w || !w.localStorage) return { 可用: false, 原因: "无 localStorage" };
  try {
    const 键 = 视图存档键();
    const raw = 键 ? w.localStorage.getItem(键) : null;
    return {
      可用: !!键,
      键,
      有存档: !!raw,
      字节: raw ? raw.length : 0,
      口径: "所有改动在草稿里，点「保存并应用」才生效",
      键来源: 'VSTORE + ":" + TPL.schema.id（L3970 / L4031）'
    };
  } catch (e) {
    return { 可用: false, 原因: String(e) };
  }
}
function 标准姿势() {
  return {
    加视图: "S.list.views 追加一项 + vDraft.views 追加，走「＋ 新建视图」与「保存并应用」",
    加列: "S.list.columns 追加一项，类型标记只写 renderer，不动渲染引擎",
    加条件: "v.where.rules / v.filterKeys 追加，候选项由业务字典提供，不写进配置",
    禁止: "不回写 STORE 业务定义源、不定义表单字段、不改桥契约"
  };
}
function 自检() {
  const c = 读配置();
  const 命中 = c.段.filter((x) => x.存在).length;
  const 键 = 视图存档键();
  const d = 读草稿摘要();
  const 项 = [
    { 名: "列表段齐全", 通过: 命中 === 段.length },
    { 名: "顶层段数", 通过: c.顶层段 >= 13 },
    { 名: "草稿键按 schemaId 派生", 通过: !!键 && 键.endsWith(":" + String(c.schemaId)) },
    { 名: "草稿摘要可读", 通过: d.可用 === true }
  ];
  return {
    块,
    通过: 项.every((x) => x.通过),
    项,
    命中段: 命中,
    段: c.段,
    顶层段: c.顶层段,
    schemaId: c.schemaId,
    草稿键: 键,
    草稿摘要: d
  };
}
const __ = { 块, 读配置, 视图存档键, 读草稿摘要, 标准姿势, 自检 };
export {
  __ as default,
  标准姿势,
  自检,
  视图存档键,
  读草稿摘要,
  读配置
};
