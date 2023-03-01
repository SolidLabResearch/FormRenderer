<template>
  <div class="d-flex">
    <LabelPart :field="field" />
  </div>
  <div class="d-flex" v-for="(value, f_index) in field.values" :key="f_index" style="margin-top: 1rem">
    <MDBTextarea
      floating
      v-model="value.value"
      style="margin-top: 0.5rem"
      :aria-describedby="'button-' + index + '-' + f_index"
    />
    <RemoveBtnPart class="d-flex ms-auto" style="margin-top: 0" :field="field" :index="index" :f_index="f_index" />
  </div>
  <small>{{ field.property }}</small>
</template>

<script>
import { MDBTextarea } from "mdb-vue-ui-kit";
import LabelPart from "@/components/parts/LabelPart.vue";
import RemoveBtnPart from "@/components/parts/RemoveBtnPart.vue";

export default {
  name: "MultiLineTextField",
  components: {
    RemoveBtnPart,
    MDBTextarea,
    LabelPart,
  },
  props: {
    field: Object,
    index: Number,
  },
};
</script>

<style scoped></style>
