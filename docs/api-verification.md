# NeteaseCloudMusicApi Verification

**Date**: 2026-05-07  
**Task**: T07 - Verify NeteaseCloudMusicApi availability  
**Package**: `NeteaseCloudMusicApi@4.31.0` via `npx.cmd NeteaseCloudMusicApi`  
**Base URL**: `http://localhost:3000`

## Summary

T07 is verified.

Automated checks passed for service startup, QR key creation, QR image creation, public playlist detail retrieval, song URL retrieval, and fallback outer URL redirects.

The logged-in user flow was verified after manual QR scan confirmation. The QR status returned `803` (`授权登陆成功`), and the authenticated cookie was used only for temporary local verification. The cookie was not written to this document.

## Results

| Check | Endpoint / Command | Result |
| --- | --- | --- |
| Start API service | `npx.cmd NeteaseCloudMusicApi` | Passed. Service listened on `http://localhost:3000`. |
| QR key | `GET /login/qr/key` | Passed. Returned `data.unikey`. |
| QR image | `GET /login/qr/create?key=...&qrimg=true` | Passed. Returned PNG base64 data URI. |
| QR status | `GET /login/qr/check?key=...` | Passed after manual scan. Returned `code: 803`, message `授权登陆成功`, with cookie present. |
| Login status with cookie | `GET /login/status` | Passed. Returned `code: 200`, uid `342704021`, nickname present. |
| Public playlist detail | `GET /playlist/detail?id=3778678` | Passed. Returned `code: 200`, playlist `热歌榜`, 200 track ids. |
| Authenticated user playlist | `GET /user/playlist?uid=342704021` | Passed. Returned `code: 200`, 29 playlists. |
| Authenticated playlist detail | `GET /playlist/detail?id=479806688` | Passed. Returned `code: 200`, playlist name `也许l可以吧喜欢的音乐`, 517 track ids. |
| Old song URL endpoint | `GET /music/url?id=...` | Failed. Current API returns `404 Cannot GET /music/url`. |
| Song URL endpoint | `GET /song/url?id=...` | Passed. Tested 10 track ids; 10 valid URLs, 0 unavailable. |
| Song URL v1 endpoint | `GET /song/url/v1?id=...&level=standard` | Passed. Tested 10 track ids; 10 valid URLs, 0 unavailable. |
| Fallback outer URL | `HEAD https://music.163.com/song/media/outer/url?id={id}.mp3` | Passed for 3 sampled ids. Returned `302` redirect to CDN MP3 URLs. |

## Sample Data

Test playlist:

- Playlist id: `3778678`
- Name: `热歌榜`
- Track count returned by `trackIds`: `200`

Sample track ids:

```text
1973665667,1352916750,1359356908,2600493765,215382,1403318151,3333988321,1842728629,1303464858,2163210456
```

Song URL sample result:

- `/song/url`: 10 total, 10 valid, 0 unavailable
- `/song/url/v1`: 10 total, 10 valid, 0 unavailable

## Notes For Implementation

1. README/T07 references `/music/url`, but `NeteaseCloudMusicApi@4.31.0` exposes `/song/url` and `/song/url/v1` instead. Backend implementation should prefer `/song/url/v1` or `/song/url`, not `/music/url`.
2. QR login requires a manual scan with the NetEase Cloud Music app. Do not persist returned cookies in repository files.
