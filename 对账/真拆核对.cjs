/* 真拆综合核对（可复跑）
 * 用法：NODE_PATH="$(npm root -g)" node 对账/真拆核对.cjs
 *
 * 只读源文件、清单、层模块、dist 产物与已有结果 JSON；不启浏览器（行为等价引用其它脚本的结果）。
 * 回答三个问题：① 内联层是否真被外置 ② 外置是否原样（3 处改写，含 Formula 抽离）③ 顺序/登记/产物是否对得上。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const 读 = p => fs.readFileSync(path.join(ROOT, p));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const 读JSON = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf-8')); } catch (e) { return null; } };

const 清单 = 读JSON('真拆清单.json');
const 基线 = 读('对账/基线原件.html');
const idx = 读('index.html');
const 项 = [];
const 加 = (名, 通过, 详情) => 项.push({ 名, 通过: !!通过, 详情 });

// ---------- ① 逐块 sha256 对账 ----------
const 逐块 = [];
for (const x of 清单.块清单) {
  if (!x.文件) { 逐块.push({ 序号: x.序号, id: x.id, 状态: '保留在 index.html（JSON 空壳）' }); continue; }
  const b = 读(x.文件);
  const 实际 = sha(b);
  const 期望 = x.生成sha256;
  const 原样 = 实际 === x.sha256;
  逐块.push({ 序号: x.序号, 文件: x.文件, 原字节: x.原字节, 生成字节: x.生成字节,
              sha一致: 实际 === 期望, 原样: 原样, 改写: x.改写 });
}
加('64 个层模块的生成 sha256 与清单逐项一致', 逐块.filter(x => x.sha一致 === false).length === 0,
   { 检查数: 逐块.filter(x => x.sha一致 !== undefined).length,
     不一致: 逐块.filter(x => x.sha一致 === false) });
const 改写块 = 逐块.filter(x => x.改写 && x.改写.length);
加('仅 2 个块被改写，且改写点恰好 3 处（含 Formula 抽离）',
   改写块.length === 2 && 改写块.reduce((n, x) => n + x.改写.length, 0) === 3 && 清单.改写点数 === 3,
   { 改写块, 清单改写点: 清单.改写说明 });
加('其余 62 个模块与基线内联块逐字一致', 逐块.filter(x => x.原样 === true).length === 62,
   { 原样数: 逐块.filter(x => x.原样 === true).length, 非原样: 逐块.filter(x => x.原样 === false).map(x => x.文件) });

// ---------- ② 三处改写的 before/after 实证 ----------
const S046 = 读('src/层/S046-script-tpl-b5-handoff.js').toString('utf-8');
const 旧 = [
  "document.querySelectorAll('style[id],script[id]').forEach(function(e,i){\n    var id=e.id, tag=e.tagName.toLowerCase();",
  "var st=[].slice.call(document.querySelectorAll('style[id]')).map(function(e){return e.id});\n      var sc=[].slice.call(document.querySelectorAll('script[id]')).map(function(e){return e.id});",
];
const 新 = [
  "(window.__WL_LAYER_REGISTRY__||[]).forEach(function(e,i){\n    var id=e.id, tag=e.tag;",
  "var R=window.__WL_LAYER_REGISTRY__||[];\n      var st=R.filter(function(e){return e.tag==='style'}).map(function(e){return e.id});\n      var sc=R.filter(function(e){return e.tag==='script'}).map(function(e){return e.id});",
];
加('改写 1：layerRows 数据源已换注册表且旧写法不存在', S046.includes(新[0]) && !S046.includes(旧[0]), {});
加('改写 2：exports 检查已换注册表且旧写法不存在', S046.includes(新[1]) && !S046.includes(旧[1]), {});
加('S046 仍含冻结基线 LAYERS=layerRows() 与 BASE 计算', S046.includes('var LAYERS=layerRows()'), {});

// 改写 3：Formula 抽离（按四块重组第一阶段）
const S038 = 读('src/层/S038-script-L3951.js').toString('utf-8');
const 公式模块路径 = 'src/业务/表单/公式引擎.js';
let 公式模块 = null;
try { 公式模块 = 读(公式模块路径).toString('utf-8'); } catch (e) { 公式模块 = null; }
const 基线文本 = 基线.toString('utf-8');
const 基线Formula起 = 基线文本.indexOf('const Formula = (function(){');
const 基线Formula止 = 基线文本.indexOf('})();\nwindow.__WL_FORMULA__ = Formula;', 基线Formula起);
const 基线Formula定义 = 基线Formula起 >= 0 && 基线Formula止 >= 0
  ? 基线文本.slice(基线Formula起, 基线Formula止 + '})();'.length) : '';
加('改写 3：业务模块存在且由 S038 顶层 import 引用',
   !!公式模块 && S038.startsWith("import { Formula } from '../业务/表单/公式引擎.js';\n"),
   { 模块: 公式模块路径, S038头: S038.slice(0, 80) });
加('改写 3：S038 不再内联 Formula 定义，但挂载点仍在',
   !S038.includes('const Formula = (function(){') &&
   S038.includes('window.__WL_FORMULA__ = Formula;'), {});
加('改写 3：业务模块函数体与基线逐字一致（仅声明改 export）',
   !!公式模块 && !!基线Formula定义 &&
   公式模块.includes(基线Formula定义.replace('const Formula =', 'export const Formula =', 1)),
   { 基线定义字节: Buffer.byteLength(基线Formula定义) });
加('改写 3：业务模块零闭包依赖（不引用主 IIFE 的 S/esc/VC/FORM/window）',
   !!公式模块 && !/(?<![A-Za-z0-9_$])(S|esc|escA|escJS|VC|FORM|PAGE|FEAT|ACT|DETAIL|window|document|localStorage)\s*[.(\[]/.test(
     公式模块.split('\n').filter(l => !l.trim().startsWith('//')).join('\n')), {});
加('改写 3：产物含公式引擎特征代码',
   (() => {
     try {
       const files = fs.readdirSync(path.join(ROOT, 'dist', 'assets')).filter(f => f.endsWith('.js'));
       return files.some(f => fs.readFileSync(path.join(ROOT, 'dist', 'assets', f), 'utf-8').includes('roundN'));
     } catch (e) { return false; }
   })(), {});

// ---------- ③ index.html 与体积 ----------
const 基线字节 = 基线.length, idx字节 = idx.length;
const 内联script标签 = (idx.toString('utf-8').match(/<script\b/gi) || []).length;
const 内联style标签 = (idx.toString('utf-8').match(/<style\b/gi) || []).length;
加('index.html 只剩 3 个 script 标签（2 空壳 + 1 module 入口）、0 个 style 标签',
   内联script标签 === 3 && 内联style标签 === 0, { script: 内联script标签, style: 内联style标签 });
加('index.html 体积降到基线 1% 以下', idx字节 < 基线字节 * 0.01,
   { 基线: 基线字节, 现在: idx字节, 占比: +(idx字节 / 基线字节 * 100).toFixed(3) + '%' });

// 首屏防闪烁（11_首屏闪烁修复.md）：HTML 首次绘制帧的 SVG 必须有固有尺寸
const idx文本 = idx.toString('utf-8');
const svg标签 = idx文本.match(/<svg\b[^>]*>/gi) || [];
加('index.html 的 2 个内联 SVG 都带 width/height（消除首次绘制撑满）',
   svg标签.length === 2 && svg标签.every(s => /\bwidth="\d+"/.test(s) && /\bheight="\d+"/.test(s)),
   { svg数: svg标签.length, 标签: svg标签 });
const 注册表文本 = 读('src/boot/层注册表.js').toString('utf-8');
加('层注册表含 @layer 兜底且在业务 CSS 之前同步注入',
   注册表文本.includes('@layer fouc-guard') && 注册表文本.indexOf('@layer fouc-guard') < 注册表文本.indexOf('export const 层表'),
   {});
加('兜底 style 不带 id，不参与 42 槽位层登记',
   !/兜底\.id|setAttribute\(['"]id['"]/.test(注册表文本), {});

// ---------- ④ 体积守恒：内联内容搬进了文件 ----------
const 层目录 = path.join(ROOT, 'src/层');
const 层文件 = fs.readdirSync(层目录);
const js字节 = 层文件.filter(f => f.endsWith('.js')).reduce((a, f) => a + fs.statSync(path.join(层目录, f)).size, 0);
const css字节 = 层文件.filter(f => f.endsWith('.css')).reduce((a, f) => a + fs.statSync(path.join(层目录, f)).size, 0);
const 清单js原 = 清单.块清单.filter(x => x.tag === 'script' && x.文件).reduce((a, x) => a + x.原字节, 0);
const 清单css原 = 清单.块清单.filter(x => x.tag === 'style' && x.文件).reduce((a, x) => a + x.原字节, 0);
// 按四块重组第一阶段：S038 抽走了 Formula 定义（改由独立业务 ESM 提供），
// 层 JS 总量因此少一块。把清单记录的「原字节 - 生成字节」补回去，才是与基线的可比口径。
const S038条目 = 清单.块清单.find(x => x.文件 && x.文件.indexOf('S038') >= 0);
const 抽离差 = S038条目 ? S038条目.原字节 - S038条目.生成字节 : 0;
const 还原js字节 = js字节 + 抽离差;
加('JS 层文件字节 + 已抽离业务模块字节 ≈ 基线内联 script 总量（误差 < 200 字节）',
   Math.abs(还原js字节 - 清单js原) < 200,
   { 文件: js字节, 抽离差, 还原: 还原js字节, 清单原: 清单js原, 差: 还原js字节 - 清单js原,
     业务模块: 'src/业务/表单/公式引擎.js' });
加('CSS 层文件字节 ≈ 基线内联 style 总量（误差 < 200 字节）', Math.abs(css字节 - 清单css原) < 200,
   { 文件: css字节, 清单原: 清单css原, 差: css字节 - 清单css原 });

const distAssets = path.join(ROOT, 'dist/assets');
const 产物 = fs.readdirSync(distAssets);
const 业务js = 产物.filter(f => /^layer-.*\.js$/.test(f));
const 业务css = 产物.filter(f => /\.css$/.test(f));
const 业务js字节 = 业务js.reduce((a, f) => a + fs.statSync(path.join(distAssets, f)).size, 0);
const 业务css字节 = 业务css.reduce((a, f) => a + fs.statSync(path.join(distAssets, f)).size, 0);
加('5 个业务 JS chunk 合计 > 700 KB（真实业务实现，不是装载壳）', 业务js.length === 5 && 业务js字节 > 700000,
   { 个数: 业务js.length, 字节: 业务js字节, 文件: 业务js });
加('业务 CSS 产物合计 > 400 KB', 业务css字节 > 400000, { 个数: 业务css.length, 字节: 业务css字节 });
加('dist/index.html 仍是小骨架', fs.statSync(path.join(ROOT, 'dist/index.html')).size < 12000,
   { 字节: fs.statSync(path.join(ROOT, 'dist/index.html')).size });

// ---------- ⑤ 注册表 ↔ 文件 ↔ import 顺序 ----------
const 入口 = 读('src/boot/启动入口.js').toString('utf-8');
const import顺序 = [...入口.matchAll(/import '\.\.\/层\/([^']+)'/g)].map(m => m[1]);
const 应有顺序 = 清单.块清单.filter(x => x.文件).map(x => path.basename(x.文件));
加('启动入口 import 顺序 = 66 块原文档顺序（跳过 2 个 JSON 空壳）',
   JSON.stringify(import顺序) === JSON.stringify(应有顺序) && import顺序.length === 64,
   { import数: import顺序.length, 应有数: 应有顺序.length });
加('注册表第一个 import（保证先于业务层求值）', /import \{ 层表 \} from '\.\/层注册表\.js';/.test(入口.split('\n').slice(0, 6).join('\n')), {});

const 注册表 = 清单.注册表;
const 静态项 = 注册表.filter(x => x.容器 !== '运行时DOM');
const 文件缺失 = 静态项.filter(x => x.容器 !== 'DOM' && !fs.existsSync(path.join(ROOT, x.文件)));
加('注册表 42 槽位 / 39 静态 / 3 运行时槽位',
   注册表.length === 42 && 静态项.length === 39 &&
   注册表.filter(x => x.容器 === '运行时DOM').length === 3,
   { 总: 注册表.length, 静态: 静态项.length,
     运行时槽位: 注册表.filter(x => x.容器 === '运行时DOM').map(x => x.id) });
加('39 个静态槽位都能映射到真实文件', 文件缺失.length === 0, { 缺失: 文件缺失 });
// 基线自身有一个 style 与一个 script 都叫 tpl-v115-elcontrols（00 第 4 节两套标识并列），
// 因此按 (tag,id) 组合判唯一，不要求 id 全局唯一。
加('注册表 i 字段逐项等于下标且 (tag,id) 组合不重', 注册表.every((x, i) => x.i === i && x.id) &&
   new Set(注册表.map(x => x.tag + '#' + x.id)).size === 42,
   { 重名id: [...new Set(注册表.map(x => x.id))].filter(id => 注册表.filter(x => x.id === id).length > 1) });

const 层序 = 读JSON('基线冻结层序.json');
加('注册表顺序与基线页冻结层序逐项一致',
   !!层序 && JSON.stringify(注册表.map(x => x.id)) === JSON.stringify(层序.层.map(x => x.id)), {});

// ---------- ⑥ 行为等价（引用其它脚本已跑出的结果） ----------
const 截图 = 读JSON('截图对账结果.json');
const 自检 = 读JSON('浏览器自检结果.json');
const 零Vue = 读JSON('无Vue约束校验结果.json');
const 基线复现 = 读JSON('总纲基线复现结果.json');
加('双页全页截图 0 像素差且状态一致', !!截图 && 截图.通过 === true && 截图.差异像素 === 0,
   截图 ? { 差异像素: 截图.差异像素, 状态一致: 截图.状态一致 } : null);
const 模块自检全通过 = !!自检 && !!自检.构建页 && !!自检.构建页.各模块 &&
  Object.values(自检.构建页.各模块).length === 8 &&
  Object.values(自检.构建页.各模块).every(v => v && v.ok === true && v.自检 && v.自检.通过 === true);
加('浏览器自检：回归逐项一致 / 层检查一致 / 按需生效',
   !!自检 && 自检.对账.回归逐项一致 === true && 自检.对账.层检查一致 === true &&
   自检.按需.按需生效 === true && 模块自检全通过,
   自检 ? { 回归逐项一致: 自检.对账.回归逐项一致, 层检查一致: 自检.对账.层检查一致,
            按需生效: 自检.按需.按需生效, 模块自检全通过 } : null);
加('零 Vue 约束校验全通过', !!零Vue && 零Vue.通过 === true,
   零Vue ? { 通过数: 零Vue.通过数, 总数: 零Vue.总数 } : null);
加('总纲 manual 基线统计（6 通过 / 0 部分复现）',
   !!基线复现 && 基线复现.统计.通过 === 6 && !基线复现.统计.部分复现,
   基线复现 ? 基线复现.统计 : null);
加('配置器存档键小修验证 16/16 通过',
   (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '配置器存档键验证结果.json'), 'utf-8')).通过 === true; }
            catch (e) { return false; } })(), {});

const 结果 = {
  生成时间: new Date().toISOString(),
  口径: '只读对账；行为等价引用 截图对账 / 浏览器自检 / 无Vue约束校验 / 总纲基线复现 的结果 JSON',
  通过: 项.every(x => x.通过), 通过数: 项.filter(x => x.通过).length, 总数: 项.length,
  关键数字: {
    基线字节, 新index字节: idx字节, 占比: +(idx字节 / 基线字节 * 100).toFixed(3) + '%',
    块数: 清单.块数, 生成模块数: 清单.生成模块数, 改写点数: 清单.改写点数,
    层js字节: js字节, 层css字节: css字节,
    业务chunk数: 业务js.length, 业务JS字节: 业务js字节, 业务CSS字节: 业务css字节,
    注册表槽位: 注册表.length, 静态层: 静态项.length,
  },
  项, 逐块,
};
const 落盘 = path.join(__dirname, '真拆核对结果.json');
fs.writeFileSync(落盘, JSON.stringify(结果, null, 2), 'utf-8');
console.log('=== 真拆综合核对 ===');
console.log('总通过:', 结果.通过, `(${结果.通过数}/${结果.总数})`);
for (const x of 项) console.log(x.通过 ? ' ✅' : ' ❌', x.名, JSON.stringify(x.详情).slice(0, 170));
console.log('关键数字:', JSON.stringify(结果.关键数字));
console.log('结果已写:', 落盘);
if (!结果.通过) process.exitCode = 1;
