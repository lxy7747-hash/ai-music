<template>
  <section class="grid gap-5 rounded border border-zinc-800 bg-zinc-900 p-5 md:grid-cols-[180px_1fr]">
    <div class="aspect-square overflow-hidden rounded bg-zinc-800">
      <img v-if="segment?.track?.coverUrl" class="h-full w-full object-cover" :src="segment.track.coverUrl" alt="" />
      <div v-else class="flex h-full items-center justify-center text-3xl font-semibold text-cyan-300">AI</div>
    </div>
    <div class="min-w-0">
      <p class="text-sm text-cyan-300">{{ label }}</p>
      <h2 class="mt-2 truncate text-2xl font-semibold">{{ title }}</h2>
      <p class="mt-2 text-sm text-zinc-400">{{ subtitle }}</p>
      <DJAnnouncement v-if="segment?.djScript" class="mt-5" :text="segment.djScript" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { Segment } from '../services/api';
import DJAnnouncement from './DJAnnouncement.vue';

const props = defineProps<{
  segment: Segment | null;
}>();

const label = computed(() => (props.segment?.type === 'dj_announcement' ? 'AI DJ' : '正在播放'));
const title = computed(() => props.segment?.track?.name ?? '还没有播放内容');
const subtitle = computed(() => props.segment?.track?.artists.join(', ') ?? props.segment?.track?.album ?? '启动电台后会显示当前片段');
</script>
