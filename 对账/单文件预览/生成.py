#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 dist/ 压成「双击即开」的单文件 HTML（无需 HTTP、无需解压、无需 Node）。

用法（在 Vite分模块工程/ 下）：
  ./node_modules/.bin/esbuild dist/assets/boot-*.js --bundle --format=iife \
      --target=esnext --outfile=对账/单文件预览/bundle.js --log-level=warning
  python3 对账/单文件预览/生成.py

产物：/data/workspace/项目预览-单文件.html
说明：这是【预览便利副本】，不是工程本体。8 个按需模块被 esbuild 内联进同一个
      IIFE，因此这个副本不具备动态 import 的按需加载特性；工程本体 dist/ 仍保留。
"""
import os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIST = os.path.join(ROOT, 'dist')
OUT = os.path.join(os.path.dirname(ROOT), '项目预览-单文件.html')
BUNDLE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bundle.js')

html = open(os.path.join(DIST, 'index.html'), encoding='utf-8').read()
js = open(BUNDLE, encoding='utf-8').read()

# 1) 按原 stylesheet link 顺序收集 CSS
css_files = re.findall(r'<link\s+rel="stylesheet"[^>]*href="\./assets/([^"]+\.css)"[^>]*>', html)
assert len(css_files) == 4, '预期 4 个 CSS，实际 %d' % len(css_files)
css_all = []
for f in css_files:
    c = open(os.path.join(DIST, 'assets', f), encoding='utf-8').read()
    assert '</style' not in c.lower(), 'CSS 内出现 </style，需转义'
    css_all.append('/* ==== %s ==== */\n%s' % (f, c))
css_inline = '<style>\n' + '\n'.join(css_all) + '\n</style>'

# 2) 去掉 module 入口与 modulepreload，替换 stylesheet links
html = re.sub(r'<script\s+type="module"[^>]*src="\./assets/[^"]+\.js"[^>]*></script>\s*', '', html)
html = re.sub(r'<link\s+rel="modulepreload"[^>]*>\s*', '', html)
html, n = re.subn(r'<link\s+rel="stylesheet"[^>]*>\s*', '', html)
# 第一个 stylesheet 的位置放内联 CSS：用原注释占位，统一插到 </head> 前
html = html.replace('</head>', css_inline + '\n</head>', 1)

# 3) body 末尾插入内联脚本；防止 HTML 解析器提前闭合 script
assert '</script' not in js.lower(), 'JS 内出现 </script，需转义'
js_safe = js.replace('<!--', '<\\!--').replace('-->', '--\\>')
html = html.replace('</body>', '<script>\n' + js_safe + '\n</script>\n</body>', 1)

assert 'src="./assets/' not in html and 'href="./assets/' not in html, '仍残留相对资源引用'
open(OUT, 'w', encoding='utf-8', newline='').write(html)
print('单文件预览:', OUT)
print('字节:', len(html.encode('utf-8')), ' CSS 文件:', css_files, ' JS 字节:', len(js.encode('utf-8')))
