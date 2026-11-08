# Bright Arcade

Free browser games at https://brightarcade.in/. Buildless HTML, CSS and JavaScript, published using the existing GitHub Pages configuration.

## Site structure

- `index.html`: searchable game grid and static directory for all 53 games.
- `*-games.html`: six browseable category collections.
- `2048-strategy.html`, `typing-practice.html`, `flappy-dash-tips.html`: worked examples and practice guides linked from the relevant games and collections.
- `assets/site.css`, `assets/site.js`: shared discovery styles, privacy controls and opt-in Google Analytics.
- `privacy.html`, `about.html`, `contact.html`: site information.
- `sitemap.xml`, `robots.txt`, `ads.txt`: discovery and publisher configuration.
- `404.html`: non-indexable recovery page for missing URLs; intentionally excluded from the sitemap.

Every HTML page declares its canonical production URL and AdSense verification account `ca-pub-4926802783588277`. No AdSense serving script is loaded. Verification does not mean the site is approved.

## Publishing

Commit the website files including `assets/` to the existing Pages publishing source. Preserve `CNAME`. Check the live homepage, a game, a collection, privacy controls and `/ads.txt` after deployment. The canonical hostname remains `brightarcade.in`.

## Before enabling advertising

Complete payments onboarding, add the domain in AdSense, verify the published meta tag and request site review. Follow Google’s current policies and configure an appropriate certified advertising CMP where required. The analytics controls do not collect advertising consent. Update the privacy policy when advertising is actually enabled. Keep ads clearly separated from gameplay and controls.

Analytics is off by default. Visitors can opt in or withdraw through Privacy choices in the footer. Google Analytics reports therefore represent consenting browsers, not all visitors.

## Maintaining the directory

When adding a game, update the homepage `GAMES` array, static directory, relevant category pages, related-game links and sitemap. New pages need a unique title/description, canonical URL, shared assets and privacy controls. Test touch controls as well as keyboard input. Do not add copied guides or unsupported feature claims.

## Checks

`game-guides.html` covers all 53 games. Three existing long guides remain separate pages; the other 50 practical guides are included on their game pages at `#practice-guide`. Edit the original examples and practice text in `content/game-guides.json`, then run `node scripts/build-guides.cjs`. `node scripts/build-guides.cjs --check` validates coverage and generated content without writing files; it is included in the normal check command. Verify guide claims against the actual game code when mechanics change.

Run `node scripts/run-checks.cjs` before publishing, or `npm run check` if npm is available. No dependency installation is needed: the checks use Node's built-in modules. They validate pages, local links, metadata, the sitemap, privacy controls and selected game regressions, including typing timing, word streaks, score records, Turbo Dash bonuses and Memory Match resets. Browser QA is still required for visual layout and interactions. These checks do not claim to exhaustively test every game or online multiplayer.

## Multiplayer relay

All five friend-mode games use `assets/multiplayer-config.js`. Do not restore the obsolete `openrelay.metered.ca` endpoint. The configured Metered credential is a browser-facing relay credential, not an account secret. Never publish a Metered management secret. The owner chose the no-card TURN TRIAL GLOBAL 500MB plan: relay traffic stops when the quota is reached. Review actual usage before changing plans; do not enable payments automatically.

Direct connections between tabs on one machine do not establish relay availability. Validate with a relay-only data-channel echo test and room creation/join on each game. Cross-device/network confirmation is a separate check. The development relay checker lives outside the published source; do not add it to the sitemap.

Homepage tiles and categories are prerendered so the layout does not depend on the enhancement script. After changing GAMES, CATS or the tile art in index.html, run `node scripts/prerender-home.cjs`, then `node scripts/prerender-home.cjs --check` and the normal checks. The homepage uses optional web fonts to avoid a late typeface swap on slow loads; the system fallback can remain for that visit.

## New game batch

Neon Brick Breaker, Color Sort Puzzle and Mini Golf use assets/arcade-models.js for deterministic rules and assets/new-games.js for input, rendering and browser records. Run node scripts/check-new-games.cjs for puzzle reversibility and ball/rule regression tests. Add an entry to the homepage directory and guide manifest when introducing another game; coverage follows the directory count.

## 25-game collection

The 25 entries in content/collection-games.json are the source for each new page’s introduction, three rules, worked example, practice steps and limitations. Run node scripts/build-collection.cjs, then node scripts/build-guides.cjs after editing that source. The page builder preserves the generated practice section until the guide builder refreshes it. Both --check modes are part of node scripts/run-checks.cjs.

assets/collection-rules.js and collection-action-rules.js contain tested puzzle/board/action rules. collection-board.js and collection-action.js provide DOM controls and canvas rendering. Same-screen modes are local only. Ludo Lite, Kakuro Mini, lattice Hashi, pinball and bowling are explicitly documented compact variants; do not relabel them as full tournament or physical simulations.

node scripts/check-collection.cjs checks 100 seeded puzzle/fleet cases, seed conservation, captures/turns, five Sokoban solutions, bowling bonus scores, dart regions and action interactions. Actual browser input, reset, privacy and responsive checks remain required. No test suite certifies every possible play sequence.

Homepage ordering: CLASSIC_FIRST and orderedGames() in index.html pin 2048, Sudoku and familiar classics above other games. Any additional classic-category games follow the pinned favourites; other games follow those. Both prerendered tiles and client-side filters use this ordering, so prepending a new GAMES entry cannot displace the classics. Do not replace renderGrid with raw GAMES order.
