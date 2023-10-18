<template>
  <a href="https://github.com/smessie/FormRenderer"
  ><img
      loading="lazy"
      width="149"
      height="149"
      src="/forkme_right_gray.png"
      class="attachment-full size-full fork"
      alt="Fork me on GitHub"
      data-recalc-dims="1"
  /></a>
  <MDBContainer>
    <h1>FormRenderer</h1>

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
            <MDBInput v-model="oidcIssuer" label="OIDC Issuer" type="text" required/>
            <small class="text-danger" v-if="authError">{{ authError }}<br/></small>
            <MDBBtn color="primary" @click="login" style="margin-top: 1rem">Login</MDBBtn>
          </div>
        </MDBCardText>
      </MDBCardBody>
    </MDBCard>

    <MDBCard>
      <MDBCardBody class="w-100">
        <MDBCardTitle>Input</MDBCardTitle>
        <MDBCardText>
          <MDBInput label="Dataset URL" type="url" v-model="doc"/>
          <small class="text-danger" v-if="docError">{{ docError }}</small>
          <MDBInput label="N3 Conversion Rules URL" type="url" v-model="rules" style="margin-top: 1rem"/>
          <small>Leave this URL empty to not apply any schema alignment tasks.</small>
          <small class="text-danger" v-if="rulesError"><br>{{ rulesError }}</small>
          <MDBInput label="Form description URI" type="url" v-model="formUrl" style="margin-top: 1rem"/>
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
          <div v-for="(success, index) in successes" :key="index" class="alert alert-success" role="alert">
            {{ success }}
          </div>
          <div v-if="fields.length">
            <div v-for="(field, index) in fields" :key="index">
              <div v-if="field.type === 'SingleLineTextField'" style="margin-bottom: 3rem">
                <SingleLineTextField :field="field" :index="index"/>
              </div>

              <div v-if="field.type === 'MultiLineTextField'" style="margin-bottom: 3rem">
                <MultiLineTextField :field="field" :index="index"/>
              </div>

              <div v-if="field.type === 'BooleanField'" style="margin-bottom: 3rem">
                <BooleanField :field="field" :index="index"/>
              </div>

              <div v-if="field.type === 'DateField'" style="margin-bottom: 3rem">
                <DateField :field="field" :index="index"/>
              </div>

              <div v-if="field.type === 'Choice'" style="margin-bottom: 3rem">
                <ChoiceField :field="field" :index="index"/>
              </div>
            </div>

            <hr/>

            <label>Subject URI to use for the data <span class="text-danger">*</span></label>
            <select class="form-select" v-model="subject" style="margin-top: 0.5rem">
              <option v-for="(subject, index) in subjectPossibilities" :key="index" :value="subject">
                {{ subject }}
              </option>
            </select>
            <input class="form-control" v-model="otherSubject" v-if="subject === 'Other'" @change="updatedOtherSubject">
            <small class="text-danger" v-if="otherSubjectError && subject === 'Other'">{{
                otherSubjectError
              }}<br></small>

            <MDBBtn color="primary" @click="submit" id="submit-btn" style="margin-top: 1em">Submit</MDBBtn>
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
import {MDBBtn, MDBCard, MDBCardBody, MDBCardText, MDBCardTitle, MDBContainer, MDBInput} from "mdb-vue-ui-kit";
import {fetch, getDefaultSession, handleIncomingRedirect, login, logout} from "@inrupt/solid-client-authn-browser";
import {QueryEngine} from "@comunica/query-sparql";
import {v4 as uuid} from "uuid";
import SingleLineTextField from "@/components/fields/SingleLineTextField.vue";
import MultiLineTextField from "@/components/fields/MultiLineTextField.vue";
import BooleanField from "@/components/fields/BooleanField.vue";
import DateField from "@/components/fields/DateField.vue";
import ChoiceField from "@/components/fields/ChoiceField.vue";
import {n3reasoner} from "eyereasoner";

export default {
  name: "FormRenderer",
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
      formUrl: "",
      form: "",
      originalForm: "",
      docError: "",
      rulesError: "",
      formError: "",
      formTargetClass: "",
      subject: "",
      subjectPossibilities: [],
      otherSubject: "",
      otherSubjectError: "",
      engine: new QueryEngine(),
      fields: [],
      originalFields: [],
      errors: [],
      successes: [],
    };
  },
  created() {
    // Restore input data - Step 1
    // 2 steps because `handleIncomingRedirect` triggers page reload resulting in loss of query data.
    let watchCalls = 0;
    this.$watch(
        () => this.$route.query,
        () => {
          watchCalls++;
          if (watchCalls === 2) {
            // On second call, the query data contains the actual query parameters from the URL.
            const query = this.$route.query;

            if (!("code" in query)) {
              localStorage.setItem("query", JSON.stringify(query));
              if (query.doc) {
                this.doc = query.doc;
              }
              if (query.rules) {
                this.rules = query.rules;
              }
              if (query.form) {
                this.formUrl = query.form;
              }
            }
          }
        },
        {immediate: true}
    );

    // Restore solid session
    handleIncomingRedirect({
      restorePreviousSession: true,
    }).then((info) => {
      this.loggedIn = info.webId;

      // Restore input data - Step 2
      // Only on loggedIn, otherwise this will be called before the query params are restored from the URL.
      if (this.loggedIn) {
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
            this.formUrl = parsedQuery.form;
          }
        }
      }
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
          clientName: "FormRenderer",
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
          form: this.formUrl,
        },
      });
    },
    async execute(event) {
      event.preventDefault();
      this.errors = [];

      this.docError = !this.doc || this.isValidUrl(this.doc) ? "" : "Please enter a valid URL.";
      this.rulesError = !this.rules || this.isValidUrl(this.rules) ? "" : "Please enter a valid URL.";
      this.formError = this.isValidUrl(this.formUrl)
          ? this.formUrl.includes("#")
              ? ""
              : "Make sure to enter a URI to a specific form description instead of a document URL."
          : "Please enter a valid URI.";

      if (this.docError || this.rulesError || this.formError) {
        return;
      }

      const n3doc = this.doc ? await this.loadContentOfUrl(this.doc) : "";
      let n3form = await this.loadContentOfUrl(this.formUrl);

      this.originalForm = n3form;

      console.log("n3doc", n3doc);
      console.log("n3form", n3form);

      if (this.rules) {
        // Apply schema alignment rules
        const n3rules = await this.loadContentOfUrl(this.rules);

        const options = {blogic: false, outputType: "string"};
        n3form = await n3reasoner(n3form, n3rules, options);
        console.log("n3form after rules", n3form);
      }

      this.form = n3form;

      this.fields = await this.parseForm(this.form);

      if (!this.fields.length) {
        this.errors.push("No fields found in form.");
        return;
      }

      for (const field of this.fields) {
        const data = await this.queryDataForField(n3doc, field);
        console.log("value", data);
        if (!field.multiple && data.length > 1) {
          this.errors.push(`Multiple values found for ${field.label} while only one is expected.`);
        }
        field.values = data || [];

        if (!field.values.length) {
          field.values = [{value: undefined, subject: undefined}];
        } else if (field.type === 'DateField') {
          field.values = field.values.map(value => {
            return {
              value: new Date(value.value).toISOString().split('T')[0]
            }
          });
        }
      }

      // Store original fields for N3 Patch
      this.originalFields = JSON.parse(JSON.stringify(this.fields));

      // Add suggestions for subject
      // Get all existing subjects for the form target class in the data document
      const query = `
      SELECT ?subject WHERE {
        ?subject a <${this.formTargetClass}> .
      }
      `;
      const bindings = await (
          await this.engine.queryBindings(query, {
            sources: [
              {
                type: "stringSource",
                value: n3doc,
                mediaType: "text/n3",
              },
            ],
          })
      ).toArray();
      this.subjectPossibilities = bindings.map((binding) => binding.get("subject").value);

      // Add random subject
      this.subjectPossibilities.push(`urn:uuid:${uuid()}`);

      // Allow user input
      this.subjectPossibilities.push("Other");

      // Set default subject as first possibility
      this.subject = this.subjectPossibilities[0];
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
      SELECT ?targetClass ?type ?property ?label ?from ?required ?multiple ?sequence WHERE {
        <${this.formUrl}> ui:parts ?list ;
          ui:property ?targetClass .
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
                baseIRI: this.formUrl.split("#")[0],
              },
            ],
          })
      ).toArray();

      const fields = bindings.map((row) => {
        this.formTargetClass = row.get("targetClass").value;
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
                    baseIRI: this.formUrl.split("#")[0],
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
      if (!this.doc) {
        // No data document, so no data to query
        return [];
      }

      const query = `
      SELECT ?value ?s WHERE {
        ?s a <${this.formTargetClass}> ;
          <${field.property}> ?value.
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
          value: row.get("value").value,
          subject: row.get("s").value,
        };
      });
    },
    async submit(event) {
      event.preventDefault();

      this.errors = [];
      this.successes = [];

      if (this.subject === 'Other' && !this.otherSubject) {
        this.otherSubjectError = 'Please fill in a valid subject.';
        return;
      }
      if (this.otherSubjectError) {
        return;
      }

      if (!this.validateFields()) {
        return;
      }

      const options = {blogic: false, outputType: "string"};
      const reasonerResult = await n3reasoner(
          `PREFIX ex: <http://example.org/>\n<${this.formUrl}> ex:event ex:Submit .`,
          this.originalForm,
          options
      );

      const policies = await this.parseSubmitPolicy(reasonerResult);
      if (!policies) {
        this.errors.push("No ex:Submit policy found for this form.");
        return;
      }
      const subject = this.subject === 'Other' ? this.otherSubject : this.subject;
      const data = this.parseSubmitData(subject, this.formUrl, this.fields);

      let redirectPolicy;
      let success = true;

      for (const policy of policies) {
        if (policy.executionTarget === "http://example.org/httpRequest") {
          success = (await this.submitHttpRequest(policy, data)) && success;
        } else if (policy.executionTarget === "http://example.org/redirect") {
          redirectPolicy = policy;
        } else if (policy.executionTarget === 'http://example.org/n3Patch') {
          success = (await this.submitN3Patch(policy, data)) && success;
        } else {
          this.errors.push("Unknown execution target: " + policy.executionTarget);
        }
      }

      if (redirectPolicy && success) {
        // Redirect to the URL specified in the policy
        window.location.href = redirectPolicy.url;
      }
    },
    async parseSubmitPolicy(doc) {
      const queryPolicy = `
      PREFIX ex: <http://example.org/>
      PREFIX pol: <https://www.example.org/ns/policy#>
      PREFIX fno: <https://w3id.org/function/ontology#>

      SELECT ?executionTarget ?method ?url ?contentType WHERE {
        ?id pol:policy ?policy .
        ?policy a fno:Execution .
        ?policy fno:executes ?executionTarget .
        ?policy ex:url ?url .
        OPTIONAL { ?policy ex:method ?method } .
        OPTIONAL { ?policy ex:contentType ?contentType } .
      }
      `;
      const bindings = await (
          await this.engine.queryBindings(queryPolicy, {
            sources: [
              {
                type: "stringSource",
                value: doc,
                mediaType: "text/n3",
                baseIRI: this.formUrl.split("#")[0],
              },
            ],
          })
      ).toArray();

      return bindings.map((row) => {
        return {
          executionTarget: row.get("executionTarget").value,
          url: row.get("url").value,
          method: row.get("method")?.value,
          contentType: row.get("contentType")?.value,
        };
      });
    },
    parseSubmitData(subject, generatedBy, fields) {
      let data = subject ? `<${subject}> a <${this.formTargetClass}> .\n` : '';

      if (generatedBy && subject) {
        data += `<${subject}> a <http://www.w3.org/ns/prov#Entity>; <http://www.w3.org/ns/prov#wasGeneratedBy> <${generatedBy}> .\n`;
      }

      for (const field of fields) {
        for (const value of field.values) {
          if (!value.value?.trim()) {
            continue;
          }
          console.log(`Field: ${field.property} has value`, value);
          if (field.type === "SingleLineTextField" || field.type === "MultiLineTextField") {
            data += `<${subject || value.subject}> <${field.property}> "${value.value}" .\n`;
          } else if (field.type === "Choice") {
            data += `<${subject || value.subject}> <${field.property}> <${value.value}> .\n`;
          } else if (field.type === "BooleanField") {
            data += `<${subject || value.subject}> <${field.property}> ${value.value ? "true" : "false"} .\n`;
          } else if (field.type === "DateField") {
            data += `<${subject || value.subject}> <${field.property}> "${new Date(
                value.value
            ).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#date> .\n`;
          } else {
            console.log("Unknown field type", field.type);
          }
        }
      }
      return data;
    },
    async submitHttpRequest(policy, data) {
      const response = await fetch(policy.url, {
        method: policy.method,
        headers: {
          "Content-Type": policy.contentType || "text/n3",
        },
        body: data,
      });

      if (response.ok) {
        this.successes.push("Form submitted successfully via HTTP request.");
        return true;
      } else {
        this.errors.push("HTTP request failed: " + response.status);
        return false;
      }
    },
    async submitN3Patch(policy, data) {
      let body = `
        @prefix solid: <http://www.w3.org/ns/solid/terms#>.
        _:test a solid:InsertDeletePatch;
          solid:inserts {
            ${data}
          }
        `;

      let dataToDelete = this.parseSubmitData(undefined, undefined, this.originalFields);
      if (dataToDelete) {
        const subjects = new Set();
        for (const field of this.originalFields) {
          for (const value of field.values) {
            if (value.subject) {
              subjects.add(value.subject);
            }
          }
        }
        dataToDelete = [...subjects].map(subject => `<${subject}> a <${this.formTargetClass}>; a <http://www.w3.org/ns/prov#Entity>; <http://www.w3.org/ns/prov#wasGeneratedBy> <${this.formUrl}> .`).join('\n') + '\n' + dataToDelete;

        body += `;
          solid:deletes {
            ${dataToDelete}
          }.`;
      } else {
        body += '.';
      }

      const response = await fetch(policy.url, {
        method: "PATCH",
        headers: {
          "Content-Type": "text/n3",
        },
        body: body,
      });

      if (response.ok) {
        this.successes.push("Form submitted successfully via N3 Patch.");
        return true;
      } else {
        this.errors.push("N3 Patch request failed: " + response.status);
        return false;
      }
    },
    async updatedOtherSubject() {
      this.otherSubjectError = "";

      if (this.otherSubject.includes(':')) {
        if (!this.otherSubject.includes('://')) {
          this.otherSubject = await this.replacePrefixInSubject(this.otherSubject);
          if (!this.otherSubject) {
            this.otherSubjectError = 'Please fill in a valid subject.';
          }
        }
      } else {
        this.otherSubjectError = 'Please fill in a valid subject.';
      }
    },
    async replacePrefixInSubject(subject) {
      // Do call to prefix.cc to get the full URI
      const [prefix, suffix] = subject.split(':');
      const response = await fetch(`https://prefix.cc/${prefix}.file.json`);
      const json = await response.json();
      const uri = json[prefix];
      if (uri) {
        subject = uri + suffix;
      } else {
        this.otherSubjectError = `Could not find a prefix for '${prefix}'!`;
        return undefined;
      }
      return subject;
    },
    validateFields() {
      let valid = true;
      for (const field of this.fields) {
        if (field.required && field.values.filter((v) => v.value && v.value.trim().length !== 0).length === 0) {
          this.errors.push(`Field "${field.label}" is required.`);
          valid = false;
        }
      }
      return valid;
    },
  },
  watch: {
    doc: function () {
      this.updateQueryParams();
    },
    rules: function () {
      this.updateQueryParams();
    },
    formUrl: function () {
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

.fork {
  float: right;
  margin-top: -3em;
}
</style>
