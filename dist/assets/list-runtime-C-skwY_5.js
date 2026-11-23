const 块 = "列表·运行时";
const 契约出口 = [
  "_cell",
  "_columnDefs",
  "_snapshot",
  "_redrawReady",
  "_view",
  "_kw",
  "_page",
  "_sort",
  "_size",
  "_toolbar",
  "_renderers"
];
function W() {
  return typeof window === "undefined" ? null : window;
}
function 留痕(k, d) {
  const w = W();
  if (w && w.__MOD__) w.__MOD__.状态.时序.push(Object.assign({ k, 块, at: Date.now() }, d || {}));
}
function 可用出口() {
  const T = W() && W().TPL || {};
  return 契约出口.filter((k) => typeof T[k] === "function");
}
function 读生效列(view) {
  const w = W();
  if (!w || !w.VC || typeof w.VC.cols !== "function") {
    return { ok: false, 原因: "VC.cols 未注册（承接侧未就绪）", 列: [] };
  }
  try {
    return { ok: true, 列: w.VC.cols(view) };
  } catch (e) {
    return { ok: false, 原因: String(e), 列: [] };
  }
}
function 切换视图(id) {
  const T = W() && W().TPL || {};
  if (typeof T._view !== "function") return { ok: false, 原因: "_view 未注册，按契约回退为不切换" };
  try {
    T._view(id);
    留痕("切换视图", { id });
    return { ok: true, id };
  } catch (e) {
    return { ok: false, 原因: String(e) };
  }
}
function 触发列点击(ctx) {
  const w = W();
  const 桥 = w && w.__MOD__ && w.__MOD__.状态.已装载["跳转桥"];
  if (!桥 || typeof 桥.dispatch !== "function") {
    return { ok: false, 原因: '桥尚未装载，先 ensure("跳转桥") 再交接', ctx };
  }
  return 桥.dispatch(ctx);
}
function 双路径状态() {
  const w = W();
  return { 增强可用: !!(w && w.__WL_HAS_EL__), 回落路径: !!(w && !w.__WL_HAS_EL__) };
}
function 自检() {
  const 出口 = 可用出口();
  return {
    块,
    通过: 出口.length >= 6,
    出口数: 出口.length,
    出口,
    双路径: 双路径状态(),
    说明: "按标记调用既有全局出口，不改写既有层"
  };
}
const ___ = { 块, 读生效列, 切换视图, 触发列点击, 双路径状态, 自检 };
留痕("装载完成", { 出口数: 可用出口().length });
export {
  ___ as default,
  切换视图,
  双路径状态,
  自检,
  触发列点击,
  读生效列
};
