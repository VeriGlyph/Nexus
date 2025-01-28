<script>
export default {
  name: "EditSocialCard",
  emits: ["input", "cancel"],
  props: ["value"],
  computed: {
    content: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
        this.name = value[0];
        this.url = value[1];
      },
    },
    name: {
      get() {
        return this.content[0];
      },
      set(value) {
        this.$set(this.content, 0, value.toLowerCase());
        this.$emit("input", this.content);
      },
    },
    url: {
      get() {
        return Array.isArray(this.content[1])
          ? this.content[1].join("")
          : this.content[1];
      },
      set(value) {
        this.$set(this.content, 1, this.breakURI(value, 64));
      },
    },
  },
  data: () => ({}),
  methods: {
    save() {
      this.$emit("input", this.content);
      this.$emit("cancel");
    },
  },
};
</script>

<template>
  <v-form v-on:submit.prevent="save">
    <v-card>
      <v-card-title>Add New Social Media Account</v-card-title>
      <v-card-text>
        <v-text-field
          label="Social Platform Name"
          v-model="name"
        ></v-text-field>
        <v-text-field label="Social Platform URL" v-model="url"></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn type="submit" color="primary"> Save </v-btn>
        <v-btn color="error" @click="$emit('cancel')">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>
