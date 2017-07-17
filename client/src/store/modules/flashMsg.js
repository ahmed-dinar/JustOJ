/**
 * Copyright (C) 2017 Ahmed Dinar
 * 05/07/2017
 */

import { SET_FLASH, CLEAR_FLASH } from '../mutation-types';

const state = {
<<<<<<< HEAD
  message: null,
=======
  msg: null,
>>>>>>> a527a4d8c003a094a205c2d66b629e7a26cd9aa5
  variant: null
};

const getters ={
  getFlash: state => {
    return {
<<<<<<< HEAD
      message: state.message,
=======
      msg: state.msg,
>>>>>>> a527a4d8c003a094a205c2d66b629e7a26cd9aa5
      variant: state.variant
    };
  }
};

const mutations = {
  [SET_FLASH] (state, flash) {
<<<<<<< HEAD
    state.message = flash.message;
    state.variant = flash.variant;
  },
  [CLEAR_FLASH] (state) {
    state.message = null;
=======
    state.msg = flash.msg;
    state.variant = flash.variant;
  },
  [CLEAR_FLASH] (state) {
    state.msg = null;
>>>>>>> a527a4d8c003a094a205c2d66b629e7a26cd9aa5
    state.variant = null;
  }
};

const actions = {

<<<<<<< HEAD
  flash({ commit }, message = null){
    if(message){
      commit(SET_FLASH, message);
    }
=======
  flash({ commit }, msg = null){
    if(msg)
      commit(SET_FLASH, msg);
>>>>>>> a527a4d8c003a094a205c2d66b629e7a26cd9aa5
  }

};

export default {
  state,
  getters,
  actions,
  mutations
};