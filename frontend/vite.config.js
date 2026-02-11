import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import obfuscatorPkg from 'vite-plugin-obfuscator';
const obfuscator = obfuscatorPkg.obfuscator || obfuscatorPkg.default || obfuscatorPkg;

export default defineConfig({
  plugins: [react(), obfuscator({
    options: {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      numbersToExpressions: false,
      renameGlobals: false,
      selfDefending: true,
      simplify: true,
      splitStrings: false,
      stringArray: true,
      stringArrayThreshold: 0.75,
      unicodeEscapeSequence: false
    }
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    }
  }
});
