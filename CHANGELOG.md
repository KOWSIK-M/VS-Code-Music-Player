# Change Log

All notable changes to the "vs-music-player" extension will be documented in this file.

---
## [Unreleased]

### Added
- Comprehensive unit tests have been implemented using Vitest to ensure the reliability and correctness of key modules and functionalities.

### Improved
- Added JSDoc docstrings to all test files (`test/*.js`) for enhanced readability and maintainability of the test suite.

 ---
## [Version 0.2.1] - 2025-07-12

### Added
- **Click Sound Toggle Setting**:
  - Added a new user setting `vs-music-player.keyClickSoundEffect` to control the click sound effect during text editing.
  - Default value: `true`
  - Description: "Enables or disables the click-sound effect when interacting with the music player."
  - Users can modify this in their **Settings UI** or `settings.json`.

---

> 💡 This setting helps users mute or enable feedback sound without needing to reload the extension.

## [Version 0.1.8] - 2025-07-01

### Added

* **Click Sound Feature**:

  * Added a **click sound effect** (`click.mp3`) that plays whenever you type in the editor. The sound can be toggled on/off.
  * The click sound file is stored in the `media/` directory, ensuring flexibility in customizing sound assets.
* **FFprobe Integration**:

  * Integrated `ffprobe` to accurately determine the duration of the audio before playback.
* **Playback Controls**:

  * Added song seeking through progress bar clicks.
  * Loop, Next, Previous, Play/Pause, and Stop buttons in the UI are now fully interactive.
* **Song Switching from List**:

  * Clicking on a song in the list now correctly plays the selected track and updates UI state.

### Changed

* **Modularized `click.mp3` Sound Handling**:

  * Moved the logic for playing the click sound into its own module (`clickSound.js`), making the extension more flexible and maintainable.
  * The `clickSound.js` module now uses the `path` to dynamically resolve the `click.mp3` file within the extension's directory.
* **Consolidated Webview Script**:

  * Kept the webview `<script>` inline for simplicity and debugging ease.

### Fixed

* **Audio Playback Flow**:

  * Improved the audio playback management, ensuring that playback transitions smoothly between songs.
  * Added logic to pause, resume, and stop music more efficiently while updating the UI accordingly.
* **Overlapping Audio**:

  * Fixed overlapping audio issue by ensuring existing audio processes are killed before starting a new one.
* **Incorrect Duration Handling**:

  * Replaced unreliable FFmpeg stderr parsing with `ffprobe` for duration extraction.
* **Broken Play/Pause Toggle**:

  * Fixed UI state sync for the play/pause button using `syncState` command.

### Updated

* **Webview UI**:

  * Updated the webview interface to handle new song data dynamically from the backend server.
  * Enhanced progress bar to reflect real-time playback.
  * Improved state toggles (loop, autoplay) and their visual feedback.

### Miscellaneous

* **Refactored Code**:

  * Modularized and organized the project to separate concerns (e.g., separate modules for audio management, webview setup, and click sound handling).
  * Removed redundant logic and improved overall extension structure.
  * Added comprehensive `console.error` logs to trace runtime issues more effectively.
---
## [0.1.7] - 2025-02-12

### 🎉 Initial Release

- 🎵 Play music directly in VS Code using FFmpeg and FFplay.
- 🔊 Typing click sound effects with toggle support.
- 🎛️ Webview UI with modern controls:
  - Play / Pause / Resume / Stop
  - Next / Previous
  - Auto-Play and Looping
- 🔁 Auto-updating playlist from remote server.
- 💻 Cross-platform support: Windows, macOS, and Linux.
- 🌐 Integration with external song server (`vs-songs-server`).
- 🛠️ Bundled platform-specific `ffmpeg` and `ffplay` binaries.
- 📨 LinkedIn support for song suggestions and feedback.

---
