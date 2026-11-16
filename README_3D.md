# CRIC ARENA - 3D presentation layer

This document covers the 3D upgrade (GLB players, national / franchise kits, full-size stadium, cameras,
batter movement). The match engine, scoring and game modes are unchanged.

## Run / test
```bash
npm install
npm run dev          # game
npx vitest run       # unit tests (kit resolver tests: src/tests/teamKits.test.ts)
npx vite build       # production build
```
Visual checks (headless Chromium, real GLBs) live in `tools/kit-preview/` - see "Screenshot tooling".

## What is where
| Area | Files |
|---|---|
| GLB players, rig, animation | `src/characters/CharacterInstance.tsx`, `CharacterRig.ts`, `src/lib/cricketArenaRig.js`, `src/lib/cricketArenaAnimations.ts` |
| Country / franchise kits | `src/characters/teamKits.ts` (config + `resolveKit`, home/away, shirt numbers) |
| Kit shader, helmet, bat colours, back number | `src/characters/kitMaterial.ts` (`applyTeamKit(character, country, format, variant, role, hasPads, {number,name})`) |
| World scale (2D map -> 3D metres) | `src/3d/worldScale.ts` |
| Stadium (ground, stands, roof, lights, screens) | `src/3d/Stadium.tsx`, `src/3d/Lighting.tsx` |
| Cameras (Batter, Drone, TV, Bowler, Side, Action, Orbit) | `src/3d/CameraSystem.tsx` |
| Match view | `src/components/CricketAction3DView.tsx` |
| Batter running / walk-off + walk-in gate | `src/components/CricketActionVisualizer.tsx` (`beginTransition`, `completePlayback`) |
| Player preview | `src/components/KitPreviewPanel.tsx` (the "Kits" button in the 3D view) |

## Kits
Skin, hair and face are never recoloured. Each vertex of the supplied GLB is tagged with a clothing zone
(jersey / sleeves / collar / pants / pads-socks / shoes / gloves) from its skinned rest position; a shader patch
recolours only those texels of the original texture. Every character has its own materials.
* **Test** - whites, team-coloured helmet, collar, trim and shoes.
* **ODI** - the country's colours.
* **T20 / IPL** - colour-blocked: contrasting sleeves and collar.
* Home/away is chosen automatically when the two shirts look alike (`pickVariants`).
* Shirt numbers are derived from the player's name (the match data carries none).
Add a country by appending one entry to `COUNTRY_KITS` (or `FRANCHISE_KITS`).

## Ground
Real dimensions: 20.12 m pitch (stumps at z = +/-10.06), creases drawn to scale, 66 m boundary rope, 30-yard circle,
three seating tiers, roof ring, six floodlight towers, giant LED screen plus two side scoreboards driven by the live
match data. `+z` is the striker's end. The 2D field map is mapped with one function (`toWorld`): true scale near the
pitch, stretched radially to the 66 m rope.

## Next-ball gating
`onPlaybackComplete` fires only when BOTH have finished: the ball return to the bowler, and the batter movement
(running between the wickets for 1-3 runs, or walk-off + walk-in after a wicket). Skip / instant speed bypass both.

## Modes and screens (header navigation)
| Screen | What it does | Code |
|---|---|---|
| **World Cup** | Pick 4-16 teams, groups + points table (points, wins, NRR), semi-finals, final, champion. Uses the normal match engine (Play / Auto sim). | `src/engine/competition/worldCupEngine.ts`, `src/components/pages/WorldCupView.tsx`, store: `createWorldCup`, `advanceWorldCup` |
| **Practice** | Batting nets (machine bowls, you pick the shot) and bowling nets (you pick line / length / pace, a batter AI replies). Plays in the 3D stadium; no competition is touched. | `src/engine/practice/practiceEngine.ts`, `src/components/pages/PracticeView.tsx` |
| **Kits** | Team selection: every country and IPL franchise, Test / ODI / T20, home / away, number, equipment, rotate and zoom the real GLB player. | `src/components/pages/KitSelectView.tsx` |
| Series, Quick Match, League, Tournaments | Already in the game; unchanged. | |

## Day / night and crowd
`Night` / `Day` button in the 3D view: sky, fog, lights and floodlights switch. The lower two tiers hold ~10k individual
3D spectators (instanced) who jump harder after a four, six or wicket; the upper tier is a textured backdrop.

## Verification performed
* `npx vitest run`: 411 tests / 45 files pass (new: kit resolver, playback gate + batter motion, World Cup, practice).
* End-to-end in headless Chromium (`tools/kit-preview/`):
  * `e2e.tsx` mounts the real `CricketActionVisualizer` with five deliveries and logs when the next ball is released
    (dot 1.4 s, two runs 4.0 s, four 1.9 s, wicket 7.4 s, single 2.5 s - the movement phase is what holds the gate).
  * `app-e2e.mjs` drives the production build through the UI: creates a World Cup, sims groups, advances to the semi-finals
    and final, and reads the champion; opens Kits and Practice and plays a shot.
  * `collisions.ts` audits all 70 clips (see below).

## Collision audit (70 clips, real GLB)
| Measure | Before | After |
|---|---|---|
| Arm vs torso, worst overlap | 35 mm (model units) | 2 mm; all 70 clips within 5 mm |
| Leg vs body, worst overlap | 39 mm | 11 mm; none over 2 cm |
| Lowest foot vs standing floor | -45 mm | 0 (floor clamp) |
Method: more elbow-search attempts with a stronger push-out, a crouch-relief and knee-lift relief wrapper in
`src/lib/cricketArenaRig.js`, and a foot clamp in `CharacterInstance`. Limits are capsule approximations of the body,
so a few millimetres of graze can remain; keeper and bowling poses are slightly shallower than the original clips.

## Ball, bat, bowlers and players (this round)
* **Bat-ball contact:** measured at the contact frame, the old ball path passed 0.92 m from the bat blade. The bat blade position
  is now published each frame and the ball is drawn onto it at contact (0.000 m), blended in over the end of the bounce and
  released along its path. No contact is shown for Bowled / LBW / wides.
* **Spin and bounce:** fast = upright-seam backspin, medium = slight tilt, spin = tilted axis and faster; the ball squashes
  on the pitch; after the hit it spins slower.
* **Bowling style:** `bowlingStyle` selects the action (`bowl_fast` / `bowl_seam` / `bowl_spin`) and left-arm bowlers are mirrored.
* **Player appearance:** `src/characters/playerAppearance.ts` - batting hand and bowling arm come from the player data; height is
  a stable 160-200 cm derived from the name (the data has none), applied as a uniform scale so proportions are never distorted.
  The Kits screen has a height slider.
* **Scoreboard:** striker, non-striker and bowler figures come from the real scorecard (supplied by LiveMatchCenter /
  MatchSimulation); nothing is hardcoded.
* **Visuals never contradict the match engine:** `evaluateInterception` takes the engine's ruling (`authoritative`): a Caught
  wicket is always a catch, a non-wicket is never shown as a catch, 4+ runs cannot be stopped, Bowled / LBW never reach the
  field. Property-tested over 3,000 random deliveries (`src/tests/visualConsistency.test.ts`).
* **Already in the game and tested:** toss with recommendation, bat/bowl choice, Test innings order, follow-on, declarations,
  three sessions per 90-over day, results (innings / wickets / runs / tie), field placement and fielder interception.
* **Button audit:** a static scan of 260 buttons found none without a handler and no no-op handlers; a crawl of 13 pages clicked
  ~100 buttons with zero crashes (`tools/kit-preview/crawl.mjs`).

## Broadcast playback and performance updates (feature branch)

- The temporary umpire character placeholders have been removed from the match scene.
- The default 3D view is the TV broadcast camera. Batter, Drone, TV, Bowler, Side, Action and Orbit viewpoints remain selectable.
- A Full / Exit control expands the match view to the browser's fullscreen viewport.
- Rendering is tuned for lower-power GPUs: shadows and antialiasing are disabled in the match canvas and device pixel ratio is capped; procedural character rig solving and React playback-state publication are limited to about 30 updates per second.
- Ball-flight playback duration scales with the ball's route distance. Ball retrieval also scales with distance to the bowler and holds the returned ball visibly at the bowler for a short settle before releasing the next delivery.
- The playback gate still requires both ball retrieval and batter movement to finish before advancing to the next delivery.
- On a wicket, the dismissed batter completes the walk-off first; the replacement batter then enters from the pavilion. The broadcast camera tightens onto the active batter during that transition.
- Bowling plans still select the associated yorker, bouncer / short, slower-ball and swing poses, while spin style takes precedence.

The match poses remain procedural skeletal animation on the existing GLB rig, not newly authored motion-capture clips. Performance settings are intended to reduce UI churn and GPU load; real-world frame rate still depends on the device GPU and should be reviewed on the target hardware.

## Known limits (please read)
* Shirt numbers and heights are generated from the player name (the match data carries neither).
* Bat contact is a visual blend onto the bat blade, not a physics collision; the engine remains the authority on the outcome.
* The upper stand tier is a textured crowd, not individual spectators.
* Practice uses a simple timing model, not the full match engine; it records nothing.
* World Cup teams are the game's franchises / teams; a country-only squad pool depends on the player data.
* `autoSimulateMatch` unlocks the next match-day on a later tick, so "Auto sim stage" runs asynchronously.
* The match view uses lower-cost rendering and throttled rig / UI updates, but frame rate on the target GPU still needs real-device review. Match introductions,
  substitute players and a dedicated celebration camera were not added.

## Screenshot tooling
```bash
mkdir /tmp/shot && cd /tmp/shot && npm i puppeteer-core @sparticuz/chromium
cd <repo>
npx esbuild tools/kit-preview/match.tsx --bundle --format=esm --outfile=tools/kit-preview/dist/match.js --jsx=automatic --define:process.env.NODE_ENV='"production"'
SHOT_DIR=/tmp/shot PAGE=match VW=1500 VH=840 node tools/kit-preview/run.mjs out.png "?bat=India&bowl=Australia&fmt=T20&cam=DRONE&wait=14000"
```
`dist/` is build output - do not commit it.
