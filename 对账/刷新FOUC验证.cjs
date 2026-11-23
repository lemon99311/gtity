/* F5 刷新 FOUC 验证（可复跑，A/B 同构建对比）
 * 前置：npm run dev -- --port 5173（或环境变量 DEV_URL）
 * 用法：NODE_PATH="$(npm root -g)" DEV_URL=http://127.0.0.1:5173/?set=product node 对账/刷新FOUC验证.cjs
 *
 * 用 route 把 /src/ 下的模块请求整体挂起，直到「加载中」截图拍完才放行，
 * 模拟 dev 刷新时「64 个静态依赖下载中、ESM 尚未开始执行」的空窗。
 * 注意 Vite dev 会把中文目录编码成 %E5%B1%82，所以 predicate 用 /src/ + 扩展名匹配。
 * A 组 = 真实修复后 HTML（带 wl-fouc 遮罩）
 * B 组 = 把 HTML 响应里的遮罩去掉，模拟修复前
 * 在空窗中间截一张「加载中」图，比较黑色文字像素占比与 body 可见性。
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');

const 页面地址 = process.env.DEV_URL || 'http://127.0.0.1:5173/?set=product';
const 图目录 = path.join(__dirname, '截图');
fs.mkdirSync(图目录, { recursive: true });
const 遮罩样式 = '<style>html.wl-fouc body{visibility:hidden!important}</style>';

const 黑占比 = async buf => {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let 黑 = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] < 90 && data[i + 1] < 90 && data[i + 2] < 90) 黑++;
  }
  return +(黑 / (info.width * info.height) * 100).toFixed(3);
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const 结果 = {};
  for (const [名, 去掉遮罩] of [['修复后', false], ['修复前模拟', true]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const 错误 = [];
    page.on('pageerror', e => 错误.push(String(e).slice(0, 160)));
    let 放行;
    const 门 = new Promise(r => { 放行 = r; });

    // HTML 响应：B 组去掉遮罩（模拟修复前）
    await page.route(u => {
      const s = u.toString();
      return s.startsWith(new URL(页面地址).origin) && (s.endsWith('/') || s.includes('?set='));
    }, async route => {
      const resp = await route.fetch();
      let html = await resp.text();
      if (去掉遮罩) html = html.replace(' class="wl-fouc"', '').replace(遮罩样式, '');
      await route.fulfill({ response: resp, body: html });
    });

    // 挂起所有 /src/ 模块请求，制造 dev 刷新空窗（ESM 依赖未下载完 → 模块体不执行）
    await page.route(u => {
      const s = u.toString();
      return /\/src\//.test(s) && /\.(js|css)(\?|$)/.test(s);
    }, async route => {
      await 门;
      await route.continue();
    });

    await page.goto(页面地址, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForTimeout(220);            // 空窗中段：依赖还没下载完
    const 空窗 = await page.evaluate(() => ({
      有遮罩类: document.documentElement.classList.contains('wl-fouc'),
      body可见性: document.body ? getComputedStyle(document.body).visibility : '(无 body)',
      style标签数: document.querySelectorAll('style').length,
      文字长度: (document.body && document.body.innerText || '').trim().length,
      main子元素: document.querySelector('#main') ? document.querySelector('#main').children.length : -1,
    }));
    const 中图 = path.join(图目录, `刷新-${名}-加载中.png`);
    const bufMid = await page.screenshot({ path: 中图, animations: 'disabled' });
    const 中间黑占比 = await 黑占比(bufMid);

    放行();   // 「加载中」截图已完成，放行所有模块请求
    await page.waitForLoadState('load', { timeout: 120000 });
    await page.waitForTimeout(1600);
    const 完成 = await page.evaluate(() => {
      const T = window.TPL || {};
      return {
        有遮罩类: document.documentElement.classList.contains('wl-fouc'),
        body可见性: getComputedStyle(document.body).visibility,
        回归: (() => { try { const r = T._regressionRun(); return { pass: r.pass, total: r.total }; }
                      catch (e) { return String(e); } })(),
        层检查: (() => { try { return T._layersCheck().ok; } catch (e) { return String(e); } })(),
        层数: (() => { try { return T._layers().length; } catch (e) { return String(e); } })(),
        有TPL: !!window.TPL, 有MOD: !!window.__MOD__,
        列表行数: document.querySelectorAll('#main tbody tr, #tplMain tbody tr').length,
      };
    });
    const 完成图 = path.join(图目录, `刷新-${名}-完成.png`);
    const bufEnd = await page.screenshot({ path: 完成图, animations: 'disabled' });
    结果[名] = { 空窗, 中间黑占比, 完成, 完成黑占比: await 黑占比(bufEnd),
                 中图, 完成图, 页面错误: 错误 };
    await ctx.close();
  }
  await browser.close();

  const A = 结果['修复后'], B = 结果['修复前模拟'];
  const 判据 = {
    '修复后空窗期 body 隐藏': A.空窗.body可见性 === 'hidden' && A.空窗.有遮罩类 === true,
    '修复后空窗期零文字、纯白（无未排版内容）':
      A.空窗.文字长度 === 0 && A.中间黑占比 === 0,
    '修复前模拟确实复现了未排版内容（body 可见 + 有文字 + CSS 未注入）':
      B.空窗.body可见性 === 'visible' && B.空窗.文字长度 > 0 &&
      B.空窗.style标签数 === 0 && B.中间黑占比 > 0,
    '修复后遮罩确实解除': A.完成.有遮罩类 === false && A.完成.body可见性 === 'visible',
    '修复后完成页回归 8/8、层 42、列表 10 行':
      A.完成.回归.pass === true && A.完成.回归.total === 8 && A.完成.层检查 === true &&
      A.完成.层数 === 42 && A.完成.列表行数 === 10 && A.完成.有TPL && A.完成.有MOD,
    '两组完成页画面一致（0 像素差）': (() => {
      // 用 sharp 同步比较在下面异步补，这里先占位
      return true;
    })(),
    '页面错误均为 0': A.页面错误.length === 0 && B.页面错误.length === 0,
  };

  // 两组完成页像素比较
  const a = await sharp(A.完成图).raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(B.完成图).raw().toBuffer({ resolveWithObject: true });
  let 差异 = -1;
  if (a.info.width === b.info.width && a.info.height === b.info.height) {
    差异 = 0;
    for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) 差异++;
  }
  判据['两组完成页画面一致（0 像素差）'] = 差异 === 0;

  const 通过 = Object.values(判据).every(Boolean);
  const 输出 = { 时间: new Date().toISOString(), URL: 页面地址, 通过, 判据,
                 完成页差异通道数: 差异, 完成页总通道数: a.info.width * a.info.height * a.info.channels,
                 结果 };
  const 落盘 = path.join(__dirname, '刷新FOUC验证结果.json');
  fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');
  console.log('=== F5 刷新 FOUC 验证（A/B 同构建）===');
  for (const k of ['修复前模拟', '修复后']) {
    const r = 结果[k];
    console.log(`${k}: 空窗[遮罩=${r.空窗.有遮罩类} body=${r.空窗.body可见性} 文字=${r.空窗.文字长度} style=${r.空窗.style标签数}] 黑占比=${r.中间黑占比}%`);
    console.log(`           完成[遮罩=${r.完成.有遮罩类} 回归=${JSON.stringify(r.完成.回归)} 层=${r.完成.层数} 行=${r.完成.列表行数}] 黑占比=${r.完成黑占比}%`);
  }
  console.log('完成页差异:', 差异, '/', a.info.width * a.info.height * a.info.channels);
  for (const [k, v] of Object.entries(判据)) console.log(v ? ' ✅' : ' ❌', k);
  console.log('总通过:', 通过, ' 截图目录:', 图目录, ' 结果:', 落盘);
  if (!通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); process.exit(1); });
