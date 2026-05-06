# AI Radio — 个人 AI 电台实现方案

## Context

基于网易云音乐，构建一个 Web 端（含移动端适配）个人 AI 电台。核心能力：
- 智能分析用户收藏歌单（流派、情绪、语种分布）
- 根据天气 + 时间 + 歌单分析结果，AI 自动生成电台节目
- 每首歌之间有 AI DJ 自然语音播报（LLM 脚本 → Edge TTS 合成）
- 收藏歌单以天气为维度进行歌曲电台生成
- 支持未来迁移到 NAS（Docker 部署）

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | Vue 3 + Vite + Tailwind CSS | 移动端优先响应式，PWA |
| 后端 | Node.js + Express + TypeScript | 核心编排引擎 |
| 数据库 | SQLite (better-sqlite3) | 零配置，单文件，NAS 友好 |
| 网易云 API | NeteaseCloudMusicApi (本地 HTTP 微服务) | 歌单、搜索、流媒体 URL，社区维护 147k star |
| LLM | Gemini API | DJ 脚本生成 + 歌单智能分析 |
| TTS | Edge TTS | 免费中文神经语音（晓晓），质量自然 |
| 天气 | Open-Meteo | 免费无需 Key |
| 部署 | Docker + docker-compose | 双容器，volume 持久化数据 |

## 项目结构

```
F:/project/musicObj2/
├── docker-compose.yml
├── Dockerfile
├── .env.example
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                    # Express 入口
│       ├── config.ts                   # 环境变量
│       ├── db/
│       │   ├── connection.ts           # SQLite 初始化
│       │   └── schema.ts              # 建表 DDL
│       ├── services/
│       │   ├── netease.service.ts      # 封装 NeteaseCloudMusicApi 调用
│       │   ├── llm.service.ts          # Gemini 提示词封装
│       │   ├── tts.service.ts          # Edge TTS 合成
│       │   ├── weather.service.ts      # 天气获取
│       │   ├── radio-engine.service.ts # ★ 核心编排：电台状态机
│       │   └── audio-cache.service.ts  # DJ 音频缓存管理
│       ├── routes/
│       │   ├── auth.routes.ts          # 登录/鉴权
│       │   ├── playlist.routes.ts      # 歌单列表/详情/分析
│       │   ├── radio.routes.ts         # 电台启动/暂停/停止
│       │   ├── weather.routes.ts       # 天气代理
│       │   └── stream.routes.ts        # DJ 音频静态服务
│       ├── middleware/
│       │   ├── error-handler.ts
│       │   └── cors.ts
│       └── types/index.ts
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── router/index.ts
│       ├── stores/
│       │   ├── radio.ts               # 电台会话状态
│       │   ├── player.ts              # 播放器状态
│       │   └── user.ts                # 用户/登录状态
│       ├── composables/
│       │   ├── useAudioPlayer.ts      # ★ 音频播放队列管理
│       │   └── useMediaSession.ts     # 锁屏媒体控制
│       ├── services/api.ts            # 后端 API 封装
│       ├── views/
│       │   ├── HomeView.vue           # 首页/仪表盘
│       │   ├── LoginView.vue          # 网易云登录
│       │   ├── PlaylistsView.vue      # 歌单浏览与分析
│       │   ├── RadioView.vue          # ★ 电台主界面
│       │   └── SettingsView.vue       # 偏好设置
│       └── components/
│           ├── AudioPlayer.vue        # 底部迷你播放条
│           ├── NowPlaying.vue         # 主播放卡片（旋转封面）
│           ├── DJAnnouncement.vue     # DJ 播报文字气泡
│           ├── PlaylistCard.vue       # 歌单卡片
│           ├── SongList.vue           # 播放队列列表
│           ├── WeatherBadge.vue       # 天气指示
│           ├── RadioControls.vue      # 播放/暂停/跳过/停止
│           └── layout/
│               ├── AppShell.vue       # 移动端底部导航壳
│               └── TopBar.vue         # 顶部栏
```

## 架构图

```
┌──────────────────────────────────────────────┐
│              前端 (Vue 3 + Vite)               │
│  RadioView → AudioPlayer → DJAnnouncement     │
│  Pinia stores: radio / player / user          │
│  useAudioPlayer composable (分段队列管理)       │
└──────────────────┬───────────────────────────┘
                   │ HTTP REST
┌──────────────────┴───────────────────────────┐
│          后端 (Node.js + Express + TS)         │
│                                                │
│  RadioEngineService  ← 核心编排状态机           │
│    ├── NeteaseService   → 本地 HTTP 调用       │
│    ├── LLMService       → Gemini API          │
│    ├── TTSService       → Edge TTS            │
│    ├── WeatherService   → Open-Meteo          │
│    └── AudioCacheService                      │
│                                                │
│  SQLite: users/playlists/tracks/sessions/queue │
└──────────────────┬───────────────────────────┘
                   │ HTTP
┌──────────────────┴───────────────────────────┐
│    NeteaseCloudMusicApi (本地 :3001)           │
│    社区维护，147k star，完整的网易云API         │
└──────────────────┬───────────────────────────┘
                   │
           网易云音乐服务器
```

## 数据库设计（SQLite 5 张表）

### users — 网易云登录态

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| netease_uid | TEXT UNIQUE | 网易云用户ID |
| nickname | TEXT | 昵称 |
| avatar_url | TEXT | 头像 |
| cookie | TEXT | 登录 cookie（持久化） |
| created_at | TEXT | 创建时间 |

### playlists — 歌单缓存

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 网易云歌单ID |
| user_id | INTEGER FK | 关联用户 |
| name | TEXT | 歌单名 |
| cover_url | TEXT | 封面图 |
| track_count | INTEGER | 歌曲数 |
| description | TEXT | 描述 |
| is_favorite | INTEGER | 是否为红心歌单 |
| synced_at | TEXT | 同步时间 |

### playlist_tracks — 歌曲缓存

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 网易云歌曲ID |
| playlist_id | TEXT FK | 所属歌单 |
| name | TEXT | 歌名 |
| artists | TEXT | 艺术家 JSON 数组 |
| album | TEXT | 专辑 |
| duration_ms | INTEGER | 时长 |
| genre_tags | TEXT | LLM 分析的流派标签 JSON |
| mood_tags | TEXT | LLM 分析的情绪标签 JSON |

### radio_sessions — 电台会话

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| name | TEXT | 会话名称 |
| playlist_id | TEXT FK | 来源歌单 |
| status | TEXT | idle/running/paused/stopped |
| weather_city | TEXT | 城市 |
| weather_data | TEXT | 天气快照 JSON |
| started_at | TEXT | 开始时间 |
| ended_at | TEXT | 结束时间 |

### session_queue — 播放队列

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| session_id | TEXT FK | 所属会话 |
| position | INTEGER | 播放顺序 |
| entry_type | TEXT | 'song' 或 'dj_announcement' |
| track_id | TEXT | 歌曲ID（DJ项为空） |
| dj_script | TEXT | LLM 生成的 DJ 脚本 |
| dj_audio_path | TEXT | TTS 缓存文件路径 |
| weather_ref | TEXT | 引用的天气片段 JSON |
| status | TEXT | pending/playing/played/skipped |
| played_at | TEXT | 播放时间 |

## 核心数据流

```
用户点击"开始电台"
  → POST /api/radio/start { playlistId, lat, lon }
  → RadioEngineService:
      1. 拉取歌单歌曲列表（缓存到 DB）
      2. LLM 分析歌单（genre/mood/tempo 聚类）
      3. 获取天气（温度、天气状况、风力）
      4. LLM 根据天气+歌单分析选择第1首歌并生成DJ intro脚本
      5. TTS 合成 DJ 播报音频 → 缓存为 mp3
      6. 返回 { sessionId, 第一首歌URL, DJ片头URL }
  → 前端:
      1. 播放 DJ 片头
      2. DJ 播完自动切入第1首歌
      3. 歌开始播放时立即 POST /api/radio/:id/next（预生成下一段）

循环（每首歌）:
  前端 onended → /next → 后端返回 { dj_url?, next_song_url }
  DJ播报 → 歌曲 → DJ播报 → 歌曲 → ...
```

关键设计：每首歌播放时就开始预生成下下首的 DJ 脚本和 TTS 音频（一首歌 3-5 分钟，LLM+TTS 只需 3-5 秒），确保过渡无缝。

## 前端核心：useAudioPlayer 组合式函数

- 维护一个**分段队列**：`[DJ_clip, song_URL, DJ_clip, song_URL, ...]`
- 监听 `ended` 事件自动切换下一段
- 每播放一首新歌时预调用 `/next` 获取下一段
- 集成 Media Session API（手机锁屏显示歌曲信息 + 控制按钮）
- 网络中断自动重试 3 次，失败显示提示

## 网易云 API 方案：NeteaseCloudMusicApi

采用社区维护的 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)（30k+ star），作为本地 HTTP 微服务运行，提供 300+ 个网易云音乐 API。

> **在线文档：** https://binaryify.github.io/NeteaseCloudMusicApi/#/

**为什么不用官方开放平台：** 官方开放平台 API 文档不公开（企业合作邀请制），无法直接调用。NeteaseCloudMusicApi 是社区事实标准，接口完整、稳定。

### 服务架构

```
前端(Vue) ──HTTP──▶ Express后端 ──HTTP──▶ NeteaseCloudMusicApi(:3001) ──▶ 网易云服务器
```

### 启动方式

```bash
# 方式一：npx 直接跑
npx NeteaseCloudMusicApi
# → 启动在 localhost:3000

# 方式二：git clone
git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git
cd NeteaseCloudMusicApi
npm install
npm start

# 方式三：Docker
docker run -d -p 3001:3000 binaryify/netease_cloud_music_api

# 自定义端口
PORT=4000 node app.js
```

### 本项目用到的关键接口

依据 [在线文档](https://binaryify.github.io/NeteaseCloudMusicApi/#/)，本项目所需的接口如下：

#### 登录

| 用途 | 接口 | 参数 | 说明 |
|------|------|------|------|
| 获取二维码 key | `/login/qr/key` | — | 返回 `{ data: { unikey } }` |
| 生成二维码 | `/login/qr/create` | `key`, `qrimg`(可选) | 返回二维码图片或 base64 |
| 检测扫码状态 | `/login/qr/check` | `key` | `code: 800` 已登录 → 返回 cookie |
| 登录状态 | `/login/status` | — | 检测当前 cookie 是否有效 |
| 刷新登录 | `/login/refresh` | — | 刷新即将过期的 cookie |

#### 歌单

| 用途 | 接口 | 参数 | 说明 |
|------|------|------|------|
| 用户歌单 | `/user/playlist` | `uid` | 返回创建+收藏的所有歌单 |
| 歌单详情 | `/playlist/detail` | `id` | 歌单信息 + 前 1000 首歌曲 |
| 歌单全部歌曲 | `/playlist/track/all` | `id`, `limit`, `offset` | 分页获取全部歌曲（新版） |
| 推荐歌单 | `/personalized` | `limit`(可选) | 获取推荐歌单 |
| 精品歌单 | `/top/playlist/highquality` | `cat`, `limit`(可选) | 按分类获取精品 |

#### 歌曲

| 用途 | 接口 | 参数 | 说明 |
|------|------|------|------|
| 播放 URL | `/music/url` | `id`(支持逗号分隔) | `br` 可选码率：`128000`/`320000`/`999000` |
| 新版 URL | `/song/url/v1` | `id`, `level` | 按音质等级获取 |
| 歌曲详情 | `/song/detail` | `ids`(逗号分隔) | 返回歌曲名、艺术家、专辑、封面 |
| 歌词 | `/lyric` | `id` | 获取歌曲歌词 |
| 是否可用 | `/check/music` | `id` | 检测歌曲版权状态 |

#### 搜索

| 用途 | 接口 | 参数 | 说明 |
|------|------|------|------|
| 搜索 | `/search` | `keywords`, `type` | type: `1`单曲 `1000`歌单 `100`歌手 |
| 搜索建议 | `/search/suggest` | `keywords` | 搜索补全建议 |
| 新版搜索 | `/cloudsearch` | `keywords`, `type` | 新版搜索接口 |

#### 用户

| 用途 | 接口 | 参数 | 说明 |
|------|------|------|------|
| 用户详情 | `/user/detail` | `uid` | 用户信息、头像、等级 |
| 喜欢列表 | `/likelist` | `uid` | 获取红心歌曲列表 |
| 播放记录 | `/user/record` | `uid`, `type` | `0` 最近一周 `1` 所有时间 |

### NeteaseService 适配

我们的 `netease.service.ts` 封装对 NeteaseCloudMusicApi 的调用：

```ts
class NeteaseService {
  private baseUrl = 'http://localhost:3001';

  async getLoginQRKey(): Promise<string>
  async checkQRStatus(key: string): Promise<{ code: number; cookie: string }>
  async getUserPlaylists(uid: string): Promise<Playlist[]>
  async getPlaylistTracks(playlistId: string): Promise<Track[]>
  async getTrackUrl(trackId: string, br?: number): Promise<string>
  async getTrackDetail(trackIds: string[]): Promise<TrackDetail[]>
  async search(keyword: string, type?: number): Promise<SearchResult>
  async checkMusic(trackId: string): Promise<boolean>
}
```

### 注意事项

- **版权限制**：部分歌曲 `/music/url` 返回 403，可尝试 `/song/url/v1` 或公开兜底地址 `https://music.163.com/song/media/outer/url?id={id}.mp3`
- **缓存机制**：相同 URL 2 分钟内返回缓存，可加 `?timestamp=xxx` 绕过
- **登录频率**：登录接口不要频繁调用，否则触发 503 或 IP 封禁
- **海外服务器**：需传 `realIP` 参数指定国内 IP 避免限制

## 后端 API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/qr-key` | 获取登录二维码 key |
| POST | `/api/auth/qr-check` | 检查扫码状态 |
| GET | `/api/auth/status` | 检查登录状态 |
| GET | `/api/playlists` | 用户歌单列表 |
| GET | `/api/playlists/:id` | 歌单详情+歌曲 |
| POST | `/api/playlists/:id/analyze` | LLM 分析歌单 |
| POST | `/api/radio/start` | 启动电台会话 |
| POST | `/api/radio/:id/next` | 获取下一段（DJ+歌曲） |
| POST | `/api/radio/:id/pause` | 暂停 |
| POST | `/api/radio/:id/resume` | 恢复 |
| POST | `/api/radio/:id/stop` | 停止 |
| GET | `/api/radio/:id/status` | 当前状态 |
| GET | `/api/weather` | 获取天气 |
| GET | `/api/stream/audio/:path` | 播放 DJ 音频片段 |

## 电台生成模式

1. **天气模式**（默认）：根据天气 + 歌单情绪匹配生成电台
   - 雨天 → 忧郁/慢节奏 → "雨中的情歌，陪你度过潮湿午后"
   - 晴天 → 欢快/高能量 → "阳光正好，来点轻快的节奏"
2. **时间模式**：早晨活力、午后放松、深夜低语
3. **歌单巡游**：遍历收藏歌单，每个歌单选 2-3 首，DJ 介绍歌单故事
4. **随机发现**：打乱所有收藏歌曲，加入 AI 趣味解说

## 前端路由

| Path | View | Description |
|------|------|-------------|
| `/` | HomeView | 首页/仪表盘 |
| `/login` | LoginView | 扫码登录 |
| `/playlists` | PlaylistsView | 歌单浏览与分析 |
| `/radio` | RadioView | ★ 电台主播放界面 |
| `/radio/:id` | RadioView | 查看历史会话 |
| `/settings` | SettingsView | 偏好+位置设置 |

## 前端组件树（RadioView）

```
RadioView
├── TopBar (返回, 电台名称, 设置)
├── NowPlaying
│   ├── AlbumArt (旋转封面大图)
│   ├── TrackInfo (歌名, 艺术家, 专辑)
│   ├── WeatherBadge (天气图标+温度)
│   └── DJAnnouncement (DJ 播报文字气泡)
├── SongList (可折叠, 显示待播队列)
│   └── SongList.Item (歌名, 艺术家, 时长, 状态)
├── RadioControls
│   ├── PrevButton (电台模式禁用)
│   ├── PlayPauseButton
│   ├── NextButton (跳过当前)
│   └── StopButton (结束电台)
└── AudioPlayer (固定底部, 跨页面可见)
    ├── MiniAlbumArt
    ├── MiniTrackInfo
    ├── ProgressBar
    └── MiniPlayPause
```

## 状态管理（Pinia）

### radio store

```ts
interface RadioState {
  sessionId: string | null
  status: 'idle' | 'running' | 'paused' | 'stopped'
  currentTrack: Track | null
  currentDjScript: string | null
  queue: QueueEntry[]
  weather: WeatherData | null
  sourcePlaylist: Playlist | null
}
```

### player store

```ts
interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  audioType: 'song' | 'dj_clip' | null
}
```

## Docker 部署

```yaml
# docker-compose.yml
services:
  netease-api:                          # 网易云 API 微服务
    image: binaryify/netease_cloud_music_api
    ports:
      - "3001:3000"
    restart: unless-stopped

  ai-radio:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    depends_on:
      - netease-api
    volumes:
      - ./data:/app/data                # SQLite + TTS 缓存持久化
      - ./.env:/app/.env:ro
    restart: unless-stopped
    environment:
      - TZ=Asia/Shanghai
```

### .env 环境变量

```
NETEASE_API_URL=http://netease-api:3000
GEMINI_API_KEY=xxx
PORT=3000
```

### Dockerfile

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

迁移到 NAS：复制项目目录到 NAS，`docker compose up -d` 即可。

## 实施顺序（10步）

| 步骤 | 内容 | 关键产出 |
|------|------|----------|
| 1 | 项目脚手架 | Vite+Vue3+Tailwind + Express+TS + Docker |
| 2 | **网易云 API**（最高风险） | 启动 NeteaseCloudMusicApi，验证登录/歌单/流媒体URL |
| 3 | 数据库建表 | SQLite 5表建表 + 读写验证 |
| 4 | LLM + TTS + Weather | Gemini DJ脚本 / Edge TTS / Open-Meteo |
| 5 | **电台引擎**（核心） | 状态机：start → DJintro → song → DJbridge → stop |
| 6 | API Routes | auth/playlist/radio/weather/stream 所有路由 |
| 7 | 前端页面 | Home/Login/Playlists/Radio/Settings + 组件 |
| 8 | 音频播放器 | 分段队列、预加载、Media Session |
| 9 | PWA | manifest + service worker |
| 10 | Docker化 + 打磨 | docker compose up 一键启动，错误处理/加载态/空态 |

## 验证方案

1. **API 验证**：curl 测试网易云登录、歌单获取、歌曲 URL 可用性
2. **LLM/TTS 验证**：手动调用 Gemini + Edge TTS，确认 DJ 脚本质量和语音自然度
3. **电台全流程**：前端启动电台 → DJ 播报 → 歌曲播放 → 自动切换 → 持续 3 轮
4. **移动端适配**：Chrome DevTools 模拟 iPhone/Android，验证触控和锁屏控制
5. **Docker 部署**：`docker compose up` 验证完整服务
