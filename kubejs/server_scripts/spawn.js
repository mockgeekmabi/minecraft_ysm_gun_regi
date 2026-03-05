// ====== 設定 ======
const CHALLENGE_COOLDOWN_TICKS = 5 * 60 * 20; // ボスリスポーン間隔
const MOB_SPAWN_TICKS = 1 * 60 * 20; // モブスポーン間隔

// ====== ボス情報構造体 ======
const monsterinfos = [
  {
    dim: "mypack:endless_desert_1",
    bossinfos: [
      { bossid: "binah:binah_v_2", spawnCount: 1, spawnHeight: 0, deathCount: 0 },
    ],
    mobinfos: [
      { mobid: "binah:white_cube", spawnCount: 4, maxCount: 10, spawnHeight: 0 },
      { mobid: "binah:black_cube", spawnCount: 4, maxCount: 10, spawnHeight: 0 },
      { mobid: "binah:yallow_cube", spawnCount: 4, maxCount: 10, spawnHeight: 0 },
      { mobid: "inah:droid", spawnCount: 1, maxCount: 4, spawnHeight: 0 },
      { mobid: "binah:drone_missile", spawnCount: 1, maxCount: 4, spawnHeight: 0 },
      { mobid: "binah:goliath", spawnCount: 1, maxCount: 1, spawnHeight: 0 },
    ],
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 80,
    mobSpawnRangeMin: 24,
    mobSpawnRangeMax: 32,
    lastClearTick: -999999,
    isChallenging: false,
    rewards: [],
  },
  {
    dim: "mypack:endless_tundra_1",
    bossinfos: [
      { bossid: "binah:perorodzilla", spawnCount: 1, spawnHeight: 0, deathCount: 0 },
    ],
    mobinfos: [
      { mobid: "binah:perorod", spawnCount: 3, maxCount: 15, spawnHeight: 1 },
    ],
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 64,
    mobSpawnRangeMin: 24,
    mobSpawnRangeMax: 48,
    lastClearTick: -999999,
    isChallenging: false,
    rewards: [],
  },
  {
    dim: "mypack:_quest01",
    bossinfos: [
      { bossid: "pomkotsmechs:pms01", spawnCount: 1, spawnHeight: 0, deathCount: 0 },
    ],
    mobinfos: [
      { mobid: "binah:droid", spawnCount: 2, maxCount: 4, spawnHeight: 1 },
    ],
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 64,
    mobSpawnRangeMin: 2,
    mobSpawnRangeMax: 24,
    lastClearTick: -999999,
    isChallenging: false,
    rewards: [
      { id: "pomkotsmechs:quest_sheet_02", num: 1 },
      { id: "minecraft:glass", num: 64 },
      { id: "minecraft:slime_block", num: 1 },
      { id: "minecraft:redstone_block", num: 1 },
      { id: "minecraft:gold_block", num: 1 },
      { id: "minecraft:diamond_block", num: 1 },
      { id: "minecraft:netherite_block", num: 1 },
      { id: "minecraft:netherite_upgrade_smithing_template", num: 1 },
    ],
  },
  {
    dim: "mypack:_quest02",
    bossinfos: [
      { bossid: "pomkotsmechs:pms03", spawnCount: 2, spawnHeight: 0, deathCount: 0 },
    ],
    mobinfos: [
      { mobid: "binah:droid", spawnCount: 2, maxCount: 4, spawnHeight: 1 },
    ],
    bossSpawnRangeMin: 32,
    bossSpawnRangeMax: 64,
    mobSpawnRangeMin: 2,
    mobSpawnRangeMax: 24,
    lastClearTick: -999999,
    isChallenging: false,
    rewards: [
      { id: "pomkotsmechs:quest_sheet_03", num: 1 },
      { id: "minecraft:glass", num: 64 },
      { id: "minecraft:slime_block", num: 1 },
      { id: "minecraft:redstone_block", num: 1 },
      { id: "minecraft:gold_block", num: 1 },
      { id: "minecraft:diamond_block", num: 1 },
      { id: "minecraft:netherite_block", num: 1 },
      { id: "minecraft:netherite_upgrade_smithing_template", num: 1 },
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
  let spawnX = Math.floor(player.x + getRundomNum(spawnRangeMin, spawnRangeMax, true));
  let spawnY = Math.floor(player.y);
  let spawnZ = Math.floor(player.z + getRundomNum(spawnRangeMin, spawnRangeMax, true));

  let targetBlock = { x: Math.floor(player.x), y: Math.floor(player.y), z: Math.floor(player.z) };
  let resultBlock = getScaffoldingBlock(spawnX, spawnY, spawnZ, level, nowtick);
  debug(`[${nowtick}][getRandomSpawnBlock] info targetBlock:${JSON.stringify(targetBlock)} resultBlock:${JSON.stringify(resultBlock)}`);

  return resultBlock;
}

// ====== 生存ボス情報取得 ======
function getBossAlive(event, nowtick, monsterinfo) {
  debug(`[${nowtick}][getBossAlive] start`);

  let level = event.server.getLevel(monsterinfo.dim);
  let result = [];
  for (let bossinfo of monsterinfo.bossinfos) {
    let existing = level
      .getEntities()
      .filter((ent) => ent.type == bossinfo.bossid);

    for (let ent of existing) {
      result.push(ent);
    }
  }
  debug(`[${nowtick}][getBossAlive] info boss existing.length=${result.length}`);
  return result;
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

  //挑戦中の場合
  debug(`[${nowtick}][spawnBoss] info monsterinfo.isChallenging=${monsterinfo.isChallenging}`);
  if (monsterinfo.isChallenging) {
    // デスポーンしたボスだけ再召喚
    for (let bossinfo of monsterinfo.bossinfos) {
      debug(`[${nowtick}][spawnBoss] info bossinfo.bossid=${bossinfo.bossid}`);

      //(spawnCount-deathCount)-取得できたスポーン数 の数だけ召喚
      let curCount = level
        .getEntities()
        .filter((ent) => ent.type == bossinfo.bossid).length;
      let respawnCount = (bossinfo.spawnCount - bossinfo.deathCount) - curCount;
      debug(`[${nowtick}][spawnBoss] info respawnCount=${respawnCount} spawnCount=${bossinfo.spawnCount} deathCount=${bossinfo.deathCount} curCount=${curCount}`);

      for (let i = 0; i < respawnCount; i++) {
        //召喚場所の決定
        let pos = getRandomSpawnBlock(playersInDim, monsterinfo.bossSpawnRangeMin, monsterinfo.bossSpawnRangeMax, level, nowtick);
        pos.y = pos.y + bossinfo.spawnHeight;

        // --- 召喚コマンド実行 ---
        event.server.runCommand(`execute in ${monsterinfo.dim} run summon ${bossinfo.bossid} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`);
        debug(`[${nowtick}][spawnBoss] spawn {${bossinfo.bossid}} {${monsterinfo.dim}} ${JSON.stringify(pos)}`);

      }
    }

    //挑戦中でない場合
  } else {
    let elapsed = nowtick - monsterinfo.lastClearTick;
    debug(`[${nowtick}][spawnBoss] info elapsed=${elapsed} CHALLENGE_COOLDOWN_TICKS:${CHALLENGE_COOLDOWN_TICKS}`);
    // クリアからCT時間を経過していない場合
    if (elapsed < CHALLENGE_COOLDOWN_TICKS) {
      // スポーンキャンセル
      return;
    }

    // --- スポーン処理 ---
    for (let bossinfo of monsterinfo.bossinfos) {
      debug(`[${nowtick}][spawnBoss] info bossinfo.bossid=${bossinfo.bossid}`);
      //spawnCountの数だけ召喚
      debug(`[${nowtick}][spawnBoss] info spawnCount=${bossinfo.spawnCount}`);
      for (let i = 0; i < bossinfo.spawnCount; i++) {

        //召喚場所の決定
        let pos = getRandomSpawnBlock(playersInDim, monsterinfo.bossSpawnRangeMin, monsterinfo.bossSpawnRangeMax, level, nowtick);
        pos.y = pos.y + bossinfo.spawnHeight;

        // --- 召喚コマンド実行 ---
        event.server.runCommand(`execute in ${monsterinfo.dim} run summon ${bossinfo.bossid} ${pos.x} ${pos.y} ${pos.z} {PersistenceRequired:1b}`);
        debug(`[${nowtick}][spawnBoss] spawn {${bossinfo.bossid}} {${monsterinfo.dim}} ${JSON.stringify(pos)}`);
      }
      // --- デス数を初期化 ---
      bossinfo.deathCount = 0;
    }
    // --- 挑戦中フラグ ---
    monsterinfo.isChallenging = true;
    debug(`[${nowtick}][spawnBoss] info monsterinfo.isChallenging set ${monsterinfo.isChallenging}`);
  }
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
  if (existing == 0) {
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
    debug(`[${nowtick}][spawnMonster] info dim:${monsterinfo.dim} boss:${JSON.stringify(monsterinfo.bossinfos)}`);

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
function reward(monsterinfo, event, nowtick) {
  debug(`[${nowtick}][reward] start`);

  let level = event.server.getLevel(monsterinfo.dim);
  let target = [];
  target.push(event.entity);

  //報酬生成
  let itemStr = buildChestItemsNBT(monsterinfo.rewards);
  let pos = getRandomSpawnBlock(target, 1, 1, level, nowtick);
  event.server.runCommandSilent(`execute in ${monsterinfo.dim} run setblock ${pos.x} ${pos.y} ${pos.z} minecraft:chest`);
  event.server.runCommandSilent(`execute in ${monsterinfo.dim} run data modify block ${pos.x} ${pos.y} ${pos.z} Items set value ${itemStr}`);

  event.server.tell(`ボスを撃破しました。報酬箱が出現します。x:${pos.x}, y:${pos.y}, z:${pos.z}`);
  debug(`[${nowtick}][reward] reward chest x:${pos.x}, y:${pos.y}, z:${pos.z}`);

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
});

// ====== 死亡イベント ======
EntityEvents.death((event) => {
  const e = event.entity;
  const nowtick = event.server.getLevel("minecraft:overworld").time;
  debug(`[${nowtick}][death] start ${e.type}`);

  // --- monsterinfos をループ ---
  for (let monsterinfo of monsterinfos) {
    // ディメンションが違う場合は次へ
    if (e.level.dimension !== monsterinfo.dim) continue;

    let matched = false;
    for (let bossinfo of monsterinfo.bossinfos) {

      if (e.type !== bossinfo.bossid) {
        // idが違う場合
        continue;
      } else {
        // idが一致した場合
        matched = true;
        // ボス死亡数の記録
        bossinfo.deathCount = bossinfo.deathCount + 1;
      }

    }
    //死亡対象がボスだった場合
    if (matched) {

      //クリア成否の判定
      let totalCount = 0;
      for (let bossinfo of monsterinfo.bossinfos) {
        totalCount = totalCount + (bossinfo.spawnCount - bossinfo.deathCount);
      }
      debug(`[${nowtick}][death] info totalCount:${totalCount}`);

      if (totalCount == 0) {
        // クリア時刻の記録
        monsterinfo.lastClearTick = nowtick;
        debug(`[${nowtick}][death] info {${monsterinfo.dim}} clear, tick is ${monsterinfo.lastClearTick}`);

        // 挑戦中フラグ
        monsterinfo.isChallenging = false;
        debug(`[${nowtick}][death] info monsterinfo.isChallenging set ${monsterinfo.isChallenging}`);

        // 報酬
        reward(monsterinfo, event, nowtick);
      }

    }
  }
});
