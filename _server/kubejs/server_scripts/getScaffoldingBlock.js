// 指定座標から一番近い足場ブロックを探す
function getScaffoldingBlock(inputX, inputY, inputZ, level, nowtick) {
  debug(`[${nowtick}][getScaffoldingBlock] start`);

  let scaX = inputX;
  let scaY = inputY;
  let scaZ = inputZ;

  // --- Y座標のブロックを確認 ---
  let eastX = scaX + 1;
  let bottomY = scaY - 1;
  let topY = scaY + 1;

  let scaBlock = level.getBlock(scaX, scaY, scaZ);
  debug(
    `[${nowtick}][getScaffoldingBlock] info ${scaX}, ${scaY}, ${scaZ} is ${scaBlock.id}`,
  );
  if (scaBlock.id === "minecraft:air") {
    // 空気ブロックの場合、１つ下が空気以外であることを確認
    let bottomBlock = level.getBlock(scaX, bottomY, scaZ);
    while (bottomBlock.id === "minecraft:air") {
      scaY = scaY - 1;
      bottomY = bottomY - 1;
      bottomBlock = level.getBlock(scaX, bottomY, scaZ);
      debug(
        `[${nowtick}][getScaffoldingBlock] info ${scaX}, ${bottomY}, ${scaZ} is air`,
      );
    }
  } else {
    // 空気以外の場合、１つ上が空気ブロックであることを確認
    let topBlock = level.getBlock(scaX, topY, scaZ);
    while (topBlock.id !== "minecraft:air") {
      scaY = scaY + 1;
      topY = topY + 1;
      topBlock = level.getBlock(scaX, topY, scaZ);
      debug(
        `[${nowtick}][getScaffoldingBlock] info ${scaX}, ${topY}, ${scaZ} is not air`,
      );
    }
  }
  scaY = scaY - 1;
  eastX = scaX + 1;
  bottomY = scaY - 1;
  topY = scaY + 1;
  scaBlock = level.getBlock(scaX, scaY, scaZ);
  debug(
    `[${nowtick}][getScaffoldingBlock] info ${scaX}, ${scaY}, ${scaZ} is ${scaBlock.id}`,
  );
  if (scaBlock.id === "minecraft:water") {
    // 水ブロックの場合、１つ北が水以外であることを確認
    let eastBlock = level.getBlock(eastX, scaY, scaZ);
    while (eastBlock.id === "minecraft:water") {
      scaX = scaX + 1;
      eastX = eastX + 1;
      eastBlock = level.getBlock(eastX, scaY, scaZ);
      debug(
        `[${nowtick}][getScaffoldingBlock] info ${eastX}, ${scaY}, ${scaZ} is water`,
      );
    }
  }
  scaX = scaX + 1;
  eastX = scaX + 1;
  bottomY = scaY - 1;
  topY = scaY + 1;
  scaBlock = level.getBlock(scaX, scaY, scaZ);
  debug(
    `[${nowtick}][getScaffoldingBlock] info ${scaX}, ${scaY}, ${scaZ} is ${scaBlock.id}`,
  );
  if (scaBlock.id === "minecraft:air") {
    // 空気ブロックの場合、１つ下が空気以外であることを確認
    let bottomBlock = level.getBlock(scaX, bottomY, scaZ);
    while (bottomBlock.id === "minecraft:air") {
      scaY = scaY - 1;
      bottomY = bottomY - 1;
      bottomBlock = level.getBlock(scaX, bottomY, scaZ);
      debug(
        `[${nowtick}][getScaffoldingBlock] info ${scaX}, ${bottomY}, ${scaZ} is air2`,
      );
    }
  } else {
    // 空気以外の場合、１つ上が空気ブロックであることを確認
    let topBlock = level.getBlock(scaX, topY, scaZ);
    while (topBlock.id !== "minecraft:air") {
      scaY = scaY + 1;
      topY = topY + 1;
      topBlock = level.getBlock(scaX, topY, scaZ);
      debug(
        `[${nowtick}][getScaffoldingBlock] info ${scaX}, ${topY}, ${scaZ} is not air2`,
      );
    }
  }
  scaX = scaX;
  scaY = scaY + 1;
  debug(
    `[${nowtick}][getScaffoldingBlock] info ${scaX}, ${scaY}, ${scaZ} is ${scaBlock.id}`,
  );

  let resultBlock = { x: scaX, y: scaY, z: scaZ };
  return resultBlock;
}
