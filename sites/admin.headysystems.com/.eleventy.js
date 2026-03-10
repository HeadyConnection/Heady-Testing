// HEADY_BRAND:BEGIN
// ╔══════════════════════════════════════════════════════════════════╗
// ║  ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗                     ║
// ║  ██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝                     ║
// ║  ███████║█████╗  ███████║██║  ██║ ╚████╔╝                      ║
// ║  ██╔══██║██╔══╝  ██╔══██║██║  ██║  ╚██╔╝                       ║
// ║  ██║  ██║███████╗██║  ██║██████╔╝   ██║                        ║
// ║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝                        ║
// ║                                                                  ║
// ║  ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces    ║
// ║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
<<<<<<< HEAD
// ║  FILE: frontend/postcss.config.js                                                    ║
// ║  LAYER: ui/frontend                                                  ║
// ╚══════════════════════════════════════════════════════════════════╝
// HEADY_BRAND:END
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
=======
// ║  FILE: websites/sites/admin.headysystems.com/.eleventy.js
// ║  LAYER: root                                                  ║
// ╚══════════════════════════════════════════════════════════════════╝
// HEADY_BRAND:END
module.exports = function(eleventyConfig) {
  // Heady Admin specific config
  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
>>>>>>> f1ab914a56ebb387b9669c4d2f46e3c53f393edd
