<template>
  <div class="d-flex">
    <LabelPart :field="field" />
  </div>
  <div class="d-flex" v-for="(value, f_index) in field.values" :key="f_index" style="margin-top: 0.5rem">
    <MDBCheckbox :label="field.label" v-model="value.value" />
    <RemoveBtnPart class="d-flex ms-auto" :field="field" :index="index" :f_index="f_index" />
  </div>
  <small>{{ field.property }}</small>
</template>

<script>
import { MDBCheckbox } from "mdb-vue-ui-kit";
import LabelPart from "@/components/parts/LabelPart.vue";
import RemoveBtnPart from "@/components/parts/RemoveBtnPart.vue";

export default {
  name: "BooleanField",
  components: {
    MDBCheckbox,
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
