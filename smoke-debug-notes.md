# AI Radio — Smoke Test 调试笔记

> 本文档记录 T-Smoke-1 ~ T-Smoke-4 期间发现的所有 bug、诊断过程、修复方案。
>
> 概要请看 `smoke-report.md`。

---

## 角色边界（来自 AGENTS.md）

- 🤖 **Codex**：写代码、commit、跑静态检查
- 👤 **人类**：扫二维码、操作浏览器、听音频、复现问题、贴日志
- 🔍 **Claude**：审查 Codex 的 commit、根据日志诊断 bug、生成给 Codex 的修复提示词

> Claude 不直接改代码（仅在用户明确允许时才动文档/配置文件）。

---

## 调试流程总览

```
启动后端报 GEMINI_API_KEY 缺失
   ↓
.env 位置错（项目根 vs backend/）
   ↓
登录扫码一直 800
   ↓
诊断：803 后 key 一次性消耗，重复调 check 必返 800
   ↓
歌单返回 0 首歌
   ↓
诊断：cookie 通过 HTTP header 传不被 NeteaseCloudMusicApi 接受
修复：改成 query param ?cookie=xxx
   ↓
启动电台 500 错误
   ↓
诊断：edge-tts@1.0.1 签名算法过期，微软返回 403
修复：替换为 msedge-tts
   ↓
DJ 文案永远是 fallback
   ↓
诊断：Gemini API 不可达（环境/网络问题）
   ↓
RadioControls 4 个按钮都不生效
   ↓
诊断：按钮事件错绑到 radioStore actions（只调后端）
修复：绑到 useAudioPlayer 方法
   ↓
点击"下一段"后反复播 DJ
   ↓
诊断：Edge TTS 偶发 503，generateNextPair 失败时数据库状态不一致
修复：generateNextPair / startSession 加 try/catch 容错
```

---

## Bug 清单

### Bug #1：后端启动报 `Missing GEMINI_API_KEY`

**现象**
```
F:\project\musicOb3\ai-music\backend\src\config.ts:5
    throw new Error(`Missing required environment variable: ${name}`);
Error: Missing required environment variable: GEMINI_API_KEY
```

**根因**
`backend/src/index.ts` 用 `import 'dotenv/config'`，会从 `process.cwd()` 读 `.env`。
后端在 `backend/` 目录跑，但 `.env` 文件创建在了项目根目录，路径不匹配。

**两种解法**

**A. 复制 `.env` 到 backend 目录（最快）**
```cmd
copy .env backend\.env
```

**B. 修改后端从根目录读 `.env`（更干净，未实施）**
```ts
import { config as dotenvConfig } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.resolve(__dirname, '../../.env') });
```

**当前选择**：方案 A（复制文件，维护两份）。

---

### Bug #2：扫码状态一直返回 `code: 800`

**现象**
通过我们后端 `POST /api/auth/qr-check` 反复轮询，永远返回 `code: 800`。

**误导性观察**
直接打网易云 `GET http://localhost:3000/login/qr/check?key=xxx`，第一次能返回 803，第二次就变 800。

**真正根因**
网易云的 QR `key` 是**一次性的**：
- 第一次调 `/login/qr/check` 返回 `803` → key 立刻作废
- 之后再调 → 返回 `800`

**操作错误**：用户先做"直测"消耗了 `803`，再回我们后端测就只能拿到 `800`。

**正确流程**
在同一个 `key` 的生命周期里，**只能有一个客户端**调用 `/login/qr/check`，不能同时通过我们后端和直接打网易云。

**网易云 QR 状态码参考**

| code | 含义 |
|---|---|
| 800 | 二维码过期 / 已使用 |
| 801 | 等待扫码 |
| 802 | 扫码成功，等待手机确认 |
| 803 | 登录成功 |

---

### Bug #3：歌单 trackCount 全是 0

**现象**
浏览器 `/playlists` 显示 `我喜欢的音乐 0 首`，但用户网易云 APP 里有 500+ 首歌。

**诊断步骤**

1. 直接打网易云（不带 cookie）：
   ```
   GET http://localhost:3000/user/playlist?uid=xxx
   ```
   返回 `playlist: []`

2. 通过我们后端（带 cookie）：
   ```
   GET http://localhost:3100/api/playlists
   ```
   返回 1 个歌单，`trackCount: 0`，`containsTracks: false`

3. **两者结果几乎一致**说明 cookie 没在网易云 API 层生效。

**根因**
`backend/src/services/netease.service.ts::request()` 把 cookie 通过 HTTP `Cookie` header 传：
```ts
headers: cookie ? { Cookie: cookie } : undefined
```

但数据库里存的 cookie 字符串是 NeteaseCloudMusicApi `/login/qr/check` 响应里**完整的 Set-Cookie 拼接**，包含 `Max-Age` / `Expires` / `Path`，**塞进 Cookie 请求头是无效格式**，网易云收到后当未登录处理。

**修复**
NeteaseCloudMusicApi 支持把 cookie 作为查询参数传，它会自己解析并转换成正确的 Cookie header 转发给网易云：
```ts
if (cookie) {
  url.searchParams.set('cookie', cookie);
}
// fetch 不再传 headers
```

---

### Bug #4：`/api/radio/start` 报 500，Edge TTS WebSocket 403

**错误堆栈**
```
Error: Unexpected server response: 403
  at ClientRequest.<anonymous> (.../ws/lib/websocket.js:918:7)
```

**根因**
`edge-tts@1.0.1`（npm 包）发布于 2024 年初，使用旧的微软签名算法（`Sec-MS-GEC` 头）。微软在 2024 年底更新算法，导致老包的 WebSocket 握手被微软直接拒绝（403）。

**为什么 T-Smoke-2 没发现**
T-Smoke-2 的"edge-tts 验证"只检查了 import 路径正确（`out/index.js` 存在 + `ttsSave` 是命名导出），没真调微软。

**修复**
替换为 `msedge-tts`（社区维护活跃）：
```cmd
cd backend
npm uninstall edge-tts
npm install msedge-tts
```

`tts.service.ts` 改用：
```ts
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

async synthesize(text: string, outputPath: string, voice = this.defaultVoice): Promise<void> {
  if (await this.exists(outputPath)) return;

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = await tts.toStream(text);

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('TTS timeout')), this.timeoutMs);
    audioStream.on('data', (c: Buffer) => chunks.push(c));
    audioStream.on('end', () => { clearTimeout(timeout); resolve(); });
    audioStream.on('error', (err) => { clearTimeout(timeout); reject(err); });
  });

  await writeFile(outputPath, Buffer.concat(chunks));
}
```

---

### Bug #5：DJ 文案永远是同一句 fallback

**现象**
每次切歌的 DJ 播报都是：
> "接下来这首歌，和此刻的天气刚好合拍。把音量交给心情，我们继续听。"

**根因**
`llmService.generateWithRetry` 调 Gemini 失败时，retry 3 次后返回 `fallbackScript()`。Gemini API 不可达（用户环境无法访问 `generativelanguage.googleapis.com`）。

**性质**
**部署/环境问题**，不是代码 bug。代码降级策略工作正常。

**临时诊断 patch**（用于确认 Gemini 是否真的不通）
```ts
// llm.service.ts::generateWithRetry
} catch (err) {
  console.error('[LLM] generate attempt', attempt, 'failed:',
    err instanceof Error ? err.message : err);
  ...
}
```

**curl 直测 Gemini**（PowerShell）
```powershell
$key = "你的GEMINI_API_KEY"
$body = @{
  contents = @(@{ role = "user"; parts = @(@{ text = "hello" }) })
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method POST `
  -ContentType "application/json" `
  -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$key" `
  -Body $body
```

**当前处理**：列入遗留问题 L1，部署侧解决。

---

### Bug #6：RadioControls 4 个按钮全不生效

**现象**
- 播放：进度条重置从头播
- 暂停：调了 `/pause`，但音频继续播
- 下一段：调了 `/next`，但 NowPlaying 不变
- 停止：调了 `/stop`，但音频继续播

**根因**
`RadioView.vue` 的事件绑定错了，绑到了 `radioStore` 的 actions（**只调后端 API，不操作 `<audio>`**），而不是 `useAudioPlayer` 的方法（**前端 + 后端联动**）。

```vue
<!-- 错的 -->
<RadioControls
  @next="radioStore.next"
  @pause="radioStore.pause"
  @play="play"
  @stop="radioStore.stop"
/>

<!-- 对的 -->
<RadioControls
  @play="resume"
  @pause="pause"
  @next="next"
  @stop="stop"
/>
```

**修复**
1. `useAudioPlayer.pause/stop` 增加 `await radioStore.pause/stop()` 同步后端状态
2. 新增 `useAudioPlayer.resume` 方法（从暂停位置恢复播放，不是从头 load）
3. `RadioView.vue` 解构 `useAudioPlayer` 拿 `resume/pause/next/stop`，绑到事件上

---

### Bug #7：点"下一段"后反复播 DJ

**现象**
听完第一段 DJ + 第一首歌 → 点一下"下一段" → 之后 DJ 一直循环播，不切歌。

**日志关键片段**
```
[RadioEngine] getNextSegment called
[RadioEngine] all queue rows: [
  { id: 99, position: 0, type: dj_announcement, status: 'played' },
  { id: 100, position: 1, type: song, status: 'playing' }
]
[RadioEngine] generateNextPair songCount= 1 djPosition= 2 songPosition= 3
（第一次调用 generateNextPair 没有产生新行，直接返回）

[RadioEngine] getNextSegment called
[RadioEngine] all queue rows: [...同上...]
[RadioEngine] generateNextPair songCount= 1 djPosition= 2 songPosition= 3
[RadioEngine] rowToSegment returning: dj_announcement position= 2
（第二次才插入 101、102）
```

同时 Console 看到：
```
POST /api/radio/xxx/next 500
ApiError: Edge TTS WebSocket error: Unexpected server response: 503
```

**根因**
`radio-engine.service.ts::generateNextPair` 中：
```ts
const djScript = await llmService.generateDjScript({...});
const djAudioPath = audioCacheService.getCachePath(sessionId, djPosition);

await ttsService.synthesize(djScript, djAudioPath);  // ← 偶发 503

db.transaction(() => {
  // 插入 DJ 行 + song 行
})();
```

Edge TTS 偶发 503 时，`synthesize` 抛错 → 整个 transaction 不执行 → 插入失败 → 但错误冒泡到 HTTP 500 → 前端 `prefetch` catch 吞掉 → DB 状态没变化 → 下次再调还是同样情况 → **死循环风险**。

**修复方案**
TTS 失败时跳过 DJ 段，**只插入 song 行**（保证电台不卡死）：
```ts
let ttsOk = true;
try {
  await ttsService.synthesize(djScript, djAudioPath);
} catch (err) {
  console.error('[RadioEngine] TTS failed, will skip DJ segment:',
    err instanceof Error ? err.message : err);
  ttsOk = false;
}

db.transaction(() => {
  if (ttsOk) {
    db.prepare(`INSERT INTO session_queue ... 'dj_announcement' ...`)
      .run(sessionId, djPosition, djScript, djAudioPath);
  }
  const actualSongPosition = ttsOk ? songPosition : djPosition;
  db.prepare(`INSERT INTO session_queue ... 'song' ...`)
    .run(sessionId, actualSongPosition, nextTrack.id);
})();
```

`startSession` 也做同样容错。

**当前状态**：修复已落地，复现验证仍待用户确认。

---

## 验证命令速查

### Postman / PowerShell 一行命令

```powershell
# 健康检查
Invoke-RestMethod http://localhost:3100/health

# QR Key
$key = (Invoke-RestMethod -Method POST http://localhost:3100/api/auth/qr-key).key
$key

# 二维码（调网易云）
$qr = Invoke-RestMethod "http://localhost:3000/login/qr/create?key=$key&qrimg=true"
$qr.data.qrimg
# 把输出的 data:image/png;base64,... 粘贴到浏览器扫码

# 检查扫码状态
$body = @{ key = $key } | ConvertTo-Json
Invoke-RestMethod -Method POST -ContentType "application/json" -Body $body http://localhost:3100/api/auth/qr-check

# 登录状态
Invoke-RestMethod http://localhost:3100/api/auth/status

# 歌单列表
Invoke-RestMethod http://localhost:3100/api/playlists

# 天气
Invoke-RestMethod "http://localhost:3100/api/weather?lat=22.3193&lon=114.1694"

# 歌单详情
Invoke-RestMethod http://localhost:3100/api/playlists/<playlistId>

# 歌单分析（LLM）
Invoke-RestMethod -Method POST http://localhost:3100/api/playlists/<playlistId>/analyze
```

### 错误信息抓取
```powershell
try {
  Invoke-RestMethod -Method POST http://localhost:3100/api/auth/qr-check
} catch {
  $_.Exception.Response.StatusCode
  $_.ErrorDetails.Message
}
```

---

## 临时诊断日志（调试期间使用）

### useAudioPlayer.ts
```ts
// play() 开头
console.log('[AudioPlayer] play called, currentItem:', playerStore.currentItem);

// prefetchNextSegment 三个跳过分支各加一行
console.log('[AudioPlayer] prefetch skipped: no sessionId');
console.log('[AudioPlayer] prefetch skipped: already prefetching');
console.log('[AudioPlayer] prefetch skipped: current type is', playerStore.currentItem?.type);

// 成功后
console.log('[AudioPlayer] prefetched segment:', response.segment.type, response.segment.id);

// triggering 时
console.log('[AudioPlayer] triggering prefetch, type=song');

// next() 各分支
console.log('[AudioPlayer] next() start, currentSegment:',
  radioStore.currentSegment?.id, radioStore.currentSegment?.type);
console.log('[AudioPlayer] next() currentIndex:', currentIndex,
  'queue length:', radioStore.queue.length);
console.log('[AudioPlayer] next() picked from local queue:', queued.id, queued.type);
console.log('[AudioPlayer] next() fell back to radioStore.next()');
console.log('[AudioPlayer] next() loading segment:', queued?.type ?? radioStore.currentSegment?.type);

// handleEnded 开头
console.log('[AudioPlayer] ===== audio ended =====');
console.log('[AudioPlayer]   current segment:', JSON.stringify({...}));
console.log('[AudioPlayer]   queue:', radioStore.queue.map(...));
```

### radio-engine.service.ts
```ts
// getNextSegment 开头
console.log('[RadioEngine] getNextSegment called, sessionId=', sessionId);
const allPlaying = db.prepare(
  "SELECT id, position, entry_type, status FROM session_queue WHERE session_id = ?"
).all(sessionId);
console.log('[RadioEngine] all queue rows:', allPlaying);

// generateNextPair 开头
console.log('[RadioEngine] generateNextPair songCount=', songCount.count,
  'djPosition=', djPosition, 'songPosition=', songPosition);

// rowToSegment 开头
console.log('[RadioEngine] rowToSegment returning:', row.entry_type, 'position=', row.position);
```

> 这些日志在 T-Smoke-4 完成 + 用户验证通过后应清理掉，commit 时不带。

---

## 给 Codex 的修复提示词模板

每个 bug 一份提示词，主要包括：

1. **现象**：用户描述 + 错误日志
2. **诊断**：根因分析
3. **修复方案**：具体到代码片段
4. **约束**：
   - 只改哪些文件
   - 不引入新依赖（特殊情况例外）
   - 不要 commit，等用户验证
5. **验证步骤**：用户复现 / 测试方式
6. **commit message**：固定模板 `fix: <说明> (T-Smoke-X)`

---

## 经验教训

1. **静态检查 ≠ 真实可用**：T-Smoke-2 验证 edge-tts import 路径，没真调微软 → T-Smoke-4 暴露包过期。
2. **Cookie 不是字符串就行**：HTTP Cookie header 不接受带 attribute 的 Set-Cookie 拼接形式。
3. **三方 npm 包可能停更**：选包要看最近 commit 时间和 issue 活跃度。`edge-tts@1.0.1` 最后更新 2024 年初。
4. **状态机错误必须容错**：`generateNextPair` 中第三方调用失败要降级处理，不能让一段错误卡死整个会话。
5. **前端的"控制按钮"要同时操作前端和后端**：只调一边会出现状态不一致。建议事件统一进 composable。
6. **诊断 bug 先加日志再下结论**：连续两次 bug（Bug #7 和心跳频率）都是先加日志才看到真相，猜测会浪费时间。
7. **登录闭环最容易被低估**：T01–T13 完成后看似登录"做了"，T-Smoke-1 才发现 cookie 没存、status 写死 false、playlist 要手动传 uid 三处断点。

---

## 附：关键文件路径

```
backend/src/services/netease.service.ts       Bug #3 cookie 透传
backend/src/services/tts.service.ts           Bug #4 msedge-tts 替换
backend/src/services/llm.service.ts           Bug #5 fallback / 临时诊断日志
backend/src/services/radio-engine.service.ts  Bug #7 TTS 容错
backend/src/services/user.service.ts          T-Smoke-1 新建
backend/src/routes/auth.routes.ts             T-Smoke-1 修
backend/src/routes/playlist.routes.ts         T-Smoke-1 修
frontend/src/composables/useAudioPlayer.ts    Bug #6 控制按钮逻辑
frontend/src/views/RadioView.vue              Bug #6 事件绑定
frontend/src/views/LoginView.vue              T-Smoke-1 自动跳转
frontend/src/stores/user.ts                   T-Smoke-1 状态同步
.env / backend/.env                            Bug #1 dotenv 路径
Dockerfile                                     T-Smoke-2 alpine 编译依赖
docker-compose.yml                             T-Smoke-2 端口对齐
.env.example                                   T-Smoke-2 端口默认值
frontend/vite.config.ts                        T-Smoke-2 proxy target
```
