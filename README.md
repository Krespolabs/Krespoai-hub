# KrespoAI Hub

KrespoAI Hub is a React single-page application built with Vite. Its UI is aimed at creators and entrepreneurs and includes a dashboard, account screens, tool interfaces, a prompt-pack marketplace, and supporting library/profile views.

## What is implemented

- **Authentication and account data:** the app contains Supabase Auth and REST calls for user profiles, saved outputs, transactions, purchases, and marketplace listings. These flows require the Supabase project and database policies/schema expected by the app.
- **Demo mode:** users can enter the app without signing in. Demo state is held in app memory and is not saved across page reloads; it is not a persistent account.
- **Marketplace:** the UI displays five built-in sample prompt packs and supports searching, category filtering, sorting, and listing/buying flows. The built-in packs are sample data, not verified third-party products.
- **Tool screens:** the app includes interfaces for ebook, prompt, content, business, and health/education workflows. The generation helper currently sends a request directly from the browser to Anthropic without an authorization header or a server-side proxy. **AI generation is therefore not configured as a working production feature and may fail.** Do not put a private API key in browser code.

This README describes the code in this repository; it does not claim a currently verified deployment or operational AI service.

## Tech stack

- React 18 and JavaScript/JSX
- Vite 6
- Supabase client calls implemented with `fetch`
- Vercel rewrite configuration in `vercel.json`

## Project structure

- `App.jsx` — application UI, state, and integrations
- `main.jsx` — React entry point
- `index.html` — HTML shell
- `vite.config.js` — Vite configuration
- `tests/App.test.jsx` — component interaction tests
- `.github/workflows/ci.yml` — test and build workflow

## Requirements

- Node.js 20 or later
- npm

## Install and run

```sh
npm ci
npm run dev
```

Vite prints the local development URL in the terminal.

## Tests and production build

```sh
npm test
npm run build
```

The tests use Node's built-in test runner, jsdom, and Testing Library to mount the real React app and exercise sign-in validation, demo entry, dashboard navigation, and marketplace category filtering. They do not call Supabase or Anthropic. GitHub Actions runs `npm ci`, `npm test`, and `npm run build` on pushes and pull requests.

## Author

**Krespo (Samson Onuh)** — Founder, Krespo Labs

- LinkedIn: [linkedin.com/in/onuh-samson-4658aa2a2](https://www.linkedin.com/in/onuh-samson-4658aa2a2/)
- Website: [krespoai.netlify.app](https://krespoai.netlify.app)
- GitHub: [github.com/Krespolabs](https://github.com/Krespolabs)
- Portfolio PDF: [Samson Onuh portfolio](https://github.com/Krespolabs/Krespolabs-/blob/main/docs/portfolio_samson_onuh.pdf)
