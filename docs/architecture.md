# Shared execution and content

`packages/artwork-contracts` owns the Zod manifest and command schemas. `artwork-sdk` exposes ArtworkRepository, a static implementation with ETag conditional requests, a bounded retry, persisted JSON fallback, and an interface for a later API. It is deliberately independent of React. Cache keys include the full URL; published package paths are immutable. Future schemas must preserve v1 or provide an explicit migration. Native readers currently validate a subset of the contract; full equivalent schema validation is still required.

`artwork-runtime` selects the p5.js or Three.js library, verifies SHA-256 and size before importing a trusted artwork module, and forwards lifecycle/parameter/capture calls. Modules implement the same instance API. Libraries are bundled by Vite, not fetched from public CDNs. There is no shader adapter yet. Quality currently caps p5 particle count and Three pixel density by screen width; FPS-driven adaptation is not implemented.

The browser communicates with the renderer iframe using source- and origin-checked postMessage and Zod command validation. The native clients can send validated JSON through a frozen dispatch entrypoint; there are no authentication tokens, arbitrary URL opening or privileged native methods in the renderer. INIT, READY, SET_PARAMETERS, RESIZE, PAUSE, RESUME, CAPTURE, ERROR and DISPOSE are represented. Native screenshot responses are not implemented. A ResizeObserver keeps canvas dimensions current. Background visibility respects explicit pause. Context-loss events request a restart; recovery requires device testing.

## Trust boundary

Only developer-reviewed, original bundled artwork is supported. The same-origin iframe sandbox does not isolate malicious JavaScript from the site. Checksums detect mismatched releases, not hostile publishers, and fetch-before-import cannot prevent a server changing bytes between requests. Keep published versions immutable and use a dedicated origin without cookies, credentials or native permissions before executing third-party content. There are no accounts or paid entitlements in this slice. Public source is inspectable. Do not add public uploads or payment authorization to this architecture without a separate authenticated service, stronger execution isolation and a security review.

The renderer CSP blocks external resources; navigation is restricted by native hosts. Package sources are limited to 1 MiB. Cached catalog/manifest JSON is revalidated by Zod on use. Native content comes from the app bundle. Web caching currently covers metadata only; artwork bytes/vendor bundles do not have service-worker offline caching. Storage quota failures are tolerated in the repository, while gallery/preset persistence still needs user-facing quota handling.

There is no purchase processing, telemetry, microphone access, editor or authenticated backend. Pro/editor/accounts are later milestones, not simulated functional features.
