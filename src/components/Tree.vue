<template>
  <div class="hello">
    <div>
      <div>
        <button v-on:click="refresh()">Refresh</button>
      </div>
      <div>
        <v-jstree ref="tree" :data="treeStructure" show-checkbox multiple allow-batch whole-row @item-click="itemClick"></v-jstree>
      </div>
    </div>
  </div>
</template>

<script>

  import VJstree from 'vue-jstree'

  export default {
    name: 'Tree',
    components: {
        VJstree
    },

    props: [
      'treeStructure'
    ],

    data() {
      return {
        
      }
    },

    methods: {
      itemClick (node) { //Source: https://github.com/zdy1988/vue-jstree
        console.log(node.model.text + ' clicked !')
      },
      async refresh() { //Source: https://github.com/zdy1988/vue-jstree/issues/12
        // this.treeStructure = [
        //   this.$refs.tree.initializeLoading()
        // ]
        // this.$refs.tree.handleAsyncLoad(this.treeStructure, this.$refs.tree)
        
        // this.$forceUpdate()
      },
    },

    created: function () {
      
    },

    destroyed: function () {
      
    }
  }
</script>