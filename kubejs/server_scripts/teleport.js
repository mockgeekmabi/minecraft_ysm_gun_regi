// === 設定 ===
const TELEPORT_ITEM = "binah:binah_egg"; // 対象アイテム
const TELEPORT_DIM = "mypack:endlessdesert"; // 対象ディメンション

ItemEvents.rightClicked((event) => {
  debug(
    `[rightClicked] ${event.player.username} ${event.item.id} ${event.player.level.dimension}`,
  );
  if (event.item.id == TELEPORT_ITEM) {
    const player = event.player;
    const dim = String(player.level.dimension);

    // endlessdesert 以外 → endlessdesert へ転移
    if (dim !== TELEPORT_DIM) {
      player.server.runCommandSilent(
        `execute in ${TELEPORT_DIM} run tp ${player.uuid} 0 70 0`,
      );
      return;
    }

    // endlessdesert → リスポーン地点 へ転移
    const info = inspectRespawnInfo(player);
    player.server.runCommandSilent(
      `execute in ${info.spawnDim} run tp ${player.uuid} ${info.spawnPos.getX()} ${info.spawnPos.getY()} ${info.spawnPos.getZ()}`,
    );
  }
});
