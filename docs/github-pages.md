# GitHub Pages

In the repository open Settings -> Pages -> Build and deployment, and choose GitHub Actions.

Push to `main` to check formatting, lint and content, build the site and deploy `dist/`. Pull requests and other branches run the checks/build without publishing. You can also run the workflow manually from Actions on `main`.

The workflow reads the Pages base path automatically, so this repository can run at `https://nikunj3011.github.io/MotionGarden/`. Hash navigation keeps deep links refreshable on static hosting, for example `/MotionGarden/#/art/flow-field`. Local development and normal builds keep the existing BrowserRouter; the Pages workflow enables hash mode explicitly.

Music catalogs, artwork manifests, thumbnails, renderer frames and sketch imports all use the configured base path. No Cloudflare account or deployment secret is required; publishing uses the workflow token and the github-pages environment.

Local Pages-style build in PowerShell:

```powershell
$env:VITE_BASE_PATH='/MotionGarden/'
$env:VITE_ROUTER_MODE='hash'
npm run build
Remove-Item Env:VITE_BASE_PATH, Env:VITE_ROUTER_MODE
```

GitHub Pages ignores Cloudflare `_headers`. The renderer's HTML CSP remains in place, but Cloudflare-specific cache and response-header settings require hosting that supports them. Native assets are not packaged or built by this workflow.

The workflow has been prepared locally; a successful GitHub Actions run and a live deployment must be verified after pushing.

References: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [Vite deployment](https://vite.dev/guide/static-deploy.html).
