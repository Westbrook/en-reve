import { defineConfig } from 'vite';

// Concurrent package builds must not reload an in-progress interaction scenario.
export default defineConfig({ server: { hmr: false, watch: null } });
