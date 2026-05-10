<template>
  <p class="rounded border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-50">
    {{ text }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>
