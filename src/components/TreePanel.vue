<template>
  <div>
    <div class="column tree">
      <div>
        TreePanel Component
      </div>
      <div>
        <button v-on:click="openFile()">Open</button>
        <button v-on:click="saveFile()">Save</button>
        <button v-on:click="openFolder()">Open Folder</button>
      </div>
      <div>
        <!-- Funny enough: adding the v-if to the jstree fixes another issue. When the tree is continously rendered while the treeData array is generated, selecting a file/folder in the tree afterwards does not automatically select all children files/folder. When only loading the tree after fully creating the tree this does work however -->
        <v-jstree v-if="show" class="column jstree" ref="tree" :data="treeDataFolders" show-checkbox multiple allow-batch whole-row @item-click="itemClick"></v-jstree>
        <!-- The v-jstree component must be assigned another class otherwise the component somehow bugs and presumably applies the above mentioned class a second time hence shrinks down even further. This can be circumvented by assigning a special class to the v-jstree component which uses the whole width of the div and disables overflow. Result, the tree places itself perfectly in the div without overflowing -->
      </div>
    </div>
    <div class="column folder">
      <FolderPanel @push-clicked="push" :treeDataProp="treeDataFiles" :showProp="show" /> <!-- This passes the globalTreeData as the variable treeStructure down to the tree component (which is a child of this component) - Source: https://www.smashingmagazine.com/2020/01/data-components-vue-js/#propos-share-data-parent-child-->
    </div>
  </div>
</template>

<script>

/* Loading times can be drastically improved by only loading the v-jstree after creating the array is finished. Otherwise loading the v-jstree while the array is filled with the data from the File System API takes way longer
Furthermore loading times can be improved by not loading all the nested objects directly but first loading the root level, and then loading all nested objects while the root level is collapsed in the background */

  import VJstree from 'vue-jstree'
  import FolderPanel from '@/components/FolderPanel.vue'

  //Declaring a varibale here makes it available for all methods below
  let fileHandle;
  let folder;
  let treeData = [];
  let treeDataFiles = [];
  let treeDataFolders = [];
  let show = false;
  let id = 0;
  let key;
  let Index = 0; //The index of the array of the currently processed object
  let contents;

  export default {
    name: 'TreePanel',
    components: {
      VJstree,
      FolderPanel,
    },

    data () {
      return {
        msg: 'Blankscape',
        treeData, //returns a global version of treeData which can be passed through to the child component (see above)
        treeDataFiles,
        treeDataFolders,
        show
      }
    },

    methods: {
      async openFile() { //Source: https://web.dev/file-system-access/
        // let textArea = document.getElementById('editor');
        // let textArea = this.$refs.editor;
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        contents = await file.text();
        console.log(contents)
        // textArea.value = contents;
        // this.$refs.editor.value = contents;
      },

      async saveFile() { //Source: https://web.dev/file-system-access/
        let textArea = document.getElementById('editor');
        let writable = await fileHandle.createWritable();
        await writable.write(textArea.value);
        await writable.close();
      },

      async openFolder() { //Source: https://www.youtube.com/watch?v=csCk4mrEmm8
        
        this.show = false

        /* 
        Empty array issue:
        - Warum funktioniert:
            while (treeData.length > 0) {
              treeData.pop();
            }
        - Aber nicht:
            treeData = []
        */
        while (treeData.length > 0) {
            treeData.pop();
        } //According to the internet, this is performance wise the fastest way to empty an array. Funny enough, this is also the only way updating the vue-jstree works after emptying the array. The most intuitive command "treeData = []" empties the array but somehow does not trigger the data update of components in the template. No idea why - search the whole internet for hours for this issue
        
        folder = await window.showDirectoryPicker();
        await this.getFiles(folder);
        console.log(treeData)
        this.show = true
      },

      async getFiles(folder, parentId = null, path = []) {

        //Files and folders come alphabetically from API

        for await (const entry of folder.values()) {
          
          //i has to be incrimented at the beginning because this for function is nested and multiple times called within itself befor finishing
          id++ //This starts with the id = 1 for the first object

          if (entry.kind === "file") {
            await this.assign(treeData, path, { //Array/Object structure: https://zdy1988.github.io/vue-jstree/
              id: id,
              text: entry.name,
              value: "",
              icon: "",
              opened: "true",
              // selected: "false",
              disabled: "true",
              // loading: "false",
              parent: parentId ?? '#',
              children: []
            })
            await this.assign(treeDataFolders, path, {
              disabled: "true",
            })
            await this.assign(treeDataFiles, path, { 
              id: id,
              text: entry.name,
              value: "",
              icon: "",
              opened: "true",
              // selected: "false",
              // disabled: "false",
              // loading: "false",
              parent: parentId ?? '#',
              children: []
            })
            
            // console.log('_____________________________________________')
            // console.log('_________________________________________FILE')
            // console.log('file_id: ' + id)
            // console.log('file_path: ' + path)
            // console.log('parentId: ' + parentId)
          }
          else if (entry.kind === "directory") {
            await this.assign(treeData, path, {
              id: id,
              text: entry.name,
              value: "",
              icon: "",
              opened: "true",
              // selected: "false",
              // disabled: "false",
              // loading: "false",
              parent: parentId ?? '#',
              children: []
            })
            await this.assign(treeDataFolders, path, {
              id: id,
              text: entry.name,
              value: "",
              icon: "",
              opened: "true",
              // selected: "false",
              // disabled: "false",
              // loading: "false",
              parent: parentId ?? '#',
              children: []
            })
            await this.assign(treeDataFiles, path, {
              disabled: "true",
              opened: "true",
              children: []
            })
            
            // console.log('_____________________________________________')
            // console.log('____________________________________DIRECTORY')
            // console.log('dir_id: ' + id)
            // console.log('dir_path: ' + path)
            // console.log('parentId: ' + parentId)

            //Get index of the current entry
            await this.getIndex(treeData, path, id)
  
            // console.log('dir_Index: ' + Index)

            // Creating the path of this directory
            await this.moveDown(path)

            //Going deeper in the folder structure by opening another directory by accessing this function again (nested)
            //Therefore updating the array to pass the current tree path to the assign function later
            await this.getFiles(entry, id, path)

          }
        }
        
        //When reaching this part of the function the deeper laying folder structures have been finished processing
        //Therefore updating the array to move up one folder in the path (if not already on the root level - which is considered within the moveUp function)
        await this.moveUp(path)
      },

      async assign(obj, keyPath, value) { //Source: https://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
        
        let keyPathLength = keyPath.length

        if (keyPathLength < 2) {
          obj.push(value)
          // console.log(obj)
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
          obj[keyPath[lastKeyIndex]].push(value);
          // console.log(obj[keyPath[lastKeyIndex]])
        }
      },

      async getIndex(obj, keyPath, id) {
        
        let keyPathLength = keyPath.length

        if (keyPathLength < 2) {
          Index = obj.findIndex(x => x.id === id)
          // console.log(obj)
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
          Index = obj[keyPath[lastKeyIndex]].findIndex(x => x.id === id)
          // console.log(obj[keyPath[lastKeyIndex]])
        }
      },

      async moveDown(path) {
            path.push(Index); //parentIndex = 0 is the initial state when the function is first run (hence at this part the first directory is opened)
            path.push('children');
      },

      async moveUp(path) {
        let arrayLength = path.length

        // console.log('_____________________________________________')
        // console.log('___________________________________UP_A_LEVEL')
        // console.log('path: ' + path)
        // console.log('arrayLength: ' + arrayLength)

        //The path.length cannot be negative, hence negative values do not have to be considered ()
        if (arrayLength > 0) {
          let newArrayLength = arrayLength - 2
          path.length = newArrayLength
        }

        // console.log('newPath: ' + path)
        // console.log('newArrayLength: ' + newArrayLength)
      },

      itemClick (node) { //Source: https://github.com/zdy1988/vue-jstree
        console.log(node.model.text + ' clicked !')
      },

      keyDown: function () {
        const activeElement = document.getElementsByClassName('active')[0]
        if (activeElement && !isNaN(event.key) && event.key > 0) {
          activeElement.innerHTML = event.key
        }
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

<style scoped>

.column {
  float: left;
}

.tree {
  width: 25%;
}

.jstree {
  width: 100%;
  max-height: calc(100vh - 121px); /* This makes the jstree exactly as tall as the window so the horizontal scroll bar is still visible*/
  min-height: calc(100vh - 121px);
  overflow: auto; /* overflow: hidden completely hides it, overflow: auto adds a scrollbar if needed */
}

.folder {
  width: 75%;
}

/* Clear floats after the columns */
.row:after {
  content: "";
  display: table;
  clear: both;
}
</style>