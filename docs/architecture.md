# 架构更新文档

## 1. 架构评估

### 1.1 原架构分析

原项目采用单体 HTML 文件架构，所有 CSS（约 600 行）和 JavaScript（约 1200 行）内联在一个 1883 行的 `index.html` 中。

**技术栈：**
- 前端：纯 HTML + 内联 CSS + 内联 JavaScript
- 数据存储：localStorage（5-10MB 限制）
- 后端替代：Streamlit + CSV 文件
- 构建工具：无
- 测试：无

### 1.2 识别的问题

#### 性能瓶颈

| 编号 | 问题 | 严重程度 | 影响 |
|------|------|----------|------|
| P-1 | 搜索无防抖，每次按键触发全量重渲染 | 高 | 输入卡顿，CPU 峰值 |
| P-2 | 无分页机制，所有条目一次性渲染 | 高 | 大数据量下 DOM 节点过多 |
| P-3 | localStorage 全量 JSON 解析，无缓存 | 中 | 每次操作重复解析 |
| P-4 | Google Fonts 阻塞渲染 | 中 | 首屏加载慢 |
| P-5 | 无代码分割，全部代码一次加载 | 低 | 首屏 JS 解析时间长 |
| P-6 | XHR 替代 Fetch API | 低 | 代码冗余 |

#### 安全隐患

| 编号 | 问题 | 严重程度 | 影响 |
|------|------|----------|------|
| S-1 | innerHTML 注入用户内容无转义 | 严重 | XSS 攻击向量 |
| S-2 | onclick 属性中序列化函数并 eval 执行 | 严重 | 代码注入风险 |
| S-3 | 无输入验证和长度限制 | 高 | 数据完整性受损 |
| S-4 | 无 Content Security Policy | 中 | 缺少纵深防御 |
| S-5 | CSV 导出无公式转义 | 低 | Excel 公式注入 |
| S-6 | localStorage 明文存储 | 低 | 同源脚本可读取 |

#### 可扩展性问题

| 编号 | 问题 | 严重程度 | 影响 |
|------|------|----------|------|
| E-1 | localStorage 5-10MB 容量限制 | 高 | 数据增长后崩溃 |
| E-2 | 单文件架构无法多人协作 | 高 | 开发效率低 |
| E-3 | 无数据迁移策略 | 中 | Schema 变更困难 |
| E-4 | 无 API 抽象层 | 中 | 存储引擎切换困难 |
| E-5 | 全局可变状态 | 中 | 状态管理混乱 |
| E-6 | Streamlit 版每次操作重读 CSV | 低 | 性能浪费 |

---

## 2. 架构更新方案

### 2.1 新架构概览

```
┌─────────────────────────────────────────────────┐
│                   index.html                     │
│              (最小化 HTML 壳)                     │
├─────────────────────────────────────────────────┤
│                   src/main.js                    │
│              (应用入口 + 事件委托)                │
├──────────┬──────────┬──────────┬────────────────┤
│  router  │  theme   │components│    pages/       │
│  (路由)  │ (主题)   │ (组件)   │ dashboard      │
│          │          │          │ write          │
│          │          │          │ history        │
│          │          │          │ detail         │
│          │          │          │ archive        │
│          │          │          │ export         │
├──────────┴──────────┴──────────┴────────────────┤
│              数据层 (Data Layer)                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │ store.js│  │ csv.js  │  │  sanitize.js    │ │
│  │(CRUD+缓存)│ │(导入导出)│  │  (XSS防护+校验) │ │
│  └─────────┘  └─────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────┤
│              工具层 (Utils)                       │
│         utils.js (日期/ID/防抖/分页)             │
├─────────────────────────────────────────────────┤
│              样式层 (Styles)                      │
│         styles/main.css (CSS 变量体系)           │
└─────────────────────────────────────────────────┘
```

### 2.2 关键架构决策

#### AD-1: Vite + ES Modules 替代单体 HTML

**决策：** 采用 Vite 作为构建工具，将代码拆分为 ES 模块。

**理由：**
- ES 模块提供原生作用域隔离，消除全局命名空间污染
- Vite 提供 HMR、代码分割、Tree-shaking 等开发体验提升
- 构建产物可压缩至原体积的 30-40%
- 为后续引入 TypeScript 提供基础

**替代方案：**
- Webpack：配置复杂，启动慢，不适合此项目规模
- 原生 ES Modules（无构建工具）：缺少 HMR 和打包优化

#### AD-2: 事件委托替代内联事件处理器

**决策：** 使用 `data-action` 属性 + 全局事件委托替代 `onclick` 属性。

**理由：**
- 消除 `onclick` 中的 eval 执行模式（S-2 修复）
- 减少事件监听器数量，提升内存效率
- 支持动态内容的事件绑定

#### AD-3: HTML 转义 + 输入验证双层防护

**决策：** 在数据层（sanitize.js）和渲染层（components.js）同时实施 XSS 防护。

**理由：**
- 数据层验证确保存储数据的完整性
- 渲染层转义确保即使存储数据被篡改也不会执行
- 纵深防御策略，单点失效不会导致安全漏洞

#### AD-4: 内存缓存 + localStorage 持久化

**决策：** 在 store.js 中实现内存缓存层，减少 localStorage 的 JSON 解析开销。

**理由：**
- 避免每次操作重复解析 localStorage（P-3 修复）
- 缓存失效策略简单可靠（写入时自动失效）
- 为后续迁移到 IndexedDB 提供抽象层

### 2.3 模块依赖关系

```
main.js
├── router.js (无依赖)
├── theme.js (无依赖)
├── components.js
│   ├── sanitize.js
│   └── utils.js
├── pages/dashboard.js
│   ├── store.js → utils.js
│   ├── sanitize.js
│   └── components.js
├── pages/write.js
│   ├── store.js → utils.js
│   ├── sanitize.js
│   └── components.js
├── pages/history.js
│   ├── store.js → utils.js
│   └── components.js
├── pages/detail.js
│   ├── store.js → utils.js
│   ├── sanitize.js
│   └── components.js
├── pages/archive.js
│   ├── store.js → utils.js
│   └── components.js
├── pages/export.js
│   ├── store.js → utils.js
│   ├── csv.js → store.js, utils.js, sanitize.js
│   └── components.js
└── csv.js → store.js, utils.js, sanitize.js
```

---

## 3. 问题修复映射

| 原问题 | 修复方式 | 实现模块 |
|--------|----------|----------|
| P-1 搜索无防抖 | debounce(fn, 300) | utils.js → pages/history.js |
| P-2 无分页 | paginate() + 分页 UI | utils.js → components.js |
| P-3 无缓存 | 内存缓存 + 写入时失效 | store.js |
| P-4 字体阻塞 | preconnect + 异步加载 | index.html |
| P-5 无代码分割 | Vite 自动代码分割 | vite.config.js |
| P-6 XHR | Fetch API | csv.js |
| S-1 XSS | escapeHtml() 全量转义 | sanitize.js + components.js |
| S-2 eval 模式 | 事件委托 + addEventListener | main.js |
| S-3 无输入验证 | validateEntry() + sanitizeEntryInput() | sanitize.js |
| S-4 无 CSP | meta CSP 标签 | index.html |
| E-1 容量限制 | 数据层抽象 + IndexedDB 迁移路径 | store.js |
| E-2 单文件 | ES 模块拆分 | 全部 src/ 文件 |
| E-3 无迁移 | 数据版本号 + migrateData() | store.js |
| E-4 无抽象 | store.js 统一接口 | store.js |
| E-5 全局状态 | 模块作用域 + 路由状态管理 | router.js |
| E-6 Streamlit 重读 | mtime 缓存机制 | streamlit/app.py |

---

## 4. 回滚预案

### 4.1 回滚触发条件

- 新版本出现数据丢失或损坏
- 关键功能（写日志、查看历史）不可用
- 性能严重退化（首屏加载 > 5s）

### 4.2 回滚步骤

1. 将 `index.legacy.html` 重命名为 `index.html`
2. 删除 `src/`、`node_modules/`、`dist/` 目录
3. 删除 `package.json`、`vite.config.js`
4. 使用 `python -m http.server 8080` 启动旧版服务

### 4.3 数据兼容性

- 新旧版本共享相同的 localStorage 数据格式
- 数据键名 `growth_journal_entries` 保持不变
- 新版本添加 `growth_journal_version` 键，旧版本忽略此键
- 两个版本可以无缝切换，数据不会丢失

### 4.4 过渡期兼容性保障

- `index.legacy.html` 保留为回滚入口
- CSV 数据文件路径 `data/my_daily_log.csv` 保持不变
- Streamlit 版本独立运行，不受前端重构影响
- 遗留 CSV 数据自动导入：首次加载时检测并迁移

---

## 5. 新目录结构

```
日志管理/
├── index.html              # Vite 入口（最小化 HTML 壳）
├── index.legacy.html       # 旧版回滚文件
├── package.json            # Node.js 项目配置
├── vite.config.js          # Vite 构建配置
├── src/
│   ├── main.js             # 应用入口 + 全局事件委托
│   ├── router.js           # SPA 路由管理
│   ├── store.js            # 数据存储层（CRUD + 缓存）
│   ├── csv.js              # CSV 导入/导出
│   ├── sanitize.js         # XSS 防护 + 输入验证
│   ├── utils.js            # 通用工具函数
│   ├── theme.js            # 主题管理
│   ├── components.js       # 可复用 UI 组件
│   ├── pages/
│   │   ├── dashboard.js    # 概览页
│   │   ├── write.js        # 写日志页
│   │   ├── history.js      # 历史记录页
│   │   ├── detail.js       # 详情页
│   │   ├── archive.js      # 归档页
│   │   └── export.js       # 导出页
│   └── styles/
│       └── main.css        # 全局样式（CSS 变量体系）
├── tests/
│   ├── unit/
│   │   ├── sanitize.test.js
│   │   ├── utils.test.js
│   │   ├── store.test.js
│   │   └── csv.test.js
│   ├── integration/
│   │   └── app.test.js
│   └── performance/
│       └── benchmark.test.js
├── streamlit/
│   └── app.py              # Streamlit 版本（已更新）
├── data/
│   └── my_daily_log.csv    # 示例数据
├── docs/
│   ├── architecture.md     # 本文档
│   ├── tech-stack.md       # 技术选型说明
│   ├── implementation.md   # 实施步骤指南
│   └── test-report.md      # 测试报告
├── .impeccable.md
├── DESIGN.md
├── .gitignore
└── README.md
```
