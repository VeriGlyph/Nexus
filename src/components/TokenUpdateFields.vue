<script>
import { cloneDeep, set, tap } from "lodash";

export default {
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  computed: {
    oracleDetails: {
      get() {
        return this.value;
      },
      set(oracleDetails) {
        this.$emit("input", oracleDetails);
      },
    },
    mainAddress: {
      get() {
        return Array.isArray(this.oracleDetails[1])
          ? this.oracleDetails[1].join("")
          : this.oracleDetails[1];
      },
      set(mainAddress) {
        this.oracleDetails[1] = this.hardwrap(mainAddress, 64);
      },
    },
    updateAddress: {
      get() {
        return Array.isArray(this.oracleDetails[1])
          ? this.oracleDetails[2].join("")
          : this.oracleDetails[2];
      },
      set(updateAddress) {
        this.oracleDetails[2] = this.hardwrap(updateAddress, 64);
      },
    },
  },
  emits: ["input"],
  methods: {
    update(key, value) {
      if (key === 1 || key === 2) {
        value = this.hardwrap(value, 64);
      }
      this.oracleDetails = tap(cloneDeep(this.oracleDetails), (v) =>
        set(v, key, value)
      );
    },
  },
  data: () => ({
    rules: {
      address: [
        (v) => !!v || "Must provide a valid address!",
        (v) =>
          /^(addr(_test)?1)(\w{53})(\w{45})?$/.test(v) ||
          "Please provide a valid address in Bech32 format! (addr1_abc1234...)",
      ],
    },
  }),
};
</script>

<template>
  <div class="mb-4">
    <h2>CIP-86: Update Oracle Details</h2>
    <p>
      <code>Version: 1</code>
    </p>
    <v-text-field
      v-model="mainAddress"
      type="text"
      label="Main Address"
      required
      :rules="rules.address"
      @input="update(1, $event)"
    >
    </v-text-field>
    <v-text-field
      v-model="updateAddress"
      type="text"
      label="Update Address"
      required
      :rules="rules.address"
      @input="update(2, $event)"
    >
    </v-text-field>
  </div>
</template>
