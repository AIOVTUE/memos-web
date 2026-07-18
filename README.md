# Memos Web

基于 memos / Obsidian 格式的云端 Memos 网页应用。静态前端可部署到 **Cloudflare Pages**、**Netlify**、**Vercel**；memos 数据存储在 **WebDAV** 的 `basic.memos.md` 文件中，打开页面后动态读取并渲染，支持在线编辑。

根目录 `basic.memos.md` 是**格式样例**，完整格式说明见下文第 1–3 节。

![](https://r2tc.20030327.xyz/file/%e5%8d%9a%e5%ae%a2/%e6%96%87%e7%ab%a0/1781110022442_1781109932676.png)
![](https://r2tc.20030327.xyz/file/%e5%8d%9a%e5%ae%a2/%e6%96%87%e7%ab%a0/1781110021058_1781109962070.png)
![](https://r2tc.20030327.xyz/file/%e5%8d%9a%e5%ae%a2/%e6%96%87%e7%ab%a0/1781110027826_1781109980468.png)

---

## 快速开始

### 1. 环境变量

复制 `.env.example` 为 `.env` 并填写：

| 变量 | 必填 | 说明 |
|------|------|------|
| `SITE_PASSWORD` | 是 | 网站访问密码 |
| `WEBDAV_URL` | 是 | WebDAV 根地址，如 `https://example.com/remote.php/dav/files/user` |
| `WEBDAV_USERNAME` | 是 | WebDAV 用户名 |
| `WEBDAV_PASSWORD` | 是 | WebDAV 密码 |
| `WEBDAV_FILE_PATH` | 否 | 文件路径（相对 `WEBDAV_URL`），默认 `basic.memos.md` |
| `AUTH_SECRET` | 强烈建议 | 会话签名密钥，至少 32 位随机字符串 |
| `ALLOWED_ORIGIN` | 否 | 跨域前端地址（逗号分隔），同域部署无需设置 |

### 2. 本地开发

需要两个终端（或 API 已在 8788 端口运行时只需启动前端）：

```bash
npm install

# 终端 1：API（读取 .env）
npm run dev:api

# 终端 2：前端（/api 代理到 8788）
npm run dev
```

浏览器打开 **http://localhost:5173**，输入 `.env` 中的 `SITE_PASSWORD` 登录。

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:5173 | Vite 开发服务器 |
| API | http://localhost:8788 | 本地 API，读取 `.env` |

验证 API 是否正常：

```bash
curl http://localhost:8788/api/auth/check
# 应返回 {"authenticated":false}
```

---

### 3. 部署教程

本项目是 **静态前端 + Serverless API** 架构：浏览器访问 SPA，API 在服务端读取环境变量并连接 WebDAV，**密钥不会打包进前端**。

#### 3.1 部署前准备

1. **准备 WebDAV 存储**
   - 支持 Nextcloud、坚果云、Synology、Seafile 等 WebDAV 服务
   - 在 WebDAV 根目录创建或确认存在 `basic.memos.md`（也可通过 `WEBDAV_FILE_PATH` 指定其他路径）
   - 参考根目录 `basic.memos.md` 了解文件格式

2. **复制环境变量模板**

   ```bash
   cp .env.example .env
   ```

3. **填写并检查变量**

   | 变量 | 必填 | 说明 |
   |------|------|------|
   | `SITE_PASSWORD` | 是 | 网站访问密码，建议 16 位以上随机字符 |
   | `WEBDAV_URL` | 是 | WebDAV 根地址，如 `https://example.com/remote.php/dav/files/user` |
   | `WEBDAV_USERNAME` | 是 | WebDAV 用户名 |
   | `WEBDAV_PASSWORD` | 是 | WebDAV 密码或应用专用密码 |
   | `WEBDAV_FILE_PATH` | 否 | 相对路径，默认 `basic.memos.md` |
   | `AUTH_SECRET` | 强烈建议 | 会话签名密钥，至少 32 位随机字符串，**勿与 SITE_PASSWORD 相同** |
   | `ALLOWED_ORIGIN` | 否 | 跨域前端地址（逗号分隔），同域部署无需设置 |

4. **本地验证**

   ```bash
   npm run dev:api   # 终端 1
   npm run dev       # 终端 2
   ```

   登录后确认能加载、编辑、保存 memos。

5. **构建检查**

   ```bash
   npm run build
   ```

   无报错后再部署。

#### 3.2 部署到 Vercel（推荐）

1. 将项目推送到 GitHub / GitLab / Bitbucket
2. 打开 [Vercel](https://vercel.com) → **Add New Project** → 导入仓库
3. 框架预设选 **Vite**，保持默认：
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 展开 **Environment Variables**，添加全部必填变量（Production / Preview / Development 按需勾选）
5. 点击 **Deploy**
6. 部署完成后访问 `https://你的项目.vercel.app`

**说明：**

- `api/` 目录会自动作为 Serverless Functions 处理 `/api/*` 请求
- `vercel.json` 已配置 SPA 回退到 `index.html`
- 生产环境务必启用 HTTPS（Vercel 默认提供）

#### 3.3 部署到 Netlify

1. 打开 [Netlify](https://www.netlify.com) → **Add new site** → **Import an existing project**
2. 连接 Git 仓库
3. 构建设置（`netlify.toml` 已预配置，一般无需修改）：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Site configuration → Environment variables** 中添加全部环境变量
5. 触发部署

**说明：**

- API 由 `netlify/functions/api.ts` 提供
- `/api/*` 通过 `netlify.toml` 重写到 Netlify Functions

#### 3.4 部署到 Cloudflare Pages

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. 选择 **Pages** → **Connect to Git**
3. 构建设置：
   - Framework preset: None 或 Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Settings → Environment variables** 中添加变量（敏感项可设为 **Encrypt**）
5. 保存并部署

**说明：**

- API 由 `functions/[[path]].ts`（Pages Functions）提供
- `wrangler.toml` 中 `pages_build_output_dir = "dist"` 已配置

#### 3.5 部署后验证

按顺序检查：

```bash
# 1. 认证检查（未登录应为 false）
curl https://你的域名/api/auth/check

# 2. 浏览器打开站点，输入 SITE_PASSWORD 登录

# 3. 创建一条 memo 并刷新，确认数据已写入 WebDAV
```

**常见问题：**

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 登录后一直加载失败 | WebDAV 地址或凭据错误 | 检查 `WEBDAV_*` 变量，确认 WebDAV 可从公网访问 |
| 401 Unauthorized | 密码错误或 Cookie 未生效 | 确认 `SITE_PASSWORD`；生产环境需 HTTPS |
| 404 on /api/* | 平台函数未正确配置 | 确认使用了对应目录（`api/` / `netlify/functions/` / `functions/`） |
| 保存失败 500 | WebDAV 无写权限或路径错误 | 检查 `WEBDAV_FILE_PATH`，确认账号有 PUT 权限 |
| 登录频繁被限 | 触发速率限制 | 15 分钟内最多 10 次失败尝试，稍后再试 |

#### 3.6 安全建议

- **不要**将 `.env` 提交到 Git 或上传到公开位置
- 生产环境**必须**设置独立的 `AUTH_SECRET`
- WebDAV 账号建议使用**最小权限**（仅读写 memos 文件）
- 坚果云等建议使用**应用密码**，而非主账号密码
- 部署平台的环境变量界面填写密钥，不要写进代码仓库

---

## 功能

- 密码保护访问（环境变量 `SITE_PASSWORD`）
- 从 WebDAV 动态加载 `basic.memos.md`
- 支持 Thino 格式：日记（JOURNAL）、待办（TASK-TODO）、已完成（TASK-DONE）
- Markdown 渲染、标签筛选、搜索、置顶
- 快速记录、编辑、删除、待办勾选
- 修改后写回 WebDAV

---

## 项目结构

```
memos-web/
├── src/                 # React 前端
├── server/              # 共享 API 逻辑（认证、WebDAV、Thino 解析）
├── api/                 # Vercel Serverless
├── netlify/functions/   # Netlify Functions
├── functions/           # Cloudflare Pages Functions
├── basic.memos.md       # 格式样例
└── README.md            # 本文档 + Thino 格式说明
```

---

# Thino 格式说明（basic.memos.md）

基于 Flutter 的 Thino / Memos 客户端格式规范。根目录 `basic.memos.md` 涵盖所有记录类型与写法。

---

## 1. 文件整体结构

Thino 文件按**日期块**组织，每个日期下有多条 **thino 记录**。

```
# YYYY-MM-DD                          ← 日期标题（一级标题）

> [!thino] YYYY/MM/DD HH:mm:ss %% [id::...] [thinoType::...] [pinned::true] %%
> 记录正文第一行
> 记录正文第二行
>
> [!thino] YYYY/MM/DD HH:mm:ss %% [id::...] [thinoType::JOURNAL] %%
> ...
```

### 1.1 日期块

| 格式 | 含义 |
|------|------|
| `# 2026-06-10` | 当天所有记录的容器。解析器用正则 `^#\s+(\d{4}-\d{2}-\d{2})\s*$` 识别。 |

### 1.2 记录头（每条 memo 一行）

| 字段 | 格式 | 含义 |
|------|------|------|
| 引用块类型 | `[!thino]` | 固定，表示这是一条 Thino 记录 |
| 时间 | `2026/06/10 18:00:01` | 记录创建/显示时间，`YYYY/MM/DD HH:mm:ss` |
| 元数据区 | `%% ... %%` | 中间放结构化字段 |
| id | `[id::a100000000000001]` | **唯一 ID**，同步、编辑、删除都依赖它，不能丢 |
| 类型 | `[thinoType::JOURNAL]` | 记录类型，见下文 |
| 置顶 | `[pinned::true]` | 可选，置顶标记 |

### 1.3 记录正文

- 每条记录头下面的连续 `>` 行都属于该记录正文。
- 写入时每行变为 `> 正文内容`；空行写为单独的 `>`。
- 应用内正文是**去掉 `>` 前缀后**的内容，不含记录头。
- **不单独解析标题字段**：若用户写了 `### 标题`，它保留在正文中，由 Markdown 渲染。

---

## 2. 记录类型（thinoType）

| thinoType | 含义 | 正文格式 | UI 表现 |
|-----------|------|----------|---------|
| `JOURNAL` | 普通日记 | 任意 Markdown 正文 | 卡片渲染 Markdown；底部显示标签 |
| `TASK-TODO` | 进行中待办 | `- [ ]` / `- [x]` 清单行 + 可选标签行 | 卡片显示可点击 checkbox 列表 |
| `TASK-DONE` | 已完成待办 | 纯文本行（每项一行）+ 可选标签行 | 卡片显示全部已勾选的 checkbox 列表 |

### 2.1 JOURNAL（普通日记）

- 支持完整 Markdown：标题、粗体、斜体、删除线、列表、引用、链接、代码块等。
- Markdown 里的 `- [ ]` / `- [x]` **只是展示**，不会触发 TASK-TODO 逻辑。

### 2.2 TASK-TODO（待办）

**存储格式**：

```markdown
> [!thino] ... [thinoType::TASK-TODO] %%
> - [ ] 待办第一项
> - [x] 待办第二项（已勾选）
> - [ ] 待办第三项
> #工作
> #紧急
```

**规则**：

1. **清单行**：必须以 `- [ ]` 或 `- [x]` 开头。
2. **标签行**：以 `#标签名` 单独成行，**一行一个标签**。
3. **全部勾选**：自动变为 `TASK-DONE`。
4. **恢复待办**：`revertDoneToTodo` 恢复为 TASK-TODO，各项保持 `- [x]`。

### 2.3 TASK-DONE（已完成待办）

**存储格式**：

```markdown
> [!thino] ... [thinoType::TASK-DONE] %%
> 已完成待办第一项
> 已完成待办第二项
> #复盘
> #归档
```

- 正文每项一行纯文本，**没有** `- [ ]` 前缀。
- 点击某一项取消完成：仅该项变 `- [ ]`，其余仍 `- [x]`。

---

## 3. 标签系统

| 规则 | 说明 |
|------|------|
| 格式 | `#标签名`，`#` 后不能有空格 |
| 合法字符 | 字母、数字、`_`、`-`、中文 |
| 存储格式 | **一行一个标签**，在正文末尾 |

**文件示例**：

```markdown
> 正文内容
> #病情稳定
> #测试
```

---

## 4. 常见坑

1. **待办 + 标签**：标签必须单独成行。
2. **已完成待办恢复**：用 `revertDoneToTodo`，不要直接用 unchecked 转换。
3. **JOURNAL 与 TASK**：仅 `thinoType` 决定待办逻辑；正文里的 markdown checkbox 不触发 TASK 状态机。
4. **标签存储**：输出一行一个 `#标签`，不是 `#a #b` 同行。
