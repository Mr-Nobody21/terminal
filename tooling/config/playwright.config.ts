import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
export default defineConfig({
    testDir: '../../tests/e2e',
    outputDir: '../../test-results',
    use: { baseURL: 'http://127.0.0.1:5173', headless: true },
    webServer: {
        command: 'npm run dev -- --port 5173 --strictPort',
        cwd: fileURLToPath(new URL('../../', import.meta.url)),
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
    },
});
