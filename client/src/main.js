// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import { sync } from 'vuex-router-sync';
import BootstrapVue from 'bootstrap-vue';
import VeeValidate from 'vee-validate';
import VuexFlash from 'vuex-flash';
import axios from 'axios';
import VueQuillEditor from 'vue-quill-editor';

import table from './components/custom/table';

import App from './App';
import router from './router';
import store from './store';

import 'particles.js';

// import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'font-awesome/css/font-awesome.css';
import 'nprogress/nprogress.css';
import 'bootstrap-social/bootstrap-social.css';
import 'animate.css/animate.min.css';
import './assets/style.css';
import './assets/fonts/fonts.css';
import config from './config';

sync(store, router);

Vue.prototype.$http = axios;
Vue.config.productionTip = false;


Vue.use(VueQuillEditor);
//settings of quill
import './config/initQuill';


Vue.use(BootstrapVue);
Vue.use(VeeValidate, {
  errorBagName: 'formError',
  fieldsBagName: 'formFields'
});
Vue.use(VuexFlash, {
  mixin: true,
  keep: false,
  template: config.flashTemplate
});


Vue.component('m-table', table);



/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
});
