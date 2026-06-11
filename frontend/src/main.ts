import Material from "@primeuix/themes/material"
import { VueQueryPlugin } from "@tanstack/vue-query";
import PrimeVue from "primevue/config";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import "./assets/styles/main.css";

createApp(App)
  .use(PrimeVue, {
    theme: {
      preset: Material,
      options: {
        prefix: "p",
        darkModeSelector: false,
        cssLayer: false,
      },
    },
  })
  .use(ToastService)
  .use(router)
  .use(VueQueryPlugin)
  .directive("tooltip", Tooltip)
  .mount("#app");
