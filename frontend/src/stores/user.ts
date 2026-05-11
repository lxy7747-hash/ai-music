import { defineStore } from 'pinia';

import { api } from '../services/api';

interface UserState {
  loggedIn: boolean;
  neteaseUid: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  qrKey: string | null;
  qrStatus: string | null;
  loading: boolean;
  error: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    loggedIn: false,
    neteaseUid: null,
    nickname: null,
    avatarUrl: null,
    qrKey: null,
    qrStatus: null,
    loading: false,
    error: null,
  }),
  actions: {
    async refreshStatus() {
      const status = await api.auth.status();
      this.loggedIn = status.loggedIn;
      this.neteaseUid = status.user?.neteaseUid ?? null;
      this.nickname = status.user?.nickname ?? null;
      this.avatarUrl = status.user?.avatarUrl ?? null;
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
        return null;
      }

      const status = await api.auth.qrCheck(this.qrKey);
      this.qrStatus = String(status.code);

      if (status.code === 803) {
        await this.refreshStatus();
      } else if (status.code === 800) {
        this.nickname = status.nickname ?? status.user?.nickname ?? this.nickname;
      }

      return status.code;
    },
    async logout() {
      await api.auth.logout();
      this.loggedIn = false;
      this.neteaseUid = null;
      this.nickname = null;
      this.avatarUrl = null;
      this.qrStatus = null;
    },
  },
});
