<template>
  <header class="border-b border-zinc-800 bg-zinc-950/95">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
      <RouterLink class="text-sm font-semibold tracking-wide text-zinc-50" to="/">AI Radio</RouterLink>
      <nav class="flex items-center gap-1 text-sm text-zinc-300">
        <RouterLink v-for="item in items" :key="item.to" class="rounded px-3 py-2 hover:bg-zinc-900" :to="item.to">
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const items = [
  { to: '/login', label: '登录' },
  { to: '/playlists', label: '歌单' },
  { to: '/radio', label: '电台' },
  { to: '/settings', label: '设置' },
];
</script>
