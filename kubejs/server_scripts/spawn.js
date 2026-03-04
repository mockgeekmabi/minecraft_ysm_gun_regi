// ====== 設定 ======
const BOSS_COOLDOWN_TICKS = 5 * 60 * 20; // ボスリスポーン間隔
const MOB_SPAWN_TICKS = 1 * 60 * 20; // モブスポーン間隔

// ====== ボス情報構造体 ======
const bossinfos = [
  {
    bossid: "binah:binah_v_2",
    dim: "mypack:endless_desert_1",
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 80,
    mobSpawnRangeMin: 24,
    mobSpawnRangeMax: 32,
    lastDeathTick: -999999,
    rewards: [],
    mobinfos: [
      { mobid: "binah:white_cube", spawnCount: 4, maxCount: 10, spawnHeight: 0 },
      { mobid: "binah:black_cube", spawnCount: 4, maxCount: 10, spawnHeight: 0 },
      { mobid: "binah:yallow_cube", spawnCount: 4, maxCount: 10, spawnHeight: 0 },
      { mobid: "inah:droid", spawnCount: 1, maxCount: 4, spawnHeight: 0 },
      { mobid: "binah:drone_missile", spawnCount: 1, maxCount: 4, spawnHeight: 0 },
      { mobid: "binah:goliath", spawnCount: 1, maxCount: 1, spawnHeight: 0 },
    ],
  },
  {
    bossid: "binah:perorodzilla",
    dim: "mypack:endless_tundra_1",
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 64,
    mobSpawnRangeMin: 24,
    mobSpawnRangeMax: 48,
    lastDeathTick: -999999,
    rewards: [],
    mobinfos: [
      { mobid: "binah:perorod", spawnCount: 3, maxCount: 15, spawnHeight: 1 },
    ],
  },
  {
    bossid: "pomkotsmechs:pms01",
    dim: "mypack:_quest01",
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 64,
    mobSpawnRangeMin: 12,
    mobSpawnRangeMax: 24,
    lastDeathTick: -999999,
    rewards: [
      { id: "pomkotsmechs:quest_sheet_02", num: 1 },
      { id: "minecraft:redstone_block", num: 1 },
      { id: "minecraft:gold_block", num: 1 },
      { id: "minecraft:diamond_block", num: 1 },
      { id: "minecraft:netherite_block", num: 1 },
      { id: "minecraft:netherite_upgrade_smithing_template", num: 1 }
    ],
    mobinfos: [
      { mobid: "binah:droid", spawnCount: 2, maxCount: 4, spawnHeight: 1 },
    ],
  },

  // 必要ならここに追加
  // {
  //   bossid: "example:mob",
  //   dim: "example:dimension",
  //   bossSpawnRangeMin: 32,
  //   bossSpawnRangeMax: 64,
  //   mobSpawnRangeMin: 24,
  //   mobSpawnRangeMax: 64,
  //   lastDeathTick: -999999,
  //   mobinfos: [
  //    {
  //      mobid: "example:mob",
  //      spawnCount: 1,
  //      maxCount: 2,
  //      spawnHeight: 0,
  //    },
  //  ],
  // },
];

// ====== ランダム値取得 ======
function buildChestItemsNBT(rewards) {
  let items = [];

  for (let i = 0; i < rewards.length; i++) {
    let r = rewards[i];

    // Slot は 0 から順番に割り当てる
    let nbt = `{Slot:${i}b,id:"${r.id}",Count:${r.num}b}`;
    items.push(nbt);
  }

  return `[${items.join(",")}]`;
}

// ====== ランダム値取得 ======
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
function getRandomSpawnBlock(players, spawnRangeMin, spawnRangeMax, level, nowtick) {
  debug(`[${nowtick}][getRandomSpawnBlock] start`);

  // --- 対象ユーザの選択 ---
  const indexMin = 0;
  const indexMax = players.length - 1;
  const index = Math.floor(getRundomNum(indexMin, indexMax, false));
  const player = players[index];
  debug(`[${nowtick}][getRandomSpawnBlock] info index:${index} player:${JSON.stringify(player)}`);

  // --- 対象ユーザをベースにXZ座標を乱数取得 ---
  // --- Y座標はユーザと同じ座標で仮決定 ---
  let spawnX = Math.floor(
    player.x + getRundomNum(spawnRangeMin, spawnRangeMax, true),
  );
  let spawnY = Math.floor(player.y);
  let spawnZ = Math.floor(
    player.z + getRundomNum(spawnRangeMin, spawnRangeMax, true),
  );

  let targetBlock = {
    x: Math.floor(player.x),
    y: Math.floor(player.y),
    z: Math.floor(player.z),
  };
  let resultBlock = getScaffoldingBlock(spawnX, spawnY, spawnZ, level, nowtick);
  debug(`[${nowtick}][getRandomSpawnBlock] info targetBlock:${JSON.stringify(targetBlock)} resultBlock:${JSON.stringify(resultBlock)}`);

  return resultBlock;
}

// ====== BOSS召喚 ======
function spawnBoss(event, nowtick, bossinfo) {
  debug(`[${nowtick}][spawnBoss] start`);

  let level = event.server.getLevel(bossinfo.dim);

  // --- 召喚座標取得 ---
  let playersInDim = event.server.players.filter((p) => {
    let dimId = String(p.level.dimension);
    return dimId === bossinfo.dim;
  });

  // --- ディメンションに1体のみ ---
  // 結果取得
  let existing = level
    .getEntities()
    .filter((ent) => ent.type == bossinfo.bossid);
  debug(`[${nowtick}][spawnBoss] info ${bossinfo.bossid} existing.length=${existing.length}`);
  if (existing.length > 0) {
    // スポーンキャンセル
    return;
  }

  // --- 死亡後時間経過チェック ---
  let elapsed = nowtick - bossinfo.lastDeathTick;
  debug(`[${nowtick}][spawnBoss] info elapsed=${elapsed} BOSS_COOLDOWN_TICKS:${BOSS_COOLDOWN_TICKS}`);
  if (elapsed < BOSS_COOLDOWN_TICKS) {
    // スポーンキャンセル
    return;
  }
  //let pos = { x: 20, y: 70, z: 20 };
  let pos = getRandomSpawnBlock(
    playersInDim,
    bossinfo.bossSpawnRangeMin,
    bossinfo.bossSpawnRangeMax,
    level,
    nowtick,
  );

  // --- 召喚コマンド実行 ---
  event.server.runCommand(
    `execute in ${bossinfo.dim} run summon ${bossinfo.bossid} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`,
    //`summon ${bossinfo.bossid} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`,
  );
  debug(`[${nowtick}][spawnBoss] spawn {${bossinfo.bossid}} {${bossinfo.dim}} ${JSON.stringify(pos)}`);
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
  debug(`[${nowtick}][spawnMob] info boss existing.length=${existing.length}`);
  if (existing.length < 1) {
    // スポーンキャンセル
    return;
  }

  // --- ディメンションの個体数チェック ---
  for (let mobinfo of bossinfo.mobinfos) {
    let mobExisting = level
      .getEntities()
      .filter((ent) => ent.type == mobinfo.mobid);
    debug(`[${nowtick}][spawnMob] info mob:${mobinfo.mobid} existing.length=${mobExisting.length} mobinfo.maxCount=${mobinfo.maxCount}`);

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
      let pos = getRandomSpawnBlock(existing, bossinfo.mobSpawnRangeMin, bossinfo.mobSpawnRangeMax, level, nowtick);

      pos.y = pos.y + mobinfo.spawnHeight;
      // --- 召喚コマンド実行 ---
      event.server.runCommandSilent(
        `execute in ${bossinfo.dim} run summon ${mobinfo.mobid} ${pos.x} ${pos.y} ${pos.z}`,
      );
      debug(`[${nowtick}][spawnMob] spawn {${mobinfo.mobid}} {${bossinfo.dim}} ${JSON.stringify(pos)}`);
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
    debug(`[${nowtick}][spawnMonster] info dim:${bossinfo.dim} playersInDim.length:${playersInDim.length}`);
    if (playersInDim.length == 0) {
      continue;
    }

    // --- ボス召喚処理 ---
    spawnBoss(event, nowtick, bossinfo);

    // --- モブ召喚処理 ---
    if (nowtick % MOB_SPAWN_TICKS !== 0) {
      spawnMob(event, nowtick, bossinfo);
    }
  }
}
// ====== 報酬を与える ======
function reward(event, nowtick) {
  debug(`[${nowtick}][reward] start`);

  // --- bossinfos をループ ---
  for (let bossinfo of bossinfos) {
    debug(`[${nowtick}][reward] info boss:${bossinfo.bossid}`);

    let level = event.server.getLevel(bossinfo.dim);

    //死亡時間が10秒以内なら報酬発生
    let elapsed = nowtick - bossinfo.lastDeathTick;
    if (elapsed < 10 * 20) {
      let playersInDim = event.server.players.filter((p) => {
        let dimId = String(p.level.dimension);
        return dimId === bossinfo.dim;
      });

      let itemStr = buildChestItemsNBT(bossinfo.rewards);
      let pos = getRandomSpawnBlock(playersInDim, 3, 3, level, nowtick);
      event.server.runCommandSilent(`execute in ${bossinfo.dim} run setblock ${pos.x} ${pos.y} ${pos.z} minecraft:chest`);
      event.server.runCommandSilent(`execute in ${bossinfo.dim} run data modify block ${pos.x} ${pos.y} ${pos.z} Items set value ${itemStr}`);

      event.server.tell(`ボスを撃破しました。報酬箱が出現します。x:${pos.x}, y:${pos.y}, z:${pos.z}`);
      debug(`[${nowtick}][reward] reward chest x:${pos.x}, y:${pos.y}, z:${pos.z}`);
    }
  }
}

// ====== スポーン設定 ======
ServerEvents.tick((event) => {
  const nowtick = event.server.getLevel("minecraft:overworld").time;

  // --- 10秒に1回ログ ---
  if (nowtick % (10 * 20) !== 0) {
    return;
  } else {
    debug(`[${nowtick}][tick] start server:${event.server} level:"${event.level}`);
  }

  // --- 2分30秒に1回処理を行う ---
  // if (nowtick % (2.5 * 60 * 20) !== 0) {
  //   return;
  //} else {
  spawnMonster(event, nowtick);
  //}
  reward(event, nowtick);
});

// ====== 死亡イベント ======
EntityEvents.death((event) => {
  const e = event.entity;
  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(`[${nowtick}][death] start ${e.type}`);

  // --- bossinfos をループ ---
  for (let bossinfo of bossinfos) {
    if (e.type !== bossinfo.bossid) continue;
    if (e.level.dimension !== bossinfo.dim) continue;

    debug(`[${nowtick}][death] info ${bossinfo.bossid} died at ${nowtick} tick, the previous death was at ${bossinfo.lastDeathTick}`);
    // ボス死亡時刻の記録
    bossinfo.lastDeathTick = nowtick;
  }
});
