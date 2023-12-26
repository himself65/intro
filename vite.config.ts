import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    external: ['glob', 'next-mdx-remote']
  }
})
