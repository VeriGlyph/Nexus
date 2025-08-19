<script>
export default {
  name: "AddSocialCard",
  emits: ["save", "cancel"],
  computed: {
    name: {
      get() {
        return this.content[0];
      },
      set(value) {
        this.$set(this.content, 0, value.toLowerCase());
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
  data: () => ({
    content: [],
  }),
  methods: {
    update() {
      console.log(`Emitting the social account?`, this.content);
      this.$emit("save", this.content);
      this.content = [];
    },
  },
};
</script>

<template>
  <v-form v-on:submit.prevent="update">
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
        <v-btn type="submit" color="primary"> Add Social Account </v-btn>
        <v-btn color="error" @click="$emit('cancel')">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<style scoped></style>
