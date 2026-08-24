import { defineConfig } from 'vite';

// HA serves the built output from /better_notes_panel/ (see __init__.py's
// static path registration) — base must match so any future chunk/asset
// imports resolve correctly.
export default defineConfig({
  base: '/better_notes_panel/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: {
        'better-notes-panel': 'src/panel.ts',
        'better-notes-card': 'src/card.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
