// グローバル変数
let debugMode = true;

// debug関数
function debug(message) {
    // debugMode が true のときのみ出力
    if (debugMode === true) {
        console.log(message);
    }
}
