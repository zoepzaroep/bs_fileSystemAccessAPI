<template>
  <div>
    <div id="div" class="column folder">
      <div class="header">
        FolderPanel Component
      </div>
      <div class="header">
        <button v-on:click="log()">Log Prop</button>
        <button v-on:click="$emit('push-clicked')">Emit</button> <!-- Emit event to parent. Parent needs to listen to the emit with the following attribute in the child component: @push-clicked="push" where "push" is the method that shuld be run -->
      </div>
      <div>
        <v-jstree v-if="showProp" class="jstree" ref="tree" :data="rootFileTreeProp" show-checkbox multiple allow-batch whole-row></v-jstree>
      </div>
    </div>
    <div class="column filePanel">
      <FilePanel />
    </div>
  </div>
</template>

<script>

  import VJstree from 'vue-jstree'
  import FilePanel from '@/components/FilePanel.vue'

  export default {
    name: 'TreePanel',
    components: {
      VJstree,
      FilePanel,
    },

    data () {
      return {
        
      }
    },

    props: [
      'rootFileTreeProp',
      'showProp'
    ],

    methods: {
      async log() { // Source: https://github.com/zdy1988/vue-jstree/issues/12  
        console.log(this.$props.fileTreeProp)
      },
    }
  }
</script>

<style scoped>

.column {
  float: left;
}

.folder {
  width: 33%; /* one third of the FolderPanel which was granted 75% of the page in the TreePanel.vue - Hence, physically the folder column is exactly as wide as the tree column from the TreePanel */
}

.header {
  display: block; /* float: left; & width: 100%; together have the same effect */
  text-align: left;
}

.jstree {
  width: 100%;
  max-height: calc(100vh - 121px); /* This makes the jstree exactly as tall as the window so the horizontal scroll bar is still visible*/
  min-height: calc(100vh - 121px);
  overflow: auto; /* overflow: hidden completely hides it, overflow: auto adds a scrollbar if needed */
}

.filePanel {
  width: 67%; /* two thirds of the FolderPanel which was granted 75% of the page in the TreePanel.vue - Hence, physically the file column is exactly halfe the page width */
}

/* Clear floats after the columns */
.row:after {
  content: "";
  display: table;
  clear: both;
}
</style>