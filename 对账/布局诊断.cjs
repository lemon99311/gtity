/* 顶栏/标签栏布局与字号诊断（可复跑）
 * 前置：dist 静态服务 或 dev 服务；URL 由环境变量 PAGE_URL 指定
 * 输出：关键元素 bounding box + computed font-size / line-height / font-weight
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const URL_ = process.env.PAGE_URL || 'http://127.0.0.1:8080/index.html';
const VW = +(process.env.VIEW_W || 1440);
const VH = +(process.env.VIEW_H || 900);
const 标签 = (process.env.DIAG_TAG || `${VW}x${VH}`).replace(/[^\w-]/g, '');

const 选择器 = [
  '#app', '.topbar', '.topbar .logo', '.topbar .logo b', '.topbar .logo span',
  '.topbar .crumb', '.topbar .crumb b', '.topbar .top-actions', '.user-chip',
  '.user-chip .avatar', '.user-chip small', '.user-chip strong',
  '.tabs', '.tpl-tab', '.main', '.side', '.side-title',
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const 错误 = [];
  page.on('pageerror', e => 错误.push(String(e).slice(0, 160)));
  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1200);
  const 数据 = await page.evaluate(sels => {
    const out = {};
    sels.forEach(s => {
      const e = document.querySelector(s);
      if (!e) { out[s] = null; return; }
      const r = e.getBoundingClientRect();
      const c = getComputedStyle(e);
      out[s] = {
        文本: (e.innerText || '').trim().slice(0, 60),
        x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
        fontSize: c.fontSize, lineHeight: c.lineHeight, fontWeight: c.fontWeight,
        color: c.color, display: c.display, visibility: c.visibility,
      };
    });
    return {
      元素: out,
      根变量: (() => {
        const c = getComputedStyle(document.documentElement);
        const keys = ['--fs-read', '--fs-125', '--fs-105', '--fs-15', '--t-fs-base', '--t-fs-h4', '--dw-base', '--dw-h4', '--topbar-h', '--lh-read'];
        const o = {}; keys.forEach(k => o[k] = c.getPropertyValue(k).trim()); return o;
      })(),
      视口: { w: innerWidth, h: innerHeight },
    };
  }, 选择器);
  const 图 = path.join(__dirname, '截图', `布局诊断-${标签}.png`);
  fs.mkdirSync(path.dirname(图), { recursive: true });
  await page.screenshot({ path: 图, animations: 'disabled' });
  const 落盘 = path.join(__dirname, `布局诊断结果-${标签}.json`);
  fs.writeFileSync(落盘, JSON.stringify({ 时间: new Date().toISOString(), URL: URL_, 数据, 页面错误: 错误, 截图: 图 }, null, 2), 'utf-8');
  console.log('=== 布局诊断 ===  URL:', URL_, '\n页面错误:', 错误);
  console.log('根变量:', JSON.stringify(数据.根变量));
  for (const [k, v] of Object.entries(数据.元素)) {
    if (!v) { console.log(k, '=> (不存在)'); continue; }
    console.log(`${k.padEnd(26)} box=(${v.x},${v.y},${v.w},${v.h}) fs=${v.fontSize} lh=${v.lineHeight} fw=${v.fontWeight} vis=${v.visibility} 文本="${v.文本}"`);
  }
  await ctx.close(); await browser.close();
  console.log('结果:', 落盘, ' 截图:', 图);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
