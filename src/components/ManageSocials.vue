<script>
import AddSocialCard from "@/components/AddSocialCard.vue";
import EditSocialCard from "@/components/EditSocialCard.vue";

export default {
  components: { EditSocialCard, AddSocialCard },
  props: {
    value: {
      type: Array,
      required: true,
    },
  },
  computed: {
    content: {
      get() {
        return this.value;
      },
      set(new_value) {
        this.$emit("input", new_value);
        this.$forceUpdate();
      },
    },
  },
  data: () => ({
    newSocial: {
      show: false,
    },
    editSocial: {
      show: false,
      account: undefined,
    },
  }),
  emits: ["input"],
  methods: {
    createSocial() {
      this.newSocial.show = true;
    },
    async addSocial(value) {
      const lookup_key = this.getKey(value);
      if (this.content.some((e) => this.getKey(e) === lookup_key)) {
        this.$forceUpdate();
        this.newSocial.show = false;
      } else {
        await this.$nextTick();
        this.content = [...this.content, value];
      }
      this.$forceUpdate();
      this.newSocial.show = false;
    },
    edit(social) {
      this.editSocial.account = social;
      this.editSocial.show = true;
    },
    updateSocial(value) {
      this.$nextTick(() => {
        this.editSocial.account = value;
        this.$emit("input", this.content);
      });
      this.$forceUpdate();
    },
    async remove(social) {
      let found_index = null;
      const lookup_key = this.getKey(social);
      this.content.forEach((e, i) => {
        if (found_index !== null) {
          return;
        }
        const value_key = this.getKey(e);
        if (value_key === lookup_key) {
          found_index = i;
        }
      });

      if (found_index !== null) {
        this.content.splice(found_index, 1);
        this.$emit("input", this.content);
        this.content = this.content.slice();
        await this.$nextTick();
        this.$forceUpdate();
      }
    },
    getKey(social) {
      return `${social[0]}-${social[1].join("")}`;
    },
  },
};
</script>

<template>
  <div class="mb-4">
    <v-row justify="end">
      <v-col cols="auto">
        <label>Project Social Media</label>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="auto">
        <v-btn color="accent" @click="createSocial" class="mb-2">
          <v-icon>mdi-plus</v-icon>
          Add Social
        </v-btn>
      </v-col>
    </v-row>
    <v-simple-table v-if="content.length">
      <template v-slot:default>
        <thead>
          <tr>
            <th>Platform</th>
            <th>Link</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="social in content" :key="getKey(social)">
            <td>{{ social[0] }}</td>
            <td>{{ social[1].join("") }}</td>
            <td class="text-end">
              <v-btn color="white" icon @click="edit(social)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn color="white" icon @click="remove(social)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    <v-divider></v-divider>
    <v-dialog v-model="newSocial.show" persistent max-width="768">
      <AddSocialCard @cancel="newSocial.show = false" @save="addSocial" />
    </v-dialog>
    <v-dialog v-model="editSocial.show" persistent max-width="768">
      <EditSocialCard
        v-model="editSocial.account"
        @input="updateSocial"
        @cancel="editSocial.show = false"
      />
    </v-dialog>
  </div>
</template>
