<template>
  <label>{{ field.label }} <span v-if="field.required" class="text-danger">*</span></label>
  <MDBBtn
    floating
    :disabled="field.values?.length === 1 && !field.multiple"
    class="d-flex ms-auto"
    color="primary"
    size="sm"
    style="margin-right: 1em"
    @click="addValue(field)"
  >
    <MDBIcon icon="plus" />
  </MDBBtn>
</template>

<script>
import { MDBBtn, MDBIcon } from "mdb-vue-ui-kit";
import { v4 as uuid } from "uuid";

export default {
  name: "LabelPart",
  components: {
    MDBBtn,
    MDBIcon,
  },
  props: {
    field: Object,
  },
  methods: {
    addValue(field) {
      field.values.push({ value: undefined, subject: `${this.doc}#${uuid()}` });
    },
  },
};
</script>

<style scoped></style>
