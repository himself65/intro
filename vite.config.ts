import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    external: ['glob']
  }
})
