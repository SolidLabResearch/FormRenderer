<template>
  <div class="d-flex">
    <LabelPart :field="field" />
  </div>
  <MDBInput
    floating
    inputGroup
    :formOutline="false"
    v-for="(value, f_index) in field.values"
    :key="f_index"
    type="date"
    v-model="value.value"
    style="margin-top: 0.5rem"
    :aria-describedby="'button-' + index + '-' + f_index"
  >
    <RemoveBtnPart :field="field" :index="index" :f_index="f_index" />
  </MDBInput>
  <small>{{ field.property }}</small>
</template>

<script>
import { MDBInput } from "mdb-vue-ui-kit";
import LabelPart from "@/components/parts/LabelPart.vue";
import RemoveBtnPart from "@/components/parts/RemoveBtnPart.vue";

export default {
  name: "DateField",
  components: {
    MDBInput,
    LabelPart,
    RemoveBtnPart,
  },
  props: {
    field: Object,
    index: Number,
  },
};
</script>

<style scoped></style>
