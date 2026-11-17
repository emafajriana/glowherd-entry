// screens.js — the still points of the round: the title the game
// opens on, the reckoning at each night's end, the dimming when a
// meadow is lost, and the dawn-kept victory. Each screen is drawn
// over the living meadow, so what the player sees between nights is
// the same field they just worked, gone quiet.

import { WORLD_W, WORLD_H } from "./meadow.js";

export const buttons = {
  titleStart: { x: WORLD_W / 2 - 110, y: 512, w: 220, h: 52, label: "Begin the round" },
  nextNight: { x: WORLD_W / 2 - 230, y: 520, w: 210, h: 50, label: "Next night" },
  againFromClear: { x: WORLD_W / 2 + 20, y: 520, w: 210, h: 50, label: "Play again" },
  retryNight: { x: WORLD_W / 2 - 230, y: 520, w: 210, h: 50, label: "Retry the night" },
  restartRound: { x: WORLD_W / 2 + 20, y: 520, w: 210, h: 50, label: "Restart the round" },
  victoryAgain: { x: WORLD_W / 2 - 105, y: 540, w: 210, h: 50, label: "Play again" },
};

export function hitButton(btn, x, y) {
  return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
}

function drawButton(ctx, btn, mouse, t) {
  const hover = mouse && hitButton(btn, mouse.x, mouse.y);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10);
  ctx.fillStyle = hover ? "rgba(255,214,120,0.92)" : "rgba(20,18,36,0.78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,214,120,0.85)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = hover ? "#241a08" : "#ffe9b8";
  ctx.font = "600 18px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
  ctx.restore();
  return btn;
}

function veil(ctx, alpha) {
  ctx.fillStyle = `rgba(4,5,12,${alpha})`;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

function drawStarsRow(ctx, cx, cy, earned, t) {
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * 64;
    const on = i < earned;
    const pulse = on ? 1 + Math.sin(t * 2.4 + i) * 0.06 : 1;
    ctx.save();
    ctx.translate(x, cy);
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    for (let p = 0; p < 10; p++) {
      const r = p % 2 === 0 ? 17 : 7.4;
      const a = (p / 10) * Math.PI * 2 - Math.PI / 2;
      if (p === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    if (on) {
      ctx.fillStyle = "#ffd977";
      ctx.shadowColor = "rgba(255,200,90,0.9)";
      ctx.shadowBlur = 16;
    } else {
      ctx.fillStyle = "rgba(200,200,210,0.18)";
    }
    ctx.fill();
    ctx.restore();
  }
}

export function drawTitle(ctx, game) {
  const t = game.t;
  ctx.save();
  ctx.textAlign = "center";
  // title
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fdf6dd";
  ctx.font = "700 96px Georgia, 'Times New Roman', serif";
  ctx.fillText("GLOWHERD", WORLD_W / 2, 218);
  ctx.shadowBlur = 8;
  ctx.font = "italic 24px Georgia, serif";
  ctx.fillStyle = "#ffe9b8";
  ctx.fillText("Gather the stray fireflies home before dawn", WORLD_W / 2, 268);
  ctx.font = "17px Georgia, serif";
  ctx.fillStyle = "rgba(238,234,216,0.88)";
  ctx.fillText(
    "Seven meadows · moon-moths · the rising wind · the Long Dark",
    WORLD_W / 2,
    306,
  );
  // how it plays
  ctx.font = "16px Georgia, serif";
  ctx.fillStyle = "rgba(238,234,216,0.75)";
  ctx.fillText(
    "Your lantern is the mouse. Strays gather on its rim — lead them over a jar to bring them home.",
    WORLD_W / 2,
    428,
  );
  ctx.fillText(
    "Keep the light's bright heart between a diving moth and the flock. Click to clap and startle moths off.",
    WORLD_W / 2,
    454,
  );
  drawButton(ctx, buttons.titleStart, game.mouse, t);
  ctx.font = "14px Georgia, serif";
  ctx.fillStyle = "rgba(238,234,216,0.55)";
  ctx.fillText("Move: mouse · Clap: click · Pause: P · Sound: M", WORLD_W / 2, 606);
  ctx.restore();
}

export function drawNightClear(ctx, game) {
  veil(ctx, 0.45);
  const night = game.nightDef;
  const result = game.lastResult;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fdf6dd";
  ctx.font = "700 52px Georgia, serif";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 12;
  ctx.fillText(`Night ${game.nightIndex + 1} kept`, WORLD_W / 2, 218);
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillStyle = "#ffe9b8";
  ctx.fillText(night.name, WORLD_W / 2, 254);
  drawStarsRow(ctx, WORLD_W / 2, 316, result.stars, game.t);
  ctx.font = "19px Georgia, serif";
  ctx.fillStyle = "rgba(240,236,218,0.94)";
  ctx.fillText(
    `Jarred ${result.jarred} of ${night.flock} strays · Lost ${result.lost} to the dark`,
    WORLD_W / 2,
    386,
  );
  ctx.fillText(
    `Dark to spare: ${Math.max(0, Math.round(result.dawnLeft))}s · Night score ${result.nightScore}`,
    WORLD_W / 2,
    418,
  );
  ctx.font = "600 21px Georgia, serif";
  ctx.fillStyle = "#ffd977";
  ctx.fillText(`Round score ${game.score}`, WORLD_W / 2, 458);
  if (game.nightIndex < 6) drawButton(ctx, buttons.nextNight, game.mouse, game.t);
  drawButton(ctx, buttons.againFromClear, game.mouse, game.t);
  ctx.restore();
}

export function drawDefeat(ctx, game) {
  veil(ctx, 0.55);
  const night = game.nightDef;
  const need = Math.ceil(night.target * night.flock);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#e8ddc8";
  ctx.font = "700 52px Georgia, serif";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 12;
  ctx.fillText("The meadow dims…", WORLD_W / 2, 226);
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillStyle = "rgba(240,230,205,0.85)";
  ctx.fillText(
    `Dawn found ${game.jarred} of the ${need} strays the night asked for.`,
    WORLD_W / 2,
    286,
  );
  ctx.font = "18px Georgia, serif";
  ctx.fillText(
    game.lost > 0
      ? `The moths took ${game.lost}. Keep the light's heart toward their dives.`
      : "Gather the flock tighter before you lead it to a jar.",
    WORLD_W / 2,
    322,
  );
  ctx.font = "600 21px Georgia, serif";
  ctx.fillStyle = "#ffd977";
  ctx.fillText(`Round score ${game.score}`, WORLD_W / 2, 420);
  drawButton(ctx, buttons.retryNight, game.mouse, game.t);
  drawButton(ctx, buttons.restartRound, game.mouse, game.t);
  ctx.restore();
}

export function drawVictory(ctx, game) {
  veil(ctx, 0.4);
  const totalStars = game.starsEarned.reduce((a, b) => a + b, 0);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fdf6dd";
  ctx.font = "700 64px Georgia, serif";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 14;
  ctx.fillText("DAWN KEPT", WORLD_W / 2, 216);
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillStyle = "#ffe9b8";
  ctx.fillText("All seven meadows lit, and the Long Dark turned away.", WORLD_W / 2, 262);
  drawStarsRow(ctx, WORLD_W / 2, 330, Math.round(totalStars / 7), game.t);
  ctx.font = "20px Georgia, serif";
  ctx.fillStyle = "rgba(240,236,218,0.94)";
  ctx.fillText(`Stars ${totalStars} of 21 · Strays lost, all week: ${game.totalLost}`, WORLD_W / 2, 396);
  ctx.font = "600 26px Georgia, serif";
  ctx.fillStyle = "#ffd977";
  ctx.fillText(`Final score ${game.score}`, WORLD_W / 2, 440);
  ctx.font = "italic 17px Georgia, serif";
  ctx.fillStyle = "rgba(240,236,218,0.8)";
  ctx.fillText("The meadows remember your light, keeper.", WORLD_W / 2, 478);
  drawButton(ctx, buttons.victoryAgain, game.mouse, game.t);
  ctx.restore();
}

export function drawPaused(ctx) {
  veil(ctx, 0.5);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fdf6dd";
  ctx.font = "700 44px Georgia, serif";
  ctx.fillText("The light rests", WORLD_W / 2, 330);
  ctx.font = "17px Georgia, serif";
  ctx.fillStyle = "rgba(240,236,218,0.85)";
  ctx.fillText("Press P to take up the lantern again", WORLD_W / 2, 372);
  ctx.restore();
}
