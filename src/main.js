import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import nexusCommon from "@/plugins/nexus-common";
import vueCardano from "@/plugins/vue-cardano";

Vue.config.productionTip = false;
Vue.use(nexusCommon);
Vue.use(vueCardano);

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
