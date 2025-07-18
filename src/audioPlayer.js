const { spawn, execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");
const state = require("./state");

let ffmpegPath, ffplayPath, ffprobePath;

function initialize(context) {
  const isWin = process.platform === "win32";
  const binDir = path.join(context.extensionPath, "ffmpeg-bin");

  ffmpegPath = path.join(binDir, isWin ? "ffmpeg.exe" : "ffmpeg");
  ffplayPath = path.join(binDir, isWin ? "ffplay.exe" : "ffplay");
  ffprobePath = path.join(binDir, isWin ? "ffprobe.exe" : "ffprobe");

  console.log("ffmpegPath:", ffmpegPath);
  console.log("ffplayPath:", ffplayPath);
  console.log("ffprobePath:", ffprobePath);

  [ffmpegPath, ffplayPath, ffprobePath].forEach(bin => {
    if (!fs.existsSync(bin)) {
      vscode.window.showErrorMessage(`Required binary not found: ${bin}`);
    }
  });
}

function getAudioDuration(url, callback) {
  execFile(ffprobePath, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    url
  ], (err, stdout, stderr) => {
    if (err) {
      console.error("ffprobe error:", err, stderr);
      return callback(0);
    }
    const duration = parseFloat(stdout.trim());
    callback(isNaN(duration) ? 0 : Math.floor(duration));
  });
}

function playAudio(context, url, startTime = 0) {
  stopAudio(); // Stop any current audio before playing new one
  state.isPaused = false;

  state.panel?.webview.postMessage({
    command: "updateSongName",
    songName: state.songQueue[state.currentSongIndex]?.name,
  });

  getAudioDuration(url, (duration) => {
    if (!duration) console.error("Unable to determine duration.");
    state.songDuration = duration;
  });

  try {
    state.musicProcess = spawn(ffmpegPath, [
      "-ss", `${startTime}`,
      "-i", url,
      "-filter:a", "volume=0.5",
      "-f", "wav", "-"
    ], { shell: true });

    if (state.ffplayProcess) {
      state.ffplayProcess.kill();
    }

    state.ffplayProcess = spawn(ffplayPath, ["-nodisp", "-autoexit", "-"], { shell: true });
    state.musicProcess.stdout.pipe(state.ffplayProcess.stdin);

    state.playbackProgress = startTime;

    state.playbackInterval = setInterval(() => {
      state.playbackProgress++;

      if (state.playbackProgress >= state.songDuration) {
        clearInterval(state.playbackInterval);
        state.playbackInterval = null;

        if (state.isLooping) {
          playAudio(context, state.songQueue[state.currentSongIndex].url);
        } else if (state.isAutoPlayEnabled) {
          playNextSong(context);
        } else {
          stopAudio();
        }
      }

      state.panel?.webview.postMessage({
        command: "updateProgress",
        progress: state.playbackProgress,
        duration: state.songDuration,
      });
    }, 1000);
  } catch (err) {
    console.error("FFmpeg playback error:", err);
  }
}

function pauseAudio() {
  if (state.musicProcess) {
    state.musicProcess.kill();
    state.musicProcess = null;
  }
  if (state.ffplayProcess) {
    state.ffplayProcess.kill();
    state.ffplayProcess = null;
  }
  clearInterval(state.playbackInterval);
  state.playbackInterval = null;
  state.isPaused = true;
  state.panel?.webview.postMessage({ command: "syncState", isPaused: true });
}

function resumeAudio(context) {
  if (state.isPaused && state.songQueue.length > 0) {
    const current = state.songQueue[state.currentSongIndex];
    playAudio(context, current.url, state.playbackProgress);
    state.isPaused = false;
  }
}

function stopAudio() {
  if (state.musicProcess) {
    state.musicProcess.kill();
    state.musicProcess = null;
  }
  if (state.ffplayProcess) {
    state.ffplayProcess.kill();
    state.ffplayProcess = null;
  }
  clearInterval(state.playbackInterval);
  state.playbackInterval = null;
  state.playbackProgress = 0;
  state.isPaused = false;
  state.panel?.webview.postMessage({ command: "stop" });
}

function playNextSong(context) {
  if (!state.songQueue.length) return;
  state.currentSongIndex = (state.currentSongIndex + 1) % state.songQueue.length;
  playAudio(context, state.songQueue[state.currentSongIndex].url);
}

function playPreviousSong(context) {
  if (!state.songQueue.length) return;
  state.currentSongIndex = (state.currentSongIndex - 1 + state.songQueue.length) % state.songQueue.length;
  playAudio(context, state.songQueue[state.currentSongIndex].url);
}

module.exports = {
  initialize,
  playAudio,
  pauseAudio,
  resumeAudio,
  stopAudio,
  playNextSong,
  playPreviousSong,
};
