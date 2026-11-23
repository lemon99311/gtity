/* 配置表单 tocTitle 字段 label 文案验证（可复跑）
 * 前置：dist 静态服务 / dev 服务 / file:// 单文件预览，PAGE_URL 指定地址
 * 用法：NODE_PATH="$(npm root -g)" PAGE_URL=http://127.0.0.1:8080/index.html node 对账/配置表单文案验证.cjs
 *
 * 用户 #5 截图要求：配置表单「区块基础」卡片里「目录标题」→「左卡目录标题」。
 * 验证路径：真实调用 TPL._formOpen() 打开配置表单 → _formSel(第一个区块)
 *           → 在 #formWin 里按 <code>tocTitle</code> 定位该字段 → 读 <b> 文本。
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const URL_ = process.env.PAGE_URL || 'http://127.0.0.1:8080/index.html';
const TAG = (process.env.TAG || 'dist').replace(/[^\w\u4e00-\u9fa5-]/g, '');
const 图目录 = path.join(__dirname, '截图');
fs.mkdirSync(图目录, { recursive: true });

(async () => {
  const 项 = [];
  const 加 = (名, 通过, 详情) => { 项.push({ 名, 通过: !!通过, 详情 }); if (!通过) console.log(' ❌', 名, JSON.stringify(详情)); };
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const 错误 = [];
  page.on('pageerror', e => 错误.push(String(e).slice(0, 160)));
  await page.goto(URL_, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1200);

  const 打开结果 = await page.evaluate(() => {
    const T = window.TPL || {};
    if (typeof T._formOpen !== 'function' || typeof T._formSel !== 'function') {
      return { 错误: '_formOpen/_formSel 未注册', 有TPL: !!window.TPL };
    }
    try {
      T._formOpen();
      const first = T._formFirstSec ? T._formFirstSec() : '__global__';
      T._formSel(first);
      const win = document.querySelector('#formWin');
      const 卡片 = win ? [...win.querySelectorAll('.fw-f')] : [];
      const 命中 = 卡片.find(f => {
        const c = f.querySelector('code');
        return c && c.textContent.trim() === 'tocTitle';
      });
      const b = 命中 ? 命中.querySelector('.fw-f-l b') : null;
      const small = 命中 ? 命中.querySelector('.fw-f-l small') : null;
      return {
        有TPL: true, 打开: !!(win && win.classList.contains('on')),
        选中区块: first, 字段数: 卡片.length,
        label: b ? b.textContent.trim() : null,
        说明: small ? small.textContent.trim() : null,
        全部b文本: 卡片.map(f => { const x = f.querySelector('.fw-f-l b'); return x ? x.textContent.trim() : ''; }),
        key: 命中 && 命中.querySelector('code') ? 命中.querySelector('code').textContent.trim() : null,
        输入值: 命中 && 命中.querySelector('input.fw-in') ? 命中.querySelector('input.fw-in').value : null,
      };
    } catch (e) { return { 错误: String(e) }; }
  });

  加('配置表单成功打开并选中区块', 打开结果.打开 === true && 打开结果.字段数 > 0, 打开结果);
  加('tocTitle 字段存在且 key 正确', 打开结果.key === 'tocTitle', { key: 打开结果.key });
  加('label 已改为「左卡目录标题」', 打开结果.label === '左卡目录标题', { label: 打开结果.label });
  加('表单内不再出现旧 label「目录标题」',
     !打开结果.全部b文本.includes('目录标题'), { 全部b文本: 打开结果.全部b文本 });
  加('说明文字「左卡目录里显示的短标题」保持不变',
     打开结果.说明 === '左卡目录里显示的短标题', { 说明: 打开结果.说明 });
  加('字段输入值仍正常（未被文案改动破坏）',
     打开结果.输入值 !== null && 打开结果.输入值 !== undefined, { 输入值: 打开结果.输入值 });

  // 截图：配置表单打开态
  const 图 = path.join(图目录, `配置表单-左卡目录标题-${TAG}.png`);
  await page.screenshot({ path: 图, animations: 'disabled' });

  // 关闭表单后，主页面自检不受影响
  const 收尾 = await page.evaluate(() => {
    const T = window.TPL || {};
    try { T._formClose(); } catch (e) {}
    return {
      已关闭: !document.querySelector('#formWin.on'),
      回归: (() => { try { const r = T._regressionRun(); return { pass: r.pass, total: r.total }; } catch (e) { return String(e); } })(),
      层检查: (() => { try { return T._layersCheck().ok; } catch (e) { return String(e); } })(),
      层数: (() => { try { return T._layers().length; } catch (e) { return String(e); } })(),
      有TPL: !!window.TPL, 有MOD: !!window.__MOD__,
    };
  });
  加('关闭表单后主页面回归 8/8、层 42、TPL/MOD 均在',
     收尾.已关闭 && 收尾.回归.pass === true && 收尾.回归.total === 8 &&
     收尾.层检查 === true && 收尾.层数 === 42 && 收尾.有TPL && 收尾.有MOD, 收尾);
  加('页面错误 0', 错误.length === 0, 错误);

  await ctx.close(); await browser.close();
  const 通过 = 项.every(x => x.通过);
  const 输出 = { 时间: new Date().toISOString(), URL: URL_, 标签: TAG,
    总通过: 通过, 通过数: `${项.filter(x => x.通过).length}/${项.length}`,
    打开结果, 收尾, 页面错误: 错误, 截图: 图, 项 };
  const 落盘 = path.join(__dirname, `配置表单文案验证结果-${TAG}.json`);
  fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');
  console.log(`=== 配置表单文案验证 [${TAG}] ${输出.通过数} 总通过=${通过} ===`);
  console.log('label =', 打开结果.label, '| 说明 =', 打开结果.说明, '| 输入值 =', 打开结果.输入值);
  console.log('截图:', 图, ' 结果:', 落盘);
  if (!通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); process.exit(1); });
