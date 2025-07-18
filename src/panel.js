import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import state from "./state.js";
import {
  playAudio,
  pauseAudio,
  resumeAudio,
  stopAudio,
  playNextSong,
  playPreviousSong,
} from "./audioPlayer.js";

export function createWebviewPanel(context) {
  const backendUrl = "https://vs-music-songs-server.onrender.com/songs";

  state.panel = vscode.window.createWebviewPanel(
    "musicSelector",
    "Music Player",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, "media")
      ]
    }
  );

  state.panel.webview.html = buildLoadingHtml();

  fetch(backendUrl)
    .then((response) => response.json())
    .then((songs) => {
      if (!Array.isArray(songs)) throw new Error("Invalid song list format");

      state.songQueue = songs;
      const songListHtml = buildSongListHtml(songs);
      const currentSong = songs[state.currentSongIndex]?.name || "No song selected";

      state.panel.webview.html = buildHtml(context, songListHtml, currentSong);
      setupWebviewListeners(context);
    })
    .catch((err) => {
      console.error("Failed to fetch songs:", err);
      vscode.window.showErrorMessage("Unable to load songs. Please check your internet.");
    });
}

function buildSongListHtml(songs) {
  return songs
    .map((song, index) => `
      <li>
        <p id="nameSong-${song.name}" class="song-list">
          <button id="playButton-${index}" class="songs-button">${song.name}</button>
        </p>
      </li>`)
    .join("");
}

function buildHtml(context, songListHtml, currentSongName) {
  const templatePath = path.join(context.extensionPath, "media", "webview.html");
  let template = fs.readFileSync(templatePath, "utf8");

  const styleUri = vscode.Uri.joinPath(context.extensionUri, "media", "style.css");
  const localStyleUri = state.panel.webview.asWebviewUri(styleUri);

  return template
    .replace(/{{songList}}/g, songListHtml)
    .replace(/{{currentSong}}/g, currentSongName)
    .replace("{{styleUri}}", localStyleUri.toString());
}

function buildLoadingHtml() {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Loading...</title>
      <style>
        body { font-family: sans-serif; background-color: #1e1e1e; color: white; text-align: center; padding: 50px; }
        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-top: 4px solid #fff;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <p>🎵 Loading songs...</p>
    </body>
  </html>`;
}

function setupWebviewListeners(context) {
  state.panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      case "play":
        state.currentSongIndex = parseInt(message.index, 10);
        playAudio(context, state.songQueue[state.currentSongIndex].url);
        break;
      case "pause":
        pauseAudio();
        break;
      case "resume":
        resumeAudio(context);
        break;
      case "stop":
        stopAudio();
        break;
      case "prev":
        playPreviousSong(context);
        break;
      case "next":
        playNextSong(context);
        break;
      case "toggleAutoPlay":
        state.isAutoPlayEnabled = message.enabled;
        break;
      case "toggleLoop":
        state.isLooping = message.enabled;
        break;
      case "seek":
        state.playbackProgress = message.time;
        playAudio(context, state.songQueue[state.currentSongIndex].url, state.playbackProgress);
        break;
    }
  });
}