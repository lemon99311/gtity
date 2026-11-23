/* 00 的【待核】2 / 3 / 4 回源证据抽取与逐条校验（可复跑）
 * 用法：node 对账/待核证据抽取.cjs
 * 只读基线原件与已有结果 JSON，不启浏览器、不改任何文件。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const L = fs.readFileSync(path.join(ROOT, '对账/基线原件.html'), 'utf-8').split('\n');
const 行 = n => L[n - 1] || '';

// 逐层「版本口径 → 实见标识」的人工回源对照，脚本负责逐条验证行号与字符串
const 十层 = [
  { 层: 'b1', 标识: ['tpl-b1-guard-early', 'tpl-b1-guard'], 形态: 'script[id] 两套（early / late）', 行: [3778, 9224] },
  { 层: 'b2', 标识: ['tpl-b2-redraw-early', 'tpl-b2-redraw'], 形态: 'script[id] 两套（early / late）', 行: [3874, 9302] },
  { 层: 'b3', 标识: ['tpl-b3-boundary'], 形态: 'script[id] 单套', 行: [9524] },
  { 层: 'b4', 标识: ['tpl-b4-generic'], 形态: 'script[id] 单套', 行: [9905] },
  { 层: 'b5', 标识: ['tpl-b5-handoff'], 形态: 'script[id] 单套（layerRows 冻结基线所在层）', 行: [10216] },
  { 层: 'b6', 标识: ['tpl-b6-lookup-grid'], 形态: '运行时 insertAdjacentHTML 动态注入的 style[id]', 行: [10756] },
  { 层: 'b7', 标识: ['tpl-b7-detail-ui'], 形态: '运行时 insertAdjacentHTML 动态注入的 style[id]', 行: [11146] },
  { 层: 'b8', 标识: ['tpl-b8-batch'], 形态: '运行时 insertAdjacentHTML 动态注入的 style[id]', 行: [11352] },
  { 层: 'b9', 标识: ['tpl-b9-legacy-ui'], 形态: '运行时 insertAdjacentHTML 动态注入的 style[id]', 行: [11928] },
  { 层: 'b10', 标识: ['data-b10-ux="1"'], 形态: '无 id 的 style 层，用属性标识', 行: [12698] },
];
const 十层校验 = 十层.map(x => ({
  ...x,
  逐条: x.行.map((n, i) => ({ 行: n, 期望含: x.标识[i] || x.标识[0],
                               命中: 行(n).includes(x.标识[i] || x.标识[0]) })),
}));
十层校验.forEach(x => x.通过 = x.逐条.every(y => y.命中));

// 不在 b 序列里的版本收口层（说明「十层」不是全部物理块）
const 版本收口层 = [
  { id: 'tpl-v114-elbridge', 行: 8752 }, { id: 'tpl-v112-bridge', 行: 8856 },
  { id: 'tpl-v115-elcontrols', 行: 8984 },
].map(x => ({ ...x, 命中: 行(x.行).includes(x.id) }));

// 五页签：vcTabs 区块内的 data-t 与文案
const 起 = L.findIndex(l => l.includes('id="vcTabs"'));
const 止 = L.findIndex((l, i) => i > 起 && l.includes('id="vcPane"'));
const 页签 = L.slice(起, 止).map((l, i) => ({ 行: 起 + i + 1, 原文: l.trim() }))
  .filter(x => x.原文.includes('data-t="'))   // 只取页签项，排除 <div class="vc-tabs" id="vcTabs"> 容器行
  .map(x => ({ 行: x.行, key: (x.原文.match(/data-t="([^"]+)"/) || [])[1] || null,
               文案: (x.原文.match(/>([^<>]+)<\/div>/) || [])[1] || null }));
const 功能设置文案 = 行(5734).trim();
const 版本说明 = 行(10625).trim();
const vcTabs隐藏行 = 行(5732).trim();

// 时序三环：层就位 → 登记 → 自检，逐环给可复核位置
const 时序链 = [
  { 环: '层按序就位', 位置: 'L8 / L15234 / L10237', 证据: 行(8).trim().slice(0, 120),
    说明: '内联 script/style 按文档顺序解析；layerRows() 用 querySelectorAll 扫描「已就位」的带 id 层' },
  { 环: '登记（冻结基线）', 位置: 'L10248–L10255', 证据: 行(10248).trim() + ' / ' + 行(10255).trim(),
    说明: 'var LAYERS=layerRows() 在 b5 层解析时同步执行；BASE_STYLE / BASE_SCRIPT / BASE_TPL / BASE_WL 冻结' },
  { 环: '自检', 位置: 'L10574–L10586 / L10489 / L10635', 证据: 行(10537).trim().slice(0, 140),
    说明: '_layersCheck() 校验前缀与 script 顺序；_regressionRun() 在层登记之后由外部调用' },
  { 环: '就绪标志', 位置: 'L9902 / L9910 / L10221 / L10539', 证据: 行(10539).trim().slice(0, 140),
    说明: 'runCheck("ready") 要求四个标志齐全' },
];
const 时序校验 = 时序链.map(x => ({ ...x, 位置有效: x.位置.split(/\s*\/\s*/).every(p => {
  const m = String(p).match(/L(\d+)/); return m && +m[1] <= L.length;
}) }));

// 运行时证据：从已有结果 JSON 摘取，不新跑浏览器
const 读JSON = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf-8')); } catch (e) { return null; } };
const 自检 = 读JSON('浏览器自检结果.json');
const 基线复现 = 读JSON('总纲基线复现结果.json');
const 截图 = 读JSON('截图对账结果.json');
const 运行时证据 = {
  层检查: 自检 && 自检.对账 ? { 一致: 自检.对账.层检查一致, 基线ok: 自检.对账.层检查基线 && 自检.对账.层检查基线.ok } : null,
  回归: 自检 && 自检.对账 ? { 逐项一致: 自检.对账.回归逐项一致 } : null,
  主启动: 自检 && 自检.构建页 && 自检.构建页.加载后MOD ? {
    参与首屏登记: 自检.构建页.加载后MOD.参与首屏登记,
    自动触发: 自检.构建页.加载后MOD.自动触发,
  } : null,
  默认视图: 截图 ? { 差异像素: 截图.差异像素, 通过: 截图.通过 } : null,
  manual统计: 基线复现 ? 基线复现.统计 : null,
};

const 结论 = {
  待核2: {
    原表述: 'b1→b10 版本口径与实见标识可对应，但「十层逐一对应十个物理块」无逐字对照表',
    可确认: '十层各自都有实见标识与行号；但 b1/b2 各两套、b6–b9 是运行时动态注入、b10 无 id、'
          + '另有 3 个 v1xx 版本收口层与末层无 id 段不在 b 序列内 → 物理块数量 ≠ 10，故「逐一对应」不成立',
    仍待核: 'L8 用「层顺序」列 b1→b10，是版本/批次口径；作者是否意图把每个 b 对应一个物理块，文件内无逐字说明',
    十层校验全通过: 十层校验.every(x => x.通过),
  },
  待核3: {
    原表述: '「层按序就位 → 登记 → 自检」为清单口述，文件内只有分段位置证据',
    可确认: '三个环节各自都有可复核位置与调用关系；顺序由「内联解析 → L10248 同步冻结 → 外部调用自检」证成；'
          + '运行时证据显示层检查 ok、回归逐项一致、懒加载不参与首屏登记',
    仍待核: '文件内确实没有逐字写出这句连续口诀；它仍是口述概括，不是源文件原文',
    时序链位置全有效: 时序校验.every(x => x.位置有效),
  },
  待核4: {
    原表述: 'L10625「配置中心五页签」与实见界面无法唯一确定',
    可确认: '视图配置右区 vcTabs 恰 5 个页签（筛选选项/快捷筛选/高级筛选/列选项/数据范围），'
          + '运行时实测节点数 5；功能设置模式是 4 个分组且会隐藏 vcTabs（L5732–L5734）',
    仍待核: '文件内没有「配置中心」这个界面名；L10625 把五页签与功能设置、动作管理、交互场景管理等并列为一组能力清单，'
          + '更像整组能力概括，无法唯一绑定到 vcTabs 或某个具体界面',
    页签数: 页签.length,
  },
};

const 输出 = {
  生成时间: new Date().toISOString(),
  口径: '只读基线原件 + 已有结果 JSON；不臆造、不改写源文件',
  源文件行数: L.length,
  十层校验, 版本收口层,
  五页签: { 起行: 起 + 1, 止行: 止 + 1, 页签, 功能设置文案, 版本说明, vcTabs隐藏行 },
  时序链: 时序校验,
  运行时证据, 结论,
};
const 落盘 = path.join(__dirname, '待核证据.json');
fs.writeFileSync(落盘, JSON.stringify(输出, null, 2), 'utf-8');
console.log('=== 待核证据抽取 ===');
console.log('源文件行数:', L.length);
console.log('十层逐条校验:', 十层校验.map(x => x.层 + ':' + (x.通过 ? 'Y' : 'N')).join(' '));
console.log('五页签:', 页签.map(x => x.key + '/' + x.文案).join(' | '));
console.log('时序链位置有效:', 时序校验.every(x => x.位置有效));
console.log('结论:', JSON.stringify({
  待核2: 结论.待核2.十层校验全通过, 待核3: 结论.待核3.时序链位置全有效, 待核4: 结论.待核4.页签数,
}));
console.log('结果已写:', 落盘);
