[![Netlify Status](https://api.netlify.com/api/v1/badges/49ae1682-f3f1-4f59-9ae3-14fbaf47ee88/deploy-status)](https://app.netlify.com/sites/neufmoispourtoi/deploys)

# 9moispourtoi

envs:
- https://neufmoispourtoi.app production branch: main database: old prod
- https://preprodneufmoispourtoi.app preproducton branch: preprod database: new prod
- https://development.neufmoispourtoi.app development branch: development database: dev


This project uses template provided by [Vitesse](https://github.com/antfu/vitesse)
<br>

## Tech stack

- [Vue 3](https://github.com/vuejs/vue-next)
- [Netlify functions](https://www.netlify.com/products/functions/) -> documented [here](./docs/netlify.md)
- [Supabase](https://supabase.com/) -> documented [here](./docs/supabase.md)

### UI Frameworks

- [Windi CSS](https://github.com/windicss/windicss) (On-demand [TailwindCSS](https://tailwindcss.com/)) - lighter and faster, with a bunch of additional features!
  - [Windi CSS Typography](https://windicss.org/plugins/official/typography.html)
- [Ionic framework](https://ionicframework.com/)

### Icons

- Whereever possible [Ion Icons](https://ionic.io/ionicons) have been used.

### Internationalization

- [Vue I18n](https://github.com/intlify/vue-i18n-next) - Internationalization
  - [`vite-plugin-vue-i18n`](https://github.com/intlify/vite-plugin-vue-i18n) - Vite plugin for Vue i18n

### Coding Style

- Use Composition API with [`<script setup>` SFC syntax](https://github.com/vuejs/rfcs/pull/227)
- [ESLint](https://eslint.org/) with [@antfu/eslint-config](https://github.com/antfu/eslint-config), single quotes, no semi.

### Dev tools

- [TypeScript](https://www.typescriptlang.org/)
- [Cypress](https://cypress.io/) - E2E Testing
- [pnpm](https://pnpm.js.org/) - fast, disk space efficient package manager
  - [critters](https://github.com/GoogleChromeLabs/critters) - Critical CSS
- [Netlify](https://www.netlify.com/) - zero-config deployment
- [VS Code Extensions](./.vscode/extensions.json)
  - [Vite](https://marketplace.visualstudio.com/items?itemName=antfu.vite) - Fire up Vite server automatically
  - [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) - Vue 3 `<script setup>` IDE support
  - [Iconify IntelliSense](https://marketplace.visualstudio.com/items?itemName=antfu.iconify) - Icon inline display and autocomplete
  - [i18n Ally](https://marketplace.visualstudio.com/items?itemName=lokalise.i18n-ally) - All in one i18n support
  - [Windi CSS Intellisense](https://marketplace.visualstudio.com/items?itemName=voorjaar.windicss-intellisense) - IDE support for Windi CSS
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
Volar take over mode : https://github.com/johnsoncodehk/volar/discussions/471

## Project structure

- `/src` contains front-end code
- `/locales` contains the i18n data
- `./netlify/functions` contains the netlify functions
- `/public` contains static files required for the app
- `/sql` contains the sql snippets used in _Supabase_

## Setup

### Prerequisites 

- Node __v16.x.x__ (14.x.x will also work but for testing it might break)
- __pnpm__ - if you don't have pnpm installed run `npm install -g pnpm`

### Clone to local

Clone project locally and run

```bash
pnpm i
```

### Development

Just run and visit http://localhost:3333

```bash
pnpm dev
```

_Note_: This will also spin up netlify functions at http://localhost:8885

### Build

To build the App, run

To build for mobile production, be sure to have `.env.production` file created

```bash
pnpm build
```

And you will see the generated file in `dist` that ready to be served.

### Build mobile

Build with .env.mobile nd copy to android and ios

```bash
pnpm mobile
```

Then open the the project with `cap open ios`

If cap don't work install it with `pnpm i -g @capacitor/cli`

to add new module install it and then do `cap sync`
### Service worker

Because service worker needs to be bundled (since browsers don't yet support import in this context), and depends on the client-side app's build manifest, service workers only work in the production build, not in development. To test it locally, use `pnpm preview` __after__ running `pnpm build`.  

## Android

The password of the signkey is `9moispourtoi`


## Database schema


![Database schema](./Supbase_Schema.png)
