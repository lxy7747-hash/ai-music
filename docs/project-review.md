# 项目审查报告 — AI Radio

**审查日期**: 2026-05-07  
**审查范围**: README.md 设计文档 + 仓库状态  
**审查人**: Claude (架构审查员)

---

## 1. 项目现状总结

**当前状态：设计阶段，零代码实现。**

仓库仅有 1 个 commit，包含 3 个文件：

| 文件 | 状态 | 说明 |
|------|------|------|
| `README.md` | ✅ 已提交 | 详细的设计文档（505 行），质量较高 |
| `AGENTS.md` | ❌ 未跟踪 | Codex 开发执行员角色定义 |
| `CLAUDE.md` | ❌ 未跟踪 | Claude 架构审查员角色定义 |

**README 质量评估**：整体非常详尽，涵盖了技术栈、API 设计、数据库 schema、数据流、组件树、部署方案。作为设计文档是合格的，但存在若干不一致和遗漏（详见下文）。

**核心缺失**：
- 零行业务代码（无 backend/、frontend/、Dockerfile 等）
- 无 `.gitignore`
- 无 `.env.example`
- 无 `package.json`
- 无任何配置文件

---

## 2. 问题清单（按严重程度排序）

### 🔴 Critical

#### C1. 缺少 `.gitignore`

**风险**：`.env` 文件包含 `GEMINI_API_KEY`，若被提交将导致 API Key 泄露。`node_modules/`、`dist/`、`data/`（SQLite 数据库含用户 cookie）同样面临误提交风险。

**影响**：安全事故 + 仓库膨胀。

#### C2. 项目结构路径与实际不一致

README 第 28 行写的是 `F:/project/musicObj2/`，但实际仓库位于 `F:/project/musicOb3/ai-music`。这是绝对路径硬编码的坏味道，且文件夹名不一致会让协作者困惑。

**影响**：文档可信度降低，协作者迷失。

#### C3. 网易云登录 Cookie 明文存储

README 中 `users` 表的 `cookie` 字段存储完整的网易云登录 cookie（TEXT 明文）。SQLite 文件 (`data/`) 若被泄露，攻击者可直接接管网易云账号。

**影响**：用户账号安全。

---

### 🟠 High

#### H1. 端口配置不一致

| 位置 | 配置值 | 说明 |
|------|--------|------|
| README §启动方式 | `npx → localhost:3000` | 直连方式 |
| README §Docker | `3001:3000` | 宿主机 3001 → 容器 3000 |
| README §NeteaseService 代码 | `baseUrl = 'http://localhost:3001'` | 硬编码 |

本地用 `npx` 启动时端口为 3000，但代码硬编码 3001，导致直连方式不可用。虽然 README 提到用 `PORT` 环境变量可以改，但代码中没有体现。

**影响**：本地开发体验差，首次启动必报错。

#### H2. 缺少 `.env.example`

README 引用了 `.env.example`（第 31 行），但仓库中不存在。开发者无法知道需要哪些环境变量、格式是什么。README 正文只提了 3 个变量（`NETEASE_API_URL`, `GEMINI_API_KEY`, `PORT`），但缺少 `NODE_ENV`、TTS 相关配置、天气 API 参数等。

**影响**：无法启动项目。

#### H3. 后端未设计鉴权中间件

所有 `/api/*` 路由均无认证机制。虽然当前是"个人"电台，但在局域网/NAS 部署场景下，任何局域网设备都可以调用 API 启动电台、获取用户歌单。

**影响**：局域网内未授权访问。

#### H4. 无输入校验

API 设计中没有提到 request body/query 的校验（如 `playlistId` 格式、`lat/lon` 范围），缺少 Zod/Joi 等校验库。LLM 返回内容也未提及校验。

**影响**：运行时错误、LLM prompt injection 风险。

---

### 🟡 Medium

#### M1. 缺少日志与可观测性

未提到日志策略（pino/winston）、请求 ID（便于追踪 DJ 生成链路的每一步）、健康检查端点（`/health`）。Docker compose 中也没有健康检查配置。

**影响**：生产环境故障排查困难。

#### M2. LLM 调用无超时/重试/降级策略

README 只描述了"网络中断自动重试 3 次"在前端，但后端调用 Gemini、Edge TTS、Open-Meteo 均未提及超时和降级策略。特别是 Gemini API 可能因 quota、网络问题失败，没有 fallback 脚本模板。

**影响**：电台核心流程脆弱。

#### M3. SQLite 并发与 WAL 模式

电台播放过程中有频繁读写（更新播放队列状态 + 同时写入新生成的 DJ 脚本），SQLite 默认 journal_mode=delete 在并发下容易 BUSY。未提及启用 WAL 模式。

**影响**：电台播放中可能出现数据库锁冲突。

#### M4. 歌曲版权处理不完整

README 提到了 `/music/url` 返回 403 的情况和备用 URL `https://music.163.com/song/media/outer/url?id={id}.mp3`，但这个公开兜底地址近年已基本失效。`radio-engine.service.ts` 的设计中未提及版权检测和跳歌逻辑。

**影响**：电台播放到无版权歌曲时静默失败。

#### M5. 缺少 API 版本前缀

API 路由设计为 `/api/auth/*`、`/api/radio/*`，但没有版本号（如 `/api/v1/`）。未来 API 变更时会比较被动。

**影响**：API 演进困难。

#### M6. 流媒体代理缺少鉴权

`/api/stream/audio/:path` 用于提供 DJ 音频，但路径参数如果可遍历（如 `../../../etc/passwd`），存在路径穿越风险。需要在实现时注意。

**影响**：潜在的文件读取漏洞。

---

### 🟢 Low

#### L1. 缺少 TypeScript 严格模式配置

README 提到 `tsconfig.json` 但未说明是否启用 `strict: true`。建议从项目初期就启用。

#### L2. 无 Lint/Format 工具配置

缺少 ESLint + Prettier 配置，多人协作时代码风格不一致。

#### L3. 无测试策略

README 的"验证方案"是手动 curl 测试，未提及单元测试 / 集成测试框架（Vitest/Jest）。

#### L4. 缺少 LICENSE 文件

开源项目应有明确的许可证。

#### L5. PWA 实现细节缺失

README 提到 PWA（manifest + service worker），但未说明缓存策略（Stale-While-Revalidate？Cache-First？），也未说明 service worker 如何处理流媒体音频的缓存。

#### L6. 前端无错误边界/Suspense

Vue 3 支持 Suspense 和错误边界（onErrorCaptured），但组件树设计中没有体现加载态和错误态组件。

#### L7. `AGENTS.md` 与 `CLAUDE.md` 未纳入版本控制

这两个文件定义了团队协作规则，应该提交到仓库。

---

## 3. 推荐重构方案

由于项目目前只有设计文档、无代码，不存在"重构"——而是需要在**开始编码前补齐基础设施**。

### 阶段 0：基础设施（优先级最高，2-3 小时）

1. 创建 `.gitignore`（Node.js + Vue + Docker 模板）
2. 创建 `.env.example` 并列出所有必需变量
3. 初始化 `backend/` 和 `frontend/` 的 `package.json`
4. 创建 `tsconfig.json`（strict 模式）
5. 创建 `docker-compose.yml` 和 `Dockerfile`
6. 配置 ESLint + Prettier
7. 提交 `AGENTS.md` 和 `CLAUDE.md`

### 阶段 1：核心风险验证（README 步骤 1-4，优先级高）

按 README 既定的 10 步顺序执行，但需要将第 2 步（网易云 API 验证）作为第一优先级，因为这是整个项目的关键外部依赖。

### 关键设计修正（在实现时注意）

1. **NeteaseService** 的 baseUrl 从 `config.ts` 的环境变量读取，不硬编码
2. **Cookie 存储**：至少做 base64 混淆，最好用环境变量 `COOKIE_ENCRYPTION_KEY` 做 AES 加密
3. **LLM 调用**：加 10s 超时 + 3 次重试 + 降级到预设模板脚本
4. **SQLite**：连接时启用 `PRAGMA journal_mode=WAL;`
5. **所有外部 API 调用**：统一通过 `error-handler.ts` 中间件捕获并返回标准错误格式
6. **流媒体路由**：使用白名单（只允许访问 TTS 缓存目录内的文件），禁止路径穿越

---

## 4. 给 Codex 的任务列表（摘要）

详细任务卡片见 `docs/codex-tasks.md`。

| 编号 | 任务 | 优先级 |
|------|------|--------|
| T01 | 创建 `.gitignore` | 🔴 Critical |
| T02 | 创建 `.env.example` | 🟠 High |
| T03 | 修正 README 路径和端口不一致 | 🟠 High |
| T04 | 初始化后端项目脚手架 | 🟠 High |
| T05 | 初始化前端项目脚手架 | 🟠 High |
| T06 | 创建 Docker 配置文件 | 🟡 Medium |
| T07 | 验证网易云 API 可用性 | 🔴 Critical |
| T08 | 数据库建表 + WAL 模式 | 🟠 High |
| T09 | 核心服务层实现 | 🟠 High |
| T10 | API 路由实现 | 🟡 Medium |
| T11 | 前端页面与组件 | 🟡 Medium |
| T12 | 音频播放器 | 🟡 Medium |
| T13 | PWA + 打磨 | 🟢 Low |

---

## 5. 扩展性评估（个性化 AI 电台）

**结论：当前设计适合扩展。**

优点：
- SQLite 零依赖，迁移 NAS 无摩擦
- 状态机设计（RadioEngineService）扩展新模式只需加状态
- LLM + TTS 解耦，可替换为其他模型
- 歌单分析结果（genre_tags, mood_tags）已持久化，支持离线分析

潜在扩展点（不在当前范围，仅记录）：
- 多用户支持：users 表已有基础，但 radio_sessions 缺少 user_id 外键
- 推荐系统：可基于播放记录训练协同过滤
- 社交功能：分享电台片段
- 多语言 DJ：Edge TTS 支持多语言，切换语言模型即可
