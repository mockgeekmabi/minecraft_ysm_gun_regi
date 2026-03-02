// === 設定 ===
let lastDeathTick = -999999; // 最後に死亡したtickを記録
const COOLDOWN_TICKS = 1 * 60 * 20; // 15分 = 18000tick

// === モブ情報構造体（指定された3つのみ） ===
const bossinfos = [
  {
    mob: "binah:binah_v_2",
    dim: "mypack:endlessdesert",
    lastDeathTick: -999999,
  },

  // 必要ならここに追加
  // {
  //   mob: "example:mob",
  //   dim: "example:dimension",
  //   lastDeathTick: -999999
  // }
];

// ボス召喚
function spawnBoss(event) {
  // === bossinfos をループ ===
  for (const bossinfo of bossinfos) {
    const level = event.server.getLevel(bossinfo.dim);

    // --- ディメンションのロードチェック ---
    if (level == null) {
      debug(`[spawnBoss] discard level == null`);
      continue;
    }

    // --- ディメンションに1体のみ ---
    const existing = level
      .getEntities()
      .filter((ent) => ent.type == bossinfo.mob);
    if (existing.length > 1) {
      debug(`[spawnBoss] discard existing.length=${existing.length}`);
      continue;
    }

    // --- 死亡後15分経過チェック ---
    const elapsed = now - lastDeathTick;
    if (elapsed < COOLDOWN_TICKS) {
      debug(`[spawnBoss] discard elapsed=${elapsed}`);
      continue;
    }

    // --- 召喚コマンド実行 ---
    const pos = { x: 20, y: 70, z: 20 };
    event.server.runCommand(
      `summon ${bossinfo.mob} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`,
    );
    debug(`[tick] spawn ${bossinfo.mob} ${bossinfo.dim} ${nowtick}`);
  }
}
// ボス召喚
function spawnMob(event) {}

// === スポーン設定
ServerEvents.tick((event) => {
  // --- 1分に1回処理を行う ---
  if (nowtick % (1 * 60 * 20) !== 0) return;

  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(
    `[tick] at tick ${nowtick} server:${event.server} level:"${event.level}`,
  );
  
  spawnBoss(event);
  spawnMob(event);
});

// === 死亡イベント
EntityEvents.death((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(`[death] at tick ${nowtick}`);

  const e = event.entity;

  // === bossinfos をループ ===
  for (const bossinfo of bossinfos) {
    if (e.type !== bossinfo.mob) continue;
    if (e.level.dimension !== bossinfo.dim) continue;

    debug(
      `[death] ${bossinfo.mob} died at ${nowtick} tick, the previous death was at ${bossinfo.lastDeathTick}`,
    );

    bossinfo.lastDeathTick = nowtick;
  }
});
