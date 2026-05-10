<template>
  <section class="max-w-2xl rounded border border-zinc-800 bg-zinc-900 p-6">
    <h1 class="text-2xl font-semibold">设置</h1>
    <div class="mt-6 grid gap-4">
      <label class="grid gap-2">
        <span class="text-sm text-zinc-300">城市</span>
        <input v-model="settingsStore.city" class="min-h-10 rounded border border-zinc-700 bg-zinc-950 px-3 text-sm" />
      </label>
      <label class="grid gap-2">
        <span class="text-sm text-zinc-300">纬度</span>
        <input
          v-model.number="settingsStore.lat"
          class="min-h-10 rounded border border-zinc-700 bg-zinc-950 px-3 text-sm"
          type="number"
        />
      </label>
      <label class="grid gap-2">
        <span class="text-sm text-zinc-300">经度</span>
        <input
          v-model.number="settingsStore.lon"
          class="min-h-10 rounded border border-zinc-700 bg-zinc-950 px-3 text-sm"
          type="number"
        />
      </label>
      <label class="grid gap-2">
        <span class="text-sm text-zinc-300">语音</span>
        <select v-model="settingsStore.voice" class="min-h-10 rounded border border-zinc-700 bg-zinc-950 px-3 text-sm">
          <option value="zh-CN-XiaoxiaoNeural">晓晓</option>
          <option value="zh-CN-YunxiNeural">云希</option>
        </select>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../stores/settings';

const settingsStore = useSettingsStore();
</script>
