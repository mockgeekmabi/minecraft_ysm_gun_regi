// === 設定 ===
const TARGET_MOB = "binah:binah_v_2"; // 対象モブID
const TARGET_DIM = "mypack:endlessdesert"; // 対象ディメンション
let lastDeathTick = -999999; // 最後に死亡したtickを記録
const COOLDOWN_TICKS = 1 * 60 * 20; // 15分 = 18000tick

// === スポーン設定
ServerEvents.tick((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(`[tick] at tick ${nowtick} server:${event.server} level:"${event.level}`);

  if (nowtick % (1 * 60 * 20) !== 0) return;

  const level = event.server.getLevel(TARGET_DIM);
  const player = level.players[0];
  if (!player) return;

  const pos = {
    x: 20,
    y: 70,
    z: 20,
  };

  event.server.runCommand(`summon ${TARGET_MOB} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`);
  debug(`[tick] spawn ${TARGET_MOB} ${TARGET_DIM} ${nowtick}`);
});

// === 死亡イベント
EntityEvents.death((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(`[entityDeath] at tick ${nowtick}`);

  const e = event.entity;
  if (e.type != TARGET_MOB) return;
  if (e.level.dimension != TARGET_DIM) return;

  debug(`[entityDeath] ${TARGET_MOB} died at ${nowtick} tick, the previous death was at ${lastDeathTick}`);
  lastDeathTick = nowtick;
});

// === スポーンイベント
EntityEvents.spawned((event) => {
  debug(`[entitySpawned] at tick ${event.server.gameTime}`);

  const e = event.entity;
  if (e.type != TARGET_MOB) return;
  if (e.level.dimension != TARGET_DIM) return;

  const now = event.server.gameTime;

  // --- 座標条件: Y >= 64 ---
  if (e.y < 64) {
    debug(`[entitySpawned] discard y=${e.y}`);
    e.discard();
    return;
  }

  // --- ディメンションに1体のみ ---
  const existing = level.getEntities().filter((ent) => ent.type == TARGET_MOB);

  if (existing.length > 1) {
    debug(`[entitySpawned] discard existing.length=${existing.length}`);
    e.discard();
    return;
  }

  // --- 死亡後15分経過チェック ---
  const elapsed = now - lastDeathTick;
  if (elapsed < COOLDOWN_TICKS) {
    debug(`[entitySpawned] discard now=${now} lastDeathTick=${lastDeathTick}`);
    e.discard();
    return;
  }
});
