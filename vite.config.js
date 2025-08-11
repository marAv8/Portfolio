import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
 
  server: {
    host: true, // 👈 This makes it accessible via IP
  },
});
