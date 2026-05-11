<template>
  <section class="mx-auto max-w-xl rounded border border-zinc-800 bg-zinc-900 p-6">
    <h1 class="text-2xl font-semibold">网易云登录</h1>
    <p class="mt-2 text-sm text-zinc-400">当前后端提供 QR key 和扫码状态轮询，二维码图片接口会在后续登录完善中接入。</p>

    <div class="mt-6 rounded border border-dashed border-zinc-700 p-5">
      <p class="text-xs text-zinc-500">QR Key</p>
      <p class="mt-2 break-all font-mono text-sm text-cyan-200">{{ userStore.qrKey ?? '尚未生成' }}</p>
      <p class="mt-4 text-sm text-zinc-400">状态：{{ userStore.qrStatus ?? '未开始' }}</p>
    </div>

    <p v-if="userStore.error" class="mt-4 rounded bg-red-950 px-3 py-2 text-sm text-red-100">{{ userStore.error }}</p>

    <div class="mt-6 flex gap-3">
      <button class="rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950" :disabled="userStore.loading" @click="createQrKey">
        生成 Key
      </button>
      <button class="rounded border border-zinc-700 px-4 py-2 text-sm" :disabled="!userStore.qrKey" @click="checkQr">
        检查状态
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
let pollTimer: number | undefined;

const stopPolling = () => {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }
};

const checkQr = async () => {
  const code = await userStore.checkQr();

  if (code === 803) {
    stopPolling();
    await router.push('/playlists');
  }
};

const startPolling = () => {
  stopPolling();
  pollTimer = window.setInterval(() => {
    void checkQr();
  }, 3000);
};

const createQrKey = async () => {
  await userStore.createQrKey();

  if (userStore.qrKey) {
    startPolling();
  }
};

onBeforeUnmount(stopPolling);
</script>
