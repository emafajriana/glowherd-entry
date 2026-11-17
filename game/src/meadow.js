// meadow.js — the field itself: night sky, stars, the moon, two hill
// ridges, grass that leans with the wind, and the glass jars waiting
// to be filled with light. A meadow is grown once from a seed and
// then only drawn, so a screenshot scene and a played night agree.

export const WORLD_W = 1280;
export const WORLD_H = 720;
export const HORIZON_Y = 468;
export const GROUND_Y = 648;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function mixHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bch = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bch})`;
}

function ridgePoints(rng, baseY, amp, count) {
  const pts = [];
  for (let i = 0; i <= count; i++) {
    pts.push({
      x: (WORLD_W / count) * i,
      y: baseY + Math.sin(i * 1.7 + rng.range(0, 3)) * amp + rng.range(-amp * 0.4, amp * 0.4),
    });
  }
  return pts;
}

export class Jar {
  constructor(x, index) {
    this.x = x;
    this.y = GROUND_Y;
    this.index = index;
    this.lit = 0;
    this.mouthY = this.y - 34;
  }

  get captureX() {
    return this.x;
  }

  get captureY() {
    return this.mouthY + 6;
  }
}

export class Meadow {
  constructor(rng, palette, jarCount) {
    this.palette = palette;
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: rng.range(0, WORLD_W),
        y: rng.range(0, HORIZON_Y - 60),
        r: rng.range(0.5, 1.7),
        tw: rng.range(0, Math.PI * 2),
        speed: rng.range(0.4, 1.4),
      });
    }
    this.hillsFar = ridgePoints(rng, HORIZON_Y - 92, 26, 9);
    this.hillsNear = ridgePoints(rng, HORIZON_Y - 30, 18, 11);
    this.grass = [];
    for (let i = 0; i < 340; i++) {
      this.grass.push({
        x: rng.range(0, WORLD_W),
        y: rng.range(HORIZON_Y + 26, WORLD_H - 4),
        h: rng.range(7, 20),
        lean: rng.range(0.6, 1.4),
        phase: rng.range(0, Math.PI * 2),
      });
    }
    this.dew = [];
    for (let i = 0; i < 60; i++) {
      this.dew.push({
        x: rng.range(0, WORLD_W),
        y: rng.range(HORIZON_Y + 40, WORLD_H - 10),
        tw: rng.range(0, Math.PI * 2),
      });
    }
    this.streaks = [];
    for (let i = 0; i < 26; i++) {
      this.streaks.push({
        x: rng.range(0, WORLD_W),
        y: rng.range(80, HORIZON_Y + 60),
        len: rng.range(30, 90),
        speed: rng.range(0.7, 1.3),
      });
    }
    this.jars = [];
    const slots = jarCount === 2 ? [0.3, 0.7] : [0.2, 0.5, 0.8];
    for (let i = 0; i < jarCount; i++) {
      this.jars.push(new Jar(WORLD_W * slots[i] + rng.range(-24, 24), i));
    }
    this.moonX = WORLD_W * palette.moon;
    this.moonY = 96;
  }

  drawSky(ctx, dawnFrac) {
    const pal = this.palette;
    const grad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 40);
    grad.addColorStop(0, mixHex(pal.skyTop, pal.dawnTop, dawnFrac));
    grad.addColorStop(1, mixHex(pal.skyBottom, pal.dawnBottom, dawnFrac));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_W, HORIZON_Y + 40);
  }

  drawStarsAndMoon(ctx, t, dawnFrac) {
    const fade = 1 - dawnFrac * 0.85;
    ctx.save();
    for (const star of this.stars) {
      const tw = 0.55 + 0.45 * Math.sin(t * star.speed + star.tw);
      ctx.globalAlpha = 0.75 * tw * fade;
      ctx.fillStyle = "#dfe8ff";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const halo = ctx.createRadialGradient(this.moonX, this.moonY, 6, this.moonX, this.moonY, 74);
    halo.addColorStop(0, `rgba(240,244,220,${0.5 * fade + 0.12})`);
    halo.addColorStop(1, "rgba(240,244,220,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(this.moonX - 80, this.moonY - 80, 160, 160);
    ctx.fillStyle = "#eef0da";
    ctx.beginPath();
    ctx.arc(this.moonX, this.moonY, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(190,196,170,0.5)";
    ctx.beginPath();
    ctx.arc(this.moonX - 7, this.moonY - 4, 4.5, 0, Math.PI * 2);
    ctx.arc(this.moonX + 6, this.moonY + 8, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawRidge(ctx, pts, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-4, HORIZON_Y + 44);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(WORLD_W + 4, HORIZON_Y + 44);
    ctx.closePath();
    ctx.fill();
  }

  drawGround(ctx, dawnFrac) {
    const pal = this.palette;
    const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, WORLD_H);
    grad.addColorStop(0, mixHex(pal.groundFar, "#3a2c1c", dawnFrac * 0.5));
    grad.addColorStop(1, mixHex(pal.ground, "#1c140c", dawnFrac * 0.5));
    ctx.fillStyle = grad;
    ctx.fillRect(0, HORIZON_Y + 20, WORLD_W, WORLD_H - HORIZON_Y);
  }

  drawGrass(ctx, t, windNow) {
    ctx.save();
    ctx.strokeStyle = "rgba(46,84,52,0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const blade of this.grass) {
      const sway = Math.sin(t * 1.3 + blade.phase) * 1.6 + windNow * 9 * blade.lean;
      ctx.moveTo(blade.x, blade.y);
      ctx.quadraticCurveTo(
        blade.x + sway * 0.4,
        blade.y - blade.h * 0.6,
        blade.x + sway,
        blade.y - blade.h,
      );
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(200,230,255,0.5)";
    for (const dew of this.dew) {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + dew.tw));
      ctx.globalAlpha = 0.35 * tw;
      ctx.fillRect(dew.x, dew.y, 1.6, 1.6);
    }
    ctx.restore();
  }

  drawWindStreaks(ctx, windNow, dt) {
    if (windNow <= 0.03) return;
    ctx.save();
    ctx.strokeStyle = `rgba(210,225,255,${0.16 * windNow})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const streak of this.streaks) {
      streak.x += windNow * 340 * streak.speed * dt;
      if (streak.x - streak.len > WORLD_W) {
        streak.x = -10;
        streak.y = 80 + ((streak.y * 7 + 53) % (HORIZON_Y - 40));
      }
      const wobble = Math.sin(streak.x * 0.01 + streak.y) * 4;
      ctx.moveTo(streak.x - streak.len, streak.y + wobble);
      ctx.lineTo(streak.x, streak.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawJar(ctx, jar, t, jarredFlies) {
    const { x, y } = jar;
    ctx.save();
    const glowR = 46 + jar.lit * 1.6;
    const glow = ctx.createRadialGradient(x, y - 18, 2, x, y - 18, glowR);
    glow.addColorStop(0, `rgba(255,214,120,${0.42 + Math.min(jar.lit * 0.016, 0.34)})`);
    glow.addColorStop(1, "rgba(255,214,120,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = glow;
    ctx.fillRect(x - glowR, y - 18 - glowR, glowR * 2, glowR * 2);
    ctx.globalCompositeOperation = "source-over";
    // glass body
    ctx.beginPath();
    ctx.moveTo(x - 13, y - 34);
    ctx.bezierCurveTo(x - 24, y - 30, x - 25, y - 8, x - 17, y - 1);
    ctx.quadraticCurveTo(x, y + 4, x + 17, y - 1);
    ctx.bezierCurveTo(x + 25, y - 8, x + 24, y - 30, x + 13, y - 34);
    ctx.closePath();
    ctx.fillStyle = "rgba(170,210,225,0.16)";
    ctx.fill();
    ctx.strokeStyle = "rgba(200,230,245,0.55)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // cork and rim
    ctx.fillStyle = "#8a6844";
    ctx.fillRect(x - 10, y - 40, 20, 7);
    ctx.fillStyle = "rgba(220,240,250,0.7)";
    ctx.fillRect(x - 13, y - 34, 26, 2.4);
    // jarred fireflies twinkling inside
    for (const fly of jarredFlies) {
      const tw = 0.5 + 0.5 * Math.sin(t * fly.twSpeed + fly.twPhase);
      ctx.globalAlpha = 0.35 + 0.6 * tw;
      ctx.fillStyle = "#ffd977";
      ctx.beginPath();
      ctx.arc(x + fly.jarDx, y - 12 + fly.jarDy, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  draw(ctx, t, dawnFrac, windNow, dt, jarredByJar) {
    this.drawSky(ctx, dawnFrac);
    this.drawStarsAndMoon(ctx, t, dawnFrac);
    this.drawRidge(ctx, this.hillsFar, this.palette.hillFar);
    this.drawRidge(ctx, this.hillsNear, this.palette.hillNear);
    this.drawGround(ctx, dawnFrac);
    this.drawWindStreaks(ctx, windNow, dt);
    this.drawGrass(ctx, t, windNow);
    for (const jar of this.jars) {
      this.drawJar(ctx, jar, t, jarredByJar[jar.index] || []);
    }
  }
}
