# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Shopping Search Providers

The search API can merge results from multiple providers:

- Naver Shopping: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- Danawa: `DANAWA_SEARCH_URL_TEMPLATE`, `DANAWA_API_KEY`
- Enuri: `ENURI_SEARCH_URL_TEMPLATE`, `ENURI_API_KEY`

Provider URL templates support `{query}` for the URL-encoded search term and `{apiKey}` for the provider key. Danawa and Enuri are optional because their production access usually depends on official/partner API credentials.
