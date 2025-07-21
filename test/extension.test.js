/**
 * @file Tests for the main extension module.
 * @module extension.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { activate, deactivate } from '../src/extension';
import * as audioPlayer from '../src/audioPlayer';
import * as clickSound from '../src/clickSound';
import * as config from '../src/config';
import { createWebviewPanel } from '../src/panel';
import state from '../src/state';

vi.mock('../src/audioPlayer');
vi.mock('../src/clickSound');
vi.mock('../src/config');
vi.mock('../src/panel.js');

describe('extension', () => {
  const mockContext = {
    subscriptions: { push: vi.fn() },
    extensionPath: 'C:/Github/contribution/VS-Code-Music-Player',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    state.playbackInterval = null;
    state.isPaused = false;
    state.songQueue = [];
    state.currentSongIndex = 0;
    state.isAutoPlayEnabled = false;
    state.musicProcess = null;
    state.ffplayProcess = null;
    state.songDuration = 0;
    state.playbackProgress = 0;
    state.panel = null;
    state.isLooping = false;

    vi.spyOn(vscode.commands, 'registerCommand').mockReturnValue({ dispose: vi.fn() });
    vi.spyOn(vscode.workspace, 'onDidChangeConfiguration').mockReturnValue({ dispose: vi.fn() });
    vi.spyOn(config, 'getExtentionConfig').mockReturnValue({ keyClickSoundEffect: true });
  });

  describe('activate', () => {
    it('should initialize audio player', () => {
      activate(mockContext);
      expect(audioPlayer.initialize).toHaveBeenCalledWith(mockContext);
    });

    it('should register openMusicSelector command', () => {
      activate(mockContext);
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'vs-music-player.openMusicSelector',
        expect.any(Function)
      );
      const commandCallback = vscode.commands.registerCommand.mock.calls[0][1];
      commandCallback();
      expect(createWebviewPanel).toHaveBeenCalledWith(mockContext);
    });

    it('should setup click sound if enabled', () => {
      activate(mockContext);
      expect(clickSound.setupClickSound).toHaveBeenCalledWith(mockContext, expect.any(String));
    });

    it('should not setup click sound if disabled', () => {
      vi.spyOn(config, 'getExtentionConfig').mockReturnValue({ keyClickSoundEffect: false });
      activate(mockContext);
      expect(clickSound.setupClickSound).not.toHaveBeenCalled();
    });

    it('should handle configuration changes for click sound', () => {
      // Initial activation
      vi.spyOn(config, 'getExtentionConfig').mockReturnValueOnce({ keyClickSoundEffect: true });
      activate(mockContext);
      expect(clickSound.setupClickSound).toHaveBeenCalledTimes(1);

      const onDidChangeConfigurationCallback = vscode.workspace.onDidChangeConfiguration.mock.calls[0][0];

      // Simulate disabling click sound
      vi.spyOn(config, 'getExtentionConfig').mockReturnValueOnce({ keyClickSoundEffect: false });
      onDidChangeConfigurationCallback({ affectsConfiguration: (key) => key === 'vs-music-player.keyClickSoundEffect' });
      expect(clickSound.teardownClickSound).toHaveBeenCalledTimes(1);

      // Simulate enabling click sound again
      vi.spyOn(config, 'getExtentionConfig').mockReturnValueOnce({ keyClickSoundEffect: true });
      onDidChangeConfigurationCallback({ affectsConfiguration: (key) => key === 'vs-music-player.keyClickSoundEffect' });
      expect(clickSound.setupClickSound).toHaveBeenCalledTimes(2);
    });
  });

  describe('deactivate', () => {
    it('should stop audio and clear interval', () => {
      state.playbackInterval = setInterval(() => {}, 100);
      deactivate();
      expect(audioPlayer.stopAudio).toHaveBeenCalled();
      expect(clearInterval).toHaveBeenCalledWith(state.playbackInterval);
    });
  });
});