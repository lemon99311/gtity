/* 单文件预览验证（可复跑）：file:// 双击即开的副本 vs dist 构建页
 * 用法：NODE_PATH="$(npm root -g)" node 对账/单文件预览验证.cjs
 * 检查：状态一致（TPL/回归/层/错误）、全页截图 0 像素差、零外部请求。
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const 单文件 = path.resolve(ROOT, '..', '项目预览-单文件.html');
const PORT = 8920;
const HOST = 'http://127.0.0.1:' + PORT;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
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

const 取状态 = () => {
  const T = window.TPL || {};
  return {
    标题: document.title,
    有TPL: !!window.TPL,
    有MOD: !!window.__MOD__,
    有Formula: !!window.__WL_FORMULA__,
    回归: (() => { try { const r = T._regressionRun(); return { pass: r.pass, total: r.total }; }
                  catch (e) { return String(e); } })(),
    层检查: (() => { try { return T._layersCheck().ok; } catch (e) { return String(e); } })(),
    层数: (() => { try { return T._layers().length; } catch (e) { return String(e); } })(),
    列表行数: document.querySelectorAll('#main tbody tr, #tplMain tbody tr').length,
    可见文字: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
  };
};

(async () => {
  await new Promise(r => 服务器.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
  });
  const 结果 = {};
  try {
    for (const [名, url, 文件] of [
      ['单文件file协议', 'file://' + 单文件, path.join(__dirname, '截图', '单文件预览.png')],
      ['dist构建页', HOST + '/dist/index.html', path.join(__dirname, '截图', 'dist对照.png')],
    ]) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const 错误 = [], 外部 = [];
      await page.route('**/*', route => {
        const u = route.request().url();
        if (u.startsWith(HOST) || u.startsWith('file://')) return route.continue();
        外部.push(u); return route.abort();
      });
      page.on('pageerror', e => 错误.push(String(e).slice(0, 200)));
      await page.goto(url, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(1500);
      const 状态 = await page.evaluate(取状态);
      const buf = await page.screenshot({ path: 文件, fullPage: true, animations: 'disabled' });
      结果[名] = { 状态, 页面错误: 错误, 外部请求: 外部, 截图: 文件, 截图字节: buf.length };
      await ctx.close();
    }
  } finally { await browser.close(); 服务器.close(); }

  const A = await sharp(结果['单文件file协议'].截图).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(结果['dist构建页'].截图).raw().toBuffer({ resolveWithObject: true });
  let 差异像素 = -1, 最大通道差 = -1;
  if (A.info.width === B.info.width && A.info.height === B.info.height) {
    差异像素 = 0; 最大通道差 = 0;
    for (let i = 0; i < A.data.length; i++) {
      const d = Math.abs(A.data[i] - B.data[i]);
      if (d) 差异像素++;
      if (d > 最大通道差) 最大通道差 = d;
    }
  }
  const 总像素 = A.info.width * A.info.height * A.info.channels;
  const a = 结果['单文件file协议'], b = 结果['dist构建页'];
  const 状态一致 = JSON.stringify(a.状态) === JSON.stringify(b.状态);
  const 断言 = {
    '单文件 file:// 下有 TPL / MOD / Formula': a.状态.有TPL && a.状态.有MOD && a.状态.有Formula,
    '单文件回归 8/8': a.状态.回归.pass === true && a.状态.回归.total === 8,
    '单文件层检查 ok 且冻结层 42': a.状态.层检查 === true && a.状态.层数 === 42,
    '单文件与 dist 状态逐项一致': 状态一致,
    '两页全页截图 0 像素差': 差异像素 === 0,
    '单文件页面错误 0': a.页面错误.length === 0,
    '单文件外部请求 0': a.外部请求.length === 0,
    '单文件内无 ./assets 相对引用': !fs.readFileSync(单文件, 'utf-8').includes('./assets/'),
  };
  const 通过 = Object.values(断言).every(Boolean);
  const 输出 = { 生成时间: new Date().toISOString(), 通过, 断言, 差异像素, 总像素, 最大通道差,
                 单文件字节: fs.statSync(单文件).size, 结果,
                 限定: '单文件是预览便利副本，8 个按需模块被内联，不用于验证动态 import；工程本体 dist/ 不变' };
  const 落盘 = path.join(__dirname, '单文件预览验证结果.json');
  fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');
  console.log('=== 单文件预览验证（file:// 双击即开）===');
  console.log('总通过:', 通过, `差异像素 ${差异像素} / ${总像素}`);
  for (const [k, v] of Object.entries(断言)) console.log(v ? ' ✅' : ' ❌', k);
  console.log('单文件状态:', JSON.stringify(a.状态));
  console.log('页面错误:', a.页面错误, ' 外部请求:', a.外部请求.slice(0, 3));
  console.log('结果已写:', 落盘);
  if (!通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); 服务器.close(); process.exit(1); });
