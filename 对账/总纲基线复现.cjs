/* 总纲 7 项 manual 基线 · 脚本化复现（可复跑）
 * 用法：NODE_PATH="$(npm root -g)" node 对账/总纲基线复现.cjs
 *
 * 口径：
 * - 每项独立 BrowserContext（localStorage 隔离），同一 Chrome，拦截全部非本地请求（不使用 Vue、不注入 CDN）。
 * - 复现对象 L10498–L10506 中 auto:'manual' 的 6 项 + B0-2；B0-1 由 截图对账.cjs 等价复现。
 * - 状态分「通过 / 部分复现 / 未复现」，不把等价复现包装成逐字复现，不把失败包装成通过。
 * - 原步骤来自源文件 STEPS(L10445–L10453) 与 _regression() 清单；脚本只调用既有公开出口，不改源码。
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8906;
const HOST = 'http://127.0.0.1:' + PORT;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const EVIL = "O'B <img src=x onerror=window.__PWNED__=1> <script>window.__PWNED__=2</script>";

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

async function 新页(browser, 标签) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const 错误 = [], 外部请求 = [];
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(HOST)) return route.continue();
    外部请求.push(u);
    return route.abort();
  });
  page.on('pageerror', e => 错误.push(String(e).slice(0, 220)));
  await page.goto(HOST + '/dist/index.html', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => localStorage.clear());
  await 重载(page, () => location.reload());
  return { ctx, page, 错误, 外部请求, 标签 };
}

async function 重载(page, fn) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }).catch(() => {}),
    page.evaluate(fn).catch(() => {}),   // reload 会销毁执行上下文，忽略
  ]);
  await page.waitForTimeout(1100);
}

const 快照 = () => {
  const W = window, T = W.TPL || {}, S = T.schema || {};
  return {
    schemaId: S.id || null,
    存储键: Object.keys(localStorage).sort(),
    视图数: (S.list && S.list.views || []).length,
    列数: (S.list && S.list.columns || []).length,
    标题: document.title,
    表格行: document.querySelectorAll('#tplTbody tr').length,
    hasEl: !!W.__WL_HAS_EL__,
    回归: (() => { try { const r = T._regressionRun(); return { pass: r.pass, total: r.total,
      failed: (r.failed || []).map(x => x.id || JSON.stringify(x)) }; } catch (e) { return { err: String(e) }; } })(),
  };
};

function 收尾(o, 项) {
  return Object.assign(项, {
    页面错误: o.错误.slice(0, 6), 外部请求数: o.外部请求.length,
  });
}

// ---------- B0-2 · supplier 切换与回切 ----------
async function B02(browser) {
  const o = await 新页(browser, 'B0-2');
  try {
    const before = await o.page.evaluate(快照);
    const 有supplier = await o.page.evaluate(() => !!(window.TPL.examples || {}).supplier);
    await 重载(o.page, () => window.TPL.apply(window.TPL.examples.supplier));
    const mid = await o.page.evaluate(快照);
    const 隔离 = await o.page.evaluate(() => ({
      form键: Object.keys(localStorage).filter(k => k.indexOf('TPL_FORM_CFG') === 0),
      view键: Object.keys(localStorage).filter(k => k.indexOf('TPL_VIEW_CFG') === 0),
      schema键: Object.keys(localStorage).filter(k => k.indexOf('TPL_SCHEMA') === 0),
    }));
    await 重载(o.page, () => window.TPL.reset());
    const after = await o.page.evaluate(快照);
    // 原步骤只要求「配置隔离 + 回切无报错」，不要求切换期间 _regressionRun() 通过。
    // 实测 supplier 下 B4-1 会 fail：runCheck('generic') 判据是 ch===false（L10564），
    // 而 L10646 写明「配置生效只在 S.generic 与反推默认不同时可见」——属源码自身口径张力，
    // 不是本次模块化引入，如实记为发现，不拿它当本项判据。
    const 隔离成立 = 有supplier && mid.schemaId !== before.schemaId &&
                     隔离.view键.length >= 2 && 隔离.schema键.length === 1;
    const 通过 = 隔离成立 && after.schemaId === before.schemaId &&
                 after.回归.pass === true && o.错误.length === 0;
    return 收尾(o, { id: 'B0-2', 标题: 'supplier 切换与回切', 状态: 通过 ? '通过' : '失败',
      原步骤: 'TPL.apply(TPL.examples.supplier) → 查配置隔离 → TPL.reset() 回切',
      证据: { before, mid, after, 隔离, 有supplier, 隔离成立,
              发现: 'supplier 业务集下 _regressionRun() 的 B4-1 为 false（failed=' + JSON.stringify(mid.回归.failed) + '）；'
                   + '回切 drugArchive 后恢复 8/8',
              B4_1判据: 'L10564 ch===false && !!g2.specVersion && Object.keys(g2).length>=12',
              B4_1现象说明: 'L10646 默认态包装直通、配置生效只在 S.generic 与反推默认不同时可见' },
      限定: '脚本化复现；按 schemaId 隔离以两套 TPL_VIEW_CFG_V113:<id> 键并存为证；'
          + '切换期间的回归失败是源码判据现象，已单列不混入本项通过条件；未做逐像素截图对照（归 B0-1）' });
  } catch (e) { return 收尾(o, { id: 'B0-2', 状态: '失败', 原因: String(e) }); }
  finally { await o.ctx.close(); }
}

// ---------- B0-3 · 旧版存档升级 ----------
async function B03(browser) {
  const o = await 新页(browser, 'B0-3');
  try {
    // 先生成一份当前版本存档，再改造成「旧版」：改名 / 调序 / 删一个动作 / 用旧版 routes 结构
    await o.page.evaluate(() => { window.TPL._vcOpen(); window.TPL._vcSave(); });
    const 改造 = await o.page.evaluate((evil) => {
      const k = Object.keys(localStorage).find(x => x.indexOf('TPL_VIEW_CFG') === 0);
      const c = JSON.parse(localStorage.getItem(k));
      const 原动作数 = (c.actions || []).length;
      const 原列序 = (c.views[0].cols || []).slice();
      c.views[0].label = '旧版改名 ' + evil;
      c.views[0].cols = 原列序.slice().reverse();
      c.actions = (c.actions || []).slice(1);
      delete c.pageActions;
      c.features = c.features || {};
      c.features.page = { routes: [{ scene: 'legacy', label: '旧版页面路由', page: 'p', mode: 'page', params: 'a=1' }] };
      localStorage.setItem(k, JSON.stringify(c));
      return { 键: k, 原动作数, 原列序, 改后动作数: c.actions.length,
               改后列序: c.views[0].cols, 改名: c.views[0].label };
    }, EVIL);
    await 重载(o.page, () => location.reload());
    const 结果 = await o.page.evaluate((evil) => {
      const W = window, T = W.TPL;
      let vc文本 = null, 动作项 = null, 面板ok = false;
      try { T._vcOpen(); const w = document.getElementById('vcWin');
        vc文本 = w ? w.textContent.slice(0, 1200) : null;
        面板ok = !!w && /on/.test(w.className);
        动作项 = document.querySelectorAll('#vcWin [data-act], #vcWin .act-item, #vcWin .vc-act').length;
      } catch (e) { /* 记录到外层 */ }
      const k = Object.keys(localStorage).find(x => x.indexOf('TPL_VIEW_CFG') === 0);
      let 存档 = null; try { 存档 = JSON.parse(localStorage.getItem(k)); } catch (e) {}
      return {
        改名保留: !!vc文本 && vc文本.indexOf('旧版改名') >= 0,
        恶意串未执行: W.__PWNED__ === undefined,
        面板可打开: 面板ok,
        视图数: 存档 ? (存档.views || []).length : null,
        动作数: 存档 ? (存档.actions || []).length : null,
        列序: 存档 ? (存档.views[0].cols || []).slice(0, 6) : null,
        页面路由归一: !!(存档 && Array.isArray(存档.pageActions) && 存档.pageActions.length > 0),
        表头数: document.querySelectorAll('thead th').length,
        回归: (() => { try { const r = T._regressionRun(); return { pass: r.pass, total: r.total,
          failed: (r.failed || []).map(x => x.id || JSON.stringify(x)) }; } catch (e) { return { err: String(e) }; } })(),
      };
    }, EVIL);
    // 原步骤「改名/调序/已删动作与视图不丢」按「用户侧改动在升级后保持」口径判定：
    // 被删的动作保持删除（不被 mergeNewActions 复活），改名/调序/视图数保持，旧版 routes 归一为 pageActions。
    const 断言 = {
      改名保留: 结果.改名保留,
      调序保留: JSON.stringify(结果.列序) === JSON.stringify(改造.改后列序.slice(0, 6)),
      已删动作保持: 结果.动作数 === 改造.改后动作数,
      旧版路由归一: 结果.页面路由归一,
      视图数保持: 结果.视图数 === 8,
      恶意串未执行: 结果.恶意串未执行,
      面板可打开: 结果.面板可打开,
      回归通过: 结果.回归.pass === true,
      无页面错误: o.错误.length === 0,
    };
    const 通过 = Object.values(断言).every(Boolean);
    return 收尾(o, { id: 'B0-3', 标题: '旧版存档升级', 状态: 通过 ? '通过' : '部分复现',
      原步骤: '预置旧版 localStorage 存档 → reload → 查改名/调序/已删动作与视图不丢',
      证据: { 改造, 结果, 断言 },
      限定: '脚本化等价复现。「旧版」形态由脚本按 L4118–L4134 / L4170–L4189 的归一化输入构造，'
          + '源文件未给出具体旧存档样例；「调序」只核对存档列序与表头存在，未逐项比对每列 DOM 位置；'
          + '措辞有歧义——此处按「用户改动不丢失」判定（动作数 13 保持 13，未被复活）；'
          + '若按「mergeNewActions 应补回被删动作」口径则结论相反，源文件 L10449 未写明取哪一种' });
  } catch (e) { return 收尾(o, { id: 'B0-3', 状态: '失败', 原因: String(e) }); }
  finally { await o.ctx.close(); }
}

// ---------- B0-4 · 三处配置保存→刷新生效 ----------
async function B04(browser) {
  const o = await 新页(browser, 'B0-4');
  try {
    const 可用出口 = await o.page.evaluate(() => ['_vcOpen', '_vcSave', '_formOpen', '_formSave',
      '_actSave', '_pageSave'].filter(k => typeof window.TPL[k] === 'function'));
    await o.page.evaluate(() => {
      const T = window.TPL;
      T._vcOpen(); T._vcSave();
      T._formOpen(); T._formSave();
      if (typeof T._actSave === 'function') { try { T._vcMode('features'); T._actSave(); } catch (e) {} }
      if (typeof T._pageSave === 'function') { try { T._vcMode('features'); T._pageSave(); } catch (e) {} }
    });
    const 保存后 = await o.page.evaluate(() => ({ 键: Object.keys(localStorage).sort() }));
    await 重载(o.page, () => location.reload());
    const 复查 = await o.page.evaluate(() => {
      const T = window.TPL, out = { 三套键: {}, 表单配置可读: false, 面板: {}, 回归: null };
      ['TPL_VIEW_CFG', 'TPL_FORM_CFG'].forEach(p => {
        const k = Object.keys(localStorage).find(x => x.indexOf(p) === 0);
        out.三套键[p] = k ? { 存在: true, 字节: (localStorage.getItem(k) || '').length } : { 存在: false };
      });
      try { out.表单配置可读 = !!(T._formConfig && T._formConfig()); } catch (e) { out.表单配置可读 = String(e); }
      try { T._vcOpen(); out.面板.vcWin = !!document.getElementById('vcWin'); } catch (e) { out.面板.vcWin = String(e); }
      try { T._formOpen(); out.面板.formWin = !!document.getElementById('formWin'); } catch (e) { out.面板.formWin = String(e); }
      try { const r = T._regressionRun(); out.回归 = { pass: r.pass, total: r.total }; } catch (e) { out.回归 = String(e); }
      return out;
    });
    const 通过 = 复查.三套键.TPL_VIEW_CFG.存在 && 复查.三套键.TPL_FORM_CFG.存在 &&
                 复查.表单配置可读 === true && 复查.面板.vcWin === true &&
                 复查.面板.formWin === true && 复查.回归.pass === true && o.错误.length === 0;
    return 收尾(o, { id: 'B0-4', 标题: '三处配置保存→刷新生效', 状态: 通过 ? '通过' : '部分复现',
      原步骤: 'TPL._vcOpen()/_vcSave()、TPL._formOpen()/_formSave()、功能设置保存 → reload 复查',
      证据: { 可用出口, 保存后, 复查 },
      限定: '功能设置保存用 _actSave/_pageSave 出口等价触发，未通过真实点击「功能设置」面板按钮逐字复现；'
          + '复查的是三套键存在、面板可开、配置可读、回归通过，未逐项比对改动的具体列/字段值' });
  } catch (e) { return 收尾(o, { id: 'B0-4', 状态: '失败', 原因: String(e) }); }
  finally { await o.ctx.close(); }
}

// ---------- B0-5 · 键盘流全链路 ----------
async function B05(browser) {
  const o = await 新页(browser, 'B0-5');
  try {
    // 明细表渲染出来的 DOM 是 .dt-wrap / .dt-tbl（L7381–L7388），不是配置里的 renderer 名 editable-table；
    // 键盘委托在 L7616 的 document 级，且 L7357 对 lookup 列会先打开选录浮层、不写 __WL_DT_FLOW__。
    // 因此用「非 lookup 的明细列 + 真实键盘 Enter」复现流转，另用 lookup 列复现选录浮层。
    const 载入 = await o.page.evaluate(() => {
      const T = window.TPL;
      T._formOpen();
      if (typeof T._formLoadPreset === 'function') T._formLoadPreset(true);
      T._open(0, 'edit');
      const q = s => document.querySelectorAll(s).length;
      let flowEnabled = null;
      try {
        const secs = (((T._formConfig() || {}).layout || {}).sections) || [];
        const d = secs.find(x => x.renderer === 'editable-table');
        if (d) flowEnabled = ((d.spec || {}).flow || {}).enabled;
      } catch (e) { flowEnabled = String(e); }
      return {
        mask: (document.getElementById('mask') || {}).className || null,
        drawer: (document.getElementById('drawer') || {}).className || null,
        dtWrap: q('.dt-wrap'), dtTbl: q('.dt-tbl'), dtRow: q('.dt-tbl tbody tr[data-rk]'),
        dtInput: q('.dt-wrap input[data-col]'), 新增行按钮: q('.dt-btn[data-act="add"]'),
        普通列: [...document.querySelectorAll('.dt-wrap input[data-col]:not(.lookup)')].map(e => e.getAttribute('data-col')),
        选录列: [...document.querySelectorAll('.dt-wrap input.lookup[data-col]')].map(e => e.getAttribute('data-col')),
        flowEnabled,
      };
    });

    // ① 选录浮层完整键链：Enter 打开 → 清空关键字恢复候选 → ↓↓ / ↑ → Enter 确认回填 → 重绘重定位 → Esc
    const 浮层 = await (async () => {
      const loc = o.page.locator('.dt-wrap input.lookup[data-col]').first();
      if (await loc.count() === 0) return { 触发: false, 原因: '无 lookup 明细列' };
      const 读 = () => o.page.evaluate(() => {
        const D = window.DETAIL, L = window.__WL_DT_LOOKUP__;
        const box = document.getElementById('dtLookup');
        return {
          on: /on/.test((box || {}).className || ''),
          active: L ? L.active : null,
          候选数: L ? L.candidates : null,
          状态active: (D && D.lookupState || {}).active,
          状态list: (D && D.lookupState || {}).list ? D.lookupState.list.length : null,
          口径: '后追加层改写了浮层 DOM（无 #dtLkKw / [data-lk=pick]），故用 __WL_DT_LOOKUP__ 与 lookupState 观测',
        };
      });
      const 触发值 = await loc.inputValue();
      await loc.focus();
      await o.page.keyboard.press('Enter');
      await o.page.waitForTimeout(340);
      const 打开 = await 读();
      // 触发格自带值会按 match 过滤候选（L7441–L7443）：源 14 条被过滤到 1 条，
      // 使得 L7310 的 (0±1+1)%1 恒为 0。清空关键字后候选恢复，↑↓ 才可观测 —— 上版判为「数据限制」是错的。
      const 清空 = await o.page.evaluate(() => { window.TPL._dtLookupFilter(''); return 'ok'; });
      await o.page.waitForTimeout(200);
      const 清空后 = await 读();
      await o.page.keyboard.press('ArrowDown');
      await o.page.waitForTimeout(160);
      const 下一 = await 读();
      await o.page.keyboard.press('ArrowDown');
      await o.page.waitForTimeout(160);
      const 下二 = await 读();
      await o.page.keyboard.press('ArrowUp');
      await o.page.waitForTimeout(160);
      const 上一 = await 读();
      await o.page.keyboard.press('Enter');
      await o.page.waitForTimeout(420);
      const 确认 = await o.page.evaluate(() => {
        const L = window.__WL_DT_LOOKUP__, F = window.__WL_DT_FOCUS__;
        return {
          on: /on/.test((document.getElementById('dtLookup') || {}).className || ''),
          L: L ? { open: L.open, picked: !!L.picked, rowKey: L.rowKey, col: L.col } : null,
          F: F ? { col: F.col, rowKey: F.rowKey, selected: F.selected } : null,
          行数: document.querySelectorAll('.dt-tbl tbody tr[data-rk]').length,
        };
      });
      // 再打开一次验证 Esc
      const loc2 = o.page.locator('.dt-wrap input.lookup[data-col]').first();
      await loc2.focus();
      await o.page.keyboard.press('Enter');
      await o.page.waitForTimeout(260);
      const esc前 = await o.page.evaluate(() => /on/.test((document.getElementById('dtLookup') || {}).className || ''));
      await o.page.keyboard.press('Escape');
      await o.page.waitForTimeout(240);
      const esc后 = await o.page.evaluate(() => /on/.test((document.getElementById('dtLookup') || {}).className || ''));
      return { 触发: true, 触发值, 清空, 打开, 清空后, 下一, 下二, 上一, 确认, esc前, esc后 };
    })();

    // ② 5 轮：非 lookup 明细输入上按真实 Enter，逐轮读 FLOW / FOCUS / 行数 / rowKey
    const 轮 = [];
    for (let i = 0; i < 5; i++) {
      const 目标列 = 载入.普通列.length ? 载入.普通列[i % 载入.普通列.length] : null;
      if (!目标列) { 轮.push({ n: i, 错: '无非 lookup 明细列' }); continue; }
      const loc = o.page.locator(`.dt-wrap input[data-col="${目标列}"]:not(.lookup)`).first();
      if (await loc.count() === 0) { 轮.push({ n: i, 目标列, 错: '重绘后未找到该列' }); continue; }
      await loc.focus();
      await o.page.keyboard.press('Enter');
      await o.page.waitForTimeout(200);
      const r = await o.page.evaluate((n) => {
        const W = window, F = W.__WL_DT_FLOW__, C = W.__WL_DT_FOCUS__;
        return {
          n,
          FLOW: F ? { op: F.op, from: F.from, to: F.to, rowKey: F.rowKey } : null,
          FOCUS: C ? { col: C.col, rowKey: C.rowKey, selected: C.selected, scrollY: C.scrollY,
                       scroll: C.scroll || null } : null,
          行数: document.querySelectorAll('.dt-tbl tbody tr[data-rk]').length,
        };
      }, i);
      轮.push(Object.assign({ 目标列 }, r));
    }

    // ③ 滚动保持：把目标滚进视口后记为基准，再用「页面内 focus({preventScroll:true})」触发。
    //    上版用 Playwright locator.focus()，它会自行把元素滚进视口 —— 那是工具副作用，
    //    不是应用行为，导致误判「tplMain 容器滚动未保持」。本版纠正口径后测应用内部重绘前后的保持。
    const 滚动 = await (async () => {
      const loc = o.page.locator('.dt-wrap input[data-col]:not(.lookup)').first();
      await loc.scrollIntoViewIfNeeded();
      await o.page.waitForTimeout(150);
      const 基准 = await o.page.evaluate(() => {
        const m = document.getElementById('tplMain');
        return { main: (m || {}).scrollTop ?? null, y: window.scrollY,
                 doc: document.documentElement.scrollTop,
                 dw: (document.getElementById('dwBody') || {}).scrollTop ?? null,
                 可滚: !!m && m.scrollHeight > m.clientHeight };
      });
      await o.page.evaluate(() => {
        const el = document.querySelector('.dt-wrap input[data-col]:not(.lookup)');
        if (el) el.focus({ preventScroll: true });
      });
      await o.page.waitForTimeout(120);
      const 聚焦后 = await o.page.evaluate(() => {
        const m = document.getElementById('tplMain');
        return { main: (m || {}).scrollTop ?? null, y: window.scrollY,
                 doc: document.documentElement.scrollTop };
      });
      await o.page.keyboard.press('Enter');
      await o.page.waitForTimeout(340);
      const Enter后 = await o.page.evaluate(() => {
        const F = window.__WL_DT_FOCUS__;
        return { main: (document.getElementById('tplMain') || {}).scrollTop ?? null,
                 y: window.scrollY, doc: document.documentElement.scrollTop,
                 FOCUS: F ? { col: F.col, selected: F.selected, scroll: F.scroll || null } : null };
      });
      const 保持 = 基准.可滚 && 基准.main === 聚焦后.main && 基准.main === Enter后.main &&
                   基准.y === Enter后.y && 基准.doc === Enter后.doc &&
                   !!(Enter后.FOCUS && Enter后.FOCUS.scroll) &&
                   Enter后.FOCUS.scroll.main === 基准.main;
      return { 基准, 聚焦后, Enter后, 保持,
               口径: '页面内 el.focus({preventScroll:true})；不把 Playwright locator.focus() 的滚动副作用计入' };
    })();

    const 回归 = await o.page.evaluate(() => { try { const r = window.TPL._regressionRun();
      return { pass: r.pass, total: r.total }; } catch (e) { return String(e); } });
    const 有流转 = 轮.some(x => x.FLOW), 有焦点 = 轮.some(x => x.FOCUS);
    const ops = [...new Set(轮.filter(x => x.FLOW).map(x => x.FLOW.op))].sort();
    const 三种op齐 = ['append', 'next', 'reuse-empty'].every(k => ops.includes(k));
    const to与焦点一致 = 轮.every(x => !x.FLOW || !x.FOCUS || x.FLOW.to === x.FOCUS.col);
    const 容器滚动保持 = 滚动.保持;
    const 窗口层滚动不跳 = 轮.every(x => !x.FOCUS || !x.FOCUS.scroll ||
      (x.FOCUS.scroll.y === 0 && x.FOCUS.scroll.doc === 0 && x.FOCUS.scroll.dw === 0));
    const 清空后候选多 = 浮层.清空后.候选数 > 1 && 浮层.清空后.状态list > 1;
    const active序列 = [浮层.清空后.active, 浮层.下一.active, 浮层.下二.active, 浮层.上一.active];
    const 上下键可观测 = 浮层.下一.on === true && 浮层.下二.on === true && 浮层.上一.on === true &&
      active序列[0] === 0 && active序列[1] === 1 && active序列[2] === 2 && active序列[3] === 1 &&
      [浮层.下一, 浮层.下二, 浮层.上一].every(x => x.状态active === x.active);
    const 断言 = {
      '明细表已载入': 载入.dtWrap >= 1 && 载入.dtInput >= 1 && 载入.flowEnabled === true,
      '选录浮层可打开': 浮层.打开 && 浮层.打开.on === true && 浮层.打开.候选数 >= 1,
      '清空关键字后候选恢复为多条': 清空后候选多,
      '↓/↓/↑ 的 active 为 1/2/1 且与 lookupState 同步': 上下键可观测,
      'Enter 确认回填成功': !!(浮层.确认.L && 浮层.确认.L.open === false && 浮层.确认.L.picked === true),
      '重绘后 rowKey 重定位一致': !!(浮层.确认.F && 浮层.确认.L &&
        浮层.确认.F.rowKey === 浮层.确认.L.rowKey),
      'Esc 取消浮层': 浮层.esc前 === true && 浮层.esc后 === false,
      '5 轮 FLOW 覆盖 next/append/reuse-empty': 有流转 && 三种op齐,
      'FLOW.to 与 FOCUS.col 逐轮一致': 有焦点 && to与焦点一致,
      '聚焦全选 selectOnFocus': 轮.every(x => x.FOCUS && x.FOCUS.selected === true),
      'tplMain 容器层滚动保持（页面内 preventScroll 口径）': 容器滚动保持,
      'window / documentElement / dwBody 层滚动不跳': 窗口层滚动不跳,
      '回归 8/8': 回归.pass === true && 回归.total === 8,
      '无页面错误': o.错误.length === 0,
    };
    const 基本通过 = Object.values(断言).every(Boolean);
    return 收尾(o, { id: 'B0-5', 标题: '键盘流全链路与滚动不跳',
      状态: 基本通过 ? '通过' : '部分复现',
      原步骤: '载入入库单示例 → 编辑态 5 轮键盘录入 → 查 __WL_DT_FLOW__/__WL_DT_FOCUS__/__WL_DT_LOOKUP__',
      证据: { 载入, 浮层, 轮, 滚动, 回归, ops, 有流转, 有焦点, 三种op齐, to与焦点一致,
              容器滚动保持, 窗口层滚动不跳, 清空后候选多, active序列, 上下键可观测, 断言, 基本通过,
              DOM口径: 'editable-table 是配置里的 renderer 名；实际 DOM 类名 .dt-wrap / .dt-tbl / tr[data-rk]（L7381–L7388）',
              委托口径: 'document 级 keydown 委托（L7616）；lookup 列 Enter 优先打开选录浮层（L7357）',
              浮层DOM口径: '后追加层改写了浮层 DOM，无 #dtLkKw / [data-lk=pick]；候选与高亮用 __WL_DT_LOOKUP__ / lookupState 观测' },
      限定: '上版两条「缺口」已定位为断言设计问题并撤销，不是应用缺陷：(a) ↑↓ 无变化是触发格自带值 '
          + '（如 "HQ"）按 match 过滤 14 条源到 1 条，(0±1+1)%1 恒为 0；调 TPL._dtLookupFilter("") '
          + '清空后候选恢复 14 条，↓/↓/↑ 的 active = 1/2/1，与 lookupState.active 同步。'
          + '(b) 「tplMain 滚动未保持」是 Playwright locator.focus() 自行把元素滚进视口造成的工具副作用；'
          + '改用页面内 el.focus({preventScroll:true}) 后，基准 / 聚焦后 / Enter 后三层滚动全部保持，'
          + '且 __WL_DT_FOCUS__.scroll.main 与基准一致。'
          + '__M__ 静置 2200ms 未逐字复现（该部分由 B2-1 auto 的 ready 自检覆盖）；'
          + '浮层 DOM 被后追加层改写，故不按 #dtLkKw / [data-lk=pick] 断言，改用状态对象' });
  } catch (e) { return 收尾(o, { id: 'B0-5', 状态: '失败', 原因: String(e) }); }
  finally { await o.ctx.close(); }
}

// ---------- B0-6 · 预校验/关闭/还原/结果页三态 ----------
async function B06(browser) {
  const o = await 新页(browser, 'B0-6');
  try {
    await o.page.evaluate(() => { window.TPL._open(0, 'edit'); });
    const 态 = {};
    const 跑 = async (名, fn, 等待) => {
      await o.page.evaluate(fn);
      if (等待 === 0) 态[名] = await o.page.evaluate(() => ({
        state: (document.getElementById('srSheet') || {}).getAttribute
          ? document.getElementById('srSheet').getAttribute('data-state') : null,
        标题: (document.querySelector('#srSheet .ss-h1') || {}).textContent || null,
        按钮: [...document.querySelectorAll('#srSheet .acts button')].map(b => b.textContent.trim()),
      }));
      await o.page.waitForTimeout(等待);
      if (等待 > 0) 态[名] = await o.page.evaluate(() => ({
        state: (document.getElementById('srSheet') || {}).getAttribute
          ? document.getElementById('srSheet').getAttribute('data-state') : null,
        标题: (document.querySelector('#srSheet .ss-h1') || {}).textContent || null,
        按钮: [...document.querySelectorAll('#srSheet .acts button')].map(b => b.textContent.trim()),
      }));
    };
    await 跑('ok-loading', () => { window.TPL.forceResult = 'ok'; window.TPL._save(); }, 0);
    await o.page.waitForTimeout(700);
    态['ok-success'] = await o.page.evaluate(() => ({
      state: document.getElementById('srSheet').getAttribute('data-state'),
      标题: (document.querySelector('#srSheet .ss-h1') || {}).textContent || null,
      按钮: [...document.querySelectorAll('#srSheet .acts button')].map(b => b.textContent.trim()),
    }));
    await o.page.evaluate(() => window.TPL._closeResult());
    await 跑('fail-loading', () => { window.TPL.forceResult = 'fail'; window.TPL._save(); }, 0);
    await o.page.waitForTimeout(700);
    态['fail'] = await o.page.evaluate(() => ({
      state: document.getElementById('srSheet').getAttribute('data-state'),
      标题: (document.querySelector('#srSheet .ss-h1') || {}).textContent || null,
      按钮: [...document.querySelectorAll('#srSheet .acts button')].map(b => b.textContent.trim()),
    }));
    await o.page.evaluate(() => window.TPL._retry());
    await o.page.waitForTimeout(700);
    态['retry-success'] = await o.page.evaluate(() => ({
      state: document.getElementById('srSheet').getAttribute('data-state'),
      标题: (document.querySelector('#srSheet .ss-h1') || {}).textContent || null,
    }));
    // 提交途中关闭：检查不污染
    await o.page.evaluate(() => { window.TPL._closeResult(); window.TPL._save(); window.TPL._close(); });
    await o.page.waitForTimeout(700);
    态['提交途中关闭'] = await o.page.evaluate(() => ({
      sheet: document.getElementById('srSheet').className,
      mask: document.getElementById('mask').className,
      drawer: document.getElementById('drawer').className,
    }));
    const 配置文案 = await o.page.evaluate(() => {
      const R = (window.TPL.schema || {}).result || {};
      return { okTitle: R.okTitle || null, failTitle: R.failTitle || null, pendingTitle: R.pendingTitle || null };
    });

    // ---- 补充 A：干净默认态下 preValidateTasks 的任务数 ----
    await 重载(o.page, () => location.reload());
    const 预校验默认 = await o.page.evaluate(() => {
      const D = window.DETAIL, T = window.TPL;
      const 有出口 = !!D && typeof D.preValidateTasks === 'function';
      let 任务数 = null;
      if (有出口) { try { const t = D.preValidateTasks({}, {}); 任务数 = Array.isArray(t) ? t.length : null; }
                    catch (e) { 任务数 = String(e); } }
      const secs = (((T._formConfig() || {}).layout || {}).sections) || [];
      return { 有出口, 任务数, 区块数: secs.length,
               可编辑区块数: secs.filter(s => s.renderer === 'editable-table').length,
               说明: '干净默认态（未载入入库单预设）无 editable-table 区块 → 0 任务；预校验由配置驱动' };
    });

    // ---- 补充 B：通过公开出口开启异步预校验，跑 fail / success 两条路径 ----
    const 开启 = await o.page.evaluate(() => {
      const T = window.TPL;
      T._formOpen(); T._formLoadPreset(true); T._formOpen();
      const secs = (((T._formConfig() || {}).layout || {}).sections) || [];
      const s = secs.find(x => x.renderer === 'editable-table');
      if (!s) return { err: '无 editable-table 区块' };
      T._dtSpec(s.id, 'preValidate', 'enabled', true);
      T._dtSpec(s.id, 'preValidate', 'limit', -1);   // 让 rule `amount <= limit` 必然失败
      T._formSave();
      const 后置 = ((((T._formConfig() || {}).layout || {}).sections) || []).find(x => x.id === s.id);
      return { id: s.id, preValidate: 后置 && 后置.spec && 后置.spec.preValidate || null,
               口径: '只改运行时配置草稿（_dtSpec + _formSave），不改源码、不回写业务定义源' };
    });
    await o.page.evaluate(() => { const T = window.TPL; T._open(0, 'edit'); T.forceResult = 'ok'; T._save(); });
    await o.page.waitForTimeout(1000);
    const 预校验失败 = await o.page.evaluate(() => {
      const x = window.__WL_PREVALIDATE__, b3 = window.__WL_B3_PREVALIDATE__;
      return {
        WL: x ? { ok: x.ok, result: x.result ? { secId: x.result.secId, api: x.result.api,
                   amount: x.result.amount, limit: x.result.limit, message: x.result.message } : null,
                   resultsLen: (x.results || []).length } : null,
        B3: b3 || null,
        errOn: document.querySelectorAll('.dt-err.on').length,
        errText: [...document.querySelectorAll('.dt-err.on')].map(e => e.textContent.slice(0, 60)),
        sheetClass: document.getElementById('srSheet').className,
        sheetState: document.getElementById('srSheet').getAttribute('data-state'),
      };
    });
    const 开启成功 = await o.page.evaluate(() => {
      const T = window.TPL;
      T._formOpen();
      const secs = (((T._formConfig() || {}).layout || {}).sections) || [];
      const s = secs.find(x => x.renderer === 'editable-table');
      if (!s) return { err: '无 editable-table 区块' };
      T._dtSpec(s.id, 'preValidate', 'limit', 1e9);
      T._formSave();
      window.__WL_PREVALIDATE__ = undefined;
      T._open(0, 'edit'); T.forceResult = 'ok'; T._save();
      return { preValidate: ((((T._formConfig() || {}).layout || {}).sections) || [])
        .find(x => x.id === s.id).spec.preValidate };
    });
    await o.page.waitForTimeout(1000);
    const 预校验成功 = await o.page.evaluate(() => {
      const x = window.__WL_PREVALIDATE__;
      return { WL: x ? { ok: x.ok, resultsLen: (x.results || []).length,
                         first: (x.results || [])[0] || null } : null,
               sheetState: document.getElementById('srSheet').getAttribute('data-state') };
    });

    // ---- 补充 C：直接调用 DETAIL.commit / restore，不再只靠 _close 包装间接覆盖 ----
    const 状态API = await o.page.evaluate(() => {
      const D = window.DETAIL;
      const o1 = { __dtState: { origin: { a: 1 }, sumOrigin: { s: 2 } }, a: 999, s: 888 };
      const before = JSON.parse(JSON.stringify(o1));
      D.restore(o1);
      const o2 = { __dtState: { x: 1 }, k: 5 };
      D.commit(o2);
      return { restore: { before, after: o1 }, commit: { 有dtState: '__dtState' in o2, k: o2.k } };
    });

    const 回归 = await o.page.evaluate(() => { try { const r = window.TPL._regressionRun();
      return { pass: r.pass, total: r.total }; } catch (e) { return String(e); } });
    const 三态齐 = 态['ok-loading'].state === 'loading' && 态['ok-success'].state === 'success' &&
                   态['fail-loading'].state === 'loading' && 态.fail.state === 'fail' &&
                   态['retry-success'].state === 'success';
    const 预校验齐 = 预校验默认.有出口 === true && 预校验默认.任务数 === 0 &&
      !!(开启.preValidate && 开启.preValidate.enabled === true) &&
      !!(预校验失败.WL && 预校验失败.WL.ok === false) && 预校验失败.errOn >= 1 &&
      预校验失败.sheetClass === 'sr-sheet' &&
      !!(预校验成功.WL && 预校验成功.WL.ok === true) && 预校验成功.WL.resultsLen >= 1 &&
      预校验成功.sheetState === 'success' &&
      状态API.restore.after.a === 1 && 状态API.restore.after.s === 2 &&
      !('__dtState' in 状态API.restore.after) &&
      状态API.commit.有dtState === false && 状态API.commit.k === 5;
    const 断言 = { 三态齐, 预校验齐, 回归通过: 回归.pass === true, 无页面错误: o.错误.length === 0 };
    const 通过 = Object.values(断言).every(Boolean);
    return 收尾(o, { id: 'B0-6', 标题: '预校验/关闭/还原/结果页三态',
      状态: 通过 ? '通过' : '部分复现',
      原步骤: 'TPL.forceResult="fail"/"ok"、提交途中 TPL._close()、DETAIL.commit/restore、结果页重试/返回',
      证据: { 态, 配置文案, 预校验默认, 开启, 预校验失败, 开启成功, 预校验成功, 状态API, 回归, 断言 },
      限定: '三态 data-state、配置文案、重试/关闭/提交途中关闭已复现；本轮补齐：干净默认态 '
          + 'preValidateTasks 返回 0 任务、通过 _dtSpec/_formSave 开启后的异步预校验 fail 路径'
          + '（__WL_PREVALIDATE__.ok=false、__WL_B3_PREVALIDATE__、.dt-err.on、结果页被阻断）与 success 路径'
          + '（ok=true、results 1 项、结果页 success），以及直接调用 DETAIL.commit/restore 验证状态还原。'
          + '预校验接口是配置里的 mock（/api/credit/check，延迟 120ms），通过运行时配置草稿开启，不改源码、'
          + '不回写业务定义源；逐像素三态对照归 B0-1 口径，不在本项复现' });
  } catch (e) { return 收尾(o, { id: 'B0-6', 状态: '失败', 原因: String(e) }); }
  finally { await o.ctx.close(); }
}

// ---------- B1-1 · 特殊字符与片段化标记注入 ----------
async function B11(browser) {
  const o = await 新页(browser, 'B1-1');
  try {
    const 注入 = await o.page.evaluate((evil) => {
      const T = window.TPL;
      T._vcOpen(); T._vcSave(); T._formOpen(); T._formSave();
      const vk = Object.keys(localStorage).find(x => x.indexOf('TPL_VIEW_CFG') === 0);
      const fk = Object.keys(localStorage).find(x => x.indexOf('TPL_FORM_CFG') === 0);
      const v = JSON.parse(localStorage.getItem(vk));
      v.views[0].label = evil;
      if (v.actions && v.actions.length) v.actions[0].label = evil;
      localStorage.setItem(vk, JSON.stringify(v));
      const f = JSON.parse(localStorage.getItem(fk));
      const secs = (((f || {}).layout || {}).sections) || [];
      if (secs.length) { secs[0].id = evil; secs[0].title = evil; }
      localStorage.setItem(fk, JSON.stringify(f));
      return { 视图键: vk, 表单键: fk, 区块数: secs.length, 注入串: evil };
    }, EVIL);
    await 重载(o.page, () => location.reload());
    const 结果 = await o.page.evaluate(() => {
      const W = window, T = W.TPL, out = {};
      out.__PWNED__ = W.__PWNED__ === undefined ? 'undefined' : String(W.__PWNED__);
      try { const g = T._guard().scan(); out.guard = { elements: g.elements,
        badAttrs: g.badAttrs.length, scripts: g.scripts.length }; } catch (e) { out.guard = String(e); }
      try { T._vcOpen(); out.vcWin = /on/.test((document.getElementById('vcWin') || {}).className || ''); }
      catch (e) { out.vcWin = String(e); }
      try { T._formOpen(); out.formWin = !!document.getElementById('formWin'); }
      catch (e) { out.formWin = String(e); }
      try { T._open(0, 'edit'); out.drawer = /on/.test((document.getElementById('drawer') || {}).className || ''); }
      catch (e) { out.drawer = String(e); }
      try { const r = T._regressionRun(); out.回归 = { pass: r.pass, total: r.total,
        failed: (r.failed || []).map(x => x.id || JSON.stringify(x)) }; } catch (e) { out.回归 = String(e); }
      out.无注入脚本节点 = [...document.querySelectorAll('script')]
        .every(s => !(s.textContent || '').includes('__PWNED__=2'));
      return out;
    });
    const 通过 = 结果.__PWNED__ === 'undefined' && 结果.guard.badAttrs === 0 &&
                 结果.guard.scripts === 0 && 结果.vcWin === true && 结果.formWin === true &&
                 结果.drawer === true && 结果.回归.pass === true && 结果.无注入脚本节点 === true &&
                 o.错误.length === 0;
    return 收尾(o, { id: 'B1-1', 标题: '特殊字符与片段化标记注入', 状态: 通过 ? '通过' : '失败',
      原步骤: "localStorage 动作名称/视图名/区块 id/列标题/图标片段写入 O'B <img src=x onerror=...> 与 <script> → reload",
      证据: { 注入, 结果 },
      限定: '注入覆盖视图名/动作名/区块 id 与标题；列标题、图标片段未逐项注入。'
          + '按 L10637 的限制，esc 二次写入的实体还原根因未根治，靠非白名单 on* 规则兜底，本项只验证「不执行 / 不报错 / 不破版」' });
  } catch (e) { return 收尾(o, { id: 'B1-1', 状态: '失败', 原因: String(e) }); }
  finally { await o.ctx.close(); }
}

(async () => {
  await new Promise(r => 服务器.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const 结果 = [];
  try {
    for (const fn of [B02, B03, B04, B05, B06, B11]) {
      const r = await fn(browser);
      结果.push(r);
      console.log(`${r.状态 === '通过' ? '✅' : r.状态 === '失败' ? '❌' : '⚠️'} ${r.id} ${r.标题} → ${r.状态}`
        + (r.页面错误 && r.页面错误.length ? ` 页面错误:${JSON.stringify(r.页面错误)}` : ''));
    }
  } finally {
    await browser.close();
    服务器.close();
  }
  const 汇总 = {
    生成时间: new Date().toISOString(),
    口径: '工程内脚本化复现；每项独立 BrowserContext；不使用 Vue、不注入 CDN、不点亮增强分支',
    对照: { 'B0-1': '由 截图对账.cjs 等价复现（双页 0 像素差）',
            'B0-2..B0-6 + B1-1': '本脚本',
            'auto 8 项': '由 浏览器自检.cjs / TPL._regressionRun() 覆盖' },
    统计: 结果.reduce((a, r) => { a[r.状态] = (a[r.状态] || 0) + 1; return a; }, {}),
    结果,
  };
  const 落盘 = path.join(__dirname, '总纲基线复现结果.json');
  fs.writeFileSync(落盘, JSON.stringify(汇总, null, 2), 'utf-8');
  console.log('\n统计:', JSON.stringify(汇总.统计));
  console.log('结果已写:', 落盘);
})().catch(e => { console.error('FATAL', e); 服务器.close(); process.exit(1); });
