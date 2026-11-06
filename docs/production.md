# Production readiness

## Included

- Strict script CSP without unsafe-eval, artwork integrity checks and validated same-origin renderer commands.
- Cloudflare Pages `_headers`: content-type protection, referrer privacy, self-only sensors, CSP and cache rules. Renderer framing is restricted to the same origin.
- App recovery screen, artwork retry, interaction toggles, reduced-motion handling and background suspension.
- Reproducible CI install, formatting, lint and web build. Automated test files and their dependencies were removed at the owner’s request.
- Touch defaults on; permission-gated tilt requires explicit activation and HTTPS. No sensor telemetry. [Browser requirements](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).

## Pending release gates

- Real iPhone Safari and Android Chrome: touch, granted/denied permissions, missing sensors, screen rotation, background/resume, accessibility and reduced motion. Synthetic browser events do not establish device compatibility.
- HTTPS staging: verify actual response headers, SPA deep links, caching and same-origin R2 routing. Vite preview does not apply Pages headers.
- Conditional publishing writes and durable catalog history before concurrent publishing; see infrastructure/cloudflare/README.md. Never overwrite published v1 content.
- Dependency/advisory and license review, low-end phone performance/battery tests, and font hosting review if offline/privacy requirements demand it.
- Privacy/support pages with the owner's real contact and policy before launch. Select an error-reporting service and consent policy before adding remote telemetry.
- Native phase: Gradle wrapper, signed builds, iOS secure-origin/sensor bridge design, permissions, audio focus, lifecycle, export/storage behavior, crash reporting and store disclosures/screenshots.
- Accounts, cloud sync, payments and service-worker offline support remain separate product decisions. Browser storage remains local and may be cleared by the browser.

No deployment, physical-device test, Android build or iOS build is implied by this checklist. Native assets were not refreshed during this React iteration.

## Dependency review in this iteration

The production validation dependency and test runner were updated to patched releases. The latest install still reports 10 moderate development-tool advisories in the ESLint/TypeScript-ESLint dependency chain. These remain a release follow-up; no force upgrade or downgrade was applied. Re-run the audit before release.
