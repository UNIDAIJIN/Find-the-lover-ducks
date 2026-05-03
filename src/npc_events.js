// npc_events.js
import { STATE } from "./state.js";
import { SPRITES } from "./sprites.js";
import { ALL_ITEM_IDS } from "./items.js";
import { playCooking, playIndianJingle, playItemJingle, playInnJingle, playJaws, stopJaws, playCrush, playConfirm, playCoin, playDoor, playClickOn, playTimeMachineShine, playDadaan } from "./se.js";

export function runNpcEvent(act, ctx) {
  const ev = act?.event;
  if (!ev || !ev.type) return false;
  if (act._eventBusy) return true;

  if (ev.type === "double_door") {
    playDoor();
    setTimeout(playDoor, 320);
    return true;
  }

  if (ev.type === "mizugi_couple") {
    const { dialog, lockInput, unlockInput } = ctx;
    dialog.open([["いとしいなぁ、"]], () => {
      if (typeof lockInput === "function") lockInput();
      setTimeout(() => {
        if (typeof unlockInput === "function") unlockInput();
        dialog.open([["いとしいねぇ、"]], () => {
          if (typeof lockInput === "function") lockInput();
          setTimeout(() => {
            if (typeof unlockInput === "function") unlockInput();
            dialog.open([["あ、虹。"]]);
          }, 3000);
        });
      }, 1000);
    });
    return true;
  }

  if (ev.type === "phone_brawl") {
    const { dialog, startPhoneBrawl } = ctx;
    const start = () => {
      if (typeof startPhoneBrawl === "function") {
        startPhoneBrawl(ev.onDone, { playerDeckIds: ev.playerDeckIds });
      }
    };
    if (dialog && ev.introPages) dialog.open(ev.introPages, start, ev.talkType || "talk");
    else start();
    return true;
  }

  if (ev.type === "yes_no_dialog") {
    const { choice, dialog, inventory } = ctx;
    const introPages = ev.introPages || [["……"]];
    const question = ev.question || "……";
    const options = ev.options || ["はい", "いいえ"];
    if (ev.afterReturnFlag && STATE.flags[ev.afterReturnFlag] && ev.afterReturnPages) {
      dialog.open(ev.afterReturnPages, null, ev.talkType || "talk");
      return true;
    }
    if (ev.giveOnceFlag && STATE.flags[ev.giveOnceFlag] && ev.afterGivePages) {
      dialog.open(ev.afterGivePages, null, ev.talkType || "talk");
      return true;
    }
    const giveItem = () => {
      if (!ev.giveItem || !inventory) return;
      if (ev.giveOnceFlag && STATE.flags[ev.giveOnceFlag]) return;
      if (ev.giveOnceFlag) STATE.flags[ev.giveOnceFlag] = true;
      inventory.addItem(ev.giveItem);
      playItemJingle();
      dialog.open(ev.givePages || [[`${ev.giveItemName || ev.giveItem}を手に入れた。`]], null, ev.talkType || "sign");
    };
    const openCommon = () => {
      const commonPages = ev.commonPages || [];
      if (commonPages.length) dialog.open(commonPages, giveItem, ev.talkType || "talk");
      else giveItem();
    };
    dialog.open(introPages, () => {
      choice.open(options, (idx) => {
        if (typeof choice.close === "function") choice.close();
        const pages = idx === 0 ? ev.onYes : ev.onNo;
        if (pages && pages.length) dialog.open(pages, openCommon, ev.talkType || "talk");
        else openCommon();
      }, question);
    }, ev.talkType || "talk");
    return true;
  }

  if (ev.type === "love_song") {
    const {
      dialog,
      fade,
      inventory,
      nowMs,
      lockInput,
      unlockInput,
      hasItem,
      getNpcByName,
      endInteraction,
    } = ctx;
    const snackItem = ev.snackItem || "love_song_snack";
    const introPages = act.talkPages || [["わがはいはねこである。"], ["なまえはラブソング。"]];
    if (typeof hasItem !== "function" || !hasItem(snackItem) || STATE.flags.loveSongReturned) {
      dialog.open(introPages);
      return true;
    }

    dialog.open(introPages, () => {
      if (inventory) inventory.removeItem(snackItem);
      dialog.open([["ラブソングのおやつをあげた。"]], () => {
        dialog.open([
          ["これはわがはいのおやつだ。"],
          ["かえるにゃ。"],
        ], () => {
          if (typeof lockInput === "function") lockInput();
          const t = typeof nowMs === "function"
            ? nowMs()
            : (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
          fade.startCutFade(t, {
            outMs: 400,
            holdMs: 250,
            inMs: 500,
            onBlack: () => {
              STATE.flags.loveSongReturned = true;
              const hawaii = typeof getNpcByName === "function" ? getNpcByName("hawaii") : null;
              act.x = (hawaii?.x ?? 1828) + 18;
              act.y = hawaii?.y ?? 2475;
            },
            onEnd: () => {
              if (typeof unlockInput === "function") unlockInput();
              if (typeof endInteraction === "function") endInteraction();
            },
          });
        });
      }, "sign");
    });
    return true;
  }

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

    const introPages = ev.introPages || [[ev.lines?.[0] ?? "……"]];
    const question = ev.question || ev.lines?.[1] || "……";
    const options = ev.options || ["はい", "いいえ"];

    if (typeof dialog.onPageChange === "function") dialog.onPageChange(null);
    if (typeof dialog.onTypingDone === "function") dialog.onTypingDone(null);

    const curLevel = (STATE.flags.skinLevel | 0);

    // 最大段階ならセリフだけ
    if (curLevel >= 2) {
      dialog.open(ev.onMaxLevelPages || [["おまえたち、かがやいてるぜ!!"]]);
      return true;
    }

    const nextLevel = curLevel + 1;
    const suffix    = nextLevel === 1 ? "_t1" : "_t2";

    dialog.open(introPages, () => {
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
                  dialog.open(ev.onYesDonePages || [["いいじゃないか、にあってるぜ。"]]);
                }, 2000);
              },
            });
          }, "talk", ev.finalAutoMs ?? 3000);
        } else {
          dialog.open(ev.onNoDialog || [["……"]]);
        }
      }, question);
    });

    return true;
  }

  if (ev.type === "ura_yahhy_shop") {
    const { choice, dialog, fade, nowMs, stopBgm, startTrip, startGoodTrip, isTripActive } = ctx;

    if ((typeof isTripActive === "function" && isTripActive()) || STATE.flags.uraYahhyCooking) {
      dialog.open([["ほぴょぴょぴょーーー。"]]);
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
      dialog.open([["アイヨー、チョットマッテネ。"]], () => {
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
              [["オマタセアルー。"]],
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
      dialog.open([["ケー、キモキモ、ヒヤカシアル。"]]);
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
      }, "「ぐねぐねサバカレー」二スルカ？");
    }

    cleanup();
    dialog.open([
      ["オニイサン、オネエサン、イイトコキタネー。"],
      ["ココ、ウラノカレーショップ「ウラケチャパグ」アルヨー。"],
      ["イマ「ぐねぐねサバカレー」「ぎらぎらチキンカレー」ネ。"],
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

  if (ev.type === "start_diving") {
    const { startDiving } = ctx;
    if (typeof startDiving === "function") startDiving();
    return true;
  }

  if (ev.type === "hyoryu_lang") {
    const { dialog, choice } = ctx;
    if (STATE.flags.hyoryuLang === "ja") {
      dialog.open([["ハーイ！私は漂流者です。"]], () => {
        choice.open(["はい", "いいえ"], (sel) => {
          if (sel === 0) delete STATE.flags.hyoryuLang;
        }, "あなたは日本語はなせますか？");
      }, "talk");
    } else {
      dialog.open([["Hi! I am a drifter."]], () => {
        choice.open(["Yes", "No"], (sel) => {
          if (sel === 0) STATE.flags.hyoryuLang = "ja";
        }, "Can you speak English?");
      }, "talk");
    }
    return true;
  }

  if (ev.type === "dream_talk") {
    const { dialog, choice } = ctx;
    choice.open(["はい", "いいえ"], (sel) => {
      if (sel === 0) {
        dialog.open([
          ["どこかに埋蔵金が埋まってるらしいんだ！"],
          ["大きな木が６本はえてる場所のまんなか近くだって！"],
          ["木をさがすならって森にきてみたけど、どこだろう。"],
        ]);
      } else {
        dialog.open([["ふーん。きっとこうかいするよ。"]]);
      }
    }, "ゆめでみたんだ！ききたいか？");
    return true;
  }

  if (ev.type === "pizza_shop") {
    const { dialog, choice, startPizzaJob, settlePizzaJob, cancelPizzaJob, inventory } = ctx;
    if (STATE.flags.pizzaJobActive) {
      if (STATE.flags.pizzaDelivered) {
        const elapsedMs = Math.max(0, (STATE.flags.pizzaDeliveredAtMs | 0) - (STATE.flags.pizzaStartMs | 0));
        const sec = (elapsedMs / 1000) | 0;
        const speedLine = sec <= 30 ? "すごくはやいね！"
                        : sec <= 60 ? "はやかったね！"
                        : sec <= 120 ? "まあまあだね！"
                        : sec <= 180 ? "もうちょっとがんばって！"
                        : "ちょっとおそい！";
        const reward = typeof settlePizzaJob === "function" ? settlePizzaJob() : 1000;
        playCoin();
        dialog.open([
          ["おつかれさま！"],
          [speedLine],
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
      ["今いそがしいからこれとどけてきて！"],
    ], () => {
      if (typeof startPizzaJob === "function") startPizzaJob();
      playConfirm();
      dialog.open([
        ["ピザをわたされた。"],
      ], null, "sign");
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
    const { dialog, jumprope, achieveQuest, choice, beginInteraction, endInteraction, letterbox } = ctx;
    const startJumprope = () => {
      choice.open(["はい", "いいえ"], (sel) => {
        if (sel !== 0) {
          dialog.open([["いってらっしゃい！"]], null, "sign");
          return;
        }
        if (typeof endInteraction === "function") endInteraction();
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
          if (typeof beginInteraction === "function") beginInteraction();
          if (letterbox && typeof letterbox.snapAuto === "function") letterbox.snapAuto(true);
          dialog.open([[msg]], null, "sign");
        });
      }, "なわとびしていく？");
    };

    if (!STATE.flags.yahhyJumpropeExplained) {
      STATE.flags.yahhyJumpropeExplained = true;
      dialog.open([
        ["なわとびのアルバイト、なわとびのアルバイトだよー。"],
      ], startJumprope);
    } else {
      startJumprope();
    }
    return true;
  }

  if (ev.type === "cdshop_rental") {
    const { dialog, shop, achieveQuest } = ctx;

    if (STATE.flags.cdshopRentalPaid) {
      const SONGS = [
        { id: "cd_song_01", name: "にじいろのまち",              file: "bgm0.mp3"        },
        { id: "cd_song_02", name: "バニラアイスはお好き？",       file: "bgm_select.mp3"  },
        { id: "cd_song_03", name: "アスファルトの夢",            file: "duckA.mp3"       },
        { id: "cd_song_04", name: "あのことリコーダー",          file: "duckB.mp3"       },
        { id: "cd_song_05", name: "冒険の書を捨てよ",            file: "duckC.mp3"       },
        { id: "cd_song_06", name: "fromギャル部屋ラヂオ",        file: "duckD.mp3"       },
        { id: "cd_song_07", name: "落下点",                       file: "duckE.mp3"       },
        { id: "cd_song_08", name: "オルカライド！",              file: "duckF.mp3"       },
        { id: "cd_song_09", name: "バッドトリップ",              file: "duckG-bad.mp3"   },
        { id: "cd_song_10", name: "グッドトリップ",              file: "duckG-good.mp3"  },
        { id: "cd_song_11", name: "のんびりのんびり、",          file: "duckH.mp3"       },
        { id: "cd_song_12", name: "プールサイドダンサー",        file: "duckI.mp3"       },
        { id: "cd_song_13", name: "きみは死んでしまった。",       file: "duckJ.mp3"       },
        { id: "cd_song_14", name: "ネバーエンディング",          file: "bgm_end.mp3"     },
      ];
      const musicItems = SONGS.map((s) => ({ id: s.id, name: s.name, price: 2000 }));

      const showMusicShop = (initialCursor = 0) => {
        shop.open(musicItems, "やめる", "ビデオ・ギャラクシー", (id, savedCursor) => {
          if (id === null) {
            dialog.open([["まいどあり！"]]);
            return;
          }
          const song = SONGS.find((s) => s.id === id);
          if (song) {
            const a = document.createElement("a");
            a.href = "assets/audio/" + song.file;
            a.download = song.file;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          playCoin();
          showMusicShop(savedCursor ?? 0);
        }, initialCursor);
      };

      dialog.open([["ヨォ！おまえらじゃん！"]], () => {
        showMusicShop();
      });
      return true;
    }

    const items = [{ id: "cdshop_rental_fee", name: "レンタル延滞料", price: 999999 }];

    dialog.open([
      ["あ！オイ！"],
      ["おまえら！"],
      ["はやくアルマゲドンかえせよ！"],
      ["何年借りてんだよ！"],
    ], () => {
      shop.open(items, "やめる", "ビデオ・ギャラクシー", (id) => {
        if (id === "cdshop_rental_fee") {
          STATE.flags.cdshopRentalPaid = true;
          playCoin();
          dialog.open([
            ["うお！やるじゃんおまえら！"],
            ["まさか払い切ると思ってなかったぜ。"],
          ], () => {
            if (typeof achieveQuest === "function") achieveQuest("25");
          });
        } else {
          dialog.open([["地の果てまでおってやるからな！"]]);
        }
      });
    });

    return true;
  }

  if (ev.type === "moritasaki_gift") {
    const { dialog, inventory, choice } = ctx;
    choice.open(["はい", "いいえ"], (sel) => {
      STATE.money = Math.min((STATE.money | 0) + 100000, 999999);
      if (sel === 0) {
        for (const id of ALL_ITEM_IDS) inventory.addItem(id);
        playItemJingle();
        dialog.open([["100000EN と すべてのアイテムを てにいれた！"]], null, "sign");
      } else {
        playItemJingle();
        dialog.open([["100000EN を てにいれた！"]], null, "sign");
      }
    }, "アイテムいりますか？");
    return true;
  }

  if (ev.type === "kingyobachi_san_give") {
    const { dialog, inventory, startDiving, lockInput, unlockInput } = ctx;
    if (STATE.flags.kingyobachiSanGave) {
      dialog.open([["肺いっぱいに空気を入れるんだ。"]], () => {
        startDiving(() => {
          dialog.open([["空気たのしんでる？"]]);
        });
      });
    } else {
      dialog.open([
        ["ヨヨヨよ。オレが見えるのか。"],
        ["そんなきみたちにプレゼントだ。"],
      ], () => {
        STATE.flags.kingyobachiSanGave = true;
        inventory.addItem(ev.giveItem);
        playItemJingle();
        dialog.open([["きんぎょばちを手に入れた。"]], () => {
          if (typeof lockInput === "function") lockInput();
          setTimeout(() => {
            if (typeof unlockInput === "function") unlockInput();
            dialog.open([
              ["ところで。"],
              ["はやくこれをかぶってダイビングしたい！うずうずするぜ！"],
              ["そういう顔だな。"],
              ["あせるなよ。"],
              ["肺いっぱいに空気を入れるんだ。"],
            ], () => {
              startDiving(() => {
                dialog.open([["空気たのしんでる？"]]);
              });
            });
          }, 1000);
        }, "sign");
      });
    }
    return true;
  }

  if (ev.type === "sogankyo") {
    const { choice, dialog, fade, nowMs, startKakoMovie, lockInput, unlockInput } = ctx;
    choice.open(["はい", "いいえ"], (idx) => {
      if (typeof choice.close === "function") choice.close();
      if (idx !== 0) return;
      if (STATE.money < 100) {
        dialog.open([["おかねがたりません。"]], null, "sign");
        return;
      }
      STATE.money -= 100;
      playCoin();
      if (typeof lockInput === "function") lockInput();
      setTimeout(() => {
        if (typeof unlockInput === "function") unlockInput();
        fade.startCutFade(nowMs(), {
          outMs: 600, holdMs: 1200, inMs: 800,
          onBlack: () => startKakoMovie(),
        });
      }, 800);
    }, "100ENをいれてください。", { instant: true });
    return true;
  }

  if (ev.type === "spacesisters_warp") {
    const { dialog, startSpaceWarp } = ctx;
    const pages = STATE.flags.spacesistersWarped
      ? [["それじゃいってみよう！"], ["グッドバイブレーション！"]]
      : [["ワレワレハ、宇宙人ダ。"], ["なーんてね、ふふ。"], ["よくきたね。"], ["ぼくらは君たちが来るのをずっと待ってたのさ。"], ["つまりは、そうだな。"], ["君たちを、宇宙にご招待さ！"]];
    dialog.open(pages, () => {
      STATE.flags.spacesistersWarped = true;
      startSpaceWarp();
    }, "talk", 0, { highlights: [{ text: "グッドバイブレーション！", rainbow: true }] });
    return true;
  }

  if (ev.type === "spacesisters_hit") {
    const { dialog } = ctx;
    const UFO_SEQ_LEN = 8;
    dialog.open([["あたり！"]], () => {
      playTimeMachineShine();
      act.vanishStart = performance.now();
      act.solid = false;
      act.talkHit = { x: 0, y: 0, w: 0, h: 0 };
      STATE.flags.ufoStep = (STATE.flags.ufoStep || 0) + 1;
      if (STATE.flags.ufoStep >= UFO_SEQ_LEN) {
        STATE.flags.ufoComplete = true;
      }
    });
    return true;
  }

  if (ev.type === "d_sword_give") {
    const { dialog, inventory, achieveQuest, triggerWhiteFlash } = ctx;
    if (STATE.flags.dSwordGave) {
      dialog.open([["……"]]);
    } else {
      STATE.flags.dSwordGave = true;
      inventory.addItem(ev.giveItem);
      act.img     = SPRITES.d_sword_off;
      act.animMs  = Infinity;
      act.talkHit = { x: 0, y: 0, w: 0, h: 0 };
      if (typeof triggerWhiteFlash === "function") triggerWhiteFlash(700);
      playItemJingle();
      dialog.open([["伝説の剣をてにいれた!!"]]);
      if (typeof achieveQuest === "function") setTimeout(() => achieveQuest("14"), 1000);
    }
    return true;
  }

  if (ev.type === "keeper_talk") {
    const { dialog } = ctx;
    if (STATE.achievedQuests.size >= 20) {
      dialog.open([["いまがそのとき！"]]);
    } else {
      dialog.open([
        ["ここはおまえがいつかくるばしょだ。"],
        ["でもいまはまだそのときじゃねぇんだな。"],
      ]);
    }
    return true;
  }

  if (ev.type === "factry_minami") {
    const { dialog, choice, lockInput, unlockInput, startShake } = ctx;
    const hl = [{ text: "超銀河魔王", color: "#f44" }];

    dialog.setVoice("m_mid");
    STATE.flags.galaxyMaou2 = true;
    if (STATE.flags.galaxyLastBattle) {
      dialog.open([["いってこい！死ぬなよ！"]], null, "talk");
      return true;
    }
    act._eventBusy = true;
    dialog.open([
      ["おつかれさん！おもったよりはやかったな！"],
      ["見ろ！"],
      ["メカナツミ量産型！エヌツーだ！"],
    ], () => {
          dialog.open([
            ["圧巻だろう！この時のために以前より準備を進めていたのだ！"],
              ["さぁこいつらをつれていけ！"],
            ], () => {
              function askChoice() {
                choice.open(["はい", "いいえ"], (idx) => {
                  if (typeof choice.close === "function") choice.close();
                  if (idx === 0) {
                    dialog.open([
                      ["よし！そう言うとおもっていた！"],
                      ["概要の説明のために宇宙人の皆様にもきていただいたのだ。"],
                      ["では説明をよろしく。"],
                    ], () => {
                      const ss2 = ctx.getNpcByName("factry_ss2");
                      if (ss2) {
                        playClickOn();
                        const jumpDur = 350;
                        const jumpH = 12;
                        const baseY = ss2.y;
                        const startMs = Date.now();
                        if (typeof lockInput === "function") lockInput();
                        const jumpInterval = setInterval(() => {
                          const p = Math.min((Date.now() - startMs) / jumpDur, 1);
                          ss2.y = baseY - Math.sin(p * Math.PI) * jumpH;
                          if (p >= 1) {
                            clearInterval(jumpInterval);
                            ss2.y = baseY;
                            setTimeout(() => {
                              if (typeof unlockInput === "function") unlockInput();
                              dialog.setVoice("s_hi");
                              dialog.open([
                                ["それでは、ブリーフィン！"],
                                ["ぼくはわかってたよ。"],
                                ["ずっと超銀河魔王って？って顔してたでしょ。"],
                              ], () => {
                                if (typeof lockInput === "function") lockInput();
                                setTimeout(() => {
                                  if (typeof unlockInput === "function") unlockInput();
                                  dialog.open([
                                    ["よけいなこと考えなくていいの！"],
                                    ["とにかく、"],
                                    ["今、超銀河魔王は長い眠りから復活した。"],
                                    ["そしてやつは過去の宇宙から攻撃を仕掛けてくるつもりなのさ。"],
                                    ["ぼくたちはそれをとめるためにやってきた。"],
                                    ["さぁ、いっしょにいこう。"],
                                    ["まずは、ぼくらと過去に渡り、"],
                                    ["それから宇宙に飛ぶのさ。"],
                                    ["きみたちにはその力がもうあるはずさ。"],
                                  ], () => {
                                    function doYes() {
                                      dialog.open([
                                        ["それじゃ、先に行ってるからね。"],
                                        ["過去で会おう。"],
                                        ["バァイ！"],
                                      ], () => {
                                        playTimeMachineShine();
                                        const now = performance.now();
                                        const ss1 = ctx.getNpcByName("factry_ss1");
                                        const ss2b = ctx.getNpcByName("factry_ss2");
                                        const ss3 = ctx.getNpcByName("factry_ss3");
                                        [ss1, ss2b, ss3].forEach(s => {
                                          if (!s) return;
                                          s.vanishStart = now;
                                          s.solid = false;
                                          s.talkHit = { x: 0, y: 0, w: 0, h: 0 };
                                        });
                                        STATE.flags.galaxyLastBattle = true;
                                        dialog.setVoice("default");
                                        act._eventBusy = false;
                                      }, "talk");
                                    }
                                    choice.open(["はい", "いいえ"], (idx2) => {
                                      if (typeof choice.close === "function") choice.close();
                                      if (idx2 === 0) {
                                        doYes();
                                      } else {
                                        dialog.open([
                                          ["ばかだな、はいって言っておけばいいのさ。"],
                                        ], () => {
                                          doYes();
                                        }, "talk");
                                      }
                                    }, "わかるね？", { highlights: hl });
                                  }, "talk", 0, { highlights: hl });
                                }, 1000);
                              }, "talk", 0, { highlights: hl });
                            }, 1000);
                          }
                        }, 16);
                      }
                    }, "talk");
                    return;
                  }
                  dialog.open([
                    ["ダメだ！レーベルの契約書に書いてあっただろう！"],
                    ["超銀河魔王復活の際、乙はこれを打倒し地球の平和を守る。"],
                    ["ちゃんと読んでいないおまえたちがわるい！"],
                  ], () => {
                    askChoice();
                  }, "talk", 0, { highlights: hl });
                }, "超銀河魔王を倒すんだ！", { highlights: hl });
              }
              askChoice();
            }, "talk", 0, { highlights: hl });
    }, "talk");
    return true;
  }

  if (ev.type === "kako_sisters_warp") {
    const { dialog, getNpcByName, startSpaceWarp, lockInput, unlockInput } = ctx;
    act._eventBusy = true;
    const ss = ["kako_ss1", "kako_ss2", "kako_ss3"].map(n => getNpcByName(n)).filter(Boolean);
    ss.forEach(s => { if (s) s._eventBusy = true; });
    if (typeof lockInput === "function") lockInput();
    let i = 0;
    function jumpNext() {
      if (i >= ss.length) {
        setTimeout(() => {
          if (typeof unlockInput === "function") unlockInput();
          dialog.setVoice("s_hi");
          dialog.open([
            ["いこう！さいごのぼうけんだ！"],
            ["グッドバイブレーション！"],
          ], () => {
            startSpaceWarp("space_boss");
          }, "talk", 0, { highlights: [{ text: "グッドバイブレーション！", rainbow: true }] });
        }, 300);
        return;
      }
      const s = ss[i];
      playClickOn();
      const baseY = s.y;
      const startMs = Date.now();
      const interval = setInterval(() => {
        const p = Math.min((Date.now() - startMs) / 350, 1);
        s.y = baseY - Math.sin(p * Math.PI) * 12;
        if (p >= 1) {
          clearInterval(interval);
          s.y = baseY;
          i++;
          setTimeout(jumpNext, 150);
        }
      }, 16);
    }
    jumpNext();
    return true;
  }

  return false;
}
