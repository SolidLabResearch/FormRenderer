<template>
  <div class="d-flex">
    <LabelPart :field="field" />
  </div>
  <div class="input-group" v-for="(value, f_index) in field.values" :key="f_index">
    <select class="form-select" v-model="value.value" style="margin-top: 0.5rem">
      <option v-for="option in field.options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <RemoveBtnPart :field="field" :index="index" :f_index="f_index" />
  </div>
  <small>{{ field.property }}</small>
</template>

<script>
import LabelPart from "@/components/parts/LabelPart.vue";
import RemoveBtnPart from "@/components/parts/RemoveBtnPart.vue";

export default {
  name: "ChoiceField",
  components: {
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
