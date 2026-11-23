/* 配置器界面模块存档键小修 · 验证（可复跑）
 * 用法：NODE_PATH="$(npm root -g)" node 对账/配置器存档键验证.cjs
 *
 * 背景：src/console/配置器界面.js 的 独立存储摘要() 此前直接读常量键 TPL_VIEW_CFG_V113，
 * 而 VC.key() 是 VSTORE+':'+sid()（L3970 / L4031），实际键为 TPL_VIEW_CFG_V113:drugArchive，
 * 因此永远返回「无存档」。本轮按同一口径派生，并保留旧写法作对照。
 * 只改 1 个按需模块，不改源码、不改基线层、不改其它模块。
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8916;
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

(async () => {
  await new Promise(r => 服务器.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const 错误 = [], 外部请求 = [];
  let R;
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => {
      const u = route.request().url();
      if (u.startsWith(HOST)) return route.continue();
      外部请求.push(u); return route.abort();
    });
    page.on('pageerror', e => 错误.push(String(e).slice(0, 200)));
    await page.goto(HOST + '/dist/index.html', { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => localStorage.clear());
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
      page.evaluate(() => location.reload()).catch(() => {}),
    ]);
    await page.waitForTimeout(1000);

    R = await page.evaluate(async () => {
      const W = window, T = W.TPL, out = {};
      // 生成一份真实草稿存档
      T._vcOpen(); T._vcSave();
      T._formOpen(); T._formSave();
      out.schemaId = T.schema.id;
      out.真实键 = Object.keys(localStorage).sort();
      out.常量键值 = localStorage.getItem('TPL_VIEW_CFG_V113');

      const m = await W.__MOD__.ensure('配置器界面');
      const d = m && m.default;
      out.模块已装载 = !!d;
      if (d) {
        out.导出 = Object.keys(m);
        out.派生键 = d.视图配置存档键();
        out.独立存储摘要 = d.独立存储摘要();
        out.模块自检 = d.自检();
        out.打开视图配置 = d.打开视图配置();
        out.打开表单配置 = d.打开表单配置();
      }
      // 不跨块改：其余 7 个模块自检仍通过
      const 其余 = ['列表运行时', '列表配置', '表单运行时', '表单配置',
                    '跳转桥', '渲染器扩展位', '特殊效果扩展位'];
      out.其余模块 = {};
      for (const n of 其余) {
        const x = await W.__MOD__.ensure(n);
        out.其余模块[n] = !!(x && x.default && typeof x.default.自检 === 'function' && x.default.自检().通过);
      }
      out.主启动自检 = W.__MOD__.自检();
      out.回归 = (() => { try { const r = T._regressionRun();
        return { pass: r.pass, total: r.total, failed: (r.failed || []).map(x => x.id) }; }
        catch (e) { return String(e); } })();
      out.层检查 = (() => { try { return T._layersCheck().ok; } catch (e) { return String(e); } })();
      out.层数 = (() => { try { return T._layers().length; } catch (e) { return String(e); } })();
      return out;
    });
    await page.close();
  } finally {
    await browser.close(); 服务器.close();
  }

  const 断言 = {
    '旧写法（常量键）读不到': R.常量键值 === null,
    '真实键带 schemaId 后缀': R.真实键.includes('TPL_VIEW_CFG_V113:' + R.schemaId) &&
                              R.真实键.includes('TPL_FORM_CFG_V113:' + R.schemaId),
    '派生键 = 真实键': R.派生键 === 'TPL_VIEW_CFG_V113:' + R.schemaId,
    '摘要视图配置有存档': R.独立存储摘要.视图配置.有存档 === true && R.独立存储摘要.视图配置.字节 > 0,
    '摘要表单配置有存档': R.独立存储摘要.表单配置.有存档 === true && R.独立存储摘要.表单配置.字节 > 0,
    '摘要保留旧写法对照且仍为空': R.独立存储摘要.视图配置旧写法.有存档 === false,
    '摘要 schemaId 与键来源正确': R.独立存储摘要.schemaId === R.schemaId &&
      /VSTORE/.test(R.独立存储摘要.键来源),
    '本模块自检 5 项全通过': R.模块自检.通过 === true && R.模块自检.项.length === 5 &&
                              R.模块自检.项.every(x => x.通过),
    '两个配置器可打开': R.打开视图配置.ok === true && R.打开表单配置.ok === true,
    '其余 7 个模块自检不受影响': Object.values(R.其余模块).every(Boolean),
    '主启动自检通过': R.主启动自检.通过 === true,
    '回归 8/8': R.回归.pass === true && R.回归.total === 8,
    '层检查 ok 且冻结层数 42': R.层检查 === true && R.层数 === 42,
    '懒加载不参与首屏登记': R.主启动自检.状态.参与首屏登记 === false &&
                             R.主启动自检.状态.自动触发 === false,
    '无页面错误': 错误.length === 0,
    '无外部请求': 外部请求.length === 0,
  };

  const 输出 = {
    生成时间: new Date().toISOString(),
    口径: '只改 src/console/配置器界面.js 一个按需模块；按 6.4-B 单模块改动核对，不跨块改',
    改了什么: '新增 视图配置存档键()；独立存储摘要() 改用派生键并保留旧写法对照；自检() 追加 4 项覆盖；default 导出补一项',
    没动什么: 'src/ 其余模块、src/层/、工具/真拆生成.py 的产物、vite.config.js、index.html、基线源文件',
    断言, 通过: Object.values(断言).every(Boolean),
    结果: R, 页面错误: 错误, 外部请求,
  };
  const 落盘 = path.join(__dirname, '配置器存档键验证结果.json');
  fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');
  console.log('=== 配置器存档键小修验证 ===');
  console.log('总通过:', 输出.通过, `(${Object.values(断言).filter(Boolean).length}/${Object.values(断言).length})`);
  for (const [k, v] of Object.entries(断言)) console.log(v ? ' ✅' : ' ❌', k);
  console.log('派生键:', R.派生键, '视图草稿字节:', R.独立存储摘要.视图配置.字节);
  console.log('结果已写:', 落盘);
  if (!输出.通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); 服务器.close(); process.exit(1); });
