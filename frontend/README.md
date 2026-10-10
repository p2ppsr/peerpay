# PeerPay frontend

This directory contains the React/Vite application. Start with the [repository README](../README.md) for the builder overview, wallet prerequisites, and concept guides.

Use Node 22.12+ in the Node 22 line. From this directory:

```sh
npm ci
npm run dev
```

Open http://localhost:5173 in an environment with a reachable BRC-100 wallet. Local development uses the public Message Box endpoint; it is not an isolated payment sandbox.

```sh
npm test
npx tsc --noEmit
npm run build
npx vite preview --host 127.0.0.1
```

The static build goes to `build/`. The root scripts have different meanings: they operate LARS/CARS rather than this Vite development server.

- [Two-wallet demo](../docs/demo.md)
- [Architecture and component contracts](../docs/architecture.md)
- [Concept guide](../docs/README.md)
- [Builder exercises](../docs/builder-lab.md)
- [Development, configuration, and deployment](../docs/development.md)
- [Troubleshooting](../docs/troubleshooting.md)
