import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      vscode: path.resolve(__dirname, 'test/vscode.mock.js'),
    },
    setupFiles: [path.resolve(__dirname, 'test/setup.js')],
  },
});
