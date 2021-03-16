<template>
  <div>
    <div class="column tree">
      <div>
        <div class="header">
          TreePanel
        </div>
        <div class="header">
          <v-btn v-on:click="openFile()">Open</v-btn>
          <v-btn v-on:click="saveFile()">Save</v-btn>
          <v-btn v-on:click="openFolder()">Open Folder</v-btn>
          <v-btn v-on:click="getRootFiles()">Welcome Screen</v-btn>
          <v-btn v-on:click="test()">Test Vuex</v-btn>
        </div>
      </div>
      <div>
        <v-treeview
          v-if="show"
          open-all
          dense
          :items="folderTree"
          activatable
          hoverable
          return-object
          @update:active="itemClick">
          <!-- Alternative way to trigger a function call on-click is by listening for clicks on the label. This however only triggers if the label (text) is clicked diretcly not when clicked on the same row besides the text. Source: https://stackoverflow.com/questions/54719453/how-to-bind-an-event-to-a-treeview-node-in-vuetify/54719701 -->
        </v-treeview>
        <!-- v-if is necessary otherwise "open-all" does not work because the files cannot load during rendering -->
        <!-- return-object makes the treeview return the whole object (not only the id) in events like @update. Here: the whole object is passed through to the function called by "@update:active" -->
      </div>
    </div>
    <div class="column folder">
      <div class="header">
        FolderPanel
      </div>
      <div>
        Files in the folder "{{folderName}}":
        <v-treeview
          v-if="show"
          open-all
          dense
          :items="rootFileTree"
          activatable
          selectable
          hoverable
          return-object
          @update:active="readFile">
        </v-treeview>
      </div>
      <div>
        Files in the subfolders of "{{folderName}}":
        <v-treeview
          v-if="show"
          open-all
          dense
          :items="subFileTree"
          activatable
          selectable
          hoverable
          return-object
          @update:active="readFile">
        </v-treeview>
      </div>
    </div>
    <div class="column file">
      <div class="header">
        FilePanel
      </div>
      <div>
        <v-textarea
          v-model="content"
          label="Textarea default style"
          hint="This is a hint text">
        </v-textarea>
      </div>
    </div>
  </div>
</template>

<script>

  import store from "@/store";

  // Declaring a varibale here makes it available for all methods below
  let fileHandle;
  let folder;
  let files = []; // The files array is requiered to save all the FileSystemAPI fileHandlers. These fileHandlers can then be searched through and recalled to open or save the specific file
  let dataTree = [];
  let fileTree = [];
  let rootFileTree = [];
  let subFileTree = [];
  let folderTree = [];
  let folderName = "#";
  let content = "";
  let show = false;
  let id = 1;
  let key;
  let index = 0; // The index of the array of the currently processed object

  export default {
    name: 'Browser',
    components: {
      
    },

    data () {
      return { // returns a global variable which can be passed through to child components and the template above
        dataTree,
        fileTree,
        rootFileTree,
        subFileTree,
        folderTree,
        folderName,
        show,
        folder,
        files,
        content
      }
    },

    methods: {
      async openFile() { // Source: https://web.dev/file-system-access/
        [fileHandle] = await window.showOpenFilePicker();
        console.log(fileHandle)
        const file = await fileHandle.getFile();
        this.content = await file.text();
      },

      async saveFile() { // Source: https://web.dev/file-system-access/
        let writable = await fileHandle.createWritable();
        await writable.write(this.content);
        await writable.close();
      },

      async readFile(node) {
        // The treeview returns the whole object of the clicked entry. Under index [0] all the object´s attributes can be called
        if (node.length === 0) { // When de-selecting the entry in the treeview it is returning an empty array, which would lead to an error
          console.log("entry de-selected")
        }
        else {
          files.forEach(async entry => { // This function only searches by name not by unique ID, which means files of the same name but different locations both are returned
            if (entry.name == node[0].name) {
              const path = await this.folder.resolve(entry);
              if (path.slice(0, path.length - 1).join() === node[0].apiPath.slice(1).join()) {
                let file = await entry.getFile();
                this.content = await file.text();
              }
            }
          });
        }
      },

      async writeFile() {

      },

      async openFolder() { // Source: https://www.youtube.com/watch?v=csCk4mrEmm8
        
        this.show = false

        // Resetting all arrays: According to the internet, this is performance wise the fastest way to truly empty an array. Funny enough, this is also the only way updating the vue-jstree works after emptying the array. The most intuitive command "dataTree = []" empties the array but somehow does not always trigger the data update of components in the template (somtimes emptying works but on re-filling update is broken again). No idea why - search the whole internet for hours for this issue
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

        this.folder = await window.showDirectoryPicker();
        await this.getFiles(this.folder); // Files and folders come alphabetically from API not sorted by files or folders

        await this.getRootFiles()

        this.show = true
        console.log(dataTree)

      },

      async getFiles(folder, /* parentId = null, */ dataPath = [], folderPath = [], systemPath = ["#"]) {

        for await (const entry of folder.values()) {
          
          // id has to be incrimented at the beginning (not the end) because this "for" function is nested and multiple times called within itself befor finishing
          id++ // This starts with the id = 1 for the first object

          // Declaring the Objects which are individually and recursivly pushed into the tree Structure arrays
          let fileObj = { // Array/Object structure: https://zdy1988.github.io/vue-jstree/
            id: id,
            text: entry.name,
            name: entry.name,
            value: "",
            icon: "",
            opened: "true",
            // selected: "false",
            // disabled: "true",
            // loading: "false",
            // parent: parentId ?? '#',
            dataPath: dataPath.map((x) => x), // Alternatively the following command can be used to make a shallow copy of an array "Array.from(dataPath)" - Source: https://www.freecodecamp.org/news/how-to-clone-an-array-in-javascript-1d3183468f6a/
            systemPath: systemPath.join('/'), // With the command join the systemPath array is transformed into a string and combined with the seperator '/'
            apiPath: systemPath.map((x) => x),
            obj: "file",
            // entry: entry,
            children: []
          };
          let dirDataObj = {
            id: id,
            text: entry.name,
            name: entry.name,
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
            // entry: entry,
            children: []
          };
          let dirFolderObj = { // Even if this object would be out of the same structre as dirDataObj, there have to be two seperate objects for the function: "await this.assign(dataTree, dataPath, dirDataObj)" & "await this.assign(folderTree, folderPath, dirFolderObj)" otherwise it strangly adds multiple instances of teh object to the folderTree array. No idea why!
            id: id,
            text: entry.name,
            name: entry.name,
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
            // entry: entry,
            children: []
          };

          if (entry.kind === "file") {
            await this.assign(dataTree, dataPath, fileObj)
            this.files.push(entry)
          }
          else if (entry.kind === "directory") {
            
            await this.assign(dataTree, dataPath, dirDataObj)
            await this.assign(folderTree, folderPath, dirFolderObj)
            this.files.push(entry)

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

            // Going deeper in the folder structure by opening another directory by accessing this function again (nested). Therefore updating the array to pass the current tree path to the assign function later
            await this.getFiles(entry, /* id,  */ dataPath, folderPath, systemPath)
          }
        }
        
        // When reaching this part of the function the deeper laying folder structures has been finished processing. Therefore updating the array to move up one folder in the path (if not already on the root level - which is considered within the moveArrayPathUp function)
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

        if (arrayLength > 0) { // The path.length cannot be negative, hence negative values do not have to be considered
          let newArrayLength = arrayLength - 2
          path.length = newArrayLength
        }
      },

      async moveSystemPathUp(path) {
        let arrayLength = path.length

        if (arrayLength > 0) { // The path.length cannot be negative, hence negative values do not have to be considered
          let newArrayLength = arrayLength - 1
          path.length = newArrayLength
        }
      },

      async itemClick (node) { // Source: https://github.com/zdy1988/vue-jstree

        // The treeview returns the whole object of the clicked entry. Under index [0] all the object´s attributes can be called
        if (node.length === 0) { // When de-selecting the entry in the treeview it is returning an empty array, which would lead to an error
          console.log("node de-selected")
        }
        else {
          console.log(node[0].text + ' selected')
          this.folderName = node[0].text

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
          tempPath = node[0].dataPath.map((x) => x), // Alternative command for a shallow array copy: tempPath = Array.from(node.model.dataPath)

          await this.getIndex(dataTree, tempPath, node[0].id)

          tempPath.push(index)
          tempPath.push('children')

          await this.sliceDataTree(dataTree, tempPath)

          this.getSubFiles(fileTree, node[0].systemPath, node[0].text) // Adding all the files (that are on root level of the clicked folder) to the rootFileTree array and combining all the files in subfolders in the subFileTree
        }
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

        dataTree.forEach(function (entry) { // with the forEach command the root level of the array is iterated. Not nested arrays! That effect can also be acchieved with "this.fileTree.forEach(item => console.log(item.text));". However, with the arrow function it is a little less intuitive when doing a lot of stuff within the function (Source: https://stackoverflow.com/questions/3010840/loop-through-an-array-in-javascript)
          if (entry.obj === "file") {
            rootFileTree.push(entry)
          }
        });
      },

      async getSubFiles(tree, path, parent) {
        for await (const entry of tree) { // The "dataTree.forEach(function (entry) {}"" from above (in "getRootFile()") had to be rewritten as a "for await" function to be able to use an "await" function within the function call
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

      async test() { // Test-function to test various functions
        this.$store.commit('increment')  // test if the Vuex setup works
        console.log(store.state.count)
      },
    },

    created: function () {
      window.addEventListener('keydown', e => {
        if (e.key === 's' && e.metaKey){
          e.preventDefault();
          this.saveFile()
        }
      })     
    },

    destroyed: function () {
      
    }
  }
</script>

<style scoped>

.column {
  float: left;
  max-height: calc((100vh - 200px));
  overflow: auto;
}

.tree {
  width: 25%; /* 25% of the whole window */
}

.folder {
  width: 25%; /* 25% of the whole window */
}

.file {
  width: 50%; /* 50% of the whole window */
}

.header {
  display: block; /* float: left; & width: 100%; together have the same effect */
  text-align: left;
}

</style>


<!--

USAGE OF VUETIFY-TREEVIEW

  Code changes:

    // this.vue

      <template>
        <v-treeview
          v-if="show" // v-if is necessary otherwise "open-all" does not work because the files cannot load during rendering
          open-all
          dense
          :items="folderTree"
          activatable
          hoverable>
        </v-treeview>
      </template>

      <script>
        methods: {
          async getFiles(folder, /* parentId = null, */ dataPath = [], folderPath = [], systemPath = ["#"]) {
            (...)
              // All the objects pushed into the tree array have to be equipted with a "name" see fileObj, dirDataObj & dirFolderObj
              let fileObj = {
                  id: id,
                  name: entry.name, // instead of the title
                  value: "",
                  icon: "",
                  opened: "true",
                  // selected: "false",
                  // disabled: "true",
                  // loading: "false",
                  // parent: parentId ?? '#',
                  dataPath: dataPath.map((x) => x),
                  systemPath: systemPath.join('/'),
                  obj: "file",
                  children: []
                };
            (...)
          },

          async itemClick (node) { // Source: https://github.com/zdy1988/vue-jstree
            // This function has to be completely rewritten. Because the call "node.model.text" is specific for the v-jstree. Vuetify´s treeview plugin works a littel bit different
          }
        }
      </script>
        


PASSING DATA BETWEEN PARENT AND CHILD

  Parent to child:
    
    // Parent.vue

      <template>
        <Child :variableProp="variable"/> // Pass the global variable down to the child
      </template>

      <script>
        import Child from '@/components/Child.vue'

        export default {
          name: 'Parent',
          components: {  
            Child,
          },

          data () {
            return {
              variabel
            }
          }
      </script>
  
    // Child.vue

      <template>
        // Access the prop in the template with the following attribute :data="this.$props.subFileTreeProp"
      </template>

      <script>
        props: [
          'variableProp'
        ],
      <script>


  Child to parent:

    // Child.vue

      <template>
        // Call an event e.g. v-on:click="$emit('emitted-call')" and emit the call
      </template>

    // Parent.vue
    
      <template>
        <Child @emitted-call="function"/> // Listen for the emitted call
      </template>



USAGE OF V-JSTREE:

  Code changes:

    // this.vue

      <template>
        // Funny enough: adding the v-if to the jstree fixes another issue. When the tree is continously rendered while the dataTree array is generated, selecting a file/folder in the tree afterwards does not automatically select all children files/folder. When only loading the tree after fully creating the tree this does work however
        // The v-jstree component must be assigned another class otherwise the component somehow bugs and presumably applies the above mentioned class a second time hence shrinks down even further. This can be circumvented by assigning a special class to the v-jstree component which uses the whole width of the div and disables overflow. Result, the tree places itself perfectly in the div without overflowing
        <v-jstree
          v-if="show"
          class="jstree"
          ref="tree"
          :data="folderTree"
          @item-click="itemClick">
        </v-jstree>
        // the "whole-row" (marking the whole row when selecting an entry) is disabled because it brings a bug where subfolders are not marked at all when selected. It does work for root level entries however
      </template>

      <script>

        import VJstree from 'vue-jstree'

        export default {
          components: {
            VJstree
          }
        }
        methods: {
          async getFiles(folder, /* parentId = null, */ dataPath = [], folderPath = [], systemPath = ["#"]) {
            (...)
              // All the objects pushed into the tree array have to be equipted with a "title" see fileObj, dirDataObj & dirFolderObj
              let fileObj = {
                  id: id,
                  name: entry.name, // instead of the title
                  value: "",
                  icon: "",
                  opened: "true",
                  // selected: "false",
                  // disabled: "true",
                  // loading: "false",
                  // parent: parentId ?? '#',
                  dataPath: dataPath.map((x) => x),
                  systemPath: systemPath.join('/'),
                  obj: "file",
                  children: []
                };
            (...)
          },

          async itemClick (node) { // Source: https://github.com/zdy1988/vue-jstree
            
            // Instead of "node[0]" which accesses the object which is returned from treeview, the V-Jstree object can be accessed with node.model
            // Replace alle "node[0]" with "node.model"
            
          },
        }
      </script>



ASYNC LOADING IN V-JSTREE:

  Code changes:

    //this.vue

      <template>
        <v-jstree
          v-if="show"
          class="column jstree"
          ref="tree"
          :data="asyncData"
          :async="loadData"
          show-checkbox
          multiple
          allow-batch
          whole-row
          @item-click="itemClick">
        </v-jstree>     
      </template>

      <script>
        data () {
            return {
              asyncData: [], // only a placeholder variabel requiered by the v-jstree component
              loadData: function (oriNode, resolve) {
                oriNode.data.id ? oriNode.data.id : 0 // No idea why this is needed - what the hell is oriNode
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
      </script>


  Issues with async loading:

    Somehow when the tree is continously rendered while the dataTree array is generated, selecting a file/folder in the tree afterwards does not automatically select all children files/folder.
    Without async this can be cirumvented by only rendering the tree after the array is finished via an v-if statement in the template


  Improving loading times:

    Loading times of the v-jstree can be drastically improved by only rendering the v-jstree after creating the array is finished.
    Loading the v-jstree while the array is filled with the data from the File System API takes way longer
    Furthermore loading times can be improved by not loading all the nested objects directly but first loading the root level, and then loading all nested objects while the root level is collapsed in the background - this however rewuieres async loading!

-->