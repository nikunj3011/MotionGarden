# MotionGarden

A place for living art. Initial implementation based on the supplied generative-art specification, renamed from FormaFlux at the owner's request.

**Music:** open Works → Music for Ambient, Polyrhythm and Arpeggio pieces synthesized locally from mathematics, with no AI or recordings. A random piece attempts to autoplay on each load/refresh unless previously muted; if the browser blocks it, tap Sound or interact to begin. Use the top sound/mute control, the Music link, or the music player's Play/Stop, New seed and Random piece controls. See [mathematical music](docs/mathematical-music.md). The Explore nav link was removed; the logo returns home.

This repository contains the first vertical slice, **not the complete platform**: a React gallery and immersive player, a shared TypeScript engine interface and two adapters, versioned JSON packages, and native Compose / SwiftUI hosts. The two original demos are Quiet currents (p5.js flow field) and Orbital bloom (Three.js torus sculpture). Their gallery thumbnails are generated SVG illustrations, not rendered captures.

## Start the website

Install Node 22+, then run:

```sh
npm install
npm run dev
```

Open the local Vite URL. The React exhibition has a textured setting, oversized typography, top category filters, and a full-page transparent live artwork. Scroll over the stage, swipe/drag horizontally, use arrow keys with the stage focused, or use the previous/next buttons. Only one live preview runs at a time. A transition captures the exact currently rendered canvas, keeps it visible while the next renderer loads, and reveals the next work through a scan/materialize effect. It never substitutes a thumbnail. Reduced-motion preference disables spatial effects and starts art paused.

Use **Works** for the complete name index, searchable by title, creator, tags, category and engine, with name/category sorting and saved favorites. Enter a work to change parameters, apply a preset, pause, generate a seed, export PNG, or enter fullscreen. Saved favorites and one custom preset per artwork live on this device.

On the main page, artwork is composited transparently across the full page with no separate black/white canvas rectangle, and “ART IN” / “MOTION” sit at the lower corners of the stage. The header and bottom controls use subtle translucent surfaces for readability. **Expand artwork** opens the full player, which retains its opaque themed canvas. **Colors** lets you edit, add or remove up to eight colors; the renderer interpolates every selected shade across particles and sculpture rings. Dark/White mode changes the page surface and expanded canvas background and selects a separate saved palette for each mode: deeper colors on white, lighter colors on dark. Custom palettes and theme persist locally in this browser.

Saved artworks are local bookmarks (artwork IDs), not downloaded artwork files or cloud projects. Favorites, numeric presets, palette and theme use localStorage for this site/browser profile. Clearing site data removes them; there is no cross-device synchronization.

On mobile, **only the expanded artwork player** uses a draggable bottom sheet. It starts as a small bar to leave more artwork visible. Tap the bar, drag it up/down, or use Arrow Up/Down and Escape to expand/minimize it. The sheet has White and Dark styling, safe-area spacing and its own scrollable controls; desktop keeps the side panel and the main-page controls are unchanged.

**New seed** creates a complete variation: a different seed, motion, intensity and a new palette appropriate to the current theme. Sliders visibly update and remain within their declared ranges/steps. Paused artwork also refreshes. Save/restore now includes the palette alongside numeric parameters, with support for older numeric-only saved presets.

```sh
npm run test:content
npm test
npm run build
npx playwright install chromium
npm run test:ui
```

`build` type-checks the web/shared TypeScript and builds both HTML entrypoints. It only updates the web distribution. The current design iteration is React-first: native UI and packaged assets are intentionally left alone until the web experience is settled. Later, `npm run package:native` explicitly copies the built renderer/assets/catalog/artwork bundle to both mobile projects. Neither command builds a native app. Do not regenerate an already published version: the demo content generator is for unpublished development only.

## Native hosts

When native work resumes, run `npm run build` and `npm run package:native`, then open `apps/android` in Android Studio with JDK 17, Android SDK 35, and Gradle 8.9. There is no checked-in Gradle wrapper yet; use your installed Gradle or generate the wrapper with `gradle wrapper --gradle-version 8.9`, then run `gradle :app:assembleDebug`. The Compose app reads the bundled JSON catalog and uses WebViewAssetLoader at a controlled HTTPS asset origin. External requests and navigations are blocked. No privileged JavaScript bridge is exposed.

On macOS install Xcode and XcodeGen, run `cd apps/ios && xcodegen generate`, open `MotionGarden.xcodeproj`, choose a development team and simulator, then build. The SwiftUI app loads the same catalog and serves the renderer through a restricted WKURLSchemeHandler (`garden://localhost`). Custom-scheme ES-module loading, CORS and WebGL must be tested on the target iOS release before shipping. This project cannot be built or simulator-tested on Windows.

Native clients currently provide a native list, navigation, player, parameter sliders and lifecycle pause/disposal. Favorites, download management, native error/retry surfaces, full schema parity, background tests, native export and polished adaptive native layouts remain subsequent work. Bundling gives offline access without internet permission. Remote native catalog refresh is not implemented yet.

## Verification status

Executed successfully: `npm run test:content` (5 tests), `node tools/validate.mjs` (2 valid packages), `npm test` (15 tests), and `npm run build` (TypeScript and production Vite build; no native packaging in the React iteration). Chromium browser tests passed (24 tests) against the development server, including viewport fitting and actual artwork background changes. The earlier 11-test suite also passed against production preview before the final viewport adjustment. The production build reports large vendor-chunk warnings for p5 and Three.js.

The p5 adapter uses the official minified distribution to avoid the development build's eval-based sketch reader. It predeclares the legacy regenerator global so that shim does not use a Function() fallback. The renderer retains `script-src 'self'` without `unsafe-eval`. Regression tests listen for actual CSP violations and require READY plus a visible canvas. To test the production build in PowerShell: `$env:MOTIONGARDEN_TEST_PREVIEW='1'; npm run test:ui`.

Android/iOS application builds and device tests remain **unrun**; packaging native assets is not a native build. No Cloudflare deployment occurred. Initial dependency-install failures were resolved before this follow-up verification. The repository now includes a dependency lockfile.

See [architecture](docs/architecture.md), [milestones](docs/milestones.md), [test plan](docs/testing.md) and [Cloudflare setup](infrastructure/cloudflare/README.md).





The current non-text color system follows the supplied ivory/gold/muted-blue reference. Text colors, copy and typography are unchanged. Title and artwork-detail reveals are staggered and respect reduced motion. New default palettes use the versioned browser key mg:palettes:v2; previous palettes are retained under their old key.



The main-page live visualizer appears above MOTION. Click it to open the current music viewer without restarting audio, or use the adjacent shuffle button for another soundtrack. Surprise me selects another artwork on the main page or in the expanded player.


React to music is on by default beside the main visualizer and in the expanded player. The current soundtrack modulates the artwork using smoothed bass/mid/treble energy. Toggle it off to restore normal motion while audio keeps playing. The preference persists locally; slider values are preserved, and muting, stopping, backgrounding or reduced motion neutralizes the reaction.

