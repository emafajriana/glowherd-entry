// keeper.js — the lantern keeper: a small hooded figure who follows
// the player's hand, and the light she carries. The light has three
// reaches the flock reads: a warm glow you see, a rim the strays
// gather on, and a bright heart they will not enter — and that heart
// is also what a diving moth cannot cross without singeing.

import { WORLD_W, WORLD_H } from "./meadow.js";

export const LIGHT_CORE = 62;
export const LIGHT_RING = 150;
const LIGHT_GLOW = 215;
const CLAP_RADIUS = 175;
const CLAP_COOLDOWN = 2.0;

export class Keeper {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.tx = x;
    this.ty = y;
    this.bobPhase = 0;
    this.facing = 1;
    this.clapReadyAt = 0;
    this.pulseT = -1;
    this.pulseX = 0;
    this.pulseY = 0;
  }

  aim(x, y) {
    this.tx = Math.max(24, Math.min(WORLD_W - 24, x));
    this.ty = Math.max(70, Math.min(WORLD_H - 30, y));
  }

  update(dt) {
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const d = Math.hypot(dx, dy);
    const speed = 620;
    if (d > 2) {
      const step = Math.min(d, speed * dt + d * 5.2 * dt);
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
      if (Math.abs(dx) > 6) this.facing = dx > 0 ? 1 : -1;
    }
    this.bobPhase += dt * (d > 24 ? 7 : 2.2);
    if (this.pulseT >= 0) {
      this.pulseT += dt / 0.38;
      if (this.pulseT >= 1) this.pulseT = -1;
    }
  }

  canClap(t) {
    return t >= this.clapReadyAt;
  }

  clap(t) {
    if (!this.canClap(t)) return false;
    this.clapReadyAt = t + CLAP_COOLDOWN;
    this.pulseT = 0;
    this.pulseX = this.x;
    this.pulseY = this.y;
    return true;
  }

  pulseRadius() {
    if (this.pulseT < 0) return 0;
    return CLAP_RADIUS * (1 - Math.pow(1 - this.pulseT, 2));
  }

  drawGlow(ctx, t) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const flicker = 1 + Math.sin(t * 9.1) * 0.02 + Math.sin(t * 23.7) * 0.012;
    const r = LIGHT_GLOW * flicker;
    const grad = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, r);
    grad.addColorStop(0, "rgba(255,190,96,0.30)");
    grad.addColorStop(0.35, "rgba(255,166,66,0.16)");
    grad.addColorStop(1, "rgba(255,150,50,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - r, this.y - r, r * 2, r * 2);
    // the bright heart
    const core = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, LIGHT_CORE);
    core.addColorStop(0, "rgba(255,226,160,0.34)");
    core.addColorStop(1, "rgba(255,200,110,0)");
    ctx.fillStyle = core;
    ctx.fillRect(this.x - LIGHT_CORE, this.y - LIGHT_CORE, LIGHT_CORE * 2, LIGHT_CORE * 2);
    ctx.restore();
    // clap pulse ring
    if (this.pulseT >= 0) {
      const pr = this.pulseRadius();
      ctx.save();
      ctx.globalAlpha = 0.55 * (1 - this.pulseT);
      ctx.strokeStyle = "#ffe9b8";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(this.pulseX, this.pulseY, pr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawFigure(ctx, t) {
    const bob = Math.sin(this.bobPhase) * 1.6;
    const x = this.x;
    const y = this.y + bob;
    ctx.save();
    // pool of light at her feet
    ctx.globalCompositeOperation = "lighter";
    const pool = ctx.createRadialGradient(x, y + 26, 2, x, y + 26, 66);
    pool.addColorStop(0, "rgba(255,180,90,0.14)");
    pool.addColorStop(1, "rgba(255,180,90,0)");
    ctx.fillStyle = pool;
    ctx.fillRect(x - 66, y - 40, 132, 132);
    ctx.globalCompositeOperation = "source-over";
    // cloak
    ctx.beginPath();
    ctx.moveTo(x, y - 26);
    ctx.bezierCurveTo(x + 13, y - 20, x + 15, y + 6, x + 17, y + 24);
    ctx.quadraticCurveTo(x, y + 30, x - 17, y + 24);
    ctx.bezierCurveTo(x - 15, y + 6, x - 13, y - 20, x, y - 26);
    ctx.closePath();
    ctx.fillStyle = "#2c2340";
    ctx.fill();
    ctx.strokeStyle = "rgba(150,130,200,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // hood and shadowed face
    ctx.beginPath();
    ctx.arc(x, y - 24, 9.5, 0, Math.PI * 2);
    ctx.fillStyle = "#372b52";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + this.facing * 2, y - 23, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#191024";
    ctx.fill();
    // the lantern, held out on the facing side
    const lx = x + this.facing * 17;
    const ly = y - 6 + Math.sin(this.bobPhase * 0.7) * 1.4;
    ctx.strokeStyle = "#0f0c18";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + this.facing * 6, y - 12);
    ctx.lineTo(lx, ly - 5);
    ctx.stroke();
    ctx.fillStyle = "#151020";
    ctx.fillRect(lx - 4.4, ly - 5, 8.8, 11);
    ctx.strokeStyle = "rgba(230,200,140,0.8)";
    ctx.lineWidth = 0.9;
    ctx.strokeRect(lx - 4.4, ly - 5, 8.8, 11);
    const flame = 0.8 + 0.2 * Math.sin(t * 11 + 1.7);
    ctx.fillStyle = `rgba(255,214,120,${0.95 * flame})`;
    ctx.beginPath();
    ctx.arc(lx, ly + 0.6, 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  draw(ctx, t) {
    this.drawGlow(ctx, t);
    this.drawFigure(ctx, t);
  }
}
