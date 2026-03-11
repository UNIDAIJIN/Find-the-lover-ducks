// party_followers.js
// Followers trail the leader by a fixed *pixel distance* along their path,
// so diagonal/cardinal speed transitions never cause jitter.
export function createFollowers({
  gap2 = 30,
  gap3 = 60,
  gap4 = 90,
  frameMs = 180,
  maxFoot = 4096,
} = {}) {
  const MAX = maxFoot | 0;
  if ((MAX & (MAX - 1)) !== 0) throw new Error("maxFoot must be power of two");

  // Ring buffer storing trail points and their cumulative distances.
  const xs = new Float32Array(MAX);
  const ys = new Float32Array(MAX);
  const ds = new Float32Array(MAX); // cumulative distance at each entry
  let w = 0;         // write index (next slot)
  let n = 0;         // number of valid entries
  let totalDist = 0; // cumulative distance of the newest entry
  let ready = false;

  // Index of entry i steps back from newest (0 = newest).
  function ri(i) { return (w - 1 - i + MAX) & (MAX - 1); }

  function footPush(x, y) {
    if (n > 0) {
      const prev = ri(0);
      const ddx = x - xs[prev], ddy = y - ys[prev];
      totalDist += Math.sqrt(ddx * ddx + ddy * ddy);
    }
    xs[w] = x; ys[w] = y; ds[w] = totalDist;
    w = (w + 1) & (MAX - 1);
    if (n < MAX) n++;
  }

  // Return interpolated {x,y} at cumulative distance targetD along the trail.
  function trailAt(targetD) {
    if (n === 0) return null;
    // Scan newest→oldest (descending dist) to find the straddle pair.
    for (let i = 0; i < n; i++) {
      const a = ri(i);
      if (ds[a] <= targetD) {
        if (i === 0) return { x: xs[a], y: ys[a] };
        const b = ri(i - 1); // newer entry (ds[b] > targetD)
        const span = ds[b] - ds[a];
        if (span < 0.0001) return { x: xs[a], y: ys[a] };
        const t = (targetD - ds[a]) / span;
        return { x: xs[a] + t * (xs[b] - xs[a]), y: ys[a] + t * (ys[b] - ys[a]) };
      }
    }
    // targetD is older than the whole buffer — clamp to oldest entry.
    const old = ri(n - 1);
    return { x: xs[old], y: ys[old] };
  }

  function reset({ leader, p2, p3, p4 }) {
    if (!leader || !p2 || !p3 || !p4) throw new Error("reset requires leader,p2,p3,p4");
    w = 0; n = 0; totalDist = 0;
    // Pre-fill so followers start at leader position (all same point → dist stays 0).
    for (let i = 0; i < gap4 + 8; i++) {
      xs[w] = leader.x; ys[w] = leader.y; ds[w] = 0;
      w = (w + 1) & (MAX - 1); n++;
    }
    p2.x = p3.x = p4.x = leader.x;
    p2.y = p3.y = p4.y = leader.y;
    p2.frame = p3.frame = p4.frame = 0;
    ready = true;
  }

  function push(x, y) {
    footPush(x, y);
  }

  function stepFollower(t, gapPx, c) {
    const p = trailAt(totalDist - gapPx);
    if (!p) return;
    const moved = c.x !== p.x || c.y !== p.y;
    c.x = p.x;
    c.y = p.y;
    if (moved) {
      if (t - (c.last | 0) > frameMs) { c.frame ^= 1; c.last = t; }
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
