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
        <button v-on:click="getRootFiles()">Welcome Screen</button>
      </div>
      <div>
        <!-- Funny enough: adding the v-if to the jstree fixes another issue. When the tree is continously rendered while the dataTree array is generated, selecting a file/folder in the tree afterwards does not automatically select all children files/folder. When only loading the tree after fully creating the tree this does work however -->
        <!-- The v-jstree component must be assigned another class otherwise the component somehow bugs and presumably applies the above mentioned class a second time hence shrinks down even further. This can be circumvented by assigning a special class to the v-jstree component which uses the whole width of the div and disables overflow. Result, the tree places itself perfectly in the div without overflowing -->
        <v-jstree v-if="show" class="jstree" ref="tree" :data="folderTree" @item-click="itemClick"></v-jstree>
        <!-- the "whole-row" (marking the whole row when selecting an entry) is disabled because it brings a bug where subfolders are not marked at all when selected. It does work for root level entries however -->
        <!-- ASYNC LOADING:
        <v-jstree v-if="show" class="column jstree" ref="tree" :data="asyncData" :async="loadData" show-checkbox multiple allow-batch whole-row @item-click="itemClick"></v-jstree> -->
      </div>
      <div>
        <v-treeview :items="items"></v-treeview>
      </div>
    </div>
    <div class="column folderPanel">
      <FolderPanel @push-clicked="push" @item-clicked="itemClick" :rootFileTreeProp="rootFileTree" :subFileTreeProp="subFileTree" :folderNameProp="folderName" :showProp="show" /> <!-- This passes the dataTree as the variable treeStructure down to the tree component (which is a child of this component) - Source: https://www.smashingmagazine.com/2020/01/data-components-vue-js/#propos-share-data-parent-child-->
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
  let rootFileTree = [];
  let subFileTree = [];
  let folderTree = [];
  let folderName = "#";
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
        fileTree,
        rootFileTree,
        subFileTree,
        folderTree,
        folderName,
        show,
        /* ASYNC LOADING:
        asyncData: [], //only a placeholder variabel requiered by the v-jstree component
        loadData: function (oriNode, resolve) {
          oriNode.data.id ? oriNode.data.id : 0 //No idea why this is needed - what the hell is oriNode
          resolve(folderTree)
        },
        */
        items: [
          {
            id: 1,
            name: 'Applications :',
            children: [
              { id: 2, name: 'Calendar : app' },
              { id: 3, name: 'Chrome : app' },
              { id: 4, name: 'Webstorm : app' },
            ],
          },
          {
            id: 5,
            name: 'Documents :',
            children: [
              {
                id: 6,
                name: 'vuetify :',
                children: [
                  {
                    id: 7,
                    name: 'src :',
                    children: [
                      { id: 8, name: 'index : ts' },
                      { id: 9, name: 'bootstrap : ts' },
                    ],
                  },
                ],
              },
              {
                id: 10,
                name: 'material2 :',
                children: [
                  {
                    id: 11,
                    name: 'src :',
                    children: [
                      { id: 12, name: 'v-btn : ts' },
                      { id: 13, name: 'v-card : ts' },
                      { id: 14, name: 'v-window : ts' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 15,
            name: 'Downloads :',
            children: [
              { id: 16, name: 'October : pdf' },
              { id: 17, name: 'November : pdf' },
              { id: 18, name: 'Tutorial : html' },
            ],
          },
          {
            id: 19,
            name: 'Videos :',
            children: [
              {
                id: 20,
                name: 'Tutorials :',
                children: [
                  { id: 21, name: 'Basic layouts : mp4' },
                  { id: 22, name: 'Advanced techniques : mp4' },
                  { id: 23, name: 'All about app : dir' },
                ],
              },
              { id: 24, name: 'Intro : mov' },
              { id: 25, name: 'Conference introduction : avi' },
            ],
          },
        ],
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
        while (fileTree.length > 0) {
            fileTree.pop();
        }
        while (rootFileTree.length > 0) {
            rootFileTree.pop();
        }
        while (subFileTree.length > 0) {
            subFileTree.pop();
        }

        folderName = "#"

        folder = await window.showDirectoryPicker();
        await this.getFiles(folder);
        await this.getRootFiles()

        this.show = true
        console.log(dataTree)

      },

      async getFiles(folder, /* parentId = null, */ dataPath = [], folderPath = [], systemPath = ["#"]) {

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
            // parent: parentId ?? '#',
            dataPath: dataPath.map((x) => x), // Alternatively the following command can be used to make a shallow copy of an array "Array.from(dataPath)" - Source: https://www.freecodecamp.org/news/how-to-clone-an-array-in-javascript-1d3183468f6a/
            systemPath: systemPath.join('/'), // With the command join the systemPath array is transformed into a string and combined with the seperator '/'
            obj: "file",
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
            // parent: parentId ?? '#',
            dataPath: dataPath.map((x) => x), // Alternatively the following command can be used to make a shallow copy of an array "Array.from(dataPath)" - Source: https://www.freecodecamp.org/news/how-to-clone-an-array-in-javascript-1d3183468f6a/
            folderPath: folderPath.map((x) => x), // Array.from(folderPath)
            systemPath: systemPath.join('/'), // With the command join the systemPath array is transformed into a string and combined with the seperator '/'
            obj: "directory",
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
            // parent: parentId ?? '#',
            dataPath: dataPath.map((x) => x), // Alternatively the following command can be used to make a shallow copy of an array "Array.from(dataPath)" - Source: https://www.freecodecamp.org/news/how-to-clone-an-array-in-javascript-1d3183468f6a/
            folderPath: folderPath.map((x) => x), // Array.from(folderPath)
            systemPath: systemPath.join('/'), // With the command join the systemPath array is transformed into a string and combined with the seperator '/'
            obj: "directory",
            children: []
          };

          if (entry.kind === "file") {
            await this.assign(dataTree, dataPath, fileObj)
          }
          else if (entry.kind === "directory") {
            
            await this.assign(dataTree, dataPath, dirDataObj)
            await this.assign(folderTree, folderPath, dirFolderObj)

            // Get index of the above added directory in the dataTree array
            await this.getIndex(dataTree, dataPath, id)
            // Creating the path of the above added directory in the dataTree array where in the below nested .getFiles() function deeper laying folders can be added
            await this.moveArrayPathDown(dataPath)

            // Get index of the above added directory in the folderTree array
            await this.getIndex(folderTree, folderPath, id)
            // Creating the path of the above added directory in the folderTree array where in the below nested .getFiles() function deeper laying folders can be added
            await this.moveArrayPathDown(folderPath)

            // Creating the human readable path of the above added directory
            await this.moveSystemPathDown(systemPath, entry.name)

            // Going deeper in the folder structure by opening another directory by accessing this function again (nested)
            // Therefore updating the array to pass the current tree path to the assign function later
            await this.getFiles(entry, /* id,  */ dataPath, folderPath, systemPath)
          }
        }
        
        // When reaching this part of the function the deeper laying folder structures has been finished processing
        // Therefore updating the array to move up one folder in the path (if not already on the root level - which is considered within the moveArrayPathUp function)
        await this.moveArrayPathUp(dataPath)
        await this.moveArrayPathUp(folderPath)
        await this.moveSystemPathUp(systemPath)
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

      async moveArrayPathDown(path) {
            path.push(index); // parentIndex = 0 is the initial state when the function is first run (hence at this part the first directory is opened)
            path.push('children');
      },

      async moveSystemPathDown(path, entryName) {
            path.push(entryName);
      },

      async moveArrayPathUp(path) {
        let arrayLength = path.length

        // The path.length cannot be negative, hence negative values do not have to be considered ()
        if (arrayLength > 0) {
          let newArrayLength = arrayLength - 2
          path.length = newArrayLength
        }
      },

      async moveSystemPathUp(path) {
        let arrayLength = path.length

        // The path.length cannot be negative, hence negative values do not have to be considered ()
        if (arrayLength > 0) {
          let newArrayLength = arrayLength - 1
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

      async itemClick (node) { // Source: https://github.com/zdy1988/vue-jstree
        console.log(node.model.text + ' clicked !')
        console.log('hi')
        this.folderName = node.model.text
       
        while (fileTree.length > 0) { // The fileTree array is completely reassigning within the function sliceTree(). Hence, it is not necessary to empty the array beforehand. It´s done here out of consistency
            fileTree.pop();
        }
        while (rootFileTree.length > 0) { // The rootFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
            rootFileTree.pop();
        }
        while (subFileTree.length > 0) { // The subFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
            subFileTree.pop();
        }
        
        let tempPath = [] // Emptying the array tempPath is not necessary because it is defined here and discarded after finishing this function. Otherwise, if declared globally it has to be emptied via the method from above
        
        // Here the full path of the clicked folder has to be passed to the sliceTree() function. The dataPath array represents the path of the parent folder. Hence the index of the clicked folder and the string "children" has to be pushed to dataPath befor passing it on
        tempPath = node.model.dataPath.map((x) => x), // Alternative command for a shallow array copy: tempPath = Array.from(node.model.dataPath)

        await this.getIndex(dataTree, tempPath, node.model.id)

        tempPath.push(index)
        tempPath.push('children')

        await this.sliceDataTree(dataTree, tempPath)

        // Adding all the files (that are on root level of the clicked folder) to the rootFileTree array and combining all the files in subfolders in the subFileTree 
        this.getSubFiles(fileTree, node.model.systemPath, node.model.text)
      },

      async sliceDataTree(obj, keyPath) {
        
        let keyPathLength = keyPath.length

        if (keyPathLength < 2) {
          fileTree = obj.slice(0)
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
          fileTree = obj[keyPath[lastKeyIndex]].slice(0)
        }
      },

      async getRootFiles() {
        while (rootFileTree.length > 0) {
            rootFileTree.pop();
        }
        while (subFileTree.length > 0) {
            subFileTree.pop();
        }
        // this.fileTree.forEach(item => console.log(item.text)); // Below function can also be achieved with this line. However, with the arrow function it is a little less intuitive when doing a lot of stuff within the function (Source: https://stackoverflow.com/questions/3010840/loop-through-an-array-in-javascript)
        dataTree.forEach(function (entry) { // with the forEach command the root level of the array is iterated. Not nested arrays!
          if (entry.obj === "file") {
            rootFileTree.push(entry)
          }
        });
      },

      async getSubFiles(tree, path, parent) {
        // The "dataTree.forEach(function (entry) {}"" from above had to be rewritten as a "for await" function to be able to use an "await" function within the function call
        for await (const entry of tree) {
          if (entry.obj === "file") {
            if (entry.systemPath === path + "/" + parent) {
              rootFileTree.push(entry)
            }
            else {
              subFileTree.push(entry)
            }
          }
          else if (entry.obj === "directory") {
            await this.getSubFiles(entry.children)
          }
        }
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