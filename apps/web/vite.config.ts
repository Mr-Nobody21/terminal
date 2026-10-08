import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: http:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};
export default defineConfig({
    base: './',
    plugins: [react()],
    server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
    preview: { headers: securityHeaders, proxy: { '/api': 'http://127.0.0.1:3001' } },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('/elkjs/')) return 'layout';
                    if (id.includes('/@xyflow/')) return 'canvas';
                    if (['docx', 'pdf-lib', 'jszip'].some(name => id.includes(`/node_modules/${name}/`))) return 'reports';
                },
            },
        },
    },
});
