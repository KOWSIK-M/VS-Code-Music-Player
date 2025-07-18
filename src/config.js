const vscode =require("vscode");

function getExtentionConfig(){
    const config = vscode.workspace.getConfiguration("vs-music-player");
    
    return{
        keyClickSoundEffect:config.get("keyClickSoundEffect",true),

    }
}

module.exports = {getExtentionConfig}