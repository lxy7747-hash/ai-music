<template>
  <section class="rounded border border-zinc-800">
    <button class="flex w-full items-center justify-between px-4 py-3 text-left" @click="open = !open">
      <span class="font-medium">队列</span>
      <span class="text-sm text-zinc-400">{{ items.length }} 段</span>
    </button>
    <ol v-if="open" class="divide-y divide-zinc-800">
      <li v-for="item in items" :key="item.id" class="px-4 py-3 text-sm">
        <p class="font-medium">{{ item.track?.name ?? item.djScript ?? '片段' }}</p>
        <p class="mt-1 text-xs text-zinc-500">{{ item.type }} · {{ item.status }}</p>
      </li>
      <li v-if="items.length === 0" class="px-4 py-4 text-sm text-zinc-500">暂无队列</li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { Segment } from '../services/api';

defineProps<{
  items: Segment[];
}>();

const open = ref(true);
</script>
