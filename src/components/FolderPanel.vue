<template>
  <div>
    <div id="div" class="column folder">
      <div>
        FolderPanel Component
      </div>
      <div>
        <button v-on:click="log()">Log Prop</button>
        <button v-on:click="$emit('push-clicked')">Emit</button> <!-- Emit event to parent. Parent needs to listen to the emit with the following attribute in the child component: @push-clicked="push" where "push" is the method that shuld be run -->
      </div>
      <div>
        <v-jstree v-if="showProp" class="column jstree" ref="tree" :data="treeDataProp" show-checkbox multiple allow-batch whole-row></v-jstree>
      </div>
    </div>
    <div class="column file">
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

    props: [
      'treeDataProp',
      'showProp'
    ],

    methods: {
      async log() { //Source: https://github.com/zdy1988/vue-jstree/issues/12  
        console.log(this.$props.treeDataProp)
      },
    }
  }
</script>

<style scoped>

.column {
  float: left;
}

.folder {
  width: 33%;
}

.jstree {
  width: 100%;
  max-height: calc(100vh - 121px); /* This makes the jstree exactly as tall as the window so the horizontal scroll bar is still visible*/
  min-height: calc(100vh - 121px);
  overflow: auto; /* overflow: hidden completely hides it, overflow: auto adds a scrollbar if needed */
}

.file {
  width: 67%;
}

/* Clear floats after the columns */
.row:after {
  content: "";
  display: table;
  clear: both;
}
</style>