# React-only dashboard E2E

This Playwright test starts the Create React App development server and installs a browser-side
WebSocket mock before the application bootstraps. It does not start, connect to, or require the
Java backend.

One-time browser setup:

```powershell
npm run test:e2e:install
```

Run the headless test:

```powershell
npm run test:e2e
```

Use `npm run test:e2e:headed` when an interactive browser is useful for debugging.
