import { defineConfig, loadEnv } from 'vite';
import { cpSync } from 'fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.API_BASE || 'http://localhost:8000';

  return {
    base: './',
    server: {
      proxy: {
        '/api/plot-data.php': {
          target: apiBase,
          changeOrigin: true,
          rewrite: () => '/plot-data',
        },
        '/api/get_current_weather.php': {
          target: apiBase,
          changeOrigin: true,
          rewrite: () => '/get_current_weather',
        },
        '/api/get_next_day_weather_prediction.php': {
          target: apiBase,
          changeOrigin: true,
          rewrite: () => '/get_next_day_weather_prediction',
        },
        '/api/get_daily_prediction.php': {
          target: apiBase,
          changeOrigin: true,
          rewrite: () => '/get_daily_prediction',
        },
        '/api/get_water_temp.php': {
          target: apiBase,
          changeOrigin: true,
          rewrite: () => '/get_water_temp',
        },
        '/api/get_all_predictions.php': {
          target: apiBase,
          changeOrigin: true,
          rewrite: () => '/get_all_predictions',
        },
        '/api/download.php': {
          target: apiBase,
          changeOrigin: true,
          rewrite: () => '/masterdata',
        },
      },
    },
    plugins: [
      {
        name: 'copy-api',
        closeBundle() {
          cpSync('api', 'dist/api', { recursive: true });
        },
      },
    ],
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          faq: 'faq.html',
          impressum: 'impressum.html',
          datenschutz: 'datenschutz.html',
        },
      },
    },
  };
});
