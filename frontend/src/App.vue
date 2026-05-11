<template>
  <AppShell>
    <router-view v-slot="{ Component }">
      <transition mode="out-in" name="route-fade">
        <component :is="Component" />
      </transition>
    </router-view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from './components/layout/AppShell.vue';
</script>
