<script>
import { cloneDeep, tap, set } from "lodash";
export default {
  props: {
    value: {
      type: Array,
      required: true,
    },
    policy_id: {
      type: String,
      required: true,
    },
  },
  computed: {
    fungibleTokens: {
      get() {
        return this.value;
      },
      set(fungibleTokens) {
        this.$emit("input", fungibleTokens);
      },
    },
    tokenDescription: {
      get() {
        return Array.isArray(this.modal.token[2])
          ? this.modal.token[2].join(" ")
          : this.modal.token[2];
      },
      set(tokenDescription) {
        this.modal.token[2] = this.wordwrap(tokenDescription, 64);
      },
    },
    tokenWebsite: {
      get() {
        return Array.isArray(this.modal.token[5])
          ? this.modal.token[5].join("")
          : this.modal.token[5];
      },
      set(tokenWebsite) {
        this.modal.token[5] = this.breakURI(tokenWebsite);
      },
    },
    tokenImage: {
      get() {
        return Array.isArray(this.modal.token[6])
          ? this.modal.token[6].join("")
          : this.modal.token[6];
      },
      set(tokenWebsite) {
        this.modal.token[6] = this.breakURI(tokenWebsite);
      },
    },
  },
  emits: ["input"],
  methods: {
    addToken() {
      this.modal.token = {
        0: [this.policy_id, ""],
        4: 0,
      };
      this.modal.editToken = true;
    },
    edit(token) {
      this.modal.$original = cloneDeep(token);
      this.modal.token = token;
      this.modal.editToken = true;
    },
    cancel() {
      if (this.modal.$original !== null) {
        for (const [key, value] of Object.entries(this.modal.$original)) {
          this.modal.token[key] = value;
        }
        this.$forceUpdate();
      }
      this.resetModal();
    },
    change() {
      if (this.modal.$original == null) {
        this.fungibleTokens.push(cloneDeep(this.modal.token));
      }
      this.resetModal();
    },
    resetModal() {
      this.modal = {
        $original: null,
        editToken: false,
        token: {},
        validToken: true,
      };
    },
    getFormatted() {
      // this.modal.token[4] = this.modal.token[4] ?? 0;
      const decimal_places = parseInt(this.modal.token[4] || 0);
      const exp = Math.pow(10, -1 * decimal_places);

      return 1234567 * exp;
    },
    tokenFieldUpdate(key, value) {
      console.log("What changed?", key, value);
      switch (key) {
        case 2:
          value = this.wordwrap(value, 64);
          break;
        case 4:
          value = parseInt(value);
          break;
        case 5:
        case 6:
          value = this.breakURI(value, 64);
          break;
      }
      this.modal.token[key] = value;
      this.$forceUpdate();
    },
    update(key, value) {
      this.$emit(
        "input",
        tap(cloneDeep(this.fungibleTokens), (v) => set(v, key, value))
      );
      this.$forceUpdate();
    },
    getTokenSrc(URI) {
      URI = Array.isArray(URI) ? URI.join("") : URI;
      const parts = URI.match(
        /^(([^:/?#]+):\/\/)([^/?#]*)([^?#]*)?(\?[^#]*)?(#.*)?$/
      );

      let url;

      switch (parts[2]) {
        case "ipfs":
          url = `https://cloudflare-ipfs.com/ipfs/${parts[3]}`;
          break;
        case "https":
        case "http":
          url = parts[0];
          break;
      }

      return url;
    },
  },
  data: () => ({
    modal: {
      $original: null,
      editToken: false,
      token: {},
      validToken: true,
    },
    rules: {
      asset_id: [
        // 381adc91cec96a342a91cc5783c8f3cedd8a0d0e0d714b6ef08d2861
        (v) =>
          /^[a-f0-9]{0,64}$/i.test(v) ||
          "Must provide a valid Asset ID in hexadecimal format.",
      ],
      asset_name: [(v) => !!v || "Must provide the asset display name."],
      description: [(v) => !!v || "Must provide a description"],
      rate: [
        (v) => !!v || "Must provide a royalty rate!",
        (v) => parseInt(v) >= 0 || "Royalty rate must be positive",
        (v) =>
          parseInt(v) <= 1 || "Royalty rate must be less than or equal to 1",
      ],
      address: [
        (v) => !!v || "Must provide a recipient address!",
        (v) =>
          /(addr|stake)(_test)?1(\w{53})(\w{45})?/.test(v) ||
          "Please provide a valid address in Bech32 format! (addr1_abc1234...)",
      ],
      token_website: [
        (v) =>
          (v.length &&
            /^([^:/?#]+:\/\/)([^/?#]*)([^?#]*)?(\?[^#]*)?(#.*)?$/.test(v)) ||
          "Must provide a valid URI!",
      ],
    },
  }),
  // 0	Subject	Token Identifier	Yes
  // 1	Token Name	String	Yes
  // 2	Description	Array	Yes
  // 3	Token Ticker	String	No
  // 4	Token Decimals	Unsigned Integer	No
  // 5	Token Website	URI Array	No
  // 6	Token Image	URI Array	No
  // 7	Beacon Token	Token Identifier	No
};
</script>

<template>
  <div class="mb-4">
    <h2>CIP-26: Fungible Token Data</h2>
    <p>
      <code>Version 1</code>
    </p>
    <v-row justify="end" class="mb-4">
      <v-col cols="auto">
        <v-btn color="accent" @click="addToken" :disabled="!$props.policy_id">
          <v-icon>mdi-plus</v-icon>
          ADD TOKEN
        </v-btn>
      </v-col>
    </v-row>
    <v-simple-table v-if="fungibleTokens.length">
      <template v-slot:default>
        <thead>
          <tr>
            <th>Token</th>
            <th>Name</th>
            <th>Ticker</th>
            <th>Decimals</th>
            <th>Image</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(token, index) in fungibleTokens" :key="token[0][1]">
            <td>{{ token[0][1] }}</td>
            <td>{{ token[1] }}</td>
            <td>{{ token[3] }}</td>
            <td>{{ token[4] }}</td>
            <td>
              <v-img
                :src="getTokenSrc(token[6])"
                contain
                width="48"
                class="ma-2"
              ></v-img>
            </td>
            <td class="text-right">
              <v-btn @click="edit(token)" icon>
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                @click="fungibleTokens.splice(index, 1)"
                icon
                color="error"
              >
                <v-icon>mdi-trash-can</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    <v-dialog v-model="modal.editToken" persistent max-width="768">
      <v-card v-if="modal.token[0]">
        <v-card-title>
          {{ modal.$original !== null ? "Edit" : "Add" }} Fungible Token
          <v-spacer></v-spacer>
          <v-btn icon @click="cancel">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-form ref="editTokenForm" v-model="modal.validToken">
          <v-card-text>
            <v-text-field
              :value="$props.policy_id"
              label="Policy ID"
              readonly
            ></v-text-field>
            <v-text-field
              v-model="modal.token[0][1]"
              label="Asset ID (Hex)"
              required
              :rules="rules.asset_id"
            ></v-text-field>
            <v-text-field
              v-model="modal.token[1]"
              label="Asset Display Name"
              required
              :rules="rules.asset_name"
              @input="tokenFieldUpdate(1, $event)"
            ></v-text-field>
            <v-textarea
              v-model="tokenDescription"
              label="Description"
              :rules="rules.description"
              @input="tokenFieldUpdate(2, $event)"
            ></v-textarea>
            <v-text-field
              v-model="modal.token[3]"
              label="Asset Ticker"
              @input="tokenFieldUpdate(3, $event)"
            ></v-text-field>
            <v-row>
              <v-col>
                <v-text-field
                  v-model="modal.token[4]"
                  label="Token Decimal Places"
                  @input="tokenFieldUpdate(4, $event)"
                ></v-text-field>
              </v-col>
              <v-col>
                <p>Base Units: {{ (1234567).toLocaleString() }}</p>
                <p>
                  Decimal Units:
                  {{
                    getFormatted().toLocaleString(undefined, {
                      minimumFractionDigits: modal.token[4],
                      maximumFractionDigits: modal.token[4],
                    })
                  }}
                </p>
              </v-col>
            </v-row>
            <v-text-field
              type="url"
              v-model="tokenWebsite"
              @input="tokenFieldUpdate(5, $event)"
              label="Website URL"
              :rules="rules.token_website"
            ></v-text-field>
            <v-text-field
              type="url"
              v-model="tokenImage"
              @input="tokenFieldUpdate(6, $event)"
              label="Token Image"
              :rules="rules.token_website"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn
              @click="change"
              color="primary"
              :disabled="!modal.validToken"
              >{{
                modal.$original !== null ? "Save Changes" : "Add Token"
              }}</v-btn
            >
            <v-btn @click="cancel" color="error">CANCEL</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>
