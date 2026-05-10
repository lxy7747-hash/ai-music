<template>
  <div class="grid gap-6">
    <section class="rounded border border-zinc-800 bg-zinc-900 p-5">
      <h1 class="text-2xl font-semibold">歌单</h1>
      <div class="mt-4 flex flex-col gap-3 sm:flex-row">
        <input v-model="uid" class="min-h-10 flex-1 rounded border border-zinc-700 bg-zinc-950 px-3 text-sm" placeholder="网易云 uid" />
        <button class="rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950" :disabled="loading || !uid" @click="loadPlaylists">
          加载
        </button>
      </div>
      <p v-if="error" class="mt-3 text-sm text-red-300">{{ error }}</p>
    </section>

    <section v-if="loading" class="rounded border border-zinc-800 p-6 text-sm text-zinc-400">正在加载歌单...</section>
    <section v-else-if="playlists.length === 0" class="rounded border border-zinc-800 p-6 text-sm text-zinc-400">输入 uid 后加载歌单。</section>
    <section v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <PlaylistCard v-for="playlist in playlists" :key="playlist.id" :playlist="playlist" @select="selectPlaylist" />
    </section>

    <section v-if="selected" class="rounded border border-zinc-800 bg-zinc-900 p-5">
      <h2 class="text-lg font-semibold">{{ selected.name }}</h2>
      <p class="mt-1 text-sm text-zinc-400">{{ selected.trackCount }} 首</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button class="rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950" @click="startRadio">启动电台</button>
        <button class="rounded border border-zinc-700 px-4 py-2 text-sm" @click="analyzePlaylist">分析歌单</button>
      </div>
      <pre v-if="analysis" class="mt-4 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-300">{{ analysis }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import PlaylistCard from '../components/PlaylistCard.vue';
import { api, type Playlist } from '../services/api';
import { useRadioStore } from '../stores/radio';
import { useSettingsStore } from '../stores/settings';

const router = useRouter();
const radioStore = useRadioStore();
const settingsStore = useSettingsStore();
const uid = ref('');
const playlists = ref<Playlist[]>([]);
const selected = ref<Playlist | null>(null);
const analysis = ref('');
const loading = ref(false);
const error = ref('');

const loadPlaylists = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.playlists.list(uid.value);
    playlists.value = response.playlists;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    loading.value = false;
  }
};

const selectPlaylist = (playlist: Playlist) => {
  selected.value = playlist;
  analysis.value = '';
};

const analyzePlaylist = async () => {
  if (!selected.value) {
    return;
  }

  const response = await api.playlists.analyze(selected.value.id);
  analysis.value = JSON.stringify(response.analysis, null, 2);
};

const startRadio = async () => {
  if (!selected.value) {
    return;
  }

  await radioStore.start(selected.value, settingsStore.lat, settingsStore.lon, settingsStore.city);
  await router.push('/radio');
};
</script>
