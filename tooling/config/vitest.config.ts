import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
    root: fileURLToPath(new URL('../../', import.meta.url)),
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/integration/setup.ts'],
        include: ['packages/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    },
});
