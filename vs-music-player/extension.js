const vscode = require("vscode");
const path = require("path");
const { spawn, exec } = require("child_process");

let musicProcess = null;
let playbackInterval = null;
let songDuration = 0;
let playbackProgress = 0;
let panel = null;
let isLooping = false;
let songQueue = [];
let currentSongIndex = 0;
let isAutoPlayEnabled = false;
let isPaused = false;

function activate(context) {
  console.log(
    'Congratulations, your extension "vs-music-player" is now active!'
  );

  const ffmpegExecutable =
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const ffplayExecutable =
    process.platform === "win32" ? "ffplay.exe" : "ffplay";

  const ffmpegPath = path.join(
    context.extensionPath,
    "ffmpeg-bin",
    ffmpegExecutable
  );
  const ffplayPath = path.join(
    context.extensionPath,
    "ffmpeg-bin",
    ffplayExecutable
  );

  function playAudio(url, startTime = 0) {
    stopAudio(); // Ensure cleanup before starting playback
    isPaused = false;
    exec(`"${ffmpegPath}" -i "${url}"`, (err, stdout, stderr) => {
      const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      if (durationMatch) {
        const [hours, minutes, seconds] = durationMatch.slice(1).map(Number);
        songDuration = hours * 3600 + minutes * 60 + seconds;
      } else {
        songDuration = 0;
      }
    });
    const clickSoundPath = path.join(context.extensionPath, "click.mp3");

    // Function to play the click sound
    function playClickSound() {
      exec(`"${ffplayPath}" -nodisp -autoexit "${clickSoundPath}"`, (err) => {
        if (err) {
          console.error("Error playing click sound:", err);
        }
      });
    }
    // Event listener for typing
    vscode.workspace.onDidChangeTextDocument(() => {
      playClickSound();
    });

    musicProcess = spawn(
      ffmpegPath,
      [
        "-i",
        url,
        "-ss",
        `${startTime}`,
        "-filter:a",
        "volume=0.5",
        "-f",
        "wav",
        "-",
      ],
      { stdio: ["pipe", "pipe", "pipe"] }
    );

    const ffplay = spawn(ffplayPath, ["-nodisp", "-autoexit", "-"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    musicProcess.stdout.pipe(ffplay.stdin);

    playbackProgress = startTime;
    isPaused = false;

    // *** Send the current song name to the webview ***
    panel?.webview.postMessage({
      command: "updateSongName",
      songName: songQueue[currentSongIndex].name,
    });

    playbackInterval = setInterval(() => {
      playbackProgress++;
      if (playbackProgress >= songDuration) {
        clearInterval(playbackInterval);
        playbackInterval = null;
        if (isLooping) {
          playAudio(songQueue[currentSongIndex].url);
        } else if (isAutoPlayEnabled) {
          playNextSong();
        } else {
          stopAudio();
        }
      }
      panel?.webview.postMessage({
        command: "updateProgress",
        progress: playbackProgress,
        duration: songDuration,
      });
    }, 1000);
  }

  function pauseAudio() {
    if (musicProcess) {
      musicProcess.kill();
      clearInterval(playbackInterval);
      playbackInterval = null;
      isPaused = true;
      panel?.webview.postMessage({ command: "syncState", isPaused });
      vscode.window.showInformationMessage("Music paused.");
    }
  }

  function resumeAudio() {
    if (isPaused && songQueue.length > 0) {
      const currentSong = songQueue[currentSongIndex];
      if (currentSong) {
        playAudio(currentSong.url, playbackProgress); // Resume from last progress
        isPaused = false;
      }
    }
  }

  function stopAudio() {
    if (musicProcess) {
      musicProcess.kill();
      musicProcess = null;
    }
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
    playbackProgress = 0;
    isPaused = false;
    panel?.webview.postMessage({ command: "stop" });
    vscode.window.showInformationMessage("Music stopped.");
  }

  function playNextSong() {
    if (songQueue.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % songQueue.length;
    playAudio(songQueue[currentSongIndex].url);
  }

  function playPreviousSong() {
    if (songQueue.length === 0) return;
    currentSongIndex =
      (currentSongIndex - 1 + songQueue.length) % songQueue.length;
    playAudio(songQueue[currentSongIndex].url);
  }

  function createWebviewPanel(context) {
    panel = vscode.window.createWebviewPanel(
      "musicSelector",
      "Music Player",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    const backendUrl = "https://vs-music-songs-server.onrender.com/songs";

    fetch(backendUrl)
      .then((response) => response.json())
      .then((songs) => {
        if (Array.isArray(songs)) {
          songQueue = songs;
          const songListHtml = songs
            .map(
              (song, index) => `
              <li>
                <p id="nameSong-${song.name}" class="song-list" ><button id="playButton-${index}" class="songs-button">${song.name}</button></p>
              </li>`
            )
            .join("");

          panel.webview.html = `
            <html>
              <head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                <style>
                .songs-button{
                  height:100%;
                  width:1000px;
                  border:none;
                  color:#fff;
                  background-color: #202528;
                }
                ol{
                list-style: none;
                padding: 0;
                margin: 0;
                }
                .song-list{
                height:45px;
                    padding: 10px;
                margin: 8px 0;
                background-color: #202528;
                border: 1px solid #677483;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.3s, transform 0.2s;
                }
                .song-list:hover{
                    background-color: #202528;
                transform: scale(1.01);
                }
                .scroll-container {
                  max-height: 300px;
                  /* Adjust as needed */
                  overflow-y: auto;
                  margin-bottom: 8px;
                  border-radius: 6px;
                  background-color: #181a1e;
                  padding: 8px;
                }

                .scroll-container::-webkit-scrollbar {
                  width: 8px;
                }

                .scroll-container::-webkit-scrollbar-track {
                  background: #f0f0f0;
                  border-radius: 4px;
                }

                .scroll-container::-webkit-scrollbar-thumb {
                  background: #3498db;
                  border-radius: 4px;
                }

                .scroll-container::-webkit-scrollbar-thumb:hover {
                  background: #2980b9;
                }
              .card {
                --main-color: #fff;
                --bg-color: #090909;
                --sub-main-color: #B9B9B9;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                
                height: 250px;
                background: var(--bg-color);
                border-radius: 20px;
                padding: 30px;
              }

              .card__menu {
                cursor: pointer;
              }

              .card__img {
                height: 224px;
                width: 224px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-inline: auto;
                background: #131313;
                border-radius: 100%;
              }

              .card__img svg {
                width: 154px;
                height: 154px;
                border-radius: 100%;
              }

              .card__title {
                font-weight: 500;
                font-size: 28px;
                color: var(--main-color);
                text-align: center;
                margin-bottom: 10px;
              }

              .card__subtitle {
                font-weight: 400;
                font-size: 16px;
                color: var(--sub-main-color);
                text-align: center;
                cursor: pointer;
              }

              .card__wrapper {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                margin-top: 20px;
              }

              .card__time {
                font-weight: 400;
                font-size: 12px;
                color: var(--main-color);
              }

              .card__timeline {
                width: 100%;
                height: 4px;
                display: flex;
                align-items: center;
                cursor: pointer;
              }

              .card__timeline progress {
                width: 100%;
                height: 100%;
                border-radius: 100px;
              }

              .card__timeline progress::-webkit-progress-bar {
                background-color: #424242;
                border-radius: 100px;
              }

              .card__timeline progress::-webkit-progress-value {
                background-color: #fff;
                border-radius: 100px;
              }

              .card__btn {
                border: none;
                background: transparent;
                cursor: pointer;
              }

              .card__btn path {
                fill: var(--main-color);
              }

              .card__btn-play {
                width: 60px;
                height: 60px;
                background: var(--main-color);
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
              }

              .card__btn-play path {
                fill: var(--bg-color);
              }
                
              .loop_btn.active {
                width:30px;
                height:30px;
                background-color: white;
                border-radius:50%;
              }

              .loop_btn.active svg path {
                fill: black;
              }

                </style>
              </head>
              <body>
                <h1>Music Player</h1>
                <div class="whole-container">
                <div class="scroll-container">
                <ol type="1">${songListHtml}</ol>
                </div>
                <div class="card">
                    
                    <div class="card__title" id="song-name">${songQueue[currentSongIndex].name}</div>
                    <div class="card__wrapper">
                        <div class="card__time card__time-passed" id="progress-text" >0:00</div>
                        <div class="card__timeline"><progress id="progress-bar" value="0" max="100"></progress></div>
                        <div class="card__time card__time-left"><span id="duration-text">0:00</span></div>
                    </div>
                    <div class="card__wrapper">
                        <button class="card__btn loop_btn" id="loopToggle"><svg fill="none" height="12" viewBox="0 0 20 12" width="20" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><clipPath id="a"><path d="m0 0h20v12h-20z"></path></clipPath><g><path d="m17 1c0-.265216-.1054-.51957-.2929-.707107-.1875-.187536-.4419-.292893-.7071-.292893h-8v2h7v5h-3l3.969 5 4.031-5h-3zm-14 10c0 .2652.10536.5196.29289.7071.18754.1875.44189.2929.70711.2929h8v-2h-7v-5h3l-4-5-4 5h3z" fill="#fff"></path></g></svg></button>
                        <button class="card__btn" id="prev"><svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 8V0L0 8L11.5 16V8ZM23 0L11.5 8L23 16V0Z" fill="#fff"></path></svg></button>
                        <button class="card__btn card__btn-play" id="playPause"><i class="fas fa-pause"></i></button>
                        <button class="card__btn" id="next"><svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 8V0L23 8L11.5 16V8ZM0 0L11.5 8L0 16V0Z" fill="#fff"></path></svg></button>
                        <button class="card__btn card__btn-play" id="stop"><i class="fas fa-stop"></i></button>
                    </div>
                    <div style="display:flex;"> 
                        <p><i class="fas fa-music"></i> Auto Play : </p><button id="autoPlayToggle"style="border-radius:6px;"> Enable</button>
                        <p style="height:32px;width:260px;margin-left:800px;font-size:16px;">Support me at &nbsp;&nbsp;&nbsp;
                        <a href="https://www.linkedin.com/in/medam-kowsik-975479282/">
                        <svg style="height:32px;width:32px;" fill="#fff" aria-label="LinkedIn" viewBox="0 0 512 512" id="linkedin">
                            <rect width="512" height="512" fill="#0077b5" rx="15%"></rect>
                            <circle cx="142" cy="138" r="37"></circle>
                            <path stroke="#fff" stroke-width="66" d="M244 194v198M142 194v198"></path>
                            <path d="M276 282c0-20 13-40 36-40 24 0 33 18 33 45v105h66V279c0-61-32-89-76-89-34 0-51 19-59 32"></path>
                          </svg>
                          </a>
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          <a href="https://github.com/KOWSIK-M" >
                          <svg viewBox="0 0 16 16" id="github" style="height:32px;width:32px;fill:white">
                            <path d="M7.999 0C3.582 0 0 3.596 0 8.032a8.031 8.031 0 0 0 5.472 7.621c.4.074.546-.174.546-.387 0-.191-.007-.696-.011-1.366-2.225.485-2.695-1.077-2.695-1.077-.363-.928-.888-1.175-.888-1.175-.727-.498.054-.488.054-.488.803.057 1.225.828 1.225.828.714 1.227 1.873.873 2.329.667.072-.519.279-.873.508-1.074-1.776-.203-3.644-.892-3.644-3.969 0-.877.312-1.594.824-2.156-.083-.203-.357-1.02.078-2.125 0 0 .672-.216 2.2.823a7.633 7.633 0 0 1 2.003-.27 7.65 7.65 0 0 1 2.003.271c1.527-1.039 2.198-.823 2.198-.823.436 1.106.162 1.922.08 2.125.513.562.822 1.279.822 2.156 0 3.085-1.87 3.764-3.652 3.963.287.248.543.738.543 1.487 0 1.074-.01 1.94-.01 2.203 0 .215.144.465.55.386A8.032 8.032 0 0 0 16 8.032C16 3.596 12.418 0 7.999 0z"></path>
                          </svg>
                          </a>
                        </p>
                    </div>
                </div>
            </div>
                <script>
                  const vscode = acquireVsCodeApi();
                  let autoPlayEnabled = false;
                  let songQueue = [];
                  let isLooping = false;
                  let isPlaying = false;
                  let isPaused = false;
                  let currentSongIndex = 0;

                  // Update song name locally (if needed)
                  function updateSongName(name) {
                    document.getElementById('song-name').textContent = name;
                  }

                  // Handle messages from the extension
                  window.addEventListener("message", event => {
                    const { command, progress, duration, songName, isPaused: pausedState } = event.data;
                    if (command === 'updateProgress') {
                      const progressBar = document.getElementById('progress-bar');
                      progressBar.value = (progress / duration) * 100;
                      document.getElementById('progress-text').textContent = 
                        \`\${Math.floor(progress / 60)}:\${(progress % 60).toString().padStart(2, '0')}\`;
                      document.getElementById('duration-text').textContent = 
                        \`\${Math.floor(duration / 60)}:\${Math.round(duration % 60)}\`;
                    } else if (command === 'stop') {
                      document.getElementById('progress-bar').value = 0;
                      document.getElementById('progress-text').textContent = '0:00';
                      document.getElementById('duration-text').textContent = '0:00';
                    } else if (command === "updateSongName") {
                      // *** Update the song name in the webview ***
                      updateSongName(songName);
                    }
                  });

                  // Button event listeners:
                  document.querySelectorAll('button[id^="playButton-"]').forEach(button => {
                    button.addEventListener('click', () => {
                      const songIndex = parseInt(button.id.replace('playButton-', ''), 10);
                      currentSongIndex = songIndex;
                      vscode.postMessage({ command: "play", index: songIndex });
                      isPlaying = true;
                      updatePlayPauseIcon();
                    });
                  });

                  document.getElementById('autoPlayToggle').addEventListener('click', () => {
                    autoPlayEnabled = !autoPlayEnabled;
                    vscode.postMessage({ command: "toggleAutoPlay", enabled: autoPlayEnabled });
                    document.getElementById('autoPlayToggle').textContent = 
                      autoPlayEnabled ? 'Disable' : 'Enable';
                  });

                  document.getElementById("loopToggle").addEventListener("click", function () {
                      this.classList.toggle("active");
                  });

                  document.getElementById('loopToggle').addEventListener('click', () => {
                    isLooping = !isLooping;
                    vscode.postMessage({ command: "toggleLoop", enabled: isLooping });
                    document.getElementById('loopToggle').classList.toggle('active', isLooping);
                  });

                  document.getElementById('stop').addEventListener('click', () => {
                    vscode.postMessage({ command: "stop" });
                    isPlaying = false;
                    updatePlayPauseIcon();
                  });

                  document.getElementById('prev').addEventListener('click', () => {
                    vscode.postMessage({ command: "prev" });
                  });

                  document.getElementById('next').addEventListener('click', () => {
                    vscode.postMessage({ command: "next" });
                  });

                  
                  // Update play/pause icon based on state.
                  function updatePlayPauseIcon() {
                    const playPauseIcon = document.getElementById("playPause").querySelector("i");
                    playPauseIcon.className = isPaused ? "fas fa-play" : "fas fa-pause";
                  }

                  document.getElementById('playPause').addEventListener('click', () => {
                    if (isPaused) {
                      vscode.postMessage({ command: "resume" });
                      isPaused = false;
                    } else {
                      vscode.postMessage({ command: "pause" });
                      isPaused = true;
                    }
                    updatePlayPauseIcon();
                  });

                  // Progress bar seek event.
                  const progressBar = document.getElementById('progress-bar');
                  progressBar.addEventListener('click', (event) => {
                    const rect = progressBar.getBoundingClientRect();
                    const clickX = event.clientX - rect.left;
                    const clickRatio = clickX / rect.width;
                    const seekTime = Math.floor(clickRatio * progressBar.max);
                    vscode.postMessage({ command: "seek", time: seekTime });
                  });
                </script>
              </body>
            </html>`;
        } else {
          console.error("Invalid songs data:", songs);
        }
      })
      .catch((error) => {
        console.error("Error fetching songs:", error);
      });

    panel.webview.onDidReceiveMessage((message) => {
      if (message.command === "play") {
        currentSongIndex = parseInt(message.index, 10);
        playAudio(songQueue[currentSongIndex].url);
      } else if (message.command === "pause") {
        pauseAudio();
      } else if (message.command === "resume") {
        resumeAudio();
      } else if (message.command === "stop") {
        stopAudio();
      } else if (message.command === "prev") {
        playPreviousSong();
      } else if (message.command === "next") {
        playNextSong();
      } else if (message.command === "toggleAutoPlay") {
        isAutoPlayEnabled = message.enabled;
      } else if (message.command === "toggleLoop") {
        isLooping = message.enabled;
      } else if (message.command === "seek") {
        playbackProgress = message.time;
        playAudio(songQueue[currentSongIndex].url, playbackProgress);
      }
    });
  }

  const openMusicSelector = vscode.commands.registerCommand(
    "vs-music-player.openMusicSelector",
    () => {
      createWebviewPanel(context);
    }
  );

  context.subscriptions.push(openMusicSelector);
}

function deactivate() {
  if (musicProcess) {
    musicProcess.kill();
  }
  clearInterval(playbackInterval);
}

module.exports = { activate, deactivate };
