const vscode = require("vscode");
const audioPlayer = require("./audioPlayer");
const state = require("./state");
const { setupClickSound,teardownClickSound } = require("./clickSound");
const { createWebviewPanel } = require("./panel");
const { getExtentionConfig } = require("./config")


function activate(context) {
  console.log('🎧 VS Music Player activated!');

  audioPlayer.initialize(context);

  const ffplayExecutable = process.platform === "win32" ? "ffplay.exe" : "ffplay";
  const ffplayPath = require("path").join(context.extensionPath, "ffmpeg-bin", ffplayExecutable);
  let clickSoundEnabled  = getExtentionConfig().keyClickSoundEffect;
  if (clickSoundEnabled) {
    setupClickSound(context, ffplayPath);
  }
  vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('vs-music-player.keyClickSoundEffect')) {
      const newVal = getExtentionConfig().keyClickSoundEffect;
      console.log(newVal,clickSoundEnabled);
      
      if (newVal && !clickSoundEnabled) {
        setupClickSound(context, ffplayPath);
      } else if (!newVal && clickSoundEnabled) {
        teardownClickSound();
      }
      clickSoundEnabled = newVal;
    }
  });

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
