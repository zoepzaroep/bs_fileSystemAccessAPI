import Vue from 'vue'
import App from './Wrapper.vue'
import router from './router'
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false

new Vue({
  router, //Introducing the router which is imported above from /router/index.js (index.js is the default filename and it is requiered to be named like that)
  vuetify,
  render: h => h(App) //Here the component "Wrapper.vue" is loaded, which sits in the same folder and houses all the html, js and css code
}).$mount('#mainview') //This mounts (injects) the new Vue into the mainview div under public/index.html
