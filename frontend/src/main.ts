import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import './assets/styles/main.css'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from "./router"

createApp(App).use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false
        }
    }
}).use(router).use(VueQueryPlugin).mount('#app')
