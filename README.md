[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/emafajriana/glowherd-entry/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/emafajriana/glowherd-entry/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# GLOWHERD — gather the stray fireflies home before dawn

A lantern-herding game built for the make.fun `best-game-01` bounty
("Make the best game"). You are the keeper of seven meadows: every
night the fireflies stray, and every night you gather them into jars
before dawn — while moon-moths hunt the flock and the wind rises.
Static files, no build step, no network request.

## The game

Your lantern is the mouse. Fireflies are drawn to the rim of its
light and shy of its bright heart, so the flock gathers around you
and follows where you lead: sweep up the strays, then lead the swarm
over a jar and let them settle in. Each night asks for a share of the
flock — jar that many before the dawn bar empties.

- **The round:** 7 meadows, each with its own palette and temper —
  more strays, a higher share to bring home, then the first moths,
  then the wind, and on the last night the Long Dark: everything at
  once.
- **Moon-moths** dive at the flock and eat what they catch. A moth
  that dives into the lantern's bright heart singes its wings and
  flees — your moving light is the flock's only fence. A click claps:
  moths startle off, but so does the flock.
- **The wind** leans on everything that flies. Gather in the lulls.
- **Keeping score:** 10 a jarred stray, 5 a singed moth, a bonus for
  dark to spare, and up to 3 stars a night — one for keeping it, one
  for losing nobody, one for bringing nearly everyone home.
- **Sound:** a synthesized soundscape (WebAudio, no audio files) —
  pentatonic chimes as the jars fill, a low pad under each night,
  wind and papery moth-wings. `M` mutes.

Controls: mouse to lead the lantern, click to clap, `P` pauses,
`M` toggles sound.

## Code

One job per module under `game/src/`, a fixed-step (1/60 s)
simulation: `main.js` runs the round's state machine; `meadow.js`
grows and draws the field, sky and jars; `fireflies.js` is the flock
and the light-rim rule that makes herding work; `keeper.js` is the
keeper and her lantern; `moths.js` the hunters; `nights.js` the seven
meadows' definitions; `hud.js` the frame of facts and banners;
`screens.js` the title, reckoning, dimming and victory screens;
`audio.js` the synth; `shots.js` the deterministic screenshot scenes
(`?shot=title|play|clear|late`), which is how the screenshots in
`screenshots/` were taken — real renders of the game's own code.

Run it locally with any static file server over `game/`, e.g.
`python3 -m http.server --directory game`, then open the page.
