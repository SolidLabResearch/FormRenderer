# FormRenderer

A form renderer app with Solid - Google Forms but the Solid way.

This app allows one to render a form definition together with data to be inserted into the form in a declarative way.
This application natively supports the Solid-UI vocabulary for its input form definition but by passing along a set of
N3 rules containing the mapping from any vocabulary to Solid-UI, it is possible to render any form definition that can
be represented in RDF.

To generate such form definition, one can use the [smessie/FormGenerator](https://github.com/smessie/FormGenerator) app.

## Notes on the input files

The Dataset file could contain any predefined content that should be inserted in the form loaded from the form description file. 

This FormRenderer application uses the [Solid-UI](http://www.w3.org/ns/ui#) ontology to describe and understand how forms should look like.
However, any ontology can be used to define the form description that is passed along to the application. Here is where the Notation3 conversion rules file comes into play.
This file should contain all rules needed to map the vocabulary used for the given form description towards a description using the Solid-UI vocabulary.
We call this the schema alignment tasks and in fact translates the form description in the data vocabulary to the form description in the app vocabulary (i.e. Solid-UI).
An example of such a rule is the following where we go from a definition using the SHACL vocabulary to a definition in the Solid-UI vocabulary.

```turtle
@prefix shacl: <http://www.w3.org/ns/shacl#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix schema: <http://www.w3.org/2001/XMLSchema#>.

{
    ?uri a shacl:PropertyShape;
        shacl:datatype schema:string;
        shacl:path ?binding.
} => {
    ?uri a ui:SingleLineTextField;
        ui:property ?binding.
}.
```

The form description file should also contain some data that describes what should happen with the data when the submit button is pressed. This is called the footprint tasks.
For this, a basic version of the [Function Ontology (FnO)](https://w3id.org/function/spec) and the policy concept as first described in the [Orchestrator spec](https://mellonscholarlycommunication.github.io/spec-orchestrator/#policy-sec) and [Koreographeye](https://github.com/eyereasoner/Koreografeye) are used.
The following example shows how to define a policy that will be executed when the submit button is pressed.
Multiple policies are supported.

```turtle
@prefix pol: <https://www.example.org/ns/policy#> .
@prefix fno: <https://w3id.org/function/ontology#> .
@prefix ex: <http://example.org/> .

{
    ?id ex:event ex:Submit.
} => {
    ex:PostPolicy pol:policy [
        a fno:Execution ;
        fno:executes ex:httpRequest ;
        ex:method "POST" ;
        ex:url <https://httpbin.org/post> ;
        ex:contentType "application/ld+json"
    ] .
}.
```

Likewise, a policy can be defined that will redirect the user to another page when the submit button is pressed.

```turtle
@prefix pol: <https://www.example.org/ns/policy#> .
@prefix fno: <https://w3id.org/function/ontology#> .
@prefix ex: <http://example.org/> .

{
    ?id ex:event ex:Submit.
} => {
    ex:RedirectPolicy pol:policy [
        a fno:Execution ;
        fno:executes ex:redirect ;
        ex:url <https://formgenerator.smessie.com>
  ] .
} .
```

Lastly, a policy can be defined that will do a N3 Patch request. This is useful for appending data to a Solid resource.

```turtle
@prefix pol: <https://www.example.org/ns/policy#> .
@prefix fno: <https://w3id.org/function/ontology#> .
@prefix ex: <http://example.org/> .

{
    ?id ex:event ex:Submit.
} => {
    ex:RedirectPolicy pol:policy [
        a fno:Execution ;
        fno:executes ex:n3Patch ;
        ex:url <https://httpbin.org/patch>
  ] .
} .
```


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

https://formrenderer.smessie.com/?doc=https://solid.smessie.com/private/tests/forms/form-content.ttl&rules=https://solid.smessie.com/private/tests/forms/form-rules.n3&form=https://solid.smessie.com/private/tests/forms/form-content-shacl.ttl%237a48ecdc-80f5-4c1d-86c0-13a93c22c2f2
