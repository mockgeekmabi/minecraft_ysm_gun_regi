ItemEvents.rightClicked((event) => {
  if (event.item.id !== "minecraft:white_bed") return;

  const player = event.player;

  // ここでは inspectRespawnInfo を呼ぶだけ
  inspectRespawnInfo(player);
});
