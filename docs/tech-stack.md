# 技术选型说明

## 1. 构建工具：Vite 6.x

### 选型理由

| 维度 | Vite | Webpack | 原生 ES Modules |
|------|------|---------|----------------|
| 开发启动速度 | < 2s | 10-30s | 即时 |
| HMR 速度 | < 100ms | 1-5s | 需手动刷新 |
| 配置复杂度 | 极低 | 高 | 无 |
| 代码分割 | 自动 | 需配置 | 不支持 |
| Tree-shaking | 内置 | 需配置 | 不支持 |
| 测试集成 | Vitest | Jest | 需额外配置 |
| 生产优化 | Rollup 内置 | 自有 | 无 |

### 版本选择

- **Vite 6.x**：当前最新稳定版，原生 ES Module 开发服务器 + Rollup 生产构建
- **Vitest 3.x**：与 Vite 共享配置，原生 ESM 测试，兼容 jsdom 环境

### 关键配置

```javascript
// vite.config.js
export default defineConfig({
  build: { outDir: 'dist', assetsDir: 'assets' },
  server: { port: 8080 },
  test: { environment: 'jsdom', globals: true }
});
```

---

## 2. 前端架构：Vanilla JS + ES Modules

### 选型理由

| 维度 | Vanilla JS | React | Vue | Svelte |
|------|-----------|-------|------|--------|
| 包体积 | 0 KB | 42 KB | 33 KB | 2 KB |
| 学习成本 | 无 | 中 | 低 | 低 |
| 运行时开销 | 无 | 中 | 低 | 极低 |
| 适合项目规模 | 小型 | 中大型 | 中型 | 中小型 |
| 构建依赖 | 可选 | 必须 | 必须 | 必须 |

**选择 Vanilla JS 的核心理由：**

1. **项目规模匹配**：6 个页面、1 个数据模型，无需虚拟 DOM 的复杂性
2. **零运行时开销**：个人日志工具不应引入框架运行时
3. **数据驱动足够**：通过事件委托 + DOM 操作即可满足需求
4. **长期维护性**：无框架版本锁定风险

### 模块化策略

```
核心原则：单向依赖，无循环引用

层级：HTML → main.js → [router, theme, pages/*] → [components] → [store, csv] → [sanitize, utils]
```

---

## 3. 数据存储：localStorage + 缓存层

### 当前方案

```
写入路径：用户操作 → store.setEntries() → JSON.stringify → localStorage
读取路径：store.getEntries() → 内存缓存命中? → JSON.parse(localStorage)
```

### 缓存策略

- **缓存粒度**：全量缓存（整个 entries 数组）
- **失效策略**：写入时自动失效（setEntries/addEntry/updateEntry/deleteEntryById）
- **缓存穿透**：无，首次访问从 localStorage 加载

### IndexedDB 迁移路径

store.js 的接口设计已为 IndexedDB 迁移预留空间：

```javascript
// 当前接口（同步）
export function getEntries() { ... }
export function setEntries(entries) { ... }

// 迁移后接口（异步）
export async function getEntries() { ... }
export async function setEntries(entries) { ... }
```

迁移步骤：
1. 创建 `src/store/indexeddb.js` 实现 IndexedDB 适配器
2. 修改 `store.js` 检测存储引擎，优先使用 IndexedDB
3. 添加 localStorage → IndexedDB 一次性迁移逻辑
4. 页面模块中 `getEntries()` 调用改为 `await getEntries()`

---

## 4. 安全架构

### 4.1 XSS 防护：双层防御

**第一层：输入验证与清洗（sanitize.js）**

```javascript
// 数据入口：验证 + 截断
validateEntry(entry)    // 结构验证
sanitizeEntryInput(raw) // 长度截断 + 类型强制
```

**第二层：输出转义（components.js）**

```javascript
// 渲染出口：HTML 转义
escapeHtml(userContent) // 所有用户内容渲染前转义
```

### 4.2 事件处理：消除 eval

**旧模式（危险）：**
```html
<button onclick="(${action.toString()})()">删除</button>
```

**新模式（安全）：**
```html
<button data-entry-action="delete" data-entry-id="xxx">删除</button>
```
```javascript
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-entry-action]');
  if (target) handleEntryAction(target.dataset.entryAction, target.dataset.entryId);
});
```

### 4.3 Content Security Policy

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self' 'unsafe-inline';
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
           font-src https://fonts.gstatic.com;
           connect-src 'self';
           img-src 'self' data:;" />
```

> 注：`'unsafe-inline'` 用于 script-src 和 style-src 是因为 Vite 开发模式需要。生产构建后可移除 `'unsafe-inline'` for script-src。

---

## 5. 测试架构：Vitest

### 选型理由

- 与 Vite 共享配置，零额外配置
- 原生 ESM 支持，无需 Babel 转换
- jsdom 环境支持 DOM API 测试
- 内置覆盖率报告

### 测试分层

| 层级 | 文件 | 测试数量 | 覆盖范围 |
|------|------|----------|----------|
| 单元测试 | tests/unit/sanitize.test.js | 14 | XSS 转义、输入验证、数据清洗 |
| 单元测试 | tests/unit/utils.test.js | 16 | 日期格式化、ID 生成、防抖、分页、连续天数 |
| 单元测试 | tests/unit/store.test.js | 16 | CRUD、缓存、版本管理、数据导入导出 |
| 单元测试 | tests/unit/csv.test.js | 12 | CSV 解析、生成、往返一致性 |
| 集成测试 | tests/integration/app.test.js | 5 | 完整数据流、安全集成、分页集成 |
| 性能测试 | tests/performance/benchmark.test.js | 7 | 大数据量下的性能基准 |

---

## 6. Streamlit 版本更新

### 更新内容

| 改进项 | 说明 |
|--------|------|
| 错误处理 | 捕获 EmptyDataError、ParserError、PermissionError |
| 数据缓存 | mtime 检测 + 内存缓存，避免重复读取 CSV |
| 输入验证 | sanitize_text() 清洗 + validate_date() 日期校验 |
| 字段长度限制 | max_chars=500 + sanitize_text 截断 |
| 搜索功能 | 新增关键词搜索 |
| CSV 导入 | 新增文件上传导入，去重合并 |
| 导出文件名 | 日期后缀，避免覆盖 |
| 控制字符过滤 | 移除 \x00-\x1f 范围的控制字符 |

---

## 7. CSS 架构

### 设计系统

基于 CSS Custom Properties 的主题系统：

```css
:root { /* 亮色主题变量 */ }
[data-theme="dark"] { /* 暗色主题覆盖 */ }
```

### 响应式断点

| 断点 | 宽度 | 调整 |
|------|------|------|
| 桌面 | > 768px | 完整布局 |
| 平板 | ≤ 768px | 折叠导航、简化网格 |
| 手机 | ≤ 480px | 单列布局、全宽按钮 |

### 无障碍

- `prefers-reduced-motion` 媒体查询：禁用动画
- 语义化 HTML：header/main/footer/nav
- 键盘导航：ESC 关闭弹窗
- 高对比度：暗色模式自动切换
