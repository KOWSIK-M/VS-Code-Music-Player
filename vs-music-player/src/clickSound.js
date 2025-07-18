const { exec } = require("child_process");
const path = require("path");
const vscode = require("vscode");

let textChangeListener; 

function setupClickSound(context, ffplayPath) {
  const clickSoundPath = path.join(context.extensionPath, "media", "click.wav");

  function playClick() {
    exec(`"${ffplayPath}" -nodisp -autoexit "${clickSoundPath}"`, (err) => {
      if (err) console.error("Click sound error:", err);
    });
  }


  if (textChangeListener) {
    textChangeListener.dispose();
  }

  textChangeListener = vscode.workspace.onDidChangeTextDocument(() => {
    playClick();
  });

  context.subscriptions.push(textChangeListener);
}

function teardownClickSound() {
  if (textChangeListener) {
    textChangeListener.dispose();
    textChangeListener = null;
  }
}

module.exports = {
  setupClickSound,
  teardownClickSound,
};
