/* 按四块重组第一阶段 · Formula 公式引擎抽离验证（可复跑）
 * 用法：NODE_PATH="$(npm root -g)" node 对账/公式引擎抽离验证.cjs
 *
 * 目标：证明从 S038 主 IIFE 抽到 src/业务/表单/公式引擎.js 之后，
 *  ① 业务实现函数体与基线逐字一致（只把 const 改成 export const）
 *  ② 它是真正的 ESM 业务模块，被 S038 顶层 import，不再内联
 *  ③ 运行时 window.__WL_FORMULA__ 的出口、求值结果与基线页逐项一致
 *  ④ 回归 8/8、层冻结 42、零页面错误、零外部请求
 * 不改源码、不注入 CDN、不使用 Vue。
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8919;
const HOST = 'http://127.0.0.1:' + PORT;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const 服务器 = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/dist/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(b);
  });
});

// 基线页（原文件，内联 IIFE 未被抽离）与构建页（抽离后）用同一个服务器的不同 URL
const 基线页URL = HOST + '/对账/基线原件.html';

(async () => {
  await new Promise(r => 服务器.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const 错误 = [], 外部请求 = [];
  let 基线, 构建;
  try {
    const 开 = async (url, 标签) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.route('**/*', route => {
        const u = route.request().url();
        if (u.startsWith(HOST)) return route.continue();
        外部请求.push(u); return route.abort();
      });
      page.on('pageerror', e => 错误.push(标签 + ': ' + String(e).slice(0, 200)));
      await page.goto(url, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(1200);
      const R = await page.evaluate(() => {
        const F = window.__WL_FORMULA__ || null;
        const 算 = (src, ctx, rows, prec) => {
          try { return F ? F.eval(src, ctx, rows, prec) : null; } catch (e) { return 'ERR:' + String(e); }
        };
        return {
          有Formula: !!F,
          出口: F ? Object.keys(F).sort() : [],
          求值用例: [
            { 名: '四则', v: 算('2 + 3 * 4', {}, []) },
            { 名: '比较', v: 算('5 >= 3', {}, []) },
            { 名: '逻辑', v: 算('1 && 0 || 2', {}, []) },
            { 名: '字段解析', v: 算('qty * price', { qty: 3, price: 2.5 }, []) },
            { 名: '嵌套字段', v: 算('a.b * 2', { a: { b: 7 } }, []) },
            { 名: 'sum 聚合', v: 算('sum(amount)', {}, [{ amount: 1 }, { amount: 2 }, { amount: 3.5 }]) },
            { 名: 'round', v: 算('round(3.14159, 2)', {}, []) },
            { 名: 'min/max/abs', v: [算('min(3,1,2)', {}, []), 算('max(3,1,2)', {}, []), 算('abs(-4)', {}, [])] },
            { 名: '非法表达式容错', v: 算('@@@', {}, []) },
            { 名: '精度', v: 算('10 / 3', {}, [], 3) },
          ],
          round: F ? [F.round(3.14159, 2), F.round(2.5, 0), F.round(-1.2345, 3)] : null,
          tokens: F ? F.tokens('a + b * 2').map(t => t.t + ':' + t.v) : null,
          回归: (() => { try { const r = window.TPL._regressionRun();
            return { pass: r.pass, total: r.total }; } catch (e) { return String(e); } })(),
          层检查: (() => { try { return window.TPL._layersCheck().ok; } catch (e) { return String(e); } })(),
          层数: (() => { try { return window.TPL._layers().length; } catch (e) { return String(e); } })(),
        };
      });
      await ctx.close();
      return R;
    };
    基线 = await 开(基线页URL, '基线页');
    构建 = await 开(HOST + '/dist/index.html', '构建页');
  } finally {
    await browser.close(); 服务器.close();
  }

  // ---- 静态部分 ----
  const S038 = fs.readFileSync(path.join(ROOT, 'src/层/S038-script-L3951.js'), 'utf-8');
  const 模块 = fs.readFileSync(path.join(ROOT, 'src/业务/表单/公式引擎.js'), 'utf-8');
  const 基线原文 = fs.readFileSync(path.join(ROOT, '对账/基线原件.html'), 'utf-8');
  const a = 基线原文.indexOf('const Formula = (function(){');
  const z = 基线原文.indexOf('})();\nwindow.__WL_FORMULA__ = Formula;', a);
  const 原定义 = a >= 0 && z >= 0 ? 基线原文.slice(a, z + '})();'.length) : '';
  const 期望模块体 = 原定义.replace('const Formula =', 'export const Formula =', 1);
  const 模块代码 = 模块.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  const 闭包依赖 = /(?:^|[^A-Za-z0-9_$])(S|esc|escA|escJS|VC|FORM|PAGE|FEAT|ACT|DETAIL|window|document|localStorage|TPL)\s*[.(\[]/;

  const 断言 = {
    '业务模块是 ESM（export const Formula）': /^export const Formula = \(function\(\)\{/.test(模块代码),
    '函数体与基线逐字一致（仅声明改 export）': !!原定义 && 模块.includes(期望模块体),
    'S038 顶层 import 该业务模块': S038.startsWith("import { Formula } from '../业务/表单/公式引擎.js';\n"),
    'S038 不再内联 Formula 定义': !S038.includes('const Formula = (function(){'),
    'S038 仍保留原挂载语句': S038.includes('window.__WL_FORMULA__ = Formula;'),
    '业务模块零闭包依赖': !闭包依赖.test(模块代码),
    '基线页与构建页都有 __WL_FORMULA__': 基线.有Formula === true && 构建.有Formula === true,
    '出口键逐项一致（eval/round/tokens）': JSON.stringify(基线.出口) === JSON.stringify(构建.出口) &&
      构建.出口.join(',') === 'eval,round,tokens',
    '10 组求值用例逐项一致': JSON.stringify(基线.求值用例) === JSON.stringify(构建.求值用例),
    'round 三项一致': JSON.stringify(基线.round) === JSON.stringify(构建.round),
    'tokens 序列一致': JSON.stringify(基线.tokens) === JSON.stringify(构建.tokens),
    '两页回归 8/8': 基线.回归.pass === true && 基线.回归.total === 8 &&
                     构建.回归.pass === true && 构建.回归.total === 8,
    '两页层检查 ok 且冻结层数 42': 基线.层检查 === true && 基线.层数 === 42 &&
                                   构建.层检查 === true && 构建.层数 === 42,
    '无页面错误': 错误.length === 0,
    '无外部请求': 外部请求.length === 0,
  };

  const 输出 = {
    生成时间: new Date().toISOString(),
    阶段: '按四块重组 · 第一阶段',
    抽离对象: 'S038 主 IIFE 的 Formula 公式引擎（零耦合纯计算 IIFE）',
    业务模块: 'src/业务/表单/公式引擎.js',
    口径: '只把 const 改成 export const；函数体一字未改；S038 顶层 import 取回绑定；原 window 挂载语句保留',
    断言, 通过: Object.values(断言).every(Boolean),
    基线: 基线, 构建: 构建, 页面错误: 错误, 外部请求,
    业务模块字节: Buffer.byteLength(模块),
  };
  const 落盘 = path.join(__dirname, '公式引擎抽离验证结果.json');
  fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');
  console.log('=== 公式引擎抽离验证（按四块重组第一阶段）===');
  console.log('总通过:', 输出.通过, `(${Object.values(断言).filter(Boolean).length}/${Object.values(断言).length})`);
  for (const [k, v] of Object.entries(断言)) console.log(v ? ' ✅' : ' ❌', k);
  console.log('业务模块:', 输出.业务模块, 输出.业务模块字节, '字节');
  console.log('求值样例:', JSON.stringify(构建.求值用例.slice(0, 3)));
  console.log('结果已写:', 落盘);
  if (!输出.通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); 服务器.close(); process.exit(1); });
