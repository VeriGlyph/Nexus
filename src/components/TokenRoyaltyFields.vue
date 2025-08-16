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
    royaltyDetails: {
      get() {
        return this.value;
      },
      set(royaltyDetails) {
        this.$emit("input", royaltyDetails);
      },
    },
    royaltyRate: {
      get() {
        return parseFloat(this.royaltyDetails[1]);
      },
      set(royaltyRate) {
        this.royaltyDetails[1] = parseFloat(royaltyRate);
      },
    },
    royaltyAddress: {
      get() {
        return Array.isArray(this.royaltyDetails[2])
          ? this.royaltyDetails[2].join("")
          : this.royaltyDetails[2];
      },
      set(royaltyAddress) {
        this.royaltyDetails[2] = this.hardwrap(royaltyAddress, 64);
      },
    },
  },
  emits: ["input"],
  methods: {
    royaltyPercentage() {
      return parseFloat(this.royaltyDetails[1] || 0) * 100;
    },
    update(key, value) {
      if (key === 1) {
        value = value.replace(/[^0-9.]/g, "");
      }
      if (key === 2) {
        value = this.hardwrap(value, 64);
      }
      this.royaltyDetails = tap(cloneDeep(this.royaltyDetails), (v) =>
        set(v, key, value)
      );
    },
  },
  data: () => ({
    rules: {
      rate: [
        (v) => !!v || "Must provide a royalty rate!",
        (v) =>
          parseFloat(v) >= 0 ||
          `Royalty rate must be positive ${parseFloat(v)}`,
        (v) =>
          parseFloat(v) <= 1 ||
          `Royalty rate must be less than or equal to 1 ${parseFloat(v)}`,
      ],
      address: [
        (v) => !!v || "Must provide a recipient address!",
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
    <h2>CIP-27: Token Royalty Details</h2>
    <p>
      <code>Version: 1</code>
    </p>
    <v-text-field
      v-model="royaltyDetails[1]"
      label="Royalty Rate"
      hint="Must be a number between 0.000000 and 1.000000. 0.05 = 5% royalty"
      :rules="rules.rate"
      required
      @input="update(1, $event)"
    >
      <template v-slot:append> {{ royaltyPercentage().toFixed(4) }}%</template>
    </v-text-field>
    <v-text-field
      v-model="royaltyAddress"
      type="text"
      label="Royalty Address"
      required
      :rules="rules.address"
      @input="update(2, $event)"
    >
    </v-text-field>
  </div>
</template>
