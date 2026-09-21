import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    watch: {
      ignored: [
        '**/server/.wwebjs_auth/**'
      ]
    }
  },

  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        cart: resolve(__dirname, 'cart.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        'my-orders': resolve(__dirname, 'my-orders.html'),
        'order-tracking': resolve(__dirname, 'order-tracking.html'),
        'thank-you': resolve(__dirname, 'thank-you.html'),
        'admin-orders': resolve(__dirname, 'admin-orders.html')
      }
    }
  }
})