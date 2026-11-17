// hud.js — the frame of facts around the play: which night it is,
// how many strays are home against how many the night asks for, how
// much dark is left before dawn, the score, and a warning shiver
// when a moth is hunting. Plus the fading centre banners that call
// out the night's turns ("The wind rises", "A moth!").

import { WORLD_W } from "./meadow.js";

export function drawHud(ctx, game) {
  const night = game.nightDef;
  ctx.save();
  // top shade for legibility
  const shade = ctx.createLinearGradient(0, 0, 0, 64);
  shade.addColorStop(0, "rgba(4,6,14,0.55)");
  shade.addColorStop(1, "rgba(4,6,14,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, WORLD_W, 64);

  ctx.textBaseline = "middle";
  // night name, left
  ctx.textAlign = "left";
  ctx.fillStyle = "#e8e4d2";
  ctx.font = "600 19px Georgia, 'Times New Roman', serif";
  ctx.fillText(`Night ${game.nightIndex + 1} of 7 — ${night.name}`, 22, 26);
  ctx.font = "13px Georgia, serif";
  ctx.fillStyle = "rgba(232,228,210,0.66)";
  ctx.fillText(
    game.keeper.canClap(game.t) ? "Click: clap · P: pause · M: sound" : "Clap recharging…",
    22,
    48,
  );

  // dawn bar, centre: the moon sets as the bar empties
  const barW = 300;
  const barX = WORLD_W / 2 - barW / 2;
  ctx.textAlign = "center";
  ctx.font = "12px Georgia, serif";
  ctx.fillStyle = "rgba(232,228,210,0.8)";
  ctx.fillText("D A W N", WORLD_W / 2, 14);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(barX, 24, barW, 7);
  const dawnGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  dawnGrad.addColorStop(0, "#7f9cc9");
  dawnGrad.addColorStop(1, "#f2a45c");
  ctx.fillStyle = dawnGrad;
  ctx.fillRect(barX, 24, barW * Math.max(0, 1 - game.dawnFrac), 7);
  ctx.fillStyle = "#f5edd6";
  ctx.beginPath();
  ctx.arc(barX + barW * Math.max(0, 1 - game.dawnFrac), 27.5, 4.4, 0, Math.PI * 2);
  ctx.fill();

  // jarred count and score, right
  ctx.textAlign = "right";
  ctx.font = "600 19px Georgia, serif";
  ctx.fillStyle = "#ffd977";
  const need = Math.ceil(night.target * night.flock);
  ctx.fillText(`Jarred ${game.jarred} / ${need}`, WORLD_W - 22, 26);
  ctx.font = "13px Georgia, serif";
  ctx.fillStyle = "rgba(232,228,210,0.75)";
  ctx.fillText(
    `Score ${game.score} · Lost ${game.lost}${game.sound.muted ? " · Sound off" : ""}`,
    WORLD_W - 22,
    48,
  );

  // moth warning
  if (game.moths.huntingCount() > 0) {
    const pulse = 0.6 + 0.4 * Math.sin(game.t * 7);
    ctx.textAlign = "center";
    ctx.font = "600 15px Georgia, serif";
    ctx.fillStyle = `rgba(255,170,170,${pulse})`;
    ctx.fillText("— a moth is hunting —", WORLD_W / 2, 52);
  }
  ctx.restore();
}

export class Banners {
  constructor() {
    this.current = null;
    this.queue = [];
  }

  push(text, sub, dur) {
    this.queue.push({ text, sub: sub || "", at: null, dur: dur || 2.6 });
  }

  update(dt, t) {
    if (!this.current && this.queue.length > 0) {
      this.current = this.queue.shift();
      this.current.at = t;
    }
    if (this.current && t - this.current.at > this.current.dur) this.current = null;
  }

  draw(ctx, t) {
    if (!this.current) return;
    const age = t - this.current.at;
    const fadeIn = Math.min(1, age / 0.4);
    const fadeOut = Math.min(1, (this.current.dur - age) / 0.5);
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.fillStyle = "#f5edd6";
    ctx.font = "600 34px Georgia, 'Times New Roman', serif";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 12;
    ctx.fillText(this.current.text, WORLD_W / 2, 128);
    if (this.current.sub) {
      ctx.font = "italic 17px Georgia, serif";
      ctx.fillStyle = "rgba(240,234,214,0.85)";
      ctx.fillText(this.current.sub, WORLD_W / 2, 158);
    }
    ctx.restore();
  }
}
