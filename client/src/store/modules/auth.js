
import axios from 'axios';
import * as types from '@/store/mutation-types';
import has from 'has';
import moment from 'moment';

const state = {
  authenticated: false,
  data: {}
};

const getters ={
  isLoggedIn: states => {

    if( has(states.data,'expires') ){
      let expires = states.data.expires;
      let now = moment.utc().format();
      return now < expires;
    }

    return states.authenticated;
  },
  getUser: states => states.data
};

const mutations = {
  [types.LOGIN] (state, data) {
    state.authenticated = true;
    state.data = data;
  },
  [types.LOG_OUT] (state) {
    state.authenticated = false;
    state.data = {};
  },
  [types.LOGIN_FAILURE] (state) {
    state.authenticated = false;
    state.data = {};
  }
};


const actions = {

  login({ commit }, creds) {
    return new Promise((resolve, reject) => {

      axios.post('/api/signin', creds)
        .then( response => {
          commit(types.LOGIN, response.data);
          resolve();
        })
        .catch( err => {

          commit(types.LOGIN_FAILURE);

          let retErr = has(err.response.data,'error')
            ? err.response.data.error
            : `${err.response.status} ${err.response.statusText}`;

          reject(retErr);
        });
    });
  },

  logOut({ commit }, reload = false) {
    axios.post('/api/signin/signout', {})
      .then( response => {
        commit(types.LOG_OUT);
        if(reload){
          window.location.reload();
        }
      })
      .catch( err => {
        console.log(`${err.response.status} ${err.response.statusText}`);
      });
  }

};

export default {
  state,
  getters,
  actions,
  mutations
};