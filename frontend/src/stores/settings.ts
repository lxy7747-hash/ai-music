import { defineStore } from 'pinia';

interface SettingsState {
  city: string;
  lat: number;
  lon: number;
  voice: string;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    city: 'Hong Kong',
    lat: 22.3193,
    lon: 114.1694,
    voice: 'zh-CN-XiaoxiaoNeural',
  }),
});
