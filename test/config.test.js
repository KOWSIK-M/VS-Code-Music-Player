/**
 * @file Tests for the configuration module.
 * @module config.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExtentionConfig } from '../src/config.js';
import * as vscode from 'vscode';

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the correct configuration for keyClickSoundEffect', () => {
    const mockGet = vi.fn((key, defaultValue) => {
      if (key === 'keyClickSoundEffect') {
        return false; 
      }
      return defaultValue;
    });
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: mockGet,
    });

    const config = getExtentionConfig();
    expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('vs-music-player');
    expect(mockGet).toHaveBeenCalledWith('keyClickSoundEffect', true);
    expect(config.keyClickSoundEffect).toBe(false);
  });

  it('should return default value if setting is not explicitly set', () => {
    const mockGet = vi.fn((key, defaultValue) => defaultValue);
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
      get: mockGet,
    });

    const config = getExtentionConfig();
    expect(config.keyClickSoundEffect).toBe(true);
  });
});
