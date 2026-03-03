// ====== テレポート情報構造体 ======
const teleinfos = [
  {
    itemid: "binah:binah_egg",
    dim: "mypack:fix_desert_1",
    pos: { x: 0, y: 66, z: 0 }
  },
  {
    itemid: "binah:goliath_vehicle_kit",
    dim: "mypack:endlesstundra",
    pos: { x: 0, y: 66, z: 0 }
  },
  {
    itemid: "pomkotsmechs:quest_sheet_01",
    dim: "mypack:endless_copper",
    pos: { x: 0, y: 66, z: 0 }
  },
];
const TELEPORT_ITEM = "binah:binah_egg"; // 対象アイテム
const TELEPORT_DIM = "mypack:endlessdesert"; // 対象ディメンション

ItemEvents.rightClicked((event) => {
  debug(
    `[rightClicked] ${event.player.username} ${event.item.id} ${event.player.level.dimension}`,
  );

  // --- 右クリックされたアイテムがテレポート対象の場合処理 ---
  for (let teleinfo of teleinfos) {
    if (event.item.id == teleinfo.itemid) {
      const player = event.player;
      const dim = String(player.level.dimension);

      // endlessdesert 以外 → endlessdesert へ転移
      if (dim !== teleinfo.dim) {
        player.server.runCommandSilent(
          `execute in ${teleinfo.dim} run tp ${player.uuid} ${teleinfo.pos.x} ${teleinfo.pos.y} ${teleinfo.pos.z}`,
        );
        return;
      }

      // endlessdesert → リスポーン地点 へ転移
      const info = inspectRespawnInfo(player);
      player.server.runCommandSilent(
        `execute in ${info.spawnDim} run tp ${player.uuid} ${info.spawnPos.getX()} ${info.spawnPos.getY()} ${info.spawnPos.getZ()}`,
      );
    }
  }
});
