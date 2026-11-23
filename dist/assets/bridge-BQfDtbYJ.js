const 块 = "跳转桥";
const 占位 = ["{value}", "{code}", "{param}", "{field}", "{col}", "{scene}", "{idx}", "{title}"];
const 四态 = ["ok", "missing", "disabled", "methodMissing"];
function W() {
  return typeof window === "undefined" ? null : window;
}
function 留痕(k, d) {
  const w = W();
  if (w && w.__MOD__) w.__MOD__.状态.时序.push(Object.assign({ k, 块, at: Date.now() }, d || {}));
}
function 校验入参(ctx) {
  const c = ctx || {};
  const 必备 = ["scene", "value", "field", "col"];
  return {
    通过: 必备.every((k) => c[k] !== void 0),
    必备,
    收到: Object.keys(c),
    说明: "新增信息一律追加可选键，不改既有键语义"
  };
}
function resolve(scene) {
  const P = W() && W().PAGE || {};
  if (typeof P.resolve !== "function") return { 状态: "承接侧未就绪", 回退: "drawer" };
  try {
    return { 状态: (P.resolve(scene) || {}).status || "unknown" };
  } catch (e) {
    return { 状态: "methodMissing", 回退: "none", 原因: String(e) };
  }
}
function interpolate(tpl, ctx) {
  const w = W(), T = w && w.TPL || {}, P = w && w.PAGE || {};
  const f = typeof T._pageInterpolate === "function" ? T._pageInterpolate : typeof P.interpolate === "function" ? P.interpolate : null;
  if (!f) return { ok: false, 原因: "占位插值出口未注册", tpl };
  try {
    return { ok: true, 结果: f(tpl, ctx || {}) };
  } catch (e) {
    return { ok: false, 原因: String(e) };
  }
}
function dispatch(ctx) {
  const c = ctx || {};
  const 校验 = 校验入参(c);
  const P = W() && W().PAGE || {};
  if (typeof P.dispatch !== "function") {
    留痕("dispatch-回退", { 原因: "PAGE.dispatch 未注册" });
    return { ok: false, 回退: "drawer", 原因: "桥/承接侧未就绪", 经桥: true, 校验 };
  }
  try {
    const 决议 = P.dispatch(c.scene, c);
    留痕("dispatch", { scene: c.scene, resolution: 决议 && 决议.resolution });
    return { ok: true, 决议, 经桥: true, 结果页经桥: false, 校验 };
  } catch (e) {
    return { ok: false, 回退: "drawer", 原因: String(e), 经桥: true };
  }
}
function 回退规则() {
  const s = W() && W().TPL && W().TPL.schema && W().TPL.schema.pageSpec || {};
  return s.fallback || { missing: "drawer", disabled: "drawer", methodMissing: "none" };
}
function 自检() {
  const w = W(), P = w && w.PAGE || {}, T = w && w.TPL || {};
  return {
    块,
    不私有: true,
    经桥结果页: false,
    通过: typeof P.dispatch === "function" && typeof P.resolve === "function",
    四态,
    占位,
    方法表数: typeof P.methods === "function" ? (P.methods() || []).length : null,
    场景表数: typeof P.scenes === "function" ? (P.scenes() || []).length : null,
    回退规则: 回退规则(),
    动作出口: typeof (w && w.ACT && w.ACT.invoke) === "function",
    插值出口: typeof T._pageInterpolate === "function"
  };
}
const ___ = { 块, 校验入参, resolve, interpolate, dispatch, 回退规则, 自检 };
export {
  ___ as default,
  dispatch,
  interpolate,
  resolve,
  回退规则,
  校验入参,
  自检
};
