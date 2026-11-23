/* 浏览器自检 + 改动前后对账（可复跑）
 * 用法：NODE_PATH="$(npm root -g)" node 对账/浏览器自检.cjs
 *
 * 同一 Chromium、同一断网拦截条件下，分别加载「基线原件」与「dist/index.html」，
 * 各跑一次 TPL._regressionRun()，逐项比对；并核对按需 chunk 是否只在对应场景被请求。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8899;
const HOST = 'http://127.0.0.1:' + PORT;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const 装载点名 = ['列表运行时', '列表配置', '表单运行时', '表单配置',
                  '跳转桥', '配置器界面', '渲染器扩展位', '特殊效果扩展位'];
const 期望产物 = ['list-runtime', 'list-config', 'form-runtime', 'form-config',
                  'bridge', 'console', 'ext-renderer', 'ext-effect'];

const 服务器 = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/dist/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end('404 ' + p); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(b);
  });
});

function 精简回归(r) {
  if (!r) return null;
  return {
    pass: r.pass, total: r.total,
    failed: (r.failed || []).map(x => x.id),
    items: (r.items || []).map(x => ({ id: x.id, ok: x.ok, check: x.check })),
  };
}

async function 跑一页(browser, 相对路径, 是构建页) {
  const page = await browser.newPage();
  const 请求 = [];
  const 错误 = [];
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(HOST)) return route.continue();
    return route.abort();   // 模拟「外部依赖全断」回退路径
  });
  page.on('request', r => {
    const u = r.url();
    if (u.includes('/assets/') && u.endsWith('.js')) 请求.push(u.split('/').pop());
  });
  page.on('pageerror', e => 错误.push(String(e).slice(0, 200)));

  const url = HOST + encodeURI(相对路径);
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);

  const 基础 = await page.evaluate(() => {
    const W = window, T = W.TPL || {};
    const S = T.schema || {};
    const out = {
      有TPL: !!W.TPL,
      schemaId: S.id || null,
      顶层段: Object.keys(S).length,
      结果键: Object.keys(S.result || {}).length,
      映射键: Object.keys((S.db || {}).dbMap || {}).length,
      视图数: (S.list && S.list.views || []).length,
      列数: (S.list && S.list.columns || []).length,
      公开_出口数: Object.keys(T).filter(k => k.charAt(0) === '_').length,
      hasEl: !!W.__WL_HAS_EL__,
      就绪: {
        b2: !!W.__WL_B2_EARLY__, b3: !!W.__WL_B3_READY__,
        b4: !!W.__WL_B4_READY__, b5: !!W.__WL_B5_READY__,
      },
      scriptIds: [].slice.call(document.querySelectorAll('script[id]')).map(e => e.id),
      styleIds: [].slice.call(document.querySelectorAll('style[id]')).map(e => e.id),
      有MOD: !!W.__MOD__,
    };
    try { out.regression = W.TPL._regressionRun(); } catch (e) { out.regressionErr = String(e); }
    try { out.layersCheck = W.TPL._layersCheck(); } catch (e) { out.layersErr = String(e); }
    return out;
  });

  const 结果 = { 页面: 相对路径, 基础, 错误, 首屏js请求: 请求.slice() };

  if (是构建页 && 基础.有MOD) {
    const 精简MOD = await page.evaluate(() => {
      const M = window.__MOD__;
      const s = M.自检();
      return {
        自检通过: s.通过, 自检项: s.项,
        配置集摘要: s.配置集摘要,
        配置链校验: M.校验配置链(),
        状态: {
          参与首屏登记: M.状态.参与首屏登记,
          自动触发: M.状态.自动触发,
          装载点名: M.状态.装载点名,
          时序数: M.状态.时序.length,
          已装载: Object.keys(M.状态.已装载),
          失败: M.状态.失败,
        },
      };
    });
    结果.MOD = 精简MOD;
    结果.首屏后MOD装载数 = 精简MOD.状态.已装载.length;

    // 先只拉起桥，确认「只在对应场景被请求」
    const 单桥 = await page.evaluate(async () => {
      const m = await window.__MOD__.ensure('跳转桥');
      const d = m && m.default;
      return { ok: !!m && m.ok !== false, 自检: (d && typeof d.自检 === 'function') ? d.自检() : null };
    });
    结果.单桥 = 单桥;
    结果.单桥后js请求 = 请求.slice();

    // 再拉起其余 7 个，逐个跑单模块自检
    const 全量 = await page.evaluate(async (名字) => {
      const out = {};
      for (const n of 名字) {
        const m = await window.__MOD__.ensure(n);
        const d = m && m.default;
        out[n] = {
          ok: !!m && m.ok !== false,
          自检: (d && typeof d.自检 === 'function') ? d.自检() : null,
        };
      }
      return out;
    }, 装载点名);
    结果.各模块 = 全量;
    结果.全量后js请求 = 请求.slice();

    // 加载完按需 chunk 后再跑一次自检，确认懒加载不破坏登记与自检时序
    结果.加载后回归 = 精简回归(await page.evaluate(() => window.TPL._regressionRun()));
    结果.加载后MOD = await page.evaluate(() => ({
      参与首屏登记: window.__MOD__.状态.参与首屏登记,
      自动触发: window.__MOD__.状态.自动触发,
      已装载: Object.keys(window.__MOD__.状态.已装载),
      时序数: window.__MOD__.状态.时序.length,
      失败: window.__MOD__.状态.失败,
    }));
  }

  await page.close();
  return 结果;
}

(async () => {
  await new Promise(r => 服务器.listen(PORT, '127.0.0.1', r));
  const 浏览器路径 = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';
  const browser = await chromium.launch({
    headless: true,
    executablePath: 浏览器路径,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  let 基线, 构建;
  try {
    基线 = await 跑一页(browser, '/对账/基线原件.html', false);
    构建 = await 跑一页(browser, '/dist/index.html', true);
  } finally {
    await browser.close();
    服务器.close();
  }

  const a = 精简回归(基线.基础.regression);
  const b = 精简回归(构建.基础.regression);
  const 共有项 = ['schemaId', '顶层段', '结果键', '映射键', '视图数', '列数',
                  '公开_出口数', 'hasEl', 'scriptIds', 'styleIds'];
  const 对账 = {
    回归逐项一致: JSON.stringify(a) === JSON.stringify(b),
    回归基线: a, 回归构建: b,
    层检查一致: JSON.stringify(基线.基础.layersCheck) === JSON.stringify(构建.基础.layersCheck),
    层检查基线: 基线.基础.layersCheck, 层检查构建: 构建.基础.layersCheck,
    共有项: 共有项.map(k => ({ 项: k, 基线: 基线.基础[k], 构建: 构建.基础[k],
                              一致: JSON.stringify(基线.基础[k]) === JSON.stringify(构建.基础[k]) })),
    基线错误: 基线.错误, 构建错误: 构建.错误,
  };

  const 首屏 = 构建.首屏js请求 || [];
  const 单桥后 = 构建.单桥后js请求 || [];
  const 全量后 = 构建.全量后js请求 || [];
  const 首屏含懒块 = 首屏.filter(f => 期望产物.some(p => f.startsWith(p + '-')));
  const 产物命中 = 期望产物.map(p => ({
    边界: p,
    首屏出现: 首屏.some(f => f.startsWith(p + '-')),
    全量后出现: 全量后.some(f => f.startsWith(p + '-')),
    文件: 全量后.filter(f => f.startsWith(p + '-')),
  }));
  const 按需 = {
    首屏js请求: 首屏,
    首屏含懒块: 首屏含懒块,
    单桥后新增: 单桥后.slice(首屏.length),
    全量后新增: 全量后.slice(首屏.length),
    产物命中,
    按需生效: 首屏含懒块.length === 0 && 产物命中.every(x => x.全量后出现),
  };

  const 输出 = { 生成时间: new Date().toISOString(), 对账, 按需,
                基线页: 基线, 构建页: 构建 };
  const 落盘 = path.join(__dirname, '浏览器自检结果.json');
  fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');

  console.log('=== 改动前后对账 ===');
  console.log('回归逐项一致:', 对账.回归逐项一致, ' pass/total:', a && a.pass, a && a.total, ' failed:', a && a.failed);
  console.log('层检查一致:', 对账.层检查一致, '基线 ok:', 基线.基础.layersCheck && 基线.基础.layersCheck.ok,
              '构建 ok:', 构建.基础.layersCheck && 构建.基础.layersCheck.ok);
  console.log('共有项不一致:', 对账.共有项.filter(x => !x.一致));
  console.log('基线页错误:', 基线.错误.slice(0, 5), '构建页错误:', 构建.错误.slice(0, 5));
  console.log('=== 按需产物核对 ===');
  console.log('首屏 js 请求:', 首屏);
  console.log('首屏含懒块:', 首屏含懒块);
  console.log('单桥后新增:', 按需.单桥后新增);
  console.log('全量后新增:', 按需.全量后新增);
  console.log('产物命中:', 产物命中.map(x => x.边界 + ':' + (x.全量后出现 ? 'Y' : 'N')).join(' '));
  console.log('按需生效:', 按需.按需生效);
  console.log('MOD 自检通过:', 构建.MOD && 构建.MOD.自检通过, '配置链通过:', 构建.MOD && 构建.MOD.配置链校验.通过);
  console.log('各模块自检:', Object.keys(构建.各模块 || {}).map(k => k + ':' + (构建.各模块[k].自检 && 构建.各模块[k].自检.通过)).join(' '));
  console.log('加载后回归逐项一致:', JSON.stringify(构建.加载后回归) === JSON.stringify(a));
  console.log('结果已写:', 落盘);
})().catch(e => { console.error('FATAL', e); 服务器.close(); process.exit(1); });
