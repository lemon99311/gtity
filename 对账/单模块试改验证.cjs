/* 单模块试改验证（6.4-B 口径，可复跑）
 * 用法：NODE_PATH="$(npm root -g)" node 对账/单模块试改验证.cjs
 *
 * 本轮只改 src/list/配置.js：修正视图草稿存储键的派生（VSTORE + ':' + TPL.schema.id）。
 * 验证「不跨块改」：其他 7 个模块自检、整体回归、主启动自检全部保持通过。
 * 不使用 Vue；不注入任何外部资源。
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

// 本脚本是第 12 节「单模块试改」那一阶段的历史产物对账（改 list/配置.js 的存档键）。
// 真拆之后 dist 出现 layer-* 业务 chunk，产物名与数量整体变化，旧断言不再适用。
// 检测到真拆架构时输出说明并正常退出，当前验收以 真拆核对.cjs 为准。
const ROOT0 = path.resolve(__dirname, '..');
if (fs.readdirSync(path.join(ROOT0, 'dist/assets')).some(f => /^layer-/.test(f))) {
  const 说明 = {
    状态: '历史阶段对账，已跳过',
    原因: '检测到真拆架构（dist/assets/layer-* 业务 chunk），产物名与数量整体变化',
    对应阶段: '08 第 12 节 / 07 第 7.3 节：单模块试改 src/list/配置.js',
    当时结论: '16/16 通过；仅 list-config 与 boot 两个产物刷新，boot 变化仅来自 chunk 名替换',
    当前验收脚本: '对账/真拆核对.cjs',
    生成时间: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(__dirname, '单模块试改验证结果.json'), JSON.stringify(说明, null, 2), 'utf-8');
  console.log('=== 单模块试改验证（历史阶段）===');
  console.log(说明.状态, '—', 说明.原因);
  console.log('当时结论:', 说明.当时结论);
  console.log('当前验收请用:', 说明.当前验收脚本);
  process.exit(0);
}

const ROOT = path.resolve(__dirname, '..');
const PORT = 8909;
const HOST = 'http://127.0.0.1:' + PORT;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const 改模块 = 'src/list/配置.js';

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
  let 结果;
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => {
      const u = route.request().url();
      if (u.startsWith(HOST)) return route.continue();
      外部请求.push(u); return route.abort();
    });
    page.on('pageerror', e => 错误.push(String(e).slice(0, 200)));
    await page.goto(HOST + '/dist/index.html', { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => localStorage.clear());
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
      page.evaluate(() => location.reload()).catch(() => {}),
    ]);
    await page.waitForTimeout(1000);

    结果 = await page.evaluate(async () => {
      const W = window, T = W.TPL, M = W.__MOD__, out = {};
      out.schemaId = T.schema.id;
      // 旧写法（直接读常量键）确实拿不到
      out.旧写法 = {
        常量键: 'TPL_VIEW_CFG_V113',
        值: localStorage.getItem('TPL_VIEW_CFG_V113'),
        预期: null,
      };
      // 生成一份草稿存档
      T._vcOpen(); T._vcSave();
      out.真实键 = Object.keys(localStorage).filter(k => k.indexOf('TPL_VIEW_CFG') === 0);
      out.真实键有值 = out.真实键.map(k => ({ k, 字节: (localStorage.getItem(k) || '').length }));

      const m = await M.ensure('列表配置');
      const d = m && m.default;
      out.模块已装载 = !!d;
      if (d) {
        out.派生键 = d.视图存档键();
        out.草稿摘要 = d.读草稿摘要();
        out.模块自检 = d.自检();
        out.标准姿势 = d.标准姿势();
      }
      // 不跨块改：其余 7 个装载点自检仍通过
      const 其余 = ['列表运行时', '表单运行时', '表单配置', '跳转桥',
                    '配置器界面', '渲染器扩展位', '特殊效果扩展位'];
      out.其余模块 = {};
      for (const n of 其余) {
        const x = await M.ensure(n);
        out.其余模块[n] = !!(x && x.default && typeof x.default.自检 === 'function' && x.default.自检().通过);
      }
      out.主启动自检 = M.自检();
      out.回归 = (() => { try { const r = T._regressionRun();
        return { pass: r.pass, total: r.total, failed: (r.failed || []).map(x => x.id) }; }
        catch (e) { return String(e); } })();
      out.层检查 = (() => { try { return T._layersCheck().ok; } catch (e) { return String(e); } })();
      out.已装载 = Object.keys(M.状态.已装载);
      out.参与首屏登记 = M.状态.参与首屏登记;
      out.自动触发 = M.状态.自动触发;
      return out;
    });
    await page.close();
  } finally {
    await browser.close();
    服务器.close();
  }

  const 改前产物 = fs.readFileSync(path.join(__dirname, '单模块构建/改前产物清单.txt'), 'utf-8')
    .trim().split('\n').filter(Boolean);
  const 改后产物 = fs.readdirSync(path.join(ROOT, 'dist/assets'))
    .filter(f => f.endsWith('.js')).sort();
  const 变化 = {
    改前: 改前产物, 改后: 改后产物,
    新增: 改后产物.filter(f => !改前产物.includes(f)),
    消失: 改前产物.filter(f => !改后产物.includes(f)),
    按边界变化: (() => {
      const pre = p => 改前产物.find(f => f.startsWith(p + '-')) || null;
      const post = p => 改后产物.find(f => f.startsWith(p + '-')) || null;
      const 边界 = ['boot', 'list-runtime', 'list-config', 'form-runtime', 'form-config',
                    'bridge', 'console', 'ext-renderer', 'ext-effect'];
      return 边界.map(b => ({ 边界: b, 改前: pre(b), 改后: post(b), 变化: pre(b) !== post(b) }));
    })(),
  };

  // Rollup 会把动态 import 的产物名内联进启动包：list-config 内容变 → 它的 hash 变 →
  // boot 里的引用字符串随之变 → boot 的 hash 也刷新。这是构建层的正常联动，不是跨块改源码。
  // 用上一版交付包留存的改前 boot 逐字对账：仅替换 chunk 名后必须与改后完全一致。
  const 改前boot = fs.readFileSync(path.join(__dirname, '单模块构建/改前boot.js'), 'utf-8');
  const 改后boot名 = 改后产物.find(f => f.startsWith('boot-'));
  const 改后boot = fs.readFileSync(path.join(ROOT, 'dist/assets', 改后boot名), 'utf-8');
  const 旧chunk名 = 改前产物.find(f => f.startsWith('list-config-'));
  const 新chunk名 = 改后产物.find(f => f.startsWith('list-config-'));
  const boot对比 = {
    改前字符: 改前boot.length, 改后字符: 改后boot.length,
    旧chunk名, 新chunk名,
    仅替换chunk名后逐字一致: 改前boot.split(旧chunk名).join(新chunk名) === 改后boot,
    说明: '启动包逻辑代码逐字未变，只有内联的 list-config 产物名随 hash 刷新',
  };
  const 变化边界 = 变化.按边界变化.filter(x => x.变化).map(x => x.边界);

  const 断言 = {
    '旧写法读常量键为 null': 结果.旧写法.值 === null,
    '真实键带 schemaId 后缀': 结果.真实键.length >= 1 &&
      结果.真实键.every(k => k === 'TPL_VIEW_CFG_V113:' + 结果.schemaId),
    '派生键与真实键一致': 结果.派生键 && 结果.真实键.includes(结果.派生键),
    '草稿摘要可读且有存档': 结果.草稿摘要.可用 === true && 结果.草稿摘要.有存档 === true &&
                            结果.草稿摘要.字节 > 0,
    '本模块自检 4 项全通过': 结果.模块自检.通过 === true && 结果.模块自检.项.every(x => x.通过),
    '其余 7 模块自检不受影响': Object.values(结果.其余模块).every(Boolean),
    '主启动自检通过': 结果.主启动自检.通过 === true,
    '回归 8/8': 结果.回归.pass === true && 结果.回归.total === 8,
    '层检查 ok': 结果.层检查 === true,
    '懒加载不参与首屏登记': 结果.参与首屏登记 === false && 结果.自动触发 === false,
    '仅 list-config 与 boot 两个产物刷新': 变化边界.length === 2 &&
      变化边界.includes('list-config') && 变化边界.includes('boot'),
    '其余 7 个 chunk 文件名不变': 变化.按边界变化.filter(x => x.变化).length === 2,
    'boot 变化仅来自 chunk 名替换（逻辑逐字一致）': boot对比.仅替换chunk名后逐字一致 === true,
    '产物数量不变（9 个）': 改前产物.length === 9 && 改后产物.length === 9,
    '无页面错误': 错误.length === 0,
    '无外部请求': 外部请求.length === 0,
  };

  const 输出 = {
    生成时间: new Date().toISOString(),
    口径: '6.4-B 单模块改动；只改 ' + 改模块 + '，不改其他模块、不改构建配置基线、不改既有层',
    改了什么: '新增 视图存档键()；读草稿摘要() 改用派生键；自检() 追加 2 项覆盖；default 导出补一项',
    没动什么: 'src/ 其余 9 个模块、vite.config.js、package.json、index.html 内联层、源文件',
    同类问题待办: 'src/console/配置器界面.js 的 独立存储摘要() 仍直接读常量键 TPL_VIEW_CFG_V113；'
                + '按 6.4-B「不改其他模块任何文件」不跨块修，记为【需用户确认·已跳过】，需单独按 B 指令处理',
    断言, 通过: Object.values(断言).every(Boolean),
    结果, 产物变化: 变化, boot对账: boot对比, 页面错误: 错误, 外部请求,
  };
  const 落盘 = path.join(__dirname, '单模块试改验证结果.json');
  fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');
  console.log('=== 单模块试改验证 ===');
  console.log('总通过:', 输出.通过);
  for (const [k, v] of Object.entries(断言)) console.log(v ? ' ✅' : ' ❌', k);
  console.log('产物变化:', JSON.stringify(变化.按边界变化.filter(x => x.变化)));
  console.log('派生键:', 结果.派生键, '草稿字节:', 结果.草稿摘要.字节);
  console.log('结果已写:', 落盘);
  if (!输出.通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); 服务器.close(); process.exit(1); });
