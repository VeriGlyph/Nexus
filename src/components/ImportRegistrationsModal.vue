<template>
  <v-dialog v-model="internalDialog" max-width="560" persistent>
    <v-card>
      <v-card-title class="headline">Upload JSON</v-card-title>

      <v-card-text>
        <v-alert v-if="error" type="error" dense outlined class="mb-4"
          >{{ error }}
        </v-alert>

        <v-file-input
          v-model="file"
          accept="application/json,.json"
          label="Choose a JSON file"
          prepend-icon="mdi-file-json"
          show-size
          outlined
          :disabled="loading"
          @change="onFileChange"
        />

        <div v-if="previewText" class="mt-3">
          <div class="text-caption grey--text">Preview (first 300 chars)</div>
          <pre
            class="pa-3 lighten-4"
            style="white-space: pre-wrap; max-height: 180px; overflow: auto"
            >{{ previewText }}</pre
          >
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text :disabled="loading" @click="close">Cancel</v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!file"
          @click="parseAndSave"
        >
          Import
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "ImportRegistrationsModal",
  props: {
    // If provided, parsed JSON will be saved under this key
    localStorageKey: {
      type: String,
      default: null,
    },
    // Max file size in MB
    maxSizeMB: {
      type: Number,
      default: 5,
    },
  },
  data() {
    return {
      internalDialog: false,
      file: null,
      previewText: "",
      loading: false,
      error: "",
    };
  },
  methods: {
    open() {
      this.reset();
      this.internalDialog = true;
    },
    close() {
      this.internalDialog = false;
    },
    reset() {
      this.file = null;
      this.previewText = "";
      this.loading = false;
      this.error = "";
    },
    onFileChange(file) {
      this.error = "";
      this.previewText = "";
      if (!file) return;

      // Basic validations
      const tooBig = file.size > this.maxSizeMB * 1024 * 1024;
      if (tooBig) {
        this.error = `File too large. Max ${this.maxSizeMB} MB allowed.`;
        this.file = null;
        return;
      }
      const nameOk = /\.json$/i.test(file.name);
      if (!nameOk) {
        // still allow, but warn
        this.error =
          "Warning: file does not have a .json extension. Proceed with caution.";
      }

      // Show a small text preview
      this.readFileAsText(file, 300)
        .then((text) => {
          this.previewText = text;
        })
        .catch(() => {
          this.previewText = "";
        });
    },
    async parseAndSave() {
      if (!this.file) return;
      this.loading = true;
      this.error = "";

      try {
        const text = await this.readFileAsText(this.file);
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          throw new Error("Invalid JSON. Please check the file contents.");
        }

        // Optional localStorage save
        if (this.localStorageKey) {
          try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(parsed));
          } catch (e) {
            // Quota or serialization error
            throw new Error(
              "Failed to save to localStorage (possibly too large)."
            );
          }
        }

        // Emit the parsed object and some metadata
        this.$emit("loaded", {
          data: parsed,
          fileName: this.file.name,
          size: this.file.size,
        });

        this.close();
      } catch (err) {
        this.error = err.message || "Failed to read or parse the file.";
      } finally {
        this.loading = false;
      }
    },
    readFileAsText(file, headBytes = null) {
      // headBytes: if provided, only read first N bytes for preview
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const text =
            typeof reader.result === "string"
              ? reader.result
              : new TextDecoder().decode(reader.result);
          resolve(headBytes ? text.slice(0, headBytes) : text);
        };

        reader.onerror = () => reject(reader.error);

        if (headBytes) {
          const blob = file.slice(0, headBytes);
          reader.readAsText(blob);
        } else {
          reader.readAsText(file);
        }
      });
    },
  },
};
</script>
