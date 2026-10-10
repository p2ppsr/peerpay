# Development, configuration, and deployment

[Back to the builder guide](README.md)

## Frontend development

Use Node 22.12+ in the Node 22 line. From the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Vite uses port 5173 with `strictPort: true`. The checked-in server configuration binds broadly (`host: true`) and allows all hosts. Use it on a trusted development network; a local-only session can run `npm run dev -- --host 127.0.0.1`. Do not expose the Vite development server as production hosting.

For camera scanning, use HTTPS or loopback localhost with browser camera permission. Opening a phone on a plain HTTP LAN address is not the same secure context as localhost on that phone. The wallet bridge must also work in the chosen browser/WebView and origin.

## Dependencies and validation

There are two independent npm projects, not an npm workspace. `frontend/package-lock.json` controls the app; the root lockfile controls deployment tooling. `npm ci` installs exactly the appropriate lockfile instead of resolving a new dependency set.

| Tool/package | Role in this repository |
| --- | --- |
| React 18 / ReactDOM | Component state/effects and root rendering. |
| MUI 5 / Emotion / Sass | UI components, theme, and application styles. |
| Vite / TypeScript | Dev server and bundling / separate static checking. |
| Vitest | Offline regression suite. |
| `@bsv/sdk` | Wallet, identity, transaction, remittance, and cryptographic primitives. |
| `@bsv/message-box-client` | Peer payment and message transport client. |
| `@bsv/identity-react` / `@bsv/uhrp-react` | Identity discovery/display and hash-addressed media. |
| `@babbage/go` | Wallet integration/onboarding wrapper. |
| `qr-scanner` / `qrcode` | Camera decoding / QR generation helpers. |
| `react-toastify` | Outcome notifications. |
| `@p2ppsr/lars` / `@p2ppsr/cars-cli` | Root local/cloud orchestration. |

From `frontend/`:

```sh
npm test
npx tsc --noEmit
npm run build
npm audit
```

The existing 16 tests cover amount parsing/formatting, transaction normalization, wallet-result adaptation, and telemetry redaction/bucketing. They do **not** prove live wallet integration, certificate discovery, actual camera behavior, successful refunds, or end-to-end payment completion. Use the [demo acceptance steps](demo.md) for those behaviors. There is no configured lint script; the old `eslintConfig` metadata is not a runnable lint check.

Documentation validation on 2026-10-09 used Node 22.21.1 for tests, TypeScript, and the Vite build. All passed. The build reports a large-chunk warning. The locked frontend dependency audit reported **9 findings (7 high, 2 moderate)**, including dependency chains under Identity React and Vitest; this documentation change does not remediate them. Re-run the audit for current details, review dependency migrations as behavior changes, and requalify wallet and identity flows. Do not treat a successful build or lockfile as a security certification.

## Configuration map

There is no documented `.env` interface in the current app. Configuration is in source and the deployment manifest:

| Location | Setting |
| --- | --- |
| [constants.ts](../frontend/src/utils/constants.ts) | Message Box host; local/staging and production branches currently use the same public URL. |
| [peerPayClient.ts](../frontend/src/utils/peerPayClient.ts) | Wallet/client composition, logging disabled, wallet-unavailable title. |
| [telemetry.ts](../frontend/src/utils/telemetry.ts) | Usercom endpoint, source name, queue/sanitization policy. |
| [vite.config.mjs](../frontend/vite.config.mjs) | Port, dev-server exposure, output directory `build`. |
| [deployment-info.json](../deployment-info.json) | Frontend source directory and LARS/CARS configurations, both set to mainnet. |
| [frontend/package.json](../frontend/package.json) | Frontend release label used by telemetry. |

Changing the Message Box URL does not change the wallet's blockchain network or all underlying overlay defaults. An isolated environment requires compatible wallet, storage, messaging, discovery, and network configuration. No turnkey local mock wallet or isolated payment backend is included.

## Static build and preview

```sh
cd frontend
npm run build
npx vite preview --host 127.0.0.1
```

Serve the **contents of `frontend/build/`** through an HTTPS static host for an independent deployment. This app uses root-relative public assets; hosting under a URL subpath needs an explicit asset/base-path review. The root `frontend/index.html` is Vite's entry point; `frontend/public/index.html` is not where you add the application's module entry.

A successful static response checks hosting only. Validate the wallet bridge, identity lookup, contacts, inbox, camera, and payment lifecycle from the deployed origin. Browser origins affect permissions. Static frontend configuration and `VITE_*` values are public; never place a wallet private key or deploy credential in them.

## Root tooling: LARS and CARS

Optional orchestration setup starts at the repository root:

```sh
npm ci
npm run lars:config
```

`deployment-info.json` defines a frontend-only Local LARS configuration and an existing PeerPay CARS production project. The root scripts mean:

| Command | Actual script | Intended role |
| --- | --- | --- |
| `npm start` | `lars start` | Start configured local orchestration. |
| `npm run build` | `cars build 1` | Build the configured CARS artifact. |
| `npm run deploy` | `cars deploy now 1` | Existing deployment script; this can change a real project. |

LARS/CARS are optional for learning the frontend. Check the installed CLI help and provider requirements before using them. A fork must create its **own** project/configuration rather than deploying to the checked-in operator project. Review messaging, telemetry, wallet/network defaults, branding, and licensing as part of adapting a fork.

## Maintainer production workflow

[deploy.yaml](../.github/workflows/deploy.yaml) runs on pushes to `master` and manual dispatch. It installs root locked dependencies, installs the current CARS CLI globally, builds configuration `1`, checks transport/project balance, and calls `cars release now 1`. It uses `CARS_PRIVATE_KEY` and optionally `CARS_WALLET_STORAGE` from GitHub repository secrets. Its balance step can fund the configured project. Do not run production commands to validate a README example.

The workflow's global `@latest` CLI installation means root `npm ci` alone does not freeze the entire release toolchain. The checked-in workflow does not explicitly run the frontend tests or TypeScript check; run them before release. A release command must succeed and emit `CARS_RELEASE_SUCCESS`; then corroborate the deployed revision and public assets and complete wallet-aware validation.

Documentation-only commits can use GitHub's `[skip ci]` commit marker to avoid the push-triggered production rollout. That skips CI too, so perform local documentation/example checks. Runtime or dependency changes require normal release validation. For the operated Evans Creek service, follow the operator's source-owned availability and rollback procedures; this frontend guide does not replace them.

Rollback is a reviewed source revert followed by the normal release path and live validation. A static application rollback does not reverse payments already created or change wallet records.
