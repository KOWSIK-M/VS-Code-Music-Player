/**
 * @file Tests for the clickSound module.
 * @module clickSound.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('vscode', () => ({
  workspace: {
    onDidChangeTextDocument: vi.fn(),
  },
}));

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

import { setupClickSound, teardownClickSound } from '../src/clickSound.js';
import * as vscode from 'vscode';
import { exec } from 'child_process';

describe('clickSound', () => {
  const mockContext = {
    extensionPath: './',
    subscriptions: { push: vi.fn() },
  };
  const mockFfplayPath = './mock/ffplay.exe';

  let mockDispose;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDispose = vi.fn();
    vscode.workspace.onDidChangeTextDocument.mockReturnValue({ dispose: mockDispose });
  });

  describe('setupClickSound', () => {
    it('should register a text document change listener', () => {
      setupClickSound(mockContext, mockFfplayPath);
      expect(vscode.workspace.onDidChangeTextDocument).toHaveBeenCalled();
      expect(mockContext.subscriptions.push).toHaveBeenCalled();
    });

    it('should dispose of existing listener if present', () => {
      setupClickSound(mockContext, mockFfplayPath);
      setupClickSound(mockContext, mockFfplayPath);
      expect(mockDispose).toHaveBeenCalled();
    });

    it('should play click sound on text document change', () => {
      setupClickSound(mockContext, mockFfplayPath);
      const listenerCallback = vscode.workspace.onDidChangeTextDocument.mock.calls[0][0];
      listenerCallback(); 
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining(mockFfplayPath),
        expect.any(Function)
      );
    });
  });

  describe('teardownClickSound', () => {
    it('should dispose of the text change listener', () => {
      setupClickSound(mockContext, mockFfplayPath);
      teardownClickSound();
      expect(mockDispose).toHaveBeenCalled();
    });

    it('should do nothing if no listener is present', () => {
      expect(() => teardownClickSound()).not.toThrow();
    });
  });
});
