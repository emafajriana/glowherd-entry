// moths.js — the moon-moths. They slide in from the dark edges of
// the meadow, fix on the nearest stray, and dive. A moth that reaches
// a firefly eats it and leaves; a moth that dives into the lantern's
// bright heart singes its wings and flees. Between the two, the
// keeper's moving light is the flock's only fence.

import { WORLD_W } from "./meadow.js";
import { LIGHT_CORE } from "./keeper.js";
import { nearestFreeFly } from "./fireflies.js";

const MOTH_SPEED = 128;

export class Moth {
  constructor(rng, fromLeft) {
    this.x = fromLeft ? -30 : WORLD_W + 30;
    this.y = rng.range(120, 420);
    this.vx = 0;
    this.vy = 0;
    this.state = "hunt"; // hunt | flee | satiated
    this.wingPhase = rng.range(0, Math.PI * 2);
    this.scatterAt = 0;
    this.dead = false;
    this.singeFx = 0;
  }
}

export class MothFlight {
  constructor() {
    this.moths = [];
    this.timer = 0;
  }

  reset(every, max) {
    this.moths = [];
    this.timer = every > 0 ? every * 0.55 : 0;
    this.every = every;
    this.max = max;
  }

  update(dt, t, rng, flock, keeper, events) {
    // arrivals
    if (this.every > 0 && this.moths.filter((m) => m.state === "hunt").length < this.max) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = this.every * rng.range(0.8, 1.25);
        this.moths.push(new Moth(rng, rng.chance(0.5)));
        events.push({ type: "mothArrives" });
      }
    }
    const centre = flock.centroid();
    for (const moth of this.moths) {
      if (moth.dead) continue;
      moth.wingPhase += dt * 16;
      if (moth.singeFx > 0) moth.singeFx -= dt;
      if (moth.state === "hunt") {
        const prey = nearestFreeFly(flock, moth.x, moth.y);
        if (!prey) {
          moth.state = "flee";
          continue;
        }
        const dx = prey.x - moth.x;
        const dy = prey.y - moth.y;
        const d = Math.hypot(dx, dy) || 1;
        moth.vx += ((dx / d) * MOTH_SPEED - moth.vx) * Math.min(1, dt * 2.4);
        moth.vy += ((dy / d) * MOTH_SPEED - moth.vy) * Math.min(1, dt * 2.4);
        // the dive worries the flock: a near moth scatters what it nears
        if (centre && t >= moth.scatterAt) {
          const dc = Math.hypot(centre.x - moth.x, centre.y - moth.y);
          if (dc < 110) {
            flock.scatter(moth.x, moth.y, 105, 120);
            moth.scatterAt = t + 0.6;
            events.push({ type: "scatter" });
          }
        }
        // caught one
        if (d < 15) {
          prey.gone = true;
          moth.state = "satiated";
          events.push({ type: "eaten", x: prey.x, y: prey.y });
          continue;
        }
        // the bright heart singes
        const dk = Math.hypot(keeper.x - moth.x, keeper.y - moth.y);
        if (dk < LIGHT_CORE - 6) {
          moth.state = "flee";
          moth.singeFx = 0.5;
          events.push({ type: "singed", x: moth.x, y: moth.y });
        }
      } else {
        // flee or satiated: rise and leave by the nearest edge
        const away = moth.x < WORLD_W / 2 ? -1 : 1;
        moth.vx += (away * 190 - moth.vx) * Math.min(1, dt * 2);
        moth.vy += (-95 - moth.vy) * Math.min(1, dt * 2);
        if (moth.x < -50 || moth.x > WORLD_W + 50 || moth.y < -40) moth.dead = true;
      }
      moth.x += moth.vx * dt;
      moth.y += moth.vy * dt;
    }
    this.moths = this.moths.filter((m) => !m.dead);
  }

  clapRepel(keeper) {
    let repelled = 0;
    for (const moth of this.moths) {
      const d = Math.hypot(moth.x - keeper.x, moth.y - keeper.y);
      if (moth.state === "hunt" && d < 185) {
        moth.state = "flee";
        moth.singeFx = 0.3;
        repelled++;
      }
    }
    return repelled;
  }

  huntingCount() {
    return this.moths.filter((m) => m.state === "hunt").length;
  }

  draw(ctx, t) {
    for (const moth of this.moths) {
      const flap = Math.sin(moth.wingPhase) * 0.55;
      ctx.save();
      ctx.translate(moth.x, moth.y);
      const heading = Math.atan2(moth.vy, moth.vx);
      ctx.rotate(Math.max(-0.6, Math.min(0.6, heading * 0.4)));
      // wings: two pale fans beating
      ctx.fillStyle = moth.state === "hunt" ? "rgba(216,208,238,0.85)" : "rgba(190,180,215,0.7)";
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.rotate(side * (0.5 + flap * 0.5));
        ctx.beginPath();
        ctx.ellipse(side * 11, -3, 12, 5.4, side * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // body
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 4.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#4a4266";
      ctx.fill();
      // eyes
      ctx.fillStyle = "#ffd9d9";
      ctx.beginPath();
      ctx.arc(6.4, -1.4, 1.3, 0, Math.PI * 2);
      ctx.arc(6.4, 1.6, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // singe sparkles
      if (moth.singeFx > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = moth.singeFx * 1.6;
        ctx.fillStyle = "#ffca7a";
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + t * 9;
          const r = 12 + (0.5 - moth.singeFx) * 26;
          ctx.beginPath();
          ctx.arc(moth.x + Math.cos(a) * r, moth.y + Math.sin(a) * r, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }
}
