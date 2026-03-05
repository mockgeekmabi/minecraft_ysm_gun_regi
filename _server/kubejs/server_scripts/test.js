ItemEvents.rightClicked((event) => {
  if (event.item.id == "minecraft:white_bed") {
    const player = event.player;

    // ここでは inspectRespawnInfo を呼ぶだけ
    inspectRespawnInfo(player);
  }
  if (event.item.id == "minecraft:red_bed") {
    event.server.runCommand(
      `execute as @p at @p run summon binah:binah_v_2 20 70 20 {PersistenceRequired:1b}`,
    );
  }
});
