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
          <small class="text-danger" v-if="rulesError">{{ rulesError }}</small>
          <MDBInput label="Schema URL" type="url" v-model="schema" style="margin-top: 1rem" />
          <small class="text-danger" v-if="schemaError">{{ schemaError }}</small>
          <MDBInput label="N3 Conversion Rules URL" type="url" v-model="invertedRules" style="margin-top: 1rem" />
          <small>Rules to convert changes back to the original ontology.</small>
          <small class="text-danger" v-if="invertedRulesError">{{ invertedRulesError }}</small>
        </MDBCardText>

        <MDBBtn color="primary" @click="execute" id="execute-btn">Load</MDBBtn>
      </MDBCardBody>
    </MDBCard>
  </MDBContainer>
</template>

<script>
import { MDBBtn, MDBCard, MDBCardBody, MDBCardText, MDBCardTitle, MDBContainer, MDBInput } from "mdb-vue-ui-kit";
import { getDefaultSession, handleIncomingRedirect, login, logout, fetch } from "@inrupt/solid-client-authn-browser";

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
    };
  },
  created() {
    handleIncomingRedirect({
      restorePreviousSession: true,
    }).then((info) => {
      this.loggedIn = info.webId;
    });
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
    async execute(event) {
      event.preventDefault();

      this.docError = this.isValidUrl(this.doc) ? "" : "Please enter a valid URL.";
      this.rulesError = this.isValidUrl(this.rules) ? "" : "Please enter a valid URL.";
      this.invertedRulesError = this.isValidUrl(this.invertedRules) ? "" : "Please enter a valid URL.";
      this.schemaError = this.isValidUrl(this.schema) ? "" : "Please enter a valid URL.";

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
        content = `@base <${url}> .\n${content}`;
      }
      return content;
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
