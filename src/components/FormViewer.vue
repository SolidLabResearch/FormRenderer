<template>
  <MDBContainer>
    <h1>FormViewer</h1>

    <MDBCard>
      <MDBCardBody class="w-100">
        <MDBCardTitle>Authentication</MDBCardTitle>
        <MDBCardText>
          <div v-if="loggedIn">
            <p class="text-success">
              You are logged in as <em>{{ loggedIn }}</em
              >.
            </p>
            <MDBBtn color="primary" @click="logout">Logout</MDBBtn>
          </div>
          <div v-else>
            <MDBInput v-model="oidcIssuer" label="OIDC Issuer" type="text" required />
            <small class="text-danger" v-if="authError">{{ authError }}<br /></small>
            <MDBBtn color="primary" @click="login" style="margin-top: 1rem">Login</MDBBtn>
          </div>
        </MDBCardText>
      </MDBCardBody>
    </MDBCard>

    <MDBCard>
      <MDBCardBody class="w-100">
        <MDBCardTitle>Input</MDBCardTitle>
        <MDBCardText>
          <MDBInput label="Dataset URL" type="url" v-model="doc" />
          <small class="text-danger" v-if="docError">{{ docError }}</small>
          <MDBInput label="N3 Conversion Rules URL" type="url" v-model="rules" style="margin-top: 1rem" />
          <small>Leave this URL empty to not apply any schema alignment tasks.</small>
          <small class="text-danger" v-if="rulesError"><br>{{ rulesError }}</small>
          <MDBInput label="Form description URI" type="url" v-model="form" style="margin-top: 1rem" />
          <small>URI to the specific form in the form description document.</small>
          <small class="text-danger" v-if="formError"><br>{{ formError }}</small>
        </MDBCardText>

        <MDBBtn color="primary" @click="execute" id="execute-btn">Load</MDBBtn>
      </MDBCardBody>
    </MDBCard>

    <MDBCard>
      <MDBCardBody class="w-100">
        <MDBCardTitle>Form</MDBCardTitle>
        <MDBCardText>
          <div v-for="(error, index) in errors" :key="index" class="alert alert-danger" role="alert">
            {{ error }}
          </div>
          <div v-if="fields.length">
            <div v-for="(field, index) in fields" :key="index">
              <div v-if="field.type === 'SingleLineTextField'" style="margin-bottom: 3rem">
                <SingleLineTextField :field="field" :index="index" />
              </div>

              <div v-if="field.type === 'MultiLineTextField'" style="margin-bottom: 3rem">
                <MultiLineTextField :field="field" :index="index" />
              </div>

              <div v-if="field.type === 'BooleanField'" style="margin-bottom: 3rem">
                <BooleanField :field="field" :index="index" />
              </div>

              <div v-if="field.type === 'DateField'" style="margin-bottom: 3rem">
                <DateField :field="field" :index="index" />
              </div>

              <div v-if="field.type === 'Choice'" style="margin-bottom: 3rem">
                <ChoiceField :field="field" :index="index" />
              </div>
            </div>
          </div>
          <div v-else>
            <p>No data to display.</p>
          </div>
        </MDBCardText>
      </MDBCardBody>
    </MDBCard>
  </MDBContainer>
</template>

<script>
import { MDBBtn, MDBCard, MDBCardBody, MDBCardText, MDBCardTitle, MDBContainer, MDBInput } from "mdb-vue-ui-kit";
import { fetch, getDefaultSession, handleIncomingRedirect, login, logout } from "@inrupt/solid-client-authn-browser";
import { QueryEngine } from "@comunica/query-sparql-solid";
import { v4 as uuid } from "uuid";
import SingleLineTextField from "@/components/fields/SingleLineTextField.vue";
import MultiLineTextField from "@/components/fields/MultiLineTextField.vue";
import BooleanField from "@/components/fields/BooleanField.vue";
import DateField from "@/components/fields/DateField.vue";
import ChoiceField from "@/components/fields/ChoiceField.vue";
import { n3reasoner } from "eyereasoner";

export default {
  name: "FormViewer",
  components: {
    SingleLineTextField,
    MultiLineTextField,
    BooleanField,
    DateField,
    ChoiceField,
    MDBContainer,
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBCardText,
    MDBInput,
    MDBBtn,
  },
  data() {
    return {
      oidcIssuer: "",
      authError: null,
      loggedIn: null,
      doc: "",
      rules: "",
      form: "",
      docError: "",
      rulesError: "",
      formError: "",
      engine: new QueryEngine(),
      fields: [],
      errors: [],
    };
  },
  created() {
    // Restore solid session
    handleIncomingRedirect({
      restorePreviousSession: true,
    }).then((info) => {
      this.loggedIn = info.webId;

      // Restore input data - Step 2
      const query = localStorage.getItem("query");
      if (query) {
        const parsedQuery = JSON.parse(query);
        if (parsedQuery.doc) {
          this.doc = parsedQuery.doc;
        }
        if (parsedQuery.rules) {
          this.rules = parsedQuery.rules;
        }
        if (parsedQuery.form) {
          this.form = parsedQuery.form;
        }
      }
    });

    // Restore input data - Step 1
    // 2 steps because `handleIncomingRedirect` is triggers page reload resulting in loss of query data.
    this.$watch(
      () => this.$route.query,
      () => {
        const query = this.$route.query;
        if (Object.keys(query).length && !("code" in query)) {
          localStorage.setItem("query", JSON.stringify(query));
        }
      },
      { immediate: true }
    );
  },
  methods: {
    async login() {
      await handleIncomingRedirect();

      // 2. Start the Login Process if not already logged in.
      if (!getDefaultSession().info.isLoggedIn) {
        await login({
          // Specify the URL of the user's Solid Identity Provider;
          // e.g., "https://login.inrupt.com".
          oidcIssuer: this.oidcIssuer,
          // Specify the URL the Solid Identity Provider should redirect the user once logged in,
          // e.g., the current page for a single-page app.
          redirectUrl: window.location.href,
          // Provide a name for the application when sending to the Solid Identity Provider
          clientName: "FormViewer",
        }).catch((e) => {
          this.authError = e.message;
        });
      }
    },
    async logout() {
      await logout();
      this.loggedIn = undefined;
    },
    updateQueryParams() {
      this.$router.push({
        query: {
          doc: this.doc,
          rules: this.rules,
          form: this.form,
        },
      });
    },
    async execute(event) {
      event.preventDefault();
      this.errors = [];

      this.docError = this.isValidUrl(this.doc) ? "" : "Please enter a valid URL.";
      this.rulesError = !this.rules || this.isValidUrl(this.rules) ? "" : "Please enter a valid URL.";
      this.formError = this.isValidUrl(this.form)
        ? this.form.includes("#")
          ? ""
          : "Make sure to enter a URI to a specific form description instead of a document URL."
        : "Please enter a valid URI.";

      if (this.docError || this.rulesError || this.formError) {
        return;
      }

      const n3doc = await this.loadContentOfUrl(this.doc);
      let n3form = await this.loadContentOfUrl(this.form);

      console.log("n3doc", n3doc);
      console.log("n3form", n3form);

      if (this.rules) {
        // Apply schema alignment rules
        const n3rules = await this.loadContentOfUrl(this.rules);

        // Add base to doc if not yet. Fixing relative IRIs.
        if (!n3form.includes("@base") && !n3form.includes("BASE")) {
          n3form = `@base <${this.doc}> .\n${n3form}`;
        }

        const options = { blogic: false, outputType: "string" };
        n3form = await n3reasoner(n3form, n3rules, options);
        console.log("n3form after rules", n3form);
      }

      this.fields = await this.parseForm(n3form);

      for (const field of this.fields) {
        const data = await this.queryDataForField(n3doc, field);
        console.log("value", data);
        if (!field.multiple && data.length > 1) {
          this.errors.push(`Multiple values found for ${field.label} while only one is expected.`);
        }
        field.values = data || [];

        if (field.required && !field.values.length) {
          field.values = [{ value: undefined, subject: `${this.doc}#${uuid()}` }];
        }
      }
    },
    isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    },
    async loadContentOfUrl(url) {
      const response = await fetch(url, {
        cors: "cors",
      });
      let content = await response.text();

      // Add base to doc if not yet. Fixing relative IRIs.
      if (!content.includes("@base") && !content.includes("BASE")) {
        content = `@base <${url.split("#")[0]}> .\n${content}`;
      }
      return content;
    },
    async parseForm(n3form) {
      const query = `
      PREFIX ui: <http://www.w3.org/ns/ui#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT ?type ?property ?label ?from ?required ?multiple ?sequence WHERE {
        <${this.form}> ui:parts ?list .
        ?list rdf:rest*/rdf:first ?field .
        ?field a ?type;
          ui:property ?property.
        OPTIONAL { ?field ui:label ?label. }
        OPTIONAL { ?field ui:from ?from. }
        OPTIONAL { ?field ui:required ?required. }
        OPTIONAL { ?field ui:multiple ?multiple. }
        OPTIONAL { ?field ui:sequence ?sequence. }
      }
      `;

      const bindings = await (
        await this.engine.queryBindings(query, {
          sources: [
            {
              type: "stringSource",
              value: n3form,
              mediaType: "text/n3",
              baseIRI: this.form.split("#")[0],
            },
          ],
        })
      ).toArray();

      const fields = bindings.map((row) => {
        return {
          type: row.get("type").value.split("#")[1],
          property: row.get("property").value,
          label: row.get("label")?.value,
          from: row.get("from")?.value,
          required: row.get("required")?.value === "true",
          multiple: row.get("multiple")?.value === "true",
          sequence: parseInt(row.get("sequence")?.value),
        };
      });

      // Sort fields by sequence
      fields.sort((a, b) => a.sequence - b.sequence);

      // Add options to Choice fields
      for (const field of fields) {
        if (field.type === "Choice") {
          field.options = [];
          const query = `
          PREFIX ui: <http://www.w3.org/ns/ui#>
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
          SELECT ?value ?label WHERE {
            ?value a <${field.from}> ;
              skos:prefLabel ?label.
          }
          `;

          const bindings = await (
            await this.engine.queryBindings(query, {
              sources: [
                {
                  type: "stringSource",
                  value: n3form,
                  mediaType: "text/n3",
                  baseIRI: this.form.split("#")[0],
                },
              ],
            })
          ).toArray();

          field.options = bindings.map((row) => {
            return {
              value: row.get("value").value,
              label: row.get("label").value,
            };
          });
        }
      }

      return fields;
    },
    async queryDataForField(data, field) {
      const query = `
      SELECT ?s ?value WHERE {
        ?s <${field.property}> ?value.
      }
      `;

      const bindings = await (
        await this.engine.queryBindings(query, {
          sources: [
            {
              type: "stringSource",
              value: data,
              mediaType: "text/n3",
              baseIRI: this.doc.split("#")[0],
            },
          ],
        })
      ).toArray();

      return bindings.map((row) => {
        return {
          subject: row.get("s").value,
          value: row.get("value").value,
        };
      });
    },
  },
  watch: {
    doc: function () {
      this.updateQueryParams();
    },
    rules: function () {
      this.updateQueryParams();
    },
    form: function () {
      this.updateQueryParams();
    },
  },
};
</script>

<style scoped>
h1 {
  margin-top: 3rem;
  margin-bottom: 3rem;
}
.card {
  margin-bottom: 2rem;
}
</style>
