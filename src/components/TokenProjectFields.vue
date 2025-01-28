<script>
import { cloneDeep, tap, set } from "lodash";
import ManageSocials from "@/components/ManageSocials.vue";

export default {
  components: { ManageSocials },
  props: {
    value: {
      type: Object,
      required: true,
    },
    cip: {
      type: Number,
      required: true,
    },
  },
  computed: {
    projectDetails: {
      get() {
        return this.value;
      },
      set(projectDetails) {
        this.$emit("input", projectDetails);
      },
    },
    projectName: {
      get() {
        return this.projectDetails[0];
      },
      set(value) {
        this.projectDetails[0] = value;
      },
    },
    projectDescription: {
      get() {
        return Array.isArray(this.projectDetails[1])
          ? this.projectDetails[1].join(" ")
          : this.projectDetails[1];
      },
      set(projectDescription) {
        this.projectDetails[1] = this.wordwrap(projectDescription, 64);
      },
    },
    projectImage: {
      get() {
        return this.projectDetails[2];
      },
      set(value) {
        this.projectDetails[2] = value;
      },
    },
    projectBanner: {
      get() {
        return this.projectDetails[3];
      },
      set(value) {
        this.projectDetails[3] = value;
      },
    },
    nsfw: {
      get() {
        return this.projectDetails[4];
      },
      set(value) {
        this.projectDetails[4] = value;
      },
    },
    artistName: {
      get() {
        return this.projectDetails[6];
      },
      set(value) {
        this.projectDetails[6] = value;
      },
    },
    socials: {
      get() {
        return Array.isArray(this.projectDetails[5])
          ? this.projectDetails[5]
          : [];
      },
      set(value) {
        this.projectDetails[5] = value;
      },
    },
  },
  data: () => ({
    rules: {
      name: [(v) => !!v || "Must provide a collection name!"],
    },
  }),
  emits: ["input"],
  methods: {
    update(key, value) {
      if (key === 1) {
        value = this.wordwrap(value, 64);
      }
      this.projectDetails = tap(cloneDeep(this.projectDetails), (v) =>
        set(v, key, value)
      );
      this.$forceUpdate();
    },
  },
};
</script>

<template>
  <div class="mb-4">
    <h2>CIP-{{ cip }}: Token Project Details</h2>
    <p>
      <code>Version 1</code>
    </p>
    <v-text-field
      v-model="projectName"
      label="Collection Name"
      @input="update(0, $event)"
      :rules="rules.name"
    ></v-text-field>
    <v-text-field
      v-model="artistName"
      label="Artist Name"
      @input="update(6, $event)"
    />
    <v-textarea
      v-model="projectDescription"
      label="Collection Description"
      hint="Plain text only!!!"
      persistent-hint
      @input="update(1, $event)"
    ></v-textarea>
    <v-text-field
      type="url"
      v-model="projectImage"
      label="Project Profile Image"
      hint="Should be a URI to a square-format image representing the project"
      @input="update(2, $event)"
    ></v-text-field>
    <v-text-field
      type="url"
      v-model="projectBanner"
      label="Project Banner Image"
      hint="Should be a URI to a horizontal-format image representing the project"
      @input="update(3, $event)"
    ></v-text-field>
    <div class="mb-4">
      <v-row>
        <v-col cols="auto">
          <v-switch
            v-model="nsfw"
            :true-value="1"
            :false-value="0"
            color="secondary"
            @change="update(4, $event)"
          ></v-switch>
        </v-col>
        <v-col cols="auto">
          <p class="mt-4">
            <label
              >This project is:
              <v-chip label color="error" v-if="projectDetails[4] === 1">
                NSFW
              </v-chip>
              <v-chip label color="success" v-else>Safe for Work</v-chip>
            </label>
          </p>
        </v-col>
        <v-spacer></v-spacer>
      </v-row>
    </div>
    <ManageSocials v-model="socials" @input="update(5, $event)" />
  </div>
</template>

<style scoped></style>
