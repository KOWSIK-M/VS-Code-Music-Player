const vscode = require("vscode");
const audioPlayer = require("./audioPlayer");
const state = require("./state");
const { setupClickSound } = require("./clickSound");
const { createWebviewPanel } = require("./panel");

function activate(context) {
  console.log('🎧 VS Music Player activated!');

  audioPlayer.initialize(context);

  const ffplayExecutable = process.platform === "win32" ? "ffplay.exe" : "ffplay";
  const ffplayPath = require("path").join(context.extensionPath, "ffmpeg-bin", ffplayExecutable);
  setupClickSound(context, ffplayPath);

  const openPlayerCmd = vscode.commands.registerCommand(
    "vs-music-player.openMusicSelector",
    () => createWebviewPanel(context)
  );

  context.subscriptions.push(openPlayerCmd);
}

function deactivate() {
  audioPlayer.stopAudio();
  clearInterval(state.playbackInterval);
}

module.exports = { activate, deactivate };
