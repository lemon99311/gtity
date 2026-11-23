/* 预览验证（可复跑）：用最轻的静态服务器打开 dist，确认页面真能跑并截一张效果图。
 * 前置：cd Vite分模块工程/dist && python3 -m http.server 8080
 * 用法：NODE_PATH="$(npm root -g)" PREVIEW_URL=http://127.0.0.1:8080/index.html node 对账/预览验证.cjs
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const 预览地址 = process.env.PREVIEW_URL || 'http://127.0.0.1:8080/index.html';
const OUT = path.resolve(__dirname, '..', '..', '预览效果.png');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const 错误 = [], 外部 = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(new URL(预览地址).origin)) return route.continue();
    外部.push(u); return route.abort();
  });
  page.on('pageerror', e => 错误.push(String(e).slice(0, 200)));
  await page.goto(预览地址, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);
  const R = await page.evaluate(() => {
    const T = window.TPL || {};
    return {
      标题: document.title,
      有TPL: !!window.TPL,
      有MOD: !!window.__MOD__,
      列表行数: document.querySelectorAll('#tplMain tbody tr, .wl-tbl tbody tr, table tbody tr').length,
      回归: (() => { try { const r = T._regressionRun(); return { pass: r.pass, total: r.total }; }
                    catch (e) { return String(e); } })(),
      层检查: (() => { try { return T._layersCheck().ok; } catch (e) { return String(e); } })(),
      层数: (() => { try { return T._layers().length; } catch (e) { return String(e); } })(),
      按需模块: Object.keys((window.__MOD__ && window.__MOD__.状态) || {}),
      可见文字片段: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 160),
    };
  });
  await page.screenshot({ path: OUT, fullPage: true });
  await browser.close();
  const 通过 = R.有TPL && R.有MOD && R.回归.pass === true && R.层检查 === true &&
               R.层数 === 42 && 错误.length === 0 && 外部.length === 0;
  console.log('预览 URL:', 预览地址);
  console.log(JSON.stringify({ 通过, ...R, 页面错误: 错误, 外部请求: 外部 }, null, 2));
  console.log('截图:', OUT, fs.statSync(OUT).size, '字节');
  if (!通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); process.exit(1); });
