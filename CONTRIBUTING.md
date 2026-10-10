# Contributing to PeerPay

Start with the [README](README.md), [source map](docs/architecture.md), and [development guide](docs/development.md). The application and the root deployment tooling are separate npm projects.

## Make a focused change

1. Explain the builder/user problem and the intended behavior. For payment or identity changes, name the affected boundary: discovery, selection, transaction creation, transport, internalization, acknowledgement, or presentation.
2. Install the frontend with `npm ci` using Node 22.12+ in the Node 22 line.
3. Keep credentials out of source and preserve the committed lockfiles unless intentionally changing dependencies. Do not run the checked-in production deploy configuration from a fork.
4. Run `npm test`, `npx tsc --noEmit`, and `npm run build` from `frontend/`. Add focused regression coverage when changing behavior at a meaningful boundary.
5. For wallet/identity/payment changes, record the relevant [two-wallet demo](docs/demo.md) results and environment. Offline tests do not establish wallet interoperability.
6. Update the README or concept guide when behavior, configuration, examples, or limitations change. Keep relative links and command working directories accurate.

External contributors should open a focused pull request with the problem, resulting behavior, and validation. Maintainers follow the repository's authorized release process; pushing `master` normally triggers production CARS deployment. Documentation-only commits can use `[skip ci]` after local validation. Do not apply that shortcut to runtime changes.

## Keep the examples educational and accurate

Explain what each layer guarantees and which operations can spend funds or change wallet data. Keep integer satoshi handling and compatibility checks. Do not describe a send toast as final settlement, a QR as proof of identity, or a local alias as a certified claim. Prefer source-linked examples using the locked packages over snippets copied from newer upstream docs.

The [builder lab](docs/builder-lab.md) contains extension ideas and acceptance criteria. Suggested work there is not a promise that those features already exist.

## Bug reports and sensitive information

Use the [troubleshooting report guidance](docs/troubleshooting.md#report-a-useful-issue). Public reports should contain sanitized failures and environment/version information, not wallet keys, recovery phrases, identity/contact data, transaction payloads, or unredacted logs. Arrange a private maintainer channel for sensitive reports; this repository does not currently define a dedicated security-reporting address.

## License clarification

See the [README license status](README.md#license-status). The old README's license claim is not accompanied by a license file in this checkout; this contribution guide does not supply missing terms.
