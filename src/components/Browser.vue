<template>
  <div>
    <div class="column tree">
      <div>
        <div class="header">
          TreePanel
        </div>
        <div class="header">
          <v-btn v-on:click="openFile()">Open new file</v-btn>
          <v-btn v-on:click="writeFile()">Save current file</v-btn>
          <v-btn v-on:click="openRootFolder()">Open new Folder</v-btn>
          <v-btn v-on:click="test()">Test</v-btn>
        </div>
      </div>
      <div>
        <v-treeview
          class="treeText"
          ref="folderTree"
          v-if="show"
          open-all
          dense
          :items="folderTree"
          activatable
          hoverable
          return-object
          @update:active="folderSelect"
        >
          <!-- "@update:active="itemClick"": Alternative way to trigger a function call on-click is by listening for clicks on the label. This however only triggers if the label (text) is clicked diretcly not when clicked on the whole row besides the text. Source: https://stackoverflow.com/questions/54719453/how-to-bind-an-event-to-a-treeview-node-in-vuetify/54719701 -->
          <!-- "v-if": Is necessary otherwise "open-all" does not work because the ":items" have no array asigned yet during page rendering -->
          <!-- "return-object": Makes the treeview return the whole object (not only the id) in events like @update. Here: the whole object is passed through to the function called by "@update:active" -->
        </v-treeview>
      </div>
    </div>
    <div class="column folder">
      <div class="header">
        FolderPanel
      </div>
      <div>
        Files in the folder "{{folderName}}":
        <v-treeview
          class="treeText"
          ref="rootFileTree"
          v-if="show"
          open-all
          dense
          :items="rootFileTree"
          activatable
          selectable
          hoverable
          return-object
          :active="rootFileTreeActivity"
          @update:active="rootFileSelect"
        >
          <!-- ":active"; Is an array assigned with which the active nodes of the tree (marked grey when selected) can be set and reset -->
        </v-treeview>
      </div>
      <div>
        Files in the subfolders of "{{folderName}}":
        <v-treeview
          class="treeText"
          ref="subFileTree"
          v-if="show"
          open-all
          dense
          :items="subFileTree"
          activatable
          selectable
          hoverable
          return-object
          :active="subFileTreeActivity"
          @update:active="subFileSelect"
        >
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

  // import store from "@/store";
  import { get, set } from 'idb-keyval';
  

  // Declaring a varibale here makes it available for all methods below but not for the template above (therefore the variable has to be returned below)
  let fileHandle; // Is set in the "readFile" function to cache which file (and its corresponding FileSystemAPI entry) is selected
  let currentIndexfileHandle; // Is set in the "readIndexFile" function when searching for the index file while opening the folder initially. It is recalled in the "readRootFile" and "readSubFile" function to reset the FilePanel to show the index of the folder when no node of the tree is selected
  let folder; // Is set in the "openRootFolder" function. It contains the whole response of the FileSystemAPI of the user-opened folder. This data is later iterated through in the "getSubFolders" function to push every entry (every file and directory) to an array. Furthermore, the whole "folder" is necessary in the "readIndexFile" and the "readFile" function to get the physical path (.resolve()) of a specified entry
  let folderTree = []; // Is filled in the "getSubFolders" function with only the directory responses of the FileSystemAPI. The folderTree contains all the entries in a v-treeview readable structure and is used directly for the "folderTree" v-treeview.
  let rootFileTree = []; // Is filled in the "getRootFiles" and "getSubFiles" function. The "rootFileTree" has only one dimension (not nested) and is a list of all the files of a selected folder
  let subFileTree = []; // Is filled in the "getSubFiles" function. The "subFileTree" has only one dimension (not nested) and is a list of all the files of all the subfolders of a selected folder
  let rootFileTreeActivity = []; // Is used to reset the active nodes of the rootFileTree and is called from the "readSubFile" function
  let subFileTreeActivity = []; // Is used to reset the active nodes of the subFileTree and is called from the "readRootFile" function
  let folderNameRoot = "/"; // Is used to reset the folderName to its initial state "/" within the "openRootFolder" and the "itemClick" function
  let folderName = folderNameRoot; // Is assigned the name of the currently opened folder in the "itemClick" function. The folderName is used for the titles of the dividers in the FolderPanel. Initially "/" symbolises the root level.
  let content = "";
  let show = false;
  let rootFileSelected = false; // Is set in the "readRootFile" function to true to indicate that a node in the "rootFileTree" is selected
  let subFileSelected = false; // Is set in the "readSubFile" function to true to indicate that a node in the "subFileTree" is selected
  let key;
  let id = 0;
  let index = 0; // The index of the array of the currently processed object
  let indexName = "bs_index.txt";

  export default {
    name: 'Browser',
    components: {
      
    },

    data () {
      return { // returns a global variable which can be passed through to child components and the template above
        fileHandle,
        currentIndexfileHandle,
        folder,
        folderTree,
        rootFileTree,
        subFileTree,
        rootFileTreeActivity,
        subFileTreeActivity,
        folderName,
        content,
        show,
        rootFileSelected,
        subFileSelected,
      }
    },

    methods: {

      async openFile() { // Template to open a single file from the system via the FileSystemAPI - Source: https://web.dev/file-system-access/
        let [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        
        // Test encryption/decryption
        this.$aes.setKey("myPassword")
        let encrypted = this.$aes.encrypt(await file.text())
        console.log(encrypted)
        let decrypted = this.$aes.decrypt(encrypted)
        this.content = decrypted;
      },

      async openRootFolder() { // This function opens a folder from the hard drive via the FileSystemAPI - Inspired by: https://www.youtube.com/watch?v=csCk4mrEmm8
        
        this.show = false // Resetting the visibility of the v-treeview modules in the template. If this is not done prior to assigning new data arrays (when opening a new folder after already showing one), the new v-treeview´s will intially show all nodes collapsed even though the attribute "open-all" is assigned to them

        // Resetting all arrays: According to the internet, this is performance wise the fastest way to truly empty an array. Funny enough, this is also the only way updating the vue-jstree works after emptying the array. The most intuitive command "dataTree = []" empties the array but somehow does not always trigger the data update of components in the template (sometimes emptying works but on re-filling update is broken again). No idea why - search the whole internet for hours for this issue
        while (folderTree.length > 0) {
            folderTree.pop();
        }
        while (rootFileTree.length > 0) {
            rootFileTree.pop();
        }
        while (subFileTree.length > 0) {
            subFileTree.pop();
        }

        this.folderName = folderNameRoot // Resetting the folderName to the initial state (the folderName is used for the titles of the dividers in the FolderPanel)

        this.folder = await window.showDirectoryPicker() // Files and folders come alphabetically from the FileSystemAPI (not sorted by files or folders)
        await this.getSubFolders(this.folder) // Passing the response of the FileSystemAPI down to the "getSubFolders" function where the whole folder is iterated through

        this.getRootFiles(this.folder)

        this.show = true // Making the v-treeview modules in the template visible

        console.log(this.folderTree) // Somehow when logging the dataTree in the console, it is kind of not shown correctly. The values of the nested objects cannot be seen in the console
      },

      async getSubFolders(folder, folderPath = []) { // This function iterates through the response of the FileSystemAPI and saves the response into an array which has the right strucutre for the v-treeview component - Inspired by: https://www.youtube.com/watch?v=csCk4mrEmm8

        for await (const entry of folder.values()) {
          
          id++ // This starts with the id = 1 for the first object. The id has to be incrimented at the beginning (not the end) of this loop because this "for" function is nested and multiple times recalled within itself befor finishing

          let fileSystemApiPath = await this.folder.resolve(entry);
          // Save all fileHandlers in the IndexedDB not by id but by unique "path + filename"
          set(fileSystemApiPath.join('/') + '/' + entry.name, entry);

          // Declaring the Objects which is individually and recursivly pushed into the tree structure arrays
          let dirDataObj = {
            id: id,
            name: entry.name,
            systemPath: fileSystemApiPath.map((x) => x), // see description under fileObj
            obj: "directory",
            children: []
          };

          if (entry.kind === "directory") {
            await this.assign(this.folderTree, folderPath, dirDataObj) // When assigning the dirDataObj the second time to a different array, the object has to be copied. This copy has to be a deep copy (hence: Immutable). A shallow copy as with Object.assign({}, dirDataObj) does not work. it has to be parsed via JSON to make a deep copy

            // Get index of the above added directory in the folderTree array
            await this.getIndex(this.folderTree, folderPath, id)
            // Creating the path of the above added directory in the folderTree array where in the below nested .getSubFolders() function deeper laying folders can be added
            await this.moveArrayPathDown(folderPath)

            // Going deeper in the folder structure by opening another directory by accessing this function again (nested). Therefore updating the array to pass the current tree path to the assign function later
            await this.getSubFolders(entry, folderPath)
          }
        }
        
        // When reaching this part of the function the deeper laying folder structures have been finished processing. Therefore updating the array to move up one folder in the path (if not already on the root level - which is considered within the moveArrayPathUp function)
        await this.moveArrayPathUp(folderPath)
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

      async moveArrayPathUp(path) {
        let arrayLength = path.length

        if (arrayLength > 0) { // The path.length cannot be negative, hence negative values do not have to be considered
          let newArrayLength = arrayLength - 2
          path.length = newArrayLength
        }
      },

      async folderSelect(node) { // Source: https://github.com/zdy1988/vue-jstree

        while (rootFileTree.length > 0) { // The rootFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
            rootFileTree.pop();
        }
        while (subFileTree.length > 0) { // The subFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
            subFileTree.pop();
        }

        // The treeview returns the whole object of the clicked entry. Under index [0] all the object´s attributes can be called
        if (node.length === 0) { // When de-selecting the entry in the treeview it is returning an empty array, which would lead to an error
          this.getRootFiles(this.folder)
          console.log("node de-selected")
          this.folderName = folderNameRoot // Resetting the folderName to the initial state (the folderName is used for the titles of the dividers in the FolderPanel)
        }
        else {
          console.log(node[0].name + ' selected')
          this.folderName = node[0].name

          // Clear the FilePanel
          this.content = ""
          
          get(node[0].systemPath.join('/') + '/' + node[0].name).then(async fileHandle => {
            this.fileHandle = fileHandle
            this.getRootFiles(fileHandle) // Adding all the files (that are on root level of the clicked folder) to the rootFileTree array and combining all the files in subfolders in the subFileTree
          })
        }
      },

      async rootFileSelect(node) { // This function is called by the v-treeview that shows the root files of a selected folder ("rootFileTree"). It resets the selection of nodes in the "subFileTree", calls the "readFile" function to show the selected file in the FilePanel and shows the index file of the folder when no node is selected at all
        if (node.length === 0) { // When de-selecting the node in the "rootFileTree" it is returning an empty array. With "node.length === 0" a deselection can be observed
          console.log("entry de-selected")
          this.rootFileSelected = false
          if (this.rootFileSelected === false && this.subFileSelected == false) { // When neither in the rootFileTree nor in the subFileTree a node is selected, resetting the content of the FilePanel to the index of the selected folder
            console.log("resetting index")
            let file = await currentIndexfileHandle.getFile(); // "currentIndexfileHandle" was set in the "readIndexFile" function when searching for the index file while opening the folder initially
            this.content = await file.text();
          }
        }
        else {
          this.subFileTreeActivity = [] // Resetting the active nodes of the subFileTree (if any)
          this.rootFileSelected = true

          get(node[0].systemPath.join('/') + '/' + node[0].name).then(async fileHandle => {
            this.readFile(fileHandle)
          })
        }
      },

      async subFileSelect(node) { // This function is called by the v-treeview that shows the sub files of a selected folder ("subFileTree"). It resets the selection of nodes in the "rootFileTree", calls the "readFile" function to show the selected file in the FilePanel and shows the index file of the folder when no node is selected at all
        if (node.length === 0) { // When de-selecting the node in the "subFileTree" it is returning an empty array. With "node.length === 0" a deselection can be observed
          console.log("entry de-selected")
          this.subFileSelected = false
          if (this.rootFileSelected === false && this.subFileSelected == false) { // When neither in the subFileTree nor in the rootFileTree a node is selected, resetting the content of the FilePanel to the index of the selected folder
            console.log("resetting index")
            let file = await currentIndexfileHandle.getFile(); // "currentIndexfileHandle" was set in the "readIndexFile" function when searching for the index file while opening the folder initially
            this.content = await file.text();
          }
        }
        else {
          this.rootFileTreeActivity = [] // Resetting the active nodes of the rootFileTree (if any)
          this.subFileSelected = true

          get(node[0].systemPath.join('/') + '/' + node[0].name).then(async fileHandle => {
            this.readFile(fileHandle)
          })
        }
      },

      async getRootFiles(fileHandle) {
          
          for await (const entry of fileHandle.values()) {
            
            id++ // The id has to be incrimented at the beginning (not the end) of this loop because this "for" function is nested and multiple times recalled within itself befor finishing

            let fileSystemApiPath = await this.folder.resolve(entry);
            // Save all fileHandlers in the IndexedDB not by id but by unique "path + filename"
            set(fileSystemApiPath.join('/') + '/' + entry.name, entry);

            // Declaring the Objects which is individually and recursivly pushed into the tree structure arrays
            let fileObj = { // Objects which are pushed to the tree arrays for every entry from the FileSystemAPI - Array/Object structure: https://vuetifyjs.com/en/components/treeview/#api
              id: id, // Unique id
              name: entry.name, // Name that is shown in the v-treeview as title of the node
              systemPath: fileSystemApiPath.map((x) => x), // The systemPath has the following structure: "//folder/subfolder/etc." e. g. "//root/branch" (the own filename is excluded of the path but saved under value "name" above) - With the command join the apiPath array is transformed into a string and combined with the seperator '/' - This string is used to retrieve the fileHandlers from the IndexedDB in the funcitons "readFile" & "readIndexFile"
              obj: "file",
              children: []
            };

            if (entry.kind === "file") {
              if (entry.name === indexName) {
                console.log("index detected")
                await this.readIndexFile(entry)
              }
              else {
                rootFileTree.push(fileObj)
              }
            }
          }
      },

      async getSubFiles(fileHandle) {

        for await (const entry of fileHandle.values()) {
          
          id++ // The id has to be incrimented at the beginning (not the end) of this loop because this "for" function is nested and multiple times recalled within itself befor finishing

          let fileSystemApiPath = await this.folder.resolve(entry);

          // Save all fileHandlers in the IndexedDB not by id but by unique "path + filename"
          set(fileSystemApiPath.join('/') + '/' + entry.name, entry);

          // Declaring the Object which is individually and recursivly pushed into the tree structure arrays
          let fileObj = { // Objects which are pushed to the tree arrays for every entry from the FileSystemAPI - Array/Object structure: https://vuetifyjs.com/en/components/treeview/#api
            id: id, // Unique id
            name: entry.name, // Name that is shown in the v-treeview as title of the node
            systemPath: fileSystemApiPath.map((x) => x), // The systemPath has the following structure: "//folder/subfolder/etc." e. g. "//root/branch" (the own filename is excluded of the path but saved under value "name" above) - With the command join the apiPath array is transformed into a string and combined with the seperator '/' - This string is used to retrieve the fileHandlers from the IndexedDB in the funcitons "readFile" & "readIndexFile"
            obj: "file",
            children: []
          };

          if (entry.kind === "file") {
            if (entry.name !== indexName) {
              subFileTree.push(fileObj)
            }
          }
          else if (entry.kind === "directory") {
            await this.getSubFiles(entry)
          }
        }
      },

      async readIndexFile(fileHandle) { // This function is called by the "getRootFiles" and "getSubFiles" function. It searches the selected folder for the index file to show in the FilePanel when opening the folder initially
        this.fileHandle = fileHandle
        currentIndexfileHandle = fileHandle
        let file = await fileHandle.getFile();
        this.content = await file.text();
      },

      async readFile(fileHandle) { // This function is called by the "readRootFile" and "readSubFile" function. It searches the selected folder or subfolder for the (in the tree) selected file to show its content in the FilePanel         
        this.fileHandle = fileHandle
        let file = await fileHandle.getFile();
        this.content = await file.text();
      },

      async writeFile() { // This function saves the currently selected file which is shown in the FilePanel to the system via the FileSystemAPI - Source: https://web.dev/file-system-access/
        let writable = await this.fileHandle.createWritable(); // creating the fileHandler (for writing to the file system) from the currently selected file which is cached in "currentEntry" which was set in the "readFile" function
        await writable.write(this.content);
        await writable.close();
      },

      async test() { // Test-function to test various functions
         // test if the Vuex setup works
/*         this.$store.commit('increment')
        console.log(store.state.count) */
        
        // test encryption/decryption
/*         this.$aes.setKey("myPassword")
        let secret = "secret message"
        console.log(secret)
        let encrypted = this.$aes.encrypt(secret)
        console.log(encrypted)
        let decrypted = this.$aes.decrypt(encrypted)
        console.log(decrypted) */

/*        get(5).then((val) => console.log(val)); */
        this.getSubFiles(this.fileHandle)

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

.treeText {
  text-align: left;
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