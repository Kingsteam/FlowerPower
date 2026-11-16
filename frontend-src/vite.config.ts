import { defineConfig } from "vite";

// Baut eine einzige Datei für Home Assistant (kein Code-Splitting).
export default defineConfig({
  build: {
    outDir: "../custom_components/irrigation_planner/frontend",
    emptyOutDir: true,
    target: "es2022",
    minify: true,
    lib: {
      entry: "src/panel.ts",
      formats: ["es"],
      fileName: () => "irrigation-planner-panel.js",
    },
  },
});
