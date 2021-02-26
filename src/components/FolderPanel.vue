<template>
  <div class="panel">
    <div id="div" class="column folder">
      <div>
        FolderPanel Component
      </div>
      <div>
        <button v-on:click="log()">Log Prop</button>
        <button v-on:click="$emit('push-clicked')">Emit</button> <!-- Emit event to parent. Parent needs to listen to the emit with the following attribute in the child component: @push-clicked="push" where "push" is the method that shuld be run -->
      </div>
      <div>
        <textarea v-model="contentsProp" v-if="contentsProp != 0" ref="editor" id="editor" cols="30" rows="10" placeholder="Textarea"></textarea>
      </div>
    </div>
    <div class="column file">
      <FilePanel />
    </div>
  </div>
</template>

<script>

  import FilePanel from '@/components/FilePanel.vue'

  export default {
    name: 'TreePanel',
    components: {
      FilePanel,
    },

    props: [
      'treeDataProp',
      'contentsProp'
    ],

    methods: {
      async log() { //Source: https://github.com/zdy1988/vue-jstree/issues/12  
        console.log(this.$props.treeDataProp)
        console.log(this.$props.contentsProp)
      },
    }
  }
</script>

<style scoped>

.panel {
  max-height: 100%;
}

.column {
  float: left;
}

.folder {
  width: 33%;
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