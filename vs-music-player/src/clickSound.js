const { exec } = require("child_process");
const path = require("path");

function setupClickSound(context, ffplayPath) {
  const clickSoundPath = path.join(context.extensionPath,"media", "click.wav");

  function playClick() {
    exec(`"${ffplayPath}" -nodisp -autoexit "${clickSoundPath}"`, (err) => {
      if (err) console.error("Click sound error:", err);
    });
  }

  require("vscode").workspace.onDidChangeTextDocument(() => {
    playClick();
  });
}

module.exports = { setupClickSound };
