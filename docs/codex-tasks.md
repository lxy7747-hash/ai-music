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

## [x] T10 — API 路由实现

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

## [x] T11 — 前端页面与组件

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

## [x] T12 — 音频播放器

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

## [x] T13 — PWA + 打磨

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

## T-Smoke 系列 — 集成验证

> **背景**：T01–T13 只保证编码完成 + 静态检查通过，从未在真实环境运行过。
> 本系列任务的目标是跑通一次真实闭环，暴露集成问题。
>
> **拆分原则**：严格按 AGENTS.md「一次一个任务」执行，每个子任务完成后 commit 并等待指令。
>
> **角色边界**：
> - 🤖 **Codex** 负责：代码修改、静态检查（build/lint/type-check）、本地可自动验证的动作
> - 👤 **人类** 负责：扫二维码、听音频、验证需要真实账号/密钥/外网的步骤
> - 🔍 **Claude** 负责：每个子任务 commit 后审查

---

## T-Smoke-1 — 登录闭环修复

**优先级**: 🔴 Critical  
**预计耗时**: 1 小时  
**前置依赖**: T13  
**执行者**: 🤖 Codex

### 目标
修复登录链路的断点：扫码成功后 cookie 未入库、`/api/auth/status` 写死返回未登录、网易云 API 调用不带 cookie。

### 涉及文件
- `backend/src/routes/auth.routes.ts`（修改）
- `backend/src/routes/playlist.routes.ts`（修改）
- `backend/src/services/netease.service.ts`（修改）
- `backend/src/services/user.service.ts`（新建，用户持久化封装）
- `frontend/src/views/LoginView.vue`（修改）
- `frontend/src/stores/user.ts`（修改）

### 验收标准

**user.service.ts（新建）**
- [ ] `upsertUser({ neteaseUid, nickname?, avatarUrl?, cookie }): User`：写入或更新 `users` 表
- [ ] `getCurrentUser(): User | null`：按 `created_at` 或 `id` 降序取最新一条（MVP 简化：仅支持单用户）
- [ ] 不在此任务做 cookie 加密（留给 T14）

**auth.routes.ts**
- [ ] `POST /api/auth/qr-check`：收到 `code === 803` 时：
  - 调用 `neteaseService.getLoginStatus(cookie)` 获取 `netease_uid` 和昵称
  - 通过 `userService.upsertUser` 写入 DB
  - 返回 `{ code, loggedIn: true, user: { neteaseUid, nickname } }`
- [ ] `GET /api/auth/status`：
  - 从 DB 读取当前用户，返回 `{ loggedIn: boolean, user: { neteaseUid, nickname } | null }`
- [ ] 新增 `POST /api/auth/logout`：清空 DB 中的用户记录

**netease.service.ts**
- [ ] `request()` 增加可选 `cookie` 参数，通过 `Cookie` header 传递给 NeteaseCloudMusicApi
- [ ] 新增 `getLoginStatus(cookie): Promise<{ neteaseUid, nickname, avatarUrl }>`（调用 `/login/status`）
- [ ] `getUserPlaylists / getPlaylistTracks / getTrackUrl` 等方法增加 `cookie` 参数透传

**playlist.routes.ts**
- [ ] 移除 `uid` 查询参数校验：从 `userService.getCurrentUser()` 自动读取
- [ ] 调用 `neteaseService.getUserPlaylists` 时携带当前用户 cookie
- [ ] 未登录时返回 401 `{ error: { code: "NOT_LOGGED_IN" } }`

**LoginView.vue**
- [ ] 扫码检查循环：`qrCheck` 返回 `code === 803` 时调用 `userStore.refreshStatus()`，然后 `router.push('/playlists')`
- [ ] （保留 QR key 文字展示作为调试，不要求真正渲染二维码图片）

**user store**
- [ ] `refreshStatus()` 使用后端真实状态覆盖本地 `loggedIn/nickname`

### 完成流程
1. 阅读本任务
2. 说明修改计划
3. 按文件清单修改
4. `cd backend && npm run build && npm run lint`
5. `cd frontend && npm run type-check && npm run build`
6. 标记本任务 `[x]`
7. 单个 commit：`feat: implement login persistence and cookie passthrough (T-Smoke-1)`
8. 输出 `git diff --stat`
9. **停下，等待指令**

### 注意事项
- 不要引入新依赖
- 不要做 cookie 加密（T14 会做）
- 鉴权中间件的 TODO 继续保留，暂不实现
- `userService` 应使用 `db.prepare` 参数化查询，不拼接 SQL

---

## T-Smoke-2 — 环境对齐修复（端口 + Dockerfile + TTS 导入）

**优先级**: 🔴 Critical  
**预计耗时**: 45 分钟  
**前置依赖**: T-Smoke-1  
**执行者**: 🤖 Codex

### 目标
修复三个会直接阻止 smoke 启动的问题：
1. **端口冲突**：后端和 NeteaseCloudMusicApi 都默认 3000 端口
2. **Dockerfile 编译失败**：alpine 缺 `better-sqlite3` 的 native 编译依赖
3. **TTS 导入路径未验证**：`edge-tts/out/index.js` 可能不存在

### 涉及文件
- `.env.example`（修改）
- `frontend/vite.config.ts`（修改）
- `Dockerfile`（修改）
- `docker-compose.yml`（核对）
- `backend/src/services/tts.service.ts`（修改，如 import 失败）
- `docs/codex-tasks.md`（在本任务"修复记录"小节写入结果）

### 验收标准

**端口方案（统一约定）**
- [ ] 后端 `PORT=3100`
- [ ] NeteaseCloudMusicApi 保持 `3000`
- [ ] 前端 vite dev server 默认 `5173`，proxy `/api` → `http://localhost:3100`
- [ ] `.env.example` 的 `PORT=3000` 改为 `PORT=3100`
- [ ] `.env.example` 的 `NETEASE_API_URL` 注释明确：本地 `http://localhost:3000`，Docker `http://netease-api:3000`
- [ ] `frontend/vite.config.ts` 的 proxy target 改为 `http://localhost:3100`
- [ ] `docker-compose.yml` 内部仍用 3000（容器内独立网络），外部暴露保持 `${PORT:-3100}:3100`

**Dockerfile**
- [ ] 在所有包含 `npm ci` 的 stage 中增加原生编译依赖 `apk add --no-cache python3 make g++`
- [ ] 或者改 base 镜像为 `node:20-bookworm-slim` 并用 `apt-get install -y python3 make g++`
- [ ] **不要执行 `docker build`**（人类在 T-Smoke-5 验证），本任务只改 Dockerfile 文本

**edge-tts 验证**
- [ ] 检查 `node_modules/edge-tts/` 实际的导出入口
- [ ] 如果 `edge-tts/out/index.js` 不存在，按以下优先级选择：
  1. 查 `package.json` 的 `main` 字段，改为正确路径
  2. 若无法静态导入，改用 `child_process` 调用 `npx edge-tts` CLI
- [ ] 修改后在 `tts.service.ts` 里加一个 `test()` 方法：不调真服务，只验证 import 不抛错（人类验证环节会真调）

**修复记录（写入本任务末尾）**
- [ ] edge-tts 的实际导入路径是：__________
- [ ] 端口方案决策：__________

### 完成流程
同 T-Smoke-1，commit message：`fix: align dev ports, docker deps, tts import path (T-Smoke-2)`

### 注意事项
- 端口改动会影响所有"本地启动"文档，顺便更新 README 的端口章节（如果存在）
- `.env.example` 和代码默认值要保持一致，否则新用户首次启动就会困惑

---

## T-Smoke-3 — 本地后端集成验证（人机协作）

**优先级**: 🔴 Critical  
**预计耗时**: 1 小时  
**前置依赖**: T-Smoke-2  
**执行者**: 👤 人类为主 + 🤖 Codex 修 bug

### 目标
人类启动本地服务，验证后端 API 可用性。过程中 Codex 按人类反馈修 bug。

### 前置条件（人类）
- [ ] 已在 `.env` 填入真实 `GEMINI_API_KEY`
- [ ] 有网易云账号、手机可扫二维码
- [ ] 可访问 Gemini（翻墙环境就绪）

### 执行步骤（人类执行，Codex 待命）

**启动 3 个终端**
- [ ] 终端 A：`npx NeteaseCloudMusicApi`（监听 3000）
- [ ] 终端 B：`cd backend && npm run dev`（监听 3100）
- [ ] 终端 C：`cd frontend && npm run dev`（监听 5173）

**API 层验证（curl / Postman，不用 UI）**
- [ ] `GET http://localhost:3100/health` 返回 `status: ok`
- [ ] `POST http://localhost:3100/api/auth/qr-key` 返回 `key`
- [ ] 调网易云 `POST http://localhost:3000/login/qr/create?key=<key>&qrimg=true` 拿到二维码 base64，用图片查看器打开扫码
- [ ] 轮询 `POST http://localhost:3100/api/auth/qr-check` body `{ key }` 直到 `code === 803`
- [ ] `GET http://localhost:3100/api/auth/status` 返回 `loggedIn: true` 和用户信息
- [ ] `GET http://localhost:3100/api/playlists`（无 uid）返回当前用户歌单
- [ ] `GET http://localhost:3100/api/weather?lat=22.3193&lon=114.1694` 返回天气
- [ ] 选一个歌单 id，`GET /api/playlists/:id` 返回歌曲列表
- [ ] `POST /api/playlists/:id/analyze` 返回 LLM 分析结果

### 人类提交反馈的格式
遇到问题时把以下信息贴给 Claude：
```
步骤：<上面哪一步>
命令：<curl 命令>
期望：<期望响应>
实际：<实际响应 + 后端日志>
```

### Codex 修 bug 的边界
- ✅ 允许修 auth / playlist / netease / weather / llm 五个服务中的 bug
- ✅ 允许修改响应格式、错误处理、cookie 传递逻辑
- ❌ 不要改数据库 schema
- ❌ 不要改前端代码（前端由 T-Smoke-4 验证）
- 每修一个 bug 单独 commit：`fix: <问题> (T-Smoke-3)`

### 退出条件
- 上述所有 curl 步骤都返回 2xx
- 或者人类决定 skip 某步并记录原因到本任务"遗留问题"小节

### 完成标记
- [ ] 全部通过 → 人类在本任务末尾写一行 `通过时间：YYYY-MM-DD HH:MM`
- [ ] 部分通过 → 列出遗留问题和对策

---

## T-Smoke-4 — 前端 + 电台闭环验证（人机协作）

**优先级**: 🔴 Critical  
**预计耗时**: 1 小时  
**前置依赖**: T-Smoke-3  
**执行者**: 👤 人类为主 + 🤖 Codex 修 bug

### 目标
用真实浏览器跑通电台播放闭环。

### 执行步骤（人类执行）
- [ ] 浏览器打开 `http://localhost:5173`
- [ ] 进入 `/login`，点击"生成 Key"、"检查状态"，期间手机扫码
- [ ] 扫码成功后自动跳转 `/playlists`（或手动进入）
- [ ] 页面自动显示歌单（不需要手输 uid）
- [ ] 选一个歌单 → 点击"启动电台"
- [ ] 页面跳转到 `/radio`
- [ ] **听到**：DJ 中文播报音频
- [ ] DJ 播完自动切到第一首歌
- [ ] 第一首歌播放途中，后端日志显示预生成下一段
- [ ] 手动点"下一段"，切换正常
- [ ] 点"暂停"/"恢复"/"停止"均按预期工作

### 常见问题预案（人类遇到后贴给 Claude）

| 现象 | 可能原因 |
|---|---|
| DJ 音频无声 | edge-tts 没生成文件 / URL 路径不对 |
| 歌曲 URL 403 | 版权保护，需要测试 fallback URL |
| 启动电台 20+ 秒无响应 | LLM 串行调用，正常；后续任务优化 |
| LLM JSON.parse 失败 | Gemini 返回 markdown fence 包裹的 JSON，需要剥离 |
| 媒体锁屏控制不生效 | Media Session API 在 HTTP 环境可能被限制，HTTPS 下再验证 |

### Codex 修 bug 的边界
- ✅ 允许修前端组件、store、composable、view
- ✅ 允许修后端 `radioEngineService`（LLM 解析、错误处理）
- ❌ 不要大改 DB schema
- 每修一个 bug 单独 commit：`fix: <问题> (T-Smoke-4)`

### 完成标记
- [ ] 能从 0 启动到听完 DJ + 第一首歌 → 在本任务末尾写 `通过时间：YYYY-MM-DD HH:MM`
- [ ] 有遗留问题 → 列入本任务"遗留问题"小节

---

## T-Smoke-5 — Docker 部署验证（可选）

**优先级**: 🟡 Medium  
**预计耗时**: 30 分钟  
**前置依赖**: T-Smoke-4 通过  
**执行者**: 👤 人类 + 🤖 Codex 修 Dockerfile

### 目标
确认 `docker compose up` 能启动整套服务。

### 执行步骤（人类）
- [ ] `docker compose build` 构建成功（重点看 `better-sqlite3` 编译是否通过）
- [ ] `docker compose up -d` 启动双容器
- [ ] `docker compose logs -f ai-radio` 无报错
- [ ] 浏览器访问 `http://localhost:3100` 能打开前端
- [ ] 完成一次登录 + 启动电台（冒烟）

### 如失败
- 失败日志贴给 Claude，Codex 修 `Dockerfile` / `docker-compose.yml`，继续单任务 commit

### 完成标记
- [ ] `通过时间：YYYY-MM-DD HH:MM`，加到本任务末尾
- [ ] 或标记 skip + 原因

---

## T-Smoke-6 — 闭环报告（人类）

**优先级**: 🟡 Medium  
**预计耗时**: 15 分钟  
**前置依赖**: T-Smoke-3 和 T-Smoke-4 通过（T-Smoke-5 可选）  
**执行者**: 👤 人类

### 目标
把整个 smoke 过程落成文档，供下次部署参考。

### 产出
- [ ] `docs/smoke-report.md`，包含：
  - smoke 通过时间
  - 每个子任务的通过 / skip 状态
  - 发现并修复的 bug 列表（commit hash 链接）
  - 遗留问题 + 对应后续任务编号（T14 / T17 / T18 等）
  - "本地启动步骤"定版（可粘贴给别人快速跑起来）

### 完成标记
- [ ] 提交文档：`docs: smoke test report (T-Smoke-6)`
- [ ] T-Smoke 系列全部标 `[x]`

---

## 后续扩展任务（暂不执行）

| 编号 | 任务 | 重要性 | 时机 |
|------|------|--------|------|
| T14 | Cookie AES 加密存储 | 🔴 高 | T-Smoke 完成后优先做 |
| T15 | LLM prompt 模板文件化（从代码抽到 `.md` 文件） | 🟢 低 | 需要频繁调优 DJ 脚本时 |
| T16 | 添加请求速率限制（express-rate-limit） | 🟡 中低 | 部署到公网时 |
| T17 | 添加结构化日志（pino） | 🟡 中 | T-Smoke 后做，方便排查 |
| T18 | 歌单分析结果缓存（避免重复调用 LLM） | 🟠 中高 | 功能稳定后优先做 |
| T19 | 电台模式扩展（时间模式、歌单巡游、随机发现） | 🟢 低 | 天气模式完成后 |
