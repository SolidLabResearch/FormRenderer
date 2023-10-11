import { createApp } from "vue";
import App from "./App.vue";
import * as VueRouter from "vue-router";

import "./assets/main.css";

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(process.env.NODE_ENV === "production" ? "/FormRenderer/" : "/"),
  routes: [{ path: "/", component: App, props: true }],
});

const app = createApp(App);
app.use(router);
app.mount("#app");
