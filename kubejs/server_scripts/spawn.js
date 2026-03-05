// ====== 設定 ======
const BOSS_COOLDOWN_TICKS = 5 * 60 * 20; // ボスリスポーン間隔
const MOB_SPAWN_TICKS = 1 * 60 * 20; // モブスポーン間隔

// ====== ボス情報構造体 ======
const monsterinfos = [
  {
    bossid: "binah:binah_v_2",
    mobinfos: [
      { mobid: "binah:white_cube", spawnCount: 4, maxCount: 10, spawnHeight: 0 },
      { mobid: "binah:black_cube", spawnCount: 4, maxCount: 10, spawnHeight: 0 },
      { mobid: "binah:yallow_cube", spawnCount: 4, maxCount: 10, spawnHeight: 0 },
      { mobid: "inah:droid", spawnCount: 1, maxCount: 4, spawnHeight: 0 },
      { mobid: "binah:drone_missile", spawnCount: 1, maxCount: 4, spawnHeight: 0 },
      { mobid: "binah:goliath", spawnCount: 1, maxCount: 1, spawnHeight: 0 },
    ],
    dim: "mypack:endless_desert_1",
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 80,
    mobSpawnRangeMin: 24,
    mobSpawnRangeMax: 32,
    lastDeathTick: -999999,
    rewards: [],
  },
  {
    bossid: "binah:perorodzilla",
    mobinfos: [
      { mobid: "binah:perorod", spawnCount: 3, maxCount: 15, spawnHeight: 1 },
    ],
    dim: "mypack:endless_tundra_1",
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 64,
    mobSpawnRangeMin: 24,
    mobSpawnRangeMax: 48,
    lastDeathTick: -999999,
    rewards: [],
  },
  {
    bossid: "pomkotsmechs:pms01",
    mobinfos: [
      { mobid: "binah:droid", spawnCount: 2, maxCount: 4, spawnHeight: 1 },
    ],
    dim: "mypack:_quest01",
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 64,
    mobSpawnRangeMin: 2,
    mobSpawnRangeMax: 24,
    lastDeathTick: -999999,
    rewards: [
      { id: "pomkotsmechs:quest_sheet_02", num: 1 },
      { id: "minecraft:glass", num: 16 },
      { id: "minecraft:slime_block", num: 1 },
      { id: "minecraft:redstone_block", num: 1 },
      { id: "minecraft:gold_block", num: 1 },
      { id: "minecraft:diamond_block", num: 1 },
      { id: "minecraft:netherite_block", num: 1 },
      { id: "minecraft:netherite_upgrade_smithing_template", num: 1 }
    ],
  },
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

// ====== ランダム値取得 ======
function getBossAlive(event, nowtick, monsterinfo) {
  debug(`[${nowtick}][getBossAlive] start`);

  let level = event.server.getLevel(monsterinfo.dim);
  let existing = level
    .getEntities()
    .filter((ent) => ent.type == monsterinfo.bossid);
  debug(`[${nowtick}][getBossAlive] info boss existing.length=${existing.length}`);

  return existing;
}

// ====== BOSS召喚 ======
function spawnBoss(event, nowtick, monsterinfo) {
  debug(`[${nowtick}][spawnBoss] start`);

  let level = event.server.getLevel(monsterinfo.dim);

  // --- 召喚座標取得 ---
  let playersInDim = event.server.players.filter((p) => {
    let dimId = String(p.level.dimension);
    return dimId === monsterinfo.dim;
  });

  // --- ディメンションに1体のみ ---
  let existing = getBossAlive(event, nowtick, monsterinfo);
  // 結果取得
  if (existing.length > 0) {
    // スポーンキャンセル
    return;
  }

  // --- 死亡後時間経過チェック ---
  let elapsed = nowtick - monsterinfo.lastDeathTick;
  debug(`[${nowtick}][spawnBoss] info elapsed=${elapsed} BOSS_COOLDOWN_TICKS:${BOSS_COOLDOWN_TICKS}`);
  if (elapsed < BOSS_COOLDOWN_TICKS) {
    // スポーンキャンセル
    return;
  }
  //let pos = { x: 20, y: 70, z: 20 };
  let pos = getRandomSpawnBlock(
    playersInDim,
    monsterinfo.bossSpawnRangeMin,
    monsterinfo.bossSpawnRangeMax,
    level,
    nowtick,
  );

  // --- 召喚コマンド実行 ---
  event.server.runCommand(`execute in ${monsterinfo.dim} run summon ${monsterinfo.bossid} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`);
  debug(`[${nowtick}][spawnBoss] spawn {${monsterinfo.bossid}} {${monsterinfo.dim}} ${JSON.stringify(pos)}`);
}

// ====== MOB召喚 ======
function spawnMob(event, nowtick, monsterinfo) {
  debug(`[${nowtick}][spawnMob] start`);

  let level = event.server.getLevel(monsterinfo.dim);
  let playersInDim = event.server.players.filter((p) => {
    let dimId = String(p.level.dimension);
    return dimId === monsterinfo.dim;
  });

  // --- ボスがいない場合スポーンしない ---
  let existing = getBossAlive(event, nowtick, monsterinfo);
  if (existing > 0) {
    // スポーンキャンセル
    return;
  }

  // --- ディメンションの個体数チェック ---
  for (let mobinfo of monsterinfo.mobinfos) {
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
        return dimId === monsterinfo.dim;
      });
      let pos = getRandomSpawnBlock(existing, monsterinfo.mobSpawnRangeMin, monsterinfo.mobSpawnRangeMax, level, nowtick);

      pos.y = pos.y + mobinfo.spawnHeight;
      // --- 召喚コマンド実行 ---
      event.server.runCommandSilent(`execute in ${monsterinfo.dim} run summon ${mobinfo.mobid} ${pos.x} ${pos.y} ${pos.z}`);
      debug(`[${nowtick}][spawnMob] spawn {${mobinfo.mobid}} {${monsterinfo.dim}} ${JSON.stringify(pos)}`);
    }
  }
}

// ====== モンスター召喚 ======
function spawnMonster(event, nowtick) {
  debug(`[${nowtick}][spawnMonster] start`);

  // --- monsterinfos をループ ---
  for (let monsterinfo of monsterinfos) {
    debug(`[${nowtick}][spawnMonster] info boss:${monsterinfo.bossid}`);

    let level = event.server.getLevel(monsterinfo.dim);

    // --- ディメンションのロードチェック ---
    if (level == null) {
      debug(`[${nowtick}][spawnMonster] discard level == null`);
      continue;
    }

    // --- ディメンション内のユーザ数チェック ---
    let playersInDim = event.server.players.filter((p) => {
      let dimId = String(p.level.dimension);
      return dimId === monsterinfo.dim;
    });
    debug(`[${nowtick}][spawnMonster] info dim:${monsterinfo.dim} playersInDim.length:${playersInDim.length}`);
    if (playersInDim.length == 0) {
      continue;
    }

    // --- ボス召喚処理 ---
    spawnBoss(event, nowtick, monsterinfo);

    // --- モブ召喚処理 ---
    if (nowtick % MOB_SPAWN_TICKS !== 0) {
      spawnMob(event, nowtick, monsterinfo);
    }
  }
}
// ====== 報酬を与える ======
function reward(event, nowtick) {
  debug(`[${nowtick}][reward] start`);

  // --- monsterinfos をループ ---
  for (let monsterinfo of monsterinfos) {
    debug(`[${nowtick}][reward] info boss:${monsterinfo.bossid}`);

    let level = event.server.getLevel(monsterinfo.dim);

    //死亡時間が10秒以内なら報酬発生
    let elapsed = nowtick - monsterinfo.lastDeathTick;
    if (elapsed < 10 * 20) {
      let playersInDim = event.server.players.filter((p) => {
        let dimId = String(p.level.dimension);
        return dimId === monsterinfo.dim;
      });

      let itemStr = buildChestItemsNBT(monsterinfo.rewards);
      let pos = getRandomSpawnBlock(playersInDim, 3, 3, level, nowtick);
      event.server.runCommandSilent(`execute in ${monsterinfo.dim} run setblock ${pos.x} ${pos.y} ${pos.z} minecraft:chest`);
      event.server.runCommandSilent(`execute in ${monsterinfo.dim} run data modify block ${pos.x} ${pos.y} ${pos.z} Items set value ${itemStr}`);

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

  // --- monsterinfos をループ ---
  for (let monsterinfo of monsterinfos) {
    if (e.type !== monsterinfo.bossid) continue;
    if (e.level.dimension !== monsterinfo.dim) continue;

    debug(`[${nowtick}][death] info ${monsterinfo.bossid} died at ${nowtick} tick, the previous death was at ${monsterinfo.lastDeathTick}`);
    // ボス死亡時刻の記録
    monsterinfo.lastDeathTick = nowtick;
  }
});
