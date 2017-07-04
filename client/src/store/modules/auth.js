
import axios from 'axios';
import * as muts from '../mutation-types';
import router from '../../router';
import has from 'has';
import Vue from 'vue';

const state = {
  authenticated: false,
  data: {}
};

const getters ={
  isLoggedIn: state => {
    return state.authenticated;
  },
  getUser: state => {
   // return state.data;
    return {
      username: 'dinar'
    };
  },
  getToken: state => {
    return has(state.data,'access_token') ? 'Bearer ' + state.data.access_token : null;
  }
};


const mutations = {

  [muts.LOGIN] (state, data) {
    state.authenticated = true;
    state.data = data;
    state.errors = '';
  },

  [muts.LOG_OUT] (state) {
    state.authenticated = false;
    state.data = {};
  },

  [muts.LOGIN_FAILURE] (state) {
    state.authenticated = false;
    state.data = {};
  }
};


const actions = {

  login({ commit }, creds) {

    return new Promise((resolve, reject) => {

      axios.post('/api/login', creds)
        .then( res => {

          console.log(res.data);
          console.log(res.data.access_token);

          commit(muts.LOGIN, res.data);
          Vue.prototype.$http.defaults.headers.common.Authorization = `Bearer ${res.data.access_token}`;
          router.replace('/protected');
          resolve();
        })
        .catch( err => {

          console.log(err);
          commit(muts.LOGIN_FAILURE);

          let retErr = has(err.response.data,'error')
        ? err.response.data.error
        : `${err.response.status} ${err.response.statusText}`;

          reject(retErr);
        });
    });

  },

  logOut({ commit }) {
    commit(muts.LOG_OUT);
    router.replace('/login');
  }

};

export default {
  state,
  getters,
  actions,
  mutations
};