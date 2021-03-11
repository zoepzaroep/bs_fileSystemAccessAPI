import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

let storeArray = [];

export default new Vuex.Store({
  state: {
    count: 0,
    storeArray
  },

  getters: {

  },

  mutations: {
    increment (state) {
        state.count++
    },
    push (obj, value) {
        obj.push(value)
    }    
  },

  actions: {

  }
});