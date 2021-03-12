import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);  

export default new Vuex.Store({
  state: {
    count: 0, // Test-state to check if the Vuex setup works
  },

  getters: {

  },

  mutations: {
    increment (state) { // Test-function to test if the Vuex setup works
        state.count++
    },   
  },

  actions: {

  }
});