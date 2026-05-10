import { defineStore } from 'pinia';

import { api } from '../services/api';

interface UserState {
  loggedIn: boolean;
  nickname: string | null;
  qrKey: string | null;
  qrStatus: string | null;
  loading: boolean;
  error: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    loggedIn: false,
    nickname: null,
    qrKey: null,
    qrStatus: null,
    loading: false,
    error: null,
  }),
  actions: {
    async refreshStatus() {
      const status = await api.auth.status();
      this.loggedIn = status.loggedIn;
    },
    async createQrKey() {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.auth.qrKey();
        this.qrKey = response.key;
        this.qrStatus = 'waiting';
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create QR key';
      } finally {
        this.loading = false;
      }
    },
    async checkQr() {
      if (!this.qrKey) {
        return;
      }

      const status = await api.auth.qrCheck(this.qrKey);
      this.qrStatus = String(status.code);

      if (status.code === 803 || status.code === 800) {
        this.loggedIn = true;
        this.nickname = status.nickname ?? this.nickname;
      }
    },
  },
});
