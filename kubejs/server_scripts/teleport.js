// ====== テレポート情報構造体 ======
const teleinfos = [
  { itemid: "binah:binah_egg", dim: "mypack:endless_desert_1", pos: { x: -125, y: 66, z: 0 } },
  { itemid: "binah:goliath_vehicle_kit", dim: "mypack:endless_tundra_1", pos: { x: -125, y: 52, z: 0 } },
  { itemid: "pomkotsmechs:quest_sheet_01", dim: "mypack:_quest01", pos: { x: 0, y: 66, z: 0 } },
  { itemid: "pomkotsmechs:quest_sheet_02", dim: "mypack:_quest02", pos: { x: 0, y: 66, z: 0 } },
  { itemid: "pomkotsmechs:quest_sheet_03", dim: "mypack:_quest03", pos: { x: 0, y: 66, z: 0 } },
  { itemid: "pomkotsmechs:quest_sheet_04", dim: "mypack:_quest04", pos: { x: 0, y: 66, z: 0 } },
  { itemid: "pomkotsmechs:quest_sheet_11", dim: "mypack:_quest11", pos: {} },
];
const TELEPORT_ITEM = "binah:binah_egg"; // 対象アイテム
const TELEPORT_DIM = "mypack:endlessdesert"; // 対象ディメンション

ItemEvents.rightClicked((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(`[${nowtick}][rightClicked] ${event.player.username} ${event.item.id} ${event.player.level.dimension}`);

  // --- 右クリックされたアイテムがテレポート対象の場合処理 ---
  for (let teleinfo of teleinfos) {
    if (event.item.id == teleinfo.itemid) {
      const player = event.player;
      const dim = String(player.level.dimension);

      // endlessdesert 以外 → endlessdesert へ転移
      if (dim !== teleinfo.dim) {
        let level = event.server.getLevel(teleinfo.dim);

        // teleinfo.posが空の場合、ランダムで転移座標を決める
        debug(`[${nowtick}][rightClicked] ${Object.keys(teleinfo.pos).length}`);
        if (Object.keys(teleinfo.pos).length === 0) {
          //teleinfo.pos = { x: 0, y: 64, z: 0 };
          teleinfo.pos = { x: getRundomNum(0, 10000, true), y: 70, z: getRundomNum(0, 10000, true) };
        }

        // 
        let block = getScaffoldingBlock(teleinfo.pos.x, teleinfo.pos.y, teleinfo.pos.z, level, nowtick);
        debug(`[${nowtick}][rightClicked] ${event.player.username} tp ${teleinfo.dim} ${block.x} ${block.y} ${block.z}`);
        player.server.runCommandSilent(`execute in ${teleinfo.dim} run tp ${player.uuid} ${block.x} ${block.y} ${block.z}`);
        return;
      }

      // endlessdesert → リスポーン地点 へ転移
      const info = inspectRespawnInfo(player);
      debug(`[${nowtick}][rightClicked] ${event.player.username} tp ${info.spawnDim} ${info.spawnPos.getX()} ${info.spawnPos.getY()} ${info.spawnPos.getZ()}`);
      player.server.runCommandSilent(`execute in ${info.spawnDim} run tp ${player.uuid} ${info.spawnPos.getX()} ${info.spawnPos.getY()} ${info.spawnPos.getZ()}`);
    }
  }
});
