/* 工程内双页截图对账：基线原件页 vs dist 构建页（可复跑）
 * 用法：NODE_PATH="$(npm root -g)" node 对账/截图对账.cjs
 *
 * 口径：同一浏览器、同一视口、同一断网拦截条件，比较的是「改造前后默认视图是否一致」。
 * 这是工程内自动截图，不替代用户提供的运行截图；05 的「未附截图」判定不变。
 * 当前实现栈不使用 Vue，因此默认视图即原生回落态。
 *
 * 【视觉收敛模式】用户明确要求修顶栏字号层级与标签栏几何后，构建页与基线页
 * 在顶部必然有差异。检测到 dist 含 src/视觉收敛.css 时，判据收敛为：
 *   差异像素全部落在 y < 100（topbar 58 + tabs 42）的目标区域，其余区域 0 差异，
 *   且两页状态一致。不再假装「全页 0 像素差」。
 * 想验严格等价：STRICT=1 强制按「全页 0 差异」判（此时会如实失败）。
 * 目标区域的变化另由 对账/视觉收敛验证.cjs 逐项断言（13/13）。
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8902;
const HOST = 'http://127.0.0.1:' + PORT;
const 图目录 = path.join(__dirname, '截图');
fs.mkdirSync(图目录, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8' };

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

async function 截一页(browser, 相对路径, 文件名) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  });
  await page.route('**/*', route => route.request().url().startsWith(HOST)
    ? route.continue() : route.abort());
  await page.goto(HOST + 相对路径, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1800);
  const 状态 = await page.evaluate(() => ({
    hasEl: !!window.__WL_HAS_EL__,
    行数: document.querySelectorAll('#tplTbody tr').length,
    标题: document.title,
    回归: (() => { try { return window.TPL._regressionRun().pass; } catch (e) { return null; } })(),
  }));
  const 文件 = path.join(图目录, 文件名);
  await page.screenshot({ path: 文件, fullPage: true, animations: 'disabled' });
  await page.close();
  return { 文件, 状态 };
}

(async () => {
  await new Promise(r => 服务器.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  let 基线, 构建;
  try {
    基线 = await 截一页(browser, '/对账/基线原件.html', '基线页默认视图.png');
    构建 = await 截一页(browser, '/dist/index.html', '构建页默认视图.png');
  } finally {
    await browser.close();
    服务器.close();
  }

  const A = await sharp(基线.文件).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(构建.文件).raw().toBuffer({ resolveWithObject: true });
  const 尺寸一致 = A.info.width === B.info.width && A.info.height === B.info.height &&
                   A.info.channels === B.info.channels;
  // 检测构建产物是否含视觉收敛补丁（Vite 把它提取成 index-*.css）
  const 有补丁 = (() => {
    try {
      const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf-8');
      const names = [...html.matchAll(/href="\.\/assets\/([^"]+\.css)"/g)].map(m => m[1]);
      return names.some(n => n.startsWith('index-') &&
        fs.readFileSync(path.join(ROOT, 'dist', 'assets', n), 'utf-8').includes('视觉收敛补丁'));
    } catch (e) { return false; }
  })();
  const 严格 = process.env.STRICT === '1' || !有补丁;

  let 差异像素 = null, 总像素 = null, 差异占比 = null, 最大通道差 = null, 差异图 = null;
  let 顶部差异 = 0, 非顶部差异 = 0;
  if (尺寸一致) {
    const a = A.data, b = B.data, n = a.length;
    总像素 = n / A.info.channels;
    差异像素 = 0; 最大通道差 = 0;
    const diff = Buffer.alloc(n);
    for (let i = 0; i < n; i++) {
      const d = Math.abs(a[i] - b[i]);
      if (d > 最大通道差) 最大通道差 = d;
      if (d !== 0) diff[i] = 255;
    }
    // 差异像素按「任一通道不同」计数，并分区统计（顶部 y<100 为视觉收敛目标区）
    const w = A.info.width;
    for (let p = 0; p < 总像素; p++) {
      const off = p * A.info.channels;
      let 不同 = false;
      for (let c = 0; c < A.info.channels; c++) if (a[off + c] !== b[off + c]) { 不同 = true; break; }
      if (不同) {
        差异像素++;
        const y = Math.floor(p / w);
        if (y < 100) 顶部差异++; else 非顶部差异++;
      }
    }
    差异占比 = 差异像素 / 总像素 * 100;
    if (差异像素 > 0) {
      差异图 = path.join(图目录, '差异可视化.png');
      await sharp(diff, { raw: { width: A.info.width, height: A.info.height, channels: A.info.channels } })
        .png().toFile(差异图);
    }
  }

  const 状态一致 = JSON.stringify(基线.状态) === JSON.stringify(构建.状态);
  const 像素判据 = 严格
    ? (尺寸一致 && 差异像素 === 0)
    : (尺寸一致 && 顶部差异 > 0 && 非顶部差异 === 0);
  const 结果 = {
    生成时间: new Date().toISOString(),
    口径: 严格
      ? '工程内同环境双页截图；全页 0 像素差（行为等价严格模式）'
      : '工程内同环境双页截图；视觉收敛模式：差异仅限 y<100 顶栏/标签栏，其余区域 0 差异',
    视觉收敛补丁: 有补丁, 严格模式: 严格,
    视口: { width: 1440, height: 900, deviceScaleFactor: 1, fullPage: true },
    基线: { 图: path.basename(基线.文件), 状态: 基线.状态 },
    构建: { 图: path.basename(构建.文件), 状态: 构建.状态 },
    图像: { 宽: A.info.width, 高: A.info.height, 通道: A.info.channels,
            构建宽: B.info.width, 构建高: B.info.height },
    尺寸一致,
    差异像素, 总像素, 差异占比: 差异占比 === null ? null : Number(差异占比.toFixed(6)),
    顶部差异, 非顶部差异, 最大通道差, 差异图: 差异图 ? path.basename(差异图) : null,
    像素一致: 严格 ? (尺寸一致 && 差异像素 === 0) : (尺寸一致 && 非顶部差异 === 0),
    状态一致,
    通过: 像素判据 && 状态一致,
  };
  const 落盘 = path.join(__dirname, '截图对账结果.json');
  fs.writeFileSync(落盘, JSON.stringify(结果, null, 2), 'utf-8');
  console.log('=== 工程内双页截图对账 ===', 严格 ? '[严格模式]' : '[视觉收敛模式]');
  console.log('尺寸:', 结果.图像, '一致:', 尺寸一致);
  console.log('差异像素:', 差异像素, '/', 总像素, '占比:', 结果.差异占比 + '%',
              '顶部(y<100):', 顶部差异, ' 非顶部:', 非顶部差异, ' 最大通道差:', 最大通道差);
  if (!严格) console.log('说明: 顶部差异是用户明确要求的视觉收敛，非目标区域 0 差异；STRICT=1 可验严格等价。');
  console.log('状态一致:', 结果.状态一致, JSON.stringify(基线.状态), JSON.stringify(构建.状态));
  console.log('通过:', 结果.通过);
  console.log('结果已写:', 落盘);
  if (!结果.通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); 服务器.close(); process.exit(1); });
