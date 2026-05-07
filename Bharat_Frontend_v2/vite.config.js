import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const parts = id.split("node_modules/")[1].split("/");

            // Split recharts internals into sub-chunks
            if (parts[0] === "recharts") {
              // e.g. recharts/es/cartesian/Bar -> vendor-recharts-cartesian
              // e.g. recharts/es/chart/BarChart -> vendor-recharts-chart
              // e.g. recharts/es/util/... -> vendor-recharts-util
              const subDir = parts[2] || "core"; // es/<subDir>/...
              return `vendor-recharts-${subDir}`;
            }

            // Split @phosphor-icons by sub-path to reduce its 135kb chunk
            if (parts[0] === "@phosphor-icons") {
              const subModule = parts[2] || "core";
              const letter = subModule.charAt(0).toLowerCase();
              // Group icons by first letter for balanced chunks
              return `vendor-phosphor-${letter}`;
            }

            // Handle other scoped packages
            if (parts[0].startsWith("@")) {
              return `vendor-${parts[0].replace("@", "")}-${parts[1]}`;
            }

            // Handle standard packages
            return `vendor-${parts[0]}`;
          }
        },
      },
    },
  },
});
