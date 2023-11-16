// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  server: {
    proxy: {
      // Proxy API requests to the Express server
      "/api": {
        target: "http://localhost:3000", // Change this to the port your Express server is running on
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
