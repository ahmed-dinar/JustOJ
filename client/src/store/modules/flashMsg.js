/**
 * Copyright (C) 2017 Ahmed Dinar
 * 05/07/2017
 */

import { SET_FLASH, CLEAR_FLASH } from '../mutation-types';

const state = {
  message: null,
  variant: null
};

const getters ={
  getFlash: state => {
    return {
      message: state.message,
      variant: state.variant
    };
  }
};

const mutations = {
  [SET_FLASH] (state, flash) {
    state.message = flash.message;
    state.variant = flash.variant;
  },
  [CLEAR_FLASH] (state) {
    state.message = null;
    state.variant = null;
  }
};

const actions = {

  flash({ commit }, message = null){
    if(message){
      commit(SET_FLASH, message);
    }
  }

};

export default {
  state,
  getters,
  actions,
  mutations
};