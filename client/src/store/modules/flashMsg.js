/**
 * Copyright (C) 2017 Ahmed Dinar
 * 05/07/2017
 */

import { SET_FLASH, CLEAR_FLASH } from '../mutation-types';

const state = {
  msg: null,
  variant: null
};

const getters ={
  getFlash: state => {
    return {
      msg: state.msg,
      variant: state.variant
    };
  }
};

const mutations = {
  [SET_FLASH] (state, flash) {
    state.msg = flash.msg;
    state.variant = flash.variant;
  },
  [CLEAR_FLASH] (state) {
    state.msg = null;
    state.variant = null;
  }
};

const actions = {

  flash({ commit }, msg = null){
    if(msg)
      commit(SET_FLASH, msg);
  }

};

export default {
  state,
  getters,
  actions,
  mutations
};