// npc_events.js
import { STATE } from "./state.js";
import { SPRITES } from "./sprites.js";
import { playCooking, playIndianJingle, playItemJingle, playInnJingle, playJaws, stopJaws, playCrush, playConfirm, playCoin, playDoor, playClickOn } from "./se.js";

export function runNpcEvent(act, ctx) {
  const ev = act?.event;
  if (!ev || !ev.type) return false;

  if (ev.type === "inn_stay") {
    const { choice, dialog, fade, nowMs, lockInput, unlockInput, teleportPlayer, spawnPickup } = ctx;

    const welcomeLine  = ev.welcome   || "……";
    const questionLine = ev.question  || "……";
    const options      = ev.options   || ["はい", "いいえ"];

    dialog.open([[welcomeLine]], () => {
      choice.open(options, (idx) => {
        if (typeof choice.close === "function") choice.close();

        if (idx === 0) {
          const price = ev.price | 0;
          if (price > 0 && STATE.money < price) {
            dialog.open([["おかねたりないよー。"]]);
            return;
          }
          if (price > 0) STATE.money -= price;
          if (typeof lockInput === "function") lockInput();
          const t = typeof nowMs === "function"
            ? nowMs()
            : (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
          fade.startCutFade(t, {
            outMs:  400,
            holdMs: 1000, // 1秒ウェイト
            inMs:   600,
            onBlack: () => {
              if (ev.restAt && typeof teleportPlayer === "function") {
                teleportPlayer(ev.restAt.x, ev.restAt.y);
              }
              const fs = ev.firstStaySpawn;
              if (fs && fs.flag && !STATE.flags[fs.flag]) {
                STATE.flags[fs.flag] = true;
                if (typeof spawnPickup === "function") {
                  spawnPickup(fs.itemId, fs.x, fs.y);
                }
              }
              setTimeout(() => { playInnJingle(); }, 1000);
            },
            onEnd: () => {
              if (typeof unlockInput === "function") unlockInput();
            },
          });
        } else {
          dialog.open(ev.onNo || [["……"]]);
        }
      }, questionLine);
    });

    return true;
  }

  if (ev.type === "hisaro_sunlover") {
    const { choice, dialog, fade, sprites, party, nowMs, lockInput, unlockInput, achieveQuest } = ctx;

    const lines   = ev.lines   || ["……"];
    const options = ev.options || ["はい", "いいえ"];

    if (typeof dialog.onPageChange === "function") dialog.onPageChange(null);
    if (typeof dialog.onTypingDone === "function") dialog.onTypingDone(null);

    const curLevel = (STATE.flags.skinLevel | 0);

    // 最大段階ならセリフだけ
    if (curLevel >= 2) {
      dialog.open([["おまえたち、かがやいてるぜ!!"]]);
      return true;
    }

    const nextLevel = curLevel + 1;
    const suffix    = nextLevel === 1 ? "_t1" : "_t2";

    dialog.open([[lines[0] ?? "……"]], () => {
      choice.open(options, (idx) => {
        if (typeof choice.close === "function") choice.close();

        if (idx === 0) {
          if (!ev.onYesFinalPages) return;
          if (typeof lockInput === "function") lockInput();
          dialog.open(ev.onYesFinalPages, () => {
            const t = typeof nowMs === "function"
              ? nowMs()
              : (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
            fade.startCutFade(t, {
              outMs:  ev.fadeOutMs ?? 350,
              holdMs: ev.holdMs    ?? 3000,
              inMs:   ev.fadeInMs  ?? 350,
              onBlack: () => {
                for (const m of [party.leader, party.p2, party.p3, party.p4]) {
                  for (let i = 1; i <= 4; i++) {
                    const base = sprites[`p${i}`];
                    const t1   = sprites[`p${i}_t1`];
                    const t2   = sprites[`p${i}_t2`];
                    if (m.img === base || m.img === t1 || m.img === t2) {
                      m.img = sprites[`p${i}${suffix}`];
                      break;
                    }
                  }
                }
                STATE.flags.skinLevel = nextLevel;
              },
              onEnd: () => {
                if (curLevel === 1 && typeof achieveQuest === "function") achieveQuest("28");
                playItemJingle();
                setTimeout(() => {
                  if (typeof unlockInput === "function") unlockInput();
                  dialog.open([["いいじゃないか、にあってるぜ。"]]);
                }, 2000);
              },
            });
          }, "talk", ev.finalAutoMs ?? 3000);
        } else {
          dialog.open(ev.onNoDialog || [["……"]]);
        }
      }, lines[1] ?? "……");
    });

    return true;
  }

  if (ev.type === "ura_yahhy_shop") {
    const { choice, dialog, fade, nowMs, stopBgm, startTrip, startGoodTrip, isTripActive } = ctx;

    if ((typeof isTripActive === "function" && isTripActive()) || STATE.flags.uraYahhyCooking) {
      dialog.open([["ほぴょぴょぴょーーー"]]);
      return true;
    }

    function cleanup() {
      if (typeof dialog.onPageChange === "function") dialog.onPageChange(null);
      if (typeof dialog.onTypingDone === "function") dialog.onTypingDone(null);
      if (typeof choice.close === "function") choice.close();
    }

    const COOK_HOLD_MS = 2400;

    function showAiyo(curryName) {
      cleanup();
      STATE.flags.uraYahhyCooking = true;
      dialog.open([["アイヨー、チョットマッテネ"]], () => {
        if (typeof stopBgm === "function") stopBgm();
        const t = typeof nowMs === "function" ? nowMs() : Date.now();
        fade.startCutFade(t, {
          outMs:  300,
          holdMs: COOK_HOLD_MS,
          inMs:   400,
          onBlack: () => {
            playCooking(COOK_HOLD_MS);
          },
          onEnd: () => {
            dialog.open(
              [["オマタセアルー"]],
              () => {
                playIndianJingle();
                if (curryName === "ぐねぐねサバカレー" && typeof startTrip === "function") setTimeout(startTrip, 1810);
                if (curryName === "ぎらぎらチキンカレー" && typeof startGoodTrip === "function") setTimeout(startGoodTrip, 1810);
                dialog.open([[curryName + "をたべた。"]], null, "sign");
              }
            );
          },
        });
      });
    }

    function showKimokimo() {
      cleanup();
      dialog.open([["ケー、キモキモ、ヒヤカシアルヨ"]]);
    }

    function showChickenChoice() {
      cleanup();
      choice.open(["はい", "いいえ"], (sel) => {
        cleanup();
        if (sel === 0) showAiyo("ぎらぎらチキンカレー");
        else showKimokimo();
      }, "「ぎらぎらチキンカレー」ダナ？");
    }

    function showSabaChoice() {
      cleanup();
      choice.open(["はい", "いいえ"], (sel) => {
        cleanup();
        if (sel === 0) showAiyo("ぐねぐねサバカレー");
        else showChickenChoice();
      }, "「ぐねぐねサバカレー」二スルカ");
    }

    cleanup();
    dialog.open([
      ["オニイサン、オネエサン、イイトコキタネー"],
      ["ココ、ウラノカレーショップ「ウラケチャパグ」アルヨー"],
      ["イマ「ぐねぐねサバカレー」「ぎらぎらチキンカレー」ネ"],
    ], showSabaChoice);

    return true;
  }

  if (ev.type === "nidhogg_give") {
    const { dialog, inventory, choice, achieveQuest, checkQuest01, getBgmSrc, lockInput, unlockInput } = ctx;

    if (STATE.flags.nidhoggGave) {
      // 2回目以降
      if (typeof getBgmSrc === "function" && getBgmSrc() === "assets/audio/duckH.mp3") {
        if (typeof achieveQuest === "function") achieveQuest("10");
      }
      dialog.open(ev.dialogAlready || [["……"]]);
    } else {
      // 初回
      dialog.open([
        ["きみたちはだれだい？"],
        ["だれでもいいんだけどさ。"],
      ], () => {
        if (typeof lockInput === "function") lockInput();
        setTimeout(() => {
          if (typeof unlockInput === "function") unlockInput();
          dialog.open([["ひょっとして、"]], () => {
            choice.open(["はい", "いいえ"], (idx) => {
              if (typeof choice.close === "function") choice.close();
              // はい・いいえどちらでもquest05達成
              if (typeof achieveQuest === "function") achieveQuest("05");
              // 共通：「そっか、そうなんだ。」→ 1秒 → 残りのセリフ
              dialog.open([["そっか、そうなんだ。"]], () => {
                if (typeof lockInput === "function") lockInput();
                setTimeout(() => {
                  if (typeof unlockInput === "function") unlockInput();
                  dialog.open([
                    ["このラバーダックってやつ、しってる？"],
                    ["ぼくはこれがずっとほしかったんだけど、これは探してたやつとはちがったんだ。"],
                  ], () => {
                    choice.open(["はい", "いいえ"], (idx2) => {
                      if (typeof choice.close === "function") choice.close();
                      if (idx2 === 0) {
                        STATE.flags.nidhoggGave = true;
                        inventory.addItem(ev.giveItem);
                        if (typeof checkQuest01 === "function") checkQuest01();
                        act.img = SPRITES.nidhogg2;
                        dialog.open([["それじゃあ、これをわたさなきゃね。"], ...(ev.dialogGive || [])]);
                      } else {
                        dialog.open([["なぁんだ。"]]);
                      }
                    }, "これってきみたちのものだったり？");
                  });
                }, 1000);
              });
            }, "ともだちになってくれるのかい？");
          });
        }, 1000);
      });
    }
    return true;
  }

  if (ev.type === "careful_letterbox") {
    const { letterbox, stopBgm, getNpcByName, sprites, getPlayerPos, triggerRedScreen, lockInput, unlockInput, showExclamations } = ctx;
    if (!letterbox) return false;
    if (STATE.flags.carefulActive) return true;
    STATE.flags.carefulActive = true;

    if (typeof lockInput === "function") lockInput();
    if (typeof stopBgm === "function") stopBgm();
    letterbox.show(() => {
      if (typeof showExclamations === "function") showExclamations();
      playConfirm();
    });

    // 1秒後: ジョーズ開始
    setTimeout(() => {
      playJaws();

      // さらに5秒後: orca3 → orca2 → orca にチェンジ
      setTimeout(() => {
        const orca = typeof getNpcByName === "function" ? getNpcByName("orca3") : null;
        if (!orca) return;
        orca.img = sprites.orca2;
        setTimeout(() => {
          orca.img = sprites.orca;

          // さらに3秒後: プレイヤーに急接近 → 赤フラッシュ + ぐしゃ
          setTimeout(() => {
            const startX = orca.x;
            const APPROACH_MS = 700;
            const t0 = performance.now();

            const interval = setInterval(() => {
              const elapsed = performance.now() - t0;
              const p = Math.min(elapsed / APPROACH_MS, 1);
              const eased = p * p; // easeIn（加速）
              orca.x = startX - 30 * eased;

              if (p >= 1) {
                clearInterval(interval);
                stopJaws();
                playCrush();
                if (typeof triggerRedScreen === "function") triggerRedScreen();
                if (typeof unlockInput === "function") unlockInput();
              }
            }, 16);
          }, 3000);

        }, 400);
      }, 5000);
    }, 1000);

    return true;
  }

  if (ev.type === "item_shop") {
    const { dialog, shop, inventory, toast, achieveQuest } = ctx;

    function checkOtsugeQuest() {
      const inv = typeof inventory?.getSnapshot === "function" ? inventory.getSnapshot() : [];
      const hasAllOtsuge = Array.from({ length: 30 }, (_, i) =>
        inv.includes(`otsuge_${String(i + 1).padStart(2, "0")}`)
      ).every(Boolean);
      if (hasAllOtsuge && typeof achieveQuest === "function") achieveQuest("21");
    }

    function showShop(initialCursor = 0) {
      shop.open(ev.items, ev.closeLabel ?? "やめる", ev.shopName ?? "", (id, savedCursor) => {
        if (id === null) {
          dialog.open(ev.byeDialog || [["まいどあり！"]]);
          return;
        }
        const item = ev.items.find(i => i.id === id);
        inventory.addItem(id);
        checkOtsugeQuest();
        playCoin();
        if (typeof toast?.showStack === "function") toast.showStack(item?.name ?? id);
        showShop(savedCursor ?? 0);
      }, initialCursor);
    }

    dialog.open(ev.greeting || [["いらっしゃいませ！"]], () => {
      showShop();
    });

    return true;
  }

  if (ev.type === "pizza_shop") {
    const { dialog, choice, startPizzaJob, settlePizzaJob, cancelPizzaJob, inventory } = ctx;
    if (STATE.flags.pizzaJobActive) {
      if (STATE.flags.pizzaDelivered) {
        const reward = typeof settlePizzaJob === "function" ? settlePizzaJob() : 1000;
        const elapsedMs = Math.max(0, (STATE.flags.pizzaDeliveredAtMs | 0) - (STATE.flags.pizzaStartMs | 0));
        const totalSec = (elapsedMs / 1000) | 0;
        const mm = ((totalSec / 60) | 0).toString();
        const ss = (totalSec % 60).toString().padStart(2, "0");
        playCoin();
        dialog.open([
          ["おつかれさま！"],
          [`${mm}:${ss}！がんばったね！`],
          ["これお給料ね！"],
          [`${reward}EN をもらった！`],
        ]);
      } else if (STATE.flags.pizzaAte) {
        if (typeof cancelPizzaJob === "function") cancelPizzaJob();
        dialog.open([["もー、なにしてんのー、だめだよー、たべちゃ。"]]);
      } else {
        if (typeof inventory?.getSnapshot === "function" && !inventory.getSnapshot().includes("pizza")) {
          inventory.addItem("pizza");
        }
        dialog.open([["はやくピザをとどけてきて！"]]);
      }
      return true;
    }

    dialog.open([
      ["あ、新しいバイトの人？"],
      ["今いそがしいから、これとどけてきて！"],
    ], () => {
      choice.open(["はい", "いいえ"], (idx) => {
        if (typeof choice.close === "function") choice.close();
        if (idx !== 0) {
          dialog.open([["またこんどな。"]]);
          return;
        }
        if (typeof startPizzaJob === "function") startPizzaJob();
        playConfirm();
        dialog.open([
          ["《ピザをわたされた。》"],
        ], null, "sign");
      }, "やる？");
    });
    return true;
  }

  if (ev.type === "afro_club") {
    const { dialog, achieveQuest } = ctx;
    if (STATE.headwear === "afro") {
      dialog.open([
        ["ワオ！君たちイケてるね！"],
        ["ついてきなよ！"],
      ], () => {
        playDoor();
        STATE.flags.ac1Gone = true;
        act.hidden = true;
        act.solid = false;
        act.talkHit = { x: 0, y: 0, w: 0, h: 0 };
      });
    } else {
      dialog.open([["ここはイケてるやつだけの秘密のクラブなのさ"]]);
    }
    return true;
  }

  if (ev.type === "afro_club_inside") {
    const { dialog, achieveQuest } = ctx;
    if (STATE.headwear === "afro") {
      dialog.open([["アフロクラブへようこそ。きみたちも今日から会員さ。"]], () => {
        if (!STATE.flags.afroClubJoined) {
          STATE.flags.afroClubJoined = true;
          if (typeof achieveQuest === "function") achieveQuest("19");
        }
      });
    } else {
      dialog.open([["・・・。"]], () => {
        dialog.open([["（むしされた。）"]], null, "sign");
      });
    }
    return true;
  }

  if (ev.type === "afro_club_inside_2") {
    const { dialog } = ctx;
    if (STATE.headwear === "afro") {
      dialog.open([
        ["いいねーキミタツィ。こっちおいでキミタツィ。"],
        ["さぁ、レヴィ＝ストロースの話でもしようじゃないかキミタツィ。"],
      ]);
    } else {
      dialog.open([["フッ。"]], () => {
        dialog.open([["（はなでわらわれた。）"]], null, "sign");
      });
    }
    return true;
  }

  if (ev.type === "afro_club_inside_3") {
    const { dialog } = ctx;
    if (STATE.headwear === "afro") {
      dialog.open([["ここはアフロヘアーでこむずかしい話をする、そういうクラヴなのサ。"]]);
    } else {
      dialog.open([["ケッ。"]], () => {
        dialog.open([["（つばをはかれた。）"]], null, "sign");
      });
    }
    return true;
  }

  if (ev.type === "afro_club_inside_4") {
    const { dialog, startAfloClubBlackout } = ctx;
    if (STATE.headwear === "afro") {
      dialog.open([["ここの電気って、切ったらどうなっちゃうんだろう。"]], () => {
        if (typeof startAfloClubBlackout === "function") startAfloClubBlackout();
      });
    } else {
      dialog.open([["・・・。"]], () => {
        dialog.open([["（こちらに気付かない。）"]], null, "sign");
      });
    }
    return true;
  }

  if (ev.type === "afro_club_inside_5") {
    const { dialog } = ctx;
    if (STATE.headwear === "afro") {
      dialog.open([["やぁ、新入りかい？ヨロシク！"]]);
    } else {
      dialog.open([["・・・。"]], () => {
        dialog.open([["（ちらりとみられた。）"]], null, "sign");
      });
    }
    return true;
  }

  if (ev.type === "timemachine_slot") {
    const { dialog, choice, hasItem, startTimemachineFx, lockInput, unlockInput } = ctx;
    if (STATE.flags.timeMachineStarted) {
      dialog.open([["つきのいしはピッタリとはまっている。"]], null, "sign");
      return true;
    }
    dialog.open([["なにかをおくばしょのようだ。"]], () => {
      if (typeof hasItem !== "function" || !hasItem("moon_stone")) return;
      choice.open(["はい", "いいえ"], (idx) => {
        if (idx !== 0) return;
        if (typeof lockInput === "function") lockInput();
        playClickOn();
        setTimeout(() => {
          if (typeof unlockInput === "function") unlockInput();
          dialog.open([["ぴったりとはまった！"]], () => {
            if (typeof startTimemachineFx === "function") {
              startTimemachineFx(() => {
                STATE.flags.timeMachineStarted = true;
                dialog.open([
                  ["すごいひかった。"],
                  ["なんだったのだろう。"],
                ], null, "sign");
              });
            }
          }, "sign");
        }, 2000);
      }, "つきのいしをおいてみますか？");
    });
    return true;
  }

  if (ev.type === "mori_girl") {
    const { dialog } = ctx;
    if (STATE.headwear === "helmet") {
      dialog.open([["ヘルメットだ。いいなあ。"]]);
    } else {
      dialog.open([
        ["そこにある穴とか、ヘルメットでもあればとびこんでやるのに。"],
        ["ワークメンにうってるかな。"],
      ]);
    }
    return true;
  }

  if (ev.type === "cactus_14") {
    const { dialog, achieveQuest } = ctx;
    if (STATE.flags.cactus14Talked || !STATE.flags.cactus14CanTalk) return true;
    STATE.flags.cactus14Talked = true;
    if (typeof achieveQuest === "function") achieveQuest("06");
    dialog.open([["やべ、サボってるのバレた。"]], () => {
      act.animMs  = 200; // 動き出す
      act.talkHit = { x: 0, y: 0, w: 0, h: 0 }; // 話しかけられなくなる
    });
    return true;
  }

  if (ev.type === "yahhy_jumprope") {
    const { dialog, jumprope, achieveQuest } = ctx;
    const greeting = ev.greeting || [["なわとびしようよ！"]];
    dialog.open(greeting, () => {
      jumprope.start((count) => {
        if (count >= 100 && typeof achieveQuest === "function") achieveQuest("17");
        let reward = 0;
        if      (count >= 50) reward = 2000;
        else if (count >= 20) reward =  500;
        else if (count >= 10) reward =  200;
        else if (count >=  3) reward =   50;
        STATE.money = Math.min(STATE.money + reward, 999999);
        const msg = reward > 0
          ? `${count}かい！  ${reward}EN もらった！`
          : count > 0 ? `${count}かい。` : `…。`;
        dialog.open([[msg]], null, "sign");
      });
    });
    return true;
  }

  if (ev.type === "d_sword_give") {
    const { dialog, inventory, achieveQuest } = ctx;
    if (STATE.flags.dSwordGave) {
      dialog.open([["……"]]);
    } else {
      STATE.flags.dSwordGave = true;
      inventory.addItem(ev.giveItem);
      act.img     = SPRITES.d_sword_off;
      act.animMs  = Infinity;
      act.talkHit = { x: 0, y: 0, w: 0, h: 0 };
      if (typeof achieveQuest === "function") achieveQuest("14");
      playItemJingle();
      dialog.open([["伝説の剣をてにいれた!!"]]);
    }
    return true;
  }

  if (ev.type === "keeper_talk") {
    const { dialog } = ctx;
    if (STATE.achievedQuests.size >= 20) {
      dialog.open([["いまがそのとき！"]]);
    } else {
      dialog.open([
        ["ここは、おまえがいつかくるばしょ。"],
        ["でもいまはまだ、そのときじゃねぇんだな。"],
      ]);
    }
    return true;
  }

  return false;
}
