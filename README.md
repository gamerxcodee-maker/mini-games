# Bright Arcade

Free browser games at https://brightarcade.in/. Buildless HTML, CSS and JavaScript, published using the existing GitHub Pages configuration.

## Site structure

- `index.html`: searchable game grid and static directory for all 25 games.
- `*-games.html`: six browseable category collections.
- `2048-strategy.html`, `typing-practice.html`: worked examples and practice guides linked from the relevant games and collections.
- `assets/site.css`, `assets/site.js`: shared discovery styles, privacy controls and opt-in Google Analytics.
- `privacy.html`, `about.html`, `contact.html`: site information.
- `sitemap.xml`, `robots.txt`, `ads.txt`: discovery and publisher configuration.

Every HTML page declares its canonical production URL and AdSense verification account `ca-pub-4926802783588277`. No AdSense serving script is loaded. Verification does not mean the site is approved.

## Publishing

Commit the website files including `assets/` to the existing Pages publishing source. Preserve `CNAME`. Check the live homepage, a game, a collection, privacy controls and `/ads.txt` after deployment. The canonical hostname remains `brightarcade.in`.

## Before enabling advertising

Complete payments onboarding, add the domain in AdSense, verify the published meta tag and request site review. Follow Google’s current policies and configure an appropriate certified advertising CMP where required. The analytics controls do not collect advertising consent. Update the privacy policy when advertising is actually enabled. Keep ads clearly separated from gameplay and controls.

Analytics is off by default. Visitors can opt in or withdraw through Privacy choices in the footer. Google Analytics reports therefore represent consenting browsers, not all visitors.

## Maintaining the directory

When adding a game, update the homepage `GAMES` array, static directory, relevant category pages, related-game links and sitemap. New pages need a unique title/description, canonical URL, shared assets and privacy controls. Test touch controls as well as keyboard input. Do not add copied guides or unsupported feature claims.
