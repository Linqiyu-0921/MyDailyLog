# 实施步骤指南

## 阶段一：环境准备

### 1.1 前置条件

- Node.js >= 18.x（当前 v22.20.0 ✓）
- npm >= 9.x（当前 10.9.3 ✓）
- Python >= 3.8（Streamlit 版本可选）

### 1.2 安装依赖

```bash
cd 日志管理
npm install
```

### 1.3 验证环境

```bash
# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

---

## 阶段二：开发模式

### 2.1 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:8080，Vite 提供：
- 即时 HMR（修改 CSS/JS 后浏览器自动更新）
- ES Module 原生加载（无打包延迟）
- 自动打开浏览器（可配置）

### 2.2 开发工作流

1. 修改 `src/` 下的模块文件
2. 浏览器自动热更新
3. 运行 `npm test` 验证功能
4. 提交代码

### 2.3 添加新页面

1. 创建 `src/pages/newpage.js`
2. 实现 `renderNewPage()` 函数
3. 在 `src/main.js` 中注册：`registerPage('newpage', renderNewPage)`
4. 在 `index.html` 中添加页面容器：`<div class="page" id="page-newpage">...</div>`
5. 在导航中添加入口：`<button class="nav-link" data-page="newpage">新页面</button>`

---

## 阶段三：生产部署

### 3.1 构建

```bash
npm run build
```

输出到 `dist/` 目录，包含：
- 压缩后的 HTML/CSS/JS
- 哈希文件名（缓存友好）
- 自动代码分割

### 3.2 预览构建结果

```bash
npm run preview
```

### 3.3 部署选项

**选项 A：静态文件托管（推荐）**

将 `dist/` 目录部署到任意静态托管服务：
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

**选项 B：本地服务器**

```bash
# 使用 Python
cd dist && python -m http.server 8080

# 使用 Node.js
npx serve dist
```

---

## 阶段四：数据迁移

### 4.1 从旧版迁移

新版本首次加载时自动检测并迁移旧版数据：

1. 检查 `growth_journal_version` 键
2. 如果版本 < 2，执行 `migrateData()`
3. 为缺少字段的条目补充默认值
4. 更新版本号

### 4.2 从 CSV 导入

1. 打开导出页面
2. 点击"选择文件"
3. 选择 CSV 文件
4. 系统自动去重合并

### 4.3 IndexedDB 迁移（未来）

当 localStorage 容量不足时：
1. 创建 IndexedDB 数据库
2. 一次性迁移 localStorage 数据
3. 后续操作使用 IndexedDB
4. 保留 localStorage 作为降级方案

---

## 阶段五：回滚操作

### 5.1 快速回滚

如果新版本出现问题：

```bash
# 方式1：使用旧版 HTML
# 将 index.legacy.html 重命名为 index.html
# 删除 src/、node_modules/、package.json、vite.config.js
# 使用 python -m http.server 8080 启动

# 方式2：使用 git
git checkout HEAD -- index.html
rm -rf src/ node_modules/ package.json vite.config.js
```

### 5.2 数据安全

- 回滚不会丢失数据（新旧版本共享 localStorage）
- 旧版本忽略 `growth_journal_version` 键
- 建议回滚前导出 CSV 备份

---

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（HMR） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `npm test` | 运行所有测试 |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run test:coverage` | 生成覆盖率报告 |
| `npm run legacy` | 启动旧版静态服务器 |
