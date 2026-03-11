// party_followers.js
export function createFollowers({
  gap2 = 30,
  gap3 = 60,
  gap4 = 90,
  frameMs = 180,
  maxFoot = 4096,
} = {}) {
  const MAX_FOOT = maxFoot | 0;
  if ((MAX_FOOT & (MAX_FOOT - 1)) !== 0) throw new Error("maxFoot must be power of two");

  const foot = new Array(MAX_FOOT);
  let footW = 0;
  let footN = 0;
  let ready = false;

  function footPush(x, y) {
    foot[footW] = { x, y };
    footW = (footW + 1) & (MAX_FOOT - 1);
    if (footN < MAX_FOOT) footN++;
  }
  function footGetFromOldest(i) {
    const start = (footW - footN) & (MAX_FOOT - 1);
    return foot[(start + i) & (MAX_FOOT - 1)];
  }
  function followerTarget(gap) {
    const i = footN - 1 - gap;
    if (i < 0) return null;
    return footGetFromOldest(i);
  }

  function reset({ leader, p2, p3, p4 }) {
    if (!leader || !p2 || !p3 || !p4) throw new Error("reset requires leader,p2,p3,p4");

    footW = 0;
    footN = 0;
    for (let i = 0; i < gap4 + 8; i++) footPush(leader.x, leader.y);

    p2.x = p3.x = p4.x = leader.x;
    p2.y = p3.y = p4.y = leader.y;
    p2.frame = p3.frame = p4.frame = 0;

    ready = true;
  }

  function push(x, y) {
    footPush(x, y);
  }

  function stepFollower(t, gap, c) {
    const p = followerTarget(gap);
    if (!p) return;

    if (c.x !== p.x || c.y !== p.y) {
      c.x = p.x;
      c.y = p.y;
      if (t - (c.last | 0) > frameMs) {
        c.frame ^= 1;
        c.last = t;
      }
    } else {
      c.frame = 0;
    }
  }

  function update(t, { p2, p3, p4 }) {
    if (!ready) return;
    stepFollower(t, gap2, p2);
    stepFollower(t, gap3, p3);
    stepFollower(t, gap4, p4);
  }

  return {
    isReady: () => ready,
    reset,
    push,
    update,
  };
}