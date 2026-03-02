// === 設定 ===
let lastDeathTick = -999999; // 最後に死亡したtickを記録
const COOLDOWN_TICKS = 1 * 60 * 20; // 15分 = 18000tick

// === ボス情報構造体 ===
const bossinfos = [
  {
    bossid: "binah:binah_v_2",
    dim: "mypack:fix_desert_1",
    lastDeathTick: -999999,
    mobinfos: [
      {
        mobid: "binah:white_cube",
        count: 4,
      },
      {
        mobid: "binah:black_cube",
        count: 4,
      },
      {
        mobid: "binah:yallow_cube",
        count: 4,
      },
      {
        mobid: "inah:droid",
        count: 2,
      },
      {
        mobid: "binah:drone_missile",
        count: 2,
      },
      {
        mobid: "binah:goliath",
        count: 1,
      },
    ],
  },

  // 必要ならここに追加
  // {
  //   bossid: "example:mob",
  //   dim: "example:dimension",
  //   lastDeathTick: -999999,
  //   mobinfos: [
  //    {
  //      mobid: "example:mob",
  //      count: 4,
  //    }
  // }
];

// ボス召喚
function spawnBoss(event, nowtick) {
  debug(`[spawnBoss] at tick ${nowtick}`);

  // === bossinfos をループ ===
  for (let bossinfo of bossinfos) {
    debug(`[spawnBoss] boss:${bossinfo.bossid}`);

    let level = event.server.getLevel(bossinfo.dim);

    // --- ディメンションのロードチェック ---
    if (level == null) {
      debug(`[spawnBoss] discard level == null`);
      continue;
    }

    // --- ディメンション内のユーザ数チェック ---
    let playersInDim = event.server.players.filter((p) => {
      let dimId = String(p.level.dimension); 
      return dimId === bossinfo.dim;
    });
    debug(
      `[spawnBoss] dim:${bossinfo.dim} playersInDim.length:${playersInDim.length}`,
    );
    if (playersInDim.length == 0) {
      continue;
    }

    // --- ディメンションに1体のみ ---
    let existing = level
      .getEntities()
      .filter((ent) => ent.type == bossinfo.bossid);
    if (existing.length > 0) {
      debug(`[spawnBoss] discard existing.length=${existing.length}`);
      continue;
    }

    // --- 死亡後15分経過チェック ---
    let elapsed = nowtick - lastDeathTick;
    if (elapsed < COOLDOWN_TICKS) {
      debug(`[spawnBoss] discard elapsed=${elapsed}`);
      continue;
    }

    // --- 召喚コマンド実行 ---
    let pos = { x: 20, y: 70, z: 20 };
    event.server.runCommand(
      `execute as @p at @p run summon ${bossinfo.bossid} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`,
      //`summon ${bossinfo.bossid} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`,
    );
    debug(`[spawnBoss] spawn ${bossinfo.bossid} ${bossinfo.dim} ${nowtick}`);
  }
}

// === スポーン設定
ServerEvents.tick((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;

  // --- 10秒に1回ログ ---
  if (nowtick % (10 * 20) !== 0) {
    return;
  } else {
    debug(
      `[tick] at tick ${nowtick} server:${event.server} level:"${event.level}`,
    );
  }

  // --- 1分に1回処理を行う ---
  if (nowtick % (1 * 60 * 20) !== 0) {
    return;
  } else {
    spawnBoss(event, nowtick);
  }
});

// === 死亡イベント
EntityEvents.death((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(`[death] at tick ${nowtick}`);

  const e = event.entity;

  // --- bossinfos をループ ---
  for (let bossinfo of bossinfos) {
    if (e.type !== bossinfo.bossid) continue;
    if (e.level.dimension !== bossinfo.dim) continue;

    debug(
      `[death] ${bossinfo.bossid} died at ${nowtick} tick, the previous death was at ${bossinfo.lastDeathTick}`,
    );

    bossinfo.lastDeathTick = nowtick;
  }
});

// === スポーン数制御
EntityEvents.checkSpawn((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(`[checkSpawn] at tick ${nowtick}`);

  // --- bossinfos をループ ---
  for (let bossinfo of bossinfos) {
    let biome = event.level.getBiome(event.pos).id;
    let level = event.server.getLevel(bossinfo.dim);

    // --- イベント発生バイオームチェック ---
    if (biome !== bossinfo.dim) {
      debug(
        `[checkSpawn] discard boss:${bossinfo.bossid} biome:${bossinfo.dim} ev_biome:${biome}`,
      );
      continue;
    }

    // --- ディメンションのロードチェック ---
    if (level == null) {
      debug(`[checkSpawn] discard level == null`);
      continue;
    }

    // --- ボスの生存チェック ---
    let existing = level
      .getEntities()
      .filter((ent) => ent.type == bossinfo.bossid);
    if (existing.length == 0) {
      debug(`[checkSpawn] discard boss existing.length=${existing.length}`);
      continue;
    }

    // --- ディメンションの個体数チェック ---
    for (let mobinfo of bossinfo.mobinfos) {
      let mobExisting = level
        .getEntities()
        .filter((ent) => ent.type == mobinfo.mobid);
      if (mobExisting.length < mobinfo.count) {
        debug(`[checkSpawn] discard mob existing.length=${mobExisting.length}`);
        continue;
      } else {
        // スポーンキャンセル
        event.cancel();
      }
    }
  }
});
