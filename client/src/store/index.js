import Vue from 'vue';
import Vuex from 'vuex';

import auth from './modules/auth';
import problem from './modules/problem';
import createPersistedState from 'vuex-persistedstate';
import { createFlashStore } from 'vuex-flash';
import * as types from './mutation-types';

Vue.use(Vuex);

export default new Vuex.Store({

  modules: {
    auth,
    problem
  },

  plugins: [

    createFlashStore(),

    createPersistedState({
      paths: ['auth'],
      filter: mutation =>{
        let mutType = mutation.type;
        return mutType === types.LOGIN || mutType === types.LOG_OUT || mutType === types.LOGIN_FAILURE;
      }
    }),

    createPersistedState({
      paths: ['FLASH'],
      key: '__vuexFlash',
      storage: window.sessionStorage,
      filter: mutation => {
        return mutation.type === 'FLASH/SET_FLASH' || mutation.type === 'FLASH/CLEAR_FLASH';
      }
    })
  ]

});