/*
For conversion to async v-jstree loading see the following code snippets:
  template:
    <v-jstree v-if="show" class="column jstree" ref="tree" :data="asyncData" :async="loadData" show-checkbox multiple allow-batch whole-row @item-click="itemClick"></v-jstree>
  script:
    data () {
        return {
          asyncData: [], //only a placeholder variabel requiered by the v-jstree component
          loadData: function (oriNode, resolve) {
            oriNode.data.id ? oriNode.data.id : 0 //No idea why this is needed - what the hell is oriNode
            resolve(folderTree)
        },
      }
    },
    methods: {
      refreshNode: function () {
        this.asyncData = [
            this.$refs.tree.initializeLoading()
        ]
        this.$refs.tree.handleAsyncLoad(this.asyncData, this.$refs.tree)
      },
    }

Issues with async loading:
  Somehow when the tree is continously rendered while the dataTree array is generated, selecting a file/folder in the tree afterwards does not automatically select all children files/folder.
  Without async this can be cirumvented by only rendering the tree after the array is finished via an v-if statement in the template

Improving loading times:
  Loading times of the v-jstree can be drastically improved by only rendering the v-jstree after creating the array is finished.
  Loading the v-jstree while the array is filled with the data from the File System API takes way longer
  Furthermore loading times can be improved by not loading all the nested objects directly but first loading the root level, and then loading all nested objects while the root level is collapsed in the background - this however rewuieres async loading!
*/

<template>
  <div>
    <div class="column tree">
      <div class="header">
        TreePanel Component
      </div>
      <div class="header">
        <button v-on:click="openFile()">Open</button>
        <button v-on:click="saveFile()">Save</button>
        <button v-on:click="openFolder()">Open Folder</button>
      </div>
      <div>
        <!-- Funny enough: adding the v-if to the jstree fixes another issue. When the tree is continously rendered while the dataTree array is generated, selecting a file/folder in the tree afterwards does not automatically select all children files/folder. When only loading the tree after fully creating the tree this does work however -->
        <!-- The v-jstree component must be assigned another class otherwise the component somehow bugs and presumably applies the above mentioned class a second time hence shrinks down even further. This can be circumvented by assigning a special class to the v-jstree component which uses the whole width of the div and disables overflow. Result, the tree places itself perfectly in the div without overflowing -->
        <v-jstree v-if="show" class="jstree" ref="tree" :data="folderTree" show-checkbox multiple allow-batch whole-row @item-click="itemClick"></v-jstree>
        <!-- ASYNC LOADING:
        <v-jstree v-if="show" class="column jstree" ref="tree" :data="asyncData" :async="loadData" show-checkbox multiple allow-batch whole-row @item-click="itemClick"></v-jstree> -->
      </div>
    </div>
    <div class="column folderPanel">
      <FolderPanel @push-clicked="push" :fileTreeProp="fileTree" :showProp="show" /> <!-- This passes the dataTree as the variable treeStructure down to the tree component (which is a child of this component) - Source: https://www.smashingmagazine.com/2020/01/data-components-vue-js/#propos-share-data-parent-child-->
    </div>
  </div>
</template>

<script>

  import VJstree from 'vue-jstree'
  import FolderPanel from '@/components/FolderPanel.vue'

  // Declaring a varibale here makes it available for all methods below
  let fileHandle;
  let folder;
  let dataTree = [];
  let fileTree = [];
  let folderTree = [];
  let show = false;
  let id = 0;
  let key;
  let index = 0; // The index of the array of the currently processed object
  let contents;

  export default {
    name: 'TreePanel',
    components: {
      VJstree,
      FolderPanel,
    },

    data () {
      return { // returns a global variable which can be passed through to child components and the template above
        msg: 'Blankscape',
        fileTree,
        folderTree,
        show,
        /* ASYNC LOADING:
        asyncData: [], //only a placeholder variabel requiered by the v-jstree component
        loadData: function (oriNode, resolve) {
          oriNode.data.id ? oriNode.data.id : 0 //No idea why this is needed - what the hell is oriNode
          resolve(folderTree)
        },
        */
      }
    },

    methods: {
      async openFile() { // Source: https://web.dev/file-system-access/
        // let textArea = document.getElementById('editor');
        // let textArea = this.$refs.editor;
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        contents = await file.text();
        console.log(contents)
        // textArea.value = contents;
        // this.$refs.editor.value = contents;
      },

      async saveFile() { // Source: https://web.dev/file-system-access/
        let textArea = document.getElementById('editor');
        let writable = await fileHandle.createWritable();
        await writable.write(textArea.value);
        await writable.close();
      },

      async openFolder() { // Source: https://www.youtube.com/watch?v=csCk4mrEmm8
        
        this.show = false

        // Resetting all arrays
        // According to the internet, this is performance wise the fastest way to truly empty an array. Funny enough, this is also the only way updating the vue-jstree works after emptying the array. The most intuitive command "dataTree = []" empties the array but somehow does not always trigger the data update of components in the template (somtimes emptying works but on re-filling update is broken again). No idea why - search the whole internet for hours for this issue
        while (dataTree.length > 0) {
            dataTree.pop();
        }
        while (folderTree.length > 0) {
            folderTree.pop();
        }

        // dataTree = [];
        // folderTree = [];

        folder = await window.showDirectoryPicker();
        await this.getFiles(folder);
        
        this.show = true
        console.log(dataTree)

      },

      async getFiles(folder, parentId = null, dataPath = [], folderPath = []) {

        // Files and folders come alphabetically from API not sorted by files or folders

        for await (const entry of folder.values()) {
          
          // id has to be incrimented at the beginning (not the end) because this "for" function is nested and multiple times called within itself befor finishing
          id++ // This starts with the id = 1 for the first object

          // Declaring the Objects which are individually and recursivly pushed into the tree Structure arrays
          let fileObj = { // Array/Object structure: https://zdy1988.github.io/vue-jstree/
            id: id,
            text: entry.name,
            value: "",
            icon: "",
            opened: "true",
            // selected: "false",
            disabled: "true",
            // loading: "false",
            parent: parentId ?? '#',
            // path: dataPath,
            children: []
          };
          let dirDataObj = {
            id: id,
            text: entry.name,
            value: "",
            icon: "",
            opened: "true",
            // selected: "false",
            // disabled: "false",
            // loading: "false",
            parent: parentId ?? '#',
            // path: dataPath,
            children: []
          };
          let dirFolderObj = { // Even if this object would be out of the same structre as dirDataObj, there have to be two seperate objects for the function: "await this.assign(dataTree, dataPath, dirDataObj)" & "await this.assign(folderTree, folderPath, dirFolderObj)" otherwise it strangly adds multiple instances of teh object to the folderTree array. No idea why!
            id: id,
            text: entry.name,
            value: "",
            icon: "",
            opened: "true",
            // selected: "false",
            // disabled: "false",
            // loading: "false",
            parent: parentId ?? '#',
            // path: folderPath,
            children: []
          };

          if (entry.kind === "file") {
            await this.assign(dataTree, dataPath, fileObj)
            /* TEST LOG:
            console.log('_____________________________________________')
            console.log('_________________________________________FILE')
            console.log('file_id: ' + id)
            console.log('file_path: ' + dataPath)
            console.log('parentId: ' + parentId)
            */
          }
          else if (entry.kind === "directory") {
            await this.assign(dataTree, dataPath, dirDataObj)
            await this.assign(folderTree, folderPath, dirFolderObj)
            /* TEST LOG:
            console.log('_____________________________________________')
            console.log('____________________________________DIRECTORY')
            console.log('dir_id: ' + id)
            console.log('dir_path: ' + dataPath)
            console.log('parentId: ' + parentId)
            */

            // Get index of the current directory in the dataTree array
            await this.getIndex(dataTree, dataPath, id)
            // Creating the path of this directory in the dataTree array where in the below nested .getFiles() function deeper laying files and folders can be added
            await this.moveDown(dataPath)

            //Get index of the current directory in the folderTree array
            await this.getIndex(folderTree, folderPath, id)
            // Creating the path of this directory in the folderTree array where in the below nested .getFiles() function deeper laying folders can be added
            await this.moveDown(folderPath)

            // Going deeper in the folder structure by opening another directory by accessing this function again (nested)
            // Therefore updating the array to pass the current tree path to the assign function later
            await this.getFiles(entry, id, dataPath, folderPath)
          }
        }
        
        // When reaching this part of the function the deeper laying folder structures has been finished processing
        // Therefore updating the array to move up one folder in the path (if not already on the root level - which is considered within the moveUp function)
        await this.moveUp(dataPath)
        await this.moveUp(folderPath)
      },

      async assign(obj, keyPath, value) { // Source: https://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
        
        let keyPathLength = keyPath.length

        if (keyPathLength < 2) {
          obj.push(value)
        }
        else {
          let lastKeyIndex = keyPath.length - 1;
          for (var i = 0; i < lastKeyIndex; ++ i) {
            key = keyPath[i];
            if (!(key in obj)){
              obj[key] = {}
            }
            obj = obj[key];
          }
          // console.log("obj: " + obj)
          // console.log("keyPath: " + keyPath)
          // console.log("lastKeyIndex: " + lastKeyIndex)
          // console.log("value: " + value)
          obj[keyPath[lastKeyIndex]].push(value);
        }
      },

      async getIndex(obj, keyPath, id) {
        
        let keyPathLength = keyPath.length

        if (keyPathLength < 2) {
          index = obj.findIndex(x => x.id === id)
        }
        else {
          let lastKeyIndex = keyPath.length - 1;
          for (var i = 0; i < lastKeyIndex; ++ i) {
            key = keyPath[i];
            if (!(key in obj)){
              obj[key] = {}
            }
            obj = obj[key];
          }
          index = obj[keyPath[lastKeyIndex]].findIndex(x => x.id === id)
        }
      },

      async moveDown(path) {
            path.push(index); // parentIndex = 0 is the initial state when the function is first run (hence at this part the first directory is opened)
            path.push('children');
      },

      async moveUp(path) {
        let arrayLength = path.length

        /* TEST LOG:
        console.log('_____________________________________________')
        console.log('___________________________________UP_A_LEVEL')
        console.log('path: ' + path)
        console.log('arrayLength: ' + arrayLength)
        */

        // The path.length cannot be negative, hence negative values do not have to be considered ()
        if (arrayLength > 0) {
          let newArrayLength = arrayLength - 2
          path.length = newArrayLength
        }
      },

      /* ASYNC LOADING:
      refreshNode: function () { // refresh function for async loading of the v-jstree
        this.asyncData = [
            this.$refs.tree.initializeLoading()
        ]
        this.$refs.tree.handleAsyncLoad(this.asyncData, this.$refs.tree)
      },
      */

      itemClick (node) { // Source: https://github.com/zdy1988/vue-jstree
        console.log(node.model.text + ' clicked !')

        // Emptying the array via this method instead of fileTree = [] because of above mentioned reasons
        while (this.fileTree.length > 0) {
            this.fileTree.pop();
        }

        // console.log(node.model.id)
        // this.fileTree = dataTree.slice(node.model.id)

        console.log(dataTree[1].children)
        this.fileTree = dataTree[1].children[1].children.slice(0)

      },

      keyDown: function () {
        const activeElement = document.getElementsByClassName('active')[0]
        if (activeElement && !isNaN(event.key) && event.key > 0) {
          activeElement.innerHTML = event.key
        }
      },

      push () {
        console.log('emitted')
      },
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

<style scoped>

.column {
  float: left;
}

.tree {
  width: 25%; /* 25% of the whole window */
}

.header {
  display: block; /* float: left; & width: 100%; together have the same effect */
  text-align: left;
}

.jstree {
  width: 100%; /* 100% of the 25% (see .tree) of the whole window */
  max-height: calc(100vh - 121px); /* This makes the jstree exactly as tall as the window so the horizontal scroll bar is still visible */
  min-height: calc(100vh - 121px);
  overflow: auto; /* overflow: hidden completely hides it, overflow: auto adds a scrollbar if needed */
}

.folderPanel {
  width: 75%; /* 75% of the whole window */
}

/* Clear floats after the columns */
/* .row:after {
  content: "";
  display: table;
  clear: both;
} */
</style>