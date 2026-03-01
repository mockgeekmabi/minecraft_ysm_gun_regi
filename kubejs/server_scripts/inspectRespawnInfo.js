// プレイヤーの「記録上の」リスポーン情報を調べる
function inspectRespawnInfo(player) {
  const respawnPos = player.getRespawnPosition(); // BlockPos or null
  const respawnDim = player.getRespawnDimension(); // ResourceKey<Level>

  // 最初にワールドスポーンを戻り値として設定
  const sharedSpawnPos = player.server.overworld().getSharedSpawnPos();

  // A: 一度もスポーン地点を設定していない
  if (respawnPos == null) {
    debug(`[inspectRespawnInfo] ${player.username}: No respawn point set. Using world spawn.`);
    return { kind: "none", spawnPos: sharedSpawnPos, spawnDim: "minecraft:overworld" };
  }

  const server = player.server;

  const bx = respawnPos.getX();
  const by = respawnPos.getY();
  const bz = respawnPos.getZ();

  const block = server.getLevel(respawnDim.location()).getBlock(bx, by, bz);

  // C: ベッド系ブロックが存在する（簡易判定）
  if (block.hasTag("minecraft:beds")) {
    debug(
      `[inspectRespawnInfo] ${player.username}: Valid bed respawn -> ${bx}, ${by}, ${bz} in ${String(respawnDim.location())}`
    );
    return {
      kind: "bed",
      spawnPos: respawnPos,
      spawnDim: String(respawnDim.location()),
      block: block.id,
    };
  }

  // リスポーンアンカー
  if (block.id === "minecraft:respawn_anchor") {
    debug(
      `[inspectRespawnInfo] ${player.username}: Respawn anchor -> ${bx}, ${by}, ${bz} in ${String(respawnDim.location())}`
    );
    return {
      kind: "anchor",
      spawnPos: respawnPos,
      spawnDim: String(respawnDim.location()),
      block: block.id,
    };
  }

  // B: 記録上は座標があるが、そこにベッド/アンカーは存在しない
  debug(
    `[inspectRespawnInfo] ${player.username}: Respawn position recorded but no bed/anchor exists -> ${bx}, ${by}, ${bz} (${block.id})`
  );
  return {
    kind: "orphan",
    spawnPos: sharedSpawnPos,
    spawnDim: "minecraft:overworld",
    block: block.id,
  };
}
