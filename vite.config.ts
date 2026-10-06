import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({ base: './', plugins: [react()], build: { rollupOptions: { output: { manualChunks: { layout: ['elkjs/lib/elk.bundled.js'], canvas: ['@xyflow/react'], reports: ['docx', 'pdf-lib', 'jszip'] } } } }, test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}'] } });
