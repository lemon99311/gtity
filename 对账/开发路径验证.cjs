/* 验证「开发服务器」这条路径也能进同一套 ESM 模块（B.5 双路径）
 * 前置：npm run dev -- --port 5173 --host 127.0.0.1
 * 用法：NODE_PATH="$(npm root -g)" node 对账/开发路径验证.cjs
 */
const { chromium } = require('playwright');
const HOST = 'http://127.0.0.1:5173';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const 模块请求 = [];
  const 错误 = [];
  await page.route('**/*', route => {
    const u = route.request().url();
    return u.startsWith(HOST) ? route.continue() : route.abort();
  });
  page.on('request', r => {
    const u = r.url();
    if (u.startsWith(HOST) && u.includes('/src/')) 模块请求.push(u.split('?')[0].replace(HOST, ''));
  });
  page.on('pageerror', e => 错误.push(String(e).slice(0, 200)));

  // 真拆后开发服务器首次要编译 64 个层模块，启动较慢；轮询到就绪再进页面。
  let 已就绪 = false;
  for (let i = 0; i < 30 && !已就绪; i++) {
    try { await page.goto(HOST + '/', { waitUntil: 'load', timeout: 15000 }); 已就绪 = true; }
    catch (e) { await page.waitForTimeout(1000); }
  }
  if (!已就绪) throw new Error('开发服务器 30 秒内未就绪');
  await page.waitForTimeout(1500);

  const 结果 = await page.evaluate(async () => {
    const T = window.TPL;
    const out = { 有TPL: !!T, 有MOD: !!window.__MOD__ };
    try { out.回归pass = T._regressionRun().pass; } catch (e) { out.回归err = String(e); }
    try { out.层检查ok = T._layersCheck().ok; } catch (e) { out.层err = String(e); }
    if (window.__MOD__) {
      out.MOD自检 = window.__MOD__.自检().通过;
      const m = await window.__MOD__.ensure('跳转桥');
      out.桥装载 = !!m && m.ok !== false;
      out.桥自检 = (m && m.default && typeof m.default.自检 === 'function') ? m.default.自检().通过 : null;
    }
    return out;
  });

  console.log(JSON.stringify(结果, null, 2));
  console.log('开发模式 /src/ 模块请求:', 模块请求);
  console.log('页面错误:', 错误.slice(0, 5));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
