const 块 = "重渲染器扩展位";
const 注册表 = /* @__PURE__ */ Object.create(null);
function W() {
  return typeof window === "undefined" ? null : window;
}
function 留痕(k, d) {
  const w = W();
  if (w && w.__MOD__) w.__MOD__.状态.时序.push(Object.assign({ k, 块, at: Date.now() }, d || {}));
}
function 注册(名, 实现) {
  if (!名 || typeof 实现 !== "function") return { ok: false, 原因: "需要名字与函数实现" };
  注册表[名] = 实现;
  留痕("注册", { 名 });
  return { ok: true, 名, 已注册: Object.keys(注册表).length };
}
function 按标记装载(标记) {
  if (!标记) return { ok: false, 原因: "无类型标记，走轻量渲染器" };
  const 实现 = 注册表[标记];
  return 实现 ? { ok: true, 标记, 来源: "扩展位", 实现: typeof 实现 } : { ok: false, 标记, 原因: "未注册，按配置回落为轻量渲染器" };
}
function 已注册渲染器() {
  const w = W(), T = w && w.TPL || {};
  let 基线 = [];
  try {
    基线 = Array.isArray(T._renderers) ? T._renderers.slice() : [];
  } catch (e) {
    基线 = [];
  }
  return { 基线, 基线数: 基线.length, 扩展位: Object.keys(注册表) };
}
function 自检() {
  const r = 已注册渲染器();
  let 登记数 = null;
  try {
    const t = W() && W().TPL || {};
    登记数 = typeof t._b5Registry === "function" ? (t._b5Registry() || []).length : null;
  } catch (e) {
    登记数 = null;
  }
  return {
    块,
    通过: r.基线数 > 0,
    基线数: r.基线数,
    扩展位数: r.扩展位.length,
    自动登记数: 登记数,
    说明: "轻量随配置走、重的进扩展位按需加载"
  };
}
const ______ = { 块, 注册, 按标记装载, 已注册渲染器, 自检 };
export {
  ______ as default,
  已注册渲染器,
  按标记装载,
  注册,
  自检
};
