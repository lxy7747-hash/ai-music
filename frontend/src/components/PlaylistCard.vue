<template>
  <button class="group grid h-full text-left" @click="$emit('select', playlist)">
    <span class="aspect-square overflow-hidden rounded bg-zinc-800">
      <img v-if="playlist.coverUrl" class="h-full w-full object-cover transition group-hover:scale-105" :src="playlist.coverUrl" alt="" />
      <span v-else class="flex h-full items-center justify-center text-xl font-semibold text-zinc-400">AI</span>
    </span>
    <span class="mt-3 line-clamp-2 text-sm font-medium text-zinc-100">{{ playlist.name }}</span>
    <span class="mt-1 text-xs text-zinc-500">{{ playlist.trackCount }} 首</span>
  </button>
</template>

<script setup lang="ts">
import type { Playlist } from '../services/api';

defineProps<{
  playlist: Playlist;
}>();

defineEmits<{
  select: [playlist: Playlist];
}>();
</script>
