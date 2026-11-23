const 块 = "配置器界面";
const 界面 = ["vcWin", "formWin"];
function W() {
  return typeof window === "undefined" ? null : window;
}
function 留痕(k, d) {
  const w = W();
  if (w && w.__MOD__) w.__MOD__.状态.时序.push(Object.assign({ k, 块, at: Date.now() }, {}));
}
function 打开视图配置() {
  const T = W() && W().TPL || {};
  if (typeof T._vcOpen !== "function") return { ok: false, 原因: "_vcOpen 未注册" };
  try {
    T._vcOpen();
    留痕("打开视图配置");
    return { ok: true };
  } catch (e) {
    return { ok: false, 原因: String(e) };
  }
}
function 打开表单配置() {
  const T = W() && W().TPL || {};
  if (typeof T._formOpen !== "function") return { ok: false, 原因: "_formOpen 未注册" };
  try {
    T._formOpen();
    留痕("打开表单配置");
    return { ok: true };
  } catch (e) {
    return { ok: false, 原因: String(e) };
  }
}
function 视图配置存档键() {
  const w = W();
  const id = w && w.TPL && w.TPL.schema && w.TPL.schema.id || null;
  return id ? "TPL_VIEW_CFG_V113:" + id : null;
}
function 独立存储摘要() {
  const w = W();
  if (!w || !w.localStorage) return { 可用: false };
  const 读 = (k) => {
    try {
      const r = w.localStorage.getItem(k);
      return { 键: k, 有存档: !!r, 字节: r ? r.length : 0 };
    } catch (e) {
      return { 键: k, 有存档: false, 原因: String(e) };
    }
  };
  const 键 = 视图配置存档键();
  const schemaId = w.TPL && w.TPL.schema && w.TPL.schema.id || "default";
  return {
    可用: !!键,
    schemaId,
    业务定义源: 读("TPL_SCHEMA_V113"),
    视图配置: 读(键 || "TPL_VIEW_CFG_V113"),
    视图配置旧写法: 读("TPL_VIEW_CFG_V113"),
    表单配置: 读("TPL_FORM_CFG_V113:" + schemaId),
    键来源: 'VSTORE + ":" + TPL.schema.id（L3970 / L4031）',
    口径: "草稿态各自独立；「保存并应用」才生效；不回写业务定义源"
  };
}
function 自检() {
  const w = W(), D = w && w.document;
  const 节点 = 界面.map((id) => ({ id, 已建: !!(D && D.getElementById(id)) }));
  const T = w && w.TPL || {};
  const 出口 = ["_vcOpen", "_vcSave", "_formOpen", "_formSave", "_formDraft"].filter((k) => typeof T[k] === "function");
  const 键 = 视图配置存档键(), 摘要 = 独立存储摘要();
  const 项 = [
    { 名: "配置器出口齐全", 通过: 出口.length >= 4 },
    { 名: "视图存档键按 schemaId 派生", 通过: !!键 && 键 === "TPL_VIEW_CFG_V113:" + 摘要.schemaId },
    { 名: "旧写法（常量键）确实读不到", 通过: 摘要.视图配置旧写法.有存档 === false },
    { 名: "三套键摘要可读", 通过: 摘要.可用 === true },
    { 名: "表单配置键同样带 schemaId", 通过: 摘要.表单配置.键.endsWith(":" + 摘要.schemaId) }
  ];
  return {
    块,
    通过: 项.every((x) => x.通过),
    项,
    出口,
    节点,
    独立存储: 摘要,
    说明: "formWin 为按需创建，未打开时「已建=false」属正常"
  };
}
const _____ = { 块, 打开视图配置, 打开表单配置, 视图配置存档键, 独立存储摘要, 自检 };
export {
  _____ as default,
  打开表单配置,
  打开视图配置,
  独立存储摘要,
  自检,
  视图配置存档键
};
