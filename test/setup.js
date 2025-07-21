/**
 * @file Global setup for Vitest tests.
 * @module setup
 */

import { vi } from 'vitest';

const vscodeMock = {
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn(),
  },
  window: {
    createWebviewPanel: vi.fn(() => ({
      webview: {
        onDidReceiveMessage: vi.fn(),
        asWebviewUri: vi.fn(uri => uri.toString()),
        html: '',
        postMessage: vi.fn(),
      },
      onDidDispose: vi.fn(),
      dispose: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    visibleTextEditors: [],
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn(key => {
        if (key === 'vs-music-player.keyClickSoundEffect') {
          return true;
        }
        return undefined;
      }),
    })),
    onDidChangeConfiguration: vi.fn(() => ({
      dispose: vi.fn(),
      // This is crucial for the extension.test.js to trigger the callback
      fire: (event) => {
        // Simulate the event firing
        vscodeMock.workspace.onDidChangeConfiguration.mock.calls.forEach(call => {
          if (call[0] && typeof call[0] === 'function') {
            call[0](event);
          }
        });
      },
    })),
    onDidChangeTextDocument: vi.fn(() => ({
      dispose: vi.fn(),
    })),
  },
  Uri: {
    joinPath: (...args) => ({ fsPath: args.join('/') }),
    file: (path) => ({ fsPath: path }),
  },
  ViewColumn: {
    One: 1,
  },
  extensions: {
    getExtension: vi.fn(() => ({
      extensionPath: 'C:/Github/contribution/VS-Code-Music-Player'
    }))
  },
};

vi.mock('vscode', () => vscodeMock);

vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    const mockProcess = {
      stdout: { pipe: vi.fn() },
      stdin: { end: vi.fn() },
      kill: vi.fn(),
    };
    return mockProcess;
  }),
  execFile: vi.fn((command, args, callback) => {
    if (command.includes('ffprobe')) {
      callback(null, '120.00', '');
    } else {
      callback(null, '', '');
    }
  }),
  exec: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '<html>{{songList}}{{currentSong}}{{styleUri}}</html>'),
}));

// Mock global timers
vi.spyOn(global, 'clearInterval');
vi.spyOn(global, 'setInterval');