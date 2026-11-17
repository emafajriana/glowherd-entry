// fireflies.js — the stray flock. Each firefly wanders on its own
// small whims, drifts toward its neighbours, and answers the
// keeper's light the way real strays answer a lantern: drawn to its
// rim, shy of its bright heart. That one rule is the whole herding
// game — stand off, and the flock gathers; push in, and it spills.

import { WORLD_W, WORLD_H, HORIZON_Y } from "./meadow.js";

const LIGHT_RING = 150;
const LIGHT_CORE = 62;

let glowSprite = null;

function makeGlowSprite() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 1, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,236,170,0.9)");
  grad.addColorStop(0.25, "rgba(255,214,110,0.42)");
  grad.addColorStop(1, "rgba(255,200,90,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export class Firefly {
  constructor(rng, x, y) {
    this.x = x;
    this.y = y;
    this.vx = rng.range(-24, 24);
    this.vy = rng.range(-16, 16);
    this.phase = rng.range(0, Math.PI * 2);
    this.wanderSeed = rng.range(0, 1000);
    this.jarred = false;
    this.gone = false;
    this.jarIndex = -1;
    this.jarDx = rng.range(-11, 11);
    this.jarDy = rng.range(-9, 5);
    this.twPhase = rng.range(0, Math.PI * 2);
    this.twSpeed = rng.range(1.4, 3.2);
  }
}

export class Flock {
  constructor(rng, count) {
    this.flies = [];
    for (let i = 0; i < count; i++) {
      const x = WORLD_W * 0.5 + rng.range(-380, 380);
      const y = HORIZON_Y - 60 + rng.range(-160, 190);
      this.flies.push(new Firefly(rng, x, y));
    }
    if (!glowSprite) glowSprite = makeGlowSprite();
  }

  freeFlies() {
    return this.flies.filter((f) => !f.jarred && !f.gone);
  }

  jarredFlies() {
    return this.flies.filter((f) => f.jarred);
  }

  jarredByJar() {
    const byJar = new Map();
    for (const fly of this.flies) {
      if (!fly.jarred) continue;
      if (!byJar.has(fly.jarIndex)) byJar.set(fly.jarIndex, []);
      byJar.get(fly.jarIndex).push(fly);
    }
    return byJar;
  }

  centroid() {
    const free = this.freeFlies();
    if (free.length === 0) return null;
    let x = 0;
    let y = 0;
    for (const fly of free) {
      x += fly.x;
      y += fly.y;
    }
    return { x: x / free.length, y: y / free.length };
  }

  scatter(cx, cy, radius, power) {
    for (const fly of this.flies) {
      if (fly.jarred || fly.gone) continue;
      const dx = fly.x - cx;
      const dy = fly.y - cy;
      const d = Math.hypot(dx, dy);
      if (d > radius || d === 0) continue;
      const push = power * (1 - d / radius);
      fly.vx += (dx / d) * push;
      fly.vy += (dy / d) * push;
    }
  }

  update(dt, t, keeper, windX) {
    const centre = this.centroid();
    for (const fly of this.flies) {
      if (fly.jarred || fly.gone) continue;
      // wander: two slow sine fields per fly, never the same path twice
      const wx = Math.sin(t * 0.9 + fly.wanderSeed) + Math.sin(t * 0.37 + fly.phase) * 0.7;
      const wy = Math.cos(t * 0.8 + fly.wanderSeed * 1.3) + Math.sin(t * 0.53 + fly.phase) * 0.7;
      fly.vx += wx * 26 * dt;
      fly.vy += wy * 20 * dt;
      // gentle cohesion toward the flock's middle
      if (centre) {
        fly.vx += (centre.x - fly.x) * 0.12 * dt;
        fly.vy += (centre.y - fly.y) * 0.12 * dt;
      }
      // the light: drawn to its rim, shy of its heart
      const dx = fly.x - keeper.x;
      const dy = fly.y - keeper.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < LIGHT_CORE) {
        const push = (LIGHT_CORE - d) * 6.2;
        fly.vx += (dx / d) * push * dt * 8;
        fly.vy += (dy / d) * push * dt * 8;
      } else if (d < LIGHT_RING) {
        const ringPull = (d - LIGHT_RING * 0.72) * 0.9;
        fly.vx -= (dx / d) * ringPull * dt;
        fly.vy -= (dy / d) * ringPull * dt;
        fly.vx *= 1 - 0.9 * dt;
        fly.vy *= 1 - 0.9 * dt;
      }
      // wind leans on everything that flies
      fly.vx += windX * dt;
      // soft bounds: the meadow's edges turn a stray back
      if (fly.x < 46) fly.vx += 130 * dt;
      if (fly.x > WORLD_W - 46) fly.vx -= 130 * dt;
      if (fly.y < 96) fly.vy += 110 * dt;
      if (fly.y > WORLD_H - 46) fly.vy -= 130 * dt;
      // speed clamp, then move
      const sp = Math.hypot(fly.vx, fly.vy);
      const max = 175;
      if (sp > max) {
        fly.vx = (fly.vx / sp) * max;
        fly.vy = (fly.vy / sp) * max;
      }
      fly.x += fly.vx * dt;
      fly.y += fly.vy * dt;
    }
  }

  tryCapture(jars) {
    const caught = [];
    for (const fly of this.flies) {
      if (fly.jarred || fly.gone) continue;
      const speed = Math.hypot(fly.vx, fly.vy);
      if (speed > 165) continue;
      for (const jar of jars) {
        const d = Math.hypot(fly.x - jar.captureX, fly.y - jar.captureY);
        if (d < 30) {
          fly.jarred = true;
          fly.jarIndex = jar.index;
          jar.lit += 1;
          caught.push(fly);
          break;
        }
      }
    }
    return caught;
  }

  draw(ctx, t) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const fly of this.flies) {
      if (fly.jarred || fly.gone) continue;
      const pulse = 0.75 + 0.25 * Math.sin(t * fly.twSpeed + fly.twPhase);
      const size = 30 * pulse;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(glowSprite, fly.x - size / 2, fly.y - size / 2, size, size);
    }
    ctx.globalCompositeOperation = "source-over";
    for (const fly of this.flies) {
      if (fly.jarred || fly.gone) continue;
      const pulse = 0.7 + 0.3 * Math.sin(t * fly.twSpeed + fly.twPhase);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#fff3c4";
      ctx.beginPath();
      ctx.arc(fly.x, fly.y, 2.1, 0, Math.PI * 2);
      ctx.fill();
      // wing shimmer: two faint strokes beating above the body
      const beat = Math.sin(t * 26 + fly.phase) * 2.4;
      ctx.strokeStyle = "rgba(230,240,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fly.x - 1, fly.y - 1);
      ctx.lineTo(fly.x - 4.4, fly.y - 3.6 - beat);
      ctx.moveTo(fly.x + 1, fly.y - 1);
      ctx.lineTo(fly.x + 4.4, fly.y - 3.6 - beat);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function nearestFreeFly(flock, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const fly of flock.flies) {
    if (fly.jarred || fly.gone) continue;
    const d = Math.hypot(fly.x - x, fly.y - y);
    if (d < bestD) {
      bestD = d;
      best = fly;
    }
  }
  return best;
}
