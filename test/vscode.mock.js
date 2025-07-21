/**
 * @file Mock VS Code API for testing purposes.
 * @module vscode.mock
 */

import { vi } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionPath = path.resolve(__dirname, '../'); 

const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn(),
};

const window = {
  createWebviewPanel: vi.fn(() => ({
    webview: {
      onDidReceiveMessage: vi.fn(),
      asWebviewUri: vi.fn(uri => uri),
      html: '',
      postMessage: vi.fn(),
    },
    onDidDispose: vi.fn(),
    dispose: vi.fn(),
  })),
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  visibleTextEditors: [],
};

const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn(key => {
      if (key === 'vs-music-player.keyClickSoundEffect') {
        return true;
      }
      return undefined;
    }),
  })),
  onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
};

const Uri = {
  joinPath: (...args) => ({ fsPath: args.join('/') }),
  file: (p) => ({ fsPath: p }),
};

const ViewColumn = {
  One: 1,
};

const extensions = {
  getExtension: vi.fn(() => ({
    extensionPath,
  })),
};

export {
  commands,
  window,
  workspace,
  Uri,
  ViewColumn,
  extensions,
};
