# AI Radio — Smoke Test 报告

> 本文档记录 AI Radio 项目从 T01–T13 编码完成后，T-Smoke-1 ~ T-Smoke-4 集成验证的结果与遗留问题。
>
> 详细调试过程见 `smoke-debug-notes.md`。

---

## 一句话结论

**核心闭环跑通**：登录 → 选歌单 → 启动电台 → DJ 播报 → 自动切歌 → 预生成下一段。
仍有少量已知遗留问题，记录在文末。

---

## 子任务通过情况

| 任务 | 状态 | 说明 |
|---|---|---|
| **T-Smoke-1** 登录闭环修复 | ✅ 通过 | commit `59138aa` |
| **T-Smoke-2** 端口/Docker/TTS 对齐 | ✅ 通过 | commit `53ad742` |
| **T-Smoke-3** 后端 API 集成验证 | ✅ 通过 | 通过时间：2026-05-12 10:25 |
| **T-Smoke-4** 前端 + 电台闭环 | ✅ 通过 | 通过时间：2026-05-15 |
| **T-Smoke-5** Docker 部署验证 | ⏳ 未执行 | 留待真实部署到 NAS 时做 |
| **T-Smoke-6** 闭环报告 | ✅ 本文 | |

---

## T-Smoke-1：登录闭环修复

### 修复内容
- 新建 `backend/src/services/user.service.ts`，提供 `upsertUser` / `getCurrentUser` / `clearUsers`
- `auth.routes.ts`：扫码 `code===803` 时，调网易云 `/login/status` 拿 uid/昵称写库；`/api/auth/status` 从 DB 读
- `netease.service.ts`：所有方法支持 `cookie` 透传
- `playlist.routes.ts`：未登录返回 401，自动从 DB 读当前用户 cookie
- 前端 `LoginView.vue`：扫码成功自动跳转 `/playlists`，3 秒轮询机制

### 验收
- backend `npm run build && npm run lint` 通过
- frontend `npm run type-check && npm run build` 通过
- Postman 实测扫码闭环可用

---

## T-Smoke-2：环境对齐修复

### 端口分配
| 服务 | 端口 |
|---|---|
| NeteaseCloudMusicApi | 3000 |
| 后端（本项目） | **3100** |
| 前端 Vite dev server | 5173 |
| Docker 容器内后端 | 3100（外部映射 `${PORT:-3100}:3100`） |

### Dockerfile
所有 stage 加 `apk add --no-cache python3 make g++`，解决 alpine 编译 `better-sqlite3` 失败问题。

### edge-tts 导入
`import { ttsSave } from 'edge-tts/out/index.js';` 路径验证可用。

> ⚠️ **注：T-Smoke-4 阶段发现 `edge-tts@1.0.1` 包签名算法过期，已替换为 `msedge-tts`。详见调试笔记。**

---

## T-Smoke-3：后端 API 集成验证

通过 Postman 验证以下端点，全部 2xx：

- `GET  /health`
- `POST /api/auth/qr-key`
- `POST /api/auth/qr-check`（手机扫码确认 → code 803）
- `GET  /api/auth/status`（持久化 OK）
- `GET  /api/playlists`（自动带 cookie）
- `GET  /api/weather?lat=&lon=`
- `GET  /api/playlists/:id`
- `POST /api/playlists/:id/analyze`（LLM 分析）

通过时间：2026-05-12 10:25

---

## T-Smoke-4：前端 + 电台闭环

### 已通过项

- ✅ 浏览器打开 http://localhost:5173 正常加载
- ✅ 登录扫码后自动跳转歌单页
- ✅ 歌单列表自动加载（无需输入 uid）
- ✅ 选中歌单 → 点"启动电台"→ 跳转 `/radio`
- ✅ DJ 中文音频可正常播放
- ✅ DJ 播完自动切到第一首歌
- ✅ 第一首歌播放途中预生成下一段（日志已验证）
- ✅ 暂停按钮：音频停止，状态同步后端
- ✅ 播放按钮（恢复）：从暂停位置继续播放（不重置进度）
- ✅ 停止按钮：音频停止 + UI 清空 + 后端同步

### 遗留 / 已知问题

见文末「遗留问题」章节。

---

## 期间发现并修复的关键 bug

| # | bug | 修复 commit | 备注 |
|---|---|---|---|
| 1 | `/api/playlists` 总是只返回 1 个空歌单 | T-Smoke-4 期间 | cookie 通过 HTTP header 传不被网易云 API 接受，改成 query param `?cookie=xxx` |
| 2 | `/api/radio/start` 报 503 WebSocket 错误 | T-Smoke-4 期间 | `edge-tts@1.0.1` 包签名算法过期，换成 `msedge-tts` |
| 3 | RadioControls 4 个按钮无响应 | T-Smoke-4 期间 | 按钮事件错绑到 radioStore actions（只调后端），改为绑到 useAudioPlayer 方法 |
| 4 | TTS 偶发 503 导致 `/next` 500 | T-Smoke-4 期间 | radio-engine 加 try/catch 容错，TTS 失败时跳过 DJ 段，不阻断队列 |

---

## 遗留问题（按优先级）

### 🟠 中高优先级

| # | 问题 | 应对策略 |
|---|---|---|
| L1 | Gemini 不可达，DJ 全用 fallback 文案 "接下来这首歌，和此刻的天气刚好合拍..." | 部署侧解决：保证后端能访问 `generativelanguage.googleapis.com`；或后续引入更丰富的 fallback 模板 |
| L2 | "下一段"按钮在某些场景下出现"反复播 DJ"现象 | ✅ 已通过 commit `d0c4456` 修复 |

### 🟡 低优先级

| # | 问题 | 应对策略 |
|---|---|---|
| L3 | RadioView 心跳 status 接口"间隔几秒"调用一次 | 怀疑 setInterval 被多次启动。检查 `RadioView.onMounted` 与 useAudioPlayer 单例的交互。修法简单 |
| L4 | LoginView 没真正渲染二维码图片，仅显示 key 字符串 | 用户需自己手动打开网易云 `/login/qr/create?key=xxx&qrimg=true` 拿 base64 → 浏览器粘贴。后续可前端直接渲染 |
| L5 | `AudioPlayer` 按钮使用 `||` `>` 占位符 | 视觉打磨范畴，T19 之后处理 |
| L6 | 后端无请求日志、无结构化日志 | 留给 T17（pino） |
| L7 | Cookie 在 SQLite 中明文存储 | 留给 T14（AES 加密） |
| L8 | 启动电台同步阻塞 15–30 秒（LLM + TTS 串行） | 留给 T18（歌单分析缓存）+ 后续异步化优化 |

---

## 本地启动指南（定版）

### 前置依赖
- Node.js ≥ 20
- 网络可访问 `generativelanguage.googleapis.com`（Gemini）
- 网络可访问 `speech.platform.bing.com`（Edge TTS）
- 手机网易云 APP（用于扫码登录）

### 一次性配置
1. 复制 `.env.example` 到项目根目录的 `.env`，填入：
   - `GEMINI_API_KEY=AIzaSy...`（[Google AI Studio](https://aistudio.google.com/apikey) 获取）
2. **额外步骤**：把 `.env` 复制一份到 `backend/.env`（后端 `dotenv/config` 默认从 `cwd` 读，cwd 在 `backend/`）
3. 安装依赖：
   ```cmd
   cd backend && npm install
   cd frontend && npm install
   ```

### 启动 3 个终端
```cmd
:: 终端 A
npx NeteaseCloudMusicApi

:: 终端 B
cd backend
npm run dev

:: 终端 C
cd frontend
npm run dev
```

### 首次使用流程
1. 浏览器打开 http://localhost:5173
2. 进入 `/login`，点"生成 Key"
3. **手动**用网易云 API 拿二维码图片（详见 `smoke-debug-notes.md` 的 Postman 步骤）
4. 手机扫码 + 确认
5. 自动跳到 `/playlists`，选一个歌单
6. 点"启动电台"→ 等 15–30 秒 → 跳到 `/radio`
7. 点播放按钮 → 听 DJ + 歌曲

### 常用排错
- **后端报 `Missing GEMINI_API_KEY`** → 检查 `backend/.env` 是否存在
- **歌单显示 `0 首`** → cookie 透传失败，重启后端
- **`/api/radio/start` 报 503** → Edge TTS 不通，检查 `msedge-tts` 是否替换 `edge-tts`
- **DJ 永远是 "接下来这首歌..."** → Gemini 没连上，检查网络和 API Key

---

## 后续路线建议

按优先级：

1. **T-Smoke-4 完整收尾** — 修 L2（下一段反复 DJ）+ L3（心跳频率），让 T-Smoke-4 完全通过
2. **T14** — Cookie AES 加密（部署到 NAS 前必做）
3. **T18** — 歌单分析缓存（避免每次启动电台都调 LLM 分析）
4. **T17** — 结构化日志（出问题排查方便）
5. **T-Smoke-5** — Docker 部署到 NAS 实测
6. T15 / T16 / T19 — 按需

---

## 涉及的提交（按时间顺序）

```
59138aa feat: implement login persistence and cookie passthrough (T-Smoke-1)
53ad742 fix: align dev ports, docker deps, tts import path (T-Smoke-2)
ce44c8f docs: codex-tasks 文件更新（含 T-Smoke 系列拆分）
   ...  T-Smoke-4 期间多个 fix commit（cookie / msedge-tts / 控制按钮 / TTS 容错）
```

详见 `git log --oneline`。
