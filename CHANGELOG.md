# Changelog

## Unreleased - 2026-11-05

### Touch and tilt

- Quiet Currents now supports dragging and optional tilt in the main exhibition and expanded player.
- Touch + tilt defaults on, with a shared browser-local off switch. Sensor activation is explicit where browser permission is required. Sensor readings are not stored or uploaded.
- Gestures gently influence existing paths with roughly 1.3-second easing, bounded forces and slow release. Tapping no longer teleports particles.
- Tilt calibrates to the starting position; screen rotation resets calibration. Unsupported, denied and missing sensors have fallbacks.
- Interaction is neutralized while hidden, paused or using reduced motion; listeners are removed on navigation.
- Added deployment headers, an app recovery screen and production-preview browser checks in CI.

### Earlier web milestones

- MotionGarden branding, shared TypeScript renderer, p5.js/Three.js demos, versioned manifests, integrity checks and R2-ready content structure.
- Full-page live gallery, canvas transitions, searchable Works, local favorites, expanded controls and PNG export.
- White/dark themes, editable palettes, full seed variations and browser-local saved moments.
- Mobile draggable controls sheet in the expanded player.
- Procedural Ambient, Polyrhythm and Arpeggio music, music index/viewer, shuffle, mute and honest autoplay fallback.
- Smoothed bass/mid/treble audio reaction with an off switch.
- Transparent music panels, live background visualization, mobile labels and remembered expand/minimize states.
- Exhibition typography: ART & SOUND / IN MOTION.

These describe repository changes, not deployed releases. Android/iOS shells exist; native builds, device verification and store releases remain pending.

- Added Prettier, ESLint (TypeScript and React hook rules), editor settings and formatting/lint CI checks.

- Updated Zod to the patched v4 release and migrated record schemas after a production dependency advisory.

- Patched the test runner, removed critical dependency advisories, and kept Zod validation in CSP-compatible non-JIT mode. Moderate lint-tool advisories remain documented.

### Follow-up cleanup

- Fetch the music catalog from its public URL to avoid Vite public-directory imports.
- Move touch/tilt controls above IN MOTION; keep music beside them on mobile.
- Remove tests, test dependencies, generated captures and output folders as requested. Keep Prettier, lint and build checks in CI.

### GitHub Pages deployment

- Build/check pull requests; publish main through the Pages artifact and deployment actions.
- Use the configured Pages base path for artwork, thumbnails and music, with refreshable hash routes.
- Keep local development and native packaging behavior separate from Pages deployment.

- Replace the rotating gallery star and remaining text arrows with monochrome SVG icons for consistent phone rendering.

- Isolate iframe artwork commands with a versioned message channel and bind cleanup messages to their original renderer window, preventing unrelated page messages from producing navigation errors. Native direct dispatch retains schema validation.

- Tag renderer frame URLs with the build revision so a newly deployed app cannot reuse an older cached renderer HTML entrypoint.

- Make the main-page music panel and bottom artwork/navigation bar more compact on phones, preserving desktop and expanded-view sizing.

- Redesign the mobile main-page music card with readable track typography, a restrained spectrum, flat icon controls and a separated music-reaction row. Remove the oversized background visualization on phones. Desktop and the full music viewer retain their visuals.

- Add stronger mobile music-panel blur and a soft, low-opacity live music visualization behind its controls.

- Add a consistent SVG Home button to the expanded artwork and music viewers, returning directly to the main gallery.

- Refine mobile music with a more transparent glass surface, softer background visualization, clearer typography and a visible music-reaction switch.

- Add a slow CSS rotation to the flower logo, disabled for reduced-motion preferences.

- Rotate only the logo petals; the center, stem and leaves stay still.

- Remove mobile music-panel and visualization blur while retaining the transparent surface.

- Give the mobile music panel explicit light/dark foreground colors, stronger control outlines and a theme-aware background visualizer that remains visible with any artwork palette.

- Remove gallery/Works footer content and make the phone gallery bottom bar transparent in both themes.

- Extend the transparent bottom bar and theme-aware, unblurred main music UI to desktop.
