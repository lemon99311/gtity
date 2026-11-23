const 块 = "表单·运行时";
const 覆盖范围 = ["查看", "编辑", "新建", "结果"];
const 契约出口 = [
  "_collect",
  "_formOpen",
  "_formSave",
  "_formConfig",
  "_formDraft",
  "_close",
  "_closeResult",
  "_retry",
  "_save",
  "_formalPayload"
];
function W() {
  return typeof window === "undefined" ? null : window;
}
function 留痕(k, d) {
  const w = W();
  if (w && w.__MOD__) w.__MOD__.状态.时序.push(Object.assign({ k, 块, at: Date.now() }, d || {}));
}
function 数据链摘要() {
  const w = W(), T = w && w.TPL || {};
  let 值数 = null, 原因 = null;
  try {
    if (typeof T._collect === "function") {
      const v = T._collect();
      值数 = v && typeof v === "object" ? Object.keys(v).length : null;
    }
  } catch (e) {
    原因 = String(e);
  }
  return {
    出口: "collect() → buildPayload() → window.__DB_PAYLOAD__（键来自 S.db.dbMap）",
    演示包键数: w && w.__DB_PAYLOAD__ ? Object.keys(w.__DB_PAYLOAD__).length : 0,
    本次取值数: 值数,
    原因
  };
}
function 打开(mode, params) {
  const w = W(), T = w && w.TPL || {};
  if (typeof T._formOpen !== "function") {
    return { ok: false, 原因: "承接侧未就绪，按 S.pageSpec.fallback 回退为默认抽屉", mode, params };
  }
  try {
    T._formOpen();
    留痕("打开", { mode, 带参: !!params });
    return { ok: true, mode };
  } catch (e) {
    return { ok: false, 原因: String(e) };
  }
}
function 结果页路径() {
  const w = W(), T = w && w.TPL || {}, R = w && w.TPL && w.TPL.schema && w.TPL.schema.result || {};
  return {
    闭合链: "submit() → finishSubmit() → showResult() / resultHTML()",
    三态: ["loading", "success", "fail"],
    配置键数: Object.keys(R).length,
    强制结果: T.forceResult === void 0 ? null : T.forceResult,
    经桥: false,
    单独请求: false,
    依据: "04 桥契约第 6 节；源码 L8479–L8520 未调用任何桥入口"
  };
}
function 自检() {
  const T = W() && W().TPL || {};
  const 出口 = 契约出口.filter((k) => typeof T[k] === "function");
  return {
    块,
    覆盖范围,
    结果页单独成块: false,
    经桥: false,
    通过: 出口.length >= 6,
    出口数: 出口.length,
    出口,
    数据链: 数据链摘要(),
    结果页: 结果页路径()
  };
}
const ___ = { 块, 覆盖范围, 数据链摘要, 打开, 结果页路径, 自检 };
留痕("装载完成", { 覆盖范围: 覆盖范围.length });
export {
  ___ as default,
  打开,
  数据链摘要,
  结果页路径,
  自检
};
