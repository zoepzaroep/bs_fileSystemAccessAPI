<template>
  <div class="hello">
    <div>
      <Tree @push-clicked="push" :treeStructure="testProp" /> <!-- This passes the globalTreeData as the variable treeStructure down to the tree component (which is a child of this component) - Source: https://www.smashingmagazine.com/2020/01/data-components-vue-js/#propos-share-data-parent-child-->
    </div>
  </div>
</template>

<script>

  import Tree from '@/components/Tree.vue'

  let testProp = [];

  export default {
    name: 'Home',
    components: {
      Tree, //Declaring the child component
    },

    data() {
      return {
        testProp
      }
    },

    methods: {
      itemClick (node) { //Source: https://github.com/zdy1988/vue-jstree
        console.log(node.model.text + ' clicked !')
      },
      push () {
        console.log('emitted')
      }
    },

    created: function () {
      // window.addEventListener('keydown', this.keyDown)
      window.addEventListener('keydown', e => {
        if (e.key === 's' && e.metaKey){
          e.preventDefault();
          this.saveFile()
        }
      })
    },

    destroyed: function () {
      // window.removeEventListener('keydown', this.keyDown)
    }
  }
</script>