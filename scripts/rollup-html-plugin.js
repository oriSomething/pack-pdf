// @ts-check

import { createFilter } from "rollup-pluginutils";

export default function rollupHtmlPlugin(options = {}) {
  const filter = createFilter(options.include || ["**/*.html"], options.exclude);

  return {
    name: "html-template",

    /**
     * @param {string} code
     * @param {string} id
     * @returns {string}
     */
    transform(code, id) {
      if (!filter(id)) {
        return;
      }

      /** @type {string} */
      const html = code.replace(/`/g, "\\`").replace(/\$/g, "\\$");

      return `
        const template = document.createElement("template");
        template.innerHTML = \`${html}\`;
        export default template;
      `;
    },
  };
}
