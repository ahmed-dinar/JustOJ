
import axios from 'axios';
import * as types from '@/store/mutation-types';

const state = {
  problemList: null
};

const getters = {
  problemList: state => state.problemList
};

const mutations = {
  [types.SET_PROBLEMS] (state, problemList) {
    state.problemList = problemList;
  }
};


const actions = {

  fetchProblems({ commit }, page = 1) {

    return axios
      .get(`/api/problem/list?page=${page}`)
      .then(response => {
        console.log(response.data);
        commit(types.SET_PROBLEMS, response.data);
        return Promise.resolve();
      })
      .catch(error => Promise.reject(`${error.response.status} ${error.response.statusText}`));
  },

  updateProblems({ commit }, data){
    data.problems.push({
      id: '100',
      title: 'noob',
      difficulty: 'noob',
      submissions: '100',
      solved: '2'
    });
    commit(types.SET_PROBLEMS, data);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};