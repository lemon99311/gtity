/* 首屏闪烁复现与量化（可复跑）
 * 前置：npm run dev -- --port 5173
 * 用法：NODE_PATH="$(npm root -g)" node 对账/首屏闪烁复现.cjs [标签]
 *
 * 原理：Vite dev 的 CSS 由 JS 模块动态注入 <style>，HTML 先绘制一次「无样式」画面。
 * 把 /src/层/*.css 的模块响应置空，即可把那一瞬间的画面定格下来。
 * 量化：两个内联 SVG 的 getBoundingClientRect、页面 scrollHeight、全页黑色像素占比。
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');
const 标签 = process.argv[2] || '当前';
const URL = process.env.DEV_URL || 'http://127.0.0.1:5173/';
const 图目录 = path.join(__dirname, '截图');
fs.mkdirSync(图目录, { recursive: true });

const 黑占比 = async buf => {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let 黑 = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] < 40 && data[i + 1] < 40 && data[i + 2] < 40) 黑++;
  }
  return { 像素: info.width * info.height, 黑像素: 黑, 占比: +(黑 / (info.width * info.height) * 100).toFixed(3) };
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const 结果 = {};
  for (const [名, 屏蔽CSS] of [['定格无样式', true], ['正常加载', false]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const 错误 = [];
    page.on('pageerror', e => 错误.push(String(e).slice(0, 160)));
    if (屏蔽CSS) {
      await page.route('**/*', route => {
        const u = route.request().url();
        // Vite dev 把 CSS 包装成 JS 模块；置空响应 = 模块加载成功但不注入 <style>
        if (/\/src\/层\/.*\.css(\?|$)/.test(u) || /\.css(\?direct|\?inline|$)/.test(u)) {
          return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
        }
        return route.continue();
      });
    }
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1200);
    const 状态 = await page.evaluate(() => {
      const svgs = [...document.querySelectorAll('svg')].map(s => {
        const r = s.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), 父: s.parentElement.className || s.parentElement.tagName };
      });
      return {
        svgs,
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
        style标签数: document.querySelectorAll('style').length,
        有TPL: !!window.TPL,
        文字长度: (document.body.innerText || '').length,
      };
    });
    const 文件 = path.join(图目录, `首屏-${标签}-${名}.png`);
    const buf = await page.screenshot({ path: 文件, fullPage: false, animations: 'disabled' });
    结果[名] = { 状态, 黑占比: await 黑占比(buf), 截图: 文件, 页面错误: 错误 };
    await ctx.close();
  }
  await browser.close();
  const 定格 = 结果['定格无样式'], 正常 = 结果['正常加载'];
  const 输出 = {
    标签, 时间: new Date().toISOString(), URL, 结果,
    判据: {
      无样式定格下SVG不撑大: 定格.状态.svgs.every(s => s.w <= 32 && s.h <= 32),
      // 无样式时文字是流式排版，必然超出视口；7935 是 SVG 撑出来的，收敛到 4000 以内即达标
      无样式定格下页面高度显著收敛: 定格.状态.scrollHeight < 4000,
      无样式定格下无大面积黑块: 定格.黑占比.占比 < 1,
      正常页黑色占比合理: 正常.黑占比.占比 < 5,
    },
  };
  const 落盘 = path.join(__dirname, `首屏闪烁复现结果-${标签}.json`);
  fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');
  console.log(`=== 首屏闪烁复现 [${标签}] ===`);
  for (const k of ['定格无样式', '正常加载']) {
    const r = 结果[k];
    console.log(`${k}: SVG=${JSON.stringify(r.状态.svgs)} scrollH=${r.状态.scrollHeight} 黑占比=${r.黑占比.占比}% style标签=${r.状态.style标签数} 错误=${r.页面错误.length}`);
  }
  console.log('判据:', JSON.stringify(输出.判据));
  console.log('截图:', 定格.截图, '|', 正常.截图);
  console.log('结果已写:', 落盘);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
