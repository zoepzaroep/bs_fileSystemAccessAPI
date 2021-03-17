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
          <v-btn v-on:click="openFolder()">Open new Folder</v-btn>
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
          @update:active="itemClick">
          <!-- Alternative way to trigger a function call on-click is by listening for clicks on the label. This however only triggers if the label (text) is clicked diretcly not when clicked on the whole row besides the text. Source: https://stackoverflow.com/questions/54719453/how-to-bind-an-event-to-a-treeview-node-in-vuetify/54719701 -->
          <!-- "v-if" is necessary otherwise "open-all" does not work because the ":items" have no array asigned yet during page rendering -->
          <!-- "return-object" makes the treeview return the whole object (not only the id) in events like @update. Here: the whole object is passed through to the function called by "@update:active" -->
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
          @update:active="readRootFile">
          <!-- ":active" is an array assigned with which the active nodes of the tree (marked grey when selected) can be set and reset -->
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
          @update:active="readSubFile">
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

  // Declaring a varibale here makes it available for all methods below but not for the template above (therefore the variable has to be returned below)
  let currentEntry; // Is set in the "readFile" function to cache which file (and its corresponding FileSystemAPI entry) is selected 
  let currentIndexEntry; // Is set in the "readIndexFile" function when searching for the index file while opening the folder initially. It is recalled in the "readRootFile" and "readSubFile" function to reset the FilePanel to show the index of the folder when no node of the tree is selected
  let folder; // Is set in the "openFolder" function. It contains the whole return of the FileSystemAPI of the user-opened folder. This data is later iterated through in the "getFiles" function to push every entry (every file and directory) to an array. Furthermore, the whole "folder" is necessary in the "readIndexFile" and the "readFile" function to get the physical path (.resolve()) of a specified entry
  let files = []; // Is filled in the "getFiles" function with the FileSystemAPI fileHandler of every file of the opened root folder and subfolders. These fileHandlers can then be searched through and recalled to open or save the specific file on the file system
  let dataTree = []; // Is filled in the "getFiles" function with all the file and directory responses of the FileSystemAPI. This array does not contain the bare fileHandle entries but specific values for each file that are of interest in other functions. Furthermore, the dataTree contains all the entries in a v-treeview readable structure.
  let folderTree = []; // Is filled in the "getFiles" function with only the directory responses of the FileSystemAPI. The folderTree contains all the entries in a v-treeview readable structure and is used directly for the "folderTree" v-treeview.
  let fileTree = []; // Is filled in the "sliceDataTree" function and is a section of the dataTree. The dataTree is sliced at a specific branch of its nested objects and this section is passed to the fileTree
  let rootFileTree = []; // Is filled in the "getRootFiles" and "getSubFiles" function. The "rootFileTree" has only one dimension (not nested) and is a list of all the files of a selected folder
  let subFileTree = []; // Is filled in the "getSubFiles" function. The "subFileTree" has only one dimension (not nested) and is a list of all the files of all the subfolders of a selected folder
  let rootFileTreeActivity = []; // Is used to reset the active nodes of the rootFileTree and is called from the "readSubFile" function
  let subFileTreeActivity = []; // Is used to reset the active nodes of the subFileTree and is called from the "readRootFile" function
  let folderNameRoot = "#"; // Is used to reset the folderName to its initial state "#" within the "openFolder" and the "itemClick" function
  let folderName = folderNameRoot; // Is assigned the name of the currently opened folder in the "itemClick" function. The folderName is used for the titles of the dividers in the FolderPanel. Initially "#" symbolises the root level.
  let content = "";
  let show = false;
  let rootFileSelected = false; // Is set in the "readRootFile" function to true to indicate that a node in the "rootFileTree" is selected
  let subFileSelected = false; // Is set in the "readSubFile" function to true to indicate that a node in the "subFileTree" is selected
  let id = 1;
  let key;
  let index = 0; // The index of the array of the currently processed object
  let indexName = "bs_index.txt";

  export default {
    name: 'Browser',
    components: {
      
    },

    data () {
      return { // returns a global variable which can be passed through to child components and the template above
        currentEntry,
        currentIndexEntry,
        folder,
        files,
        dataTree,
        folderTree,
        fileTree,
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

      async readRootFile(node) { // This function is called by the v-treeview that shows the root files of a selected folder ("rootFileTree"). It resets the selection of nodes in the "subFileTree", calls the "readFile" function to show the selected file in the FilePanel and shows the index file of the folder when no node is selected at all
        if (node.length === 0) { // When de-selecting the node in the "rootFileTree" it is returning an empty array. With "node.length === 0" a deselection can be observed
          console.log("entry de-selected")
          this.rootFileSelected = false
          if (this.rootFileSelected === false && this.subFileSelected == false) { // When neither in the rootFileTree nor in the subFileTree a node is selected, resetting the content of the FilePanel to the index of the selected folder
            console.log("resetting index")
            let file = await currentIndexEntry.getFile(); // "currentIndexEntry" was set in the "readIndexFile" function when searching for the index file while opening the folder initially
            this.content = await file.text();
          }
        }
        else {
          this.subFileTreeActivity = [] // Resetting the active nodes of the subFileTree (if any)
          this.readFile(node)
          this.rootFileSelected = true
        }
      },

      async readSubFile(node) { // This function is called by the v-treeview that shows the sub files of a selected folder ("subFileTree"). It resets the selection of nodes in the "rootFileTree", calls the "readFile" function to show the selected file in the FilePanel and shows the index file of the folder when no node is selected at all
        if (node.length === 0) { // When de-selecting the node in the "subFileTree" it is returning an empty array. With "node.length === 0" a deselection can be observed
          console.log("entry de-selected")
          this.subFileSelected = false
          if (this.rootFileSelected === false && this.subFileSelected == false) { // When neither in the subFileTree nor in the rootFileTree a node is selected, resetting the content of the FilePanel to the index of the selected folder
            console.log("resetting index")
            let file = await currentIndexEntry.getFile(); // "currentIndexEntry" was set in the "readIndexFile" function when searching for the index file while opening the folder initially
            this.content = await file.text();
          }
        }
        else {
          this.rootFileTreeActivity = [] // Resetting the active nodes of the rootFileTree (if any)
          this.readFile(node)
          this.subFileSelected = true
        }
      },

      async readIndexFile(node) { // This function is called by the "getRootFiles" and "getSubFiles" function. It searches the selected folder for the index file to show in the FilePanel when opening the folder initially
        files.forEach(async entry => { // Iterating through all the files of the opened root folder and subfolders
          if (entry.name == indexName) { // This function only searches for the name of the index file not for a unique ID, which means files of the same name but different locations all are returned
            let fileSystemApiPath = await this.folder.resolve(entry); // resolving the path of the current fileHandler with the "resolve" function of the FileSystemAPI
            
            // Bringing the resolved path of the FileSystemAPI and the stored path of the treeData array into the right format
            fileSystemApiPath = fileSystemApiPath.slice(0, fileSystemApiPath.length - 1) // fileSystemApiPath before: ["folder", "subfolder", "subsubfolder", "filename"] - fileSystemApiPath after: ["folder", "subfolder", "subsubfolder"]
            fileSystemApiPath = fileSystemApiPath.join() // fileSystemApiPath before: ["folder", "subfolder", "subsubfolder"] - fileSystemApiPath after: "folder,subfolder,subsubfolder" (comparing two strings is easier then comparing two arrays, thats why the arrays are transformed into strings here)
            let treeDataApiPath = node.apiPath.slice(1) // treeDataApiPath before: ["#", "folder", "subfolder", "subsubfolder"] - treeDataApiPath after: ["folder", "subfolder", "subsubfolder"]
            treeDataApiPath = treeDataApiPath.join() // treeDataApiPath before: ["folder", "subfolder", "subsubfolder"] - treeDataApiPath after: "folder,subfolder,subsubfolder" (comparing two strings is easier then comparing two arrays, thats why the arrays are transformed into strings here)
            
            if (fileSystemApiPath === treeDataApiPath) { // Comparing the paths to rule out files of the same name but in subfolders
              currentEntry = entry
              currentIndexEntry = entry
              let file = await entry.getFile();
              this.content = await file.text();
            }
          }
        });
      },

      async openFile() { // Template to open a single file from the system via the FileSystemAPI - Source: https://web.dev/file-system-access/
        let [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        this.content = await file.text();
      },

      async readFile(node) { // This function is called by the "readRootFile" and "readSubFile" function. It searches the selected folder or subfolder for the (in the tree) selected file to show its content in the FilePanel
        files.forEach(async entry => { // Iterating through all the files of the opened root folder and subfolders
          if (entry.name == node[0].name) { // This function only searches for the name of the currently selected node of the tree (the values of the node are contained under index "0" of the node), which means files of the same name but different locations all are returned
            let fileSystemApiPath = await this.folder.resolve(entry); // resolving the path of the current fileHandler with the "resolve" function of the FileSystemAPI
            
            // Bringing the resolved path of the FileSystemAPI and the stored path of the treeData array into the right format
            fileSystemApiPath = fileSystemApiPath.slice(0, fileSystemApiPath.length - 1) // fileSystemApiPath before: ["folder", "subfolder", "subsubfolder", "filename"] - fileSystemApiPath after: ["folder", "subfolder", "subsubfolder"]
            fileSystemApiPath = fileSystemApiPath.join() // fileSystemApiPath before: ["folder", "subfolder", "subsubfolder"] - fileSystemApiPath after: "folder,subfolder,subsubfolder" (comparing two strings is easier then comparing two arrays, thats why the arrays are transformed into strings here)
            let treeDataApiPath = node[0].apiPath.slice(1) // treeDataApiPath before: ["#", "folder", "subfolder", "subsubfolder"] - treeDataApiPath after: ["folder", "subfolder", "subsubfolder"]
            treeDataApiPath = treeDataApiPath.join() // treeDataApiPath before: ["folder", "subfolder", "subsubfolder"] - treeDataApiPath after: "folder,subfolder,subsubfolder" (comparing two strings is easier then comparing two arrays, thats why the arrays are transformed into strings here)
            
            if (fileSystemApiPath === treeDataApiPath) { // Comparing the paths to rule out files of the same name but in subfolders
              currentEntry = entry
              let file = await entry.getFile();
              this.content = await file.text();
            }
          }
        });
      },

      async writeFile() { // This function saves the currently selected file which is shown in the FilePanel to the system via the FileSystemAPI - Source: https://web.dev/file-system-access/
        let writable = await currentEntry.createWritable(); // creating the fileHandler (for writing to the file system) from the currently selected file which is cached in "currentEntry" which was set in the "readFile" function
        await writable.write(this.content);
        await writable.close();
      },

      async openFolder() { // This function opens a folder from the hard drive via the FileSystemAPI - Inspired by: https://www.youtube.com/watch?v=csCk4mrEmm8
        
        this.show = false // Resetting the visibility of the v-treeview modules in the template. If this is not done prior to assigning new data arrays (when opening a new folder after already showing one), the new v-treeview´s will intially show all nodes collapsed even though the attribute "open-all" is assigned to them

        // Resetting all arrays: According to the internet, this is performance wise the fastest way to truly empty an array. Funny enough, this is also the only way updating the vue-jstree works after emptying the array. The most intuitive command "dataTree = []" empties the array but somehow does not always trigger the data update of components in the template (sometimes emptying works but on re-filling update is broken again). No idea why - search the whole internet for hours for this issue
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

        this.folderName = folderNameRoot // Resetting the folderName to the initial state (the folderName is used for the titles of the dividers in the FolderPanel)

        this.folder = await window.showDirectoryPicker(); // Files and folders come alphabetically from the FileSystemAPI (not sorted by files or folders)
        await this.getFiles(this.folder); 

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
            children: []
          };

          if (entry.kind === "file") {
            await this.assign(dataTree, dataPath, fileObj)
            this.files.push(entry)
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
          this.getRootFiles()
          console.log("node de-selected")
          this.folderName = folderNameRoot // Resetting the folderName to the initial state (the folderName is used for the titles of the dividers in the FolderPanel)
        }
        else {
          console.log(node[0].text + ' selected')
          this.folderName = node[0].text

          // Clear the FilePanel
          this.content = ""

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

        dataTree.forEach(async entry => { // with the forEach command the root level of the array is iterated. Not nested arrays! That effect can also be acchieved with "this.fileTree.forEach(item => console.log(item.text));". However, with the arrow function it is a little less intuitive when doing a lot of stuff within the function (Source: https://stackoverflow.com/questions/3010840/loop-through-an-array-in-javascript)
          if (entry.obj === "file") {
            if (entry.name === indexName) {
              console.log("index detected")
              await this.readIndexFile(entry)
            }
            else {
              rootFileTree.push(entry)
            }
          }
        });
      },

      async getSubFiles(tree, path, parent) {
        for await (const entry of tree) { // The "dataTree.forEach(function (entry) {}"" from above (in "getRootFile()") had to be rewritten as a "for await" function to be able to use an "await" function within the function call
          if (entry.obj === "file") {
            if (entry.name === indexName) {
              if (entry.systemPath === path + "/" + parent) {
                console.log("index detected")
                await this.readIndexFile(entry)
              }
            }
            else {
              if (entry.systemPath === path + "/" + parent) {
                rootFileTree.push(entry)
              }
              else {
                subFileTree.push(entry)
              }
            }
          }
          else if (entry.obj === "directory") {
            await this.getSubFiles(entry.children)
          }
        }
      },

      async test() { // Test-function to test various functions
         // test if the Vuex setup works
        this.$store.commit('increment')
        console.log(store.state.count)
        
        // test encryption/decryption
        this.$aes.setKey("myPassword")
        let secret = "secret message"
        console.log(secret)
        let encrypted = this.$aes.encrypt(secret)
        console.log(encrypted)
        let decrypted = this.$aes.decrypt(encrypted)
        console.log(decrypted)
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