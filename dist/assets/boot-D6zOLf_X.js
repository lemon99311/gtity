import { 层 as __ } from "./layer-a-early-Bc1CzZxH.js";
import "./layer-b-core-D9bmgxGI.js";
import "./layer-c-bridge-CvPs-jcH.js";
import "./layer-d-ui-BgeDuIP_.js";
import "./layer-e-tail-BxBhaeDE.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled = function(promises$2) {
      return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled(deps.map((dep) => {
      dep = assetsURL(dep, importerUrl);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (!!importerUrl) for (let i$1 = links.length - 1; i$1 >= 0; i$1--) {
        const link$1 = links[i$1];
        if (link$1.href === dep && (!isCss || link$1.rel === "stylesheet")) return;
      }
      else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
const 存储键 = ["TPL_SCHEMA_V113", "TPL_VIEW_CFG_V113", "TPL_FORM_CFG_V113:"];
function 取全局() {
  return typeof window === "undefined" ? null : window;
}
function 配置集摘要() {
  const W = 取全局();
  if (!W) return { 可用: false, 原因: "非浏览器环境" };
  const T = W.TPL || {};
  let schemaId = null, 顶层段 = 0;
  try {
    const s = T.schema || {};
    schemaId = s.id || null;
    顶层段 = Object.keys(s).length;
  } catch (e) {
  }
  let 业务集 = [];
  try {
    业务集 = W.__WL_SETS__ && W.__WL_SETS__().keys || [];
  } catch (e) {
    业务集 = [];
  }
  const 空壳 = ["tplSchema", "tplExamples"].map((id) => {
    const e = W.document && W.document.getElementById(id);
    return {
      id,
      存在: !!e,
      为JSON壳: !!e && e.getAttribute("type") === "application/json",
      已注入: !!e && String(e.textContent || "").trim().length > 2
    };
  });
  return {
    可用: !!T.schema,
    schemaId,
    顶层段,
    空壳,
    业务集,
    存储键,
    配置源: "window.__TPL_CONFIG__ → 两个空壳 textContent → TPL.schema（唯一业务定义）"
  };
}
function 校验配置链() {
  const W = 取全局();
  const 项 = [];
  if (!W || !W.document) return { 通过: false, 项: [{ 名: "运行环境", 通过: false }] };
  const D = W.document;
  const 查空壳 = (id) => {
    const e = D.getElementById(id);
    return !!e && e.getAttribute("type") === "application/json" && String(e.textContent || "").trim().length > 2;
  };
  项.push({ 名: "__TPL_CONFIG__ 内联配置源", 通过: !!W.__TPL_CONFIG__ });
  项.push({ 名: "tplSchema 空壳已注入", 通过: 查空壳("tplSchema") });
  项.push({ 名: "tplExamples 空壳已注入", 通过: 查空壳("tplExamples") });
  项.push({ 名: "TPL.schema 可读", 通过: !!(W.TPL && W.TPL.schema) });
  项.push({ 名: "TPL.apply / reset / export", 通过: ["apply", "reset", "export"].every((k) => typeof (W.TPL || {})[k] === "function") });
  项.push({ 名: "dbPayload 数据出口", 通过: typeof (W.TPL || {}).dbPayload === "function" });
  项.push({ 名: "_collect 取值入口", 通过: typeof (W.TPL || {})._collect === "function" });
  项.push({ 名: "_formalPayload 正式包出口", 通过: typeof (W.TPL || {})._formalPayload === "function" });
  return { 通过: 项.every((x) => x.通过), 项 };
}
const 装载点 = {
  列表运行时: () => __vitePreload(() => import("./list-runtime-C-skwY_5.js"), true ? [] : void 0, import.meta.url),
  列表配置: () => __vitePreload(() => import("./list-config-D0BGusJZ.js"), true ? [] : void 0, import.meta.url),
  表单运行时: () => __vitePreload(() => import("./form-runtime-JmaxwuJG.js"), true ? [] : void 0, import.meta.url),
  表单配置: () => __vitePreload(() => import("./form-config-CzAxlLes.js"), true ? [] : void 0, import.meta.url),
  跳转桥: () => __vitePreload(() => import("./bridge-BQfDtbYJ.js"), true ? [] : void 0, import.meta.url),
  配置器界面: () => __vitePreload(() => import("./console-DSaTCF8q.js"), true ? [] : void 0, import.meta.url),
  渲染器扩展位: () => __vitePreload(() => import("./ext-renderer-DUqN10Fr.js"), true ? [] : void 0, import.meta.url),
  特殊效果扩展位: () => __vitePreload(() => import("./ext-effect-COVPXgTH.js"), true ? [] : void 0, import.meta.url)
};
const 状态 = {
  参与首屏登记: false,
  自动触发: false,
  装载点名: Object.keys(装载点),
  已装载: {},
  时序: [],
  失败: []
};
function 记(k, extra) {
  状态.时序.push(Object.assign({ k, at: Date.now() }, extra || {}));
}
async function ensure(名) {
  if (状态.已装载[名]) return 状态.已装载[名];
  const 拉起 = 装载点[名];
  if (!拉起) return { ok: false, 原因: "未注册的装载点", 名 };
  try {
    const m = await 拉起();
    状态.已装载[名] = m;
    记("import-ok", { 名 });
    return m;
  } catch (e) {
    const 错 = String(e && e.message || e);
    状态.失败.push({ 名, 错 });
    记("import-fail", { 名, 错 });
    return { ok: false, 原因: "动态加载失败，按契约回退", 名, 错 };
  }
}
function 自检() {
  const W = typeof window === "undefined" ? null : window;
  const R = __;
  const 项 = [
    { 名: "未参与首屏登记", 通过: 状态.参与首屏登记 === false },
    { 名: "首屏未自动触发 import", 通过: 状态.自动触发 === false },
    { 名: "8 个装载点已注册", 通过: Object.keys(装载点).length === 8 },
    { 名: "配置链完整", 通过: 校验配置链().通过 === true },
    { 名: "层表 42 槽位且顺序逐项对齐基线冻结层序", 通过: R.length === 42 && R.every((x, i) => x.i === i && x.id) },
    { 名: "其中 39 项为静态模块 / DOM 容器", 通过: R.filter((x) => x.容器 !== "运行时DOM").length === 39 },
    { 名: "两个 JSON 空壳仍在 DOM", 通过: !!(W && W.document && W.document.getElementById("tplSchema") && W.document.getElementById("tplExamples")) },
    { 名: "每个静态槽位都有真实模块文件或保留在 DOM", 通过: R.filter((x) => x.容器 !== "运行时DOM").every((x) => x.容器 === "DOM" || /^src\/层\//.test(x.文件 || "")) }
  ];
  return { 通过: 项.every((x) => x.通过), 项, 配置集摘要: 配置集摘要(), 状态, 层数: R.length };
}
const API = { ensure, 自检, 状态, 配置集摘要, 校验配置链, 层表: __, 装载点名: 状态.装载点名 };
if (typeof window !== "undefined") {
  window.__MOD__ = API;
  记("接线就绪", { 说明: "业务层已按 import 顺序同步执行完毕，懒加载未触发" });
}
