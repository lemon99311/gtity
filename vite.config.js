import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// 真拆后的构建配置。
// 63 个 src/层/* 模块是真实业务实现（原内联 script/style 原样外置），按原文档 import 顺序同步求值；
// 8 个按需模块仍由动态 import 拉起。两者都用同一套 dev / build 路径。
const 根 = fileURLToPath(new URL('.', import.meta.url));

// 6.1 的「命名即边界」：动态 import 的 facade 模块 → 产物名前缀
const 边界表 = [
  [/src\/list\/运行时\.js$/, 'list-runtime'],
  [/src\/list\/配置\.js$/, 'list-config'],
  [/src\/form\/运行时\.js$/, 'form-runtime'],
  [/src\/form\/配置\.js$/, 'form-config'],
  [/src\/bridge\/桥契约\.js$/, 'bridge'],
  [/src\/console\/配置器界面\.js$/, 'console'],
  [/src\/ext\/渲染器扩展位\.js$/, 'ext-renderer'],
  [/src\/ext\/特殊效果扩展位\.js$/, 'ext-effect'],
];

// 业务层按原文件物理段切成多个真实 chunk。
// 边界是「原文档段落」而非重新设计的业务四块 —— 层内容一字未动，只换装载方式。
// 段名与起止行见 对账/真拆清单.json。
const 段 = [
  [0, 6, 'layer-a-early'],       // S000–S006：早期样式 / 配置源 / R2 / 空壳注入
  [7, 36, 'layer-b-core'],        // S007–S036：主样式 / 主 IIFE / guard early
  [37, 46, 'layer-c-bridge'],     // S037–S046：v114/v112/v115 / b1–b5 / 层登记冻结
  [47, 57, 'layer-d-ui'],         // S047–S057：b6–b10 / 明细 UI / 批次 / 旧版 UI
  [58, 65, 'layer-e-tail'],       // S058–S065：T0–T7 / R2-visual / R3 / R4 后追加层
];

// ---------------------------------------------------------------------------
// dev 刷新防 FOUC 遮罩（仅开发模式生效，生产构建零改动）
//
// 症状：按 F5 刷新 localhost:5173 时，Vite dev 把 32 个 CSS 包装成 JS 模块，
//       ESM 又要求「全部静态依赖下载完才开始执行任何模块体」，这段空窗里
//       浏览器已按默认样式绘出未排版 DOM（散落的文字、裸奔的 SVG/三角）。
// 做法：dev 的 HTML 响应里给 <html> 加 wl-fouc 类 + 一条 !important 隐藏规则，
//       启动入口最后一个模块在所有依赖求值完、boot() 同步首屏完成后移除该类。
//       visibility:hidden 保留布局（不影响业务层读 offset* / getBoundingClientRect）。
// 为什么用插件而不是写进 index.html：build 时磁盘骨架必须保持「0 个内联 style」，
//       且生产 CSS 是 <link> 阻塞渲染、本来就不闪；只在 dev 注入可做到零回归。
// ---------------------------------------------------------------------------
let 是Dev = false;
const 防刷新FOUC = {
  name: 'fouc-guard-refresh',
  configResolved(c) { 是Dev = c.command === 'serve'; },
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      if (!是Dev) return html;
      const 遮罩样式 = '<style>html.wl-fouc body{visibility:hidden!important}</style>';
      return html
        .replace('<html lang="zh-CN">', '<html lang="zh-CN" class="wl-fouc">')
        .replace('<head>', '<head>\n' + 遮罩样式);
    },
  },
};

export default defineConfig({
  root: 根,
  base: './',
  plugins: [防刷新FOUC],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 不压缩、不改写业务层文本，便于逐块审计与行为等价核对
    minify: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./index.html', import.meta.url)),
      output: {
        entryFileNames: 'assets/boot-[hash].js',
        chunkFileNames(info) {
          const id = String(info.facadeModuleId || '').replace(/\\/g, '/');
          for (const [re, name] of 边界表) {
            if (re.test(id)) return `assets/${name}-[hash].js`;
          }
          // manualChunks 返回的业务段名优先，避免全部落到 shared-*
          const 名 = info.name && /^layer-/.test(info.name) ? info.name : 'shared';
          return `assets/${名}-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          const p = String(id).replace(/\\/g, '/');
          // 注册表必须与最早的业务层同段、且排在其之前：ESM 入口 chunk 的静态依赖先求值，
          // 若注册表留在入口 chunk，业务层执行时 window.__WL_LAYER_REGISTRY__ 尚未定义。
          if (/\/src\/boot\/层注册表\.js$/.test(p)) return 'layer-a-early';
          const m = p.match(/\/src\/层\/S(\d{3})-/);
          if (!m) return undefined;
          const n = +m[1];
          for (const [a, b, 名] of 段) if (n >= a && n <= b) return 名;
          return undefined;
        },
      },
    },
  },
});
