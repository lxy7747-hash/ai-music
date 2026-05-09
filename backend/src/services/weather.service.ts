export interface WeatherData {
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed: number;
  cityName?: string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
}

const weatherDescriptions: Record<number, string> = {
  0: '晴朗',
  1: '大部晴朗',
  2: '局部多云',
  3: '阴天',
  45: '有雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '中等毛毛雨',
  55: '浓毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  80: '小阵雨',
  81: '中等阵雨',
  82: '强阵雨',
  95: '雷雨',
  96: '雷雨伴小冰雹',
  99: '雷雨伴大冰雹',
};

class WeatherService {
  private readonly timeoutMs = 5_000;

  async getWeather(lat: number, lon: number): Promise<WeatherData> {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
    url.searchParams.set('timezone', 'auto');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Open-Meteo returned ${response.status}`);
      }

      const body = (await response.json()) as OpenMeteoResponse;
      const code = body.current?.weather_code ?? 0;

      return {
        temperature: body.current?.temperature_2m ?? 0,
        weatherCode: code,
        weatherDescription: weatherDescriptions[code] ?? '未知天气',
        windSpeed: body.current?.wind_speed_10m ?? 0,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const weatherService = new WeatherService();
