// src/list/配置.js
var \u5757 = "\u5217\u8868\xB7\u914D\u7F6E";
var \u6BB5 = [
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
function \u8BFB\u914D\u7F6E() {
  const w = W();
  const s = w && w.TPL && w.TPL.schema || {};
  const list = s.list || {};
  return {
    \u5757,
    schemaId: s.id || null,
    \u9876\u5C42\u6BB5: Object.keys(s).length,
    \u6BB5: \u6BB5.map((k) => {
      const v = list[k];
      const \u91CF = Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : v === void 0 ? null : 1;
      return { k, \u5B58\u5728: Object.prototype.hasOwnProperty.call(list, k), \u91CF };
    })
  };
}
function \u89C6\u56FE\u5B58\u6863\u952E() {
  const w = W();
  const id = w && w.TPL && w.TPL.schema && w.TPL.schema.id || null;
  return id ? "TPL_VIEW_CFG_V113:" + id : null;
}
function \u8BFB\u8349\u7A3F\u6458\u8981() {
  const w = W();
  if (!w || !w.localStorage) return { \u53EF\u7528: false, \u539F\u56E0: "\u65E0 localStorage" };
  try {
    const \u952E = \u89C6\u56FE\u5B58\u6863\u952E();
    const raw = \u952E ? w.localStorage.getItem(\u952E) : null;
    return {
      \u53EF\u7528: !!\u952E,
      \u952E,
      \u6709\u5B58\u6863: !!raw,
      \u5B57\u8282: raw ? raw.length : 0,
      \u53E3\u5F84: "\u6240\u6709\u6539\u52A8\u5728\u8349\u7A3F\u91CC\uFF0C\u70B9\u300C\u4FDD\u5B58\u5E76\u5E94\u7528\u300D\u624D\u751F\u6548",
      \u952E\u6765\u6E90: 'VSTORE + ":" + TPL.schema.id\uFF08L3970 / L4031\uFF09'
    };
  } catch (e) {
    return { \u53EF\u7528: false, \u539F\u56E0: String(e) };
  }
}
function \u6807\u51C6\u59FF\u52BF() {
  return {
    \u52A0\u89C6\u56FE: "S.list.views \u8FFD\u52A0\u4E00\u9879 + vDraft.views \u8FFD\u52A0\uFF0C\u8D70\u300C\uFF0B \u65B0\u5EFA\u89C6\u56FE\u300D\u4E0E\u300C\u4FDD\u5B58\u5E76\u5E94\u7528\u300D",
    \u52A0\u5217: "S.list.columns \u8FFD\u52A0\u4E00\u9879\uFF0C\u7C7B\u578B\u6807\u8BB0\u53EA\u5199 renderer\uFF0C\u4E0D\u52A8\u6E32\u67D3\u5F15\u64CE",
    \u52A0\u6761\u4EF6: "v.where.rules / v.filterKeys \u8FFD\u52A0\uFF0C\u5019\u9009\u9879\u7531\u4E1A\u52A1\u5B57\u5178\u63D0\u4F9B\uFF0C\u4E0D\u5199\u8FDB\u914D\u7F6E",
    \u7981\u6B62: "\u4E0D\u56DE\u5199 STORE \u4E1A\u52A1\u5B9A\u4E49\u6E90\u3001\u4E0D\u5B9A\u4E49\u8868\u5355\u5B57\u6BB5\u3001\u4E0D\u6539\u6865\u5951\u7EA6"
  };
}
function \u81EA\u68C0() {
  const c = \u8BFB\u914D\u7F6E();
  const \u547D\u4E2D = c.\u6BB5.filter((x) => x.\u5B58\u5728).length;
  const \u952E = \u89C6\u56FE\u5B58\u6863\u952E();
  const d = \u8BFB\u8349\u7A3F\u6458\u8981();
  const \u9879 = [
    { \u540D: "\u5217\u8868\u6BB5\u9F50\u5168", \u901A\u8FC7: \u547D\u4E2D === \u6BB5.length },
    { \u540D: "\u9876\u5C42\u6BB5\u6570", \u901A\u8FC7: c.\u9876\u5C42\u6BB5 >= 13 },
    { \u540D: "\u8349\u7A3F\u952E\u6309 schemaId \u6D3E\u751F", \u901A\u8FC7: !!\u952E && \u952E.endsWith(":" + String(c.schemaId)) },
    { \u540D: "\u8349\u7A3F\u6458\u8981\u53EF\u8BFB", \u901A\u8FC7: d.\u53EF\u7528 === true }
  ];
  return {
    \u5757,
    \u901A\u8FC7: \u9879.every((x) => x.\u901A\u8FC7),
    \u9879,
    \u547D\u4E2D\u6BB5: \u547D\u4E2D,
    \u6BB5: c.\u6BB5,
    \u9876\u5C42\u6BB5: c.\u9876\u5C42\u6BB5,
    schemaId: c.schemaId,
    \u8349\u7A3F\u952E: \u952E,
    \u8349\u7A3F\u6458\u8981: d
  };
}
var __default = { \u5757, \u8BFB\u914D\u7F6E, \u89C6\u56FE\u5B58\u6863\u952E, \u8BFB\u8349\u7A3F\u6458\u8981, \u6807\u51C6\u59FF\u52BF, \u81EA\u68C0 };
export {
  __default as default,
  \u6807\u51C6\u59FF\u52BF,
  \u81EA\u68C0,
  \u89C6\u56FE\u5B58\u6863\u952E,
  \u8BFB\u8349\u7A3F\u6458\u8981,
  \u8BFB\u914D\u7F6E
};
