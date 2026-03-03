// ====== 設定 ======
const COOLDOWN_TICKS = 2 * 60 * 20; // 15分 = 18000tick

// ====== ボス情報構造体 ======
const bossinfos = [
  {
    bossid: "binah:binah_v_2",
    dim: "mypack:endless_desert",
    lastDeathTick: -999999,
    mobinfos: [
      {
        mobid: "binah:white_cube",
        spawnCount: 4,
        maxCount: 15,
      },
      {
        mobid: "binah:black_cube",
        spawnCount: 4,
        maxCount: 15,
      },
      {
        mobid: "binah:yallow_cube",
        spawnCount: 4,
        maxCount: 15,
      },
      {
        mobid: "inah:droid",
        spawnCount: 1,
        maxCount: 4,
      },
      {
        mobid: "binah:drone_missile",
        spawnCount: 1,
        maxCount: 8,
      },
      {
        mobid: "binah:goliath",
        spawnCount: 1,
        maxCount: 2,
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
  //      spawnCount: 1,
  //      maxCount: 2
  //    }
  // }
];

// ====== 召喚座標のランダム決定(プレイヤー座標基準) ======
function getRundomNum(min, max, signFlag) {
  if (signFlag) {
    if (Math.floor(Math.random() * 2) === 0) {
      return Math.random() * (max - min + 1) + min;
    } else {
      return 0 - (Math.random() * (max - min + 1) + min);
    }
  } else {
    return Math.random() * (max - min + 1) + min;
  }
}

// ====== 召喚座標のランダム決定(プレイヤー座標基準) ======
function getRandomSpawnBlock(players, spawnRangeMin, spawnRangeMax, nowtick) {
  debug(`[${nowtick}][getRandomSpawnBlock] start`);

  // --- 対象ユーザの選択 ---
  const indexMin = 0;
  const indexMax = players.length-1;
  const index = Math.floor(getRundomNum(indexMin, indexMax, false));
  const player = players[index];
  debug(`[${nowtick}][getRandomSpawnBlock] info index:${index} player:${JSON.stringify(player)}`);

  // --- 対象ユーザをベースにXZ座標を乱数取得 ---
  // --- Y座標はユーザと同じ座標で仮決定 ---
  let blockX = Math.floor(
    player.x + getRundomNum(spawnRangeMin, spawnRangeMax, true),
  );
  let blockY = Math.floor(player.y);
  let blockZ = Math.floor(
    player.z + getRundomNum(spawnRangeMin, spawnRangeMax, true),
  );

  // --- Y座標のブロックを確認 ---
  // 空気ブロックの場合、１つ下が空気以外であることを確認
  // 空気以外の場合、１つ上が空気ブロックであることを確認
  let playerBlock = {
    x: Math.floor(player.x),
    y: Math.floor(player.y),
    z: Math.floor(player.z),
  };
  let resultBlock = { x: blockX, y: blockY, z: blockZ };
  debug(
    `[${nowtick}][getRandomSpawnBlock] info playerBlock:${JSON.stringify(playerBlock)} resultBlock:${JSON.stringify(resultBlock)}`,
  );

  return resultBlock;
}

// ====== BOSS召喚 ======
function spawnBoss(event, nowtick, bossinfo) {
  debug(`[${nowtick}][spawnBoss] start`);

  let level = event.server.getLevel(bossinfo.dim);

  // --- ディメンションに1体のみ ---
  let existing = level
    .getEntities()
    .filter((ent) => ent.type == bossinfo.bossid);
  debug(`[${nowtick}][spawnBoss] info existing.length=${existing.length}`);
  if (existing.length > 0) {
    // スポーンキャンセル
    return;
  }

  // --- 死亡後時間経過チェック ---
  let elapsed = nowtick - bossinfo.lastDeathTick;
  debug(
    `[${nowtick}][spawnBoss] info elapsed=${elapsed} COOLDOWN_TICKS:${COOLDOWN_TICKS}`,
  );
  if (elapsed < COOLDOWN_TICKS) {
    // スポーンキャンセル
    return;
  }

  // --- 召喚座標取得 ---
  let playersInDim = event.server.players.filter((p) => {
    let dimId = String(p.level.dimension);
    return dimId === bossinfo.dim;
  });
  //let pos = { x: 20, y: 70, z: 20 };
  let pos = getRandomSpawnBlock(playersInDim, 32, 64, nowtick);

  // --- 召喚コマンド実行 ---
  event.server.runCommand(
    `execute as @p at @p run summon ${bossinfo.bossid} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`,
    //`summon ${bossinfo.bossid} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`,
  );
  debug(
    `[${nowtick}][spawnBoss] spawn ${bossinfo.bossid} ${bossinfo.dim} ${JSON.stringify(pos)}`,
  );
}

// ====== MOB召喚 ======
function spawnMob(event, nowtick, bossinfo) {
  debug(`[${nowtick}][spawnMob] start`);

  let level = event.server.getLevel(bossinfo.dim);
  let playersInDim = event.server.players.filter((p) => {
    let dimId = String(p.level.dimension);
    return dimId === bossinfo.dim;
  });

  // --- ボスの生存チェック ---
  let existing = level
    .getEntities()
    .filter((ent) => ent.type == bossinfo.bossid);
  debug(
    `[${nowtick}][spawnMob] info boss existing.length=${existing.length}`,
  );
  if (existing.length < 1) {
    // スポーンキャンセル
    return;
  }

  // --- ディメンションの個体数チェック ---
  for (let mobinfo of bossinfo.mobinfos) {
    let mobExisting = level
      .getEntities()
      .filter((ent) => ent.type == mobinfo.mobid);
    debug(
      `[${nowtick}][spawnMob] info mob:${mobinfo.mobid} existing.length=${mobExisting.length} mobinfo.maxCount=${mobinfo.maxCount}`,
    );

    // --- MOB数上限チェック ---
    if (mobExisting.length >= mobinfo.maxCount) {
      // スポーンキャンセル
      continue;
    }
    //　--- MOB沸き数決定 ---
    let mobNum = mobinfo.maxCount - mobExisting.length;
    if (mobNum > mobinfo.spawnCount) {
      mobNum = mobinfo.spawnCount;
    }
    for (let i = 0; i < mobNum; i++) {
      // --- 召喚座標取得 ---
      let playersInDim = event.server.players.filter((p) => {
        let dimId = String(p.level.dimension);
        return dimId === bossinfo.dim;
      });
      let pos = getRandomSpawnBlock(playersInDim, 24, 128, nowtick);
      // --- 召喚コマンド実行 ---
      event.server.runCommandSilent(
        `execute as @p at @p run summon ${mobinfo.mobid} ${pos.x} ${pos.y} ${pos.z}`,
      );
      //event.level.spawnEntity(mobinfo.mobid, pos.x, pos.y, pos.z);
      debug(
        `[${nowtick}][spawnMob] spawn ${mobinfo.mobid} ${bossinfo.dim} ${JSON.stringify(pos)}`,
      );
    }
  }
}

// ====== モンスター召喚 ======
function spawnMonster(event, nowtick) {
  debug(`[${nowtick}][spawnMonster] start`);

  // --- bossinfos をループ ---
  for (let bossinfo of bossinfos) {
    debug(`[${nowtick}][spawnMonster] info boss:${bossinfo.bossid}`);

    let level = event.server.getLevel(bossinfo.dim);

    // --- ディメンションのロードチェック ---
    if (level == null) {
      debug(`[${nowtick}][spawnMonster] discard level == null`);
      continue;
    }

    // --- ディメンション内のユーザ数チェック ---
    let playersInDim = event.server.players.filter((p) => {
      let dimId = String(p.level.dimension);
      return dimId === bossinfo.dim;
    });
    debug(
      `[${nowtick}][spawnMonster] info dim:${bossinfo.dim} playersInDim.length:${playersInDim.length}`,
    );
    if (playersInDim.length == 0) {
      continue;
    }

    // --- ボス召喚処理 ---
    spawnBoss(event, nowtick, bossinfo);
    // --- モブ召喚処理 ---
    spawnMob(event, nowtick, bossinfo);
  }
}

// ====== スポーン設定 ======
ServerEvents.tick((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;

  // --- 10秒に1回ログ ---
  if (nowtick % (10 * 20) !== 0) {
    return;
  } else {
    debug(
      `[${nowtick}][tick] start server:${event.server} level:"${event.level}`,
    );
  }

  // --- 1分に1回処理を行う ---
  if (nowtick % (1 * 60 * 20) !== 0) {
    return;
  } else {
    spawnMonster(event, nowtick);
  }
});

// ====== 死亡イベント ======
EntityEvents.death((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(`[${nowtick}][death] start`);

  const e = event.entity;

  // --- bossinfos をループ ---
  for (let bossinfo of bossinfos) {
    if (e.type !== bossinfo.bossid) continue;
    if (e.level.dimension !== bossinfo.dim) continue;

    debug(
      `[${nowtick}][death] info ${bossinfo.bossid} died at ${nowtick} tick, the previous death was at ${bossinfo.lastDeathTick}`,
    );
    // ボス死亡時刻の記録
    bossinfo.lastDeathTick = nowtick;
  }
});
