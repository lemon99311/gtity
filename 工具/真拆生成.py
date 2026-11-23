#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""真拆生成器（可复跑）

把 /data/inputs/v4.html 的顶层内联 script/style 块原样搬进 src/层/*.js|css，
生成按原文档顺序 import 的启动入口、层登记注册表，并把 index.html 缩成 HTML 骨架。

改写范围严格限定为三处（用户已授权动基线）：
  1) layerRows() 的数据源：document.querySelectorAll('style[id],script[id]') → 层注册表
  2) runCheck('exports') 的 style/script id 列表：DOM 扫描 → 层注册表
  3) S038 主 IIFE 里的 Formula 公式引擎抽离为独立业务 ESM（按四块重组第一阶段）
     零耦合纯计算 IIFE，抽走后本层顶层 import 引用，原 window 挂载点位置不变。
其余 30 个可执行 script 块与 32 个 style 块内容一字不动。
另外两处「首屏防闪烁」改写（不属于任何带 id 层，不改层序列）：
  4) HTML 骨架里 2 个内联 SVG 补 width/height，消除 dev 首次绘制的巨大黑色 logo
  5) 层注册表模块顶部同步注入一条 @layer 兜底 CSS，约束运行时无尺寸 SVG

用法：python3 工具/真拆生成.py
"""
import os, re, json, hashlib, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = '/data/inputs/v4.html'
层目录 = os.path.join(ROOT, 'src', '层')
启动入口 = os.path.join(ROOT, 'src', 'boot', '启动入口.js')
注册表文件 = os.path.join(ROOT, 'src', 'boot', '层注册表.js')
清单文件 = os.path.join(ROOT, '对账', '真拆清单.json')
HTML骨架文件 = os.path.join(ROOT, 'index.html')

原文 = open(SRC, encoding='utf-8', errors='replace').read()
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()

# ---------- 1. 字符级切分（浏览器 raw-text 规则：第一个 </tag> 闭合） ----------
# 不要求开标签在行首：R2-visual 的 <style> 与前一个块的 </style> 写在同一行。
# cursor 始终从上一个块的闭标签之后开始，块内部的示意标签（如 L10456）不会被扫到。
开 = re.compile(r'<(script|style)\b([^>]*)>', re.I)
blocks, cursor = [], 0
while True:
    m = 开.search(原文, cursor)
    if not m:
        break
    tag = m.group(1).lower()
    attrs = m.group(2).strip()
    body_start = m.end()
    close = re.compile(r'</\s*' + tag + r'\s*>', re.I).search(原文, body_start)
    if not close:
        raise SystemExit('未闭合块: %s @%d' % (tag, m.start()))
    body = 原文[body_start:close.start()]
    块 = dict(tag=tag, attrs=attrs, start=m.start(), end=close.end(),
              body=body, 起行=原文[:m.start()].count('\n') + 1,
              止行=原文[:close.end()].count('\n') + 1)
    idm = re.search(r'\bid\s*=\s*["\']([^"\']+)["\']', attrs, re.I)
    块['id'] = idm.group(1) if idm else None
    块['是JSON空壳'] = bool(re.search(r'type\s*=\s*["\']application/json["\']', attrs, re.I))
    blocks.append(块)
    cursor = close.end()

assert len(blocks) == 66, '块数异常: %d' % len(blocks)

# ---------- 2. 生成层文件 ----------
os.makedirs(层目录, exist_ok=True)
# 清空旧层文件，避免残留
for f in os.listdir(层目录):
    os.remove(os.path.join(层目录, f))

def slug(块, i):
    if 块['id']:
        return re.sub(r'[^A-Za-z0-9_-]', '-', 块['id'])[:48]
    m = re.search(r'data-wl-(?:seg|layer)\s*=\s*["\']([^"\']+)["\']', 块['attrs'], re.I)
    if m:
        return re.sub(r'[^A-Za-z0-9_-]', '-', m.group(1))[:32]
    return 'L%d' % 块['起行']

清单 = []
for i, b in enumerate(blocks):
    name = 'S%03d-%s-%s' % (i, b['tag'], slug(b, i))
    if b['是JSON空壳']:
        b['目标'] = 'index.html 内保留（JSON 数据容器，非可执行脚本）'
        b['文件'] = None
        清单.append(dict(序号=i, tag=b['tag'], id=b['id'], 起行=b['起行'], 止行=b['止行'],
                         原字节=len(b['body'].encode()), sha256=sha(b['body']),
                         生成sha256=sha(b['body']), 生成字节=len(b['body'].encode()),
                         目标=b['目标'], 文件=None, 改写=[]))
        continue
    ext = '.css' if b['tag'] == 'style' else '.js'
    fn = name + ext
    path = os.path.join(层目录, fn)
    content = b['body']
    改写 = []

    if b['tag'] == 'script':
        # ① layerRows() 的数据源
        old1 = "document.querySelectorAll('style[id],script[id]').forEach(function(e,i){\n    var id=e.id, tag=e.tagName.toLowerCase();"
        new1 = "(window.__WL_LAYER_REGISTRY__||[]).forEach(function(e,i){\n    var id=e.id, tag=e.tag;"
        n1 = content.count(old1)
        if n1:
            assert n1 == 1, 'layerRows 替换命中 %d 次' % n1
            content = content.replace(old1, new1)
            改写.append('layerRows 数据源 → 层注册表')
        # ② runCheck('exports') 的 style/script id 列表
        old2 = ("var st=[].slice.call(document.querySelectorAll('style[id]')).map(function(e){return e.id});\n"
                "      var sc=[].slice.call(document.querySelectorAll('script[id]')).map(function(e){return e.id});")
        new2 = ("var R=window.__WL_LAYER_REGISTRY__||[];\n"
                "      var st=R.filter(function(e){return e.tag==='style'}).map(function(e){return e.id});\n"
                "      var sc=R.filter(function(e){return e.tag==='script'}).map(function(e){return e.id});")
        n2 = content.count(old2)
        if n2:
            assert n2 == 1, 'exports 替换命中 %d 次' % n2
            content = content.replace(old2, new2)
            改写.append('exports 检查的 style/script id 列表 → 层注册表')

        # ③ 按四块重组 · 第一阶段：Formula 公式引擎抽离为独立业务 ESM。
        #    它是 S038 里唯一零外部依赖的顶层 IIFE（只调内建对象，不引用 S/esc/FORM 等闭包绑定），
        #    抽成 src/业务/表单/公式引擎.js 后，本层用顶层 import 取回绑定，
        #    window.__WL_FORMULA__ 的挂载语句留在原行号位置，执行顺序与可见性不变。
        if b['起行'] == 3951:
            起 = "const Formula = (function(){"
            止 = "})();\nwindow.__WL_FORMULA__ = Formula;"
            a = content.find(起)
            assert a >= 0, 'Formula 起始未命中'
            z = content.find(止, a)
            assert z >= 0, 'Formula 结束未命中'
            定义 = content[a:z + len('})();')]
            assert 定义.startswith(起) and 定义.endswith('})();'), 'Formula 段边界不完整'
            业务目录 = os.path.join(ROOT, 'src', '业务', '表单')
            os.makedirs(业务目录, exist_ok=True)
            模块 = ('// 表单块 · 公式引擎（按四块重组第一阶段，从 S038 主 IIFE 抽离）\n'
                    '// 零外部依赖：只调用 Math / Number / Object / isFinite 等内建对象。\n'
                    '// 原挂载点 window.__WL_FORMULA__ 仍由 S038 在原位置执行。\n'
                    + 定义.replace('const Formula =', 'export const Formula =', 1) + '\n')
            open(os.path.join(业务目录, '公式引擎.js'), 'w', encoding='utf-8', newline='').write(模块)
            content = (content[:a] + 'window.__WL_FORMULA__ = Formula;'
                       + content[z + len(止):])
            content = "import { Formula } from '../业务/表单/公式引擎.js';\n" + content
            改写.append('Formula 公式引擎 → src/业务/表单/公式引擎.js（表单块业务实现，按四块重组第一阶段）')

    open(path, 'w', encoding='utf-8', newline='').write(content)
    b['文件'] = 'src/层/' + fn
    b['目标'] = b['文件']
    清单.append(dict(序号=i, tag=b['tag'], id=b['id'], 起行=b['起行'], 止行=b['止行'],
                     原字节=len(b['body'].encode()), sha256=sha(b['body']),
                     生成sha256=sha(content), 生成字节=len(content.encode()),
                     目标=b['目标'], 文件=b['文件'], 改写=改写))

改写总数 = sum(len(x['改写']) for x in 清单)
assert 改写总数 == 3, '改写点应为 3，实际 %d' % 改写总数

# ---------- 3. 层登记注册表 ----------
# 基线 layerRows() 在 L10248 执行时扫到的是「到 b5 为止」的静态带 id 层。
# 顶层块中所有带 id 的块即为同一集合（源文件静态带 id 共 39 个）。
# 顺序基准来自基线页 TPL._layers() 的冻结快照（42 项）：
# 其中 39 项是静态顶层块，另 3 项 style 是运行时在 b5 冻结之前注入的，插在中间而非末尾。
# 按「原文档块顺序」排会把这 3 项甩到末尾，导致 _layers() 顺序与基线不一致，故采用实测顺序。
层序文件 = os.path.join(ROOT, '对账', '基线冻结层序.json')
层序 = json.load(open(层序文件, encoding='utf-8'))['层']
byid = {b['id']: b for b in blocks if b['id']}
注册项 = []
for j, row in enumerate(层序):
    b = byid.get(row['id'])
    if b:
        容器 = 'DOM' if b['是JSON空壳'] else 'ESM'
        文件 = b['文件'] or ('index.html#' + b['id'])
        起行 = b['起行']
    else:
        容器, 文件, 起行 = '运行时DOM', None, None
    注册项.append(dict(i=j, tag=row['tag'], id=row['id'], 起行=起行,
                       文件=文件, 容器=容器))
静态数 = sum(1 for r in 注册项 if r['容器'] != '运行时DOM')
assert len(注册项) == 42, '基线冻结层应为 42，实际 %d' % len(注册项)
assert 静态数 == 39, '静态带 id 层应为 39，实际 %d' % 静态数

注册表代码 = """// 首屏防闪烁兜底（dev 模式专用，不改变正常渲染）：
// Vite dev 的 CSS 由 JS 模块异步注入 <style>，HTML 会先绘制一次无样式画面；
// 内联 SVG 没有尺寸时会撑满父容器（实测 1424×1424），出现巨大黑色 logo 一闪。
// 本模块是启动入口第一个 import，顶层同步注入一条 @layer 规则；layer 内规则
// 优先级低于所有业务 CSS（unlayered），所以正常渲染时尺寸仍完全由原 CSS 决定。
if (typeof window !== 'undefined' && window.document && window.document.head) {
  const 兜底 = window.document.createElement('style');
  兜底.textContent = '@layer fouc-guard{svg:not([width]):not([height]){width:16px;height:16px}}';
  window.document.head.appendChild(兜底);
}

// 层登记注册表（真拆后新增）：替代 layerRows() 的 DOM 扫描。
// 42 个槽位逐项对齐基线页 TPL._layers() 的冻结快照顺序：
//   39 项静态层 → 真实 src/层/ 模块（或保留在 index.html 的 JSON 空壳）
//    3 项运行时注入 style → 插在中间（index 31–33），仅在 DOM 中真实存在时纳入
// 冻结时刻（b5 层 L10248）这 3 项已注入，因此 LAYERS 仍是 42 项且与基线逐项一致；
// 之后注入的 b6–b9 由 取层() 追加到末尾，与基线页「head 末尾追加」的 DOM 顺序一致。
export const 层表 = %s;

function 取层() {
  if (typeof window === 'undefined' || !window.document) return 层表.filter(x => x.容器 !== '运行时DOM');
  const dom = {};
  window.document.querySelectorAll('style[id],script[id]').forEach(e => {
    if (e.id) dom[e.id] = e.tagName.toLowerCase();
  });
  const out = [], seen = {};
  层表.forEach(x => {
    if (x.容器 === '运行时DOM' && !dom[x.id]) return;   // 尚未注入则不占位
    seen[x.id] = 1;
    out.push({ i: out.length, tag: x.tag, id: x.id, 起行: x.起行, 文件: x.文件, 容器: x.容器 });
  });
  Object.keys(dom).forEach(id => {
    if (!seen[id]) out.push({ i: out.length, tag: dom[id], id: id, 起行: null,
                              文件: null, 容器: '运行时DOM' });
  });
  return out;
}

if (typeof window !== 'undefined') {
  // 用 getter：运行时动态层在读取时才并入；冻结基线时刻的顺序仍由 42 槽位保证。
  Object.defineProperty(window, '__WL_LAYER_REGISTRY__', {
    configurable: true,
    get: 取层,
  });
  window.__WL_LAYER_REGISTRY_META__ = {
    槽位数: 层表.length,
    静态层: 层表.filter(x => x.容器 !== '运行时DOM').length,
    运行时槽位: 层表.filter(x => x.容器 === '运行时DOM').map(x => x.id),
    口径: '42 槽位对齐基线冻结层序；静态层走模块图登记，运行时层按 DOM 实况纳入',
  };
}

export default 层表;
""" % json.dumps(注册项, ensure_ascii=False, indent=2)
open(注册表文件, 'w', encoding='utf-8', newline='').write(注册表代码)

# ---------- 4. 启动入口：按原顺序 import ----------
lines = [
    "// 真拆后的启动入口：按原文档顺序把 65 个内联层全部装载为 ESM 模块。",
    "// 层注册表必须第一个 import —— 它的顶层赋值先于所有业务层求值，",
    "// 使业务层里的 layerRows() / runCheck('exports') 能读到登记表。",
    "import { 层表 } from './层注册表.js';",
    "",
]
for i, b in enumerate(blocks):
    if b['是JSON空壳']:
        lines.append("// S%03d %s（JSON 数据容器）保留在 index.html，不生成模块" % (i, b['id']))
    else:
        lines.append("import '../层/%s';" % os.path.basename(b['文件']))
lines += [
    "",
    "// 以下为原有的按需装载接线（8 个动态 import，不参与首屏登记）",
    "import { 配置集摘要, 校验配置链 } from '../config/配置集.js';",
    "",
    "const 装载点 = {",
    "  列表运行时: () => import('../list/运行时.js'),",
    "  列表配置:   () => import('../list/配置.js'),",
    "  表单运行时: () => import('../form/运行时.js'),",
    "  表单配置:   () => import('../form/配置.js'),",
    "  跳转桥:     () => import('../bridge/桥契约.js'),",
    "  配置器界面: () => import('../console/配置器界面.js'),",
    "  渲染器扩展位: () => import('../ext/渲染器扩展位.js'),",
    "  特殊效果扩展位: () => import('../ext/特殊效果扩展位.js'),",
    "};",
    "",
    "const 状态 = {",
    "  参与首屏登记: false,",
    "  自动触发: false,",
    "  装载点名: Object.keys(装载点),",
    "  已装载: {},",
    "  时序: [],",
    "  失败: [],",
    "};",
    "",
    "function 记(k, extra) { 状态.时序.push(Object.assign({ k, at: Date.now() }, extra || {})); }",
    "",
    "export async function ensure(名) {",
    "  if (状态.已装载[名]) return 状态.已装载[名];",
    "  const 拉起 = 装载点[名];",
    "  if (!拉起) return { ok: false, 原因: '未注册的装载点', 名 };",
    "  try {",
    "    const m = await 拉起();",
    "    状态.已装载[名] = m; 记('import-ok', { 名 }); return m;",
    "  } catch (e) {",
    "    const 错 = String((e && e.message) || e);",
    "    状态.失败.push({ 名, 错 }); 记('import-fail', { 名, 错 });",
    "    return { ok: false, 原因: '动态加载失败，按契约回退', 名, 错 };",
    "  }",
    "}",
    "",
    "export function 自检() {",
    "  const W = typeof window === 'undefined' ? null : window;",
    "  const R = 层表;  // 静态 39 项；运行时动态注入层由 __WL_LAYER_REGISTRY__ 的 getter 并入",
    "  const 项 = [",
    "    { 名: '未参与首屏登记', 通过: 状态.参与首屏登记 === false },",
    "    { 名: '首屏未自动触发 import', 通过: 状态.自动触发 === false },",
    "    { 名: '8 个装载点已注册', 通过: Object.keys(装载点).length === 8 },",
    "    { 名: '配置链完整', 通过: 校验配置链().通过 === true },",
    "    { 名: '层表 42 槽位且顺序逐项对齐基线冻结层序', 通过: R.length === 42 && R.every((x, i) => x.i === i && x.id) },",
    "    { 名: '其中 39 项为静态模块 / DOM 容器', 通过: R.filter(x => x.容器 !== '运行时DOM').length === 39 },",
    "    { 名: '两个 JSON 空壳仍在 DOM', 通过: !!(W && W.document &&",
    "        W.document.getElementById('tplSchema') && W.document.getElementById('tplExamples')) },",
    "    { 名: '每个静态槽位都有真实模块文件或保留在 DOM', 通过: R.filter(x => x.容器 !== '运行时DOM')",
    "        .every(x => x.容器 === 'DOM' || /^src\\/层\\//.test(x.文件 || '')) },",
    "  ];",
    "  return { 通过: 项.every(x => x.通过), 项, 配置集摘要: 配置集摘要(), 状态, 层数: R.length };",
    "}",
    "",
    "const API = { ensure, 自检, 状态, 配置集摘要, 校验配置链, 层表, 装载点名: 状态.装载点名 };",
    "",
    "if (typeof window !== 'undefined') {",
    "  window.__MOD__ = API;",
    "  记('接线就绪', { 说明: '业务层已按 import 顺序同步执行完毕，懒加载未触发' });",
    "}",
    "",
    "export default API;",
]
open(启动入口, 'w', encoding='utf-8', newline='').write('\n'.join(lines) + '\n')

# ---------- 5. 生成 HTML 骨架 ----------
parts, cursor = [], 0
for b in blocks:
    parts.append(原文[cursor:b['start']])
    if b['是JSON空壳']:
        parts.append(原文[b['start']:b['end']])   # 原样保留
    else:
        parts.append('<!-- %s -->' % os.path.basename(b['文件']) if b['文件'] else '')
    cursor = b['end']
parts.append(原文[cursor:])
骨架 = ''.join(parts)

# 首屏防闪烁（HTML 解析后、CSS 注入前的首次绘制帧）：
# 两个静态内联 SVG 原本没有 width/height，无样式时会按 viewBox 撑满父容器宽度。
# 加上与业务 CSS 最终尺寸一致的属性（logo 18 / nav 16），CSS 仍在时由 CSS 覆盖，视觉不变。
替换表 = [
    ('<div class="logo-mark"><svg viewBox=', '<div class="logo-mark"><svg width="18" height="18" viewBox='),
    ('onclick="return false"><svg viewBox=', 'onclick="return false"><svg width="16" height="16" viewBox='),
]
for 旧, 新 in 替换表:
    n = 骨架.count(旧)
    assert n == 1, 'SVG 防闪烁替换应命中 1 次，实际 %d 次：%s' % (n, 旧)
    骨架 = 骨架.replace(旧, 新)

入口标签 = '<script type="module" src="/src/boot/启动入口.js"></script>\n'
if '</body>' in 骨架:
    骨架 = 骨架.replace('</body>', 入口标签 + '</body>', 1)
else:
    骨架 += '\n' + 入口标签
open(HTML骨架文件, 'w', encoding='utf-8', newline='').write(骨架)

# ---------- 6. 写清单 ----------
os.makedirs(os.path.dirname(清单文件), exist_ok=True)
out = dict(
    生成时间=__import__('datetime').datetime.now().isoformat(),
    源文件=SRC, 源字节=len(原文.encode()), 源sha256=sha(原文), 源行数=原文.count('\n') + 1,
    块数=len(blocks),
    script块=sum(b['tag'] == 'script' for b in blocks),
    style块=sum(b['tag'] == 'style' for b in blocks),
    JSON空壳=[b['id'] for b in blocks if b['是JSON空壳']],
    生成模块数=sum(1 for b in blocks if b['文件']),
    注册表项数=len(注册项), 注册表静态层=静态数,
    注册表运行时槽位=[r['id'] for r in 注册项 if r['容器'] == '运行时DOM'],
    改写点数=改写总数,
    防闪烁改写=[
        'index.html 骨架 2 个内联 SVG 补 width/height（18 / 16，与业务 CSS 最终尺寸一致）',
        '层注册表模块顶层注入 @layer fouc-guard 兜底：svg:not([width]):not([height]) → 16px',
    ],
    改写说明=[
        'layerRows() 数据源：DOM querySelectorAll → window.__WL_LAYER_REGISTRY__',
        "runCheck('exports') 的 style/script id 列表：DOM querySelectorAll → 层注册表",
        'S038 的 Formula 公式引擎抽离为 src/业务/表单/公式引擎.js（按四块重组第一阶段）',
    ],
    新index字节=len(骨架.encode()),
    新index行数=骨架.count('\n') + 1,
    层文件数=len([f for f in os.listdir(层目录)]),
    块清单=清单,
    注册表=注册项,
)
json.dump(out, open(清单文件, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

print('=== 真拆生成完成 ===')
print('源:', out['源字节'], '字节 /', out['源行数'], '行')
print('块:', out['块数'], '(script %d / style %d)' % (out['script块'], out['style块']))
print('生成层模块:', out['生成模块数'], ' 注册表项:', out['注册表项数'], ' 改写点:', out['改写点数'])
print('新 index.html:', out['新index字节'], '字节 /', out['新index行数'], '行',
      '压缩比 %.2f%%' % (out['新index字节'] / out['源字节'] * 100))
print('清单:', 清单文件)
