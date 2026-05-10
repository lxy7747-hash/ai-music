<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
    <section class="rounded border border-zinc-800 bg-zinc-900 p-6">
      <p class="text-sm font-medium text-cyan-300">AI Radio</p>
      <h1 class="mt-3 text-3xl font-semibold">私人 AI 电台控制台</h1>
      <p class="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
        登录网易云、选择歌单、加入天气上下文，生成带 AI DJ 串场的连续播放体验。
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <RouterLink class="rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950" to="/playlists">选择歌单</RouterLink>
        <RouterLink class="rounded border border-zinc-700 px-4 py-2 text-sm" to="/login">登录网易云</RouterLink>
      </div>
    </section>

    <div class="grid gap-4">
      <WeatherBadge :weather="radioStore.weather" />
      <section class="rounded border border-zinc-800 bg-zinc-900 p-4">
        <p class="text-xs text-zinc-500">最近会话</p>
        <p class="mt-2 text-sm text-zinc-300">{{ radioStore.sessionId ?? '暂无会话' }}</p>
      </section>
    </div>

    <section class="lg:col-span-2">
      <NowPlaying :segment="radioStore.currentSegment" />
    </section>
  </div>
</template>

<script setup lang="ts">
import NowPlaying from '../components/NowPlaying.vue';
import WeatherBadge from '../components/WeatherBadge.vue';
import { useRadioStore } from '../stores/radio';

const radioStore = useRadioStore();
</script>
