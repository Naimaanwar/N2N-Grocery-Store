import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    watch: {
      ignored: [
        '**/server/.wwebjs_auth/**'
      ]
    }
  }
})