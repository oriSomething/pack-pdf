import typescript from "rollup-plugin-typescript";
import rollupHtmlPlugin from "./scripts/rollup-html-plugin";

export default {
  input: "./src/index.ts",

  globals: {
    jspdf: "jsPDF",
  },

  output: {
    file: "./public/bundle.js",
    format: "iife",
  },

  plugins: [
    typescript({
      typescript: require("typescript"),
    }),
    rollupHtmlPlugin(),
  ],

  watch: {
    include: "src/**",
    exclude: "node_modules/**",
  },
};
