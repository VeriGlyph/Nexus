<script>
import { cloneDeep, tap, set } from "lodash";

export default {
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
    newSocialName: {
      get() {
        return this.newSocial.data[0];
      },
      set(value) {
        this.newSocial.data[0] = value.toLowerCase();
      },
    },
    newSocialUrl: {
      get() {
        return Array.isArray(this.newSocial.data[1])
          ? this.newSocial.data[1].join("")
          : this.newSocial.data[1];
      },
      set(value) {
        this.newSocial.data[1] = this.breakURI(value, 64);
      },
    },
  },
  emits: ["input"],
  methods: {
    updateSocial(key, value) {
      this[key] = value;
      this.$forceUpdate();
    },
    update(key, value) {
      if (key === 1) {
        value = this.wordwrap(value, 64);
      }
      this.projectDetails = tap(cloneDeep(this.projectDetails), (v) =>
        set(v, key, value)
      );
      this.$forceUpdate();
    },
    createSocial() {
      this.newSocial.data = [];
      this.newSocial.valid = false;
      this.newSocial.show = true;
    },
  },
  data: () => ({
    newSocial: {
      data: [],
      show: false,
      valid: false,
    },
    rules: {
      name: [(v) => !!v || "Must provide a collection name!"],
    },
  }),
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
    <div class="mb-4">
      <v-row justify="end">
        <v-col cols="auto">
          <label>Project Social Media</label>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto">
          <v-btn color="accent" @click="createSocial">
            <v-icon>mdi-plus</v-icon>
            Add Social
          </v-btn>
        </v-col>
      </v-row>
      <v-simple-table v-if="socials.length">
        <template v-slot:default>
          <thead>
            <tr>
              <th>Platform</th>
              <th>Link</th>
              <th>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(social, index) in socials" :key="index">
              <td>{{ social[0] }}</td>
              <td>{{ social[1].join("") }}</td>
              <td></td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </div>
    <v-divider></v-divider>
    <v-dialog v-model="newSocial.show" persistent max-width="768">
      <v-card>
        <v-card-title>
          Add Social Platform
          <v-spacer></v-spacer>
          <v-btn icon @click="newSocial.show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-form ref="newSocial" v-model="newSocial.valid">
            <v-text-field
              label="Social Platform Name"
              v-model="newSocialName"
              @input="updateSocial(newSocialName, $event)"
            ></v-text-field>
            <v-text-field
              label="Social Platform URL"
              v-model="newSocialUrl"
              @input="updateSocial(newSocialUrl, $event)"
            ></v-text-field>
          </v-form>
          <pre>{{ newSocial.data }}</pre>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped></style>
