<template>
  <div class="hello">
    <div>
      <div>
        <button v-on:click="refresh()">Refresh</button>
        <button v-on:click="$emit('push-clicked')">Emit</button> <!-- Emit event to parent. Parent needs to listen to the emit with the following attribute in the child component: @push-clicked="push" where "push" is the method that shuld be run -->
      </div>
    </div>
  </div>
</template>

<script>

  // import Tree from 'vuejs-tree'

  export default {
    name: 'Tree',
    components: {

    },

    props: [
      'treeStructure'
    ],

    data() {
      return {
        
      }
    },


    methods: {
      async refresh() { //Source: https://github.com/zdy1988/vue-jstree/issues/12  
        console.log(this.$props.treeStructure)
      },
    },

    created: function () {
     
    },

    destroyed: function () {
      
    }
  }
</script>