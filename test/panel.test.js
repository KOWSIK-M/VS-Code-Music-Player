/**
 * @file Tests for the webview panel module.
 * @module panel.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWebviewPanel } from '../src/panel';
import * as vscode from 'vscode';
import state from '../src/state';
import * as audioPlayer from '../src/audioPlayer';
import * as fs from 'fs';

vi.mock('../src/audioPlayer.js');
vi.mock('fs');

describe('panel', () => {
  const mockContext = {
    extensionUri: vscode.Uri.file('C:/Github/contribution/VS-Code-Music-Player'),
    extensionPath: 'C:/Github/contribution/VS-Code-Music-Player',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
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

    vi.spyOn(vscode.window, 'createWebviewPanel').mockReturnValue({
      webview: {
        onDidReceiveMessage: vi.fn(),
        asWebviewUri: vi.fn(uri => uri),
        html: '',
        postMessage: vi.fn(),
      },
      onDidDispose: vi.fn(),
      dispose: vi.fn(),
    });
    vi.spyOn(vscode.window, 'showErrorMessage').mockImplementation(() => {});
    vi.spyOn(fs, 'readFileSync').mockReturnValue('<html>{{songList}}{{currentSong}}{{styleUri}}</html>');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([
          { name: 'Song 1', url: 'song1.mp3' },
          { name: 'Song 2', url: 'song2.mp3' },
        ]),
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createWebviewPanel', () => {
    it('should create and show a webview panel', async () => {
      await createWebviewPanel(mockContext);
      expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
        'musicSelector',
        'Music Player',
        vscode.ViewColumn.One,
        expect.any(Object)
      );
      expect(state.panel).toBeDefined();
      expect(state.panel.webview.html).toContain('Loading...');
    });

    it('should fetch songs and populate the webview', async () => {
      await createWebviewPanel(mockContext);
      await vi.runAllTimersAsync(); 
      expect(global.fetch).toHaveBeenCalledWith('https://vs-music-songs-server.onrender.com/songs');
      expect(state.songQueue).toHaveLength(2);
      expect(state.panel.webview.html).toContain('Song 1');
      expect(state.panel.webview.html).toContain('Song 2');
    });

    it('should show error message if fetching songs fails', async () => {
      global.fetch.mockImplementationOnce(() => Promise.reject('Network error'));
      await createWebviewPanel(mockContext);
      await vi.runAllTimersAsync();
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Unable to load songs. Please check your internet.');
    });

    it('should handle webview messages correctly', async () => {
      await createWebviewPanel(mockContext);
      await vi.runAllTimersAsync();

      const onDidReceiveMessageCallback = state.panel.webview.onDidReceiveMessage.mock.calls[0][0];

      // Test 'play' command
      onDidReceiveMessageCallback({ command: 'play', index: 0 });
      expect(audioPlayer.playAudio).toHaveBeenCalledWith(mockContext, 'song1.mp3');
      expect(state.currentSongIndex).toBe(0);

      // Test 'pause' command
      onDidReceiveMessageCallback({ command: 'pause' });
      expect(audioPlayer.pauseAudio).toHaveBeenCalled();

      // Test 'resume' command
      onDidReceiveMessageCallback({ command: 'resume' });
      expect(audioPlayer.resumeAudio).toHaveBeenCalledWith(mockContext);

      // Test 'stop' command
      onDidReceiveMessageCallback({ command: 'stop' });
      expect(audioPlayer.stopAudio).toHaveBeenCalled();

      // Test 'prev' command
      onDidReceiveMessageCallback({ command: 'prev' });
      expect(audioPlayer.playPreviousSong).toHaveBeenCalledWith(mockContext);

      // Test 'next' command
      onDidReceiveMessageCallback({ command: 'next' });
      expect(audioPlayer.playNextSong).toHaveBeenCalledWith(mockContext);

      // Test 'toggleAutoPlay' command
      onDidReceiveMessageCallback({ command: 'toggleAutoPlay', enabled: true });
      expect(state.isAutoPlayEnabled).toBe(true);

      // Test 'toggleLoop' command
      onDidReceiveMessageCallback({ command: 'toggleLoop', enabled: true });
      expect(state.isLooping).toBe(true);

      // Test 'seek' command
      onDidReceiveMessageCallback({ command: 'seek', time: 30 });
      expect(state.playbackProgress).toBe(30);
      expect(audioPlayer.playAudio).toHaveBeenCalledWith(mockContext, 'song1.mp3', 30);
    });
  });
});