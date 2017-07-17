import Vue from 'vue';
import Vuex from 'vuex';

import auth from './modules/auth';
import flashMsg from './modules/flashMsg';
import createPersistedState from 'vuex-persistedstate';
import * as types from './mutation-types';

Vue.use(Vuex);

export default new Vuex.Store({

  modules: {
    auth,
    flashMsg
  },

  plugins: [

    createPersistedState({
      paths: ['auth'],
      filter: mutation =>{
        let mutType = mutation.type;
        return mutType === types.LOGIN || mutType === types.LOG_OUT || mutType === types.LOGIN_FAILURE;
      }
    }),

   // for flash message in session
    createPersistedState({
      paths: ['flashMsg'],
      key: '__vuexFlash',
      getState: (key) => {

        const value = window.sessionStorage.getItem(key);
        window.sessionStorage.removeItem(key);

        try {
          return value && value !== 'undefined' ? JSON.parse(value) : undefined;
        } catch (err) {
          return undefined;
        }
      },
      setState: (key, state) => {
        console.log('setState');
        console.log(state);
        window.sessionStorage.setItem(key, JSON.stringify(state));
      },
      filter: mutation => mutation.type === types.SET_FLASH
    })
  ]

});