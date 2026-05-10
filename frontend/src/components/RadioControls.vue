<template>
  <div class="flex flex-wrap gap-2">
    <button class="rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950" :disabled="!canControl" @click="$emit('play')">
      播放
    </button>
    <button class="rounded border border-zinc-700 px-4 py-2 text-sm" :disabled="!canControl" @click="$emit('pause')">
      暂停
    </button>
    <button class="rounded border border-zinc-700 px-4 py-2 text-sm" :disabled="!canControl" @click="$emit('next')">
      下一段
    </button>
    <button class="rounded border border-red-500/60 px-4 py-2 text-sm text-red-200" :disabled="!canControl" @click="$emit('stop')">
      停止
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canControl: boolean;
}>();

defineEmits<{
  play: [];
  pause: [];
  next: [];
  stop: [];
}>();
</script>
