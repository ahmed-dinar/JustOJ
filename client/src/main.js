// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import { sync } from 'vuex-router-sync';
import BootstrapVue from 'bootstrap-vue';
import VeeValidate from 'vee-validate';
import VuexFlash from 'vuex-flash';
import axios from 'axios';
import VueQuillEditor from 'vue-quill-editor';
import katex from 'katex';
import ToggleButton from 'vue-js-toggle-button';
import screenfull from 'screenfull';
import VueHighlightJS from 'vue-highlightjs';
import NProgress from 'nprogress';
import has from 'has';
import VTooltip from 'v-tooltip';

import config from './config';
import Mixins from './mixins/Mixins';
import { GlobalComponents } from './components/common';
import VueNoty from './components/custom/VueNoty';

import App from './App';
import router from './router';
import store from './store';

//particles instance
import 'particles.js';

//sylesheets
import 'flatpickr/dist/themes/dark.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'nprogress/nprogress.css';
import 'animate.css/animate.min.css';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import 'highlight.js/styles/github-gist.css';
import 'katex/dist/katex.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import './assets/noty.css';
import './assets/style.css';



sync(store, router);

Vue.prototype.$http = axios;
Vue.config.productionTip = false;

if(!window.katex){
  window.katex = katex;
}

if(!window.screenfull){
  window.screenfull = screenfull;
}

if(!window.progressbar){
  window.progressbar = NProgress;
}


VeeValidate.Validator.extend('verify_exists', {
  getMessage: field => `This ${field} is not available.`,
  validate: value => new Promise(resolve => {
    if( !value ){
      resolve({ valid: true });
      return;
    }

    axios
      .post('/api/user/available', { data: value })
      .then(response => {
        resolve({ valid: has(response.data,'available') && response.data.available === true });
      });
  })
});


VeeValidate.Validator.extend('fileRequired', {
  getMessage: field => `This ${field} is not lalal.`,
  validate: value => new Promise(resolve => {
    if( !value ){
      resolve({ valid: false });
      return;
    }
    resolve({ valid: true });
  })
});


Vue.use(VTooltip);
Vue.use(VueNoty);
Vue.use(VueHighlightJS);
Vue.use(ToggleButton);
Vue.use(VueQuillEditor);
//settings of quill, must be after VueQuillEditor
import './config/initQuill';

Vue.use(BootstrapVue);
Vue.use(GlobalComponents);

//form validator
Vue.use(VeeValidate, {
  errorBagName: 'formError',
  fieldsBagName: 'formFields'
});

//flash message components
Vue.use(VuexFlash, {
  mixin: true,
  keep: false,
  template: config.flashTemplate
});

//global mixins
Vue.use(Mixins);


/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
});
