import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: "#FAC748",
        secondary: "#47EFF3",
        accent: "#6308bf",
      },
    },
  },
});
