import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { inspectorServer } from '@react-dev-inspector/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            '@react-dev-inspector/babel-plugin',
            {
              requireId: true,
            },
          ],
        ],
      },
    }),
    tailwindcss(),
    inspectorServer(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
