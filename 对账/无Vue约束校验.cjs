/* 实现栈约束校验 · 真拆口径（可复跑）
 * 用法：NODE_PATH="$(npm root -g)" node 对账/无Vue约束校验.cjs
 *
 * 约束：Vite 可用于构建；现阶段不使用 Vue / element-ui，不注入 CDN，不点亮增强分支。
 *
 * 真拆后的口径变化（重要）：
 *  - 34 个既有内联层已原样外置为 src/层/*.js，它们自带的 window.Vue / window.ELEMENT
 *    读取点与版本说明文案随之外置。这些字样属「预埋但不可达」的既有层，不是「引入 Vue」，
 *    按红线不删不改，因此不再用「零 Vue 字样」扫它们，改为「数量与基线逐项一致」。
 *  - 零 Vue 判据落在「新增层」：src/ 里除 src/层/ 外的模块、vite.config.js、package*.json、
 *    以及 dist 里新产生的 boot 与 8 个按需 chunk。
 *  - 真正的硬指标是运行时：window.Vue / window.ELEMENT 均 undefined、标志恒 false、外部请求 0。
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8901;
const HOST = 'http://127.0.0.1:' + PORT;
const 禁词 = /(?:\bvue\b|element-ui|plugin-vue|createApp|\.vue\b)/i;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const 读 = p => fs.readFileSync(path.join(ROOT, p), 'utf-8');
const 项 = [];
const 加 = (名, 通过, 详情) => 项.push({ 名, 通过: !!通过, 详情 });

const 基线 = 读('对账/基线原件.html');
const 读取点 = t => ({
  windowVue: (t.match(/window\.Vue/g) || []).length,
  windowELEMENT: (t.match(/window\.ELEMENT/g) || []).length,
  标志置false: (t.match(/__WL_HAS_EL__\s*=\s*false/g) || []).length,
  标志置true: (t.match(/__WL_HAS_EL__\s*=\s*true/g) || []).length,
  Vue大写: (t.match(/\bVue\b/g) || []).length,
});

// ---------- 静态：新增层零 Vue ----------
const pkg = JSON.parse(读('package.json'));
const 依赖名 = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
加('package.json 依赖无 vue / element-ui / plugin-vue', !依赖名.some(n => /vue|element-ui/i.test(n)), { 依赖名 });

const lock = JSON.parse(读('package-lock.json'));
const lock包 = Object.keys(lock.packages || {});
加('package-lock 无 vue 相关包', !lock包.some(n => /node_modules\/(vue|element-ui|@vitejs\/plugin-vue)/i.test(n)), { 包数: lock包.length });

// src/ 里「新增层」= 除 src/层/ 之外的所有文件
const 新增源码 = [];
(function 遍历(d) {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    if (d === 'src' && e.isDirectory() && e.name === '层') continue;   // 既有层外置目录，单独核对
    if (e.isDirectory()) 遍历(d + '/' + e.name);
    else 新增源码.push(d + '/' + e.name);
  }
})('src');
新增源码.push('vite.config.js');
const 新增违禁 = 新增源码.filter(f => 禁词.test(读(f))).map(f => ({ 文件: f, 命中: 读(f).match(new RegExp(禁词.source, 'gi')) }));
加('新增层（src 非层目录 + vite.config.js）零 Vue 字样', 新增违禁.length === 0,
   { 文件数: 新增源码.length, 违禁命中: 新增违禁 });
加('新增层无 .vue / .jsx / .tsx 文件', !新增源码.some(f => /\.(vue|jsx|tsx)$/i.test(f)),
   { 后缀: [...new Set(新增源码.map(f => path.extname(f)))] });

// ---------- 静态：既有层原样外置，读取点数量与基线一致 ----------
const 层目录 = path.join(ROOT, 'src/层');
const 层js = fs.readdirSync(层目录).filter(f => f.endsWith('.js')).sort();
const 层css = fs.readdirSync(层目录).filter(f => f.endsWith('.css')).sort();
const 层js全文 = 层js.map(f => 读('src/层/' + f)).join('\n');
const a = 读取点(基线), b = 读取点(层js全文);
加('外置既有层的 Vue 读取点数量与基线逐项一致', JSON.stringify(a) === JSON.stringify(b), { 基线: a, 外置层: b });
加('标志无置 true 代码（增强分支文件内不可达）', a.标志置true === 0 && a.标志置false === 1 && b.标志置true === 0,
   { 基线: a, 外置层: b });
加('层文件数 = 31 js + 33 css（2 个 JSON 空壳保留在 HTML）', 层js.length === 31 && 层css.length === 33,
   { js: 层js.length, css: 层css.length });

// ---------- 静态：index.html 是骨架，不再是自包含文件 ----------
const idx = 读('index.html');
const 内联可执行script = (idx.match(/<script\b(?![^>]*application\/json)[^>]*>[\s\S]*?<\/script>/gi) || [])
  .filter(s => !/type=["']module["']/i.test(s));
const 内联style = (idx.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || []);
const json空壳 = (idx.match(/<script\b[^>]*application\/json[^>]*>/gi) || []).length;
加('index.html 无内联可执行 script（除 1 个 module 入口）', 内联可执行script.length === 0,
   { 内联可执行script: 内联可执行script.length });
加('index.html 无内联 style', 内联style.length === 0, { 内联style: 内联style.length });
加('index.html 保留 2 个 JSON 空壳', json空壳 === 2, { json空壳 });
加('index.html 体积 < 10 KB 且远小于基线', idx.length < 10000 && idx.length < 基线.length * 0.05,
   { index字节: Buffer.byteLength(idx), 基线条: Buffer.byteLength(基线), 占比: +(idx.length / 基线.length * 100).toFixed(2) + '%' });

// ---------- 静态：dist 资源全部本地、无 CDN ----------
const dist = 读('dist/index.html');
const 资源值 = [...dist.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']*)["']/gi)].map(m => m[1]);
const 外部资源 = 资源值.filter(v => /^(?:https?:)?\/\//i.test(v) || /unpkg|jsdelivr|cdnjs/i.test(v));
const module入口 = (dist.match(/<script[^>]*type=["']module["'][^>]*>/gi) || []);
加('dist 无外部资源注入（所有 src/href 均本地）', 外部资源.length === 0,
   { 资源数: 资源值.length, 外部资源 });
加('dist 仅 1 个 module 入口且指向本地 boot 包', module入口.length === 1 && /assets\/boot-[\w-]+\.js/.test(module入口[0]),
   { module入口 });
加('真实标签中无 CDN 域名', !/unpkg|jsdelivr|cdnjs|cdn\./i.test(资源值.join(' ')), { 资源值: 资源值.slice(0, 12) });

const assets = fs.readdirSync(path.join(ROOT, 'dist/assets')).filter(f => f.endsWith('.js'));
const 按需前缀 = ['list-runtime', 'list-config', 'form-runtime', 'form-config', 'bridge', 'console', 'ext-renderer', 'ext-effect'];
const 新增产物 = assets.filter(f => /^(boot|shared|list-|form-|bridge|console|ext-)/.test(f));
const 新增产物违禁 = 新增产物.filter(f => 禁词.test(读('dist/assets/' + f)));
加('boot 与 8 个按需 chunk 零 Vue 运行时代码', 新增产物违禁.length === 0,
   { 检查产物: 新增产物.length, 违禁: 新增产物违禁 });
const 业务chunk = assets.filter(f => /^layer-/.test(f));
加('存在 5 个真实业务 chunk（layer-a..e）', 业务chunk.length >= 5, { 业务chunk });

// ---------- 静态：业务实现确实进了 JS 产物，不在 HTML ----------
const 业务chunk全文 = 业务chunk.map(f => 读('dist/assets/' + f)).join('\n');
const 特征 = ['function boot(', 'function buildPayload(', 'function resultHTML(', 'function layerRows(', 'function collect('];
const 命中 = 特征.filter(k => 业务chunk全文.includes(k));
加('业务实现特征函数出现在 JS chunk 而非 index.html',
   命中.length >= 4 && 特征.every(k => !idx.includes(k) && !dist.includes(k)),
   { 命中, 特征 });

// ---------- 运行时 ----------
const 服务器 = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/dist/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }
  fs.readFile(f, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(buf);
  });
});

(async () => {
  await new Promise(r => 服务器.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  let 运行时 = {}, 外部请求 = [], 页面错误 = [];
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => {
      const u = route.request().url();
      if (u.startsWith(HOST)) return route.continue();
      外部请求.push(u); return route.abort();
    });
    page.on('pageerror', e => 页面错误.push(String(e).slice(0, 200)));
    await page.goto(HOST + '/dist/index.html', { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1500);
    运行时 = await page.evaluate(() => {
      const W = window, T = W.TPL || {};
      const src列 = [...document.querySelectorAll('script[src]')].map(e => e.getAttribute('src'));
      const href列 = [...document.querySelectorAll('link[href]')].map(e => e.getAttribute('href'));
      const 外部节点 = v => /^(?:https?:)?\/\//i.test(v) || /unpkg|jsdelivr|cdnjs/i.test(v);
      const out = {
        Vue类型: typeof W.Vue, ELEMENT类型: typeof W.ELEMENT, 标志: W.__WL_HAS_EL__,
        scriptSrc: src列, 外部script节点: src列.filter(外部节点).length,
        linkHref: href列, 外部link节点: href列.filter(外部节点).length,
        本地资源数: src列.concat(href列).filter(v => /^\.\/assets\//.test(v)).length,
        moduleScript节点: document.querySelectorAll('script[type="module"]').length,
        首个scriptId: (document.querySelectorAll('script[id]')[0] || {}).id || null,
        注册表静态层: (W.__WL_LAYER_REGISTRY_META__ || {}).静态层 || null,
      };
      try { const r = T._regressionRun(); out.回归 = { pass: r.pass, total: r.total }; } catch (e) { out.回归err = String(e); }
      try { out.层检查 = T._layersCheck().ok; } catch (e) { out.层err = String(e); }
      try { out.层数 = T._layers().length; } catch (e) { out.层err = String(e); }
      out.MOD = !!W.__MOD__ ? {
        装载点数: W.__MOD__.状态.装载点名.length,
        参与首屏登记: W.__MOD__.状态.参与首屏登记,
        自动触发: W.__MOD__.状态.自动触发,
        自检通过: W.__MOD__.自检().通过,
      } : null;
      return out;
    });
    await page.close();
  } finally {
    await browser.close(); 服务器.close();
  }

  加('运行时 window.Vue 未定义', 运行时.Vue类型 === 'undefined', { 类型: 运行时.Vue类型 });
  加('运行时 window.ELEMENT 未定义', 运行时.ELEMENT类型 === 'undefined', { 类型: 运行时.ELEMENT类型 });
  加('运行时 __WL_HAS_EL__ === false（原生回落）', 运行时.标志 === false, { 值: 运行时.标志 });
  加('运行时无外部 script / link 节点', 运行时.外部script节点 === 0 && 运行时.外部link节点 === 0,
     { scriptSrc: 运行时.scriptSrc, 外部link节点: 运行时.外部link节点, 本地资源数: 运行时.本地资源数 });
  加('无外部网络请求', 外部请求.length === 0, { 外部请求: 外部请求.slice(0, 5) });
  加('页面无错误', 页面错误.length === 0, { 页面错误 });
  加('回归自检 8/8 通过', 运行时.回归 && 运行时.回归.pass === true && 运行时.回归.total === 8, { 回归: 运行时.回归 });
  加('层检查 ok 且冻结层数 42', 运行时.层检查 === true && 运行时.层数 === 42,
     { 层检查: 运行时.层检查, 层数: 运行时.层数, 注册表静态层: 运行时.注册表静态层 });
  加('按需装载层仍在且不自动触发', !!运行时.MOD && 运行时.MOD.装载点数 === 8 &&
     运行时.MOD.参与首屏登记 === false && 运行时.MOD.自动触发 === false && 运行时.MOD.自检通过 === true,
     { MOD: 运行时.MOD });

  const 结果 = {
    生成时间: new Date().toISOString(),
    口径: '真拆后口径：零 Vue 判据落新增层；既有层读取点按数量与基线对账；硬指标是运行时未定义与标志恒 false',
    约束: 'Vite 可用于构建；现阶段不使用 Vue / element-ui，不注入 CDN，不点亮增强分支',
    通过: 项.every(x => x.通过), 通过数: 项.filter(x => x.通过).length, 总数: 项.length,
    项, 运行时, 外部请求, 页面错误,
  };
  const 落盘 = path.join(__dirname, '无Vue约束校验结果.json');
  fs.writeFileSync(落盘, JSON.stringify(结果, null, 2), 'utf-8');
  console.log('=== 实现栈约束校验（真拆口径）===');
  console.log('总通过:', 结果.通过, `(${结果.通过数}/${结果.总数})`);
  for (const x of 项) console.log(x.通过 ? ' ✅' : ' ❌', x.名, JSON.stringify(x.详情).slice(0, 150));
  console.log('结果已写:', 落盘);
  if (!结果.通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); 服务器.close(); process.exit(1); });
