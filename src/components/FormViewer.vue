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
          <MDBInput label="Schema URI" type="url" v-model="schema" style="margin-top: 1rem" />
          <small>URI to the specific form in the schema document.</small>
          <small class="text-danger" v-if="schemaError"><br>{{ schemaError }}</small>
          <MDBInput label="N3 Conversion Rules URL" type="url" v-model="invertedRules" style="margin-top: 1rem" />
          <small>Rules to convert changes back to the original ontology.</small>
          <small class="text-danger" v-if="invertedRulesError"><br>{{ invertedRulesError }}</small>
        </MDBCardText>

        <MDBBtn color="primary" @click="execute" id="execute-btn">Load</MDBBtn>
      </MDBCardBody>
    </MDBCard>

    <MDBCard>
      <MDBCardBody class="w-100">
        <MDBCardTitle>Form</MDBCardTitle>
        <MDBCardText>
          <div v-if="fields.length">
            <div v-for="(field, index) in fields" :key="index">
              <div v-if="field.type === 'SingleLineTextField'" style="margin-bottom: 1rem">
                <MDBInput :label="field.label" type="text" v-model="field.value" />
                <small>{{ field.property }}</small>
              </div>

              <div v-if="field.type === 'MultiLineTextField'" style="margin-bottom: 1rem">
                <MDBInput :label="field.label" type="textarea" v-model="field.value" />
                <small>{{ field.property }}</small>
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

export default {
  name: "FormViewer",
  components: {
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
      invertedRules: "",
      schema: "",
      docError: "",
      rulesError: "",
      invertedRulesError: "",
      schemaError: "",
      engine: new QueryEngine(),
      fields: [],
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
        if (parsedQuery.schema) {
          this.schema = parsedQuery.schema;
        }
        if (parsedQuery.invertedRules) {
          this.invertedRules = parsedQuery.invertedRules;
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
          schema: this.schema,
          invertedRules: this.invertedRules,
        },
      });
    },
    async execute(event) {
      event.preventDefault();

      this.docError = this.isValidUrl(this.doc) ? "" : "Please enter a valid URL.";
      this.rulesError = this.isValidUrl(this.rules) ? "" : "Please enter a valid URL.";
      this.invertedRulesError = this.isValidUrl(this.invertedRules) ? "" : "Please enter a valid URL.";
      this.schemaError = this.isValidUrl(this.schema)
        ? this.schema.includes("#")
          ? ""
          : "Make sure to enter a URI to a specific form schema instead of a document URL."
        : "Please enter a valid URI.";

      if (this.docError || this.rulesError || this.invertedRulesError || this.schemaError) {
        return;
      }

      const n3doc = await this.loadContentOfUrl(this.doc);
      const n3rules = await this.loadContentOfUrl(this.rules);
      const n3invertedRules = await this.loadContentOfUrl(this.invertedRules);
      const n3schema = await this.loadContentOfUrl(this.schema);

      console.log("n3doc", n3doc);
      console.log("n3rules", n3rules);
      console.log("n3invertedRules", n3invertedRules);
      console.log("n3schema", n3schema);

      this.fields = await this.parseSchema(n3schema);
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
    async parseSchema(n3schema) {
      const query = `
      PREFIX ui: <http://www.w3.org/ns/ui#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT ?type ?property ?label WHERE {
        <${this.schema}> ui:parts ?list .
        ?list rdf:rest*/rdf:first ?field .
        ?field a ?type;
          ui:property ?property.
        OPTIONAL {
          ?field ui:label ?label.
        }
      }
      `;

      const fields = await (
        await this.engine.queryBindings(query, {
          sources: [
            {
              type: "stringSource",
              value: n3schema,
              mediaType: "text/n3",
              baseIRI: this.schema.split("#")[0],
            },
          ],
        })
      ).toArray();

      return fields.map((row) => {
        return {
          type: row.get("type").value.split("#")[1],
          property: row.get("property").value,
          label: row.get("label")?.value,
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
    schema: function () {
      this.updateQueryParams();
    },
    invertedRules: function () {
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
