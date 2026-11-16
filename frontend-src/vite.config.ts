import { defineConfig } from "vite";

// Baut das Panel und die Dashboard-Karte für Home Assistant.
export default defineConfig({
  build: {
    outDir: "../custom_components/irrigation_planner/frontend",
    emptyOutDir: true,
    target: "es2022",
    minify: true,
    lib: {
      // Panel „Bewässerung“ und Dashboard-Karte; gemeinsamer Code landet in
      // einer eigenen Datei (Lit), die beide laden.
      entry: {
        "irrigation-planner-panel": "src/panel.ts",
        "irrigation-planner-card": "src/card.ts",
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
  },
});
