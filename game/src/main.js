// main.js — GLOWHERD's heart: the round's state machine and the
// fixed-step loop. One keeper, seven nights; each night the same
// shape — gather the strays into jars before dawn, keep them from
// the moths — and each screen (title, play, the night's reckoning,
// the dimming, the dawn kept) is a state this file moves between.

import { Rng } from "./rng.js";
import { Meadow, WORLD_W, WORLD_H } from "./meadow.js";
import { Flock } from "./fireflies.js";
import { Keeper } from "./keeper.js";
import { MothFlight } from "./moths.js";
import { NIGHTS, nightSeed } from "./nights.js";
import { Sound } from "./audio.js";
import { drawHud, Banners } from "./hud.js";
import {
  drawTitle,
  drawNightClear,
  drawDefeat,
  drawVictory,
  drawPaused,
  buttons,
  hitButton,
} from "./screens.js";
import { setupShot } from "./shots.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

export class Game {
  constructor() {
    this.screen = "title";
    this.t = 0;
    this.nightIndex = 0;
    this.nightDef = NIGHTS[0];
    this.score = 0;
    this.scoreAtNightStart = 0;
    this.starsEarned = [];
    this.totalLost = 0;
    this.jarred = 0;
    this.lost = 0;
    this.nightT = 0;
    this.dawnFrac = 0;
    this.windNow = 0;
    this.lastGustBannerAt = -99;
    this.paused = false;
    this.mouse = { x: WORLD_W / 2, y: WORLD_H / 2 };
    this.scriptedAim = null;
    this.sound = new Sound();
    this.banners = new Banners();
    this.moths = new MothFlight();
    this.lastResult = null;
    this.rng = new Rng(1234);
    this.buildNightScene(0);
    this.keeper = new Keeper(WORLD_W / 2, 400);
  }

  buildNightScene(index) {
    const def = NIGHTS[index];
    const rng = new Rng(nightSeed(index));
    this.nightDef = def;
    this.meadow = new Meadow(rng, def.palette, def.jars);
    this.flock = new Flock(rng, def.flock);
    this.rng = rng;
  }

  startNight(index) {
    this.nightIndex = index;
    this.buildNightScene(index);
    this.keeper = new Keeper(WORLD_W / 2, 430);
    this.moths.reset(this.nightDef.mothEvery, this.nightDef.mothMax);
    this.jarred = 0;
    this.lost = 0;
    this.nightT = 0;
    this.dawnFrac = 0;
    this.windNow = 0;
    this.scoreAtNightStart = this.score;
    this.banners = new Banners();
    this.banners.push(
      `Night ${index + 1} — ${this.nightDef.name}`,
      this.nightDef.sub,
      3.4,
    );
    this.screen = "play";
    this.paused = false;
    this.sound.resetCombo();
    this.sound.startPad(index);
  }

  restartRound() {
    this.score = 0;
    this.starsEarned = [];
    this.totalLost = 0;
    this.startNight(0);
  }

  need() {
    return Math.ceil(this.nightDef.target * this.nightDef.flock);
  }

  windGust() {
    const w = this.nightDef.wind;
    if (w <= 0) return 0;
    const shape =
      0.45 + 0.55 * Math.sin(this.t * 0.45 + Math.sin(this.t * 0.13) * 2.1);
    return Math.max(0, w * shape);
  }

  endNight(kept) {
    const dawnLeft = Math.max(0, this.nightDef.dawn - this.nightT);
    let stars = 0;
    if (kept) {
      stars = 1;
      if (this.lost === 0) stars += 1;
      if (this.jarred >= Math.ceil(this.nightDef.flock * 0.9)) stars += 1;
      const bonus = Math.round(dawnLeft * 2);
      this.score += bonus;
      this.lastResult = {
        jarred: this.jarred,
        lost: this.lost,
        dawnLeft,
        stars,
        nightScore: this.jarred * 10 + bonus,
      };
      this.starsEarned[this.nightIndex] = stars;
    }
    this.sound.stopPad();
    if (kept && this.nightIndex === NIGHTS.length - 1) {
      this.screen = "victory";
    } else {
      this.screen = kept ? "clear" : "defeat";
    }
  }

  handleClick(x, y) {
    this.sound.unlock();
    if (this.screen === "title") {
      if (hitButton(buttons.titleStart, x, y)) this.restartRound();
      return;
    }
    if (this.screen === "clear") {
      if (this.nightIndex < NIGHTS.length - 1 && hitButton(buttons.nextNight, x, y)) {
        this.startNight(this.nightIndex + 1);
      } else if (hitButton(buttons.againFromClear, x, y)) {
        this.restartRound();
      }
      return;
    }
    if (this.screen === "defeat") {
      if (hitButton(buttons.retryNight, x, y)) {
        this.score = this.scoreAtNightStart;
        this.startNight(this.nightIndex);
      } else if (hitButton(buttons.restartRound, x, y)) {
        this.restartRound();
      }
      return;
    }
    if (this.screen === "victory") {
      if (hitButton(buttons.victoryAgain, x, y)) this.restartRound();
      return;
    }
    if (this.screen === "play" && !this.paused) {
      if (this.keeper.clap(this.t)) {
        this.sound.clap();
        this.moths.clapRepel(this.keeper);
        this.flock.scatter(this.keeper.x, this.keeper.y, 130, 55);
      }
    }
  }

  handleKey(code) {
    if (code === "KeyP" && this.screen === "play") {
      this.paused = !this.paused;
    }
    if (code === "KeyM") {
      this.sound.unlock();
      this.sound.setMuted(!this.sound.muted);
    }
  }

  update(dt) {
    this.t += dt;
    const ambient = this.screen !== "play";
    if (this.scriptedAim) {
      const aim = this.scriptedAim(this.t);
      this.keeper.aim(aim.x, aim.y);
    } else if (ambient) {
      this.keeper.aim(
        WORLD_W / 2 + Math.sin(this.t * 0.24) * 190,
        400 + Math.cos(this.t * 0.31) * 60,
      );
    } else {
      this.keeper.aim(this.mouse.x, this.mouse.y);
    }
    this.keeper.update(dt);
    if (ambient || this.paused) {
      if (ambient) this.flock.update(dt, this.t, this.keeper, 0);
      return;
    }
    // ——— a night in play ———
    this.nightT += dt;
    this.dawnFrac = Math.min(1, this.nightT / this.nightDef.dawn);
    this.windNow = this.windGust();
    if (
      this.windNow > 0.42 &&
      this.t - this.lastGustBannerAt > 14 &&
      this.nightDef.wind > 0
    ) {
      this.lastGustBannerAt = this.t;
      this.banners.push("The wind rises", "Hold the flock close until it passes", 2.2);
      this.sound.gust();
    }
    this.flock.update(dt, this.t, this.keeper, this.windNow * 150);
    const events = [];
    this.moths.update(dt, this.t, this.rng, this.flock, this.keeper, events);
    for (const ev of events) {
      if (ev.type === "mothArrives") {
        this.banners.push("A moth!", "Keep the light's heart toward its dive", 1.8);
        this.sound.flutter();
      } else if (ev.type === "eaten") {
        this.lost += 1;
        this.totalLost += 1;
        this.sound.resetCombo();
      } else if (ev.type === "singed") {
        this.score += 5;
        this.sound.singe();
      }
    }
    const caught = this.flock.tryCapture(this.meadow.jars);
    for (const fly of caught) {
      void fly;
      this.jarred += 1;
      this.score += 10;
      this.sound.chime();
    }
    this.banners.update(dt, this.t);
    // the night resolves
    if (this.jarred >= this.need()) {
      this.endNight(true);
    } else if (this.jarred + this.flock.freeFlies().length < this.need()) {
      this.endNight(false);
    } else if (this.nightT >= this.nightDef.dawn) {
      this.endNight(false);
    }
  }

  render() {
    const jarredByJar = this.flock.jarredByJar();
    this.meadow.draw(ctx, this.t, this.dawnFrac, this.windNow, 1 / 60, jarredByJar);
    this.flock.draw(ctx, this.t);
    if (this.screen === "play" || this.screen === "title") {
      this.moths.draw(ctx, this.t);
    }
    this.keeper.draw(ctx, this.t);
    if (this.screen === "play") {
      drawHud(ctx, this);
      this.banners.draw(ctx, this.t);
      if (this.paused) drawPaused(ctx);
    } else if (this.screen === "title") {
      drawTitle(ctx, this);
    } else if (this.screen === "clear") {
      drawNightClear(ctx, this);
    } else if (this.screen === "defeat") {
      drawDefeat(ctx, this);
    } else if (this.screen === "victory") {
      drawVictory(ctx, this);
    }
    canvas.style.cursor =
      this.screen === "play" && !this.paused ? "none" : "default";
  }
}

// ——— boot, input, and the frame loop ———

const game = new Game();
window.__glowherd = game;

function toWorld(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) / rect.width) * WORLD_W,
    y: ((evt.clientY - rect.top) / rect.height) * WORLD_H,
  };
}

canvas.addEventListener("mousemove", (evt) => {
  game.mouse = toWorld(evt);
});
canvas.addEventListener("mousedown", (evt) => {
  const p = toWorld(evt);
  game.mouse = p;
  game.handleClick(p.x, p.y);
});
window.addEventListener("keydown", (evt) => {
  game.handleKey(evt.code);
});

const shotQuery = new URLSearchParams(window.location.search).get("shot");
if (shotQuery) {
  setupShot(game, shotQuery);
  game.render();
  window.__shotReady = true;
} else {
  let last = performance.now();
  const frame = (now) => {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    let remaining = dt;
    while (remaining > 0) {
      const step = Math.min(remaining, 1 / 60);
      game.update(step);
      remaining -= step;
    }
    game.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
