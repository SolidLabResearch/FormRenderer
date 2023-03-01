<template>
  <MDBBtn
    outline="danger"
    :id="'button-' + index + '-' + f_index"
    style="margin-top: 0.5rem"
    @click="removeValue(field, f_index)"
    size="sm"
    :disabled="field.values.length === 1 && field.required"
  >
    <MDBIcon icon="trash-alt" style="align-self: center" />
  </MDBBtn>
</template>

<script>
import { MDBBtn, MDBIcon } from "mdb-vue-ui-kit";

export default {
  name: "RemoveBtnPart",
  components: {
    MDBBtn,
    MDBIcon,
  },
  props: {
    field: Object,
    index: Number,
    f_index: Number,
  },
  methods: {
    removeValue(field, index) {
      field.values.splice(index, 1);
    },
  },
};
</script>

<style scoped></style>
