import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"
 
export default defineConfig({
  plugins: [react()],
  server: {
    open: false, // this ensures that the browser opens upon server start
    port: 3000, // this sets a default port to 3000
    host: true,
  },
  preview: {
    open: false,
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})