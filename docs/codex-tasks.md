# Codex 开发任务列表 — AI Radio

> **说明**：按顺序执行，每个任务完成后标记 `[x]`。一次只做 1 个任务。

---

## [x] T01 — 创建 `.gitignore`

**优先级**: 🔴 Critical  
**预计耗时**: 10 分钟  
**前置依赖**: 无

### 目标
创建完备的 `.gitignore`，防止敏感文件和构建产物被提交。

### 涉及文件
- `F:\project\musicOb3\ai-music\.gitignore`（新建）

### 验收标准
- [ ] 文件存在于仓库根目录
- [ ] 包含以下忽略规则：
  - `.env`（所有环境变量文件）
  - `node_modules/`
  - `dist/`、`build/`
  - `data/`（SQLite 数据库 + TTS 缓存）
  - `*.db`、`*.sqlite`
  - `.DS_Store`、`Thumbs.db`
  - `*.log`
  - `.vscode/`（可选，团队约定）
  - `coverage/`
- [ ] 确认 `git status` 不再显示 `.env`（如果已创建的话）

### 注意事项
- 使用 GitHub 官方 Node.gitignore 模板作为基准
- `.env.example` 不在忽略列表中（需要提交）
- 参考：https://github.com/github/gitignore/blob/main/Node.gitignore

---

## [x] T02 — 创建 `.env.example`

**优先级**: 🟠 High  
**预计耗时**: 15 分钟  
**前置依赖**: 无

### 目标
创建 `.env.example` 模板文件，列出所有必需和可选的环境变量。

### 涉及文件
- `F:\project\musicOb3\ai-music\.env.example`（新建）

### 验收标准
- [ ] 文件存在于仓库根目录
- [ ] 包含以下变量（标注必需/可选、示例值、说明）：

```env
# === 网易云 API ===
# 本地开发: http://localhost:3000
# Docker 部署: http://netease-api:3000
NETEASE_API_URL=http://localhost:3000

# === Gemini API ===
# 必需。从 https://aistudio.google.com/apikey 获取
GEMINI_API_KEY=your_gemini_api_key_here

# === 服务器 ===
PORT=3000
NODE_ENV=development

# === 数据库 ===
# SQLite 文件存储路径（相对于 backend/）
DB_PATH=./data/radio.db

# === TTS 缓存 ===
TTS_CACHE_DIR=./data/tts-cache

# === 日志 ===
LOG_LEVEL=debug

# === 安全（可选） ===
# Cookie 加密密钥，不设置则明文存储
# COOKIE_ENCRYPTION_KEY=your_random_32_char_string
```

- [ ] 注释清晰，能够指导开发者首次配置

### 注意事项
- `.env.example` 中的值都是示例/占位符，不能包含真实 key
- 不要忘记在 T01 的 `.gitignore` 中确认 `.env` 已被忽略

---

## [x] T03 — 修正 README 中的路径和端口不一致

**优先级**: 🟠 High  
**预计耗时**: 10 分钟  
**前置依赖**: 无

### 目标
修正 README.md 中的错误和遗漏。

### 涉及文件
- `F:\project\musicOb3\ai-music\README.md`（编辑）

### 具体要求

1. **第 28 行** `F:/project/musicObj2/` → 改为 `ai-music/`（使用相对路径或通用占位符）
2. **NeteaseService 代码示例**中的 `baseUrl` 从 `'http://localhost:3001'` 改为 `config.neteaseApiUrl`，说明从环境变量读取
3. **Docker compose** 节中的 `NETEASE_API_URL=http://netease-api:3000` 保持不变（这是容器内地址，正确）
4. 在 `.env` 示例块中增加 `NODE_ENV`、`DB_PATH`、`TTS_CACHE_DIR`、`LOG_LEVEL`

### 验收标准
- [ ] README 中不再出现 `F:/project/musicObj2/` 绝对路径
- [ ] NeteaseService 示例代码体现环境变量读取
- [ ] 端口说明在文档中一致

### 注意事项
- 不要删除任何已有的技术内容
- 改动范围仅限 README.md

---

## [x] T04 — 初始化后端项目脚手架

**优先级**: 🟠 High  
**预计耗时**: 30 分钟  
**前置依赖**: T01, T02

### 目标
创建 `backend/` 目录并初始化 Node.js + Express + TypeScript 项目。

### 涉及文件（新建）
```
backend/
├── package.json
├── tsconfig.json
├── .eslintrc.cjs          (或 eslint.config.js)
├── .prettierrc
└── src/
    ├── index.ts            (最小 Express 入口，含 /health 端点)
    └── config.ts           (读取环境变量)
```

### 验收标准

**package.json**:
- [ ] `npm init` 生成的合法 package.json
- [ ] 依赖：`express`, `better-sqlite3`, `cors`, `dotenv`
- [ ] 开发依赖：`typescript`, `@types/express`, `@types/better-sqlite3`, `@types/cors`, `tsx`, `eslint`, `prettier`
- [ ] scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist/index.js), `lint`, `format`

**tsconfig.json**:
- [ ] `strict: true`
- [ ] `target: "ES2022"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`
- [ ] `outDir: "./dist"`, `rootDir: "./src"`
- [ ] `esModuleInterop: true`, `resolveJsonModule: true`

**src/config.ts**:
- [ ] 导出 `config` 对象，从 `process.env` 读取所有变量（参考 T02）
- [ ] 对必需变量做断言（如 `GEMINI_API_KEY`），缺失时抛出明确错误
- [ ] 提供合理默认值

**src/index.ts**:
- [ ] 加载 `dotenv`（顶部 `import 'dotenv/config'` 或手动调用）
- [ ] 创建 Express app
- [ ] 挂载 CORS 中间件
- [ ] 挂载 JSON body parser
- [ ] `GET /health` 返回 `{ status: "ok", timestamp: Date.now() }`
- [ ] 监听 `config.port`
- [ ] `console.log` 输出启动信息（端口、环境）

### 注意事项
- `tsx` 用于开发热重载，不要用 `ts-node`（已过时）
- `better-sqlite3` 是 native addon，首次 `npm install` 需要编译工具链（Windows 需要 `windows-build-tools`）
- ESLint 配置使用 `@typescript-eslint` 规则集

---

## [x] T05 — 初始化前端项目脚手架

**优先级**: 🟠 High  
**预计耗时**: 30 分钟  
**前置依赖**: T01

### 目标
创建 `frontend/` 目录并用 Vite 初始化 Vue 3 + TypeScript + Tailwind CSS 项目。

### 涉及文件（新建）
```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    ├── main.ts
    ├── App.vue
    └── router/index.ts       (Vue Router，仅 / 路由，空壳页面)
```

### 验收标准

**package.json**:
- [ ] 依赖：`vue`, `vue-router`, `pinia`
- [ ] 开发依赖：`vite`, `@vitejs/plugin-vue`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `vue-tsc`
- [ ] scripts: `dev`, `build`, `preview`, `type-check`

**vite.config.ts**:
- [ ] `@vitejs/plugin-vue` 插件
- [ ] `server.proxy` 配置：`/api` → `http://localhost:3000`（后端开发地址）
- [ ] 可选：`server.proxy` 也代理 `/api/stream`（如果有 websocket 需求）

**tailwind.config.js**:
- [ ] `content` 指向 `./index.html` 和 `./src/**/*.{vue,ts,js}`

**src/main.ts**:
- [ ] 创建 Vue app
- [ ] 注册 Pinia
- [ ] 注册 Vue Router
- [ ] 挂载到 `#app`

**src/App.vue**:
- [ ] `<router-view />` 组件
- [ ] 可以暂时只显示 "AI Radio" 文字

**src/router/index.ts**:
- [ ] `createRouter` with `createWebHistory`
- [ ] 一条路由：`/` → `HomeView.vue`（简单占位页面）

### 注意事项
- 使用 `npm create vite@latest` 然后再装依赖的方式也可以，但确保最终结构匹配 README 描述
- `vue-tsc` 用于类型检查，不要跳过
- 后端代理地址使用环境变量 `VITE_API_BASE_URL`（可选，开发时用 vite proxy）

---

## [x] T06 — 创建 Docker 配置文件

**优先级**: 🟡 Medium  
**预计耗时**: 20 分钟  
**前置依赖**: T04, T05（需要 package.json 存在后才知道构建命令）

### 目标
创建 `Dockerfile`、`docker-compose.yml` 和 `.dockerignore`。

### 涉及文件（新建）
- `F:\project\musicOb3\ai-music\Dockerfile`
- `F:\project\musicOb3\ai-music\docker-compose.yml`
- `F:\project\musicOb3\ai-music\.dockerignore`

### 验收标准

**Dockerfile**（参考 README 设计）:
- [ ] 多阶段构建：Stage 1 构建前端，Stage 2 构建后端 + 复制前端产物到 `public/`
- [ ] 使用 `node:20-alpine` 镜像
- [ ] 后端 `npm ci --omit=dev` 减小镜像体积
- [ ] `CMD ["node", "dist/index.js"]`
- [ ] `EXPOSE 3000`

**docker-compose.yml**（参考 README 设计）:
- [ ] `netease-api` 服务：`image: binaryify/netease_cloud_music_api`，端口 `3001:3000`
- [ ] `ai-radio` 服务：`build: .`，端口 `${PORT:-3000}:3000`
- [ ] `depends_on: netease-api`
- [ ] volume 挂载 `./data:/app/data` 和 `./.env:/app/.env:ro`
- [ ] `restart: unless-stopped`
- [ ] 时区设置 `TZ=Asia/Shanghai`

**.dockerignore**:
- [ ] `node_modules/`, `.git/`, `.env`, `data/`, `dist/`, `*.log`, `.DS_Store`

### 注意事项
- Dockerfile 中的路径假设后端 `package.json` 在 `backend/`，前端在 `frontend/`，注意 COPY 路径
- 确保 `data/` 目录在 volume 挂载后自动创建（或有 `mkdir -p`）

---

## [x] T07 — 验证网易云 API 可用性

**优先级**: 🔴 Critical  
**预计耗时**: 1 小时  
**前置依赖**: 无（独立验证脚本）

### 目标
在开始编码前，确认 NeteaseCloudMusicApi 可以正常启动，并验证关键接口。

### 涉及文件
- 不需要创建项目文件，使用临时测试脚本或 curl 命令

### 验收标准

1. **启动 API 服务**:
   - [ ] `npx NeteaseCloudMusicApi` 成功在 `localhost:3000` 启动
   - [ ] `GET http://localhost:3000/login/qr/key` 返回 `{ data: { unikey: "..." } }`

2. **登录流程**（至少走到获取 cookie）:
   - [ ] 获取二维码 key
   - [ ] 生成二维码（base64 或图片）
   - [ ] 扫码后 `check` 接口返回 `code: 800` + cookie

3. **歌单接口**:
   - [ ] 用 cookie 调用 `/user/playlist?uid=xxx` 获取歌单列表
   - [ ] 调用 `/playlist/detail?id=xxx` 获取歌单内容和歌曲列表

4. **流媒体 URL**:
   - [ ] 用 `/music/url?id=xxx` 获取某首热门歌曲的播放 URL（验证非 403）
   - [ ] 记录有多少歌曲返回 403（版权限制）
   - [ ] 测试备用 URL `https://music.163.com/song/media/outer/url?id={id}.mp3` 是否可用

### 注意事项
- 这个任务不产生持久化代码，但结果应记录在 `docs/api-verification.md` 中
- 如果备用 URL 也失效，需要在后续开发中实现"跳过无版权歌曲"逻辑
- 海外网络需要传 `realIP` 参数（使用国内 IP）

---

## [x] T08 — 数据库建表 + WAL 模式

**优先级**: 🟠 High  
**预计耗时**: 30 分钟  
**前置依赖**: T04

### 目标
实现 SQLite 数据库初始化、建表 DDL、WAL 模式启用。

### 涉及文件
```
backend/src/db/
├── connection.ts      (新建)
└── schema.ts          (新建)
```

### 验收标准

**connection.ts**:
- [ ] 使用 `better-sqlite3` 创建数据库连接
- [ ] 数据库文件路径从 `config.dbPath` 读取
- [ ] 连接时执行 `PRAGMA journal_mode=WAL;`
- [ ] 连接时执行 `PRAGMA foreign_keys=ON;`
- [ ] 导出单例 `db` 实例

**schema.ts**:
- [ ] 导出 `initializeDatabase()` 函数
- [ ] 使用 `CREATE TABLE IF NOT EXISTS` 建以下 5 张表：

| 表名 | 关键字段 | 索引 |
|------|---------|------|
| users | id, netease_uid(UNIQUE), nickname, avatar_url, cookie, created_at | netease_uid |
| playlists | id, user_id(FK), name, cover_url, track_count, description, is_favorite, synced_at | user_id |
| playlist_tracks | id, playlist_id(FK), name, artists(JSON TEXT), album, duration_ms, genre_tags(JSON), mood_tags(JSON) | playlist_id |
| radio_sessions | id(UUID TEXT), name, playlist_id(FK), status, weather_city, weather_data(JSON), started_at, ended_at | status, playlist_id |
| session_queue | id(INTEGER PK), session_id(FK), position, entry_type('song'/'dj_announcement'), track_id, dj_script, dj_audio_path, weather_ref(JSON), status, played_at | session_id, (session_id, position) |

- [ ] `initializeDatabase()` 在 `src/index.ts` 启动时调用
- [ ] 字段类型匹配 README 设计

### 注意事项
- `artists` 存储为 `TEXT`（JSON.stringify 后的数组），读时 JSON.parse
- `entry_type` 加 CHECK 约束：`CHECK(entry_type IN ('song', 'dj_announcement'))`
- `status` 加 CHECK 约束：`CHECK(status IN ('pending', 'playing', 'played', 'skipped'))`
- Cookie 加密/解密逻辑暂不实现（后续任务），当前先明文存储但记录 TODO
- WAL 模式在应用退出前不需要特殊处理，better-sqlite3 会自动 checkpoint

---

## [x] T09 — 核心服务层实现

**优先级**: 🟠 High  
**预计耗时**: 3-4 小时  
**前置依赖**: T04, T07, T08

### 目标
实现 README 设计的 6 个核心 Service。

### 涉及文件（全部新建）
```
backend/src/services/
├── netease.service.ts
├── llm.service.ts
├── tts.service.ts
├── weather.service.ts
├── radio-engine.service.ts
└── audio-cache.service.ts
```

### 具体验收标准

#### 9.1 netease.service.ts
- [ ] `class NeteaseService` 单例
- [ ] `baseUrl` 从 `config.neteaseApiUrl` 读取，不硬编码
- [ ] 实现以下方法（签名对应 README）：
  - `getLoginQRKey(): Promise<string>`
  - `checkQRStatus(key): Promise<{code, cookie, nickname?}>`
  - `getUserPlaylists(uid): Promise<Playlist[]>`
  - `getPlaylistTracks(playlistId, limit?, offset?): Promise<Track[]>`
  - `getTrackUrl(trackId, br?): Promise<string | null>`（失败返回 null）
  - `getTrackDetail(trackIds): Promise<TrackDetail[]>`
  - `search(keyword, type?): Promise<SearchResult>`
  - `checkMusic(trackId): Promise<boolean>`
- [ ] 所有方法有 10s 超时（AbortController）
- [ ] 非 2xx 响应抛出 `NeteaseApiError`

#### 9.2 llm.service.ts
- [ ] 封装 Gemini API 调用（使用 `@google/generative-ai` SDK 或直接 fetch）
- [ ] 方法：
  - `analyzePlaylist(tracks): Promise<{genreDistribution, moodDistribution, tempoCluster}>`
  - `generateDjScript(context: DjScriptContext): Promise<string>`（context 包含天气、当前歌、下一首歌、歌单风格）
- [ ] 10s 超时
- [ ] 3 次重试（指数退避：1s, 2s, 4s）
- [ ] 失败时返回预设模板脚本（降级策略）

#### 9.3 tts.service.ts
- [ ] 封装 Edge TTS 调用（使用 `edge-tts` npm 包或直接调用微软 API）
- [ ] 方法：
  - `synthesize(text: string, outputPath: string, voice?: string): Promise<void>`
- [ ] 默认语音：`zh-CN-XiaoxiaoNeural`
- [ ] 输出格式：mp3
- [ ] 15s 超时
- [ ] 文件已存在则跳过（缓存命中）

#### 9.4 weather.service.ts
- [ ] 调用 Open-Meteo API（免费，无需 key）
- [ ] 方法：
  - `getWeather(lat: number, lon: number): Promise<WeatherData>`
- [ ] `WeatherData` 包含：temperature, weatherCode, weatherDescription, windSpeed, cityName（可选）
- [ ] 天气代码映射为中文描述（如 code=61 → "小雨"）
- [ ] 5s 超时

#### 9.5 radio-engine.service.ts ★ 核心
- [ ] `class RadioEngineService` 单例
- [ ] 状态机状态：`idle → running → paused/stopped`
- [ ] 方法：
  - `startSession(params): Promise<StartResult>` — 启动电台
  - `getNextSegment(sessionId): Promise<Segment>` — 获取下一段
  - `pauseSession(sessionId): void`
  - `resumeSession(sessionId): void`
  - `stopSession(sessionId): void`
  - `getSessionStatus(sessionId): SessionStatus`
- [ ] `startSession` 流程：
  1. 从歌单获取歌曲列表
  2. LLM 分析歌单特征
  3. 获取天气
  4. LLM 生成 DJ intro + 选第一首歌
  5. TTS 合成 DJ intro 音频
  6. 写入 session_queue（DJ条目 → 歌曲条目）
  7. 返回 sessionId + 第一段音频 URL 信息
- [ ] `getNextSegment` 流程（预生成逻辑）：
  1. 标记当前歌曲为 played
  2. 如果队列中有预生成的条目，直接返回
  3. 否则：生成下一段 DJ 脚本 → TTS → 写入队列 → 返回

#### 9.6 audio-cache.service.ts
- [ ] 管理 TTS 音频文件的生命周期
- [ ] 方法：
  - `getCachePath(sessionId, segmentIndex): string` — 生成缓存文件路径
  - `cleanup(sessionId): void` — 删除指定会话的所有缓存
  - `cleanupOld(days?: number): void` — 清理超过 N 天的旧缓存
- [ ] 缓存目录从 `config.ttsCacheDir` 读取

### 注意事项
- 所有 Service 都不要直接调用 `process.exit()`，错误向上抛
- Service 之间的依赖通过构造函数注入或 import 单例
- `radio-engine.service.ts` 是最复杂的模块，需要仔细处理并发（多个 `/next` 请求不能同时生成）
  - 建议使用 Promise 锁：`if (this.generating.has(sessionId)) return this.generating.get(sessionId)`
- 天气代码映射表参考：https://open-meteo.com/en/docs（WMO Weather codes）

---

## T10 — API 路由实现

**优先级**: 🟡 Medium  
**预计耗时**: 2 小时  
**前置依赖**: T04, T09

### 目标
实现所有 REST API 路由，连接 Express Router 到 Service 层。

### 涉及文件（新建）
```
backend/src/routes/
├── auth.routes.ts
├── playlist.routes.ts
├── radio.routes.ts
├── weather.routes.ts
└── stream.routes.ts

backend/src/middleware/
├── error-handler.ts
└── cors.ts
```

### 验收标准

**middleware/error-handler.ts**:
- [ ] Express 错误处理中间件（4 参数签名）
- [ ] 捕获所有未处理异常
- [ ] 返回统一 JSON 格式：`{ error: { code, message, requestId? } }`
- [ ] 区分已知错误（4xx）和未知错误（5xx）
- [ ] 开发环境返回 stack trace，生产环境不返回

**middleware/cors.ts**:
- [ ] 导出 CORS 配置（开发环境允许 localhost，生产环境从环境变量读取允许域）

**routes/auth.routes.ts**:
- [ ] `POST /api/auth/qr-key` → 返回 `{ key }`
- [ ] `POST /api/auth/qr-check` → body `{ key }` → 返回扫码状态
- [ ] `GET /api/auth/status` → 返回登录状态 + 用户信息

**routes/playlist.routes.ts**:
- [ ] `GET /api/playlists` → 用户歌单列表（需要登录态）
- [ ] `GET /api/playlists/:id` → 歌单详情 + 歌曲列表
- [ ] `POST /api/playlists/:id/analyze` → LLM 分析歌单

**routes/radio.routes.ts**:
- [ ] `POST /api/radio/start` → body `{ playlistId, lat, lon, city? }`
- [ ] `POST /api/radio/:id/next` → 获取下一段
- [ ] `POST /api/radio/:id/pause` → 暂停
- [ ] `POST /api/radio/:id/resume` → 恢复
- [ ] `POST /api/radio/:id/stop` → 停止
- [ ] `GET /api/radio/:id/status` → 当前状态

**routes/weather.routes.ts**:
- [ ] `GET /api/weather?lat=xxx&lon=xxx` → 天气数据

**routes/stream.routes.ts**:
- [ ] `GET /api/stream/audio/:path(*)` → 静态文件服务
- [ ] 路径白名单检查：只允许访问 `config.ttsCacheDir` 下的文件

### 注意事项
- 所有路由使用 `express.Router()`
- 在 `src/index.ts` 中 `app.use('/api/auth', authRoutes)` 等方式挂载
- 鉴权中间件暂不实现（个人项目），但要预留中间件挂载位置：
  ```ts
  // router.use(authMiddleware); // TODO: T14
  ```

---

## T11 — 前端页面与组件

**优先级**: 🟡 Medium  
**预计耗时**: 3-4 小时  
**前置依赖**: T05, T10

### 目标
实现所有前端页面和组件，前端功能完备。

### 涉及文件（新建/修改）
```
frontend/src/
├── services/api.ts               (新建)
├── stores/
│   ├── radio.ts                  (新建)
│   ├── player.ts                 (新建)
│   └── user.ts                   (新建)
├── composables/
│   ├── useAudioPlayer.ts         (新建)
│   └── useMediaSession.ts        (新建)
├── views/
│   ├── HomeView.vue              (新建)
│   ├── LoginView.vue             (新建)
│   ├── PlaylistsView.vue         (新建)
│   ├── RadioView.vue             (新建)
│   └── SettingsView.vue          (新建)
├── components/
│   ├── AudioPlayer.vue           (新建)
│   ├── NowPlaying.vue            (新建)
│   ├── DJAnnouncement.vue        (新建)
│   ├── PlaylistCard.vue          (新建)
│   ├── SongList.vue              (新建)
│   ├── WeatherBadge.vue          (新建)
│   ├── RadioControls.vue         (新建)
│   └── layout/
│       ├── AppShell.vue          (新建)
│       └── TopBar.vue            (新建)
└── router/index.ts               (修改：添加所有路由)
```

### 验收标准

**services/api.ts**:
- [ ] 封装所有后端 API 调用，返回 typed Promise
- [ ] 统一错误处理
- [ ] `baseURL` 根据环境自动切换（dev: vite proxy, prod: 同源）

**stores/ (Pinia)**:
- [ ] `user store`：登录状态、用户信息、cookie
- [ ] `radio store`：会话状态、队列、当前播放项、天气
- [ ] `player store`：播放状态、时间、音量、音频类型

**composables/**:
- [ ] `useAudioPlayer`：分段队列管理、自动切换、预加载下一段
- [ ] `useMediaSession`：锁屏媒体信息 + 控制按钮

**views/**:
- [ ] `HomeView`：天气卡片 + 快速启动电台 + 最近会话
- [ ] `LoginView`：二维码展示 + 轮询扫码状态
- [ ] `PlaylistsView`：歌单网格展示 + 点击进入分析
- [ ] `RadioView`：主电台界面（NowPlaying + 队列 + 控制按钮）
- [ ] `SettingsView`：城市设置、语音选择（占位）

**components/**:
- [ ] `AudioPlayer`：底部固定播放条，跨页面存在
- [ ] `NowPlaying`：旋转封面 + 歌曲信息 + DJ 气泡
- [ ] `RadioControls`：播放/暂停/下一首/停止
- [ ] `WeatherBadge`：天气图标 + 温度
- [ ] `PlaylistCard`：歌单封面 + 名称 + 歌曲数
- [ ] `SongList`：可折叠队列列表
- [ ] `DJAnnouncement`：DJ 播报文字动画气泡

### 注意事项
- 移动端优先：所有组件在 375px 宽度下可用
- 使用 Tailwind CSS 的响应式断点（`sm`, `md`, `lg`）
- Vue 3 Composition API（`<script setup>` 语法）
- 所有组件都要处理：加载态、空态、错误态

---

## T12 — 音频播放器

**优先级**: 🟡 Medium  
**预计耗时**: 2 小时  
**前置依赖**: T11

### 目标
实现完整的分段音频播放队列，支持 iOS/Android 锁屏控制。

### 涉及文件
```
frontend/src/composables/
├── useAudioPlayer.ts      (完善)
└── useMediaSession.ts     (完善)
```

### 验收标准

**useAudioPlayer.ts**:
- [ ] 维护分段队列 `[{type, url, metadata}]`
- [ ] `<audio>` 元素单例，监听 `ended` 事件自动切到下一段
- [ ] 当前是 song 时，立即 POST `/next` 预生成下下段
- [ ] 网络错误自动重试 3 次，间隔 2s
- [ ] `play()`, `pause()`, `next()`, `stop()`, `addToQueue()` 方法
- [ ] 导出响应式状态：`isPlaying`, `currentItem`, `queue`, `progress`

**useMediaSession.ts**:
- [ ] 设置 `navigator.mediaSession.metadata`（title, artist, album, artwork）
- [ ] 注册 action handlers：play, pause, previoustrack, nexttrack, stop
- [ ] 同步到 player store

### 注意事项
- iOS Safari 对自动播放有限制，首次播放必须是用户手势触发
- Android Chrome 的 Media Session 支持较好，iOS Safari 从 15+ 开始支持
- 音频 URL 可能跨域，需要确认网易云 CDN 的 CORS 头（可能需要服务端代理）

---

## T13 — PWA + 打磨

**优先级**: 🟢 Low  
**预计耗时**: 1.5 小时  
**前置依赖**: T12

### 目标
添加 PWA 支持、错误处理、加载态、空态。

### 涉及文件
```
frontend/public/
├── manifest.json        (新建)
└── sw.js                (新建)

frontend/index.html      (修改：添加 manifest 链接)
frontend/src/main.ts     (修改：注册 service worker)
```

### 验收标准

**manifest.json**:
- [ ] 应用名：AI Radio
- [ ] 图标：提供 192x192 + 512x512 两个尺寸（PNG 占位）
- [ ] `display: standalone`
- [ ] `theme_color` 和 `background_color`

**sw.js**:
- [ ] 缓存策略：静态资源 Cache-First，API 请求 Network-First
- [ ] 音频文件不缓存（只缓存 DJ 片段？权衡后决定）
- [ ] 离线回退页面

**打磨**:
- [ ] 所有页面处理：加载态（骨架屏/Spinner）、空态（引导文案）、错误态（重试按钮）
- [ ] 路由切换过渡动画
- [ ] 电台播放中的心跳检测（前端定时 GET `/status`，若后端会话已死则提示）

### 注意事项
- Service worker 在开发环境禁用（或仅在 `npm run build` 时启用）
- 音频流不建议被 SW 缓存（占用存储 + 版权问题）

---

## 后续扩展任务（暂不执行）

| 编号 | 任务 | 时机 |
|------|------|------|
| T14 | Cookie AES 加密存储 | T08 完成后可做 |
| T15 | LLM prompt 模板文件化（从代码抽到 `.md` 文件） | T09 完成后 |
| T16 | 添加请求速率限制（express-rate-limit） | T10 完成后 |
| T17 | 添加结构化日志（pino） | T10 完成后 |
| T18 | 歌单分析结果缓存（避免重复调用 LLM） | 功能稳定后 |
| T19 | 电台模式扩展（时间模式、歌单巡游、随机发现） | 天气模式完成后 |
