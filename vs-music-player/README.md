# VS Code Music Player Extension

A VS Code extension that allows you to play your favorite songs directly within Visual Studio Code—no need for external music players! This extension uses **ffmpeg** and **ffplay** to extract and stream audio, providing cross-platform compatibility (Windows, macOS, Linux).

## Features

- **Play Songs Directly in VS Code**  
  Select a song from a list of songs provided by the **vs-songs-server** (fetched from a backend server) and play it without leaving VS Code.

- **Playback Controls**

  - **Play / Pause / Resume / Stop**: Easily control your music.
  - **Next / Previous**: Skip to the next or previous song.
  - **Auto-Play**: Automatically play the next song after the current one ends.
  - **Looping**: Toggle looping of the current song.

- **Click Sound Effects on Typing**  
  To enhance your coding experience, the extension plays a click sound each time you type.

  - **Toggle Click Sounds**: A button in the UI lets you enable or disable these click sounds.

- **Built with FFmpeg/FFplay**  
  The extension uses [ffmpeg](https://ffmpeg.org/) for audio processing and [ffplay](https://ffmpeg.org/ffplay.html) for playback. It selects the appropriate executable based on your operating system (e.g., `ffmpeg.exe` for Windows and `ffmpeg` for other platforms).

- **Responsive Webview UI**  
  The extension opens a dedicated webview panel that features a modern UI with a song list, playback controls, and toggle buttons.

  **_Please co-operate with the performance issues since this is a complete free version_**

-- **The songs get updated frequently and new songs are added regularly**
**_Any song suggestions can be given at [here](https://www.linkedin.com/posts/medam-kowsik-975479282_vscode-musicplayer-codingmusic-activity-7295497230860369921-802b?utm_source=share&utm_medium=member_desktop&rcm=ACoAAETEySkB47xfrFfYzMWVLNuNJCQSbve1COA), either about theme of songs, or artists to be included, anything or you can ping me directly at my dm in [Linkedin](https://www.linkedin.com/in/medam-kowsik-975479282/) _**

## How It Works

1. **Audio Playback via FFmpeg**

   - When you start playing a song, the extension uses `ffmpeg` to process the audio file.
   - The processed audio is piped to `ffplay` to play the sound.

2. **State Synchronization**

   - The extension maintains playback state (e.g., current song, progress, pause/resume state) in the backend.
   - The webview uses VS Code’s messaging API (`panel.webview.postMessage` and `onDidReceiveMessage`) to synchronize playback progress, song name, and other controls in real time.

3. **Fetching Songs**

   - Song data is fetched from a remote backend (e.g., `https://vs-music-songs-server.onrender.com/songs`).
   - The list of songs is displayed in the webview, and you can select a song to start playback.

4. **Click Sound Effects**
   - The extension listens for text document changes (using `vscode.workspace.onDidChangeTextDocument`) and plays a click sound (using `ffplay`) whenever you type.
   - A toggle button in the webview lets you enable or disable these click sounds.

## Requirements

- **VS Code**  
  This extension is built for Visual Studio Code and uses its extension API.

- **FFmpeg Binaries**  
  The extension comes with a folder (`ffmpeg-bin`) that contains the appropriate FFmpeg and FFplay executables for your operating system:

  - `ffmpeg.exe` and `ffplay.exe` on Windows
  - `ffmpeg` and `ffplay` on macOS/Linux

- **Internet Connection**  
  For fetching the song list from the remote server.

## Usage

1. **Open Command Palette**:

   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS).

2. **Run the Command**:

   - Type and select: `Music Player: Open Music Player`.

3. **Choose a Song**:

   - Select a track from the list and press **Enter** to start playing.

4. **Use Playback Controls**:
   - Play/Pause/Skip using the UI or keyboard shortcuts.

## **Preview**

![VS Music Player Preview](/vs-music-player/preview.png)

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/KOWSIK-M/vscode-music-player.git
   cd vscode-music-player
   ```

## **Connect**

🌐 Git : [Git Repo Link] (https://github.com/KOWSIK-M/VS-Code-Music-Player)
💌 Email: [Gmail](2200030358cseh@gmail.com)
📱 Follow me on [LinkedIn](https://www.linkedin.com/in/medam-kowsik-975479282/) for updates!

---

## **License**

MIT License. Free to use and modify. 😊
