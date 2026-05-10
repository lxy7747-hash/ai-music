<template>
  <div class="rounded border border-zinc-800 bg-zinc-900 px-4 py-3">
    <p class="text-xs text-zinc-500">天气</p>
    <p class="mt-1 text-lg font-semibold">{{ weather ? `${weather.temperature}°C` : '--' }}</p>
    <p class="text-sm text-zinc-400">{{ weather?.weatherDescription ?? '暂无数据' }}</p>
  </div>
</template>

<script setup lang="ts">
import type { WeatherData } from '../services/api';

defineProps<{
  weather: WeatherData | null;
}>();
</script>
