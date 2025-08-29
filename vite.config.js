import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // Only include visualizer during build to avoid affecting dev
    ...(command === 'build'
      ? [
          visualizer({
            filename: 'dist/stats.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
            open: false,
          }),
        ]
      : []),
  ],

  server: {
    host: true, // 👈 This makes it accessible via IP
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': [
            'react',
            'react-dom',
            'react-router',
            'react-router-dom',
          ],
          'vendor-webgl': [
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            'three-stdlib',
            '@react-spring/three',
          ],
        },
      },
    },
  },
}));
