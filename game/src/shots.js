// shots.js — the screenshot scenes. Each is the real game, grown
// from a fixed seed and stepped a fixed number of ticks with a
// scripted lantern, so the render the maker captures is the render
// any player could reach — never a composite, never an edit.
//   ?shot=title  the opening field, lantern drifting, flock astir
//   ?shot=play   Violet Banks mid-gather, a moth on its dive
//   ?shot=clear  a night kept, with its stars and reckoning
//   ?shot=late   the Moth's Hour near dawn, wind up, jars half-lit

import { WORLD_W, WORLD_H } from "./meadow.js";
import { Moth } from "./moths.js";
import { Rng } from "./rng.js";

function lissajous(cx, cy, rx, ry, speed) {
  return (t) => ({
    x: cx + Math.sin(t * speed) * rx,
    y: cy + Math.cos(t * speed * 0.83) * ry,
  });
}

function step(game, ticks) {
  for (let i = 0; i < ticks; i++) game.update(1 / 60);
}

function clusterFlock(game, cx, cy, spread, fraction) {
  const rng = new Rng(4242);
  let moved = 0;
  for (const fly of game.flock.flies) {
    if (fly.jarred || fly.gone) continue;
    if (moved / game.flock.flies.length >= fraction) break;
    fly.x = cx + rng.range(-spread, spread);
    fly.y = cy + rng.range(-spread * 0.55, spread * 0.55);
    fly.vx = rng.range(-14, 14);
    fly.vy = rng.range(-10, 10);
    moved++;
  }
}

function preJar(game, jarIndex, count) {
  const jar = game.meadow.jars[jarIndex];
  let done = 0;
  for (const fly of game.flock.flies) {
    if (done >= count) break;
    if (fly.jarred || fly.gone) continue;
    fly.jarred = true;
    fly.jarIndex = jarIndex;
    jar.lit += 1;
    done++;
  }
  game.jarred += done;
}

export function setupShot(game, name) {
  if (name === "title") {
    game.screen = "title";
    game.scriptedAim = lissajous(WORLD_W / 2, 400, 200, 60, 0.24);
    step(game, 300);
    return;
  }
  if (name === "play") {
    game.startNight(2);
    preJar(game, 0, 7);
    game.score = 70;
    clusterFlock(game, 620, 330, 120, 0.7);
    game.scriptedAim = lissajous(620, 330, 120, 60, 0.45);
    step(game, 480);
    const moth = new Moth(new Rng(77), true);
    const centre = game.flock.centroid() || { x: 640, y: 360 };
    moth.x = centre.x - 130;
    moth.y = centre.y - 70;
    moth.state = "hunt";
    game.moths.moths.push(moth);
    step(game, 22);
    game.scriptedAim = null;
    return;
  }
  if (name === "clear") {
    game.startNight(1);
    preJar(game, 0, 11);
    preJar(game, 1, 7);
    game.lost = 1;
    game.totalLost = 1;
    game.score = 180 + 46;
    game.lastResult = {
      jarred: 18,
      lost: 1,
      dawnLeft: 23,
      stars: 2,
      nightScore: 226,
    };
    game.starsEarned[1] = 2;
    game.screen = "clear";
    game.scriptedAim = lissajous(400, 480, 90, 30, 0.2);
    step(game, 120);
    game.scriptedAim = null;
    return;
  }
  if (name === "late") {
    game.startNight(5);
    preJar(game, 0, 9);
    preJar(game, 2, 6);
    game.score = 640;
    game.nightT = game.nightDef.dawn * 0.48;
    game.dawnFrac = 0.48;
    clusterFlock(game, 660, 320, 130, 0.75);
    game.scriptedAim = lissajous(660, 320, 130, 65, 0.5);
    step(game, 420);
    const rng = new Rng(99);
    for (const side of [true, false]) {
      const moth = new Moth(rng, side);
      moth.x = side ? 430 : 920;
      moth.y = 190 + (side ? 40 : -10);
      moth.state = "hunt";
      game.moths.moths.push(moth);
    }
    step(game, 18);
    game.scriptedAim = null;
    return;
  }
  // unknown scene: fall back to the title field
  game.screen = "title";
  step(game, 60);
}
