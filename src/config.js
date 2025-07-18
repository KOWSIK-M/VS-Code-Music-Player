import * as vscode from "vscode";

export function getExtentionConfig(){
    const config = vscode.workspace.getConfiguration("vs-music-player");
    
    return{
        keyClickSoundEffect:config.get("keyClickSoundEffect",true),

    }
}
