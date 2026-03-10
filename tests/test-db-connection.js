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
// ║  FILE: frontend/vite.config.ts                                                    ║
// ║  LAYER: ui/frontend                                                  ║
// ╚══════════════════════════════════════════════════════════════════╝
// HEADY_BRAND:END
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Removed vite-plugin-obfuscator due to build errors

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
  build: {
    outDir: "dist",
  },
});
=======
// ║  FILE: test-db-connection.js                                                    ║
// ║  LAYER: root                                                  ║
// ╚══════════════════════════════════════════════════════════════════╝
// HEADY_BRAND:END
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'internal.headyio.com',
  database: 'heady',
  password: 'password',
  port: 5432,
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.info('Database connection successful:', res.rows[0]);
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  } finally {
    await pool.end();
  }
}

testConnection();

>>>>>>> f1ab914a56ebb387b9669c4d2f46e3c53f393edd
