import { exec } from "child_process";
import path from "path";
import * as vscode from "vscode";

let textChangeListener; 

export function setupClickSound(context, ffplayPath) {
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

export function teardownClickSound() {
  if (textChangeListener) {
    textChangeListener.dispose();
    textChangeListener = null;
  }
}