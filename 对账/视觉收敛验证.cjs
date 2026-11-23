/* 视觉收敛验证（可复跑）
 * 前置：dist 静态服务 或 dev 服务；PAGE_URL 指定地址；VIEW_W/VIEW_H 用用户真实视口 1920x774
 * 判据：
 *   1) 目标元素 computed style / 几何达到修复目标
 *   2) 非目标区域（.main / .side / 表格）几何与修复前逐项一致
 *   3) 修复前后全页截图的像素差异集中在顶部两条（topbar + tabs），表格区 0 差异
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');

const URL_ = process.env.PAGE_URL || 'http://127.0.0.1:8080/index.html';
const VW = +(process.env.VIEW_W || 1920);
const VH = +(process.env.VIEW_H || 774);
const 前图 = path.join(__dirname, '截图', '布局诊断-修复前1920x774.png');
const 前JSON = path.join(__dirname, '布局诊断结果-修复前1920x774.json');

(async () => {
  const 加 = [];
  const 项 = (名, 通过, 详情) => { 加.push({ 名, 通过, 详情 }); if (!通过) console.log(' ❌', 名, JSON.stringify(详情)); };
  const 旧 = JSON.parse(fs.readFileSync(前JSON, 'utf-8'))['数据']['元素'];

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

  const 数据 = await page.evaluate(() => {
    const sels = ['.topbar .logo b', '.topbar .logo span', '.topbar .crumb', '.topbar .crumb b',
      '.user-chip', '.user-chip .avatar', '.user-chip small', '.user-chip strong',
      '.tabs', '.tpl-tab', '.main', '.side', '#main table'];
    const out = {};
    sels.forEach(s => {
      const e = document.querySelector(s);
      if (!e) { out[s] = null; return; }
      const r = e.getBoundingClientRect(), c = getComputedStyle(e);
      out[s] = { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
        fontSize: parseFloat(c.fontSize), fontWeight: +c.fontWeight,
        alignItems: c.alignItems, alignSelf: c.alignSelf, 文本: (e.innerText || '').trim().slice(0, 40) };
    });
    const T = window.TPL || {};
    return {
      元素: out,
      回归: (() => { try { const r = T._regressionRun(); return { pass: r.pass, total: r.total }; } catch (e) { return String(e); } })(),
      层检查: (() => { try { return T._layersCheck().ok; } catch (e) { return String(e); } })(),
      层数: (() => { try { return T._layers().length; } catch (e) { return String(e); } })(),
      有TPL: !!window.TPL, 有MOD: !!window.__MOD__,
    };
  });
  const E = 数据.元素;

  // 1) 目标元素
  项('岗位行字号收到 12px', E['.user-chip small'].fontSize === 12, E['.user-chip small']);
  项('角色行字号 13px 且字重 600（绕过全局 !important）',
    E['.user-chip strong'].fontSize === 13 && E['.user-chip strong'].fontWeight === 600, E['.user-chip strong']);
  项('人员卡片高度收紧且不再贴边',
    E['.user-chip'].h < 旧['.user-chip'].h && E['.user-chip'].h >= 34, { 前: 旧['.user-chip'].h, 后: E['.user-chip'].h });
  项('系统名主标题保持 16px/600 不变',
    E['.topbar .logo b'].fontSize === 16 && E['.topbar .logo b'].fontWeight === 600, E['.topbar .logo b']);
  项('副标题收到 11px，主副层级拉开',
    E['.topbar .logo span'].fontSize === 11, E['.topbar .logo span']);
  项('面包屑弱化为 12px', E['.topbar .crumb'].fontSize === 12, E['.topbar .crumb']);
  项('标签栏垂直居中（tab 不再贴顶）',
    E['.tabs'].alignItems === 'center' && E['.tpl-tab'].alignSelf === 'center' &&
    E['.tpl-tab'].y > 旧['.tpl-tab'].y && E['.tpl-tab'].y < 旧['.tpl-tab'].y + 8,
    { 前y: 旧['.tpl-tab'].y, 后y: E['.tpl-tab'].y, alignItems: E['.tabs'].alignItems });

  // 2) 非目标区域几何不变（表格区另有下方逐像素判据，更强）
  for (const k of ['.main', '.side']) {
    const a = 旧[k], b = E[k];
    const 同 = a && b && ['x', 'y', 'w', 'h'].every(p => Math.abs(a[p] - b[p]) < 0.6);
    项(`${k} 几何与修复前逐项一致`, 同, { 前: a, 后: b });
  }
  项('回归 8/8、层 42、TPL/MOD 均在',
    数据.回归.pass === true && 数据.回归.total === 8 && 数据.层检查 === true &&
    数据.层数 === 42 && 数据.有TPL && 数据.有MOD, 数据);
  项('页面错误 0', 错误.length === 0, 错误);

  // 3) 像素差异：修复前截图 vs 当前，检查表格区（y>=100）零差异、顶部有预期变化
  const 后图 = path.join(__dirname, '截图', '视觉收敛-修复后1920x774.png');
  await page.screenshot({ path: 后图, animations: 'disabled' });
  const A = await sharp(前图).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(后图).raw().toBuffer({ resolveWithObject: true });
  let 顶部差异 = 0, 表格差异 = 0, 总像素 = 0;
  if (A.info.width === B.info.width && A.info.height === B.info.height) {
    const ch = A.info.channels, w = A.info.width;
    for (let y = 0; y < A.info.height; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * ch;
        总像素++;
        let d = 0;
        for (let c = 0; c < 3; c++) if (A.data[i + c] !== B.data[i + c]) { d = 1; break; }
        if (d) { if (y < 100) 顶部差异++; else 表格差异++; }
      }
    }
  }
  项('顶部（y<100）确有预期视觉变化', 顶部差异 > 2000, { 顶部差异 });
  项('表格与主内容区（y>=100）零像素差异', 表格差异 === 0, { 表格差异, 总像素 });

  await ctx.close(); await browser.close();
  const 通过 = 加.every(x => x.通过);
  const 输出 = { 时间: new Date().toISOString(), URL: URL_, 视口: { w: VW, h: VH },
    总通过: 通过, 通过数: `${加.filter(x => x.通过).length}/${加.length}`,
    像素: { 顶部差异, 表格差异, 总像素 }, 项: 加, 修复后: 数据, 页面错误: 错误 };
  const 落盘 = path.join(__dirname, '视觉收敛验证结果.json');
  fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');
  console.log(`=== 视觉收敛验证 ${输出.通过数} 总通过=${通过} ===`);
  console.log('像素: 顶部变化', 顶部差异, ' 表格区差异', 表格差异, '/', 总像素);
  console.log('截图:', 后图, ' 结果:', 落盘);
  if (!通过) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); process.exit(1); });
