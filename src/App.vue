<template>
  <v-app>
    <v-system-bar app>
      <v-spacer></v-spacer>
      VeriGlyph: Nexus v0.0.1
    </v-system-bar>
    <v-navigation-drawer app dark color="transparent">
      <v-list>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <v-img
                :src="require('./assets/veriglyph-header-purple.png')"
                contain
              ></v-img>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="newRegistration">
          <v-list-item-icon>
            <v-icon>mdi-plus</v-icon>
          </v-list-item-icon>
          <v-list-item-content>New Registration</v-list-item-content>
        </v-list-item>
        <v-list-item @click="modal.showSaved = true">
          <v-list-item-icon>
            <v-icon>mdi-reload</v-icon>
          </v-list-item-icon>
          <v-list-item-content>Load Registration</v-list-item-content>
        </v-list-item>
        <v-list-item
          :href="registration_url"
          download="veriglyph_nexus_registrations.json"
        >
          <v-list-item-icon>
            <v-icon>mdi-export</v-icon>
          </v-list-item-icon>
          <v-list-item-content>Export Registrations</v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-import</v-icon>
          </v-list-item-icon>
          <v-list-item-content>Import Registrations</v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item
          v-if="cardano.status === `found`"
          @click="modal.connectWallet = true"
        >
          <v-list-item-icon>
            <v-icon>mdi-login</v-icon>
          </v-list-item-icon>
          <v-list-item-content>Connect Your Wallet</v-list-item-content>
        </v-list-item>
        <template v-else-if="cardano.status === `connected`">
          <v-list-item class="veriglyph-gradient-bg">
            <v-list-item-icon class="filter-grayscale">
              <v-img
                :src="cardano.ActiveWallet.icon"
                contain
                height="24"
                width="24"
              ></v-img>
            </v-list-item-icon>
            <v-list-item-content class="text-capitalize">
              {{ cardano.ActiveWallet.name.replace(" Wallet", "") }} Connected
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="getting_balance">
            <v-list-item-icon>
              <v-progress-circular
                width="4"
                size="24"
                color="secondary"
                indeterminate
              ></v-progress-circular>
            </v-list-item-icon>
            <v-list-item-content>Checking balance...</v-list-item-content>
          </v-list-item>
          <v-list-item v-else @click="getBalance">
            <v-list-item-icon>
              <v-icon>mdi-refresh</v-icon>
            </v-list-item-icon>
            <v-list-item-content>Refresh Balance</v-list-item-content>
          </v-list-item>
          <v-list-item @click="disconnect">
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-content>Disconnect</v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container class="py-16">
        <v-form
          ref="registrationForm"
          v-model="valid_registration"
          color="secondary"
        >
          <v-text-field
            v-model="registration.name"
            label="Registration Name"
          ></v-text-field>
          <div class="mb-4">
            <template v-if="registration.published">
              <v-chip label color="success">Published</v-chip>
              Transaction ID: <code>{{ registration.tx_id }}</code>
            </template>
            <template v-else>
              <v-chip label color="error">Unpublished</v-chip>
            </template>
          </div>

          <div class="mb-4">
            <p>
              <label>Policy</label>
            </p>
            <template
              v-if="
                registration.policy.id === null ||
                registration.policy.id === undefined ||
                !registration.policy.id.length
              "
            >
              <v-btn color="primary" @click="modal.showPolicy = true">
                Update Policy
              </v-btn>
              <v-text-field
                class="d-none"
                v-model="registration.data[1][1]"
                readonly
                :rules="rules.policy_id"
              ></v-text-field>
            </template>
            <template v-else>
              <v-text-field
                v-model="registration.data[1][1]"
                label="Policy ID"
                disabled
                readonly
                :rules="rules.policy_id"
              ></v-text-field>
              <v-text-field
                v-model="registration.data[1][2]"
                label="Policy Hex"
                disabled
                readonly
              >
              </v-text-field>
            </template>
          </div>
          <div class="mb-4">
            <p>
              <label>Supported Feature Set</label>
            </p>
            <v-row>
              <v-col v-for="cip in feature_sets" :key="cip">
                <v-switch
                  v-model="registration.data[2]"
                  :label="'CIP-' + cip"
                  :value="cip"
                  color="secondary"
                ></v-switch>
              </v-col>
            </v-row>
          </div>
          <v-text-field
            type="number"
            min="1"
            max="999999"
            step="1"
            v-model="registration.data[4]"
            label="Nonce Value (Unsigned Integer)"
            :rules="rules.nonce"
            required
          ></v-text-field>
          <v-text-field
            label="Data Oracle URI"
            v-model="registration.data[5]"
          ></v-text-field>
          <template v-if="registration.data[2].includes(25)">
            <TokenProjectFields
              :cip="25"
              v-model="registration.data[6][25][1]"
              @input="doUpdate"
            ></TokenProjectFields>
          </template>
          <template v-if="registration.data[2].includes(68)">
            <TokenProjectFields
              :cip="68"
              v-model="registration.data[6][68][1]"
              @input="doUpdate"
            ></TokenProjectFields>
          </template>
          <template v-if="registration.data[2].includes(27)">
            <TokenRoyaltyFields
              v-model="registration.data[6][27][1]"
              @input="doUpdate"
            ></TokenRoyaltyFields>
          </template>
          <template v-if="registration.data[2].includes(26)">
            <FungibleTokenFields
              v-model="registration.data[6][26][1]"
              :policy_id="registration.data[1][1]"
              @input="doUpdate"
            ></FungibleTokenFields>
          </template>
          <v-row class="my-4">
            <v-btn
              color="accent"
              @click="saveRegistration"
              :disabled="!valid_registration"
            >
              <v-icon left>mdi-content-save</v-icon>
              Save for Later
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              @click="encodeRegistration"
              :disabled="!valid_registration"
              class="ms-2"
              large
            >
              <v-icon left>mdi-lock</v-icon>
              Publish Registration
            </v-btn>
          </v-row>
        </v-form>
        <pre>{{ registration.data }}</pre>
      </v-container>
    </v-main>
    <v-footer app class="text-center justify-center pt-0" dark color="#121212">
      <div style="display: block; width: 100%" class="mb-4">
        <v-divider></v-divider>
      </div>
      <v-container>
        <v-row>
          <v-col>
            Made with
            <v-icon color="red">mdi-heart</v-icon>
            by Adam K. Dean
          </v-col>
          <v-spacer></v-spacer>
          <v-col>
            Released without warranty as open source under
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              >CC-By-4.0 License</a
            >
          </v-col>
          <v-spacer></v-spacer>
          <v-col>
            <v-btn
              href="https://github.com/VeriGlyph/nexus"
              target="_blank"
              color=""
            >
              <span class="mr-2">View on Github</span>
              <v-icon>mdi-github</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
    <v-dialog v-model="modal.showSaved" persistent scrollable max-width="768">
      <v-card>
        <v-card-title>
          Load a Saved Registration
          <v-spacer></v-spacer>
          <v-btn icon @click="modal.showSaved = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="(registration, id) in saved_registrations"
              :key="id"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ registration.name }}
                  <v-chip label color="accent" light small class="ms-2 mb-2">
                    {{ registration.published ? "Published" : "Unpublished" }}
                  </v-chip>
                </v-list-item-title>
                <v-list-item-subtitle
                  >{{ registration.data[1][1] }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn
                  icon
                  @click="load(registration)"
                  color="success"
                  title="Load Registration"
                >
                  <v-icon>mdi-reload</v-icon>
                </v-btn>
              </v-list-item-action>
              <v-list-item-action>
                <v-btn
                  @click="removeSaved(registration)"
                  color="error"
                  icon
                  title="Delete Registration"
                >
                  <v-icon>mdi-trash-can</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="modal.showEncoded" persistent max-width="768" scrollable>
      <v-card>
        <v-card-title>
          Verify & Sign Payload
          <v-spacer></v-spacer>
          <v-btn icon @click="modal.showEncoded = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider class="mb-4"></v-divider>
        <v-card-text>
          <v-alert type="success" border="bottom">
            Please review the data below for your registration payload and
            ensure everything looks acceptable prior to signing and submitting
            to the blockchain.
          </v-alert>
          <v-expansion-panels
            multiple
            accordion
            focusable
            class="elevation-0 mb-4"
          >
            <v-expansion-panel>
              <v-expansion-panel-header>JSON Encoded</v-expansion-panel-header>
              <v-expansion-panel-content class="py-2">
                <pre>{{ registration.data }}</pre>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-header>CBOR Encoded</v-expansion-panel-header>
              <v-expansion-panel-content class="py-2">
                <code>{{ registration.encoded_data }}</code>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-header>
                Policy Details
              </v-expansion-panel-header>
              <v-expansion-panel-content class="py-2">
                <p>
                  Policy ID:<br />
                  <code>{{ registration.policy.id }}</code>
                </p>
                <p>
                  Policy Hex:<br />
                  <code>{{ registration.policy.hex }}</code>
                </p>
                <p>
                  Required Signing Keys:<br />
                  <code>{{ registration.policy.keys }}</code>
                </p>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
          <p>Signature(s)</p>
          <v-btn color="accent" @click="modal.addSignature = true">
            Add Signature
          </v-btn>
          <v-list two-line>
            <v-list-item
              v-for="(witness, i) in signature.witnesses"
              :key="witness[0]"
            >
              <v-list-item-content>
                <v-list-item-title>Key: {{ witness[0] }}</v-list-item-title>
                <v-list-item-subtitle>
                  Signature: {{ witness[1] }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn
                  icon
                  color="error"
                  @click="signature.witnesses.splice(i, 1)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
          <v-alert
            type="info"
            border="top"
            v-if="cardano.status !== `connected`"
          >
            Cardano Wallet not connected! Please connect your wallet before
            proceeding.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            :disabled="!validSignature() || cardano.status !== `connected`"
            @click="compilePayload()"
          >
            Sign & Submit
          </v-btn>
          <v-btn @click="modal.showEncoded = false" color="error">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="modal.showPolicy" persistent max-width="768" scrollable>
      <v-card>
        <v-card-title>Update Policy Information</v-card-title>
        <v-divider class="mb-4"></v-divider>
        <v-card-text>
          <v-form ref="policyInfoForm" v-model="valid_policy_script">
            <v-textarea
              v-model="registration.policy.content"
              ref="script_content"
              :rules="rules.policy_script"
              label="Script JSON"
              clearable
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            @click="parsePolicyScript"
            :disabled="!valid_policy_script"
          >
            Confirm Policy
          </v-btn>
          <v-btn color="error" @click="modal.showPolicy = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="modal.addSignature"
      persistent
      max-width="512"
      scrollable
    >
      <v-card>
        <v-card-title>Add Policy Signature</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-alert class="mb-4" type="info" border="left">
            <strong>IMPORTANT:</strong> Your signing key is never stored, saved,
            recorded or transmitted away from this page. It will only be used to
            generate a signature and confirm that it matches one of the public
            keys specified in the Native Script.
          </v-alert>
          <v-form ref="policySignature">
            <v-text-field
              type="password"
              label="Native Script Private (Signing) Key"
              clearable
              @input="parseSkey($event)"
              v-model="newSignature.tmp"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            @click="addSignature"
            :disabled="!newSignature.is_valid"
            >Add</v-btn
          >
          <v-btn color="error" @click="modal.addSignature = false">
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="modal.error.show" persistent max-width="512">
      <v-card>
        <v-card-text>
          <p class="text-center font-weight-bold text-h3 mb-0">
            <v-icon color="error" size="96">mdi-alert-circle-outline</v-icon
            ><br />
            ERROR
          </p>
        </v-card-text>
        <v-divider class="mb-4"></v-divider>
        <v-card-text>
          <p class="mb-0">{{ modal.error.message }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="modal.error.show = false" color="error">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="modal.connectWallet"
      max-width="512"
      persistent
      scrollable
    >
      <v-card>
        <v-card-title>
          Connect Your Wallet
          <v-spacer></v-spacer>
          <v-btn icon @click="modal.connectWallet = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-5">
          <v-btn
            v-for="wallet in cardano.Wallets"
            :key="wallet.name"
            block
            class="wallet-btn mb-2 text-start"
            x-large
            @click="connectTo(wallet)"
            :loading="wallet.loading"
          >
            <v-img
              :src="wallet.icon"
              max-width="24"
              height="24"
              class="me-2"
              contain
              :alt="wallet.name"
            ></v-img>
            Connect {{ wallet.name.replace(" Wallet", "") }}
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { Buffer } from "buffer/";
import { encode } from "cbor-x";
import TokenProjectFields from "@/components/TokenProjectFields.vue";
import { v4 as uuidv4 } from "uuid";
import TokenRoyaltyFields from "@/components/TokenRoyaltyFields.vue";
import FungibleTokenFields from "@/components/FungibleTokenFields.vue";
import { cloneDeep } from "lodash";
import {
  AuxiliaryData,
  BigNum,
  Ed25519KeyHash,
  GeneralTransactionMetadata,
  NativeScript,
  NativeScripts,
  PrivateKey,
  ScriptAll,
  ScriptAny,
  ScriptNOfK,
  ScriptPubkey,
  TimelockExpiry,
  TimelockStart,
  Transaction,
  TransactionMetadatum,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  TransactionWitnessSet,
  Vkeywitnesses,
} from "@emurgo/cardano-serialization-lib-asmjs";

export default {
  name: "App",
  components: { FungibleTokenFields, TokenRoyaltyFields, TokenProjectFields },
  data: () => ({
    modal: {
      showSaved: false,
      showEncoded: false,
      showPolicy: false,
      addSignature: false,
      error: {
        show: false,
        message: "",
      },
      connectWallet: false,
    },
    registration_scopes: {
      0: "Policy ID",
    },
    feature_sets: [25, 26, 27, 48, 60, 68, 86],
    validation_methods: {
      0: "Key Signature",
    },
    newSignature: {
      is_valid: false,
      tmp: null,
      value: [],
      errors: [],
    },
    signature: {
      witnesses: [],
    },
    registration: {
      id: uuidv4(),
      published: false,
      tx_id: null,
      name: "",
      policy: {
        id: null,
        content: null,
        keys: [],
        hex: null,
      },
      data: {
        1: [0, "", ""],
        2: [],
        3: [0],
        4: null,
        5: null,
        6: {},
      },
      encoded_data: null,
      mapped_data: null,
    },
    network: null,
    utxo: null,
    getting_balance: false,
    saved_registrations: null,
    valid_registration: true,
    valid_policy_script: false,
    checking_policy_script: false,
    rules: {
      policy_id: [
        (v) =>
          /^[a-f0-9]{56}$/i.test(v) ||
          "Must provide a valid, 56-character Policy ID in hex format",
      ],
      policy_script: [
        (v) => !!v || "The policy script must be valid JSON format!",
        (v) => {
          try {
            const content = JSON.parse(v);
            if (content === null) {
              return "The policy script must be valid JSON format!";
            }
            if (content.type === undefined) {
              return "Script type not detected!";
            }
            return true;
          } catch (e) {
            return "The policy script must be valid JSON format!";
          }
        },
      ],
      nonce: [
        (v) =>
          parseInt(v) >= 0 || "Must provide a positive integer greater than 0",
      ],
    },
  }),
  computed: {
    registration_data: {
      get() {
        return JSON.stringify(this.saved_registrations);
      },
    },
    registration_blob: {
      get() {
        return new Blob([this.registration_data], { type: "application/json" });
      },
    },
    registration_url: {
      get() {
        return window.URL.createObjectURL(this.registration_blob);
      },
    },
  },
  methods: {
    doUpdate() {
      this.$forceUpdate();
    },
    async connectTo(wallet) {
      try {
        await this.connect(wallet);
      } catch (e) {
        this.doError(
          `Could not connect to your wallet! Make sure you have a dApp account selected!`
        );
        return;
      }

      try {
        this.network = await this.getWalletNetwork();
        if (this.network === 0) {
          // Is Testnet
        } else {
          this.doError(
            `This app is currently only supported for testing on Preproduction Testnet. Please connect a wallet on that network!`
          );
          this.disconnect();
          return;
        }
      } catch (e) {
        console.error(`Could not detect the wallet's connected network?`);
        return;
      }

      this.modal.connectWallet = false;
      await this.getBalance();
    },
    disconnect() {
      this.network = null;
      this.utxo = null;
      this.changeWallet();
    },
    async getBalance() {
      this.getting_balance = true;
      this.utxo = TransactionUnspentOutputs.new();
      const UTxOs = await this.cardano.Wallet.getUtxos();
      if (UTxOs === null) {
        this.doError(
          `Received no UTxO information from your wallet? Is the connected wallet empty?`
        );
      } else {
        UTxOs.map((utxo) => {
          this.utxo.add(TransactionUnspentOutput.from_hex(utxo));
        });
      }
      this.getting_balance = false;
    },
    doError: function (message) {
      this.modal.error.message = message;
      this.modal.error.show = true;
    },
    parseSkey: function (skey) {
      skey = this.hexOnly(skey);
      this.newSignature.is_valid = false;
      let Key, Signature, PubKey, PubKeyHex, PubKeyHash;
      if (skey.length === 68) {
        try {
          Key = PrivateKey.from_hex(skey.substring(4));
        } catch (e) {
          console.error(e);
          this.doError(
            `Could not parse the provided signing key, please double-check and try again!`
          );
          this.newSignature.tmp = null;
          return;
        }
      } else if (skey.length === 64) {
        try {
          Key = PrivateKey.from_hex(skey);
        } catch (e) {
          console.error(e);
          this.doError(
            `Could not parse the provided signing key, please double-check and try again!`
          );
          this.newSignature.tmp = null;
          return;
        }
      } else {
        console.log(
          "Unexpected length for a private signing key: " + skey.length,
          skey
        );
        return;
      }

      PubKey = Key.to_public();
      PubKeyHex = PubKey.to_hex();
      PubKeyHash = PubKey.hash().to_hex();
      if (this.registration.policy.keys.includes(PubKeyHash)) {
        Signature = Key.sign(
          Buffer.from(this.registration.encoded_data, "hex")
        );
        this.newSignature.is_valid = true;
        this.newSignature.value = [PubKeyHex, Signature.to_hex()];
      } else {
        this.newSignature.tmp = null;
        this.doError(
          `The provided signing key was not found in the list of required policy signing keys and is therefore invalid. It has not been added as a signer.`
        );
        this.$forceUpdate();
      }
    },
    addSignature: function () {
      const new_sig_value = cloneDeep(this.newSignature.value);
      const pub_key = new_sig_value[0];
      const signature = new_sig_value[1];
      if (!pub_key || !signature) {
        this.newSignature.is_valid = false;
        return;
      }

      let existing_signature_found = false;
      this.signature.witnesses.forEach((sig) => {
        if (existing_signature_found) {
          return;
        }
        if (sig[0] === pub_key) {
          sig = new_sig_value;
          existing_signature_found = true;
        }
      });

      if (!existing_signature_found) {
        this.signature.witnesses.push(new_sig_value);
      }

      this.newSignature = {
        is_valid: false,
        tmp: null,
        value: [],
        errors: [],
      };
      this.modal.addSignature = false;
    },
    parseScript: function (script) {
      let Script;
      const Scripts = NativeScripts.new();
      switch (script.type) {
        case "sig":
          Script = NativeScript.new_script_pubkey(
            ScriptPubkey.new(Ed25519KeyHash.from_hex(script.keyHash))
          );
          break;
        case "before":
          Script = NativeScript.new_timelock_expiry(
            TimelockExpiry.new(Number(script.slot))
          );
          break;
        case "after":
          Script = NativeScript.new_timelock_start(
            TimelockStart.new(Number(script.slot))
          );
          break;
        case "atLeast":
          script.scripts.forEach((child_script) => {
            Scripts.add(this.parseScript(child_script));
          });
          Script = NativeScript.new_script_n_of_k(
            ScriptNOfK.new(Number(script.required), Scripts)
          );
          break;
        case "all":
          script.scripts.forEach((child_script) => {
            Scripts.add(this.parseScript(child_script));
          });
          Script = NativeScript.new_script_all(ScriptAll.new(Scripts));
          break;
        case "any":
          script.scripts.forEach((child_script) => {
            Scripts.add(this.parseScript(child_script));
          });
          Script = NativeScript.new_script_any(ScriptAny.new(Scripts));
          break;
        default:
          Script = false;
      }
      return Script;
    },
    processScript: function (content) {
      const script_content = JSON.parse(content);
      if (!script_content || !script_content.type) {
        return false;
      }

      return this.parseScript(script_content);
    },
    parsePolicyScript: function () {
      const Script = this.processScript(this.registration.policy.content);
      if (!Script) {
        this.registration.policy.id = null;
        this.registration.policy.keys = [];
        this.registration.policy.hex = null;
        return;
      }

      const Signers = Script.get_required_signers();
      this.registration.policy.id = this.registration.data[1][1] =
        Script.hash().to_hex();
      this.registration.policy.keys = Signers.to_js_value();
      this.registration.policy.hex = this.registration.data[1][2] =
        this.hardwrap(Script.to_hex(), 128);

      this.$forceUpdate();

      this.modal.showPolicy = false;
    },
    validSignature: function () {
      if (
        this.registration.policy.id === null ||
        this.registration.policy.content === null ||
        this.signature.witnesses.length === 0
      ) {
        return false;
      }
      return true;
    },
    compilePayload: async function () {
      const payloadMap = new Map();
      payloadMap.set(0, 1);
      payloadMap.set(1, this.registration.mapped_data);
      const witnesses = cloneDeep(this.signature.witnesses);
      const encoded_witnesses = witnesses.map((witness) => {
        return witness.map((s) => Buffer.from(s, "hex"));
      });
      // witnesses.forEach((witness) => {
      //   witness.map((s) => Buffer.from(s, "hex"));
      // });
      payloadMap.set(2, encoded_witnesses);

      const cbor_encoded_payload = encode(payloadMap);
      const final_payload = Buffer.from(cbor_encoded_payload)
        .toString("hex")
        .replaceAll("d90103", "");

      const txBuilder = await this.prepareTransaction();
      const aux_data = AuxiliaryData.new();
      const metadata = GeneralTransactionMetadata.new();
      metadata.insert(
        BigNum.from_str("867"),
        TransactionMetadatum.from_hex(final_payload)
      );
      aux_data.set_metadata(metadata);

      txBuilder.add_metadatum(
        BigNum.from_str("867"),
        TransactionMetadatum.from_hex(final_payload)
      );

      const use_inputs = this.findInputs(this.utxo, {
        lovelace: 2000000,
        assets: null,
      });

      if (use_inputs.length) {
        use_inputs.forEach((input) => {
          txBuilder.add_regular_input(
            input.output().address(),
            input.input(),
            input.output().amount()
          );
        });
      }

      const changeAddress = await this.getChangeAddress();
      try {
        txBuilder.add_change_if_needed(changeAddress);
        const txBuilt = await txBuilder.build();
        const witnessSet = TransactionWitnessSet.new();
        const tx = Transaction.new(txBuilt, witnessSet, aux_data);
        const witness = await this.cardano.Wallet.signTx(tx.to_hex());

        const totalVkeys = Vkeywitnesses.new();
        const addWitness = TransactionWitnessSet.from_hex(witness);
        const addVkeys = addWitness.vkeys();
        if (addVkeys) {
          for (let i = 0; i < addVkeys.len(); i++) {
            totalVkeys.add(addVkeys.get(i));
          }
        }
        witnessSet.set_vkeys(totalVkeys);

        const signed = Transaction.new(
          tx.body(),
          witnessSet,
          tx.auxiliary_data()
        );
        try {
          const response = await this.cardano.Wallet.submitTx(signed.to_hex());
          this.registration.published = true;
          this.registration.tx_id = response;
          this.saveRegistration();
          this.modal.showEncoded = false;
        } catch (e) {
          console.error("Error submitting transaction?", e);
          this.doError(`Could not submit transaction! ${e}`);
        }
      } catch (e) {
        console.error("Error building transaction?!", e);
      }
    },
    jsToCbor: function (obj) {
      const hex_regex = /^[0-9A-Fa-f]+$/g;
      switch (typeof obj) {
        case "object":
          if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
              obj[i] = this.jsToCbor(obj[i]);
            }
            return obj;
          } else if (Buffer.isBuffer(obj)) {
            return obj;
          } else {
            const cborMap = new Map();
            for (const [key, value] of Object.entries(obj)) {
              const intKey = parseInt(key);
              cborMap.set(intKey, this.jsToCbor(value));
            }
            return cborMap;
          }
        default:
          if (obj.match !== undefined) {
            if (obj.match(hex_regex)) {
              return Buffer.from(obj, "hex");
            }
            return obj;
          }
          return obj;
      }
    },
    encodeRegistration: function () {
      if (!Array.isArray(this.registration.data[1][2])) {
        this.registration.data[1][2] = this.hardwrap(
          this.registration.data[1][2],
          128
        );
      }
      const mapped_data = this.jsToCbor(cloneDeep(this.registration.data));
      const encoded_data = encode(mapped_data);

      this.registration.mapped_data = mapped_data;
      this.registration.encoded_data = Buffer.from(encoded_data)
        .toString("hex")
        .replaceAll("d90103", "");
      this.modal.showEncoded = true;
    },
    load: function (load_registration) {
      if (this.registration.name !== "") {
        if (
          confirm(
            `You may have unsaved changes, do you want to save your current registration before loading the selected registration?`
          )
        ) {
          this.saveRegistration();
        }
      }
      this.registration = load_registration;
      if (this.registration.policy === undefined) {
        this.registration.policy = {
          id: null,
          content: null,
          keys: [],
          hex: null,
        };
      }
      this.modal.showSaved = false;
    },
    loadSaved: function () {
      this.saved_registrations = JSON.parse(
        localStorage.getItem("VeriGlyphNexusRegistrations") ?? "{}"
      );
    },
    removeSaved: function (registration) {
      if (
        confirm(
          `Are you sure you want to delete registration for ${registration.name}?`
        )
      ) {
        delete this.saved_registrations[registration.id];
        this.storeRegistrations();
      }
    },
    newRegistration: function () {
      this.registration = {
        id: uuidv4(),
        published: false,
        tx_id: null,
        name: "",
        policy: {
          id: null,
          content: null,
          keys: [],
          hex: null,
        },
        data: {
          1: [0, "", ""],
          2: [],
          3: [0],
          4: null,
          5: null,
          6: {},
        },
        encoded_data: null,
        mapped_data: null,
      };
    },
    saveRegistration: function () {
      // Do stuff and things to save here...
      this.registration = this.sanitizeRegistration(this.registration);

      this.registration.data[2].sort();

      if (this.registration.data[4]) {
        this.registration.data[4] = parseInt(this.registration.data[4]);
      }

      this.saved_registrations[this.registration.id] = this.registration;
      this.storeRegistrations();

      this.$forceUpdate();
    },
    sanitizeRegistration: function (obj) {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([, v]) => v !== null)
          .map(([k, v]) => [
            k,
            Array.isArray(v)
              ? v
              : v === Object(v)
              ? this.sanitizeRegistration(v)
              : v,
          ])
      );
    },
    storeRegistrations() {
      localStorage.setItem(
        "VeriGlyphNexusRegistrations",
        JSON.stringify(this.saved_registrations)
      );
      this.loadSaved();
    },
  },
  created() {
    this.$watch(
      () => {
        return this.registration.data[2];
      },
      function (newSet, oldSet) {
        if (newSet.length === undefined) {
          this.registration.data[6] = {};
          this.registration.data[2] = [];
          return;
        }

        if (newSet.length === 0) {
          this.registration.data[6] = {};
          return;
        }

        newSet.forEach((cip) => {
          if (oldSet.includes(cip)) {
            return;
          }
          if (this.registration.data[6][cip] === undefined) {
            switch (cip) {
              case 26:
                this.registration.data[6][cip] = {
                  0: 1,
                  1: [],
                };
                break;
              default:
                this.registration.data[6][cip] = {
                  0: 1,
                  1: {},
                };
            }
          }
        });
        oldSet.forEach((cip) => {
          if (newSet.includes(cip)) {
            return;
          }
          delete this.registration.data[6][cip];
        });
      },
      {
        deep: true,
      }
    );

    this.saved_registrations = JSON.parse(
      localStorage.getItem("VeriGlyphNexusRegistrations") ?? "{}"
    );

    this.$on("input", () => {
      this.$forceUpdate();
    });
  },
  async mounted() {
    await this.checkForCardano();
  },
};
</script>

<style>
.filter-grayscale {
  filter: grayscale(1);
}

.veriglyph-gradient-bg {
  background: linear-gradient(45deg, #6308bf, #47eff3);
}

.v-btn:not(.v-btn--outlined).veriglyph {
  background: linear-gradient(45deg, #6308bf, #47eff3);
}

.v-btn:not(.v-btn--outlined).primary {
  color: black;
}
</style>
