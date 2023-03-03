# FormViewer

A form viewer app with Solid - Google Forms but the Solid way.

This app allows one to render a form definition together with data to be inserted into the form in a declarative way.
This application natively supports the Solid-UI vocabulary for its input form definition but by passing along a set of
N3 rules containing the mapping from any vocabulary to Solid-UI, it is possible to render any form definition that can
be represented in RDF.

To generate such form definition, one can use the [smessie/FormGenerator](https://github.com/smessie/FormGenerator) app.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Example Form

### SHACL

A very simple form definition in SHACL is passed along together with the rules that are enough to map this definition to Solid-UI.

https://formviewer.smessie.com/?doc=https://solid.smessie.com/private/tests/forms/form-content.ttl&rules=https://solid.smessie.com/private/tests/forms/form-rules.n3&form=https://solid.smessie.com/private/tests/forms/form-content-shacl.ttl%237a48ecdc-80f5-4c1d-86c0-13a93c22c2f2
